import { useState, useRef, useEffect } from 'react';
import { FileSpreadsheet, Trash2, PanelLeftClose, FolderKanban, Pencil, Check, X, Settings, Plus, HelpCircle } from 'lucide-react';
import './Sidebar.css';
import type { Project } from '../db';

interface SidebarProps {
  projects: Project[];
  activeProjectId: number | null;
  onSelectProject: (id: number) => void;
  onDeleteProject: (id: number) => void;
  onRenameProject: (id: number, newName: string) => void;
  onOpenSettings: () => void;
  onOpenHelp: () => void;
  onAddProjectFromExcel: (file: File) => void;
}

export function Sidebar({ projects, activeProjectId, onSelectProject, onDeleteProject, onRenameProject, onOpenSettings, onOpenHelp, onAddProjectFromExcel }: SidebarProps) {
  const [isOpen, setIsOpen] = useState(true);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [editName, setEditName] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (editingId !== null && inputRef.current) {
      inputRef.current.focus();
    }
  }, [editingId]);

  const handleStartEdit = (e: React.MouseEvent, project: Project) => {
    e.stopPropagation();
    setEditingId(project.id!);
    setEditName(project.name);
  };

  const handleSaveEdit = (e?: React.MouseEvent | React.FormEvent) => {
    e?.stopPropagation();
    if (editingId && editName.trim()) {
      onRenameProject(editingId, editName);
    }
    setEditingId(null);
  };

  const handleCancelEdit = (e: React.MouseEvent) => {
    e.stopPropagation();
    setEditingId(null);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') handleSaveEdit();
    if (e.key === 'Escape') {
      setEditingId(null);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      onAddProjectFromExcel(e.target.files[0]);
    }
    // Reset file input so the same file can be selected again
    e.target.value = '';
  };

  return (
    <aside className={`app-sidebar ${isOpen ? '' : 'collapsed'}`}>
      <div className="sidebar-header">
        <h2 className="sidebar-title">Excel Editor</h2>
        <button className="sidebar-toggle-btn" onClick={() => setIsOpen(!isOpen)} title={isOpen ? "Thu gọn" : "Mở rộng"}>
          {isOpen ? <PanelLeftClose size={20} /> : <FolderKanban size={24} color="var(--primary-color)" />}
        </button>
      </div>
      
      <div className="sidebar-add-project">
        <input 
          type="file" 
          accept=".xlsx, .xls" 
          ref={fileInputRef} 
          style={{ display: 'none' }} 
          onChange={handleFileChange} 
        />
        <button 
          className="btn btn-outline" 
          onClick={() => fileInputRef.current?.click()}
          title="Thêm Project từ file Excel"
        >
          <Plus size={16} className="add-icon" /> 
          <span className="add-text">Thêm Project mới</span>
        </button>
      </div>

      <div className="sidebar-content">
        {projects.length === 0 ? (
          <p className="no-projects">Chưa có dự án nào.</p>
        ) : (
          <ul className="project-list">
            {projects.map(p => (
              <li 
                key={p.id} 
                className={`project-item ${p.id === activeProjectId ? 'active' : ''}`}
                onClick={() => {
                  if (editingId !== p.id) onSelectProject(p.id!);
                }}
              >
                <FileSpreadsheet size={16} className="project-icon" />
                
                {editingId === p.id ? (
                  <div className="edit-project-container" onClick={e => e.stopPropagation()}>
                    <input
                      ref={inputRef}
                      className="edit-project-input"
                      value={editName}
                      onChange={e => setEditName(e.target.value)}
                      onKeyDown={handleKeyDown}
                    />
                    <button className="icon-btn save-btn" onClick={handleSaveEdit}><Check size={14}/></button>
                    <button className="icon-btn cancel-btn" onClick={handleCancelEdit}><X size={14}/></button>
                  </div>
                ) : (
                  <>
                    <span className="project-name" title={p.name}>{p.name}</span>
                    <div className="project-actions">
                      <button 
                        className="project-action-btn edit" 
                        onClick={(e) => handleStartEdit(e, p)}
                        title="Đổi tên dự án"
                      >
                        <Pencil size={14} />
                      </button>
                      <button 
                        className="project-action-btn delete" 
                        onClick={(e) => {
                          e.stopPropagation();
                          onDeleteProject(p.id!);
                        }}
                        title="Xóa dự án"
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                  </>
                )}
              </li>
            ))}
          </ul>
        )}
      </div>
      
      <div className="sidebar-footer">
        <button className="sidebar-icon-btn settings" onClick={onOpenHelp} title="Hướng dẫn sử dụng">
          <HelpCircle size={20} className="settings-icon" />
          <span className="settings-text">Hướng Dẫn</span>
        </button>
        <button className="sidebar-icon-btn settings" onClick={onOpenSettings} title="Cài đặt hệ thống">
          <Settings size={20} className="settings-icon" />
          <span className="settings-text">Cài Đặt</span>
        </button>
      </div>
    </aside>
  );
}
