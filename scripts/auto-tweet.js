const { TwitterApi } = require('twitter-api-v2');
const fs = require('fs');
const path = require('path');

console.log('🤖 Auto-Tweet bot executing (bilingual JP+EN)...');

const DATE_STR = new Date().toISOString().split('T')[0];

// 最新の記事を自動検出（articles/ ディレクトリの最新ファイル）
function findLatestArticle() {
  const articlesDir = path.join(__dirname, '..', 'articles');
  const files = fs.readdirSync(articlesDir)
    .filter(f => f.endsWith('.html'))
    .map(f => ({
      name: f,
      mtime: fs.statSync(path.join(articlesDir, f)).mtime,
    }))
    .sort((a, b) => b.mtime - a.mtime);
  return files.length > 0 ? files[0].name : null;
}

// HTMLファイルからタイトルを抽出
function extractTitle(filePath) {
  if (!fs.existsSync(filePath)) return '';
  const html = fs.readFileSync(filePath, 'utf8');
  // <title>...</title> から抽出（"- TechPulse" を除去）
  const titleMatch = html.match(/<title>(.*?)(?:\s*-\s*TechPulse)?\s*<\/title>/);
  if (titleMatch) return titleMatch[1].trim();
  // フォールバック: <h1>
  const h1Match = html.match(/<h1[^>]*>(.*?)<\/h1>/);
  if (h1Match) return h1Match[1].replace(/<[^>]*>/g, '').trim();
  return '';
}

const latestFile = findLatestArticle();
if (!latestFile) {
  console.log('No article found to tweet.');
  process.exit(0);
}

const SITE_URL = 'https://studioinstance.github.io/techpulse';
const jpFilePath = path.join(__dirname, '..', 'articles', latestFile);
const enFilePath = path.join(__dirname, '..', 'en', 'articles', latestFile);

const jpTitle = extractTitle(jpFilePath);
const jpUrl = `${SITE_URL}/articles/${latestFile}`;

const enTitle = extractTitle(enFilePath);
const enUrl = `${SITE_URL}/en/articles/${latestFile}`;

// 日英バイリンガルのツイート文を構築
let tweetText = `📝【新記事公開 / New Article】\n\n`;
tweetText += `🇯🇵 ${jpTitle || '新しいテック記事'}\n`;
tweetText += `${jpUrl}\n\n`;

if (enTitle && fs.existsSync(enFilePath)) {
  tweetText += `🇬🇧 ${enTitle}\n`;
  tweetText += `${enUrl}\n\n`;
}

tweetText += `#TechPulse #テックブログ #TechBlog #AI #エンジニア`;

console.log(`Tweet text (${tweetText.length} chars):\n${tweetText}`);

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
    console.log('✅ Bilingual tweet posted!', data.id);
  } catch (err) {
    console.error('❌ Failed to post tweet:', err);
    process.exit(1);
  }
}

main();
