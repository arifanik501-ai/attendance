// ═══════════════════════════════════════════════════════════════════
// MEP Fan — Rich Tooltip System (v1.0)
// ---------------------------------------------------------------
// Drop-in replacement for native `title=` tooltips with:
//   • Smart auto-flipping placement (top/bottom/left/right/auto)
//   • Smooth fade + scale animation + arrow pointer
//   • Rich content (title, description, shortcut badge, HTML)
//   • Themes (default / info / success / warning / danger)
//   • Touch (long-press), keyboard (focus + Escape), and mouse support
//   • Auto-migration of existing `title=""` attributes
//   • MutationObserver for dynamically added elements
//
// Usage:
//   <button title="Quick hint">...</button>          (auto-migrated)
//   <button data-tip="Hello">...</button>
//   <button data-tip-title="Save" data-tip-desc="Write changes to DB"
//           data-tip-shortcut="⌘ S" data-tip-placement="bottom"
//           data-tip-theme="success">Save</button>
//   <span data-tip="<b>Rich</b> HTML" data-tip-html="true">...</span>
// ═══════════════════════════════════════════════════════════════════
(function () {
  'use strict';

  if (window.__mepTooltipInstalled) return;
  window.__mepTooltipInstalled = true;

  const SHOW_DELAY_MS = 350;
  const HIDE_DELAY_MS = 80;
  const LONG_PRESS_MS = 500;
  const VIEWPORT_MARGIN = 8;
  const ARROW_SIZE = 7;

  // ── Build tooltip DOM once ───────────────────────────────────────
  const tip = document.createElement('div');
  tip.className = 'mep-tip';
  tip.setAttribute('role', 'tooltip');
  tip.setAttribute('aria-hidden', 'true');
  tip.innerHTML = `
    <div class="mep-tip-arrow"></div>
    <div class="mep-tip-body">
      <div class="mep-tip-title"></div>
      <div class="mep-tip-desc"></div>
      <div class="mep-tip-shortcut"></div>
    </div>`;
  document.body.appendChild(tip);

  const $title = tip.querySelector('.mep-tip-title');
  const $desc = tip.querySelector('.mep-tip-desc');
  const $short = tip.querySelector('.mep-tip-shortcut');
  const $arrow = tip.querySelector('.mep-tip-arrow');

  let currentTarget = null;
  let showTimer = null;
  let hideTimer = null;
  let longPressTimer = null;
  let tipId = 0;

  // ── Migrate native `title` attributes so browser tooltip doesn't duplicate ──
  function migrate(el) {
    if (!el || el.nodeType !== 1) return;
    if (el.hasAttribute('title') && !el.hasAttribute('data-tip')) {
      const t = el.getAttribute('title');
      if (t && t.trim()) {
        el.setAttribute('data-tip', t);
        el.removeAttribute('title');
      }
    }
  }
  function migrateAll(root) {
    if (!root) return;
    if (root.nodeType === 1) {
      migrate(root);
      root.querySelectorAll('[title]').forEach(migrate);
    }
  }

  // ── Read tooltip config from target element ──────────────────────
  function configFrom(el) {
    return {
      title: el.getAttribute('data-tip-title') || '',
      desc: el.getAttribute('data-tip-desc') || el.getAttribute('data-tip') || '',
      shortcut: el.getAttribute('data-tip-shortcut') || '',
      placement: (el.getAttribute('data-tip-placement') || 'auto').toLowerCase(),
      theme: (el.getAttribute('data-tip-theme') || 'default').toLowerCase(),
      html: el.getAttribute('data-tip-html') === 'true',
      delay: parseInt(el.getAttribute('data-tip-delay'), 10)
    };
  }

  // ── Render content into the tooltip element ──────────────────────
  function render(cfg) {
    const setContent = ($el, val) => {
      if (!val) { $el.style.display = 'none'; $el.textContent = ''; return; }
      $el.style.display = '';
      if (cfg.html) $el.innerHTML = val; else $el.textContent = val;
    };
    setContent($title, cfg.title);
    setContent($desc, cfg.desc);
    if (cfg.shortcut) {
      $short.style.display = '';
      $short.innerHTML = cfg.shortcut
        .split('+')
        .map(k => `<kbd>${escapeHtml(k.trim())}</kbd>`)
        .join('<span class="mep-tip-plus">+</span>');
    } else {
      $short.style.display = 'none';
      $short.innerHTML = '';
    }
    tip.dataset.theme = ['default','info','success','warning','danger']
      .includes(cfg.theme) ? cfg.theme : 'default';
  }

  function escapeHtml(s) {
    return s.replace(/[&<>"']/g, c => ({
      '&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'
    }[c]));
  }

  // ── Positioning with auto-flip ───────────────────────────────────
  function position(target, preferred) {
    const r = target.getBoundingClientRect();
    tip.style.visibility = 'hidden';
    tip.style.display = 'block';
    tip.classList.add('mep-tip--measuring');
    const tw = tip.offsetWidth, th = tip.offsetHeight;
    tip.classList.remove('mep-tip--measuring');
    tip.style.visibility = '';

    const vw = window.innerWidth, vh = window.innerHeight;
    const gap = ARROW_SIZE + 4;

    const fits = {
      top:    r.top - th - gap >= VIEWPORT_MARGIN,
      bottom: r.bottom + th + gap <= vh - VIEWPORT_MARGIN,
      left:   r.left - tw - gap >= VIEWPORT_MARGIN,
      right:  r.right + tw + gap <= vw - VIEWPORT_MARGIN
    };

    let placement = preferred;
    if (placement === 'auto' || !fits[placement]) {
      placement = fits.top ? 'top'
        : fits.bottom ? 'bottom'
        : fits.right ? 'right'
        : fits.left ? 'left'
        : 'top'; // last resort — will be clamped below
    }

    let top, left;
    if (placement === 'top' || placement === 'bottom') {
      left = r.left + r.width / 2 - tw / 2;
      top = placement === 'top' ? r.top - th - gap : r.bottom + gap;
    } else {
      top = r.top + r.height / 2 - th / 2;
      left = placement === 'left' ? r.left - tw - gap : r.right + gap;
    }

    // Clamp inside viewport
    const clampedLeft = Math.max(VIEWPORT_MARGIN, Math.min(left, vw - tw - VIEWPORT_MARGIN));
    const clampedTop = Math.max(VIEWPORT_MARGIN, Math.min(top, vh - th - VIEWPORT_MARGIN));

    // Position arrow (relative to clamped tip)
    let arrowLeft = '', arrowTop = '';
    if (placement === 'top' || placement === 'bottom') {
      const centerX = r.left + r.width / 2;
      arrowLeft = Math.max(12, Math.min(centerX - clampedLeft, tw - 12)) + 'px';
    } else {
      const centerY = r.top + r.height / 2;
      arrowTop = Math.max(12, Math.min(centerY - clampedTop, th - 12)) + 'px';
    }

    tip.style.top = (clampedTop + window.scrollY) + 'px';
    tip.style.left = (clampedLeft + window.scrollX) + 'px';
    tip.dataset.placement = placement;
    $arrow.style.left = arrowLeft;
    $arrow.style.top = arrowTop;
  }

  // ── Show / hide lifecycle ───────────────────────────────────────
  function show(target) {
    if (currentTarget === target && tip.classList.contains('mep-tip--visible')) return;
    const cfg = configFrom(target);
    if (!cfg.title && !cfg.desc) return;
    render(cfg);
    currentTarget = target;

    const id = 'mep-tip-' + (++tipId);
    tip.id = id;
    target.setAttribute('aria-describedby', id);

    position(target, cfg.placement);
    tip.classList.add('mep-tip--visible');
    tip.setAttribute('aria-hidden', 'false');
  }

  function hide() {
    if (!currentTarget) return;
    currentTarget.removeAttribute('aria-describedby');
    currentTarget = null;
    tip.classList.remove('mep-tip--visible');
    tip.setAttribute('aria-hidden', 'true');
  }

  function scheduleShow(target) {
    clearTimeout(hideTimer);
    clearTimeout(showTimer);
    const cfg = configFrom(target);
    const delay = Number.isFinite(cfg.delay) ? cfg.delay : SHOW_DELAY_MS;
    showTimer = setTimeout(() => show(target), delay);
  }
  function scheduleHide() {
    clearTimeout(showTimer);
    clearTimeout(hideTimer);
    hideTimer = setTimeout(hide, HIDE_DELAY_MS);
  }

  // ── Event delegation ────────────────────────────────────────────
  function findTipTarget(el) {
    while (el && el !== document.body) {
      if (el.nodeType === 1 && (el.hasAttribute('data-tip') ||
          el.hasAttribute('data-tip-title') || el.hasAttribute('data-tip-desc'))) {
        return el;
      }
      el = el.parentNode;
    }
    return null;
  }

  document.addEventListener('mouseover', (e) => {
    const t = findTipTarget(e.target);
    if (t) scheduleShow(t);
  });
  document.addEventListener('mouseout', (e) => {
    const t = findTipTarget(e.target);
    if (t && (!e.relatedTarget || !t.contains(e.relatedTarget))) scheduleHide();
  });

  document.addEventListener('focusin', (e) => {
    const t = findTipTarget(e.target);
    if (t) show(t);
  });
  document.addEventListener('focusout', (e) => {
    const t = findTipTarget(e.target);
    if (t) hide();
  });

  // Touch: long-press shows, tap outside hides
  document.addEventListener('touchstart', (e) => {
    const t = findTipTarget(e.target);
    if (!t) return;
    clearTimeout(longPressTimer);
    longPressTimer = setTimeout(() => show(t), LONG_PRESS_MS);
  }, { passive: true });
  const cancelLongPress = () => clearTimeout(longPressTimer);
  document.addEventListener('touchend', cancelLongPress);
  document.addEventListener('touchmove', cancelLongPress, { passive: true });
  document.addEventListener('touchcancel', cancelLongPress);

  // Dismiss on scroll / resize / escape / outside click
  window.addEventListener('scroll', hide, true);
  window.addEventListener('resize', hide);
  document.addEventListener('keydown', (e) => { if (e.key === 'Escape') hide(); });
  document.addEventListener('click', (e) => {
    if (!currentTarget) return;
    if (!currentTarget.contains(e.target) && !tip.contains(e.target)) hide();
  });

  // ── Observe DOM for dynamic nodes & migrate title attributes ────
  function init() {
    migrateAll(document.body);
    const mo = new MutationObserver((muts) => {
      for (const m of muts) {
        m.addedNodes.forEach(n => migrateAll(n));
        if (m.type === 'attributes' && m.attributeName === 'title') migrate(m.target);
      }
    });
    mo.observe(document.body, {
      childList: true, subtree: true,
      attributes: true, attributeFilter: ['title']
    });
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }

  // Public API
  window.MEPTooltip = {
    show: (el) => { const t = typeof el === 'string' ? document.querySelector(el) : el;
                     if (t) show(t); },
    hide,
    refresh: () => migrateAll(document.body)
  };
})();
