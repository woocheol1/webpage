/**
 * HTML/CSS 에디터 코어 기능
 * 에디터 초기화, 탭 전환, 기본 이벤트 처리 등을 담당합니다.
 */

// 에디터 관련 전역 변수
let currentTemplate = "blank";
let lastSavedContent = {
  html: "",
  css: "",
  js: ""
};
let hasUnsavedChanges = false;

// DOM이 로드되면 실행
document.addEventListener('DOMContentLoaded', function() {
  console.log('HTML/CSS 에디터 초기화 중...');

  // 에디터 요소 참조
  const htmlEditor = document.getElementById('html-editor');
  const cssEditor = document.getElementById('css-editor');
  const jsEditor = document.getElementById('js-editor');

  // 하이라이팅 디스플레이 요소 생성
  createHighlightedDisplays();

  // 탭 전환 이벤트 설정
  const editorTabs = document.querySelectorAll('.editor-tab');
  const editorAreas = document.querySelectorAll('.editor-area');

  editorTabs.forEach(tab => {
    tab.addEventListener('click', function() {
      // 활성 탭 변경
      editorTabs.forEach(t => t.classList.remove('active'));
      this.classList.add('active');

      // 탭에 해당하는 에디터 영역 표시
      const targetId = this.getAttribute('data-target');
      editorAreas.forEach(area => {
        area.classList.remove('active');
        if (area.id === targetId) {
          area.classList.add('active');
        }
      });

      console.log(`에디터 탭 변경: ${targetId}`);
      logAction('에디터 탭 변경', { tab: targetId });
    });
  });

  // 기본 템플릿 적용
  applyTemplate("blank");

  // 에디터 내용 변경 시 이벤트 설정
  htmlEditor.addEventListener('input', function() {
    updatePreview();
    setUnsavedChanges(true);
  });

  cssEditor.addEventListener('input', function() {
    updatePreview();
    setUnsavedChanges(true);
  });

  jsEditor.addEventListener('input', function() {
    updatePreview();
    setUnsavedChanges(true);
  });

  // 반응형 디자인 버튼 이벤트
  const deviceButtons = document.querySelectorAll('.device-btn');
  deviceButtons.forEach(button => {
    button.addEventListener('click', function() {
      deviceButtons.forEach(btn => btn.classList.remove('active'));
      this.classList.add('active');

      const width = this.getAttribute('data-width');
      const previewPanel = document.querySelector('.preview-panel');

      if (width === "100%") {
        previewPanel.style.width = "50%";
      } else {
        previewPanel.style.width = width;
      }

      console.log(`미리보기 크기 변경: ${width}`);
      logAction('미리보기 크기 변경', { width });
    });
  });

  // 템플릿 선택 이벤트
  const templateSelect = document.getElementById('templateSelect');
  templateSelect.addEventListener('change', function() {
    const templateId = this.value;
    if (templateId) {
      if (hasUnsavedChanges) {
        if (confirm('저장되지 않은 변경사항이 있습니다. 새 템플릿을 적용하시겠습니까?')) {
          applyTemplate(templateId);
        } else {
          // 선택 취소 시 드롭다운 값 원상복구
          templateSelect.value = currentTemplate;
        }
      } else {
        applyTemplate(templateId);
      }
    }
  });

  // 버튼 이벤트 연결
  document.getElementById('newBtn').addEventListener('click', newProject);
  document.getElementById('loadBtn').addEventListener('click', loadProject);
  document.getElementById('saveBtn').addEventListener('click', saveProject);
  document.getElementById('downloadBtn').addEventListener('click', downloadProject);
  document.getElementById('shareBtn').addEventListener('click', shareProject);

  // 로컬 스토리지에서 마지막 작업 불러오기 시도
  tryLoadLastSession();

  // 페이지 언로드 전 저장 확인
  window.addEventListener('beforeunload', function(e) {
    if (hasUnsavedChanges) {
      const confirmMessage = '저장되지 않은 변경사항이 있습니다. 정말로 나가시겠습니까?';
      e.returnValue = confirmMessage;
      return confirmMessage;
    }
  });

  console.log('HTML/CSS 에디터 초기화 완료');
});

/**
 * 저장되지 않은 변경사항 상태 설정
 * @param {boolean} unsaved - 저장되지 않은 변경사항 존재 여부
 */
function setUnsavedChanges(unsaved) {
  hasUnsavedChanges = unsaved;

  // 상태 메시지 업데이트
  const statusMessage = document.getElementById('status-message');
  if (unsaved) {
    statusMessage.textContent = '저장되지 않은 변경사항이 있습니다';
    statusMessage.style.color = '#e74c3c';
  } else {
    statusMessage.textContent = '모든 변경사항이 저장되었습니다';
    statusMessage.style.color = '#2ecc71';
  }
}

