# BULWARK

**AI-arbitrated validator slashing insurance on GenLayer.**

Stake with a validator. Buy a Bulwark policy. If your validator is later slashed, submit a claim with public evidence URLs — a panel of GenLayer AI validators reads the evidence, decides whether the cause is covered under the policy terms, and pays you out in GEN. No adjuster, no queue, no Discord ticket.

**The pitch in one line:** slashing insurance that pays out in minutes, not weeks.

---

## Why GenLayer

A standard smart contract can prove *that* a validator was slashed by reading beacon-chain state. That's the easy half.

The interesting half — *why* the slashing happened, and whether the cause is covered — is inherently narrative. You have to read operator post-mortems, client-release changelogs, incident reports, and community discussions. That's LLM-shaped work, and GenLayer's `web.render` + `exec_prompt` + `prompt_comparative` primitives compose it into a single atomic, on-chain, replay-verifiable ruling.

- `gl.nondet.web.render(url, mode="text")` — each validator fetches the evidence URL independently
- `gl.nondet.exec_prompt(...)` — LLM rules the cause bucket (BUG / UNAVOIDABLE / NEGLIGENCE / NOT_SLASHED)
- `gl.eq_principle.prompt_comparative(...)` — validators bucket their rulings on the cause label, so LLM stylistic variation never kills a consensus round
- `emit_transfer(..., on="finalized")` — approved payouts fire on the same transaction that decided them

---

## Coverage matrix

| Cause bucket   | Meaning                                                                       | Covered? |
|----------------|-------------------------------------------------------------------------------|:--------:|
| `NOT_SLASHED`  | The evidence does not show a slashing event                                   | ❌        |
| `NEGLIGENCE`   | Operator error — misconfiguration, double-signing, downtime beyond thresholds | ❌        |
| `BUG`          | Client-software fault (Prysm / Lighthouse / Nimbus / Teku release-note incident) | ✅     |
| `UNAVOIDABLE`  | Chain-level or network-wide event outside operator control                    | ✅        |

The rule set is encoded as a pure Python function so v2 policies can extend it without touching the AI path.

---

## Premium schedule

Premiums scale with coverage duration — longer risk window, higher rate.

| Duration | Rate (bps of coverage) | Example on 1 GEN coverage |
|---------:|-----------------------:|--------------------------:|
|  7 days  | 100 (1.0%)             | 0.01 GEN                  |
| 30 days  | 500 (5.0%)             | 0.05 GEN                  |
| 90 days  | 1200 (12%)             | 0.12 GEN                  |

**Coverage bounds:** 0.1 GEN minimum, 10 GEN maximum per policy (MVP cap so a seeded reserve is always solvent for demos).

---

## Evidence sources

Every claim carries **one required primary URL** confirming the slashing plus **1–3 optional narrative URLs** driving the cause ruling.

**Primary (validator status)**
- `rated.network/o/<operator>` — aggregates validator behaviour + incident context. Recommended.
- `beaconcha.in/validator/<index>` — Ethereum beacon-chain lookup, fetch-friendly HTML.
- `beaconscan.com/validator/<index>` — Ethereum backup.
- `mintscan.io/<chain>/validators/<addr>` — Cosmos ecosystem.

**Cause evidence (drives ruling)**
- Client release notes / advisories (Prysm / Lighthouse / Nimbus / Teku changelogs)
- Operator post-mortem (blog, Mirror, GitHub gist)
- Incident report threads on `ethresear.ch` / `r/ethstaker` / operator's Twitter thread cached via Wayback

**Sources that don't work** — GenLayer validators can't render JS and get 403'd on some pages:
- Bare Etherscan validator queries (403)
- Twitter/X live pages (JS-only shell — use Nitter mirror or Wayback snapshot)
- Operator internal dashboards behind auth

---

## Project structure

```
Bulwark/
├── contracts/bulwark.py          # the Intelligent Contract
├── deploy/deployScript.ts        # scripted deployment
├── gltest.config.yaml
├── tests/direct/                 # direct-mode contract tests (pytest)
└── frontend/                     # Next.js — added in Milestone 4
```

## Contract

Set once you've deployed. Update this line and the CI env:

- **Address:** _pending deployment_
- **Network:** GenLayer Studionet

## Local development

```bash
# contract tests (direct-mode)
python -m pytest tests/direct -q

# deploy to Studionet
gltest deploy --network studionet
```

## Environment variables

**`frontend/.env.local`** (also set on Vercel):

- `NEXT_PUBLIC_CONTRACT_ADDRESS` — the deployed contract
- `NEXT_PUBLIC_GENLAYER_RPC_URL` — default: `https://studio.genlayer.com/api`
- `NEXT_PUBLIC_GENLAYER_CHAIN_ID` — `61999` (Studionet)
- `NEXT_PUBLIC_GENLAYER_CHAIN_NAME` — `GenLayer Studio`
- `NEXT_PUBLIC_GENLAYER_SYMBOL` — `GEN`
