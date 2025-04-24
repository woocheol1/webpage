/**
 * 웹 도구 모음집 공통 자바스크립트 함수
 * 최종 수정: 2025.04.23
 */

// 로깅 함수
function logAction(action, details = {}) {
    const timestamp = new Date().toISOString();
    const logEntry = {
        timestamp,
        action,
        details,
        page: window.location.pathname
    };

    console.log(`[LOG] ${action}:`, details);

    // PHP 서버에 로그 전송 (서버 측 로깅이 설정된 경우)
    try {
        fetch('/log.php', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(logEntry),
        })
        .then(response => {
            if (!response.ok) {
                console.warn('로그 서버 응답 오류:', response.status);
            }
        })
        .catch(error => {
            console.warn('로그 전송 실패:', error);
        });
    } catch (e) {
        console.warn('로그 전송 중 오류 발생:', e);
    }
}

// 요소 표시/숨김 토글
function toggleElement(elementId) {
    const element = document.getElementById(elementId);
    if (!element) {
        console.warn(`요소가 존재하지 않음: ${elementId}`);
        return;
    }

    if (element.style.display === 'none') {
        element.style.display = 'block';
        logAction('요소 표시', { elementId });
    } else {
        element.style.display = 'none';
        logAction('요소 숨김', { elementId });
    }
}

// 사용자에게 알림 표시
function showNotification(message, type = 'info', duration = 3000) {
    logAction('알림 표시', { message, type });

    // 이미 존재하는 알림 컨테이너 확인
    let notificationContainer = document.querySelector('.notification-container');

    // 없으면 새로 생성
    if (!notificationContainer) {
        notificationContainer = document.createElement('div');
        notificationContainer.className = 'notification-container';
        notificationContainer.style.position = 'fixed';
        notificationContainer.style.top = '20px';
        notificationContainer.style.right = '20px';
        notificationContainer.style.zIndex = '1000';
        document.body.appendChild(notificationContainer);
    }

    // 알림 요소 생성
    const notification = document.createElement('div');
    notification.className = `notification ${type}`;
    notification.innerHTML = message;

    // 스타일 설정
    notification.style.backgroundColor = type === 'error' ? '#f44336' : type === 'success' ? '#4CAF50' : '#2196F3';
    notification.style.color = 'white';
    notification.style.padding = '15px';
    notification.style.marginBottom = '10px';
    notification.style.borderRadius = '4px';
    notification.style.boxShadow = '0 2px 5px rgba(0,0,0,0.2)';
    notification.style.position = 'relative';
    notification.style.transition = 'opacity 0.5s ease';
    notification.style.opacity = '0';

    // 닫기 버튼
    const closeBtn = document.createElement('span');
    closeBtn.innerHTML = '&times;';
    closeBtn.style.position = 'absolute';
    closeBtn.style.top = '5px';
    closeBtn.style.right = '10px';
    closeBtn.style.cursor = 'pointer';
    closeBtn.onclick = function() {
        notificationContainer.removeChild(notification);
    };

    notification.appendChild(closeBtn);
    notificationContainer.appendChild(notification);

    // 부드러운 등장을 위한 타임아웃
    setTimeout(() => {
        notification.style.opacity = '1';
    }, 10);

    // 자동 제거 타이머
    setTimeout(() => {
        notification.style.opacity = '0';
        setTimeout(() => {
            if (notification.parentNode === notificationContainer) {
                notificationContainer.removeChild(notification);
            }
        }, 500);
    }, duration);
}

// URL 매개변수 가져오기
function getUrlParam(paramName) {
    const urlParams = new URLSearchParams(window.location.search);
    return urlParams.get(paramName);
}

// 로컬 스토리지에 설정 저장
function saveUserSetting(key, value) {
    try {
        localStorage.setItem(key, JSON.stringify(value));
        logAction('설정 저장', { key, value });
        return true;
    } catch (e) {
        console.error('설정 저장 실패:', e);
        return false;
    }
}

