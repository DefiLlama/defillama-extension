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

export type Setting =
  | {
      name: "priceInjector";
      value: boolean;
    }
  | {
      name: "phishingDetector";
      value: boolean;
    };

export class SettingsDb extends Dexie {
  settings!: Table<Setting>;

  constructor() {
    super("SettingsDb");
    this.version(1).stores({
      settings: "name",
    });
  }
}

export const getSetting = async (name: "priceInjector" | "phishingDetector") => {
  return (await settingsDb.settings.toArray()).find((setting) => setting.name === name)?.value;
};

export const updateSetting = async ({ name, value }: Setting) => {
  chrome.storage.sync.set({ name: value });

  const _value = await getSetting(name);
  if (_value === undefined) {
    settingsDb.settings.put({ name, value });
  } else {
    settingsDb.settings.update(name, { value });
  }
};

export const settingsDb = new SettingsDb();
