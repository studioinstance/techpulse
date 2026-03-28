"""
TechPulse SEO健全性チェッカー (SEO Health Checker)
===================================================
サイト全ページを自動スキャンし、SEO上の問題点を検出・レポートします。

チェック項目:
- タイトルタグの有無と文字数
- メタディスクリプションの有無と文字数
- h1タグの有無と重複
- 画像altタグの漏れ
- 内部リンク切れ
- canonical URLの有無
- OGPタグの有無
- 構造化データ(JSON-LD)の有無
- hreflangタグの有無（多言語対応）
"""

import os
import re
import json
from datetime import datetime

def find_html_files(root_dir):
    """HTMLファイルを再帰的に検索"""
    html_files = []
    for dirpath, dirnames, filenames in os.walk(root_dir):
        # 不要なディレクトリをスキップ
        dirnames[:] = [d for d in dirnames if d not in ['.git', 'node_modules', '.github']]
        for f in filenames:
            if f.endswith('.html') and f != 'googlee14b2893435f75f6.html':
                html_files.append(os.path.join(dirpath, f))
    return html_files

def check_page(filepath, root_dir):
    """1ページ分のSEOチェックを実行"""
    with open(filepath, 'r', encoding='utf-8') as f:
        content = f.read()
    
    relative = os.path.relpath(filepath, root_dir)
    issues = []
    warnings = []
    good = []

    # 1. タイトルタグ
    title_match = re.search(r'<title>(.*?)</title>', content, re.DOTALL)
    if title_match:
        title = title_match.group(1).strip()
        title_len = len(title)
        if title_len < 15:
            warnings.append(f"タイトルが短すぎます ({title_len}文字): '{title}'。30-60文字が推奨。")
        elif title_len > 70:
            warnings.append(f"タイトルが長すぎます ({title_len}文字): '{title[:50]}...'。60文字以下が推奨。")
        else:
            good.append(f"タイトル OK ({title_len}文字)")
    else:
        issues.append("❌ <title>タグが見つかりません")

    # 2. メタディスクリプション
    desc_match = re.search(r'<meta\s+name="description"\s+content="([^"]*)"', content)
    if desc_match:
        desc = desc_match.group(1)
        desc_len = len(desc)
        if desc_len < 50:
            warnings.append(f"メタディスクリプションが短すぎます ({desc_len}文字)。120-160文字が推奨。")
        elif desc_len > 170:
            warnings.append(f"メタディスクリプションが長すぎます ({desc_len}文字)。160文字以下が推奨。")
        else:
            good.append(f"メタディスクリプション OK ({desc_len}文字)")
    else:
        issues.append("❌ meta descriptionが見つかりません")

    # 3. h1タグ
    h1_matches = re.findall(r'<h1[^>]*>(.*?)</h1>', content, re.DOTALL)
    if len(h1_matches) == 0:
        issues.append("❌ <h1>タグが見つかりません")
    elif len(h1_matches) > 1:
        warnings.append(f"⚠️ <h1>タグが{len(h1_matches)}個あります（1個が推奨）")
    else:
        good.append("h1タグ OK (1個)")

    # 4. 画像altタグ
    img_tags = re.findall(r'<img\s[^>]*>', content)
    img_no_alt = [img for img in img_tags if 'alt=' not in img or 'alt=""' in img]
    if img_no_alt:
        warnings.append(f"⚠️ alt属性のない画像が{len(img_no_alt)}枚あります")
    elif img_tags:
        good.append(f"画像alt属性 OK ({len(img_tags)}枚全て設定済み)")

    # 5. canonical URL
    if 'rel="canonical"' in content:
        good.append("canonical URL OK")
    else:
        warnings.append("⚠️ canonical URLが設定されていません")

    # 6. OGPタグ
    ogp_tags = ['og:title', 'og:description', 'og:type', 'og:url']
    missing_ogp = [tag for tag in ogp_tags if f'property="{tag}"' not in content]
    if missing_ogp:
        warnings.append(f"⚠️ OGPタグ不足: {', '.join(missing_ogp)}")
    else:
        good.append("OGPタグ完備")

    # 7. 構造化データ(JSON-LD)
    if 'application/ld+json' in content:
        good.append("構造化データ(JSON-LD) OK")
    else:
        warnings.append("⚠️ 構造化データ(JSON-LD)がありません")

    # 8. hreflangタグ
    if 'hreflang' in content:
        good.append("hreflang(多言語SEO) OK")
    else:
        warnings.append("⚠️ hreflangタグがありません（多言語対応が不完全）")

    # 9. Twitter Card
    if 'twitter:card' in content:
        good.append("Twitter Card OK")
    else:
        warnings.append("⚠️ Twitter Cardメタタグがありません")

    # 10. robots meta
    if 'name="robots"' in content:
        good.append("robots meta OK")

    # 11. 内部リンクのチェック
    internal_links = re.findall(r'href="([^"#]*\.html)"', content)
    broken_links = []
    for link in internal_links:
        if link.startswith('http'):
            continue
        link_path = os.path.normpath(os.path.join(os.path.dirname(filepath), link))
        if not os.path.exists(link_path):
            broken_links.append(link)
    if broken_links:
        issues.append(f"❌ リンク切れ: {', '.join(broken_links[:5])}")
    elif internal_links:
        good.append(f"内部リンク OK ({len(internal_links)}件)")

    return {
        'file': relative,
        'issues': issues,
        'warnings': warnings,
        'good': good,
        'score': max(0, 100 - len(issues) * 15 - len(warnings) * 5)
    }

