import React from 'react';

function toolbarCommand(command, value = null) {
  document.execCommand(command, false, value);
}

export default function Toolbar({ onCommand }) {
  const run = (command, value = null) => (event) => {
    event.preventDefault();
    toolbarCommand(command, value);
    onCommand?.();
  };

  return (
    <div className="toolbar" aria-label="Rich text editor toolbar">
      <button type="button" onMouseDown={run('bold')} title="Bold">
        <strong>B</strong>
      </button>
      <button type="button" onMouseDown={run('italic')} title="Italic">
        <em>I</em>
      </button>
      <button type="button" onMouseDown={run('underline')} title="Underline">
        <u>U</u>
      </button>
      <span className="toolbar-divider" />
      <button type="button" onMouseDown={run('formatBlock', 'h1')}>H1</button>
      <button type="button" onMouseDown={run('formatBlock', 'h2')}>H2</button>
      <button type="button" onMouseDown={run('formatBlock', 'p')}>Text</button>
      <span className="toolbar-divider" />
      <button type="button" onMouseDown={run('insertUnorderedList')}>• List</button>
      <button type="button" onMouseDown={run('insertOrderedList')}>1. List</button>
    </div>
  );
}
