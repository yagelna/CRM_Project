import React, { useEffect, useState } from "react";
import RichTextEditor from "../components/common/RichTextEditor";
import axiosInstance from "../AxiosInstance";


const EmailTemplates = () => {

    const [templates, setTemplates] = useState([]);
    const [selectedTemplate, setSelectedTemplate] = useState(null);
    const [htmlContent, setHtmlContent] = useState("");

    const fetchTemplates = async () => {
        try {
            const response = await axiosInstance.get("/email-templates");
            setTemplates(response.data);
        } catch (error) {
            console.error("Error fetching email templates:", error);
        }
    };

    useEffect(() => {
        // fetchTemplates();
    }, []);

    const handleTemplateSelect = async (e) => {
        const templateName = e.target.value;
        setSelectedTemplate(templateName);

        // fetch template content of the selected template
        try {
            const response = axiosInstance.get(`/email-templates/${templateName}`);
            setHtmlContent(response.data.content);
        } catch (error) {
            console.error("Error fetching email template content:", error);
        }
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
                <div className="col-8">
                    <RichTextEditor value={htmlContent} onChange={setHtmlContent} />
                </div>
        </div>
    </div>
    );
}
export default EmailTemplates;