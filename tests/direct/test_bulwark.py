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
        sender_account = "0x0000000000000000000000000000000000000000"
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


class _GL:
    class Contract:
        pass

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
    module.gl.message.sender_account = OWNER
    module.gl.message.value = 0
    module.gl.message.block_number = 1000
    return module.Bulwark(owner=OWNER)


def _as(module, sender, value=0, block=None):
    module.gl.message.sender_account = sender
    module.gl.message.value = value
    if block is not None:
        module.gl.message.block_number = block


# ── Tests ────────────────────────────────────────────────────────────────────

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
    assert policy["expires_at_block"] == 2030

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
