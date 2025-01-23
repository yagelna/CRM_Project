import React, { useState, useEffect } from "react";
import axiosInstance from "../../AxiosInstance";

const ExportModal = ({ id }) => {
    const [suppliers, setSuppliers] = useState([]);
    const [selectedSuppliers, setSelectedSuppliers] = useState([]);
    const [netComponentsEnabled, setNetComponentsEnabled] = useState(false);
    const [icSourceEnabled, setIcSourceEnabled] = useState(false);
    const [inventoryEnabled, setInventoryEnabled] = useState(false);
    const [stockNetComponentsRows, setStockNetComponentsRows] = useState("");
    const [availableNetComponentsRows, setAvailableNetComponentsRows] = useState("");
    const [stockIcSourceRows, setStockIcSourceRows] = useState("");
    const [availableIcSourceRows, setAvailableIcSourceRows] = useState("");
    const [fileFormat, setFileFormat] = useState("xlsx");

    const fetchSuppliers = () => {
        axiosInstance
            .get("api/inventory/suppliers/")
            .then((response) => {
                setSuppliers(response.data.suppliers);
            })
            .catch((error) => console.error("Error fetching suppliers: " + error));
    };

    const handleSupplierSelection = (supplier) => {
        const index = selectedSuppliers.indexOf(supplier);
        if (index === -1) {
            // Add supplier if not selected
            setSelectedSuppliers((prev) => [...prev, supplier]);
        } else {
            // Remove supplier if already selected
            setSelectedSuppliers((prev) => prev.filter((item) => item !== supplier));
        }
    };

    const getBadgeOrder = (supplier) => {
        const index = selectedSuppliers.indexOf(supplier);
        return index !== -1 ? index + 1 : null;
    };

    const handleExport = () => {
        // validate the export options
        if (!netComponentsEnabled && !icSourceEnabled && !inventoryEnabled) {
            alert("Please select at least one export option.");
            return;
        }
        
        if (selectedSuppliers.length === 0) {
            alert("Please select at least one supplier.");
            return;
        }

        if (netComponentsEnabled && !netComponentsRows) {
            alert("Please enter the maximum number of rows for netComponents.");
            return;
        }

        if (icSourceEnabled && !icSourceRows) {
            alert("Please enter the maximum number of rows for IC Source.");
            return;
        }

        const exportData = {
            export_options: {
                net_components: {
                    enabled: netComponentsEnabled,
                    stock_max_rows: stockNetComponentsRows || null,
                    available_max_rows: availableNetComponentsRows || null,
                },
                ic_source: {
                    enabled: icSourceEnabled,
                    stock_max_rows: stockIcSourceRows || null,
                    available_max_rows: availableIcSourceRows || null,
                },
                inventory: {
                    enabled: inventoryEnabled,
                },
                file_format: fileFormat,
            },
            suppliers: selectedSuppliers,
        };

        axiosInstance
            .post("/api/export/", exportData)
            .then((response) => {
                console.log("Export successful:", response.data);
                alert("Export completed successfully!");
            })
            .catch((error) => {
                console.error("Export failed:", error);
                alert("Export failed. Please try again.");
            });
    };

    useEffect(() => {
        fetchSuppliers();
    }, []);

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
                        <p> NOTE: if netComponents or IC Source is enabled, please enter the maximum number of rows to export. </p>
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
                                netComponents
                            </label>
                            {netComponentsEnabled && (
                                <div>
                                    <input
                                        type="number"
                                        id="stockNetComponentsRows"
                                        className="form-control form-control-sm w-auto"
                                        value={stockNetComponentsRows}
                                        onChange={(e) => setStockNetComponentsRows(e.target.value)}
                                        placeholder="Stock Max Rows"
                                    />
                                    <input
                                        type="number"
                                        id="availableNetComponentsRows"
                                        className="form-control form-control-sm w-auto"
                                        value={availableNetComponentsRows}
                                        onChange={(e) => setAvailableNetComponentsRows(e.target.value)}
                                        placeholder="Available Max Rows"
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
                                        id="stockIcSourceRows"
                                        className="form-control form-control-sm w-auto"
                                        value={stockIcSourceRows}
                                        onChange={(e) => setStockIcSourceRows(e.target.value)}
                                        placeholder="Stock Max Rows"
                                    />
                                    <input
                                        type="number"
                                        id="availableIcSourceRows"
                                        className="form-control form-control-sm w-auto"
                                        value={availableIcSourceRows}
                                        onChange={(e) => setAvailableIcSourceRows(e.target.value)}
                                        placeholder="Available Max Rows"
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

                        {/* File Format Dropdown with XLSX as default */}
                        <div className="dropdown mt-3">
                            <button className="btn btn-secondary dropdown-toggle btn-sm" type="button" id="dropdownMenuButton" data-bs-toggle="dropdown" aria-expanded="false">
                                {fileFormat}
                            </button>
                            <ul className="dropdown-menu" aria-labelledby="dropdownMenuButton">
                                <li>
                                    <a className="dropdown-item" href="#" onClick={(e) => { e.preventDefault(); setFileFormat("xlsx"); }}>
                                        xlsx
                                    </a>
                                </li>
                                <li>
                                    <a className="dropdown-item" href="#" onClick={(e) => { e.preventDefault(); setFileFormat("csv"); }}>
                                        csv
                                    </a>
                                </li>
                                <li>
                                    <a className="dropdown-item" href="#" onClick={(e) => { e.preventDefault(); setFileFormat("xls"); }}>
                                        xls
                                    </a>
                                </li>
                            </ul>
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
                                aria-labelledby="dropdownMenuButton"
                                style={{
                                    maxHeight: "400px", // Limit the height to the modal's height
                                    overflowY: "auto", // Add scroll if height exceeds
                                    width: "100%", // Fit the modal's width or less
                                    fontSize: "14px", // Reduce font size for a compact view
                                }}
                            >
                                {/* Select All Option */}
                                <li>
                                    <a
                                        className="dropdown-item d-flex justify-content-between align-items-center"
                                        href="#"
                                        onClick={(e) => {
                                            e.preventDefault();
                                            if (selectedSuppliers.length === suppliers.length) {
                                                // Deselect all if already selected
                                                setSelectedSuppliers([]);
                                            } else {
                                                // Select all if not already selected
                                                setSelectedSuppliers(suppliers);
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
                                            {supplier}
                                            {selectedSuppliers.includes(supplier) && (
                                                <span className="badge text-bg-primary rounded-pill">
                                                    {getBadgeOrder(supplier)}
                                                </span>
                                            )}
                                        </a>
                                    </li>
                                ))}
                            </ul>
                        </div>
                    </div>
                    <div className="modal-footer">
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
