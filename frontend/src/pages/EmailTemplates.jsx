import React, { useEffect, useState } from "react";
import RichTextEditor from "../components/common/RichTextEditor";
import axiosInstance from "../AxiosInstance";

const defaultTemplates = [
    { name: "quote", label: "Quote Template", subject: "Quote For {mpn} [FlyChips]", content: "" },
    { name: "lowtp", label: "Target Price Request Email", subject: "Target Price Inquiry {mpn}", content: "" },
    { name: "nostock", label: "No Stock Alert", subject: "Availability Update for {mpn} - Out of Stock", content: "" },
    { name: "reminder", label: "Quote Reminder", subject: "Reminder: Quote For {mpn} [FlyChips]", content: "" },
    { name: "mov", label: "Minimum Order Value Alert", subject: "Minimum Order Value Alert", content: "" },
    { name: "noexport", label: "No Export Alert", subject: "No Export Alert", content: "" },
    { name: "icsupdate", label: "ICSource Update", subject: "ICS Update", content: "" },
    { name: "ncupdate", label: "netCOMPONENTS Update", subject: "netCOMPONENTS Update", content: "" },
];

const EmailTemplates = () => {
    const [templates, setTemplates] = useState(defaultTemplates);
    const [selectedTemplate, setSelectedTemplate] = useState(null);
    const [emailSubject, setEmailSubject] = useState("");
    const [htmlContent, setHtmlContent] = useState("");
    const [preview, setPreview] = useState(false);
    const testData = {
        my_company: "DotzHub",
        company_name: "Apple Inc.",
        customer_name: "John Doe",
        mpn: "LM324-ABC",
        email: "john.doe@apple.com",
        current_time: new Date().toLocaleString(),
        manufacturer: "XYZ Manufacturing",
        date_code: "2025-03",
        qty_offered: 1000,
        offered_price: 5.00,
        total_price: 5000.00,
        id: 12345,
    };

    const replaceTestData = (text) => {
        return text.replace(/\{\{(.*?)\}\}/g, (_, key) => testData[key.trim()] || key);
    };

    useEffect(() => {
        fetchTemplates();
    }, []);

    const fetchTemplates = async () => {
        try {
            const response = await axiosInstance.get("/api/email-templates/");
            const dbTemplates = response.data;

            const updatedTemplates = defaultTemplates.map(defaultTemplate => {
                const dbTemplate = dbTemplates.find(t => t.name === defaultTemplate.name);
                return dbTemplate ? { ...defaultTemplate, ...dbTemplate } : defaultTemplate;
            });

            setTemplates(updatedTemplates);

            // אם אין תבנית נבחרת, בוחרים את הראשונה אחרי שהמידע נטען
            if (!selectedTemplate) {
                setSelectedTemplate(updatedTemplates[0]);
                setEmailSubject(updatedTemplates[0].subject);
                setHtmlContent(updatedTemplates[0].content);
            }

        } catch (error) {
            console.error("Error fetching templates:", error);
        }
    };

    const handleTemplateSelect = (template) => {
        setSelectedTemplate(template);
        setEmailSubject(template.subject);
        setHtmlContent(template.content);
    };

    const handleSave = async () => {
        const payload = {
            name: selectedTemplate.name,
            subject: emailSubject,
            content: htmlContent
        };

        try {
            const existingTemplate = templates.find(t => t.name === selectedTemplate.name && t.id);
            if (existingTemplate) {
                await axiosInstance.put(`/api/email-templates/${existingTemplate.id}/`, payload);
            } else {
                await axiosInstance.post("/api/email-templates/", payload);
            }
            fetchTemplates();
        } catch (error) {
            console.error("Error saving template:", error);
        }
    };

    return (
        <div className="row d-flex align-items-stretch">
            {/* Sidebar Card */}
            <div className="col-sm-3 d-flex">
                <div className="card flex-grow-1">
                    <div className="card-body">
                        <h4 className="card-title">Email Templates</h4>
                        <div className="list-group">
                            {templates.map((template) => (
                                <button 
                                    key={template.name} 
                                    className={`list-group-item list-group-item-action ${selectedTemplate?.name === template.name ? 'active' : ''}`}
                                    onClick={() => handleTemplateSelect(template)}
                                >
                                    {template.label}
                                </button>
                            ))}
                        </div>
                    </div>
                </div>
            </div>

            {/* Editor Card */}
            <div className="col-sm-9 d-flex">
                <div className="card flex-grow-1">
                    <div className="card-body">
                        <h4 className="card-title">Edit Template</h4>
                        <div className="mb-3">
                            <label className="form-label">Subject</label>
                            <input 
                                type="text" 
                                className="form-control" 
                                value={emailSubject} 
                                onChange={(e) => setEmailSubject(e.target.value)} 
                            />
                        </div>
                        

                        <RichTextEditor value={htmlContent} onChange={setHtmlContent} />
                        <div className="d-grid mt-3">
                            <button className="btn btn-primary" onClick={handleSave}>Save Template</button>
                            <button className="btn btn-secondary mt-2" onClick={() => setPreview(true)}>Preview with Test Data</button>
                        </div>
                    </div>
                </div>
            </div>

            {/* תצוגה מקדימה */}
            {preview && (
                <div className="col-12 mt-4">
                    <div className="card">
                        <div className="card-body">
                            <h4 className="card-title">Template Preview</h4>
                            <p className="text-muted">How your email will look with test data</p>
                            <div className="mb-3">
                                <strong>Subject</strong>
                                <div className="border p-2 bg-light">{replaceTestData(emailSubject)}</div>
                            </div>
                            <div className="mb-3">
                                <strong>Content</strong>
                                <div className="border p-3 bg-light" dangerouslySetInnerHTML={{ __html: replaceTestData(htmlContent) }}></div>
                            </div>
                            <button className="btn btn-danger" onClick={() => setPreview(false)}>Close Preview</button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default EmailTemplates;
