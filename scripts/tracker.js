// TechPulse Real-time Visitor Tracking via Firebase
// このスクリプトを全ページに読み込ませることで、訪問者の地域データをFirebaseにリアルタイム記録する
(function() {
  const FIREBASE_DB = 'https://techpulse-analytics-default-rtdb.asia-southeast1.firebasedatabase.app';
  const GEO_API = 'https://ipapi.co/json/';
  const SESSION_KEY = 'tp_session';
  const HEARTBEAT_INTERVAL = 30000; // 30秒ごとにアクティブ状態を更新

  // セッションIDを生成/取得
  function getSessionId() {
    let sid = sessionStorage.getItem(SESSION_KEY);
    if (!sid) {
      sid = 'v_' + Date.now() + '_' + Math.random().toString(36).substr(2, 6);
      sessionStorage.setItem(SESSION_KEY, sid);
    }
    return sid;
  }

  // ジオロケーション情報を取得（キャッシュ付き）
  async function getGeoInfo() {
    const cached = sessionStorage.getItem('tp_geo');
    if (cached) return JSON.parse(cached);
    try {
      const res = await fetch(GEO_API);
      const data = await res.json();
      const geo = {
        country: data.country_code || 'XX',
        countryName: data.country_name || 'Unknown',
        city: data.city || '',
        region: data.region || '',
        lat: data.latitude || 0,
        lon: data.longitude || 0,
      };
      sessionStorage.setItem('tp_geo', JSON.stringify(geo));
      return geo;
    } catch (e) {
      return { country: 'XX', countryName: 'Unknown', city: '', region: '', lat: 0, lon: 0 };
    }
  }

  // デバイスタイプを検出
  function getDeviceType() {
    const ua = navigator.userAgent;
    if (/tablet|ipad/i.test(ua)) return 'tablet';
    if (/mobile|android|iphone/i.test(ua)) return 'mobile';
    return 'desktop';
  }

  // Firebaseに訪問データを書き込む
  async function recordVisit() {
    const sid = getSessionId();
    const geo = await getGeoInfo();
    const path = window.location.pathname.replace(/\.html$/, '').replace(/^\/techpulse/, '') || '/';
    const data = {
      country: geo.country,
      countryName: geo.countryName,
      city: geo.city,
      page: path,
      device: getDeviceType(),
      timestamp: Date.now(),
      lastActive: Date.now(),
      referrer: document.referrer || 'direct',
      lang: navigator.language || 'ja',
    };

    try {
      await fetch(`${FIREBASE_DB}/active/${sid}.json`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });

      // 訪問ログにも追記（最新50件を保持）
      await fetch(`${FIREBASE_DB}/visits.json`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...data, sessionId: sid }),
      });
    } catch (e) { /* silent fail */ }
  }

  // ハートビート（アクティブ状態を維持）
  async function heartbeat() {
    const sid = getSessionId();
    try {
      await fetch(`${FIREBASE_DB}/active/${sid}/lastActive.json`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(Date.now()),
      });
      await fetch(`${FIREBASE_DB}/active/${sid}/page.json`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(window.location.pathname.replace(/\.html$/, '').replace(/^\/techpulse/, '') || '/'),
      });
    } catch (e) { /* silent fail */ }
  }

  // ページ離脱時にアクティブセッションを削除
  function cleanup() {
    const sid = getSessionId();
    navigator.sendBeacon(`${FIREBASE_DB}/active/${sid}.json`, '');
    // sendBeaconではDELETEが使えないので、lastActiveを0に設定して期限切れにする
    const data = JSON.stringify(0);
    navigator.sendBeacon(
      `${FIREBASE_DB}/active/${sid}/lastActive.json`,
      new Blob([data], { type: 'application/json' })
    );
  }

  // 初期化
  recordVisit();
  setInterval(heartbeat, HEARTBEAT_INTERVAL);
  window.addEventListener('beforeunload', cleanup);
  // ページ遷移時もトラック
  window.addEventListener('visibilitychange', function() {
    if (document.visibilityState === 'hidden') cleanup();
    else if (document.visibilityState === 'visible') recordVisit();
  });
})();
