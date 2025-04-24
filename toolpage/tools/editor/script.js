/**
 * script.js - HTML, CSS & JS Editor with Live Preview (v5)
 * Features: Tabs (HTML, CSS, JS), Syntax Highlighting (CodeMirror),
 * Live Preview (iframe), Debounced Updates, Scroll Position Persistence,
 * Scroll Sync (HTML), Line Highlight (HTML), Resizable Panes (Split.js),
 * Responsive Preview Sizes.
 */

// --- 전역 변수 ---
let htmlEditor, cssEditor, jsEditor; // CodeMirror 인스턴스
const previewFrame = document.getElementById('preview'); // 미리보기 iframe
let previousHighlightElement = null; // 이전에 하이라이트된 요소 추적
let currentEditor = 'html'; // 현재 활성 에디터 ('html', 'css', 'js')

// DOM 요소 참조
const tabHtml = document.getElementById('tab-html');
const tabCss = document.getElementById('tab-css');
const tabJs = document.getElementById('tab-js');
const htmlEditorPane = document.getElementById('html-editor-pane');
const cssEditorPane = document.getElementById('css-editor-pane');
const jsEditorPane = document.getElementById('js-editor-pane');
const previewWrapper = document.getElementById('preview-wrapper');
const sizeButtons = document.querySelectorAll('.size-button');


// --- 디바운스 헬퍼 함수 ---
/**
 * 지정된 시간(delay) 동안 호출되지 않으면 함수를 실행하는 디바운스 함수 생성
 * @param {Function} func - 디바운싱할 함수
 * @param {number} delay - 지연 시간 (밀리초)
 * @returns {Function} - 디바운싱이 적용된 함수
 */
function debounce(func, delay) {
    let timeoutId;
    return function(...args) {
        clearTimeout(timeoutId); // 이전 타이머 취소
        timeoutId = setTimeout(() => {
            func.apply(this, args);
        }, delay);
    };
}
// --------------------------


/**
 * 애플리케이션 (에디터, Splitter 등) 초기화 함수
 */
