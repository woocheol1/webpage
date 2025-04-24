/**
 * folding.js - CodeMirror 에디터 코드 폴딩 기능 설정
 */

/**
 * CodeMirror 인스턴스에 코드 폴딩 기능을 활성화합니다.
 * @param {CodeMirror.Editor} editor - CodeMirror 에디터 인스턴스
 * @param {string} mode - 에디터 모드 ('htmlmixed', 'css', 'javascript')
 */
function initializeFolding(editor, mode) {
    if (!editor) {
        console.error("Folding Error: Editor instance is required.");
        return;
    }

    // 폴딩 거터와 라인 넘버 거터를 함께 사용
    const currentGutters = editor.getOption("gutters") || ["CodeMirror-linenumbers"];
    if (!currentGutters.includes("CodeMirror-foldgutter")) {
        editor.setOption("gutters", [...currentGutters, "CodeMirror-foldgutter"]);
    }

    // 폴딩 옵션 활성화
    editor.setOption("foldGutter", true);

    // 언어별 폴딩 로직 지정
    // CodeMirror.registerHelper를 사용하여 각 모드에 맞는 rangeFinder를 등록합니다.
    // brace-fold는 {}, xml-fold는 태그, comment-fold는 주석을 기준으로 합니다.
    let rangeFinder;
    if (mode === 'htmlmixed' || mode === 'xml') {
        rangeFinder = CodeMirror.fold.xml;
    } else if (mode === 'css' || mode === 'javascript') {
        rangeFinder = CodeMirror.fold.brace;
    }
    // 주석 폴딩도 추가할 수 있습니다.
    // rangeFinder = CodeMirror.fold.comment; 혹은 여러 개를 조합

    if (rangeFinder) {
         editor.setOption("foldOptions", {
             rangeFinder: rangeFinder,
             // widget: "...", // 필요시 커스텀 폴딩 위젯 지정
             // scanUp: true, // 위쪽으로 스캔하여 폴딩 범위 찾기 (선택 사항)
             // minFoldSize: 2 // 최소 폴딩 라인 수 (선택 사항)
         });
    }


    // (선택 사항) 폴딩/펼치기 단축키 설정
    // 예: Ctrl-Q (Windows/Linux) 또는 Cmd-Q (Mac)
    // 기본 단축키가 이미 있을 수 있으므로 필요시 재정의
    /*
    const mac = CodeMirror.keyMap.default == CodeMirror.keyMap.macDefault;
    const foldKey = mac ? "Cmd-Alt-[" : "Ctrl-Q";
    const unfoldKey = mac ? "Cmd-Alt-]" : "Ctrl-J"; // 예시 단축키

    let extraKeys = editor.getOption("extraKeys") || {};
    extraKeys[foldKey] = function(cm) { cm.foldCode(cm.getCursor()); };
    extraKeys[unfoldKey] = function(cm) { // 가장 가까운 폴딩 펼치기 (간단 예시)
        let marks = cm.findMarksAt(cm.getCursor());
        for (let mark of marks) {
            if (mark.__isFold) {
                mark.clear();
                break;
            }
        }
    };
    // 모든 코드 접기/펼치기 단축키 (예: Ctrl-Shift-[ / ])
    // extraKeys["Ctrl-Shift-["] = function(cm){ cm.execCommand("foldAll"); };
    // extraKeys["Ctrl-Shift-]"] = function(cm){ cm.execCommand("unfoldAll"); };

    editor.setOption("extraKeys", extraKeys);
    */

    console.log(`Code folding initialized for ${mode} editor.`);
}