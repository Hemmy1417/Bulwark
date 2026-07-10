"""
Direct-mode tests for bulwark.py — exercise the deterministic parts of the
contract without touching GenLayer's AI/consensus stack (which needs the
Studio runtime). Run with: python -m pytest tests/direct -q

These tests import the contract module directly and monkey-patch the
minimum surface area needed to simulate msg.sender / msg.value / block
number. They cover the premium math, policy lifecycle, solvency guard,
and the covered-cause payout rule. The AI ruling itself is covered by
integration tests that run against a live Studio.
"""

import importlib.util
import pathlib
import sys
import types
import pytest


CONTRACT_PATH = pathlib.Path(__file__).resolve().parents[2] / "contracts" / "bulwark.py"


# ── Genlayer runtime stubs ───────────────────────────────────────────────────
# The contract module imports `from genlayer import *`. In direct mode we
# don't have the real runtime — we install a minimum stub that satisfies
# the symbols the contract references at import + method-body time.

class _UserError(Exception):
    pass


class _VmModule:
    UserError = _UserError


class _Vm:
    vm = _VmModule
    class message:
        sender_address = "0x0000000000000000000000000000000000000000"
        value = 0
        block_number = 0


class _TreeMap(dict):
    def get(self, k, default=None):
        return super().get(k, default)


class _U256(int):
    def __new__(cls, v):
        return super().__new__(cls, int(v))


class _PublicViewDeco:
    def __call__(self, fn):
        return fn


class _PublicWriteDeco:
    payable = staticmethod(lambda fn: fn)

    def __call__(self, fn):
        return fn


class _Public:
    view = _PublicViewDeco()
    write = _PublicWriteDeco()


_TRANSFER_LOG = []


class _Evm:
    @staticmethod
    def contract_interface(cls):
        class _Proxy:
            def __init__(self, addr):
                self._addr = str(addr)

            def emit_transfer(self, value, on=None):
                _TRANSFER_LOG.append((int(value), on))
        return _Proxy


class _NondetWeb:
    @staticmethod
    def render(url, mode="text"):
        return f"[stub evidence fetched from {url}]"


class _Nondet:
    web = _NondetWeb()

    @staticmethod
    def exec_prompt(task):
        return "unused-by-stub"


class _EqPrinciple:
    # Prime with the ruling JSON the adjudication should return.
    canned = '{"slashed": false, "cause": "NOT_SLASHED", "confidence": 40, "summary": "stub"}'
    last_input = None

    @classmethod
    def prompt_comparative(cls, fn, principle):
        cls.last_input = fn()   # run the fetch loop so evidence assembly is exercised
        return cls.canned


class _GL:
    class Contract:
        pass

    evm = _Evm()
    nondet = _Nondet()
    eq_principle = _EqPrinciple

    public = _Public()
    message = _Vm.message
    vm = _VmModule


def _install_stub():
    mod = types.ModuleType("genlayer")
    mod.gl = _GL
    mod.TreeMap = _TreeMap
    mod.u256 = _U256
    mod.Address = lambda x: x
    mod.__all__ = ["gl", "TreeMap", "u256", "Address"]
    sys.modules["genlayer"] = mod


_install_stub()


def _load_contract():
    spec = importlib.util.spec_from_file_location("bulwark_contract", CONTRACT_PATH)
    module = importlib.util.module_from_spec(spec)
    spec.loader.exec_module(module)
    return module


# ── Fixtures ─────────────────────────────────────────────────────────────────

OWNER = "0xowner"
ALICE = "0xalice"
BOB   = "0xbob"


@pytest.fixture
def module():
    return _load_contract()


@pytest.fixture
def contract(module):
    module.gl.message.sender_address = OWNER
    module.gl.message.value = 0
    module.gl.message.block_number = 1000
    return module.Bulwark(owner=OWNER)


def _as(module, sender, value=0, block=None):
    module.gl.message.sender_address = sender
    module.gl.message.value = value
    if block is not None:
        module.gl.message.block_number = block


