
"""
엑셀 파일의 키워드 분석 및 시각화 스크립트
특정 엑셀 파일에서 텍스트 데이터의 단어 빈도를 분석합니다.

필요한 라이브러리:
- pandas
- matplotlib
- wordcloud

설치 방법:
pip install pandas matplotlib wordcloud openpyxl
"""

import pandas as pd
import re
import os
from collections import Counter
import matplotlib.pyplot as plt
from datetime import datetime
import matplotlib.font_manager as fm

# 워드클라우드가 설치되어 있으면 임포트
try:
    from wordcloud import WordCloud
    wordcloud_available = True
except ImportError:
    wordcloud_available = False
    print("워드클라우드를 사용하려면 'pip install wordcloud'를 실행하세요.")

# 주제별 키워드 그룹화를 위한 사전
topic_groups = {
    '정치': ['대통령', '국회', '의원', '정부', '장관', '여당', '야당', '총리', '청와대', '이재명', '윤석열', '민주당', '국민의힘', '경선', '대선'],
    '경제': ['주식', '부동산', '금리', '경제', '증시', '주가', '환율', '무역', '수출', '수입', '인플레이션', '경기', '기업', '투자', '시장', '관세'],
    '국제': ['미국', '중국', '일본', '러시아', '유럽', '북한', '트럼프', '바이든', '외교', '유엔', '나토'],
    '사회': ['교육', '범죄', '사건', '학교', '사고', '재난', '복지', '보건', '의료', '환경', '인권', '서울'],
    '기술': ['인공지능', 'AI', '기술', '디지털', '온라인', '메타버스', '로봇', '자율주행', '빅데이터', '5G', '서비스'],
    '문화': ['영화', '음악', '공연', '전시', '예술', '드라마', '방송', '연예인', '배우', '가수', '스포츠']
}

# 한글 폰트 확인 함수
def get_korean_font_path():
    # Windows 기본 한글 폰트 목록
    font_list = [
        'C:/Windows/Fonts/malgun.ttf',     # 맑은 고딕
        'C:/Windows/Fonts/gulim.ttc',      # 굴림
        'C:/Windows/Fonts/batang.ttc',     # 바탕
        'C:/Windows/Fonts/NanumGothic.ttf' # 나눔고딕
    ]
    
    # 존재하는 첫 번째 한글 폰트 경로 반환
    for font_path in font_list:
        if os.path.exists(font_path):
            print(f"한글 폰트를 찾았습니다: {font_path}")
            return font_path
            
    print("한글 폰트를 찾을 수 없습니다. 기본 폰트를 사용합니다.")
    return None

# HTML 태그 제거 함수
def clean_html(text):
    if isinstance(text, str):
        # HTML 태그 제거
        text = re.sub(r'<.*?>', '', text)
        # 여러 공백을 하나로 치환
        text = re.sub(r'\s+', ' ', text)
        return text.strip()
    return ""

# 간단한 키워드 추출 (정규표현식 사용)
def extract_keywords(text, min_length=2, max_length=None, stopwords=None):
    if not isinstance(text, str):
        return []
    
    # 기본 불용어 설정
    default_stopwords = {'있다', '없다', '그것', '이것', '저것', '합니다', '입니다', '니다', '하다', '에서', '으로', '이다'}
    
    # 사용자 지정 불용어가 있으면 추가
    if stopwords:
        all_stopwords = default_stopwords.union(set(stopwords))
    else:
        all_stopwords = default_stopwords
    
    # 정규표현식 패턴 생성 (최소 길이와 최대 길이 고려)
    if max_length:
        pattern = fr'[가-힣]{{{min_length},{max_length}}}'
    else:
        pattern = fr'[가-힣]{{{min_length},}}'
    
    # 단어 추출
    words = re.findall(pattern, text)
    
    # 불용어 제거
    return [w for w in words if w not in all_stopwords]