function initializeApp() {
    // --- 에디터 초기화 ---
    try {
        htmlEditor = CodeMirror.fromTextArea(document.getElementById('html-editor'), {
            mode: 'htmlmixed', theme: 'material', lineNumbers: true, lineWrapping: true,
            // 추가 옵션 예시
            // autoCloseBrackets: true,
            // autoCloseTags: true,
            // matchBrackets: true,
        });
        cssEditor = CodeMirror.fromTextArea(document.getElementById('css-editor'), {
            mode: 'css', theme: 'material', lineNumbers: true, lineWrapping: true,
            // autoCloseBrackets: true,
            // matchBrackets: true,
        });
        jsEditor = CodeMirror.fromTextArea(document.getElementById('js-editor'), {
            mode: 'javascript', theme: 'material', lineNumbers: true, lineWrapping: true,
            // autoCloseBrackets: true,
            // matchBrackets: true,
        });
    } catch (e) {
        console.error("CodeMirror initialization failed:", e);
        alert("CodeMirror 에디터를 초기화하는 중 오류가 발생했습니다. 페이지를 새로고침하거나 라이브러리 로드를 확인하세요.");
        return; // 초기화 실패 시 중단
    }

    // --- 초기 콘텐츠 설정 ---
    const initialHtmlContent = `<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
    <title>Preview Content</title>
    </head>
<body>
    <h1>HTML, CSS & JS 실시간 미리보기 (v5)</h1>
    <p>이제 <span class="highlight" id="js-highlight">JavaScript 탭</span>에서 코드를 작성하여 미리보기를 동적으로 제어할 수 있습니다.</p>
    <button id="action-button">클릭해보세요!</button>
    <p id="message-area"></p>

    <div class="spacer">스크롤 테스트 영역<br/>(1)</div>

    <h2>주요 기능 목록</h2>
    <ul>
        <li>HTML/CSS/JS 편집 (탭)</li>
        <li>실시간 미리보기 (지연 업데이트)</li>
        <li>편집 시 스크롤 위치 유지</li>
        <li>창 너비 조절 가능 (드래그)</li>
        <li>미리보기 반응형 크기 변경 (버튼)</li>
        <li>HTML 스크롤/라인 동기화</li>
    </ul>

    <div class="spacer">스크롤 테스트 영역<br/>(2)</div>

    <p>마지막 내용입니다.</p>

    </body>
</html>`;

    const initialCssContent = `/* CSS */
body {
    font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
    line-height: 1.7; padding: 20px; color: #212529; background-color: #fff;
    margin: 0; min-height: 100%;
}
h1 { color: #0056b3; border-bottom: 2px solid #dee2e6; padding-bottom: 10px; margin-top: 0; font-size: 2em; }
h2 { color: #198754; margin-top: 40px; border-bottom: 1px dashed #ced4da; padding-bottom: 6px; font-size: 1.5em; }
ul { margin-left: 15px; padding-left: 15px; }
li { margin-bottom: 8px; }
code { background-color: #e9ecef; padding: 3px 6px; border-radius: 4px; font-family: SFMono-Regular, Menlo, Monaco, Consolas, "Liberation Mono", "Courier New", monospace; font-size: 0.875em; color: #d63384; }
.highlight { background-color: #fff3cd; color: #664d03; padding: 3px 6px; border-radius: 3px; }
.css-applied { color: #6f42c1; font-weight: 600; font-style: italic; border-left: 3px solid #6f42c1; padding-left: 10px; }
.box { border: 2px solid #fd7e14; padding: 25px; margin: 25px 0; background-color: #fff; border-radius: 5px; box-shadow: 0 2px 5px rgba(0,0,0,0.1); text-align: center; }
.spacer { min-height: 200px; border: 1px dashed #ced4da; margin: 30px 0; display: flex; flex-direction: column; align-items: center; justify-content: center; color: #6c757d; font-size: 0.9em; text-align: center; background-color: #f8f9fa; border-radius: 4px; padding: 10px; }
#message-area { margin-top: 15px; color: green; font-weight: bold; min-height: 1.2em; /* 메시지 영역 높이 확보 */ }
button { padding: 8px 15px; cursor: pointer; background-color: #007bff; color: white; border: none; border-radius: 4px; font-size: 14px; }
button:hover { background-color: #0056b3; }
/* 미리보기 하이라이트 스타일 */
.preview-highlight { box-shadow: -3px 0 0 0 #0d6efd, inset 2px 0 5px rgba(13, 110, 253, 0.1); transition: box-shadow 0.15s ease-in-out; scroll-margin-top: 15px; }`;

    const initialJsContent = `// JavaScript - 미리보기 내에서 실행됩니다.
console.log('Preview script starting...');

var button = document.getElementById('action-button');
var messageArea = document.getElementById('message-area');
var jsHighlight = document.getElementById('js-highlight');
var messageTimeout; // 메시지 제거 타이머 ID

// 요소들이 존재하는지 확인 후 이벤트 리스너 등록
if (button) {
    button.addEventListener('click', function() {
        console.log('Action button clicked!');
        if (messageArea) {
            messageArea.textContent = '버튼 클릭! (' + new Date().toLocaleTimeString() + ')';
            // 이전 메시지 제거 타이머 취소
            clearTimeout(messageTimeout);
            // 5초 후 메시지 초기화 타이머 설정
            messageTimeout = setTimeout(function() {
                messageArea.textContent = '';
                 if (jsHighlight) {
                     jsHighlight.style.backgroundColor = ''; // 원래 스타일로 복원
                 }
            }, 5000);
        }
        // 하이라이트 색상 변경 (예시)
        if (jsHighlight) {
            jsHighlight.style.backgroundColor = 'lightblue';
            jsHighlight.style.transition = 'background-color 0.3s'; // 부드러운 변경
        }
    });
    console.log('Button event listener added.');
} else {
    console.warn('Action button not found.');
}

// 추가적인 JS 코드 예시 (예: body 배경색 변경)
// document.body.style.backgroundColor = '#f0f8ff'; // AliceBlue

console.log('미리보기 JavaScript 로드 완료!');
`;

    htmlEditor.setValue(initialHtmlContent);
    cssEditor.setValue(initialCssContent);
    jsEditor.setValue(initialJsContent);

    // --- 디바운싱된 미리보기 업데이트 함수 생성 ---
    const debouncedUpdatePreview = debounce(updatePreview, 300);

    // --- CodeMirror 이벤트 리스너 등록 ---
    htmlEditor.on('change', debouncedUpdatePreview);
    cssEditor.on('change', debouncedUpdatePreview);
    jsEditor.on('change', debouncedUpdatePreview);
    htmlEditor.on('scroll', () => { if (currentEditor === 'html') syncScroll(); });
    htmlEditor.on('cursorActivity', () => { if (currentEditor === 'html') highlightPreviewLine(); });

    // --- 탭 기능 초기화 ---
    if (tabHtml && tabCss && tabJs) {
        tabHtml.addEventListener('click', () => switchTab('html'));
        tabCss.addEventListener('click', () => switchTab('css'));
        tabJs.addEventListener('click', () => switchTab('js'));
    } else {
        console.error("Tab buttons not found!");
    }

    // --- Split.js 초기화 ---
    try {
        Split(['#editor-section', '#preview-section'], {
            sizes: [50, 50],
            minSize: [300, 350],
            gutterSize: 10,
            cursor: 'col-resize',
            direction: 'horizontal',
            onDrag: function() {
                 // 활성 에디터만 리프레시
                 if (currentEditor === 'html' && htmlEditor) htmlEditor.refresh();
                 else if (currentEditor === 'css' && cssEditor) cssEditor.refresh();
                 else if (currentEditor === 'js' && jsEditor) jsEditor.refresh();
            }
        });
    } catch (e) {
        console.error("Split.js initialization failed:", e);
        alert("창 분할 기능을 초기화하는 중 오류가 발생했습니다.");
    }

    // --- 미리보기 크기 조절 버튼 초기화 ---
    if (sizeButtons.length > 0) {
        sizeButtons.forEach(button => {
            button.addEventListener('click', handleSizeButtonClick);
        });
    } else {
        console.warn("Size buttons not found!");
    }

    // --- 초기 상태 설정 ---
    switchTab('html'); // 기본 HTML 탭
    updatePreview();   // 초기 미리보기
    setTimeout(highlightPreviewLine, 250); // 초기 하이라이트 (지연 시간 약간 늘림)
}


