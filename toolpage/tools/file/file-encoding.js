// file-encoding.js: 텍스트 파일 인코딩 변환 및 포맷 변환 기능
// FileReader, TextDecoder, TextEncoder 활용

function convertTextFile(file, encoding, format, callback) {
    const reader = new FileReader();
    reader.onload = function(e) {
        let text;
        try {
            text = new TextDecoder(encoding).decode(e.target.result);
        } catch (err) {
            callback({ error: '인코딩 변환 실패: ' + err.message });
            return;
        }
        // 포맷 변환 (샘플: txt, md, json)
        let output = text;
        if (format === 'json') {
            output = JSON.stringify({ text });
        } else if (format === 'md') {
            output = '``' + '\n' + text + '\n' + '``';
        }
        callback({ output });
    };
    reader.onerror = function() {
        callback({ error: '파일 읽기 실패' });
    };
    reader.readAsArrayBuffer(file);
}

// 텍스트 파일 다운로드
function downloadTextFile(data, filename, encoding) {
    let blob;
    try {
        blob = new Blob([new TextEncoder(encoding).encode(data)], { type: 'text/plain' });
    } catch (e) {
        blob = new Blob([data], { type: 'text/plain' });
    }
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    setTimeout(() => {
        URL.revokeObjectURL(url);
        document.body.removeChild(a);
    }, 300);
}
