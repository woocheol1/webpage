// main.js - JSON Viewer & MCP Servers Editor (초기 뼈대)

let mcpServers = [];

function renderMcpEditor() {
    const editor = document.getElementById('mcp-editor');
    if (!mcpServers.length) {
        editor.innerHTML = '<div style="color:#aaa">No servers defined. Click <b>Add Server</b> to start.</div>';
        renderJsonPreview();
        return;
    }
    editor.innerHTML = mcpServers.map((server, idx) => `
        <div class="server-block" style="background:#232642;padding:18px;margin-bottom:12px;border-radius:8px;">
            <div style="display:flex;justify-content:space-between;align-items:center;">
                <b style="font-size:1.1em">${server.name || 'Server'}</b>
                <button onclick="removeServer(${idx})" style="background:#363b4e;">&times;</button>
            </div>
            <div style="margin-top:10px;">
                <label>Type: </label>
                <select onchange="updateServerType(${idx}, this.value)">
                    <option value="stdio" ${server.type==='stdio'?'selected':''}>stdio</option>
                    <option value="sse" ${server.type==='sse'?'selected':''}>sse</option>
                </select>
            </div>
            <div style="margin-top:10px;">
                <label>Command: </label>
                <input type="text" value="${server.command||''}" oninput="updateServerCommand(${idx}, this.value)" />
            </div>
            <div style="margin-top:10px;">
                <label>Args: </label>
                <input type="text" value="${server.args||''}" oninput="updateServerArgs(${idx}, this.value)" />
            </div>
            <div style="margin-top:10px;">
                <label>Env: </label>
                <input type="text" value="${server.env||''}" oninput="updateServerEnv(${idx}, this.value)" placeholder="KEY=VALUE, ..." />
            </div>
        </div>
    `).join('');
    renderJsonPreview();
}

function renderJsonPreview() {
    const preview = document.getElementById('json-preview');
    const tree = document.getElementById('json-tree-viewer');
    const json = { mcpServers: {} };
    mcpServers.forEach(server => {
        json.mcpServers[server.name||'server'] = {
            type: server.type,
            command: server.command,
            args: server.args,
            env: server.env
        };
    });
    preview.textContent = JSON.stringify(json, null, 2);
    renderJsonTree(tree, json);
}

// JSON 트리 뷰어 렌더링 함수
function renderJsonTree(container, data, indent = 0) {
    if (!container) return;
    container.innerHTML = '';
    let lastTreeJson = deepClone(data);
    container.appendChild(buildJsonTreeDom(data, indent, []));
}

function buildJsonTreeDom(data, indent = 0, path = []) {
    const type = typeof data;
    if (data === null) {
        const span = document.createElement('span');
        span.style.color = '#f78c6c';
        span.textContent = 'null';
        span.contentEditable = true;
        span.onblur = (e) => updateJsonValue(path, e.target.textContent, true);
        return span;
    }
    if (Array.isArray(data)) {
        const ul = document.createElement('ul');
        ul.style.marginLeft = (indent + 12) + 'px';
        ul.style.paddingLeft = '12px';
        ul.style.listStyle = 'none';
        data.forEach((item, idx) => {
            const li = document.createElement('li');
            li.appendChild(document.createTextNode(`[${idx}] : `));
            li.appendChild(buildJsonTreeDom(item, indent + 12, path.concat(idx)));
            ul.appendChild(li);
        });
        return ul;
    }
    if (type === 'object') {
        const ul = document.createElement('ul');
        ul.style.marginLeft = (indent + 12) + 'px';
        ul.style.paddingLeft = '12px';
        ul.style.listStyle = 'none';
        for (const key in data) {
            const li = document.createElement('li');
            const keySpan = document.createElement('span');
            keySpan.style.color = '#82aaff';
            keySpan.textContent = key + ': ';
            li.appendChild(keySpan);
            li.appendChild(buildJsonTreeDom(data[key], indent + 12, path.concat(key)));
            ul.appendChild(li);
        }
        return ul;
    }
    // 기본 값
    const span = document.createElement('span');
    span.style.color = '#c3e88d';
    span.textContent = JSON.stringify(data);
    span.contentEditable = true;
    span.onblur = (e) => updateJsonValue(path, e.target.textContent);
    return span;
}

let lastTreeJson = null;
function updateJsonValue(path, newValue, isNull = false) {
    if (!lastTreeJson) return;
    let ref = lastTreeJson;
    for (let i = 0; i < path.length - 1; i++) {
        ref = ref[path[i]];
    }
    const key = path[path.length - 1];
    let parsed;
    if (isNull) {
        parsed = null;
    } else {
        try {
            parsed = JSON.parse(newValue);
        } catch {
            parsed = newValue;
        }
    }
    ref[key] = parsed;
    renderJsonTree(document.getElementById('json-tree-viewer'), lastTreeJson);
    document.getElementById('general-json-editor').value = JSON.stringify(lastTreeJson, null, 2);
}

function deepClone(obj) {
    return JSON.parse(JSON.stringify(obj));
}

