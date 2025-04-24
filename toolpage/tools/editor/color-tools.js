/**
 * color-tools.js - CodeMirror 에디터용 색상 선택기 및 도구
 */

/**
 * 색상 선택기 및 관련 도구를 초기화합니다.
 * @param {CodeMirror.Editor} cssEditorInstance - CSS CodeMirror 에디터 인스턴스
 */
function initializeColorTools(cssEditorInstance) {
    if (!cssEditorInstance) {
        console.error("Color Tools Error: CSS Editor instance is required.");
        return;
    }

    // coloris 초기화 (기본 설정 사용)
    // Coloris.init(); // Coloris는 보통 자동으로 초기화됩니다.

    // 특정 옵션 설정 (예: 기본 포맷, 스와치 등)
    Coloris({
        el: '#color-picker-input', // 대상 입력 필드 ID
        theme: 'large', // 테마 설정 (default, large, polaroid)
        themeMode: 'light', // 'light' 또는 'dark' - body 클래스에 따라 자동 감지됨
        format: 'hex', // 기본 색상 포맷 (hex, rgb, hsl)
        swatches: [ // 기본 색상 견본
          '#264653',
          '#2a9d8f',
          '#e9c46a',
          '#f4a261',
          '#e76f51',
          '#d62828',
          '#023e8a',
          '#0077b6',
          '#0096c7',
          '#00b4d8',
          '#48cae4'
        ]
    });

    // 'color' 이벤트 리스너: 색상이 변경될 때마다 호출됨
    document.addEventListener('coloris:pick', event => {
        const selectedColor = event.detail.color;
        console.log('Color picked:', selectedColor);

        // 현재 활성화된 에디터가 CSS 에디터일 때만 색상 삽입
        // (script.js의 currentEditor 변수와 cssEditorInstance를 비교)
        // 주의: currentEditor는 script.js의 전역 변수이므로 직접 접근 가능해야 함
        if (typeof currentEditor !== 'undefined' && currentEditor === 'css' && cssEditorInstance) {
            // 현재 커서 위치에 선택된 색상 값 삽입
            cssEditorInstance.replaceSelection(selectedColor);
            // 삽입 후 에디터에 포커스
            cssEditorInstance.focus();
            console.log(`Inserted color ${selectedColor} into CSS editor.`);
        } else {
            console.log("CSS editor is not active. Color not inserted.");
        }
    });

    console.log("Color tools initialized.");
}

// 전역 범위에서 Coloris 초기화 (필요한 경우)
// Coloris.init();