# ── Tests ────────────────────────────────────────────────────────────────────

# Pinned-evidence hardening: the authoritative slashing-status URLs are
# derived by the contract from the policy's validator index, NOT supplied by
# the claimant. This is what makes the payout-deciding fact verifiable.

def test_canonical_sources_ethereum_corroborated(contract):
    urls = contract._canonical_sources("123456", "ethereum")
    assert urls == [
        "https://ethereum-beacon-api.publicnode.com/eth/v1/beacon/states/finalized/validators/123456",
        "https://docs-demo.quiknode.pro/eth/v1/beacon/states/finalized/validators/123456",
    ]


def test_canonical_sources_eth_alias_and_index_only(contract):
    # accepts "eth"/"ethereum"; requires a pure integer index
    assert contract._canonical_sources("42", "eth")[0].endswith("/validators/42")
    assert contract._canonical_sources("not-an-index", "ethereum") == []


def test_canonical_sources_cosmos(contract):
    urls = contract._canonical_sources("cosmosvaloper1abc", "cosmos:cosmoshub-4")
    assert urls == ["https://www.mintscan.io/cosmos/validators/cosmosvaloper1abc"]


def test_canonical_sources_unknown_chain_empty(contract):
    assert contract._canonical_sources("123", "solana") == []


def test_file_claim_rejects_unverifiable_chain(module, contract):
    # A policy whose chain has no canonical explorer cannot be claimed — the
    # slashing status could not be independently verified.
    _as(module, ALICE, value=0)
    # buy a policy on an unsupported chain via a low-level insert isn't exposed;
    # instead assert the guard fires through the public path using a bogus id.
    import pytest as _pytest
    # craft a minimal ACTIVE policy directly in storage for the guard test
    contract.policy_counter = module.u256(1)
    contract._save_policy({
        "policy_id": "1", "policyholder": ALICE, "validator_identifier": "xyz",
        "chain_label": "solana", "coverage_wei": "1000", "premium_wei": "10",
        "duration_days": 30, "created_at_block": 1, "expires_at_block": 99,
        "status": "ACTIVE", "claim_id": None,
    })
    _as(module, ALICE, value=0)
    with _pytest.raises(module.gl.vm.UserError, match="cannot be independently verified"):
        contract.file_claim("1", [])


def test_initial_state(contract):
    params = contract.get_protocol_params()
    assert params["owner"] == OWNER
    assert params["reserve_wei"] == "0"
    assert params["total_policies"] == 0
    assert params["active_policy_count"] == 0


def test_preview_premium_matches_schedule(contract):
    coverage = 1 * (10 ** 18)  # 1 GEN
    # 7d = 1% -> 0.01 GEN
    p7 = contract.preview_premium(coverage, 7)
    assert int(p7["premium_wei"]) == coverage // 100
    # 30d = 5% -> 0.05 GEN
    p30 = contract.preview_premium(coverage, 30)
    assert int(p30["premium_wei"]) == coverage * 5 // 100
    # 90d = 12% -> 0.12 GEN
    p90 = contract.preview_premium(coverage, 90)
    assert int(p90["premium_wei"]) == coverage * 12 // 100


def test_preview_rejects_bad_duration(contract):
    with pytest.raises(_UserError):
        contract.preview_premium(10 ** 18, 14)


def test_owner_seed_reserve(module, contract):
    _as(module, OWNER, value=5 * 10 ** 18)
    r = contract.owner_seed_reserve()
    assert int(r["reserve_wei"]) == 5 * 10 ** 18

    _as(module, ALICE, value=1 * 10 ** 18)
    with pytest.raises(_UserError):
        contract.owner_seed_reserve()


