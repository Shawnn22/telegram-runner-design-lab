# TON testnet escrow: implementation boundary

## Completion pool v1

The campaign owner deploys one escrow with immutable values:

- `campaignId`, `deadline`, `challengeDeadline`
- `poolAmount`, `merkleRoot`, `oraclePublicKey`
- a `claimed` dictionary keyed by runner wallet address

The oracle calculates eligible runners off-chain after GPS and anti-cheat review, then publishes a Merkle root. A runner claims with `(amount, proof)`; the contract verifies the proof, rejects duplicates, and transfers the exact allocation. The contract must reject funding/claims outside the campaign lifecycle and must never receive raw GPS.

## Required before deployment

1. Audit the contract and proof encoding independently.
2. Configure a testnet escrow address plus API endpoint that returns a signed claim payload.
3. Make the UI send only that server-created payload via TON Connect; do not construct payout amounts in the browser.
4. Run sandbox tests for: duplicate claim, incorrect proof, early claim, expired claim, and owner withdrawal rules.

`@tonconnect/ui-react` is wired into the app now, but an escrow is deliberately not deployed from this repository: there is no testnet signer, oracle secret, or audited contract address committed here.
