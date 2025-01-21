import React, { useState, useEffect} from "react";
import axiosInstance from "../../AxiosInstance";

const ExportModal = ({ id }) => {
    const [selectedButton, setSelectedButton] = useState("inventoryButton");
    const [suppliers, setSuppliers] = useState([]);

    const handleChange = (e) => {
        setSelectedButton(e.target.id); // set the selected button
    };
    const fetchSuppliers = () => {
        axiosInstance.get("api/inventory/suppliers/")
            .then((response) => {
                setSuppliers(response.data.suppliers);
            })
            .catch((error) => console.error('Error fetching suppliers: ' + error));
    }
 
    useEffect(() => {
        console.log("fetching suppliers..");
        fetchSuppliers();        
    }, []);

    useEffect(() => {
        console.log("Updated suppliers: ", suppliers);
    }, [suppliers]);

    return (
        <div className="modal fade" id="ExportModal" tabIndex="-1" aria-labelledby="exampleModalLabel" aria-hidden="true">
            <div className="modal-dialog modal-xl">
                <div className="modal-content">
                    <div className="modal-header">
                        <h1 className="modal-title fs-5" id="exportModalLabel">Export......</h1>
                        <button type="button" className="btn-close" data-bs-dismiss="modal" aria-label="Close"></button>
                    </div>
                    <div className="modal-body d-flex flex-column align-items-center justify-content-center">
                        <p> Choose the format to export the data</p>
                        <div className="btn-group mx-auto" role="group" aria-label="Basic radio toggle button group">
                            <input
                                type="radio"
                                className="btn-check"
                                name="btnradio"
                                id="inventoryButton"
                                autoComplete="off"
                                checked={selectedButton === "inventoryButton"}
                                onChange={handleChange}
                            />
                            <label className="btn btn-outline-primary" htmlFor="inventoryButton">Inventory</label>
                            <input
                                type="radio"
                                className="btn-check"
                                name="btnradio"
                                id="netcomponentsButton"
                                autoComplete="off"
                                checked={selectedButton === "netcomponentsButton"}
                                onChange={handleChange}
                            />
                            <label className="btn btn-outline-primary" htmlFor="netcomponentsButton">NetComponents</label>
                            <input
                                type="radio"
                                className="btn-check"
                                name="btnradio"
                                id="icsourceButton"
                                autoComplete="off"
                                checked={selectedButton === "icsourceButton"}
                                onChange={handleChange}
                            />
                            <label className="btn btn-outline-primary" htmlFor="icsourceButton">IC Source</label>
                        </div>
                        <p> Choose the suppliers you want to export</p>
                        <div className="d-flex flex-column align-items-center">
                            {suppliers.map((supplier) => (
                                <div className="form-check">
                                    <input className="form-check-input" type="checkbox" value="e" id={supplier.id} />
                                    <label className="form-check-label" htmlFor={supplier.id}>
                                        {supplier.name}
                                    </label>
                                </div>
                            ))}
                            </div>
                    </div>
                    <div className="modal-footer">
                        <button type="button" className="btn btn-secondary" data-bs-dismiss="modal">Close</button>
                        <button type="button" className="btn btn-primary">Save changes</button>
                    </div>
                </div>
            </div>
        </div>
    );
};
export default ExportModal;
