# RSS 뉴스 수집 및 분석 도구

이 프로젝트는 다양한 뉴스 사이트의 RSS 피드를 수집하고 분석하는 도구를 제공합니다.

## 기능

1. **RSS 피드 수집**: 다양한 뉴스 사이트의 RSS 피드를 수집하여 엑셀 파일로 저장합니다.
2. **키워드 분석**: 수집된 뉴스 데이터에서 주요 키워드를 추출하고 분석합니다.
3. **시각화**: 워드클라우드와 차트를 통해 뉴스 트렌드를 시각화합니다.

## 설치 방법

필요한 패키지는 다음과 같습니다:

```bash
pip install requests pandas openpyxl beautifulsoup4 matplotlib wordcloud
```

## 사용 방법

### 1. RSS 피드 수집

```bash
python main.py
```

### 2. 키워드 클라우드 분석

```bash
python keyword_analysis.py
```

### 3. 키워드 엑셀 분석

```bash
python excel_keyword_analyzer.py
```

## 주요 파일 설명

- `main.py`: RSS 피드 수집 스크립트
- `keyword_analysis.py`: 수집된 데이터 분석 스크립트 (KoNLPy 없이 정규표현식 사용)

## 참고 사항

- 본 코드는 KoNLPy를 사용하지 않고 정규표현식을 통해 간단한 키워드 추출을 수행합니다.
- 한글 폰트 문제가 발생할 경우 `keyword_analysis.py` 파일의 폰트 설정을 수정하세요.
