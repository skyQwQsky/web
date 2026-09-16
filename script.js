/* =====================================================
   星流 Stellar — 交互脚本
   导航毛玻璃 / 移动端菜单 / 滚动淡入 / 数字滚动 / 微动效
   ===================================================== */
'use strict';

/* ---------- 小工具 ---------- */
const $ = (sel, ctx = document) => ctx.querySelector(sel);
const $$ = (sel, ctx = document) => [...ctx.querySelectorAll(sel)];
const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

/* ---------- 1. 导航栏：滚动后启用毛玻璃 ---------- */
const navbar = $('#navbar');
const onScroll = () => navbar.classList.toggle('scrolled', window.scrollY > 24);
window.addEventListener('scroll', onScroll, { passive: true });
onScroll(); // 初始执行一次（处理刷新后停留在页面中部的情况）

/* ---------- 2. 移动端汉堡菜单 ---------- */
const hamburger = $('#hamburger');
const mobileMenu = $('#mobile-menu');

function setMobileMenu(open) {
  hamburger.classList.toggle('active', open);
  mobileMenu.classList.toggle('open', open);
  hamburger.setAttribute('aria-expanded', String(open));
  document.body.classList.toggle('menu-open', open); // 菜单打开时锁定背景滚动
}

hamburger.addEventListener('click', () =>
  setMobileMenu(!mobileMenu.classList.contains('open'))
);

// 点击菜单项后自动收起
$$('#mobile-menu a').forEach((a) => a.addEventListener('click', () => setMobileMenu(false)));

// 点击菜单外部或按 Esc 关闭
document.addEventListener('click', (e) => {
  if (mobileMenu.classList.contains('open') && !mobileMenu.contains(e.target) && !hamburger.contains(e.target)) {
    setMobileMenu(false);
  }
});
window.addEventListener('keydown', (e) => {
  if (e.key === 'Escape') setMobileMenu(false);
});

/* ---------- 3. 滚动淡入动画 ---------- */
const revealEls = $$('.reveal');

if (prefersReducedMotion) {
  revealEls.forEach((el) => el.classList.add('visible'));
} else {
  const revealObserver = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.classList.add('visible');
          revealObserver.unobserve(entry.target); // 只播放一次
        }
      });
    },
    { threshold: 0.15, rootMargin: '0px 0px -40px 0px' }
  );
  revealEls.forEach((el) => revealObserver.observe(el));
}

/* ---------- 4. 数字滚动（数据区） ---------- */
const numberEls = $$('[data-count]');

function formatNum(value, decimals) {
  return decimals > 0 ? value.toFixed(decimals) : Math.round(value).toLocaleString('en-US');
}

function countUp(el) {
  const target = parseFloat(el.dataset.count);
  const decimals = parseInt(el.dataset.decimals || '0', 10);
  const duration = 1800;
  const start = performance.now();

  (function tick(now) {
    const progress = Math.min((now - start) / duration, 1);
    const eased = 1 - Math.pow(1 - progress, 3); // easeOutCubic
    el.textContent = formatNum(target * eased, decimals);
    if (progress < 1) requestAnimationFrame(tick);
  })(start);
}

if (numberEls.length) {
  if (prefersReducedMotion) {
    numberEls.forEach((el) =>
      (el.textContent = formatNum(parseFloat(el.dataset.count), parseInt(el.dataset.decimals || '0', 10)))
    );
  } else {
    const numObserver = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            countUp(entry.target);
            numObserver.unobserve(entry.target);
          }
        });
      },
      { threshold: 0.5 }
    );
    numberEls.forEach((el) => numObserver.observe(el));
  }
}

/* ---------- 5. 滚动高亮当前区块（导航 scrollspy） ---------- */
const sections = $$('main section[id]');
const navLinks = $$('.nav-links a[href^="#"]');

const spyObserver = new IntersectionObserver(
  (entries) => {
    entries.forEach((entry) => {
      if (entry.isIntersecting) {
        navLinks.forEach((link) =>
          link.classList.toggle('active', link.getAttribute('href') === '#' + entry.target.id)
        );
      }
    });
  },
  { rootMargin: '-45% 0px -50% 0px' } // 视口中线附近视为「当前区块」
);
sections.forEach((s) => spyObserver.observe(s));

/* ---------- 6. 柱状图：进入视口后播放生长动画 ---------- */
const bars = $('#bars');

if (bars) {
  if (prefersReducedMotion) {
    bars.classList.add('animate');
  } else {
    const barsObserver = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            bars.classList.add('animate');
            barsObserver.disconnect();
          }
        });
      },
      { threshold: 0.3 }
    );
    barsObserver.observe(bars);
  }
}

/* ---------- 7. 微动效：仪表盘 3D 倾斜 & 特性卡光晕跟随 ---------- */
// 仅在支持悬停指针且未开启「减弱动态」时启用
const canHover = window.matchMedia('(pointer: fine)').matches;

const dashboard = $('#dashboard');
if (dashboard && canHover && !prefersReducedMotion) {
  const wrap = dashboard.parentElement;
  const MAX_TILT = 4; // 最大倾斜角度

  wrap.addEventListener('mousemove', (e) => {
    const rect = dashboard.getBoundingClientRect();
    const x = (e.clientX - rect.left) / rect.width - 0.5;
    const y = (e.clientY - rect.top) / rect.height - 0.5;
    dashboard.style.setProperty('--ry', (x * MAX_TILT).toFixed(2) + 'deg');
    dashboard.style.setProperty('--rx', (-y * MAX_TILT).toFixed(2) + 'deg');
  });

  wrap.addEventListener('mouseleave', () => {
    dashboard.style.setProperty('--rx', '0deg');
    dashboard.style.setProperty('--ry', '0deg');
  });
}

// 特性卡：光晕跟随鼠标位置
$$('.feature-card').forEach((card) => {
  card.addEventListener('mousemove', (e) => {
    const rect = card.getBoundingClientRect();
    card.style.setProperty('--mx', (e.clientX - rect.left) + 'px');
    card.style.setProperty('--my', (e.clientY - rect.top) + 'px');
  });
});

/* ---------- 8. 页脚年份自动更新 ---------- */
const yearEl = $('#year');
if (yearEl) yearEl.textContent = new Date().getFullYear();
