import React, { useState, useEffect, useRef, useCallback } from 'react';
import axiosInstance from '../AxiosInstance';
import { AgGridReact } from 'ag-grid-react';
import { AllCommunityModule, ModuleRegistry, themeQuartz } from 'ag-grid-community';
import StatusCellRenderer from '../components/quotes/StatusCellRenderer';
import ItemsCellRenderer from '../components/quotes/ItemsCellRenderer';
import QuoteModal from '../components/quotes/QuoteModal';
import QuoteOffcanvas from '../components/quotes/QuoteOffcanvas';

import Logo from '../assets/Icon-01.png';

// import QuoteOffcanvas from '../components/quotes/QuoteOffcanvas';

ModuleRegistry.registerModules([AllCommunityModule]);

const Quotes = () => {
    const [quotes, setQuotes] = useState([]);
    const [selectedQuote, setSelectedQuote] = useState(null);

    const gridRef = useRef();
    const myTheme = themeQuartz.withParams({
        browserColorScheme: "light",
        headerBackgroundColor: "#5A34F1",
        headerTextColor: "#ffffff",
    });

    const colDefs = [
        {
            field: 'id',
            headerName: 'ID',
            width: 80,
            valueFormatter: params => '#' + params.value.toString().padStart(5, '0'),
            filter: false,
            cellRenderer: (params) => (
                <a
                href='#quoteOffcanvas'
                data-bs-toggle='offcanvas'
                          className="link-opacity-50-hover fw-medium"
                onClick={() => {
                    setSelectedQuote(params.data);
                }
                }
                >
                    #{params.value.toString().padStart(5, '0')}
                </a>
            )

        },
        {
            field: 'crm_account_name',
            headerName: 'Contact',
            flex: 1,
        },
        {
            field: 'company_name',
            headerName: 'Company',
            flex: 1.2,
        },
        {
            field: 'status',
            headerName: 'Status',
            flex: 0.8,
            cellRenderer: "statusCellRenderer",
        },
        {
            field: 'items',
            headerName: 'Items',
            width: 120,
            valueGetter: params => params.data.items?.length || 0,
            cellRenderer: "itemsCellRenderer",
        },
        {
            field: 'created_at',
            headerName: 'Created At',
            flex: 1,
            valueFormatter: (params) => params.value ? new Date(params.value).toLocaleString() : '',
        },
        {
            field: 'sent_at',
            headerName: 'Sent At',
            flex: 1,
            valueFormatter: (params) => params.value ? new Date(params.value).toLocaleString() : 'Haven\'t sent yet',
        },
    ];


    const refetchSelectedQuote = async (quoteId) => {
        try {
            const res = await axiosInstance.get(`api/crm/quotes/${quoteId}/`);
            setSelectedQuote(res.data); // רענון הנתון שמוזן ל־Offcanvas
        } catch (error) {
            console.error('Failed to fetch updated quote:', error);
        }
    };

    const fetchQuotes = () => {
        axiosInstance.get('api/crm/quotes/')
            .then(res => setQuotes(res.data))
            .catch(err => console.error('Error fetching quotes: ', err));
    };

    useEffect(() => {
        fetchQuotes();
    }, []);

    const onFilterTextBoxChanged = useCallback(() => {
        gridRef.current.api.setGridOption(
            "quickFilterText",
            document.getElementById("filter-text-box").value
        );
    }, []);

    return (
        <div className='module-container'>
            <div className="d-flex justify-content-between align-items-center">
                <div>
                    <h2 className="mb-2">Quotes</h2>
                    <p className="text-muted">All strategic quotes sent to CRM clients</p>
                </div>
                <button
                    type="button"
                    className="btn btn-primary me-2"
                    data-bs-toggle="modal"
                    data-bs-target="#AddQuoteModal"
                >
                    + New Quote
                </button>
            </div>
            <div>
                <div className="d-flex justify-content-between align-items-center">
                            <input
                            type="text"
                            id="filter-text-box"
                            className="form-control"
                            placeholder="Quick Filter..."
                            onInput={onFilterTextBoxChanged}
                            style={{ width: '200px' }}
                        />
                </div>
            </div>

            <div className="card border-0 shadow-sm mb-4 mt-2">
                <div className="card-body p-2">
                    <div className="ag-theme-alpine" style={{ height: 650 }}>
                        <AgGridReact
                            ref={gridRef}
                            rowData={quotes}
                            columnDefs={colDefs}
                            theme={myTheme}
                            pagination={true}
                            paginationPageSize={20}
                            defaultColDef={{ flex: 1, filter: true }}
                            components={{
                                statusCellRenderer: StatusCellRenderer,
                                itemsCellRenderer: ItemsCellRenderer
                            }}
                            overlayNoRowsTemplate={`
                                <div class="d-flex flex-column align-items-center text-primary justify-content-center" style="height: 100%;">
                                <img src="${Logo}" class="my-logo-fade" style="width: 48px; height: 48px;" />
                                <br/>
                                <span class="loading -text-purple">Connecting The Dotz...</span>
                                </div>
                            `}
                            overlayLoadingTemplate={'<div class="text-primary"><div class="spinner-grow spinner-grow-sm me-1" role="status"></div><div class="spinner-grow spinner-grow-sm me-1" role="status"></div><div class="spinner-grow spinner-grow-sm" role="status"></div></br></br>Updating Data...</div>'}
                        />
                    </div>
                </div>
            </div>

            {/* Offcanvas (details modal) */}
            <QuoteModal id="AddQuoteModal" mode='create' handleUpdateQuotes={fetchQuotes} />
            <QuoteModal id="EditQuoteModal" mode='edit' quoteData={selectedQuote} handleUpdateQuotes={fetchQuotes} refetchQuote={refetchSelectedQuote} />
            <QuoteOffcanvas id="quoteOffcanvas" quote={selectedQuote} onClose={() => setSelectedQuote(null)} refresh={fetchQuotes} />
        </div>
    );
};

export default Quotes;
