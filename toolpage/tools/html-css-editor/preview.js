/**
 * HTML/CSS 에디터 미리보기 관련 기능
 * 실시간 코드 미리보기 관련 기능을 담당합니다.
 */

// 미리보기 업데이트 지연 시간 (ms)
const PREVIEW_DELAY = 300;
let previewUpdateTimeout = null;

// 미리보기 기록 관련 변수
let previewHistory = [];
let currentHistoryIndex = -1;
const MAX_HISTORY_SIZE = 50;

// 미리보기 콘솔 로그 캡처를 위한 변수
let capturedLogs = [];

// DOM이 로드되면 실행
document.addEventListener('DOMContentLoaded', function() {
    console.log('미리보기 기능 초기화 중...');
    
    // 초기 미리보기 업데이트
    updatePreviewFrame();
    
    // URL에서 공유된 코드가 있는지 확인
    try {
        if (typeof getSharedCodeFromUrl === 'function' && getSharedCodeFromUrl()) {
            // 공유된 코드가 로드된 경우 미리보기 업데이트
            updatePreviewFrame();
        }
    } catch (error) {
        console.error('공유 코드 로드 중 오류:', error);
    }
    
    console.log('미리보기 기능 초기화 완료');
});

/**
 * 현재 에디터 내용을 기반으로 미리보기 프레임 업데이트
 */
function updatePreviewFrame() {
    // 이전 타이머 취소
    if (previewUpdateTimeout) {
        clearTimeout(previewUpdateTimeout);
    }
    
    // 딜레이 후 미리보기 업데이트 실행 (타이핑 중 성능 최적화)
    previewUpdateTimeout = setTimeout(() => {
        try {
            const htmlEditor = document.getElementById('html-editor');
            const cssEditor = document.getElementById('css-editor');
            const jsEditor = document.getElementById('js-editor');
            const previewFrame = document.getElementById('preview');
            
            // 에디터에서 코드 가져오기
            const htmlCode = htmlEditor ? htmlEditor.value : '';
            const cssCode = cssEditor ? cssEditor.value : '';
            const jsCode = jsEditor ? jsEditor.value : '';
            
            // 미리보기 HTML 생성
            const previewContent = generatePreviewHTML(htmlCode, cssCode, jsCode);
            
            // 프레임 내용 업데이트
            if (previewFrame) {
                previewFrame.srcdoc = previewContent;
                
                // 미리보기 로드 후 이벤트 캡처 설정
                previewFrame.onload = function() {
                    // 콘솔 로그 캡처
                    setupConsoleCapture(previewFrame);
                    
                    // 미리보기 내 링크 클릭 처리
                    handlePreviewLinks(previewFrame);
                    
                    // 미리보기 로드 완료 로그
                    console.log('미리보기 업데이트 완료');
                    logAction('미리보기 업데이트', { timestamp: new Date().toISOString() });
                };
                
                // 히스토리에 현재 상태 저장
                saveToPreviewHistory(htmlCode, cssCode, jsCode);
            }
        } catch (error) {
            console.error('미리보기 업데이트 오류:', error);
            handleError(error, '미리보기 업데이트');
        }
    }, PREVIEW_DELAY);
}

/**
 * 미리보기 HTML 생성
 * @param {string} html - HTML 코드
 * @param {string} css - CSS 코드
 * @param {string} js - JavaScript 코드
 * @returns {string} 미리보기 HTML 문서
 */
