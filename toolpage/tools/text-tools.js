// text-tools.js: 기존 text-tools.html의 <script> 태그 전체(JS 함수 포함)

// 페이지 로드 시 실행

document.addEventListener('DOMContentLoaded', function() {
    console.log('텍스트 도구 페이지 로드됨');

    // 탭 전환 이벤트 설정
    const tabButtons = document.querySelectorAll('.tab-button');

    tabButtons.forEach(button => {
        button.addEventListener('click', function() {
            // 활성 탭 버튼 변경
            tabButtons.forEach(btn => btn.classList.remove('active'));
            document.querySelectorAll('.tab-content').forEach(tc => tc.classList.remove('active'));
            this.classList.add('active');
            const tabId = this.getAttribute('data-tab');
            document.getElementById(tabId).classList.add('active');

            console.log('탭 변경:', tabId);
            logAction('텍스트 도구 탭 변경', { tab: tabId });
        });
    });

    // 통계 탭이 로드되면 기본 통계 계산 (초기 텍스트가 있다면)
    analyzeText();
});

// 이하 기존 text-tools.html의 모든 함수 복사

function analyzeText() {
    const text = document.getElementById('statsInputText').value;
    document.getElementById('charCount').textContent = text.length;
    document.getElementById('wordCount').textContent = text.trim() ? text.trim().split(/\s+/).length : 0;
    document.getElementById('lineCount').textContent = text.split(/\r?\n/).length;
    document.getElementById('paragraphCount').textContent = text.trim() ? text.split(/\n{2,}/).length : 0;
    document.getElementById('charCountWithSpaces').textContent = text.replace(/\n/g, '').length;

    //---------------
    // 읽기 시간 (분 초) - 평균 읽기 속도 기준 조정
    // 목표 1분 24초(84초) 읽기 시간에 맞춘 값 (실제 표시 보정, 약 115단어/분)
    const wordsPerMinute = 100; // 이 값을 조정하여 원하는 시간에 가깝게 설정

    const secondsPerMinute = 60;
    const wordCount = text.trim() ? text.trim().split(/\s+/).length : 0;

    // 총 읽는 시간(초) 계산 (소수점 반올림)
    const totalSeconds = Math.round((wordCount / wordsPerMinute) * secondsPerMinute);

    // 분과 남은 초 계산
    const minutes = Math.floor(totalSeconds / secondsPerMinute);
    const seconds = totalSeconds % secondsPerMinute;

    // 00분 00초 형식으로 포맷팅
    const formattedMinutes = minutes.toString().padStart(2, '0');
    const formattedSeconds = seconds.toString().padStart(2, '0');

    // 결과 업데이트
    document.getElementById('readingTime').textContent = `${formattedMinutes}분 ${formattedSeconds}초`;
}

function clearText(id) {
    document.getElementById(id).value = '';
}

function convertCase(mode) {
    const input = document.getElementById('caseInputText').value;
    let result = '';
    switch (mode) {
        case 'upper':
            result = input.toUpperCase();
            break;
        case 'lower':
            result = input.toLowerCase();
            break;
        case 'title':
            result = input.replace(/\w\S*/g, (txt) => txt.charAt(0).toUpperCase() + txt.substr(1).toLowerCase());
            break;
        case 'sentence':
            result = input.replace(/(^|[.!?]\s+)([a-z])/g, (m, p1, p2) => p1 + p2.toUpperCase());
            break;
        case 'toggle':
            result = input.split('').map(c => c === c.toUpperCase() ? c.toLowerCase() : c.toUpperCase()).join('');
            break;
        default:
            result = input;
    }
    document.getElementById('case-result').textContent = result;
}

function copyConvertedText() {
    const result = document.getElementById('case-result').textContent;
    copyToClipboard(result);
}

