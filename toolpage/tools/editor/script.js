/**
 * script.js - HTML, CSS & JS Editor with Live Preview (v5.3 - Minimap Cursor Highlight)
 * Features: Tabs (HTML, CSS, JS), Syntax Highlighting (CodeMirror),
 * Live Preview (iframe), Debounced Updates, Scroll Position Persistence,
 * Cursor-based Scroll Sync (HTML), Line Highlight (HTML), Resizable Panes (Split.js),
 * Responsive Preview Sizes, Code Folding Controls, Minimap,
 * Minimap CSS Token Highlight, Minimap Block Click Navigation, Minimap Cursor Highlight.
 */

// --- 전역 변수 ---
let htmlEditor, cssEditor, jsEditor; // CodeMirror 인스턴스
const previewFrame = document.getElementById('preview'); // 미리보기 iframe
let previousHighlightElement = null; // 이전에 하이라이트된 요소 추적
let currentEditor = 'html'; // 현재 활성 에디터 ('html', 'css', 'js')
let scrollTimeoutId; // 스크롤 중복 실행 방지용 타이머 ID
let loadedFileName = 'untitled.html'; // 불러온 파일 이름 저장용
let currentFileHandle = null;

// DOM 요소 참조
const tabHtml = document.getElementById('tab-html');
const tabCss = document.getElementById('tab-css');
const tabJs = document.getElementById('tab-js');
const htmlEditorPane = document.getElementById('html-editor-pane');
const cssEditorPane = document.getElementById('css-editor-pane');
const jsEditorPane = document.getElementById('js-editor-pane');
const previewWrapper = document.getElementById('preview-wrapper');
const sizeButtons = document.querySelectorAll('.size-button');
const foldAllButton = document.getElementById('btn-fold-all');
const unfoldAllButton = document.getElementById('btn-unfold-all');
const loadHtmlButton = document.getElementById('btn-load-html');
const saveButton = document.getElementById('btn-save');
const saveAsButton = document.getElementById('btn-save-as');


// --- 현재 활성 에디터 인스턴스 반환 함수 ---
function getCurrentActiveEditor() {
    if (currentEditor === 'html') return htmlEditor;
    if (currentEditor === 'css') return cssEditor;
    if (currentEditor === 'js') return jsEditor;
    return null;
}

