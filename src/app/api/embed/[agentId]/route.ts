import { NextResponse } from "next/server";

export async function GET(
  req: Request,
  { params }: { params: Promise<{ agentId: string }> },
) {
  const { agentId } = await params;

  // Build the absolute origin so the script knows where to load the iframe from
  const { origin } = new URL(req.url);

  // This JS runs on the CLIENT's website.
  // It injects a launcher button and an iframe panel that loads /widget/[agentId].
  const js = /* js */ `
(function () {
  'use strict';

  var ORIGIN   = ${JSON.stringify(origin)};
  var AGENT_ID = ${JSON.stringify(agentId)};
  var IFRAME_URL = ORIGIN + '/widget/' + AGENT_ID;

  // ── Styles injected into the host page ──────────────────────────────────
  var css = [
    '.rhn-launcher{position:fixed;bottom:24px;right:24px;z-index:2147483646;',
      'display:flex;align-items:center;gap:10px;',
      'background:#2563eb;color:#fff;border:none;border-radius:999px;',
      'padding:12px 20px 12px 14px;cursor:pointer;',
      'box-shadow:0 4px 20px rgba(37,99,235,.45);',
      'font-family:-apple-system,BlinkMacSystemFont,"Segoe UI",sans-serif;',
      'font-size:14px;font-weight:600;transition:transform .15s,box-shadow .15s;}',
    '.rhn-launcher:hover{transform:translateY(-2px);box-shadow:0 8px 28px rgba(37,99,235,.55);}',
    '.rhn-launcher-avatar{width:36px;height:36px;border-radius:50%;',
      'background:rgba(255,255,255,.25);display:flex;align-items:center;',
      'justify-content:center;font-size:18px;overflow:hidden;flex-shrink:0;}',
    '.rhn-launcher-avatar img{width:100%;height:100%;object-fit:cover;}',
    '.rhn-panel{position:fixed;bottom:88px;right:24px;z-index:2147483647;',
      'width:380px;height:560px;border:none;border-radius:16px;',
      'box-shadow:0 16px 48px rgba(0,0,0,.22);',
      'transform:scale(.9) translateY(16px);opacity:0;pointer-events:none;',
      'transition:transform .22s cubic-bezier(.34,1.56,.64,1),opacity .18s ease;}',
    '.rhn-panel.rhn-open{transform:scale(1) translateY(0);opacity:1;pointer-events:auto;}',
    '@media(max-width:440px){',
      '.rhn-panel{right:0;bottom:0;width:100%;height:100%;border-radius:0;bottom:72px;}',
      '.rhn-launcher{right:16px;bottom:16px;}',
    '}',
  ].join('');

  var styleEl = document.createElement('style');
  styleEl.textContent = css;
  document.head.appendChild(styleEl);

  // ── Launcher button ──────────────────────────────────────────────────────
  var launcher = document.createElement('button');
  launcher.className = 'rhn-launcher';
  launcher.setAttribute('aria-label', 'Open chat');
  launcher.setAttribute('aria-expanded', 'false');

  var avatarEl = document.createElement('span');
  avatarEl.className = 'rhn-launcher-avatar';
  avatarEl.textContent = '🤖';

  var labelEl = document.createElement('span');
  labelEl.textContent = 'Talk to us';

  launcher.appendChild(avatarEl);
  launcher.appendChild(labelEl);

  // ── Iframe panel (created but src is NOT set yet — loaded on first open) ─
  var panel = document.createElement('iframe');
  panel.className = 'rhn-panel';
  panel.allow = 'microphone; camera; autoplay';
  panel.setAttribute('aria-label', 'Chat widget');
  var iframeLoaded = false;
  var started = false;

  // ── Journey & Screen Context Tracking ────────────────────────────────────
  var recent = [];
  try {
    var stored = sessionStorage.getItem('rhn_journey');
    if (stored) recent = JSON.parse(stored);
  } catch (e) {}

  function pushJourney(event) {
    recent.push(event);
    if (recent.length > 20) recent.shift();
    try {
      sessionStorage.setItem('rhn_journey', JSON.stringify(recent));
    } catch (e) {}
  }

  var lastClickDesc = null;

  function getScrollDepth() {
    try {
      var scrollY = window.scrollY || window.pageYOffset || document.documentElement.scrollTop || 0;
      var winH = window.innerHeight || 1;
      var docH = Math.max(document.documentElement.scrollHeight, document.body.scrollHeight || 1);
      return Math.min(100, Math.max(0, Math.round((scrollY + winH) / docH * 100)));
    } catch (e) {
      return 0;
    }
  }

  function getVisibleSection() {
    try {
      var candidates = document.querySelectorAll('h1, h2, h3, [data-section], section[aria-label]');
      var best = null;
      var bestDist = Infinity;
      var vh = window.innerHeight || 800;
      for (var i = 0; i < candidates.length; i++) {
        var el = candidates[i];
        var rect = el.getBoundingClientRect();
        // Look for headings in upper portion of viewport (between -40px and 60% down)
        if (rect.top >= -40 && rect.top <= vh * 0.6) {
          var dist = Math.abs(rect.top - 80);
          if (dist < bestDist) {
            bestDist = dist;
            best = el;
          }
        }
      }
      if (best) {
        var txt = (best.innerText || best.getAttribute('aria-label') || '').trim();
        if (txt) return txt.replace(/\\s+/g, ' ').slice(0, 80);
      }
    } catch (e) {}
    return null;
  }

  function getLiveContext() {
    return {
      url: location.href,
      path: location.pathname,
      scrollDepth: getScrollDepth(),
      visibleSection: getVisibleSection(),
      lastClick: lastClickDesc
    };
  }

  function sendLiveUpdate() {
    if (!open || !iframeLoaded) return;
    try {
      panel.contentWindow.postMessage({
        type: 'LIVE_CONTEXT_UPDATE',
        liveContext: getLiveContext(),
        recentEvents: recent.slice(-15)
      }, ORIGIN);
    } catch (e) {}
  }

  // Record initial page view
  pushJourney({
    type: 'page_view',
    path: location.pathname,
    title: document.title || location.pathname,
    ts: Date.now()
  });

  // Track page navigation (SPA + normal)
  var pageStart = Date.now();
  var lastPath = location.pathname;

  function onNavigation() {
    if (location.pathname === lastPath) return;
    pushJourney({
      type: 'page_time',
      path: lastPath,
      seconds: Math.max(1, Math.round((Date.now() - pageStart) / 1000)),
      ts: Date.now()
    });
    lastPath = location.pathname;
    pageStart = Date.now();
    pushJourney({
      type: 'page_view',
      path: location.pathname,
      title: document.title || location.pathname,
      ts: Date.now()
    });
    sendLiveUpdate();
  }

  var origPush = history.pushState;
  if (origPush) {
    history.pushState = function () {
      origPush.apply(this, arguments);
      onNavigation();
    };
  }
  var origReplace = history.replaceState;
  if (origReplace) {
    history.replaceState = function () {
      origReplace.apply(this, arguments);
      onNavigation();
    };
  }
  window.addEventListener('popstate', onNavigation);
  window.addEventListener('pagehide', function () {
    pushJourney({
      type: 'page_time',
      path: location.pathname,
      seconds: Math.max(1, Math.round((Date.now() - pageStart) / 1000)),
      ts: Date.now()
    });
  });

  // Click tracking (interactive elements only: buttons, links)
  document.addEventListener('click', function (ev) {
    try {
      var target = ev.target;
      if (!target || !target.closest) return;
      var el = target.closest('a, button, [role="button"], input[type="submit"], input[type="button"]');
      if (!el) return;

      // Ignore clicks on launcher itself
      if (launcher.contains(el)) return;

      var tag = el.tagName.toLowerCase();
      var rawText = (el.innerText || el.value || el.getAttribute('aria-label') || '').trim().replace(/\\s+/g, ' ');
      var text = rawText.slice(0, 50);
      var href = el.getAttribute('href') || null;

      lastClickDesc = (text ? '"' + text + '" ' : '') + '(' + tag + (href ? ' to ' + href : '') + ')';

      pushJourney({
        type: 'click',
        path: location.pathname,
        tag: tag,
        text: text || null,
        href: href,
        ts: Date.now()
      });

      sendLiveUpdate();
    } catch (e) {}
  }, true);

  // Scroll tracking (debounced live update + milestone recording)
  var scrollMarks = {};
  var scrollDebounceTimer = null;
  window.addEventListener('scroll', function () {
    var depth = getScrollDepth();
    [25, 50, 75, 100].forEach(function (m) {
      if (depth >= m && !scrollMarks[m]) {
        scrollMarks[m] = true;
        pushJourney({
          type: 'scroll',
          path: location.pathname,
          depth: m,
          ts: Date.now()
        });
      }
    });

    if (open && iframeLoaded) {
      if (scrollDebounceTimer) clearTimeout(scrollDebounceTimer);
      scrollDebounceTimer = setTimeout(sendLiveUpdate, 350);
    }
  }, { passive: true });

  // ── Hydrate launcher with agent name/avatar immediately ──────────────────
  try {
    fetch(ORIGIN + '/api/agents/' + AGENT_ID)
      .then(function (r) { return r.json(); })
      .then(function (d) {
        if (d.name)  labelEl.textContent = 'Talk to ' + d.name;
        if (d.avatar_image_url) {
          var img = document.createElement('img');
          img.src = d.avatar_image_url;
          img.alt = d.name || 'Agent';
          avatarEl.textContent = '';
          avatarEl.appendChild(img);
        }
      })
      .catch(function () {/* graceful degrade */});
  } catch (e) {/* ignore */}

  // ── Toggle open/close ────────────────────────────────────────────────────
  var open = false;
  function toggle() {
    open = !open;
    panel.classList.toggle('rhn-open', open);
    launcher.setAttribute('aria-expanded', String(open));
    launcher.setAttribute('aria-label', open ? 'Close chat' : 'Open chat');

    // First open: load the iframe and start the session
    if (open && !iframeLoaded) {
      iframeLoaded = true;
      panel.src = IFRAME_URL;
      panel.addEventListener('load', function () {
        if (!started) {
          started = true;
          panel.contentWindow.postMessage({
            type: 'WIDGET_START',
            pageUrl: window.location.href,
            liveContext: getLiveContext(),
            recentEvents: recent.slice(-15)
          }, ORIGIN);
        }
      });
    } else if (open && iframeLoaded && !started) {
      started = true;
      panel.contentWindow.postMessage({
        type: 'WIDGET_START',
        pageUrl: window.location.href,
        liveContext: getLiveContext(),
        recentEvents: recent.slice(-15)
      }, ORIGIN);
    } else if (open && iframeLoaded && started) {
      // Re-opened: push fresh live context
      sendLiveUpdate();
    }
  }
  launcher.addEventListener('click', toggle);

  // Close when iframe posts WIDGET_END
  window.addEventListener('message', function (ev) {
    if (ev.origin !== ORIGIN) return;
    if (ev.data && ev.data.type === 'WIDGET_END') {
      open = false;
      panel.classList.remove('rhn-open');
      launcher.setAttribute('aria-expanded', 'false');
    }
  });

  document.body.appendChild(launcher);
  document.body.appendChild(panel);
})();
`.trim();

  return new NextResponse(js, {
    headers: {
      "Content-Type": "application/javascript; charset=utf-8",
      "Cache-Control": "public, max-age=300, stale-while-revalidate=3600",
      // Allow any origin to load this script
      "Access-Control-Allow-Origin": "*",
    },
  });
}
