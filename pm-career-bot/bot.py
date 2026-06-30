import logging
from telegram import Update, BotCommand
from telegram.ext import (
    Application, CommandHandler, MessageHandler,
    ContextTypes, filters, ConversationHandler
)
from apscheduler.schedulers.asyncio import AsyncIOScheduler

from config import TELEGRAM_BOT_TOKEN, BRIEFING_HOUR, BRIEFING_MINUTE
from news_fetcher import fetch_recent_articles
from ai_service import summarize_news, analyze_company, career_coach, generate_interview_qa

logging.basicConfig(
    format="%(asctime)s - %(name)s - %(levelname)s - %(message)s",
    level=logging.INFO
)
logger = logging.getLogger(__name__)

# 대화 상태
COACHING = 1

# 사용자별 대화 히스토리 (메모리 기반)
conversation_history: dict[int, list[dict]] = {}

# 브리핑을 받을 채팅 ID 목록
subscribed_chats: set[int] = set()


# ── 커맨드 핸들러 ──────────────────────────────────────────

async def start(update: Update, context: ContextTypes.DEFAULT_TYPE):
    """봇 시작 메시지"""
    user = update.effective_user
    text = f"""안녕하세요, {user.first_name}님! 👋

저는 PM/PO 이직 준비를 도와드리는 커리어 봇입니다.

📌 **주요 기능**
/briefing — 오늘의 IT 뉴스 브리핑 (PM 관점)
/company [회사명] — 회사 분석 & 면접 대비
/interview [주제] — 면접 Q&A 생성
/coach — 커리어 코칭 시작
/subscribe — 매일 아침 자동 브리핑 구독
/help — 도움말
"""
    await update.message.reply_text(text, parse_mode="Markdown")


async def help_command(update: Update, context: ContextTypes.DEFAULT_TYPE):
    text = """📖 **사용 방법**

`/briefing` — 지금 바로 뉴스 브리핑 받기
`/company 카카오` — 카카오 면접 대비 분석
`/company 토스` — 토스 면접 대비 분석
`/interview 데이터 분석` — 데이터 분석 관련 면접 Q&A
`/interview 프로덕트 전략` — 프로덕트 전략 면접 Q&A
`/coach` — AI 커리어 코치와 자유 대화
`/subscribe` — 매일 아침 8시 브리핑 구독
`/unsubscribe` — 브리핑 구독 취소
"""
    await update.message.reply_text(text, parse_mode="Markdown")


async def briefing(update: Update, context: ContextTypes.DEFAULT_TYPE):
    """즉시 뉴스 브리핑"""
    await update.message.reply_text("🔍 최신 뉴스를 수집하고 분석 중입니다...")

    articles = fetch_recent_articles(hours=24)
    summary = summarize_news(articles)

    await update.message.reply_text(
        f"📰 **오늘의 PM 뉴스 브리핑**\n\n{summary}",
        parse_mode="Markdown"
    )


async def company(update: Update, context: ContextTypes.DEFAULT_TYPE):
    """회사 분석"""
    if not context.args:
        await update.message.reply_text("사용법: `/company 카카오`", parse_mode="Markdown")
        return

    company_name = " ".join(context.args)
    await update.message.reply_text(f"🏢 **{company_name}** 분석 중...")

    analysis = analyze_company(company_name)

    await update.message.reply_text(
        f"🏢 **{company_name} 면접 대비 분석**\n\n{analysis}",
        parse_mode="Markdown"
    )


async def interview(update: Update, context: ContextTypes.DEFAULT_TYPE):
    """면접 Q&A 생성"""
    if not context.args:
        await update.message.reply_text("사용법: `/interview 데이터 분석`", parse_mode="Markdown")
        return

    topic = " ".join(context.args)
    await update.message.reply_text(f"🎯 **{topic}** 면접 Q&A 생성 중...")

    qa = generate_interview_qa(topic)

    await update.message.reply_text(
        f"🎯 **{topic} 면접 Q&A**\n\n{qa}",
        parse_mode="Markdown"
    )


async def coach_start(update: Update, context: ContextTypes.DEFAULT_TYPE):
    """커리어 코칭 시작"""
    user_id = update.effective_user.id
    conversation_history[user_id] = []

    await update.message.reply_text(
        "💬 **커리어 코칭 모드** 시작!\n\n"
        "PM/PO 이직, 면접 준비, 커리어 고민 무엇이든 물어보세요.\n"
        "종료하려면 `/end` 를 입력하세요.",
        parse_mode="Markdown"
    )
    return COACHING


