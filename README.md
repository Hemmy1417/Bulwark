# BULWARK

**AI-arbitrated validator slashing insurance on GenLayer.**

Stake with a validator. Bind a Bulwark policy. If your validator is later slashed, file notice of claim with public evidence URLs — a panel of GenLayer AI validators reads the evidence, rules the cause, and — where covered — settles the sum insured straight to your wallet on the same transaction.

**The pitch in one line:** slashing insurance that pays out in minutes, not weeks.

---

## Why GenLayer

A standard smart contract can prove *that* a validator was slashed by reading beacon-chain state. That's the easy half.

The interesting half — *why* the slashing happened, and whether the cause is covered — is inherently narrative. You have to read operator post-mortems, client release notes, and incident reports. That's LLM-shaped work, and GenLayer's `web.render` + `exec_prompt` + `prompt_comparative` primitives compose it into a single atomic, on-chain, replay-verifiable ruling.

- `gl.nondet.web.render(url, mode="text")` — each validator fetches the evidence URL independently
- `gl.nondet.exec_prompt(...)` — LLM rules the cause bucket (BUG / UNAVOIDABLE / NEGLIGENCE / NOT_SLASHED)
- `gl.eq_principle.prompt_comparative(...)` — validators bucket their rulings on the cause label, so LLM stylistic variation never kills a consensus round
- `emit_transfer(..., on="finalized")` — covered rulings settle on the same tx that decided them

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

## Premium schedule

Premiums scale with the period of insurance — longer risk window, higher rate.

| Duration | Rate (bps of coverage) | Example on 1 GEN coverage |
|---------:|-----------------------:|--------------------------:|
|  7 days  | 100 (1.0%)             | 0.01 GEN                  |
| 30 days  | 500 (5.0%)             | 0.05 GEN                  |
| 90 days  | 1200 (12%)             | 0.12 GEN                  |

**Coverage bounds:** 0.1 GEN minimum, 10 GEN maximum per policy (MVP cap so a seeded reserve is always solvent for demos).

**Solvency guarantee:** a new policy binds only if the reserve — inclusive of the incoming premium — is at least equal to the sum insured. Enforced by the contract at write time.

---

## Evidence sources — what actually works

Every claim carries **one required primary URL** confirming the slashing plus **1–3 optional narrative URLs** driving the cause ruling. **The important thing to know is that GenLayer validators cannot render JavaScript and get 403'd by several popular explorers.** URL selection matters.

### ✅ Verified fetch-friendly

- `beaconscan.com/validator/<index>` — Ethereum beacon chain, HTML shell renders without JS
- `mintscan.io/<chain>/validators/<addr>` — Cosmos ecosystem
- `github.com/prysmaticlabs/prysm/releases`, `github.com/sigp/lighthouse/releases` — real client-bug advisories
- `ethereum.org/en/developers/docs/consensus-mechanisms/pos/rewards-and-penalties/`
- `en.wikipedia.org/wiki/*` — narrative background
- `gist.githubusercontent.com/<user>/<hash>/raw/...` — public Gist post-mortems (highly recommended for cause evidence)

### ❌ Do not use — these fail silently or 403

- `beaconcha.in/*` — **returns 403 to non-browser fetchers**
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

- **Address:** `0xF65C03C80d3dD12022E090734170C3c59D4838b4`

> **Payout fix (July 2026).** Wallet payouts are sent as EVM external messages (an empty `@gl.evm.contract_interface` proxy executed by the contract's ghost account). The previous GenVM-call pattern errored at finalization on plain wallets and stranded the value; the contract was redeployed at the address above with the corrected transfer path.

- **Network:** GenLayer Studionet (chainId `61999`, RPC `https://studio.genlayer.com/api`)
- **Owner:** the deploying wallet — seeds the reserve and cannot withdraw

Read state:
```bash
genlayer call 0xF65C03C80d3dD12022E090734170C3c59D4838b4 get_protocol_params
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
