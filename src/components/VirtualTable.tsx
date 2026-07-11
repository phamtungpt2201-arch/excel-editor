import React, { useRef, memo } from 'react';
import { useVirtualizer } from '@tanstack/react-virtual';
import type { ExcelRecord } from '../db';

interface VirtualTableProps {
  projectId: number;
  records: ExcelRecord[];
  headers: string[];
  onUpdateRecord: (id: number, key: string, value: string) => void;
  unsavedChanges?: Record<number, Record<string, string>>;
  searchQuery?: string;
}

const Cell = memo(({ 
  recordId, 
  columnKey, 
  initialValue, 
  onUpdate,
  onActive,
  isUnsaved,
  isSearchMatch
}: { 
  recordId: number, 
  columnKey: string, 
  initialValue: string,
  onUpdate: (id: number, key: string, value: string) => void,
  onActive: (id: number, key: string, value: string) => void,
  isUnsaved?: boolean,
  isSearchMatch?: boolean
}) => {
  const [value, setValue] = React.useState(initialValue);

  React.useEffect(() => {
    setValue(initialValue);
  }, [initialValue]);

  const handleBlur = () => {
    if (value !== initialValue) {
      onUpdate(recordId, columnKey, value);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      e.currentTarget.blur();
    }
  };

  const handleFocus = () => {
    onActive(recordId, columnKey, value);
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newVal = e.target.value;
    setValue(newVal);
    onActive(recordId, columnKey, newVal);
  };

  const style: React.CSSProperties = {};
  if (isUnsaved) {
    style.fontWeight = 500;
    style.color = 'var(--primary-color)';
  }
  if (isSearchMatch) {
    // Không làm gì cả, chỉ cần nền sáng là đủ theo yêu cầu của user
  }

  return (
    <input
      type="text"
      value={value}
      onChange={handleChange}
      onBlur={handleBlur}
      onFocus={handleFocus}
      onKeyDown={handleKeyDown}
      className="table-cell-input"
      style={style}
    />
  );
});

