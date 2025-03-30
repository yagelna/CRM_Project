import { useEffect, useState } from 'react';
import axiosInstance from '../AxiosInstance';
// import bootstrap from 'bootstrap/dist/js/bootstrap.bundle.min.js';
import Modal from '../components/common/modal';

const AI = () => {
    const [partNumbers, setPartNumbers] = useState('');
    const [badges, setBadges] = useState([]);
    const [results, setResults] = useState(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [showModal, setShowModal] = useState(false);

    const handleInputChange = (e) => {
        const text = e.target.value.trim(); 
        setPartNumbers(text);
        const parts = text.split(/\s+/).filter(Boolean);
        setBadges(parts);
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!badges.length) {
            alert("Please enter at least one part number.");
            return;
        }
        
        console.log(badges);
        setLoading(true);
        setError('');
        setResults(null);
        setShowModal(true);
                    

        try {
            const response  = await axiosInstance.post('api/ai/analyze/', { partNumbers: badges });
            setResults(response.data);
            console.log(response.data);
        } catch (err) {
            setError("Error: Failed to fetch data from server.");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        if (showModal) {
            const modal = new bootstrap.Modal(document.getElementById('resultsModal'));
            modal.show();
            setShowModal(false);
        }
    }, [showModal]);
    return (
        <div className="container mt-5 text-center">
            <h1 className="mb-4">Component Analyzer</h1>
            <p className="lead">
                Our system makes analyzing and managing electronic components easy and fast!<br />
                Get up-to-date insights on prices, availability, technical specs, lifecycle status, and more – all in one place.
            </p>
            
            <form onSubmit={handleSubmit} className="aligned-center">
                <div className="mb-3">
                    <div className="ms-3">
                        <label className="form-label">Enter Part Numbers (seperated by spaces):</label>
                        <textarea 
                            className="form-control"
                            rows="3"
                            placeholder="e.g. 12345 67890 ABCD 12-AB."
                            onChange={handleInputChange}
                        />
                        <div id="preview" className="mt-2 d-flex flex-wrap">
                            {badges.map((part, index) => (
                                <span key={index} className="badge bg-primary text-white m-1">{part}</span>
                            ))}
                        </div>
                    </div>
                </div>
                <button type="button" className="btn btn-primary" onClick={handleSubmit}>
                    Analyze Components
                </button>
                {/* show another button if results are already fetched */}
                {results && (
                    <button type="button" className="btn btn-secondary ms-2" onClick={() => setShowModal(true)}>
                        Show Results
                    </button>
                )}
                <Modal id="resultsModal" title="Analysis Results" size='modal-lg'>
                    {/* Spinner */}
                    {loading && (
                        <div className="text-center my-3" id="loadingSpinner">
                            <div className="spinner-border text-primary" role="status">
                                <span className="visually-hidden">Loading...</span>
                            </div>
                            <p>Please wait, analyzing data...</p>
                        </div>
                    )}
    
                    {/* Error */}
                    {error && <div className="alert alert-danger">{error}</div>}
    
                    {/* Results Accordion */}
                    <div className="accordion accordion-flush" id="accordionFlushResults" hidden={loading || error}>
                        {results && Object.entries(results).map(([partNumber, details], index) => (
                            <div className="accordion-item" key={index}>
                                <h2 className="accordion-header" id={`flush-heading${index}`}>
                                    <button className="accordion-button collapsed" type="button" data-bs-toggle="collapse" data-bs-target={`#flush-collapse${index}`} aria-expanded="false" aria-controls={`flush-collapse${index}`}>
                                        Part Number: {partNumber}
                                    </button>
                                </h2>
                                <div id={`flush-collapse${index}`} className="accordion-collapse collapse" aria-labelledby={`flush-heading${index}`} data-bs-parent="#accordionFlushResults">
                                <div className="accordion-body text-start">
                                    <ul>
                                        <li><strong>Availability:</strong> {details.availability.status} ({details.availability.scope})</li>
                                        <li><strong>Description:</strong> {details.availability.description}</li>

                                        <li><strong>Average Price:</strong> {details.average_price}</li>
                                        <li><strong>Min Price:</strong> {details.min_price}</li>
                                        <li><strong>Max Price:</strong> {details.max_price}</li>
                                        <li><strong>Production Start:</strong> {details.production_start}</li>
                                        <li><strong>Production Status:</strong> {details.production_status}</li>
                                        <li><strong>Discontinued Date:</strong> {details.discontinued_date ? details.discontinued_date : 'N/A'}</li>
                                        <li><strong>Alternatives:</strong> {details.alternatives}</li>
                                        <li><strong>Additional Details:</strong> {details.additional_details}</li>
                                    </ul>
                                </div>
                                </div>
                            </div>
                        ))}
                    </div>

                    <div className="modal-footer">
                        <button type="button" className="btn btn-secondary" data-bs-dismiss="modal">Close</button>
                    </div>
                </Modal>
            </form>
        </div>
    );
};

export default AI;
