import { fetch as crossFetch } from 'cross-fetch';

export type ExchangeId = 'COINBASE' | 'KRAKEN';
export type ExchangeListingStatus = 'LISTED_ACTIVE' | 'LISTED_RESTRICTED' | 'NOT_LISTED' | 'UNKNOWN';

export interface ExchangeListingRequest {
  readonly exchange: ExchangeId;
  readonly symbol: string;
  readonly quote?: string;
  readonly marketId?: string;
}

export interface ExchangeListingResult {
  readonly exchange: ExchangeId;
  readonly symbol: string;
  readonly quote?: string;
  readonly marketId?: string;
  readonly status: ExchangeListingStatus;
  readonly source: string;
  readonly observedAt: string;
  readonly detail?: string;
}

export interface ExchangeTicker {
  readonly exchange: ExchangeId;
  readonly marketId: string;
  readonly price?: string;
  readonly bid?: string;
  readonly ask?: string;
  readonly volume24h?: string;
  readonly observedAt: string;
  readonly source: string;
}

export interface ExchangeListingPacket {
  readonly symbol: string;
  readonly name: string;
  readonly network: string;
  readonly contractAddress: string;
  readonly decimals: number;
  readonly website?: string;
  readonly explorer?: string;
  readonly logoURI?: string;
  readonly provenance: readonly string[];
}

interface JsonResponse {
  readonly ok: boolean;
  readonly status: number;
  json(): Promise<unknown>;
}

export type ExchangeFetch = (url: string) => Promise<JsonResponse>;

const defaultFetch: ExchangeFetch = (url) => crossFetch(url) as Promise<JsonResponse>;

const asObject = (value: unknown): Record<string, unknown> => {
  if (!value || typeof value !== 'object' || Array.isArray(value)) throw new Error('EXCHANGE_RESPONSE_OBJECT_REQUIRED');
  return value as Record<string, unknown>;
};

const asArray = (value: unknown): readonly unknown[] => {
  if (!Array.isArray(value)) throw new Error('EXCHANGE_RESPONSE_ARRAY_REQUIRED');
  return value;
};

const normalized = (value: unknown): string => String(value ?? '').trim().toUpperCase();

export const fetchCoinbaseProducts = async (fetcher: ExchangeFetch = defaultFetch): Promise<readonly Record<string, unknown>[]> => {
  const url = 'https://api.exchange.coinbase.com/products';
  const response = await fetcher(url);
  if (!response.ok) throw new Error(`COINBASE_PRODUCTS_HTTP_${response.status}`);
  return asArray(await response.json()).map(asObject);
};

export const fetchCoinbaseTicker = async (marketId: string, fetcher: ExchangeFetch = defaultFetch): Promise<ExchangeTicker> => {
  if (!marketId.trim()) throw new Error('EXCHANGE_MARKET_ID_REQUIRED');
  const url = `https://api.exchange.coinbase.com/products/${encodeURIComponent(marketId)}/ticker`;
  const response = await fetcher(url);
  if (!response.ok) throw new Error(`COINBASE_TICKER_HTTP_${response.status}`);
  const body = asObject(await response.json());
  return {
    exchange: 'COINBASE',
    marketId,
    price: body.price === undefined ? undefined : String(body.price),
    bid: body.bid === undefined ? undefined : String(body.bid),
    ask: body.ask === undefined ? undefined : String(body.ask),
    volume24h: body.volume === undefined ? undefined : String(body.volume),
    observedAt: new Date().toISOString(),
    source: url,
  };
};

export const fetchKrakenPairs = async (fetcher: ExchangeFetch = defaultFetch): Promise<Readonly<Record<string, Record<string, unknown>>>> => {
  const url = 'https://api.kraken.com/0/public/AssetPairs';
  const response = await fetcher(url);
  if (!response.ok) throw new Error(`KRAKEN_PAIRS_HTTP_${response.status}`);
  const body = asObject(await response.json());
  const errors = body.error;
  if (Array.isArray(errors) && errors.length > 0) throw new Error(`KRAKEN_API_ERROR:${errors.join(',')}`);
  return asObject(body.result) as Readonly<Record<string, Record<string, unknown>>>;
};

export const fetchKrakenTicker = async (marketId: string, fetcher: ExchangeFetch = defaultFetch): Promise<ExchangeTicker> => {
  if (!marketId.trim()) throw new Error('EXCHANGE_MARKET_ID_REQUIRED');
  const url = `https://api.kraken.com/0/public/Ticker?pair=${encodeURIComponent(marketId)}`;
  const response = await fetcher(url);
  if (!response.ok) throw new Error(`KRAKEN_TICKER_HTTP_${response.status}`);
  const body = asObject(await response.json());
  const errors = body.error;
  if (Array.isArray(errors) && errors.length > 0) throw new Error(`KRAKEN_API_ERROR:${errors.join(',')}`);
  const result = asObject(body.result);
  const firstKey = Object.keys(result)[0];
  if (!firstKey) throw new Error('KRAKEN_TICKER_EMPTY');
  const ticker = asObject(result[firstKey]);
  const close = Array.isArray(ticker.c) ? ticker.c : [];
  const ask = Array.isArray(ticker.a) ? ticker.a : [];
  const bid = Array.isArray(ticker.b) ? ticker.b : [];
  const volume = Array.isArray(ticker.v) ? ticker.v : [];
  return {
    exchange: 'KRAKEN',
    marketId: firstKey,
    price: close[0] === undefined ? undefined : String(close[0]),
    bid: bid[0] === undefined ? undefined : String(bid[0]),
    ask: ask[0] === undefined ? undefined : String(ask[0]),
    volume24h: volume[1] === undefined ? (volume[0] === undefined ? undefined : String(volume[0])) : String(volume[1]),
    observedAt: new Date().toISOString(),
    source: url,
  };
};

