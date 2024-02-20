import Dexie, { Table } from "dexie";
import { DB_UPDATE_CHUNK_SIZE } from "./constants";

export interface Protocol {
  id: string;
  name: string;
  url: string;
  logo: string;
  category: string;
  symbol?: string;
  tvl?: number;
  updateId: string;
}

export class ProtocolsDb extends Dexie {
  protocols?: Table<Protocol>;
  protocolsEnriched!: Table<Protocol>;

  constructor() {
    super("ProtocolsDb");
    this.version(2)
      .stores({
        protocolsEnriched: "[tvl+id],name,symbol,updateId",
      })
      .upgrade(() => {
        return this.protocolsEnriched.clear();
      });
  }
}

export const protocolsDb = new ProtocolsDb();

export const queryProtocolsDb = async (query: string | null): Promise<Protocol[]> => {
  if (query) {
    const regex = new RegExp(`.*${query}.*`, "i");
    return await protocolsDb.protocolsEnriched
      .filter(({ symbol, name }) => regex.test(symbol) || regex.test(name))
      .reverse()
      .limit(10)
      .toArray();
  }
  return await protocolsDb.protocolsEnriched.reverse().limit(10).toArray();
};

export const putProtocolsDb = async (newProtocols: Protocol[], updateId: string): Promise<void> => {
  // await protocolsDb.protocolsEnriched.clear();
  for (let index = 0; index < newProtocols.length; index += DB_UPDATE_CHUNK_SIZE) {
    console.log("putProtocolsDb", index);
    const chunk = newProtocols.slice(index, index + DB_UPDATE_CHUNK_SIZE);
    await protocolsDb.protocolsEnriched.bulkPut(chunk);
  }
  console.log("putProtocolsDb deleting old entries");
  const deleted = await protocolsDb.protocolsEnriched.where("updateId").notEqual(updateId).delete();
  console.log("putProtocolsDb deleted", deleted);
};

export interface Domain {
  domain: string;
  updateId: string;
}

export class AllowedDomainsDb extends Dexie {
  domains!: Table<Domain>;

  constructor() {
    super("AllowedDomainsDb");
    this.version(2)
      .stores({
        domains: "domain,updateId",
      })
      .upgrade(() => {
        return this.domains.clear();
      });
  }
}

export const allowedDomainsDb = new AllowedDomainsDb();

export const putAllowedDomainsDb = async (newDomains: Domain[], updateId: string): Promise<void> => {
  // await allowedDomainsDb.domains.clear();
  for (let index = 0; index < newDomains.length; index += DB_UPDATE_CHUNK_SIZE) {
    console.log("putAllowedDomainsDb", index);
    const chunk = newDomains.slice(index, index + DB_UPDATE_CHUNK_SIZE);
    await allowedDomainsDb.domains.bulkPut(chunk);
  }
  console.log("putAllowedDomainsDb deleting old entries");
  const deleted = await allowedDomainsDb.domains.where("updateId").notEqual(updateId).delete();
  console.log("putAllowedDomainsDb deleted", deleted);
};

export const countAllowedDomainsDb = async () => {
  const count = await allowedDomainsDb.domains.count();
  return count;
};

export class FuzzyDomainsDb extends Dexie {
  domains!: Table<Domain>;

  constructor() {
    super("FuzzyDomainsDb");
    this.version(2)
      .stores({
        domains: "domain,updateId",
      })
      .upgrade(() => {
        return this.domains.clear();
      });
  }
}

export const fuzzyDomainsDb = new FuzzyDomainsDb();

export const putFuzzyDomainsDb = async (newDomains: Domain[], updateId: string): Promise<void> => {
  // await fuzzyDomainsDb.domains.clear();
  for (let index = 0; index < newDomains.length; index += DB_UPDATE_CHUNK_SIZE) {
    console.log("putFuzzyDomainsDb", index);
    const chunk = newDomains.slice(index, index + DB_UPDATE_CHUNK_SIZE);
    await fuzzyDomainsDb.domains.bulkPut(chunk);
  }
  console.log("putFuzzyDomainsDb deleting old entries");
  const deleted = await fuzzyDomainsDb.domains.where("updateId").notEqual(updateId).delete();
  console.log("putFuzzyDomainsDb deleted", deleted);
};

export const countFuzzyDomainsDb = async () => {
  const count = await fuzzyDomainsDb.domains.count();
  return count;
};

export class BlockedDomainsDb extends Dexie {
  domains!: Table<Domain>;

  constructor() {
    super("BlockedDomainsDb");
    this.version(2)
      .stores({
        domains: "domain,updateId",
      })
      .upgrade(() => {
        return this.domains.clear();
      });
  }
}

export const blockedDomainsDb = new BlockedDomainsDb();

export const putBlockedDomainsDb = async (newDomains: Domain[], updateId: string): Promise<void> => {
  // await blockedDomainsDb.domains.clear();
  for (let index = 0; index < newDomains.length; index += DB_UPDATE_CHUNK_SIZE) {
    console.log("putBlockedDomainsDb", index);
    const chunk = newDomains.slice(index, index + DB_UPDATE_CHUNK_SIZE);
    await blockedDomainsDb.domains.bulkPut(chunk);
  }
  console.log("putBlockedDomainsDb deleting old entries");
  const deleted = await blockedDomainsDb.domains.where("updateId").notEqual(updateId).delete();
  console.log("putBlockedDomainsDb deleted", deleted);
};

export const countBlockedDomainsDb = async () => {
  const count = await blockedDomainsDb.domains.count();
  return count;
};