/**
 * 활성 에디터 탭 전환 함수
 */
function switchTab(targetEditor) {
    currentEditor = targetEditor;

    htmlEditorPane.classList.toggle('active', targetEditor === 'html');
    cssEditorPane.classList.toggle('active', targetEditor === 'css');
    jsEditorPane.classList.toggle('active', targetEditor === 'js');

    tabHtml.classList.toggle('active', targetEditor === 'html');
    tabCss.classList.toggle('active', targetEditor === 'css');
    tabJs.classList.toggle('active', targetEditor === 'js');

    // 하이라이트 제거 공통 로직
    if (previousHighlightElement) {
        previousHighlightElement.classList.remove('preview-highlight');
        previousHighlightElement = null;
    }

    // 활성화된 에디터 새로고침 및 관련 기능 실행
    if (targetEditor === 'html') {
        if (htmlEditor) htmlEditor.refresh();
        // HTML 탭 활성 시 스크롤/하이라이트 즉시 반영 시도
        syncScroll();
        highlightPreviewLine();
    } else if (targetEditor === 'css') {
        if (cssEditor) cssEditor.refresh();
    } else { // 'js'
        if (jsEditor) jsEditor.refresh();
    }
}


/**
 * HTML 문자열에 data-source-line 속성 추가 함수 (정규식 개선)
 */
function addSourceLineMarkers(htmlString) {
    const lines = htmlString.split('\n');
    const blockTagsRegex = /^\s*<(p|h[1-6]|div|ul|ol|li|blockquote|section|article|header|footer|aside|table|tr|hr|pre|form|details|summary|figure|figcaption|fieldset|legend)([\s>])/i;
    let inBlock = false; // <script>, <style> 등 제외

    return lines.map((line, index) => {
        const lineNumber = index + 1;
        // 간단한 블록 체크 (정확성 한계 있음)
        if (line.includes('<script') || line.includes('<style') || line.includes('')) inBlock = false;

        if (!inBlock && blockTagsRegex.test(line) && !line.includes('data-source-line')) {
            try {
                 // 첫 번째 태그에만 속성 추가 시도
                 return line.replace(/<([a-zA-Z0-9]+)((?:\s+[^>]*)?)>/, (match, tagName, existingAttrs) => {
                     // 이미 속성이 있거나 빈 태그(<br>, <hr> 등)가 아니면 추가
                     if (!existingAttrs.includes('data-source-line') && !match.endsWith('/>')) {
                         return `<${tagName} data-source-line="${lineNumber}"${existingAttrs}>`;
                     }
                     return match;
                 });
            } catch(e) {
                 // console.warn("Regex error in addSourceLineMarkers:", line, e);
                 return line;
            }
        }
        return line;
    }).join('\n');
}


/**
 * 미리보기 업데이트 함수 (JS 코드 및 오류 처리 포함)
 */
