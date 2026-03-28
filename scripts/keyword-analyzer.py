"""
TechPulse GSCキーワード分析ツール (Keyword Analyzer)
=====================================================
Google Search ConsoleからエクスポートしたCSVデータを分析し、
キーワード戦略のインサイトを自動導出します。

使い方:
  1. Google Search Console > パフォーマンス > エクスポート(CSV)
  2. ダウンロードしたCSVを data/gsc-queries.csv として保存
  3. python scripts/keyword-analyzer.py を実行

分析内容:
  - Top検索クエリの可視化
  - 「惜しいキーワード」の発見（11〜20位 = あと少しで1ページ目）
  - CTR改善の機会（表示は多いがクリックが少ないクエリ）
  - 記事ごとのパフォーマンス分析
"""

import csv
import os
import json
from datetime import datetime

def load_gsc_data(csv_path):
    """GSC CSVファイルを読み込み"""
    data = []
    try:
        with open(csv_path, 'r', encoding='utf-8-sig') as f:
            reader = csv.DictReader(f)
            for row in reader:
                try:
                    data.append({
                        'query': row.get('Top queries', row.get('検索キーワード', row.get('Query', ''))),
                        'clicks': int(row.get('Clicks', row.get('クリック数', 0))),
                        'impressions': int(row.get('Impressions', row.get('表示回数', 0))),
                        'ctr': float(str(row.get('CTR', row.get('CTR', '0%'))).replace('%', '')) / 100 if '%' in str(row.get('CTR', '0')) else float(row.get('CTR', 0)),
                        'position': float(row.get('Position', row.get('掲載順位', 0))),
                    })
                except (ValueError, TypeError):
                    continue
    except FileNotFoundError:
        return None
    return data

def analyze_keywords(data):
    """キーワードデータを分析"""
    if not data:
        return None
    
    results = {
        'total_clicks': sum(d['clicks'] for d in data),
        'total_impressions': sum(d['impressions'] for d in data),
        'avg_position': sum(d['position'] for d in data) / len(data),
        'total_queries': len(data),
    }
    
    # Top10 クリック数キーワード
    results['top_clicks'] = sorted(data, key=lambda x: x['clicks'], reverse=True)[:10]
    
    # Top10 表示回数キーワード
    results['top_impressions'] = sorted(data, key=lambda x: x['impressions'], reverse=True)[:10]
    
    # 「惜しいキーワード」: 掲載順位 11〜20位（もう少しで1ページ目に入れる）
    results['almost_page1'] = sorted(
        [d for d in data if 10 < d['position'] <= 20 and d['impressions'] > 5],
        key=lambda x: x['impressions'], reverse=True
    )[:10]
    
    # CTR改善チャンス: 表示回数が多いのにCTRが低い
    results['low_ctr_opportunities'] = sorted(
        [d for d in data if d['impressions'] > 10 and d['ctr'] < 0.03],
        key=lambda x: x['impressions'], reverse=True
    )[:10]
    
    # 1ページ目（順位1〜10位）のキーワード
    results['page1_keywords'] = sorted(
        [d for d in data if d['position'] <= 10],
        key=lambda x: x['clicks'], reverse=True
    )[:10]
    
    return results

