# GLASS ONION Exchange Market Layer

Command: `/glass exchanges`

The exchange layer provides **live, read-only market discovery** against public Coinbase Exchange and Kraken market-data endpoints. It can verify whether a requested symbol/pair is present in the exchange's current product catalog and can read ticker snapshots.

## Pipeline

```text
TOKEN_SCOPE
  → LISTING_PACKET_VALIDATE
  → LIVE_EXCHANGE_DISCOVERY
  → LISTING_STATUS_VERIFY
  → READ_ONLY_TICKER
```

## Live sources

- Coinbase products: `https://api.exchange.coinbase.com/products`
- Coinbase ticker: `https://api.exchange.coinbase.com/products/{product_id}/ticker`
- Kraken asset pairs: `https://api.kraken.com/0/public/AssetPairs`
- Kraken ticker: `https://api.kraken.com/0/public/Ticker?pair={pair}`

The implementation is in `src/lib/exchange-market.ts` and the machine contract is `ecosystem/exchange-market.json`.

## Listing status

The layer returns one of:

- `LISTED_ACTIVE`
- `LISTED_RESTRICTED`
- `NOT_LISTED`
- `UNKNOWN`

A token is **not** considered exchange-listed merely because it exists in the XUNIA/Flow token registry or because a listing packet was generated. A `LISTED_*` result must be derived from the exchange's live product/pair response. External exchange acceptance is required.

## Safety boundary

This layer does not place orders, move funds, submit listings automatically, hold exchange credentials, or claim an exchange endorsement. It is a public market-data and listing-verification adapter.
