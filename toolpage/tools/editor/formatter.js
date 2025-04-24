/**
 * formatter.js - CodeMirror 에디터용 코드 포맷팅 기능 (Prettier 사용)
 */

/**
 * 코드 포맷팅 기능을 초기화하고 버튼에 이벤트 리스너를 연결합니다.
 * @param {function} getActiveEditorFunc - 현재 활성 CodeMirror 인스턴스를 반환하는 함수
 */
function initializeFormatter(getActiveEditorFunc) {
    const formatButton = document.getElementById('btn-format-code');

    if (!formatButton) {
        console.warn("Format button (#btn-format-code) not found.");
        return;
    }

    // Prettier 플러그인 로드 확인 (브라우저 환경에서는 전역으로 로드됨)
    if (typeof prettier === 'undefined' || typeof prettierPlugins === 'undefined') {
        console.error("Prettier or its plugins are not loaded correctly. Make sure the scripts are included in HTML.");
        // 버튼 비활성화 또는 숨김 처리
        formatButton.disabled = true;
        formatButton.title = "Formatter not available";
        return;
    }

    formatButton.addEventListener('click', async () => {
        const editor = getActiveEditorFunc(); // 활성 에디터 가져오기
        if (!editor) {
            console.warn("No active editor found for formatting.");
            return;
        }

        const code = editor.getValue(); // 현재 코드 가져오기
        const editorMode = editor.getOption("mode"); // 에디터 모드 확인 (예: 'htmlmixed', 'css', 'javascript')
        let parser;
        let plugins;

        // 에디터 모드에 따라 Prettier 파서 및 플러그인 설정
        switch (editorMode) {
            case 'htmlmixed':
            case 'xml': // XML 모드도 html 파서 사용 가능
                parser = "html";
                plugins = [prettierPlugins.html];
                break;
            case 'css':
                parser = "css";
                plugins = [prettierPlugins.postcss];
                break;
            case 'javascript':
                parser = "babel"; // 또는 "espree" 등 선호하는 JS 파서
                plugins = [prettierPlugins.babel];
                break;
            default:
                console.warn(`Formatting not supported for mode: ${editorMode}`);
                alert(`Code formatting is not supported for the current language (${editorMode}).`);
                return;
        }

        console.log(`Formatting code with parser: ${parser}`);

        try {
            // Prettier 포맷팅 실행
            const formattedCode = await prettier.format(code, {
                parser: parser,
                plugins: plugins,
                // 추가 Prettier 옵션 (선택 사항)
                // useTabs: false, // 탭 대신 스페이스 사용
                // tabWidth: 4, // 탭 너비
                // singleQuote: true, // JS에서 작은따옴표 사용
                // semi: true, // 세미콜론 항상 사용
                // printWidth: 80, // 줄 바꿈 너비
            });

            // 포맷팅된 코드로 에디터 내용 교체
            if (formattedCode !== code) { // 변경된 경우에만 업데이트
                const cursor = editor.getCursor(); // 현재 커서 위치 저장
                editor.setValue(formattedCode);
                editor.setCursor(cursor); // 커서 위치 복원 시도 (완벽하지 않을 수 있음)
                console.log("Code formatted successfully.");
                // 사용자에게 성공 알림 (선택 사항)
                // showNotification("Code formatted!", "success", 1500);
            } else {
                console.log("Code is already formatted.");
                 // showNotification("Code is already formatted.", "info", 1500);
            }

        } catch (error) {
            // 포맷팅 오류 처리 (주로 구문 오류)
            console.error("Error during formatting:", error);
            alert(`Failed to format code. Please check for syntax errors.\n\nError: ${error.message}`);
        }
    });

    console.log("Formatter initialized.");
}/**
 * formatter.js - CodeMirror 에디터용 코드 포맷팅 기능 (Prettier 사용)
 */

/**
 * 코드 포맷팅 기능을 초기화하고 버튼에 이벤트 리스너를 연결합니다.
 * @param {function} getActiveEditorFunc - 현재 활성 CodeMirror 인스턴스를 반환하는 함수
 */
function initializeFormatter(getActiveEditorFunc) {
    const formatButton = document.getElementById('btn-format-code');

    if (!formatButton) {
        console.warn("Format button (#btn-format-code) not found.");
        return;
    }

    // Prettier 플러그인 로드 확인 (브라우저 환경에서는 전역으로 로드됨)
    if (typeof prettier === 'undefined' || typeof prettierPlugins === 'undefined') {
        console.error("Prettier or its plugins are not loaded correctly. Make sure the scripts are included in HTML.");
        // 버튼 비활성화 또는 숨김 처리
        formatButton.disabled = true;
        formatButton.title = "Formatter not available";
        return;
    }

    formatButton.addEventListener('click', async () => {
        const editor = getActiveEditorFunc(); // 활성 에디터 가져오기
        if (!editor) {
            console.warn("No active editor found for formatting.");
            return;
        }

        const code = editor.getValue(); // 현재 코드 가져오기
        const editorMode = editor.getOption("mode"); // 에디터 모드 확인 (예: 'htmlmixed', 'css', 'javascript')
        let parser;
        let plugins;

        // 에디터 모드에 따라 Prettier 파서 및 플러그인 설정
        switch (editorMode) {
            case 'htmlmixed':
            case 'xml': // XML 모드도 html 파서 사용 가능
                parser = "html";
                plugins = [prettierPlugins.html];
                break;
            case 'css':
                parser = "css";
                plugins = [prettierPlugins.postcss];
                break;
            case 'javascript':
                parser = "babel"; // 또는 "espree" 등 선호하는 JS 파서
                plugins = [prettierPlugins.babel];
                break;
            default:
                console.warn(`Formatting not supported for mode: ${editorMode}`);
                alert(`Code formatting is not supported for the current language (${editorMode}).`);
                return;
        }

        console.log(`Formatting code with parser: ${parser}`);

        try {
            // Prettier 포맷팅 실행
            const formattedCode = await prettier.format(code, {
                parser: parser,
                plugins: plugins,
                // 추가 Prettier 옵션 (선택 사항)
                // useTabs: false, // 탭 대신 스페이스 사용
                // tabWidth: 4, // 탭 너비
                // singleQuote: true, // JS에서 작은따옴표 사용
                // semi: true, // 세미콜론 항상 사용
                // printWidth: 80, // 줄 바꿈 너비
            });

            // 포맷팅된 코드로 에디터 내용 교체
            if (formattedCode !== code) { // 변경된 경우에만 업데이트
                const cursor = editor.getCursor(); // 현재 커서 위치 저장
                editor.setValue(formattedCode);
                editor.setCursor(cursor); // 커서 위치 복원 시도 (완벽하지 않을 수 있음)
                console.log("Code formatted successfully.");
                // 사용자에게 성공 알림 (선택 사항)
                // showNotification("Code formatted!", "success", 1500);
            } else {
                console.log("Code is already formatted.");
                 // showNotification("Code is already formatted.", "info", 1500);
            }

        } catch (error) {
            // 포맷팅 오류 처리 (주로 구문 오류)
            console.error("Error during formatting:", error);
            alert(`Failed to format code. Please check for syntax errors.\n\nError: ${error.message}`);
        }
    });

    console.log("Formatter initialized.");
}