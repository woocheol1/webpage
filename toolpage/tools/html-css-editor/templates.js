/**
 * HTML/CSS 에디터 템플릿 모음
 * 에디터에서 사용할 수 있는 기본 템플릿들을 정의합니다.
 */

// 템플릿 저장소
const templates = {
    // 빈 템플릿
    'blank': {
        html: '',
        css: '',
        js: ''
    },
    
    // 기본 HTML 템플릿
    'basic': {
        html: `<!DOCTYPE html>
<html lang="ko">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>기본 페이지</title>
</head>
<body>
    <header>
        <h1>웹페이지 제목</h1>
        <nav>
            <ul>
                <li><a href="#">홈</a></li>
                <li><a href="#">소개</a></li>
                <li><a href="#">서비스</a></li>
                <li><a href="#">문의</a></li>
            </ul>
        </nav>
    </header>
    
    <main>
        <section>
            <h2>주요 섹션</h2>
            <p>여기에 콘텐츠를 추가하세요.</p>
        </section>
        
        <section>
            <h2>추가 섹션</h2>
            <p>더 많은 내용을 추가할 수 있습니다.</p>
        </section>
    </main>
    
    <footer>
        <p>&copy; 2025 메인 페이지</p>
    </footer>
</body>
</html>`,
        css: `/* 기본 스타일 */
* {
    margin: 0;
    padding: 0;
    box-sizing: border-box;
}

body {
    font-family: Arial, sans-serif;
    line-height: 1.6;
    color: #333;
    max-width: 1200px;
    margin: 0 auto;
    padding: 0 20px;
}

header {
    background-color: #f4f4f4;
    padding: 20px;
    margin-bottom: 20px;
}

nav ul {
    display: flex;
    list-style: none;
}

nav ul li {
    margin-right: 15px;
}

nav ul li a {
    text-decoration: none;
    color: #333;
}

nav ul li a:hover {
    color: #777;
}

section {
    margin-bottom: 30px;
}

footer {
    text-align: center;
    padding: 20px;
    margin-top: 20px;
    background-color: #f4f4f4;
}`,
        js: `// 기본 자바스크립트

document.addEventListener('DOMContentLoaded', function() {
    console.log('페이지가 로드되었습니다!');
});

// 헤더 클릭 이벤트
const header = document.querySelector('header');
if (header) {
    header.addEventListener('click', function() {
        console.log('헤더가 클릭되었습니다!');
    });
}`
    }
};

/**
 * 템플릿 가져오기
 * @param {string} templateId - 템플릿 식별자
 * @returns {Object|null} 템플릿 데이터 또는 null
 */
function getTemplate(templateId) {
    // 템플릿 식별자 유효성 검사
    if (!templateId || typeof templateId !== 'string') {
        console.error('유효하지 않은 템플릿 ID:', templateId);
        return null;
    }
    
    // 휴망 경로 처리
    const id = templateId.toLowerCase().trim();
    
    // 템플릿 구성요소 가져오기
    if (templates[id]) {
        console.log(`템플릿 번루오기: ${id}`);
        return templates[id];
    }
    
    // 사용자 정의 템플릿 확인
    const userTemplates = loadUserTemplates();
    if (userTemplates && userTemplates[id]) {
        console.log(`사용자 템플릿 번루오기: ${id}`);
        return userTemplates[id];
    }
    
    // 기본값으로 blank 템플릿 반환
    console.warn(`템플릿을 찾을 수 없음: ${id}, 기본 템플릿 사용`);
    return templates['blank'];
}

/**
 * 사용자 정의 템플릿 불러오기
 * @returns {Object} 사용자 템플릿 목록
 */
function loadUserTemplates() {
    try {
        const userTemplatesStr = localStorage.getItem('htmlEditorUserTemplates');
        if (userTemplatesStr) {
            return JSON.parse(userTemplatesStr);
        }
    } catch (e) {
        console.error('사용자 템플릿 로드 오류:', e);
    }
    
    return {};
}

/**
 * 사용자 정의 템플릿 저장
 * @param {string} templateId - 템플릿 식별자
 * @param {Object} templateData - 템플릿 데이터 (html, css, js)
 * @returns {boolean} 성공 여부
 */
function saveUserTemplate(templateId, templateData) {
    if (!templateId || typeof templateId !== 'string' || !templateData) {
        console.error('유효하지 않은 템플릿 데이터:', templateId);
        return false;
    }
    
    try {
        // 기존 템플릿 불러오기
        let userTemplates = loadUserTemplates();
        
        // 새 템플릿 추가
        userTemplates[templateId.toLowerCase().trim()] = {
            html: templateData.html || '',
            css: templateData.css || '',
            js: templateData.js || '',
            created: new Date().toISOString()
        };
        
        // 저장
        localStorage.setItem('htmlEditorUserTemplates', JSON.stringify(userTemplates));
        console.log(`사용자 템플릿 저장 완료: ${templateId}`);
        return true;
    } catch (e) {
        console.error('사용자 템플릿 저장 오류:', e);
        return false;
    }
}

/**
 * 사용자 정의 템플릿 삭제
 * @param {string} templateId - 삭제할 템플릿 식별자
 * @returns {boolean} 성공 여부
 */
function deleteUserTemplate(templateId) {
    if (!templateId || typeof templateId !== 'string') {
        console.error('유효하지 않은 템플릿 ID:', templateId);
        return false;
    }
    
    try {
        // 기존 템플릿 불러오기
        let userTemplates = loadUserTemplates();
        const id = templateId.toLowerCase().trim();
        
        // 해당 템플릿이 있는지 확인
        if (!userTemplates[id]) {
            console.warn(`삭제할 템플릿을 찾을 수 없음: ${id}`);
            return false;
        }
        
        // 템플릿 삭제
        delete userTemplates[id];
        
        // 저장
        localStorage.setItem('htmlEditorUserTemplates', JSON.stringify(userTemplates));
        console.log(`사용자 템플릿 삭제 완료: ${id}`);
        return true;
    } catch (e) {
        console.error('사용자 템플릿 삭제 오류:', e);
        return false;
    }
}

/**
 * 사용가능한 모든 템플릿 목록 가져오기 (기본 + 사용자 정의)
 * @returns {Object} 템플릿 ID와 설명을 다으결리로 하는 객체
 */
function getAllTemplates() {
    const result = {};
    
    // 기본 템플릿
    Object.keys(templates).forEach(id => {
        result[id] = {
            id: id,
            name: getTemplateName(id),
            system: true
        };
    });
    
    // 사용자 템플릿
    const userTemplates = loadUserTemplates();
    Object.keys(userTemplates).forEach(id => {
        result[id] = {
            id: id,
            name: id.charAt(0).toUpperCase() + id.slice(1),
            system: false,
            created: userTemplates[id].created
        };
    });
    
    return result;
}

/**
 * 템플릿 ID에 대한 표시 이름 반환
 * @param {string} templateId - 템플릿 식별자
 * @returns {string} 표시 이름
 */
function getTemplateName(templateId) {
    const templateNames = {
        'blank': '빈 템플릿',
        'basic': '기본 HTML 페이지',
        'bootstrap': 'Bootstrap 템플릿',
        'tailwind': 'Tailwind CSS 템플릿',
        'landing': '랜딩 페이지 템플릿'
    };
    
    return templateNames[templateId] || templateId;
}