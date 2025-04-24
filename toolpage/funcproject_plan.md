# 다기능 웹페이지 프로젝트 계획서 (업데이트: 2025-04-25)

## 프로젝트 개요
- 목표: 다양한 기능을 사용할 수 있는 HTML 기반 웹페이지 제작
- 경로: C:\Users\PC\Desktop\cursor\webpage\toolpage

## 주요 기능 계획
1.  피치 조정 비율 계산기
2.  텍스트 도구 (대소문자 변환, 문자 수 계산 등)
3.  이미지 도구 (구현 예정)
4.  파일 변환 도구 (구현 예정)
5.  시간 및 날짜 계산기 (구현 예정)
6.  단위 변환기 (구현 예정)
7.  색상 도구 (구현 예정, 에디터 내 일부 기능 구현)
8.  랜덤 생성 도구 (구현 예정)
9.  HTML/CSS/JS 에디터 (실시간 미리보기 기능 포함)

## 진행 상황
- [x] 프로젝트 폴더 생성: C:\Users\PC\Desktop\cursor\webpage\toolpage
- [x] 프로젝트 계획서 작성
- [x] 메인 페이지 생성 (index.html)
- [x] 공통 CSS 파일 생성 (styles.css)
- [x] 공통 JavaScript 파일 생성 (common.js)
- [x] 피치 조정 비율 계산기 구현
- [x] 텍스트 도구 구현
- [o] HTML/CSS/JS 에디터 구현 (진행 중)
    - [x] 메인 페이지에 에디터 링크 추가
    - [x] 기본 페이지 레이아웃 구현 (editor index.html)
    - [x] 실시간 미리보기 기능 구현 (script.js)
    - [x] 코드 하이라이팅 기능 (CodeMirror 기본 기능 활용)
    - [x] 커서 위치 기반 미리보기 스크롤 기능 구현 (script.js)
    - [x] 코드 폴딩(접기/펼치기) 기능 구현 (folding.js, script.js)
        - [x] 전체 접기/펼치기 버튼 추가
        - [x] 접힌 라인 하이라이트 (style.css)
    - [x] 색상 선택기 기능 추가 (color-tools.js, script.js)
    - [x] 코드 포맷팅 기능 (Prettier) 추가 (formatter.js, script.js)
    - [ ] 저장 및 불러오기 기능 구현 (storage.js) - (기존 계획)
    - [ ] 프로젝트 템플릿 구현 (templates.js) - (기존 계획)
    - [ ] 코드 검증 기능 구현 (validator.js) - (구현 예정)
    - [ ] 반응형 미리보기 도구 구현 (responsive-tools.js) - (구현 예정)
- [ ] 이미지 도구 구현
- [ ] 파일 변환 도구 구현
- [ ] 색상 도구 (별도 페이지) 구현
- [ ] 기타 도구 구현

## HTML/CSS/JS 에디터 세부 계획 (업데이트)

### 폴더 구조
- 주요 페이지: `toolpage/tools/editor/editor index.html`
- 관련 파일: `toolpage/tools/editor/` 폴더 내 (style.css, script.js, folding.js, color-tools.js, formatter.js 등)

### 구현된 기능
1.  **기본 레이아웃**: 화면 분할(Split.js), 탭 전환(HTML/CSS/JS), 에디터 및 미리보기 영역 구성
2.  **실시간 미리보기**: 코드 변경 시 지연(debounce) 업데이트
3.  **코드 하이라이팅**: CodeMirror 라이브러리 기본 기능 활용 (material 테마)
4.  **커서 위치 기반 미리보기 스크롤**: 에디터 커서 위치에 해당하는 미리보기 요소로 자동 스크롤 (`scrollIntoView`) 및 하이라이트
5.  **코드 폴딩(접기/펼치기)**:
    * CodeMirror 폴딩 애드온 활용 (foldGutter, foldcode 등)
    * 거터 클릭 또는 마커 클릭으로 폴딩/언폴딩
    * 전체 접기/펼치기 버튼 기능
    * 접힌 라인 노란색 배경 하이라이트
6.  **색상 선택기**:
    * `coloris` 라이브러리 활용
    * 컨트롤 영역에 색상 피커 표시
    * 선택한 색상을 CSS 에디터 커서 위치에 자동 삽입
7.  **코드 포맷팅**:
    * `Prettier` 라이브러리 활용 (standalone + 파서)
    * "Format" 버튼 클릭 시 현재 활성 에디터(HTML/CSS/JS) 코드 자동 정렬

*(참고: 저장/불러오기, 템플릿 기능은 초기 계획에는 있었으나 아직 구현되지 않았습니다.)*

### 구현 예정 기능
1.  **코드 검증 기능 (validator.js)**
    * HTML, CSS, (선택적 JS) 코드 유효성 실시간 검사 및 오류 표시
    * 예상 소요 시간: 6-10시간
2.  **반응형 미리보기 도구 (responsive-tools.js)**
    * 다양한 기기(데스크톱, 태블릿, 모바일) 프리셋 및 사용자 정의 크기로 미리보기
    * 가로/세로 모드 전환
    * 예상 소요 시간: 3-6시간
3.  **코드 스니펫 기능 (snippets.js)**
    * 자주 사용하는 코드 조각 저장 및 재사용 (생성, 저장, 분류, 검색, 삽입)
    * 예상 소요 시간: 5-8시간
4.  **저장 및 불러오기 기능 (storage.js)**
    * 로컬 스토리지를 활용한 작업 내용 저장, 자동 저장, 세션 복구 등 (초기 계획 복구)
    * 예상 소요 시간: 8-12시간
5.  **CSS 프레임워크 통합**: 인기 있는 프레임워크(예: Bootstrap) 템플릿 제공
6.  **이미지/아이콘 삽입 도구**: 에디터 내에서 리소스 검색 및 코드 삽입 지원

### 테스트 계획
- 각 기능별 단위 테스트 및 통합 테스트 수행
- 브라우저 호환성 테스트 (Chrome, Firefox, Edge 등)
- 사용자 경험 테스트 (직관성, 응답성, 편의성 확인)

## 이미지 도구 세부 계획 (변경 없음)

### 폴더 구조
- 주요 페이지: `toolpage/tools/image-tools.html`
- 관련 파일: `toolpage/tools/image-tools/` 폴더

### 기본 계획 기능
1. 이미지 리사이징
2. 이미지 회전
3. 이미지 필터 적용 (흑백, 세피아 등)
4. 이미지 자르기
5. 이미지 포맷 변환 (JPG, PNG, WebP 등)
6. 이미지 압축
7. 워터마크 추가
8. 밝기, 대비, 채도 조절
9. 간단한 드로잉 도구

### 추가 계획 기능
1. 색상 추출
2. 메타데이터 편집
3. 이미지 병합
4. 모자이크/흐림 처리
5. 프레임/테두리 추가
6. 웹 최적화
7. 예술적 스타일 적용

### 구현 방식
- 클라이언트 측 JavaScript (HTML5 Canvas API, FileReader API 등)

### 구현 계획 파일 (예상)
- `image-tools.html`, `main.js`, `resizer.js`, `filters.js`, `cropper.js`, `converter.js`, `metadata.js`, `color-extractor.js`, `styles.css`

### 구현 일정 (예상)
- 전체 약 32시간 (4일)

## 참고사항
- 각 파일 크기 제한 (17kb)은 현재 유효하지 않을 수 있음 (라이브러리 사용 등으로)
- 모듈화하여 기능별 JavaScript 파일 관리
- 로그는 필요시 브라우저 콘솔 또는 별도 로깅 시스템 활용