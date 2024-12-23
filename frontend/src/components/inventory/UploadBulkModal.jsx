import React, { useState, useEffect} from 'react';
import axios from 'axios';
import Modal from '../modal/modal';

const UploadBulkModal = ({ id }) => {
    const [file, setFile] = useState(null);
    const [uploadStatus, setUploadStatus] = useState(null);

    const handleFileChange = (e) => {
        setFile(e.target.files[0]);
    };

    const handleUpload = async () => { 
        const formData = new FormData(); 
        formData.append('file', file);

        try {
            const response = await axios.post('http://localhost:8000/api/inventory/upload/', formData, {
                headers: {
                    'Content-Type': 'multipart/form-data',
                },
            });
            setUploadStatus(response.data.message);
            alert('File uploaded successfully');
            document.querySelector(`#${id} .btn-close`).click();


        } catch (error) {
            console.error('Error uploading file: ', error);
            setUploadStatus('Error uploading file');
        }
    };

    return (
        <Modal id={id} title='Upload Bulk Inventory'>
            <form>
                <div className="mb-3">
                    <input
                        type="file"
                        className="form-control"
                        onChange={handleFileChange}
                    />
                </div>
                <div className="alert alert-info" role="alert">
                    NOTE: This feature is not available yet
                </div>
                <button type="button" className="btn btn-primary" onClick={handleUpload}>Upload</button>
                {uploadStatus && <div className="mt-3">{uploadStatus}</div>}
            </form>
        </Modal>
    );
}

export default UploadBulkModal;