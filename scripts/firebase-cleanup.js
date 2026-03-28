// TechPulse Firebase データクリーンアップ
// 古い訪問ログとアクティブでないセッションを定期的に削除し、無料枠を保護
const https = require('https');

const FIREBASE_DB = 'techpulse-analytics-default-rtdb.asia-southeast1.firebasedatabase.app';
const MAX_VISITS = 500;        // 訪問ログ最大500件を保持
const ACTIVE_TTL_MS = 10 * 60 * 1000; // 10分以上前のアクティブセッションを削除

function firebaseRequest(path, method, data) {
  return new Promise((resolve, reject) => {
    const body = data ? JSON.stringify(data) : '';
    const options = {
      hostname: FIREBASE_DB,
      path: path,
      method: method,
      headers: { 'Content-Type': 'application/json' },
    };
    if (body) options.headers['Content-Length'] = Buffer.byteLength(body);
    const req = https.request(options, (res) => {
      let result = '';
      res.on('data', (c) => (result += c));
      res.on('end', () => {
        try { resolve(JSON.parse(result)); } catch (e) { resolve(result); }
      });
    });
    req.on('error', reject);
    if (body) req.write(body);
    req.end();
  });
}

async function cleanupActiveSessions() {
  console.log('🧹 アクティブセッションのクリーンアップ...');
  const active = await firebaseRequest('/active.json', 'GET');
  if (!active) { console.log('  アクティブセッションなし'); return; }
  const now = Date.now();
  let deleted = 0;
  for (const [sid, data] of Object.entries(active)) {
    if (!data.lastActive || (now - data.lastActive) > ACTIVE_TTL_MS) {
      await firebaseRequest(`/active/${sid}.json`, 'DELETE');
      deleted++;
    }
  }
  console.log(`  ${deleted}件の期限切れセッションを削除`);
}

async function cleanupVisitLogs() {
  console.log('🧹 訪問ログのクリーンアップ...');
  const visits = await firebaseRequest('/visits.json', 'GET');
  if (!visits) { console.log('  訪問ログなし'); return; }
  const entries = Object.entries(visits).map(([key, val]) => ({ key, ...val }));
  entries.sort((a, b) => (b.timestamp || 0) - (a.timestamp || 0));
  if (entries.length <= MAX_VISITS) {
    console.log(`  ${entries.length}件（上限${MAX_VISITS}以内）- 削除不要`);
    return;
  }
  const toDelete = entries.slice(MAX_VISITS);
  console.log(`  ${toDelete.length}件の古いログを削除中...`);
  for (const entry of toDelete) {
    await firebaseRequest(`/visits/${entry.key}.json`, 'DELETE');
  }
  console.log(`  ✅ ${toDelete.length}件削除完了`);
}

async function checkStorageUsage() {
  console.log('\n📊 ストレージ使用状況:');
  const active = await firebaseRequest('/active.json', 'GET');
  const visits = await firebaseRequest('/visits.json', 'GET');
  const activeSize = JSON.stringify(active || {}).length;
  const visitsSize = JSON.stringify(visits || {}).length;
  const totalKB = ((activeSize + visitsSize) / 1024).toFixed(1);
  const limitKB = 1024 * 1024; // 1GB in KB
  console.log(`  アクティブセッション: ${activeSize} bytes`);
  console.log(`  訪問ログ: ${visitsSize} bytes`);
  console.log(`  合計: ${totalKB} KB / ${(limitKB).toLocaleString()} KB (Sparkプラン上限)`);
  console.log(`  使用率: ${(parseFloat(totalKB) / limitKB * 100).toFixed(4)}%`);
}

async function main() {
  console.log('=== TechPulse Firebase クリーンアップ ===');
  console.log(`実行時刻: ${new Date().toLocaleString('ja-JP')}`);
  await cleanupActiveSessions();
  await cleanupVisitLogs();
  await checkStorageUsage();
  console.log('\n✅ クリーンアップ完了');
}

main().catch(console.error);
