import React, { useRef, memo } from 'react';
import { useVirtualizer } from '@tanstack/react-virtual';
import type { ExcelRecord } from '../db';

interface VirtualTableProps {
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
  isUnsaved,
  isSearchMatch
}: { 
  recordId: number, 
  columnKey: string, 
  initialValue: string,
  onUpdate: (id: number, key: string, value: string) => void,
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

  const style: React.CSSProperties = {};
  if (isUnsaved) {
    style.fontWeight = 500;
    style.color = 'var(--primary-color)';
  }
  if (isSearchMatch) {
    style.color = '#000'; // Đen để tương phản với nền vàng
  }

  return (
    <input
      type="text"
      value={value}
      onChange={(e) => setValue(e.target.value)}
      onBlur={handleBlur}
      onKeyDown={handleKeyDown}
      className="table-cell-input"
      style={style}
    />
  );
});

export function VirtualTable({ records, headers, onUpdateRecord, unsavedChanges = {}, searchQuery = '' }: VirtualTableProps) {
  const parentRef = useRef<HTMLDivElement>(null);

  const rowVirtualizer = useVirtualizer({
    count: records.length,
    getScrollElement: () => parentRef.current,
    estimateSize: () => 35, // 35px row height
    overscan: 10,
  });

  const sq = searchQuery.toLowerCase().trim();

  // Tự động cuộn đến kết quả đầu tiên khi search
  React.useEffect(() => {
    if (!sq || records.length === 0) return;

    for (let rIndex = 0; rIndex < records.length; rIndex++) {
      const record = records[rIndex];
      const changes = unsavedChanges[record.id!] || {};
      
      for (let cIndex = 0; cIndex < headers.length; cIndex++) {
        const h = headers[cIndex];
        const val = (changes[h] !== undefined ? changes[h] : record[h]) || '';
        
        if (String(val).toLowerCase().includes(sq)) {
          // Found match! Scroll to it.
          rowVirtualizer.scrollToIndex(rIndex, { align: 'center', behavior: 'smooth' });
          // Note: horizontal scroll is omitted for simplicity as useVirtualizer is only tracking vertical for now,
          // but we can scroll parentRef horizontally
          if (parentRef.current) {
            const targetLeft = cIndex * 150;
            parentRef.current.scrollTo({ left: targetLeft, behavior: 'smooth' });
          }
          return;
        }
      }
    }
  }, [sq, records, unsavedChanges, headers, rowVirtualizer]);

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
                const strVal = String(displayValue || '');
                const isSearchMatch = sq ? strVal.toLowerCase().includes(sq) : false;

                let bgColor = isUnsaved ? 'rgba(59, 130, 246, 0.1)' : undefined;
                if (isSearchMatch) {
                  bgColor = '#fde047'; // Vàng tươi
                }

                return (
                  <div 
                    key={`${record.id}-${header}`} 
                    className="table-cell"
                    style={{ backgroundColor: bgColor }}
                  >
                    <Cell
                      recordId={record.id!}
                      columnKey={header}
                      initialValue={strVal}
                      onUpdate={onUpdateRecord}
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
  );
}