function generatePreviewHTML(html, css, js) {
    // 기본 HTML 구조가 있는지 확인
    const hasHtmlStructure = html.includes('<html') && html.includes('</html>');
    
    // HTML 문서 기본 구조가 없는 경우 추가
    if (!hasHtmlStructure) {
        const headTag = '<head>\n<meta charset="UTF-8">\n<meta name="viewport" content="width=device-width, initial-scale=1.0">\n</head>';
        const bodyOpenTag = '<body>';
        const bodyCloseTag = '</body>';
        
        // body 태그가 있는지 확인
        const hasBodyTag = html.includes('<body') && html.includes('</body>');
        
        if (hasBodyTag) {
            // body 태그가 있지만 html/head 태그가 없는 경우
            html = `<!DOCTYPE html>\n<html lang="ko">\n${headTag}\n${html}\n</html>`;
        } else {
            // 전체 구조가 없는 경우
            html = `<!DOCTYPE html>\n<html lang="ko">\n${headTag}\n${bodyOpenTag}\n${html}\n${bodyCloseTag}\n</html>`;
        }
    }
    
    // CSS 추가 (없는 경우에만)
    if (css && css.trim() !== '') {
        // style 태그가 이미 있는지 확인
        const hasStyleTag = html.includes('<style');
        
        if (!hasStyleTag) {
            // head 태그 닫는 부분 찾기
            const headCloseIndex = html.indexOf('</head>');
            
            if (headCloseIndex !== -1) {
                // head 태그 안에 style 추가
                html = html.slice(0, headCloseIndex) + 
                      `\n<style>\n${css}\n</style>\n` + 
                      html.slice(headCloseIndex);
            } else {
                // head 태그가 없는 경우, body 태그 바로 앞에 추가
                const bodyIndex = html.indexOf('<body');
                
                if (bodyIndex !== -1) {
                    html = html.slice(0, bodyIndex) + 
                          `<style>\n${css}\n</style>\n` + 
                          html.slice(bodyIndex);
                } else {
                    // body 태그도 없는 경우, 문서 끝에 추가
                    html += `\n<style>\n${css}\n</style>`;
                }
            }
        }
    }
    
    // JavaScript 추가 (없는 경우에만)
    if (js && js.trim() !== '') {
        // script 태그가 이미 있는지 확인
        const hasScriptTag = html.includes('<script');
        
        if (!hasScriptTag) {
            // body 태그 닫는 부분 찾기
            const bodyCloseIndex = html.indexOf('</body>');
            
            if (bodyCloseIndex !== -1) {
                // body 태그 닫기 전에 script 추가
                html = html.slice(0, bodyCloseIndex) + 
                      `\n<script>\n${js}\n</script>\n` + 
                      html.slice(bodyCloseIndex);
            } else {
                // body 태그가 없는 경우, 문서 끝에 추가
                html += `\n<script>\n${js}\n</script>`;
            }
        }
    }
    
    // 콘솔 로그 캡처를 위한 스크립트 추가
    const consoleCapture = `
<script>
// 원래 콘솔 메서드 백업
window._originalConsole = {
    log: console.log,
    warn: console.warn,
    error: console.error,
    info: console.info
};

// 콘솔 메서드 오버라이드
console.log = function() {
    window._originalConsole.log.apply(console, arguments);
    try {
        window.parent.postMessage({
            type: 'console',
            method: 'log',
            args: Array.from(arguments).map(arg => String(arg))
        }, '*');
    } catch (e) {}
};

console.warn = function() {
    window._originalConsole.warn.apply(console, arguments);
    try {
        window.parent.postMessage({
            type: 'console',
            method: 'warn',
            args: Array.from(arguments).map(arg => String(arg))
        }, '*');
    } catch (e) {}
};

console.error = function() {
    window._originalConsole.error.apply(console, arguments);
    try {
        window.parent.postMessage({
            type: 'console',
            method: 'error',
            args: Array.from(arguments).map(arg => String(arg))
        }, '*');
    } catch (e) {}
};

console.info = function() {
    window._originalConsole.info.apply(console, arguments);
    try {
        window.parent.postMessage({
            type: 'console',
            method: 'info',
            args: Array.from(arguments).map(arg => String(arg))
        }, '*');
    } catch (e) {}
};

// 오류 캡처
window.addEventListener('error', function(e) {
    try {
        window.parent.postMessage({
            type: 'console',
            method: 'error',
            args: ['Error: ' + e.message + ' at ' + e.filename + ':' + e.lineno]
        }, '*');
    } catch (err) {}
});
</script>`;
    
    // body 태그 닫기 전에 콘솔 캡처 스크립트 삽입
    const bodyCloseIndex = html.indexOf('</body>');
    if (bodyCloseIndex !== -1) {
        html = html.slice(0, bodyCloseIndex) + consoleCapture + html.slice(bodyCloseIndex);
    } else {
        html += consoleCapture;
    }
    
    return html;
}