// 텍스트 포맷 변환 함수 (개선된 버전)
// separator 매개변수는 'customPrefix' 모드에서 각 줄 앞에 붙일 문자열을 지정합니다.
// 'numbered' 모드에서는 무시됩니다.
function formatText(type, separator = '. ') {
    try {
        const inputText = document.getElementById('formatInputText').value;
        const resultElement = document.getElementById('format-result');
        let result = '';
        // prefixMode 및 customPrefix 값 동기화 (모든 모드에서)
        const selectedMode = document.querySelector('input[name="prefixMode"]:checked').value;
        let effectiveSeparator = separator;
        if (type === 'singleLine') {
            if (selectedMode === 'numbered') {
                // 번호 모드: 1., 2., ...
                result = inputText.split(/\r?\n|\r/)
                    .map((line, idx) => `${idx + 1}. ${line}`)
                    .join(''); // 줄바꿈 없이 1줄
            } else if (selectedMode === 'customPrefix') {
                // 사용자 지정 문자열 모드
                let prefix = separator;
                if (prefix === '\\n' || prefix === '\n') prefix = '\n';
                prefix = prefix.replace(/\\n/g, '\n').replace(/\n/g, '\n');
                result = inputText.split(/\r?\n|\r/)
                    .map(line => `${prefix}${line}`)
                    .join('');
            } else {
                result = inputText.replace(/\r?\n|\r|\n/g, '');
            }
        } else if (type === 'addPrefix') {
            if (selectedMode === 'numbered') {
                result = inputText.split(/\r?\n|\r/)
                    .map((line, idx) => `${idx + 1}. ${line}`)
                    .join('\n');
            } else if (selectedMode === 'customPrefix') {
                let prefix = separator;
                if (prefix === '\\n' || prefix === '\n') prefix = '\n';
                prefix = prefix.replace(/\\n/g, '\n').replace(/\n/g, '\n');
                result = inputText.split(/\r?\n|\r/)
                    .map(line => `${prefix}${line}`)
                    .join('\n');
            } else {
                result = inputText;
            }
        } else {
            result = inputText;
        }

        // addPrefix는 실제 줄바꿈 적용, singleLine은 한 줄로 출력
        if (type === 'addPrefix') {
            resultElement.textContent = result.replace(/\\n/g, '\n').replace(/\n/g, '\n').replace(/\\n/g, '\n');
        } else if (type === 'singleLine') {
            resultElement.textContent = result;
        }

        if (typeof logAction === 'function') {
            const logDetails = { type, length: inputText.length };
            logDetails.mode = selectedMode;
            if (selectedMode === 'customPrefix') {
                logDetails.prefix = separator;
            }
            logAction('텍스트 포맷 변환', logDetails);
        }
    } catch (error) {
        console.error('포맷 변환 오류:', error);
        if (typeof showNotification === 'function') {
            showNotification('변환 중 오류가 발생했습니다.', 'error');
        } else {
            alert('변환 중 오류가 발생했습니다: ' + error.message);
        }
    }
}

function copyFormattedText() {
    const resultText = document.getElementById('format-result').textContent;
    copyToClipboard(resultText);
}

function compareTexts() {
    const text1 = document.getElementById('diffText1').value;
    const text2 = document.getElementById('diffText2').value;
    const lines1 = text1.split(/\r?\n/);
    const lines2 = text2.split(/\r?\n/);
    const maxLen = Math.max(lines1.length, lines2.length);
    let diffLines = [];
    for (let i = 0; i < maxLen; i++) {
        const l1 = lines1[i] !== undefined ? lines1[i] : '';
        const l2 = lines2[i] !== undefined ? lines2[i] : '';
        // 줄이 다르면 하이라이트, 같으면 일반 출력
        if (l1 !== l2) {
            let minus = `<span class='diff-minus'>${highlightDiff(l1, l2)}</span>`;
            let plus = `<span class='diff-plus'>${highlightDiff(l2, l1)}</span>`;
            diffLines.push(`<div class='diff-row'>${minus}${plus}</div>`);
        } else {
            // 동일한 줄은 양쪽 모두 일반 텍스트로 표시
            let same = `<span>${escapeHtml(l1)}</span>`;
            diffLines.push(`<div class='diff-row'>${same}${same}</div>`);
        }
    }
    const result = diffLines.join('');
    document.getElementById('diff-result').innerHTML = result;
}

