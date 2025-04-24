/**
 * image-tools.js - 이미지 도구 페이지 스크립트
 */

// DOM 요소 참조
const imageUpload = document.getElementById('image-upload');
const imageCanvas = document.getElementById('image-canvas');
const uploadPrompt = document.getElementById('upload-prompt');
const ctx = imageCanvas.getContext('2d'); // 2D 렌더링 컨텍스트
const cropInfo = document.getElementById('crop-info'); // 자르기 정보 표시 영역

// 리사이즈 입력 요소
const resizeWidthInput = document.getElementById('resize-width');
const resizeHeightInput = document.getElementById('resize-height');
const aspectRatioCheckbox = document.getElementById('aspect-ratio');

// 조정 슬라이더 및 값 표시 요소
const brightnessSlider = document.getElementById('brightness');
const contrastSlider = document.getElementById('contrast');
const saturationSlider = document.getElementById('saturation');
const brightnessValSpan = document.getElementById('brightness-val');
const contrastValSpan = document.getElementById('contrast-val');
const saturationValSpan = document.getElementById('saturation-val');

// 출력 옵션 요소
const outputFormatSelect = document.getElementById('output-format');
const jpegQualityGroup = document.getElementById('jpeg-quality-group');
const jpegQualitySlider = document.getElementById('jpeg-quality');
const jpegQualityValSpan = document.getElementById('jpeg-quality-val');

// 워터마크 요소
const watermarkTextInput = document.getElementById('watermark-text');
const watermarkSizeInput = document.getElementById('watermark-size');
const watermarkColorInput = document.getElementById('watermark-color-input');
const watermarkOpacitySlider = document.getElementById('watermark-opacity');
const watermarkOpacityValSpan = document.getElementById('watermark-opacity-val');
const watermarkPositionSelect = document.getElementById('watermark-position');


// 이미지 관련 변수
let originalImage = null; // 원본 이미지 객체 (자르기 시 업데이트됨)
let initialImage = null; // 최초 로드된 원본 이미지 객체 (리셋용)
let currentImage = null; // 현재 캔버스에 그려진 이미지 데이터 (ImageData) - 효과 적용 후 저장
let originalWidth = 0;
let originalHeight = 0;
let currentFilters = {}; // 현재 적용된 필터 { filterName: true }
let currentAdjustments = { brightness: 100, contrast: 100, saturation: 100 }; // 현재 적용된 조정값

// 자르기 관련 변수
let isCropping = false;
let cropStartX, cropStartY, cropCurrentX, cropCurrentY;
let selectionRectDiv = null; // 자르기 선택 영역 표시용 div
let isDragging = false;

// 워터마크 관련 변수
let currentWatermark = null; // { text, size, color, opacity, position }


// --- 초기화 ---
document.addEventListener('DOMContentLoaded', () => {
    console.log('이미지 도구 페이지 로드됨');
    setupEventListeners();

    // coloris 초기화 (워터마크 색상 피커 위해)
    if (typeof Coloris === 'function') {
        Coloris({ el: '#watermark-color-input', theme: 'default', format: 'hex', themeMode: 'auto' });
    } else {
        console.warn("Coloris library not found.");
    }

    // 초기 다크 모드 확인 및 적용 (common.js 필요)
    if (typeof loadUserSetting === 'function') {
        const prefersDarkMode = loadUserSetting('darkMode', window.matchMedia('(prefers-color-scheme: dark)').matches);
        if (prefersDarkMode) {
            document.body.classList.add('dark-mode');
        }
    }

    // JPEG 품질 슬라이더 초기 표시 설정
    updateJpegQualityVisibility(); // 함수로 분리
});

