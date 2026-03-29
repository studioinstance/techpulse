const { TwitterApi } = require('twitter-api-v2');

console.log('🤖 Auto-Tweet bot executing...');

const DATE_STR = new Date().toISOString().split('T')[0];
const SITE_URL = 'https://studioinstance.github.io/techpulse/articles/ai-future-and-engineers-2026.html';

const tweetText = `🧭【新記事公開】AI時代にITエンジニアはどう生き残るか？

雇用市場の最新データ、需給バランスの構造変化、求められる5つのスキル、具体的アクションプランを徹底解説しました。

全エンジニア必読👇
${SITE_URL}

#TechPulse #AI #エンジニア #キャリア #生成AI`;

async function main() {
  const client = new TwitterApi({
    appKey: process.env.TWITTER_API_KEY,
    appSecret: process.env.TWITTER_API_SECRET,
    accessToken: process.env.TWITTER_ACCESS_TOKEN,
    accessSecret: process.env.TWITTER_ACCESS_TOKEN_SECRET,
  });

  try {
    const rwClient = client.readWrite;
    const { data } = await rwClient.v2.tweet(tweetText);
    console.log('✅ Post successful!', data.id);
  } catch (err) {
    console.error('❌ Failed to post tweet:', err);
    process.exit(1);
  }
}

main();
