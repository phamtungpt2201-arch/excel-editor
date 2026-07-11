import Dexie, { type Table } from 'dexie';

export interface ExcelRecord {
  id?: number;
  [key: string]: any; // Allow dynamic columns
}

export interface AppMetadata {
  id?: number;
  key: string;
  value: any;
}

export class ExcelAppDB extends Dexie {
  records!: Table<ExcelRecord, number>;
  metadata!: Table<AppMetadata, number>;

  constructor() {
    super('ExcelLocalDB');
    this.version(1).stores({
      records: '++id', // Primary key. Columns are dynamic so we don't index them.
      metadata: '++id, key'
    });
  }
}

export const db = new ExcelAppDB();