// --- 디바운스 헬퍼 함수 ---
function debounce(func, delay) {
    let timeoutId;
    return function(...args) {
        clearTimeout(timeoutId);
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
            mode: 'htmlmixed',
            theme: 'material',
            lineNumbers: true,
            lineWrapping: true,
            foldGutter: true,
            gutters: ["CodeMirror-linenumbers", "CodeMirror-foldgutter"],
            extraKeys: { "Ctrl-S": handleSave, "Cmd-S": handleSave }
        });
        cssEditor = CodeMirror.fromTextArea(document.getElementById('css-editor'), {
            mode: 'css',
            theme: 'material',
            lineNumbers: true,
            lineWrapping: true,
            foldGutter: true,
            gutters: ["CodeMirror-linenumbers", "CodeMirror-foldgutter"],
            extraKeys: { "Ctrl-S": handleSave, "Cmd-S": handleSave }
        });
        jsEditor = CodeMirror.fromTextArea(document.getElementById('js-editor'), {
            mode: 'javascript',
            theme: 'material',
            lineNumbers: true,
            lineWrapping: true,
            foldGutter: true,
            gutters: ["CodeMirror-linenumbers", "CodeMirror-foldgutter"],
            extraKeys: { "Ctrl-S": handleSave, "Cmd-S": handleSave }
        });

        // --- 기능 모듈 초기화 ---
        if (typeof initializeFolding === 'function') {
             initializeFolding(htmlEditor, 'htmlmixed');
             initializeFolding(cssEditor, 'css');
             initializeFolding(jsEditor, 'javascript');
        } else { console.error("initializeFolding function not found."); }

        if (typeof initializeColorTools === 'function') {
            initializeColorTools(cssEditor);
       } else { console.error("initializeColorTools function not found."); }

       if (typeof initializeFormatter === 'function') {
            initializeFormatter(getCurrentActiveEditor);
       } else { console.error("initializeFormatter function not found."); }

       // --- 미니맵 요소 초기화 (navigator.js의 함수 호출) ---
       if (typeof initializeMinimapElements === 'function') { // navigator.js에서 변경된 함수 이름 사용
            initializeMinimapElements();
       } else { console.warn("initializeMinimapElements function not found in navigator.js."); }

   } catch (e) {
        console.error("CodeMirror initialization failed:", e);
        alert("CodeMirror 에디터를 초기화하는 중 오류가 발생했습니다.");
        return;
    }

    // --- 초기 콘텐츠 설정 ---
    const initialHtmlContent = `<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
    <title>Preview Content</title>
    </head>
<body>
    <h1>HTML, CSS & JS 실시간 미리보기 (v5.3)</h1>
    <p>이제 <span class="highlight" id="js-highlight">JavaScript 탭</span>에서 코드를 작성하여 미리보기를 동적으로 제어할 수 있습니다.</p>
    <button id="action-button">클릭해보세요!</button>
    <p id="message-area"></p>
    <div class="spacer">스크롤 테스트 영역<br/>(1)</div>
    <h2>주요 기능 목록</h2>
    <ul>
        <li>HTML/CSS/JS 편집 (탭)</li>
        <li>실시간 미리보기 (지연 업데이트)</li>
        <li>스크롤 위치 유지, 커서 기반 스크롤 동기화</li>
        <li>미리보기 반응형 크기 변경</li>
        <li>코드 폴딩, 포맷팅, 색상 선택</li>
        <li>미니맵 & 네비게이션 (블록 클릭)</li>
        <li>CSS 토큰 발생 위치 강조 (빨간색)</li>
        <li>현재 커서 위치 강조 (노란색)</li>
    </ul>
    <div class="spacer">스크롤 테스트 영역<br/>(2)</div>
    <p>마지막 내용입니다.</p>
    </body>
</html>`;
    // initialCssContent 변수를 찾아서 내부의 .preview-highlight 부분을 수정합니다.
