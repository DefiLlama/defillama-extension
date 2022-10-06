import Dexie, { Table } from "dexie";

export interface Coin {
  id: string;
  symbol: string;
  name: string;
  image: string;
  market_cap: number;
  total_volume?: number;
  last_updated: string;
}

export class CoinsDb extends Dexie {
  // 'coins' is added by dexie when declaring the stores()
  // We just tell the typing system this is the case
  coins!: Table<Coin>;

  constructor() {
    super("CoinsDb");
    this.version(1).stores({
      coins: "id, symbol, name", // Primary key and indexed props
    });
  }
}

export const coinsDb = new CoinsDb();

export interface Protocol {
  name: string;
  url: string;
  logo: string;
  category: string;
  tvl?: number;
}

export class ProtocolsDb extends Dexie {
  protocols!: Table<Protocol>;

  constructor() {
    super("ProtocolsDb");
    this.version(1).stores({
      protocols: "name, category",
    });
  }
}

export const protocolsDb = new ProtocolsDb();

export interface Domain {
  domain: string;
}

export class AllowedDomainsDb extends Dexie {
  domains!: Table<Domain>;

  constructor() {
    super("AllowedDomainsDb");
    this.version(1).stores({
      domains: "domain",
    });
  }
}

export const allowedDomainsDb = new AllowedDomainsDb();

export class FuzzyDomainsDb extends Dexie {
  domains!: Table<Domain>;

  constructor() {
    super("FuzzyDomainsDb");
    this.version(1).stores({
      domains: "domain",
    });
  }
}

export const fuzzyDomainsDb = new FuzzyDomainsDb();

export class BlockedDomainsDb extends Dexie {
  domains!: Table<Domain>;

  constructor() {
    super("BlockedDomainsDb");
    this.version(1).stores({
      domains: "domain",
    });
  }
}

export const blockedDomainsDb = new BlockedDomainsDb();
