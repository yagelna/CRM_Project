import React, { useState, useEffect } from "react";
import axiosInstance from "../../AxiosInstance";

const ExportModal = ({ id }) => {
    const [suppliers, setSuppliers] = useState([]);
    const [selectedSuppliers, setSelectedSuppliers] = useState([]);
    const [netComponentsEnabled, setNetComponentsEnabled] = useState(false);
    const [icSourceEnabled, setIcSourceEnabled] = useState(false);
    const [inventoryEnabled, setInventoryEnabled] = useState(false);
    const [netComponentsRows, setNetComponentsRows] = useState({ stock: "", available: "" });
    const [icSourceRows, setIcSourceRows] = useState({ stock: "", available: "" });
    const [fileFormat, setFileFormat] = useState("csv");
    const [selectedSuppliersCount, setSelectedSuppliersCount] = useState(0);
    const [exportOptions, setExportOptions] = useState({
        download: false,
        sendToNC: true,
        sendToICS: true,
    });
    const [saveSettings, setSaveSettings] = useState(false);
    const [autoUpdate, setAutoUpdate] = useState(false);

    // Fetch System settings
    const fetchSystemSettings = () => {
        axiosInstance
            .get("api/system-settings/")
            .then((response) => {
                const settings = response.data;
                console.log("System settings:", settings);
                setNetComponentsEnabled(settings.export_netcomponents);
                setIcSourceEnabled(settings.export_icsource);
                setInventoryEnabled(settings.export_inventory);
                setNetComponentsRows({
                    stock: settings.netcomponents_max_stock || "",
                    available: settings.netcomponents_max_available || "",
                });
                setIcSourceRows({
                    stock: settings.icsource_max_stock || "",
                    available: settings.icsource_max_available || "",
                });
                setFileFormat(settings.export_file_format);
                setSelectedSuppliers(settings.selected_suppliers || []);

                const selectedPartsCount = suppliers
                    .filter((supplier) => (settings.selected_suppliers || []).includes(supplier.supplier))
                    .reduce((acc, curr) => acc + curr.total_parts, 0);
                setSelectedSuppliersCount(selectedPartsCount);
            })
            .catch((error) => console.error("Error fetching System settings: " + error));
    };

    // Fetch suppliers list
    const fetchSuppliers = () => {
        axiosInstance
            .get("api/inventory/suppliers/")
            .then((response) => {
                setSuppliers(response.data.suppliers);
            })
            .catch((error) => console.error("Error fetching suppliers: " + error));
    };

    // Handle supplier selection
    const handleSupplierSelection = (supplier) => {
        const index = selectedSuppliers.indexOf(supplier.supplier);
        if (index === -1) {
            setSelectedSuppliers((prev) => [...prev, supplier.supplier]);
            setSelectedSuppliersCount((prev) => prev + supplier.total_parts);
        } else {
            setSelectedSuppliers((prev) => prev.filter((item) => item !== supplier.supplier));
            setSelectedSuppliersCount((prev) => Math.max(0,prev - supplier.total_parts));
        }
    };

    // Helper to get the badge order for suppliers
    const getBadgeOrder = (supplier) => {
        const index = selectedSuppliers.indexOf(supplier.supplier);
        return index !== -1 ? index + 1 : null;
    };

    // Handle the export logic
    const handleExport = () => {
        if (!netComponentsEnabled && !icSourceEnabled && !inventoryEnabled) {
            alert("Please select at least one export option.");
            return;
        }

        if (selectedSuppliers.length === 0) {
            alert("Please select at least one supplier.");
            return;
        }

        const exportPayload = {
            netCOMPONENTS: {
                enabled: netComponentsEnabled,
                max_stock_rows: parseInt(netComponentsRows.stock) || 0,
                max_available_rows: parseInt(netComponentsRows.available) || 0,
            },
            icSource: {
                enabled: icSourceEnabled,
                max_stock_rows: parseInt(icSourceRows.stock) || 0,
                max_available_rows: parseInt(icSourceRows.available) || 0,
            },
            inventory: {
                enabled: inventoryEnabled,
            },
            selectedSuppliers,
            fileFormat,
            actions: exportOptions,
            source: "web",
        };

        if (saveSettings) {
            axiosInstance
                .put("api/system-settings/", {
                    export_netcomponents: netComponentsEnabled,
                    netcomponents_max_stock: parseInt(netComponentsRows.stock) || 0,
                    netcomponents_max_available: parseInt(netComponentsRows.available) || 0,
                    export_icsource: icSourceEnabled,
                    icsource_max_stock: parseInt(icSourceRows.stock) || 0,
                    icsource_max_available: parseInt(icSourceRows.available) || 0,
                    export_inventory: inventoryEnabled,
                    export_file_format: fileFormat,
                    selected_suppliers: selectedSuppliers,
                    auto_update: autoUpdate,
                })
                .then((response) => console.log("System settings updated:", response))
                .catch((error) => console.error("Error updating System settings:", error));
        }

        axiosInstance
            .post("/api/inventory/export/", exportPayload, { responseType: "blob" })
            .then((response) => {
                // Handle file download
                if (exportOptions.download) {
                    const url = window.URL.createObjectURL(new Blob([response.data]));
                    const link = document.createElement("a");
                    link.href = url;
                    link.setAttribute("download", `export.zip`); // קובץ ZIP
                    document.body.appendChild(link);
                    link.click();
                    link.remove();
                    console.log("Export successful.", response);
                } else {
                    console.log("Export was generated successfully but not downloaded (send to NC/ICS via email).");
                }
            })
            .catch((error) => {
                console.error("Export failed:", error);
                alert("Export failed. Please try again.");
            });
    };

    useEffect(() => {
        fetchSuppliers();
    }, []);

    useEffect(() => {
        if (suppliers.length > 0) {
            fetchSystemSettings();
        }
    }, [suppliers]);



    return (
        <div className="modal fade" id={id} tabIndex="-1" aria-labelledby="exportModalLabel" aria-hidden="true">
            <div className="modal-dialog modal-xl">
                <div className="modal-content">
                    <div className="modal-header">
                        <h1 className="modal-title fs-5" id="exportModalLabel">Export Options</h1>
                        <button type="button" className="btn-close" data-bs-dismiss="modal" aria-label="Close"></button>
                    </div>
                    <div className="modal-body d-flex flex-column justify-content-center">
                        <p>Choose the format to export the data:</p>
                        {/* NetComponents Switch */}
                        <div className="form-check form-switch d-flex align-items-center">
                            <input
                                className="form-check-input me-2"
                                type="checkbox"
                                role="switch"
                                id="netComponentsSwitch"
                                checked={netComponentsEnabled}
                                onChange={(e) => setNetComponentsEnabled(e.target.checked)}
                            />
                            <label className="form-check-label me-3" htmlFor="netComponentsSwitch">
                                netCOMPONENTS
                            </label>
                            {netComponentsEnabled && (
                                <div>
                                    <input
                                        type="number"
                                        className="form-control form-control-sm w-auto mt-1"
                                        placeholder="Max Stock Rows"
                                        value={netComponentsRows.stock}
                                        onChange={(e) =>
                                            setNetComponentsRows((prev) => ({ ...prev, stock: e.target.value }))
                                        }
                                    />
                                    <input
                                        type="number"
                                        className="form-control form-control-sm w-auto mt-1"
                                        placeholder="Max Available Rows"
                                        value={netComponentsRows.available}
                                        onChange={(e) =>
                                            setNetComponentsRows((prev) => ({ ...prev, available: e.target.value }))
                                        }
                                    />
                                </div>
                            )}
                        </div>
                        {/* IC Source Switch */}
                        <div className="form-check form-switch d-flex align-items-center mt-1">
                            <input
                                className="form-check-input me-2"
                                type="checkbox"
                                role="switch"
                                id="icSourceSwitch"
                                checked={icSourceEnabled}
                                onChange={(e) => setIcSourceEnabled(e.target.checked)}
                            />
                            <label className="form-check-label me-3" htmlFor="icSourceSwitch">
                                IC Source
                            </label>
                            {icSourceEnabled && (
                                <div>
                                    <input
                                        type="number"
                                        className="form-control form-control-sm w-auto mt-1"
                                        placeholder="Max Stock Rows"
                                        value={icSourceRows.stock}
                                        onChange={(e) =>
                                            setIcSourceRows((prev) => ({ ...prev, stock: e.target.value }))
                                        }
                                    />
                                    <input
                                        type="number"
                                        className="form-control form-control-sm w-auto mt-1"
                                        placeholder="Max Available Rows"
                                        value={icSourceRows.available}
                                        onChange={(e) =>
                                            setIcSourceRows((prev) => ({ ...prev, available: e.target.value }))
                                        }
                                    />
                                </div>
                            )}
                        </div>
                        {/* Inventory Switch */}
                        <div className="form-check form-switch mt-1">
                            <input
                                className="form-check-input"
                                type="checkbox"
                                role="switch"
                                id="inventorySwitch"
                                checked={inventoryEnabled}
                                onChange={(e) => setInventoryEnabled(e.target.checked)}
                            />
                            <label className="form-check-label" htmlFor="inventorySwitch">
                                All Inventory Fields
                            </label>
                        </div>
                        {/* File Format Dropdown */}
                        <div className="dropdown mt-3">
                            <button
                                className="btn btn-secondary dropdown-toggle btn-sm"
                                type="button"
                                data-bs-toggle="dropdown"
                                aria-expanded="false"
                            >
                                {fileFormat}
                            </button>
                            <ul className="dropdown-menu">
                                <li>
                                    <a
                                        className="dropdown-item"
                                        href="#"
                                        onClick={(e) => {
                                            e.preventDefault();
                                            setFileFormat("csv");
                                        }}
                                    >
                                        csv
                                    </a>
                                </li>
                                <li>
                                    <a
                                        className="dropdown-item"
                                        href="#"
                                        onClick={(e) => {
                                            e.preventDefault();
                                            setFileFormat("xlsx");
                                        }}
                                    >
                                        xlsx
                                    </a>
                                </li>
                            </ul>
                        </div>
                        <div className="mt-3">
                            <strong>Selected Components Count:</strong> {selectedSuppliersCount}
                        </div>
                        {/* Supplier selection */}
                        <div className="dropdown col-3 mt-3">
                            <button
                                className="btn btn-secondary dropdown-toggle w-100"
                                type="button"
                                id="dropdownMenuButton"
                                data-bs-toggle="dropdown"
                                aria-expanded="false"
                                data-bs-auto-close="outside"
                            >
                                Select Suppliers
                            </button>
                            <ul
                                className="dropdown-menu"
                                style={{
                                    maxHeight: "400px",
                                    overflowY: "auto",
                                    width: "100%",
                                    fontSize: "14px",
                                }}
                            >
                                <li>
                                    <a
                                        className="dropdown-item d-flex justify-content-between align-items-center"
                                        href="#"
                                        onClick={(e) => {
                                            e.preventDefault();
                                            if (selectedSuppliers.length === suppliers.length) {
                                                setSelectedSuppliers([]);
                                                setSelectedSuppliersCount(0);
                                            } else {
                                                setSelectedSuppliers(suppliers.map((supplier) => supplier.supplier));
                                                setSelectedSuppliersCount(suppliers.reduce((acc, curr) => acc + curr.total_parts, 0));
                                            }
                                        }}
                                    >
                                        Select All
                                        {selectedSuppliers.length === suppliers.length && (
                                            <span className="badge text-bg-primary rounded-pill">✔</span>
                                        )}
                                    </a>
                                </li>
                                {suppliers.map((supplier, index) => (
                                    <li key={index}>
                                        <a
                                            className="dropdown-item d-flex justify-content-between align-items-center"
                                            href="#"
                                            onClick={(e) => {
                                                e.preventDefault();
                                                handleSupplierSelection(supplier);
                                            }}
                                        >
                                            {supplier.supplier} ({supplier.total_parts})
                                            {selectedSuppliers.includes(supplier.supplier) && (
                                                <span className="badge text-bg-primary rounded-pill">
                                                    {getBadgeOrder(supplier)}
                                                </span>
                                            )}
                                        </a>
                                    </li>
                                ))}
                            </ul>
                        </div>
                        <div className="form-check">
                            <input
                                className="form-check-input"
                                type="checkbox"
                                id="downloadFile"
                                checked={exportOptions.download}
                                onChange={(e) => setExportOptions({ ...exportOptions, download: e.target.checked })}
                            />
                            <label className="form-check-label" htmlFor="downloadFile">
                                Download File
                            </label>
                        </div>
                        <div className="form-check">
                            <input
                                className="form-check-input"
                                type="checkbox"
                                id="sendToNC"
                                checked={exportOptions.sendToNC}
                                onChange={(e) => setExportOptions({ ...exportOptions, sendToNC: e.target.checked })}
                            />
                            <label className="form-check-label" htmlFor="sendToNC">
                                Send to NetComponents
                            </label>
                        </div>
                        <div className="form-check">
                            <input
                                className="form-check-input"
                                type="checkbox"
                                id="sendToICS"
                                checked={exportOptions.sendToICS}
                                onChange={(e) => setExportOptions({ ...exportOptions, sendToICS: e.target.checked })}
                            />
                            <label className="form-check-label" htmlFor="sendToICS">
                                Send to IC Source
                            </label>
                        </div>
                    </div>
                    <div className="modal-footer">
                        {saveSettings && (
                        <div className="form-check form-switch">
                            <input
                                className="form-check-input"
                                type="checkbox"
                                role="switch"
                                id="autoUpdateSwitch"
                                checked={autoUpdate}
                                onChange={(e) => setAutoUpdate(e.target.checked)}
                            />
                            <label className="form-check-label" htmlFor="autoUpdateSwitch">
                                Auto Update With These Settings (Once a Day)
                            </label>
                        </div>
                        )}
                        <div className="form-check form-switch">
                            <input
                                className="form-check-input"
                                type="checkbox"
                                role="switch"
                                id="saveSettingsSwitch"
                                checked={saveSettings}
                                onChange={(e) => setSaveSettings(e.target.checked)}
                            />
                            <label className="form-check-label" htmlFor="saveSettingsSwitch">
                                Save Settings
                            </label>
                        </div>
                        
                        <button type="button" className="btn btn-secondary" data-bs-dismiss="modal">
                            Close
                        </button>
                        <button type="button" className="btn btn-primary" onClick={handleExport}>
                            Export
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default ExportModal;