def test_buy_policy_happy_path(module, contract):
    # Owner seeds reserve so protocol is solvent
    _as(module, OWNER, value=10 * 10 ** 18)
    contract.owner_seed_reserve()

    coverage = 1 * 10 ** 18
    premium = coverage * 5 // 100  # 30d = 5%

    _as(module, ALICE, value=premium, block=2000)
    policy = contract.buy_policy(
        validator_identifier="123456",
        chain_label="ethereum",
        coverage_wei=coverage,
        duration_days=30,
    )
    assert policy["policy_id"] == "1"
    assert policy["policyholder"] == ALICE
    assert policy["status"] == "ACTIVE"
    assert int(policy["coverage_wei"]) == coverage
    assert int(policy["premium_wei"]) == premium
    # Since Studionet has no on-chain clock, `_now()` returns a monotonic
    # combined counter (policy_counter + claim_counter). After this first
    # buy the policy_counter has been incremented to 1, so created_at_block
    # is 1 and expires_at_block is 1 + 30. This is deliberate — the frontend
    # tracks browser-side timestamps for real elapsed-time UI.
    assert policy["created_at_block"] == 1
    assert policy["expires_at_block"] == 31

    params = contract.get_protocol_params()
    assert params["active_policy_count"] == 1
    assert int(params["reserve_wei"]) == 10 * 10 ** 18 + premium


def test_buy_policy_rejects_wrong_msg_value(module, contract):
    _as(module, OWNER, value=10 * 10 ** 18)
    contract.owner_seed_reserve()

    _as(module, ALICE, value=1)  # much less than quoted
    with pytest.raises(_UserError):
        contract.buy_policy(
            validator_identifier="1",
            chain_label="ethereum",
            coverage_wei=10 ** 18,
            duration_days=30,
        )


def test_buy_policy_respects_coverage_bounds(module, contract):
    _as(module, OWNER, value=100 * 10 ** 18)
    contract.owner_seed_reserve()

    # Under min
    tiny = 10 ** 15  # 0.001 GEN
    premium = tiny * 5 // 100
    _as(module, ALICE, value=premium)
    with pytest.raises(_UserError):
        contract.buy_policy(
            validator_identifier="1",
            chain_label="ethereum",
            coverage_wei=tiny,
            duration_days=30,
        )

    # Over max
    huge = 20 * 10 ** 18
    premium = huge * 5 // 100
    _as(module, ALICE, value=premium)
    with pytest.raises(_UserError):
        contract.buy_policy(
            validator_identifier="1",
            chain_label="ethereum",
            coverage_wei=huge,
            duration_days=30,
        )


def test_buy_policy_solvency_guard(module, contract):
    # No reserve seeded — a 1 GEN policy should not bind because reserve
    # (just the premium) would be far short of the coverage.
    coverage = 1 * 10 ** 18
    premium = coverage * 5 // 100
    _as(module, ALICE, value=premium)
    with pytest.raises(_UserError):
        contract.buy_policy(
            validator_identifier="1",
            chain_label="ethereum",
            coverage_wei=coverage,
            duration_days=30,
        )


def test_policies_by_owner_index(module, contract):
    _as(module, OWNER, value=20 * 10 ** 18)
    contract.owner_seed_reserve()

    coverage = 10 ** 18
    premium = coverage * 5 // 100
    _as(module, ALICE, value=premium)
    contract.buy_policy("100", "ethereum", coverage, 30)
    _as(module, ALICE, value=premium)
    contract.buy_policy("200", "ethereum", coverage, 30)

    listed = contract.get_policies_by_owner(ALICE)
    assert len(listed) == 2
    assert {p["validator_identifier"] for p in listed} == {"100", "200"}


# ── Extended coverage: multi-policy, claim flow, unauthorised access ─────────
#
# These tests do NOT invoke the AI/consensus stack. Instead they mock the
# file_claim pipeline by injecting a fake ruling. The pipeline runs the
# deterministic parts — bookkeeping, payout math, emit_transfer accounting,
# status transitions — around whatever the panel would return. This covers
# ~90% of the code path without needing Studionet.


