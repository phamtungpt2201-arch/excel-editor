import Dexie, { type Table } from 'dexie';

export interface Project {
  id?: number;
  name: string;
  createdAt: number;
}

export interface ExcelRecord {
  id?: number;
  projectId: number;
  [key: string]: any; // Allow dynamic columns
}

export interface AppMetadata {
  id?: number;
  projectId: number;
  key: string;
  value: any;
}

export class ExcelAppDB extends Dexie {
  projects!: Table<Project, number>;
  records!: Table<ExcelRecord, number>;
  metadata!: Table<AppMetadata, number>;

  constructor() {
    super('ExcelLocalDB');
    
    // Version 1
    this.version(1).stores({
      records: '++id',
      metadata: '++id, key'
    });

    // Version 2: Support Projects
    this.version(2).stores({
      projects: '++id, createdAt',
      records: '++id, projectId',
      metadata: '++id, [projectId+key]'
    }).upgrade(tx => {
      // Tự động gom dữ liệu cũ (nếu có) vào một Project mặc định
      return tx.table('records').count().then(count => {
        if (count > 0) {
          return tx.table('projects').add({ name: 'Dự án Cũ', createdAt: Date.now() }).then(defaultProjectId => {
            return Promise.all([
              tx.table('records').toCollection().modify(record => {
                record.projectId = defaultProjectId;
              }),
              tx.table('metadata').toCollection().modify(meta => {
                meta.projectId = defaultProjectId;
              })
            ]);
          });
        }
      });
    });
  }
}

export const db = new ExcelAppDB();
