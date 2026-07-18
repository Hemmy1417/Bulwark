<p align="center">
  <img src="https://raw.githubusercontent.com/Hemmy1417/Bulwark/main/frontend/app/icon.svg" alt="Bulwark" width="140" />
</p>

# Bulwark - Validator Slashing Insurance

**AI-arbitrated slashing cover on GenLayer - payouts in minutes, not weeks.**

Stake with a validator, bind a Bulwark policy. If the validator is slashed, file a claim: the
contract fetches the validator's status from a canonical Beacon Chain API **it derives from your
validator index** (you cannot hand it a fake page), a GenLayer validator panel rules the *cause*,
and a covered ruling settles the sum insured to your wallet on the same transaction.

Live app: **https://bulwark-ashen.vercel.app**

## What it is

- **The payout-deciding fact is contract-pinned** - `_canonical_sources` builds Beacon Chain REST
  API URLs from the policy's own validator index across two keyless providers; the claimant never
  supplies the status source.
- **The LLM only rules the narrative half** - whether-slashed and slash timing are deterministic
  JSON parsing of pinned Beacon state; the panel decides only the cause bucket for a slash the
  repository already confirms.
- **Enforced coverage window, Beacon-anchored** - proven unslashed at bind, slash verified inside
  the purchased term, exposure released on epoch-gated expiry. No wall-clock trust, no user input.
- **Actuarial premiums** - priced off chain risk, the pool's live loss ratio, the buyer's claim
  record, and policy size; every component returned by `preview_premium`.
- **Aggregate solvency guard** - a policy binds only if the reserve covers the total outstanding
  exposure across the entire in-force book.

## How it works

### For the underwriter (owner)
1. Seed the reserve on `/pool` - the deploying wallet funds cover and cannot withdraw.
2. Watch the live solvency ratio (`reserve / outstanding_exposure`).
3. Exposure returns to the pool when policies expire or claims settle.

### For validator operators
1. Get a transparent quote - `preview_premium` itemises duration rate, chain risk, experience
   rating, claim record, and concentration load.
2. Bind cover: the contract fetches your validator from the pinned Beacon API and **refuses to bind
   if it is already slashed** - a pre-existing condition cannot be insured.
3. If slashed, file notice of claim with up to three optional narrative cause URLs (release notes,
   post-mortems).
4. The panel adjudicates; a covered ruling pays the sum insured at finality.
5. A `REJECTED` claim can be appealed once - only with new cause evidence.

## Coverage matrix

| Cause bucket | Meaning | Covered |
|---|---|:---:|
| `NOT_SLASHED` | The pinned Beacon state does not show a slashing event. | no |
| `NEGLIGENCE` | Operator error - misconfiguration, double-signing, downtime beyond thresholds. | no |
| `BUG` | Client-software fault (Prysm / Lighthouse / Nimbus / Teku release-note incident). | yes |
| `UNAVOIDABLE` | Chain-level or network-wide event outside operator control. | yes |

The payout binds to the semantic outcome - `covered = slashed and cause in COVERED_CAUSES and
in_window` - never to output format. Rules are a pure Python function, extendable without touching
the AI path.

## Coverage window (enforced)

| Check | Mechanism |
|---|---|
| Unslashed at bind | `buy_policy` fetches the validator live; already-slashed refuses to bind; `coverage_start_epoch` anchors to the finalized checkpoint. |
| Slash inside the term | The Beacon validator object dates its own slash (`withdrawable_epoch - 8192`); the contract requires `start <= slash_epoch <= end`. Before the term is `PRE_EXISTING`, after is `LATE` - both pay nothing, and an appeal can never manufacture an out-of-term payout. |
| Exposure released on expiry | `expire_policy` is keeper-callable by anyone, gated on the live finalized epoch - no owner discretion. |

## Premium model

| Component | Effect |
|---|---|
| Base duration rate | 7d = 1.0% - 30d = 5.0% - 90d = 12% of coverage |
| Chain risk multiplier | Ethereum x1.00 - Cosmos x1.30 - unknown chain x1.50 |
| Experience rating | Surcharge (capped +8%) when the pool's own loss ratio runs hot |
| Claim record | +2% effective per prior covered claim by the buyer (capped) |
| Concentration load | +1.5% on single-validator policies of 5 GEN or more |

