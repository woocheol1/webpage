// 색상 변환 및 팔레트 생성 유틸리티
function hexToRgb(hex) {
    hex = hex.replace('#', '');
    const bigint = parseInt(hex, 16);
    return {
        r: (bigint >> 16) & 255,
        g: (bigint >> 8) & 255,
        b: bigint & 255
    };
}

function rgbToHex(r, g, b) {
    return (
        '#' +
        [r, g, b]
            .map(x => {
                const hex = x.toString(16);
                return hex.length === 1 ? '0' + hex : hex;
            })
            .join('')
    );
}

function adjustColor(hex, hShift = 0, sShift = 0, lShift = 0) {
    // HEX → HSL 변환 후 조정
    let { r, g, b } = hexToRgb(hex);
    let { h, s, l } = rgbToHsl(r, g, b);
    h = (h + hShift + 360) % 360;
    s = Math.min(100, Math.max(0, s + sShift));
    l = Math.min(100, Math.max(0, l + lShift));
    const { r: nr, g: ng, b: nb } = hslToRgb(h, s, l);
    return rgbToHex(nr, ng, nb);
}

function rgbToHsl(r, g, b) {
    r /= 255;
    g /= 255;
    b /= 255;
    const max = Math.max(r, g, b), min = Math.min(r, g, b);
    let h, s, l = (max + min) / 2;
    if (max === min) {
        h = s = 0;
    } else {
        const d = max - min;
        s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
        switch (max) {
            case r: h = (g - b) / d + (g < b ? 6 : 0); break;
            case g: h = (b - r) / d + 2; break;
            case b: h = (r - g) / d + 4; break;
        }
        h *= 60;
    }
    return { h, s: s * 100, l: l * 100 };
}

function hslToRgb(h, s, l) {
    s /= 100;
    l /= 100;
    let c = (1 - Math.abs(2 * l - 1)) * s;
    let x = c * (1 - Math.abs(((h / 60) % 2) - 1));
    let m = l - c / 2;
    let r = 0, g = 0, b = 0;
    if (h >= 0 && h < 60) { r = c; g = x; b = 0; }
    else if (h < 120) { r = x; g = c; b = 0; }
    else if (h < 180) { r = 0; g = c; b = x; }
    else if (h < 240) { r = 0; g = x; b = c; }
    else if (h < 300) { r = x; g = 0; b = c; }
    else { r = c; g = 0; b = x; }
    return {
        r: Math.round((r + m) * 255),
        g: Math.round((g + m) * 255),
        b: Math.round((b + m) * 255)
    };
}

function hslToHex(h, s, l) {
    const { r, g, b } = hslToRgb(h, s, l);
    return rgbToHex(r, g, b);
}

function generatePalettes(hex) {
    // Generic Gradient: 입력색 기준, 밝기/채도 변화
    const generic = [
        adjustColor(hex, 0, -20, 20),
        hex,
        adjustColor(hex, 0, 20, -20)
    ];
    // Matching Gradient: 색상환 기준 인접색
    const matching = [
        adjustColor(hex, -30, 0, 0),
        hex,
        adjustColor(hex, 30, 0, 0)
    ];
    // Spot Palette: 톤/채도 변화
    const spot = [
        adjustColor(hex, 0, -10, 10),
        adjustColor(hex, 0, 0, 0),
        adjustColor(hex, 0, 10, -10)
    ];
    // Twisted Spot Palette: 보색, 유사색
    const twisted = [
        adjustColor(hex, 180, 0, 0),
        adjustColor(hex, 150, 10, 0),
        adjustColor(hex, 210, -10, 0)
    ];
    return {
        'Generic Gradient': generic,
        'Matching Gradient': matching,
        'Spot Palette': spot,
        'Twisted Spot Palette': twisted
    };
}

