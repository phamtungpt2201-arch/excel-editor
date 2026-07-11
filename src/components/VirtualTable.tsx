import React, { useRef, memo } from 'react';
import { useVirtualizer } from '@tanstack/react-virtual';
import type { ExcelRecord } from '../db';

interface VirtualTableProps {
  records: ExcelRecord[];
  headers: string[];
  onUpdateRecord: (id: number, key: string, value: string) => void;
  unsavedChanges?: Record<number, Record<string, string>>;
}

const Cell = memo(({ 
  recordId, 
  columnKey, 
  initialValue, 
  onUpdate,
  isUnsaved
}: { 
  recordId: number, 
  columnKey: string, 
  initialValue: string,
  onUpdate: (id: number, key: string, value: string) => void,
  isUnsaved?: boolean
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

  return (
    <input
      type="text"
      value={value}
      onChange={(e) => setValue(e.target.value)}
      onBlur={handleBlur}
      onKeyDown={handleKeyDown}
      className="table-cell-input"
      style={isUnsaved ? { fontWeight: 500, color: 'var(--primary-color)' } : {}}
    />
  );
});

export function VirtualTable({ records, headers, onUpdateRecord, unsavedChanges = {} }: VirtualTableProps) {
  const parentRef = useRef<HTMLDivElement>(null);

  const rowVirtualizer = useVirtualizer({
    count: records.length,
    getScrollElement: () => parentRef.current,
    estimateSize: () => 35, // 35px row height
    overscan: 10,
  });

  if (headers.length === 0 || records.length === 0) {
    return (
      <div className="empty-state">
        <p>Chưa có dữ liệu. Hãy import file Excel để bắt đầu.</p>
      </div>
    );
  }

  return (
    <div className="table-scroll-container" ref={parentRef}>
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
            {headers.map(header => (
                <div key={header} className="table-header-cell">{header}</div>
            ))}
        </div>
        
        {rowVirtualizer.getVirtualItems().map((virtualRow) => {
          const record = records[virtualRow.index];
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
                return (
                  <div 
                    key={`${record.id}-${header}`} 
                    className="table-cell"
                    style={isUnsaved ? { backgroundColor: 'rgba(59, 130, 246, 0.1)' } : {}}
                  >
                    <Cell
                      recordId={record.id!}
                      columnKey={header}
                      initialValue={displayValue}
                      onUpdate={onUpdateRecord}
                      isUnsaved={isUnsaved}
                    />
                  </div>
                );
              })}
            </div>
          );
        })}
      </div>
    </div>
  );
}
