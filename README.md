# Ajaia Docs Lite

A lightweight collaborative document editor inspired by Google Docs. The goal is not to clone Google Docs; it is to demonstrate strong product judgment, full stack implementation, persistence, file handling, sharing, usability, and engineering quality within a realistic assignment scope.

## What is included
// Done by Junaid
- Create a new document
- Rename a document
- Edit rich-text content in the browser
- Save and reopen documents after refresh
- Rich-text formatting:
  - Bold
  - Italic
  - Underline
  - H1/H2/paragraph formatting
  - Bulleted and numbered lists
- File upload/import:
  - Import `.txt` or `.md` as a new editable document
  - Import `.txt` or `.md` into an existing document using append or replace mode
  - File limit: 1 MB
- Sharing:
  - Seeded mock users
  - Every document has an owner
  - Owner can grant access to another user
  - Sidebar clearly separates `Owned documents` and `Shared with me`
  - Shared users can open and edit shared documents
  - Only owner can share onward
- Persistence:
  - Documents, rich text HTML, owners, and shares are stored in a local JSON file
  - Refreshing the browser keeps data available
- Engineering quality:
  - Clear setup instructions
  - API validation and error handling
  - Server-side rich-text cleanup for obvious unsafe tags/attributes
  - Automated API tests using Vitest + Supertest
  - Deployment notes and `render.yaml`

---

## Tech stack

### Frontend

- React 18
- Vite
- Native `contenteditable` editor
- Browser rich-text commands for MVP formatting

### Backend

- Node.js
- Express
- Multer for file upload parsing
- Local JSON file persistence
- Vitest + Supertest for API tests

### Why local JSON persistence?

For this timeboxed MVP, local JSON storage keeps setup simple for reviewers. There is no Postgres, SQLite, Supabase, or Docker requirement before they can run the product. The architecture is intentionally written so the store layer can later be replaced with SQLite/Postgres without changing most route logic.

---

## Project structure

```txt
ajaia-docs-lite/
  client/
    src/
      components/
        DocumentList.jsx
        Editor.jsx
        FileImport.jsx
        SharePanel.jsx
        Toolbar.jsx
      styles/
        app.css
      api.js
      App.jsx
      main.jsx
    index.html
    package.json
    vite.config.js
  server/
    src/
      app.js
      fileImport.js
      server.js
      store.js
    tests/
      app.test.js
    package.json
    vitest.config.js
  package.json
  render.yaml
  README.md
```

---

## Local setup

### 1. Requirements

Install Node.js 18 or later.

Check your version:

```bash
node -v
npm -v
```

### 2. Install dependencies

From the project root:

```bash
npm run install:all
```

This installs dependencies for:

- root workspace
- server
- client

### 3. Run the app locally

```bash
npm run dev
```

This starts:

- Backend API: `http://localhost:4000`
- Frontend app: `http://localhost:5173`

Open the frontend URL in your browser.

---

## How to use the app

### 1. Choose a user

The app uses mocked seeded users instead of full authentication. Use the `Active user` dropdown in the left sidebar.

Seeded users:

- Ajaia Reviewer
- Junaid Ansari
- Meera Shah

### 2. Create a document

Click `+ New document`.

A new editable document is created for the active user.

### 3. Edit and format

Use the toolbar for:

- Bold
- Italic
- Underline
- H1
- H2
- Normal text
- Bullet list
- Numbered list

Click inside the document page and type normally.

### 4. Rename and save

Update the title at the top of the editor and click `Save`.

The document title and content are persisted in `server/data/db.json`.

### 5. Reopen after refresh

Refresh the browser. Your documents remain available because the backend persists data in a local JSON file.

### 6. Import a file

The product supports `.txt` and `.md` files up to 1 MB.

You can:

- Import a file as a new document from the sidebar
- Import a file into the current document from the editor top bar

For current-document import, choose:

- `Append file content`
- `Replace document content`

### 7. Share a document

Open a document you own.

In the `Sharing` panel:

1. Select another seeded user
2. Click `Grant access`
3. Switch to that user from the sidebar
4. The document appears under `Shared with me`

Only the document owner can grant access.

---

## Run automated tests

From the project root:

```bash
npm test
```

The test suite covers:

- Creating a document
- Saving and reopening persisted rich text
- Sharing from owner to another user
- Seeing shared documents in the recipient account
- Importing markdown as a new document
- Blocking non-owner sharing

---

## API overview

All protected API routes require this header:

```txt
x-user-id: <seeded-user-id>
```

Example user IDs:

```txt
u_ajaia
u_junaid
u_meera
```

### Public routes

```http
GET /api/health
GET /api/users
```

### Document routes

```http
GET /api/documents
POST /api/documents
GET /api/documents/:id
PATCH /api/documents/:id
POST /api/documents/:id/share
POST /api/documents/import
POST /api/documents/:id/import
```

---

## Deployment

A `render.yaml` file is included for Render-style deployment.

### Render deployment approach

1. Push this project to GitHub
2. Create a new Render Web Service
3. Connect the GitHub repo
4. Use these commands:

Build command:

```bash
npm run install:all && npm run build
```

Start command:

```bash
npm start
```

The Express server serves the built React app in production.

### Important deployment note

This MVP uses local JSON file storage. That is excellent for assignment review and local demos, but many free deployment platforms may reset local filesystem data after redeploy or restart. For a production version, replace the JSON store with Postgres, SQLite on persistent disk, Supabase, or another durable database.

---

## Architecture note

### What I prioritized

I prioritized the strongest working assignment version over over-engineering:

1. **Usable editor flow**  
   The editor supports the expected formatting actions and feels like a simple document workspace.

2. **Clear document lifecycle**  
   A reviewer can create, rename, edit, save, refresh, and reopen documents without extra setup.

3. **Product-relevant file upload**  
   Uploading `.txt` or `.md` content directly creates or updates editable documents. The UI clearly states supported file types and limits.

4. **Demonstrable sharing model**  
   Mocked users keep scope reasonable while still proving ownership, access grants, owned/shared separation, and permission rules.

5. **Simple persistence**  
   Local JSON persistence is easy to run and review. The store is isolated in `server/src/store.js`, so it can be replaced later.

6. **Engineering quality**  
   The API has validation, consistent error responses, basic sanitization, route separation, and meaningful tests.

### Trade-offs

- I used seeded/mock users instead of full auth to keep the assignment focused on document collaboration behavior.
- I used `contenteditable` and browser editing commands instead of a heavy editor framework like TipTap/Slate/ProseMirror. For production, I would use a structured editor model.
- I stored rich-text content as HTML for speed and simplicity. For production, I would store a normalized document schema, add stricter sanitization, autosave, version history, and conflict handling.
- Collaboration is asynchronous shared access, not real-time multi-cursor editing. Real-time collaboration would need WebSockets and conflict resolution, likely using CRDTs such as Yjs.

---

## Future improvements

- Real login/authentication
- Roles such as viewer/commenter/editor
- Autosave with debounce
- Document version history
- Comments and mentions
- Real-time collaborative editing using WebSockets/Yjs
- Stronger sanitization with DOMPurify or a server-side HTML sanitizer
- Database-backed persistence using Postgres/Supabase/SQLite
- Attachment storage using S3 or equivalent
- Search across document titles and content
