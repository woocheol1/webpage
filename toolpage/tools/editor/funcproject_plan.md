# 프로젝트 계획: HTML, CSS & JS 에디터 & 미리보기 도구

## 프로젝트 분석 내용
현재 경로(C:\CursorDevelopment\GitHub\webpage\webpage\toolpage\tools\editor)에 있는 파일들을 분석한 결과입니다.

## 파일 구조
- `editor index.html`: 메인 HTML 파일
- `script.js`: 핵심 기능 구현 JS 파일
- `style.css`: 스타일시트
- `color-tools.js`: 색상 선택 도구 관련 스크립트
- `folding.js`: 코드 폴딩 기능 관련 스크립트
- `formatter.js`: 코드 포맷팅 기능 관련 스크립트

## 완료된 작업
- [x] 기존 파일 구조 및 기능 분석
- [x] README.md 파일 콘텐츠 작성
- [x] README.md 파일 생성 및 편집 완료

## 해야 할 작업
- [ ] 전체 기능 테스트 및 문서화
- [ ] 추가 기능 개발 (필요시)

## 주요 기능 요약
1. HTML, CSS, JavaScript 코드 편집 (탭 방식)
2. 실시간 미리보기 (디바운싱 적용)
3. 코드 포맷팅 (Prettier 라이브러리 활용)
4. 색상 선택 도구 (Coloris 라이브러리 활용)
5. 코드 폴딩 (접기/펼치기)
6. 반응형 레이아웃 (Split.js 활용)
7. 커서 기반 스크롤 동기화 (HTML 편집 위치와 미리보기 동기화)

## 참고사항
- 외부 라이브러리 의존성: CodeMirror, Split.js, Coloris, Prettier
- 모든 코드는 브라우저 환경에서 실행됨
- 추가 개발 시 모듈화된 방식 유지 권장
