import { useState, useEffect, useCallback } from 'react';
import { db } from '../db';
import { useLiveQuery } from 'dexie-react-hooks';
import * as xlsx from 'xlsx';

export function useExcelData() {
  const [activeProjectId, setActiveProjectId] = useState<number | null>(null);
  const [loading, setLoading] = useState(false);
  
  // Trạng thái lưu trữ tạm thời các ô bị chỉnh sửa
  const [unsavedChanges, setUnsavedChanges] = useState<Record<number, Record<string, string>>>({});
  const hasUnsavedChanges = Object.keys(unsavedChanges).length > 0;

  // Lấy danh sách project
  const projects = useLiveQuery(() => db.projects.toArray(), []) || [];
  
  // Tổng số lượng bản ghi toàn hệ thống
  const totalRecords = useLiveQuery(() => db.records.count(), []) || 0;

  // Tự động chọn project đầu tiên nếu chưa chọn
  useEffect(() => {
    if (activeProjectId === null && projects.length > 0) {
      setActiveProjectId(projects[0].id!);
    } else if (projects.length === 0) {
      setActiveProjectId(null);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
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
      const { id: _id, projectId: _pid, ...rest } = r; // bỏ id và projectId nội bộ
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

  const handleAddRow = async () => {
    if (!activeProjectId) return;
    setLoading(true);
    try {
      const newRecord: any = { projectId: activeProjectId };
      // Khởi tạo các trường rỗng
      headers.forEach(h => newRecord[h] = "");
      await db.records.add(newRecord);
      
      // Update local state if needed? Actually records are reactive via useLiveQuery in useExcelData.
    } catch (err) {
      console.error(err);
      alert("Đã xảy ra lỗi khi thêm hàng mới.");
    } finally {
      setLoading(false);
    }
  };

  const updateProjectName = async (projectId: number, newName: string) => {
    if (!newName.trim()) return;
    await db.projects.update(projectId, { name: newName.trim() });
  };

  const updateRecord = useCallback((id: number, key: string, value: string) => {
    setUnsavedChanges(prev => ({
      ...prev,
      [id]: {
        ...(prev[id] || {}),
        [key]: value
      }
    }));
  }, []);

  const saveChanges = async () => {
    if (!hasUnsavedChanges) return;
    setLoading(true);
    try {
      const updates = Object.entries(unsavedChanges).map(([idStr, changes]) => ({
        id: Number(idStr),
        ...changes
      }));
      
      await db.transaction('rw', db.records, async () => {
        for (const update of updates) {
           await db.records.update(update.id, update);
        }
      });
      setUnsavedChanges({});
    } catch (err) {
      console.error("Lỗi khi lưu dữ liệu:", err);
      alert("Đã xảy ra lỗi khi lưu dữ liệu!");
    } finally {
      setLoading(false);
    }
  };

  const discardChanges = () => {
    setUnsavedChanges({});
  };

  const exportAllToJson = async () => {
    const allProjects = await db.projects.toArray();
    const allMetadata = await db.metadata.toArray();
    const allRecords = await db.records.toArray();
    
    const backupData = {
      version: 2,
      projects: allProjects,
      metadata: allMetadata,
      records: allRecords,
    };
    
    const blob = new Blob([JSON.stringify(backupData)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `excel_editor_backup_${new Date().toISOString().slice(0,10)}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const importAllFromJson = async (file: File) => {
    setLoading(true);
    try {
      const text = await file.text();
      const backupData = JSON.parse(text);
      if (!backupData.projects || !backupData.records) {
        throw new Error("File backup không hợp lệ.");
      }
      
      await db.transaction('rw', db.projects, db.records, db.metadata, async () => {
        await db.projects.clear();
        await db.records.clear();
        await db.metadata.clear();
        
        if (backupData.projects.length) await db.projects.bulkAdd(backupData.projects);
        if (backupData.metadata.length) await db.metadata.bulkAdd(backupData.metadata);
        if (backupData.records.length) await db.records.bulkAdd(backupData.records);
      });
      setActiveProjectId(null);
    } catch (err) {
      alert("Khôi phục thất bại: " + (err as Error).message);
    } finally {
      setLoading(false);
    }
  };

  const factoryReset = async () => {
    if(!confirm("CẢNH BÁO: Hành động này sẽ XÓA SẠCH toàn bộ dữ liệu, dự án. Không thể hoàn tác. Bạn có chắc không?")) return;
    setLoading(true);
    try {
      await db.transaction('rw', db.projects, db.records, db.metadata, async () => {
        await db.projects.clear();
        await db.records.clear();
        await db.metadata.clear();
      });
      setActiveProjectId(null);
    } finally {
      setLoading(false);
    }
  };

  const globalSearch = async (keyword: string) => {
    if (!keyword.trim()) return { projects: [], records: [] };
    const kw = keyword.toLowerCase();
    
    // Search projects
    const allProjects = await db.projects.toArray();
    const matchedProjects = allProjects.filter(p => p.name.toLowerCase().includes(kw));

    // Search records
    const allRecords = await db.records.toArray();
    const matchedRecords: Array<{
      projectId: number;
      projectName: string;
      recordId: number;
      column: string;
      value: string;
    }> = [];

    const projectMap = new Map(allProjects.map(p => [p.id, p.name]));

    for (const record of allRecords) {
      const keys = Object.keys(record);
      for (const k of keys) {
        if (k === 'id' || k === 'projectId') continue;
        const val = String(record[k] || '');
        if (val.toLowerCase().includes(kw)) {
          matchedRecords.push({
            projectId: record.projectId,
            projectName: projectMap.get(record.projectId) || 'Unknown',
            recordId: record.id!,
            column: k,
            value: val
          });
          // We only take the first matched column to bring to front
          break;
        }
      }
    }

    return {
      projects: matchedProjects,
      records: matchedRecords.slice(0, 50) // limit results for performance
    };
  };

  return {
    projects,
    totalRecords,
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
    updateProjectName,
    handleExport,
    handleAddColumn,
    updateRecord,
    exportAllToJson,
    importAllFromJson,
    factoryReset,
    unsavedChanges,
    hasUnsavedChanges,
    saveChanges,
    discardChanges,
    globalSearch,
    handleAddRow
  };
}
