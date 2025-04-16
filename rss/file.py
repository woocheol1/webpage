import pandas as pd
import re
from collections import Counter
from konlpy.tag import Okt  # 한국어 자연어 처리
import matplotlib.pyplot as plt
from wordcloud import WordCloud
import numpy as np
from datetime import datetime

# 엑셀 파일 로드
df = pd.read_excel('rss_data/rss_news_20250415_113609.xlsx')

# HTML 태그 제거 함수
def clean_html(text):
    if isinstance(text, str):
        return re.sub('<.*?>', '', text)
    return text

# 데이터 정제
df['내용_정제'] = df['내용'].apply(clean_html)

# 날짜 형식 통일
def standardize_date(date_str):
    try:
        # 다양한 형식의 날짜를 파싱
        formats = ['%a, %d %b %Y %H:%M:%S %z', '%Y-%m-%d %H:%M:%S', '%Y년 %m월 %d일 %H시 %M분']
        for fmt in formats:
            try:
                dt = datetime.strptime(date_str, fmt)
                return dt.strftime('%Y-%m-%d %H:%M:%S')
            except:
                continue
        return date_str
    except:
        return date_str

df['발행일_표준'] = df['발행일'].apply(standardize_date)

# 카테고리 분류 (간단한 키워드 기반)
def categorize(text):
    categories = {
        '경제': ['경제', '금융', '주식', '투자', '시장', '환율', '금리'],
        '정치': ['정치', '대통령', '국회', '의원', '장관', '투표', '선거'],
        '사회': ['사회', '교육', '환경', '범죄', '사건', '복지', '안전'],
        '국제': ['국제', '미국', '중국', '일본', '유럽', '러시아', '외교']
    }
    
    if not isinstance(text, str):
        return '기타'
    
    for category, keywords in categories.items():
        if any(keyword in text for keyword in keywords):
            return category
    return '기타'

df['카테고리'] = df['제목'].apply(categorize)

# 저장
df.to_excel('rss_data/processed_news.xlsx', index=False)

# 간단한 키워드 분석 (한국어)
okt = Okt()
all_nouns = []

for text in df['제목'].dropna():
    if isinstance(text, str):
        nouns = okt.nouns(text)
        all_nouns.extend([n for n in nouns if len(n) > 1])  # 2글자 이상 명사만 추출

# 가장 많이 등장한 키워드 상위 20개
keyword_counts = Counter(all_nouns).most_common(20)
print("가장 많이 등장한 키워드:", keyword_counts)

# 워드클라우드 생성
wc = WordCloud(font_path='NanumGothic.ttf',  # 한글 폰트 경로
               background_color='white',
               width=800,
               height=600)
wc_img = wc.generate_from_frequencies(dict(keyword_counts))

plt.figure(figsize=(10, 8))
plt.imshow(wc_img, interpolation='bilinear')
plt.axis('off')
plt.savefig('rss_data/news_wordcloud.png')
plt.show()