/**
 * 새 프로젝트 시작
 */
function newProject() {
  console.log('새 프로젝트 시작 요청');

  if (hasUnsavedChanges) {
    if (!confirm('저장되지 않은 변경사항이 있습니다. 새 프로젝트를 시작하시겠습니까?')) {
      console.log('새 프로젝트 시작 취소');
      return;
    }
  }

  // 템플릿 선택 대화상자 표시
  const templateId = prompt('사용할 템플릿을 선택하세요 (blank, basic, bootstrap, tailwind, landing):', 'blank');
  if (templateId) {
    applyTemplate(templateId);
    console.log(`새 프로젝트 시작: ${templateId} 템플릿 사용`);
    logAction('새 프로젝트 시작', { template: templateId });
  }
}

/**
 * 템플릿 적용
 * @param {string} templateId - 템플릿 식별자
 */
function applyTemplate(templateId) {
  // 템플릿 내용 가져오기 (templates.js에서 구현)
  const template = getTemplate(templateId);

  if (template) {
    const htmlEditor = document.getElementById('html-editor');
    const cssEditor = document.getElementById('css-editor');
    const jsEditor = document.getElementById('js-editor');

    htmlEditor.value = template.html || '';
    cssEditor.value = template.css || '';
    jsEditor.value = template.js || '';

    // 템플릿 선택 드롭다운 업데이트
    document.getElementById('templateSelect').value = templateId;

    // 현재 템플릿 업데이트
    currentTemplate = templateId;

    // 저장 상태 초기화
    lastSavedContent = {
      html: htmlEditor.value,
      css: cssEditor.value,
      js: jsEditor.value
    };
    setUnsavedChanges(false);

    // 미리보기 업데이트
    updatePreview();

    console.log(`템플릿 적용: ${templateId}`);
    logAction('템플릿 적용', { template: templateId });
  } else {
    console.error(`템플릿을 찾을 수 없음: ${templateId}`);
    showNotification(`템플릿을 찾을 수 없습니다: ${templateId}`, 'error');
  }
}

/**
 * 현재 내용으로 미리보기 업데이트
 */
function updatePreview() {
  // preview.js에서 구현
  if (typeof updatePreviewFrame === 'function') {
    updatePreviewFrame();
  }
}

/**
 * 프로젝트 로드 대화상자 표시
 */
function loadProject() {
  console.log('프로젝트 로드 대화상자 표시');

  if (hasUnsavedChanges) {
    if (!confirm('저장되지 않은 변경사항이 있습니다. 다른 프로젝트를 불러오시겠습니까?')) {
      console.log('프로젝트 로드 취소');
      return;
    }
  }

  // 저장된 프로젝트 목록 표시 및 선택 (storage.js에서 구현)
  if (typeof showLoadProjectDialog === 'function') {
    showLoadProjectDialog();
  } else {
    console.error('storage.js가 로드되지 않았거나 showLoadProjectDialog 함수를 찾을 수 없습니다');
    showNotification('프로젝트 로드 기능을 사용할 수 없습니다', 'error');
  }
}

/**
 * 현재 프로젝트 저장
 */
function saveProject() {
  console.log('프로젝트 저장 요청');

  // 저장 대화상자 표시 (storage.js에서 구현)
  if (typeof showSaveProjectDialog === 'function') {
    showSaveProjectDialog();
  } else {
    console.error('storage.js가 로드되지 않았거나 showSaveProjectDialog 함수를 찾을 수 없습니다');
    showNotification('프로젝트 저장 기능을 사용할 수 없습니다', 'error');
  }
}

/**
 * 현재 프로젝트를 HTML 파일로 다운로드
 */
