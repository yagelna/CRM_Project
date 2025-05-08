import React, { useState, useEffect } from 'react';
import axiosInstance from '../../AxiosInstance';
import Modal from '../common/modal';

const ExportModal = ({
    id,
    entityLabel = 'Items',
    totalCount = 0,
    selectedRows = [],
    allFields = [],
    exportEndpoint = '',
}) => {

    const [exportFormat, setExportFormat] = useState('xlsx');     // 'xlsx' | 'csv'
    const [exportScope, setExportScope] = useState('all');      // 'all'   | 'selected'
    const [selectedFields, setSelectedFields] = useState(
        allFields.map(f => f.value)
    );

    useEffect(() => {
        setSelectedFields(allFields.map(f => f.value));
      }, [allFields]);

    const toggleField = (value) => {
        setSelectedFields(prev =>
            prev.includes(value)
                ? prev.filter(v => v !== value)
                : [...prev, value]
        );
    };

    const handleExportClick = async () => {
        if (selectedFields.length === 0) return;
        if (exportScope === 'selected' && selectedRows.length === 0) return;

        const payload = {
            format: exportFormat,
            scope: exportScope,
            fields: selectedFields,
            ...(exportScope === 'selected' && { ids: selectedRows.map(r => r.id) })
        };
        
        console.log('Export Payload:', payload);
        // Make the API call to export data
        try {
            const response = await axiosInstance.post(exportEndpoint, payload, {responseType: 'blob'});
            // Handle the response to download the file
            const blob = new Blob([response.data], { type: response.headers['content-type'] });
            const url  = URL.createObjectURL(blob);
            const a    = document.createElement('a');
            a.href     = url;
            a.download = `${entityLabel.toLowerCase()}_export.${exportFormat}`;
            a.click();
            URL.revokeObjectURL(url);
            a.remove();
        } catch (error) {
            console.error('Error exporting data:', error);
            // Optionally, show an error message to the user
            alert('Failed to export data. Please try again later.');
        }
    };


    return (
        <Modal id={id} title={`Export ${entityLabel}`} size="modal-md">
            <div className="card p-3 mb-3">

                {/* Export Format */}
                <div className="mb-3">
                    <label htmlFor="formatSelect" className="form-label">Export Format</label>
                    <select
                        id="formatSelect"
                        className="form-select"
                        value={exportFormat}
                        onChange={e => setExportFormat(e.target.value)}
                    >
                        <option value="xlsx">Excel</option>
                        <option value="csv">CSV</option>
                    </select>
                </div>

                {/* Export Scope */}
                <div className="mb-3">
                    <label htmlFor="scopeSelect" className="form-label">Export Scope</label>
                    <select
                        id="scopeSelect"
                        className="form-select"
                        value={exportScope}
                        onChange={e => setExportScope(e.target.value)}
                    >
                        <option value="all">All {entityLabel} ({totalCount})</option>
                        <option value="selected" disabled={selectedRows.length === 0}>
                            Selected ({selectedRows.length})
                        </option>
                    </select>
                </div>

                {/* Fields to Export */}
                <div className="mb-3">
                    <label className="form-label">Fields to Export</label>

                    <div className="dropdown w-100">
                        <button
                            className="form-select dropdown-toggle text-start"
                            type="button"
                            id="fieldsDropdown"
                            data-bs-toggle="dropdown"
                            aria-expanded="false"
                            
                        >
                            {selectedFields.length === allFields.length
                                ? 'All Fields'
                                : `${selectedFields.length} of ${allFields.length} Fields`}
                        </button>


                        <ul
                            className="dropdown-menu w-100"
                            aria-labelledby="fieldsDropdown"
                            style={{ maxHeight: '200px', overflowY: 'auto' }}
                        >
                            {allFields.map(f => (
                                <li key={f.value}>
                                    <div
                                        className="dropdown-item d-flex align-items-center"
                                        onClick={() => toggleField(f.value)}
                                        style={{ cursor: 'pointer' }}
                                    >
                                        <input
                                            type="checkbox"
                                            className="form-check-input me-2"
                                            checked={selectedFields.includes(f.value)}
                                            readOnly
                                            id={`field-${f.value}`}
                                        />
                                        <label
                                            className="form-check-label"
                                            htmlFor={`field-${f.value}`}
                                            style={{ userSelect: 'none' }}
                                        >
                                            {f.label}
                                        </label>
                                    </div>
                                </li>
                            ))}
                        </ul>
                    </div>
                </div>

                <div className="text-end">
                    <button
                        type="button"
                        className="btn btn-success"
                        onClick={handleExportClick}
                        disabled={
                            selectedFields.length === 0 ||
                            (exportScope === 'selected' && selectedRows.length === 0)
                        }
                    >
                        Export
                    </button>
                </div>
            </div>
        </Modal>
    );
};

export default ExportModal;