def generate_report(results, output_path):
    """HTMLレポートを生成"""
    total_score = sum(r['score'] for r in results) / len(results) if results else 0
    total_issues = sum(len(r['issues']) for r in results)
    total_warnings = sum(len(r['warnings']) for r in results)
    
    html = f"""<!DOCTYPE html>
<html lang="ja">
<head>
<meta charset="UTF-8"><meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>SEO Health Report - TechPulse</title>
<style>
  * {{ margin: 0; padding: 0; box-sizing: border-box; }}
  body {{ font-family: 'Inter', 'Noto Sans JP', sans-serif; background: #0f172a; color: #e2e8f0; padding: 40px 20px; }}
  .container {{ max-width: 1000px; margin: 0 auto; }}
  h1 {{ font-size: 2rem; margin-bottom: 8px; background: linear-gradient(135deg, #10b981, #06b6d4); -webkit-background-clip: text; -webkit-text-fill-color: transparent; }}
  .summary {{ display: grid; grid-template-columns: repeat(4, 1fr); gap: 16px; margin: 24px 0; }}
  .summary-card {{ background: rgba(255,255,255,0.05); border: 1px solid rgba(255,255,255,0.1); border-radius: 12px; padding: 20px; text-align: center; }}
  .summary-card .number {{ font-size: 2.5rem; font-weight: 800; }}
  .summary-card .label {{ font-size: 0.85rem; color: #94a3b8; margin-top: 4px; }}
  .score-good {{ color: #10b981; }}
  .score-warn {{ color: #f59e0b; }}
  .score-bad {{ color: #ef4444; }}
  .page-result {{ background: rgba(255,255,255,0.03); border: 1px solid rgba(255,255,255,0.08); border-radius: 12px; padding: 20px; margin-bottom: 16px; }}
  .page-result h3 {{ font-size: 1.1rem; margin-bottom: 12px; color: #fff; }}
  .tag {{ display: inline-block; padding: 2px 10px; border-radius: 20px; font-size: 0.8rem; margin-right: 6px; margin-bottom: 4px; }}
  .tag-issue {{ background: rgba(239,68,68,0.2); color: #ef4444; }}
  .tag-warn {{ background: rgba(245,158,11,0.2); color: #f59e0b; }}
  .tag-good {{ background: rgba(16,185,129,0.2); color: #10b981; }}
  .score-badge {{ float: right; font-size: 1.5rem; font-weight: 800; }}
  .timestamp {{ color: #64748b; font-size: 0.85rem; margin-bottom: 24px; }}
</style>
</head>
<body>
<div class="container">
  <h1>🔍 SEO Health Report</h1>
  <p class="timestamp">Generated: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}</p>
  
  <div class="summary">
    <div class="summary-card">
      <div class="number {'score-good' if total_score >= 80 else 'score-warn' if total_score >= 60 else 'score-bad'}">{total_score:.0f}</div>
      <div class="label">平均スコア / 100</div>
    </div>
    <div class="summary-card">
      <div class="number">{len(results)}</div>
      <div class="label">スキャンページ数</div>
    </div>
    <div class="summary-card">
      <div class="number score-bad">{total_issues}</div>
      <div class="label">重大な問題</div>
    </div>
    <div class="summary-card">
      <div class="number score-warn">{total_warnings}</div>
      <div class="label">警告</div>
    </div>
  </div>
"""

    # 各ページの結果
    sorted_results = sorted(results, key=lambda x: x['score'])
    for r in sorted_results:
        score_class = 'score-good' if r['score'] >= 80 else 'score-warn' if r['score'] >= 60 else 'score-bad'
        html += f"""
  <div class="page-result">
    <h3>{r['file']} <span class="score-badge {score_class}">{r['score']}</span></h3>
"""
        for issue in r['issues']:
            html += f'    <span class="tag tag-issue">{issue}</span><br>\n'
        for warn in r['warnings']:
            html += f'    <span class="tag tag-warn">{warn}</span><br>\n'
        for g in r['good']:
            html += f'    <span class="tag tag-good">✅ {g}</span>\n'
        html += "  </div>\n"

    html += """
</div>
</body>
</html>"""

    with open(output_path, 'w', encoding='utf-8') as f:
        f.write(html)

def main():
    root_dir = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
    html_files = find_html_files(root_dir)
    
    print(f"🔍 TechPulse SEO Health Checker")
    print(f"{'='*50}")
    print(f"スキャン対象: {len(html_files)} ファイル\n")
    
    results = []
    for filepath in html_files:
        result = check_page(filepath, root_dir)
        results.append(result)
        
        score_icon = '✅' if result['score'] >= 80 else '⚠️' if result['score'] >= 60 else '❌'
        print(f"  {score_icon} {result['file']} (Score: {result['score']})")
        for issue in result['issues']:
            print(f"      {issue}")
        for warn in result['warnings']:
            print(f"      {warn}")
    
    # レポート生成
    report_path = os.path.join(root_dir, 'seo-report.html')
    generate_report(results, report_path)

    avg_score = sum(r['score'] for r in results) / len(results) if results else 0
    total_issues = sum(len(r['issues']) for r in results)
    total_warnings = sum(len(r['warnings']) for r in results)
    
    print(f"\n{'='*50}")
    print(f"📊 サマリー:")
    print(f"   平均スコア: {avg_score:.0f}/100")
    print(f"   重大な問題: {total_issues}件")
    print(f"   警告: {total_warnings}件")
    print(f"\n📄 詳細レポート: {report_path}")

if __name__ == '__main__':
    main()
