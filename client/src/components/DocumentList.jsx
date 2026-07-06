import React from 'react';

function DocumentRow({ doc, selectedId, onSelect }) {
  const isSelected = doc.id === selectedId;
  return (
    <button
      className={`doc-row ${isSelected ? 'selected' : ''}`}
      type="button"
      onClick={() => onSelect(doc.id)}
    >
      <span className="doc-title">{doc.title}</span>
      <span className={`access-pill ${doc.accessType}`}>{doc.accessType}</span>
      <small>Owner: {doc.owner?.name || 'Unknown'}</small>
    </button>
  );
}

export default function DocumentList({ owned, shared, selectedId, onSelect }) {
  return (
    <div className="document-list">
      <section>
        <h3>Owned documents</h3>
        {owned.length ? (
          owned.map((doc) => <DocumentRow key={doc.id} doc={doc} selectedId={selectedId} onSelect={onSelect} />)
        ) : (
          <p className="empty-state">No owned documents yet.</p>
        )}
      </section>

      <section>
        <h3>Shared with me</h3>
        {shared.length ? (
          shared.map((doc) => <DocumentRow key={doc.id} doc={doc} selectedId={selectedId} onSelect={onSelect} />)
        ) : (
          <p className="empty-state">No shared documents yet.</p>
        )}
      </section>
    </div>
  );
}
