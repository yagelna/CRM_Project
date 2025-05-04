import React, { useRef } from "react";
import JoditEditor from "jodit-react";

const RichTextEditor = ({ value, onChange }) => {
    const editor = useRef(null);

    const variables = [
        "my_company", "company_name", "customer_name", "mpn", "email",
        "current_time", "manufacturer", "date_code", "qty_offered",
        "offered_price", "total_price", "id"
    ];

    // insert variable as a badge in the editor
    const insertVariable = (editorInstance, variableKey) => {
        if (editorInstance) {
            const variableText = `{{${variableKey}}}`;
            editorInstance.s.insertHTML(
                `<span class="variable-badge" data-variable="${variableKey}">${variableKey}</span>&nbsp;`
            );
        }
    };

    // when saving the content, convert the badges back to `{{variable}}` format
    const preProcessContent = (content) => {
        return content.replace(/<span class="variable-badge" data-variable="([^"]+)">.*?<\/span>/g, "{{$1}}");
    };

    // when loading the content, convert `{{variable}}` to badges
    const postProcessContent = (content) => {
        return content.replace(/{{(.*?)}}/g, '<span class="variable-badge" data-variable="$1">$1</span>');
    };

    const config = {
        readonly: false,
        height: 400,
        toolbarAdaptive: false,
        showXPathInStatusbar: false,
        buttons: "bold,italic,underline,strikethrough,|,ul,ol,|,outdent,indent,|,font,fontsize,brush,paragraph,|,align,undo,redo,|,hr,fullsize,source",
        extraButtons: [
            {
                name: "insertVariable",
                iconURL: "https://cdn-icons-png.flaticon.com/512/992/992651.png",
                tooltip: "Insert Variable",
                text: " INSERT VARIABLE",
                popup: (editorInstance, current, self, close) => {
                    let html = "<div style='padding:10px;'><strong>Select Variable:</strong><br>";
                    variables.forEach(key => {
                        html += `<button class="variable-btn" data-key="${key}" 
                                    style="margin:5px; padding:5px 10px; border:1px solid #ccc; background:#f8f9fa; cursor:pointer;">
                                    ${key}
                                 </button><br>`;
                    });
                    html += "</div>";

                    const popup = editorInstance.create.fromHTML(html);
                    popup.querySelectorAll(".variable-btn").forEach(button => {
                        button.addEventListener("click", () => {
                            insertVariable(editorInstance, button.getAttribute("data-key"));
                            close();
                        });
                    });

                    return popup;
                },
            },
        ],
    };

    return (
        <>
            <style>
                {`
                    .variable-badge {
                        display: inline-block;
                        background: #007bff;
                        color: white;
                        padding: 2px 6px;
                        border-radius: 5px;
                        font-weight: bold;
                        font-size: 12px;
                        margin: 2px;
                    }
                `}
            </style>
            <JoditEditor
                ref={editor}
                value={postProcessContent(value)} // convert `{{variable}}` to badges
                config={config}
                onBlur={(newContent) => onChange(preProcessContent(newContent))} // convert badges back to `{{variable}}`
            />
        </>
    );
};

export default RichTextEditor;