const initialCssContent = `/* CSS */
body {
    font-family: sans-serif;
    line-height: 1.6;
    padding: 15px;
    color: #333;
}
h1 {
    color: darkblue;
    border-bottom: 1px solid #ccc;
}
.highlight {
    background-color: yellow;
    padding: 2px 4px;
 color: #555; /* 다른 color 속성 */
}
.spacer {
    min-height: 150px;
    border: 1px dashed lightgray;
    margin: 20px 0;
    text-align: center;
    padding-top: 50px;
    color: gray; /* 또 다른 color 속성 */
}
button { padding: 5px 10px; cursor: pointer; background-color: #007bff; color: white; border: none; border-radius: 3px; }
button:hover { background-color: #0056b3; }

/* --- 여기를 수정 --- */
.preview-highlight {
    /* 기존 box-shadow 제거 또는 주석 처리 */
    /* box-shadow: -2px 0 0 0 blue; */

    /* 새 배경색 스타일 적용 */
    background-color: rgba(135, 206, 250, 0.5) !important; /* LightSkyBlue 50% 투명도, !important 추가 */
    box-shadow: none !important; /* 다른 그림자 효과 제거 */
    transition: background-color 0.1s ease-in-out;
    scroll-margin-top: 10px; /* 기존 스크롤 마진 유지 */
}
/* --- 수정 끝 --- */
`;

    const initialJsContent = `// JavaScript\nconsole.log('Preview script running...');\n\nconst btn = document.getElementById('action-button');\nconst msgArea = document.getElementById('message-area');\n\nif(btn && msgArea) {\n    btn.addEventListener('click', () => {\n        msgArea.textContent = 'Button clicked at ' + new Date().toLocaleTimeString();\n        setTimeout(() => { msgArea.textContent = ''; }, 3000);\n    });\n}\nconsole.log('JS setup complete.');`;

    htmlEditor.setValue(initialHtmlContent);
    cssEditor.setValue(initialCssContent);
    jsEditor.setValue(initialJsContent);

    // --- 디바운싱된 함수들 ---
    const debouncedUpdatePreview = debounce(updatePreview, 300);
    const debouncedMinimapRender = debounce(() => { if (typeof renderMinimapContent === 'function') renderMinimapContent(); }, 350);
    const debouncedMinimapViewportUpdate = debounce(() => { if (typeof updateMinimapViewportDisplay === 'function') updateMinimapViewportDisplay(); }, 50);

    // --- CodeMirror 이벤트 리스너 ---
    htmlEditor.on('change', () => { debouncedUpdatePreview(); debouncedMinimapRender(); });
    cssEditor.on('change', () => { debouncedUpdatePreview(); debouncedMinimapRender(); });
    jsEditor.on('change', () => { debouncedUpdatePreview(); debouncedMinimapRender(); });

    // HTML Editor Cursor Activity
    htmlEditor.on('cursorActivity', debounce(async () => { // async 추가
        const cursor = htmlEditor.getCursor();
        const currentLine = cursor.line + 1;
        if (typeof showCursorHighlight === 'function') showCursorHighlight(currentLine); // 노란 라인 업데이트
    
        // --- 추가: 빨간 라인 로직 (CSS 에디터 로직과 유사하게) ---
        if (currentEditor === 'html') { // HTML 에디터일 때
            let targetToken = htmlEditor.getSelection(); // 선택된 텍스트 가져오기
            if (!targetToken && cursor) { // 선택된 텍스트 없고 커서만 있을 경우
                const tokenInfo = htmlEditor.getTokenAt(cursor); // 커서 위치의 토큰 정보
                // HTML에서는 태그 이름('<tag>'), 속성 이름('attribute') 등을 하이라이트 대상으로 고려
                if (tokenInfo && tokenInfo.string.trim() && (tokenInfo.type === 'tag' || tokenInfo.type === 'attribute' || /^[a-zA-Z][a-zA-Z0-9-]*$/.test(tokenInfo.string))) {
                     targetToken = tokenInfo.string;
                }
            }
    
             let linesToHighlight = []; // 하이라이트할 라인 번호 배열
             if (targetToken && targetToken.trim()) { // 검색할 토큰이 있을 경우
                 targetToken = targetToken.trim();
                 // console.log(`HTML Searching for token: "${targetToken}"`); // 디버깅 필요시 주석 해제
                 try {
                     // 정규식 특수 문자 이스케이프
                     const escapedToken = targetToken.replace(/[-\/\\^$*+?.()|[\]{}]/g, '\\$&');
                     // 단어 경계를 사용하여 해당 단어 검색 (예: 'div' 검색 시 'division'은 제외)
                     const searchRegex = new RegExp(`\\b${escapedToken}\\b`);
                     const totalLines = htmlEditor.lineCount();
    
                     // 모든 라인 검색
                     for (let i = 0; i < totalLines; i++) {
                         if (searchRegex.test(htmlEditor.getLine(i))) {
                             linesToHighlight.push(i + 1); // 1-based 라인 번호 추가
                         }
                     }
                     // console.log(`Found on lines: ${linesToHighlight.join(', ')}`); // 디버깅 필요시 주석 해제
                 } catch (e) {
                     console.error("Error searching HTML token:", e);
                     linesToHighlight = []; // 오류 발생 시 초기화
                 }
             } else {
                 linesToHighlight = []; // 검색할 토큰 없으면 빈 배열
             }
    
             // navigator.js의 빨간 줄 표시 함수 호출
             if (typeof showSelectionHighlights === 'function') {
                 showSelectionHighlights(linesToHighlight);
             }
    
             // 기존 HTML 미리보기 동기화 로직은 계속 실행
             highlightAndScrollPreview();
    
        } else {
             // 혹시 다른 탭인데 이 이벤트가 호출될 경우? (거의 발생 안 함) 빨간 줄 제거
             if (typeof clearSelectionHighlights === 'function'){
                 clearSelectionHighlights();
             }
        }
        // --- 추가 끝 ---
    
    }, 250)); // 디바운스 시간 150ms에서 250ms 정도로 약간 늘림 (검색 부하 고려)

    // CSS Editor Cursor Activity
    cssEditor.on('cursorActivity', debounce(async () => {
        const cursor = cssEditor.getCursor();
        const currentLine = cursor.line + 1;
        if (typeof showCursorHighlight === 'function') showCursorHighlight(currentLine); // 노란 라인 업데이트

        if (currentEditor === 'css') { // 빨간 라인 업데이트 로직
            let targetToken = cssEditor.getSelection();
            if (!targetToken && cursor) {
                 const tokenInfo = cssEditor.getTokenAt(cursor);
                 if (tokenInfo && tokenInfo.string.trim() && /^[a-zA-Z0-9_-]+$/.test(tokenInfo.string)) {
                     targetToken = tokenInfo.string;
                 }
            }
             let linesToHighlight = [];
             if (targetToken && targetToken.trim()) {
                 targetToken = targetToken.trim();
                 // console.log(`Searching for token: "${targetToken}"`); // Debugging
                 try {
                     const escapedToken = targetToken.replace(/[-\/\\^$*+?.()|[\]{}]/g, '\\$&');
                     const searchRegex = new RegExp(`\\b${escapedToken}\\b`);
                     const totalLines = cssEditor.lineCount();
                     for (let i = 0; i < totalLines; i++) {
                         if (searchRegex.test(cssEditor.getLine(i))) linesToHighlight.push(i + 1);
                     }
                     // console.log(`Found on lines: ${linesToHighlight.join(', ')}`); // Debugging
                 } catch (e) { console.error("Error searching token:", e); linesToHighlight = []; }
             } else { linesToHighlight = []; }
             if (typeof showSelectionHighlights === 'function') showSelectionHighlights(linesToHighlight);
        } else {
             if (typeof clearSelectionHighlights === 'function') clearSelectionHighlights(); // 빨간 라인 제거
        }
    }, 300));

    // JS Editor Cursor Activity
    jsEditor.on('cursorActivity', debounce(() => {
        const cursor = jsEditor.getCursor();
        const currentLine = cursor.line + 1;
        if (typeof showCursorHighlight === 'function') showCursorHighlight(currentLine); // 노란 라인 업데이트

        if (typeof clearSelectionHighlights === 'function') clearSelectionHighlights(); // 빨간 라인 제거
    }, 250));

    // 스크롤 및 리프레시 이벤트
    htmlEditor.on('scroll', debouncedMinimapViewportUpdate);
    cssEditor.on('scroll', debouncedMinimapViewportUpdate);
    jsEditor.on('scroll', debouncedMinimapViewportUpdate);
    htmlEditor.on('refresh', debouncedMinimapViewportUpdate);
    cssEditor.on('refresh', debouncedMinimapViewportUpdate);
    jsEditor.on('refresh', debouncedMinimapViewportUpdate);

    // --- 탭 기능 ---
    if (tabHtml && tabCss && tabJs) {
        tabHtml.addEventListener('click', () => switchTab('html'));
        tabCss.addEventListener('click', () => switchTab('css'));
        tabJs.addEventListener('click', () => switchTab('js'));
    } else { console.error("Tab buttons not found!"); }

    // --- 컨트롤 버튼들 ---
    if (foldAllButton) foldAllButton.addEventListener('click', () => { const ed = getCurrentActiveEditor(); if (ed) ed.execCommand("foldAll"); });
    if (unfoldAllButton) unfoldAllButton.addEventListener('click', () => { const ed = getCurrentActiveEditor(); if (ed) ed.execCommand("unfoldAll"); });
    if (loadHtmlButton) loadHtmlButton.addEventListener('click', handleHtmlFileLoadWithPicker);
    if (saveButton) saveButton.addEventListener('click', handleSave);
    if (saveAsButton) saveAsButton.addEventListener('click', handleSaveAsWithPicker);
    if (sizeButtons.length > 0) sizeButtons.forEach(button => button.addEventListener('click', handleSizeButtonClick));

    // --- Split.js ---
    try {
        Split(['#navigator-section', '#editor-section', '#preview-section'], {
            sizes: [15, 50, 35], minSize: [100, 300, 350], gutterSize: 10, cursor: 'col-resize', direction: 'horizontal',
            onDrag: () => { const ed = getCurrentActiveEditor(); if(ed) ed.refresh(); debouncedMinimapViewportUpdate(); }
        });
    } catch (e) { console.error("Split.js initialization failed:", e); }

    // --- 초기 상태 ---
    switchTab('html');
    updatePreview();
    if (typeof initializeMinimap === 'function') initializeMinimap(htmlEditor);
    setTimeout(highlightAndScrollPreview, 250);
    // 초기 커서 위치 노란 라인 표시
    setTimeout(() => {
        const ed = getCurrentActiveEditor();
        if(ed) {
            const cursor = ed.getCursor();
            if(cursor && typeof showCursorHighlight === 'function') showCursorHighlight(cursor.line + 1);
        }
    }, 100);
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

    if (previousHighlightElement) {
        try { previousHighlightElement.classList.remove('preview-highlight'); } catch(e) {}
        previousHighlightElement = null;
    }

    // 탭 전환 시 빨간 하이라이트 제거
     if (typeof clearSelectionHighlights === 'function') {
        clearSelectionHighlights();
    }
    // 노란 커서 라인은 아래에서 바로 업데이트됨

    const activeEditor = getCurrentActiveEditor();
    // 미니맵 업데이트
    if (typeof initializeMinimap === 'function') {
         initializeMinimap(activeEditor); // 여기서 initializeMinimapElements도 호출됨
    }
    if(activeEditor) {
        activeEditor.refresh(); // 에디터 리프레시
        // 새 에디터의 현재 커서 위치로 노란 라인 업데이트
        const cursor = activeEditor.getCursor();
        if (cursor && typeof showCursorHighlight === 'function') {
             showCursorHighlight(cursor.line + 1);
        }
        // HTML 탭이면 미리보기 동기화
        if (targetEditor === 'html') {
            setTimeout(highlightAndScrollPreview, 100);
        }
    }
}


