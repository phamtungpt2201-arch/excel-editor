import React, { useState, useRef, useEffect } from 'react';
import { db } from '../db';
import type { TimelineEventType } from '../db';
import { useLiveQuery } from 'dexie-react-hooks';
import { X, Mail, FileText, Users, DollarSign, StickyNote, Trash2, Send, Handshake } from 'lucide-react';
import './TimelineDrawer.css';

interface TimelineDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  recordId: number | null;
  projectId: number | null;
  recordTitle: string;
}

const TYPE_ICONS: Record<TimelineEventType, React.ReactNode> = {
  email: <Mail size={20} />,
  meeting: <Users size={20} />,
  quote: <FileText size={20} />,
  negotiation: <Handshake size={20} />,
  note: <StickyNote size={20} />,
  po: <DollarSign size={20} />
};

const TYPE_LABELS: Record<TimelineEventType, string> = {
  email: 'Email',
  meeting: 'Họp',
  quote: 'Báo giá',
  negotiation: 'Đàm phán',
  note: 'Ghi chú',
  po: 'Có PO'
};

export function TimelineDrawer({ isOpen, onClose, recordId, projectId, recordTitle }: TimelineDrawerProps) {
  const [activeType, setActiveType] = useState<TimelineEventType>('note');
  const [content, setContent] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  // Focus input when opened
  useEffect(() => {
    if (isOpen) {
      setTimeout(() => inputRef.current?.focus(), 300); // Wait for transition
    }
  }, [isOpen]);

  // Fetch events for this record
  const events = useLiveQuery(
    () => {
      if (!recordId) return [];
      return db.timelines
        .where('recordId')
        .equals(recordId)
        .reverse()
        .sortBy('timestamp');
    },
    [recordId]
  ) || [];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!content.trim() || !recordId || !projectId) return;

    setIsSubmitting(true);
    try {
      await db.timelines.add({
        recordId,
        projectId,
        type: activeType,
        content: content.trim(),
        timestamp: Date.now()
      });
      setContent('');
      // Keep focus
      inputRef.current?.focus();
    } catch (err) {
      console.error(err);
      alert('Không thể lưu sự kiện.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async (id?: number) => {
    if (!id) return;
    if (confirm('Bạn có chắc muốn xoá sự kiện này?')) {
      await db.timelines.delete(id);
    }
  };

  const formatDate = (ts: number) => {
    const d = new Date(ts);
    return `${d.toLocaleDateString('vi-VN')} ${d.toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' })}`;
  };

  return (
    <>
      <div className={`timeline-drawer-overlay ${isOpen ? 'open' : ''}`} onClick={onClose} />
      
      <div className={`timeline-drawer ${isOpen ? 'open' : ''}`}>
        <div className="timeline-header">
          <div className="timeline-header-content">
            <h3 className="timeline-header-title">{recordTitle || 'Không có tên'}</h3>
            <p className="timeline-header-subtitle">Nhật ký & Tiến độ</p>
          </div>
          <button className="timeline-close-btn" onClick={onClose}>
            <X size={20} />
          </button>
        </div>

        <div className="timeline-content">
          {events.length === 0 ? (
            <div className="timeline-empty">
              Chưa có sự kiện nào. Hãy thêm sự kiện đầu tiên bên dưới!
            </div>
          ) : (
            <div className="timeline-list">
              {events.map(ev => (
                <div key={ev.id} className={`timeline-item type-${ev.type}`}>
                  <div className="timeline-item-icon-wrapper">
                    {TYPE_ICONS[ev.type]}
                  </div>
                  <div className="timeline-item-content">
                    <button 
                      className="timeline-item-delete"
                      onClick={() => handleDelete(ev.id)}
                      title="Xoá sự kiện"
                    >
                      <Trash2 size={14} />
                    </button>
                    <div className="timeline-item-header">
                      <span className="timeline-item-type">{TYPE_LABELS[ev.type]}</span>
                      <span className="timeline-item-date">{formatDate(ev.timestamp)}</span>
                    </div>
                    <p className="timeline-item-text">{ev.content}</p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="timeline-input-area">
          <div className="timeline-type-selector">
            {(Object.keys(TYPE_LABELS) as TimelineEventType[]).map(type => (
              <button
                key={type}
                className={`timeline-type-btn type-${type} ${activeType === type ? 'active' : ''}`}
                onClick={() => setActiveType(type)}
              >
                {React.cloneElement(TYPE_ICONS[type] as React.ReactElement<any>, { size: 14 })}
                {TYPE_LABELS[type]}
              </button>
            ))}
          </div>
          
          <form className="timeline-input-wrapper" onSubmit={handleSubmit}>
            <input 
              ref={inputRef}
              type="text" 
              placeholder="Nhập nội dung sự kiện..." 
              value={content}
              onChange={e => setContent(e.target.value)}
              disabled={isSubmitting}
            />
            <button 
              type="submit" 
              className="timeline-submit-btn"
              disabled={!content.trim() || isSubmitting}
              title="Thêm sự kiện"
            >
              <Send size={16} />
            </button>
          </form>
        </div>
      </div>
    </>
  );
}
