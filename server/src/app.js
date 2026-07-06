const path = require('path');
const express = require('express');
const cors = require('cors');
const multer = require('multer');
const { createStore } = require('./store');
const { convertUploadedFile, SUPPORTED_EXTENSIONS } = require('./fileImport');

const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 1024 * 1024
  }
});

function createApp(options = {}) {
  const app = express();
  const store = createStore(options.dbPath);

  app.locals.store = store;

  app.use(cors());
  app.use(express.json({ limit: '2mb' }));

  app.get('/api/health', (_req, res) => {
    res.json({ ok: true, app: 'ajaia-docs-lite' });
  });

  app.get('/api/users', (_req, res, next) => {
    try {
      res.json({ users: store.listUsers() });
    } catch (error) {
      next(error);
    }
  });

  app.use('/api', (req, _res, next) => {
    try {
      const userId = req.header('x-user-id');
      if (!userId) {
        const err = new Error('Missing x-user-id header. Select a user in the UI.');
        err.status = 401;
        throw err;
      }
      req.user = store.requireUser(userId);
      next();
    } catch (error) {
      next(error);
    }
  });

  app.get('/api/documents', (req, res, next) => {
    try {
      res.json(store.listDocumentsForUser(req.user.id));
    } catch (error) {
      next(error);
    }
  });

  app.post('/api/documents', (req, res, next) => {
    try {
      const doc = store.createDocument({
        title: req.body.title,
        contentHtml: req.body.contentHtml,
        ownerId: req.user.id
      });
      res.status(201).json({ document: doc });
    } catch (error) {
      next(error);
    }
  });

  app.get('/api/documents/:id', (req, res, next) => {
    try {
      const doc = store.getDocument(req.params.id, req.user.id);
      res.json({ document: doc });
    } catch (error) {
      next(error);
    }
  });

  app.patch('/api/documents/:id', (req, res, next) => {
    try {
      const doc = store.updateDocument(req.params.id, req.user.id, {
        title: req.body.title,
        contentHtml: req.body.contentHtml
      });
      res.json({ document: doc });
    } catch (error) {
      next(error);
    }
  });

  app.post('/api/documents/:id/share', (req, res, next) => {
    try {
      const doc = store.shareDocument(req.params.id, req.user.id, req.body.userId);
      res.json({ document: doc });
    } catch (error) {
      next(error);
    }
  });

  app.post('/api/documents/import', upload.single('file'), (req, res, next) => {
    try {
      const imported = convertUploadedFile(req.file);
      const doc = store.createDocument({
        title: req.body.title || imported.title,
        contentHtml: imported.contentHtml,
        ownerId: req.user.id
      });
      res.status(201).json({ document: doc, importedFrom: imported.extension });
    } catch (error) {
      next(error);
    }
  });

  app.post('/api/documents/:id/import', upload.single('file'), (req, res, next) => {
    try {
      const current = store.getDocument(req.params.id, req.user.id);
      const imported = convertUploadedFile(req.file);
      const mode = req.body.mode === 'replace' ? 'replace' : 'append';
      const mergedHtml =
        mode === 'replace'
          ? imported.contentHtml
          : `${current.contentHtml}<hr><p><strong>Imported from ${req.file.originalname}</strong></p>${imported.contentHtml}`;

      const doc = store.updateDocument(req.params.id, req.user.id, { contentHtml: mergedHtml });
      res.json({ document: doc, importedFrom: imported.extension, mode });
    } catch (error) {
      next(error);
    }
  });

  app.get('/api/meta/file-support', (_req, res) => {
    res.json({ supportedExtensions: SUPPORTED_EXTENSIONS, maxFileSizeMb: 1 });
  });

  if (process.env.NODE_ENV === 'production') {
    const clientDist = path.join(__dirname, '..', '..', 'client', 'dist');
    app.use(express.static(clientDist));
    app.get('*', (_req, res) => {
      res.sendFile(path.join(clientDist, 'index.html'));
    });
  }

  app.use((err, _req, res, _next) => {
    const status = err.status || 500;
    res.status(status).json({
      error: {
        message: err.message || 'Something went wrong.'
      }
    });
  });

  return app;
}

module.exports = { createApp };