def create_wordcloud(keyword_dict, output_file):
    """워드클라우드 생성 및 저장 함수"""
    print("워드클라우드 생성을 시작합니다...")
    
    # 한글 폰트 경로 가져오기
    font_path = get_korean_font_path()
    
    # 키워드 데이터 확인
    if not keyword_dict:
        print("키워드 데이터가 없습니다. 워드클라우드를 생성할 수 없습니다.")
        return False
    
    print(f"사용할 키워드 수: {len(keyword_dict)}")
    print(f"키워드 샘플: {list(keyword_dict.items())[:5]}")
    
    # 빈도수가 너무 작은 키워드 제외 (2회 미만 제외)
    filtered_dict = {k: v for k, v in keyword_dict.items() if v >= 2}
    print(f"필터링 후 키워드 수: {len(filtered_dict)}")
    
    if not filtered_dict:
        print("필터링 후 남은 키워드가 없습니다.")
        filtered_dict = keyword_dict  # 원래 딕셔너리 사용
    
    try:
        # 워드클라우드 객체 생성
        wc = WordCloud(
            font_path=font_path,  # 명시적 한글 폰트 경로
            background_color='white',
            width=1000,
            height=800,
            max_words=100,
            max_font_size=200,
            min_font_size=10,
            prefer_horizontal=0.9,
            colormap='viridis',  # 다양한 색상 맵 사용
            contour_width=1,
            contour_color='steelblue',
            relative_scaling=0.5  # 빈도수 차이에 따른 크기 조정
        )
        
        # 워드클라우드 생성
        print("워드클라우드 이미지 생성 중...")
        wc_img = wc.generate_from_frequencies(filtered_dict)
        print("워드클라우드 이미지 생성 완료")
        
        # 시각화 및 저장 (하나의 파일만 생성)
        plt.figure(figsize=(12, 10))
        plt.imshow(wc_img, interpolation='bilinear')
        plt.axis('off')
        plt.tight_layout(pad=0)
        
        # 워드클라우드 저장
        plt.savefig(output_file, dpi=300, bbox_inches='tight')
        print(f"워드클라우드를 {output_file}에 저장했습니다.")
        
        return True
    except Exception as e:
        print(f"워드클라우드 생성 중 오류 발생: {e}")
        return False

def load_stopwords(file_path):
    """파일에서 불용어 목록 로드"""
    stopwords = set()
    try:
        with open(file_path, 'r', encoding='utf-8') as f:
            for line in f:
                word = line.strip()
                if word:
                    stopwords.add(word)
        print(f"{len(stopwords)}개의 불용어를 로드했습니다.")
    except Exception as e:
        print(f"불용어 파일 로드 중 오류 발생: {e}")
    
    return stopwords

def group_keywords_by_topic(keywords_with_counts):
    """
    키워드와 빈도수를 주제별로 그룹화
    """
    topic_totals = {topic: 0 for topic in topic_groups.keys()}
    topic_keywords = {topic: {} for topic in topic_groups.keys()}
    uncategorized = {}
    
    for keyword, count in keywords_with_counts:
        assigned = False
        for topic, keywords in topic_groups.items():
            if keyword in keywords:
                topic_totals[topic] += count
                topic_keywords[topic][keyword] = count
                assigned = True
                break
        
        if not assigned:
            uncategorized[keyword] = count
    
    # '기타' 카테고리 추가
    topic_totals['기타'] = sum(uncategorized.values())
    topic_keywords['기타'] = uncategorized
    
    return topic_totals, topic_keywords

def visualize_topic_distribution(topic_totals, output_file):
    """
    주제별 빈도 분포를 시각화
    """
    # 데이터 정렬 (빈도수 기준 내림차순)
    sorted_topics = sorted(topic_totals.items(), key=lambda x: x[1], reverse=True)
    topics = [t[0] for t in sorted_topics]
    counts = [t[1] for t in sorted_topics]
    
    # 그래프 생성
    plt.figure(figsize=(12, 8))
    bars = plt.bar(topics, counts)
    
    # 막대 위에 값 표시
    for bar, count in zip(bars, counts):
        plt.text(
            bar.get_x() + bar.get_width()/2,
            bar.get_height() + 5,
            str(count),
            ha='center'
        )
    
    plt.title('주제별 키워드 빈도')
    plt.xlabel('주제')
    plt.ylabel('빈도수 총합')
    plt.tight_layout()
    
    # 그래프 저장
    plt.savefig(output_file, dpi=300, bbox_inches='tight')
    print(f"주제별 빈도 분포 그래프를 {output_file}에 저장했습니다.")
    
    # 결과 반환
    return sorted_topics

def print_topic_top_keywords(topic_keywords, top_n=5):
    """
    각 주제별 상위 키워드 출력
    """
    print("\n주제별 주요 키워드:")
    for topic, keywords in topic_keywords.items():
        if not keywords:
            continue
            
        sorted_keywords = sorted(keywords.items(), key=lambda x: x[1], reverse=True)
        top_keywords = sorted_keywords[:top_n]
        
        print(f"\n[{topic}]")
        for keyword, count in top_keywords:
            print(f"  - {keyword}: {count}회")

