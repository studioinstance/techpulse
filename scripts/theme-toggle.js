/**
 * TechPulse Theme Toggle
 * ダーク/ライトテーマの切り替えとlocalStorageへの永続化
 */
(function () {
  'use strict';

  const STORAGE_KEY = 'tp_theme';
  const DARK = 'dark';
  const LIGHT = 'light';

  // 保存されたテーマ or システム設定 or デフォルト(dark)
  function getPreferred() {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) return saved;
    if (window.matchMedia && window.matchMedia('(prefers-color-scheme: light)').matches) return LIGHT;
    return DARK;
  }

  function applyTheme(theme) {
    document.documentElement.setAttribute('data-theme', theme);
    localStorage.setItem(STORAGE_KEY, theme);
    // トグルボタンのアイコンを更新
    document.querySelectorAll('.theme-toggle-btn').forEach(btn => {
      btn.textContent = theme === DARK ? '☀️' : '🌙';
      btn.setAttribute('aria-label', theme === DARK ? 'ライトモードに切替' : 'ダークモードに切替');
      btn.title = theme === DARK ? 'ライトモードに切替' : 'ダークモードに切替';
    });
  }

  // 初期テーマ適用（FOUC防止のため即時実行）
  const initial = getPreferred();
  document.documentElement.setAttribute('data-theme', initial);

  // DOM Ready後にボタン注入
  document.addEventListener('DOMContentLoaded', function () {
    applyTheme(getPreferred());

    // ナビバー or ダッシュボードヘッダーにトグルボタンを注入
    const navContainer = document.querySelector('.navbar .container') || document.querySelector('.dash-header');
    if (navContainer) {
      const btn = document.createElement('button');
      btn.className = 'theme-toggle-btn';
      btn.type = 'button';
      btn.style.cssText = 'background:none;border:1px solid var(--color-border, rgba(255,255,255,0.15));color:var(--color-text,#ededed);cursor:pointer;font-size:1.2rem;padding:6px 10px;border-radius:8px;transition:all 0.3s ease;margin-left:12px;display:flex;align-items:center;justify-content:center;line-height:1;';
      btn.addEventListener('click', function () {
        const current = document.documentElement.getAttribute('data-theme') || DARK;
        applyTheme(current === DARK ? LIGHT : DARK);
      });
      // ハンバーガーの前に挿入（なければ末尾に追加）
      const hamburger = navContainer.querySelector('.nav-hamburger');
      if (hamburger) {
        navContainer.insertBefore(btn, hamburger);
      } else {
        navContainer.appendChild(btn);
      }
    }
  });
})();
