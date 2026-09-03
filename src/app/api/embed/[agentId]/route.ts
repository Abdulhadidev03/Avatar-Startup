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
          panel.contentWindow.postMessage({ type: 'WIDGET_START', pageUrl: window.location.href }, ORIGIN);
        }
      });
    } else if (open && iframeLoaded && !started) {
      started = true;
      panel.contentWindow.postMessage({ type: 'WIDGET_START', pageUrl: window.location.href }, ORIGIN);
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