def analyze_excel_file(file_path, columns, min_length=2, max_length=None, stopwords_file=None, output_dir=None):
    """일반 엑셀 파일에서 단어 빈도 분석"""
    print(f"\n엑셀 파일 분석을 시작합니다: {file_path}")
    
    # 출력 디렉토리 설정
    if not output_dir:
        output_dir = os.path.dirname(os.path.abspath(file_path))
        if not os.path.exists(output_dir):
            os.makedirs(output_dir)
    
    # 파일 확장자 확인
    if not file_path.lower().endswith(('.xlsx', '.xls')):
        print("오류: 지원되는 파일 형식은 .xlsx 또는 .xls입니다.")
        return
    
    # 불용어 로드
    stopwords = None
    if stopwords_file and os.path.exists(stopwords_file):
        stopwords = load_stopwords(stopwords_file)
    
    try:
        # 엑셀 파일 로드
        df = pd.read_excel(file_path)
        print(f"데이터 크기: {df.shape[0]}행 x {df.shape[1]}열")
        print(f"엑셀 파일 컬럼: {', '.join(df.columns)}")
        
        # 분석할 열 확인
        valid_columns = []
        for col in columns:
            if col in df.columns:
                valid_columns.append(col)
            else:
                print(f"경고: '{col}' 열을 찾을 수 없습니다.")
        
        if not valid_columns:
            print("오류: 분석할 열이 없습니다.")
            return
        
        print(f"분석할 열: {', '.join(valid_columns)}")
        
        # 키워드 추출
        all_keywords = []
        column_keywords = {}  # 열별 키워드 저장
        
        # 각 열에서 키워드 추출
        for col in valid_columns:
            print(f"{col} 열에서 키워드 추출 중...")
            col_keywords = []
            
            for text in df[col].dropna():
                # HTML 태그 제거
                cleaned_text = clean_html(text)
                
                # 키워드 추출
                keywords = extract_keywords(
                    cleaned_text, 
                    min_length=min_length, 
                    max_length=max_length, 
                    stopwords=stopwords
                )
                col_keywords.extend(keywords)
                all_keywords.extend(keywords)
            
            # 열별 키워드 저장
            column_keywords[col] = Counter(col_keywords)
            print(f"  - {col} 열에서 {len(col_keywords)}개의 키워드 추출 (중복 포함)")
        
        # 전체 키워드 빈도 계산
        all_keyword_counts = Counter(all_keywords)
        
        # 결과 출력
        print("\n가장 많이 등장한 키워드 (전체):")
        for keyword, count in all_keyword_counts.most_common(30):
            print(f"  - {keyword}: {count}회")
        
        # 주제별 그룹화
        print("\n키워드를 주제별로 그룹화하는 중...")
        topic_totals, topic_keywords = group_keywords_by_topic(all_keyword_counts.most_common())
        
        # 주제별 결과 출력
        print("\n주제별 키워드 빈도:")
        for topic, count in sorted(topic_totals.items(), key=lambda x: x[1], reverse=True):
            print(f"  - {topic}: {count}회")
        
        # 주제별 상위 키워드 출력
        print_topic_top_keywords(topic_keywords)
        
        # 새 DataFrame 생성하여 빈도수 저장
        freq_df = pd.DataFrame({
            '키워드': [k for k, v in all_keyword_counts.most_common()],
            '빈도수': [v for k, v in all_keyword_counts.most_common()]
        })
        
        # 열별 빈도수 추가
        for col in valid_columns:
            col_counts = column_keywords[col]
            freq_df[f'{col}_빈도'] = freq_df['키워드'].map(lambda k: col_counts.get(k, 0))
        
        # 주제 정보 추가
        def get_topic(keyword):
            for topic, keywords in topic_groups.items():
                if keyword in keywords:
                    return topic
            return '기타'
        
        freq_df['주제'] = freq_df['키워드'].apply(get_topic)
        
        # 파일명에서 확장자 제거
        base_filename = os.path.splitext(os.path.basename(file_path))[0]
        
        # 결과 저장
        output_file = os.path.join(output_dir, f"{base_filename}_키워드분석.xlsx")
        freq_df.to_excel(output_file, index=False)
        print(f"\n키워드 분석 결과를 {output_file}에 저장했습니다.")
        
        # 타임스탬프 생성 (모든 파일에 동일한 타임스탬프 사용)
        timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
        
        # 워드클라우드 생성
        if wordcloud_available:
            print("\n워드클라우드 생성 중...")
            # 한글 폰트 설정
            try:
                font_path = get_korean_font_path()
                if font_path:
                    plt.rc('font', family=fm.FontProperties(fname=font_path).get_name())
            except:
                print("폰트 설정 중 오류가 발생했습니다. 기본 폰트를 사용합니다.")
            
            # 워드클라우드 파일 경로
            wc_file = os.path.join(output_dir, f"{base_filename}_wordcloud_{timestamp}.png")
            
            # 워드클라우드 생성
            keyword_dict = dict(all_keyword_counts.most_common(100))
            create_wordcloud(keyword_dict, wc_file)
        
        # 주제별 분포 시각화
        topic_chart_file = os.path.join(output_dir, f"{base_filename}_topic_distribution_{timestamp}.png")
        visualize_topic_distribution(topic_totals, topic_chart_file)
        
        # 막대 그래프 생성 (상위 20개)
        try:
            plt.figure(figsize=(12, 8))
            top20_df = freq_df.head(20)
            plt.barh(top20_df['키워드'][::-1], top20_df['빈도수'][::-1])
            plt.title('상위 20개 키워드 빈도')
            plt.xlabel('빈도수')
            plt.tight_layout()
            
            # 그래프 저장
            chart_file = os.path.join(output_dir, f"{base_filename}_keyword_chart_{timestamp}.png")
            plt.savefig(chart_file, dpi=300, bbox_inches='tight')
            print(f"빈도수 차트를 {chart_file}에 저장했습니다.")
        except Exception as e:
            print(f"차트 생성 중 오류 발생: {e}")
        
        print("\n분석이 완료되었습니다!")
        return freq_df
    
    except Exception as e:
        print(f"엑셀 파일 분석 중 오류 발생: {e}")
        return None

