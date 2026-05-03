import React, { useCallback, useEffect, useRef, useState } from 'react';
import axiosInstance from '../AxiosInstance';
import { AgGridReact } from 'ag-grid-react';
import { AllCommunityModule, ModuleRegistry, themeQuartz } from 'ag-grid-community';
import Logo from '../assets/Icon-01.png';

ModuleRegistry.registerModules([AllCommunityModule]);

const CRMTasks = () => {
  const gridRef = useRef();
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);

  const myTheme = themeQuartz.withParams({
    browserColorScheme: 'light',
    headerBackgroundColor: '#5A34F1',
    headerTextColor: '#ffffff',
  });

  const colDefs = [
    { field: 'account_name', headerName: 'Account', flex: 1.2 },
    { field: 'title', headerName: 'Title', flex: 1.4 },
    { field: 'priority', headerName: 'Priority', flex: 0.8 },
    {
      field: 'due_date',
      headerName: 'Due Date',
      flex: 1,
      valueFormatter: (params) => params.value ? new Date(params.value).toLocaleDateString() : ''
    },
    { field: 'is_completed', headerName: 'Completed', flex: 0.9 },
    { field: 'added_by_name', headerName: 'Added By', flex: 1 },
  ];

  useEffect(() => {
    let isMounted = true;

    const fetchTasks = async () => {
      try {
        setLoading(true);
        const response = await axiosInstance.get('/api/crm/tasks/');
        if (isMounted) {
          setTasks(response.data);
        }
      } catch (error) {
        console.error('Failed to fetch CRM tasks:', error);
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    };

    fetchTasks();

    return () => {
      isMounted = false;
    };
  }, []);

  const onFilterTextBoxChanged = useCallback(() => {
    gridRef.current.api.setGridOption(
      'quickFilterText',
      document.getElementById('filter-text-box').value,
    );
  }, []);

  return (
    <div className='module-container'>
      <div className="d-flex justify-content-between align-items-center">
        <div>
          <h2>CRM Tasks</h2>
          <p className="text-muted">All customer tasks in one place</p>
        </div>
      </div>

      <div className="mb-2 d-flex align-items-center">
        <input
          type="text"
          id="filter-text-box"
          className="form-control"
          placeholder="Filter..."
          onInput={onFilterTextBoxChanged}
          style={{ width: '200px' }}
        />
      </div>

      <div className="card border-0 shadow-sm mb-4 mt-2">
        <div className="card-body p-2">
          <div className="ag-theme-quartz" style={{ height: 650, width: '100%' }}>
            <AgGridReact
              ref={gridRef}
              columnDefs={colDefs}
              rowData={tasks}
              theme={myTheme}
              defaultColDef={{ filter: true, flex: 1, resizable: true }}
              pagination={true}
              paginationPageSize={20}
              overlayLoadingTemplate={'<div class="text-primary"><div class="spinner-grow spinner-grow-sm me-1" role="status"></div><div class="spinner-grow spinner-grow-sm me-1" role="status"></div><div class="spinner-grow spinner-grow-sm" role="status"></div></br></br>Loading CRM tasks...</div>'}
              overlayNoRowsTemplate={`
                <div class="d-flex flex-column align-items-center text-primary justify-content-center" style="height: 100%;">
                  <img src="${Logo}" class="my-logo-fade" style="width: 48px; height: 48px;" />
                  <br/>
                  <span class="loading -text-purple">No CRM tasks yet</span>
                </div>
              `}
              loading={loading}
            />
          </div>
        </div>
      </div>
    </div>
  );
};

export default CRMTasks;