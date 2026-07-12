import React, { useRef } from 'react';
import { Upload, Download, Plus, Save, Search, Sun, Moon } from 'lucide-react';

interface ToolbarProps {
  onImport: (file: File) => void;
  onExport: () => void;
  onSave: () => void;
  hasUnsavedChanges: boolean;
  loading: boolean;
  hasData: boolean;
  searchQuery: string;
  onSearchChange: (query: string) => void;
  onOpenGlobalSearch: () => void;
  onOpenAddDialog: () => void;
  theme: 'light' | 'dark';
  onToggleTheme: () => void;
  projectTab?: 'data' | 'followup';
}

export function Toolbar({ onImport, onExport, onSave, hasUnsavedChanges, loading, hasData, searchQuery, onSearchChange, onOpenGlobalSearch, onOpenAddDialog, theme, onToggleTheme, projectTab = 'data' }: ToolbarProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      onImport(file);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  return (
    <div className="toolbar">
      {projectTab !== 'followup' && (
        <>
          <button 
              className="btn btn-primary" 
              onClick={() => fileInputRef.current?.click()}
              disabled={loading}
          >
            <Upload size={16} /> Nhập Excel
          </button>
          <input
            type="file"
            accept=".xlsx, .xls"
            ref={fileInputRef}
            style={{ display: 'none' }}
            onChange={handleFileChange}
          />
          
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
                 <Save size={16} /> {hasUnsavedChanges ? 'Lưu (*)' : 'Đã Lưu'}
               </button>
          )}
        </>
      )}

      {(hasData || projectTab === 'followup') && (
        <>
          {projectTab !== 'followup' && (
            <div style={{ width: '1px', height: '20px', backgroundColor: 'var(--border-color)', margin: '0 4px' }} />
          )}
          
          <button 
            className="btn btn-outline" 
            onClick={onOpenGlobalSearch}
          >
            <Search size={14} /> 
            {searchQuery ? (
              <>
                <span style={{ color: 'var(--primary-color)' }}>Lọc: {searchQuery}</span>
                <span 
                  onClick={(e) => { 
                    e.stopPropagation(); 
                    onSearchChange(''); 
                  }} 
                  style={{ marginLeft: '4px', fontWeight: 'bold' }}
                >
                  ×
                </span>
              </>
            ) : (
              <span>⌘ + F</span>
            )}
          </button>

          {projectTab !== 'followup' && (
            <>
              <div style={{ width: '1px', height: '20px', backgroundColor: 'var(--border-color)', margin: '0 4px' }} />

              <button 
                  className="btn btn-outline" 
                  onClick={onOpenAddDialog}
                  disabled={loading}
              >
                <Plus size={16} /> Thêm dữ liệu
              </button>
            </>
          )}
          
          <button 
              className="btn btn-outline btn-icon-only" 
              onClick={onToggleTheme}
              title="Chuyển giao diện"
          >
            {theme === 'light' ? <Moon size={16} /> : <Sun size={16} />}
          </button>
        </>
      )}
    </div>
  );
}


