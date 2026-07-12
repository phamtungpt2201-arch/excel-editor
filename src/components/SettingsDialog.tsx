import { useRef } from 'react';
import { X, Download, Upload, FileSpreadsheet, Trash2 } from 'lucide-react';
import './SettingsDialog.css';

export interface FollowUpConfig {
  statusColumn: string;
  dateColumn: string;
  slaDays: number;
  titleColumn: string;
  subtitleColumn: string;
  excludeStatuses: string;
}

interface SettingsDialogProps {
  totalProjects: number;
  totalRecords: number;
  followUpConfig: FollowUpConfig;
  onUpdateFollowUpConfig: (config: FollowUpConfig) => void;
  onExportBackup: () => void;
  onImportBackup: (file: File) => void;
  onExportExcel: () => void;
  onFactoryReset: () => void;
  onClose: () => void;
}

export function SettingsDialog({
  totalProjects,
  totalRecords,
  followUpConfig,
  onUpdateFollowUpConfig,
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

          {/* Card: Follow-up Settings */}
          <div className="settings-card">
            <div className="card-header">
              <h4>Cấu hình Smart Follow-up</h4>
            </div>
            <div className="card-body">
              <p className="card-desc">Thiết lập các cột dùng để nhắc việc tự động. Hệ thống sẽ bỏ qua nếu không tìm thấy cột tương ứng trong dự án.</p>
              
              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', marginTop: '12px' }}>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                    <label style={{ fontSize: '0.85rem', fontWeight: 500, color: 'var(--text-secondary)' }}>Cột Tiêu đề công việc</label>
                    <input 
                      type="text" 
                      className="table-cell-input" 
                      style={{ border: '1px solid var(--border-color)', borderRadius: '4px', padding: '6px 12px' }}
                      value={followUpConfig.titleColumn || ''}
                      onChange={e => onUpdateFollowUpConfig({ ...followUpConfig, titleColumn: e.target.value })}
                      placeholder="VD: Part number"
                    />
                  </div>
                  
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                    <label style={{ fontSize: '0.85rem', fontWeight: 500, color: 'var(--text-secondary)' }}>Cột Phụ đề (Context)</label>
                    <input 
                      type="text" 
                      className="table-cell-input" 
                      style={{ border: '1px solid var(--border-color)', borderRadius: '4px', padding: '6px 12px' }}
                      value={followUpConfig.subtitleColumn || ''}
                      onChange={e => onUpdateFollowUpConfig({ ...followUpConfig, subtitleColumn: e.target.value })}
                      placeholder="VD: Customer Name"
                    />
                  </div>
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                  <label style={{ fontSize: '0.85rem', fontWeight: 500, color: 'var(--text-secondary)' }}>Tên cột Trạng thái</label>
                  <input 
                    type="text" 
                    className="table-cell-input" 
                    style={{ border: '1px solid var(--border-color)', borderRadius: '4px', padding: '6px 12px' }}
                    value={followUpConfig.statusColumn}
                    onChange={e => onUpdateFollowUpConfig({ ...followUpConfig, statusColumn: e.target.value })}
                    placeholder="VD: Status, Trạng thái"
                  />
                </div>
                
                <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                  <label style={{ fontSize: '0.85rem', fontWeight: 500, color: 'var(--text-secondary)' }}>Tên cột Ngày cập nhật cuối</label>
                  <input 
                    type="text" 
                    className="table-cell-input" 
                    style={{ border: '1px solid var(--border-color)', borderRadius: '4px', padding: '6px 12px' }}
                    value={followUpConfig.dateColumn}
                    onChange={e => onUpdateFollowUpConfig({ ...followUpConfig, dateColumn: e.target.value })}
                    placeholder="VD: Last update, Cập nhật lần cuối"
                  />
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                    <label style={{ fontSize: '0.85rem', fontWeight: 500, color: 'var(--text-secondary)' }}>Bỏ qua các Trạng thái (Đã xong)</label>
                    <input 
                      type="text" 
                      className="table-cell-input" 
                      style={{ border: '1px solid var(--border-color)', borderRadius: '4px', padding: '6px 12px' }}
                      value={followUpConfig.excludeStatuses || ''}
                      onChange={e => onUpdateFollowUpConfig({ ...followUpConfig, excludeStatuses: e.target.value })}
                      placeholder="VD: Won, Closed, MP, Done (Ngăn cách bằng dấu phẩy)"
                    />
                  </div>

                  <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                    <label style={{ fontSize: '0.85rem', fontWeight: 500, color: 'var(--text-secondary)' }}>Số ngày báo quá hạn (SLA)</label>
                    <input 
                      type="number" 
                      min="1"
                      className="table-cell-input" 
                      style={{ border: '1px solid var(--border-color)', borderRadius: '4px', padding: '6px 12px' }}
                      value={followUpConfig.slaDays}
                      onChange={e => onUpdateFollowUpConfig({ ...followUpConfig, slaDays: parseInt(e.target.value) || 3 })}
                    />
                  </div>
                </div>
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
