/**
 * HTML/CSS 에디터 저장 관련 기능 - 부분 1
 * 로컬 스토리지를 활용한 저장 및 불러오기 기능을 담당합니다.
 */

// 저장소 키 상수
const STORAGE_KEYS = {
    RECENT_PROJECTS: 'htmlEditorRecentProjects',
    LAST_SESSION: 'htmlEditorLastSession',
    AUTO_SAVE: 'htmlEditorAutoSave'
};

// 최대 최근 프로젝트 수
const MAX_RECENT_PROJECTS = 10;

// 자동 저장 상태
let autoSaveEnabled = false;
let autoSaveInterval = null;
const AUTO_SAVE_DELAY = 30000; // 30초

// DOM 로드 시 실행
document.addEventListener('DOMContentLoaded', function() {
    console.log('저장 모듈 초기화 중...');
    
    // 자동 저장 상태 불러오기
    loadAutoSaveSettings();
    
    console.log('저장 모듈 초기화 완료');
});
/**
 * HTML/CSS 에디터 저장 관련 기능 - 부분 2
 * 저장 대화상자 관련 기능
 */

/**
 * 현재 프로젝트 저장 대화상자 표시
 */
function showSaveProjectDialog() {
    console.log('저장 대화상자 표시');
    
    // 기존 대화상자 삭제
    removeDialogs();
    
    // 대화상자 생성
    const dialogHTML = `
    <div class="dialog-overlay" id="save-dialog-overlay">
        <div class="dialog">
            <div class="dialog-header">
                <h3 class="dialog-title">프로젝트 저장</h3>
                <button class="dialog-close">&times;</button>
            </div>
            <div class="dialog-content">
                <div class="form-group">
                    <label for="project-name">프로젝트 이름:</label>
                    <input type="text" id="project-name" class="form-control" placeholder="내 프로젝트" required>
                </div>
                <div class="form-group">
                    <label for="project-description">설명 (선택사항):</label>
                    <textarea id="project-description" class="form-control" rows="2" placeholder="프로젝트 설명을 입력하세요"></textarea>
                </div>
                <div class="form-group">
                    <label>
                        <input type="checkbox" id="save-as-template"> 템플릿으로도 저장
                    </label>
                </div>
            </div>
            <div class="dialog-footer">
                <button class="btn btn-secondary" id="save-cancel-btn">취소</button>
                <button class="btn" id="save-project-btn">저장</button>
            </div>
        </div>
    </div>
    `;
    
    // DOM에 대화상자 추가
    document.body.insertAdjacentHTML('beforeend', dialogHTML);
    
    // 대화상자 이벤트 설정
    const overlay = document.getElementById('save-dialog-overlay');
    const closeBtn = overlay.querySelector('.dialog-close');
    const cancelBtn = document.getElementById('save-cancel-btn');
    const saveBtn = document.getElementById('save-project-btn');
    const projectNameInput = document.getElementById('project-name');
    
    // 초기 프로젝트 이름 생성 (일시적)
    projectNameInput.value = '프로젝트-' + new Date().toISOString().slice(0, 10).replace(/-/g, '');
    
    // 닫기 버튼 이벤트
    closeBtn.addEventListener('click', function() {
        removeDialogs();
    });
    
    // 취소 버튼 이벤트
    cancelBtn.addEventListener('click', function() {
        removeDialogs();
    });
    
    // 저장 버튼 이벤트
    saveBtn.addEventListener('click', function() {
        const projectName = projectNameInput.value.trim();
        if (!projectName) {
            alert('프로젝트 이름을 입력해주세요.');
            projectNameInput.focus();
            return;
        }
        
        const projectDescription = document.getElementById('project-description').value;
        const saveAsTemplate = document.getElementById('save-as-template').checked;
        
        // 현재 에디터 내용 가져오기
        const htmlEditor = document.getElementById('html-editor');
        const cssEditor = document.getElementById('css-editor');
        const jsEditor = document.getElementById('js-editor');
        
        // 프로젝트 데이터 작성
        const projectData = {
            name: projectName,
            description: projectDescription,
            html: htmlEditor ? htmlEditor.value : '',
            css: cssEditor ? cssEditor.value : '',
            js: jsEditor ? jsEditor.value : '',
            created: new Date().toISOString(),
            lastEdited: new Date().toISOString()
        };
        
        // 프로젝트 저장
        saveProject(projectData);
        
        // 템플릿으로도 저장
        if (saveAsTemplate && typeof saveUserTemplate === 'function') {
            const templateId = projectName.toLowerCase().replace(/[^a-z0-9]+/g, '-');
            const templateData = {
                html: projectData.html,
                css: projectData.css,
                js: projectData.js
            };
            saveUserTemplate(templateId, templateData);
        }
        
        // 대화상자 닫기
        removeDialogs();
        
        // 저장 완료 메시지
        showNotification(`프로젝트 "${projectName}"가 저장되었습니다.`, 'success');
        logAction('프로젝트 저장', { name: projectName });
        
        // 저장 상태 업데이트
        if (typeof setUnsavedChanges === 'function') {
            setUnsavedChanges(false);
        }
    });
    
    // 이클립스 목록에 포커스
    projectNameInput.focus();
}

/**
 * 모든 대화상자 제거
 */
function removeDialogs() {
    const dialogs = document.querySelectorAll('.dialog-overlay');
    dialogs.forEach(dialog => {
        dialog.remove();
    });
}
/**
 * HTML/CSS 에디터 저장 관련 기능 - 부분 3
 * 불러오기 대화상자 관련 기능
 */

/**
 * 프로젝트 불러오기 대화상자 표시
 */
function showLoadProjectDialog() {
    console.log('불러오기 대화상자 표시');
    
    // 기존 대화상자 삭제
    removeDialogs();
    
    // 최근 프로젝트 불러오기
    const recentProjects = getRecentProjects();
    
    // 프로젝트 목록 HTML 생성
    let projectsListHTML = '';
    
    if (recentProjects.length > 0) {
        recentProjects.forEach(project => {
            const date = new Date(project.lastEdited || project.created);
            const formattedDate = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
            
            projectsListHTML += `
            <div class="project-item" data-id="${project.id}">
                <div class="project-info">
                    <h4 class="project-name">${project.name}</h4>
                    <p class="project-date">수정일: ${formattedDate}</p>
                    <p class="project-description">${project.description || ''}</p>
                </div>
                <div class="project-actions">
                    <button class="btn btn-sm load-project-btn" data-id="${project.id}">불러오기</button>
                    <button class="btn btn-sm btn-secondary delete-project-btn" data-id="${project.id}">삭제</button>
                </div>
            </div>
            `;
        });
    } else {
        projectsListHTML = '<p class="no-projects">저장된 프로젝트가 없습니다.</p>';
    }
    
    // 대화상자 HTML 생성
    const dialogHTML = `
    <div class="dialog-overlay" id="load-dialog-overlay">
        <div class="dialog" style="width: 600px; max-width: 90%;">
            <div class="dialog-header">
                <h3 class="dialog-title">프로젝트 불러오기</h3>
                <button class="dialog-close">&times;</button>
            </div>
            <div class="dialog-content">
                <h4>최근 프로젝트</h4>
                <div class="projects-list">
                    ${projectsListHTML}
                </div>
            </div>
            <div class="dialog-footer">
                <button class="btn btn-secondary" id="load-cancel-btn">취소</button>
            </div>
        </div>
    </div>
    `;
    
    // DOM에 대화상자 추가
    document.body.insertAdjacentHTML('beforeend', dialogHTML);
    
    // 대화상자 이벤트 설정
    const overlay = document.getElementById('load-dialog-overlay');
    const closeBtn = overlay.querySelector('.dialog-close');
    const cancelBtn = document.getElementById('load-cancel-btn');
    
    // 닫기 버튼 이벤트
    closeBtn.addEventListener('click', function() {
        removeDialogs();
    });
    
    // 취소 버튼 이벤트
    cancelBtn.addEventListener('click', function() {
        removeDialogs();
    });
    
    // 불러오기 버튼 이벤트
    const loadBtns = overlay.querySelectorAll('.load-project-btn');
    loadBtns.forEach(btn => {
        btn.addEventListener('click', function() {
            const projectId = this.getAttribute('data-id');
            loadProject(projectId);
            removeDialogs();
        });
    });
    
    // 삭제 버튼 이벤트
    const deleteBtns = overlay.querySelectorAll('.delete-project-btn');
    deleteBtns.forEach(btn => {
        btn.addEventListener('click', function() {
            const projectId = this.getAttribute('data-id');
            if (confirm('정말 이 프로젝트를 삭제하시겠습니까?')) {
                deleteProject(projectId);
                
                // 해당 프로젝트 항목 삭제
                const projectItem = this.closest('.project-item');
                if (projectItem) {
                    projectItem.remove();
                }
                
                // 모든 프로젝트가 삭제된 경우 메시지 표시
                const projectsList = overlay.querySelector('.projects-list');
                if (projectsList.children.length === 0) {
                    projectsList.innerHTML = '<p class="no-projects">저장된 프로젝트가 없습니다.</p>';
                }
            }
        });
    });
}
/**
 * HTML/CSS 에디터 저장 관련 기능 - 부분 4
 * 프로젝트 저장 및 로드 관련 코어 기능
 */

