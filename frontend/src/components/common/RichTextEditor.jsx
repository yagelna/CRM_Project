import React, { useState } from "react";
import ReactQuill from "react-quill";
import "react-quill/dist/quill.snow.css";

const RichTextEditor = ({ value, onChange }) => {
    const modules = {
        toolbar: [
            [{ 'font': [] }], // גופן
            [{ 'size': ['small', false, 'large', 'huge'] }], // גודל טקסט
            ["bold", "italic", "underline", "strike"], // הדגשות
            [{ color: [] }, { background: [] }], // צבעים
            [{ align: [] }], // יישור טקסט
            [{ list: "ordered" }, { list: "bullet" }], // רשימות
            ["link", "image"], // קישורים + תמונות
            ["clean"], // ניקוי עיצוב
        ],
    };

    return (
        <ReactQuill
            value={value}
            onChange={onChange}
            modules={modules}
            theme="snow"
        />
    );
};

export default RichTextEditor;