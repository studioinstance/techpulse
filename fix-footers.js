const fs = require('fs');
const path = require('path');

const rootFooter = `  <footer class="footer"><div class="container">
    <div class="footer-grid">
      <div class="footer-brand"><a href="index.html" class="nav-logo">⚡ TechPulse</a><p>テクノロジーの最新トレンドを発信するテックブログ。</p></div>
      <div class="footer-col"><h4>ナビゲーション</h4><ul><li><a href="index.html">ホーム</a></li><li><a href="blog.html">ブログ</a></li><li><a href="about.html">このサイトについて</a></li></ul></div>
      <div class="footer-col"><h4>カテゴリ</h4><ul><li><a href="blog.html">Web開発</a></li><li><a href="blog.html">AI</a></li><li><a href="blog.html">クラウド</a></li></ul></div>
      <div class="footer-col"><h4>リンク</h4><ul><li><a href="sitemap.xml">サイトマップ</a></li><li><a href="privacy-policy.html">プライバシーポリシー</a></li><li><a href="feed.xml">RSSフィード</a></li></ul></div>
    </div>
    <div class="footer-bottom"><span>&copy; 2026 TechPulse. All rights reserved.</span><span>Made with ❤️</span></div>
  </div></footer>`;

const articleFooter = `  <footer class="footer"><div class="container">
    <div class="footer-grid">
      <div class="footer-brand"><a href="../index.html" class="nav-logo">⚡ TechPulse</a><p>テクノロジーの最新トレンドを発信するテックブログ。</p></div>
      <div class="footer-col"><h4>ナビゲーション</h4><ul><li><a href="../index.html">ホーム</a></li><li><a href="../blog.html">ブログ</a></li><li><a href="../about.html">このサイトについて</a></li></ul></div>
      <div class="footer-col"><h4>カテゴリ</h4><ul><li><a href="../blog.html">Web開発</a></li><li><a href="../blog.html">AI</a></li><li><a href="../blog.html">クラウド</a></li></ul></div>
      <div class="footer-col"><h4>リンク</h4><ul><li><a href="../sitemap.xml">サイトマップ</a></li><li><a href="../privacy-policy.html">プライバシーポリシー</a></li><li><a href="../feed.xml">RSSフィード</a></li></ul></div>
    </div>
    <div class="footer-bottom"><span>&copy; 2026 TechPulse. All rights reserved.</span><span>Made with ❤️</span></div>
  </div></footer>`;

function replaceFooter(filePath, newFooter) {
  let content = fs.readFileSync(filePath, 'utf8');
  // Match the entire footer block including minified versions
  const footerRegex = /<footer\s+class="(?:\w*\s*)?footer(?:[^"]*)">[\s\S]*?<\/footer>/i;
  
  if (footerRegex.test(content)) {
    content = content.replace(footerRegex, newFooter);
    fs.writeFileSync(filePath, content);
    console.log(`✅ Fixed footer in ${filePath}`);
  } else {
    // If exact block not found, this might be privacy-policy or next-js-master which lacks the exact same regex if malformed, wait, the regex is greedy... use non-greedy
    console.log(`❌ Footer not found or regex failed in ${filePath}`);
  }
}

// 1. Root files
const rootFiles = ['index.html', 'blog.html', 'about.html', 'privacy-policy.html', '404.html'];
rootFiles.forEach(file => {
  if (fs.existsSync(file)) replaceFooter(file, rootFooter);
});

// 2. Article files
const articlesDir = 'articles';
const articleFiles = fs.readdirSync(articlesDir).filter(f => f.endsWith('.html'));
articleFiles.forEach(file => {
  replaceFooter(path.join(articlesDir, file), articleFooter);
});

// Since the auto-generated articles should have the correct footer moving forward, 
// update generate-article.js to use the unified footer structural string.
const scriptPath = 'scripts/generate-article.js';
if (fs.existsSync(scriptPath)) {
  let scriptContent = fs.readFileSync(scriptPath, 'utf8');
  const miniFooter = `<footer class="footer"><div class="container"><div class="footer-grid"><div class="footer-brand"><a href="../index.html" class="nav-logo">⚡ TechPulse</a><p>テクノロジーの最新トレンドを発信するテックブログ。</p></div><div class="footer-col"><h4>ナビゲーション</h4><ul><li><a href="../index.html">ホーム</a></li><li><a href="../blog.html">ブログ</a></li><li><a href="../about.html">このサイトについて</a></li></ul></div><div class="footer-col"><h4>カテゴリ</h4><ul><li><a href="../blog.html">Web開発</a></li><li><a href="../blog.html">AI</a></li><li><a href="../blog.html">クラウド</a></li></ul></div><div class="footer-col"><h4>リンク</h4><ul><li><a href="../sitemap.xml">サイトマップ</a></li><li><a href="../privacy-policy.html">プライバシーポリシー</a></li><li><a href="../feed.xml">RSSフィード</a></li></ul></div></div><div class="footer-bottom"><span>&copy; 2026 TechPulse. All rights reserved.</span></div></div></footer>`;
  
  // replace the naive footer in the script
  scriptContent = scriptContent.replace(/<footer class="footer"><div class="container"><div class="footer-bottom"><span>&copy; 2026 TechPulse.<\/span><\/div><\/div><\/footer>/g, miniFooter);
  fs.writeFileSync(scriptPath, scriptContent);
  console.log('✅ Updated generate-article.js script footer template.');
}

console.log('All footers fixed.');
