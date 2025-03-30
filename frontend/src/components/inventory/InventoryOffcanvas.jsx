import React, { useState, useEffect} from 'react'; 
import axiosInstance from '../../AxiosInstance';

// Offcanvas: Displays an offcanvas modal with Item details and actions to edit or delete the contact.
const InventoryOffcanvas = ({id, itemData, onDeleteRequest, onArchiveRequest}) => {

    const [Data, setData] = useState({
        mpn: '',
        manufacturer: '',
        description: '',
        quantity: '',
        price: '',
        cost: '',
        location: '',
        date_code: '',
        supplier: '',
    });

    useEffect(() => {
        console.log('itemData:', itemData);
        if (itemData) {
            console.log('itemData:', itemData);
            setData({
                mpn: itemData.mpn,
                manufacturer: itemData.manufacturer,
                description: itemData.description,
                quantity: itemData.quantity,
                price: itemData.price,
                cost: itemData.cost,
                location: itemData.location,
                date_code: itemData.date_code,
                supplier: itemData.supplier,
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
    }, [itemData]);

    const handleDelete = () => {
        if (!itemData || !itemData.id) {
            console.error('Item data is missing or invalid.');
            return;
        }
        onDeleteRequest(itemData.id);
    };

    const handleArchive = () => {
        if (!itemData || !itemData.id) {
            console.error('Item data is missing or invalid.');
            return;
        }
        onArchiveRequest([itemData.id]);
    };

    return (
        <div className="offcanvas offcanvas-end" tabIndex="-1" id={id} aria-labelledby="offcanvasRightLabel">
            <div className="offcanvas-header">
                <h5 className="offcanvas-title" id="offcanvasRightLabel">{Data.mpn}</h5>
                <button type="button" className="btn-close" data-bs-dismiss="offcanvas" aria-label="Close"></button>
            </div>  
            <hr className='m-0'/>
            <div className="offcanvas-body">
                {/* edit item button */}
                <button type="button" className="btn btn-warning btn-sm mb-2 me-2" data-bs-toggle="modal" data-bs-target="#EditInventoryModal">
                    Edit Inventory Item
                    <i className="bi bi-pencil ms-2"></i>
                </button>
                {/* delete item button */}
                <button type="button" className="btn btn-danger btn-sm mb-2 me-2" data-bs-dismiss="offcanvas" aria-label="Delete" onClick={handleDelete}>
                    Delete Inventory Item
                    <i className="bi bi-trash ms-2"></i>
                </button>
                {/* archive item button */}
                <button type="button" className="btn btn-secondary btn-sm mb-2" data-bs-dismiss="offcanvas" aria-label="Archive" onClick={handleArchive}>    
                    Archive Inventory Item
                    <i className="bi bi-archive ms-2"></i>
                </button>

                <div className="accordion" id="itemAccordion">
                    <div className="accordion-item">
                        <h2 className="accordion-header">
                            <button className="accordion-button" type="button" data-bs-toggle="collapse" data-bs-target="#ItemtDetails" aria-expanded="true" aria-controls="ItemtDetails">
                                Item Inventory Details
                            </button>
                        </h2>
                        <div className="accordion-collapse collapse show" id="ItemtDetails" data-bs-parent="#itemAccordion">
                            <div className="accordion-body">
                                <div className="row">
                                    <div className="col-6">
                                        <p><strong>MPN:</strong> {itemData?.mpn}</p>
                                        <p><strong>Manufacturer:</strong> {itemData?.manufacturer}</p>
                                        <p><strong>Description:</strong> {itemData?.description}</p>
                                        <p><strong>Quantity:</strong> {itemData?.quantity}</p>
                                        <p><strong>Price:</strong> {itemData?.price}</p>
                                        <p><strong>Cost:</strong> {itemData?.cost}</p>
                                        <p><strong>Location:</strong> {itemData?.location}</p>
                                        <p><strong>Date Code:</strong> {itemData?.date_code}</p>
                                        <p><strong>Supplier:</strong> {itemData?.supplier}</p>
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
export default InventoryOffcanvas;