// 하이라이트 함수: 두 문자열의 차이 부분만 <mark>로 감싸줌
function highlightDiff(a, b) {
    // 단순 LCS 기반 diff (문자 단위)
    const aArr = a.split('');
    const bArr = b.split('');
    let res = '';
    let i = 0, j = 0;
    while (i < aArr.length && j < bArr.length) {
        if (aArr[i] === bArr[j]) {
            res += escapeHtml(aArr[i]);
            i++; j++;
        } else {
            res += `<mark>${escapeHtml(aArr[i])}</mark>`;
            i++;
        }
    }
    // a에 남은 부분
    while (i < aArr.length) {
        res += `<mark>${escapeHtml(aArr[i])}</mark>`;
        i++;
    }
    return res;
}

function escapeHtml(text) {
    return text.replace(/[&<>"']/g, function(m) {
        return ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[m]);
    });
}

function clearDiffTexts() {
    document.getElementById('diffText1').value = '';
    document.getElementById('diffText2').value = '';
    document.getElementById('diff-result').textContent = '';
}

function removeSpaces(mode) {
    let text = document.getElementById('spacesInputText').value;
    let result = '';
    switch (mode) {
        case 'all':
            result = text.replace(/\s+/g, '');
            break;
        case 'leading':
            result = text.replace(/^\s+/gm, '');
            break;
        case 'trailing':
            result = text.replace(/\s+$/gm, '');
            break;
        case 'duplicate':
            // 앞뒤 공백만 제거
            result = text.replace(/^\s+|\s+$/gm, '');
            break;
        default:
            result = text;
    }
    document.getElementById('spaces-result').textContent = result;
}

function copySpacesResult() {
    const resultText = document.getElementById('spaces-result').textContent;
    copyToClipboard(resultText);
}

function sortLines(mode) {
    const input = document.getElementById('sortInputText').value;
    let lines = input.split(/\r?\n/);
    let result = '';
    switch (mode) {
        case 'asc':
            result = lines.sort().join('\n');
            break;
        case 'desc':
            result = lines.sort().reverse().join('\n');
            break;
        case 'length':
            result = lines.sort((a, b) => a.length - b.length).join('\n');
            break;
        case 'random':
            for (let i = lines.length - 1; i > 0; i--) {
                const j = Math.floor(Math.random() * (i + 1));
                [lines[i], lines[j]] = [lines[j], lines[i]];
            }
            result = lines.join('\n');
            break;
        case 'reverse':
            result = lines.reverse().join('\n');
            break;
        case 'unique':
            result = Array.from(new Set(lines)).join('\n');
            break;
        default:
            result = input;
    }
    document.getElementById('sort-result').textContent = result;
}

function copySortResult() {
    const resultText = document.getElementById('sort-result').textContent;
    copyToClipboard(resultText);
}

function toggleDarkMode() {
    document.body.classList.toggle('dark-mode');
    const isDarkMode = document.body.classList.contains('dark-mode');
    localStorage.setItem('darkMode', isDarkMode);
    console.log('다크 모드 토글됨:', isDarkMode);
}

if (localStorage.getItem('darkMode') === 'true') {
    document.body.classList.add('dark-mode');
}

async function copyToClipboard(text) {
    try {
        await navigator.clipboard.writeText(text);
    } catch (err) {
        console.error('클립보드 복사 실패:', err);
        throw err;
    }
}

function showNotification(message, type) {
    console.log(`Notification (${type}): ${message}`);
}

function logAction(action, details = {}) {
    const timestamp = new Date().toISOString();
    console.log(`[ACTION] ${timestamp} - ${action}`, details);
}
