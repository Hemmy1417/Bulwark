# BULWARK

**AI-arbitrated validator slashing insurance on GenLayer.**

Stake with a validator. Bind a Bulwark policy. If your validator is later slashed, file a claim — the contract fetches the validator's status from a **canonical Beacon Chain API it derives from your validator index** (you can't hand it a fake page), a panel of GenLayer AI validators rules the *cause* from that plus any narrative evidence, and — where covered — settles the sum insured straight to your wallet on the same transaction.

**The pitch in one line:** slashing insurance that pays out in minutes, not weeks.

---

## Iteration log

Bulwark has been developed through deliberate, tested iterations — each one a contract change, a test-suite expansion, and an on-chain redeploy:

1. **Pinned evidence.** Moved the payout-deciding source from a claimant-supplied URL to one the contract derives from the validator index (`_canonical_sources`) — the Beacon Chain REST API across two keyless providers. Closes the "judging user-submitted text" gap.
2. **Appeal path.** One-shot re-adjudication that must bring new evidence; a fresh validator set re-rules; full ruling `history` on-chain.
3. **Risk-tiered premiums.** Flat pricing → an actuarial model priced off chain risk, the pool's live loss ratio, the buyer's claim record, and policy size.
4. **Solvency accounting.** Aggregate outstanding-exposure tracking; the bind guard protects the whole in-force book, with a live solvency ratio.
5. **Enforced coverage window.** The contract now *proves* the validator was unslashed when coverage began, *verifies* a slash fell inside the purchased term, and *releases* exposure on expiry — all from the Beacon repository, no user input. Closes the pre-existing / late-slash claim gap. (See **Coverage window** below.)

46 direct tests; the AI path (`file_claim` / `appeal_claim`) and the coverage-window logic are exercised end-to-end via a primeable equivalence-principle stub with a Beacon-shaped web stub.

---

## Why GenLayer

Proving *that* a validator was slashed is the easy half — you read beacon-chain state. The **contract does exactly that, from a source it pins itself**: `_canonical_sources` builds **Beacon Chain REST API** URLs (two independent keyless providers) from the policy's own validator index, so the fact that decides the payout is never user-submitted text.

The hard half — *why* it happened, and whether the cause is covered — is inherently narrative: operator post-mortems, client release notes, incident reports. That's LLM-shaped work, and GenLayer composes it into one atomic, on-chain, replay-verifiable ruling.

- `gl.nondet.web.render(url, mode="text")` — each validator independently fetches the **contract-pinned** Beacon API (JSON — `data.validator.slashed`) (+ claimant cause URLs, which are narrative-only and cannot establish a slashing)
- `gl.nondet.exec_prompt(...)` — LLM rules the cause bucket (BUG / UNAVOIDABLE / NEGLIGENCE / NOT_SLASHED)
- `gl.eq_principle.prompt_comparative(...)` — validators agree on the cause label, so LLM stylistic variation never kills a consensus round; the **payout is bound to the semantic outcome** (`covered = slashed and cause in COVERED_CAUSES`), never to output format
- `emit_transfer(..., on="finalized")` — covered rulings settle at finality, so a ruling must survive the appeal window before money moves

---

## Coverage matrix

| Cause bucket   | Meaning                                                                       | Covered? |
|----------------|-------------------------------------------------------------------------------|:--------:|
| `NOT_SLASHED`  | The evidence does not show a slashing event                                   | ❌        |
| `NEGLIGENCE`   | Operator error — misconfiguration, double-signing, downtime beyond thresholds | ❌        |
| `BUG`          | Client-software fault (Prysm / Lighthouse / Nimbus / Teku release-note incident) | ✅     |
| `UNAVOIDABLE`  | Chain-level or network-wide event outside operator control                    | ✅        |

The rule set is encoded as a pure Python function so future policies can extend it without touching the AI path.

---

## Risk-tiered premiums

