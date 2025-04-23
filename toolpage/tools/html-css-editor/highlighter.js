/**
 * highlighter.js - 코드 하이라이팅 기능
 * HTML/CSS 에디터의 구문 강조 표시를 위한 기능을 제공합니다.
 */

const Highlighter = (function() {
    'use strict';
    
    // 로깅 설정
    const DEBUG = true;
    const LOG_PREFIX = '[Highlighter]';
    
    /**
     * 콘솔에 디버그 메시지를 출력합니다.
     * @param {string} message - 출력할 메시지
     * @param {any} data - 추가 데이터 (선택적)
     */
    function logDebug(message, data) {
        if (!DEBUG) return;
        if (data !== undefined) {
            console.log(`${LOG_PREFIX} ${message}`, data);
        } else {
            console.log(`${LOG_PREFIX} ${message}`);
        }
    }
    
    /**
     * 콘솔에 에러 메시지를 출력합니다.
     * @param {string} message - 출력할 에러 메시지
     * @param {Error} error - 에러 객체 (선택적)
     */
    function logError(message, error) {
        if (error) {
            console.error(`${LOG_PREFIX} ${message}`, error);
        } else {
            console.error(`${LOG_PREFIX} ${message}`);
        }
    }
    
    // 언어별 토큰 정의
    const tokens = {
        html: {
            tag: /<\/?[\w\-]+(?:\s+[\w\-:]+(?:\s*=\s*(?:"[^"]*"|'[^']*'|[\^'">\s]+))?)*\s*\/?>|<\!DOCTYPE[^>]+>/g,
            attribute: /\s+([\w\-:]+)(?:\s*=\s*(?:"([^"]*)"|'([^']*)'|([\^'">\s]+)))?/g,
            comment: /<!--[\s\S]*?-->/g,
            entity: /&[\w\#]+;/g,
            script: /<script[\s\S]*?>[\s\S]*?<\/script>/g,
            style: /<style[\s\S]*?>[\s\S]*?<\/style>/g
        },
        css: {
            selector: /([^\{\}]+)(?=\{)/g,
            property: /([\w\-]+)\s*:/g,
            value: /:\s*([^;\{\}]+)/g,
            comment: /\/\*[\s\S]*?\*\//g,
            atRule: /@[\w\-]+[^;\{]*[;\{]/g,
            unit: /\b(\d+)(px|em|rem|%|vh|vw|pt|cm|mm|in|s|ms)\b/g,
            hexColor: /#([a-fA-F0-9]{3,6})\b/g,
            mediaQuery: /@media[^{]+\{/g
        },
        js: {
            keyword: /\b(var|let|const|function|return|if|else|for|while|do|switch|case|break|continue|new|try|catch|throw|finally|typeof|instanceof|this|delete|void|in|of|null|undefined|true|false|class|extends|super|async|await|yield|import|export|default|from)\b/g,
            string: /('[^'\\]*(\\.[^'\\]*)*'|"[^"\\]*(\\.[^"\\]*)*")/g,
            comment: /\/\/.*|(\/\*[\s\S]*?\*\/)/g,
            number: /\b\d+(\.\d+)?\b/g,
            operator: /[\+\-\*\/\=\<\>\!\&\|\^\~\%]+/g,
            bracket: /[\(\)\[\]\{\}]/g,
            function: /\b([\w]+)(?=\()/g,
            dotNotation: /\b([\w]+)\./g,
            arrow: /=>/g,
            template: /`[^`]*`/g
        }
    };
    
    // 테마 색상 정의
    const themes = {
        light: {
            html: {
                tag: '#0000FF',               // 파란색
                attribute: '#008080',          // 청록색
                attributeValue: '#008000',     // 녹색
                comment: '#808080',            // 회색
                entity: '#800080',             // 자주색
                background: '#FFFFFF',         // 흰색
                text: '#000000'                // 검은색
            },
            css: {
                selector: '#800000',           // 갈색
                property: '#0000FF',           // 파란색
                value: '#008000',              // 녹색
                comment: '#808080',            // 회색
                atRule: '#0000A0',             // 진한 파란색
                unit: '#008080',               // 청록색
                hexColor: '#AB5600',           // 주황색
                background: '#FFFFFF',         // 흰색
                text: '#000000'                // 검은색
            },
            js: {
                keyword: '#0000FF',            // 파란색
                string: '#008000',             // 녹색
                comment: '#808080',            // 회색
                number: '#EC7600',             // 주황색
                operator: '#000000',           // 검은색
                bracket: '#000000',            // 검은색
                function: '#AA0D91',           // 자주색
                background: '#FFFFFF',         // 흰색
                text: '#000000',               // 검은색
                template: '#008000'            // 녹색
            }
        },
        dark: {
            html: {
                tag: '#569CD6',                // 밝은 파란색
                attribute: '#9CDCFE',          // 하늘색
                attributeValue: '#CE9178',     // 주황색
                comment: '#6A9955',            // 녹색
                entity: '#D7BA7D',             // 황금색
                background: '#1E1E1E',         // 진한 회색
                text: '#D4D4D4'                // 밝은 회색
            },
            css: {
                selector: '#D7BA7D',           // 황금색
                property: '#9CDCFE',           // 하늘색
                value: '#CE9178',              // 주황색
                comment: '#6A9955',            // 녹색
                atRule: '#C586C0',             // 보라색
                unit: '#B5CEA8',               // 연한 녹색
                hexColor: '#D69D85',           // 연한 주황색
                background: '#1E1E1E',         // 진한 회색
                text: '#D4D4D4'                // 밝은 회색
            },
            js: {
                keyword: '#569CD6',            // 밝은 파란색
                string: '#CE9178',             // 주황색
                comment: '#6A9955',            // 녹색
                number: '#B5CEA8',             // 연한 녹색
                operator: '#D4D4D4',           // 밝은 회색
                bracket: '#D4D4D4',            // 밝은 회색
                function: '#DCDCAA',           // 연한 노란색
                background: '#1E1E1E',         // 진한 회색
                text: '#D4D4D4',               // 밝은 회색
                template: '#CE9178'            // 주황색
            }
        }
    };
    
    // 현재 테마 설정
    let currentTheme = 'light';
    
    /**
     * 이스케이프된 HTML 문자열을 반환합니다.
     * @param {string} text - 이스케이프할 텍스트
     * @return {string} 이스케이프된 텍스트
     */
    function escapeHtml(text) {
        return text
            .replace(/&/g, '&amp;')
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;')
            .replace(/"/g, '&quot;')
            .replace(/'/g, '&#039;');
    }
    
    /**
     * 텍스트에서 토큰을 찾아 스타일이 지정된 HTML로 변환합니다.
     * @param {string} text - 원본 텍스트
     * @param {Object} tokenObj - 토큰 객체
     * @param {string} language - 언어 ('html', 'css', 'js')
     * @return {string} 하이라이팅된 HTML
     */
    function highlightTokens(text, tokenObj, language) {
        logDebug(`Highlighting ${language} content`, { textLength: text.length });
        
        // 원본 텍스트를 안전하게 저장
        let safeText = escapeHtml(text);
        
        // 토큰 매칭 결과를 저장할 배열
        let matches = [];
        
        // 모든 토큰 유형을 처리
        for (const [type, regex] of Object.entries(tokenObj)) {
            // 정규식 패턴 초기화
            regex.lastIndex = 0;
            
            // 매칭 찾기
            let match;
            while ((match = regex.exec(text)) !== null) {
                matches.push({
                    type: type,
                    start: match.index,
                    end: match.index + match[0].length,
                    content: match[0]
                });
            }
        }
        
        // 위치 순으로 매칭 정렬
        matches.sort((a, b) => a.start - b.start);
        
        // 겹치는 매칭 제거
        for (let i = 0; i < matches.length - 1; i++) {
            if (matches[i + 1].start < matches[i].end) {
                // 겹치는 경우, 우선순위에 따라 하나를 제거
                // 코멘트 > 문자열 > 태그 > 속성 > 기타 순서로 우선순위
                const priorities = {
                    'comment': 1,
                    'string': 2,
                    'tag': 3,
                    'attribute': 4
                };
                
                const priorityA = priorities[matches[i].type] || 10;
                const priorityB = priorities[matches[i + 1].type] || 10;
                
                if (priorityA <= priorityB) {
                    matches.splice(i + 1, 1);
                } else {
                    matches.splice(i, 1);
                }
                i--; // 인덱스 조정
            }
        }
        
        // 매칭 위치를 포함하는 배열 생성 (위치별 타입 및 색상 저장)
        const positions = [];
        for (let i = 0; i < safeText.length; i++) {
            positions.push(null);
        }
        
        // 각 매칭된 범위에 타입 적용
        for (const match of matches) {
            for (let i = match.start; i < match.end; i++) {
                if (i < positions.length) {
                    positions[i] = match.type;
                }
            }
        }
        
        // 포지션 배열을 사용하여 스타일이 지정된 HTML 생성
        let result = '';
        let currentType = null;
        let currentSegment = '';
        
        for (let i = 0; i < safeText.length; i++) {
            const type = positions[i];
            
            if (type !== currentType) {
                // 현재 세그먼트 마무리
                if (currentSegment.length > 0) {
                    if (currentType !== null) {
                        const color = themes[currentTheme][language][currentType];
                        result += `<span style="color: ${color};">${currentSegment}</span>`;
                    } else {
                        result += currentSegment;
                    }
                    currentSegment = '';
                }
                // 새 타입 시작
                currentType = type;
            }
            
            currentSegment += safeText[i];
        }
        
        // 마지막 세그먼트 처리
        if (currentSegment.length > 0) {
            if (currentType !== null) {
                const color = themes[currentTheme][language][currentType];
                result += `<span style="color: ${color};">${currentSegment}</span>`;
            } else {
                result += currentSegment;
            }
        }
        
        logDebug('Highlighting completed', { resultLength: result.length });
        return result;
    }
    
    /**
     * HTML 코드의 구문을 강조합니다.
     * @param {string} html - 강조할 HTML 코드
     * @return {string} 강조된 HTML
     */
    function highlightHtml(html) {
        try {
            logDebug('Highlighting HTML', { length: html.length });
            
            // HTML 문자열에서 스크립트와 스타일 태그 부분 찾기
            let scriptMatches = [];
            let styleMatches = [];
            
            // 정규식 초기화
            tokens.html.script.lastIndex = 0;
            tokens.html.style.lastIndex = 0;
            
            // 스크립트 태그 찾기
            let scriptMatch;
            while ((scriptMatch = tokens.html.script.exec(html)) !== null) {
                scriptMatches.push({
                    start: scriptMatch.index,
                    end: scriptMatch.index + scriptMatch[0].length,
                    content: scriptMatch[0]
                });
            }
            
            // 스타일 태그 찾기
            let styleMatch;
            while ((styleMatch = tokens.html.style.exec(html)) !== null) {
                styleMatches.push({
                    start: styleMatch.index,
                    end: styleMatch.index + styleMatch[0].length,
                    content: styleMatch[0]
                });
            }
            
            // HTML 기본 토큰 하이라이팅 적용
            let result = highlightTokens(html, tokens.html, 'html');
            
            // 스크립트와 스타일 코드에 개별 하이라이팅 적용
            // 참고: 실제 구현에서는 좀 더 복잡한 로직이 필요할 수 있습니다.
            
            return result;
        } catch (error) {
            logError('Error highlighting HTML', error);
            return escapeHtml(html);
        }
    }
    
    /**
     * CSS 코드의 구문을 강조합니다.
     * @param {string} css - 강조할 CSS 코드
     * @return {string} 강조된 CSS
     */
    function highlightCss(css) {
        try {
            logDebug('Highlighting CSS', { length: css.length });
            return highlightTokens(css, tokens.css, 'css');
        } catch (error) {
            logError('Error highlighting CSS', error);
            return escapeHtml(css);
        }
    }
    
    /**
     * JavaScript 코드의 구문을 강조합니다.
     * @param {string} js - 강조할 JavaScript 코드
     * @return {string} 강조된 JavaScript
     */
    function highlightJs(js) {
        try {
            logDebug('Highlighting JavaScript', { length: js.length });
            return highlightTokens(js, tokens.js, 'js');
        } catch (error) {
            logError('Error highlighting JavaScript', error);
            return escapeHtml(js);
        }
    }
    
    /**
     * 에디터에 대한 코드 하이라이팅을 적용합니다.
     * @param {HTMLElement} element - 하이라이팅을 적용할 요소
     * @param {string} code - 코드 내용
     * @param {string} language - 코드 언어 ('html', 'css', 'js')
     */
    function applyHighlighting(element, code, language) {
        logDebug(`Applying highlighting for ${language}`, { elementId: element.id || 'unknown' });
        
        try {
            let highlightedCode = '';
            
            switch (language) {
                case 'html':
                    highlightedCode = highlightHtml(code);
                    break;
                case 'css':
                    highlightedCode = highlightCss(code);
                    break;
                case 'js':
                    highlightedCode = highlightJs(code);
                    break;
                default:
                    logError(`Unsupported language: ${language}`);
                    highlightedCode = escapeHtml(code);
            }
            
            // pre 요소에는 배경색과 텍스트 색상 적용
            if (element.tagName.toLowerCase() === 'pre') {
                element.style.backgroundColor = themes[currentTheme][language].background;
                element.style.color = themes[currentTheme][language].text;
            }
            
            // HTML 내용 설정
            element.innerHTML = highlightedCode;
            
            logDebug('Highlighting applied successfully');
        } catch (error) {
            logError('Error applying highlighting', error);
            element.textContent = code; // 실패 시 일반 텍스트로 설정
        }
    }
    
    /**
     * 코드 요소에 실시간 하이라이팅을 설정합니다.
     * @param {HTMLElement} editor - 코드 편집기 요소
     * @param {HTMLElement} display - 하이라이팅된 코드를 표시할 요소
     * @param {string} language - 코드 언어 ('html', 'css', 'js')
     * @param {number} debounceTime - 디바운스 시간 (밀리초)
     */
    function setupLiveHighlighting(editor, display, language, debounceTime = 300) {
        logDebug('Setting up live highlighting', {
            editorId: editor.id || 'unknown',
            displayId: display.id || 'unknown',
            language
        });
        
        let debounceTimer = null;
        
        const updateHighlighting = () => {
            const code = editor.value || editor.textContent;
            applyHighlighting(display, code, language);
        };
        
        // 초기 하이라이팅 적용
        updateHighlighting();
        
        // 입력 이벤트에 대한 디바운스 처리
        const handleInput = () => {
            clearTimeout(debounceTimer);
            debounceTimer = setTimeout(updateHighlighting, debounceTime);
        };
        
        // 이벤트 리스너 설정
        editor.addEventListener('input', handleInput);
        editor.addEventListener('change', handleInput);
        editor.addEventListener('keyup', handleInput);
        
        logDebug('Live highlighting setup complete');
        
        // 정리 함수 반환 (필요 시 사용)
        return function cleanup() {
            editor.removeEventListener('input', handleInput);
            editor.removeEventListener('change', handleInput);
            editor.removeEventListener('keyup', handleInput);
            clearTimeout(debounceTimer);
            logDebug('Live highlighting cleanup complete');
        };
    }
    
    /**
     * 현재 테마를 설정합니다.
     * @param {string} theme - 테마 이름 ('light' 또는 'dark')
     */
    function setTheme(theme) {
        if (themes[theme]) {
            logDebug(`Setting theme to ${theme}`);
            currentTheme = theme;
            return true;
        } else {
            logError(`Unknown theme: ${theme}`);
            return false;
        }
    }
    
    /**
     * 현재 테마 이름을 반환합니다.
     * @return {string} 현재 테마 이름
     */
    function getTheme() {
        return currentTheme;
    }
    
    /**
     * 디버그 모드를 설정합니다.
     * @param {boolean} enabled - 디버그 모드 활성화 여부
     */
    function setDebugMode(enabled) {
        DEBUG = !!enabled;
        logDebug(`Debug mode ${DEBUG ? 'enabled' : 'disabled'}`);
    }
    
    // 공개 API
    return {
        highlight: {
            html: highlightHtml,
            css: highlightCss,
            js: highlightJs
        },
        apply: applyHighlighting,
        setupLive: setupLiveHighlighting,
        theme: {
            get: getTheme,
            set: setTheme
        },
        debug: setDebugMode
    };
})();