// --- 이벤트 리스너 설정 ---
function setupEventListeners() {
    // 이미지 업로드 리스너
    imageUpload.addEventListener('change', handleImageUpload);

    // 리사이즈 관련 리스너
    document.getElementById('btn-resize').addEventListener('click', applyResize);
    // 비율 유지 시 입력 자동 조정 (선택 사항)
    resizeWidthInput.addEventListener('input', handleResizeInput);
    resizeHeightInput.addEventListener('input', handleResizeInput);


    // 회전/반전 버튼 리스너
    document.getElementById('btn-rotate-left').addEventListener('click', () => applyRotation(-90));
    document.getElementById('btn-rotate-right').addEventListener('click', () => applyRotation(90));
    document.getElementById('btn-flip-h').addEventListener('click', applyFlipHorizontal);
    document.getElementById('btn-flip-v').addEventListener('click', applyFlipVertical);

    // 자르기 관련 리스너
    document.getElementById('btn-crop-start').addEventListener('click', startCropping);
    document.getElementById('btn-crop-apply').addEventListener('click', applyCrop);
    document.getElementById('btn-crop-cancel').addEventListener('click', cancelCropping);
    // 캔버스 마우스 이벤트
    imageCanvas.addEventListener('mousedown', handleCropMouseDown);
    imageCanvas.addEventListener('mousemove', handleCropMouseMove);
    imageCanvas.addEventListener('mouseup', handleCropMouseUp);
    document.addEventListener('mouseup', handleCropMouseUp); // 캔버스 밖에서 mouseup 처리

    // 필터 버튼 리스너 (이벤트 위임)
    const filterButtonGroup = document.querySelector('.control-section:nth-of-type(3) .button-group');
    if (filterButtonGroup) {
        filterButtonGroup.addEventListener('click', (event) => {
            if (event.target.classList.contains('action-button') && event.target.dataset.filter) {
                applyFilter(event.target.dataset.filter);
            }
        });
    }
    document.getElementById('btn-reset-filters').addEventListener('click', resetFilters);

    // 색상 조정 슬라이더 리스너
    brightnessSlider.addEventListener('input', handleAdjustmentChange);
    contrastSlider.addEventListener('input', handleAdjustmentChange);
    saturationSlider.addEventListener('input', handleAdjustmentChange);
    document.getElementById('btn-reset-adj').addEventListener('click', resetAdjustments);

    // 워터마크 관련 리스너
    watermarkOpacitySlider.addEventListener('input', handleWatermarkOpacityChange);
    document.getElementById('btn-add-watermark').addEventListener('click', applyWatermark);

    // 출력 포맷 변경 리스너
     outputFormatSelect.addEventListener('change', updateJpegQualityVisibility);
     jpegQualitySlider.addEventListener('input', () => {
        if(jpegQualityValSpan) jpegQualityValSpan.textContent = `${jpegQualitySlider.value}%`;
     });

    // 다운로드 버튼 리스너
    document.getElementById('btn-download').addEventListener('click', downloadImage);

    // 전체 초기화 버튼 리스너
    document.getElementById('btn-reset-all').addEventListener('click', resetAll);
}

// --- 이미지 로드 ---
function handleImageUpload(event) {
    const file = event.target.files[0];
    if (file && file.type.startsWith('image/')) {
        const reader = new FileReader();
        reader.onload = (e) => {
            // 최초 원본 이미지는 별도 저장
            initialImage = new Image();
            initialImage.onload = () => {
                // 작업용 원본 이미지(originalImage)도 초기화
                originalImage = new Image();
                originalImage.onload = () => {
                    originalWidth = originalImage.width;
                    originalHeight = originalImage.height;
                    resetCanvasAndDrawImage(originalImage);
                    uploadPrompt.style.display = 'none';
                    imageCanvas.style.display = 'block';
                    updateResizeInputs(originalWidth, originalHeight);
                    resetAllStates(); // 상태 초기화
                    console.log(`Image loaded: ${originalWidth}x${originalHeight}`);
                    if (typeof logAction === 'function') logAction('이미지 업로드', { width: originalWidth, height: originalHeight });
                };
                 originalImage.onerror = handleImageLoadError;
                 originalImage.src = e.target.result; // 작업용 원본에도 로드
            };
            initialImage.onerror = handleImageLoadError;
            initialImage.src = e.target.result; // 최초 원본 로드
        };
        reader.onerror = () => {
             console.error("Error reading file.");
             if (typeof showNotification === 'function') showNotification("파일을 읽는 중 오류가 발생했습니다.", "error");
             resetImageArea();
        };
        reader.readAsDataURL(file);
    } else {
        console.warn("No valid image file selected.");
        if (file && typeof showNotification === 'function') {
            showNotification("유효한 이미지 파일 형식이 아닙니다.", "warning");
        }
        // resetImageArea(); // 파일 선택 취소 시에는 초기화 안 함
    }
}

function handleImageLoadError() {
    console.error("Error loading image.");
    if (typeof showNotification === 'function') showNotification("이미지를 로드하는 중 오류가 발생했습니다.", "error");
    resetImageArea();
}


// 캔버스 초기화 및 이미지 그리기
function resetCanvasAndDrawImage(img, width = img.width, height = img.height) {
    // 캔버스 크기 설정
    imageCanvas.width = Math.round(width); // 정수로 설정
    imageCanvas.height = Math.round(height);

    // 캔버스 클리어 및 이미지 그리기
    ctx.clearRect(0, 0, imageCanvas.width, imageCanvas.height);
    ctx.drawImage(img, 0, 0, imageCanvas.width, imageCanvas.height);

    // 현재 이미지 데이터 저장 (효과 적용의 베이스)
    currentImage = ctx.getImageData(0, 0, imageCanvas.width, imageCanvas.height);
    console.log(`Canvas updated: ${imageCanvas.width}x${imageCanvas.height}`);
}