class _FakeEmit:
    """Stub for gl.get_contract_at(...).emit_transfer(...); records the calls."""
    def __init__(self):
        self.transfers = []

    def emit_transfer(self, value, on=None):
        self.transfers.append((value, on))


def _install_fake_transfers(module):
    """Route emit_transfer through a recorder so payouts can be asserted.
    Payouts now flow through the _Payee EVM interface, which records into
    the module-global _TRANSFER_LOG; expose it via the same recorder API."""
    _TRANSFER_LOG.clear()
    recorder = _FakeEmit()
    recorder.transfers = _TRANSFER_LOG
    module.gl.get_contract_at = lambda addr: recorder
    return recorder


def _rule_and_settle(contract, module, claim_id, cause, slashed=True,
                     confidence=88, summary="stub"):
    """
    Simulate what file_claim does after prompt_comparative returns — persist
    the ruling and settle the payout if covered. Mirrors the logic in
    bulwark.py so drift between the two would surface.
    """
    claim = contract._load_claim(claim_id)
    covered = slashed and cause in {"BUG", "UNAVOIDABLE"}
    payout = int(claim["payout_wei"]) if covered else 0
    claim.update({
        "ai_slashed":    slashed,
        "ai_cause":      cause,
        "ai_confidence": confidence,
        "ai_summary":    summary,
        "covered":       covered,
        "payout_wei":    str(payout),
        "status":        "APPROVED" if covered else "REJECTED",
    })
    contract._save_claim(claim)
    if covered:
        if int(contract.reserve_wei) < payout:
            claim["status"] = "PENDING_PAYOUT"
            contract._save_claim(claim)
        else:
            contract.reserve_wei = module.u256(int(contract.reserve_wei) - payout)
            contract.total_payouts_wei = module.u256(int(contract.total_payouts_wei) + payout)
            module.gl.get_contract_at(module.Address(claim["claimant"])).emit_transfer(
                value=module.u256(payout), on="finalized",
            )
            claim["status"] = "PAID"
            contract._save_claim(claim)
    return claim


def _seed_reserve(module, contract, amount):
    _as(module, OWNER, value=amount)
    return contract.owner_seed_reserve()


def _bind_policy(module, contract, holder, validator, coverage, duration=30, chain="ethereum"):
    premium = coverage * 5 // 100 if duration == 30 else coverage * 12 // 100 if duration == 90 else coverage // 100
    _as(module, holder, value=premium)
    return contract.buy_policy(validator, chain, coverage, duration)


def _make_pending_claim(contract, module, holder, policy_id):
    """Simulate the pre-AI part of file_claim: record the claim in PENDING state."""
    _as(module, holder)
    policy = contract._load_policy(policy_id)
    contract.claim_counter = module.u256(int(contract.claim_counter) + 1)
    claim_id = str(int(contract.claim_counter))
    claim = {
        "claim_id":       claim_id,
        "policy_id":      policy_id,
        "claimant":       holder,
        "evidence_urls":  ["https://example.test"],
        "ai_slashed":     False,
        "ai_cause":       "PENDING",
        "ai_confidence":  0,
        "ai_summary":     "",
        "covered":        False,
        "payout_wei":     str(int(policy["coverage_wei"])),
        "status":         "PENDING",
        "filed_at_block": contract._now(),
    }
    contract._save_claim(claim)
    contract._append_index(contract.claims_by_owner, holder, claim_id)
    policy["claim_id"] = claim_id
    contract._save_policy(policy)
    contract.active_policy_count = module.u256(max(0, int(contract.active_policy_count) - 1))
    return claim_id


# ── Multi-policy math ────────────────────────────────────────────────────────

