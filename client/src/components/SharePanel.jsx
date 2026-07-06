import React, { useMemo, useState } from 'react';

export default function SharePanel({ users, currentUserId, document, onShare }) {
  const [targetUserId, setTargetUserId] = useState('');
  const [isSharing, setIsSharing] = useState(false);

  const availableUsers = useMemo(() => {
    const alreadyShared = new Set(document?.sharedWith?.map((user) => user.id) || []);
    return users.filter((user) => user.id !== document?.ownerId && !alreadyShared.has(user.id));
  }, [users, document]);

  const isOwner = document?.ownerId === currentUserId;

  async function handleShare() {
    if (!targetUserId) return;
    try {
      setIsSharing(true);
      await onShare(targetUserId);
      setTargetUserId('');
    } finally {
      setIsSharing(false);
    }
  }

  return (
    <aside className="share-panel">
      <h3>Sharing</h3>
      <p>
        Owner: <strong>{document?.owner?.name || 'Unknown'}</strong>
      </p>

      <div className="shared-users">
        <span>Shared with:</span>
        {document?.sharedWith?.length ? (
          document.sharedWith.map((user) => <strong key={user.id}>{user.name}</strong>)
        ) : (
          <em>No users yet</em>
        )}
      </div>

      {isOwner ? (
        <div className="share-form">
          <select value={targetUserId} onChange={(event) => setTargetUserId(event.target.value)}>
            <option value="">Choose a seeded user</option>
            {availableUsers.map((user) => (
              <option key={user.id} value={user.id}>
                {user.name} ({user.email})
              </option>
            ))}
          </select>
          <button type="button" onClick={handleShare} disabled={!targetUserId || isSharing}>
            {isSharing ? 'Sharing…' : 'Grant access'}
          </button>
        </div>
      ) : (
        <p className="hint">You can edit because this document was shared with you, but only the owner can grant access.</p>
      )}
    </aside>
  );
}
