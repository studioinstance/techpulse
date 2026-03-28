"""
TechPulse コンテンツギャップ分析ツール (Content Gap Finder)
==========================================================
既存の記事カバー範囲を分析し、検索需要が高いのにまだ記事が存在しない
「ブルーオーシャン（未開拓テーマ）」を自動で発見・レコメンドします。

使い方: python scripts/content-gap-finder.py
"""

import os
import re
import json
from datetime import datetime

# 検索ボリュームが高いと推定されるWeb/AI/DevOps分野のトピック
TRENDING_TOPICS = {
    "Web開発": [
        {"topic": "Astro フレームワーク入門", "keywords": ["astro", "astro.js"], "volume": "高", "difficulty": "中"},
        {"topic": "Remix vs Next.js 比較ガイド", "keywords": ["remix"], "volume": "高", "difficulty": "中"},
        {"topic": "htmx入門 ハイパーメディアでモダンUI", "keywords": ["htmx"], "volume": "中", "difficulty": "低"},
        {"topic": "Svelte/SvelteKit完全ガイド", "keywords": ["svelte", "sveltekit"], "volume": "高", "difficulty": "中"},
        {"topic": "Bun vs Node.js パフォーマンス比較", "keywords": ["bun", "bun.js"], "volume": "高", "difficulty": "中"},
        {"topic": "TailwindCSS v4の新機能", "keywords": ["tailwind", "tailwindcss"], "volume": "高", "difficulty": "低"},
        {"topic": "CSS Container Queries実践ガイド", "keywords": ["container queries", "container query"], "volume": "中", "difficulty": "低"},
        {"topic": "WebAssembly(Wasm)入門", "keywords": ["webassembly", "wasm"], "volume": "中", "difficulty": "高"},
        {"topic": "Deno 2.0 完全解説", "keywords": ["deno"], "volume": "中", "difficulty": "中"},
        {"topic": "Vitest テストフレームワーク入門", "keywords": ["vitest"], "volume": "中", "difficulty": "低"},
    ],
    "AI・データサイエンス": [
        {"topic": "Claude / Gemini API活用ガイド", "keywords": ["claude api", "gemini api"], "volume": "超高", "difficulty": "中"},
        {"topic": "RAG (検索拡張生成) 実装入門", "keywords": ["rag", "retrieval augmented"], "volume": "超高", "difficulty": "高"},
        {"topic": "LangChain/LlamaIndex入門", "keywords": ["langchain", "llamaindex"], "volume": "超高", "difficulty": "高"},
        {"topic": "ローカルLLM (Ollama) で始めるAI開発", "keywords": ["ollama", "local llm"], "volume": "高", "difficulty": "中"},
        {"topic": "AIエージェント開発入門", "keywords": ["ai エージェント", "ai agent"], "volume": "超高", "difficulty": "高"},
        {"topic": "Stable Diffusion / DALL-E 画像生成入門", "keywords": ["stable diffusion", "dall-e"], "volume": "高", "difficulty": "中"},
        {"topic": "Hugging Face入門", "keywords": ["hugging face", "transformers"], "volume": "高", "difficulty": "高"},
        {"topic": "プロンプトエンジニアリング完全ガイド", "keywords": ["prompt engineering", "プロンプト"], "volume": "超高", "difficulty": "低"},
    ],
    "DevOps・インフラ": [
        {"topic": "Terraform入門 IaCの基本", "keywords": ["terraform"], "volume": "高", "difficulty": "高"},
        {"topic": "Kubernetes(k8s)入門ガイド", "keywords": ["kubernetes", "k8s"], "volume": "高", "difficulty": "高"},
        {"topic": "GitHub Copilot活用テクニック", "keywords": ["copilot", "github copilot"], "volume": "超高", "difficulty": "低"},
        {"topic": "AWS Lambda / サーバーレス入門", "keywords": ["lambda", "serverless"], "volume": "高", "difficulty": "中"},
        {"topic": "SQLデータベース設計入門", "keywords": ["sql", "database design"], "volume": "高", "difficulty": "中"},
        {"topic": "Nginx / リバースプロキシ入門", "keywords": ["nginx", "reverse proxy"], "volume": "中", "difficulty": "中"},
    ],
}

