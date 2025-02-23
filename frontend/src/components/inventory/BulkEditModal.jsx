import React, { useState, useEffect} from 'react';
import axiosInstance from '../../AxiosInstance';
import Modal from '../common/modal';
import Select from 'react-select';

const BulkEditModal = ({ id, selectedRows }) => {
    const [fields, setFields] = useState([{field: "", value: ""}]);

    // list of fields that can be bulk edited
    const availableFields = [
        { key: "quantity", label: "Quantity", type: "number" },
        { key: "date_code", label: "Date Code", type: "text" },
        { key: "cost", label: "Cost", type: "number" },
        { key: "price", label: "Price", type: "number" },
        { key: "location", label: "Location", type: "text" },
        { key: "supplier", label: "Supplier", type: "text" },
        { key: "manufacturer", label: "Manufacturer", type: "text" },
        { key: "description", label: "Description", type: "text" }
    ];

    const addField = () => {
        setFields([...fields, {field: "", value: ""}]);
    };

    const removeField = (index) => {
        setFields(fields.filter((_, i) => i !== index));
    };

    const updateField = (index, key, value) => {
        const newFields = [...fields];
        newFields[index][key] = value;
        setFields(newFields);
    };

    const isFieldSelected = (field) => fields.some(f => f.field === field);

    // TODO: handle form submission - send bulk edit request to backend
    const handleSubmit = async (e) => {
        e.preventDefault();
        const updates = fields.reduce((acc, field) => {
            if(field.field && field.value){
                acc[field.field] = availableFields.find(f => f.key === field.field).type === "number" ? Number(field.value) : field.value;
            }
            return acc;
        }, {});
        console.log({ updates, ids: selectedRows.map(row => row.id) });
        try {
            const res = await axiosInstance.patch('api/inventory/bulk-edit/', { updates, ids: selectedRows.map(row => row.id) });
            console.log(res.data);
        } catch (error) {
            console.error("Bulk edit failed", error);
        }
    }

            

    return (
        <Modal id={id} title={`Bulk Edit ${selectedRows.length} records`}>
            <form onSubmit={handleSubmit}>
            <div className="modal-body">
                    <div className="d-flex flex-column gap-3">
                        {fields.map((field, index) => (
                            <div key={index} className="d-flex align-items-center gap-3">
                                <div style={{ flex: "2" }}> {/* הפיכת ה-Select לגדול יותר */}
                                    <select 
                                        className="form-select form-select-sm"
                                        value={field.field || ""}
                                        onChange={(e) => updateField(index, 'field', e.target.value)}
                                    >
                                        <option value="" disabled>Select field...</option>
                                        {availableFields.map(option => (
                                            <option 
                                                key={option.key} 
                                                value={option.key} 
                                                disabled={isFieldSelected(option.key)}
                                            >
                                                {option.label}
                                            </option>
                                        ))}
                                    </select>
                                </div>
                                <div style={{ flex: "2" }}> 
                                    <input
                                        type={availableFields.find(f => f.key === field.field)?.type || "text"}
                                        className="form-control form-control-sm"
                                        placeholder="Enter value"
                                        value={field.value}
                                        onChange={(e) => updateField(index, 'value', e.target.value)}
                                    />
                                </div>
                                <button type="button" className="btn btn-danger btn-sm" onClick={() => removeField(index)}>
                                    Remove
                                </button>
                            </div>
                        ))}
                    </div>
                    <button type="button" className="btn btn-outline-primary mt-3 w-100" onClick={addField}>
                        + Add Field
                    </button>
                </div>


                <div className="modal-footer">
                    <button type="submit" className="btn btn-success" data-bs-dismiss="modal">Update</button>
                    <button type="button" className="btn btn-danger" data-bs-dismiss="modal">Discard</button>
                </div>
                
            </form>
        </Modal>
    );
}

export default BulkEditModal;