// 실시간 유효성 검사 및 하이라이트 (일반 JSON 에디터)
document.getElementById('general-json-editor').addEventListener('input', function() {
    const errorDiv = document.getElementById('general-json-error');
    try {
        lastTreeJson = JSON.parse(this.value);
        errorDiv.textContent = '';
        renderJsonTree(document.getElementById('json-tree-viewer'), lastTreeJson);
    } catch (e) {
        errorDiv.textContent = 'Invalid JSON: ' + e.message;
    }
});

// JSON 검색/하이라이트
function highlightJsonTree(keyword) {
    const container = document.getElementById('json-tree-viewer');
    if (!keyword) {
        Array.from(container.querySelectorAll('.highlight')).forEach(e => e.classList.remove('highlight'));
        return;
    }
    const walker = document.createTreeWalker(container, NodeFilter.SHOW_TEXT, null, false);
    while (walker.nextNode()) {
        const node = walker.currentNode;
        if (node.nodeValue.toLowerCase().includes(keyword.toLowerCase())) {
            node.parentElement.classList.add('highlight');
        } else {
            node.parentElement.classList.remove('highlight');
        }
    }
}

// 검색 입력창 및 스타일 추가 (중복 생성 방지)
function ensureJsonSearchBox() {
    const parent = document.getElementById('json-tree-viewer').parentElement;
    if (!document.getElementById('json-search')) {
        const searchBox = document.createElement('input');
        searchBox.type = 'text';
        searchBox.id = 'json-search';
        searchBox.placeholder = 'Search JSON...';
        searchBox.style = 'width:100%;margin-top:12px;margin-bottom:8px;padding:8px;border-radius:6px;background:#23262f;color:#fff;border:none;font-size:1rem;';
        parent.insertBefore(searchBox, document.getElementById('json-tree-viewer'));
        searchBox.addEventListener('input', e => highlightJsonTree(e.target.value));
    }
}
// 하이라이트 스타일 추가 (중복 방지)
(function ensureHighlightStyle(){
    if (!document.getElementById('json-highlight-style')) {
        const style = document.createElement('style');
        style.id = 'json-highlight-style';
        style.textContent = `.highlight { background: #f7b801; color: #23262f !important; border-radius: 4px; }`;
        document.head.appendChild(style);
    }
})();

// --- JSON Preview 전체화면 버튼 표시 논리 개선 ---
function enterPreviewFullscreen() {
    const el = document.getElementById('json-preview');
    el.classList.add('fullscreen');
    document.body.style.overflow = 'hidden';
    document.getElementById('preview-fullscreen').style.display = 'none';
    document.getElementById('preview-exit-fullscreen').style.display = '';
    el.contentEditable = 'true'; // 전체화면에서도 항상 수정 가능
    el.focus();
}
function exitPreviewFullscreen() {
    const el = document.getElementById('json-preview');
    el.classList.remove('fullscreen');
    document.body.style.overflow = '';
    document.getElementById('preview-fullscreen').style.display = '';
    document.getElementById('preview-exit-fullscreen').style.display = 'none';
    el.contentEditable = '';
    el.blur();
}
function previewFullscreenExitHandler(e) {
    if (e.target.closest('button')) return;
    exitPreviewFullscreen();
}

// --- JSON Preview 인라인 수정 기능 (전체화면 연동 포함) ---
let isPreviewEditing = false;
let previewBackup = '';
document.addEventListener('DOMContentLoaded', () => {
    // 검색창, 하이라이트 스타일 1회만 생성
    ensureJsonSearchBox();
    // 전체화면/되돌아가기 버튼 항상 상태 반영
    document.getElementById('preview-fullscreen').style.display = '';
    document.getElementById('preview-exit-fullscreen').style.display = 'none';
    const preview = document.getElementById('json-preview');
    const editBtn = document.getElementById('preview-edit');
    const saveBtn = document.getElementById('preview-save');
    const fullscreenBtn = document.getElementById('preview-fullscreen');
    const exitFullscreenBtn = document.getElementById('preview-exit-fullscreen');
    fullscreenBtn.onclick = enterPreviewFullscreen;
    exitFullscreenBtn.onclick = exitPreviewFullscreen;
    editBtn.onclick = () => {
        if (isPreviewEditing) return;
        previewBackup = preview.textContent;
        preview.contentEditable = 'true';
        preview.focus();
        isPreviewEditing = true;
        editBtn.style.display = 'none';
        saveBtn.style.display = '';
        preview.style.outline = '2px solid #6c63ff';
    };
    saveBtn.onclick = () => {
        try {
            const parsed = JSON.parse(preview.textContent);
            if (parsed.mcpServers) {
                mcpServers = Object.entries(parsed.mcpServers).map(([name, s]) => ({
                    name,
                    type: s.type || 'stdio',
                    command: s.command || '',
                    args: s.args || '',
                    env: s.env || ''
                }));
                renderMcpEditor();
            }
            preview.textContent = JSON.stringify(parsed, null, 2);
            preview.contentEditable = 'false';
            isPreviewEditing = false;
            editBtn.style.display = '';
            saveBtn.style.display = 'none';
            preview.style.outline = '';
        } catch (e) {
            preview.style.outline = '2px solid #f78c6c';
            preview.focus();
            setTimeout(() => {
                preview.style.outline = '2px solid #6c63ff';
            }, 1200);
            alert('Invalid JSON: ' + e.message + '\n수정 내용을 확인해 주세요.');
        }
    };
    preview.addEventListener('keydown', (e) => {
        if (isPreviewEditing && e.key === 'Escape') {
            preview.textContent = previewBackup;
            preview.contentEditable = 'false';
            isPreviewEditing = false;
            editBtn.style.display = '';
            saveBtn.style.display = 'none';
            preview.style.outline = '';
        }
    });
});

