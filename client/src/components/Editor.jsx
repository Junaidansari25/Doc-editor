import React, { useEffect, useRef, useState } from 'react';
import Toolbar from './Toolbar.jsx';
import FileImport from './FileImport.jsx';
import SharePanel from './SharePanel.jsx';

export default function Editor({ document, users, currentUserId, onSave, onShare, onImportIntoDocument }) {
  const editorRef = useRef(null);
  const [title, setTitle] = useState('');
  const [contentHtml, setContentHtml] = useState('');
  const [saveState, setSaveState] = useState('idle');

  useEffect(() => {
    setTitle(document?.title || '');
    setContentHtml(document?.contentHtml || '<p></p>');
    if (editorRef.current) {
      editorRef.current.innerHTML = document?.contentHtml || '<p></p>';
    }
    setSaveState('idle');
  }, [document?.id]);

  if (!document) {
    return (
      <main className="editor-shell empty-editor">
        <h2>Select or create a document</h2>
        <p>Create a new document, import a .txt/.md file, or open one shared with you.</p>
      </main>
    );
  }

  function syncEditorContent() {
    setContentHtml(editorRef.current?.innerHTML || '<p></p>');
    setSaveState('dirty');
  }

  async function handleSave() {
    try {
      setSaveState('saving');
      const latestHtml = editorRef.current?.innerHTML || contentHtml;
      await onSave(document.id, { title, contentHtml: latestHtml });
      setContentHtml(latestHtml);
      setSaveState('saved');
    } catch (error) {
      setSaveState('error');
    }
  }

  async function handleImport(formData) {
    const updated = await onImportIntoDocument(document.id, formData);
    if (editorRef.current) editorRef.current.innerHTML = updated.contentHtml;
    setContentHtml(updated.contentHtml);
  }

  const badge = document.accessType === 'owned' ? 'Owned by you' : `Shared by ${document.owner?.name || 'owner'}`;

  return (
    <main className="editor-shell">
      <div className="editor-topbar">
        <div className="title-group">
          <input
            className="title-input"
            value={title}
            onChange={(event) => {
              setTitle(event.target.value);
              setSaveState('dirty');
            }}
            placeholder="Untitled document"
          />
          <span className={`access-pill ${document.accessType}`}>{badge}</span>
        </div>

        <div className="editor-actions">
          <FileImport label="Import into document" onImport={handleImport} modeSelector />
          <button type="button" className="save-button" onClick={handleSave} disabled={saveState === 'saving'}>
            {saveState === 'saving' ? 'Saving…' : 'Save'}
          </button>
          <span className={`save-state ${saveState}`}>{saveState === 'dirty' ? 'Unsaved changes' : saveState}</span>
        </div>
      </div>

      <Toolbar onCommand={syncEditorContent} />

      <div
        ref={editorRef}
        className="document-editor"
        contentEditable
        suppressContentEditableWarning
        onInput={syncEditorContent}
        aria-label="Document editor"
      />

      <SharePanel users={users} currentUserId={currentUserId} document={document} onShare={onShare} />
    </main>
  );
}