// 리사이즈 입력 필드 업데이트
function updateResizeInputs(width, height) {
    resizeWidthInput.value = Math.round(width);
    resizeHeightInput.value = Math.round(height);
}

// 이미지 영역 초기화 (업로드 전 상태로)
function resetImageArea() {
    imageCanvas.style.display = 'none';
    uploadPrompt.style.display = 'block';
    originalImage = null;
    initialImage = null;
    currentImage = null;
    originalWidth = 0;
    originalHeight = 0;
    updateResizeInputs('', '');
    imageUpload.value = null;
    resetAllStates();
    console.log("Image area reset.");
}

// 필터, 조정 등 모든 상태 초기화
function resetAllStates() {
    currentFilters = {};
    resetAdjustmentsUI();
    cancelCropping();
    currentWatermark = null;
    // 워터마크 UI 초기화 (선택적)
    // watermarkTextInput.value = '';
    // watermarkSizeInput.value = 30;
    // watermarkColorInput.value = '#ffffff'; // Coloris 값 변경 API 필요 시 사용
    // watermarkOpacitySlider.value = 50;
    // watermarkOpacityValSpan.textContent = '50%';
    // watermarkPositionSelect.value = 'bottom-right';
    console.log("All states reset.");
}

// --- 기능 구현 함수 ---

// 리사이즈 입력 핸들러 (비율 유지 자동 계산)
function handleResizeInput(event) {
    if (!originalImage || !aspectRatioCheckbox.checked) return;

    const aspectRatio = originalWidth / originalHeight;
    const changedInput = event.target.id; // 'resize-width' or 'resize-height'

    if (changedInput === 'resize-width') {
        const newWidth = parseInt(resizeWidthInput.value);
        if (newWidth > 0) {
            resizeHeightInput.value = Math.round(newWidth / aspectRatio);
        } else {
             resizeHeightInput.value = ''; // 너비 무효 시 높이도 초기화
        }
    } else if (changedInput === 'resize-height') {
        const newHeight = parseInt(resizeHeightInput.value);
        if (newHeight > 0) {
            resizeWidthInput.value = Math.round(newHeight * aspectRatio);
        } else {
            resizeWidthInput.value = ''; // 높이 무효 시 너비도 초기화
        }
    }
}


function applyResize() {
    if (!originalImage) return; // 작업할 원본 이미지가 있는지 확인

    let targetWidth = parseInt(resizeWidthInput.value) || originalWidth;
    let targetHeight = parseInt(resizeHeightInput.value) || originalHeight;

    // 비율 유지 로직 한 번 더 확인 (버튼 클릭 시점)
    if (aspectRatioCheckbox.checked) {
        const aspectRatio = originalWidth / originalHeight;
        // 마지막으로 유효한 입력값 기준 (너비 우선)
        if (targetWidth !== originalWidth) {
             targetHeight = Math.round(targetWidth / aspectRatio);
        } else if (targetHeight !== originalHeight) {
            targetWidth = Math.round(targetHeight * aspectRatio);
        }
         // 둘 다 변경 안됐으면 원본 크기 유지
    }


    if (targetWidth <= 0 || targetHeight <= 0) {
        if (typeof showNotification === 'function') showNotification("유효한 크기 값을 입력하세요.", "warning");
        return;
    }

    targetWidth = Math.round(targetWidth);
    targetHeight = Math.round(targetHeight);

    console.log(`Applying resize to ${targetWidth}x${targetHeight}`);

    // 임시 캔버스를 사용하여 리사이즈 (품질 향상)
    const tempCanvas = document.createElement('canvas');
    tempCanvas.width = targetWidth;
    tempCanvas.height = targetHeight;
    const tempCtx = tempCanvas.getContext('2d');

    // 원본 이미지(initialImage)를 사용하여 리사이즈 (항상 최초 원본 기준)
    tempCtx.drawImage(initialImage, 0, 0, targetWidth, targetHeight);

    // 현재 작업 캔버스 업데이트
    imageCanvas.width = targetWidth;
    imageCanvas.height = targetHeight;
    ctx.drawImage(tempCanvas, 0, 0);

    // currentImage 데이터 업데이트 (다음 효과 적용 위해)
    currentImage = ctx.getImageData(0, 0, targetWidth, targetHeight);

    // 작업용 원본 이미지(originalImage)도 리사이즈된 이미지로 업데이트 (다음 리사이즈 기준)
    originalWidth = targetWidth;
    originalHeight = targetHeight;
    originalImage.src = tempCanvas.toDataURL(); // 리사이즈된 이미지를 새 원본으로
    originalImage.onload = () => {
        // 리사이즈 후 필터/조정/워터마크 재적용
        applyAllEffects();
         if (typeof logAction === 'function') logAction('이미지 리사이즈', { width: targetWidth, height: targetHeight });
    };
     originalImage.onerror = () => { console.error("Error reloading resized image");}
}

