import { useState, useEffect } from 'react';
import { Toolbar } from './components/Toolbar';
import { VirtualTable } from './components/VirtualTable';
import { Sidebar } from './components/Sidebar';
import { ImportDialog } from './components/ImportDialog';
import { SettingsDialog } from './components/SettingsDialog';
import { useExcelData } from './hooks/useExcelData';

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
    discardChanges
  } = useExcelData();

  const [pendingImport, setPendingImport] = useState<{
    filename: string,
    headers: string[],
    data: any[]
  } | null>(null);

  const [isSettingsOpen, setIsSettingsOpen] = useState(false);

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

  return (
    <div className="app-layout">
      <Sidebar 
        projects={projects}
        activeProjectId={activeProjectId}
        onSelectProject={handleSelectProject}
        onDeleteProject={deleteProject}
        onRenameProject={updateProjectName}
        onOpenSettings={() => setIsSettingsOpen(true)}
      />
      
      <div className="app-container">
        <header className="app-header">
          <h1>Excel Editor {activeProjectId ? `- ${projects.find(p => p.id === activeProjectId)?.name}` : ''}</h1>
          <Toolbar 
            onImport={onFileSelected}
            onExport={handleExport}
            onAddColumn={handleAddColumn}
            onSave={saveChanges}
            hasUnsavedChanges={hasUnsavedChanges}
            loading={loading}
            hasData={records.length > 0}
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
              records={records}
              headers={headers}
              onUpdateRecord={updateRecord}
              unsavedChanges={unsavedChanges}
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
    </div>
  );
}

export default App;
