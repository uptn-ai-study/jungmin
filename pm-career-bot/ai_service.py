import google.generativeai as genai
from config import GEMINI_API_KEY

genai.configure(api_key=GEMINI_API_KEY)

GEMINI_MODEL = "gemini-2.0-flash"

SYSTEM_PROMPT = """당신은 PM/PO 이직 준비를 돕는 전문 커리어 코치입니다.
IT 업계 동향, 서비스 런칭, 기업 정보를 PM/PO 관점에서 분석하고,
면접 준비에 도움이 되는 인사이트를 제공합니다.

분석 시 항상 다음을 포함하세요:
- PM/PO 관점의 핵심 포인트
- 면접에서 활용할 수 있는 시사점
- 해당 트렌드가 프로덕트에 미치는 영향
"""


def _call(prompt: str, history: list[dict] | None = None) -> str:
    model = genai.GenerativeModel(
        model_name=GEMINI_MODEL,
        system_instruction=SYSTEM_PROMPT,
    )
    if history:
        chat = model.start_chat(history=history)
        response = chat.send_message(prompt)
    else:
        response = model.generate_content(prompt)
    return response.text


def summarize_news(articles: list[dict]) -> str:
    if not articles:
        return "오늘은 수집된 기사가 없습니다."

    articles_text = "\n\n".join([
        f"[{a['category'].upper()}] {a['title']}\n출처: {a['source']}\n{a['summary']}"
        for a in articles
    ])

    return _call(f"""다음 IT/테크 뉴스들을 PM/PO 이직 준비 관점에서 요약해주세요.

{articles_text}

요약 형식:
📌 오늘의 핵심 트렌드 (3줄 요약)
📰 주목할 뉴스 TOP 3 (각각 제목 + PM 관점 인사이트 1-2문장)
💡 면접 활용 포인트 (오늘 뉴스 중 면접에서 쓸 수 있는 것)
""")


def analyze_company(company_name: str) -> str:
    return _call(f"""'{company_name}' 회사에 PM/PO로 지원한다고 가정하고 다음을 분석해주세요:

1. 🏢 회사 프로덕트 현황 (주요 서비스, 최근 업데이트)
2. 📈 비즈니스 전략 & 방향성
3. 🎯 예상 면접 질문 TOP 5
4. ✅ 면접 준비 체크리스트
5. 💬 지원자가 꼭 알아야 할 것

PM/PO 면접 대비 실용적인 정보로 작성해주세요.
""")


def career_coach(user_message: str, history: list[dict]) -> str:
    # Gemini history format: [{"role": "user"/"model", "parts": ["..."]}]
    gemini_history = [
        {"role": "model" if m["role"] == "assistant" else "user", "parts": [m["content"]]}
        for m in history
    ]
    return _call(user_message, history=gemini_history if gemini_history else None)


def generate_interview_qa(topic: str) -> str:
    return _call(f"""PM/PO 면접에서 '{topic}' 주제로 나올 수 있는 질문과 모범 답변을 만들어주세요.

형식:
Q1. [질문]
A1. [모범 답변 - STAR 기법 활용]

Q2. [질문]
A2. [모범 답변]

Q3. [질문]
A3. [모범 답변]

각 답변은 구체적인 예시와 수치를 포함해주세요.
""")