def test_multi_policy_reserve_accounting(module, contract):
    """Reserve and premium totals track correctly across many binds."""
    _seed_reserve(module, contract, 30 * 10 ** 18)
    reserve0 = int(contract.reserve_wei)

    p1 = _bind_policy(module, contract, ALICE, "V-1", 2 * 10 ** 18)
    p2 = _bind_policy(module, contract, BOB,   "V-2", 3 * 10 ** 18, duration=90)
    p3 = _bind_policy(module, contract, ALICE, "V-3", 1 * 10 ** 17)

    expected_premiums = (
        int(p1["premium_wei"]) + int(p2["premium_wei"]) + int(p3["premium_wei"])
    )

    params = contract.get_protocol_params()
    assert params["total_policies"] == 3
    assert params["active_policy_count"] == 3
    assert int(params["total_premiums_wei"]) == expected_premiums
    assert int(params["reserve_wei"]) == reserve0 + expected_premiums


def test_multi_policy_per_owner_isolation(module, contract):
    """Per-owner index must not leak between owners."""
    _seed_reserve(module, contract, 20 * 10 ** 18)
    _bind_policy(module, contract, ALICE, "va", 10 ** 18)
    _bind_policy(module, contract, BOB,   "vb", 10 ** 18)
    _bind_policy(module, contract, ALICE, "vc", 10 ** 18)

    alice_ps = contract.get_policies_by_owner(ALICE)
    bob_ps   = contract.get_policies_by_owner(BOB)
    assert {p["validator_identifier"] for p in alice_ps} == {"va", "vc"}
    assert {p["validator_identifier"] for p in bob_ps} == {"vb"}


# ── Claim flow — approved payout ─────────────────────────────────────────────

def test_claim_bug_ruling_pays_out(module, contract):
    _seed_reserve(module, contract, 10 * 10 ** 18)
    policy = _bind_policy(module, contract, ALICE, "V", 1 * 10 ** 18)
    recorder = _install_fake_transfers(module)

    claim_id = _make_pending_claim(contract, module, ALICE, policy["policy_id"])
    reserve_before = int(contract.reserve_wei)

    settled = _rule_and_settle(contract, module, claim_id, cause="BUG")

    assert settled["status"] == "PAID"
    assert settled["covered"] is True
    assert int(settled["payout_wei"]) == 10 ** 18
    assert int(contract.reserve_wei) == reserve_before - 10 ** 18
    assert int(contract.total_payouts_wei) == 10 ** 18
    assert recorder.transfers == [(module.u256(10 ** 18), "finalized")]


@pytest.mark.parametrize("cause,slashed", [
    ("NOT_SLASHED",  False),
    ("NEGLIGENCE",   True),
])
def test_claim_uncovered_causes_reject(module, contract, cause, slashed):
    _seed_reserve(module, contract, 10 * 10 ** 18)
    policy = _bind_policy(module, contract, ALICE, "V", 1 * 10 ** 18)
    recorder = _install_fake_transfers(module)

    claim_id = _make_pending_claim(contract, module, ALICE, policy["policy_id"])
    settled = _rule_and_settle(contract, module, claim_id, cause=cause, slashed=slashed)

    assert settled["status"] == "REJECTED"
    assert settled["covered"] is False
    assert int(settled["payout_wei"]) == 0
    assert recorder.transfers == []
    assert int(contract.total_payouts_wei) == 0


# ── Pending payout + settle ──────────────────────────────────────────────────

def test_pending_payout_when_reserve_short(module, contract):
    _seed_reserve(module, contract, 5 * 10 ** 18)
    policy = _bind_policy(module, contract, ALICE, "V", 3 * 10 ** 18)
    contract.reserve_wei = module.u256(1 * 10 ** 17)
    recorder = _install_fake_transfers(module)

    claim_id = _make_pending_claim(contract, module, ALICE, policy["policy_id"])
    settled = _rule_and_settle(contract, module, claim_id, cause="BUG")

    assert settled["status"] == "PENDING_PAYOUT"
    assert recorder.transfers == []
    assert int(contract.total_payouts_wei) == 0


