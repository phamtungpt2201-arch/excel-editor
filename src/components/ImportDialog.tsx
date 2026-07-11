import { useState } from 'react';
import './ImportDialog.css';
import type { Project } from '../db';

interface ImportDialogProps {
  filename: string;
  projects: Project[];
  activeProjectId: number | null;
  onAppend: (targetProjectId: number) => void;
  onNew: () => void;
  onCancel: () => void;
}

export function ImportDialog({ filename, projects, activeProjectId, onAppend, onNew, onCancel }: ImportDialogProps) {
  const [selectedProjectId, setSelectedProjectId] = useState<number | ''>(
    activeProjectId || (projects.length > 0 ? projects[0].id! : '')
  );

  const handleAppendClick = () => {
    if (selectedProjectId !== '') {
      onAppend(Number(selectedProjectId));
    }
  };

  return (
    <div className="dialog-overlay">
      <div className="dialog-content">
        <h3>Import File Excel</h3>
        <p>Bạn muốn làm gì với dữ liệu từ file <strong>{filename}</strong>?</p>
        
        <div className="dialog-options">
          <div className="dialog-btn append">
            <div className="append-header">
              <strong>Gộp vào Project:</strong>
              <select 
                className="project-select" 
                value={selectedProjectId} 
                onChange={(e) => setSelectedProjectId(Number(e.target.value))}
              >
                {projects.map(p => (
                  <option key={p.id} value={p.id}>{p.name}</option>
                ))}
              </select>
            </div>
            <span>Thêm dữ liệu mới xuống dưới. Tự động thêm cột mới nếu có.</span>
            <button 
              className="action-btn" 
              disabled={selectedProjectId === ''} 
              onClick={handleAppendClick}
            >
              Thực hiện Gộp
            </button>
          </div>
          
          <div className="dialog-btn new">
            <strong>Tạo Project mới</strong>
            <span>Tạo một không gian làm việc mới hoàn toàn.</span>
            <button className="action-btn success" onClick={onNew}>
              Tạo Mới
            </button>
          </div>
        </div>
        
        <div className="dialog-actions">
          <button className="cancel-btn" onClick={onCancel}>Hủy bỏ</button>
        </div>
      </div>
    </div>
  );
}
