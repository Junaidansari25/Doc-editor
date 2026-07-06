const os = require('os');
const path = require('path');
const fs = require('fs');
const request = require('supertest');
const { describe, it, expect, beforeEach } = require('vitest');
const { createApp } = require('../src/app');

function createTestApp() {
  const dbPath = path.join(os.tmpdir(), `ajaia-docs-test-${Date.now()}-${Math.random()}.json`);
  const app = createApp({ dbPath });
  return { app, dbPath };
}

describe('Ajaia Docs Lite API', () => {
  let app;
  let dbPath;

  beforeEach(() => {
    const setup = createTestApp();
    app = setup.app;
    dbPath = setup.dbPath;
  });

  it('creates, saves, reopens and preserves rich text content', async () => {
    const createRes = await request(app)
      .post('/api/documents')
      .set('x-user-id', 'u_junaid')
      .send({ title: 'Sprint Notes', contentHtml: '<h1>Plan</h1><p><strong>Ship MVP</strong></p>' })
      .expect(201);

    const docId = createRes.body.document.id;

    await request(app)
      .patch(`/api/documents/${docId}`)
      .set('x-user-id', 'u_junaid')
      .send({ title: 'Sprint Notes Updated', contentHtml: '<p><u>Saved content</u></p>' })
      .expect(200);

    const reopenRes = await request(app)
      .get(`/api/documents/${docId}`)
      .set('x-user-id', 'u_junaid')
      .expect(200);

    expect(reopenRes.body.document.title).toBe('Sprint Notes Updated');
    expect(reopenRes.body.document.contentHtml).toContain('<u>Saved content</u>');

    const persisted = JSON.parse(fs.readFileSync(dbPath, 'utf8'));
    expect(persisted.documents.some((doc) => doc.id === docId)).toBe(true);
  });

  it('allows an owner to share a document and shows it in the shared user list', async () => {
    const createRes = await request(app)
      .post('/api/documents')
      .set('x-user-id', 'u_junaid')
      .send({ title: 'Shared Roadmap', contentHtml: '<p>Initial roadmap</p>' })
      .expect(201);

    const docId = createRes.body.document.id;

    await request(app)
      .post(`/api/documents/${docId}/share`)
      .set('x-user-id', 'u_junaid')
      .send({ userId: 'u_meera' })
      .expect(200);

    const listRes = await request(app)
      .get('/api/documents')
      .set('x-user-id', 'u_meera')
      .expect(200);

    expect(listRes.body.shared.some((doc) => doc.id === docId && doc.accessType === 'shared')).toBe(true);
  });

  it('imports a markdown file as a new document', async () => {
    const importRes = await request(app)
      .post('/api/documents/import')
      .set('x-user-id', 'u_ajaia')
      .attach('file', Buffer.from('# Imported Title\n\n- Item one\n- Item two'), 'imported-notes.md')
      .expect(201);

    expect(importRes.body.document.title).toBe('imported notes');
    expect(importRes.body.document.contentHtml).toContain('<h1>Imported Title</h1>');
    expect(importRes.body.document.contentHtml).toContain('<ul>');
  });

  it('blocks shared actions when the viewer is not the owner', async () => {
    const createRes = await request(app)
      .post('/api/documents')
      .set('x-user-id', 'u_junaid')
      .send({ title: 'Private Doc', contentHtml: '<p>Private</p>' })
      .expect(201);

    await request(app)
      .post(`/api/documents/${createRes.body.document.id}/share`)
      .set('x-user-id', 'u_ajaia')
      .send({ userId: 'u_meera' })
      .expect(403);
  });
});