/**
 * 미리보기 iframe 내의 console 메서드를 캡처하여 표시
 * @param {HTMLIFrameElement} previewFrame - 미리보기 iframe 요소
 */
function setupConsoleCapture(previewFrame) {
    // 메시지 이벤트 리스너 등록
    window.addEventListener('message', function(event) {
        // 콘솔 메시지 처리
        if (event.data && event.data.type === 'console') {
            const { method, args } = event.data;
            
            // 로그 저장
            capturedLogs.push({
                method,
                args,
                timestamp: new Date().toISOString()
            });
            
            // 최대 100개까지만 저장
            if (capturedLogs.length > 100) {
                capturedLogs.shift();
            }
            
            // 로그 메시지 콘솔에 출력
            console.log(`[미리보기 콘솔] [${method}]`, ...args);
        }
    });
}

/**
 * 미리보기 내부의 링크 클릭 처리
 * @param {HTMLIFrameElement} previewFrame - 미리보기 iframe 요소
 */
function handlePreviewLinks(previewFrame) {
    try {
        const iframe = previewFrame.contentWindow || previewFrame.contentDocument;
        
        // iframe 내 모든 링크 찾기
        const links = iframe.document.querySelectorAll('a[href]');
        
        // 각 링크에 클릭 이벤트 핸들러 추가
        links.forEach(link => {
            link.addEventListener('click', function(e) {
                const href = link.getAttribute('href');
                
                // 내부 링크(#으로 시작)는 그대로 처리
                if (href.startsWith('#')) {
                    return true;
                }
                
                // 외부 링크는 새 창에서 열기
                e.preventDefault();
                window.open(href, '_blank');
                
                console.log(`미리보기 내 링크 클릭: ${href}`);
                logAction('미리보기 링크 클릭', { href });
                
                return false;
            });
        });
    } catch (error) {
        console.warn('미리보기 링크 처리 오류:', error);
    }
}

/**
 * 미리보기 히스토리에 현재 상태 저장
 * @param {string} html - HTML 코드
 * @param {string} css - CSS 코드
 * @param {string} js - JavaScript 코드
 */
function saveToPreviewHistory(html, css, js) {
    // 히스토리 인덱스가 마지막이 아닌 경우, 이후 히스토리 삭제
    if (currentHistoryIndex >= 0 && currentHistoryIndex < previewHistory.length - 1) {
        previewHistory = previewHistory.slice(0, currentHistoryIndex + 1);
    }
    
    // 마지막 항목과 현재 상태가 같은 경우 저장하지 않음
    const lastItem = previewHistory[previewHistory.length - 1];
    if (lastItem && 
        lastItem.html === html && 
        lastItem.css === css && 
        lastItem.js === js) {
        return;
    }
    
    // 새 상태 저장
    previewHistory.push({ html, css, js, timestamp: new Date().toISOString() });
    
    // 최대 크기 유지
    if (previewHistory.length > MAX_HISTORY_SIZE) {
        previewHistory.shift();
    }
    
    // 현재 인덱스 업데이트
    currentHistoryIndex = previewHistory.length - 1;
}

/**
 * 이전 미리보기 상태로 되돌리기
 */
function undoPreview() {
    // 이전 상태가 있는지 확인
    if (currentHistoryIndex > 0) {
        currentHistoryIndex--;
        const prevState = previewHistory[currentHistoryIndex];
        
        // 에디터 값 업데이트
        document.getElementById('html-editor').value = prevState.html;
        document.getElementById('css-editor').value = prevState.css;
        document.getElementById('js-editor').value = prevState.js;
        
        // 미리보기 업데이트
        updatePreviewFrame();
        
        console.log('미리보기 실행 취소');
        logAction('미리보기 실행 취소', { historyIndex: currentHistoryIndex });
    } else {
        console.log('이전 상태가 없습니다');
    }
}

/**
 * 다음 미리보기 상태로 복원
 */