document.addEventListener('DOMContentLoaded', () => {
    document.getElementById('add-server').onclick = addServer;
    document.getElementById('load-json').onclick = onLoadJson;
    document.getElementById('save-json').onclick = onSaveJson;
    document.getElementById('copy-json').onclick = onCopyJson;
    document.getElementById('share-json').onclick = onShareJson;
    document.getElementById('apply-general-json').onclick = onApplyGeneralJson;
    document.getElementById('tree-fullscreen').onclick = () => toggleFullscreen('json-tree-viewer');
    document.getElementById('editor-fullscreen').onclick = () => toggleFullscreen('general-json-editor');
    document.getElementById('preview-format').onclick = formatJsonPreview;
    document.getElementById('editor-format').onclick = formatGeneralEditor;
    renderMcpEditor();
});

// Load JSON from file
function onLoadJson() {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = '.json,application/json';
    input.onchange = e => {
        const file = e.target.files[0];
        if (!file) return;
        const reader = new FileReader();
        reader.onload = evt => {
            try {
                const json = JSON.parse(evt.target.result);
                if (json.mcpServers) {
                    mcpServers = Object.entries(json.mcpServers).map(([name, s]) => ({
                        name,
                        type: s.type || 'stdio',
                        command: s.command || '',
                        args: s.args || '',
                        env: s.env || ''
                    }));
                    renderMcpEditor();
                } else {
                    alert('Invalid JSON: missing mcpServers');
                }
            } catch (err) {
                alert('Invalid JSON file');
            }
        };
        reader.readAsText(file);
    };
    input.click();
}

// Save JSON to file
function onSaveJson() {
    const json = { mcpServers: {} };
    mcpServers.forEach(server => {
        json.mcpServers[server.name||'server'] = {
            type: server.type,
            command: server.command,
            args: server.args,
            env: server.env
        };
    });
    const blob = new Blob([JSON.stringify(json, null, 2)], {type: 'application/json'});
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'mcp-servers.json';
    a.click();
    URL.revokeObjectURL(url);
}

// Copy JSON to clipboard
function onCopyJson() {
    const json = { mcpServers: {} };
    mcpServers.forEach(server => {
        json.mcpServers[server.name||'server'] = {
            type: server.type,
            command: server.command,
            args: server.args,
            env: server.env
        };
    });
    navigator.clipboard.writeText(JSON.stringify(json, null, 2));
    alert('JSON copied to clipboard!');
}

// Share JSON (Web Share API)
function onShareJson() {
    const json = { mcpServers: {} };
    mcpServers.forEach(server => {
        json.mcpServers[server.name||'server'] = {
            type: server.type,
            command: server.command,
            args: server.args,
            env: server.env
        };
    });
    const text = JSON.stringify(json, null, 2);
    if (navigator.share) {
        navigator.share({
            title: 'MCP Servers JSON',
            text
        });
    } else {
        alert('Web Share API not supported in this browser.');
    }
}

// General JSON Editor 적용
function onApplyGeneralJson() {
    const textarea = document.getElementById('general-json-editor');
    const errorDiv = document.getElementById('general-json-error');
    let json;
    try {
        json = JSON.parse(textarea.value);
        errorDiv.textContent = '';
    } catch (e) {
        errorDiv.textContent = 'Invalid JSON: ' + e.message;
        return;
    }
    // 트리 뷰어에만 적용 (MCP 에디터와 동기화 X)
    renderJsonTree(document.getElementById('json-tree-viewer'), json);
}

window.addServer = function() {
    if (mcpServers.length === 0) {
        mcpServers.push({ name: 'playwright', type: 'stdio', command: 'npx', args: '@playwright/mcp@latest', env: '' });
        renderMcpEditor();
    }
};
window.removeServer = function(idx) {
    mcpServers.splice(idx, 1);
    renderMcpEditor();
};
window.updateServerType = function(idx, value) {
    mcpServers[idx].type = value;
    renderJsonPreview();
};
window.updateServerCommand = function(idx, value) {
    mcpServers[idx].command = value;
    renderJsonPreview();
};
window.updateServerArgs = function(idx, value) {
    mcpServers[idx].args = value;
    renderJsonPreview();
};
window.updateServerEnv = function(idx, value) {
    mcpServers[idx].env = value;
    renderJsonPreview();
};
