
export type Calcs = 'lowestListingPrice' | 'highestListingPrice' | 'lowestBidPrice' | 'highestBidPrice' | 'averageBidPrice' | 'averageYearBidPrice' | 'totalBidsValue' | 'totalListingsValue';

export interface Sort { label: string, value: Sorts };
export type Sorts = 'recent' | 'price-low' | 'price-high' | 'id' | 'recently-listed';

export type Totals = 'sales';