function applyRotation(degrees) {
    if (!currentImage || !originalImage) return;
    console.log(`Applying rotation: ${degrees} degrees`);

    const w = imageCanvas.width;
    const h = imageCanvas.height;
    const rad = degrees * Math.PI / 180;
    const cos = Math.abs(Math.cos(rad)); // 절대값 사용
    const sin = Math.abs(Math.sin(rad)); // 절대값 사용

    // 회전 후 새 바운딩 박스 크기 계산
    const newWidth = Math.round(w * cos + h * sin);
    const newHeight = Math.round(w * sin + h * cos);

    const tempCanvas = document.createElement('canvas');
    tempCanvas.width = newWidth;
    tempCanvas.height = newHeight;
    const tempCtx = tempCanvas.getContext('2d');

    // 새 캔버스의 중심으로 이동
    tempCtx.translate(newWidth / 2, newHeight / 2);
    tempCtx.rotate(rad); // 회전

    // 원본 이미지(originalImage)를 회전된 중심에 그림
    tempCtx.drawImage(originalImage, -originalWidth / 2, -originalHeight / 2, originalWidth, originalHeight);

    // 현재 작업 캔버스 업데이트
    imageCanvas.width = newWidth;
    imageCanvas.height = newHeight;
    ctx.drawImage(tempCanvas, 0, 0);

    // 상태 업데이트
    originalWidth = newWidth;
    originalHeight = newHeight;
    originalImage.src = tempCanvas.toDataURL();
    originalImage.onload = () => {
        currentImage = ctx.getImageData(0, 0, newWidth, newHeight);
        updateResizeInputs(newWidth, newHeight);
        applyAllEffects(); // 효과 재적용
        if (typeof logAction === 'function') logAction('이미지 회전', { degrees });
    }
     originalImage.onerror = () => { console.error("Error reloading rotated image");}
}


function applyFlipHorizontal() {
     if (!currentImage || !originalImage) return;
     console.log("Applying horizontal flip");
     const w = imageCanvas.width;
     const h = imageCanvas.height;

     // 원본 이미지 기준으로 플립
     const tempCanvas = document.createElement('canvas');
     tempCanvas.width = originalWidth; // 원본 너비
     tempCanvas.height = originalHeight; // 원본 높이
     const tempCtx = tempCanvas.getContext('2d');

     tempCtx.translate(originalWidth, 0);
     tempCtx.scale(-1, 1);
     tempCtx.drawImage(originalImage, 0, 0, originalWidth, originalHeight);

     // 현재 작업 캔버스 업데이트 (현재 캔버스 크기 유지)
     ctx.clearRect(0, 0, w, h);
     ctx.drawImage(tempCanvas, 0, 0, w, h); // 현재 크기로 그림

     // 상태 업데이트
     originalImage.src = tempCanvas.toDataURL();
     originalImage.onload = () => {
        currentImage = ctx.getImageData(0, 0, w, h);
        applyAllEffects(); // 효과 재적용
        if (typeof logAction === 'function') logAction('이미지 좌우반전');
     }
     originalImage.onerror = () => { console.error("Error reloading flipped image");}
}

function applyFlipVertical() {
     if (!currentImage || !originalImage) return;
     console.log("Applying vertical flip");
     const w = imageCanvas.width;
     const h = imageCanvas.height;

     const tempCanvas = document.createElement('canvas');
     tempCanvas.width = originalWidth;
     tempCanvas.height = originalHeight;
     const tempCtx = tempCanvas.getContext('2d');

     tempCtx.translate(0, originalHeight);
     tempCtx.scale(1, -1);
     tempCtx.drawImage(originalImage, 0, 0, originalWidth, originalHeight);

     ctx.clearRect(0, 0, w, h);
     ctx.drawImage(tempCanvas, 0, 0, w, h);

     originalImage.src = tempCanvas.toDataURL();
      originalImage.onload = () => {
        currentImage = ctx.getImageData(0, 0, w, h);
        applyAllEffects();
        if (typeof logAction === 'function') logAction('이미지 상하반전');
      }
      originalImage.onerror = () => { console.error("Error reloading flipped image");}
}

function applyFilter(filterName) {
    if (!originalImage) return;
    console.log(`Applying filter: ${filterName}`);
    // 필터 상태 토글 또는 설정 (여기서는 간단히 추가/교체)
    if (currentFilters[filterName]) {
        delete currentFilters[filterName]; // 다시 누르면 필터 제거
    } else {
        currentFilters[filterName] = true;
    }
    applyAllEffects();
    if (typeof logAction === 'function') logAction('이미지 필터 적용', { filter: filterName });
}

