'use client';

import React from 'react';
import FroalaEditorComponent from 'react-froala-wysiwyg';

// Import Froala Editor css files
import 'froala-editor/css/froala_style.min.css';
import 'froala-editor/css/froala_editor.pkgd.min.css';

// Import Froala Editor plugins
import 'froala-editor/js/plugins.pkgd.min.js';

interface FroalaEditorProps {
  content: string;
  onChange: (content: string) => void;
  height?: number;
  maxHeight?: number;
}

export default function FroalaEditor({ content, onChange, height, maxHeight }: FroalaEditorProps) {
  const config = {
    placeholderText: 'Enter your content here...',
    height: height || 300,
    heightMax: maxHeight || 500,
    heightMin: 200,
    listAdvancedTypes: true,
    toolbarButtons: [
      'bold', 'italic', 'underline', 'textColor', '|',
      'alignLeft', 'alignCenter', 'alignRight', '|',
      'formatOL', 'formatUL'
    ],
    toolbarButtonsXS: [
      'bold', 'italic', 'underline', 'textColor', '|',
      'formatOL', 'formatUL'
    ],
    fontSize: false,
    fontFamily: false,
    paragraphFormat: false,
    quickInsertEnabled: false,
    events: {
      'contentChanged': function(this: unknown) {
        const editor = this as { html: { get: () => string } };
        onChange(editor.html.get());
      }
    }
  };

  return (
    <div className="flex-1 flex flex-col">
      <FroalaEditorComponent
        tag="textarea"
        config={config}
        model={content}
        onModelChange={(model: string) => onChange(model)}
      />
    </div>
  );
}