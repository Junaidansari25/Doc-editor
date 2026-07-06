import React, { useEffect, useMemo, useState } from 'react';
import { api } from './api.js';
import DocumentList from './components/DocumentList.jsx';
import Editor from './components/Editor.jsx';
import FileImport from './components/FileImport.jsx';

const USER_STORAGE_KEY = 'ajaia-docs-user-id';

export default function App() {
  const [users, setUsers] = useState([]);
  const [currentUserId, setCurrentUserId] = useState(localStorage.getItem(USER_STORAGE_KEY) || '');
  const [documents, setDocuments] = useState({ owned: [], shared: [] });
  const [selectedDocumentId, setSelectedDocumentId] = useState('');
  const [selectedDocument, setSelectedDocument] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [notice, setNotice] = useState('');
  const [error, setError] = useState('');

  const currentUser = useMemo(
    () => users.find((user) => user.id === currentUserId),
    [users, currentUserId]
  );

  async function loadUsers() {
    const data = await api.getUsers();
    setUsers(data.users);
    if (!currentUserId && data.users.length) {
      setCurrentUserId(data.users[0].id);
      localStorage.setItem(USER_STORAGE_KEY, data.users[0].id);
    }
  }

  async function loadDocuments(userId = currentUserId) {
    if (!userId) return;
    const data = await api.listDocuments(userId);
    setDocuments(data);

    const allDocs = [...data.owned, ...data.shared];
    const currentStillVisible = allDocs.some((doc) => doc.id === selectedDocumentId);
    if (!currentStillVisible && allDocs.length) {
      setSelectedDocumentId(allDocs[0].id);
    }
    if (!allDocs.length) {
      setSelectedDocumentId('');
      setSelectedDocument(null);
    }
  }

  async function loadSelectedDocument() {
    if (!currentUserId || !selectedDocumentId) return;
    const data = await api.getDocument(currentUserId, selectedDocumentId);
    setSelectedDocument(data.document);
  }

  useEffect(() => {
    async function boot() {
      try {
        setIsLoading(true);
        await loadUsers();
      } catch (err) {
        setError(err.message);
      } finally {
        setIsLoading(false);
      }
    }
    boot();
  }, []);

  useEffect(() => {
    if (!currentUserId) return;
    localStorage.setItem(USER_STORAGE_KEY, currentUserId);
    loadDocuments(currentUserId).catch((err) => setError(err.message));
  }, [currentUserId]);

  useEffect(() => {
    if (!selectedDocumentId) return;
    loadSelectedDocument().catch((err) => setError(err.message));
  }, [selectedDocumentId, currentUserId]);

  async function createDocument() {
    try {
      setError('');
      const data = await api.createDocument(currentUserId, {
        title: 'Untitled document',
        contentHtml: '<h1>Untitled document</h1><p>Start writing here...</p>'
      });
      await loadDocuments();
      setSelectedDocumentId(data.document.id);
      setNotice('Document created.');
    } catch (err) {
      setError(err.message);
    }
  }

  async function saveDocument(id, payload) {
    try {
      setError('');
      const data = await api.updateDocument(currentUserId, id, payload);
      setSelectedDocument(data.document);
      await loadDocuments();
      setNotice('Document saved.');
      return data.document;
    } catch (err) {
      setError(err.message);
      throw err;
    }
  }

  async function shareDocument(targetUserId) {
    try {
      setError('');
      const data = await api.shareDocument(currentUserId, selectedDocument.id, targetUserId);
      setSelectedDocument(data.document);
      await loadDocuments();
      setNotice('Access granted. Switch users to view the shared document.');
      return data.document;
    } catch (err) {
      setError(err.message);
      throw err;
    }
  }

  async function importNewDocument(formData) {
    try {
      setError('');
      const data = await api.importNewDocument(currentUserId, formData);
      await loadDocuments();
      setSelectedDocumentId(data.document.id);
      setNotice('File imported as a new document.');
      return data.document;
    } catch (err) {
      setError(err.message);
      throw err;
    }
  }

  async function importIntoDocument(id, formData) {
    try {
      setError('');
      const data = await api.importIntoDocument(currentUserId, id, formData);
      setSelectedDocument(data.document);
      await loadDocuments();
      setNotice('File content imported into document.');
      return data.document;
    } catch (err) {
      setError(err.message);
      throw err;
    }
  }

  const allDocuments = [...documents.owned, ...documents.shared];

  return (
    <div className="app-shell">
      <aside className="sidebar">
        <div className="brand-block">
          <div className="brand-mark">A</div>
          <div>
            <h1>Ajaia Docs Lite</h1>
            <p>Collaborative document editor MVP</p>
          </div>
        </div>

        <label className="user-switcher">
          Active user
          <select value={currentUserId} onChange={(event) => setCurrentUserId(event.target.value)}>
            {users.map((user) => (
              <option key={user.id} value={user.id}>
                {user.name}
              </option>
            ))}
          </select>
        </label>

        {currentUser && <p className="current-user">Signed in as {currentUser.email}</p>}

        <div className="sidebar-actions">
          <button type="button" className="primary-action" onClick={createDocument} disabled={!currentUserId}>
            + New document
          </button>
          <FileImport label="Import .txt/.md as document" onImport={importNewDocument} disabled={!currentUserId} />
        </div>

        {notice && <div className="notice" onAnimationEnd={() => setNotice('')}>{notice}</div>}
        {error && <div className="error-box">{error}</div>}

        {isLoading ? (
          <p>Loading workspace…</p>
        ) : (
          <DocumentList
            owned={documents.owned}
            shared={documents.shared}
            selectedId={selectedDocumentId}
            onSelect={setSelectedDocumentId}
          />
        )}
      </aside>

      <Editor
        document={selectedDocument || allDocuments.find((doc) => doc.id === selectedDocumentId)}
        users={users}
        currentUserId={currentUserId}
        onSave={saveDocument}
        onShare={shareDocument}
        onImportIntoDocument={importIntoDocument}
      />
    </div>
  );
}
