import React, { useEffect, useState } from "react";
import RichTextEditor from "../components/common/RichTextEditor";
import axiosInstance from "../AxiosInstance";

const mockTemplates = [
    { 
        name: "quote-tab", 
        subject: "Quote For {mpn} [FlyChips]", 
        content: "<p>Hello,</p><p>Here is your quote for {mpn}.</p><p>Best regards,<br>FlyChips Team</p>" 
    },
    { 
        name: "tp-alert-tab", 
        subject: "Target Price Inquiry {mpn}", 
        content: "<p>Hello,</p><p>We noticed a low target price for {mpn}.</p><p>Please confirm.</p>" 
    },
    { 
        name: "no-stock-tab", 
        subject: "Availability Update for {mpn} - Out of Stock", 
        content: "<p>Hello,</p><p>Unfortunately, {mpn} is currently out of stock.</p>" 
    }
];

const EmailTemplates = () => {
    const [templates] = useState(mockTemplates);
    const [selectedTemplate, setSelectedTemplate] = useState(null);
    const [emailSubject, setEmailSubject] = useState("");
    const [htmlContent, setHtmlContent] = useState("");

    const handleTemplateSelect = (e) => {
        const templateName = e.target.value;
        const template = templates.find(t => t.name === templateName);
        if (template) {
            setSelectedTemplate(templateName);
            setEmailSubject(template.subject);
            setHtmlContent(template.content);
        }
    };

    const handleSave = () => {
        console.log("Saving Template:", {
            name: selectedTemplate,
            subject: emailSubject,
            content: htmlContent
        });
        alert("Template saved successfully! (Mock)");
    };

    useEffect(() => {
        // Load default template on startup only
        if (!selectedTemplate) {
            handleTemplateSelect({ target: { value: templates[0].name } });
        }
    } , [selectedTemplate, templates]);

    return (
        <div className="row">
            <div className="col-sm-4">
                <div className="card">
                    <div className="card-body">
                        <h4 className="card-title">Email Templates</h4>
                        <div className="card-text">
                            <div className="list-group">
                                {templates.map((template) => (
                                    <button 
                                        key={template.name} 
                                        className={`list-group-item list-group-item-action ${selectedTemplate === template.name ? 'active' : ''}`}
                                        onClick={handleTemplateSelect}
                                        value={template.name}
                                    >
                                        {template.name}
                                    </button>
                                ))}
                            </div>
                        </div>
                    </div>
                </div>
                </div>
                <div className="col-sm-8">
                <div className="card">
                    <div className="card-body">
                        <h4 className="card-title">Edit Template</h4>
                        <div className="mb-3">
                            <label className="form-label">Subject</label>
                            <input type="text" className="form-control" value={emailSubject} onChange={(e) => setEmailSubject(e.target.value)} />
                        </div>
                        <RichTextEditor value={htmlContent} onChange={setHtmlContent} />
                        <div className="d-grid mt-3">
                            <button className="btn btn-primary" onClick={handleSave}>Save</button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default EmailTemplates;