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

    return (
        <div className="container mt-4">
            <h1>Email Templates</h1>
            <p>Manage your email templates here.</p>
            <div className="row">
                <div className="col-4">
                    <select className="form-select" onChange={handleTemplateSelect}>
                        <option value="">Select a template...</option>
                        {templates.map((template) => (
                            <option key={template.name} value={template.name}>
                                {template.name}
                            </option>
                        ))}
                    </select>
                </div>
                {selectedTemplate && (
                    <div className="col-8">
                        <div className="mb-3">
                            <label className="form-label">Email Subject</label>
                            <input 
                                type="text" 
                                className="form-control"
                                value={emailSubject} 
                                onChange={(e) => setEmailSubject(e.target.value)} 
                            />
                        </div>
                        <RichTextEditor value={htmlContent} onChange={setHtmlContent} />
                        <button className="btn btn-primary mt-3" onClick={handleSave}>
                            Save Template
                        </button>
                    </div>
                )}
            </div>
        </div>
    );
};

export default EmailTemplates;