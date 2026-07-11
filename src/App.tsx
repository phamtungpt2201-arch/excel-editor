import { useState } from 'react';
import { Toolbar } from './components/Toolbar';
import { VirtualTable } from './components/VirtualTable';
import { Sidebar } from './components/Sidebar';
import { ImportDialog } from './components/ImportDialog';
import { useExcelData } from './hooks/useExcelData';

function App() {
  const {
    projects,
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
    handleExport,
    handleAddColumn,
    updateRecord
  } = useExcelData();

  // Import Dialog State
  const [pendingImport, setPendingImport] = useState<{ filename: string, headers: string[], data: any[] } | null>(null);

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

  const handleAppend = async () => {
    if (!pendingImport || activeProjectId === null) return;
    await appendToProject(activeProjectId, pendingImport.headers, pendingImport.data);
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
        onSelectProject={setActiveProjectId}
        onDeleteProject={deleteProject}
      />
      
      <div className="app-container">
        <header className="app-header">
          <h1>Excel Editor {activeProjectId ? `- ${projects.find(p => p.id === activeProjectId)?.name}` : ''}</h1>
          <Toolbar 
            onImport={onFileSelected}
            onExport={handleExport}
            onAddColumn={handleAddColumn}
            onClear={() => {}} // Disabled clear data since deleteProject handles it
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
            />
          )}
        </main>
      </div>

      {pendingImport && (
        <ImportDialog 
          filename={pendingImport.filename}
          onAppend={handleAppend}
          onNew={handleCreateNew}
          onCancel={() => setPendingImport(null)}
        />
      )}
    </div>
  );
}

export default App;