Premiums are actuarially priced, not flat. `preview_premium` returns every component so the quote is fully transparent:

| Component | Effect |
|---|---|
| **Base duration rate** | 7d = 1.0% · 30d = 5.0% · 90d = 12% of coverage |
| **Chain risk multiplier** | Ethereum ×1.00 · Cosmos ×1.30 · unknown chain ×1.50 (priced defensively where slashing data is thin) |
| **Experience rating** | surcharge (capped +8%) when the pool's own loss ratio (`total_payouts / total_premiums`) runs hot |
| **Claim record** | +2% effective per prior *covered* claim by the buyer (capped) — a repeat claimant and a clean wallet get different quotes |
| **Concentration load** | +1.5% on large single-validator policies (≥ 5 GEN) |

**Coverage bounds:** 0.1 GEN minimum, 10 GEN maximum per policy.

**Aggregate solvency guard:** a new policy binds only if the reserve — inclusive of the incoming premium — covers the **total outstanding exposure across every in-force policy**, not just the one being bought. Exposure is released back to the pool when a policy leaves the book at claim time. The pool page shows a live solvency ratio (`reserve / outstanding_exposure`).

---

## Coverage window (enforced, Beacon-anchored)

A duration you *pay* for is worthless if the contract doesn't *enforce* it. Bulwark now proves the whole
coverage window from the Beacon Chain's own validator registry — the repository source — with nothing
supplied by the claimant:

- **Proven unslashed at coverage start.** `buy_policy` fetches the validator (via the contract-derived
  Beacon API) and **refuses to bind if it is already slashed** — a pre-existing condition can't be
  insured. It records `baseline_slashed: false` and anchors `coverage_start_epoch` to the live finalized
  epoch (from `finality_checkpoints`).
- **Slash verified *within* the term.** The Beacon validator object carries the slash timing itself:
  a slashed validator's `withdrawable_epoch = slash_epoch + EPOCHS_PER_SLASHINGS_VECTOR (8192)`, so the
  contract reconstructs **when** the slash happened and requires
  `coverage_start_epoch ≤ slash_epoch ≤ coverage_end_epoch`. A slash before the term is `PRE_EXISTING`,
  after it is `LATE`; both pay **nothing** (`covered = slashed and cause in COVERED_CAUSES and in_window`).
  The appeal path enforces the same window — an appeal can never manufacture an out-of-term payout.
- **Exposure released on expiry.** `expire_policy` fetches the current finalized epoch, requires it to be
  at/after `coverage_end_epoch`, marks the policy `EXPIRED`, and frees its coverage from the
  outstanding-exposure book so the reserve backs only live risk. Keeper-callable (anyone), epoch-gated —
  no wall-clock trust, no owner discretion.

This is a pure *fact* mechanism (deterministic JSON parsing of the pinned Beacon state), separate from the
LLM *cause* ruling: the model never decides whether-slashed or the timing — only the covered/not-covered
cause bucket for a slash the repository already confirms, inside a term the repository already dates.

**Honest edge:** `slash_epoch = withdrawable_epoch − 8192` is exact for a normally-active validator (the
slashings-vector term dominates the exit delay per the consensus spec); a validator already mid-exit with
an unusually distant withdrawal could skew it — it doesn't arise in practice, but it's disclosed.

---

## Appeals

A `REJECTED` claim can be appealed **once**, and only by bringing **new cause evidence**. The appeal is a fresh consensus round — in the spirit of GenLayer's native appeals, a new/larger validator set re-rules. It's principled, not a re-roll: the pinned status sources are unchanged, so an appeal can only recategorise *why* a slashing happened (e.g. Negligence → Bug), never manufacture one the explorers don't show. Every ruling is kept in the claim's on-chain `history`.

---

## Honest boundaries

Stated up front rather than left for a reviewer to find:

