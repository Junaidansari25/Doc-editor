const fs = require('fs');
const path = require('path');
const { v4: uuid } = require('uuid');

function nowIso() {
  return new Date().toISOString();
}

function defaultDbPath() {
  return process.env.DB_PATH || path.join(__dirname, '..', 'data', 'db.json');
}

function initialData() {
  const createdAt = nowIso();
  const welcomeDocId = 'doc_welcome';
  return {
    users: [
      { id: 'u_ajaia', name: 'Ajaia Reviewer', email: 'reviewer@ajaia.local' },
      { id: 'u_junaid', name: 'Junaid Ansari', email: 'junaid@example.com' },
      { id: 'u_meera', name: 'Meera Shah', email: 'meera@example.com' }
    ],
    documents: [
      {
        id: welcomeDocId,
        ownerId: 'u_junaid',
        title: 'Welcome to Ajaia Docs Lite',
        contentHtml:
          '<h1>Welcome to Ajaia Docs Lite</h1><p>This is a persisted rich-text document.</p><ul><li>Create and rename documents</li><li>Use bold, italic, underline, headings and lists</li><li>Share this document with another seeded user</li></ul>',
        createdAt,
        updatedAt: createdAt
      }
    ],
    shares: [
      { id: 'share_welcome_reviewer', documentId: welcomeDocId, userId: 'u_ajaia', createdAt }
    ]
  };
}

function ensureFile(filePath) {
  const dir = path.dirname(filePath);
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
  if (!fs.existsSync(filePath)) {
    fs.writeFileSync(filePath, JSON.stringify(initialData(), null, 2));
  }
}

function readJson(filePath) {
  ensureFile(filePath);
  const raw = fs.readFileSync(filePath, 'utf8');
  return JSON.parse(raw);
}

function writeJson(filePath, data) {
  const tmpPath = `${filePath}.tmp`;
  fs.writeFileSync(tmpPath, JSON.stringify(data, null, 2));
  fs.renameSync(tmpPath, filePath);
}

function sanitizeRichTextHtml(input = '') {
  if (typeof input !== 'string') return '';

  return input
    .replace(/<script[\s\S]*?>[\s\S]*?<\/script>/gi, '')
    .replace(/<style[\s\S]*?>[\s\S]*?<\/style>/gi, '')
    .replace(/\son\w+\s*=\s*"[^"]*"/gi, '')
    .replace(/\son\w+\s*=\s*'[^']*'/gi, '')
    .replace(/javascript:/gi, '');
}

function normalizeTitle(title) {
  const clean = String(title || '').trim();
  return clean.slice(0, 120);
}

function createStore(customPath) {
  const filePath = customPath || defaultDbPath();

  function read() {
    return readJson(filePath);
  }

  function write(data) {
    writeJson(filePath, data);
  }

  function findUser(data, userId) {
    return data.users.find((user) => user.id === userId);
  }

  function isOwner(data, documentId, userId) {
    return data.documents.some((doc) => doc.id === documentId && doc.ownerId === userId);
  }

  function isSharedWith(data, documentId, userId) {
    return data.shares.some((share) => share.documentId === documentId && share.userId === userId);
  }

  function canAccess(data, documentId, userId) {
    return isOwner(data, documentId, userId) || isSharedWith(data, documentId, userId);
  }

  function enrichDocument(data, doc, viewerId) {
    const owner = data.users.find((user) => user.id === doc.ownerId);
    const sharedWith = data.shares
      .filter((share) => share.documentId === doc.id)
      .map((share) => data.users.find((user) => user.id === share.userId))
      .filter(Boolean);

    return {
      ...doc,
      owner,
      sharedWith,
      accessType: doc.ownerId === viewerId ? 'owned' : 'shared'
    };
  }

  return {
    reset() {
      write(initialData());
    },

    listUsers() {
      return read().users;
    },

    requireUser(userId) {
      const data = read();
      const user = findUser(data, userId);
      if (!user) {
        const err = new Error('Unknown user. Choose one of the seeded users.');
        err.status = 401;
        throw err;
      }
      return user;
    },

    listDocumentsForUser(userId) {
      const data = read();
      const docs = data.documents
        .filter((doc) => canAccess(data, doc.id, userId))
        .sort((a, b) => new Date(b.updatedAt) - new Date(a.updatedAt))
        .map((doc) => enrichDocument(data, doc, userId));

      return {
        owned: docs.filter((doc) => doc.accessType === 'owned'),
        shared: docs.filter((doc) => doc.accessType === 'shared')
      };
    },

    createDocument({ title, contentHtml = '', ownerId }) {
      const data = read();
      const createdAt = nowIso();
      const doc = {
        id: uuid(),
        ownerId,
        title: normalizeTitle(title) || 'Untitled document',
        contentHtml: sanitizeRichTextHtml(contentHtml) || '<p></p>',
        createdAt,
        updatedAt: createdAt
      };

      data.documents.push(doc);
      write(data);
      return enrichDocument(data, doc, ownerId);
    },

    getDocument(documentId, viewerId) {
      const data = read();
      const doc = data.documents.find((item) => item.id === documentId);
      if (!doc) {
        const err = new Error('Document not found.');
        err.status = 404;
        throw err;
      }
      if (!canAccess(data, documentId, viewerId)) {
        const err = new Error('You do not have access to this document.');
        err.status = 403;
        throw err;
      }
      return enrichDocument(data, doc, viewerId);
    },

    updateDocument(documentId, viewerId, updates) {
      const data = read();
      const doc = data.documents.find((item) => item.id === documentId);
      if (!doc) {
        const err = new Error('Document not found.');
        err.status = 404;
        throw err;
      }
      if (!canAccess(data, documentId, viewerId)) {
        const err = new Error('You do not have access to edit this document.');
        err.status = 403;
        throw err;
      }

      if (Object.prototype.hasOwnProperty.call(updates, 'title')) {
        const title = normalizeTitle(updates.title);
        if (!title) {
          const err = new Error('Document title is required.');
          err.status = 400;
          throw err;
        }
        doc.title = title;
      }

      if (Object.prototype.hasOwnProperty.call(updates, 'contentHtml')) {
        doc.contentHtml = sanitizeRichTextHtml(updates.contentHtml);
      }

      doc.updatedAt = nowIso();
      write(data);
      return enrichDocument(data, doc, viewerId);
    },

    shareDocument(documentId, ownerId, targetUserId) {
      const data = read();
      const doc = data.documents.find((item) => item.id === documentId);
      if (!doc) {
        const err = new Error('Document not found.');
        err.status = 404;
        throw err;
      }
      if (!isOwner(data, documentId, ownerId)) {
        const err = new Error('Only the document owner can share this document.');
        err.status = 403;
        throw err;
      }
      if (!findUser(data, targetUserId)) {
        const err = new Error('User to share with was not found.');
        err.status = 400;
        throw err;
      }
      if (targetUserId === ownerId) {
        const err = new Error('The owner already has access.');
        err.status = 400;
        throw err;
      }

      const existing = data.shares.find(
        (share) => share.documentId === documentId && share.userId === targetUserId
      );

      if (!existing) {
        data.shares.push({ id: uuid(), documentId, userId: targetUserId, createdAt: nowIso() });
        doc.updatedAt = nowIso();
        write(data);
      }

      return enrichDocument(data, doc, ownerId);
    }
  };
}

module.exports = {
  createStore,
  initialData,
  sanitizeRichTextHtml
};
