// file-image.js: 이미지 변환 (해상도, 포맷, 품질, 비율 유지)
// Canvas API, FileReader, Blob 활용

function convertImageFile(file, options, callback) {
    const reader = new FileReader();
    reader.onload = function(e) {
        const img = new Image();
        img.onload = function() {
            let width = options.width || img.width;
            let height = options.height || img.height;
            if (options.keepAspect && options.width && options.height) {
                const ratio = img.width / img.height;
                if (width / height > ratio) width = Math.round(height * ratio);
                else height = Math.round(width / ratio);
            }
            const canvas = document.createElement('canvas');
            canvas.width = width;
            canvas.height = height;
            const ctx = canvas.getContext('2d');
            ctx.drawImage(img, 0, 0, width, height);
            let mime = 'image/jpeg';
            if (options.format === 'png') mime = 'image/png';
            else if (options.format === 'webp') mime = 'image/webp';
            canvas.toBlob(function(blob) {
                callback({ blob });
            }, mime, options.quality ? options.quality / 100 : 0.9);
        };
        img.onerror = function() {
            callback({ error: '이미지 로드 실패' });
        };
        img.src = e.target.result;
    };
    reader.onerror = function() {
        callback({ error: '파일 읽기 실패' });
    };
    reader.readAsDataURL(file);
}

function downloadImageFile(blob, filename) {
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
