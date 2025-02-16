import React, { useState, useEffect} from 'react'; 
import axiosInstance from '../../AxiosInstance';

// Offcanvas: Displays an offcanvas modal with Contact details, contact's RFQs, and actions to edit or delete the contact.
const ContactOffcanvas = ({id, contactData, onDeleteRequest}) => {

    const [Data, setData] = useState({
        name: '',
        email: '',
        phone: '',
        company: '',
    });

    const [contactRfqs, setContactRfqs] = useState([]);
    const [contactRfqsLoading, setContactRfqsLoading] = useState(true);
    const [contactRfqsError, setContactRfqsError] = useState(null);
    useEffect(() => {
        if (contactData) {
            console.log('contactData:', contactData);
            setData({
                name: contactData.name,
                email: contactData.email,
                phone: contactData.phone,
                company: contactData.company_name,
            });

            const accordionElements = document.querySelectorAll('.accordion-collapse'); 
            const accordionButtons = document.querySelectorAll('.accordion-button');
            accordionElements.forEach((element, index) => {
                if (index === 0) {
                    element.classList.add('show');
                    accordionButtons[index].classList.remove('collapsed');
                }
                else {
                    element.classList.remove('show');
                    accordionButtons[index].classList.add('collapsed');
                }
            });
            fetchContactRfqs();
        }
    }, [contactData]);

    const handleDelete = () => {
        if (!contactData || !contactData.id) {
            console.error('Contact data is missing or invalid.');
            return;
        }
        onDeleteRequest(contactData.id);
    };

    const fetchContactRfqs = async () => {
        setContactRfqsLoading(true);
        setContactRfqsError(null);
        if (!contactData || !contactData.id) {
            console.error('Contact data is missing or invalid.');
            return;
        }
        try {
            const response = await axiosInstance.get(`api/contacts/${contactData.id}/rfqs/`);
            setContactRfqs(response.data);
            setContactRfqsLoading(false);
        } catch (error) {
            setContactRfqsError(error);
        }
        finally {
            setContactRfqsLoading(false);
        }
    }

    return (
        <div className="offcanvas offcanvas-end" tabIndex="-1" id={id} aria-labelledby="offcanvasRightLabel">
            <div className="offcanvas-header">
                <h5 className="offcanvas-title" id="offcanvasRightLabel">{Data.name}</h5>
                <button type="button" className="btn-close" data-bs-dismiss="offcanvas" aria-label="Close"></button>
            </div>  
            <hr className='m-0'/>
            <div className="offcanvas-body">
                {/* edit contact button */}
                <button type="button" className="btn btn-warning btn-sm mb-2 me-2" data-bs-toggle="modal" data-bs-target="#EditContactModal">
                    Edit Contact
                    <i className="bi bi-pencil ms-2"></i>
                </button>
                {/* delete contact button */}
                <button type="button" className="btn btn-danger btn-sm mb-2" data-bs-dismiss="offcanvas" aria-label="Delete" onClick={handleDelete}>
                    Delete Contact
                    <i className="bi bi-trash ms-2"></i>
                </button>

                <div className="accordion" id="contactAccordion">
                    <div className="accordion-item">
                        <h2 className="accordion-header">
                            <button className="accordion-button" type="button" data-bs-toggle="collapse" data-bs-target="#contactDetails" aria-expanded="true" aria-controls="contactDetails">
                                Contact Details
                            </button>
                        </h2>
                        <div className="accordion-collapse collapse show" id="contactDetails" data-bs-parent="#contactAccordion">
                            <div className="accordion-body">
                                <div className="row">
                                    <div className="col-6">
                                        <p><strong>Name:</strong> {Data.name}</p>
                                        <p><strong>Company:</strong> {Data.company}</p>
                                        <p><strong>Email:</strong> {Data.email}</p>
                                        <p><strong>Phone:</strong> {Data.phone}</p>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                        
                    <div className="accordion-item">
                        <h2 className="accordion-header">
                            <button className="accordion-button" type="button" data-bs-toggle="collapse" data-bs-target="#contactRfqs" aria-expanded="false" aria-controls="contactRfqs">
                                RFQs
                            </button>
                        </h2>
                        <div className="accordion-collapse collapse" id="contactRfqs" data-bs-parent="#contactAccordion">
                            <div className="accordion-body">
                                {contactRfqsLoading && <p>Loading...</p>}
                                {contactRfqsError && <p className='text-danger'>Error loading RFQs: {contactRfqsError.message}</p>}
                                {!contactRfqsLoading && !contactRfqsError && contactRfqs.length === 0 && <p>No RFQs found.</p>}
                                {!contactRfqsLoading && !contactRfqsError && contactRfqs.length > 0 && (
                                    <div className="table-responsive">
                                        <table className="table table-striped table-hover">
                                            <thead>
                                                <tr>
                                                    <th>MPN</th>
                                                    <th>MFG</th>
                                                    <th>QTY</th>
                                                    <th>T/P</th>
                                                    <th>Status</th>
                                                    <th>Date</th>
                                                </tr>
                                            </thead>
                                            <tbody>
                                                {contactRfqs.map((rfq) => (
                                                    <tr key={rfq.id}>
                                                        <td>{rfq.mpn}</td>
                                                        <td>{rfq.manufacturer}</td>
                                                        <td>{rfq.qty_requested}</td>
                                                        <td>{rfq.target_price}</td>
                                                        <td>{rfq.status}</td>
                                                        <td>{rfq.created_at}</td>
                                                    </tr>
                                                ))}
                                            </tbody>
                                            
                                        </table>
                                    </div>
                                )                                        
                                }                            
                            </div>
                        </div>  
                    </div>
                </div>
            </div>
        </div>
    );
};
export default ContactOffcanvas;