function downloadProject() {
  console.log('프로젝트 다운로드 요청');

  const htmlEditor = document.getElementById('html-editor');
  const cssEditor = document.getElementById('css-editor');
  const jsEditor = document.getElementById('js-editor');

  const html = htmlEditor.value;
  const css = cssEditor.value;
  const js = jsEditor.value;

  // HTML 문서 구성
  let fullHtml = html;

  // HTML에 CSS 추가 (만약 HTML에 이미 <style> 태그가 없다면)
  if (css && !html.includes('<style>')) {
    // </head> 태그 찾기
    const headIndex = html.indexOf('</head>');
    if (headIndex !== -1) {
      // </head> 앞에 스타일 태그 삽입
      fullHtml = html.slice(0, headIndex) + `\n<style>\n${css}\n</style>\n` + html.slice(headIndex);
    } else {
      // <head> 태그가 없는 경우
      const htmlIndex = html.indexOf('<html');
      if (htmlIndex !== -1) {
        const bodyIndex = html.indexOf('<body');
        if (bodyIndex !== -1) {
          fullHtml = html.slice(0, bodyIndex) + `\n<style>\n${css}\n</style>\n` + html.slice(bodyIndex);
        } else {
          // <body> 태그도 없는 경우
          fullHtml = `${html}\n<style>\n${css}\n</style>`;
        }
      } else {
        // 기본 HTML 구조가 없는 경우
        fullHtml = `<html>\n<head>\n<style>\n${css}\n</style>\n</head>\n<body>\n${html}\n</body>\n</html>`;
      }
    }
  }

  // HTML에 JavaScript 추가 (만약 HTML에 이미 <script> 태그가 없다면)
  if (js && !fullHtml.includes('<script>')) {
    // </body> 태그 찾기
    const bodyEndIndex = fullHtml.indexOf('</body>');
    if (bodyEndIndex !== -1) {
      // </body> 앞에 스크립트 태그 삽입
      fullHtml = fullHtml.slice(0, bodyEndIndex) + `\n<script>\n${js}\n</script>\n` + fullHtml.slice(bodyEndIndex);
    } else {
      // HTML 끝에 스크립트 태그 추가
      fullHtml = `${fullHtml}\n<script>\n${js}\n</script>`;
    }
  }

  // 다운로드를 위한 링크 생성
  const blob = new Blob([fullHtml], { type: 'text/html' });
  const url = URL.createObjectURL(blob);

  // 프로젝트 이름 물어보기
  const projectName = prompt('프로젝트 파일명을 입력해주세요:', 'my-html-project') || 'my-html-project';

  // 다운로드 링크 생성 및 클릭
  const a = document.createElement('a');
  a.href = url;
  a.download = `${projectName}.html`;
  document.body.appendChild(a);
  a.click();

  // 자원 정리
  setTimeout(() => {
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }, 0);

  console.log(`프로젝트 다운로드: ${projectName}.html`);
  logAction('프로젝트 다운로드', { projectName });
  showNotification(`프로젝트가 ${projectName}.html로 다운로드 되었습니다.`, 'success');
}

/**
 * 현재 프로젝트 코드 공유
 */
function shareProject() {
  console.log('프로젝트 공유 요청');

  try {
    const htmlEditor = document.getElementById('html-editor');
    const cssEditor = document.getElementById('css-editor');
    const jsEditor = document.getElementById('js-editor');

    // 현재 코드 가져오기
    const content = {
      html: htmlEditor.value,
      css: cssEditor.value,
      js: jsEditor.value,
      template: currentTemplate
    };

    // 코드를 base64로 인코딩
    const codeStr = JSON.stringify(content);
    const encodedCode = btoa(encodeURIComponent(codeStr));

    // URL 매개변수로 코드 추가
    const shareUrl = `${window.location.origin}${window.location.pathname}?code=${encodedCode}`;

    // 클립보드에 URL 복사
    copyToClipboard(shareUrl);

    console.log('공유 URL 생성 및 복사 완료');
    showNotification('공유 URL이 클립보드에 복사되었습니다.', 'success');
    logAction('프로젝트 공유', { urlLength: shareUrl.length });
  } catch (error) {
    console.error('프로젝트 공유 오류:', error);
    showNotification('코드 공유 중 오류가 발생했습니다.', 'error');
  }
}

/**
 * 로컬 스토리지에서 마지막 세션 불러오기 시도
 */
function tryLoadLastSession() {
  try {
    // storage.js에서 구현
    if (typeof loadLastSession === 'function') {
      loadLastSession();
    }
  } catch (error) {
    console.error('세션 로드 오류:', error);
  }
}

/**
 * URL 매개변수에서 공유된 코드 받기
 */
function getSharedCodeFromUrl() {
  try {
    const urlParams = new URLSearchParams(window.location.search);
    const code = urlParams.get('code');

    if (code) {
      // base64 디코딩
      const decodedStr = decodeURIComponent(atob(code));
      const content = JSON.parse(decodedStr);

      // 코드 에디터에 적용
      if (content.html !== undefined) {
        document.getElementById('html-editor').value = content.html;
      }

      if (content.css !== undefined) {
        document.getElementById('css-editor').value = content.css;
      }

      if (content.js !== undefined) {
        document.getElementById('js-editor').value = content.js;
      }

      // 미리보기 업데이트
      updatePreview();

      // 템플릿 선택 박스 업데이트
      if (content.template) {
        currentTemplate = content.template;
        document.getElementById('templateSelect').value = content.template;
      }

      console.log('공유된 코드 적용 완료');
      showNotification('공유된 코드를 성공적으로 불러왔습니다!', 'success');
      return true;
    }

    return false;
  } catch (error) {
    console.error('공유 코드 가져오기 오류:', error);
    showNotification('공유된 코드를 불러오는 중 오류가 발생했습니다.', 'error');
    return false;
  }
}