const fs = require('fs');
const path = require('path');
const cheerio = require('cheerio');

const dirs = [
  path.join(__dirname, '../articles'),
  path.join(__dirname, '../en/articles')
];

function convertFile(filePath) {
  // すでに新デザインが適用されている最新記事はスキップ
  if (filePath.endsWith('data-scientist-future-ai.html')) return;

  const html = fs.readFileSync(filePath, 'utf-8');
  const $ = cheerio.load(html, { decodeEntities: false });

  // 1. 本文・ヘッダー内のインラインスタイルを削除
  // ただし、シンタックスハイライト等で必要なspanのstyleは除くか？ -> 全置き換えは危険かも。
  // 今回は強気に .article-content 全体のインラインスタイルを消す（新CSSで賄うため）
  $('.article-content').find('[style]').removeAttr('style');
  $('.article-content').removeAttr('style');
  $('.article-header').find('[style]').removeAttr('style');
  $('.article-header').removeAttr('style');

  // 2. body内の <style> タグを削除（不要なインラインスタイル定義）
  $('body style').remove();

  // 3. 古い構造（TechPulseでの旧クラス）の変換
  // 旧 <header class="article-hero"> -> <header class="article-header">
  $('header.article-hero').each(function() {
    $(this).removeClass('article-hero').addClass('article-header');
  });

  // <nav class="toc"> -> <div class="toc">
  $('nav.toc').each(function() {
    const content = $(this).html();
    $(this).replaceWith(`<div class="toc">${content}</div>`);
  });

  // h1のインラインスタイル削除（念のため）
  $('h1').removeAttr('style');
  $('h2').removeAttr('style');
  $('h3').removeAttr('style');
  $('p').removeAttr('style');

  // 保存
  fs.writeFileSync(filePath, $.html());
  console.log('Updated:', path.basename(filePath));
}

dirs.forEach(dir => {
  if (fs.existsSync(dir)) {
    const files = fs.readdirSync(dir);
    files.forEach(file => {
      if (file.endsWith('.html')) {
        convertFile(path.join(dir, file));
      }
    });
  }
});

console.log('All articles processed successfully.');
