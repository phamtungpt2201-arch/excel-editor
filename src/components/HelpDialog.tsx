import { X, BookOpen, Search, FolderKanban } from 'lucide-react';
import './HelpDialog.css';

interface HelpDialogProps {
  onClose: () => void;
}

export function HelpDialog({ onClose }: HelpDialogProps) {
  return (
    <div className="dialog-overlay" onClick={onClose}>
      <div className="dialog-content help-dialog" onClick={e => e.stopPropagation()}>
        <div className="dialog-header">
          <h2>Hướng Dẫn Sử Dụng</h2>
          <button className="close-btn" onClick={onClose}><X size={20} /></button>
        </div>
        
        <div className="help-body">
          <div className="help-section">
            <h3><BookOpen size={18} className="help-icon"/> Quản Lý Sự Kiện (Tính Năng Lõi)</h3>
            <p>
              Đây là tính năng quan trọng nhất giúp bạn biến file Excel thông thường thành một hệ thống quản lý công việc (CRM) mini.
            </p>
            <ul>
              <li><strong>Ghi lại lịch sử:</strong> Bạn có thể theo dõi xem part này đã gửi báo giá lúc nào, gửi email cho ai, hay khi nào có đơn hàng (PO) mà không làm lộn xộn các ô Excel.</li>
              <li><strong>Tránh bỏ sót thông tin:</strong> Với giao diện dòng thời gian (Timeline) giống như Facebook hay Zalo, bạn dễ dàng vuốt lại xem quá trình tương tác từ cũ đến mới, thay vì phải đọc một đoạn text dài ngoằng.</li>
              <li><strong>Tự do tuỳ chỉnh:</strong> Cột "Sự kiện" nằm tách biệt, không bị xoá hay ảnh hưởng khi bạn tải file Excel xuống hoặc nhập file mới vào.</li>
            </ul>
          </div>

          <div className="help-section">
            <h3><Search size={18} className="help-icon"/> Tìm Kiếm Siêu Tốc (Ctrl + F)</h3>
            <p>
              Hệ thống tìm kiếm mạnh mẽ được chia làm 3 danh mục rõ ràng:
            </p>
            <ul>
              <li><strong>Dự án:</strong> Tìm nhanh các file Excel/Dự án đang làm việc.</li>
              <li><strong>Dữ liệu:</strong> Tìm Part Number, Tên Khách Hàng, hay bất kỳ nội dung nào trong bảng tính.</li>
              <li><strong>Sự kiện:</strong> Tìm kiếm vào tận sâu bên trong nội dung lịch sử ghi chú, và tự động liên kết tới Part Number đó. Cực kỳ hữu dụng khi bạn chỉ nhớ loáng thoáng một nội dung chat.</li>
            </ul>
          </div>

          <div className="help-section">
            <h3><FolderKanban size={18} className="help-icon"/> Quản Lý Dự Án & File</h3>
            <p>
              Tất cả các file của bạn được tự động lưu trữ trên trình duyệt của máy tính (offline).
            </p>
            <ul>
              <li>Nhấn <strong>Cài Đặt &gt; Sao lưu Dữ liệu</strong> để tải về file `.json` chứa TẤT CẢ thông tin bao gồm cả Sự kiện. Giữ file này cẩn thận để không bao giờ mất dữ liệu.</li>
              <li>Bảo mật 100%: Dữ liệu chỉ nằm trên máy của bạn, không gửi đi đâu cả.</li>
            </ul>
          </div>
        </div>

        <div className="dialog-actions">
          <button className="btn btn-primary" onClick={onClose}>Đã hiểu</button>
        </div>
      </div>
    </div>
  );
}
