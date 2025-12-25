import React, { useEffect, useMemo, useState } from "react";
import axiosInstance from "../../AxiosInstance";
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  useDroppable,
  DragOverlay,
} from "@dnd-kit/core";
import { SortableContext, rectSortingStrategy } from "@dnd-kit/sortable";
import { sortableKeyboardCoordinates } from "@dnd-kit/sortable";
import SortableItem from "./SortableItem";
import "./export-modal.css";
import { showToast } from "../common/toast";

// Helpers
const uniqBy = (arr, keyFn) => {
  const map = new Map();
  arr.forEach((x) => map.set(keyFn(x), x));
  return Array.from(map.values());
};

// Simple badge for DragOverlay
const SupplierBadge = ({ item }) => (
  <span className="badge bg-light text-dark border me-2 mb-2" style={{ userSelect: "none", cursor: "grab" }} title={`${item.supplier} (${item.total_parts || 0})`}>
    {item.supplier} <span className="text-muted">({item.total_parts || 0})</span>
  </span>
);

// Droppable container (Pool / Stock / Available)
const Container = ({ platformKey, title, idPrefix, items, containerKey, badge, isActive }) => {
  const droppableId = `${platformKey}:${containerKey}`;

  const { setNodeRef } = useDroppable({
    id: droppableId,
    data: { type: "container", container: containerKey },
  });

  return (
    <div className={`card h-100 w-100 ${isActive ? "border border-primary" : ""}`}>
      <div className="card-header d-flex justify-content-between align-items-center">
        <span className="fw-semibold">{title}</span>
        {badge}
      </div>
      <div ref={setNodeRef} className={`card-body ${isActive ? "bg-light-subtle" : ""}`} style={{ minHeight: 280 }} >
        <SortableContext
          items={items.map((item) => `${idPrefix}|${item.supplier}`)}
          strategy={rectSortingStrategy}
        >
          {items.length === 0 && <div className="text-muted small">Empty</div>}
          {items.map((item) => (
            <SortableItem
              key={`${idPrefix}|${item.supplier}`}
              id={`${idPrefix}|${item.supplier}`}
              item={item}
              platformKey={platformKey}
              containerKey={containerKey}
            />
          ))}
        </SortableContext>
      </div>
    </div>
  );
};


