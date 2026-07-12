import { useState } from 'react';
import { CalendarClock, CheckCircle, Users } from 'lucide-react';
import { db } from '../db';
import type { FollowUpDeal } from '../hooks/useFollowUpDeals';

interface FollowUpDashboardProps {
  deals: FollowUpDeal[];
  completedDeals: FollowUpDeal[];
  statusColumn: string;
  dateColumn: string;
  titleColumn?: string;
  subtitleColumn?: string;
  prioritizedColumn: string | null;
  searchQuery: string;
  onOpenTimeline?: (recordId: number, projectId: number, recordTitle: string) => void;
}

export function FollowUpDashboard({ 
  deals,
  completedDeals,
  statusColumn,
  dateColumn,
  titleColumn,
  subtitleColumn,
  prioritizedColumn,
  searchQuery,
  onOpenTimeline
}: FollowUpDashboardProps) {
  const [activeTab, setActiveTab] = useState<'active' | 'completed'>('active');
  const [editingStatus, setEditingStatus] = useState<number | null>(null);
  const [tempStatus, setTempStatus] = useState("");

  const handleUpdateStatus = async (deal: FollowUpDeal) => {
    if (tempStatus === String(deal.record[statusColumn] || '')) {
      setEditingStatus(null);
      return;
    }

    const today = new Date();
    const dd = String(today.getDate()).padStart(2, '0');
    const mm = String(today.getMonth() + 1).padStart(2, '0');
    const yyyy = today.getFullYear();
    const todayStr = `${dd}/${mm}/${yyyy}`;

    try {
      await db.records.update(deal.record.id!, {
        [statusColumn]: tempStatus,
        [dateColumn]: todayStr
      });
      setEditingStatus(null);
    } catch (e) {
      console.error(e);
      alert("Lỗi khi cập nhật trạng thái");
    }
  };

  const getTitle = (deal: FollowUpDeal) => {
    if (titleColumn) {
      const exact = deal.record[titleColumn];
      if (exact) return exact;
      const key = Object.keys(deal.record).find(k => k.toLowerCase() === titleColumn.toLowerCase());
      if (key && deal.record[key]) return deal.record[key];
    }
    if (prioritizedColumn && deal.record[prioritizedColumn]) {
      return deal.record[prioritizedColumn];
    }
    const keys = Object.keys(deal.record).filter(k => !['id', 'projectId', 'stt', 'no', 'no.'].includes(k.toLowerCase()));
    if (keys.length > 0 && deal.record[keys[0]]) {
      return deal.record[keys[0]];
    }
    return `ID: ${deal.record.id}`;
  };

  const getSubtitle = (deal: FollowUpDeal) => {
    if (subtitleColumn) {
      const exact = deal.record[subtitleColumn];
      if (exact) return exact;
      const key = Object.keys(deal.record).find(k => k.toLowerCase() === subtitleColumn.toLowerCase());
      if (key && deal.record[key]) return deal.record[key];
    }
    return null;
  };

  const currentDeals = activeTab === 'active' ? deals : completedDeals;

  const filteredDeals = currentDeals.filter(deal => {
    if (!searchQuery) return true;
    const q = searchQuery.toLowerCase();
    const title = String(getTitle(deal)).toLowerCase();
    return title.includes(q);
  });

  const groups = {
    newRFQs: [] as FollowUpDeal[],
    week: [] as FollowUpDeal[],
    month: [] as FollowUpDeal[],
    quarter: [] as FollowUpDeal[],
    older: [] as FollowUpDeal[],
    compToday: [] as FollowUpDeal[],
    compYesterday: [] as FollowUpDeal[],
    compWeek: [] as FollowUpDeal[],
    compMonth: [] as FollowUpDeal[],
    compQuarter: [] as FollowUpDeal[],
  };

  filteredDeals.forEach(deal => {
    if (activeTab === 'completed') {
      if (deal.daysOverdue === 0) groups.compToday.push(deal);
      else if (deal.daysOverdue === 1) groups.compYesterday.push(deal);
      else if (deal.daysOverdue <= 7) groups.compWeek.push(deal);
      else if (deal.daysOverdue <= 30) groups.compMonth.push(deal);
      else groups.compQuarter.push(deal);
    } else if (deal.isNew || deal.daysOverdue >= 9999) {
      groups.newRFQs.push(deal);
    } else if (deal.daysOverdue <= 7) {
      groups.week.push(deal);
    } else if (deal.daysOverdue <= 30) {
      groups.month.push(deal);
    } else if (deal.daysOverdue <= 90) {
      groups.quarter.push(deal);
    } else {
      groups.older.push(deal);
    }
  });

  const displayGroups = activeTab === 'completed'
    ? [
        { id: 'today', title: 'Hôm nay', items: groups.compToday, color: '#10b981' },
        { id: 'yesterday', title: 'Hôm qua', items: groups.compYesterday, color: '#059669' },
        { id: 'week', title: '1 Tuần trước', items: groups.compWeek, color: '#047857' },
        { id: 'month', title: '1 Tháng trước', items: groups.compMonth, color: '#065f46' },
        { id: 'quarter', title: '3 Tháng trước', items: groups.compQuarter, color: '#064e3b' },
      ].filter(g => g.items.length > 0)
    : [
        { id: 'new', title: 'Mới / Cần Cập Nhật (Trống ngày / Sai định dạng)', items: groups.newRFQs, color: '#3b82f6' },
        { id: 'week', title: 'Quá hạn trong Tuần (1-7 ngày)', items: groups.week, color: '#f59e0b' },
        { id: 'month', title: 'Quá hạn trong Tháng (8-30 ngày)', items: groups.month, color: '#f97316' },
        { id: 'quarter', title: 'Quá hạn trong Quý (31-90 ngày)', items: groups.quarter, color: '#ef4444' },
        { id: 'older', title: 'Quá hạn Xa hơn (> 90 ngày)', items: groups.older, color: '#7f1d1d' }
      ].filter(g => g.items.length > 0);

  return (
    <div style={{ padding: '24px', backgroundColor: 'var(--bg-color)', height: '100%', overflowY: 'auto', display: 'flex', flexDirection: 'column' }}>
      <div style={{ display: 'flex', gap: '8px', marginBottom: '24px', borderBottom: '1px solid var(--border-color)', paddingBottom: '12px' }}>
        <button
          onClick={() => setActiveTab('active')}
          style={{
            padding: '8px 16px',
            backgroundColor: activeTab === 'active' ? 'var(--primary-color)' : 'transparent',
            color: activeTab === 'active' ? '#fff' : 'var(--text-secondary)',
            border: 'none',
            borderRadius: '6px',
            cursor: 'pointer',
            fontWeight: 600,
            transition: 'all 0.2s'
          }}
        >
          Cần xử lý ({deals.length})
        </button>
        <button
          onClick={() => setActiveTab('completed')}
          style={{
            padding: '8px 16px',
            backgroundColor: activeTab === 'completed' ? '#10b981' : 'transparent',
            color: activeTab === 'completed' ? '#fff' : 'var(--text-secondary)',
            border: 'none',
            borderRadius: '6px',
            cursor: 'pointer',
            fontWeight: 600,
            transition: 'all 0.2s'
          }}
        >
          Đã hoàn thành ({completedDeals.length})
        </button>
      </div>
      {filteredDeals.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '60px 20px', color: 'var(--text-secondary)', flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center', backgroundColor: 'var(--bg-surface)', borderRadius: '12px', border: '1px dashed var(--border-color)' }}>
          <CheckCircle size={64} color="#10b981" style={{ marginBottom: '24px', opacity: 0.8 }} />
          <h3 style={{ fontSize: '1.2rem', marginBottom: '8px', color: 'var(--text-primary)' }}>Mọi thứ đã được xử lý xong!</h3>
          <p>Danh sách Follow-up của bạn hiện đang trống.</p>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          {displayGroups.map(group => (
            <div key={group.id} style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              <div style={{ 
                display: 'flex', alignItems: 'center', gap: '8px', 
                padding: '12px 24px 8px 24px', 
                margin: '0 -24px',
                borderBottom: `2px solid ${group.color}40`,
                backgroundColor: 'var(--bg-color)',
                position: 'sticky',
                top: '-24px',
                zIndex: 10
              }}>
                <div style={{ width: '12px', height: '12px', borderRadius: '50%', backgroundColor: group.color }}></div>
                <h3 style={{ margin: 0, fontSize: '1.05rem', color: 'var(--text-primary)', fontWeight: 600 }}>{group.title} <span style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', fontWeight: 400 }}>({group.items.length})</span></h3>
              </div>
              
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0' }}>
                {Object.entries(
                  group.items.reduce((acc, deal) => {
                    const customer = getSubtitle(deal) || 'Khác';
                    if (!acc[customer]) acc[customer] = [];
                    acc[customer].push(deal);
                    return acc;
                  }, {} as Record<string, typeof group.items>)
                ).map(([customer, deals]) => (
                  <div key={customer} style={{ display: 'flex', flexDirection: 'column', gap: '0' }}>
                    {/* Customer Header */}
                    <div style={{ 
                      padding: '4px 16px 4px 32px', 
                      fontWeight: 600,
                      fontSize: '14px',
                      color: 'var(--text-primary)', 
                      borderBottom: '1px solid var(--border-color)', 
                      backgroundColor: 'var(--bg-surface)' 
                    }}>
                      <Users size={14} style={{ display: 'inline', marginRight: '6px', verticalAlign: 'text-bottom', color: 'var(--text-secondary)' }} />
                      {customer} <span style={{ fontSize: '13px', color: 'var(--text-secondary)', fontWeight: 'normal' }}>({deals.length})</span>
                    </div>

                    {/* Deals under customer */}
                    {deals.map(deal => (
                      <div 
                        key={deal.record.id} 
                        className="follow-up-row"
                        onClick={() => onOpenTimeline?.(deal.record.id!, deal.project.id!, getTitle(deal))}
                        style={{ 
                          padding: '2px 16px 2px 64px', // Thụt lề sâu hơn cho part number, giảm padding dọc
                          display: 'flex',
                          alignItems: 'center',
                          gap: '12px',
                          cursor: 'pointer',
                          transition: 'background-color 0.15s ease',
                          borderBottom: '1px solid var(--border-color)',
                        }}
                        onMouseEnter={e => e.currentTarget.style.backgroundColor = 'var(--bg-surface-hover)'}
                        onMouseLeave={e => e.currentTarget.style.backgroundColor = 'transparent'}
                      >
                        {/* Part Number */}
                        <div style={{ width: '40%', display: 'flex', alignItems: 'center', gap: '8px', minWidth: 0 }}>
                          <span style={{ fontWeight: 500, color: 'var(--text-primary)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', fontSize: '14px' }}>
                            {getTitle(deal)}
                          </span>
                        </div>
                        
                        {/* Last Update */}
                        <div style={{ flex: 1, fontSize: '14px', color: 'var(--text-secondary)', display: 'flex', alignItems: 'center', gap: '6px' }}>
                          <CalendarClock size={14} /> 
                          <span style={{ color: deal.isNew ? '#3b82f6' : 'inherit' }}>{deal.lastUpdateStr}</span>
                        </div>

                        {/* Status Input */}
                        <div 
                          style={{ width: '250px', flexShrink: 0 }}
                          onClick={(e) => e.stopPropagation()} 
                        >
                          {editingStatus === deal.record.id ? (
                            <div style={{ display: 'flex' }}>
                              <input 
                                autoFocus
                                type="text" 
                                className="table-cell-input"
                                style={{ border: '2px solid var(--primary-color)', borderRadius: '4px', padding: '2px 6px', fontSize: '14px', width: '100%', backgroundColor: 'var(--bg-surface)', outline: 'none' }}
                                value={tempStatus}
                                onChange={e => setTempStatus(e.target.value)}
                                onKeyDown={e => {
                                  if (e.key === 'Enter') handleUpdateStatus(deal);
                                  if (e.key === 'Escape') setEditingStatus(null);
                                }}
                                onBlur={() => handleUpdateStatus(deal)}
                                placeholder="Nhập trạng thái mới..."
                              />
                            </div>
                          ) : (
                            <div 
                              style={{ cursor: 'text', color: 'var(--text-primary)', padding: '2px 6px', backgroundColor: 'var(--bg-color)', border: '1px solid transparent', borderRadius: '4px', fontSize: '14px', display: 'flex', alignItems: 'center', minHeight: '24px', transition: 'border-color 0.2s', fontWeight: 500 }}
                              onClick={(e) => {
                                e.stopPropagation();
                                setTempStatus(String(deal.record[statusColumn] || ''));
                                setEditingStatus(deal.record.id!);
                              }}
                              onMouseEnter={e => e.currentTarget.style.borderColor = 'var(--border-color)'}
                              onMouseLeave={e => e.currentTarget.style.borderColor = 'transparent'}
                              title="Click để đổi trạng thái"
                            >
                              {deal.record[statusColumn] ? (
                                <span>{deal.record[statusColumn]}</span>
                              ) : (
                                <span style={{ color: 'var(--text-secondary)', fontStyle: 'italic' }}>Chưa có trạng thái...</span>
                              )}
                            </div>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
