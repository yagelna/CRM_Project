import React, { useCallback, useEffect, useRef, useState } from 'react';
import axiosInstance from '../AxiosInstance';
import { AgGridReact } from 'ag-grid-react';
import { AllCommunityModule, ModuleRegistry, themeQuartz } from 'ag-grid-community';
import Logo from '../assets/Icon-01.png';

ModuleRegistry.registerModules([AllCommunityModule]);

const CRMInteractions = () => {
  const gridRef = useRef();
  const [interactions, setInteractions] = useState([]);
  const [loading, setLoading] = useState(true);

  const myTheme = themeQuartz.withParams({
    browserColorScheme: 'light',
    headerBackgroundColor: '#5A34F1',
    headerTextColor: '#ffffff',
  });

  const colDefs = [
    { field: 'account_name', headerName: 'Account', flex: 1.2 },
    { field: 'type', headerName: 'Type', flex: 0.8 },
    { field: 'title', headerName: 'Title', flex: 1.4 },
    { field: 'direction', headerName: 'Direction', flex: 0.9 },
    {
      field: 'timestamp',
      headerName: 'Timestamp',
      flex: 1,
      valueFormatter: (params) => params.value ? new Date(params.value).toLocaleString() : ''
    },
    { field: 'added_by_name', headerName: 'Added By', flex: 1 },
  ];

  useEffect(() => {
    let isMounted = true;

    const fetchInteractions = async () => {
      try {
        setLoading(true);
        const response = await axiosInstance.get('/api/crm/interactions/');
        if (isMounted) {
          setInteractions(response.data);
        }
      } catch (error) {
        console.error('Failed to fetch CRM interactions:', error);
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    };

    fetchInteractions();

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
          <h2>CRM Interactions</h2>
          <p className="text-muted">All customer interactions in one place</p>
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
              rowData={interactions}
              theme={myTheme}
              defaultColDef={{ filter: true, flex: 1, resizable: true }}
              pagination={true}
              paginationPageSize={20}
              overlayLoadingTemplate={'<div class="text-primary"><div class="spinner-grow spinner-grow-sm me-1" role="status"></div><div class="spinner-grow spinner-grow-sm me-1" role="status"></div><div class="spinner-grow spinner-grow-sm" role="status"></div></br></br>Loading CRM interactions...</div>'}
              overlayNoRowsTemplate={`
                <div class="d-flex flex-column align-items-center text-primary justify-content-center" style="height: 100%;">
                  <img src="${Logo}" class="my-logo-fade" style="width: 48px; height: 48px;" />
                  <br/>
                  <span class="loading -text-purple">No CRM interactions yet</span>
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

export default CRMInteractions;