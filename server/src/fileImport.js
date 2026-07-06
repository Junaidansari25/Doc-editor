const path = require('path');

const SUPPORTED_EXTENSIONS = ['.txt', '.md'];

function escapeHtml(value = '') {
  return String(value)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

function inlineMarkdown(input = '') {
  return escapeHtml(input)
    .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
    .replace(/__(.*?)__/g, '<strong>$1</strong>')
    .replace(/\*(.*?)\*/g, '<em>$1</em>')
    .replace(/_(.*?)_/g, '<em>$1</em>');
}

function closeOpenList(state, output) {
  if (state.listType) {
    output.push(`</${state.listType}>`);
    state.listType = null;
  }
}

function markdownToHtml(markdown) {
  const output = [];
  const state = { listType: null };
  const lines = String(markdown || '').split(/\r?\n/);

  for (const rawLine of lines) {
    const line = rawLine.trim();

    if (!line) {
      closeOpenList(state, output);
      continue;
    }

    if (/^###\s+/.test(line)) {
      closeOpenList(state, output);
      output.push(`<h3>${inlineMarkdown(line.replace(/^###\s+/, ''))}</h3>`);
      continue;
    }

    if (/^##\s+/.test(line)) {
      closeOpenList(state, output);
      output.push(`<h2>${inlineMarkdown(line.replace(/^##\s+/, ''))}</h2>`);
      continue;
    }

    if (/^#\s+/.test(line)) {
      closeOpenList(state, output);
      output.push(`<h1>${inlineMarkdown(line.replace(/^#\s+/, ''))}</h1>`);
      continue;
    }

    if (/^[-*]\s+/.test(line)) {
      if (state.listType !== 'ul') {
        closeOpenList(state, output);
        output.push('<ul>');
        state.listType = 'ul';
      }
      output.push(`<li>${inlineMarkdown(line.replace(/^[-*]\s+/, ''))}</li>`);
      continue;
    }

    if (/^\d+\.\s+/.test(line)) {
      if (state.listType !== 'ol') {
        closeOpenList(state, output);
        output.push('<ol>');
        state.listType = 'ol';
      }
      output.push(`<li>${inlineMarkdown(line.replace(/^\d+\.\s+/, ''))}</li>`);
      continue;
    }

    closeOpenList(state, output);
    output.push(`<p>${inlineMarkdown(line)}</p>`);
  }

  closeOpenList(state, output);
  return output.join('\n') || '<p></p>';
}

function textToHtml(text) {
  const paragraphs = String(text || '')
    .split(/\r?\n\s*\r?\n/)
    .map((block) => block.trim())
    .filter(Boolean)
    .map((block) => `<p>${escapeHtml(block).replace(/\r?\n/g, '<br>')}</p>`);

  return paragraphs.join('\n') || '<p></p>';
}

function convertUploadedFile(file) {
  if (!file) {
    const err = new Error('Please upload a .txt or .md file.');
    err.status = 400;
    throw err;
  }

  const ext = path.extname(file.originalname || '').toLowerCase();
  if (!SUPPORTED_EXTENSIONS.includes(ext)) {
    const err = new Error('Unsupported file type. Only .txt and .md files are supported.');
    err.status = 400;
    throw err;
  }

  const text = file.buffer.toString('utf8');
  const baseName = path.basename(file.originalname, ext).replace(/[_-]+/g, ' ').trim();

  return {
    title: baseName || 'Imported document',
    contentHtml: ext === '.md' ? markdownToHtml(text) : textToHtml(text),
    extension: ext
  };
}

module.exports = {
  SUPPORTED_EXTENSIONS,
  convertUploadedFile,
  markdownToHtml,
  textToHtml,
  escapeHtml
};
