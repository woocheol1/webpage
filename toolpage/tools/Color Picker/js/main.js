console.log('gradientPresetResult:', document.getElementById('gradientPresetResult'));

document.addEventListener('DOMContentLoaded', () => {
    const colorInput = document.getElementById('colorInput');
    const generateBtn = document.getElementById('generateBtn');
    const paletteResults = document.getElementById('paletteResults');
    const contrastText = document.getElementById('contrastText');
    const contrastResult = document.getElementById('contrastResult');
    const cssVarCode = document.getElementById('cssVarCode');
    const copyCssBtn = document.getElementById('copyCssBtn');
    const randomPaletteBtn = document.getElementById('randomPaletteBtn');
    const randomTone = document.getElementById('randomTone');
    const multiColorInput = document.getElementById('multiColorInput');
    const convertBtn = document.getElementById('convertBtn');
    const convertResults = document.getElementById('convertResults');

    let currentHex = '#845EC2';

    function updateAll() {
        let hex = colorInput.value.trim();
        if (!isValidHex(hex)) hex = '#845EC2';
        currentHex = hex;
        renderAllPalettes(hex);
        updateCssCode(hex);
        updateContrast(hex);
        setGradientPreview(hex);
    }

    function isValidHex(hex) {
        return /^#[0-9A-Fa-f]{6}$/.test(hex);
    }

    function renderAllPalettes(hex) {
        paletteResults.innerHTML = '';
        // 주요 팔레트 그룹 (기존처럼 여러 팔레트 아래로 나열)
        const palettes = generateAllPalettes(hex);
        for (const [title, colors] of palettes) {
            paletteResults.appendChild(createPaletteGroup(title, colors));
            paletteResults.appendChild(document.createElement('hr')).className = 'palette-divider';
        }
        // 컬러 쉐이드 팔레트 추가
        const shadeLabels = [50,100,200,300,400,500,600,700,800,900];
        const shadeSet = generateShadeSet(hex);
        paletteResults.appendChild(createLabeledPaletteGroup('컬러 쉐이드 생성기', shadeSet, shadeLabels));
        // 랜덤 팔레트는 pastel(8색)로 항상 main 영역 하단에 표시
        const randomPalette = generateRandomPalette('pastel', 8);
        const randomPaletteGroup = createPaletteGroup('랜덤 팔레트 (pastel)', randomPalette);
        // 중복 방지: 이미 paletteResults에 랜덤 팔레트가 있으면 추가하지 않음
        paletteResults.appendChild(randomPaletteGroup);
    }

    function createPaletteGroup(title, colors) {
        const group = document.createElement('div');
        group.className = 'palette-group';
        const t = document.createElement('div');
        t.className = 'palette-title';
        t.textContent = title;
        group.appendChild(t);
        const paletteDiv = document.createElement('div');
        paletteDiv.className = 'palette';
        colors.forEach(color => {
            const box = document.createElement('div');
            box.className = 'color-box';
            box.style.background = color;
            box.title = color;
            box.innerHTML = `<span class="color-hex">${color}</span>`;
            box.onclick = () => copyToClipboard(color);
            paletteDiv.appendChild(box);
        });
        group.appendChild(paletteDiv);
        return group;
    }

    function createLabeledPaletteGroup(title, colors, labels) {
        const group = document.createElement('div');
        group.className = 'palette-group';
        const t = document.createElement('div');
        t.className = 'palette-title';
        t.textContent = title;
        group.appendChild(t);
        const paletteDiv = document.createElement('div');
        paletteDiv.className = 'palette';
        colors.forEach((color, idx) => {
            const box = document.createElement('div');
            box.className = 'color-box';
            box.style.background = color;
            box.title = color;
            box.innerHTML = `<span class="color-hex">${labels[idx] || ''}<br>${color}</span>`;
            box.onclick = () => copyToClipboard(color);
            paletteDiv.appendChild(box);
        });
        group.appendChild(paletteDiv);
        return group;
    }

    function updateCssCode(hex) {
        cssVarCode.textContent = hex;
    }

    function updateContrast(hex) {
        if (!isValidHex(hex)) return;
        const contrastText = document.getElementById('contrastText');
        const contrastSample = document.querySelector('.contrast-sample');
        if (contrastText) contrastText.style.color = hex;
        if (contrastSample) contrastSample.style.background = hex;
        // 기존 대비 계산 및 결과 표시
        const bg = '#fff';
        const ratio = getContrastRatio(hex, bg);
        const grade = wcagGrade(ratio);
        contrastResult.innerHTML = `대비: <b>${ratio.toFixed(2)}</b> / 등급: <b>${grade}</b>`;
    }

    function getContrastRatio(hex1, hex2) {
        // WCAG 대비비율 계산
        const lum1 = getLuminance(hex1);
        const lum2 = getLuminance(hex2);
        const brightest = Math.max(lum1, lum2);
        const darkest = Math.min(lum1, lum2);
        return (brightest + 0.05) / (darkest + 0.05);
    }
    function getLuminance(hex) {
        const { r, g, b } = hexToRgb(hex);
        const a = [r, g, b].map(v => {
            v /= 255;
            return v <= 0.03928 ? v/12.92 : Math.pow((v+0.055)/1.055, 2.4);
        });
        return 0.2126*a[0] + 0.7152*a[1] + 0.0722*a[2];
    }
    function wcagGrade(ratio) {
        if (ratio >= 7) return 'AAA';
        if (ratio >= 4.5) return 'AA';
        if (ratio >= 3) return 'A';
        return '불충분';
    }

    function copyToClipboard(text) {
        if (navigator.clipboard) {
            navigator.clipboard.writeText(text);
            // 알림 제거: 아무 동작 없음
        } else {
            // fallback
            const textarea = document.createElement('textarea');
            textarea.value = text;
            document.body.appendChild(textarea);
            textarea.select();
            document.execCommand('copy');
            document.body.removeChild(textarea);
        }
    }
    copyCssBtn.onclick = () => copyToClipboard(currentHex);

    // 그라데이션 추천 및 미리보기 적용
    function setGradientPreview(hex) {
        // 추천 그라데이션 2~3개 중 첫 번째를 미리보기로 사용 (예시: 입력색+보색+밝은색)
        const gradColors = [hex, adjustColor(hex, 60, 10, 10), adjustColor(hex, 180, 0, 10), adjustColor(hex, 300, 10, 0), '#fff'];
        const gradStr = `linear-gradient(90deg, ${gradColors.join(', ')})`;
        const preview = document.getElementById('gradientPreview');
        if (preview) preview.style.background = gradStr;
    }

    // Generate 버튼
    generateBtn.onclick = () => updateAll();
    colorInput.onchange = updateAll;

    // 랜덤 팔레트
    randomPaletteBtn.onclick = () => {
        const tone = randomTone.value;
        const colors = generateRandomPalette(tone);
        paletteResults.innerHTML = '';
        paletteResults.appendChild(createPaletteGroup(`랜덤 팔레트 (${tone})`, colors));
    };

    // 변환기
    convertBtn.onclick = () => {
        const input = multiColorInput.value;
        const colors = input.split(',').map(s => s.trim()).filter(s => isValidHex(s));
        if (!colors.length) {
            convertResults.textContent = 'HEX 색상(쉼표로 구분) 입력';
            return;
        }
        convertResults.innerHTML = colors.map(hex => {
            const rgb = hexToRgb(hex);
            const hsl = rgbToHsl(rgb.r, rgb.g, rgb.b);
            return `<div>${hex} → RGB(${rgb.r},${rgb.g},${rgb.b}) / HSL(${hsl.h.toFixed(0)},${hsl.s.toFixed(0)}%,${hsl.l.toFixed(0)}%)</div>`;
        }).join('');
    };

    // 그라데이션 미리보기 컨트롤 기능 구현
    const gradientLeft = document.getElementById('gradientLeft');
    const gradientRight = document.getElementById('gradientRight');
    const gradientRandomBtn = document.getElementById('gradientRandomBtn');
    const gradientPlayPauseBtn = document.getElementById('gradientPlayPauseBtn');
    const colorPickerBtn = document.getElementById('colorPickerBtn');
    let gradientAnimInterval = null;
    let isGradientPlaying = false;

    // 안전한 HEX 체크
    function isValidHex(hex) {
        return /^#[0-9A-Fa-f]{6}$/.test(hex);
    }
    function setGradientPreviewManual(leftHex, rightHex) {
        if (!isValidHex(leftHex) || !isValidHex(rightHex)) return;
        const gradStr = `linear-gradient(90deg, ${leftHex}, ${rightHex})`;
        const preview = document.getElementById('gradientPreview');
        if (preview) preview.style.background = gradStr;
    }
    function randomHex() {
        return '#' + Math.floor(Math.random()*16777215).toString(16).padStart(6, '0');
    }
    function playGradientAnimation() {
        if (gradientAnimInterval) clearInterval(gradientAnimInterval);
        isGradientPlaying = true;
        gradientPlayPauseBtn.textContent = '정지';
        const preview = document.getElementById('gradientPreview');
        if (!preview) return;
        // 추천 그라데이션 색상 사용
        const left = gradientLeft.value;
        const right = gradientRight.value;
        if (!isValidHex(left) || !isValidHex(right)) return;
        // 2색 그라데이션 배경 생성
        preview.style.background = `linear-gradient(90deg, ${left}, ${right})`;
        preview.style.backgroundSize = '200% 50%';
        preview.style.backgroundPosition = '0% 100%';
        // 기존 인터벌 제거 후 애니메이션 시작
        let pos = 0;
        gradientAnimInterval = setInterval(() => {
            pos += 1;
            if (pos > 100) pos = 0;
            preview.style.backgroundPosition = `${pos}% 100%`;
        }, 40); // 부드럽게 느리게
    }
    function pauseGradientAnimation() {
        if (gradientAnimInterval) clearInterval(gradientAnimInterval);
        gradientAnimInterval = null;
        isGradientPlaying = false;
        gradientPlayPauseBtn.textContent = '재생';
        // 멈출 때 배경 위치 초기화
        const preview = document.getElementById('gradientPreview');
        if (preview) preview.style.backgroundPosition = '0% 50%';
    }
    if (gradientPlayPauseBtn) {
        gradientPlayPauseBtn.textContent = '재생';
        gradientPlayPauseBtn.onclick = () => {
            if (isGradientPlaying) {
                pauseGradientAnimation();
            } else {
                playGradientAnimation();
            }
        };
    }
    if (gradientRandomBtn) {
        gradientRandomBtn.onclick = () => {
            const left = randomHex();
            const right = randomHex();
            gradientLeft.value = left;
            gradientRight.value = right;
            setGradientPreviewManual(left, right);
            // 재생 중이면 랜덤 색상에서 바로 애니메이션 재시작
            if (isGradientPlaying) {
                playGradientAnimation();
            }
        };
    }
    if (gradientLeft && gradientRight) {
        gradientLeft.oninput = gradientRight.oninput = () => {
            setGradientPreviewManual(gradientLeft.value, gradientRight.value);
            pauseGradientAnimation();
        };
    }
    // ---- Color Picker Button ----
    if (colorPickerBtn) {
        colorPickerBtn.onclick = async () => {
            if (window.EyeDropper) {
                const eyeDropper = new window.EyeDropper();
                try {
                    const result = await eyeDropper.open();
                    const picked = result.sRGBHex;
                    navigator.clipboard.writeText(picked);
                    // 메시지 박스(alert) 없이 복사만 수행
                } catch(e) {
                    // alert('피커가 취소되었습니다.'); // 메시지 박스도 제거
                }
            } else {
                alert('이 브라우저는 EyeDropper API를 지원하지 않습니다.');
            }
        };
    }
    // 최초 미리보기 상태
    setGradientPreviewManual(gradientLeft.value, gradientRight.value);
    playGradientAnimation();

    // 팔레트 확장: 보색, 유사색, 삼각형, 사각형, 기본 등
    function generateAllPalettes(hex) {
        return [
            ['Generic Gradient', generateGenericGradient(hex)],
            ['Matching Gradient', generateMatchingGradient(hex)],
            ['Spot Palette', generateSpotPalette(hex)],
            ['Twisted Spot Palette', generateTwistedSpotPalette(hex)],
            ['Complementary', generateComplementary(hex)],
            ['Analogous', generateAnalogous(hex)],
            ['Triadic', generateTriadic(hex)],
            ['Tetradic', generateTetradic(hex)],
        ];
    }
    // 각 팔레트 함수는 colorUtils.js에서 구현/확장 필요

    // ---- 프리셋 그라데이션 기능 ----
    const GRADIENT_PRESET_MAP = {
        'Grade Grey': ['#bdc3c7', '#2c3e50'],
        'Piggy Pink': ['#ee9ca7', '#ffdde1'],
        'Cool Blues': ['#2193b0', '#6dd5ed'],
        'MegaTron': ['#c6ffdd', '#fbd786', '#f7797d'],
        'Moonlit Asteroid': ['#0f2027', '#2c5364'],
        'JShine': ['#12c2e9', '#c471ed', '#f64f59'],
        'Ultra Voilet': ['#4b6cb7', '#1796bb', '#f1f2f3'],
        'Shades of Blue': ['#4b6cb7', '#86a8e7', '#c3b1e4'],
        'Harvey': ['#4b6cb7', '#86a8e7', '#c3b1e4'],
        'Azur Lane': ['#2c3e50', '#4fc1e9', '#e4e4e4'],
        'Mint Cream': ['#e5e4e2', '#d5e8c0', '#c4e4d3'],
        'Shades of Green': ['#2c3e50', '#4fc1e9', '#e4e4e4'],
        'Shades of Purple': ['#4b6cb7', '#86a8e7', '#c3b1e4'],
        'Shades of Yellow': ['#fceabb', '#f8b500'],
        'Shades of Brown': ['#c2b280', '#7f674c'],
        'Shades of Orange': ['#ff9966', '#ff5e62'],
        'Shades of Red': ['#e96443', '#904e95'],
        'Shades of Grey': ['#bdc3c7', '#2c3e50'],
        'Shades of Black': ['#232526', '#414345'],
        'Shades of White': ['#f8ffae', '#43cea2'],
        'Peachy Keen': ['#ffd7be', '#ffb6c1'],
        'Minty Fresh': ['#b2fffc', '#00e6b8'],
        'Bubblegum': ['#ff69b4', '#ff97ff'],
        'Creamy': ['#fff599', '#ffd3b6'],
        'Soft Peach': ['#ffd7be', '#ffe6d9'],
        'Soft Pink': ['#ffb6c1', '#ffc5c5'],
        'Soft Mint': ['#b2fffc', '#c9ffe5'],
        'Soft Lavender': ['#c7b8ea', '#e4d6f5'],
        'Soft Sage': ['#bce3c5', '#e4f0e5'],
        'Soft Berry': ['#ffb6c1', '#ff99cc'],
        'Soft Coral': ['#ffd7be', '#ffa57d'],
        'Soft Turquoise': ['#00e6b8', '#00b1ff'],
        'Soft Yellow': ['#fff599', '#ffff00'],
        'Soft Orange': ['#ffd3b6', '#ffa07a'],
        'Sunset Beach': ['#fdc830', '#f37335'],
        'Ocean Blue': ['#2193b0', '#6dd5ed'],
        'Forest Hike': ['#5a3f37', '#2c7744'],
        'Candy Floss': ['#fcb69f', '#ffecd2'],
        'Lime Soda': ['#a8ff78', '#78ffd6'],
        'Firewatch': ['#cb2d3e', '#ef473a'],
        'Aqua Marine': ['#1a2980', '#26d0ce'],
        'Purple Bliss': ['#360033', '#0b8793'],
        'Bloody Mary': ['#ff512f', '#dd2476'],
        'Deep Space': ['#000000', '#434343'],
        'Emerald Water': ['#348f50', '#56b4d3'],
        'Mojito': ['#1d976c', '#93f9b9'],
        'Royal Blue': ['#536976', '#292e49'],
        'Cherry Blossom': ['#f7971e', '#ffd200'],
        'Valentine': ['#ff5858', '#f09819'],
        'Skyline': ['#1488cc', '#2b32b2'],
        'Pink Sunrise': ['#ff6a00', '#ee0979'],
        'Citrus Peel': ['#fdc830', '#f37335'],
        'Frost': ['#000428', '#004e92'],
        'Rainbow Blue': ['#00c3ff', '#ffff1c'],
        'Night Fade': ['#a18cd1', '#fbc2eb'],
        'Green Beach': ['#02aab0', '#00cdac'],
        'Sunny Morning': ['#f6d365', '#fda085'],
        'Red Mist': ['#ff5858', '#f09819'],
        'Blue Raspberry': ['#00c6fb', '#005bea'],
        'Plum Plate': ['#667eea', '#764ba2'],
        'Cocoaa Ice': ['#c0c0aa', '#1cefff'],
        'Jupiter': ['#ffd89b', '#19547b'],
        'Horizon': ['#003973', '#e5e5be'],
        'Rose Water': ['#e55d87', '#5fc3e4'],
        'Frozen': ['#403b4a', '#e7e9bb'],
        'Mango': ['#ffe259', '#ffa751'],
        'Royal': ['#141e30', '#243b55'],
        'Dark Skies': ['#4b6cb7', '#182848'],
        'Sunrise': ['#ff512f', '#f09819'],
        'Flare': ['#f12711', '#f5af19'],
        'Blue Lagoon': ['#43cea2', '#185a9d'],
        'Pink Dream': ['#ffafbd', '#ffc3a0'],
        'Orchid': ['#da22ff', '#9733ee'],
        'Dusk': ['#2c3e50', '#fd746c'],
        'Peach': ['#ed4264', '#ffedbc'],
        'Green to Blue': ['#56ab2f', '#a8e063'],
        'Berry Smoothie': ['#8e54e9', '#4776e6'],
        'Aubergine': ['#aa4b6b', '#6b6b83', '#3b8d99'],
        'Nebula': ['#43cea2', '#185a9d', '#2b5876'],
        'Sunset Delight': ['#ff9966', '#ff5e62', '#ffb347'],
        'Tropical Ocean': ['#2b5876', '#4e4376', '#243b55'],
        'Grape Soda': ['#a770ef', '#cf8bf3', '#fdb99b'],
        'Lush': ['#56ab2f', '#a8e063', '#43cea2'],
        'Pink Lemonade': ['#ff758c', '#ff7eb3', '#ffb347'],
        'Cobalt': ['#00416a', '#e4e5e6'],
        'Violet Sky': ['#4776e6', '#8e54e9'],
        'Pastel Blue': ['#a1c4fd', '#c2e9fb'],
        'Pastel Green': ['#d4fc79', '#96e6a1'],
        'Pastel Pink': ['#fbc2eb', '#a6c1ee'],
        'Pastel Purple': ['#d4fc79', '#96e6a1', '#a1c4fd'],
        'Pastel Orange': ['#fcb69f', '#ffecd2'],
        'Pastel Yellow': ['#fceabb', '#f8b500'],
        'Pastel Red': ['#ff5858', '#f09819'],
        'Pastel Mint': ['#b2fffc', '#c9ffe5'],
        'Pastel Lavender': ['#c7b8ea', '#e4d6f5'],
        'Pastel Sage': ['#bce3c5', '#e4f0e5'],
        'Pastel Berry': ['#ffb6c1', '#ff99cc'],
        'Pastel Coral': ['#ffd7be', '#ffa57d'],
        'Pastel Turquoise': ['#00e6b8', '#00b1ff'],
        'Pastel Orange2': ['#ffd3b6', '#ffa07a'],
        'Sunset Sherbet': ['#f857a6', '#ff5858'],
        'Deep Teal': ['#136a8a', '#267871'],
        'Lemon Twist': ['#f9d423', '#ff4e50'],
        'Blueberry': ['#2193b0', '#6dd5ed'],
        'Moss Green': ['#134e5e', '#71b280'],
        'Coral Reef': ['#ff9966', '#ff5e62'],
        'Ruby Red': ['#e52d27', '#b31217'],
        'Cyan Magic': ['#1cd8d2', '#93edc7'],
        'Peach Beach': ['#ffecd2', '#fcb69f'],
        'Lavender Dream': ['#c471f5', '#fa71cd'],
        'Aqua Splash': ['#13547a', '#80d0c7'],
        'Sunflower': ['#f7971e', '#ffd200'],
        'Mango Twist': ['#ffe259', '#ffa751'],
        'Steel Blue': ['#485563', '#29323c'],
        'Golden Hour': ['#f7971e', '#ffd200'],
        'Candy Green': ['#a8ff78', '#78ffd6'],
        'Twilight': ['#0f2027', '#2c5364'],
        'Rose Gold': ['#b76e79', '#f6e6e9'],
        'Berry Punch': ['#4e54c8', '#8f94fb'],
        'Autumn': ['#ff9966', '#ff5e62'],
        'Citrus': ['#fdc830', '#f37335'],
        'Ocean Sunset': ['#43cea2', '#185a9d'],
        'Purple Haze': ['#8e2de2', '#4a00e0'],
        'Mint Breeze': ['#b2fefa', '#0ed2f7'],
        'Caramel': ['#ffb347', '#ffcc33'],
        'Royal Mint': ['#76b852', '#8dc26f'],
        'Night Sky': ['#232526', '#414345'],
        'Rose Petal': ['#e55d87', '#5fc3e4'],
        'Cocoa': ['#c0c0aa', '#1cefff'],
        'Berry Blue': ['#2193b0', '#6dd5ed'],
        'Grape Crush': ['#7b4397', '#dc2430'],
        'Summer Sky': ['#2980b9', '#6dd5fa'],
        'Firefly': ['#f9d423', '#ff4e50'],
        'Limeade': ['#a8ff78', '#78ffd6'],
        'Spicy Orange': ['#ff8008', '#ffc837'],
        'Peach Melba': ['#fcb69f', '#ffecd2'],
        'Blue Lagoon 2': ['#43cea2', '#185a9d'],
        'Honeycomb': ['#fceabb', '#f8b500'],
        'Pink Frost': ['#f857a6', '#ff5858'],
        'Emerald Isle': ['#348f50', '#56b4d3'],
        'Tangerine': ['#ffb347', '#ffcc33'],
        'Summer Peach': ['#ffd7be', '#ffb6c1'],
        'Blueberry Pie': ['#2193b0', '#6dd5ed'],
        'Lemonade': ['#f9d423', '#ff4e50'],
        'Cotton Candy': ['#fcb69f', '#ffecd2'],
        'Raspberry': ['#ff416c', '#ff4b2b'],
        'Jade': ['#43cea2', '#185a9d'],
        'Fuchsia': ['#ff00cc', '#333399'],
        'Amber': ['#ffb347', '#ffcc33'],
        'Minty Sky': ['#b2fefa', '#0ed2f7'],
        'Vivid Violet': ['#7f00ff', '#e100ff'],
        'Coral Sun': ['#ff9966', '#ff5e62'],
        'Cobalt Blue': ['#00416a', '#e4e5e6'],
        'Sweet Plum': ['#aa4b6b', '#6b6b83'],
        'Golden Peach': ['#ffd89b', '#19547b'],
        'Citrus Fizz': ['#fdc830', '#f37335'],
        'Aqua Mint': ['#1a2980', '#26d0ce'],
        'Lush Green': ['#56ab2f', '#a8e063'],
        'Sunset Pink': ['#ffafbd', '#ffc3a0'],
        'Berry Red': ['#ff416c', '#ff4b2b'],
        'Frosty Blue': ['#00c6fb', '#005bea'],
        'Royal Rose': ['#e52d27', '#b31217'],
        'Pastel Mint 2': ['#b2fffc', '#c9ffe5']
    };

    function getRandomGradientPresetNames(count) {
        const presetNames = Object.keys(GRADIENT_PRESET_MAP);
        const arr = presetNames.slice();
        const shuffled = [];
        while (arr.length && shuffled.length < count) {
            const idx = Math.floor(Math.random() * arr.length);
            shuffled.push(arr.splice(idx, 1)[0]);
        }
        return shuffled;
    }

    let currentPresetNames = [];

    function renderGradientPresetBoxes(names) {
        const resultDiv = document.getElementById('gradientPresetResult');
        if (!resultDiv) return;
        resultDiv.innerHTML = '';
        names.forEach(name => {
            const colors = GRADIENT_PRESET_MAP[name];
            if (!colors) return;
            const box = document.createElement('div');
            box.className = 'gradient-preset-preview';
            box.style.background = `linear-gradient(90deg, ${colors.join(', ')})`;
            resultDiv.appendChild(box);
        });
    }

    function showRandomPresets() {
        currentPresetNames = getRandomGradientPresetNames(10);
        renderGradientPresetBoxes(currentPresetNames);
    }

    function addRandomPreset() {
        if (currentPresetNames.length >= 10) return;
        const all = Object.keys(GRADIENT_PRESET_MAP);
        const remain = all.filter(name => !currentPresetNames.includes(name));
        if (remain.length === 0) return;
        const idx = Math.floor(Math.random() * remain.length);
        currentPresetNames.push(remain[idx]);
        renderGradientPresetBoxes(currentPresetNames);
    }

    window.applyRandomGradientPreset = showRandomPresets;
    window.addRandomPreset = addRandomPreset;

    document.addEventListener('DOMContentLoaded', () => {
        const presetRandomBtn = document.getElementById('gradientPresetRandomBtn');
        if (presetRandomBtn) {
            presetRandomBtn.onclick = showRandomPresets;
        }
        const presetAddBtn = document.getElementById('gradientPresetAddBtn');
        if (presetAddBtn) {
            presetAddBtn.onclick = addRandomPreset;
        }
    });
});
