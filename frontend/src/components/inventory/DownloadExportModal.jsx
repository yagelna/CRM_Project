import React, { useEffect, useMemo, useState } from "react";
import axiosInstance from "../../AxiosInstance";
import "./export-modal.css";
import { showToast } from "../common/toast";

const DownloadExportModal = ({ id, scope = "suppliers", selectedRowIds = [] }) => {
  const [isExporting, setIsExporting] = useState(false);

  const [fileFormat, setFileFormat] = useState("csv");

  // Supplier selection (only for scope="suppliers")
  const [allSuppliers, setAllSuppliers] = useState([]); // [{ supplier, total_parts }, ...]
  const [selectedSuppliers, setSelectedSuppliers] = useState(() => new Set());
  const [search, setSearch] = useState("");

  // Load suppliers only when scope is "suppliers"
  useEffect(() => {
    if (scope !== "suppliers") return;

    const load = async () => {
      try {
        const res = await axiosInstance.get("api/inventory/suppliers/");
        setAllSuppliers(res.data?.suppliers || []);
        setSelectedSuppliers(new Set());
        setSearch("");
      } catch (e) {
        console.error("Failed to load suppliers:", e);
      }
    };

    load();
  }, [scope]);

  const filteredSuppliers = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return allSuppliers;
    return allSuppliers.filter((s) => (s.supplier || "").toLowerCase().includes(q));
  }, [allSuppliers, search]);

  const toggleSupplier = (name) => {
    setSelectedSuppliers((prev) => {
      const next = new Set(prev);
      if (next.has(name)) next.delete(name);
      else next.add(name);
      return next;
    });
  };

  const selectFiltered = () => {
    setSelectedSuppliers((prev) => {
      const next = new Set(prev);
      filteredSuppliers.forEach((s) => next.add(s.supplier));
      return next;
    });
  };

  const clearAll = () => setSelectedSuppliers(new Set());

  const selectedParts = useMemo(() => {
    const map = new Map(allSuppliers.map((s) => [s.supplier, s.total_parts || 0]));
    let sum = 0;
    selectedSuppliers.forEach((name) => (sum += map.get(name) || 0));
    return sum;
  }, [allSuppliers, selectedSuppliers]);

  const downloadBlobAsZip = (blob, filename = "export.zip") => {
    const url = window.URL.createObjectURL(new Blob([blob]));
    const link = document.createElement("a");
    link.href = url;
    link.setAttribute("download", filename);
    document.body.appendChild(link);
    link.click();
    link.remove();
    window.URL.revokeObjectURL(url);
  };

  const handleExport = async () => {
    try {
      setIsExporting(true);
      showToast({ title: "Export", message: "Starting export…", type: "info", delay: 4000 });

      if (scope === "selected" && selectedRowIds.length === 0) {
        showToast({ title: "Export", message: "No rows selected. Please select rows first.", type: "warning" });
        return;
      }

      if (scope === "suppliers") {
        const suppliers = Array.from(selectedSuppliers);
        if (suppliers.length === 0) {
          showToast({ title: "Export", message: "Please select at least one supplier.", type: "warning" });
          return;
        }

        // Close modal when starting export
        const modalEl = document.getElementById(id);
        if (modalEl && window.bootstrap) {
          const instance = window.bootstrap.Modal.getInstance(modalEl) || new window.bootstrap.Modal(modalEl);
          instance.hide();
        }

        const res = await axiosInstance.post(
          "/api/inventory/export/download/suppliers/",
          { suppliers, fileFormat },
          { responseType: "blob" }
        );
        downloadBlobAsZip(res.data);
        showToast({ title: "Export", message: `Suppliers export downloaded successfully. (${suppliers.length} supplier${suppliers.length !== 1 ? "s" : ""})`, type: "success" });
        return;
      }

      if (scope === "all") {
        // Close modal when starting export
        const modalEl = document.getElementById(id);
        if (modalEl && window.bootstrap) {
          const instance = window.bootstrap.Modal.getInstance(modalEl) || new window.bootstrap.Modal(modalEl);
          instance.hide();
        }

        const res = await axiosInstance.post(
          "/api/inventory/export/download/all/",
          { fileFormat },
          { responseType: "blob" }
        );
        downloadBlobAsZip(res.data);
        showToast({ title: "Export", message: "All inventory export downloaded successfully.", type: "success" });
        return;
      }

      // scope === "selected"
      // Close modal when starting export
      const modalEl = document.getElementById(id);
      if (modalEl && window.bootstrap) {
        const instance = window.bootstrap.Modal.getInstance(modalEl) || new window.bootstrap.Modal(modalEl);
        instance.hide();
      }

      const res = await axiosInstance.post(
        "/api/inventory/export/download/selected/",
        { ids: selectedRowIds, fileFormat },
        { responseType: "blob" }
      );
      downloadBlobAsZip(res.data);
      showToast({ title: "Export", message: `Selected rows export downloaded successfully. (${selectedRowIds.length} rows)`, type: "success" });
    } catch (e) {
      console.error("Download export failed:", e);
      showToast({ title: "Export", message: "Export failed. Please try again.", type: "danger" });
    } finally {
      setIsExporting(false);
    }
  };

  const disableExport =
    isExporting ||
    (scope === "selected" && selectedRowIds.length === 0) ||
    (scope === "suppliers" && selectedSuppliers.size === 0);

  return (
    <div className="modal fade" id={id} tabIndex="-1" aria-hidden="true">
      <div className="modal-dialog modal-xl">
        <div className="modal-content">
          <div className="modal-header">
            <h1 className="modal-title fs-5">Download Export</h1>
            <button type="button" className="btn-close" data-bs-dismiss="modal" aria-label="Close" />
          </div>

          <div className="modal-body">
            {/* Format selector */}
            <div className="d-flex gap-2 flex-wrap align-items-center mb-3">
              <div className="dropdown">
                <button className="btn btn-secondary btn-sm dropdown-toggle" data-bs-toggle="dropdown">
                  {fileFormat}
                </button>
                <ul className="dropdown-menu">
                  {["csv", "xlsx"].map((f) => (
                    <li key={f}>
                      <a
                        href="#"
                        className="dropdown-item"
                        onClick={(e) => {
                          e.preventDefault();
                          setFileFormat(f);
                        }}
                      >
                        {f}
                      </a>
                    </li>
                  ))}
                </ul>
              </div>

              {scope === "all" && <span className="text-muted small">Will export the entire inventory.</span>}
              {scope === "selected" && (
                <span className={`small ${selectedRowIds.length ? "text-muted" : "text-danger"}`}>
                  {selectedRowIds.length
                    ? `Will export ${selectedRowIds.length} selected rows.`
                    : "No rows selected. Please select rows in the table first."}
                </span>
              )}
              {scope === "suppliers" && (
                <span className="text-muted small">
                  Select suppliers to export · Selected: {selectedSuppliers.size} · Parts:{" "}
                  {selectedParts.toLocaleString()}
                </span>
              )}
            </div>

            {/* Suppliers selection only for scope="suppliers" */}
            {scope === "suppliers" && (
              <>
                <div className="d-flex gap-2 align-items-center mb-2">
                  <input
                    className="form-control form-control-sm"
                    placeholder="Search suppliers..."
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                  />
                  <span className="badge text-bg-secondary">
                    {filteredSuppliers.length} / {allSuppliers.length}
                  </span>
                </div>

                <div className="d-flex gap-2 mb-2">
                  <button type="button" className="btn btn-outline-secondary btn-sm" onClick={selectFiltered}>
                    Select filtered
                  </button>
                  <button type="button" className="btn btn-outline-secondary btn-sm" onClick={clearAll}>
                    Clear
                  </button>
                </div>

                <div className="list-group" style={{ maxHeight: 420, overflow: "auto" }}>
                  {filteredSuppliers.map((s) => {
                    const name = s.supplier;
                    const checked = selectedSuppliers.has(name);
                    return (
                      <label key={name} className="list-group-item d-flex align-items-center gap-2">
                        <input
                          className="form-check-input m-0"
                          type="checkbox"
                          checked={checked}
                          onChange={() => toggleSupplier(name)}
                        />
                        <span className="flex-grow-1">{name}</span>
                        <span className="badge text-bg-light">{(s.total_parts || 0).toLocaleString()}</span>
                      </label>
                    );
                  })}
                </div>
              </>
            )}
          </div>

          <div className="modal-footer justify-content-between">
            <div>
              <button className="btn btn-secondary" data-bs-dismiss="modal">
                Close
              </button>
              <button className="btn btn-primary ms-2" onClick={handleExport} disabled={disableExport}>
                {isExporting ? (
                  <>
                    <span className="spinner-border spinner-border-sm me-2" />
                    Exporting…
                  </>
                ) : (
                  "Export"
                )}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DownloadExportModal;
