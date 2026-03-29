// TechPulse Real-time Visitor Tracking via Firebase
// セキュリティ強化版: レート制限、データサイズ制御、プライバシー保護
(function() {
  'use strict';

  const FIREBASE_DB = 'https://techpulse-analytics-default-rtdb.asia-southeast1.firebasedatabase.app';
  const GEO_API = 'https://ipapi.co/json/';
  const SESSION_KEY = 'tp_session';
  const HEARTBEAT_INTERVAL = 60000; // 60秒ごと（API負荷軽減）
  const RATE_LIMIT_KEY = 'tp_last_write';
  const RATE_LIMIT_MS = 10000; // 最低10秒間隔で書き込み（DDoS防止）
  const MAX_VISITS_PER_SESSION = 500; // 1セッションあたり最大500件の訪問ログ(検証のため引き上げ)
  const VISIT_COUNT_KEY = 'tp_visit_count';

  // ===== レート制限チェック =====
  function isRateLimited() {
    const last = parseInt(sessionStorage.getItem(RATE_LIMIT_KEY) || '0', 10);
    if (Date.now() - last < RATE_LIMIT_MS) return true;
    sessionStorage.setItem(RATE_LIMIT_KEY, Date.now().toString());
    return false;
  }

  // ===== 訪問ログ上限チェック =====
  function canLogVisit() {
    const count = parseInt(sessionStorage.getItem(VISIT_COUNT_KEY) || '0', 10);
    if (count >= MAX_VISITS_PER_SESSION) return false;
    sessionStorage.setItem(VISIT_COUNT_KEY, (count + 1).toString());
    return true;
  }

  // ===== セッションID生成（セキュア） =====
  function getSessionId() {
    let sid = sessionStorage.getItem(SESSION_KEY);
    if (!sid) {
      // crypto APIで安全なランダムID生成
      const arr = new Uint8Array(8);
      crypto.getRandomValues(arr);
      sid = 'v_' + Array.from(arr, b => b.toString(36)).join('').substr(0, 12);
      sessionStorage.setItem(SESSION_KEY, sid);
    }
    return sid;
  }

  // ===== ジオロケーション取得（キャッシュ付き・タイムアウト付き） =====
  async function getGeoInfo() {
    const cached = sessionStorage.getItem('tp_geo');
    if (cached) return JSON.parse(cached);
    try {
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 5000); // 5秒タイムアウト
      const res = await fetch(GEO_API, { signal: controller.signal });
      clearTimeout(timeout);
      const data = await res.json();
      // 最小限のデータのみ保存（プライバシー保護: IPアドレスは保存しない）
      const geo = {
        country: (data.country_code || 'XX').substr(0, 3),
        countryName: (data.country_name || 'Unknown').substr(0, 30),
        city: (data.city || '').substr(0, 30),
      };
      sessionStorage.setItem('tp_geo', JSON.stringify(geo));
      return geo;
    } catch (e) {
      return { country: 'XX', countryName: 'Unknown', city: '' };
    }
  }

  // ===== デバイスタイプ検出 =====
  function getDeviceType() {
    const ua = navigator.userAgent;
    if (/tablet|ipad/i.test(ua)) return 'tablet';
    if (/mobile|android|iphone/i.test(ua)) return 'mobile';
    return 'desktop';
  }

  // ===== サニタイズ（XSS防止） =====
  function sanitize(str, maxLen) {
    if (typeof str !== 'string') return '';
    return str.replace(/[<>"'&]/g, '').substr(0, maxLen || 100);
  }

  // ===== Firebaseに書き込み（データ検証付き） =====
  async function recordVisit() {
    if (isRateLimited()) return;
    const sid = getSessionId();
    const geo = await getGeoInfo();
    const pagePath = sanitize(
      window.location.pathname.replace(/\.html$/, '').replace(/^\/techpulse/, '') || '/',
      200
    );

    const data = {
      country: sanitize(geo.country, 3),
      countryName: sanitize(geo.countryName, 30),
      city: sanitize(geo.city, 30),
      page: pagePath,
      device: getDeviceType(),
      timestamp: Date.now(),
      lastActive: Date.now(),
    };

    try {
      // アクティブセッションを更新
      await fetch(`${FIREBASE_DB}/active/${sid}.json`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });

      // 訪問ログ追記（上限チェック付き）
      if (canLogVisit()) {
        await fetch(`${FIREBASE_DB}/visits.json`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ ...data, sessionId: sid }),
        });
      }
    } catch (e) { /* silent fail */ }
  }

  // ===== ハートビート（アクティブ状態の維持のみ） =====
  async function heartbeat() {
    if (isRateLimited()) return;
    const sid = getSessionId();
    const pagePath = sanitize(
      window.location.pathname.replace(/\.html$/, '').replace(/^\/techpulse/, '') || '/',
      200
    );
    try {
      // lastActiveとpageを一度に更新（API呼び出し回数削減）
      await fetch(`${FIREBASE_DB}/active/${sid}.json`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ lastActive: Date.now(), page: pagePath }),
      });
    } catch (e) { /* silent fail */ }
  }

  // ===== ページ離脱時にアクティブセッションを期限切れに =====
  function cleanup() {
    const sid = getSessionId();
    const data = JSON.stringify({ lastActive: 0 });
    try {
      navigator.sendBeacon(
        `${FIREBASE_DB}/active/${sid}.json`,
        new Blob([data], { type: 'application/json' })
      );
    } catch (e) { /* silent fail */ }
  }

  // ===== Bot/クローラー検出（不要なデータの排除） =====
  function isBot() {
    const ua = navigator.userAgent.toLowerCase();
    return /bot|crawl|spider|slurp|lighthouse|pagespeed|headless/i.test(ua);
  }

  // ===== 初期化 =====
  if (!isBot()) {
    recordVisit();
    setInterval(heartbeat, HEARTBEAT_INTERVAL);
    window.addEventListener('beforeunload', cleanup);
    window.addEventListener('visibilitychange', function() {
      if (document.visibilityState === 'hidden') cleanup();
      else if (document.visibilityState === 'visible') recordVisit();
    });
  }
})();