const PlatformExportModal = ({ id }) => {

  // Shared lists for both NC & ICS
  const [lists, setLists] = useState({
    pool: [],
    stock: [],
    available: [],
  });

  // netComponents + ICSource settings (enable + limits)
  const [netComponents, setNetComponents] = useState({
    enabled: false,
    maxStock: 0,
    maxAvailable: 0,
  });

  const [icSource, setIcSource] = useState({
    enabled: false,
    maxStock: 0,
    maxAvailable: 0,
  });

  const [fileFormat, setFileFormat] = useState("csv");
  const [saveSettings, setSaveSettings] = useState(false);
  const [autoUpdate, setAutoUpdate] = useState(false);
  const [search, setSearch] = useState("");
  const [isExporting, setIsExporting] = useState(false);
  const [activeDrag, setActiveDrag] = useState(null);
  const [activeContainer, setActiveContainer] = useState(null);

  const countParts = (list) =>
    list.reduce((acc, s) => acc + (s?.total_parts || 0), 0);

  // DnD sensors
  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  );

  // Derived values
  const totalSelectedCount = useMemo(() => {
    const allUnique = uniqBy([...lists.stock, ...lists.available], (x) => x.supplier);
    return allUnique.reduce((acc, s) => acc + (s?.total_parts || 0), 0);
  }, [lists]);

  const filteredPool = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return lists.pool;
    return lists.pool.filter((s) => s.supplier.toLowerCase().includes(q));
  }, [lists.pool, search]);

  // Initial load: suppliers + system settings
  useEffect(() => {
    const fetchAll = async () => {
      try {
        const [supRes, sysRes] = await Promise.all([
          axiosInstance.get("api/inventory/suppliers/"),
          axiosInstance.get("api/system-settings/"),
        ]);

        const sup = supRes.data?.suppliers || [];
        const settings = sysRes.data || {};

        setAutoUpdate(!!settings.auto_update);
        setFileFormat(settings.export_file_format || "csv");
        setNetComponents({
          enabled: !!settings.export_netcomponents,
          maxStock: settings.netcomponents_max_stock || 0,
          maxAvailable: settings.netcomponents_max_available || 0,
        });
        setIcSource({
          enabled: !!settings.export_icsource,
          maxStock: settings.icsource_max_stock || 0,
          maxAvailable: settings.icsource_max_available || 0,
        });

        // load stock_suppliers + available_suppliers from settings
        const stockFromSettings = settings.stock_suppliers || [];
        const availableFromSettings = settings.available_suppliers || [];

        const stockSet = new Set(stockFromSettings);
        const availableSet = new Set(availableFromSettings);
        const usedSet = new Set([...stockSet, ...availableSet]);

        const stockList = sup.filter((s) => stockSet.has(s.supplier));
        const availableList = sup.filter((s) => availableSet.has(s.supplier));
        const poolList = sup.filter((s) => !usedSet.has(s.supplier));

        setLists({
          pool: poolList,
          stock: stockList,
          available: availableList,
        });
      } catch (e) {
        console.error("Failed to load exporters data:", e);
      }
    };
    fetchAll();
  }, []);

  // DnD handlers
  const handleDragStart = (event) => {
    setActiveDrag(event.active);
  };

  const handleDragOver = (event) => {
    const { over } = event;

    if (!over || !over.data?.current) {
      setActiveContainer(null);
      return;
    }

    const overData = over.data.current;

    if (overData.type === "container") setActiveContainer(overData.container);
    else if (overData.container) setActiveContainer(overData.container);
    else setActiveContainer(null);
  };

  const handleDragEnd = (event) => {
    const { active, over } = event;
    setActiveDrag(null);
    setActiveContainer(null);
    if (!over) return;

    const fromContainer = active.data.current?.container;
    const item = active.data.current?.item;

    let toContainer;
    if (over.data.current?.type === "container") {
      toContainer = over.data.current.container;
    } else {
      toContainer = over.data.current?.container;
    }

    if (!item || !fromContainer || !toContainer) return;

    // Reorder within same container
    if (fromContainer === toContainer && over.data.current?.type === "item") {
      const overItem = over.data.current?.item;
      if (!overItem) return;

      setLists((prev) => {
        const copy = structuredClone(prev);
        const arr = copy[fromContainer];

        const fromIndex = arr.findIndex((x) => x.supplier === item.supplier);
        const toIndex = arr.findIndex((x) => x.supplier === overItem.supplier);

        if (fromIndex === -1 || toIndex === -1 || fromIndex === toIndex) return prev;

        const [moved] = arr.splice(fromIndex, 1);
        arr.splice(toIndex, 0, moved);
        return copy;
      });
      return;
    }

    // Move between containers
    if (fromContainer !== toContainer) {
      moveBetween(fromContainer, toContainer, item);
    }
  };

  const moveBetween = (fromKey, toKey, item) => {
    setLists((prev) => {
      const copy = structuredClone(prev);

      // Remove from source
      copy[fromKey] = copy[fromKey].filter(
        (s) => s.supplier !== item.supplier
      );

      if (toKey === "pool") {
        // Back to pool: remove from stock & available, add to pool
        copy.stock = copy.stock.filter((s) => s.supplier !== item.supplier);
        copy.available = copy.available.filter((s) => s.supplier !== item.supplier);
        if (!copy.pool.some((s) => s.supplier === item.supplier)) {
          copy.pool.push(item);
        }
      } else {
        // To stock / available: remove from other bucket & pool, add to target
        const other = toKey === "stock" ? "available" : "stock";
        copy[other] = copy[other].filter((s) => s.supplier !== item.supplier);
        copy.pool = copy.pool.filter((s) => s.supplier !== item.supplier);
        if (!copy[toKey].some((s) => s.supplier === item.supplier)) {
          copy[toKey].push(item);
        }
      }

      return copy;
    });
  };

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

  const handleExport = async (action) => {
    try {
      setIsExporting(true);
      const stockSuppliers = lists.stock.map(s => s.supplier);
      const availableSuppliers = lists.available.map(s => s.supplier);

      if (
        !netComponents.enabled &&
        !icSource.enabled
      ) {
        showToast({ title: "Export", message: "Please enable at least one platform.", type: "warning" });
        return;
      }

      const totalSuppliers = stockSuppliers.length + availableSuppliers.length;
      const actionLabel = action === "send" ? "Send to platforms" : action === "download" ? "Download file" : "Download + send";
      showToast({ title: "Export", message: `Starting: ${actionLabel} • Suppliers: ${totalSuppliers}`, type: "info", delay: 4000 });

      // Close modal at export start (after validations)
      const modalEl = document.getElementById(id);
      if (modalEl && window.bootstrap) {
        const instance = window.bootstrap.Modal.getInstance(modalEl) || new window.bootstrap.Modal(modalEl);
        instance.hide();
      }

      const payload = {
        netCOMPONENTS: {
          enabled: netComponents.enabled,
          max_stock_rows: netComponents.maxStock || 0,
          max_available_rows: netComponents.maxAvailable || 0,
        },
        icSource: {
          enabled: icSource.enabled,
          max_stock_rows: icSource.maxStock || 0,
          max_available_rows: icSource.maxAvailable || 0,
        },
        stockSuppliers,
        availableSuppliers,
        fileFormat,
        action, // "send" | "download" | "both"
        source: "web",
      };

      if (saveSettings) {
        await axiosInstance.put("api/system-settings/", {
          export_netcomponents: netComponents.enabled,
          export_icsource: icSource.enabled,
          netcomponents_max_stock: netComponents.maxStock || 0,
          netcomponents_max_available: netComponents.maxAvailable || 0,
          icsource_max_stock: icSource.maxStock || 0,
          icsource_max_available: icSource.maxAvailable || 0,
          export_file_format: fileFormat,
          stock_suppliers: stockSuppliers,
          available_suppliers: availableSuppliers,
          auto_update: autoUpdate,
        });
      }

      const res = await axiosInstance.post(
        "/api/inventory/export/platforms/",
        payload,
        { responseType: action !== "send" ? "blob" : undefined }
      );

      if (action !== "send") {
        downloadBlobAsZip(res.data);
      }

      if (action === "send") {
        showToast({ title: "Export", message: "Export sent to platforms successfully.", type: "success" });
      } else if (action === "download") {
        showToast({ title: "Export", message: "Export file downloaded successfully.", type: "success" });
      } else {
        showToast({ title: "Export", message: "Export downloaded and sent successfully.", type: "success" });
      }

    } catch (e) {
      console.error("Export failed:", e);
      showToast({ title: "Export", message: "Export failed. Please try again.", type: "danger" });
    } finally {
      setIsExporting(false);
    }
  };

  // Parts counters for header badges
  const poolParts = countParts(lists.pool);
  const stockParts = countParts(lists.stock);
  const availParts = countParts(lists.available);
  const ncStockOverflow = netComponents.enabled && netComponents.maxStock > 0 && stockParts > netComponents.maxStock;
  const ncAvailOverflow = netComponents.enabled && netComponents.maxAvailable > 0 && availParts > netComponents.maxAvailable;
  const icStockOverflow = icSource.enabled && icSource.maxStock > 0 && stockParts > icSource.maxStock;
  const icAvailOverflow = icSource.enabled && icSource.maxAvailable > 0 && availParts > icSource.maxAvailable;

  return (
    <div className="modal fade" id={id} tabIndex="-1" aria-hidden="true">
      <div className="modal-dialog modal-xl">
        <div className="modal-content">
          <div className="modal-header">
            <h1 className="modal-title fs-5">Export to NC/ICS</h1>
            <button type="button" className="btn-close" data-bs-dismiss="modal" aria-label="Close" />
          </div>

          <div className="modal-body">
            {/* netCOMPONENTS toggle + limits row */}
            <div className="d-flex justify-content-between align-items-center mb-3 gap-2">
              <div className="form-check form-switch">
                <input
                  className="form-check-input"
                  type="checkbox"
                  id="ncEnabledSwitch"
                  checked={netComponents.enabled}
                  onChange={(e) =>
                    setNetComponents((prev) => ({ ...prev, enabled: e.target.checked }))
                  }
                />
                <label className="form-check-label" htmlFor="ncEnabledSwitch">
                  Enable netCOMPONENTS
                </label>
              </div>
              {netComponents.enabled && (
                <div className="input-group input-group-sm limits-group">
                  <span className="input-group-text">Max Stock</span>
                  <input
                    type="number"
                    className="form-control"
                    value={netComponents.maxStock}
                    onChange={(e) =>
                      setNetComponents((prev) => ({
                        ...prev,
                        maxStock: Number(e.target.value || 0),
                      }))
                    }
                  />
                  <span className="input-group-text">Max Available</span>
                  <input
                    type="number"
                    className="form-control"
                    value={netComponents.maxAvailable}
                    onChange={(e) =>
                      setNetComponents((prev) => ({
                        ...prev,
                        maxAvailable: Number(e.target.value || 0),
                      }))
                    }
                  />
                </div>
              )}
            </div>
            <hr />
            {/* ICSource toggle + limits row */}
            <div className="d-flex justify-content-between align-items-center mb-3 gap-2">
              <div className="form-check form-switch">
                <input
                  className="form-check-input"
                  type="checkbox"
                  id="icsEnabledSwitch"
                  checked={icSource.enabled}
                  onChange={(e) =>
                    setIcSource((prev) => ({ ...prev, enabled: e.target.checked }))
                  }
                />
                <label className="form-check-label" htmlFor="icsEnabledSwitch">
                  Enable ICSource
                </label>
              </div>
              {icSource.enabled && (
                <div className="input-group input-group-sm limits-group">
                  <span className="input-group-text">Max Stock</span>
                  <input
                    type="number"
                    className="form-control"
                    value={icSource.maxStock}
                    onChange={(e) =>
                      setIcSource((prev) => ({
                        ...prev,
                        maxStock: Number(e.target.value || 0),
                      }))
                    }
                  />
                  <span className="input-group-text">Max Available</span>
                  <input
                    type="number"
                    className="form-control"
                    value={icSource.maxAvailable}
                    onChange={(e) =>
                      setIcSource((prev) => ({
                        ...prev,
                        maxAvailable: Number(e.target.value || 0),
                      }))
                    }
                  />
                </div>
              )}
            </div>
            <hr />

            {/* Top-right toolbar */}
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
            </div>

            {/* DnD Board */}
            <DndContext
              sensors={sensors}
              collisionDetection={closestCenter}
              onDragStart={handleDragStart}
              onDragOver={handleDragOver}
              onDragEnd={handleDragEnd}
            >
              {/* Search above Pool */}
              <div className="row mb-2">
                <div className="col-12 col-md-4">
                  <div className="d-flex align-items-center gap-2">
                    <input
                      type="text"
                      className="form-control form-control-sm"
                      placeholder="Search suppliers..."
                      value={search}
                      onChange={(e) => setSearch(e.target.value)}
                    />
                    <span className="badge text-bg-secondary">
                      {filteredPool.length} / {lists.pool.length}
                    </span>
                  </div>
                </div>
              </div>

              <div className="row g-3 align-items-stretch export-board flex-md-nowrap">
                {/* Pool */}
                <div className="col-12 col-md-4 d-flex">
                  <div className="w-100 h-100">
                    <Container
                      platformKey="GLOBAL"
                      title="Pool"
                      idPrefix="pool"
                      containerKey="pool"
                      items={filteredPool}
                      isActive={activeContainer === "pool"}
                      badge={
                        <span className="badge text-bg-light">
                          Parts: {poolParts.toLocaleString()}
                        </span>
                      }
                    />
                  </div>
                </div>

                {/* Stock */}
                <div className="col-12 col-md-4 d-flex">
                  <Container
                    platformKey="GLOBAL"
                    title="Stock"
                    idPrefix="stock"
                    containerKey="stock"
                    items={lists.stock}
                    isActive={activeContainer === "stock"}
                    badge={
                      <span
                        className={`badge ${(ncStockOverflow || icStockOverflow) ? "text-bg-warning" : "text-bg-light"}`}
                        title={
                          (ncStockOverflow || icStockOverflow)
                            ? [
                              ncStockOverflow ? `NC exceeds max stock (${netComponents.maxStock.toLocaleString()})` : null,
                              icStockOverflow ? `ICS exceeds max stock (${icSource.maxStock.toLocaleString()})` : null,
                            ].filter(Boolean).join(" • ")
                            : undefined
                        }
                      >
                        Parts: {stockParts.toLocaleString()}
                        {(ncStockOverflow || icStockOverflow) && <i className="bi bi-exclamation-triangle ms-1"></i>}
                      </span>
                    }
                  />
                </div>

                {/* Available */}
                <div className="col-12 col-md-4 d-flex">
                  <Container
                    platformKey="GLOBAL"
                    title="Available"
                    idPrefix="available"
                    containerKey="available"
                    items={lists.available}
                    isActive={activeContainer === "available"}
                    badge={
                      <span
                        className={`badge ${(ncAvailOverflow || icAvailOverflow) ? "text-bg-warning" : "text-bg-light"}`}
                        title={
                          (ncAvailOverflow || icAvailOverflow)
                            ? [
                              ncAvailOverflow ? `NC exceeds max available (${netComponents.maxAvailable.toLocaleString()})` : null,
                              icAvailOverflow ? `ICS exceeds max available (${icSource.maxAvailable.toLocaleString()})` : null,
                            ].filter(Boolean).join(" • ")
                            : undefined
                        }
                      >
                        Parts: {availParts.toLocaleString()}
                        {(ncAvailOverflow || icAvailOverflow) && <i className="bi bi-exclamation-triangle ms-1"></i>}
                      </span>
                    }
                  />
                </div>
              </div>

              {/* Drag overlay */}
              <DragOverlay>
                {activeDrag?.data?.current?.item && (
                  <SupplierBadge item={activeDrag.data.current.item} />
                )}
              </DragOverlay>
            </DndContext>

            <div className="fw-semibold mt-3">
              Total selected parts: {totalSelectedCount.toLocaleString()}
            </div>
          </div>

          <div className="modal-footer justify-content-between">
            <div className="d-flex align-items-center gap-3">
              {saveSettings && (
                <div className="form-check form-switch">
                  <input
                    className="form-check-input"
                    type="checkbox"
                    id="autoUpdateSwitch"
                    checked={autoUpdate}
                    onChange={(e) => setAutoUpdate(e.target.checked)}
                  />
                  <label className="form-check-label" htmlFor="autoUpdateSwitch">
                    Auto Update (daily)
                  </label>
                </div>
              )}
              <div className="form-check form-switch">
                <input
                  className="form-check-input"
                  type="checkbox"
                  id="saveSettingsSwitch"
                  checked={saveSettings}
                  onChange={(e) => setSaveSettings(e.target.checked)}
                />
                <label className="form-check-label" htmlFor="saveSettingsSwitch">
                  Save Settings
                </label>
              </div>
            </div>

            <div>
              <button className="btn btn-secondary me-2" data-bs-dismiss="modal">
                Close
              </button>
              <div className="btn-group dropup">
                <button
                  className="btn btn-primary dropdown-toggle"
                  data-bs-toggle="dropdown"
                  disabled={isExporting}
                >
                  {isExporting ? "Exporting…" : "Export"}
                </button>

                <ul className="dropdown-menu">
                  <li>
                    <button
                      className="dropdown-item"
                      onClick={() => handleExport("send")}
                    >
                      Send to platforms
                    </button>
                  </li>

                  <li>
                    <button
                      className="dropdown-item"
                      onClick={() => handleExport("download")}
                    >
                      Download file only
                    </button>
                  </li>

                  <li>
                    <button
                      className="dropdown-item"
                      onClick={() => handleExport("both")}
                    >
                      Download + send
                    </button>
                  </li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PlatformExportModal;
