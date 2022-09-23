import Dexie, { Table } from "dexie";

export interface Coin {
  id: string;
  symbol: string;
  name: string;
}

export interface Protocol {
  name: string;
  url: string;
  logo: string;
  category: string;
  tvl?: number;
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

export class ProtocolsDb extends Dexie {
  // 'protocols' is added by dexie when declaring the stores()
  // We just tell the typing system this is the case
  protocols!: Table<Protocol>;

  constructor() {
    super("ProtocolsDb");
    this.version(1).stores({
      protocols: "name, category", // Primary key and indexed props
    });
  }
}

export const protocolsDb = new ProtocolsDb();
