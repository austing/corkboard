'use client';

import { useState, useEffect } from 'react';
import { Editor } from 'react-draft-wysiwyg';
import { EditorState, convertToRaw, ContentState } from 'draft-js';
import draftToHtml from 'draftjs-to-html';
import htmlToDraft from 'html-to-draftjs';
import 'react-draft-wysiwyg/dist/react-draft-wysiwyg.css';

interface DraftEditorProps {
  content: string;
  onChange: (content: string) => void;
}

export default function DraftEditor({ content, onChange }: DraftEditorProps) {
  const [editorState, setEditorState] = useState(EditorState.createEmpty());

  // Initialize editor with content
  useEffect(() => {
    if (content) {
      try {
        const contentBlock = htmlToDraft(content);
        if (contentBlock) {
          const contentState = ContentState.createFromBlockArray(contentBlock.contentBlocks);
          setEditorState(EditorState.createWithContent(contentState));
        }
      } catch (error) {
        console.error('Error parsing HTML content:', error);
      }
    } else {
      setEditorState(EditorState.createEmpty());
    }
  }, [content]);

  const handleEditorChange = (state: EditorState) => {
    setEditorState(state);
    const currentContentAsHTML = draftToHtml(convertToRaw(state.getCurrentContent()));
    onChange(currentContentAsHTML);
  };

  const toolbarOptions = {
    options: ['inline', 'textAlign', 'colorPicker'],
    inline: {
      options: ['bold', 'italic', 'underline'],
    },
    textAlign: {
      options: ['left', 'center', 'right'],
    },
    colorPicker: {
      colors: [
        'rgb(97,189,109)', 'rgb(26,188,156)', 'rgb(84,172,210)', 'rgb(44,130,201)',
        'rgb(147,101,184)', 'rgb(71,85,119)', 'rgb(204,204,204)', 'rgb(65,168,95)',
        'rgb(0,168,133)', 'rgb(61,142,185)', 'rgb(41,105,176)', 'rgb(85,57,130)',
        'rgb(40,50,78)', 'rgb(0,0,0)', 'rgb(247,218,100)', 'rgb(251,160,38)',
        'rgb(235,107,86)', 'rgb(226,80,65)', 'rgb(163,143,132)', 'rgb(239,239,239)',
        'rgb(255,255,255)', 'rgb(250,197,28)', 'rgb(243,121,52)', 'rgb(209,72,65)',
        'rgb(184,49,47)', 'rgb(124,112,107)', 'rgb(209,213,216)'
      ],
    },
  };

  return (
    <div className="flex-1 flex flex-col border border-gray-300 rounded-md shadow-sm focus-within:ring-indigo-500 focus-within:border-indigo-500">
      <Editor
        editorState={editorState}
        onEditorStateChange={handleEditorChange}
        toolbar={toolbarOptions}
        editorClassName="flex-1 p-3 text-sm min-h-[200px]"
        toolbarClassName="border-b border-gray-200 bg-gray-50 rounded-t-md"
        wrapperClassName="flex-1 flex flex-col"
        editorStyle={{
          minHeight: '200px',
          fontSize: '14px',
          lineHeight: '1.5',
        }}
      />
    </div>
  );
}