/**
 * HTML 문자열에 data-source-line 속성 추가 함수
 */
function addSourceLineMarkers(htmlString) {
    const lines = htmlString.split('\n');
    const blockTagsRegex = /^\s*<([a-zA-Z0-9]+)(?![^>]*\/>)(?:\s+[^>]*)?>/i;
    let inBlock = false;
    return lines.map((line, index) => {
        const lineNumber = index + 1;
        if (line.includes('<script') || line.includes('<style')) inBlock = true;
        if (line.includes('</script') || line.includes('</style')) inBlock = false;
        if (!inBlock && !line.trim().startsWith('</') && blockTagsRegex.test(line)) {
            try {
                 return line.replace(/<([a-zA-Z0-9]+)((?:\s+[^>]*)?)>/, (match, tagName, existingAttrs) => {
                     if (!existingAttrs || !existingAttrs.includes('data-source-line')) {
                          if (!match.startsWith('</') && !match.endsWith('/>')) {
                              return `<${tagName} data-source-line="${lineNumber}"${existingAttrs || ''}>`;
                          }
                     }
                     return match;
                 });
            } catch(e) { return line; }
        }
        return line;
    }).join('\n');
}


/**
 * 미리보기 업데이트 함수
 */
function updatePreview() {
    const previewWindow = previewFrame.contentWindow;
    let previousScrollTop = 0, previousScrollLeft = 0;
    if (previewWindow && previewWindow.document && previewWindow.document.readyState === 'complete') {
        try { previousScrollTop = previewWindow.scrollY; previousScrollLeft = previewWindow.scrollX; } catch (e) {}
    }

    try {
        if (!htmlEditor || !cssEditor || !jsEditor) return;
        const rawHtml = htmlEditor.getValue();
        const cssContent = cssEditor.getValue();
        const jsContent = jsEditor.getValue();
        const processedHtml = addSourceLineMarkers(rawHtml);

        const parser = new DOMParser();
        const doc = parser.parseFromString(processedHtml, 'text/html');
        const headElement = doc.head || doc.createElement('head');
        const bodyElement = doc.body || doc.createElement('body');

        let styleTag = headElement.querySelector('#preview-injected-styles');
        if (!styleTag) { styleTag = doc.createElement('style'); styleTag.id = 'preview-injected-styles'; headElement.appendChild(styleTag); }
        styleTag.textContent = `/* User CSS */\n${cssContent}`;

        const scriptTagId = 'preview-injected-script';
        let scriptTag = bodyElement.querySelector(`#${scriptTagId}`);
        if (!scriptTag) { scriptTag = doc.createElement('script'); scriptTag.id = scriptTagId; (bodyElement || doc.documentElement).appendChild(scriptTag); }
        scriptTag.textContent = `(function() { const errEl=document.getElementById('preview-js-error'); if(errEl) errEl.remove(); try { ${jsContent} } catch(e) { console.error("Preview JS Error:", e); const d=document.createElement('div'); d.style.cssText='position:fixed;bottom:5px;left:5px;padding:8px;background:rgba(220,50,50,0.8);color:white;font-size:12px;z-index:9999;border-radius:3px;max-width:95%;overflow:auto;max-height:80px;'; d.textContent='JS Error: '+e.message; d.id='preview-js-error'; (document.body||document.documentElement).appendChild(d); } })();`;

        const finalHtml = `<!DOCTYPE html><html><head><meta charset="UTF-8"><title>Preview</title>${headElement.innerHTML}</head><body>${bodyElement.innerHTML}</body></html>`;

        // --- 수정된 부분 ---
        const restoreScrollAndAttachListener = () => {
            if (previewFrame.contentWindow && previewFrame.contentWindow.scrollTo) {
                 try {
                     previewFrame.contentWindow.scrollTo(previousScrollLeft, previousScrollTop);

                     // 기존 리스너 제거 (중복 방지)
                     const previewDoc = previewFrame.contentDocument || previewFrame.contentWindow?.document;
                     if (previewDoc && previewDoc.body) {
                         previewDoc.body.removeEventListener('click', handlePreviewClick); // 기존 핸들러 이름으로 제거
                         // 새 리스너 추가 (이벤트 위임 방식)
                         previewDoc.body.addEventListener('click', handlePreviewClick);
                         // console.log("Preview click listener attached."); // 디버깅용
                     }

                     // HTML 에디터 활성 상태일 때만 하이라이트/스크롤 재실행
                     if (currentEditor === 'html') {
                        setTimeout(highlightAndScrollPreview, 50);
                     }
                 } catch (e) { console.warn("Error restoring scroll or attaching listener:", e); }
            }
        };
        previewFrame.srcdoc = finalHtml;
        // iframe 로드 완료 시점 보장을 위해 'load' 이벤트 사용 고려 (더 안정적일 수 있음)
        // previewFrame.onload = restoreScrollAndAttachListener;
        // setTimeout 방식 유지 시 (기존 코드 방식)
        setTimeout(restoreScrollAndAttachListener, 100); // 시간 약간 늘림 (로드 보장 위해)
        // --- 수정 끝 ---

    } catch (e) {
        console.error("Error updating preview:", e);
        previewFrame.srcdoc = `<html><body>Preview Error: ${e.message}</body></html>`;
    }
}


