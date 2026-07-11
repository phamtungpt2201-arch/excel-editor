import { useRef } from 'react';
import { X, Download, Upload, FileSpreadsheet, Trash2 } from 'lucide-react';
import './SettingsDialog.css';

interface SettingsDialogProps {
  totalProjects: number;
  totalRecords: number;
  onExportBackup: () => void;
  onImportBackup: (file: File) => void;
  onExportExcel: () => void;
  onFactoryReset: () => void;
  onClose: () => void;
}

export function SettingsDialog({
  totalProjects,
  totalRecords,
  onExportBackup,
  onImportBackup,
  onExportExcel,
  onFactoryReset,
  onClose
}: SettingsDialogProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      onImportBackup(e.target.files[0]);
    }
  };

  return (
    <div className="dialog-overlay">
      <div className="dialog-content settings-dialog">
        <div className="settings-header">
          <h3>Cài Đặt & Quản Lý Dữ Liệu</h3>
          <button className="close-icon-btn" onClick={onClose} title="Đóng">
            <X size={20} />
          </button>
        </div>
        
        <div className="settings-body settings-grid">
          
          {/* Card 1: System Info */}
          <div className="settings-card">
            <div className="card-header">
              <h4>Thông tin hệ thống</h4>
            </div>
            <div className="card-body">
              <div className="info-item">
                <span className="info-label">Dữ liệu lưu trữ tại:</span>
                <span className="info-value">Local Browser (IndexedDB)</span>
              </div>
              <div className="info-item">
                <span className="info-label">Tổng số dự án (Projects):</span>
                <span className="info-value">{totalProjects}</span>
              </div>
              <div className="info-item">
                <span className="info-label">Tổng số dòng dữ liệu:</span>
                <span className="info-value">{totalRecords.toLocaleString()} dòng</span>
              </div>
            </div>
          </div>

          {/* Card 2: Backup & Restore */}
          <div className="settings-card">
            <div className="card-header">
              <h4>Sao lưu & Khôi phục</h4>
            </div>
            <div className="card-body">
              <p className="card-desc">Bảo vệ dữ liệu của bạn bằng cách tải file Backup (.json) về máy tính.</p>
              <div className="action-buttons">
                <button className="btn btn-primary" onClick={onExportBackup}>
                  <Download size={16} /> Sao lưu (Backup)
                </button>
                <button className="btn btn-outline" onClick={() => fileInputRef.current?.click()}>
                  <Upload size={16} /> Khôi phục (Restore)
                </button>
                <input 
                  type="file" 
                  accept=".json" 
                  style={{ display: 'none' }} 
                  ref={fileInputRef}
                  onChange={handleFileChange}
                />
              </div>
            </div>
          </div>

          {/* Card 3: Export */}
          <div className="settings-card">
            <div className="card-header">
              <h4>Xuất dữ liệu</h4>
            </div>
            <div className="card-body">
              <p className="card-desc">Xuất dữ liệu của Project ĐANG MỞ thành file Excel.</p>
              <button className="btn btn-secondary" onClick={onExportExcel}>
                <FileSpreadsheet size={16} /> Xuất Excel Project hiện tại
              </button>
            </div>
          </div>

          {/* Card 4: Danger Zone */}
          <div className="settings-card danger-card">
            <div className="card-header">
              <h4 className="danger-text">Vùng Nguy Hiểm</h4>
            </div>
            <div className="card-body">
              <p className="card-desc danger-text">Xóa sạch toàn bộ dữ liệu. Thao tác này không thể hoàn tác!</p>
              <button className="btn btn-danger" onClick={onFactoryReset}>
                <Trash2 size={16} /> Xóa trắng hệ thống
              </button>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}
