import { useState } from 'react';
import { FileSpreadsheet, Trash2, PanelLeftClose, FolderKanban } from 'lucide-react';
import './Sidebar.css';
import type { Project } from '../db';

interface SidebarProps {
  projects: Project[];
  activeProjectId: number | null;
  onSelectProject: (id: number) => void;
  onDeleteProject: (id: number) => void;
}

export function Sidebar({ projects, activeProjectId, onSelectProject, onDeleteProject }: SidebarProps) {
  const [isOpen, setIsOpen] = useState(true);

  return (
    <aside className={`app-sidebar ${isOpen ? '' : 'collapsed'}`}>
      {isOpen ? (
        <>
          <div className="sidebar-header">
            <h2>Projects</h2>
            <button className="sidebar-toggle-btn" onClick={() => setIsOpen(false)} title="Thu gọn">
              <PanelLeftClose size={20} />
            </button>
          </div>
          
          <div className="sidebar-content">
            {projects.length === 0 ? (
              <p className="no-projects">Chưa có dự án nào. Hãy Import file Excel.</p>
            ) : (
              <ul className="project-list">
                {projects.map(p => (
                  <li 
                    key={p.id} 
                    className={`project-item ${p.id === activeProjectId ? 'active' : ''}`}
                    onClick={() => onSelectProject(p.id!)}
                  >
                    <FileSpreadsheet size={16} />
                    <span className="project-name" title={p.name}>{p.name}</span>
                    <button 
                      className="delete-project-btn" 
                      onClick={(e) => {
                        e.stopPropagation();
                        onDeleteProject(p.id!);
                      }}
                      title="Xóa dự án"
                    >
                      <Trash2 size={14} />
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </>
      ) : (
        <div className="sidebar-collapsed-view">
          <button className="sidebar-icon-btn active" onClick={() => setIsOpen(true)} title="Mở Projects">
            <FolderKanban size={24} />
          </button>
          {/* Bạn có thể thêm các nút tính năng khác vào đây trong tương lai */}
        </div>
      )}
    </aside>
  );
}