def scan_existing_content(root_dir):
    """既存の記事コンテンツをスキャン"""
    articles_dir = os.path.join(root_dir, 'articles')
    existing_content = []
    
    if not os.path.exists(articles_dir):
        return existing_content
    
    for fname in os.listdir(articles_dir):
        if fname.endswith('.html'):
            fpath = os.path.join(articles_dir, fname)
            with open(fpath, 'r', encoding='utf-8') as f:
                content = f.read().lower()
            
            title_match = re.search(r'<title>(.*?)</title>', content)
            title = title_match.group(1) if title_match else fname
            
            existing_content.append({
                'file': fname,
                'title': title,
                'content_lower': content,
            })
    
    return existing_content

def find_gaps(existing_content):
    """コンテンツギャップを特定"""
    gaps = []
    covered = []
    
    all_content_text = ' '.join([a['content_lower'] for a in existing_content])
    
    for category, topics in TRENDING_TOPICS.items():
        for topic_info in topics:
            is_covered = any(
                keyword in all_content_text 
                for keyword in topic_info['keywords']
            )
            
            entry = {
                'category': category,
                'topic': topic_info['topic'],
                'keywords': topic_info['keywords'],
                'volume': topic_info['volume'],
                'difficulty': topic_info['difficulty'],
                'is_covered': is_covered,
            }
            
            if is_covered:
                covered.append(entry)
            else:
                gaps.append(entry)
    
    # 優先度でソート: volume超高 > 高 > 中, difficulty低 > 中 > 高
    volume_order = {'超高': 0, '高': 1, '中': 2, '低': 3}
    diff_order = {'低': 0, '中': 1, '高': 2}
    gaps.sort(key=lambda x: (volume_order.get(x['volume'], 9), diff_order.get(x['difficulty'], 9)))
    
    return gaps, covered

