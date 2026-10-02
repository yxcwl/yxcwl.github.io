/* =========================================================
   交互脚本（无第三方依赖，删掉页面仍可正常浏览）
   1) 打字机轮播        —— 文案改下面的 TYPING_PHRASES
   2) 移动端导航展开/收起
   3) 滚动进度条 + 导航高亮 + 顶栏状态
   4) 滚动入场动画 .reveal
   5) 数字累加 + 技能条填充
   6) 时间线滚动进度
   7) 鼠标光斑 + 卡片跟随高光（仅指针设备）
   8) 深浅色主题切换（记忆到 localStorage）
   9) 回到顶部 + 页脚年份
   ========================================================= */

(function () {
  'use strict';

  /* =========================================================
     0. 可配置内容
     ========================================================= */

  // TODO(替换): 打字机轮播的一句话介绍，可写 1~5 句
  // 每个页面可在 </body> 前用 window.PHRASES 覆盖（中文版见 zh.html，英文版见 index.html）
  var TYPING_PHRASES = window.PHRASES || [
    '专注 Web 前端与交互设计',
    '正在寻找实习机会',
    '把想法做成能跑起来的东西'
  ];

  var reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var $ = function (s, c) { return (c || document).querySelector(s); };
  var $$ = function (s, c) { return Array.prototype.slice.call((c || document).querySelectorAll(s)); };

  /* =========================================================
     1. 打字机
     ========================================================= */
  (function typing() {
    var el = document.getElementById('typing');
    if (!el) { return; }

    if (reduceMotion) { el.textContent = TYPING_PHRASES[0]; return; }

    var pi = 0, ci = 0, deleting = false;

    function tick() {
      var text = TYPING_PHRASES[pi];
      el.textContent = text.slice(0, ci);

      var delay = deleting ? 45 : 115;

      if (!deleting && ci === text.length) {
        delay = 1900;
        deleting = true;
      } else if (deleting && ci === 0) {
        deleting = false;
        pi = (pi + 1) % TYPING_PHRASES.length;
        delay = 320;
      } else {
        ci += deleting ? -1 : 1;
      }
      setTimeout(tick, delay);
    }
    tick();
  })();

  /* =========================================================
     2. 移动端导航
     ========================================================= */
  (function nav() {
    var toggle = document.getElementById('navToggle');
    var menu = document.getElementById('navMenu');
    if (!toggle || !menu) { return; }

    function close() {
      menu.classList.remove('is-open');
      toggle.setAttribute('aria-expanded', 'false');
    }

    toggle.addEventListener('click', function () {
      var open = menu.classList.toggle('is-open');
      toggle.setAttribute('aria-expanded', open ? 'true' : 'false');
    });

    menu.addEventListener('click', function (e) {
      if (e.target.tagName === 'A') { close(); }
    });

    document.addEventListener('keydown', function (e) {
      if (e.key === 'Escape') { close(); }
    });
  })();

  /* =========================================================
     3. 滚动：进度条 / 顶栏状态 / 导航高亮 / 回到顶部
     ========================================================= */
  var header = document.getElementById('siteHeader');
  var progress = document.getElementById('scrollProgress');
  var toTop = document.getElementById('toTop');
  var navLinks = $$('.nav-menu a[href^="#"]');

  function setActiveNav() {
    var pos = window.scrollY + window.innerHeight * 0.34;
    var current = null;

    navLinks.forEach(function (a) {
      var sec = document.querySelector(a.getAttribute('href'));
      if (sec && sec.offsetTop <= pos) { current = a; }
    });

    navLinks.forEach(function (a) { a.classList.toggle('is-active', a === current); });
  }

  function updateTimeline() {
    var tl = document.getElementById('timeline');
    if (!tl) { return; }
    var rect = tl.getBoundingClientRect();
    var start = window.innerHeight * 0.75;
    var span = rect.height;
    var passed = start - rect.top;
    var pct = Math.max(0, Math.min(1, passed / span));
    tl.style.setProperty('--tl', (pct * 100).toFixed(2) + '%');
  }

  function onScroll() {
    var doc = document.documentElement;
    var max = doc.scrollHeight - window.innerHeight;
    var y = window.scrollY || doc.scrollTop;

    if (progress) { progress.style.width = (max > 0 ? (y / max) * 100 : 0) + '%'; }
    if (header) { header.classList.toggle('is-scrolled', y > 12); }
    if (toTop) { toTop.classList.toggle('is-show', y > 420); }

    setActiveNav();
    updateTimeline();
  }

  var ticking = false;
  window.addEventListener('scroll', function () {
    if (ticking) { return; }
    ticking = true;
    window.requestAnimationFrame(function () { onScroll(); ticking = false; });
  }, { passive: true });
  window.addEventListener('resize', onScroll);

  if (toTop) {
    toTop.addEventListener('click', function () {
      window.scrollTo({ top: 0, behavior: reduceMotion ? 'auto' : 'smooth' });
    });
  }

  /* =========================================================
     4 & 5. 入场动画 / 数字累加 / 技能条
     ========================================================= */
  function animateCount(el) {
    var target = parseFloat(el.getAttribute('data-count')) || 0;
    var suffix = el.getAttribute('data-suffix') || '';
    var dur = 1200;
    var t0 = 0;

    if (reduceMotion) { el.textContent = target + suffix; return; }

    function step(ts) {
      if (!t0) { t0 = ts; }
      var p = Math.min(1, (ts - t0) / dur);
      var eased = 1 - Math.pow(1 - p, 3);
      el.textContent = Math.round(target * eased) + suffix;
      if (p < 1) { window.requestAnimationFrame(step); }
    }
    window.requestAnimationFrame(step);
  }

  function activate(el) {
    el.classList.add('in');

    $$('[data-count]', el).forEach(animateCount);
    if (el.hasAttribute('data-count')) { animateCount(el); }

    $$('.sk-bar > i', el).forEach(function (bar) {
      bar.style.width = (parseFloat(bar.getAttribute('data-pct')) || 0) + '%';
    });
  }

  var reveals = $$('.reveal');
  var timelineItems = $$('.timeline-item');

  if (!('IntersectionObserver' in window)) {
    reveals.forEach(activate);
    timelineItems.forEach(function (i) { i.classList.add('in'); });
  } else {
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (!entry.isIntersecting) { return; }
        activate(entry.target);
        io.unobserve(entry.target);
      });
    }, { threshold: 0.18, rootMargin: '0px 0px -8% 0px' });

    reveals.forEach(function (el) { io.observe(el); });

    var ioTl = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (entry.isIntersecting) { entry.target.classList.add('in'); ioTl.unobserve(entry.target); }
      });
    }, { threshold: 0.3 });
    timelineItems.forEach(function (el) { ioTl.observe(el); });
  }

  /* =========================================================
     6. 鼠标光斑 + 卡片跟随高光
     ========================================================= */
  (function pointerFx() {
    var fine = window.matchMedia('(hover: hover) and (pointer: fine)').matches;
    if (!fine) { return; }

    var root = document.documentElement;

    window.addEventListener('mousemove', function (e) {
      root.style.setProperty('--mx', e.clientX + 'px');
      root.style.setProperty('--my', e.clientY + 'px');
    }, { passive: true });

    $$('[data-tilt]').forEach(function (card) {
      card.addEventListener('mousemove', function (e) {
        var r = card.getBoundingClientRect();
        card.style.setProperty('--cx', (e.clientX - r.left) + 'px');
        card.style.setProperty('--cy', (e.clientY - r.top) + 'px');
      }, { passive: true });
    });
  })();

  /* =========================================================
     7. 主题切换
     ========================================================= */
  (function theme() {
    var btn = document.getElementById('themeToggle');
    var root = document.documentElement;
    var saved = null;

    try { saved = window.localStorage.getItem('theme'); } catch (err) { saved = null; }
    if (saved === 'light' || saved === 'dark') {
      root.setAttribute('data-theme', saved);
    } else if (window.matchMedia('(prefers-color-scheme: light)').matches) {
      root.setAttribute('data-theme', 'light');
    }

    if (!btn) { return; }
    btn.addEventListener('click', function () {
      var next = root.getAttribute('data-theme') === 'light' ? 'dark' : 'light';
      root.setAttribute('data-theme', next);
      try { window.localStorage.setItem('theme', next); } catch (err) { /* 隐私模式下忽略 */ }
    });
  })();

  /* =========================================================
     8. 页脚年份
     ========================================================= */
  var year = document.getElementById('year');
  if (year) { year.textContent = new Date().getFullYear(); }

  onScroll();
})();
