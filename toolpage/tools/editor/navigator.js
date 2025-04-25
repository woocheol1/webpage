/**
 * navigator.js - Minimap functionality (v1.1 - Cursor Highlight Added)
 */

console.log("navigator.js (Minimap version 1.1) loaded");

const minimapContainer = document.getElementById('minimap-container');
const minimapContent = document.getElementById('minimap-content');
const minimapViewport = document.getElementById('minimap-viewport');
const scrollTrack = document.getElementById('minimap-scrollbar-track');
const scrollThumb = document.getElementById('minimap-scrollbar-thumb');


let currentEditorInstance = null;
let isActive = false; // Flag to check if minimap is active and visible
let minimapLineHeight = 2.4; // Initial estimate, might need tuning
let minimapHeight = 0; // Calculated dynamically
let editorScrollInfo = null; // Store last scroll info
let isDragging = false; // For scrollbar drag
let animationFrameRequest = null; // For debouncing viewport updates

// --- Highlight Elements ---
const MAX_HIGHLIGHT_LINES = 50; // Max simultaneous red lines
let highlightElements = []; // Red selection highlight elements
let cursorHighlightElement = null; // Yellow cursor highlight element

/**
 * Initializes or ensures highlight DOM elements (red and yellow lines) exist.
 */
function initializeMinimapElements() {
    if (!minimapContainer) return;

    // Initialize red selection highlight elements if not already done
    if (highlightElements.length === 0) {
        for (let i = 0; i < MAX_HIGHLIGHT_LINES; i++) {
            const lineEl = document.createElement('div');
            lineEl.className = 'minimap-selection-highlight';
            minimapContainer.appendChild(lineEl);
            highlightElements.push(lineEl);
        }
        clearSelectionHighlights(); // Initially hide them
    }

    // Initialize yellow cursor highlight element if not already done
    if (!cursorHighlightElement) {
        cursorHighlightElement = document.createElement('div');
        cursorHighlightElement.className = 'minimap-cursor-highlight';
        minimapContainer.appendChild(cursorHighlightElement);
        hideCursorHighlight(); // Initially hide it
    }
}


/**
 * Initializes the minimap for a given editor instance.
 * Should be called when an editor becomes active (e.g., tab switch).
 * @param {CodeMirror.Editor} editor
 */
function initializeMinimap(editor) {
    if (!minimapContainer || !minimapContent || !minimapViewport || !scrollTrack || !scrollThumb || !editor) {
        console.error("Minimap elements or editor instance missing for initialization.");
        if(isActive) deactivateMinimap();
        return;
    }

    // Initialize highlight DOM elements (idempotent)
    if (typeof initializeMinimapElements === 'function') {
         initializeMinimapElements();
    }

    console.log("Initializing minimap for the active editor...");
    currentEditorInstance = editor;
    isActive = true;
    minimapHeight = minimapContainer.clientHeight;

    // --- Remove previous listeners (safety) ---
    minimapContainer.removeEventListener('click', handleMinimapClick);
    scrollTrack.removeEventListener('mousedown', handleScrollbarMouseDown);
    window.removeEventListener('mousemove', handleScrollbarMouseMove);
    window.removeEventListener('mouseup', handleScrollbarMouseUp);

    // --- Add event listeners ---
    minimapContainer.addEventListener('click', handleMinimapClick);
    scrollTrack.addEventListener('mousedown', handleScrollbarMouseDown);
    window.addEventListener('mousemove', handleScrollbarMouseMove);
    window.addEventListener('mouseup', handleScrollbarMouseUp);

    // Initial render and viewport update
    renderMinimapContent();
    requestAnimationFrame(updateMinimapViewportDisplay);

    console.log(`Minimap initialized. Container height: ${minimapHeight}px`);
}

/**
 * Renders the editor's content into the minimap div.
 */
