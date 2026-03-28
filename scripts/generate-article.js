const Parser = require('rss-parser');
const fs = require('fs');
const parser = new Parser();

// 設定
const RSS_URL = 'https://zenn.dev/topics/tech/feed';
const SITE_URL = 'https://studioinstance.github.io/techpulse';
const DATE_STR = new Date().toISOString().split('T')[0];
const ARTICLE_ID = `tech-trend-${DATE_STR}`;
const FILE_NAME = `${ARTICLE_ID}.html`;
const FILE_PATH = `articles/${FILE_NAME}`;
const ARTICLE_URL = `${SITE_URL}/articles/${FILE_NAME}`;

// セキュリティ対策: 外部からの入力をHTMLエスケープ（XSS対策）する関数
function escapeHtml(unsafe) {
  if (!unsafe) return '';
  return String(unsafe)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

async function main() {
  console.log('Fetching RSS from Zenn Tech Topic...');
  const feed = await parser.parseURL(RSS_URL);
  
  // 直近5件をピックアップ
  const items = feed.items.slice(0, 5);
  if (items.length === 0) {
    console.log('No items found.');
    return;
  }

  const title = `今週のテックトレンドまとめ（${DATE_STR}）`;
  const description = `最新の技術トレンド情報をピックアップしてご紹介します。今週の注目記事 ${items.length} 件をまとめました。`;

  // HTMLの生成
  let articlesHtml = '';
  items.forEach(item => {
    const safeTitle = escapeHtml(item.title);
    const safeLink = escapeHtml(item.link);
    const safeSnippet = item.contentSnippet ? escapeHtml(item.contentSnippet.substring(0, 100)) + '...' : 'トレンドをチェックして最新の技術動向をキャッチアップしましょう！';

    articlesHtml += `
      <div class="trend-item" style="margin-bottom: 24px; padding: 16px; border: 1px solid var(--border); border-radius: 8px; background: rgba(255,255,255,0.02);">
        <h3 style="margin-bottom: 8px;"><a href="${safeLink}" target="_blank" rel="noopener noreferrer" style="color: var(--color-accent);">${safeTitle}</a></h3>
        <p style="font-size: 0.9rem; color: var(--color-text-muted);">公開日: ${new Date(item.pubDate).toLocaleDateString('ja-JP')}</p>
        <p style="margin-top: 12px; font-size: 0.95rem;">${safeSnippet}</p>
      </div>
    `;
  });

  const htmlTemplate = `<!DOCTYPE html>
<html lang="ja">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${title} - TechPulse</title>
  <meta name="description" content="${description}">
  <meta name="robots" content="index, follow">
  <link rel="canonical" href="${ARTICLE_URL}">
  <meta property="og:title" content="${title} - TechPulse">
  <meta property="og:description" content="${description}">
  <meta property="og:url" content="${ARTICLE_URL}">
  <meta property="og:type" content="article">
  <meta name="twitter:card" content="summary_large_image">
  <script type="application/ld+json">
  {
    "@context": "https://schema.org",
    "@type": "Article",
    "headline": "${title}",
    "datePublished": "${new Date().toISOString()}",
    "dateModified": "${new Date().toISOString()}",
    "author": [{ "@type": "Person", "name": "StudioInstance", "url": "https://zenn.dev/instancestudio2" }]
  }
  </script>
  <link rel="stylesheet" href="../style.css">
</head>
<body>
  <nav class="navbar"><div class="container"><a href="../index.html" class="nav-logo">⚡ TechPulse</a><ul class="nav-links"><li><a href="../index.html">ホーム</a></li><li><a href="../blog.html">ブログ</a></li><li><a href="../about.html">このサイトについて</a></li></ul></div></nav>
  
  <article class="article-container">
    <header class="article-header">
      <div class="article-meta"><span class="category">トレンド</span><span>${DATE_STR.replace(/-/g, '/')}</span></div>
      <h1>${title}</h1>
      <div class="author-info"><span>👨‍💻 StudioInstance</span></div>
    </header>
    
    <div class="article-content">
      <h2>最新の注目記事（${DATE_STR}）</h2>
      <p>${description}</p>
      ${articlesHtml}
    </div>
  </article>

  <footer class="footer"><div class="container"><div class="footer-bottom"><span>&copy; 2026 TechPulse.</span></div></div></footer>
</body>
</html>`;

  fs.writeFileSync(FILE_PATH, htmlTemplate);
  console.log(`Generated HTML: ${FILE_PATH}`);

  // 自動リンク挿入: blog.html
  const blogHtmlPath = 'blog.html';
  let blogHtml = fs.readFileSync(blogHtmlPath, 'utf8');
  const cardSnippet = `
        <article class="article-card fade-in">
          <div class="article-card-image" style="background: linear-gradient(135deg, #10b981, #06b6d4);">🔥</div>
          <div class="article-card-body">
            <div class="article-meta"><span class="category">トレンド</span><span>${DATE_STR.replace(/-/g, '/')}</span></div>
            <h3><a href="articles/${FILE_NAME}">${title}</a></h3>
            <p>${description}</p>
            <a href="articles/${FILE_NAME}" class="read-more">続きを読む →</a>
          </div>
        </article>`;
  blogHtml = blogHtml.replace(/<div class="cards-grid">/, `<div class="cards-grid">${cardSnippet}`);
  fs.writeFileSync(blogHtmlPath, blogHtml);

  // sitemap.xml
  const sitemapPath = 'sitemap.xml';
  let sitemapXml = fs.readFileSync(sitemapPath, 'utf8');
  const sitemapEntry = `
  <url>
    <loc>${ARTICLE_URL}</loc>
    <lastmod>${DATE_STR}</lastmod>
    <changefreq>monthly</changefreq>
    <priority>0.8</priority>
  </url>`;
  sitemapXml = sitemapXml.replace(/<urlset[^>]*>/, `$&${sitemapEntry}`);
  fs.writeFileSync(sitemapPath, sitemapXml);

  console.log('Updated blog.html and sitemap.xml successfully!');
}

main().catch(console.error);
