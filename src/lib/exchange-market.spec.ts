import test from 'ava';

import {
  discoverCoinbaseListing,
  discoverKrakenListing,
  EXCHANGE_MARKET,
  fetchCoinbaseTicker,
  fetchKrakenTicker,
  validateExchangeListingPacket,
} from './exchange-market';

const response = (body: unknown) => async (_url: string) => ({
  ok: true,
  status: 200,
  json: async () => body,
});

test('Coinbase listing discovery distinguishes active and missing products', async (t) => {
  const fetcher = response([
    { id: 'BTC-USD', base_currency: 'BTC', quote_currency: 'USD', status: 'online' },
  ]);
  const listed = await discoverCoinbaseListing({ exchange: 'COINBASE', symbol: 'BTC', quote: 'USD' }, fetcher);
  t.is(listed.status, 'LISTED_ACTIVE');
  const missing = await discoverCoinbaseListing({ exchange: 'COINBASE', symbol: 'XO', quote: 'USD' }, fetcher);
  t.is(missing.status, 'NOT_LISTED');
});

test('Kraken listing discovery reads tradable-pair response', async (t) => {
  const fetcher = response({ error: [], result: { XXBTZUSD: { altname: 'XBTUSD', wsname: 'XBT/USD', status: 'online' } } });
  const listed = await discoverKrakenListing({ exchange: 'KRAKEN', symbol: 'XBT', quote: 'USD' }, fetcher);
  t.is(listed.status, 'LISTED_ACTIVE');
  t.is(listed.marketId, 'XXBTZUSD');
});

test('ticker adapters normalize Coinbase and Kraken market data', async (t) => {
  const coinbase = await fetchCoinbaseTicker('BTC-USD', response({ price: '10', bid: '9', ask: '11', volume: '100' }));
  t.is(coinbase.price, '10');
  const kraken = await fetchKrakenTicker('XBTUSD', response({ error: [], result: { XXBTZUSD: { c: ['10'], b: ['9'], a: ['11'], v: ['90', '100'] } } }));
  t.is(kraken.volume24h, '100');
});

test('listing packets require network, contract and provenance', (t) => {
  t.truthy(validateExchangeListingPacket({
    symbol: 'FLOW', name: 'Flow', network: 'Flow', contractAddress: '0x1', decimals: 8, provenance: ['registry:flow-mainnet'],
  }));
  t.throws(() => validateExchangeListingPacket({
    symbol: 'XO', name: 'XO', network: 'Flow', contractAddress: '', decimals: 8, provenance: ['registry:test'],
  }), { message: 'LISTING_NETWORK_CONTRACT_REQUIRED' });
});

test('exchange integration remains read only and cannot self-declare listings', (t) => {
  t.is(EXCHANGE_MARKET.command, '/glass exchanges');
  t.true(EXCHANGE_MARKET.capabilities.liveProductDiscovery);
  t.false(EXCHANGE_MARKET.capabilities.orderPlacement);
  t.true(EXCHANGE_MARKET.rules.externalListingCannotBeSelfDeclared);
});
