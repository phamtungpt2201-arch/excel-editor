import { useState, useEffect } from 'react';
import { db } from '../db';
import { useLiveQuery } from 'dexie-react-hooks';
import * as xlsx from 'xlsx';

export function useExcelData() {
  const [activeProjectId, setActiveProjectId] = useState<number | null>(null);
  const [loading, setLoading] = useState(false);

  // Lấy danh sách project
  const projects = useLiveQuery(() => db.projects.toArray(), []) || [];

  // Tự động chọn project đầu tiên nếu chưa chọn
  useEffect(() => {
    if (activeProjectId === null && projects.length > 0) {
      setActiveProjectId(projects[0].id!);
    } else if (projects.length === 0) {
      setActiveProjectId(null);
    }
  }, [projects, activeProjectId]);

  // Lấy dữ liệu của project ĐANG CHỌN
  const dbData = useLiveQuery(async () => {
    if (activeProjectId === null) return { records: [], metadata: undefined };
    
    const recs = await db.records.where({ projectId: activeProjectId }).toArray();
    const meta = await db.metadata.where('[projectId+key]').equals([activeProjectId, 'headers']).first();
    
    return { records: recs, metadata: meta };
  }, [activeProjectId]);

  const isDBLoading = activeProjectId !== null && dbData === undefined;
  const records = dbData?.records || [];
  let headers: string[] = dbData?.metadata?.value || [];

  if (headers.length === 0 && records.length > 0) {
    headers = Object.keys(records[0]).filter(k => k !== 'id' && k !== 'projectId');
  }

  // Tiện ích phân tích file Excel
  const parseExcelFile = async (file: File) => {
    const buffer = await file.arrayBuffer();
    const workbook = xlsx.read(buffer, { type: 'array' });
    const firstSheetName = workbook.SheetNames[0];
    const worksheet = workbook.Sheets[firstSheetName];
    
    const jsonData = xlsx.utils.sheet_to_json<Record<string, any>>(worksheet, { defval: '' });
    if (jsonData.length === 0) throw new Error("File không có dữ liệu");
    
    const newHeaders = Object.keys(jsonData[0]);
    return { 
      filename: file.name.replace(/\.[^/.]+$/, ""), // Bỏ đuôi mở rộng
      headers: newHeaders, 
      data: jsonData 
    };
  };

  const createNewProject = async (name: string, newHeaders: string[], data: any[]) => {
    setLoading(true);
    try {
      await db.transaction('rw', db.projects, db.records, db.metadata, async () => {
        const projectId = await db.projects.add({ name, createdAt: Date.now() });
        
        const recordsWithProjectId = data.map(r => ({ ...r, projectId }));
        await db.records.bulkAdd(recordsWithProjectId);
        await db.metadata.add({ projectId, key: 'headers', value: newHeaders });
        
        setActiveProjectId(projectId as number);
      });
    } finally {
      setLoading(false);
    }
  };

  const appendToProject = async (projectId: number, newHeaders: string[], data: any[]) => {
    setLoading(true);
    try {
      await db.transaction('rw', db.records, db.metadata, async () => {
        // Hợp nhất header cũ và mới, loại bỏ trùng lặp
        const currentMeta = await db.metadata.where('[projectId+key]').equals([projectId, 'headers']).first();
        const currentHeaders: string[] = currentMeta?.value || [];
        
        const mergedHeaders = Array.from(new Set([...currentHeaders, ...newHeaders]));
        
        // Cập nhật lại meta headers
        if (currentMeta) {
          await db.metadata.update(currentMeta.id!, { value: mergedHeaders });
        } else {
          await db.metadata.add({ projectId, key: 'headers', value: mergedHeaders });
        }
        
        // Thêm dữ liệu mới
        const recordsWithProjectId = data.map(r => {
          const row: any = { ...r, projectId };
          // Đảm bảo dữ liệu mới có đủ các cột trống của dữ liệu cũ (nếu có)
          mergedHeaders.forEach(h => {
             if (row[h] === undefined) row[h] = "";
          });
          return row;
        });
        
        await db.records.bulkAdd(recordsWithProjectId);
        
        // Cũng phải cập nhật các dòng cũ để có cột mới từ file mới (để VirtualTable render đồng nhất)
        const newColumnsOnly = newHeaders.filter(h => !currentHeaders.includes(h));
        if (newColumnsOnly.length > 0) {
           await db.records.where({ projectId }).modify(record => {
             newColumnsOnly.forEach(col => {
                if (record[col] === undefined) record[col] = "";
             });
           });
        }
      });
    } finally {
      setLoading(false);
    }
  };

  const deleteProject = async (projectId: number) => {
    if(!confirm("Bạn có chắc chắn muốn xóa Project này cùng toàn bộ dữ liệu?")) return;
    setLoading(true);
    try {
      await db.transaction('rw', db.projects, db.records, db.metadata, async () => {
        await db.projects.delete(projectId);
        await db.records.where({ projectId }).delete();
        await db.metadata.where({ projectId }).delete();
      });
      if (activeProjectId === projectId) {
        setActiveProjectId(null);
      }
    } finally {
      setLoading(false);
    }
  };

  const handleExport = async () => {
    if (!records || records.length === 0) {
      alert("Không có dữ liệu để export!");
      return;
    }
    const exportData = records.map(r => {
      const { id, projectId, ...rest } = r; // bỏ id và projectId nội bộ
      return rest;
    });

    const worksheet = xlsx.utils.json_to_sheet(exportData, { header: headers });
    const workbook = xlsx.utils.book_new();
    xlsx.utils.book_append_sheet(workbook, worksheet, "Data");
    xlsx.writeFile(workbook, 'export.xlsx');
  };

  const handleAddColumn = async (columnName: string) => {
    if (!activeProjectId) return;
    if (!columnName || headers.includes(columnName)) {
      alert("Tên cột không hợp lệ hoặc đã tồn tại.");
      return;
    }
    setLoading(true);
    try {
      const newHeaders = [...headers, columnName];
      await db.transaction('rw', db.records, db.metadata, async () => {
        const meta = await db.metadata.where('[projectId+key]').equals([activeProjectId, 'headers']).first();
        if (meta) {
           await db.metadata.update(meta.id!, { value: newHeaders });
        }
        await db.records.where({ projectId: activeProjectId }).modify(record => {
          record[columnName] = "";
        });
      });
    } finally {
      setLoading(false);
    }
  };

  const updateRecord = async (id: number, key: string, value: string) => {
    await db.records.update(id, { [key]: value });
  };

  return {
    projects,
    activeProjectId,
    setActiveProjectId,
    records,
    headers,
    loading,
    setLoading,
    isDBLoading,
    parseExcelFile,
    createNewProject,
    appendToProject,
    deleteProject,
    handleExport,
    handleAddColumn,
    updateRecord
  };
}
