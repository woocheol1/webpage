# webpage


## 📁 1. 새 저장소 생성

1. GitHub 접속 → 우측 상단 `+` → `New repository`
2. 아래 항목 입력
   * **Repository name** : 예) `webpage`
   * **Public** 선택
   * `README` 체크 ❌ (빈 저장소로 시작)
3. `Create repository` 클릭

---

## 📤 2. HTML 파일 업로드

1. 저장소 메인 페이지로 이동
2. `Add file` → `Upload files` 클릭
3. `index.html` 파일과 필요한 CSS/JS 파일 선택 후 업로드
4. 아래쪽에 커밋 메시지 작성 (예: `upload files`)
5. `Commit changes` 클릭

> 📌 index.html은 반드시 루트 디렉토리에 있어야 함

---

## 🌍 3. GitHub Pages 설정

1. 저장소 상단 `Settings` 클릭
2. 왼쪽 메뉴에서 `Pages` 선택
3. **"Build and deployment"** 항목에서 설정:
   * **Source** : `Deploy from a branch`
   * **Branch** : `main`
   * **Folder** : `/ (root)`
4. `Save` 버튼 클릭

---

## 🔗 4. 배포된 웹사이트 확인

* 설정 저장 후 약 30초 ~ 1분 뒤
* 아래와 같은 형식의 URL이 생성됨:

```
https://<GitHub 사용자명>.github.io/<저장소 이름>/
```

예:

```markdown
<https://woocheol1.github.io/webpage/>
```

---

## ✅ 완료!

이제 업로드한 `index.html` 파일이 웹사이트로 작동합니다.

필요할 때마다 HTML, CSS, JS 파일을 업로드 → 자동 반영됩니다.

---

## 💡 추가 팁

| 상황                    | 해결 방법                                         |
| ----------------------- | ------------------------------------------------- |
| CSS/JS 적용 안됨        | 경로를 `./style.css`,`./script.js`등으로 설정 |
| 메인화면이 안 나옴      | `index.html`파일명이 정확한지 확인              |
| 파일 수정 후 반영 안 됨 | 새로고침 (Ctrl+Shift+R), 캐시 삭제 후 재시도      |

## 5.이미지 업로드

## ✅ 1. 이미지 폴더 & 파일 업로드 방법

1. 저장소 페이지에서 ➜ `Add file` → `Upload files` 클릭
2. `images`라는 폴더를 만든 뒤 (또는 로컬에서 폴더ご로 zip 풀어서 업로드해도 됨)
3. 이미지 파일(`cat.jpg` 등)을 해당 폴더에 업로드
4. `Commit changes`로 저장

---

## ✅ 2. `index.html` 코드에서 이미지 삽입

```html
html
복사편집
<!DOCTYPE html>
<html lang="ko">
<head>
  <meta charset="UTF-8">
  <title>나의 웹사이트</title>
</head>
<body>
  <h1>안녕하세요!</h1>
  <p>아래는 귀여운 고양이 사진입니다 🐱</p>
  <img src="./images/cat.jpg" alt="고양이" width="300">
</body>
</html>

```

> ✅ img 태그의 src 경로는 GitHub 저장소 기준 상대 경로(./images/파일명.jpg)를 사용

---

## ✅ 3. 업로드 후 웹에서 확인

예시 주소:

👉 `https://woocheol1.github.io/webpage/`

브라우저에서 접속하면 이미지까지 같이 보일 거야!

---

## 🔧 경로 꿀팁

| 상황                             | `img`태그 예시                      |
| -------------------------------- | ------------------------------------- |
| 이미지가 루트에 있을 때          | `<img src="./cat.jpg">`             |
| `/images`폴더에 있을 때        | `<img src="./images/cat.jpg">`      |
| `/assets/img`처럼 더 깊은 폴더 | `<img src="./assets/img/logo.png">` |