/**
 * 미리보기 클릭 핸들러: 클릭된 요소의 소스 라인으로 HTML 에디터 커서 이동
 * @param {MouseEvent} event
 */
function handlePreviewClick(event) {
    let target = event.target;
    let sourceLine = null;

    // 클릭된 요소부터 상위로 탐색하며 data-source-line 속성 찾기
    while (target && target !== document.body) {
        if (target.hasAttribute('data-source-line')) {
            sourceLine = target.getAttribute('data-source-line');
            break;
        }
        target = target.parentElement;
    }

    if (sourceLine) {
        const lineNumber = parseInt(sourceLine, 10);
        if (!isNaN(lineNumber) && lineNumber > 0) {
            console.log(`Preview clicked on element from line: ${lineNumber}`); // 디버깅 로그

            // HTML 탭으로 전환
            if (currentEditor !== 'html') {
                switchTab('html');
            }

            // CodeMirror 에디터 커서 이동 및 스크롤 (0-based index 사용)
            if (htmlEditor) {
                const lineIndex = lineNumber - 1;
                // 에디터가 완전히 표시된 후 커서 이동 및 스크롤 실행
                setTimeout(() => {
                    try {
                        htmlEditor.focus(); // 에디터에 포커스
                        htmlEditor.setCursor({ line: lineIndex, ch: 0 }); // 해당 줄의 시작으로 커서 이동
                        // 화면 중앙으로 스크롤 (center 옵션 사용)
                        const coords = htmlEditor.charCoords({ line: lineIndex, ch: 0 }, "local");
                        const scrollInfo = htmlEditor.getScrollInfo();
                        const targetScrollTop = coords.top - (scrollInfo.clientHeight / 2);
                        htmlEditor.scrollTo(null, targetScrollTop);
                        // highlightAndScrollPreview 함수도 호출하여 즉시 하이라이트 반영
                        highlightAndScrollPreview();
                    } catch (e) {
                        console.error("Error moving cursor or scrolling editor:", e);
                    }
                }, 100); // 탭 전환 및 에디터 렌더링 시간 고려
            }
        }
    } else {
        // console.log("Preview clicked, but no source line found."); // 디버깅용
    }
}