function resetFilters() {
     if (!originalImage) return;
     console.log("Resetting filters");
     currentFilters = {};
     applyAllEffects();
     if (typeof logAction === 'function') logAction('이미지 필터 초기화');
}

function handleAdjustmentChange(event) {
    if (!originalImage) return;
    const type = event.target.id;
    const value = parseInt(event.target.value);
    currentAdjustments[type] = value;
    const valueSpan = document.getElementById(`${type}-val`);
    if (valueSpan) {
         valueSpan.textContent = `${value}%`;
    }
    console.log(`Adjustment changed: ${type} = ${value}%`);
    applyAllEffects(); // 실시간 적용
}

function resetAdjustments() {
     if (!originalImage) return;
     console.log("Resetting adjustments");
     resetAdjustmentsUI();
     applyAllEffects();
     if (typeof logAction === 'function') logAction('이미지 조정 초기화');
}

function resetAdjustmentsUI() {
    currentAdjustments = { brightness: 100, contrast: 100, saturation: 100 };
    brightnessSlider.value = 100;
    contrastSlider.value = 100;
    saturationSlider.value = 100;
    if(brightnessValSpan) brightnessValSpan.textContent = '100%';
    if(contrastValSpan) contrastValSpan.textContent = '100%';
    if(saturationValSpan) saturationValSpan.textContent = '100%';
}


// --- 자르기 기능 함수 ---
function startCropping() {
    if (!originalImage) return;
    isCropping = true;
    imageCanvas.classList.add('cropping');
    cropInfo.textContent = "이미지 위에서 원하는 영역을 드래그하세요.";
    document.getElementById('btn-crop-start').style.display = 'none';
    document.getElementById('btn-crop-apply').style.display = 'inline-block';
    document.getElementById('btn-crop-cancel').style.display = 'inline-block';
    document.getElementById('btn-crop-apply').disabled = true;
    console.log("Cropping started.");
}

function cancelCropping() {
    if (!isCropping && !selectionRectDiv) return;
    isCropping = false;
    isDragging = false; // 드래그 상태도 초기화
    imageCanvas.classList.remove('cropping');
    cropInfo.textContent = "";
    document.getElementById('btn-crop-start').style.display = 'inline-block';
    document.getElementById('btn-crop-apply').style.display = 'none';
    document.getElementById('btn-crop-cancel').style.display = 'none';
    removeSelectionRect();
    console.log("Cropping cancelled.");
}

// applyCrop 함수 수정: 좌표 계산 방식 변경 대응
function applyCrop() {
    if (!selectionRectDiv || !initialImage) return; // initialImage 사용 확인

    const rect = getSelectionRectCoords(); // 이미 캔버스 기준 좌표
    if (!rect || rect.width <= 0 || rect.height <= 0) {
        console.warn("Invalid crop area selected.");
        cancelCropping();
        return;
    }

    console.log(`Applying crop (canvas coords): x=${rect.x}, y=${rect.y}, w=${rect.width}, h=${rect.height}`);

    // 캔버스에 표시된 크기와 실제 이미지 데이터 크기 간의 비율 계산
    // 주의: originalImage가 아닌 initialImage 기준이어야 함
    const scaleX = initialImage.naturalWidth / imageCanvas.offsetWidth;
    const scaleY = initialImage.naturalHeight / imageCanvas.offsetHeight;


    // 실제 이미지 데이터 기준 자르기 좌표 계산
    const sourceX = rect.x * scaleX;
    const sourceY = rect.y * scaleY;
    const sourceWidth = rect.width * scaleX;
    const sourceHeight = rect.height * scaleY;

    // 좌표값이 이미지 경계를 벗어나지 않도록 조정 (이미지 데이터 기준)
    const clampedSourceX = Math.max(0, sourceX);
    const clampedSourceY = Math.max(0, sourceY);
    const clampedSourceWidth = Math.min(initialImage.naturalWidth - clampedSourceX, sourceWidth);
    const clampedSourceHeight = Math.min(initialImage.naturalHeight - clampedSourceY, sourceHeight);

    if (clampedSourceWidth <= 0 || clampedSourceHeight <= 0) {
        console.error("Calculated crop area is invalid based on image data.");
        if (typeof showNotification === 'function') showNotification("유효하지 않은 영역이 선택되었습니다.", "error");
        cancelCropping();
        return;
    }


    try {
        const tempCanvas = document.createElement('canvas');
        tempCanvas.width = clampedSourceWidth;
        tempCanvas.height = clampedSourceHeight;
        const tempCtx = tempCanvas.getContext('2d');

        // 최초 원본 이미지(initialImage)에서 영역을 잘라 임시 캔버스에 그림
        tempCtx.drawImage(initialImage,
            clampedSourceX, clampedSourceY, clampedSourceWidth, clampedSourceHeight,
            0, 0, clampedSourceWidth, clampedSourceHeight
        );

        // 자른 이미지를 새로운 initialImage 및 originalImage 로 설정
        const croppedImageDataUrl = tempCanvas.toDataURL();
        initialImage.src = croppedImageDataUrl; // 새 최초 원본
        originalImage.src = croppedImageDataUrl; // 새 작업용 원본

        initialImage.onload = () => { // 최초 원본 로드 완료 후
            originalImage.onload = () => { // 작업용 원본 로드 완료 후
                originalWidth = originalImage.width;
                originalHeight = originalImage.height;
                resetCanvasAndDrawImage(originalImage); // 새 이미지로 캔버스 리셋
                updateResizeInputs(originalWidth, originalHeight);
                resetAllStates(); // 필터 등 초기화 (자르기 후)
                console.log("Crop applied successfully.");
                if (typeof logAction === 'function') logAction('이미지 자르기', { width: originalWidth, height: originalHeight });
            };
             originalImage.onerror = handleImageLoadError;
        }
         initialImage.onerror = handleImageLoadError;


    } catch (e) {
        console.error("Error during crop operation:", e);
        if (typeof showNotification === 'function') showNotification("이미지 자르기 중 오류 발생.", "error");
    } finally {
        cancelCropping();
    }
}