def generate_report(gaps, covered, existing_count, output_path):
    """HTMLレポートを生成"""
    coverage_rate = len(covered) / (len(gaps) + len(covered)) * 100 if (gaps or covered) else 0
    
    html = f"""<!DOCTYPE html>
<html lang="ja">
<head>
<meta charset="UTF-8"><meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>Content Gap Analysis - TechPulse</title>
<style>
  * {{ margin: 0; padding: 0; box-sizing: border-box; }}
  body {{ font-family: 'Inter', sans-serif; background: #0f172a; color: #e2e8f0; padding: 40px 20px; }}
  .container {{ max-width: 1100px; margin: 0 auto; }}
  h1 {{ font-size: 2rem; background: linear-gradient(135deg, #f59e0b, #ef4444); -webkit-background-clip: text; -webkit-text-fill-color: transparent; }}
  h2 {{ font-size: 1.3rem; color: #fff; margin: 32px 0 16px; border-left: 4px solid #f59e0b; padding-left: 12px; }}
  .summary {{ display: grid; grid-template-columns: repeat(4, 1fr); gap: 16px; margin: 24px 0; }}
  .summary-card {{ background: rgba(255,255,255,0.05); border: 1px solid rgba(255,255,255,0.1); border-radius: 12px; padding: 20px; text-align: center; }}
  .summary-card .number {{ font-size: 2rem; font-weight: 800; color: #f59e0b; }}
  .summary-card .label {{ font-size: 0.85rem; color: #94a3b8; margin-top: 4px; }}
  .gap-card {{ background: rgba(255,255,255,0.03); border: 1px solid rgba(255,255,255,0.08); border-radius: 12px; padding: 16px 20px; margin-bottom: 12px; display: flex; justify-content: space-between; align-items: center; }}
  .gap-card:hover {{ background: rgba(245,158,11,0.05); border-color: rgba(245,158,11,0.3); }}
  .gap-info h3 {{ font-size: 1rem; color: #fff; margin-bottom: 4px; }}
  .gap-info .category {{ font-size: 0.8rem; color: #94a3b8; }}
  .gap-meta {{ display: flex; gap: 8px; }}
  .badge {{ padding: 4px 12px; border-radius: 20px; font-size: 0.75rem; font-weight: bold; }}
  .badge-volume-super {{ background: rgba(239,68,68,0.2); color: #ef4444; }}
  .badge-volume-high {{ background: rgba(245,158,11,0.2); color: #f59e0b; }}
  .badge-volume-mid {{ background: rgba(6,182,212,0.2); color: #06b6d4; }}
  .badge-diff-low {{ background: rgba(16,185,129,0.2); color: #10b981; }}
  .badge-diff-mid {{ background: rgba(245,158,11,0.2); color: #f59e0b; }}
  .badge-diff-high {{ background: rgba(239,68,68,0.2); color: #ef4444; }}
  .covered {{ opacity: 0.5; }}
  .timestamp {{ color: #64748b; font-size: 0.85rem; margin-bottom: 24px; }}
</style>
</head>
<body>
<div class="container">
  <h1>🔍 コンテンツギャップ分析</h1>
  <p class="timestamp">Generated: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}</p>
  
  <div class="summary">
    <div class="summary-card"><div class="number">{existing_count}</div><div class="label">既存記事数</div></div>
    <div class="summary-card"><div class="number">{coverage_rate:.0f}%</div><div class="label">トピックカバー率</div></div>
    <div class="summary-card"><div class="number" style="color:#ef4444;">{len(gaps)}</div><div class="label">未開拓テーマ</div></div>
    <div class="summary-card"><div class="number" style="color:#10b981;">{len(covered)}</div><div class="label">カバー済み</div></div>
  </div>

  <h2>🚀 優先度順: 次に書くべき記事テーマ TOP{min(len(gaps), 10)}</h2>
  <p style="color:#94a3b8; margin-bottom:16px;">検索ボリュームが高く、執筆難易度が低いテーマを上位に表示しています。</p>
"""
    
    for i, gap in enumerate(gaps[:10]):
        vol_class = 'super' if gap['volume'] == '超高' else 'high' if gap['volume'] == '高' else 'mid'
        diff_class = 'low' if gap['difficulty'] == '低' else 'mid' if gap['difficulty'] == '中' else 'high'
        html += f"""
  <div class="gap-card">
    <div class="gap-info">
      <h3>{i+1}. {gap['topic']}</h3>
      <span class="category">{gap['category']} | キーワード: {', '.join(gap['keywords'])}</span>
    </div>
    <div class="gap-meta">
      <span class="badge badge-volume-{vol_class}">需要: {gap['volume']}</span>
      <span class="badge badge-diff-{diff_class}">難易度: {gap['difficulty']}</span>
    </div>
  </div>"""

    html += f"\n  <h2>✅ カバー済みテーマ ({len(covered)}件)</h2>\n"
    for c in covered:
        html += f'  <div class="gap-card covered"><div class="gap-info"><h3>✅ {c["topic"]}</h3><span class="category">{c["category"]}</span></div></div>\n'

    html += "</div></body></html>"
    with open(output_path, 'w', encoding='utf-8') as f:
        f.write(html)

def main():
    root_dir = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
    
    print("🔍 TechPulse コンテンツギャップ分析")
    print("=" * 50)
    
    existing = scan_existing_content(root_dir)
    print(f"既存記事: {len(existing)}件\n")
    
    gaps, covered = find_gaps(existing)
    
    print(f"📊 分析結果:")
    print(f"   カバー済みテーマ: {len(covered)}/{len(gaps)+len(covered)}")
    print(f"   未開拓テーマ: {len(gaps)}件")
    
    print(f"\n🚀 次に書くべき記事（優先度順TOP5）:")
    for i, gap in enumerate(gaps[:5]):
        print(f"   {i+1}. [{gap['volume']}需要 / {gap['difficulty']}難易度] {gap['topic']}")
    
    report_path = os.path.join(root_dir, 'content-gap-report.html')
    generate_report(gaps, covered, len(existing), report_path)
    print(f"\n📄 詳細レポート: {report_path}")

if __name__ == '__main__':
    main()
