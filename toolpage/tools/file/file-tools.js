// file-tools.js: Core logic for 파일 변환 도구
// Drag & Drop, Tab UI, Progress Bar, Toast, and Local File Processing

document.addEventListener('DOMContentLoaded', function () {
    // === 파일 상태 변수 전역 선언 및 일원화 ===
    let textFile = null;
    let imageFile = null;
    let manageFiles = null;

    // Tab switching
    const tabBtns = document.querySelectorAll('.tab-btn');
    const tabContents = document.querySelectorAll('.tab-content');
    tabBtns.forEach(btn => {
        btn.addEventListener('click', function () {
            tabBtns.forEach(b => b.classList.remove('active'));
            tabContents.forEach(tc => tc.classList.remove('active'));
            btn.classList.add('active');
            document.getElementById(btn.dataset.tab).classList.add('active');
        });
    });

    // Quality range live update
    const qualityInput = document.getElementById('image-quality');
    const qualityVal = document.getElementById('quality-val');
    if (qualityInput && qualityVal) {
        qualityInput.addEventListener('input', function () {
            qualityVal.textContent = qualityInput.value;
        });
    }

    // === handleFileDrop에서 파일 변수에 항상 저장 ===
    function handleFileDrop(areaId, files) {
        if (!files || files.length === 0) return;
        if (areaId === 'drop-area-text') {
            textFile = files[0];
            document.getElementById('result-area-text').innerHTML = `<span style='color:#228be6;'>${textFile.name}</span> 업로드됨`;
        } else if (areaId === 'drop-area-image') {
            imageFile = files[0];
            document.getElementById('result-area-image').innerHTML = `<span style='color:#228be6;'>${imageFile.name}</span> 업로드됨`;
        } else if (areaId === 'drop-area-manage') {
            manageFiles = files;
            document.getElementById('result-area-manage').innerHTML = Array.from(manageFiles).map(f=>`<span style='color:#228be6;'>${f.name}</span>`).join(', ') + ' 업로드됨';
        }
    }

    // Drag & Drop for each drop area
    document.querySelectorAll('.drop-area').forEach(area => {
        area.addEventListener('dragover', e => {
            e.preventDefault();
            area.classList.add('dragover');
        });
        area.addEventListener('dragleave', e => {
            area.classList.remove('dragover');
        });
        area.addEventListener('drop', e => {
            e.preventDefault();
            area.classList.remove('dragover');
            const files = e.dataTransfer.files;
            handleFileDrop(area.id, files);
        });
        // === 클릭 업로드도 handleFileDrop 사용 ===
        // 중복 방지: 기존 개별 클릭 핸들러 제거
        area.onclick = null;
        area.addEventListener('click', function(e) {
            // drag/drop 이벤트로 인한 클릭은 무시
            if (e.target !== area) return;
            const input = document.createElement('input');
            input.type = 'file';
            if (area.id === 'drop-area-manage') input.multiple = true;
            if (area.id === 'drop-area-image') input.accept = 'image/*';
            input.onchange = () => handleFileDrop(area.id, input.files);
            input.click();
        });
    });

    // --- 중복 클릭 업로드 방지: 개별 영역 클릭 핸들러 완전 제거 ---
    if (window.textDropArea) textDropArea.onclick = null;
    if (window.imageDropArea) imageDropArea.onclick = null;
    if (window.manageDropArea) manageDropArea.onclick = null;

    // Convert buttons
    document.getElementById('convert-text-btn').onclick = function() {
        if (!textFile) {
            showToast('먼저 텍스트 파일을 업로드하세요.');
            return;
        }
        const encoding = document.getElementById('encoding-select').value;
        const format = document.getElementById('format-select').value;
        showProgress('progress-bar-text', 30);
        convertTextFile(textFile, encoding, format, function(result) {
            if (result.error) {
                showProgress('progress-bar-text', 100);
                showToast(result.error);
                return;
            }
            showProgress('progress-bar-text', 100);
            showToast('텍스트 변환 완료!');
            document.getElementById('result-area-text').innerHTML =
                '<button id="download-text-btn">다운로드</button>';
            document.getElementById('download-text-btn').onclick = function() {
                downloadTextFile(result.output, 'converted.' + format, encoding);
                textFile = null;
                setTimeout(()=>{document.getElementById('result-area-text').innerHTML = '';}, 500);
            };
            logHistory('텍스트 변환', { file: textFile.name, encoding, format });
        });
    };

    document.getElementById('convert-image-btn').onclick = function() {
        if (!imageFile) {
            showToast('먼저 이미지 파일을 업로드하세요.');
            return;
        }
        const width = parseInt(document.getElementById('image-width').value) || undefined;
        const height = parseInt(document.getElementById('image-height').value) || undefined;
        const keepAspect = document.getElementById('keep-aspect').checked;
        const format = document.getElementById('image-format-select').value;
        const quality = parseInt(document.getElementById('image-quality').value) || 90;
        showProgress('progress-bar-image', 30);
        convertImageFile(imageFile, { width, height, keepAspect, format, quality }, function(result) {
            if (result.error) {
                showProgress('progress-bar-image', 100);
                showToast(result.error);
                return;
            }
            showProgress('progress-bar-image', 100);
            showToast('이미지 변환 완료!');
            document.getElementById('result-area-image').innerHTML =
                '<button id="download-image-btn">다운로드</button>';
            document.getElementById('download-image-btn').onclick = function() {
                const ext = format === 'jpeg' ? 'jpg' : format;
                downloadImageFile(result.blob, 'converted.' + ext);
                imageFile = null;
                setTimeout(()=>{document.getElementById('result-area-image').innerHTML = '';}, 500);
            };
            logHistory('이미지 변환', { file: imageFile.name, width, height, keepAspect, format, quality });
        });
    };

    // --- 일괄 리네이밍: 패턴 입력값 받아 적용 ---
    document.getElementById('rename-btn').onclick = function() {
        if (!manageFiles || manageFiles.length === 0) {
            showToast('먼저 파일을 업로드하세요.');
            return;
        }
        const pattern = document.getElementById('rename-pattern').value.trim();
        if (!pattern) {
            showToast('새 이름 패턴을 입력하세요.');
            return;
        }
        batchRenameFiles(manageFiles, (old, i) => {
            const ext = old.split('.').pop();
            const base = old.substring(0, old.lastIndexOf('.'));
            return pattern
                .replace(/\{num\}|\{\{num\}\}/g, (i+1).toString())
                .replace(/\{name\}|\{\{name\}\}/g, base)
                .replace(/\{ext\}|\{\{ext\}\}/g, ext);
        }, function(result) {
            if (result.error) {
                showToast(result.error);
                return;
            }
            showToast('리네이밍 완료!');
            document.getElementById('result-area-manage').innerHTML =
                result.files.map(f => f.name).join('<br>');
            manageFiles = null;
            setTimeout(()=>{document.getElementById('result-area-manage').innerHTML = '';}, 500);
            logHistory('리네이밍', { files: result.files.map(f=>f.name), pattern });
        });
    };

    // --- 편의 기능(미리보기, 옵션 저장/불러오기, 변환 기록) ---
    document.getElementById('preview-btn').onclick = function() {
        // 탭별로 최근 업로드/변환 파일 미리보기 (텍스트/이미지)
        let html = '';
        if (textFile) {
            html += '<h4>텍스트 미리보기</h4><pre style="max-height:180px;overflow:auto;"></pre>';
            const pre = document.createElement('pre');
            const reader = new FileReader();
            reader.onload = function(e) {
                pre.textContent = new TextDecoder('utf-8').decode(e.target.result).slice(0, 2000);
            };
            reader.readAsArrayBuffer(textFile);
            setTimeout(() => {
                document.querySelector('#result-area-utils').innerHTML = html;
                document.querySelector('#result-area-utils pre').replaceWith(pre);
            }, 150);
        } else if (imageFile) {
            html += '<h4>이미지 미리보기</h4><img style="max-width:220px;max-height:180px;display:block;">';
            const img = document.createElement('img');
            const reader = new FileReader();
            reader.onload = function(e) { img.src = e.target.result; };
            reader.readAsDataURL(imageFile);
            setTimeout(() => {
                document.querySelector('#result-area-utils').innerHTML = html;
                document.querySelector('#result-area-utils img').replaceWith(img);
            }, 150);
        } else {
            document.getElementById('result-area-utils').innerHTML = '<span style="color:#888">미리볼 파일이 없습니다.</span>';
        }
    };

    // 옵션 저장/불러오기 (localStorage)
    document.getElementById('save-options-btn').onclick = function() {
        const options = {
            encoding: document.getElementById('encoding-select').value,
            format: document.getElementById('format-select').value,
            imageFormat: document.getElementById('image-format-select').value,
            imageQuality: document.getElementById('image-quality').value,
            keepAspect: document.getElementById('keep-aspect').checked
        };
        localStorage.setItem('fileToolOptions', JSON.stringify(options));
        showToast('옵션이 저장되었습니다!');
    };
    document.getElementById('load-options-btn').onclick = function() {
        const options = JSON.parse(localStorage.getItem('fileToolOptions') || '{}');
        if (options.encoding) document.getElementById('encoding-select').value = options.encoding;
        if (options.format) document.getElementById('format-select').value = options.format;
        if (options.imageFormat) document.getElementById('image-format-select').value = options.imageFormat;
        if (options.imageQuality) document.getElementById('image-quality').value = options.imageQuality;
        if (options.keepAspect !== undefined) document.getElementById('keep-aspect').checked = options.keepAspect;
        showToast('옵션이 불러와졌습니다!');
    };

    // 변환 기록 로그 (간단히 localStorage에 저장/내보내기)
    function logHistory(action, detail) {
        const logs = JSON.parse(localStorage.getItem('fileToolLog') || '[]');
        logs.push({ time: new Date().toISOString(), action, detail });
        localStorage.setItem('fileToolLog', JSON.stringify(logs));
    }
    // 주요 변환/압축/해제/리네이밍 시 logHistory 호출 예시
    // logHistory('텍스트 변환', { file: textFile?.name });
    // logHistory('이미지 변환', { file: imageFile?.name });
    // logHistory('압축', { files: [...manageFiles].map(f=>f.name) });
    // logHistory('압축 해제', { file: zipFile?.name });
    // logHistory('리네이밍', { files: [...manageFiles].map(f=>f.name) });

    document.getElementById('export-log-btn').onclick = function() {
        const logs = localStorage.getItem('fileToolLog') || '[]';
        downloadTextFile(logs, 'filetool-log.json', 'utf-8');
        showToast('변환 기록이 내보내졌습니다!');
    };

    // 자동 저장 체크박스 (옵션 변경시 자동 저장)
    document.getElementById('auto-save').onchange = function() {
        if (this.checked) {
            ['encoding-select','format-select','image-format-select','image-quality','keep-aspect']
                .forEach(id => {
                    document.getElementById(id).addEventListener('change', () => {
                        document.getElementById('save-options-btn').click();
                    });
                });
        }
    };
    // 다국어 지원(샘플, 실제 번역은 별도 구현 필요)
    document.getElementById('i18n').onchange = function() {
        showToast('다국어 지원은 추후 제공 예정입니다.');
    };

    // --- UI/UX 개선: 안내 문구, 상태 초기화, 에러 처리 강화 ---
    // 드롭/업로드 시 파일명 표시 및 상태 초기화
    // 클릭 업로드 시에도 파일명 표시
    // 변환/다운로드 후 상태 초기화
    function resetTextState() {
        textFile = null;
        document.getElementById('result-area-text').innerHTML = '';
    }
    function resetImageState() {
        imageFile = null;
        document.getElementById('result-area-image').innerHTML = '';
    }
    function resetManageState() {
        manageFiles = null;
        document.getElementById('result-area-manage').innerHTML = '';
    }
    document.getElementById('download-text-btn')?.addEventListener('click', resetTextState);
    document.getElementById('download-image-btn')?.addEventListener('click', resetImageState);
    // 에러 발생 시 상세 안내
    window.addEventListener('error', function(e) {
        showToast('예상치 못한 오류가 발생했습니다: ' + e.message);
    });
    // 모바일/작은 화면 대응
    window.addEventListener('resize', function() {
        if (window.innerWidth < 600) {
            document.querySelector('.container.file-tool-container').style.padding = '14px 2px';
        } else {
            document.querySelector('.container.file-tool-container').style.padding = '32px 28px';
        }
    });
    // 최초 진입 시 안내
    showToast('파일 업로드 후 변환/관리를 시작하세요!');

    function showToast(msg) {
        const toast = document.getElementById('toast');
        toast.textContent = msg;
        toast.style.display = 'block';
        setTimeout(() => { toast.style.display = 'none'; }, 2500);
    }

    function showProgress(id, percent) {
        const bar = document.getElementById(id);
        if (!bar) return;
        bar.style.display = 'block';
        bar.style.width = percent + '%';
        bar.textContent = percent + '%';
        if (percent >= 100) setTimeout(() => { bar.style.display = 'none'; }, 800);
    }
});
