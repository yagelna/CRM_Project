import React, { useState, useEffect, useCallback, useRef } from 'react';
import axiosInstance from '../AxiosInstance';
import AddInventoryModal from '../components/inventory/AddInventoryModal';
import UploadBulkModal from '../components/inventory/UploadBulkModal';
import BulkEditModal from '../components/inventory/BulkEditModal';
import ExportModal from '../components/inventory/ExportModal';
import InventoryOffcanvas from '../components/inventory/InventoryOffcanvas';
import { AgGridReact } from 'ag-grid-react';
import { AllCommunityModule, ModuleRegistry, themeQuartz } from 'ag-grid-community';
import ActionCellRenderer from '../components/ActionCellRenderer';

ModuleRegistry.registerModules([AllCommunityModule]);

const Inventory = () => {
    const [inventory, setInventory] = useState([]);
    const [inventoryData, setInventoryData] = useState(null);
    const [archiveData, setArchiveData] = useState(null);
    const [selectedItem, setSelectedItem] = useState(null);
    const [selectedRows, setSelectedRows] = useState([]);
    const [showArchive, setShowArchive] = useState(false); // false = inventory, true = archive
    const gridRef = useRef();
    const myTheme = themeQuartz
        .withParams({
            browserColorScheme: "light",
            headerBackgroundColor: "#5A34F1",
            headerTextColor: "#ffffff",
        });

    const toggleInventoryView = () => {
        setShowArchive(prev => {
            const newValue = !prev;
            setSelectedRows([]); // clear selected rows when toggling
            return newValue;
        });
    };

    // delete selected rows 
    const handleDelete = async (ids) => {
        if (!ids) return;

        const isMultiple = Array.isArray(ids);
        const confirmed = window.confirm(`Are you sure you want to delete ${isMultiple ? ids.length : 1} item(s)?`);

        if (!confirmed) return;

        const url = isMultiple ? `api/inventory/bulk-delete/` : `api/inventory/${ids}/`;
        const data = isMultiple ? { ids } : null;

        try {
            const res = await axiosInstance.delete(url, { data });
            console.log(res.data);

            setInventory(prevInventory =>
                isMultiple
                    ? prevInventory.filter(item => !ids.includes(item.id))
                    : prevInventory.filter(item => item.id !== ids)
            );

            if (showArchive) {
                setArchiveData(null);
            } else {
                setInventoryData(null);
            }
            fetchInventory(true);   // force fetch
            setSelectedRows([]);
        } catch (error) {
            console.error("Delete failed", error);
        }
    };

    const handleArchive = async (ids) => {
        console.log("ids: ", ids);

        if (!ids) {
            console.error("No ids provided for archiving");
            return;

        }
        const confirmed = window.confirm(`Are you sure you want to archive ${ids.length} item(s)?`);

        if (!confirmed) return;

        try {
            const res = await axiosInstance.post('api/archive/archive/', { ids });
            console.log(res.data);

            setInventory(prevInventory =>
                prevInventory.filter(item => !ids.includes(item.id))
            );
            setInventoryData(null);
            fetchInventory(true);
            setSelectedRows([]);
        }
        catch (error) {
            console.error("Archive failed", error);
        }
    };



    // const handleArchive = async () => {
    //     if (selectedRows.length === 0) return;

    //     if(window.confirm(`Are you sure you want to archive ${selectedRows.length} item(s)?`)){
    //         const ids = selectedRows.map(row => row.id);
    //         try {
    //             const res = await axiosInstance.post('api/archive/archive/', { ids });
    //             console.log(res.data);
    //             setInventory(prevInventory => prevInventory.filter(item => !ids.includes(item.id)));
    //             setSelectedRows([]);
    //         } catch (error) {
    //             console.error("Archive failed", error);
    //         }
    //     }
    // };

    const handleDeleteSelected = () => {
        console.log("delete selected rows");
        if (selectedRows.length > 0) {
            const ids = selectedRows.map(row => row.id);
            handleDelete(ids);
        }
    };

    const handleArchiveSelected = () => {
        console.log("archive selected rows");
        if (selectedRows.length > 0) {
            const ids = selectedRows.map(row => row.id);
            handleArchive(ids);
        }
    };

    const handleRestore = async () => {
        if (selectedRows.length === 0) return;

        if (window.confirm(`Are you sure you want to restore ${selectedRows.length} item(s)?`)) {
            const ids = selectedRows.map(row => row.id);
            try {
                const res = await axiosInstance.post('api/archive/restore/', { ids });
                console.log(res.data);
                setInventory(prevInventory => prevInventory.filter(item => !ids.includes(item.id)));
                setSelectedRows([]);
                setArchiveData(null);
                setInventoryData(null);
                fetchInventory(true);
            } catch (error) {
                console.error("Restore failed", error);
            }
        }
    };

    const [colDefs, setColDefs] = useState([
        {
            field: "mpn", headerName: "MPN",
            cellRenderer: (params) => (
                <a
                    href="#InventoryOffcanvas"
                    data-bs-toggle="offcanvas"
                    className="link-opacity-50-hover fw-medium"
                    onClick={() => {
                        setSelectedItem(params.data);
                        console.log(params.data);
                    }}
                >
                    {params.value}
                </a>
            ),
            flex: 1
        },
        //{ field: "description", headerName: "Description" },
        { field: "manufacturer", headerName: "Manufacturer" },
        { field: "quantity", headerName: "Quantity" },
        { field: "date_code", headerName: "Date Code" },
        { field: "supplier", headerName: "Supplier" },
        { field: "location", headerName: "Location" },
        { field: "cost", headerName: "Cost" }, // purchase price
        { field: "price", headerName: "Price" }, // selling price
        { field: "break_qty_a", headerName: "Break Qty A" },
        { field: "price_a", headerName: "Price A" },
        // {
        //     field: "actions",
        //     headerName: "Actions",
        //     cellRenderer: "actionCellRenderer",
        //     cellRendererParams: {
        //         handleDelete: handleDelete,
        //         handleEdit: (inventoryItem) => setSelectedItem(inventoryItem),
        //         mouduleName: "Inventory",
        //     },
        //     pinned: "right",
        //     width: 126,
        //     filter: false,
        //     sortable: false,
        //     cellStyle: { textAlign: 'center' }
        // },
    ]);

    const onSelectionChanged = (event) => {
        const selectedData = event.api.getSelectedRows();
        console.log("selection changed, " + selectedData.length + " rows selected");
        setSelectedRows(selectedData);
        console.log("selected rows: ", selectedRows);
    };

    const gridOptions = {
        defaultColDef: {
            domLayout: 'normal',
        },
        enableCellTextSelection: true,
        rowSelection: {
            mode: 'multiRow',
            selectAll: 'filtered',
        },
        onSelectionChanged,
    };


    // fetch inventory from the backend
    const fetchInventory = useCallback((forceRefresh = false) => {
        if (!forceRefresh) {
            if (showArchive && archiveData) {
                console.log("using cached archive data");
                setInventory(archiveData);
                return;
            } else if (!showArchive && inventoryData) {
                console.log("using cached inventory data");
                setInventory(inventoryData);
                return;
            }
        }
        console.log("fetching from backend");
        gridRef.current?.api?.showLoadingOverlay();
        const endpoint = showArchive ? 'api/archive/' : 'api/inventory/';
        axiosInstance.get(endpoint)
            .then((response) => {
                setInventory(response.data);
                if (showArchive) {
                    setArchiveData(response.data);
                } else {
                    setInventoryData(response.data);
                }
            })
            .catch((error) => console.error('Error fetching inventory: ' + error))
            .finally(() => gridRef.current?.api?.hideOverlay());

    }, [showArchive, inventoryData, archiveData]);

    useEffect(() => {
        fetchInventory();
    }, [fetchInventory]);

    //update inventory state after adding or editing an inventory
    const handleUpdateInventory = (updatedInventoryItem, mode) => {
        if (mode === 'create') {
            setInventory(prev => [...prev, updatedInventoryItem]);
            if (showArchive) {
                setArchiveData(prev => [...(prev || []), updatedInventoryItem]);
            } else {
                setInventoryData(prev => [...(prev || []), updatedInventoryItem]);
            }
        } else if (mode === 'edit') {
            setInventory(prev =>
                prev.map(item => item.id === updatedInventoryItem.id ? updatedInventoryItem : item)
            );
            if (showArchive) {
                setArchiveData(prev =>
                    prev.map(item => item.id === updatedInventoryItem.id ? updatedInventoryItem : item)
                );
            } else {
                setInventoryData(prev =>
                    prev.map(item => item.id === updatedInventoryItem.id ? updatedInventoryItem : item)
                );
            }
        }
    };

    const onFilterTextBoxChanged = useCallback(() => {
        gridRef.current.api.setGridOption(
            "quickFilterText",
            document.getElementById("filter-text-box").value,
        );
    }, []);


    return (
        <div className='module-container'>
            <div className="d-flex justify-content-between align-items-center">
                <div>
                    <h2>Inventory</h2>
                    <p className="text-muted">Manage your inventory items</p>
                </div>
                <div>
                    <button className="btn btn-outline-secondary me-2" onClick={toggleInventoryView}>
                        <i className="bi bi-folder-symlink"></i> {showArchive ? "Show Inventory" : "Show Archive"}
                    </button>
                    <button type="button" className="btn btn-primary me-2" data-bs-toggle="modal" data-bs-target="#addInventoryModal">
                        + Add Item
                    </button>
                    <button type="button" className="btn btn-primary me-2" data-bs-toggle="modal" data-bs-target="#UploadBulkModal">
                        Upload Bulk Inventory
                    </button>
                    <button type="button" className="btn btn-primary" data-bs-toggle="modal" data-bs-target="#ExportModal">
                        Export
                    </button>
                </div>
            </div>
            <div>
                <div className="d-flex align-items-center">
                    <input
                        type="text"
                        id="filter-text-box"
                        className="form-control"
                        placeholder="Filter..."
                        onInput={onFilterTextBoxChanged}
                        style={{ width: "200px" }}
                    />

                    {selectedRows.length > 0 && (
                        <div className="d-flex align-items-center ms-auto">
                            <span className="me-2 text-muted small">{selectedRows.length} of {inventory.length} selected</span>
                            <button className="btn btn-outline-danger btn-sm me-2" onClick={handleDeleteSelected}>
                                <i className="bi bi-trash"></i> Delete
                            </button>
                            <button className="btn btn-outline-primary btn-sm" data-bs-toggle="modal" data-bs-target="#BulkEditModal">
                                <i className="bi bi-pencil"></i> Edit
                            </button>
                            {/* archive button */}
                            {showArchive ? (
                                <button className="btn btn-outline-success btn-sm" onClick={handleRestore}>
                                    <i className="bi bi-arrow-counterclockwise"></i> Restore
                                </button>
                            ) : (
                                <button className="btn btn-outline-primary btn-sm ms-2" onClick={handleArchiveSelected}>
                                    <i className="bi bi-archive"></i> Archive
                                </button>
                            )}
                        </div>
                    )}
                </div>
            </div>
            <div className="card border-0 shadow-sm mb-4 mt-2">
                <div className="card-body p-2">
                    <div className="ag-theme-quartz" style={{ height: 650, width: '100%' }}>
                        <AgGridReact
                            ref={gridRef}
                            columnDefs={colDefs}
                            gridOptions={gridOptions}
                            rowData={inventory}
                            theme={myTheme}
                            defaultColDef={{ flex: 1, filter: true }}
                            pagination={true}
                            paginationPageSize={20}
                            components={{ actionCellRenderer: ActionCellRenderer }}
                            overlayNoRowsTemplate={'<div class="text-primary"><div class="spinner-grow spinner-grow-sm me-1" role="status"></div><div class="spinner-grow spinner-grow-sm me-1" role="status"></div><div class="spinner-grow spinner-grow-sm" role="status"></div></br></br>Connecting The Dots...</div>'}
                            overlayLoadingTemplate={'<div class="text-primary"><div class="spinner-grow spinner-grow-sm me-1" role="status"></div><div class="spinner-grow spinner-grow-sm me-1" role="status"></div><div class="spinner-grow spinner-grow-sm" role="status"></div></br></br>Updating Data...</div>'}

                        />
                    </div>
                </div>
            </div>
            <AddInventoryModal id="addInventoryModal" mode="create" handleUpdateInventory={handleUpdateInventory} />
            <AddInventoryModal id="EditInventoryModal" mode="edit" itemData={selectedItem} handleUpdateInventory={handleUpdateInventory} />
            <UploadBulkModal id="UploadBulkModal" fetchInventory={fetchInventory} />
            <BulkEditModal id="BulkEditModal" selectedRows={selectedRows} />
            <ExportModal id="ExportModal" />
            <InventoryOffcanvas id="InventoryOffcanvas" itemData={selectedItem} onDeleteRequest={handleDelete} onArchiveRequest={handleArchive} />

        </div>
    );
}

export default Inventory;