export function VirtualTable({ projectId, records, headers, onUpdateRecord, unsavedChanges = {}, searchQuery = '' }: VirtualTableProps) {
  const parentRef = useRef<HTMLDivElement>(null);
  const [activeCell, setActiveCell] = React.useState<{ recordId: number, column: string, value: string } | null>(null);
  const [columnWidths, setColumnWidths] = React.useState<Record<string, number>>({});

  React.useEffect(() => {
    const saved = localStorage.getItem(`colWidths_proj_${projectId}`);
    if (saved) {
      try {
        setColumnWidths(JSON.parse(saved));
      } catch {
        // ignore parse error
      }
    } else {
      setColumnWidths({});
    }
  }, [projectId]);

  const handleMouseDown = (e: React.MouseEvent, header: string) => {
    e.preventDefault();
    const startX = e.pageX;
    const currentWidth = columnWidths[header] || 150;
    
    // Thêm class 'resizing' để đổi màu resizer đang kéo
    const resizerEl = e.currentTarget as HTMLDivElement;
    resizerEl.classList.add('resizing');

    const handleMouseMove = (moveEvent: MouseEvent) => {
      const newWidth = Math.max(50, currentWidth + (moveEvent.pageX - startX));
      setColumnWidths(prev => ({ ...prev, [header]: newWidth }));
    };

    const handleMouseUp = () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
      resizerEl.classList.remove('resizing');
      
      setColumnWidths(prev => {
        const updated = { ...prev };
        localStorage.setItem(`colWidths_proj_${projectId}`, JSON.stringify(updated));
        return updated;
      });
    };

    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);
  };

  const handleActiveCell = React.useCallback((id: number, key: string, val: string) => {
    setActiveCell({ recordId: id, column: key, value: val });
  }, []);

  const sq = searchQuery.toLowerCase().trim();

  const filteredRecords = React.useMemo(() => {
    if (!sq) return records;
    return records.filter(record => {
      const changes = unsavedChanges[record.id!] || {};
      for (let cIndex = 0; cIndex < headers.length; cIndex++) {
        const h = headers[cIndex];
        const val = (changes[h] !== undefined ? changes[h] : record[h]) || '';
        if (String(val).toLowerCase().includes(sq)) return true;
      }
      return false;
    });
  }, [records, sq, headers, unsavedChanges]);

  const rowVirtualizer = useVirtualizer({
    count: filteredRecords.length,
    getScrollElement: () => parentRef.current,
    estimateSize: () => 35, // 35px row height
    overscan: 10,
  });

  // Update activeCell value if the underlying record changes (e.g. from formula bar or cell blur)
  React.useEffect(() => {
    if (activeCell) {
      const record = records.find(r => r.id === activeCell.recordId);
      if (record) {
        const changes = unsavedChanges[record.id!] || {};
        const currentVal = (changes[activeCell.column] !== undefined ? changes[activeCell.column] : record[activeCell.column]) || '';
        if (currentVal !== activeCell.value) {
           // We don't auto-update activeCell.value here to avoid cursor jumping while typing in the cell,
           // because the cell manages its own state until blur.
           // Actually, if it's from the formula bar, activeCell is already updated.
           // If it's from another source, we might need to sync. We'll leave it as is.
        }
      }
    }
  }, [activeCell, unsavedChanges, records]);

  if (headers.length === 0 || records.length === 0) {
    return (
      <div className="empty-state">
        <p>Chưa có dữ liệu. Hãy import file Excel để bắt đầu.</p>
      </div>
    );
  }

  if (filteredRecords.length === 0 && sq) {
    return (
      <div className="empty-state">
        <p>Không tìm thấy kết quả phù hợp cho "{searchQuery}".</p>
      </div>
    );
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', width: '100%' }}>
      {/* Formula Bar */}
      <div className="formula-bar" style={{ display: 'flex', padding: '8px 16px', borderBottom: '1px solid var(--border-color)', backgroundColor: 'var(--bg-surface)', alignItems: 'center', gap: '12px' }}>
        <div style={{ fontStyle: 'italic', fontWeight: 'bold', color: 'var(--primary-color)', userSelect: 'none', fontSize: '1.1rem' }}>fx</div>
        <div style={{ flex: 1, display: 'flex', background: 'var(--bg-color)', borderRadius: '24px', border: '1px solid var(--border-color)', overflow: 'hidden' }}>
          <input 
            style={{ 
              flex: 1, 
              border: 'none', 
              padding: '8px 16px', 
              background: 'transparent', 
              color: 'var(--text-primary)', 
              outline: 'none',
              fontSize: '14px'
            }}
          placeholder="Chọn một ô để xem và chỉnh sửa dữ liệu đầy đủ..."
          value={activeCell ? activeCell.value : ''}
          disabled={!activeCell}
          onChange={(e) => {
            if (activeCell) {
              const newValue = e.target.value;
              setActiveCell({ ...activeCell, value: newValue });
              onUpdateRecord(activeCell.recordId, activeCell.column, newValue);
            }
          }}
        />
        </div>
      </div>

      <div className="table-scroll-container" ref={parentRef} style={{ flex: 1 }}>
        <div
        className="table-inner"
        style={{
          height: `${rowVirtualizer.getTotalSize() + 35}px`, // +35px for header
          width: 'max-content',
          minWidth: '100%',
          position: 'relative',
        }}
      >
        <div className="table-header" style={{ position: 'sticky', top: 0, zIndex: 10, height: '35px' }}>
            <div className="table-header-cell row-num-cell">#</div>
            {headers.map(header => {
              const width = columnWidths[header] || 150;
              return (
                <div 
                  key={header} 
                  className="table-header-cell"
                  style={{ width: `${width}px`, minWidth: `${width}px`, flex: `0 0 ${width}px` }}
                >
                  {header}
                  <div 
                    className="resizer" 
                    onMouseDown={(e) => handleMouseDown(e, header)}
                  />
                </div>
              );
            })}
        </div>
        
        {rowVirtualizer.getVirtualItems().map((virtualRow) => {
          const record = filteredRecords[virtualRow.index];
          const recordChanges = unsavedChanges[record.id!] || {};
          return (
            <div
              key={virtualRow.index}
              className="table-row"
              style={{
                position: 'absolute',
                top: 0,
                left: 0,
                width: '100%',
                height: `${virtualRow.size}px`,
                transform: `translateY(${virtualRow.start + 35}px)`,
              }}
            >
              <div className="table-cell row-num-cell">
                {virtualRow.index + 1}
              </div>
              {headers.map((header) => {
                const isUnsaved = recordChanges.hasOwnProperty(header);
                const displayValue = isUnsaved ? recordChanges[header] : (record[header] || '');
                const strVal = String(displayValue || '');
                const isSearchMatch = sq ? strVal.toLowerCase().includes(sq) : false;

                let bgColor = isUnsaved ? 'var(--bg-surface-hover)' : undefined;
                if (isSearchMatch) {
                  bgColor = 'var(--highlight-color)';
                }

                const width = columnWidths[header] || 150;

                return (
                  <div 
                    key={`${record.id}-${header}`} 
                    className="table-cell"
                    style={{ backgroundColor: bgColor, width: `${width}px`, minWidth: `${width}px`, flex: `0 0 ${width}px` }}
                  >
                    <Cell
                      recordId={record.id!}
                      columnKey={header}
                      initialValue={strVal}
                      onUpdate={onUpdateRecord}
                      onActive={handleActiveCell}
                      isUnsaved={isUnsaved}
                      isSearchMatch={isSearchMatch}
                    />
                  </div>
                );
              })}
            </div>
          );
        })}
      </div>
    </div>
    </div>
  );
}
