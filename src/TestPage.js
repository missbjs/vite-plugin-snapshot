import { jsx as _jsx, jsxs as _jsxs } from "woby/jsx-runtime";
import { $, $$, useEffect, For } from 'woby';
export function TestPage() {
    const testFiles = $([]);
    const iframeRef = $(null);
    // Fetch test files from our API
    useEffect(() => {
        fetch('/@snapshot-api/test-files')
            .then(res => res.json())
            .then(files => testFiles(files))
            .catch(err => console.error('Failed to fetch test files:', err));
    });
    const loadTest = (path) => {
        const iframe = $$(iframeRef);
        if (iframe) {
            iframe.src = `/src/${path}`;
            iframe.style.display = 'block';
        }
    };
    // Load first test by default
    useEffect(() => {
        const files = $$(testFiles);
        if (files.length > 0) {
            const iframe = $$(iframeRef);
            if (iframe) {
                loadTest(files[0].path);
            }
        }
    });
    return (_jsxs("div", { children: [_jsx("div", { class: "header", children: _jsx("h1", { children: "Component Tests" }) }), _jsx("div", { class: "test-list", children: _jsx(For, { values: testFiles, children: (file) => (_jsx("div", { class: "test-item", onClick: () => loadTest(file.path), children: file.name })) }) }), _jsx("div", { class: "content", children: _jsx("iframe", { ref: iframeRef, style: { display: 'none', width: '100%', height: '80vh', border: '1px solid #ccc' } }) }), _jsx("style", { children: `
        .header { margin-bottom: 20px; }
        .test-list { display: flex; flex-direction: column; gap: 10px; }
        .test-item { 
          padding: 10px; 
          border: 1px solid #ddd; 
          border-radius: 4px; 
          background: #f5f5f5;
          cursor: pointer;
        }
        .test-item:hover { background: #e0e0e0; }
        .content { margin-top: 20px; }
      ` })] }));
}
