/**
 * TechPulse Theme Toggle
 * ダーク/ライトテーマの切り替えとlocalStorageへの永続化
 * スライダー式トグルスイッチで切り替えを直感的に
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
    // トグルスイッチの状態を更新
    document.querySelectorAll('.theme-toggle-switch').forEach(wrapper => {
      const input = wrapper.querySelector('input');
      if (input) input.checked = (theme === LIGHT);
      wrapper.setAttribute('aria-label', theme === DARK ? 'ライトモードに切替' : 'ダークモードに切替');
      wrapper.title = theme === DARK ? 'ライトモードに切替' : 'ダークモードに切替';
    });
  }

  // 初期テーマ適用（FOUC防止のため即時実行）
  const initial = getPreferred();
  document.documentElement.setAttribute('data-theme', initial);

  // DOM Ready後にトグルスイッチ注入
  document.addEventListener('DOMContentLoaded', function () {
    applyTheme(getPreferred());

    // ナビバー or ダッシュボードヘッダーにトグルスイッチを注入
    const navContainer = document.querySelector('.navbar .container') || document.querySelector('.dash-header') || document.querySelector('.header .links');
    if (navContainer) {
      const wrapper = document.createElement('label');
      wrapper.className = 'theme-toggle-switch';
      wrapper.title = getPreferred() === DARK ? 'ライトモードに切替' : 'ダークモードに切替';
      wrapper.setAttribute('aria-label', getPreferred() === DARK ? 'ライトモードに切替' : 'ダークモードに切替');
      wrapper.innerHTML = `
        <span class="toggle-icon toggle-icon-sun">☀️</span>
        <input type="checkbox" class="toggle-input" ${getPreferred() === LIGHT ? 'checked' : ''}>
        <span class="toggle-slider"></span>
        <span class="toggle-icon toggle-icon-moon">🌙</span>
      `;

      const input = wrapper.querySelector('input');
      input.addEventListener('change', function () {
        applyTheme(this.checked ? LIGHT : DARK);
      });

      // ハンバーガーの前に挿入（なければ末尾に追加）
      const hamburger = navContainer.querySelector('.nav-hamburger');
      if (hamburger) {
        navContainer.insertBefore(wrapper, hamburger);
      } else {
        navContainer.appendChild(wrapper);
      }
    }
  });
})();
