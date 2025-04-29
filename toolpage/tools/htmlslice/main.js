document.getElementById('extractBtn').addEventListener('click', function() {
    const fileInput = document.getElementById('htmlFileInput');
    const resultText = document.getElementById('resultText');
    const outputFormat = document.getElementById('outputFormat').value;
    if (!fileInput.files.length) {
        resultText.textContent = 'HTML 파일을 선택해주세요.';
        return;
    }
    const file = fileInput.files[0];
    const reader = new FileReader();
    reader.onload = function(e) {
        const htmlString = e.target.result;
        const parser = new DOMParser();
        const doc = parser.parseFromString(htmlString, 'text/html');

        // 구조화된 HTML 파싱(제목, 중간제목, 본문, 리스트, 표)
        const structured = extractStructuredContent(doc.body);

        let output = '';
        if (outputFormat === 'report') {
            output = formatStructuredAsReport(structured);
        } else if (outputFormat === 'markdown') {
            output = formatStructuredAsMarkdown(structured);
        } else if (outputFormat === 'json') {
            output = formatStructuredAsJson(structured);
        }
        resultText.textContent = output;
    };
    reader.readAsText(file, 'utf-8');
});

// HTML 구조화 파싱 함수 (강조, 인용, 링크, 날짜 등도 인식)
function extractStructuredContent(root) {
    const result = [];
    function walk(node) {
        if (!node) return;
        if (node.nodeType === 3) return; // 텍스트 노드는 무시(부모에서 처리)
        if (node.nodeType !== 1) return;
        const tag = node.tagName.toLowerCase();
        if (/^(h[1-6])$/.test(tag)) {
            result.push({ type: 'heading', level: Number(tag[1]), text: node.textContent.trim() });
        } else if (tag === 'p') {
            const text = parseInline(node);
            if (text) result.push({ type: 'paragraph', text });
        } else if (tag === 'ul' || tag === 'ol') {
            const items = Array.from(node.children).filter(li => li.tagName && li.tagName.toLowerCase() === 'li').map(li => parseInline(li)).filter(Boolean);
            if (items.length) result.push({ type: 'list', ordered: tag === 'ol', items });
        } else if (tag === 'table') {
            const rows = Array.from(node.querySelectorAll('tr')).map(tr =>
                Array.from(tr.children).map(td => parseInline(td))
            );
            if (rows.length) result.push({ type: 'table', rows });
        } else if (tag === 'blockquote') {
            result.push({ type: 'blockquote', text: parseInline(node) });
        } else if (tag === 'span' && node.classList.contains('mypost-post-date')) {
            result.push({ type: 'date', text: node.textContent.trim() });
        } else {
            Array.from(node.children).forEach(walk);
        }
    }
    walk(root);
    return result;
}
// 인라인 파싱(강조, 이탤릭, 링크 등)
function parseInline(node) {
    let out = '';
    node.childNodes.forEach(child => {
        if (child.nodeType === 3) {
            out += child.textContent;
        } else if (child.nodeType === 1) {
            const tag = child.tagName.toLowerCase();
            if (tag === 'strong' || tag === 'b') {
                out += `**${parseInline(child)}**`;
            } else if (tag === 'em' || tag === 'i') {
                out += `*${parseInline(child)}*`;
            } else if (tag === 'a') {
                const href = child.getAttribute('href');
                out += `[${parseInline(child)}](${href})`;
            } else if (tag === 'br') {
                out += '  \n';
            } else {
                out += parseInline(child);
            }
        }
    });
    return out.trim();
}
// 범용 보고서/마크다운: 헤더, 요약, 목차, 참고문헌 등 자동 생성 없이 HTML 구조만 변환
function formatStructuredAsReport(struct) {
    let out = '';
    let section = 0, subsection = 0;
    struct.forEach(item => {
        if (item.type === 'heading') {
            if (item.level === 1) {
                section++;
                subsection = 0;
                out += `\n${section}. ${item.text}\n\n`;
            } else if (item.level === 2) {
                subsection++;
                out += `${section}.${subsection} ${item.text}\n\n`;
            } else {
                out += `${item.text}\n`;
            }
        } else if (item.type === 'paragraph') {
            out += item.text + '\n\n';
        } else if (item.type === 'blockquote') {
            out += `> ${item.text}\n\n`;
        } else if (item.type === 'list') {
            item.items.forEach((li, i) => {
                out += `- ${li}\n`;
            });
            out += '\n';
        } else if (item.type === 'table') {
            item.rows.forEach((row, idx) => {
                out += row.join(' | ') + '\n';
            });
            out += '\n';
        }
    });
    return out.trim();
}

