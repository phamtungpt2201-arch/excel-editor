import './ImportDialog.css';

interface ImportDialogProps {
  filename: string;
  onAppend: () => void;
  onNew: () => void;
  onCancel: () => void;
}

export function ImportDialog({ filename, onAppend, onNew, onCancel }: ImportDialogProps) {
  return (
    <div className="dialog-overlay">
      <div className="dialog-content">
        <h3>Import File Excel</h3>
        <p>Bạn muốn làm gì với dữ liệu từ file <strong>{filename}</strong>?</p>
        
        <div className="dialog-options">
          <button className="dialog-btn append" onClick={onAppend}>
            <strong>Gộp vào Project hiện tại</strong>
            <span>Thêm dữ liệu mới xuống dưới. Tự động thêm cột mới nếu có.</span>
          </button>
          
          <button className="dialog-btn new" onClick={onNew}>
            <strong>Tạo Project mới</strong>
            <span>Tạo một không gian làm việc mới hoàn toàn.</span>
          </button>
        </div>
        
        <div className="dialog-actions">
          <button className="cancel-btn" onClick={onCancel}>Hủy bỏ</button>
        </div>
      </div>
    </div>
  );
}
