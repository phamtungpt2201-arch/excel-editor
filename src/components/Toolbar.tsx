import React, { useRef, useState } from 'react';
import { Upload, Download, Plus, Save, Search } from 'lucide-react';

interface ToolbarProps {
  onImport: (file: File) => void;
  onExport: () => void;
  onAddColumn: (name: string) => void;
  onSave: () => void;
  hasUnsavedChanges: boolean;
  loading: boolean;
  hasData: boolean;
  searchQuery: string;
  onSearchChange: (query: string) => void;
}

export function Toolbar({ onImport, onExport, onAddColumn, onSave, hasUnsavedChanges, loading, hasData, searchQuery, onSearchChange }: ToolbarProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [newColName, setNewColName] = useState('');

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      onImport(file);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const handleAddCol = () => {
    if (newColName.trim()) {
      onAddColumn(newColName.trim());
      setNewColName('');
    }
  };

  return (
    <div className="toolbar">
      <div className="toolbar-group">
        <input
          type="file"
          accept=".xlsx, .xls"
          ref={fileInputRef}
          style={{ display: 'none' }}
          onChange={handleFileChange}
        />
        <button 
            className="btn btn-primary" 
            onClick={() => fileInputRef.current?.click()}
            disabled={loading}
        >
          <Upload size={16} /> Nhập Excel
        </button>
        <button 
            className="btn btn-secondary" 
            onClick={onExport}
            disabled={loading || !hasData}
        >
          <Download size={16} /> Xuất Excel
        </button>
        
        {hasData && (
             <button 
                 className={`btn ${hasUnsavedChanges ? 'btn-primary' : 'btn-outline'}`} 
                 onClick={onSave}
                 disabled={loading || !hasUnsavedChanges}
                 style={hasUnsavedChanges ? { backgroundColor: 'var(--secondary-color)', borderColor: 'var(--secondary-color)', color: 'white' } : {}}
             >
               <Save size={16} /> {hasUnsavedChanges ? 'Lưu Thay Đổi (*)' : 'Đã Lưu'}
             </button>
        )}
      </div>

      {hasData && (
        <div className="toolbar-group" style={{ marginLeft: 'auto', gap: '1.5rem' }}>
          <div className="search-box" style={{ display: 'flex', alignItems: 'center', background: 'var(--bg-color)', border: '1px solid var(--border-color)', borderRadius: '6px', padding: '0.25rem 0.5rem' }}>
            <Search size={16} style={{ color: 'var(--text-secondary)', marginRight: '6px' }} />
            <input 
              type="text" 
              placeholder="Tìm kiếm..." 
              value={searchQuery}
              onChange={e => onSearchChange(e.target.value)}
              style={{ border: 'none', background: 'transparent', color: 'var(--text-primary)', outline: 'none', width: '200px' }}
            />
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <input 
              type="text" 
              className="input-text" 
              placeholder="Tên cột mới..." 
              value={newColName}
              onChange={e => setNewColName(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && handleAddCol()}
            />
            <button 
                className="btn btn-outline" 
                onClick={handleAddCol}
                disabled={loading || !newColName.trim()}
            >
              <Plus size={16} /> Thêm Cột
            </button>
          </div>
        </div>
      )}
    </div>
  );
}


