import { useState, useEffect, useRef, useMemo } from 'react';
import { Search, FolderKanban, FileSpreadsheet, X } from 'lucide-react';
import './GlobalSearch.css';

export interface GlobalSearchResult {
  projects: Array<{ id?: number; name: string }>;
  records: Array<{
    projectId: number;
    projectName: string;
    recordId: number;
    column: string;
    value: string;
  }>;
}

interface GlobalSearchProps {
  isOpen: boolean;
  onClose: () => void;
  onSearch: (keyword: string) => Promise<GlobalSearchResult>;
  onSelectProject: (projectId: number) => void;
  onSelectRecord: (projectId: number, column: string, value: string) => void;
}

export function GlobalSearch({ isOpen, onClose, onSearch, onSelectProject, onSelectRecord }: GlobalSearchProps) {
  const [keyword, setKeyword] = useState('');
  const [results, setResults] = useState<GlobalSearchResult>({ projects: [], records: [] });
  const [loading, setLoading] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);

  const flatResults = useMemo(() => [
    ...results.projects.map(p => ({ type: 'project' as const, data: p })),
    ...results.records.map(r => ({ type: 'record' as const, data: r }))
  ], [results]);

  useEffect(() => {
    if (isOpen) {
      setTimeout(() => inputRef.current?.focus(), 10);
      setKeyword('');
      setResults({ projects: [], records: [] });
      setSelectedIndex(0);
    }
  }, [isOpen]);

  useEffect(() => {
    if (!keyword.trim()) {
      setResults({ projects: [], records: [] });
      return;
    }
    
    setLoading(true);
    const delay = setTimeout(async () => {
      const res = await onSearch(keyword);
      setResults(res);
      setSelectedIndex(0);
      setLoading(false);
    }, 300);

    return () => clearTimeout(delay);
  }, [keyword, onSearch]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!isOpen) return;
      if (e.key === 'Escape') {
        onClose();
      } else if (e.key === 'ArrowDown') {
        e.preventDefault();
        setSelectedIndex(prev => (prev + 1) % Math.max(1, flatResults.length));
      } else if (e.key === 'ArrowUp') {
        e.preventDefault();
        setSelectedIndex(prev => (prev - 1 + flatResults.length) % Math.max(1, flatResults.length));
      } else if (e.key === 'Enter') {
        e.preventDefault();
        const selected = flatResults[selectedIndex];
        if (selected) {
          if (selected.type === 'project') {
            onSelectProject((selected.data as any).id);
          } else {
            const data = selected.data as any;
            onSelectRecord(data.projectId, data.column, data.value);
          }
          onClose();
        }
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, flatResults, selectedIndex, onClose, onSelectProject, onSelectRecord]);

  if (!isOpen) return null;

  return (
    <div className="global-search-overlay" onClick={onClose}>
      <div className="global-search-modal" onClick={e => e.stopPropagation()}>
        <div className="global-search-input-wrapper">
          <Search className="search-icon" size={20} />
          <input
            ref={inputRef}
            type="text"
            className="global-search-input"
            placeholder="Tìm kiếm mọi thứ..."
            value={keyword}
            onChange={(e) => setKeyword(e.target.value)}
          />
          <button className="close-btn" onClick={onClose}><X size={20} /></button>
        </div>
        
        {keyword.trim() && (
          <div className="global-search-results">
            {loading && <div className="loading-text">Đang tìm kiếm...</div>}
            {!loading && flatResults.length === 0 && (
              <div className="empty-text">Không tìm thấy kết quả nào.</div>
            )}
            
            {!loading && results.projects.length > 0 && (
              <div className="result-group">
                <div className="group-title">Dự án</div>
                {results.projects.map((p) => {
                  const globalIdx = flatResults.findIndex(r => r.type === 'project' && r.data.id === p.id);
                  return (
                    <div 
                      key={`proj-${p.id}`} 
                      className={`result-item ${globalIdx === selectedIndex ? 'selected' : ''}`}
                      onClick={() => {
                         onSelectProject(p.id!);
                         onClose();
                      }}
                      onMouseEnter={() => setSelectedIndex(globalIdx)}
                    >
                      <FolderKanban size={16} />
                      <span className="item-name">{p.name}</span>
                    </div>
                  );
                })}
              </div>
            )}

            {!loading && results.records.length > 0 && (
              <div className="result-group">
                <div className="group-title">Dữ liệu</div>
                {results.records.map((r) => {
                  const globalIdx = flatResults.findIndex(item => item.type === 'record' && (item.data as any).recordId === r.recordId && (item.data as any).column === r.column);
                  return (
                    <div 
                      key={`rec-${r.recordId}-${r.column}`} 
                      className={`result-item record-item ${globalIdx === selectedIndex ? 'selected' : ''}`}
                      onClick={() => {
                         onSelectRecord(r.projectId, r.column, r.value);
                         onClose();
                      }}
                      onMouseEnter={() => setSelectedIndex(globalIdx)}
                    >
                      <FileSpreadsheet size={16} className="icon-record" />
                      <div className="record-details">
                        <div className="record-value">{r.value}</div>
                        <div className="record-meta">Cột "{r.column}" · Dự án "{r.projectName}"</div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