// 범용 마크다운: 헤더, 요약, 목차, 참고문헌 등 자동 생성 없이 HTML 구조만 변환
function formatStructuredAsMarkdown(struct) {
    let out = '';
    struct.forEach(item => {
        if (item.type === 'heading') {
            out += `${'#'.repeat(item.level)} ${item.text}\n`;
        } else if (item.type === 'date') {
            out += `*${item.text}*\n`;
        } else if (item.type === 'blockquote') {
            out += `> ${item.text}\n`;
        } else if (item.type === 'paragraph') {
            out += `${item.text}\n`;
        } else if (item.type === 'list') {
            out += item.items.map((li, i) => `${item.ordered ? (i+1)+'.' : '-'} ${li}`).join('\n') + '\n';
        } else if (item.type === 'table') {
            item.rows.forEach((row, idx) => {
                out += '| ' + row.join(' | ') + ' |\n';
                if (idx === 0) out += '| ' + row.map(()=> '---').join(' | ') + ' |\n';
            });
        }
    });
    return out.trim();
}
// JSON 구조화 변환
function formatStructuredAsJson(struct) {
    return JSON.stringify(struct, null, 2);
}

// 프리뷰 버튼 1개, 형식별 프리뷰 동작 개선
let isPreview = false;
document.getElementById('previewToggleBtn').addEventListener('click', function() {
    const pre = document.getElementById('resultText');
    const preview = document.getElementById('previewArea');
    const outputFormat = document.getElementById('outputFormat').value;
    if (!isPreview) {
        preview.innerHTML = '';
        if (outputFormat === 'markdown') {
            renderPreview(pre.textContent, 'markdown');
        } else if (outputFormat === 'report') {
            renderPreview(pre.textContent, 'report');
        } else if (outputFormat === 'json') {
            renderPreview(pre.textContent, 'json');
        }
        pre.style.display = 'none';
        preview.style.display = 'block';
        this.textContent = '에디터 전환';
        isPreview = true;
    } else {
        preview.innerHTML = '';
        pre.style.display = 'block';
        preview.style.display = 'none';
        this.textContent = '프리뷰 전환';
        isPreview = false;
    }
});

// 마크다운 원본 프리뷰 버튼 및 관련 코드 제거
const mdRaw = document.getElementById('mdRawPreviewArea');
if (mdRaw) mdRaw.remove();
const mdBtn = document.getElementById('mdPreviewBtn');
if (mdBtn) mdBtn.remove();

function renderPreview(markdown, format) {
    const previewArea = document.getElementById('previewArea');
    previewArea.innerHTML = '';
    if (format === 'markdown') {
        if (window.marked) {
            // marked.js는 기본적으로 HTML 이스케이프를 하지 않으므로 sanitize 옵션을 명시
            previewArea.innerHTML = '<div class="markdown-preview">' + window.marked.parse(markdown, {sanitize: true}) + '</div>';
        } else {
            previewArea.innerHTML = markdown.replace(/\n/g, '<br>');
        }
    } else if (format === 'report') {
        previewArea.innerHTML = markdown.replace(/\n/g, '<br>');
    } else if (format === 'json') {
        try {
            const obj = JSON.parse(markdown);
            previewArea.innerHTML = '<pre class="json-preview">' + JSON.stringify(obj, null, 2) + '</pre>';
        } catch {
            previewArea.innerHTML = '<pre class="json-preview">' + markdown + '</pre>';
        }
    }
}

document.getElementById('copyBtn').addEventListener('click', function() {
    const pre = document.getElementById('resultText');
    const text = pre.textContent;
    if (navigator.clipboard) {
        navigator.clipboard.writeText(text).then(() => {
            this.textContent = '복사됨!';
            setTimeout(() => { this.textContent = '복사'; }, 1200);
        });
    } else {
        // fallback
        const textarea = document.createElement('textarea');
        textarea.value = text;
        document.body.appendChild(textarea);
        textarea.select();
        document.execCommand('copy');
        document.body.removeChild(textarea);
        this.textContent = '복사됨!';
        setTimeout(() => { this.textContent = '복사'; }, 1200);
    }
});