// highlightAndScrollPreview 함수는 기존 로직 유지 (CSS 변경으로 하이라이트 스타일은 자동 변경됨)

/**
 * 미리보기 하이라이트 및 스크롤 함수 (HTML 에디터용)
 * - 에디터 커서 라인을 포함하는 가장 가까운 상위 블록 요소를 찾아 하이라이트
 * - 해당 요소를 항상 미리보기 중앙으로 스크롤
 */
function highlightAndScrollPreview() {
    const previewDoc = previewFrame.contentDocument || previewFrame.contentWindow?.document;

    // --- 기존 하이라이트 모두 제거 ---
    if (previewDoc) {
        const currentlyHighlighted = previewDoc.querySelectorAll('.preview-highlight');
        currentlyHighlighted.forEach(el => {
            el.classList.remove('preview-highlight');
        });
    } else {
        console.warn("highlightAndScrollPreview: Preview document not ready.");
        return;
    }
    // --- 제거 끝 ---

    // HTML 에디터가 아니면 여기서 종료
    if (currentEditor !== 'html' || !htmlEditor) {
        return;
    }

    try {
        // previewDoc 유효성 확인
        if (!previewDoc.body || previewDoc.readyState !== 'complete') {
            // 로딩 중이면 잠시 후 다시 시도
            if (previewDoc.readyState === 'loading') setTimeout(highlightAndScrollPreview, 100);
            return;
        }

        // 현재 에디터 커서 라인 가져오기 (1-based)
        const cursor = htmlEditor.getCursor();
        const currentLine = cursor.line + 1;

        // --- 하이라이트 대상 요소 찾는 로직 변경 ---
        let targetElement = null;
        let maxLineNumFound = -1; // 찾은 요소 중 가장 큰 data-source-line 값

        // data-source-line 속성을 가진 모든 요소 가져오기
        const potentialElements = previewDoc.querySelectorAll('[data-source-line]');

        potentialElements.forEach(el => {
            const lineAttr = el.getAttribute('data-source-line');
            const elementLineNum = parseInt(lineAttr, 10);

            // 요소의 라인 번호가 유효하고, 현재 커서 라인보다 작거나 같으면서,
            // 이전에 찾은 요소의 라인 번호보다 크면, 이 요소를 대상으로 선택
            if (!isNaN(elementLineNum) && elementLineNum <= currentLine && elementLineNum > maxLineNumFound) {
                maxLineNumFound = elementLineNum;
                targetElement = el;
            }
        });
        // --- 대상 요소 찾기 끝 ---

        // 대상 요소를 찾았으면 하이라이트 및 스크롤 실행
        if (targetElement) {
            console.log(`Highlighting element for editor line ${currentLine}: Found block starting at line ${maxLineNumFound}`, targetElement); // 디버깅 로그

            // 새 하이라이트 적용
            targetElement.classList.add('preview-highlight');

            // --- 스크롤 로직 (isVisible 조건 없이 항상 실행, 중앙 정렬) ---
            targetElement.scrollIntoView({ behavior: 'smooth', block: 'center', inline: 'nearest' });
            // --- 스크롤 로직 끝 ---

        } else {
             console.log(`No suitable element found to highlight for editor line ${currentLine}`); // 디버깅 로그
        }

    } catch (e) {
         console.error("Error during highlight/scroll:", e);
    }
}


