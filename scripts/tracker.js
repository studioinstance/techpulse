// TechPulse Real-time Visitor Tracking via Firebase
// セキュリティ強化版: レート制限・データサイズ制御・プライバシー保護
(function() {
  'use strict';
  const FIREBASE_DB = 'https://techpulse-analytics-default-rtdb.asia-southeast1.firebasedatabase.app';
  const GEO_API = 'https://ipapi.co/json/';
  const SESSION_KEY = 'tp_session';
  const RATE_KEY = 'tp_rate';
  const VISIT_COUNT_KEY = 'tp_vc';
  const HEARTBEAT_INTERVAL = 60000; // 60秒ごと（元30秒→書き込み量を半減）
  const MAX_VISITS_PER_SESSION = 20; // 1セッションあたり最大20回の訪問記録
  const MIN_INTERVAL_MS = 5000; // 最低5秒間隔で書き込み（スパム防止）

  // ボット・クローラーの除外
  if (/bot|crawl|spider|slurp|googlebot|bingbot/i.test(navigator.userAgent)) return;

  // セッションIDを生成/取得
  function getSessionId() {
    let sid = sessionStorage.getItem(SESSION_KEY);
    if (!sid) {
      sid = 'v_' + Date.now() + '_' + Math.random().toString(36).substr(2, 6);
      sessionStorage.setItem(SESSION_KEY, sid);
      sessionStorage.setItem(VISIT_COUNT_KEY, '0');
    }
    return sid;
  }

  // レート制限チェック
  function checkRateLimit() {
    const last = parseInt(sessionStorage.getItem(RATE_KEY) || '0', 10);
    const now = Date.now();
    if (now - last < MIN_INTERVAL_MS) return false;
    sessionStorage.setItem(RATE_KEY, now.toString());
    return true;
  }

  // 訪問カウントチェック（1セッションあたりの上限）
  function checkVisitLimit() {
    const count = parseInt(sessionStorage.getItem(VISIT_COUNT_KEY) || '0', 10);
    if (count >= MAX_VISITS_PER_SESSION) return false;
    sessionStorage.setItem(VISIT_COUNT_KEY, (count + 1).toString());
    return true;
  }

  // ジオロケーション情報を取得（キャッシュ付き・1セッション1回のみ）
  async function getGeoInfo() {
    const cached = sessionStorage.getItem('tp_geo');
    if (cached) return JSON.parse(cached);
    try {
      const res = await fetch(GEO_API);
      if (!res.ok) throw new Error('Geo API error');
      const data = await res.json();
      // プライバシー: IPアドレスは保存しない、緯度経度は都市レベルに丸める
      const geo = {
        country: (data.country_code || 'XX').substring(0, 2),
        countryName: (data.country_name || 'Unknown').substring(0, 30),
        city: (data.city || '').substring(0, 30),
        region: (data.region || '').substring(0, 30),
      };
      sessionStorage.setItem('tp_geo', JSON.stringify(geo));
      return geo;
    } catch (e) {
      return { country: 'XX', countryName: 'Unknown', city: '', region: '' };
    }
  }

  // デバイスタイプを検出
  function getDeviceType() {
    const ua = navigator.userAgent;
    if (/tablet|ipad/i.test(ua)) return 'tablet';
    if (/mobile|android|iphone/i.test(ua)) return 'mobile';
    return 'desktop';
  }

  // 文字列を安全にサニタイズ（XSS・インジェクション防止）
  function sanitize(str, maxLen) {
    if (typeof str !== 'string') return '';
    return str.replace(/[<>"'&\\]/g, '').substring(0, maxLen || 50);
  }

  // Firebaseに訪問データを書き込む
  async function recordVisit() {
    if (!checkRateLimit()) return;
    if (!checkVisitLimit()) return;

    const sid = getSessionId();
    const geo = await getGeoInfo();
    const rawPath = window.location.pathname.replace(/\.html$/, '').replace(/^\/techpulse/, '') || '/';
    const page = sanitize(rawPath, 100);

    const data = {
      country: sanitize(geo.country, 2),
      countryName: sanitize(geo.countryName, 30),
      city: sanitize(geo.city, 30),
      page: page,
      device: getDeviceType(),
      timestamp: Date.now(),
      lastActive: Date.now(),
    };
    // プライバシー: referrer, IPアドレス, 詳細な緯度経度は送信しない

    try {
      await fetch(`${FIREBASE_DB}/active/${encodeURIComponent(sid)}.json`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });

      // 訪問ログにも追記
      await fetch(`${FIREBASE_DB}/visits.json`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...data, sessionId: sid }),
      });
    } catch (e) { /* silent fail */ }
  }

  // ハートビート（アクティブ状態を維持）
  async function heartbeat() {
    if (!checkRateLimit()) return;
    const sid = getSessionId();
    const page = sanitize(
      window.location.pathname.replace(/\.html$/, '').replace(/^\/techpulse/, '') || '/',
      100
    );
    try {
      // 1回のリクエストでまとめて更新（元2リクエスト→1リクエストに削減）
      await fetch(`${FIREBASE_DB}/active/${encodeURIComponent(sid)}.json`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ lastActive: Date.now(), page: page }),
      });
    } catch (e) { /* silent fail */ }
  }

  // ページ離脱時にアクティブセッションを期限切れに
  function cleanup() {
    const sid = getSessionId();
    const data = JSON.stringify({ lastActive: 0 });
    try {
      navigator.sendBeacon(
        `${FIREBASE_DB}/active/${encodeURIComponent(sid)}.json`,
        new Blob([data], { type: 'application/json' })
      );
    } catch (e) { /* silent fail */ }
  }

  // 初期化
  recordVisit();
  setInterval(heartbeat, HEARTBEAT_INTERVAL);
  window.addEventListener('beforeunload', cleanup);
  window.addEventListener('visibilitychange', function() {
    if (document.visibilityState === 'hidden') cleanup();
    else if (document.visibilityState === 'visible') recordVisit();
  });
})();