Coverage bounds: 0.1 GEN minimum, 10 GEN maximum per policy.

## Policy and claim lifecycle

```text
policy:  ACTIVE -> EXPIRED                       (epoch-gated keeper expiry)
              \-> PAID                           (covered claim settled)

claim:   filed -> APPROVED -> settled at finality
              -> REJECTED -> appeal (once, new evidence) -> APPROVED | REJECTED
```

| State | What happens |
|---|---|
| `ACTIVE` | In force; its full coverage counts against the reserve's outstanding exposure. |
| `EXPIRED` | Term over, proven by the finalized epoch; exposure released back to the pool. |
| `PENDING_PAYOUT` / `PAID` | A covered ruling settles the sum insured; the policy leaves the book. |
| `APPROVED` / `REJECTED` | The panel's cause ruling; every round kept in the claim's on-chain `history`. |
| `PRE_EXISTING` / `LATE` | Window verdicts - a slash outside the purchased term pays nothing. |

## GenLayer consensus functions

| Function | Kind | What runs under consensus |
|---|---|---|
| `buy_policy` | write, payable | Fetches the pinned Beacon state to prove the validator unslashed and anchor the coverage window. |
| `file_claim` | write | Validators fetch the contract-pinned Beacon API (+ optional narrative URLs); the LLM rules the cause bucket; `prompt_comparative` agrees on the label; covered rulings settle at finality. |
| `appeal_claim` | write | One-shot re-adjudication by a fresh consensus round; must bring new cause evidence. |
| `expire_policy` | write | Fetches the live finalized epoch to prove the term over. |

## Contract