function renderMinimapContent() {
    if (!isActive || !currentEditorInstance || !minimapContent) {
        return;
    }
    const code = currentEditorInstance.getValue();
    minimapContent.textContent = code;
    requestAnimationFrame(updateMinimapViewportDisplay); // Update viewport after render
}

/**
 * Updates the position and size of the viewport highlight and scrollbar thumb.
 */
function updateMinimapViewportDisplay() {
     if (animationFrameRequest) {
        cancelAnimationFrame(animationFrameRequest);
    }
     animationFrameRequest = requestAnimationFrame(() => {
        if (!isActive || !currentEditorInstance || !minimapViewport || !minimapContainer || !scrollThumb) {
            return;
        }
        editorScrollInfo = currentEditorInstance.getScrollInfo();
        minimapHeight = minimapContainer.clientHeight;
        const editorHeight = editorScrollInfo.height;
        const editorVisibleHeight = editorScrollInfo.clientHeight;
        const editorScrollTop = editorScrollInfo.top;

        if (editorHeight <= 0 || minimapHeight <= 0 || editorVisibleHeight >= editorHeight) {
            minimapViewport.style.display = 'none';
            scrollThumb.style.display = 'none';
            return;
        } else {
             minimapViewport.style.display = 'block';
             scrollThumb.style.display = 'block';
        }

        const viewportRatio = editorVisibleHeight / editorHeight;
        const viewportHeight = Math.min(minimapHeight, Math.max(10, minimapHeight * viewportRatio));
        const viewportTop = Math.min(minimapHeight - viewportHeight, (editorScrollTop / editorHeight) * minimapHeight);

        minimapViewport.style.top = `${viewportTop}px`;
        minimapViewport.style.height = `${viewportHeight}px`;
        scrollThumb.style.top = `${viewportTop}px`;
        scrollThumb.style.height = `${viewportHeight}px`;
     });
}

/**
 * Handles clicks on the minimap container or scroll track to scroll the editor (using 10 blocks).
 * @param {MouseEvent} event
 */
function handleMinimapClick(event) {
    if (!isActive || !currentEditorInstance || !minimapContainer || isDragging ) return;
     if (event.target !== minimapContainer && event.target !== scrollTrack) {
         return;
     }

    const rect = minimapContainer.getBoundingClientRect();
    const clickY = event.clientY - rect.top;
    minimapHeight = minimapContainer.clientHeight;

    if(minimapHeight <= 0) return;

    // --- Block Calculation ---
    const numberOfBlocks = 10;
    const blockHeight = minimapHeight / numberOfBlocks;
    const blockIndex = Math.floor(clickY / blockHeight);
    const blockCenterRatio = (blockIndex + 0.5) / numberOfBlocks;
    const clickRatio = Math.max(0, Math.min(1, blockCenterRatio));
    // --- End Block Calculation ---

    editorScrollInfo = currentEditorInstance.getScrollInfo();
    const editorHeight = editorScrollInfo.height;
    const editorVisibleHeight = editorScrollInfo.clientHeight;

    if (editorHeight <= editorVisibleHeight) return; // Not scrollable

    const targetScrollTop = (clickRatio * editorHeight) - (editorVisibleHeight / 2);
    const clampedScrollTop = Math.max(0, Math.min(editorHeight - editorVisibleHeight, targetScrollTop));

    console.log(`Minimap block ${blockIndex} clicked (ratio ${clickRatio.toFixed(2)}), scrolling editor to ${clampedScrollTop.toFixed(0)}`);
    currentEditorInstance.scrollTo(null, clampedScrollTop);
}