function redoPreview() {
    // 다음 상태가 있는지 확인
    if (currentHistoryIndex < previewHistory.length - 1) {
        currentHistoryIndex++;
        const nextState = previewHistory[currentHistoryIndex];
        
        // 에디터 값 업데이트
        document.getElementById('html-editor').value = nextState.html;
        document.getElementById('css-editor').value = nextState.css;
        document.getElementById('js-editor').value = nextState.js;
        
        // 미리보기 업데이트
        updatePreviewFrame();
        
        console.log('미리보기 다시 실행');
        logAction('미리보기 다시 실행', { historyIndex: currentHistoryIndex });
    } else {
        console.log('다음 상태가 없습니다');
    }
}

/**
 * 미리보기 화면 리셋
 */
function resetPreview() {
    const previewFrame = document.getElementById('preview');
    if (previewFrame) {
        previewFrame.srcdoc = ''; // 미리보기 내용 초기화
        setTimeout(() => {
            updatePreviewFrame(); // 미리보기 다시 렌더링
        }, 100);
        
        console.log('미리보기 리셋 완료');
        logAction('미리보기 리셋');
    }
}

/**
 * 미리보기 새로고침
 */
function refreshPreview() {
    resetPreview();
    
    console.log('미리보기 새로고침 완료');
    logAction('미리보기 새로고침');
}

/**
 * 미리보기 화면에 캡처된 콘솔 로그 표시 전환
 */
function toggleConsoleOutput() {
    const consoleOutput = document.querySelector('.console-output');
    
    // 콘솔 출력 영역이 없으면 생성
    if (!consoleOutput) {
        createConsoleOutput();
        updateConsoleOutput();
    } else {
        // 있으면 토글
        consoleOutput.classList.toggle('visible');
    }
    
    // 상태 로깅
    const isVisible = document.querySelector('.console-output.visible') !== null;
    console.log(`콘솔 출력 ${isVisible ? '표시' : '숨김'}`);
    logAction('콘솔 출력 토글', { visible: isVisible });
}

/**
 * 콘솔 출력 영역 생성
 */
function createConsoleOutput() {
    const previewPanel = document.querySelector('.preview-panel');
    if (!previewPanel) return;
    
    // 콘솔 출력 컨테이너 생성
    const consoleOutput = document.createElement('div');
    consoleOutput.className = 'console-output';
    consoleOutput.innerHTML = '<div class="console-header">Console <button class="console-clear">Clear</button></div><div class="console-content"></div>';
    
    // 콘솔 영역 추가
    previewPanel.appendChild(consoleOutput);
    
    // 콘솔 클리어 버튼에 이벤트 연결
    const clearBtn = consoleOutput.querySelector('.console-clear');
    if (clearBtn) {
        clearBtn.addEventListener('click', function() {
            capturedLogs = [];
            updateConsoleOutput();
            console.log('콘솔 로그 초기화');
            logAction('콘솔 로그 초기화');
        });
    }
    
    // 콘솔 표시
    consoleOutput.classList.add('visible');
}

/**
 * 콘솔 출력 내용 업데이트
 */
function updateConsoleOutput() {
    const consoleContent = document.querySelector('.console-content');
    if (!consoleContent) return;
    
    // 콘솔 내용 초기화
    consoleContent.innerHTML = '';
    
    // 캡처된 로그 없는 경우
    if (capturedLogs.length === 0) {
        consoleContent.innerHTML = '<div class="console-empty">No log messages</div>';
        return;
    }
    
    // 로그 메시지 추가
    capturedLogs.forEach(log => {
        const logEl = document.createElement('div');
        logEl.className = `console-line console-${log.method}`;
        
        // 로그 메시지 포맷팅
        let message = log.args.join(' ');
        
        // 메서드에 따른 아이콘 추가
        let icon = '🔵';
        if (log.method === 'error') icon = '🔴';
        else if (log.method === 'warn') icon = '🟠';
        else if (log.method === 'info') icon = '🟢';
        
        logEl.innerHTML = `${icon} ${message}`;
        consoleContent.appendChild(logEl);
    });
    
    // 스크롤을 아래로 이동
    consoleContent.scrollTop = consoleContent.scrollHeight;
}