// 로컬 스토리지에서 설정 로드
function loadUserSetting(key, defaultValue = null) {
    try {
        const storedValue = localStorage.getItem(key);
        if (storedValue === null) {
            return defaultValue;
        }
        return JSON.parse(storedValue);
    } catch (e) {
        console.error('설정 로드 실패:', e);
        return defaultValue;
    }
}

// 텍스트 복사 기능
function copyToClipboard(text) {
    if (!text) {
        showNotification('복사할 텍스트가 없습니다.', 'error');
        return false;
    }

    try {
        navigator.clipboard.writeText(text).then(() => {
            showNotification('클립보드에 복사되었습니다.', 'success');
            logAction('텍스트 복사', { length: text.length });
        }).catch(err => {
            console.error('클립보드 복사 실패:', err);
            showNotification('클립보드 복사에 실패했습니다.', 'error');
        });
    } catch (e) {
        console.error('클립보드 접근 실패:', e);

        // 대체 방법 시도
        const textarea = document.createElement('textarea');
        textarea.value = text;
        textarea.style.position = 'fixed';
        textarea.style.opacity = '0';
        document.body.appendChild(textarea);
        textarea.select();

        try {
            const success = document.execCommand('copy');
            if (success) {
                showNotification('클립보드에 복사되었습니다.', 'success');
                logAction('텍스트 복사 (대체 방법)', { length: text.length });
            } else {
                showNotification('클립보드 복사에 실패했습니다.', 'error');
            }
        } catch (ex) {
            showNotification('클립보드 복사에 실패했습니다.', 'error');
        }

        document.body.removeChild(textarea);
    }
}

// 페이지 로드 완료 시 실행
document.addEventListener('DOMContentLoaded', function() {
    console.log('페이지 로드 완료:', window.location.pathname);

    // 뒤로가기 버튼 처리
    const backButtons = document.querySelectorAll('.back-button');
    backButtons.forEach(button => {
        button.addEventListener('click', function() {
            logAction('뒤로가기 버튼 클릭');
            window.location.href = '../index.html';
        });
    });

    // 다크 모드 설정 확인 및 적용
    const prefersDarkMode = loadUserSetting('darkMode', window.matchMedia('(prefers-color-scheme: dark)').matches);
    if (prefersDarkMode) {
        document.body.classList.add('dark-mode');
        logAction('다크 모드 적용');
    }
});

// 다크 모드 토글 함수
function toggleDarkMode() {
    const isDarkMode = document.body.classList.toggle('dark-mode');
    saveUserSetting('darkMode', isDarkMode);
    logAction('다크 모드 변경', { enabled: isDarkMode });
    return isDarkMode;
}

// 숫자 포맷팅 (천 단위 구분자)
function formatNumber(number) {
    return number.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",");
}

// 오류 처리 및 로깅
function handleError(error, context = '') {
    console.error(`오류 발생${context ? ` (${context})` : ''}: `, error);
    logAction('오류', { message: error.message, context });
    showNotification(`오류가 발생했습니다: ${error.message}`, 'error');
}

// 페이지 초기화 시 로딩 표시
function showLoading(containerId) {
    const container = document.getElementById(containerId);
    if (!container) return;

    container.innerHTML = '<div class="loading-container text-center"><div class="spinner"></div><p>로딩 중...</p></div>';
}

// 로딩 숨기기
function hideLoading(containerId) {
    const container = document.getElementById(containerId);
    if (!container) return;

    const loadingElement = container.querySelector('.loading-container');
    if (loadingElement) {
        container.removeChild(loadingElement);
    }
}

// 모바일 기기 감지
function isMobileDevice() {
    return /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
}

// 브라우저 언어 가져오기
function getBrowserLanguage() {
    return navigator.language || navigator.userLanguage;
}

// 날짜 포맷팅
function formatDate(date, format = 'YYYY-MM-DD') {
    const d = new Date(date);
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    const hours = String(d.getHours()).padStart(2, '0');
    const minutes = String(d.getMinutes()).padStart(2, '0');
    const seconds = String(d.getSeconds()).padStart(2, '0');

    return format
        .replace('YYYY', year)
        .replace('MM', month)
        .replace('DD', day)
        .replace('HH', hours)
        .replace('mm', minutes)
        .replace('ss', seconds);
}