/**
 * 미리보기 크기 조절 버튼 클릭 핸들러
 */
function handleSizeButtonClick(event) {
    const targetButton = event.currentTarget;
    if (!targetButton || !previewWrapper) return;
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
    const activeEditor = getCurrentActiveEditor();
    if(activeEditor) setTimeout(() => activeEditor.refresh(), 50);
}
/**
 * File System Access API: HTML 파일 로드
 */
async function handleHtmlFileLoadWithPicker() {
    if (!window.showOpenFilePicker) { alert('File loading not supported in this browser.'); return; }
    try {
        const [fileHandle] = await window.showOpenFilePicker({ types: [{ description: 'HTML Files', accept: { 'text/html': ['.html', '.htm'] } }], multiple: false });
        currentFileHandle = fileHandle;
        loadedFileName = fileHandle.name;
        const file = await fileHandle.getFile();
        const fileContent = await file.text();
        if (htmlEditor) {
            htmlEditor.setValue(fileContent);
            document.title = `Editor - ${loadedFileName}`;
            if (cssEditor) cssEditor.setValue('/* Styles for ' + loadedFileName + ' */');
            if (jsEditor) jsEditor.setValue('// Script for ' + loadedFileName);
             switchTab('html');
        }
    } catch (err) { if (err.name !== 'AbortError') console.error("Error loading file:", err); }
}