def generate_report(results, output_path):
    """分析結果のHTMLレポートを生成"""
    html = f"""<!DOCTYPE html>
<html lang="ja">
<head>
<meta charset="UTF-8"><meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>GSC Keyword Analysis - TechPulse</title>
<style>
  * {{ margin: 0; padding: 0; box-sizing: border-box; }}
  body {{ font-family: 'Inter', sans-serif; background: #0f172a; color: #e2e8f0; padding: 40px 20px; }}
  .container {{ max-width: 1100px; margin: 0 auto; }}
  h1 {{ font-size: 2rem; background: linear-gradient(135deg, #8b5cf6, #06b6d4); -webkit-background-clip: text; -webkit-text-fill-color: transparent; }}
  h2 {{ font-size: 1.3rem; color: #fff; margin: 32px 0 16px; border-left: 4px solid #8b5cf6; padding-left: 12px; }}
  .summary {{ display: grid; grid-template-columns: repeat(4, 1fr); gap: 16px; margin: 24px 0; }}
  .summary-card {{ background: rgba(255,255,255,0.05); border: 1px solid rgba(255,255,255,0.1); border-radius: 12px; padding: 20px; text-align: center; }}
  .summary-card .number {{ font-size: 2rem; font-weight: 800; color: #8b5cf6; }}
  .summary-card .label {{ font-size: 0.85rem; color: #94a3b8; margin-top: 4px; }}
  table {{ width: 100%; border-collapse: collapse; margin-bottom: 24px; }}
  th {{ background: rgba(139,92,246,0.2); color: #c4b5fd; padding: 10px; text-align: left; font-size: 0.85rem; }}
  td {{ padding: 10px; border-bottom: 1px solid rgba(255,255,255,0.05); font-size: 0.9rem; }}
  tr:hover {{ background: rgba(255,255,255,0.03); }}
  .highlight {{ color: #f59e0b; font-weight: bold; }}
  .timestamp {{ color: #64748b; font-size: 0.85rem; margin-bottom: 24px; }}
</style>
</head>
<body>
<div class="container">
  <h1>📊 GSC キーワード分析レポート</h1>
  <p class="timestamp">Generated: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}</p>
  
  <div class="summary">
    <div class="summary-card"><div class="number">{results['total_clicks']:,}</div><div class="label">総クリック</div></div>
    <div class="summary-card"><div class="number">{results['total_impressions']:,}</div><div class="label">総インプレッション</div></div>
    <div class="summary-card"><div class="number">{results['avg_position']:.1f}</div><div class="label">平均掲載順位</div></div>
    <div class="summary-card"><div class="number">{results['total_queries']}</div><div class="label">検索キーワード数</div></div>
  </div>
"""

    def render_table(title, items, emoji=""):
        nonlocal html
        html += f"<h2>{emoji} {title}</h2>\n<table>\n<tr><th>キーワード</th><th>クリック</th><th>表示回数</th><th>CTR</th><th>順位</th></tr>\n"
        for item in items:
            ctr_str = f"{item['ctr']*100:.1f}%"
            html += f"<tr><td>{item['query']}</td><td>{item['clicks']}</td><td>{item['impressions']}</td><td>{ctr_str}</td><td>{item['position']:.1f}</td></tr>\n"
        html += "</table>\n"

    render_table("🏆 Top10 クリック数キーワード", results['top_clicks'], "🏆")
    render_table("👀 Top10 表示回数キーワード", results['top_impressions'], "👀")
    render_table("🎯 あと少しで1ページ目！（11〜20位の惜しいキーワード）", results['almost_page1'], "🎯")
    render_table("📈 CTR改善チャンス（表示多 × CTR低 → タイトル変更で急上昇の可能性）", results['low_ctr_opportunities'], "📈")
    render_table("✅ 既に1ページ目のキーワード", results['page1_keywords'], "✅")

    html += "</div></body></html>"
    with open(output_path, 'w', encoding='utf-8') as f:
        f.write(html)

def main():
    root_dir = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
    data_dir = os.path.join(root_dir, 'data')
    os.makedirs(data_dir, exist_ok=True)
    
    csv_path = os.path.join(data_dir, 'gsc-queries.csv')
    
    print("📊 TechPulse GSCキーワード分析ツール")
    print("=" * 50)
    
    data = load_gsc_data(csv_path)
    
    if data is None:
        print(f"\n⚠️ CSVファイルが見つかりません: {csv_path}")
        print(f"\n📝 使い方:")
        print(f"   1. Google Search Console にログイン")
        print(f"   2. パフォーマンス > エクスポート > CSVでダウンロード")
        print(f"   3. ダウンロードしたファイルを {csv_path} に配置")
        print(f"   4. 再度このスクリプトを実行")
        
        # サンプルCSVを生成
        sample_path = os.path.join(data_dir, 'gsc-queries-sample.csv')
        with open(sample_path, 'w', encoding='utf-8', newline='') as f:
            writer = csv.writer(f)
            writer.writerow(['Top queries', 'Clicks', 'Impressions', 'CTR', 'Position'])
            writer.writerow(['next.js 15 guide', 12, 340, '3.5%', 8.2])
            writer.writerow(['typescript beginner', 8, 520, '1.5%', 15.3])
            writer.writerow(['docker tutorial', 5, 280, '1.8%', 12.1])
            writer.writerow(['react native vs flutter 2026', 3, 190, '1.6%', 18.7])
            writer.writerow(['web performance optimization', 2, 150, '1.3%', 22.5])
        print(f"\n💡 サンプルCSVを生成しました: {sample_path}")
        print(f"   これを参考に実際のCSVを配置してください。")
        print(f"\n   サンプルデータで分析を実行します...")
        
        data = load_gsc_data(sample_path)
    
    if data:
        results = analyze_keywords(data)
        report_path = os.path.join(root_dir, 'keyword-report.html')
        generate_report(results, report_path)
        
        print(f"\n📊 分析結果:")
        print(f"   総クリック: {results['total_clicks']:,}")
        print(f"   総インプレッション: {results['total_impressions']:,}")
        print(f"   平均掲載順位: {results['avg_position']:.1f}")
        print(f"   惜しいキーワード（11〜20位）: {len(results['almost_page1'])}件")
        print(f"   CTR改善チャンス: {len(results['low_ctr_opportunities'])}件")
        print(f"\n📄 詳細レポート: {report_path}")

if __name__ == '__main__':
    main()
