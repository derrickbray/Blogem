// client/src/components/common/RichTextEditor.js

import React, { useMemo } from 'react';
import ReactQuill from 'react-quill-new';
import 'react-quill-new/dist/quill.snow.css'; // Import Quill styles

const RichTextEditor = ({ 
  value, 
  onChange, 
  placeholder = "Start writing your chapter...", 
  disabled = false,
  maxLength = 100000, // Default max length for rich text
  onLengthChange // Callback for character count updates
}) => {

  // Configure toolbar with writing-focused tools
  const modules = useMemo(() => ({
    toolbar: [
      // Text formatting
      [{ 'header': [1, 2, 3, false] }],
      ['bold', 'italic', 'underline', 'strike'],
      
      // Text alignment and lists
      [{ 'align': [] }],
      [{ 'list': 'ordered'}, { 'list': 'bullet' }],
      
      // Quotes and links
      ['blockquote', 'link'],
      
      // Text color and highlighting
      [{ 'color': [] }, { 'background': [] }],
      
      // Clear formatting
      ['clean']
    ],
    // Enable clipboard for copy/paste
    clipboard: {
      matchVisual: false,
    }
  }), []);

  // Define allowed formats
  const formats = [
    'header', 'font', 'size',
    'bold', 'italic', 'underline', 'strike', 'blockquote',
    'list', 'bullet', 'align',
    'link', 'color', 'background'
  ];

  // Handle content changes
  const handleChange = (content, delta, source, editor) => {
    // Get plain text length for character counting
    const textLength = editor.getLength() - 1; // Subtract 1 for the trailing newline
    
    // Call parent's length change handler
    if (onLengthChange) {
      onLengthChange(textLength, content.length);
    }

    // Enforce max length if specified
    if (maxLength && content.length > maxLength) {
      return; // Don't update if over limit
    }

    // Call parent's change handler
    onChange(content);
  };

  return (
    <div className="rich-text-editor">
      <ReactQuill
        theme="snow"
        value={value || ''}
        onChange={handleChange}
        modules={modules}
        formats={formats}
        placeholder={placeholder}
        readOnly={disabled}
        style={{
          height: '400px', // Set minimum height
          marginBottom: '50px' // Space for toolbar
        }}
      />
    </div>
  );
};

export default RichTextEditor;