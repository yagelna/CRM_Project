import React, { useState, useEffect } from "react";
import RichTextEditor from "../components/common/RichTextEditor";
import { Button, Modal } from "react-bootstrap";

const mockTemplates = [
    { 
        name: "Price Quotation", 
        type: "RFQ Email",
        subject: "Price Quotation for {{rfq_number}}",
        description: "Standard template for price quotations",
        content: `Dear {{contact.first_name}},<br/><br/>
        Thank you for your Request for Quotation ({{rfq_number}}).<br/>
        We are pleased to submit our quotation as per your requirements.`
    },
    { 
        name: "Request More Information", 
        type: "RFQ Email",
        subject: "Request for Additional Info - {{rfq_number}}",
        description: "Template for requesting additional information",
        content: `Dear {{contact.first_name}},<br/><br/>
        We require additional details regarding your request for {{rfq_number}}.`
    }
];

const EmailTemplates = () => {
    const [templates] = useState(mockTemplates);
    const [selectedTemplate, setSelectedTemplate] = useState(null);
    const [emailSubject, setEmailSubject] = useState("");
    const [emailDescription, setEmailDescription] = useState("");
    const [htmlContent, setHtmlContent] = useState("");
    const [showModal, setShowModal] = useState(false);

    const handleTemplateSelect = (template) => {
        setSelectedTemplate(template.name);
        setEmailSubject(template.subject);
        setEmailDescription(template.description);
        setHtmlContent(template.content);
    };

    const handleSave = () => {
        console.log("Saving Template:", {
            name: selectedTemplate,
            subject: emailSubject,
            description: emailDescription,
            content: htmlContent
        });
        alert("Template saved successfully! (Mock)");
    };

    useEffect(() => {
        if (templates.length > 0) {
            handleTemplateSelect(templates[0]);
        }
    } , [templates]);

    return (
        <div>
            <div className="row d-flex">
                {/* Sidebar לבחירת התבניות */}
                <div className="col-4">
                    <div className="card shadow-sm p-3 bg-light rounded">
                        <div className="d-flex justify-content-between align-items-center mb-3">
                            <h6>Email Templates</h6>
                            <Button variant="dark" size="sm" onClick={() => setShowModal(true)}>+ New</Button>
                        </div>

                        <div className="list-group">
                            {templates.map((template) => (
                                <button 
                                    key={template.name} 
                                    className={`list-group-item list-group-item-action ${selectedTemplate === template.name ? 'active' : ''}`}
                                    onClick={() => handleTemplateSelect(template)}
                                >
                                    <strong>{template.name}</strong>
                                    <br />
                                    <small className="text-muted">{template.description}</small>
                                </button>
                            ))}
                        </div>
                    </div>
                </div>

                {/* עורך התבניות */}
                {selectedTemplate && (
                    <div className="col-7">
                        <div className="card shadow-sm p-4 bg-white rounded">
                            <h5 className="mb-3">Edit Template: {selectedTemplate}</h5>
                            <div className="mb-3">
                                <label className="form-label">Template Name</label>
                                <input type="text" className="form-control" value={selectedTemplate} disabled />
                            </div>
                            <div className="mb-3">
                                <label className="form-label">Template Type</label>
                                <input type="text" className="form-control" value="RFQ Email" disabled />
                            </div>
                            <div className="mb-3">
                                <label className="form-label">Email Subject</label>
                                <input 
                                    type="text" 
                                    className="form-control"
                                    value={emailSubject} 
                                    onChange={(e) => setEmailSubject(e.target.value)}
                                />
                            </div>
                            <div className="mb-3">
                                <label className="form-label">Description</label>
                                <input 
                                    type="text" 
                                    className="form-control"
                                    value={emailDescription} 
                                    onChange={(e) => setEmailDescription(e.target.value)}
                                />
                            </div>
                            <label className="form-label">Email Content</label>
                            <RichTextEditor value={htmlContent} onChange={setHtmlContent} />
                            
                            <Button className="mt-3 w-100" variant="primary" onClick={handleSave}>
                                Save Template
                            </Button>
                        </div>
                    </div>
                )}
            </div>

            {/* Modal ליצירת תבנית חדשה */}
            <Modal show={showModal} onHide={() => setShowModal(false)}>
                <Modal.Header closeButton>
                    <Modal.Title>Create New Template</Modal.Title>
                </Modal.Header>
                <Modal.Body>
                    <form>
                        <div className="mb-3">
                            <label className="form-label">Template Name</label>
                            <input type="text" className="form-control" placeholder="e.g. Quote Response" />
                        </div>
                        <div className="mb-3">
                            <label className="form-label">Email Subject</label>
                            <input type="text" className="form-control" placeholder="e.g. RE: {{rfq_number}}" />
                        </div>
                        <div className="mb-3">
                            <label className="form-label">Description</label>
                            <input type="text" className="form-control" placeholder="Brief description of this template" />
                        </div>
                        <div className="mb-3">
                            <label className="form-label">Type</label>
                            <select className="form-select">
                                <option>RFQ Email</option>
                                <option>Contact Email</option>
                                <option>General Notification</option>
                            </select>
                        </div>
                        <div className="mb-3 form-check">
                            <input type="checkbox" className="form-check-input" id="conditionalLogic" />
                            <label className="form-check-label" htmlFor="conditionalLogic">Enable Conditional Logic</label>
                        </div>
                    </form>
                </Modal.Body>
                <Modal.Footer>
                    <Button variant="secondary" onClick={() => setShowModal(false)}>Cancel</Button>
                    <Button variant="primary">Create Template</Button>
                </Modal.Footer>
            </Modal>
        </div>
    );
};

export default EmailTemplates;