// --- 자르기 마우스 이벤트 핸들러 ---
function handleCropMouseDown(event) {
    if (!isCropping) return;
    event.preventDefault();
    isDragging = true;

    // 캔버스의 화면상 위치 정보 가져오기
    const rect = imageCanvas.getBoundingClientRect();

    // 클릭 좌표를 캔버스 내부 좌표로 변환
    cropStartX = event.clientX - rect.left;
    cropStartY = event.clientY - rect.top;

    // 좌표가 캔버스 경계 내에 있는지 확인
    cropStartX = Math.max(0, Math.min(cropStartX, imageCanvas.offsetWidth));
    cropStartY = Math.max(0, Math.min(cropStartY, imageCanvas.offsetHeight));

    cropCurrentX = cropStartX;
    cropCurrentY = cropStartY;

    removeSelectionRect();
    createSelectionRect();
    // updateSelectionRect는 캔버스 내부 좌표를 사용
    updateSelectionRect(cropStartX, cropStartY, 0, 0);
    document.getElementById('btn-crop-apply').disabled = true;
}

function handleCropMouseMove(event) {
    if (!isCropping || !isDragging) return;
    const rect = imageCanvas.getBoundingClientRect();

    // 현재 마우스 위치를 캔버스 내부 좌표로 변환
    cropCurrentX = event.clientX - rect.left;
    cropCurrentY = event.clientY - rect.top;

    // 좌표가 캔버스 경계 내에 있는지 확인
    cropCurrentX = Math.max(0, Math.min(cropCurrentX, imageCanvas.offsetWidth));
    cropCurrentY = Math.max(0, Math.min(cropCurrentY, imageCanvas.offsetHeight));

    // 선택 영역의 좌상단 좌표와 너비/높이 계산
    const x = Math.min(cropStartX, cropCurrentX);
    const y = Math.min(cropStartY, cropCurrentY);
    const width = Math.abs(cropCurrentX - cropStartX);
    const height = Math.abs(cropCurrentY - cropStartY);

    updateSelectionRect(x, y, width, height);
}

function handleCropMouseUp(event) {
    // isDragging 체크를 먼저 하여 불필요한 계산 방지
    if (!isDragging) return;
    // isCropping 상태는 유지될 수 있으므로 isDragging으로 판단
    isDragging = false;

    const rect = getSelectionRectCoords(); // 캔버스 내부 좌표 기준
    if (rect && rect.width > 5 && rect.height > 5) {
        document.getElementById('btn-crop-apply').disabled = false;
        cropInfo.textContent = `선택 영역: ${Math.round(rect.width)}x${Math.round(rect.height)}. '자르기 적용' 또는 '취소'를 누르세요.`;
        console.log("Crop selection finished.");
    } else {
        removeSelectionRect();
        cropInfo.textContent = "이미지 위에서 원하는 영역을 드래그하세요.";
        document.getElementById('btn-crop-apply').disabled = true;
        console.log("Crop selection too small or invalid.");
    }
}

// --- 자르기 선택 영역 DIV 관련 함수 ---
function createSelectionRect() {
    if (!selectionRectDiv) {
        selectionRectDiv = document.createElement('div');
        selectionRectDiv.className = 'crop-selection-overlay';
        // image-area (.image-area가 relative이므로 기준이 됨)
        imageCanvas.parentNode.appendChild(selectionRectDiv);
        // imageCanvas.parentNode.style.position = 'relative'; // CSS에서 설정함
    }
}