// --- Scrollbar Drag Logic ---
function handleScrollbarMouseDown(event) {
    if (!isActive || !currentEditorInstance || (event.target !== scrollTrack && event.target !== scrollThumb)) return;
    isDragging = true;
    scrollTrack.style.cursor = 'grabbing';
    document.body.style.userSelect = 'none';

    // Initial scroll on mouse down
    const trackRect = scrollTrack.getBoundingClientRect();
    const clickY = event.clientY - trackRect.top;
    const trackHeight = scrollTrack.clientHeight;
    if (trackHeight <= 0) return;
    const clickRatio = Math.max(0, Math.min(1, clickY / trackHeight));
    editorScrollInfo = currentEditorInstance.getScrollInfo();
    const editorHeight = editorScrollInfo.height;
    const editorVisibleHeight = editorScrollInfo.clientHeight;
    if (editorHeight <= editorVisibleHeight) return; // Avoid NaN scroll
    const targetScrollTop = (clickRatio * editorHeight) - (editorVisibleHeight / 2);
    const clampedScrollTop = Math.max(0, Math.min(editorHeight - editorVisibleHeight, targetScrollTop));
    currentEditorInstance.scrollTo(null, clampedScrollTop);
    event.preventDefault();
}

function handleScrollbarMouseMove(event) {
    if (!isDragging || !isActive) return;
    const trackRect = scrollTrack.getBoundingClientRect();
    const mouseY = event.clientY - trackRect.top;
    const trackHeight = scrollTrack.clientHeight;
    if (trackHeight <= 0) return;
    const scrollRatio = Math.max(0, Math.min(1, mouseY / trackHeight));
    editorScrollInfo = currentEditorInstance.getScrollInfo();
    const editorHeight = editorScrollInfo.height;
    const editorVisibleHeight = editorScrollInfo.clientHeight;
     if (editorHeight <= editorVisibleHeight) return; // Avoid NaN scroll
    const targetScrollTop = scrollRatio * (editorHeight - editorVisibleHeight);
    const clampedScrollTop = Math.max(0, Math.min(editorHeight - editorVisibleHeight, targetScrollTop));
    currentEditorInstance.scrollTo(null, clampedScrollTop);
    requestAnimationFrame(updateMinimapViewportDisplay);
}

function handleScrollbarMouseUp(event) {
    if (isDragging) {
        isDragging = false;
        scrollTrack.style.cursor = 'pointer';
        document.body.style.userSelect = '';
    }
}

// --- Highlight Functions ---

/**
 * Clears all red selection highlight lines.
 */
function clearSelectionHighlights() {
    for (const el of highlightElements) {
        if(el) el.style.display = 'none';
    }
}

/**
 * Shows red lines at the specified line numbers based on rendered content height.
 * @param {number[]} lineNumbers - Array of 1-based line numbers.
 */
function showSelectionHighlights(lineNumbers) {
    // 기본 유효성 검사 (기존과 유사)
    if (!isActive || !currentEditorInstance || !minimapContent || !minimapContainer || !highlightElements || highlightElements.length === 0) {
        clearSelectionHighlights(); // highlightElements 없으면 여기서 종료될 수 있음
        return;
    }

    clearSelectionHighlights(); // 기존 하이라이트 지우기

    const totalLines = currentEditorInstance.lineCount();
    // --- 수정된 부분: 렌더링된 컨텐츠 높이 사용 ---
    const contentScrollHeight = minimapContent.scrollHeight; // 실제 렌더링된 내용의 높이
    // --- 수정 끝 ---
    const minimapVisibleHeight = minimapContainer.clientHeight; // 컨테이너 높이 (경계 확인용)

    if (totalLines <= 0 || contentScrollHeight <= 0 || lineNumbers.length === 0) {
        return; // 계산 불가 또는 그릴 라인 없음
    }

    // --- 수정된 부분: 라인 높이 추정 및 top 계산 ---
    // 실제 렌더링된 높이를 기준으로 라인 높이 추정
    const estimatedLineHeight = contentScrollHeight / totalLines;
    // --- 수정 끝 ---

    const linesToShow = lineNumbers.slice(0, MAX_HIGHLIGHT_LINES); // 최대 개수 제한
    let highlightIndex = 0;

    for (const lineNumber of linesToShow) {
        if (lineNumber < 1 || lineNumber > totalLines) continue; // 유효 라인 번호 확인

        // --- 수정된 부분: 추정된 라인 높이로 top 계산 ---
        const lineTop = (lineNumber - 1) * estimatedLineHeight;
        // --- 수정 끝 ---

        const highlightEl = highlightElements[highlightIndex++];
        if (highlightEl) {
            // 계산된 top 위치 적용 (컨테이너 높이 - 1px 를 넘지 않도록)
            highlightEl.style.top = `${Math.min(lineTop, minimapVisibleHeight - 1)}px`;
            highlightEl.style.display = 'block';
        }
    }
    // console.log(`Show selection highlights. Estimated line height: ${estimatedLineHeight.toFixed(2)}`); // 디버깅
}

