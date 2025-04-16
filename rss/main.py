import requests
from bs4 import BeautifulSoup
import pandas as pd
from datetime import datetime
import os

# RSS 링크 목록
rss_links = {
    "구글 뉴스": "https://news.google.com/rss?hl=ko&gl=KR&ceid=KR:ko",
    "매일경제 헤드라인": "https://www.mk.co.kr/rss/30000001/",
    "매일경제 전체": "https://www.mk.co.kr/rss/40300001/",
    "매일경제 경제": "https://www.mk.co.kr/rss/30100041/",
    "매일경제 정치": "https://www.mk.co.kr/rss/30200030/",
    "매일경제 사회": "https://www.mk.co.kr/rss/50400012/",
    "매일경제 증권": "https://www.mk.co.kr/rss/50200011/",
    "매일경제 부동산": "https://www.mk.co.kr/rss/50300009/",
    "매일경제 문화연예": "https://www.mk.co.kr/rss/30000023/",
    "매일경제 기업": "https://www.mk.co.kr/rss/50100032/",
    "매일경제 국제": "https://www.mk.co.kr/rss/30300018/"
}

def get_feed_data(feed_url, source_name):
    try:
        response = requests.get(feed_url)
        response.raise_for_status()  # 오류 발생시 예외 발생
        
        soup = BeautifulSoup(response.content, 'xml')
        items = soup.find_all('item')
        
        data_list = []
        
        for item in items:
            # 필요한 데이터 추출
            title = item.find('title').text if item.find('title') else "제목 없음"
            link = item.find('link').text if item.find('link') else "링크 없음"
            
            # 본문 내용 가져오기 (요약 또는 전체 내용)
            if item.find('description'):
                content = item.find('description').text
            elif item.find('content:encoded'):
                content = item.find('content:encoded').text
            else:
                content = "내용 없음"
            
            # 발행일 정보 가져오기
            if item.find('pubDate'):
                published_date = item.find('pubDate').text
            else:
                published_date = "날짜 정보 없음"
            
            data_list.append({
                "출처": source_name,
                "제목": title,
                "내용": content,
                "링크": link,
                "발행일": published_date
            })
        
        return data_list
    except Exception as e:
        print(f"{source_name} 파싱 중 오류 발생: {e}")
        return []

def main():
    all_data = []
    
    # 각 RSS 피드에서 데이터 가져오기
    for source_name, rss_url in rss_links.items():
        print(f"{source_name} 데이터 가져오는 중...")
        feed_data = get_feed_data(rss_url, source_name)
        all_data.extend(feed_data)
        print(f"{source_name}에서 {len(feed_data)}개의 기사를 가져왔습니다.")
    
    # 데이터프레임 생성
    df = pd.DataFrame(all_data)
    
    # 결과 저장할 폴더 생성
    output_dir = "rss_data"
    if not os.path.exists(output_dir):
        os.makedirs(output_dir)
    
    # 현재 날짜와 시간을 파일명에 포함
    current_time = datetime.now().strftime("%Y%m%d_%H%M%S")
    excel_filename = f"{output_dir}/rss_news_{current_time}.xlsx"
    
    # 엑셀 파일로 저장
    df.to_excel(excel_filename, index=False, engine='openpyxl')
    print(f"\n총 {len(all_data)}개의 기사를 {excel_filename}에 저장했습니다.")
    
    return excel_filename

if __name__ == "__main__":
    main()