// updateSelectionRect 함수 수정: 캔버스 내부 좌표 사용
function updateSelectionRect(canvasX, canvasY, width, height) {
    if (!selectionRectDiv) createSelectionRect();
    // left, top은 canvasX, canvasY 직접 사용 (부모 .image-area 기준)
    // 단, 캔버스가 .image-area의 (0,0) 위치가 아닐 수 있으므로 offset 고려 필요
    // -> 가장 간단한 방법: 캔버스 offset 기준으로 설정
    selectionRectDiv.style.left = `${imageCanvas.offsetLeft + canvasX}px`;
    selectionRectDiv.style.top = `${imageCanvas.offsetTop + canvasY}px`;
    selectionRectDiv.style.width = `${width}px`;
    selectionRectDiv.style.height = `${height}px`;
}

function removeSelectionRect() {
    if (selectionRectDiv && selectionRectDiv.parentNode) {
        selectionRectDiv.parentNode.removeChild(selectionRectDiv);
        selectionRectDiv = null;
    }
}

// getSelectionRectCoords 함수 수정: 캔버스 내부 좌표 반환
function getSelectionRectCoords() {
    if (!selectionRectDiv) return null;
    // 스타일의 left/top 값은 offsetParent 기준이므로, 캔버스 기준 좌표로 변환
    const rectX = parseFloat(selectionRectDiv.style.left) - imageCanvas.offsetLeft;
    const rectY = parseFloat(selectionRectDiv.style.top) - imageCanvas.offsetTop;
    const rectWidth = parseFloat(selectionRectDiv.style.width);
    const rectHeight = parseFloat(selectionRectDiv.style.height);

     // 계산된 좌표가 캔버스 경계를 벗어나지 않도록 한번 더 제한
     const canvasWidth = imageCanvas.offsetWidth;
     const canvasHeight = imageCanvas.offsetHeight;

     const x = Math.max(0, Math.min(rectX, canvasWidth));
     const y = Math.max(0, Math.min(rectY, canvasHeight));
     const width = Math.max(0, Math.min(rectWidth, canvasWidth - x));
     const height = Math.max(0, Math.min(rectHeight, canvasHeight - y));

    return { x, y, width, height };
}


// --- 워터마크 기능 함수 ---
function handleWatermarkOpacityChange(event) {
    if(watermarkOpacityValSpan) watermarkOpacityValSpan.textContent = `${event.target.value}%`;
    // 실시간 반영 원하면 아래 호출 (단, 텍스트 등 필요)
    // applyWatermark();
}

function applyWatermark() {
    if (!currentImage || !originalImage) return; // 원본 이미지 기준

    const text = watermarkTextInput.value;
    if (!text) {
         if (typeof showNotification === 'function') showNotification("워터마크 텍스트를 입력하세요.", "warning");
        return;
    }
    const size = parseInt(watermarkSizeInput.value) || 30;
    const color = watermarkColorInput.value || '#ffffff';
    const opacity = parseInt(watermarkOpacitySlider.value) / 100;
    const position = watermarkPositionSelect.value;

    currentWatermark = { text, size, color, opacity, position };

    console.log("Applying watermark:", currentWatermark);
    applyAllEffects(); // 워터마크 포함하여 모든 효과 다시 적용
    if (typeof logAction === 'function') logAction('워터마크 적용', currentWatermark);
}