async def coach_chat(update: Update, context: ContextTypes.DEFAULT_TYPE):
    """코칭 대화 처리"""
    user_id = update.effective_user.id
    user_message = update.message.text

    history = conversation_history.get(user_id, [])

    await update.message.reply_text("💭 생각 중...")

    response = career_coach(user_message, history)

    # 히스토리 업데이트 (최근 10턴 유지)
    history.append({"role": "user", "content": user_message})
    history.append({"role": "assistant", "content": response})
    conversation_history[user_id] = history[-20:]

    await update.message.reply_text(response)
    return COACHING


async def coach_end(update: Update, context: ContextTypes.DEFAULT_TYPE):
    """코칭 종료"""
    user_id = update.effective_user.id
    conversation_history.pop(user_id, None)

    await update.message.reply_text(
        "코칭 세션을 종료합니다. 이직 준비 화이팅! 🚀"
    )
    return ConversationHandler.END


async def subscribe(update: Update, context: ContextTypes.DEFAULT_TYPE):
    """브리핑 구독"""
    chat_id = update.effective_chat.id
    subscribed_chats.add(chat_id)
    await update.message.reply_text(
        f"✅ 매일 아침 {BRIEFING_HOUR}시 브리핑을 구독했습니다!"
    )


async def unsubscribe(update: Update, context: ContextTypes.DEFAULT_TYPE):
    """브리핑 구독 취소"""
    chat_id = update.effective_chat.id
    subscribed_chats.discard(chat_id)
    await update.message.reply_text("❌ 브리핑 구독을 취소했습니다.")


# ── 스케줄러 ──────────────────────────────────────────

async def send_daily_briefing(application: Application):
    """구독자에게 매일 브리핑 전송"""
    if not subscribed_chats:
        return

    articles = fetch_recent_articles(hours=24)
    summary = summarize_news(articles)
    message = f"🌅 **오늘의 PM 뉴스 브리핑**\n\n{summary}"

    for chat_id in list(subscribed_chats):
        try:
            await application.bot.send_message(
                chat_id=chat_id,
                text=message,
                parse_mode="Markdown"
            )
        except Exception as e:
            logger.error(f"브리핑 전송 실패 {chat_id}: {e}")
            subscribed_chats.discard(chat_id)


# ── 메인 ──────────────────────────────────────────

def main():
    app = Application.builder().token(TELEGRAM_BOT_TOKEN).build()

    # 봇 커맨드 설정
    commands = [
        BotCommand("start", "봇 시작"),
        BotCommand("briefing", "오늘의 IT 뉴스 브리핑"),
        BotCommand("company", "회사 분석 (예: /company 카카오)"),
        BotCommand("interview", "면접 Q&A (예: /interview 데이터분석)"),
        BotCommand("coach", "AI 커리어 코칭 시작"),
        BotCommand("subscribe", "매일 브리핑 구독"),
        BotCommand("unsubscribe", "브리핑 구독 취소"),
        BotCommand("help", "도움말"),
    ]

    # 핸들러 등록
    coach_handler = ConversationHandler(
        entry_points=[CommandHandler("coach", coach_start)],
        states={COACHING: [MessageHandler(filters.TEXT & ~filters.COMMAND, coach_chat)]},
        fallbacks=[CommandHandler("end", coach_end)],
    )

    app.add_handler(CommandHandler("start", start))
    app.add_handler(CommandHandler("help", help_command))
    app.add_handler(CommandHandler("briefing", briefing))
    app.add_handler(CommandHandler("company", company))
    app.add_handler(CommandHandler("interview", interview))
    app.add_handler(CommandHandler("subscribe", subscribe))
    app.add_handler(CommandHandler("unsubscribe", unsubscribe))
    app.add_handler(coach_handler)

    # 스케줄러 설정
    scheduler = AsyncIOScheduler()
    scheduler.add_job(
        send_daily_briefing,
        "cron",
        hour=BRIEFING_HOUR,
        minute=BRIEFING_MINUTE,
        args=[app]
    )
    scheduler.start()

    logger.info("봇 시작!")
    app.run_polling(allowed_updates=Update.ALL_TYPES)


if __name__ == "__main__":
    main()
