const { Telegraf } = require('telegraf');
const cron = require('node-cron');
const { TELEGRAM_BOT_TOKEN, BRIEFING_HOUR, BRIEFING_MINUTE } = require('./config');
const { fetchRecentArticles } = require('./newsFetcher');
const { summarizeNews, analyzeCompany, careerCoach, generateInterviewQA } = require('./aiService');

const bot = new Telegraf(TELEGRAM_BOT_TOKEN);

// 사용자별 대화 히스토리 (코칭 세션)
const conversationHistory = new Map();
// 코칭 중인 사용자
const coachingSessions = new Set();
// 브리핑 구독자
const subscribedChats = new Set();


bot.start((ctx) => {
  const name = ctx.from.first_name || '님';
  ctx.reply(`안녕하세요, ${name}! 👋

저는 PM/PO 이직 준비를 도와드리는 커리어 봇입니다.

📌 주요 기능
/briefing — 오늘의 IT 뉴스 브리핑 (PM 관점)
/company [회사명] — 회사 분석 & 면접 대비
/interview [주제] — 면접 Q&A 생성
/coach — 커리어 코칭 시작
/subscribe — 매일 아침 자동 브리핑 구독
/help — 도움말`);
});


bot.help((ctx) => {
  ctx.reply(`📖 사용 방법

/briefing — 지금 바로 뉴스 브리핑 받기
/company 카카오 — 카카오 면접 대비 분석
/company 토스 — 토스 면접 대비 분석
/interview 데이터분석 — 데이터 분석 면접 Q&A
/interview 프로덕트전략 — 프로덕트 전략 면접 Q&A
/coach — AI 커리어 코치와 자유 대화
/subscribe — 매일 아침 ${BRIEFING_HOUR}시 브리핑 구독
/unsubscribe — 브리핑 구독 취소`);
});


bot.command('briefing', async (ctx) => {
  await ctx.reply('🔍 최신 뉴스를 수집하고 분석 중입니다...');
  try {
    const articles = await fetchRecentArticles();
    const summary = await summarizeNews(articles);
    ctx.reply(`📰 오늘의 PM 뉴스 브리핑\n\n${summary}`);
  } catch (e) {
    console.error(e);
    ctx.reply('뉴스 수집 중 오류가 발생했습니다. 잠시 후 다시 시도해주세요.');
  }
});


bot.command('company', async (ctx) => {
  const companyName = ctx.message.text.replace('/company', '').trim();
  if (!companyName) return ctx.reply('사용법: /company 카카오');

  await ctx.reply(`🏢 ${companyName} 분석 중...`);
  try {
    const analysis = await analyzeCompany(companyName);
    ctx.reply(`🏢 ${companyName} 면접 대비 분석\n\n${analysis}`);
  } catch (e) {
    console.error(e);
    ctx.reply('분석 중 오류가 발생했습니다.');
  }
});


bot.command('interview', async (ctx) => {
  const topic = ctx.message.text.replace('/interview', '').trim();
  if (!topic) return ctx.reply('사용법: /interview 데이터분석');

  await ctx.reply(`🎯 ${topic} 면접 Q&A 생성 중...`);
  try {
    const qa = await generateInterviewQA(topic);
    ctx.reply(`🎯 ${topic} 면접 Q&A\n\n${qa}`);
  } catch (e) {
    console.error(e);
    ctx.reply('생성 중 오류가 발생했습니다.');
  }
});


bot.command('coach', (ctx) => {
  const chatId = ctx.chat.id;
  conversationHistory.set(chatId, []);
  coachingSessions.add(chatId);
  ctx.reply(`💬 커리어 코칭 모드 시작!

PM/PO 이직, 면접 준비, 커리어 고민 무엇이든 물어보세요.
종료하려면 /end 를 입력하세요.`);
});


bot.command('end', (ctx) => {
  const chatId = ctx.chat.id;
  coachingSessions.delete(chatId);
  conversationHistory.delete(chatId);
  ctx.reply('코칭 세션을 종료합니다. 이직 준비 화이팅! 🚀');
});


bot.command('subscribe', (ctx) => {
  subscribedChats.add(ctx.chat.id);
  ctx.reply(`✅ 매일 아침 ${BRIEFING_HOUR}시 브리핑을 구독했습니다!`);
});


bot.command('unsubscribe', (ctx) => {
  subscribedChats.delete(ctx.chat.id);
  ctx.reply('❌ 브리핑 구독을 취소했습니다.');
});


// 코칭 일반 메시지 처리
bot.on('text', async (ctx) => {
  const chatId = ctx.chat.id;
  if (!coachingSessions.has(chatId)) return;

  await ctx.reply('💭 생각 중...');
  try {
    const history = conversationHistory.get(chatId) || [];
    const response = await careerCoach(ctx.message.text, history);

    history.push({ role: 'user', content: ctx.message.text });
    history.push({ role: 'assistant', content: response });
    conversationHistory.set(chatId, history.slice(-20));

    ctx.reply(response);
  } catch (e) {
    console.error(e);
    ctx.reply('응답 중 오류가 발생했습니다.');
  }
});


// 매일 자동 브리핑
cron.schedule(`${BRIEFING_MINUTE} ${BRIEFING_HOUR} * * *`, async () => {
  if (!subscribedChats.size) return;
  try {
    const articles = await fetchRecentArticles();
    const summary = await summarizeNews(articles);
    const message = `🌅 오늘의 PM 뉴스 브리핑\n\n${summary}`;
    for (const chatId of subscribedChats) {
      bot.telegram.sendMessage(chatId, message).catch(e => {
        console.error(`브리핑 전송 실패 ${chatId}:`, e.message);
        subscribedChats.delete(chatId);
      });
    }
  } catch (e) {
    console.error('브리핑 오류:', e);
  }
}, { timezone: 'Asia/Seoul' });


bot.launch();
console.log('봇 시작!');

process.once('SIGINT', () => bot.stop('SIGINT'));
process.once('SIGTERM', () => bot.stop('SIGTERM'));
