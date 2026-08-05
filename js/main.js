/* ============================================================
   交互逻辑：加载动画 / 自定义光标 / 导航 / 打字机 /
   滚动显现 / 卡片倾斜 / 技能条 / 数字滚动 / 表单
   ============================================================ */

(function () {
  'use strict';

  const $ = (s, ctx = document) => ctx.querySelector(s);
  const $$ = (s, ctx = document) => Array.from(ctx.querySelectorAll(s));
  const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const finePointer = window.matchMedia('(pointer: fine)').matches;

  /* ---------- 1. 加载动画 ---------- */
  const preloader = $('#preloader');
  function hidePreloader() {
    if (!preloader) return;
    preloader.classList.add('hidden');
    document.body.style.overflow = '';
  }
  // 至少展示片刻，避免闪屏
  window.addEventListener('load', () => setTimeout(hidePreloader, reduceMotion ? 0 : 500));
  setTimeout(hidePreloader, 4000); // 兜底

  /* ---------- 2. 自定义光标 ---------- */
  if (finePointer) {
    document.body.classList.add('has-cursor');
    const dot = $('.cursor-dot');
    const ring = $('.cursor-ring');
    let mx = innerWidth / 2, my = innerHeight / 2, rx = mx, ry = my;

    window.addEventListener('pointermove', (e) => {
      mx = e.clientX;
      my = e.clientY;
      dot.style.transform = `translate(${mx}px, ${my}px) translate(-50%, -50%)`;
    });
    (function follow() {
      rx += (mx - rx) * 0.16;
      ry += (my - ry) * 0.16;
      ring.style.transform = `translate(${rx}px, ${ry}px) translate(-50%, -50%)`;
      requestAnimationFrame(follow);
    })();

    // 悬停到可交互元素时放大
    const interactive = 'a, button, input, textarea, select, [data-tilt], .service-link';
    document.addEventListener('mouseover', (e) => {
      if (e.target.closest(interactive)) ring.classList.add('hovering');
    });
    document.addEventListener('mouseout', (e) => {
      if (e.target.closest(interactive)) ring.classList.remove('hovering');
    });
  }

  /* ---------- 3. 导航 ---------- */
  const navbar = $('#navbar');
  const navLinks = $('#navLinks');
  const burger = $('#navBurger');
  const navAnchors = $$('.nav-link');

  function onScroll() {
    navbar.classList.toggle('scrolled', window.scrollY > 40);
    // 高亮当前区块
    const pos = window.scrollY + innerHeight * 0.32;
    let current = 'home';
    navAnchors.forEach((a) => {
      const sec = $(a.getAttribute('href'));
      if (sec && sec.offsetTop <= pos) current = a.getAttribute('href').slice(1);
    });
    navAnchors.forEach((a) =>
      a.classList.toggle('active', a.getAttribute('href') === `#${current}`)
    );
  }
  window.addEventListener('scroll', onScroll, { passive: true });
  onScroll();

  // 移动端菜单
  burger.addEventListener('click', () => {
    const open = navLinks.classList.toggle('open');
    burger.classList.toggle('open', open);
    burger.setAttribute('aria-expanded', open);
  });
  navAnchors.forEach((a) =>
    a.addEventListener('click', () => {
      navLinks.classList.remove('open');
      burger.classList.remove('open');
    })
  );

  /* ---------- 4. 打字机 ---------- */
  const typeEl = $('#typewriter');
  if (typeEl) {
    const roles = [
      '品牌策划师',
      '新媒体运营专家',
      '数据运营分析师',
      '平面设计师',
      '文案编导',
    ];
    let roleIdx = 0, charIdx = 0, deleting = false;
    function type() {
      const word = roles[roleIdx];
      typeEl.textContent = word.slice(0, charIdx);
      if (!deleting && charIdx < word.length) {
        charIdx++;
        setTimeout(type, 70);
      } else if (!deleting) {
        deleting = true;
        setTimeout(type, 1600);
      } else if (charIdx > 0) {
        charIdx--;
        setTimeout(type, 36);
      } else {
        deleting = false;
        roleIdx = (roleIdx + 1) % roles.length;
        setTimeout(type, 300);
      }
    }
    if (reduceMotion) {
      typeEl.textContent = roles[0];
    } else {
      type();
    }
  }

  /* ---------- 5. 滚动显现 ---------- */
  const revealEls = $$('.reveal');
  const revealObs = new IntersectionObserver(
    (entries) => {
      entries.forEach((en) => {
        if (en.isIntersecting) {
          en.target.classList.add('in-view');
          revealObs.unobserve(en.target);
        }
      });
    },
    { threshold: 0.12, rootMargin: '0px 0px -8% 0px' }
  );
  revealEls.forEach((el, i) => {
    if (!el.style.getPropertyValue('--d') && i % 3 !== 0) {
      el.style.setProperty('--d', `${(i % 3) * 0.1}s`);
    }
    revealObs.observe(el);
  });

  /* ---------- 6. 卡片 3D 倾斜 ---------- */
  if (finePointer && !reduceMotion) {
    $$('[data-tilt]').forEach((card) => {
      card.addEventListener('pointermove', (e) => {
        const r = card.getBoundingClientRect();
        const px = (e.clientX - r.left) / r.width - 0.5;
        const py = (e.clientY - r.top) / r.height - 0.5;
        card.style.transform =
          `perspective(900px) rotateX(${(-py * 6).toFixed(2)}deg) rotateY(${(px * 6).toFixed(2)}deg) translateY(-3px)`;
      });
      card.addEventListener('pointerleave', () => {
        card.style.transform = '';
      });
    });
  }

  /* ---------- 7. 技能条动画 ---------- */
  const bars = $$('.skill-fill');
  const barObs = new IntersectionObserver(
    (entries) => {
      entries.forEach((en) => {
        if (en.isIntersecting) {
          const bar = en.target;
          const level = bar.dataset.level || 0;
          bar.style.width = level + '%';
          barObs.unobserve(bar);
        }
      });
    },
    { threshold: 0.4 }
  );
  bars.forEach((b) => barObs.observe(b));

  /* ---------- 8. 数字滚动 ---------- */
  function animateCount(el) {
    const target = parseFloat(el.dataset.count) || 0;
    const suffix = el.dataset.suffix || '';
    if (reduceMotion) { el.textContent = target + suffix; return; }
    const dur = 1600;
    const start = performance.now();
    (function tick(now) {
      const p = Math.min((now - start) / dur, 1);
      const ease = 1 - Math.pow(1 - p, 3);
      el.textContent = Math.round(target * ease) + suffix;
      if (p < 1) requestAnimationFrame(tick);
    })(start);
  }
  const stats = $$('.stat-num');
  const statObs = new IntersectionObserver(
    (entries) => {
      entries.forEach((en) => {
        if (en.isIntersecting) {
          animateCount(en.target);
          statObs.unobserve(en.target);
        }
      });
    },
    { threshold: 0.6 }
  );
  stats.forEach((s) => statObs.observe(s));

  /* ---------- 10. 页脚年份 ---------- */
  const yearEl = $('#year');
  if (yearEl) yearEl.textContent = new Date().getFullYear();

  /* ---------- 11. 侧边粒子跟随（纯 CSS 光晕点缀） ---------- */
  // 预留扩展点：未来可在此接入更多交互
})();
