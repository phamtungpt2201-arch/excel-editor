
import { Toolbar } from './components/Toolbar';
import { VirtualTable } from './components/VirtualTable';
import { useExcelData } from './hooks/useExcelData';

function App() {
  const {
    records,
    headers,
    loading,
    handleImport,
    handleExport,
    handleAddColumn,
    updateRecord,
    clearData
  } = useExcelData();

  return (
    <div className="app-container">
      <header className="app-header">
        <h1>Excel Editor</h1>
        <Toolbar 
          onImport={handleImport}
          onExport={handleExport}
          onAddColumn={handleAddColumn}
          onClear={clearData}
          loading={loading}
          hasData={records.length > 0}
        />
      </header>
      
      <main className="app-main">
        {loading && <div className="loading-overlay">Đang xử lý...</div>}
        <VirtualTable 
          records={records}
          headers={headers}
          onUpdateRecord={updateRecord}
        />
      </main>
    </div>
  );
}

export default App;
