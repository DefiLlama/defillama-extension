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

export interface Domain {
  domain: string;
  updateId: string;
}

// _____________ ALLOWED DOMAINS DB _____________

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

// method used to update AllowedDomainsDb
export const putAllowedDomainsDb = async (newDomains: Domain[], updateId: string): Promise<void> => {
  // we divide the update in chunks to avoid locking the DB
  for (let index = 0; index < newDomains.length; index += DB_UPDATE_CHUNK_SIZE) {
    const chunk = newDomains.slice(index, index + DB_UPDATE_CHUNK_SIZE);
    // we do a bulkPut, which replaces existing items (by their primary key) or creates them
    await allowedDomainsDb.domains.bulkPut(chunk);
  }
  // we then remove all entries that don't have this update's updateId
  await allowedDomainsDb.domains.where("updateId").notEqual(updateId).delete();
};

// method used to count the number of allowed domains in the DB
export const countAllowedDomainsDb = async () => {
  const count = await allowedDomainsDb.domains.count();
  return count;
};

// _____________ FUZZY DOMAINS DB _____________

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

// method used to update FuzzyDomainsDb
export const putFuzzyDomainsDb = async (newDomains: Domain[], updateId: string): Promise<void> => {
  // we divide the update in chunks to avoid locking the DB
  for (let index = 0; index < newDomains.length; index += DB_UPDATE_CHUNK_SIZE) {
    const chunk = newDomains.slice(index, index + DB_UPDATE_CHUNK_SIZE);
    // we do a bulkPut, which replaces existing items (by their primary key) or creates them
    await fuzzyDomainsDb.domains.bulkPut(chunk);
  }
  // we then remove all entries that don't have this update's updateId
  await fuzzyDomainsDb.domains.where("updateId").notEqual(updateId).delete();
};

// method used to count the number of fuzzy domains in the DB
export const countFuzzyDomainsDb = async () => {
  const count = await fuzzyDomainsDb.domains.count();
  return count;
};

// _____________ BLOCKED DOMAINS DB _____________

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

// method used to update BlockedDomainsDb
export const putBlockedDomainsDb = async (newDomains: Domain[], updateId: string): Promise<void> => {
  // we divide the update in chunks to avoid locking the DB
  for (let index = 0; index < newDomains.length; index += DB_UPDATE_CHUNK_SIZE) {
    const chunk = newDomains.slice(index, index + DB_UPDATE_CHUNK_SIZE);
    // we do a bulkPut, which replaces existing items (by their primary key) or creates them
    await blockedDomainsDb.domains.bulkPut(chunk);
  }
  // we then remove all entries that don't have this update's updateId
  await blockedDomainsDb.domains.where("updateId").notEqual(updateId).delete();
};

// method used to count the number of blocked domains in the DB
export const countBlockedDomainsDb = async () => {
  const count = await blockedDomainsDb.domains.count();
  return count;
};