// --- 효과 적용 함수 ---
function applyAllEffects() {
    // 효과 적용 시작 시점에 원본 이미지가 로드되었는지 반드시 확인
    if (!originalImage || !originalImage.complete || originalImage.naturalWidth === 0) {
        console.warn("Original image not ready for applying effects.");
        return;
    }

    const canvasWidth = imageCanvas.width;
    const canvasHeight = imageCanvas.height;

    console.log("Applying all effects...");

    // 1. 캔버스 초기화 및 현재 작업용 원본 이미지 그리기
    ctx.clearRect(0, 0, canvasWidth, canvasHeight);
    ctx.drawImage(originalImage, 0, 0, canvasWidth, canvasHeight); // 현재 크기에 맞게 그림

    // 2. 필터 및 색상 조정 적용
    let filterString = '';
    if (currentFilters.grayscale) filterString += 'grayscale(100%) ';
    if (currentFilters.sepia) filterString += 'sepia(100%) ';
    if (currentFilters.invert) filterString += 'invert(100%) ';

    filterString += `brightness(${currentAdjustments.brightness}%) `;
    filterString += `contrast(${currentAdjustments.contrast}%) `;
    filterString += `saturate(${currentAdjustments.saturation}%)`;

    if (filterString.trim()) { // 필터나 조정이 있을 경우에만 적용
        ctx.filter = filterString.trim();
        // 임시 캔버스 사용 대신 바로 그리기 (성능 영향 적으면)
        ctx.drawImage(imageCanvas, 0, 0);
        ctx.filter = 'none'; // 필터 리셋
    }

    // 3. 워터마크 그리기
    if (currentWatermark && currentWatermark.text) {
        ctx.font = `bold ${currentWatermark.size}px Arial, sans-serif`; // 폰트 및 굵기 설정
        ctx.fillStyle = currentWatermark.color;
        ctx.globalAlpha = currentWatermark.opacity;

        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        let x, y;
        const padding = currentWatermark.size * 0.5;

        // 위치 계산
        switch (currentWatermark.position) {
            case 'top-left':      ctx.textAlign = 'left';   ctx.textBaseline = 'top';    x = padding;             y = padding;             break;
            case 'top-right':     ctx.textAlign = 'right';  ctx.textBaseline = 'top';    x = canvasWidth - padding; y = padding;             break;
            case 'bottom-left':   ctx.textAlign = 'left';   ctx.textBaseline = 'bottom'; x = padding;             y = canvasHeight - padding; break;
            case 'center':                                                            x = canvasWidth / 2;     y = canvasHeight / 2;    break;
            case 'bottom-right':  default: ctx.textAlign = 'right'; ctx.textBaseline = 'bottom'; x = canvasWidth - padding; y = canvasHeight - padding; break;
        }

        // 텍스트 그림자 효과 추가 (가독성 향상)
        ctx.shadowColor = 'rgba(0, 0, 0, 0.5)';
        ctx.shadowBlur = 2;
        ctx.shadowOffsetX = 1;
        ctx.shadowOffsetY = 1;

        ctx.fillText(currentWatermark.text, x, y);

        // 설정 복원
        ctx.globalAlpha = 1.0;
        ctx.shadowColor = 'transparent';
        ctx.shadowBlur = 0;
        ctx.shadowOffsetX = 0;
        ctx.shadowOffsetY = 0;
    }

    // 4. 최종 이미지 데이터를 currentImage에 저장 (다운로드용)
    try {
       currentImage = ctx.getImageData(0, 0, canvasWidth, canvasHeight);
    } catch (e) {
       console.error("Could not get ImageData, possibly tainted canvas:", e);
       // CORS 문제 등으로 ImageData를 얻지 못할 수 있음
    }


    console.log("Effects applied. Filter:", filterString.trim() || "none", "Watermark:", currentWatermark ? "Yes" : "No");
}


// --- 다운로드 및 초기화 함수 ---
function downloadImage() {
    if (!imageCanvas || imageCanvas.width === 0 || imageCanvas.height === 0) {
        if (typeof showNotification === 'function') showNotification("다운로드할 이미지가 없습니다.", "warning");
        return;
    }

    const format = outputFormatSelect.value;
    const quality = parseInt(jpegQualitySlider.value) / 100;
    const filename = `edited_image.${format.split('/')[1]}`;

    try {
        let dataUrl;
        if ((format === 'image/jpeg' || format === 'image/webp') && quality > 0 && quality <= 1) {
            dataUrl = imageCanvas.toDataURL(format, quality);
        } else {
            dataUrl = imageCanvas.toDataURL(format); // PNG 또는 기본 품질
        }

        const link = document.createElement('a');
        link.href = dataUrl;
        link.download = filename;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        console.log(`Image download initiated as ${filename}`);
        if (typeof logAction === 'function') logAction('이미지 다운로드', { format, quality: quality * 100 });
    } catch (e) {
         console.error("Error generating data URL or initiating download:", e);
         if (typeof showNotification === 'function') showNotification("이미지 다운로드 중 오류 발생: " + e.message, "error");
    }
}

function resetAll() {
    console.log("Resetting all changes");
    // 최초 로드된 이미지로 복원
    if (initialImage) {
        originalImage = new Image();
        originalImage.onload = () => {
             originalWidth = originalImage.width;
             originalHeight = originalImage.height;
             resetCanvasAndDrawImage(originalImage);
             updateResizeInputs(originalWidth, originalHeight);
             resetAllStates();
              console.log("Reset to initially loaded image.");
              if (typeof logAction === 'function') logAction('이미지 도구 전체 초기화');
        };
        originalImage.onerror = handleImageLoadError;
        originalImage.src = initialImage.src; // 최초 원본 이미지 src 사용
    } else {
        // 로드된 이미지 없으면 그냥 영역 초기화
        resetImageArea();
         if (typeof logAction === 'function') logAction('이미지 도구 전체 초기화');
    }
}

// JPEG 품질 슬라이더 표시 업데이트 함수
function updateJpegQualityVisibility() {
    if (outputFormatSelect.value === 'image/jpeg' || outputFormatSelect.value === 'image/webp') {
        jpegQualityGroup.style.display = 'inline-block';
    } else {
        jpegQualityGroup.style.display = 'none';
    }
}