- **Evidence-fetch fragility.** Stress testing surfaced that HTML explorers (beaconscan, beaconcha.in) are Cloudflare/403-blocked to GenLayer's fetcher, so the authoritative source was moved to the **Beacon Chain REST API** across two keyless JSON providers (PublicNode + QuikNode public demo) — machine-readable and far more fetch-friendly. Corroboration across two providers is best-effort: if both are momentarily blocked, the contract correctly rules `NOT_SLASHED` rather than paying on unverifiable evidence. The QuikNode demo endpoint is a public shared demo and not guaranteed long-term.
- **No wall-clock on GenLayer.** GenVM exposes no block timestamp, so the coverage *window* is anchored to the **Beacon Chain's finalized epoch** (fetched from the pinned checkpoint endpoint) rather than local time — real, verifiable, and outside anyone's control. Expiry isn't automatic (no cron on-chain): `expire_policy` is a keeper-callable action gated on that epoch. The legacy ordinal `expires_at_block` counter is retained for display only; the enforced window is the epoch pair.
- **The panel judges depiction, the payout binds to fact.** A ruling is only as good as what the pinned Beacon API reports. File claims on genuinely-slashed validators — the honesty of the on-chain trail depends on real evidence, not a staged page.

---

## Evidence sources — what actually works

The **status source is contract-pinned** (derived from the validator index — see *Why GenLayer*), so the claimant no longer chooses it. A claim carries only **1–3 optional narrative URLs** driving the *cause* ruling. **The important thing to know is that GenLayer validators cannot render JavaScript and get 403'd by several popular explorers**, so your cause-URL selection still matters.

### ✅ Verified fetch-friendly

- **Ethereum Beacon Chain API (auto-pinned, JSON, keyless):** `ethereum-beacon-api.publicnode.com/.../validators/<index>` and `docs-demo.quiknode.pro/.../validators/<index>` — return the authoritative `validator.slashed` boolean from finalized chain state. This is what the contract fetches; the claimant never supplies it.
- `mintscan.io/<chain>/validators/<addr>` — Cosmos ecosystem (auto-pinned)
- `github.com/prysmaticlabs/prysm/releases`, `github.com/sigp/lighthouse/releases` — real client-bug advisories
- `ethereum.org/en/developers/docs/consensus-mechanisms/pos/rewards-and-penalties/`
- `en.wikipedia.org/wiki/*` — narrative background
- `gist.githubusercontent.com/<user>/<hash>/raw/...` — public Gist post-mortems (highly recommended for cause evidence)

### ❌ Do not use — these fail silently or 403

- `etherscan.io/*` on validator queries — 403
- `twitter.com` / `x.com` — JavaScript-only shells (use Nitter mirror or Wayback snapshot instead)
- `mirror.xyz/*` — JavaScript-only shells for the article body
- Any dashboard behind auth or Cloudflare Turnstile

---

## Project structure

```
Bulwark/
├── contracts/bulwark.py            # the Intelligent Contract
├── deploy/deployScript.ts          # scripted deploy (alt to CLI)
├── gltest.config.yaml
├── tests/direct/                   # direct-mode pytest suite
└── frontend/                       # Next.js 16 (Turbopack)
    ├── app/
    │   ├── icon.svg + apple-icon.svg     # Bulwark shield favicon
    │   ├── page.tsx                       # landing — hero + pool strip + coverage matrix
    │   ├── policies/new/                  # bind cover
    │   ├── policies/                      # policies of record
    │   ├── claims/                        # claims of record
    │   ├── claims/new/[policyId]/         # notice of claim form
    │   ├── claims/[id]/                   # ruling detail
    │   ├── ledger/                        # public register
    │   └── pool/                          # underwriting reserve + owner seed panel
    ├── components/
    │   ├── HowTo.tsx                      # BW-01..06 Lloyd's guidance notes
    │   ├── LiveBackdrop.tsx               # animated aurora + shield emblem
    │   ├── Logo.tsx                       # BULWARK wordmark
    │   └── Nav.tsx                        # top navigation + wallet connect
    └── lib/
        ├── contracts/bulwark.ts           # typed wrapper — BigInt normalisation
        ├── genlayer/wallet.tsx            # EIP-6963 injected-wallet provider
        └── hooks/useBulwark.ts            # React Query hooks + mutations
```

