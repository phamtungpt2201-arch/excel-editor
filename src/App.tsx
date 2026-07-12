import { useState, useEffect, useDeferredValue, useMemo } from 'react';
import { Bell, FileSpreadsheet } from 'lucide-react';
import { Toolbar } from './components/Toolbar';
import { VirtualTable } from './components/VirtualTable';
import { Sidebar } from './components/Sidebar';
import { ImportDialog } from './components/ImportDialog';
import { SettingsDialog } from './components/SettingsDialog';
import { GlobalSearch } from './components/GlobalSearch';
import { AddDialog } from './components/AddDialog';
import { TimelineDrawer } from './components/TimelineDrawer';
import { HelpDialog } from './components/HelpDialog';
import { FollowUpDashboard } from './components/FollowUpDashboard';
import { useExcelData } from './hooks/useExcelData';
import { useFollowUpDeals } from './hooks/useFollowUpDeals';
import type { FollowUpConfig } from './components/SettingsDialog';
import { db } from './db';

function App() {
  const {
    projects,
    totalRecords,
    activeProjectId,
    setActiveProjectId,
    records,
    headers,
    loading,
    setLoading,
    isDBLoading,
    parseExcelFile,
    createNewProject,
    appendToProject,
    deleteProject,
    updateProjectName,
    handleExport,
    handleAddColumn,
    updateRecord,
    exportAllToJson,
    importAllFromJson,
    factoryReset,
    unsavedChanges,
    hasUnsavedChanges,
    saveChanges,
    discardChanges,
    globalSearch,
    handleAddRow,
    timelineCounts
  } = useExcelData();

  const [pendingImport, setPendingImport] = useState<{
    filename: string,
    headers: string[],
    data: any[]
  } | null>(null);

  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [isHelpOpen, setIsHelpOpen] = useState(false);
  const [isGlobalSearchOpen, setIsGlobalSearchOpen] = useState(false);
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [projectTab, setProjectTab] = useState<'data' | 'followup'>('data');
  const [prioritizedColumn, setPrioritizedColumn] = useState<string | null>(null);

  const [followUpConfig, setFollowUpConfig] = useState<FollowUpConfig>(() => {
    const defaults = { 
      statusColumn: 'Status', 
      dateColumn: 'Last update', 
      slaDays: 3,
      titleColumn: 'Part number',
      subtitleColumn: 'Customer Name',
      excludeStatuses: 'Won, Lost, Closed, Cancelled, Dropped, Done, MP, Mass production'
    };
    const saved = localStorage.getItem('followUpConfig');
    if (saved) {
      try { 
        const parsed = JSON.parse(saved);
        return { ...defaults, ...parsed };
      } catch (e) {}
    }
    return defaults;
  });

  useEffect(() => {
    localStorage.setItem('followUpConfig', JSON.stringify(followUpConfig));
  }, [followUpConfig]);

  const { active: followUpDeals, completed: completedDeals } = useFollowUpDeals(followUpConfig, activeProjectId || undefined);



  const [timelineState, setTimelineState] = useState<{
    isOpen: boolean;
    recordId: number | null;
    projectId: number | null;
    recordTitle: string;
  }>({ isOpen: false, recordId: null, projectId: null, recordTitle: '' });
  
  const [searchQuery, setSearchQuery] = useState('');
  const deferredSearchQuery = useDeferredValue(searchQuery);

  // Handle outside click for Timeline Drawer
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (timelineState.isOpen) {
        const drawer = document.querySelector('.timeline-drawer');
        if (drawer && !drawer.contains(e.target as Node) && !(e.target as Element).closest('.follow-up-row')) {
          setTimelineState(prev => ({ ...prev, isOpen: false }));
        }
      }
    };
    
    if (timelineState.isOpen) {
      setTimeout(() => document.addEventListener('click', handleClickOutside), 100);
    }
    
    return () => {
      document.removeEventListener('click', handleClickOutside);
    };
  }, [timelineState.isOpen]);

  // Fetch recordTitle if only recordId is provided
  useEffect(() => {
    if (timelineState.isOpen && timelineState.recordId && !timelineState.recordTitle) {
      db.records.get(timelineState.recordId).then(record => {
        if (record && followUpConfig.titleColumn) {
          setTimelineState(prev => ({ ...prev, recordTitle: String(record[followUpConfig.titleColumn] || 'Không có tiêu đề') }));
        }
      });
    }
  }, [timelineState.isOpen, timelineState.recordId, followUpConfig.titleColumn]);

  const displayHeaders = useMemo(() => {
    if (!prioritizedColumn || !headers.includes(prioritizedColumn)) return headers;
    return [prioritizedColumn, ...headers.filter(h => h !== prioritizedColumn)];
  }, [headers, prioritizedColumn]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'f') {
        e.preventDefault();
        setIsGlobalSearchOpen(true);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);
  
  const [theme, setTheme] = useState<'light' | 'dark'>(() => {
    return (localStorage.getItem('theme') as 'light' | 'dark') || 'light';
  });

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
    localStorage.setItem('theme', theme);
  }, [theme]);

  const toggleTheme = () => {
    setTheme(prev => prev === 'light' ? 'dark' : 'light');
  };

  // Chặn reload trang hoặc tắt tab khi chưa lưu
  useEffect(() => {
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      if (hasUnsavedChanges) {
        e.preventDefault();
        e.returnValue = ''; // Yêu cầu đối với một số trình duyệt
      }
    };
    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => window.removeEventListener('beforeunload', handleBeforeUnload);
  }, [hasUnsavedChanges]);

  // Xử lý chuyển Project an toàn
  const handleSelectProject = (projectId: number) => {
    if (hasUnsavedChanges) {
      if (!window.confirm("Bạn có thay đổi chưa được lưu. Nếu chuyển trang, mọi thay đổi chưa lưu sẽ bị mất. Bạn có chắc chắn muốn tiếp tục?")) {
        return;
      }
      discardChanges();
    }
    setActiveProjectId(projectId);
    setProjectTab('data');
  };

  const onFileSelected = async (file: File) => {
    setLoading(true);
    try {
      const parsed = await parseExcelFile(file);
      if (activeProjectId !== null) {
        // Hỏi người dùng nếu đang có Project mở
        setPendingImport(parsed);
      } else {
        // Tự động tạo mới nếu chưa có Project nào
        await createNewProject(parsed.filename, parsed.headers, parsed.data);
      }
    } catch (error) {
      console.error(error);
      alert("Đã có lỗi khi đọc file Excel.");
    } finally {
      setLoading(false);
    }
  };

  const handleAppend = async (targetProjectId: number) => {
    if (!pendingImport) return;
    await appendToProject(targetProjectId, pendingImport.headers, pendingImport.data);
    setPendingImport(null);
  };

  const handleCreateNew = async () => {
    if (!pendingImport) return;
    await createNewProject(pendingImport.filename, pendingImport.headers, pendingImport.data);
    setPendingImport(null);
  };

  const handleAddProjectFromExcel = async (file: File) => {
    setLoading(true);
    try {
      const parsed = await parseExcelFile(file);
      await createNewProject(parsed.filename, parsed.headers, parsed.data);
    } catch (error) {
      console.error(error);
      alert("Đã có lỗi khi đọc file Excel.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="app-layout">
      <Sidebar 
        projects={projects}
        activeProjectId={activeProjectId}
        onSelectProject={handleSelectProject}
        onDeleteProject={deleteProject}
        onRenameProject={updateProjectName}
        onOpenSettings={() => setIsSettingsOpen(true)}
        onOpenHelp={() => setIsHelpOpen(true)}
        onAddProjectFromExcel={handleAddProjectFromExcel}
      />
      
      <div className="app-container">
        <header className="app-header">
          <div style={{ display: 'flex', alignItems: 'center', gap: '24px' }}>
            <h1>
              {activeProjectId 
                ? projects.find(p => p.id === activeProjectId)?.name 
                : 'Excel Editor'}
            </h1>
            
            {activeProjectId && (
              <div style={{ display: 'flex', gap: '12px' }}>
                <button
                  className="btn btn-outline"
                  onClick={() => setProjectTab('data')}
                  style={{ 
                    display: 'flex', alignItems: 'center', gap: '8px', 
                    backgroundColor: projectTab === 'data' ? 'var(--bg-surface)' : 'transparent', 
                    color: projectTab === 'data' ? 'var(--text-primary)' : 'var(--text-secondary)', 
                    borderColor: projectTab === 'data' ? 'var(--text-primary)' : 'var(--border-color)' 
                  }}
                >
                  <FileSpreadsheet size={16} /> Data
                </button>
                <button
                  className="btn btn-outline"
                  onClick={() => setProjectTab('followup')}
                  style={{ 
                    display: 'flex', alignItems: 'center', gap: '8px', 
                    backgroundColor: projectTab === 'followup' ? 'var(--bg-surface)' : 'transparent', 
                    color: projectTab === 'followup' ? 'var(--text-primary)' : 'var(--text-secondary)', 
                    borderColor: projectTab === 'followup' ? 'var(--text-primary)' : 'var(--border-color)' 
                  }}
                >
                  <Bell size={16} /> Smart Follow-up
                  {followUpDeals.length > 0 && (
                    <span style={{ 
                      backgroundColor: projectTab === 'followup' ? 'var(--text-primary)' : 'var(--border-color)', 
                      color: projectTab === 'followup' ? 'var(--bg-color)' : 'var(--text-secondary)', 
                      padding: '2px 8px', 
                      borderRadius: '12px', 
                      fontSize: '0.8rem', 
                      fontWeight: 'bold',
                      marginLeft: '4px'
                    }}>
                      {followUpDeals.length}
                    </span>
                  )}
                </button>
              </div>
            )}
          </div>
          {(projectTab === 'data' || projectTab === 'followup') && activeProjectId && (
            <Toolbar 
              onImport={onFileSelected}
              onExport={handleExport}
              onSave={saveChanges}
              hasUnsavedChanges={hasUnsavedChanges}
              loading={loading}
              hasData={records.length > 0}
              searchQuery={searchQuery}
              onSearchChange={setSearchQuery}
              onOpenGlobalSearch={() => setIsGlobalSearchOpen(true)}
              onOpenAddDialog={() => setIsAddDialogOpen(true)}
              theme={theme}
              onToggleTheme={toggleTheme}
              projectTab={projectTab}
            />
          )}
        </header>
        
        <main className="app-main">
          {loading && <div className="loading-overlay">Đang xử lý...</div>}
          
          {activeProjectId && projectTab === 'followup' ? (
            <FollowUpDashboard
              deals={followUpDeals}
              completedDeals={completedDeals}
              statusColumn={followUpConfig.statusColumn}
              dateColumn={followUpConfig.dateColumn}
              titleColumn={followUpConfig.titleColumn}
              subtitleColumn={followUpConfig.subtitleColumn}
              prioritizedColumn={prioritizedColumn}
              searchQuery={deferredSearchQuery}
              onOpenTimeline={(recordId, projectId, recordTitle) => {
                setTimelineState({ isOpen: true, recordId, projectId, recordTitle });
              }}
            />
          ) : activeProjectId === null ? (
             <div className="empty-state">
               <p>Hãy chọn một Project ở bên trái hoặc Import file Excel mới.</p>
             </div>
          ) : isDBLoading ? (
            <div className="empty-state">
              <p>Đang tải dữ liệu từ hệ thống...</p>
            </div>
          ) : (
            <VirtualTable 
              projectId={activeProjectId!}
              records={records}
              headers={displayHeaders}
              onUpdateRecord={updateRecord}
              unsavedChanges={unsavedChanges}
              searchQuery={deferredSearchQuery}
              timelineCounts={timelineCounts}
              prioritizedColumn={prioritizedColumn}
              onSetPrioritizedColumn={setPrioritizedColumn}
              onOpenTimeline={(recordId, projectId, recordTitle) => {
                setTimelineState({ isOpen: true, recordId, projectId, recordTitle });
              }}
            />
          )}
        </main>
      </div>

      {pendingImport && (
        <ImportDialog 
          filename={pendingImport.filename}
          projects={projects}
          activeProjectId={activeProjectId}
          onAppend={handleAppend}
          onNew={handleCreateNew}
          onCancel={() => setPendingImport(null)}
        />
      )}

      {isSettingsOpen && (
        <SettingsDialog 
          totalProjects={projects.length}
          totalRecords={totalRecords}
          followUpConfig={followUpConfig}
          onUpdateFollowUpConfig={setFollowUpConfig}
          onExportBackup={exportAllToJson}
          onImportBackup={(file) => {
            importAllFromJson(file);
            setIsSettingsOpen(false);
          }}
          onExportExcel={handleExport}
          onFactoryReset={() => {
            factoryReset();
            setIsSettingsOpen(false);
          }}
          onClose={() => setIsSettingsOpen(false)}
        />
      )}

      {isHelpOpen && (
        <HelpDialog onClose={() => setIsHelpOpen(false)} />
      )}
      
      <GlobalSearch 
        isOpen={isGlobalSearchOpen}
        onClose={() => setIsGlobalSearchOpen(false)}
        placeholder={projectTab === 'followup' ? `Chỉ tìm theo ${followUpConfig.titleColumn || 'Part Number'}...` : 'Tìm kiếm mọi thứ...'}
        onSearch={async (keyword) => {
          if (projectTab === 'followup') {
            const q = keyword.toLowerCase();
            const filtered = followUpDeals.filter(d => {
              let title = '';
              if (followUpConfig.titleColumn) {
                const exact = d.record[followUpConfig.titleColumn];
                if (exact) {
                  title = String(exact).toLowerCase();
                } else {
                  const key = Object.keys(d.record).find(k => k.toLowerCase() === followUpConfig.titleColumn!.toLowerCase());
                  if (key && d.record[key]) title = String(d.record[key]).toLowerCase();
                }
              }
              if (!title) {
                const keys = Object.keys(d.record).filter(k => !['id', 'projectId', 'stt', 'no', 'no.'].includes(k.toLowerCase()));
                if (keys.length > 0 && d.record[keys[0]]) title = String(d.record[keys[0]]).toLowerCase();
              }
              return title.includes(q);
            });
            return {
              projects: [],
              timelines: [],
              records: filtered.map(d => {
                let col = followUpConfig.titleColumn || '';
                let val = d.record[col] || '';
                if (!val) {
                  const keys = Object.keys(d.record).filter(k => !['id', 'projectId', 'stt', 'no', 'no.'].includes(k.toLowerCase()));
                  col = keys[0];
                  val = d.record[col] || '';
                }
                return {
                  projectId: d.project.id!,
                  projectName: d.project.name,
                  recordId: d.record.id!,
                  column: col,
                  value: String(val)
                };
              })
            };
          }
          return globalSearch(keyword);
        }}
        onSelectProject={(id) => {
          setActiveProjectId(id);
          setSearchQuery('');
          setPrioritizedColumn(null);
          setProjectTab('data');
        }}
        onSelectRecord={(projectId, column, value) => {
          setActiveProjectId(projectId);
          setSearchQuery(value);
          setPrioritizedColumn(column);
          if (projectTab !== 'followup') {
            setProjectTab('data');
          }
        }}
        onSelectTimeline={async (projectId, recordId) => {
          setActiveProjectId(projectId);
          setSearchQuery('');
          setPrioritizedColumn(null);
          // Wait for state to settle before opening drawer
          setTimeout(async () => {
             const record = await db.records.get(recordId);
             const title = record ? String(record[headers[0]] || 'Không tên') : 'Nhật ký';
             setTimelineState({ isOpen: true, recordId, projectId, recordTitle: title });
          }, 100);
        }}
      />

      <AddDialog 
        isOpen={isAddDialogOpen}
        onClose={() => setIsAddDialogOpen(false)}
        onAddColumn={handleAddColumn}
        onAddRow={handleAddRow}
      />

      <TimelineDrawer 
        isOpen={timelineState.isOpen}
        onClose={() => setTimelineState(prev => ({ ...prev, isOpen: false }))}
        recordId={timelineState.recordId}
        projectId={timelineState.projectId}
        recordTitle={timelineState.recordTitle}
      />
    </div>
  );
}

export default App;
