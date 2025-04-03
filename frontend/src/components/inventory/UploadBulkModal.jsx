import React, { useState, useEffect, useRef } from 'react';
import axiosInstance from '../../AxiosInstance';
import Modal from '../common/modal';
import { showToast } from '../common/toast';

const UploadBulkModal = ({ id, fetchInventory }) => {
    const [file, setFile] = useState(null);
    const [isUploading, setIsUploading] = useState(false);
    const [failedRows, setFailedRows] = useState([]);
    const fileInputRef = useRef();

    const handleFileChange = (e) => {
        setFile(e.target.files[0]);
        setFailedRows([]);
    };

    const handleUpload = async () => { 
        if(!file) {
            showToast({ type: 'warning', title: 'Error', message: 'Please select a file to upload', icon: '<i class="bi bi-exclamation-circle-fill"></i>' });
            return;
        }
        const formData = new FormData(); 
        formData.append('file', file);

        try {
            setIsUploading(true);
            const response = await axiosInstance.post('api/inventory/upload/', formData, {
                headers: {
                    'Content-Type': 'multipart/form-data',
                },
            });
            const successCount = response.data.success_count || 0;
            const failedCount = response.data.failed_count || 0;
            const failed = response.data.failed_details || [];
            setFailedRows(failed);
            const total = successCount + failedCount;
            const baseMessage = `${successCount} item(s) uploaded successfully out of ${total}.`;
            if(successCount === 0) {
                showToast({ 
                    type: 'danger',
                    title: 'Upload Failed',
                    message: 'No items were uploaded',
                    icon: '<i class="bi bi-exclamation-triangle-fill"></i>' });
            } else if (failedCount > 0) {
                showToast({
                    type: 'warning',
                    title: 'Upload Partial Success',
                    message: `✅ ${baseMessage}<br/>⚠️ ${failedCount} failed.`,
                    icon: '<i class="bi bi-exclamation-triangle-fill"></i>' });
            } else {
                showToast({
                    type: 'success',
                    title: 'Upload Success',
                    message: baseMessage,
                    icon: '<i class="bi bi-check-circle-fill"></i>' });
                document.querySelector(`#${id} .btn-close`).click();
            }
            if (successCount > 0 && typeof fetchInventory === 'function') {
                fetchInventory(true);
            }
            console.log(response.data);
        } catch (error) {
            console.error('Error uploading file: ', error);
            showToast({ type: 'danger', title: 'Upload Failed', message: 'Something went wrong during upload', icon: '<i class="bi bi-exclamation-triangle-fill"></i>' });
            setFailedRows(error?.response?.data?.failed_details || []);
        } finally {
            setFile(null);
            if(fileInputRef.current) fileInputRef.current.value = null;
            setIsUploading(false);
        }

    };

    return (
        <Modal id={id} title='Upload Bulk Inventory' size='modal-lg'>
            <form>
                <div className="mb-3">
                    <input
                        type="file"
                        className="form-control"
                        onChange={handleFileChange}
                        ref={fileInputRef}
                    />
                </div>
                <div className="alert alert-warning" role="alert">
                    <i className="bi bi-exclamation-circle me-2"></i>
                    Please note:
                    <ul className="mb-0 mt-1">
                        <li>This will <strong>add</strong> new items to your existing inventory.</li>
                        <li>Existing inventory will <strong>not</strong> be overwritten or cleared.</li>
                        <li>The upload process might take a few minutes depending on file size.</li>
                    </ul>
                </div>
                <button type="button" className="btn btn-primary" onClick={handleUpload} disabled={isUploading}>
                    {isUploading ? (
                        <>
                            <span className="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>
                            Uploading...
                        </>
                    ) : (
                        'Upload'
                    )}
                </button>
                {failedRows.length > 0 && (
                    <div className="mt-4">
                        <h6 className="text-danger">Failed Rows:</h6>
                        <div className="table-responsive" style={{ maxHeight: "200px", overflowY: "auto" }}>
                            <table className="table table-sm table-bordered table-hover">
                                <thead className="table-light">
                                    <tr>
                                        <th>Row</th>
                                        <th>Error</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {failedRows.map((row, idx) => (
                                        <tr key={idx}>
                                            <td>{row.row + 2}</td> {/* +2: כי Excel מתחיל ב-1 וכולל גם header */}
                                            <td>{row.error}</td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>
                )}

            </form>
        </Modal>
    );
}

export default UploadBulkModal;