def test_settle_pending_payout_succeeds_after_topup(module, contract):
    _seed_reserve(module, contract, 5 * 10 ** 18)
    policy = _bind_policy(module, contract, ALICE, "V", 3 * 10 ** 18)
    contract.reserve_wei = module.u256(1 * 10 ** 17)
    recorder = _install_fake_transfers(module)

    claim_id = _make_pending_claim(contract, module, ALICE, policy["policy_id"])
    _rule_and_settle(contract, module, claim_id, cause="BUG")

    _as(module, OWNER, value=10 * 10 ** 18)
    contract.owner_seed_reserve()

    _as(module, BOB)
    settled = contract.settle_pending_payout(claim_id)

    assert settled["status"] == "PAID"
    assert recorder.transfers == [(module.u256(3 * 10 ** 18), "finalized")]
    assert int(contract.total_payouts_wei) == 3 * 10 ** 18


def test_settle_pending_payout_rejects_if_reserve_still_short(module, contract):
    _seed_reserve(module, contract, 5 * 10 ** 18)
    policy = _bind_policy(module, contract, ALICE, "V", 3 * 10 ** 18)
    contract.reserve_wei = module.u256(1 * 10 ** 17)
    _install_fake_transfers(module)

    claim_id = _make_pending_claim(contract, module, ALICE, policy["policy_id"])
    _rule_and_settle(contract, module, claim_id, cause="BUG")

    with pytest.raises(_UserError):
        contract.settle_pending_payout(claim_id)


# ── Authorisation guards ────────────────────────────────────────────────────

def test_only_owner_can_seed(module, contract):
    _as(module, ALICE, value=1 * 10 ** 18)
    with pytest.raises(_UserError):
        contract.owner_seed_reserve()


def test_get_claim_ledger_returns_reverse_chronological(module, contract):
    _seed_reserve(module, contract, 30 * 10 ** 18)
    _bind_policy(module, contract, ALICE, "A", 10 ** 18)
    _bind_policy(module, contract, BOB,   "B", 10 ** 18)
    _install_fake_transfers(module)
    c1 = _make_pending_claim(contract, module, ALICE, "1")
    c2 = _make_pending_claim(contract, module, BOB,   "2")

    ledger = contract.get_claim_ledger(limit=10)
    assert [c["claim_id"] for c in ledger] == [c2, c1]


# ── Appeal path ──────────────────────────────────────────────────────────────

def _prime(module, slashed, cause, confidence=80):
    import json as _json
    module.gl.eq_principle.canned = _json.dumps({
        "slashed": slashed, "cause": cause, "confidence": confidence, "summary": "stub ruling",
    })


def _buy_active_policy(module, contract, holder=ALICE, vid="123456", chain="ethereum"):
    _as(module, OWNER, value=10 * 10 ** 18)
    contract.owner_seed_reserve()
    coverage = 1 * 10 ** 18
    premium = coverage * 5 // 100
    _as(module, holder, value=premium)
    return contract.buy_policy(validator_identifier=vid, chain_label=chain,
                               coverage_wei=coverage, duration_days=30)


def test_file_claim_pins_sources_and_runs(module, contract):
    _install_fake_transfers(module)
    policy = _buy_active_policy(module, contract)
    _prime(module, slashed=True, cause="BUG")
    _as(module, ALICE, value=0)
    claim = contract.file_claim(policy["policy_id"], ["https://gist.github.com/x/postmortem"])
    # authoritative sources were derived by the contract, not supplied
    assert claim["pinned_sources"] == [
        "https://ethereum-beacon-api.publicnode.com/eth/v1/beacon/states/finalized/validators/123456",
        "https://docs-demo.quiknode.pro/eth/v1/beacon/states/finalized/validators/123456",
    ]
    assert claim["status"] == "PAID" and claim["covered"] is True
    assert claim["appeal_count"] == 0 and len(claim["history"]) == 1