def main():
    """메인 함수 - 인터랙티브 모드 실행"""
    print("\n엑셀 파일 키워드 분석 도구")
    print("=" * 50)
    
    # 사용자로부터 파일 경로 입력 받기
    default_file = os.path.join(os.path.dirname(os.path.abspath(__file__)), "rss_data", "rss_news_20250415_113609.xlsx")
    
    file_path = input(f"분석할 엑셀 파일 경로 (기본값: {default_file}): ").strip()
    if not file_path:
        file_path = default_file
    
    # 파일 확인
    if not os.path.exists(file_path):
        print(f"오류: 파일을 찾을 수 없습니다: {file_path}")
        return
    
    # 엑셀 파일 로드하여 컬럼 목록 표시
    try:
        df = pd.read_excel(file_path)
        print(f"\n엑셀 파일이 로드되었습니다. 크기: {df.shape[0]}행 x {df.shape[1]}열")
        print("사용 가능한 컬럼:")
        for i, col in enumerate(df.columns, 1):
            print(f"  {i}. {col}")
        
        # 분석할 컬럼 선택
        col_input = input("\n분석할 컬럼 번호를 쉼표로 구분하여 입력하세요 (예: 1,3,5): ").strip()
        selected_cols = []
        
        if col_input:
            try:
                col_indices = [int(idx.strip()) - 1 for idx in col_input.split(',')]
                selected_cols = [df.columns[idx] for idx in col_indices if 0 <= idx < len(df.columns)]
            except:
                print("컬럼 번호 파싱 오류. 기본값으로 처음 두 컬럼을 사용합니다.")
                selected_cols = df.columns[:2].tolist()
        else:
            # 기본값: 처음 두 컬럼
            selected_cols = df.columns[:2].tolist()
        
        print(f"선택된 컬럼: {', '.join(selected_cols)}")
        
        # 단어 길이 설정
        min_length = input("\n단어 최소 길이 (기본값: 2): ").strip()
        min_length = int(min_length) if min_length.isdigit() else 2
        
        max_length = input("단어 최대 길이 (기본값: 없음): ").strip()
        max_length = int(max_length) if max_length.isdigit() else None
        
        # 불용어 파일 설정
        stopwords_file = input("\n불용어 파일 경로 (기본값: 없음): ").strip()
        if stopwords_file and not os.path.exists(stopwords_file):
            print(f"경고: 불용어 파일을 찾을 수 없습니다: {stopwords_file}")
            stopwords_file = None
        
        # 출력 디렉토리 설정
        output_dir = input("\n결과 저장 디렉토리 (기본값: 엑셀 파일과 같은 위치): ").strip()
        if not output_dir:
            output_dir = os.path.dirname(os.path.abspath(file_path))
        
        if not os.path.exists(output_dir):
            try:
                os.makedirs(output_dir)
                print(f"디렉토리 생성됨: {output_dir}")
            except:
                print(f"디렉토리 생성 실패. 기본 위치를 사용합니다.")
                output_dir = os.path.dirname(os.path.abspath(file_path))
        
        # 파일 분석 실행
        print("\n분석을 시작합니다...")
        analyze_excel_file(
            file_path=file_path,
            columns=selected_cols,
            min_length=min_length,
            max_length=max_length,
            stopwords_file=stopwords_file,
            output_dir=output_dir
        )
        
    except Exception as e:
        print(f"오류 발생: {e}")

if __name__ == "__main__":
    main()
