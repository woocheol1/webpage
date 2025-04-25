/**
 * script.js - HTML, CSS & JS Editor with Live Preview (v5.1 - Cursor Sync & Folding Fix)
 * Features: Tabs (HTML, CSS, JS), Syntax Highlighting (CodeMirror),
 * Live Preview (iframe), Debounced Updates, Scroll Position Persistence,
 * Cursor-based Scroll Sync (HTML), Line Highlight (HTML), Resizable Panes (Split.js),
 * Responsive Preview Sizes, Code Folding Controls.
 */

// --- 전역 변수 ---
let htmlEditor, cssEditor, jsEditor; // CodeMirror 인스턴스
const previewFrame = document.getElementById('preview'); // 미리보기 iframe
let previousHighlightElement = null; // 이전에 하이라이트된 요소 추적
let currentEditor = 'html'; // 현재 활성 에디터 ('html', 'css', 'js')
let scrollTimeoutId; // 스크롤 중복 실행 방지용 타이머 ID
let loadedFileName = 'untitled.html'; // ===== 추가: 불러온 파일 이름 저장용 =====
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
const loadHtmlButton = document.getElementById('btn-load-html'); // ===== 추가 =====
const saveButton = document.getElementById('btn-save');           // ===== 추가 =====
const saveAsButton = document.getElementById('btn-save-as');     // ===== 추가 =====


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

// --- 추가: 현재 활성 에디터 인스턴스 반환 함수 ---
function getCurrentActiveEditor() {
    if (currentEditor === 'html') return htmlEditor;
    if (currentEditor === 'css') return cssEditor;
    if (currentEditor === 'js') return jsEditor;
    return null; // 활성 에디터가 없거나 식별할 수 없을 때 null 반환
}
// --- 추가 끝 ---


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
            // ===== 추가: Ctrl+S 단축키를 위한 extraKeys =====
            extraKeys: {
                "Ctrl-S": function(instance) {
                    handleSave(); // Ctrl+S 누르면 저장 함수 호출
                },
                "Cmd-S": function(instance) {
                    handleSave(); // Cmd+S (Mac) 누르면 저장 함수 호출
                }
            }
        });
        // CSS, JS 에디터에도 동일하게 extraKeys 추가 (선택사항 - HTML만 저장할 것이므로 필수는 아님)
        cssEditor = CodeMirror.fromTextArea(document.getElementById('css-editor'), {
            mode: 'css',
            theme: 'material',
            lineNumbers: true,
            lineWrapping: true,
            foldGutter: true,
            gutters: ["CodeMirror-linenumbers", "CodeMirror-foldgutter"],
             extraKeys: { "Ctrl-S": handleSave, "Cmd-S": handleSave } // 필요시 추가
        });
        jsEditor = CodeMirror.fromTextArea(document.getElementById('js-editor'), {
            mode: 'javascript',
            theme: 'material',
            lineNumbers: true,
            lineWrapping: true,
            foldGutter: true,
            gutters: ["CodeMirror-linenumbers", "CodeMirror-foldgutter"],
             extraKeys: { "Ctrl-S": handleSave, "Cmd-S": handleSave } // 필요시 추가
        });

        // --- 각 에디터에 폴딩 기능 초기화 ---
        if (typeof initializeFolding === 'function') {
             initializeFolding(htmlEditor, 'htmlmixed');
             initializeFolding(cssEditor, 'css');
             initializeFolding(jsEditor, 'javascript');
        } else {
            console.error("initializeFolding function not found. Make sure folding.js is loaded.");
        }

        if (typeof initializeColorTools === 'function') {
            initializeColorTools(cssEditor); // CSS 에디터 인스턴스를 전달
       } else {
           console.error("initializeColorTools function not found. Make sure color-tools.js is loaded.");
       }

       if (typeof initializeFormatter === 'function') {
        initializeFormatter(getCurrentActiveEditor); // 활성 에디터 반환 함수를 전달
   } else {
       console.error("initializeFormatter function not found. Make sure formatter.js is loaded.");
   }

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
    <h1>HTML, CSS & JS 실시간 미리보기 (v5.1)</h1>
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
        <li>HTML 커서 기반 스크롤 동기화</li>
        <li>코드 접기/펼치기 (폴딩)</li>
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
            clearTimeout(messageTimeout);
            messageTimeout = setTimeout(function() {
                messageArea.textContent = '';
                 if (jsHighlight) {
                     jsHighlight.style.backgroundColor = '';
                 }
            }, 5000);
        }
        if (jsHighlight) {
            jsHighlight.style.backgroundColor = 'lightblue';
            jsHighlight.style.transition = 'background-color 0.3s';
        }
    });
    console.log('Button event listener added.');
} else {
    console.warn('Action button not found.');
}

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
    htmlEditor.on('cursorActivity', debounce(() => {
        if (currentEditor === 'html') {
            highlightAndScrollPreview();
        }
    }, 150));

    // --- 탭 기능 초기화 ---
    if (tabHtml && tabCss && tabJs) {
        tabHtml.addEventListener('click', () => switchTab('html'));
        tabCss.addEventListener('click', () => switchTab('css'));
        tabJs.addEventListener('click', () => switchTab('js'));
    } else {
        console.error("Tab buttons not found!");
    }

    // --- 전체 접기/펼치기 버튼 이벤트 리스너 ---
    if (foldAllButton) {
        foldAllButton.addEventListener('click', () => {
            console.log("Fold All button clicked.");
            const activeEditor = getCurrentActiveEditor(); // 이 함수가 정의되어 있어야 함
            console.log("Active editor instance:", activeEditor);
            if (activeEditor && typeof activeEditor.execCommand === 'function') {
                try {
                    activeEditor.execCommand("foldAll");
                    console.log("Fold all executed for", currentEditor);
                } catch (e) {
                    console.error("Error executing foldAll command:", e);
                }
            } else {
                console.error("Failed to get active editor or execCommand is not available.");
            }
        });
    } else {
        console.warn("Fold All button not found!");
    }

    if (loadHtmlButton) {
        // ===== 수정: File System Access API 사용 =====
        loadHtmlButton.addEventListener('click', handleHtmlFileLoadWithPicker);
    } else {
        console.warn("Load HTML button not found!");
    }

    if (saveButton) {
        saveButton.addEventListener('click', handleSave); // 저장 함수 연결
    } else {
        console.warn("Save button not found!");
    }

    if (saveAsButton) {
        // ===== 수정: File System Access API 사용 =====
        saveAsButton.addEventListener('click', handleSaveAsWithPicker);
    } else {
        console.warn("Save As button not found!");
    }

    if (unfoldAllButton) {
        unfoldAllButton.addEventListener('click', () => {
            console.log("Unfold All button clicked.");
            const activeEditor = getCurrentActiveEditor(); // 이 함수가 정의되어 있어야 함
            console.log("Active editor instance:", activeEditor);
             if (activeEditor && typeof activeEditor.execCommand === 'function') {
                try {
                    activeEditor.execCommand("unfoldAll");
                    console.log("Unfold all executed for", currentEditor);
                } catch (e) {
                    console.error("Error executing unfoldAll command:", e);
                }
            } else {
                 console.error("Failed to get active editor or execCommand is not available.");
            }
        });
    } else {
        console.warn("Unfold All button not found!");
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
                 const activeEditor = getCurrentActiveEditor();
                 if(activeEditor) activeEditor.refresh();
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
    switchTab('html');
    updatePreview();
    setTimeout(highlightAndScrollPreview, 250);
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
        previousHighlightElement.classList.remove('preview-highlight');
        previousHighlightElement = null;
    }

    const activeEditor = getCurrentActiveEditor();
    if(activeEditor) {
        activeEditor.refresh(); // 탭 전환 시 해당 에디터 리프레시
        if (targetEditor === 'html') {
            highlightAndScrollPreview();
        }
    }
}


