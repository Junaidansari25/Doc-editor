import React, { useRef, useState } from 'react';

export default function FileImport({ label, onImport, modeSelector = false, disabled = false }) {
  const inputRef = useRef(null);
  const [mode, setMode] = useState('append');
  const [isUploading, setIsUploading] = useState(false);

  async function handleChange(event) {
    const file = event.target.files?.[0];
    if (!file) return;

    const formData = new FormData();
    formData.append('file', file);
    if (modeSelector) formData.append('mode', mode);

    try {
      setIsUploading(true);
      await onImport(formData);
    } finally {
      setIsUploading(false);
      if (inputRef.current) inputRef.current.value = '';
    }
  }

  return (
    <div className="file-import">
      {modeSelector && (
        <select value={mode} onChange={(event) => setMode(event.target.value)} disabled={disabled || isUploading}>
          <option value="append">Append file content</option>
          <option value="replace">Replace document content</option>
        </select>
      )}
      <label className={`file-button ${disabled || isUploading ? 'disabled' : ''}`}>
        {isUploading ? 'Importing…' : label}
        <input
          ref={inputRef}
          type="file"
          accept=".txt,.md,text/plain,text/markdown"
          onChange={handleChange}
          disabled={disabled || isUploading}
        />
      </label>
      <small>Supports .txt and .md up to 1 MB.</small>
    </div>
  );
}
