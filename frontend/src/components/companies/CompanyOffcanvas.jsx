import React, { useState, useEffect} from 'react'; 
import axiosInstance from '../../AxiosInstance';

// Offcanvas: Displays an offcanvas modal with Company details, company's contacts, company's RFQs, and actions to edit or delete the company.
const Offcanvas = ({id, companyData, onDeleteRequest}) => {

    const [Data, setData] = useState({
        name: '',
        domain: '',
        website: '',
        country: '',
        address: '',
    });

    const [companyContacts, setCompanyContacts] = useState([]);
    const [companyRfqs, setCompanyRfqs] = useState([]);
    const [companyContactsLoading, setCompanyContactsLoading] = useState(true);
    const [companyRfqsLoading, setCompanyRfqsLoading] = useState(true);
    const [companyContactsError, setCompanyContactsError] = useState(null);
    const [companyRfqsError, setCompanyRfqsError] = useState(null);

    useEffect(() => {
        if (companyData) {
            setData({
                name: companyData.name,
                domain: companyData.domain,
                website: companyData.website,
                country: companyData.country,
                address: companyData.address,
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
        }
    }, [companyData]);

    const handleDelete = () => {
        if (!companyData || !companyData.id) {
            console.error('Company data is missing or invalid.');
            return;
        }
        onDeleteRequest(companyData.id);
    };

    const fetchCompanyContacts = async () => {
        setCompanyContactsLoading(true);
        setCompanyContactsError(null);
        if (!companyData || !companyData.id) {
            console.error('Company data is missing or invalid.');
            return;
        }
        try {
            const response = await axiosInstance.get(`api/companies/${companyData.id}/contacts/`);
            setCompanyContacts(response.data);
            setCompanyContactsLoading(false);
        } catch (error) {
            setCompanyContactsError(error);
        }
        finally {
            setCompanyContactsLoading(false);
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
                {/* edit company button */}
                <button type="button" className="btn btn-warning btn-sm mb-2 me-2" data-bs-toggle="modal" data-bs-target="#EditCompanyModal">
                    Edit Company
                    <i className="bi bi-pencil ms-2"></i>
                </button>
                {/* delete company button */}
                <button type="button" className="btn btn-danger btn-sm mb-2" data-bs-dismiss="offcanvas" aria-label="Delete" onClick={handleDelete}>
                    Delete Company
                    <i className="bi bi-trash ms-2"></i>
                </button>

                <div className="accordion" id="companyAccordion">
                    <div className="accordion-item">
                        <h2 className="accordion-header">
                            <button className="accordion-button" type="button" data-bs-toggle="collapse" data-bs-target="#companyDetails" aria-expanded="true" aria-controls="companyDetails">
                                Company Details
                            </button>
                        </h2>
                        <div className="accordion-collapse collapse show" id="companyDetails" data-bs-parent="#companyAccordion">
                            <div className="accordion-body">
                                <div className="row">
                                    <div className="col-6">
                                        <p><strong>Domain:</strong> {Data.domain}</p>
                                        <p><strong>Website:</strong> {Data.website}</p>
                                    </div>
                                    <div className="col-6">
                                        <p><strong>Country:</strong> {Data.country}</p>
                                        <p><strong>Address:</strong> {Data.address}</p>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                    <div className="accordion-item">
                        <h2 className="accordion-header">
                            <button className="accordion-button" type="button" data-bs-toggle="collapse" data-bs-target="#companyContacts" aria-expanded="false" aria-controls="companyContacts">
                                Contacts
                            </button>
                        </h2>
                        <div className="accordion-collapse collapse" id="companyContacts" data-bs-parent="#companyAccordion">
                            <div className="accordion-body">
                                {companyContactsLoading && <p>Loading...</p>}
                                {companyContactsError && <p className='text-danger'>Error loading contacts: {companyContactsError.message}</p>}
                                {!companyContactsLoading && !companyContactsError && companyContacts.length === 0 && <p>No contacts found.</p>}
                                {!companyContactsLoading && !companyContactsError && companyContacts.length > 0 && (
                                    <div className="table-responsive">
                                        <table className="table table-striped table-hover">
                                            <thead>
                                                <tr>
                                                    <th>Name</th>
                                                    <th>Email</th>
                                                    <th>Phone</th>
                                                </tr>
                                            </thead>
                                            <tbody>
                                                {companyContacts.map((contact) => (
                                                    <tr key={contact.id}>
                                                        <td>{contact.name}</td>
                                                        <td>{contact.email}</td>
                                                        <td>{contact.phone}</td>
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
                        
                    <div className="accordion-item">
                        <h2 className="accordion-header">
                            <button className="accordion-button" type="button" data-bs-toggle="collapse" data-bs-target="#companyRfqs" aria-expanded="false" aria-controls="companyRfqs">
                                RFQs
                            </button>
                        </h2>
                        <div className="accordion-collapse collapse" id="companyRfqs" data-bs-parent="#companyAccordion">
                            <div className="accordion-body">
                                <div className="row">
                                    <div className="col-12">
                                        <p>No RFQs found.</p>
                                    </div>
                                </div>
                            </div>
                        </div>  
                    </div>
                </div>
            </div>
        </div>
    );
};
export default Offcanvas;