/**
 * HTML 문자열에 data-source-line 속성 추가 함수
 */
function addSourceLineMarkers(htmlString) {
    const lines = htmlString.split('\n');
    const blockTagsRegex = /^\s*<(p|h[1-6]|div|ul|ol|li|blockquote|section|article|header|footer|aside|table|tr|hr|pre|form|details|summary|figure|figcaption|fieldset|legend|span|a|button|label)([\s>])/i;
    let inBlock = false;

    return lines.map((line, index) => {
        const lineNumber = index + 1;
        if (line.includes('<script') || line.includes('<style')) inBlock = true;
        if (line.includes('</script') || line.includes('</style')) inBlock = false;

        if (!inBlock && blockTagsRegex.test(line)) {
            try {
                 return line.replace(/<([a-zA-Z0-9]+)((?:\s+[^>]*)?)>/, (match, tagName, existingAttrs) => {
                     if (!existingAttrs?.includes('data-source-line') && !match.startsWith('</') && !match.endsWith('/>')) {
                         return `<${tagName} data-source-line="${lineNumber}"${existingAttrs || ''}>`;
                     }
                     return match;
                 });
            } catch(e) {
                 return line;
            }
        }
        return line;
    }).join('\n');
}


/**
 * 미리보기 업데이트 함수
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
        if (!htmlEditor || !cssEditor || !jsEditor) {
            console.error("One or more editors not initialized!");
            return;
        }

        const rawHtml = htmlEditor.getValue();
        const cssContent = cssEditor.getValue();
        const jsContent = jsEditor.getValue();
        const processedHtml = addSourceLineMarkers(rawHtml);

        const parser = new DOMParser();
        const doc = parser.parseFromString(processedHtml, 'text/html');
        const headContent = doc.head.innerHTML;
        const bodyContent = doc.body.innerHTML;

        const finalHtml = `<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
    <title>Preview</title>
    ${headContent}
    <style id="preview-injected-styles">
        /* User CSS */
        ${cssContent}
    </style>
