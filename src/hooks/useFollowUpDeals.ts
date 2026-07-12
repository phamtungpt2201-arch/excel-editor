import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '../db';
import type { ExcelRecord, Project } from '../db';
import type { FollowUpConfig } from '../components/SettingsDialog';

export interface FollowUpDeal {
  record: ExcelRecord;
  project: Project;
  daysOverdue: number;
  lastUpdateStr: string;
  isNew: boolean;
}

// Hàm parse Excel Date (cả định dạng số Serial và chuỗi Date)
function parseExcelDate(value: any): Date | null {
  if (!value) return null;
  
  // Nếu là số (Excel Serial Date)
  if (typeof value === 'number') {
    // Excel tính số ngày từ 01/01/1900 (có bug năm nhuận 1900 nên thực chất là 30/12/1899)
    const excelEpoch = new Date(1899, 11, 30).getTime();
    const daysInMs = value * 24 * 60 * 60 * 1000;
    return new Date(excelEpoch + daysInMs);
  }

  // Nếu là chuỗi
  if (typeof value === 'string') {
    const trimmed = value.trim();
    if (!trimmed) return null;
    
    // Thử parse bằng Date.parse (chuẩn ISO yyyy-mm-dd hoặc mm/dd/yyyy)
    const d = new Date(trimmed);
    if (!isNaN(d.getTime())) return d;

    // Thử parse định dạng DD/MM/YYYY thường gặp ở VN
    const parts = trimmed.split(/[-/]/);
    if (parts.length === 3) {
      const d1 = parseInt(parts[0], 10);
      const d2 = parseInt(parts[1], 10);
      const d3 = parseInt(parts[2], 10);
      // Giả sử là DD/MM/YYYY
      if (d1 <= 31 && d2 <= 12 && d3 >= 1900) {
        return new Date(d3, d2 - 1, d1);
      }
    }
  }

  return null;
}

export function useFollowUpDeals(config: FollowUpConfig, projectId?: number): { active: FollowUpDeal[]; completed: FollowUpDeal[] } {
  const { statusColumn, dateColumn, slaDays, excludeStatuses } = config;

  const deals = useLiveQuery<{ active: FollowUpDeal[]; completed: FollowUpDeal[] }>(async () => {
    if (!statusColumn || !dateColumn) return { active: [] as FollowUpDeal[], completed: [] as FollowUpDeal[] };

    const excludeSet = new Set(
      (excludeStatuses || '')
        .split(',')
        .map(s => s.trim().toLowerCase())
        .filter(s => s.length > 0)
    );

    let allRecords;
    if (projectId) {
      allRecords = await db.records.where('projectId').equals(projectId).toArray();
    } else {
      allRecords = await db.records.toArray();
    }
    
    const allProjects = await db.projects.toArray();
    const projectMap = new Map(allProjects.map(p => [p.id, p]));

    const now = new Date();
    // Reset giờ phút giây để tính ngày tròn
    now.setHours(0, 0, 0, 0);

    const followUpList: FollowUpDeal[] = [];
    const completedList: FollowUpDeal[] = [];

    for (const record of allRecords) {
      // Bỏ qua nếu deal này là một dòng nháp hoàn toàn trống rỗng
      const hasAnyData = Object.keys(record).some(k => k !== 'id' && k !== 'projectId' && record[k]);
      if (!hasAnyData) continue;

      const getVal = (col: string) => {
        if (record[col] !== undefined) return record[col];
        const key = Object.keys(record).find(k => k.toLowerCase() === col.toLowerCase());
        return key ? record[key] : undefined;
      };

      const statusValue = getVal(statusColumn) || '';
      const statusLower = String(statusValue).toLowerCase().trim();
      const isExcluded = statusLower && excludeSet.has(statusLower);

      const dateValue = getVal(dateColumn);
      
      let isNew = false;
      let daysOverdue = 0;
      let parsedDate: Date | null = null;

      // 1. Kiểm tra New RFQ (Không có ngày cập nhật, hoặc trạng thái có chứa chữ New)
      const isStatusNew = String(statusValue).toLowerCase().includes('new');
      if (!dateValue || isStatusNew) {
        isNew = true;
        // Gắn số ngày ảo để ưu tiên lên đầu (VD: quá hạn 999 ngày)
        daysOverdue = 9999;
      } else {
        // 2. Tính số ngày quá hạn
        parsedDate = parseExcelDate(dateValue);
        if (parsedDate) {
          parsedDate.setHours(0, 0, 0, 0);
          const diffTime = now.getTime() - parsedDate.getTime();
          const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));
          
          if (diffDays > slaDays) {
            daysOverdue = diffDays;
          }
        } else {
          // Ngày tháng không hợp lệ -> coi như New
          isNew = true;
          daysOverdue = 9999;
        }
      }

      const project = projectMap.get(record.projectId);
      if (!project) continue;

      const lastUpdateStr = isNew ? 'Chưa cập nhật / RFQ Mới' : (parsedDate ? parsedDate.toLocaleDateString('vi-VN') : String(dateValue));

      if (isExcluded) {
        // Luôn coi deal thuộc exclude là completed
        let diffDays = 0;
        if (parsedDate) {
          const diffTime = now.getTime() - parsedDate.getTime();
          diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));
        }
        if (diffDays <= 90) {
          completedList.push({
            record,
            project,
            daysOverdue: diffDays,
            lastUpdateStr,
            isNew: false
          });
        }
      } else if (daysOverdue > 0) {
        // Cần xử lý
        followUpList.push({
          record,
          project,
          daysOverdue,
          lastUpdateStr,
          isNew
        });
      } else {
        // Không quá hạn (mới cập nhật) -> đã xử lý
        let diffDays = 0;
        if (parsedDate) {
          const diffTime = now.getTime() - parsedDate.getTime();
          diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));
        }
        if (diffDays <= 90) {
          completedList.push({
            record,
            project,
            daysOverdue: diffDays,
            lastUpdateStr,
            isNew: false
          });
        }
      }
    }

    // Sort: daysOverdue giảm dần (lâu nhất xếp trên)
    followUpList.sort((a, b) => b.daysOverdue - a.daysOverdue);
    // Sort completed: mới nhất xếp trên (tính theo timestamp của parsedDate)
    completedList.sort((a, b) => {
      const dateA = parseExcelDate(a.record[dateColumn])?.getTime() || 0;
      const dateB = parseExcelDate(b.record[dateColumn])?.getTime() || 0;
      return dateB - dateA;
    });

    return { active: followUpList, completed: completedList };
  }, [statusColumn, dateColumn, slaDays, excludeStatuses, projectId]); // dependencies trigger re-run

  return deals || { active: [] as FollowUpDeal[], completed: [] as FollowUpDeal[] };
}
