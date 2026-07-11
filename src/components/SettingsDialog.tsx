import { useRef } from 'react';
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
        <h3>Cài Đặt & Quản Lý Dữ Liệu</h3>
        
        <div className="settings-section">
          <h4>Thông tin hệ thống</h4>
          <div className="info-grid">
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

        <div className="settings-section">
          <h4>Sao lưu & Khôi phục</h4>
          <p className="section-desc">Bảo vệ dữ liệu của bạn bằng cách tải file Backup (.json) về máy tính.</p>
          <div className="action-buttons">
            <button className="settings-btn primary" onClick={onExportBackup}>
              📥 Sao lưu toàn bộ (Backup)
            </button>
            <button className="settings-btn outline" onClick={() => fileInputRef.current?.click()}>
              📤 Khôi phục (Restore)
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

        <div className="settings-section">
          <h4>Xuất dữ liệu</h4>
          <p className="section-desc">Xuất dữ liệu của Project ĐANG MỞ thành file Excel.</p>
          <button className="settings-btn success" onClick={onExportExcel}>
            📊 Xuất Excel Project hiện tại
          </button>
        </div>

        <div className="settings-section danger-zone">
          <h4>Vùng Nguy Hiểm</h4>
          <p className="section-desc">Xóa sạch toàn bộ dữ liệu. Thao tác này không thể hoàn tác!</p>
          <button className="settings-btn danger" onClick={onFactoryReset}>
            🗑️ Xóa trắng hệ thống
          </button>
        </div>
        
        <div className="dialog-actions">
          <button className="cancel-btn" onClick={onClose}>Đóng</button>
        </div>
      </div>
    </div>
  );
}