</head>
<body>
    ${bodyContent}
    <script id="preview-injected-script">
        (function() {
            try {
                ${jsContent}
            } catch (e) {
                console.error("Error executing preview script:", e);
                const errorDiv = document.createElement('div');
                errorDiv.style.cssText = 'position:fixed; bottom:10px; left:10px; padding:10px; background-color:rgba(220, 53, 69, 0.9); color:white; font-family:monospace; font-size:13px; z-index:10000; border-radius:5px; max-width: calc(100% - 20px); overflow:auto; max-height: 100px;';
                errorDiv.textContent = 'JS Error: ' + e.message;
                const existingError = document.getElementById('preview-js-error');
                if (existingError) existingError.remove();
                errorDiv.id = 'preview-js-error';
                if (document.body) {
                   document.body.appendChild(errorDiv);
                } else {
                   window.addEventListener('DOMContentLoaded', () => document.body.appendChild(errorDiv));
                }
            }
        })();
    </script>
</body>
</html>`;

        const restoreScroll = () => {
            if (previewFrame.contentWindow) {
                previewFrame.contentWindow.scrollTo(previousScrollLeft, previousScrollTop);
                 setTimeout(highlightAndScrollPreview, 50);
            }
        };

        previewFrame.addEventListener('load', restoreScroll, { once: true });
        previewFrame.srcdoc = finalHtml;

    } catch (e) {
        console.error("Error updating preview:", e);
        previewFrame.srcdoc = `<html><head><title>Error</title></head><body><h1 style="color:red;">Preview Update Error</h1><pre>${e.message}\n${e.stack}</pre></body></html>`;
    }
}

/**
 * 미리보기 하이라이트 및 스크롤 함수
 */
function highlightAndScrollPreview() {
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
        const targetElements = previewDoc.querySelectorAll(`[data-source-line="${currentLine}"]`);
        const targetElement = targetElements.length > 0 ? targetElements[0] : null;

        if (targetElement) {
            targetElement.classList.add('preview-highlight');
            previousHighlightElement = targetElement;

            targetElement.scrollIntoView({
                behavior: 'smooth',
                block: 'center',
                inline: 'nearest'
            });
             console.log(`Scrolled to element with data-source-line: ${currentLine}`);
        }
    } catch (e) {
         console.error("Error during highlight/scroll:", e);
         if (previousHighlightElement) {
            try { previousHighlightElement.classList.remove('preview-highlight'); } catch (ignore) {}
            previousHighlightElement = null;
         }
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
    if(activeEditor) activeEditor.refresh();
}
/**
 * File System Access API를 사용하여 HTML 파일 로드 처리
 */
async function handleHtmlFileLoadWithPicker() {
    // API 지원 여부 확인 (선택 사항)
    if (!window.showOpenFilePicker) {
        alert('현재 브라우저에서는 파일 직접 로드 기능을 지원하지 않습니다.');
        // 필요시 input[type=file]을 이용한 대체 로직 호출
        // fileInputHtml.click(); // 예시: 숨겨진 input 사용
        return;
    }

    try {
        // 파일 선택기 표시 (HTML 파일만 선택 가능하도록 옵션 설정)
        const [fileHandle] = await window.showOpenFilePicker({
            types: [{
                description: 'HTML Files',
                accept: { 'text/html': ['.html', '.htm'] }
            }],
            multiple: false // 단일 파일만 선택
        });

        // 파일 핸들 및 이름 저장
        currentFileHandle = fileHandle;
        loadedFileName = fileHandle.name;

        // 파일 객체 얻기 및 내용 읽기
        const file = await fileHandle.getFile();
        const fileContent = await file.text();

        // 에디터에 내용 설정 및 초기화
        if (htmlEditor) {
            htmlEditor.setValue(fileContent);
            console.log(`Loaded file: ${loadedFileName}`);
            document.title = `Editor - ${loadedFileName}`; // 페이지 제목 업데이트 (선택 사항)

            if (cssEditor) cssEditor.setValue('');
            if (jsEditor) jsEditor.setValue('');
            updatePreview();
            // highlightAndScrollPreview(); // 필요시 호출
        }

    } catch (err) {
        // 사용자가 선택을 취소했거나 오류 발생
        if (err.name === 'AbortError') {
            console.log('File selection cancelled by user.');
        } else {
            console.error("Error loading file with picker:", err);
            alert('파일을 불러오는 중 오류가 발생했습니다.');
        }
        // 오류 발생 시 핸들 초기화 (선택 사항)
        // currentFileHandle = null;
        // loadedFileName = 'untitled.html';
        // document.title = 'Editor';
    }
}

/**
 * File System Access API를 사용하여 파일 저장 (직접 저장)
 */
async function handleSave() {
    if (!htmlEditor) return;

    if (!currentFileHandle) {
        // 저장된 파일 핸들이 없으면 '다른 이름으로 저장' 실행
        console.log("No file handle found, initiating Save As...");
        await handleSaveAsWithPicker();
        return;
    }

    // API 지원 여부 확인
    if (!currentFileHandle.createWritable) {
         alert('현재 브라우저에서는 파일 직접 저장 기능을 지원하지 않습니다. "Save As"를 사용해주세요.');
         // 필요시 다운로드 방식의 handleSaveAs 호출
         return;
    }

    console.log(`Attempting to save: ${currentFileHandle.name}`);

    try {
        // 쓰기 권한 확인 및 요청 (필요시 브라우저가 자동으로 요청)
        // const permission = await currentFileHandle.queryPermission({ mode: 'readwrite' });
        // if (permission !== 'granted') {
        //     const request = await currentFileHandle.requestPermission({ mode: 'readwrite' });
        //     if (request !== 'granted') {
        //         alert('파일 쓰기 권한이 필요합니다.');
        //         return;
        //     }
        // }

        // 쓰기 가능한 스트림 생성
        const writable = await currentFileHandle.createWritable();

        // 현재 HTML 에디터 내용 가져오기
        const content = htmlEditor.getValue();

        // 파일에 내용 쓰기
        await writable.write(content);

        // 스트림 닫기 (실제 저장 발생)
        await writable.close();

        console.log(`File saved successfully: ${currentFileHandle.name}`);
        // 사용자에게 성공 피드백 (예: 잠시 메시지 표시)
        showTemporaryStatus("File saved!");

    } catch (err) {
        console.error("Error saving file:", err);
        alert(`파일 저장 중 오류 발생: ${err.message}`);
    }
}

/**
 * File System Access API를 사용하여 다른 이름으로 저장
 */
async function handleSaveAsWithPicker() {
    if (!htmlEditor) return;

    // API 지원 여부 확인
    if (!window.showSaveFilePicker) {
        alert('현재 브라우저에서는 "다른 이름으로 저장" 기능을 지원하지 않습니다.');
        // 필요시 다운로드 방식의 handleSaveAs (prompt 사용) 호출
        // handleSaveAs(); // 이전 코드의 함수 이름
        return;
    }

    try {
        // '다른 이름으로 저장' 파일 선택기 표시
        const fileHandle = await window.showSaveFilePicker({
            suggestedName: loadedFileName, // 기본 파일 이름 제안
            types: [{
                description: 'HTML Files',
                accept: { 'text/html': ['.html', '.htm'] }
            }]
        });

        // 새 핸들 및 이름 저장
        currentFileHandle = fileHandle;
        loadedFileName = fileHandle.name;
        document.title = `Editor - ${loadedFileName}`; // 페이지 제목 업데이트

        console.log(`Attempting to save as: ${fileHandle.name}`);

        // 쓰기 가능한 스트림 생성
        const writable = await fileHandle.createWritable();

        // 현재 HTML 에디터 내용 가져오기
        const content = htmlEditor.getValue();

        // 파일에 내용 쓰기
        await writable.write(content);

        // 스트림 닫기
        await writable.close();

        console.log(`File saved successfully as: ${fileHandle.name}`);
        showTemporaryStatus("File saved as!");

    } catch (err) {
        if (err.name === 'AbortError') {
            console.log('Save As cancelled by user.');
        } else {
            console.error("Error saving file as:", err);
            alert(`파일 저장 중 오류 발생: ${err.message}`);
        }
    }
}

/**
 * (헬퍼 함수 예시) 잠시 상태 메시지를 화면에 표시
 * @param {string} message - 표시할 메시지
 * @param {number} duration - 표시 시간 (밀리초)
 */
function showTemporaryStatus(message, duration = 2000) {
    // 간단한 예시: 콘솔 출력 또는 상태 표시줄 요소 업데이트
    console.log(`Status: ${message}`);
    // 실제 구현 시: 페이지 특정 위치에 메시지 표시 후 setTimeout으로 제거
    // const statusElement = document.getElementById('status-bar');
    // if (statusElement) {
    //     statusElement.textContent = message;
    //     setTimeout(() => { statusElement.textContent = ''; }, duration);
    // }
}

// --- 스크립트 실행 시작점 ---
document.addEventListener('DOMContentLoaded', initializeApp);