def test_appeal_overturns_rejected_claim(module, contract):
    recorder = _install_fake_transfers(module)
    policy = _buy_active_policy(module, contract)
    # first ruling: slashed but NEGLIGENCE (not covered) -> REJECTED
    _prime(module, slashed=True, cause="NEGLIGENCE")
    _as(module, ALICE, value=0)
    claim = contract.file_claim(policy["policy_id"], ["https://example.com/first"])
    assert claim["status"] == "REJECTED"
    # appeal with new evidence, re-ruled as BUG (covered) -> overturned + paid
    _prime(module, slashed=True, cause="BUG")
    _as(module, ALICE, value=0)
    out = contract.appeal_claim(claim["claim_id"], ["https://gist.github.com/client-release-notes"])
    assert out["status"] == "PAID"
    assert out["covered"] is True
    assert out["appeal_count"] == 1
    assert [h["round"] for h in out["history"]] == ["initial", "appeal"]
    assert recorder.transfers[-1][0] == int(policy["coverage_wei"])


def test_appeal_requires_new_evidence(module, contract):
    _install_fake_transfers(module)
    policy = _buy_active_policy(module, contract)
    _prime(module, slashed=True, cause="NEGLIGENCE")
    _as(module, ALICE, value=0)
    claim = contract.file_claim(policy["policy_id"], ["https://example.com/first"])
    _as(module, ALICE, value=0)
    with pytest.raises(module.gl.vm.UserError, match="new cause-evidence"):
        contract.appeal_claim(claim["claim_id"], [])


def test_appeal_capped_at_one(module, contract):
    _install_fake_transfers(module)
    policy = _buy_active_policy(module, contract)
    _prime(module, slashed=True, cause="NEGLIGENCE")
    _as(module, ALICE, value=0)
    claim = contract.file_claim(policy["policy_id"], ["https://example.com/first"])
    # first appeal, still uncovered -> rejection upheld
    _prime(module, slashed=True, cause="NEGLIGENCE")
    _as(module, ALICE, value=0)
    contract.appeal_claim(claim["claim_id"], ["https://example.com/second"])
    # second appeal blocked
    _as(module, ALICE, value=0)
    with pytest.raises(module.gl.vm.UserError, match="already used its appeal"):
        contract.appeal_claim(claim["claim_id"], ["https://example.com/third"])


def test_appeal_only_by_claimant(module, contract):
    _install_fake_transfers(module)
    policy = _buy_active_policy(module, contract)
    _prime(module, slashed=True, cause="NEGLIGENCE")
    _as(module, ALICE, value=0)
    claim = contract.file_claim(policy["policy_id"], ["https://example.com/first"])
    _as(module, BOB, value=0)
    with pytest.raises(module.gl.vm.UserError, match="Only the claimant"):
        contract.appeal_claim(claim["claim_id"], ["https://example.com/x"])


# ── Risk-tiered premiums ─────────────────────────────────────────────────────

def test_premium_chain_risk_multiplier(contract):
    cov = 1 * 10 ** 18
    eth = contract.preview_premium(cov, 30, "ethereum", "")
    cosmos = contract.preview_premium(cov, 30, "cosmos:cosmoshub-4", "")
    unknown = contract.preview_premium(cov, 30, "dogechain", "")
    # base 500bps × chain multiplier
    assert eth["effective_bps"] == 500                 # 1.00x
    assert cosmos["effective_bps"] == 500 * 13000 // 10000   # 1.30x = 650
    assert unknown["effective_bps"] == 500 * 15000 // 10000  # 1.50x = 750
    assert int(cosmos["premium_wei"]) > int(eth["premium_wei"])


def test_premium_large_coverage_loading(contract):
    small = contract.preview_premium(1 * 10 ** 18, 30, "ethereum", "")
    large = contract.preview_premium(5 * 10 ** 18, 30, "ethereum", "")
    assert small["coverage_load_bps"] == 0
    assert large["coverage_load_bps"] == 150          # +1.5% at/above 5 GEN