/**
 * File System Access API: 파일 저장
 */
async function handleSave() {
    if (!htmlEditor) return;
    if (!currentFileHandle) { await handleSaveAsWithPicker(); return; }
    if (!currentFileHandle.createWritable) { alert('File saving not supported directly. Use "Save As".'); return; }
    try {
        const options = { mode: 'readwrite' };
        if (await currentFileHandle.queryPermission(options) !== 'granted') { if (await currentFileHandle.requestPermission(options) !== 'granted') { alert('File write permission required.'); return; } }
        const writable = await currentFileHandle.createWritable();
        await writable.write(htmlEditor.getValue());
        await writable.close();
        showTemporaryStatus("File saved!");
    } catch (err) { console.error("Error saving file:", err); alert(`Error saving: ${err.message}`); }
}

/**
 * File System Access API: 다른 이름으로 저장
 */
async function handleSaveAsWithPicker() {
    if (!htmlEditor) return;
    if (!window.showSaveFilePicker) { alert('"Save As" not supported in this browser.'); return; }
    try {
        const fileHandle = await window.showSaveFilePicker({ suggestedName: loadedFileName, types: [{ description: 'HTML Files', accept: { 'text/html': ['.html', '.htm'] } }] });
        currentFileHandle = fileHandle;
        loadedFileName = fileHandle.name;
        document.title = `Editor - ${loadedFileName}`;
        const writable = await fileHandle.createWritable();
        await writable.write(htmlEditor.getValue());
        await writable.close();
        showTemporaryStatus("File saved as!");
    } catch (err) { if (err.name !== 'AbortError') console.error("Error saving file as:", err); }
}

/**
 * 임시 상태 메시지 표시 헬퍼
 */
function showTemporaryStatus(message, duration = 2000) {
    let tempStatusDiv = document.getElementById('temp-status-message');
    if (!tempStatusDiv) {
        tempStatusDiv = document.createElement('div'); tempStatusDiv.id = 'temp-status-message';
        tempStatusDiv.style.cssText = `position: fixed; bottom: 10px; right: 10px; background: rgba(0,0,0,0.7); color: white; padding: 8px 12px; border-radius: 4px; font-size: 13px; z-index: 10001; opacity: 0; transition: opacity 0.3s;`;
        document.body.appendChild(tempStatusDiv);
    }
    tempStatusDiv.textContent = message;
    requestAnimationFrame(() => { tempStatusDiv.style.opacity = '1'; });
    setTimeout(() => { tempStatusDiv.style.opacity = '0'; }, duration);
}

// --- 스크립트 실행 시작점 ---
document.addEventListener('DOMContentLoaded', initializeApp);