| Field | Value |
|---|---|
| Network | GenLayer Studionet |
| Chain ID | `61999` |
| RPC | `https://studio.genlayer.com/api` |
| Explorer | `https://explorer-studio.genlayer.com` |
| Contract address | [`0x727d002D9b6C531A72BA78b16e912d2bb2C65a9D`](https://studio.genlayer.com/?import-contract=0x727d002D9b6C531A72BA78b16e912d2bb2C65a9D) |
| Source | `contracts/bulwark.py` |
| Owner | The deploying wallet - seeds the reserve, cannot withdraw |

### Write methods

| Method | Who | Payable | Notes |
|---|---|---|---|
| `owner_seed_reserve()` | owner | deposit | Funds the underwriting reserve. |
| `buy_policy(validator_identifier, chain_label, coverage_wei, duration_days, ...)` | anyone | premium | Binds only if the reserve covers the whole book's exposure. |
| `file_claim(policy_id, cause_evidence_urls)` | policy owner | - | Status source is contract-pinned; URLs are narrative-only. |
| `appeal_claim(claim_id, additional_cause_urls)` | claimant | - | Once, with new evidence; same window enforcement. |
| `expire_policy(policy_id)` | anyone (keeper) | - | Epoch-gated; frees the policy's exposure. |
| `settle_pending_payout(claim_id)` | anyone | - | Completes a payout awaiting finality. |

### Read methods

`get_protocol_params`, `preview_premium`, `get_policy`, `get_claim`, `get_policies_by_owner`,
`get_claims_by_owner`, `get_claim_ledger`

### Consensus guarantees

- **The fact half is deterministic** - whether-slashed and slash timing come from parsing pinned
  Beacon JSON; the model never decides them.
- **Bucketed equivalence** - validators agree on the cause label, so LLM stylistic variation never
  kills a consensus round.
- **Fail-safe on outage** - if both Beacon providers are momentarily unreachable, the ruling is
  `NOT_SLASHED` (no payout on unverifiable evidence), never a guess.
- **Payouts settle at finality** - `emit_transfer(on="finalized")` means a ruling must survive
  before money moves.

## Verified end-to-end

Stress-tested on-chain across the full surface (2026-07):

```text
bind      -> premium itemised by preview_premium; solvency guard checked against the whole book
claim     -> panel fetched the pinned Beacon API, ruled the cause bucket, wrote the ruling + reasoning
covered   -> sum insured settled to the claimant's wallet at finality (balance-checked)
rejected  -> appeal with new evidence re-ruled by a fresh round; history kept on-chain
expiry    -> keeper call proved the epoch, freed the exposure, solvency ratio updated live
```

> Every ruling - approved, rejected, or pending - appears in the public `/ledger` with the panel's
> reasoning paragraph and cited URLs, fully replay-verifiable.

**51 direct-mode tests**, including the AI path end-to-end via a primeable equivalence-principle
stub with a Beacon-shaped web stub, and the whole coverage-window logic.

## Evidence sources - what actually works

GenLayer validators cannot render JavaScript and get 403'd by several popular explorers, so cause-URL
selection matters (the status source is auto-pinned and not yours to choose):

| Works | Fails |
|---|---|
| Beacon Chain REST API (auto-pinned, keyless JSON) | `etherscan.io` validator queries (403) |
| `github.com/<client>/releases` advisories | `twitter.com` / `x.com` (JS-only shells) |
| Public Gist post-mortems (raw URLs) | `mirror.xyz` article bodies (JS-only) |
| `ethereum.org` consensus docs, Wikipedia | Anything behind auth or Cloudflare Turnstile |

## Tech stack

| Layer | Tech |
|---|---|
| Intelligent Contract | Python on GenVM (policies, claims, reserve, window enforcement) |
| Consensus | `gl.eq_principle.prompt_comparative` + nondet Beacon-API fetches |
| Frontend | Next.js 16 (Turbopack), React Query, Tailwind - Lloyd's-inspired design |
| Web3 | GenLayerJS, EIP-6963 injected wallets |
| Backend | None - the contract is the source of truth |

## Repository

```text
contracts/bulwark.py        The Intelligent Contract (deployed)
tests/direct/               51 direct-mode tests, pytest
deploy/deployScript.ts      Scripted deploy (alternative to the CLI)
gltest.config.yaml          GenLayer test harness config
frontend/                   Next.js app (landing, policies, claims, ledger, pool)
```

## Getting started

```bash
# contract tests
python -m pytest tests/direct -q

# deploy (owner is typed Address - pass the full 42-char address as the constructor arg)
genlayer network set studionet
genlayer deploy --contract contracts/bulwark.py --args 0x<owner-address>

# frontend
cd frontend
cp .env.Example .env.local     # contract address + RPC
npm install
npm run dev
```

## Environment variables

```env
NEXT_PUBLIC_CONTRACT_ADDRESS=0x...
NEXT_PUBLIC_GENLAYER_RPC_URL=https://studio.genlayer.com/api
NEXT_PUBLIC_GENLAYER_CHAIN_ID=61999
NEXT_PUBLIC_GENLAYER_CHAIN_NAME=GenLayer Studio
NEXT_PUBLIC_GENLAYER_SYMBOL=GEN
```

## Security

- The status source is derived by the contract from the validator index - "judging user-submitted
  text" is structurally impossible for the payout-deciding fact.
- Appeals cannot re-roll the fact half: pinned sources are unchanged, so an appeal can only
  recategorise *why* a slashing happened, never manufacture one.
- The solvency guard protects the whole in-force book, not just the incoming policy.
- Contract writes are signed by the connected wallet's own EIP-1193 provider - never an implicit
  `window.ethereum` fallback; `frontend/tests/signed-write.test.ts` proves the route.
- Wallet payouts go through an empty `@gl.evm.contract_interface` proxy - the previous GenVM-call
  pattern stranded value at plain wallets and was redeployed with the corrected path.

## Design notes

- Built in five deliberate iterations, each a contract change + test expansion + on-chain redeploy:
  pinned evidence, the appeal path, risk-tiered premiums, aggregate solvency, and the enforced
  coverage window.
- GenVM has no wall-clock, so the coverage window anchors to the Beacon Chain's finalized epoch -
  real, verifiable, outside anyone's control. Expiry is keeper-callable, not automatic.
- Honest edge, disclosed: `slash_epoch = withdrawable_epoch - 8192` is exact for a normally-active
  validator; one already mid-exit with an unusually distant withdrawal could skew it.
- The panel judges depiction; the payout binds to fact. File claims on genuinely-slashed
  validators - the honesty of the on-chain trail depends on real evidence.

## Disclaimer

Bulwark is a hackathon project on a test network. Premiums and payouts are testnet GEN; do not rely
on the contract for real validator cover without an audit.