/**
 * 프로젝트 저장 실행
 * @param {Object} projectData - 저장할 프로젝트 데이터
 * @returns {string} 저장된 프로젝트 ID
 */
function saveProject(projectData) {
    try {
        if (!projectData || !projectData.name) {
            console.error('유효하지 않은 프로젝트 데이터');
            return null;
        }
        
        // 시간에 따른 고유 ID 생성
        const projectId = projectData.id || `project-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
        projectData.id = projectId;
        
        // 프로젝트 저장
        localStorage.setItem(`htmlEditor-${projectId}`, JSON.stringify(projectData));
        
        // 최근 프로젝트에 추가
        addToRecentProjects(projectData);
        
        console.log(`프로젝트 저장 성공: ${projectData.name} (${projectId})`);
        return projectId;
    } catch (error) {
        console.error('프로젝트 저장 오류:', error);
        return null;
    }
}

/**
 * 프로젝트 로드
 * @param {string} projectId - 로드할 프로젝트 ID
 * @returns {boolean} 성공 여부
 */
function loadProject(projectId) {
    try {
        if (!projectId) {
            console.error('유효하지 않은 프로젝트 ID');
            return false;
        }
        
        // 프로젝트 데이터 가져오기
        const projectDataStr = localStorage.getItem(`htmlEditor-${projectId}`);
        if (!projectDataStr) {
            console.error(`프로젝트를 찾을 수 없음: ${projectId}`);
            return false;
        }
        
        const projectData = JSON.parse(projectDataStr);
        
        // 에디터에 내용 설정
        const htmlEditor = document.getElementById('html-editor');
        const cssEditor = document.getElementById('css-editor');
        const jsEditor = document.getElementById('js-editor');
        
        if (htmlEditor) htmlEditor.value = projectData.html || '';
        if (cssEditor) cssEditor.value = projectData.css || '';
        if (jsEditor) jsEditor.value = projectData.js || '';
        
        // 미리보기 업데이트
        if (typeof updatePreviewFrame === 'function') {
            updatePreviewFrame();
        }
        
        // 마지막 수정 시간 업데이트
        projectData.lastEdited = new Date().toISOString();
        localStorage.setItem(`htmlEditor-${projectId}`, JSON.stringify(projectData));
        
        // 최근 프로젝트 목록 업데이트
        addToRecentProjects(projectData);
        
        // 저장 상태 초기화
        if (typeof setUnsavedChanges === 'function') {
            setUnsavedChanges(false);
        }
        
        console.log(`프로젝트 로드 성공: ${projectData.name} (${projectId})`);
        showNotification(`프로젝트 "${projectData.name}"이(가) 로드되었습니다.`, 'success');
        logAction('프로젝트 로드', { name: projectData.name, id: projectId });
        
        return true;
    } catch (error) {
        console.error('프로젝트 로드 오류:', error);
        return false;
    }
}

/**
 * 프로젝트 삭제
 * @param {string} projectId - 삭제할 프로젝트 ID
 * @returns {boolean} 성공 여부
 */
function deleteProject(projectId) {
    try {
        if (!projectId) {
            console.error('유효하지 않은 프로젝트 ID');
            return false;
        }
        
        // 프로젝트 정보 가져오기
        const projectDataStr = localStorage.getItem(`htmlEditor-${projectId}`);
        let projectName = projectId;
        if (projectDataStr) {
            const projectData = JSON.parse(projectDataStr);
            projectName = projectData.name;
        }
        
        // 로컬 스토리지에서 프로젝트 삭제
        localStorage.removeItem(`htmlEditor-${projectId}`);
        
        // 최근 프로젝트 목록에서 삭제
        removeFromRecentProjects(projectId);
        
        console.log(`프로젝트 삭제 성공: ${projectName} (${projectId})`);
        showNotification(`프로젝트 "${projectName}"이(가) 삭제되었습니다.`, 'success');
        logAction('프로젝트 삭제', { name: projectName, id: projectId });
        
        return true;
    } catch (error) {
        console.error('프로젝트 삭제 오류:', error);
        return false;
    }
}
/**
 * HTML/CSS 에디터 저장 관련 기능 - 부분 5
 * 최근 프로젝트 관리 기능
 */

/**
 * 최근 프로젝트 목록 가져오기
 * @returns {Array} 프로젝트 목록
 */
function getRecentProjects() {
    try {
        const recentProjectsStr = localStorage.getItem(STORAGE_KEYS.RECENT_PROJECTS);
        if (recentProjectsStr) {
            return JSON.parse(recentProjectsStr);
        }
    } catch (error) {
        console.error('최근 프로젝트 불러오기 오류:', error);
    }
    
    return [];
}

/**
 * 최근 프로젝트 목록에 추가
 * @param {Object} projectData - 프로젝트 데이터
 */
function addToRecentProjects(projectData) {
    try {
        if (!projectData || !projectData.id) return;
        
        // 현재 목록 가져오기
        let recentProjects = getRecentProjects();
        
        // 기존 항목 제거 (중복 없음)
        recentProjects = recentProjects.filter(project => project.id !== projectData.id);
        
        // 프로젝트 요약 정보 추가
        recentProjects.unshift({
            id: projectData.id,
            name: projectData.name,
            description: projectData.description,
            created: projectData.created,
            lastEdited: projectData.lastEdited || projectData.created
        });
        
        // 최대 개수 제한
        if (recentProjects.length > MAX_RECENT_PROJECTS) {
            recentProjects = recentProjects.slice(0, MAX_RECENT_PROJECTS);
        }
        
        // 저장
        localStorage.setItem(STORAGE_KEYS.RECENT_PROJECTS, JSON.stringify(recentProjects));
        
        console.log(`최근 프로젝트 목록에 추가됨: ${projectData.name} (${projectData.id})`);
    } catch (error) {
        console.error('최근 프로젝트 목록 업데이트 오류:', error);
    }
}

/**
 * 최근 프로젝트 목록에서 제거
 * @param {string} projectId - 제거할 프로젝트 ID
 */
function removeFromRecentProjects(projectId) {
    try {
        if (!projectId) return;
        
        // 현재 목록 가져오기
        let recentProjects = getRecentProjects();
        
        // 항목 제거
        recentProjects = recentProjects.filter(project => project.id !== projectId);
        
        // 저장
        localStorage.setItem(STORAGE_KEYS.RECENT_PROJECTS, JSON.stringify(recentProjects));
        
        console.log(`최근 프로젝트 목록에서 제거됨: ${projectId}`);
    } catch (error) {
        console.error('최근 프로젝트 목록 업데이트 오류:', error);
    }
}

/**
 * 모든 프로젝트 목록 가져오기
 * @returns {Array} 프로젝트 목록 (ID와 이름)
 */
function getAllProjects() {
    try {
        const projects = [];
        
        // 로컬 스토리지 순회
        for (let i = 0; i < localStorage.length; i++) {
            const key = localStorage.key(i);
            
            // 프로젝트 항목만 필터링
            if (key && key.startsWith('htmlEditor-project-')) {
                try {
                    const projectData = JSON.parse(localStorage.getItem(key));
                    if (projectData && projectData.id && projectData.name) {
                        projects.push({
                            id: projectData.id,
                            name: projectData.name,
                            description: projectData.description,
                            lastEdited: projectData.lastEdited || projectData.created
                        });
                    }
                } catch (e) {
                    console.warn(`유효하지 않은 프로젝트 데이터: ${key}`, e);
                }
            }
        }
        
        // 마지막 수정일 기준 내림차순 정렬
        projects.sort((a, b) => {
            const dateA = new Date(a.lastEdited || 0);
            const dateB = new Date(b.lastEdited || 0);
            return dateB - dateA;
        });
        
        return projects;
    } catch (error) {
        console.error('프로젝트 목록 가져오기 오류:', error);
        return [];
    }
}
/**
 * HTML/CSS 에디터 저장 관련 기능 - 부분 6
 * 자동 저장 및 세션 복구 기능
 */

/**
 * 자동 저장 설정 불러오기
 */
function loadAutoSaveSettings() {
    try {
        const autoSaveSettingsStr = localStorage.getItem(STORAGE_KEYS.AUTO_SAVE);
        if (autoSaveSettingsStr) {
            const settings = JSON.parse(autoSaveSettingsStr);
            autoSaveEnabled = settings.enabled === true;
            
            // 자동 저장 활성화
            if (autoSaveEnabled) {
                startAutoSave();
            }
            
            console.log(`자동 저장 설정 로드됨: ${autoSaveEnabled ? '활성화' : '비활성화'}`);
        }
    } catch (error) {
        console.error('자동 저장 설정 로드 오류:', error);
    }
}

/**
 * 자동 저장 설정 저장
 */
function saveAutoSaveSettings() {
    try {
        const settings = {
            enabled: autoSaveEnabled,
            lastUpdated: new Date().toISOString()
        };
        
        localStorage.setItem(STORAGE_KEYS.AUTO_SAVE, JSON.stringify(settings));
        console.log(`자동 저장 설정 저장됨: ${autoSaveEnabled ? '활성화' : '비활성화'}`);
    } catch (error) {
        console.error('자동 저장 설정 저장 오류:', error);
    }
}

/**
 * 자동 저장 토글
 * @returns {boolean} 자동 저장 활성화 상태
 */
function toggleAutoSave() {
    autoSaveEnabled = !autoSaveEnabled;
    
    if (autoSaveEnabled) {
        startAutoSave();
        showNotification('자동 저장이 활성화되었습니다.', 'success');
    } else {
        stopAutoSave();
        showNotification('자동 저장이 비활성화되었습니다.', 'info');
    }
    
    // 설정 저장
    saveAutoSaveSettings();
    logAction('자동 저장 토글', { enabled: autoSaveEnabled });
    
    return autoSaveEnabled;
}

/**
 * 자동 저장 시작
 */
function startAutoSave() {
    // 기존 타이머 정리
    stopAutoSave();
    
    // 새 타이머 설정
    autoSaveInterval = setInterval(() => {
        saveCurrentSession(true);
    }, AUTO_SAVE_DELAY);
    
    console.log(`자동 저장 시작 (${AUTO_SAVE_DELAY / 1000}초 간격)`);
}

/**
 * 자동 저장 중지
 */
function stopAutoSave() {
    if (autoSaveInterval) {
        clearInterval(autoSaveInterval);
        autoSaveInterval = null;
        console.log('자동 저장 중지');
    }
}

/**
 * 현재 세션 저장
 * @param {boolean} isAutoSave - 자동 저장 여부
 */
function saveCurrentSession(isAutoSave = false) {
    try {
        // 현재 에디터 내용 가져오기
        const htmlEditor = document.getElementById('html-editor');
        const cssEditor = document.getElementById('css-editor');
        const jsEditor = document.getElementById('js-editor');
        
        if (!htmlEditor && !cssEditor && !jsEditor) {
            console.warn('에디터 요소를 찾을 수 없음, 세션 저장 중단');
            return;
        }
        
        // 세션 데이터 구성
        const sessionData = {
            html: htmlEditor ? htmlEditor.value : '',
            css: cssEditor ? cssEditor.value : '',
            js: jsEditor ? jsEditor.value : '',
            template: currentTemplate || 'blank',
            timestamp: new Date().toISOString(),
            autoSave: isAutoSave
        };
        
        // 세션 저장
        localStorage.setItem(STORAGE_KEYS.LAST_SESSION, JSON.stringify(sessionData));
        
        // 로그 (자동 저장이 아닌 경우만)
        if (!isAutoSave) {
            console.log('현재 세션 저장 완료');
            logAction('세션 저장');
        }
    } catch (error) {
        console.error('세션 저장 오류:', error);
    }
}

/**
 * 마지막 세션 불러오기
 * @returns {boolean} 성공 여부
 */
function loadLastSession() {
    try {
        const sessionDataStr = localStorage.getItem(STORAGE_KEYS.LAST_SESSION);
        if (!sessionDataStr) {
            console.log('저장된 세션 없음');
            return false;
        }
        
        const sessionData = JSON.parse(sessionDataStr);
        
        // URL에서 공유된 코드가 있는지 확인 (URL 코드가 우선)
        if (typeof getSharedCodeFromUrl === 'function' && getSharedCodeFromUrl()) {
            console.log('URL에서 공유된 코드 로드됨, 세션 복구 생략');
            return false;
        }
        
        // 에디터에 내용 설정
        const htmlEditor = document.getElementById('html-editor');
        const cssEditor = document.getElementById('css-editor');
        const jsEditor = document.getElementById('js-editor');
        
        if (htmlEditor) htmlEditor.value = sessionData.html || '';
        if (cssEditor) cssEditor.value = sessionData.css || '';
        if (jsEditor) jsEditor.value = sessionData.js || '';
        
        // 템플릿 선택 업데이트
        if (sessionData.template && document.getElementById('templateSelect')) {
            document.getElementById('templateSelect').value = sessionData.template;
            
            // 현재 템플릿 값도 업데이트
            if (typeof currentTemplate !== 'undefined') {
                currentTemplate = sessionData.template;
            }
        }
        
        // 미리보기 업데이트
        if (typeof updatePreviewFrame === 'function') {
            updatePreviewFrame();
        }
        
        const timestamp = new Date(sessionData.timestamp);
        const isToday = timestamp.toDateString() === new Date().toDateString();
        const timeStr = timestamp.toLocaleTimeString();
        const dateStr = timestamp.toLocaleDateString();
        const timeMessage = isToday ? timeStr : `${dateStr} ${timeStr}`;
        
        if (sessionData.autoSave) {
            console.log(`자동 저장된 세션 복구됨 (저장 시간: ${timeMessage})`);
            showNotification(`자동 저장된 세션이 복구되었습니다. (${timeMessage})`, 'info');
        } else {
            console.log(`마지막 세션 복구됨 (저장 시간: ${timeMessage})`);
            showNotification(`마지막 세션이 복구되었습니다. (${timeMessage})`, 'info');
        }
        
        logAction('세션 로드', { autoSave: sessionData.autoSave, timestamp: sessionData.timestamp });
        return true;
    } catch (error) {
        console.error('세션 로드 오류:', error);
        return false;
    }
}
/**
 * HTML/CSS 에디터 저장 관련 기능 - 부분 7
 * 내보내기 및 가져오기 기능
 */

/**
 * 현재 프로젝트를 파일로 내보내기
 */
function exportProjectToFile() {
    try {
        // 현재 에디터 내용 가져오기
        const htmlEditor = document.getElementById('html-editor');
        const cssEditor = document.getElementById('css-editor');
        const jsEditor = document.getElementById('js-editor');
        
        if (!htmlEditor && !cssEditor && !jsEditor) {
            showNotification('에디터 내용을 찾을 수 없습니다.', 'error');
            return;
        }
        
        // 프로젝트 이름 입력받기
        const projectName = prompt('내보낼 프로젝트 이름을 입력하세요:') || 'html-project';
        
        // 프로젝트 데이터 구성
        const projectData = {
            name: projectName,
            description: "내보내기 된 프로젝트",
            html: htmlEditor ? htmlEditor.value : '',
            css: cssEditor ? cssEditor.value : '',
            js: jsEditor ? jsEditor.value : '',
            exported: true,
            timestamp: new Date().toISOString()
        };
        
        // JSON으로 변환
        const jsonData = JSON.stringify(projectData, null, 2);
        
        // 다운로드 링크 생성
        const blob = new Blob([jsonData], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        
        // 다운로드 링크 생성 및 클릭
        const a = document.createElement('a');
        a.href = url;
        a.download = `${projectName.replace(/[^a-z0-9]/gi, '-').toLowerCase()}.html-project.json`;
        a.style.display = 'none';
        document.body.appendChild(a);
        a.click();
        
        // 자원 정리
        setTimeout(() => {
            document.body.removeChild(a);
            URL.revokeObjectURL(url);
        }, 100);
        
        console.log(`프로젝트 내보내기 완료: ${projectName}`);
        showNotification('프로젝트 내보내기가 완료되었습니다.', 'success');
        logAction('프로젝트 내보내기', { name: projectName });
    } catch (error) {
        console.error('프로젝트 내보내기 오류:', error);
        showNotification('프로젝트 내보내기 중 오류가 발생했습니다.', 'error');
    }
}

/**
 * 파일에서 프로젝트 가져오기 대화상자 표시
 */
function showImportProjectDialog() {
    console.log('가져오기 대화상자 표시');
    
    // 기존 대화상자 삭제
    removeDialogs();
    
    // 대화상자 HTML 생성
    const dialogHTML = `
    <div class="dialog-overlay" id="import-dialog-overlay">
        <div class="dialog">
            <div class="dialog-header">
                <h3 class="dialog-title">프로젝트 가져오기</h3>
                <button class="dialog-close">&times;</button>
            </div>
            <div class="dialog-content">
                <p>JSON 형식의 프로젝트 파일을 선택해주세요.</p>
                <div class="form-group">
                    <input type="file" id="import-file" accept=".json,.html-project.json">
                </div>
                <div class="form-group">
                    <label>
                        <input type="checkbox" id="import-as-new" checked> 새 프로젝트로 가져오기
                    </label>
                </div>
            </div>
            <div class="dialog-footer">
                <button class="btn btn-secondary" id="import-cancel-btn">취소</button>
                <button class="btn" id="import-project-btn">가져오기</button>
            </div>
        </div>
    </div>
    `;
    
    // DOM에 대화상자 추가
    document.body.insertAdjacentHTML('beforeend', dialogHTML);
    
    // 대화상자 이벤트 설정
    const overlay = document.getElementById('import-dialog-overlay');
    const closeBtn = overlay.querySelector('.dialog-close');
    const cancelBtn = document.getElementById('import-cancel-btn');
    const importBtn = document.getElementById('import-project-btn');
    const fileInput = document.getElementById('import-file');
    
    // 닫기 버튼 이벤트
    closeBtn.addEventListener('click', function() {
        removeDialogs();
    });
    
    // 취소 버튼 이벤트
    cancelBtn.addEventListener('click', function() {
        removeDialogs();
    });
    
    // 가져오기 버튼 이벤트
    importBtn.addEventListener('click', function() {
        const file = fileInput.files[0];
        if (!file) {
            alert('가져올 파일을 선택해주세요.');
            return;
        }
        
        const isNewProject = document.getElementById('import-as-new').checked;
        importProjectFromFile(file, isNewProject);
        removeDialogs();
    });
}

/**
 * 파일에서 프로젝트 가져오기
 * @param {File} file - 가져올 프로젝트 파일
 * @param {boolean} asNewProject - 새 프로젝트로 가져올지 여부
 */
function importProjectFromFile(file, asNewProject = true) {
    if (!file) {
        showNotification('가져올 파일이 없습니다.', 'error');
        return;
    }
    
    const reader = new FileReader();
    reader.onload = function(e) {
        try {
            // JSON 데이터 파싱
            const projectData = JSON.parse(e.target.result);
            
            // 기본 검증
            if (!projectData.html && !projectData.css && !projectData.js) {
                throw new Error('유효한 프로젝트 데이터가 아닙니다.');
            }
            
            // 현재 에디터에 내용 설정
            const htmlEditor = document.getElementById('html-editor');
            const cssEditor = document.getElementById('css-editor');
            const jsEditor = document.getElementById('js-editor');
            
            if (htmlEditor) htmlEditor.value = projectData.html || '';
            if (cssEditor) cssEditor.value = projectData.css || '';
            if (jsEditor) jsEditor.value = projectData.js || '';
            
            // 미리보기 업데이트
            if (typeof updatePreviewFrame === 'function') {
                updatePreviewFrame();
            }
            
            // 새 프로젝트로 저장
            if (asNewProject) {
                // 새 프로젝트 이름 생성
                const now = new Date();
                const dateStr = `${now.getFullYear()}${(now.getMonth() + 1).toString().padStart(2, '0')}${now.getDate().toString().padStart(2, '0')}`;
                const timeStr = `${now.getHours().toString().padStart(2, '0')}${now.getMinutes().toString().padStart(2, '0')}`;
                
                const newProjectData = {
                    name: projectData.name ? `${projectData.name} (가져옴)` : `가져온 프로젝트 ${dateStr}-${timeStr}`,
                    description: projectData.description || '파일에서 가져온 프로젝트',
                    html: projectData.html || '',
                    css: projectData.css || '',
                    js: projectData.js || '',
                    created: new Date().toISOString(),
                    lastEdited: new Date().toISOString(),
                    imported: true,
                    originalTimestamp: projectData.timestamp || null
                };
                
                // 프로젝트 저장
                const projectId = saveProject(newProjectData);
                
                if (projectId) {
                    showNotification(`프로젝트 "${newProjectData.name}"을(를) 가져왔습니다.`, 'success');
                    logAction('프로젝트 가져오기', { name: newProjectData.name, id: projectId });
                }
            } else {
                // 임시로 저장 (세션)
                saveCurrentSession();
                showNotification('프로젝트를 성공적으로 가져왔습니다. 저장하려면 "저장" 버튼을 클릭하세요.', 'success');
                logAction('프로젝트 가져오기 (임시)', { name: projectData.name || '무제' });
            }
            
            // 저장 상태 업데이트
            if (typeof setUnsavedChanges === 'function') {
                setUnsavedChanges(!asNewProject);
            }
        } catch (error) {
            console.error('프로젝트 파일 파싱 오류:', error);
            showNotification('유효하지 않은 프로젝트 파일입니다.', 'error');
        }
    };
    
    reader.onerror = function() {
        console.error('파일 읽기 오류');
        showNotification('파일을 읽는 중 오류가 발생했습니다.', 'error');
    };
    
    reader.readAsText(file);
}
/**
 * HTML/CSS 에디터 저장 관련 기능 - 부분 8
 * 로컬 스토리지 관리 및 유틸리티 함수
 */

/**
 * 로컬 스토리지 사용량 확인
 * @returns {Object} 사용량 정보 (used, total, percent)
 */
function getStorageUsage() {
    try {
        let totalSize = 0;
        let editorSize = 0;
        const storageLimit = 5 * 1024 * 1024; // 약 5MB (브라우저마다 다름)
        
        // 모든 항목 확인
        for (let i = 0; i < localStorage.length; i++) {
            const key = localStorage.key(i);
            const value = localStorage.getItem(key);
            const size = (key.length + value.length) * 2; // UTF-16 인코딩 (2바이트)
            
            totalSize += size;
            
            // 에디터 관련 항목만 필터링
            if (key.startsWith('htmlEditor-') || 
                key === STORAGE_KEYS.RECENT_PROJECTS || 
                key === STORAGE_KEYS.LAST_SESSION ||
                key === STORAGE_KEYS.AUTO_SAVE ||
                key === 'htmlEditorUserTemplates') {
                
                editorSize += size;
            }
        }
        
        return {
            used: {
                total: totalSize,
                editor: editorSize,
                other: totalSize - editorSize
            },
            limit: storageLimit,
            percent: {
                total: (totalSize / storageLimit) * 100,
                editor: (editorSize / storageLimit) * 100
            },
            formatted: {
                totalUsed: formatBytes(totalSize),
                editorUsed: formatBytes(editorSize),
                otherUsed: formatBytes(totalSize - editorSize),
                limit: formatBytes(storageLimit)
            }
        };
    } catch (error) {
        console.error('스토리지 사용량 확인 오류:', error);
        return {
            used: { total: 0, editor: 0, other: 0 },
            limit: 0,
            percent: { total: 0, editor: 0 },
            formatted: {
                totalUsed: '0 B',
                editorUsed: '0 B',
                otherUsed: '0 B',
                limit: '0 B'
            }
        };
    }
}

/**
 * 용량 포맷 (바이트 -> 사람이 읽기 쉬운 형태)
 * @param {number} bytes - 바이트 수
 * @returns {string} 포맷된 문자열
 */
function formatBytes(bytes) {
    if (bytes === 0) return '0 B';
    
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log2(bytes) / 10);
    return `${(bytes / Math.pow(1024, i)).toFixed(2)} ${sizes[i]}`;
}

/**
 * 에디터 관련 로컬 스토리지 데이터 정리
 * @param {string} type - 정리할 데이터 유형 ('all', 'projects', 'sessions', 'templates')
 * @returns {Object} 정리 결과 (count, size)
 */
function cleanupStorage(type = 'all') {
    try {
        let count = 0;
        let size = 0;
        
        // 정리 전 사용량 확인
        const beforeUsage = getStorageUsage();
        
        // 삭제할 키 목록 수집
        const keysToRemove = [];
        
        for (let i = 0; i < localStorage.length; i++) {
            const key = localStorage.key(i);
            
            // 유형별 필터링
            let shouldRemove = false;
            
            if (type === 'all' || type === 'projects') {
                if (key.startsWith('htmlEditor-project-')) {
                    shouldRemove = true;
                }
            }
            
            if (type === 'all' || type === 'sessions') {
                if (key === STORAGE_KEYS.LAST_SESSION) {
                    shouldRemove = true;
                }
            }
            
            if (type === 'all') {
                if (key === STORAGE_KEYS.RECENT_PROJECTS ||
                    key === STORAGE_KEYS.AUTO_SAVE) {
                    shouldRemove = true;
                }
            }
            
            if (type === 'all' || type === 'templates') {
                if (key === 'htmlEditorUserTemplates') {
                    shouldRemove = true;
                }
            }
            
            // 제거 목록에 추가
            if (shouldRemove) {
                keysToRemove.push(key);
                const value = localStorage.getItem(key);
                size += (key.length + value.length) * 2; // UTF-16 인코딩 (2바이트)
                count++;
            }
        }
        
        // 실제 삭제 수행
        keysToRemove.forEach(key => {
            localStorage.removeItem(key);
        });
        
        console.log(`스토리지 정리 완료: ${count}개 항목 제거됨 (${formatBytes(size)})`);
        logAction('스토리지 정리', { type, count, size: formatBytes(size) });
        
        // 결과 반환
        return {
            count,
            size,
            formatted: formatBytes(size),
            before: beforeUsage,
            after: getStorageUsage()
        };
    } catch (error) {
        console.error('스토리지 정리 오류:', error);
        return { count: 0, size: 0, formatted: '0 B' };
    }
}

/**
 * 스토리지 관리 대화상자 표시
 */
function showStorageManagerDialog() {
    console.log('스토리지 관리 대화상자 표시');
    
    // 기존 대화상자 삭제
    removeDialogs();
    
    // 스토리지 사용량 확인
    const usage = getStorageUsage();
    
    // 프로젝트 개수 확인
    const projectCount = getAllProjects().length;
    
    // 대화상자 HTML 생성
    const dialogHTML = `
    <div class="dialog-overlay" id="storage-dialog-overlay">
        <div class="dialog" style="width: 500px; max-width: 90%;">
            <div class="dialog-header">
                <h3 class="dialog-title">로컬 스토리지 관리</h3>
                <button class="dialog-close">&times;</button>
            </div>
            <div class="dialog-content">
                <h4>스토리지 사용량</h4>
                <div class="storage-usage">
                    <div class="usage-bar">
                        <div class="usage-bar-fill" style="width: ${usage.percent.total.toFixed(1)}%"></div>
                    </div>
                    <div class="usage-details">
                        <p>총 사용량: ${usage.formatted.totalUsed} / ${usage.formatted.limit} (${usage.percent.total.toFixed(1)}%)</p>
                        <p>에디터 관련: ${usage.formatted.editorUsed} (${usage.percent.editor.toFixed(1)}%)</p>
                        <p>기타 사용량: ${usage.formatted.otherUsed}</p>
                    </div>
                </div>
                
                <h4>데이터 관리</h4>
                <div class="storage-info">
                    <p>저장된 프로젝트: ${projectCount}개</p>
                </div>
                
                <div class="cleanup-options">
                    <button class="btn btn-sm btn-secondary cleanup-btn" data-type="projects">프로젝트 정리</button>
                    <button class="btn btn-sm btn-secondary cleanup-btn" data-type="sessions">세션 정리</button>
                    <button class="btn btn-sm btn-secondary cleanup-btn" data-type="templates">템플릿 정리</button>
                    <button class="btn btn-sm btn-secondary cleanup-btn" data-type="all">모두 정리</button>
                </div>
                
                <div class="storage-warning">
                    <p><strong>주의:</strong> 정리된 데이터는 복구할 수 없습니다.</p>
                </div>
            </div>
            <div class="dialog-footer">
                <button class="btn btn-secondary" id="storage-close-btn">닫기</button>
            </div>
        </div>
    </div>
    `;
    
    // 추가 스타일
    const dialogStyle = `
    <style>
        .storage-usage {
            margin: 15px 0;
        }
        .usage-bar {
            height: 20px;
            background-color: #f0f0f0;
            border-radius: 10px;
            overflow: hidden;
            margin-bottom: 10px;
        }
        .usage-bar-fill {
            height: 100%;
            background-color: ${usage.percent.total > 90 ? '#e74c3c' : usage.percent.total > 70 ? '#f39c12' : '#2ecc71'};
            border-radius: 10px;
        }
        .usage-details p {
            margin: 5px 0;
            font-size: 14px;
        }
        .storage-info {
            margin: 15px 0;
        }
        .cleanup-options {
            display: flex;
            flex-wrap: wrap;
            gap: 10px;
            margin: 15px 0;
        }
        .storage-warning {
            margin-top: 15px;
            padding: 10px;
            background-color: #fff3cd;
            border-left: 4px solid #ffc107;
            font-size: 14px;
        }
    </style>
    `;
    
    // DOM에 대화상자 추가
    document.body.insertAdjacentHTML('beforeend', dialogHTML + dialogStyle);
    
    // 대화상자 이벤트 설정
    const overlay = document.getElementById('storage-dialog-overlay');
    const closeBtn = overlay.querySelector('.dialog-close');
    const closeFooterBtn = document.getElementById('storage-close-btn');
    
    // 닫기 버튼 이벤트
    closeBtn.addEventListener('click', function() {
        removeDialogs();
    });
    
    closeFooterBtn.addEventListener('click', function() {
        removeDialogs();
    });
    
    // 정리 버튼 이벤트
    const cleanupBtns = overlay.querySelectorAll('.cleanup-btn');
    cleanupBtns.forEach(btn => {
        btn.addEventListener('click', function() {
            const type = this.getAttribute('data-type');
            const typeNames = {
                'projects': '프로젝트',
                'sessions': '세션',
                'templates': '템플릿',
                'all': '모든 데이터'
            };
            
            const confirmMsg = `정말 ${typeNames[type]}를 모두 정리하시겠습니까? 이 작업은 취소할 수 없습니다.`;
            
            if (confirm(confirmMsg)) {
                const result = cleanupStorage(type);
                showNotification(`${typeNames[type]} 정리 완료: ${result.count}개 항목 (${result.formatted})`, 'success');
                
                // 다이얼로그 업데이트 또는 닫기
                removeDialogs();
                showStorageManagerDialog(); // 업데이트된 정보로 다시 표시
            }
        });
    });
}
/**
 * HTML/CSS 에디터 저장 관련 기능 - 부분 9
 * URL 공유 및 백업/복원 기능
 */

/**
 * URL에서 공유 코드 추출 및 복원
 * @returns {boolean} 성공 여부
 */
function getSharedCodeFromUrl() {
    try {
        const urlParams = new URLSearchParams(window.location.search);
        const code = urlParams.get('code');
        
        if (!code) {
            return false;
        }
        
        // base64 디코딩
        try {
            const decodedStr = decodeURIComponent(atob(code));
            const content = JSON.parse(decodedStr);
            
            // 기본 검증
            if (!content.html && !content.css && !content.js) {
                console.warn('URL에 유효한 코드 데이터가 없음');
                return false;
            }
            
            // 에디터에 내용 설정
            const htmlEditor = document.getElementById('html-editor');
            const cssEditor = document.getElementById('css-editor');
            const jsEditor = document.getElementById('js-editor');
            
            if (htmlEditor && content.html !== undefined) {
                htmlEditor.value = content.html;
            }
            
            if (cssEditor && content.css !== undefined) {
                cssEditor.value = content.css;
            }
            
            if (jsEditor && content.js !== undefined) {
                jsEditor.value = content.js;
            }
            
            // 템플릿 선택 업데이트
            if (content.template && typeof currentTemplate !== 'undefined') {
                currentTemplate = content.template;
                
                // 템플릿 선택 드롭다운 업데이트
                const templateSelect = document.getElementById('templateSelect');
                if (templateSelect) {
                    templateSelect.value = content.template;
                }
            }
            
            console.log('URL에서 공유된 코드 로드 완료');
            showNotification('공유된 코드가 로드되었습니다.', 'success');
            logAction('URL 공유 코드 로드');
            
            // 미리보기 업데이트
            if (typeof updatePreviewFrame === 'function') {
                updatePreviewFrame();
            }
            
            return true;
        } catch (e) {
            console.error('공유 코드 파싱 오류:', e);
            showNotification('유효하지 않은 공유 코드입니다.', 'error');
            return false;
        }
    } catch (error) {
        console.error('URL 파라미터 처리 오류:', error);
        return false;
    }
}

/**
 * 현재 코드를 공유 URL로 생성
 * @returns {string|null} 공유 URL
 */
function generateShareUrl() {
    try {
        // 현재 에디터 내용 가져오기
        const htmlEditor = document.getElementById('html-editor');
        const cssEditor = document.getElementById('css-editor');
        const jsEditor = document.getElementById('js-editor');
        
        // 공유할 데이터 생성
        const shareData = {
            html: htmlEditor ? htmlEditor.value : '',
            css: cssEditor ? cssEditor.value : '',
            js: jsEditor ? jsEditor.value : ''
        };
        
        // 템플릿 정보 추가
        if (typeof currentTemplate !== 'undefined') {
            shareData.template = currentTemplate;
        }
        
        // 공유 코드에 포함할 메타데이터
        shareData.shared = true;
        shareData.timestamp = new Date().toISOString();
        
        // JSON 문자열로 변환 후 base64 인코딩
        const jsonStr = JSON.stringify(shareData);
        const encodedData = btoa(encodeURIComponent(jsonStr));
        
        // URL 생성
        const baseUrl = window.location.href.split('?')[0]; // 쿼리 파라미터 제거
        const shareUrl = `${baseUrl}?code=${encodedData}`;
        
        console.log('공유 URL 생성 완료');
        logAction('공유 URL 생성', { size: encodedData.length });
        
        return shareUrl;
    } catch (error) {
        console.error('공유 URL 생성 오류:', error);
        showNotification('공유 URL을 생성하는 중 오류가 발생했습니다.', 'error');
        return null;
    }
}

/**
 * 현재 프로젝트를 공유 링크로 공유
 */
function shareProjectAsUrl() {
    // 공유 URL 생성
    const shareUrl = generateShareUrl();
    
    if (!shareUrl) {
        return;
    }
    
    // URL 길이 확인 (브라우저 제한)
    if (shareUrl.length > 2000) {
        showNotification('프로젝트가 너무 커서 URL로 공유할 수 없습니다. 파일로 내보내기를 사용해보세요.', 'error');
        return;
    }
    
    // 클립보드에 복사
    try {
        navigator.clipboard.writeText(shareUrl).then(() => {
            showNotification('공유 URL이 클립보드에 복사되었습니다.', 'success');
        }).catch(err => {
            console.error('클립보드 복사 실패:', err);
            promptShareUrl(shareUrl);
        });
    } catch (e) {
        console.error('클립보드 API 오류:', e);
        promptShareUrl(shareUrl);
    }
}

/**
 * 공유 URL을 대화상자로 표시
 * @param {string} url - 공유 URL
 */
function promptShareUrl(url) {
    alert('다음 URL을 복사하여 공유하세요:\n\n' + url);
}

/**
 * 전체 프로젝트 데이터 백업
 */
function backupAllProjects() {
    try {
        // 백업 데이터 수집
        const backupData = {
            version: '1.0',
            timestamp: new Date().toISOString(),
            projects: {},
            templates: {},
            settings: {}
        };
        
        // 프로젝트 데이터 수집
        for (let i = 0; i < localStorage.length; i++) {
            const key = localStorage.key(i);
            
            // 프로젝트 항목 필터링
            if (key && key.startsWith('htmlEditor-project-')) {
                try {
                    const projectData = JSON.parse(localStorage.getItem(key));
                    backupData.projects[key] = projectData;
                } catch (e) {
                    console.warn(`유효하지 않은 프로젝트 데이터: ${key}`, e);
                }
            }
            
            // 템플릿 항목 필터링
            if (key === 'htmlEditorUserTemplates') {
                try {
                    const templatesData = JSON.parse(localStorage.getItem(key));
                    backupData.templates = templatesData;
                } catch (e) {
                    console.warn('유효하지 않은 템플릿 데이터', e);
                }
            }
            
            // 설정 항목 필터링
            if (key === STORAGE_KEYS.AUTO_SAVE || 
                key === STORAGE_KEYS.RECENT_PROJECTS) {
                try {
                    const settingData = JSON.parse(localStorage.getItem(key));
                    backupData.settings[key] = settingData;
                } catch (e) {
                    console.warn(`유효하지 않은 설정 데이터: ${key}`, e);
                }
            }
        }
        
        // 프로젝트 수 확인
        const projectCount = Object.keys(backupData.projects).length;
        
        if (projectCount === 0) {
            showNotification('백업할 프로젝트가 없습니다.', 'info');
            return;
        }
        
        // JSON으로 변환
        const jsonData = JSON.stringify(backupData);
        
        // 백업 파일명 생성
        const now = new Date();
        const dateStr = `${now.getFullYear()}${(now.getMonth() + 1).toString().padStart(2, '0')}${now.getDate().toString().padStart(2, '0')}`;
        const timeStr = `${now.getHours().toString().padStart(2, '0')}${now.getMinutes().toString().padStart(2, '0')}`;
        const fileName = `html-editor-backup-${dateStr}-${timeStr}.json`;
        
        // 다운로드 링크 생성
        const blob = new Blob([jsonData], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        
        // 다운로드 링크 생성 및 클릭
        const a = document.createElement('a');
        a.href = url;
        a.download = fileName;
        a.style.display = 'none';
        document.body.appendChild(a);
        a.click();
        
        // 자원 정리
        setTimeout(() => {
            document.body.removeChild(a);
            URL.revokeObjectURL(url);
        }, 100);
        
        console.log(`백업 완료: ${projectCount}개 프로젝트`);
        showNotification(`${projectCount}개 프로젝트가 백업되었습니다.`, 'success');
        logAction('프로젝트 백업', { count: projectCount, size: formatBytes(jsonData.length * 2) });
    } catch (error) {
        console.error('프로젝트 백업 오류:', error);
        showNotification('프로젝트 백업 중 오류가 발생했습니다.', 'error');
    }
}

/**
 * 백업 파일에서 데이터 복원
 * @param {File} file - 백업 파일
 */
function restoreFromBackup(file) {
    if (!file) {
        showNotification('복원할 파일이 없습니다.', 'error');
        return;
    }
    
    // 확인 대화상자
    if (!confirm('백업에서 복원하면 현재 데이터가 덮어쓰기될 수 있습니다. 계속하시겠습니까?')) {
        return;
    }
    
    const reader = new FileReader();
    reader.onload = function(e) {
        try {
            // JSON 데이터 파싱
            const backupData = JSON.parse(e.target.result);
            
            // 기본 검증
            if (!backupData.version || !backupData.projects) {
                throw new Error('유효한 백업 파일이 아닙니다.');
            }
            
            let projectCount = 0;
            let templateCount = 0;
            
            // 프로젝트 복원
            if (backupData.projects) {
                for (const key in backupData.projects) {
                    const projectData = backupData.projects[key];
                    localStorage.setItem(key, JSON.stringify(projectData));
                    projectCount++;
                }
            }
            
            // 템플릿 복원
            if (backupData.templates && Object.keys(backupData.templates).length > 0) {
                localStorage.setItem('htmlEditorUserTemplates', JSON.stringify(backupData.templates));
                templateCount = Object.keys(backupData.templates).length;
            }
            
            // 설정 복원
            if (backupData.settings) {
                for (const key in backupData.settings) {
                    const settingData = backupData.settings[key];
                    localStorage.setItem(key, JSON.stringify(settingData));
                }
            }
            
            console.log(`복원 완료: ${projectCount}개 프로젝트, ${templateCount}개 템플릿`);
            showNotification(`${projectCount}개 프로젝트와 ${templateCount}개 템플릿이 복원되었습니다.`, 'success');
            logAction('백업 복원', { projectCount, templateCount });
        } catch (error) {
            console.error('백업 파일 파싱 오류:', error);
            showNotification('유효하지 않은 백업 파일입니다.', 'error');
        }
    };
    
    reader.onerror = function() {
        console.error('파일 읽기 오류');
        showNotification('파일을 읽는 중 오류가 발생했습니다.', 'error');
    };
    
    reader.readAsText(file);
}

/**
 * 백업 복원 대화상자 표시
 */
function showRestoreBackupDialog() {
    console.log('백업 복원 대화상자 표시');
    
    // 기존 대화상자 삭제
    removeDialogs();
    
    // 대화상자 HTML 생성
    const dialogHTML = `
    <div class="dialog-overlay" id="restore-dialog-overlay">
        <div class="dialog">
            <div class="dialog-header">
                <h3 class="dialog-title">백업에서 복원</h3>
                <button class="dialog-close">&times;</button>
            </div>
            <div class="dialog-content">
                <p>백업 파일 (.json)을 선택해주세요.</p>
                <div class="form-group">
                    <input type="file" id="restore-file" accept=".json">
                </div>
                <div class="warning-box">
                    <p><strong>주의:</strong> 복원 시 기존 데이터가 덮어쓰기될 수 있습니다.</p>
                </div>
            </div>
            <div class="dialog-footer">
                <button class="btn btn-secondary" id="restore-cancel-btn">취소</button>
                <button class="btn" id="restore-confirm-btn">복원</button>
            </div>
        </div>
    </div>
    `;
    
    // 추가 스타일
    const dialogStyle = `
    <style>
        .warning-box {
            margin-top: 15px;
            padding: 10px;
            background-color: #fff3cd;
            border-left: 4px solid #ffc107;
            font-size: 14px;
        }
    </style>
    `;
    
    // DOM에 대화상자 추가
    document.body.insertAdjacentHTML('beforeend', dialogHTML + dialogStyle);
    
    // 대화상자 이벤트 설정
    const overlay = document.getElementById('restore-dialog-overlay');
    const closeBtn = overlay.querySelector('.dialog-close');
    const cancelBtn = document.getElementById('restore-cancel-btn');
    const confirmBtn = document.getElementById('restore-confirm-btn');
    
    // 닫기 버튼 이벤트
    closeBtn.addEventListener('click', function() {
        removeDialogs();
    });
    
    // 취소 버튼 이벤트
    cancelBtn.addEventListener('click', function() {
        removeDialogs();
    });
    
    // 복원 버튼 이벤트
    confirmBtn.addEventListener('click', function() {
        const fileInput = document.getElementById('restore-file');
        const file = fileInput.files[0];
        
        if (!file) {
            alert('복원할 백업 파일을 선택해주세요.');
            return;
        }
        
        restoreFromBackup(file);
        removeDialogs();
    });
}
/**
 * HTML/CSS 에디터 저장 관련 기능 - 부분 10a
 * 로깅, 디버깅 및 설정 기능 (첫 번째 부분)
 */

/**
 * 에디터 설정 객체
 */
const editorSettings = {
    // 테마 설정
    theme: 'light',
    
    // 에디터 기본 설정
    indentSize: 2,
    autoComplete: true,
    lineWrapping: true,
    lineNumbers: true,
    
    // 미리보기 설정
    autoPreview: true,
    previewDelay: 300,
    
    // 저장 설정
    autoSaveInterval: 30, // 초 단위
    saveOnExit: true,
    
    // 기본값 로드
    load: function() {
        try {
            const savedSettings = localStorage.getItem('htmlEditorSettings');
            if (savedSettings) {
                const parsedSettings = JSON.parse(savedSettings);
                
                // 설정 값 업데이트
                for (const key in parsedSettings) {
                    if (this.hasOwnProperty(key) && typeof this[key] !== 'function') {
                        this[key] = parsedSettings[key];
                    }
                }
                
                console.log('에디터 설정 로드 완료');
            }
        } catch (error) {
            console.error('설정 로드 오류:', error);
        }
        
        return this;
    },
    
    // 설정 저장
    save: function() {
        try {
            // 함수를 제외한 설정만 저장
            const settingsToSave = {};
            for (const key in this) {
                if (this.hasOwnProperty(key) && typeof this[key] !== 'function') {
                    settingsToSave[key] = this[key];
                }
            }
            
            localStorage.setItem('htmlEditorSettings', JSON.stringify(settingsToSave));
            console.log('에디터 설정 저장 완료');
            return true;
        } catch (error) {
            console.error('설정 저장 오류:', error);
            return false;
        }
    },
    
    // 설정 초기화
    reset: function() {
        // 기본값으로 설정
        this.theme = 'light';
        this.indentSize = 2;
        this.autoComplete = true;
        this.lineWrapping = true;
        this.lineNumbers = true;
        this.autoPreview = true;
        this.previewDelay = 300;
        this.autoSaveInterval = 30;
        this.saveOnExit = true;
        
        // 저장
        this.save();
        console.log('에디터 설정 초기화 완료');
        return this;
    },
    
    // 테마 변경
    setTheme: function(theme) {
        if (theme !== 'light' && theme !== 'dark') {
            console.error('유효하지 않은 테마:', theme);
            return false;
        }
        
        this.theme = theme;
        this.save();
        
        // 테마 적용
        if (theme === 'dark') {
            document.body.classList.add('dark-mode');
        } else {
            document.body.classList.remove('dark-mode');
        }
        
        console.log(`테마 변경됨: ${theme}`);
        return true;
    }
};

/**
 * 설정 대화상자 표시
 */
function showSettingsDialog() {
    console.log('설정 대화상자 표시');
    
    // 기존 대화상자 삭제
    removeDialogs();
    
    // 현재 설정 로드
    editorSettings.load();
    
    // 대화상자 HTML 생성
    const dialogHTML = `
    <div class="dialog-overlay" id="settings-dialog-overlay">
        <div class="dialog" style="width: 500px; max-width: 90%;">
            <div class="dialog-header">
                <h3 class="dialog-title">에디터 설정</h3>
                <button class="dialog-close">&times;</button>
            </div>
            <div class="dialog-content">
                <div class="settings-tabs">
                    <button class="tab-btn active" data-tab="general">일반</button>
                    <button class="tab-btn" data-tab="editor">에디터</button>
                    <button class="tab-btn" data-tab="preview">미리보기</button>
                    <button class="tab-btn" data-tab="save">저장</button>
                </div>
                
                <div class="settings-content">
                    <div class="tab-content active" id="general-settings">
                        <div class="form-group">
                            <label for="theme-select">테마</label>
                            <select id="theme-select" class="form-control">
                                <option value="light" ${editorSettings.theme === 'light' ? 'selected' : ''}>라이트 모드</option>
                                <option value="dark" ${editorSettings.theme === 'dark' ? 'selected' : ''}>다크 모드</option>
                            </select>
                        </div>
                    </div>
                    
                    <div class="tab-content" id="editor-settings">
                        <div class="form-group">
                            <label for="indent-size">들여쓰기 크기</label>
                            <input type="number" id="indent-size" class="form-control" value="${editorSettings.indentSize}" min="1" max="8">
                        </div>
                        <div class="form-group">
                            <label>
                                <input type="checkbox" id="auto-complete" ${editorSettings.autoComplete ? 'checked' : ''}>
                                자동 완성
                            </label>
                        </div>
                        <div class="form-group">
                            <label>
                                <input type="checkbox" id="line-wrapping" ${editorSettings.lineWrapping ? 'checked' : ''}>
                                자동 줄 바꿈
                            </label>
                        </div>
                        <div class="form-group">
                            <label>
                                <input type="checkbox" id="line-numbers" ${editorSettings.lineNumbers ? 'checked' : ''}>
                                줄 번호 표시
                            </label>
                        </div>
                    </div>
                    
                    <div class="tab-content" id="preview-settings">
                        <div class="form-group">
                            <label>
                                <input type="checkbox" id="auto-preview" ${editorSettings.autoPreview ? 'checked' : ''}>
                                자동 미리보기
                            </label>
                        </div>
                        <div class="form-group">
                            <label for="preview-delay">미리보기 지연 시간 (ms)</label>
                            <input type="number" id="preview-delay" class="form-control" value="${editorSettings.previewDelay}" min="0" max="2000" step="100">
                        </div>
                    </div>
                    
                    <div class="tab-content" id="save-settings">
                        <div class="form-group">
                            <label for="auto-save-interval">자동 저장 간격 (초)</label>
                            <input type="number" id="auto-save-interval" class="form-control" value="${editorSettings.autoSaveInterval}" min="5" max="600">
                        </div>
                        <div class="form-group">
                            <label>
                                <input type="checkbox" id="save-on-exit" ${editorSettings.saveOnExit ? 'checked' : ''}>
                                종료 시 자동 저장
                            </label>
                        </div>
                        <div class="form-group">
                            <button id="reset-settings-btn" class="btn btn-secondary">기본값으로 초기화</button>
                        </div>
                    </div>
                </div>
            </div>
            <div class="dialog-footer">
                <button class="btn btn-secondary" id="settings-cancel-btn">취소</button>
                <button class="btn" id="settings-save-btn">저장</button>
            </div>
        </div>
    </div>
    `;
    
    // 추가 스타일
    const dialogStyle = `
    <style>
        .settings-tabs {
            display: flex;
            border-bottom: 1px solid #ddd;
            margin-bottom: 15px;
        }
        .tab-btn {
            background: none;
            border: none;
            padding: 8px 12px;
            cursor: pointer;
            color: #333;
            font-size: 14px;
        }
        .tab-btn.active {
            border-bottom: 2px solid #3498db;
            color: #3498db;
        }
        .tab-content {
            display: none;
            padding: 10px 0;
        }
        .tab-content.active {
            display: block;
        }
        #reset-settings-btn {
            margin-top: 15px;
        }
    </style>
    `;
    
    // DOM에 대화상자 추가
    document.body.insertAdjacentHTML('beforeend', dialogHTML + dialogStyle);
    
    // 탭 전환 이벤트 설정
    const tabBtns = document.querySelectorAll('.tab-btn');
    tabBtns.forEach(btn => {
        btn.addEventListener('click', function() {
            // 활성 탭 변경
            tabBtns.forEach(b => b.classList.remove('active'));
            this.classList.add('active');
            
            // 탭 콘텐츠 표시
            const tabName = this.getAttribute('data-tab');
            document.querySelectorAll('.tab-content').forEach(content => {
                content.classList.remove('active');
            });
            document.getElementById(`${tabName}-settings`).classList.add('active');
        });
    });
    
    // 초기화 버튼 이벤트
    document.getElementById('reset-settings-btn').addEventListener('click', function() {
        if (confirm('모든 설정을 기본값으로 초기화하시겠습니까?')) {
            editorSettings.reset();
            
            // 다이얼로그 업데이트
            removeDialogs();
            showSettingsDialog();
        }
    });
    
    // 닫기 버튼 이벤트
    document.querySelector('.dialog-close').addEventListener('click', function() {
        removeDialogs();
    });
    
    // 취소 버튼 이벤트
    document.getElementById('settings-cancel-btn').addEventListener('click', function() {
        removeDialogs();
    });
    
    // 저장 버튼 이벤트
    document.getElementById('settings-save-btn').addEventListener('click', function() {
        // 설정 값 가져오기
        editorSettings.theme = document.getElementById('theme-select').value;
        editorSettings.indentSize = parseInt(document.getElementById('indent-size').value) || 2;
        editorSettings.autoComplete = document.getElementById('auto-complete').checked;
        editorSettings.lineWrapping = document.getElementById('line-wrapping').checked;
        editorSettings.lineNumbers = document.getElementById('line-numbers').checked;
        editorSettings.autoPreview = document.getElementById('auto-preview').checked;
        editorSettings.previewDelay = parseInt(document.getElementById('preview-delay').value) || 300;
        editorSettings.autoSaveInterval = parseInt(document.getElementById('auto-save-interval').value) || 30;
        editorSettings.saveOnExit = document.getElementById('save-on-exit').checked;
        
        // 설정 저장
        if (editorSettings.save()) {
            showNotification('설정이 저장되었습니다.', 'success');
            
            // 테마 적용
            editorSettings.setTheme(editorSettings.theme);
            
            // 자동 저장 설정 적용
            if (typeof toggleAutoSave === 'function') {
                if (editorSettings.autoSaveInterval > 0) {
                    autoSaveEnabled = true;
                    startAutoSave();
                } else {
                    autoSaveEnabled = false;
                    stopAutoSave();
                }
                saveAutoSaveSettings();
            }
            
            // 미리보기 지연 설정 적용
            if (typeof PREVIEW_DELAY !== 'undefined') {
                PREVIEW_DELAY = editorSettings.previewDelay;
            }
            
            logAction('설정 저장');
        }
        
        removeDialogs();
    });
}/**
 * HTML/CSS 에디터 저장 관련 기능 - 부분 10b
 * 로깅, 디버깅 및 설정 기능 (두 번째 부분)
 */

/**
 * 디버그 정보 수집
 * @returns {Object} 디버그 정보
 */
function collectDebugInfo() {
    try {
        const debugInfo = {
            timestamp: new Date().toISOString(),
            browser: {
                userAgent: navigator.userAgent,
                language: navigator.language,
                platform: navigator.platform,
                cookieEnabled: navigator.cookieEnabled
            },
            storage: getStorageUsage(),
            settings: {
                ...editorSettings
            },
            projectCount: getAllProjects().length
        };
        
        // 로그 디렉토리에 저장
        console.log('디버그 정보 수집 완료');
        logAction('디버그 정보 수집');
        
        return debugInfo;
    } catch (error) {
        console.error('디버그 정보 수집 오류:', error);
        return { error: error.message };
    }
}

/**
 * 디버그 정보 다운로드
 */
function downloadDebugInfo() {
    try {
        const debugInfo = collectDebugInfo();
        
        // JSON으로 변환
        const jsonData = JSON.stringify(debugInfo, null, 2);
        
        // 현재 시간을 포함한 파일명 생성
        const now = new Date();
        const dateStr = `${now.getFullYear()}${(now.getMonth() + 1).toString().padStart(2, '0')}${now.getDate().toString().padStart(2, '0')}`;
        const timeStr = `${now.getHours().toString().padStart(2, '0')}${now.getMinutes().toString().padStart(2, '0')}`;
        const fileName = `html-editor-debug-${dateStr}-${timeStr}.json`;
        
        // 다운로드 링크 생성
        const blob = new Blob([jsonData], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        
        // 다운로드 링크 생성 및 클릭
        const a = document.createElement('a');
        a.href = url;
        a.download = fileName;
        a.style.display = 'none';
        document.body.appendChild(a);
        a.click();
        
        // 자원 정리
        setTimeout(() => {
            document.body.removeChild(a);
            URL.revokeObjectURL(url);
        }, 100);
        
        console.log('디버그 정보 다운로드 완료');
        showNotification('디버그 정보가 다운로드되었습니다.', 'success');
        logAction('디버그 정보 다운로드');
    } catch (error) {
        console.error('디버그 정보 다운로드 오류:', error);
        showNotification('디버그 정보 다운로드 중 오류가 발생했습니다.', 'error');
    }
}

/**
 * 활성 로그 기록
 * @type {Array}
 */
let activeLogs = [];

/**
 * 최대 로그 보관 개수
 * @type {number}
 */
const MAX_LOGS = 100;

/**
 * 로그 이벤트 기록
 * @param {string} action - 작업 설명
 * @param {Object} details - 추가 세부 정보
 */
function recordLog(action, details = {}) {
    try {
        const logEntry = {
            timestamp: new Date().toISOString(),
            action,
            details,
            page: window.location.pathname
        };
        
        // 로그 배열에 추가
        activeLogs.unshift(logEntry);
        
        // 최대 개수 제한
        if (activeLogs.length > MAX_LOGS) {
            activeLogs.pop();
        }
        
        // 디버그 모드에서 로그 출력
        if (isDebugMode()) {
            console.log(`[LOG] ${action}:`, details);
        }
        
        return logEntry;
    } catch (error) {
        console.error('로그 기록 오류:', error);
        return null;
    }
}

/**
 * 현재 로그 목록 가져오기
 * @returns {Array} 로그 목록
 */
function getActivityLogs() {
    return [...activeLogs];
}

/**
 * 로그 목록 초기화
 */
function clearActivityLogs() {
    activeLogs = [];
    console.log('활동 로그 초기화 완료');
    
    // 자체 로그는 추가 (로그 정리 자체를 기록)
    recordLog('로그 초기화');
}

/**
 * 디버그 모드 활성화 여부 확인
 * @returns {boolean} 디버그 모드 활성화 여부
 */
function isDebugMode() {
    return window.location.search.includes('debug=true') || localStorage.getItem('htmlEditorDebugMode') === 'true';
}

/**
 * 디버그 모드 토글
 * @returns {boolean} 변경된 디버그 모드 상태
 */
function toggleDebugMode() {
    const current = isDebugMode();
    localStorage.setItem('htmlEditorDebugMode', (!current).toString());
    
    console.log(`디버그 모드 ${!current ? '활성화' : '비활성화'}`);
    showNotification(`디버그 모드가 ${!current ? '활성화' : '비활성화'}되었습니다.`, 'info');
    recordLog('디버그 모드 변경', { enabled: !current });
    
    return !current;
}

/**
 * 활동 로그 대화상자 표시
 */
function showLogsDialog() {
    console.log('활동 로그 대화상자 표시');
    
    // 기존 대화상자 삭제
    removeDialogs();
    
    // 로그 목록 가져오기
    const logs = getActivityLogs();
    
    // 로그 HTML 생성
    let logsHTML = '';
    
    if (logs.length > 0) {
        logs.forEach((log, index) => {
            const date = new Date(log.timestamp);
            const timeStr = date.toLocaleTimeString();
            
            logsHTML += `
            <div class="log-item">
                <div class="log-time">${timeStr}</div>
                <div class="log-content">
                    <div class="log-action">${log.action}</div>
                    <div class="log-details">${JSON.stringify(log.details)}</div>
                </div>
            </div>
            `;
        });
    } else {
        logsHTML = '<p class="no-logs">활동 로그가 없습니다.</p>';
    }
    
    // 대화상자 HTML 생성
    const dialogHTML = `
    <div class="dialog-overlay" id="logs-dialog-overlay">
        <div class="dialog" style="width: 700px; max-width: 90%;">
            <div class="dialog-header">
                <h3 class="dialog-title">활동 로그</h3>
                <button class="dialog-close">&times;</button>
            </div>
            <div class="dialog-content">
                <div class="logs-controls">
                    <button id="clear-logs-btn" class="btn btn-secondary">로그 초기화</button>
                    <button id="download-logs-btn" class="btn">로그 다운로드</button>
                </div>
                <div class="logs-container">
                    ${logsHTML}
                </div>
            </div>
            <div class="dialog-footer">
                <button class="btn" id="logs-close-btn">닫기</button>
            </div>
        </div>
    </div>
    `;
    
    // 추가 스타일
    const dialogStyle = `
    <style>
        .logs-controls {
            display: flex;
            justify-content: flex-end;
            gap: 10px;
            margin-bottom: 15px;
        }
        .logs-container {
            max-height: 400px;
            overflow-y: auto;
            border: 1px solid #ddd;
            border-radius: 4px;
            background-color: #f8f8f8;
        }
        .log-item {
            display: flex;
            padding: 8px 10px;
            border-bottom: 1px solid #eee;
            font-size: 14px;
        }
        .log-item:last-child {
            border-bottom: none;
        }
        .log-time {
            flex: 0 0 80px;
            color: #777;
        }
        .log-content {
            flex: 1;
        }
        .log-action {
            font-weight: 600;
        }
        .log-details {
            font-size: 12px;
            color: #555;
            font-family: monospace;
            margin-top: 3px;
            white-space: nowrap;
            overflow: hidden;
            text-overflow: ellipsis;
        }
        .no-logs {
            padding: 20px;
            text-align: center;
            color: #777;
        }
    </style>
    `;
    
    // DOM에 대화상자 추가
    document.body.insertAdjacentHTML('beforeend', dialogHTML + dialogStyle);
    
    // 대화상자 이벤트 설정
    const overlay = document.getElementById('logs-dialog-overlay');
    const closeBtn = overlay.querySelector('.dialog-close');
    const closeFooterBtn = document.getElementById('logs-close-btn');
    const clearLogsBtn = document.getElementById('clear-logs-btn');
    const downloadLogsBtn = document.getElementById('download-logs-btn');
    
    // 닫기 버튼 이벤트
    closeBtn.addEventListener('click', function() {
        removeDialogs();
    });
    
    closeFooterBtn.addEventListener('click', function() {
        removeDialogs();
    });
    
    // 로그 초기화 버튼 이벤트
    clearLogsBtn.addEventListener('click', function() {
        if (confirm('모든 활동 로그를 초기화하시겠습니까?')) {
            clearActivityLogs();
            
            // 로그 컨테이너 업데이트
            const logsContainer = overlay.querySelector('.logs-container');
            logsContainer.innerHTML = '<p class="no-logs">활동 로그가 없습니다.</p>';
            
            showNotification('활동 로그가 초기화되었습니다.', 'success');
        }
    });
    
    // 로그 다운로드 버튼 이벤트
    downloadLogsBtn.addEventListener('click', function() {
        try {
            const logs = getActivityLogs();
            
            // JSON으로 변환
            const jsonData = JSON.stringify(logs, null, 2);
            
            // 현재 시간을 포함한 파일명 생성
            const now = new Date();
            const dateStr = `${now.getFullYear()}${(now.getMonth() + 1).toString().padStart(2, '0')}${now.getDate().toString().padStart(2, '0')}`;
            const timeStr = `${now.getHours().toString().padStart(2, '0')}${now.getMinutes().toString().padStart(2, '0')}`;
            const fileName = `html-editor-logs-${dateStr}-${timeStr}.json`;
            
            // 다운로드 링크 생성
            const blob = new Blob([jsonData], { type: 'application/json' });
            const url = URL.createObjectURL(blob);
            
            // 다운로드 링크 생성 및 클릭
            const a = document.createElement('a');
            a.href = url;
            a.download = fileName;
            a.style.display = 'none';
            document.body.appendChild(a);
            a.click();
            
            // 자원 정리
            setTimeout(() => {
                document.body.removeChild(a);
                URL.revokeObjectURL(url);
            }, 100);
            
            showNotification('활동 로그가 다운로드되었습니다.', 'success');
            recordLog('로그 다운로드');
        } catch (error) {
            console.error('로그 다운로드 오류:', error);
            showNotification('로그 다운로드 중 오류가 발생했습니다.', 'error');
        }
    });
    
    // 로그 항목 클릭 이벤트 (상세 정보 토글)
    const logItems = overlay.querySelectorAll('.log-item');
    logItems.forEach(item => {
        item.addEventListener('click', function() {
            const detailsEl = this.querySelector('.log-details');
            
            // 넘치는 내용 토글
            if (detailsEl.style.whiteSpace === 'normal') {
                detailsEl.style.whiteSpace = 'nowrap';
                detailsEl.style.overflow = 'hidden';
                detailsEl.style.textOverflow = 'ellipsis';
            } else {
                detailsEl.style.whiteSpace = 'normal';
                detailsEl.style.overflow = 'visible';
                detailsEl.style.textOverflow = 'clip';
            }
        });
    });
}