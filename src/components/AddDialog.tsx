import React, { useState, useEffect, useRef } from 'react';
import { Plus, X, Columns, Rows } from 'lucide-react';
import './GlobalSearch.css';

interface AddDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onAddColumn: (name: string) => void;
  onAddRow: () => void;
}

export function AddDialog({ isOpen, onClose, onAddColumn, onAddRow }: AddDialogProps) {
  const [type, setType] = useState<'column' | 'row'>('column');
  const [colName, setColName] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isOpen) {
      setType('column');
      setColName('');
      setTimeout(() => inputRef.current?.focus(), 10);
    }
  }, [isOpen]);

  const handleSubmit = (e?: React.FormEvent) => {
    e?.preventDefault();
    if (type === 'column') {
      if (colName.trim()) {
        onAddColumn(colName.trim());
        onClose();
      }
    } else {
      onAddRow();
      onClose();
    }
  };

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!isOpen) return;
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <div className="global-search-overlay" onClick={onClose} style={{ zIndex: 1000 }}>
      <div className="global-search-modal" onClick={e => e.stopPropagation()} style={{ padding: '20px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <h3 style={{ margin: 0, fontSize: '1.1rem', display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--text-primary)' }}>
            <Plus size={18} /> Thêm Dữ Liệu
          </h3>
          <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-secondary)' }}>
            <X size={18} />
          </button>
        </div>

        <div style={{ display: 'flex', gap: '8px' }}>
          <button 
            className={`btn ${type === 'column' ? 'btn-primary' : 'btn-outline'}`}
            style={{ flex: 1, height: '40px' }}
            onClick={() => { setType('column'); setTimeout(() => inputRef.current?.focus(), 10); }}
          >
            <Columns size={16} /> Thêm Cột
          </button>
          <button 
            className={`btn ${type === 'row' ? 'btn-primary' : 'btn-outline'}`}
            style={{ flex: 1, height: '40px' }}
            onClick={() => setType('row')}
          >
            <Rows size={16} /> Thêm Hàng
          </button>
        </div>

        {type === 'column' && (
          <form onSubmit={handleSubmit} style={{ display: 'flex', gap: '8px', marginTop: '8px' }}>
            <input
              ref={inputRef}
              type="text"
              className="input-text"
              style={{ flex: 1, height: '40px' }}
              placeholder="Nhập tên cột mới..."
              value={colName}
              onChange={e => setColName(e.target.value)}
            />
            <button type="submit" className="btn btn-primary" disabled={!colName.trim()} style={{ height: '40px' }}>
              OK ↵
            </button>
          </form>
        )}

        {type === 'row' && (
          <div style={{ display: 'flex', gap: '8px', marginTop: '8px' }}>
            <button className="btn btn-primary" style={{ width: '100%', height: '40px' }} onClick={() => handleSubmit()}>
              Xác nhận thêm 1 hàng trống ↵
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
