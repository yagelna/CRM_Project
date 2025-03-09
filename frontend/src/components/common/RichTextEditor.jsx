import React, { useRef, useEffect } from "react";
import ReactQuill, { Quill } from "react-quill";
import "react-quill/dist/quill.snow.css";
import "./RichTextEditor.css"; 

// יצירת פורמט מותאם אישית ל-Placeholder
const Embed = Quill.import("blots/embed");

class PlaceholderBlot extends Embed {
  static create(value) {
    let node = super.create(value);
    node.setAttribute("data-name", value);
    node.innerText = `{{${value}}}`;
    return node;
  }

  static value(node) {
    return node.getAttribute("data-name");
  }
}

PlaceholderBlot.blotName = "placeholder";
PlaceholderBlot.tagName = "span";
PlaceholderBlot.className = "ql-placeholder";

Quill.register(PlaceholderBlot);

// רשימת ה-Placeholders שאפשר לבחור
const PLACEHOLDERS = ["mpn", "customer_name", "quote_price", "order_number"];

const RichTextEditor = ({ value, onChange }) => {
  const quillRef = useRef(null);

  useEffect(() => {
    if (quillRef.current) {
      let toolbar = quillRef.current.getEditor().getModule("toolbar");
      toolbar.addHandler("placeholder", insertPlaceholderFromToolbar);
    }
  }, []);

  // הוספת ה-placeholder לתוך Quill במיקום הסמן
  const insertPlaceholder = (placeholder) => {
    const editor = quillRef.current?.getEditor();
    if (!editor) return;
    const range = editor.getSelection();
    if (range) {
      editor.insertEmbed(range.index, "placeholder", placeholder);
      editor.setSelection(range.index + 1);
    }
  };

  // כאשר בוחרים ערך מה-dropdown ב-toolbar
  const insertPlaceholderFromToolbar = (value) => {
    if (value) insertPlaceholder(value);
  };

  const modules = {
    toolbar: {
      container: [
        [{ font: [] }],
        [{ size: ["small", false, "large", "huge"] }],
        ["bold", "italic", "underline", "strike"],
        [{ color: [] }, { background: [] }],
        [{ align: [] }],
        [{ list: "ordered" }, { list: "bullet" }],
        ["link", "image"],
        [{ placeholder: PLACEHOLDERS }], // 🔥 הוספת כפתור הבחירה של הטוקנים
        ["clean"],
      ],
    },
  };

  return (
    <ReactQuill
      ref={quillRef}
      value={value}
      onChange={onChange}
      modules={modules}
      theme="snow"
    />
  );
};

export default RichTextEditor;