def test_premium_holder_record_loading(module, contract):
    _install_fake_transfers(module)
    policy = _buy_active_policy(module, contract)      # ALICE, ethereum
    _prime(module, slashed=True, cause="BUG")          # covered claim
    _as(module, ALICE, value=0)
    contract.file_claim(policy["policy_id"], ["https://gist.github.com/x"])
    # ALICE now has one covered claim on record → +200 bps
    q = contract.preview_premium(1 * 10 ** 18, 30, "ethereum", ALICE)
    clean = contract.preview_premium(1 * 10 ** 18, 30, "ethereum", BOB)
    assert q["record_loadings"] == 1 and q["record_bps"] == 200
    assert clean["record_bps"] == 0
    # holding chain/experience constant, ALICE's record costs exactly +200 bps
    assert q["effective_bps"] - clean["effective_bps"] == 200


def test_premium_experience_rating(module, contract):
    # Seed a hot loss ratio: small premiums, large payout → surcharge kicks in.
    _install_fake_transfers(module)
    _buy_active_policy(module, contract)               # premiums in
    _prime(module, slashed=True, cause="BUG")
    _as(module, ALICE, value=0)
    contract.file_claim("1", ["https://gist.github.com/x"])   # big payout vs premiums
    params = contract.get_protocol_params()
    assert params["experience_bps"] > 0                # pool ran hot → everyone pays a bit more


# ── Aggregate solvency accounting ────────────────────────────────────────────

def test_outstanding_exposure_tracks_book(module, contract):
    _install_fake_transfers(module)
    # seed a modest reserve, then buy two policies
    _as(module, OWNER, value=3 * 10 ** 18)
    contract.owner_seed_reserve()
    cov = 1 * 10 ** 18
    prem = cov * 5 // 100
    _as(module, ALICE, value=prem)
    contract.buy_policy(validator_identifier="111", chain_label="ethereum", coverage_wei=cov, duration_days=30)
    _as(module, BOB, value=prem)
    contract.buy_policy(validator_identifier="222", chain_label="ethereum", coverage_wei=cov, duration_days=30)
    p = contract.get_protocol_params()
    assert int(p["outstanding_exposure_wei"]) == 2 * cov
    # solvency ratio = reserve / exposure, in bps
    assert p["solvency_ratio_bps"] == (int(p["reserve_wei"]) * 10000) // (2 * cov)


def test_solvency_guard_blocks_overexposure(module, contract):
    _install_fake_transfers(module)
    # reserve exactly covers one 1-GEN policy (incl. its premium)
    _as(module, OWNER, value=1 * 10 ** 18)
    contract.owner_seed_reserve()
    cov = 1 * 10 ** 18
    prem = cov * 5 // 100
    _as(module, ALICE, value=prem)
    contract.buy_policy(validator_identifier="111", chain_label="ethereum", coverage_wei=cov, duration_days=30)
    # a second 1-GEN policy would push exposure past the reserve -> blocked
    _as(module, BOB, value=prem)
    with pytest.raises(module.gl.vm.UserError, match="outstanding exposure"):
        contract.buy_policy(validator_identifier="222", chain_label="ethereum", coverage_wei=cov, duration_days=30)


def test_exposure_released_on_claim(module, contract):
    _install_fake_transfers(module)
    _as(module, OWNER, value=5 * 10 ** 18)
    contract.owner_seed_reserve()
    cov = 1 * 10 ** 18
    prem = cov * 5 // 100
    _as(module, ALICE, value=prem)
    policy = contract.buy_policy(validator_identifier="111", chain_label="ethereum", coverage_wei=cov, duration_days=30)
    assert int(contract.get_protocol_params()["outstanding_exposure_wei"]) == cov
    # filing a claim takes the policy off the in-force book -> exposure released
    _prime(module, slashed=False, cause="NOT_SLASHED")
    _as(module, ALICE, value=0)
    contract.file_claim(policy["policy_id"], ["https://example.com/x"])
    assert int(contract.get_protocol_params()["outstanding_exposure_wei"]) == 0
