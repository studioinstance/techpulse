const { TwitterApi } = require('twitter-api-v2');

console.log('🤖 Auto-Tweet bot executing...');

const DATE_STR = new Date().toISOString().split('T')[0];
const SITE_URL = 'https://studioinstance.github.io/techpulse/blog.html';

const tweetText = `🚨【更新情報】\n今週の最新AIドキュメント・トレンド（${DATE_STR}）を自動生成＆公開しました！\n\nLLM、生成AIの動向をさくっとチェック👇\n${SITE_URL}\n\n#TechPulse #AI #ChatGPT #生成AI #テックブログ`;

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