/**
 * Hides the yellow cursor highlight line.
 */
function hideCursorHighlight() {
    if (cursorHighlightElement) {
        cursorHighlightElement.style.display = 'none';
    }
}

/**
 * Shows the yellow cursor line at the specified line number.
 * @param {number} lineNumber - 1-based line number of the cursor.
 */
// navigator.js 파일 내

/**
 * Shows the yellow cursor line at the specified line number based on rendered content height.
 * @param {number} lineNumber - 1-based line number of the cursor.
 */
function showCursorHighlight(lineNumber) {
    // 기본 유효성 검사 (기존과 유사)
    if (!isActive || !currentEditorInstance || !minimapContainer || !minimapContent || !cursorHighlightElement || lineNumber < 1) {
        hideCursorHighlight();
        return;
    }

    const totalLines = currentEditorInstance.lineCount();
    // --- 수정된 부분: 렌더링된 컨텐츠 높이 사용 ---
    const contentScrollHeight = minimapContent.scrollHeight; // 실제 렌더링된 내용의 높이
    // --- 수정 끝 ---
    const minimapVisibleHeight = minimapContainer.clientHeight; // 컨테이너 높이 (경계 확인용)

    if (totalLines <= 0 || contentScrollHeight <= 0 || lineNumber > totalLines) {
        hideCursorHighlight();
        return;
    }

    // --- 수정된 부분: 라인 높이 추정 및 top 계산 ---
    // 실제 렌더링된 높이를 기준으로 라인 높이 추정
    const estimatedLineHeight = contentScrollHeight / totalLines;
    // 추정된 라인 높이로 top 위치 계산
    const lineTop = (lineNumber - 1) * estimatedLineHeight;
    // --- 수정 끝 ---

    // console.log(`Cursor Line: ${lineNumber}, Total: ${totalLines}, ContentScrollH: ${contentScrollHeight.toFixed(1)}, EstLineH: ${estimatedLineHeight.toFixed(2)}, Top: ${lineTop.toFixed(1)}`); // 디버깅

    // 커서 하이라이트 요소 위치 설정 및 표시 (컨테이너 높이 - 1px 를 넘지 않도록)
    cursorHighlightElement.style.top = `${Math.min(lineTop, minimapVisibleHeight - 1)}px`;
    cursorHighlightElement.style.display = 'block';
}

// hideCursorHighlight, clearSelectionHighlights 함수 등은 기존 유지

/**
 * Deactivates the minimap.
 */
function deactivateMinimap() {
     console.log("Deactivating minimap.");
     isActive = false;
     isDragging = false;
     window.removeEventListener('mousemove', handleScrollbarMouseMove);
     window.removeEventListener('mouseup', handleScrollbarMouseUp);
     currentEditorInstance = null;

     // Clear highlights
     clearSelectionHighlights();
     hideCursorHighlight();

     // Clear content and hide elements
     if (minimapContent) minimapContent.textContent = '';
     if (minimapViewport) minimapViewport.style.display = 'none';
     if (scrollThumb) scrollThumb.style.display = 'none';

     if (animationFrameRequest) {
        cancelAnimationFrame(animationFrameRequest);
        animationFrameRequest = null;
    }
}