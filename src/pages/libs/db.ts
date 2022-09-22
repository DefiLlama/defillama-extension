import Dexie, { Table } from "dexie";

export interface Coin {
  id: string;
  symbol: string;
  name: string;
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
