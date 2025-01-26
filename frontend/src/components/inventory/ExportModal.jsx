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
    const [fileFormat, setFileFormat] = useState("xlsx");

    // Fetch suppliers from the server
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
        const index = selectedSuppliers.indexOf(supplier);
        if (index === -1) {
            setSelectedSuppliers((prev) => [...prev, supplier]);
        } else {
            setSelectedSuppliers((prev) => prev.filter((item) => item !== supplier));
        }
    };

    // Helper to get the badge order for suppliers
    const getBadgeOrder = (supplier) => {
        const index = selectedSuppliers.indexOf(supplier);
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

        const exportOptions = {
            netComponents: {
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
        };

        axiosInstance
            .post("/api/inventory/export/", exportOptions, { responseType: "blob" })
            .then((response) => {
                // Handle file download
                const url = window.URL.createObjectURL(new Blob([response.data]));
                const link = document.createElement("a");
                link.href = url;
                link.setAttribute("download", `export.zip`); // קובץ ZIP
                document.body.appendChild(link);
                link.click();
                link.remove();
                console.log("Export successful.", response);
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
                                            setFileFormat("xlsx");
                                        }}
                                    >
                                        xlsx
                                    </a>
                                </li>
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
                                            setFileFormat("xls");
                                        }}
                                    >
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
                                style={{
                                    maxHeight: "400px",
                                    overflowY: "auto",
                                    width: "100%",
                                    fontSize: "14px",
                                }}
                            >
                                <li>
                                    <a
                                        className="dropdown-item"
                                        href="#"
                                        onClick={(e) => {
                                            e.preventDefault();
                                            if (selectedSuppliers.length === suppliers.length) {
                                                setSelectedSuppliers([]);
                                            } else {
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
                                            className="dropdown-item"
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