export const discoverCoinbaseListing = async (
  request: ExchangeListingRequest,
  fetcher: ExchangeFetch = defaultFetch,
): Promise<ExchangeListingResult> => {
  const products = await fetchCoinbaseProducts(fetcher);
  const symbol = normalized(request.symbol);
  const quote = request.quote ? normalized(request.quote) : undefined;
  const explicitMarket = request.marketId ? normalized(request.marketId) : undefined;
  const match = products.find((product) => {
    if (explicitMarket) return normalized(product.id) === explicitMarket;
    return normalized(product.base_currency) === symbol && (!quote || normalized(product.quote_currency) === quote);
  });
  const source = 'https://api.exchange.coinbase.com/products';
  if (!match) return { exchange: 'COINBASE', symbol, quote, marketId: request.marketId, status: 'NOT_LISTED', source, observedAt: new Date().toISOString() };
  const marketId = String(match.id ?? request.marketId ?? '');
  const status = normalized(match.status);
  return {
    exchange: 'COINBASE', symbol, quote, marketId,
    status: status === 'ONLINE' ? 'LISTED_ACTIVE' : 'LISTED_RESTRICTED',
    source,
    observedAt: new Date().toISOString(),
    detail: status || 'UNKNOWN_PRODUCT_STATUS',
  };
};

export const discoverKrakenListing = async (
  request: ExchangeListingRequest,
  fetcher: ExchangeFetch = defaultFetch,
): Promise<ExchangeListingResult> => {
  const pairs = await fetchKrakenPairs(fetcher);
  const symbol = normalized(request.symbol);
  const quote = request.quote ? normalized(request.quote) : undefined;
  const explicitMarket = request.marketId ? normalized(request.marketId) : undefined;
  const entries = Object.keys(pairs).map((key) => ({ key, value: pairs[key] }));
  const match = entries.find(({ key, value }) => {
    const altname = normalized(value.altname);
    const wsname = normalized(value.wsname);
    if (explicitMarket) return normalized(key) === explicitMarket || altname === explicitMarket || wsname === explicitMarket;
    if (wsname.includes('/')) {
      const parts = wsname.split('/');
      return parts[0] === symbol && (!quote || parts[1] === quote);
    }
    return altname.startsWith(symbol) && (!quote || altname.endsWith(quote));
  });
  const source = 'https://api.kraken.com/0/public/AssetPairs';
  if (!match) return { exchange: 'KRAKEN', symbol, quote, marketId: request.marketId, status: 'NOT_LISTED', source, observedAt: new Date().toISOString() };
  const status = normalized(match.value.status);
  return {
    exchange: 'KRAKEN', symbol, quote, marketId: match.key,
    status: !status || status === 'ONLINE' ? 'LISTED_ACTIVE' : 'LISTED_RESTRICTED',
    source,
    observedAt: new Date().toISOString(),
    detail: status || 'ACTIVE_PAIR',
  };
};

export const discoverExchangeListing = async (
  request: ExchangeListingRequest,
  fetcher: ExchangeFetch = defaultFetch,
): Promise<ExchangeListingResult> => {
  if (!request.symbol.trim()) throw new Error('EXCHANGE_SYMBOL_REQUIRED');
  return request.exchange === 'COINBASE'
    ? discoverCoinbaseListing(request, fetcher)
    : discoverKrakenListing(request, fetcher);
};

export const validateExchangeListingPacket = (packet: ExchangeListingPacket): ExchangeListingPacket => {
  if (!packet.symbol.trim() || !packet.name.trim()) throw new Error('LISTING_IDENTITY_REQUIRED');
  if (!packet.network.trim() || !packet.contractAddress.trim()) throw new Error('LISTING_NETWORK_CONTRACT_REQUIRED');
  if (!Number.isInteger(packet.decimals) || packet.decimals < 0) throw new Error('LISTING_DECIMALS_INVALID');
  if (packet.provenance.length === 0) throw new Error('LISTING_PROVENANCE_REQUIRED');
  return packet;
};

export const EXCHANGE_MARKET = {
  id: 'GLASS-EXCHANGE-MARKET',
  version: '1.0.0',
  command: '/glass exchanges',
  status: 'LIVE_READ_ONLY_DISCOVERY',
  exchanges: ['COINBASE', 'KRAKEN'] as readonly ExchangeId[],
  capabilities: {
    liveProductDiscovery: true,
    liveTickerRead: true,
    listingStatusDetection: true,
    listingPacketValidation: true,
    orderPlacement: false,
    automaticExchangeSubmission: false,
  },
  rules: {
    externalListingCannotBeSelfDeclared: true,
    exchangeAcceptanceRequiredForListedClaim: true,
    marketDataReadOnly: true,
    provenanceRequired: true,
  },
} as const;