---

## Contract

- **Address:** `0x09aEa4cF4c9024925FbFe147B56aEe83A21c9b7C`

> **Payout fix (July 2026).** Wallet payouts are sent as EVM external messages (an empty `@gl.evm.contract_interface` proxy executed by the contract's ghost account). The previous GenVM-call pattern errored at finalization on plain wallets and stranded the value; the contract was redeployed at the address above with the corrected transfer path.

- **Network:** GenLayer Studionet (chainId `61999`, RPC `https://studio.genlayer.com/api`)
- **Owner:** the deploying wallet — seeds the reserve and cannot withdraw

Read state:
```bash
genlayer call 0x09aEa4cF4c9024925FbFe147B56aEe83A21c9b7C get_protocol_params
```

---

## Local development

### Contract tests
```bash
python -m pytest tests/direct -q
```

### Deploy to Studionet
```bash
# 1. Register your wallet with the genlayer CLI
genlayer account import --name bulwark-owner --private-key 0x<your-key>

# 2. Point the CLI at Studionet
genlayer network set studionet

# 3. Deploy — pass the FULL owner address as the constructor arg.
# NOTE: owner is typed `Address`, not `str`. The CLI auto-encodes any
# 40-hex-char arg as `addr#…`; a `str` field would collide with the
# storage encoder (AttributeError: 'Address' object has no attribute
# 'encode'). Keep the field type as Address if you change the contract.
genlayer deploy --contract contracts/bulwark.py --args 0x<full-42-char-owner-address>
```

The CLI prints `Contract Address: 0x…`. Copy it into `frontend/.env.local`.

### Frontend
```bash
cd frontend
cp .env.Example .env.local          # (from repo root — populate contract address + rpc)
npm install
npm run dev
```

---

## Environment variables

**`frontend/.env.local`** (also set on Vercel — never commit real values):

- `NEXT_PUBLIC_CONTRACT_ADDRESS` — the deployed contract
- `NEXT_PUBLIC_GENLAYER_RPC_URL` — `https://studio.genlayer.com/api`
- `NEXT_PUBLIC_GENLAYER_CHAIN_ID` — `61999` (Studionet)
- `NEXT_PUBLIC_GENLAYER_CHAIN_NAME` — `GenLayer Studio`
- `NEXT_PUBLIC_GENLAYER_SYMBOL` — `GEN`

**Repo-root `.env`** (for `genlayer deploy` if you use the scripted flow):

- `PRIVATE_KEY` — deployer private key (leave empty in `.env.Example`)
- `GENLAYER_STUDIO_URL` — `https://studio.genlayer.com/api`

---

## Runbook

1. **Owner seeds the reserve.** Connect the deploying wallet on `/pool` → **Seed the reserve** → e.g. `10 GEN` → sign.
2. **Bind cover.** `/policies/new` → validator identifier + coverage + duration → sign the quoted premium.
3. **On a slashing event, file notice of claim.** From the policy card, paste the primary evidence URL (`beaconscan.com/validator/<index>`) and up to three cause URLs (client release notes, operator post-mortem hosted as a public Gist, ethereum.org rewards-and-penalties doc).
4. **Panel adjudicates.** Validators fetch each URL, an LLM rules the cause, `prompt_comparative` bucketed consensus writes the ruling to chain. Covered rulings settle the sum insured to the claimant on the same transaction.
5. **Public ledger.** Every ruling — approved, rejected, or pending — appears in `/ledger` with the panel's reasoning paragraph and cited URLs. Fully replay-verifiable.
