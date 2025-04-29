// file-manage.js: 파일 압축/해제/리네이밍 기능 (JSZip 활용)
// JSZip CDN 필요: https://cdnjs.cloudflare.com/ajax/libs/jszip/3.10.1/jszip.min.js

function compressFiles(files, callback) {
    if (!window.JSZip) {
        callback({ error: 'JSZip 라이브러리를 불러오지 못했습니다.' });
        return;
    }
    const zip = new JSZip();
    Array.from(files).forEach(f => zip.file(f.name, f));
    zip.generateAsync({ type: 'blob' }, function update(meta) {
        if (callback.onProgress) callback.onProgress(meta.percent);
    }).then(function(blob) {
        callback({ blob });
    }).catch(function(err) {
        callback({ error: err.message });
    });
}

function decompressZipFile(file, callback) {
    if (!window.JSZip) {
        callback({ error: 'JSZip 라이브러리를 불러오지 못했습니다.' });
        return;
    }
    const zip = new JSZip();
    zip.loadAsync(file).then(function(zipData) {
        const files = [];
        const promises = [];
        zip.forEach(function (relPath, zipEntry) {
            promises.push(zipEntry.async('blob').then(function(content) {
                files.push({ name: relPath, blob: content });
            }));
        });
        Promise.all(promises).then(function() {
            callback({ files });
        });
    }).catch(function(err) {
        callback({ error: err.message });
    });
}

function batchRenameFiles(files, renameFn, callback) {
    // renameFn: (oldName, idx) => newName
    const renamed = Array.from(files).map((f, i) => {
        return new File([f], renameFn(f.name, i), { type: f.type });
    });
    callback({ files: renamed });
}

function downloadBlob(blob, filename) {
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
