import { useState, useEffect, useDeferredValue, useMemo } from 'react';
import { Toolbar } from './components/Toolbar';
import { VirtualTable } from './components/VirtualTable';
import { Sidebar } from './components/Sidebar';
import { ImportDialog } from './components/ImportDialog';
import { SettingsDialog } from './components/SettingsDialog';
import { GlobalSearch } from './components/GlobalSearch';
import { AddDialog } from './components/AddDialog';
import { TimelineDrawer } from './components/TimelineDrawer';
import { HelpDialog } from './components/HelpDialog';
import { useExcelData } from './hooks/useExcelData';
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
  const [prioritizedColumn, setPrioritizedColumn] = useState<string | null>(null);

  const [timelineState, setTimelineState] = useState<{
    isOpen: boolean;
    recordId: number | null;
    projectId: number | null;
    recordTitle: string;
  }>({ isOpen: false, recordId: null, projectId: null, recordTitle: '' });
  
  const [searchQuery, setSearchQuery] = useState('');
  const deferredSearchQuery = useDeferredValue(searchQuery);

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
          <h1>{activeProjectId ? projects.find(p => p.id === activeProjectId)?.name : 'Excel Editor'}</h1>
          <Toolbar 
            onImport={onFileSelected}
            onExport={handleExport}
            onSave={saveChanges}
            hasUnsavedChanges={hasUnsavedChanges}
            searchQuery={searchQuery}
            onSearchChange={setSearchQuery}
            onOpenGlobalSearch={() => setIsGlobalSearchOpen(true)}
            onOpenAddDialog={() => setIsAddDialogOpen(true)}
            loading={loading}
            hasData={records.length > 0}
            theme={theme}
            onToggleTheme={toggleTheme}
          />
        </header>
        
        <main className="app-main">
          {loading && <div className="loading-overlay">Đang xử lý...</div>}
          
          {activeProjectId === null ? (
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
        onSearch={globalSearch}
        onSelectProject={(id) => {
          setActiveProjectId(id);
          setSearchQuery('');
          setPrioritizedColumn(null);
        }}
        onSelectRecord={(projectId, column, value) => {
          setActiveProjectId(projectId);
          setSearchQuery(value);
          setPrioritizedColumn(column);
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
