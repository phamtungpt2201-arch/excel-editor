import { useState } from 'react';
import { db, type ExcelRecord } from '../db';
import { useLiveQuery } from 'dexie-react-hooks';
import * as xlsx from 'xlsx';

export function useExcelData() {
  const [loading, setLoading] = useState(false);

  // Auto-fetch data when DB changes
  const records = useLiveQuery(() => db.records.toArray(), []) as ExcelRecord[] | undefined;
  const metadata = useLiveQuery(() => db.metadata.where('key').equals('headers').first(), []);
  
  const headers: string[] = metadata?.value || [];

  const handleImport = async (file: File) => {
    setLoading(true);
    try {
      const buffer = await file.arrayBuffer();
      const workbook = xlsx.read(buffer, { type: 'array' });
      const firstSheetName = workbook.SheetNames[0];
      const worksheet = workbook.Sheets[firstSheetName];
      
      const jsonData = xlsx.utils.sheet_to_json<Record<string, any>>(worksheet, { defval: '' });
      
      if (jsonData.length === 0) return;

      const newHeaders = Object.keys(jsonData[0]);
      
      await db.transaction('rw', db.records, db.metadata, async () => {
        await db.records.clear();
        await db.records.bulkAdd(jsonData);
        
        await db.metadata.put({ id: 1, key: 'headers', value: newHeaders });
      });
    } catch (error) {
      console.error("Import failed", error);
      alert("Đã có lỗi khi import file Excel.");
    } finally {
      setLoading(false);
    }
  };

  const handleExport = async () => {
    if (!records || records.length === 0) {
      alert("Không có dữ liệu để export!");
      return;
    }
    
    // Strip out the internal 'id' before exporting
    const exportData = records.map(r => {
      const { id, ...rest } = r;
      return rest;
    });

    const worksheet = xlsx.utils.json_to_sheet(exportData, { header: headers });
    const workbook = xlsx.utils.book_new();
    xlsx.utils.book_append_sheet(workbook, worksheet, "Data");
    
    xlsx.writeFile(workbook, 'export.xlsx');
  };

  const handleAddColumn = async (columnName: string) => {
    if (!columnName || headers.includes(columnName)) {
      alert("Tên cột không hợp lệ hoặc đã tồn tại.");
      return;
    }
    
    setLoading(true);
    try {
      const newHeaders = [...headers, columnName];
      
      await db.transaction('rw', db.records, db.metadata, async () => {
        // Update headers
        await db.metadata.put({ id: 1, key: 'headers', value: newHeaders });
        
        // Update all records to have the new column
        await db.records.toCollection().modify(record => {
          record[columnName] = "";
        });
      });
    } catch (error) {
       console.error("Add column failed", error);
    } finally {
      setLoading(false);
    }
  };

  const updateRecord = async (id: number, key: string, value: string) => {
    await db.records.update(id, { [key]: value });
  };

  const clearData = async () => {
    if(confirm("Bạn có chắc chắn muốn xóa toàn bộ dữ liệu?")) {
        await db.transaction('rw', db.records, db.metadata, async () => {
            await db.records.clear();
            await db.metadata.clear();
        });
    }
  }

  return {
    records: records || [],
    headers,
    loading,
    handleImport,
    handleExport,
    handleAddColumn,
    updateRecord,
    clearData
  };
}