// 팔레트 확장 함수들
function generateGenericGradient(hex) {
    // 예시: 인접 밝기/채도 변화 (6색)
    return [
        adjustColor(hex, 0, -10, 10),
        adjustColor(hex, 0, 5, 5),
        hex,
        adjustColor(hex, 0, 10, -5),
        adjustColor(hex, 0, 20, -10),
        adjustColor(hex, 0, 30, -15)
    ];
}
function generateMatchingGradient(hex) {
    // 색상환 인접(±30, ±60도)
    return [
        hex,
        adjustColor(hex, 30, 0, 0),
        adjustColor(hex, 60, 0, 0),
        adjustColor(hex, -30, 0, 0),
        adjustColor(hex, -60, 0, 0),
        adjustColor(hex, 0, 0, 10)
    ];
}
function generateSpotPalette(hex) {
    // 톤/채도 변화
    return [
        hex,
        adjustColor(hex, 0, -15, 12),
        adjustColor(hex, 0, 10, -12),
        adjustColor(hex, 0, -10, -10)
    ];
}
function generateTwistedSpotPalette(hex) {
    // 보색, 유사색, 밝기변화
    return [
        hex,
        adjustColor(hex, 180, 0, 0),
        adjustColor(hex, 150, 10, 10),
        adjustColor(hex, 210, -10, -10)
    ];
}
function generateComplementary(hex) {
    // 보색(180도), 밝기/채도 변형
    return [
        hex,
        adjustColor(hex, 180, 0, 0),
        adjustColor(hex, 180, 10, 15),
        adjustColor(hex, 180, -10, -15)
    ];
}
function generateAnalogous(hex) {
    // 유사색(±30도)
    return [
        adjustColor(hex, -30, 0, 0),
        hex,
        adjustColor(hex, 30, 0, 0)
    ];
}
function generateTriadic(hex) {
    // 삼각형(±120도)
    return [
        hex,
        adjustColor(hex, 120, 0, 0),
        adjustColor(hex, 240, 0, 0)
    ];
}
function generateTetradic(hex) {
    // 사각형(0, 90, 180, 270)
    return [
        hex,
        adjustColor(hex, 90, 0, 0),
        adjustColor(hex, 180, 0, 0),
        adjustColor(hex, 270, 0, 0)
    ];
}
function generateShadeSet(hex) {
    // Material UI, TailwindCSS 스타일의 10단계 쉐이드
    const hsl = hexToHsl(hex);
    // 밝기 단계 (Tailwind/Material 기준)
    const lightnessArr = [97, 93, 86, 78, 65, 55, 45, 36, 28, 18];
    return lightnessArr.map(l => hslToHex(hsl.h, hsl.s, l));
}
function generateRandomPalette(tone = 'pastel', count = 8) {
    // 더 다양한 색상 분포를 위해 hue를 완전 랜덤하게, s/l도 더 넓은 범위로!
    const palette = [];
    for (let i = 0; i < count; i++) {
        let h = Math.random() * 360;
        let s, l;
        if (tone === 'pastel') {
            // 기존보다 더 넓은 채도/명도 범위
            s = 30 + Math.random() * 50; // 30~80%
            l = 70 + Math.random() * 25; // 70~95%
        } else if (tone === 'neon') {
            s = 75 + Math.random() * 25; // 75~100%
            l = 45 + Math.random() * 20; // 45~65%
        } else if (tone === 'mono') {
            // 랜덤 hue, 저채도/중명도
            h = Math.random() * 360;
            s = 5 + Math.random() * 20; // 5~25%
            l = 30 + Math.random() * 55; // 30~85%
        } else {
            // 기타: 완전 랜덤
            s = 30 + Math.random() * 60;
            l = 30 + Math.random() * 60;
        }
        palette.push(hslToHex(h, s, l));
    }
    return palette.slice(0, count);
}
function shuffle(arr) {
    for (let i = arr.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [arr[i], arr[j]] = [arr[j], arr[i]];
    }
    return arr;
}