function updatePreview() {
    const previewWindow = previewFrame.contentWindow;
    let previousScrollTop = 0;
    let previousScrollLeft = 0;
    if (previewWindow) {
        previousScrollTop = previewWindow.scrollY;
        previousScrollLeft = previewWindow.scrollX;
    }

    try {
        // 에디터 인스턴스 존재 확인
        if (!htmlEditor || !cssEditor || !jsEditor) {
            console.error("One or more editors not initialized!");
            return;
        }

        const rawHtml = htmlEditor.getValue();
        const cssContent = cssEditor.getValue();
        const jsContent = jsEditor.getValue();
        const processedHtmlBody = addSourceLineMarkers(rawHtml); // Body 내용만 처리한다고 가정

        const finalHtml = `<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
    <title>Preview</title>
    <style id="preview-injected-styles">
        /* User CSS */
        ${cssContent}
        /* Highlight CSS 는 CSS 초기값에 포함됨 */
    </style>
</head>
<body>
    ${processedHtmlBody}

    <script id="preview-injected-script">
        // 스크립트 실행 오류를 잡기 위한 래퍼
        (function() {
            try {
                ${jsContent}
            } catch (e) {
                console.error("Error executing preview script:", e);
                // 오류 메시지를 미리보기 하단에 표시
                const errorDiv = document.createElement('div');
                errorDiv.style.cssText = 'position:fixed; bottom:10px; left:10px; padding:10px; background-color:rgba(220, 53, 69, 0.9); color:white; font-family:monospace; font-size:13px; z-index:10000; border-radius:5px; max-width: calc(100% - 20px); overflow:auto; max-height: 100px;';
                errorDiv.textContent = 'JS Error: ' + e.message;
                // 기존 오류 메시지 제거 후 추가
                const existingError = document.getElementById('preview-js-error');
                if (existingError) existingError.remove();
                errorDiv.id = 'preview-js-error';
                document.body.appendChild(errorDiv);
                // 자동으로 사라지게 하려면 아래 주석 해제
                // setTimeout(() => { if (errorDiv.parentNode) errorDiv.remove(); }, 7000);
            }
        })();
    </script>
</body>
</html>`;

        const restoreScroll = () => {
            if (previewFrame.contentWindow) {
                previewFrame.contentWindow.scrollTo(previousScrollLeft, previousScrollTop);
            }
        };

        previewFrame.addEventListener('load', restoreScroll, { once: true });
        previewFrame.srcdoc = finalHtml;

    } catch (e) {
        console.error("Error updating preview:", e);
        // 미리보기 업데이트 자체의 오류 처리
        previewFrame.srcdoc = `<html><body><h1 style="color:red;">Preview Update Error</h1><pre>${e.message}</pre></body></html>`;
    }
}


/**
 * 스크롤 동기화 함수 (HTML 에디터 활성 시)
 */
function syncScroll() {
    if (currentEditor !== 'html' || !htmlEditor) return;
    try {
        const scrollInfo = htmlEditor.getScrollInfo();
        const editorScrollTop = scrollInfo.top;
        const editorScrollHeight = scrollInfo.height;
        const editorClientHeight = scrollInfo.clientHeight;
        const editorScrollableHeight = editorScrollHeight - editorClientHeight;
        if (editorScrollableHeight <= 0) return;
        const scrollPercent = editorScrollTop / editorScrollableHeight;

        const previewWindow = previewFrame.contentWindow;
        const previewDoc = previewWindow?.document;
        if (previewDoc?.documentElement) {
            const previewScrollHeight = previewDoc.documentElement.scrollHeight;
            const previewClientHeight = previewDoc.documentElement.clientHeight;
            const previewScrollableHeight = previewScrollHeight - previewClientHeight;
            if (previewScrollableHeight > 0) {
                const previewTargetScrollTop = scrollPercent * previewScrollableHeight;
                previewWindow.scrollTo(0, previewTargetScrollTop);
            }
        }
    } catch (e) { /* 에러 무시 또는 로깅 */ }
}


/**
 * 미리보기 하이라이트 함수 (HTML 에디터 활성 시)
 */
function highlightPreviewLine() {
    if (currentEditor !== 'html' || !htmlEditor) {
         if (previousHighlightElement) {
            try { previousHighlightElement.classList.remove('preview-highlight'); } catch (e) {}
            previousHighlightElement = null;
         }
        return;
    }
    try {
        const previewDoc = previewFrame.contentDocument || previewFrame.contentWindow?.document;
        if (!previewDoc) return;
        if (previousHighlightElement) {
            previousHighlightElement.classList.remove('preview-highlight');
            previousHighlightElement = null;
        }
        const currentLine = htmlEditor.getCursor().line + 1;
        const targetElement = previewDoc.querySelector(`[data-source-line="${currentLine}"]`);
        if (targetElement) {
            targetElement.classList.add('preview-highlight');
            previousHighlightElement = targetElement;
        }
    } catch (e) {
         if (previousHighlightElement) {
            try { previousHighlightElement.classList.remove('preview-highlight'); } catch (e) {}
            previousHighlightElement = null;
         }
    }
}


/**
 * 미리보기 크기 조절 버튼 클릭 핸들러
 */
function handleSizeButtonClick(event) {
    const targetButton = event.currentTarget;
    if (!targetButton || !previewWrapper) return; // 요소 없으면 중단

    const newSize = targetButton.dataset.size;

    sizeButtons.forEach(btn => btn.classList.remove('active'));
    targetButton.classList.add('active');

    if (newSize === '100%') {
        previewWrapper.style.width = '100%';
        previewWrapper.style.maxWidth = '100%';
    } else {
        previewWrapper.style.width = newSize;
        previewWrapper.style.maxWidth = newSize;
    }
}


// --- 스크립트 실행 시작점 ---
document.addEventListener('DOMContentLoaded', initializeApp);