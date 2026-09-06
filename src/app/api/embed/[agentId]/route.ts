import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase";

type EmbedAgent = {
  name: string;
  greeting: string;
  avatarImageUrl: string | null;
};

function safeImageUrl(value: unknown) {
  if (typeof value !== "string") return null;
  try {
    const url = new URL(value);
    return url.protocol === "https:" || url.protocol === "http:"
      ? url.toString()
      : null;
  } catch {
    return null;
  }
}

export async function GET(
  req: Request,
  { params }: { params: Promise<{ agentId: string }> },
) {
  const { agentId } = await params;
  const { origin } = new URL(req.url);

  let agent: EmbedAgent = {
    name: "Ruhana",
    greeting: "Hi — how can I help?",
    avatarImageUrl: null,
  };

  try {
    const { data } = await supabaseAdmin
      .from("agents")
      .select("name, greeting, avatar_image_url")
      .eq("id", agentId)
      .maybeSingle();

    if (data) {
      agent = {
        name: data.name || agent.name,
        greeting: data.greeting || agent.greeting,
        avatarImageUrl: safeImageUrl(data.avatar_image_url),
      };
    }
  } catch {
    // The generic Ruhana identity keeps the launcher usable if config is unavailable.
  }

  const js = /* js */ `
(function () {
  'use strict';

  var ORIGIN = ${JSON.stringify(origin)};
  var AGENT_ID = ${JSON.stringify(agentId)};
  var AGENT = ${JSON.stringify(agent)};
  var HOST_ID = 'ruhana-widget-' + AGENT_ID;

  function mount() {
    if (document.getElementById(HOST_ID)) return;

    var host = document.createElement('div');
    host.id = HOST_ID;
    host.setAttribute('data-ruhana-widget', AGENT_ID);
    var root = host.attachShadow ? host.attachShadow({ mode: 'open' }) : host;

    var style = document.createElement('style');
    style.textContent = [
      ':host{all:initial;color-scheme:light}',
      '.rhn-shell,.rhn-shell *{box-sizing:border-box}',
      '.rhn-shell{--pearl:#fdfdfd;--mist:#f4f6f8;--surface:#fff;--strong:#eef1f3;',
        '--ink:#16181b;--secondary:#62666d;--tertiary:#737981;--line:#e3e6e9;',
        '--line-strong:#d7dce1;--focus:#4c5a70;--success:#326552;',
        'font-family:-apple-system,BlinkMacSystemFont,"Segoe UI",sans-serif;',
        'font-size:14px;line-height:1.4;color:var(--ink)}',
      '.rhn-launcher{position:fixed;right:max(20px,env(safe-area-inset-right));',
        'bottom:max(20px,env(safe-area-inset-bottom));z-index:2147483646;',
        'display:flex;width:min(342px,calc(100vw - 32px));flex-direction:column;gap:10px;',
        'border:1px solid rgba(22,24,27,.1);border-radius:18px;background:rgba(253,253,253,.97);',
        'padding:12px;box-shadow:0 18px 52px rgba(22,24,27,.16);backdrop-filter:blur(18px);',
        'transition:opacity .18s ease,transform .22s cubic-bezier(.2,.75,.25,1),visibility .18s ease}',
      '.rhn-shell.rhn-open .rhn-launcher{visibility:hidden;opacity:0;pointer-events:none;transform:translateY(10px) scale(.97)}',
      '.rhn-main{display:grid;width:100%;grid-template-columns:46px minmax(0,1fr) 24px;align-items:center;gap:10px;',
        'border:0;background:transparent;color:var(--ink);padding:0;text-align:left;cursor:pointer}',
      '.rhn-avatar{position:relative;display:flex;width:46px;height:46px;align-items:center;justify-content:center;',
        'overflow:hidden;border:1px solid var(--line);border-radius:13px;background:var(--ink);color:#fff;',
        'font-size:15px;font-weight:700;letter-spacing:-.03em}',
      '.rhn-avatar img{width:100%;height:100%;object-fit:cover;object-position:center top}',
      '.rhn-presence{position:absolute;right:-1px;bottom:-1px;width:11px;height:11px;border:2px solid var(--pearl);',
        'border-radius:50%;background:var(--success)}',
      '.rhn-copy{display:flex;min-width:0;flex-direction:column;gap:2px}',
      '.rhn-copy strong{overflow:hidden;color:var(--ink);font-size:13px;font-weight:680;letter-spacing:-.01em;text-overflow:ellipsis;white-space:nowrap}',
      '.rhn-copy span{display:-webkit-box;overflow:hidden;color:var(--secondary);font-size:11px;line-height:1.35;',
        '-webkit-box-orient:vertical;-webkit-line-clamp:2}',
      '.rhn-open-icon{display:flex;width:24px;height:24px;align-items:center;justify-content:center;border-radius:7px;',
        'color:var(--tertiary);font-size:18px;transition:background .15s ease,color .15s ease,transform .15s ease}',
      '.rhn-main:hover .rhn-open-icon{background:var(--strong);color:var(--ink);transform:translateX(1px)}',
      '.rhn-quick{display:grid;grid-template-columns:minmax(0,1fr) 38px 66px;gap:6px}',
      '.rhn-quick input{min-width:0;height:40px;border:1px solid var(--line-strong);border-radius:10px;background:var(--surface);',
        'color:var(--ink);padding:0 10px;font:inherit;font-size:11px;outline:0}',
      '.rhn-quick input::placeholder{color:var(--tertiary);opacity:1}',
      '.rhn-quick input:focus{border-color:var(--focus);box-shadow:0 0 0 3px rgba(76,90,112,.1)}',
      '.rhn-quick button{display:flex;height:40px;align-items:center;justify-content:center;gap:5px;border:1px solid var(--line-strong);',
        'border-radius:10px;background:var(--surface);color:var(--ink);padding:0;cursor:pointer;font:inherit;font-size:10px;font-weight:680;',
        'transition:background .15s ease,color .15s ease,transform .15s ease}',
      '.rhn-quick button:hover{background:var(--strong);transform:translateY(-1px)}',
      '.rhn-quick .rhn-send{border-color:var(--ink);background:var(--ink);color:#fff}',
      '.rhn-quick .rhn-mic.rhn-live{border-color:var(--ink);background:var(--ink);color:#fff}',
      '.rhn-quick svg{width:16px;height:16px;fill:none;stroke:currentColor;stroke-width:1.8;stroke-linecap:round;stroke-linejoin:round}',
      '.rhn-panel{position:fixed;right:max(20px,env(safe-area-inset-right));bottom:max(20px,env(safe-area-inset-bottom));',
        'z-index:2147483647;width:388px;height:min(576px,calc(100dvh - 40px));border:0;border-radius:18px;',
        'background:transparent;box-shadow:0 28px 90px rgba(22,24,27,.22);opacity:0;pointer-events:none;',
        'transform:translateY(18px) scale(.94);transform-origin:bottom right;',
        'transition:opacity .18s ease,transform .24s cubic-bezier(.2,.8,.25,1)}',
      '.rhn-panel.rhn-open{opacity:1;pointer-events:auto;transform:translateY(0) scale(1)}',
      '.rhn-backdrop{position:fixed;z-index:2147483645;inset:0;display:none;border:0;background:rgba(22,24,27,.24);',
        'padding:0;opacity:0;pointer-events:none;backdrop-filter:blur(2px);transition:opacity .18s ease}',
      '.rhn-sr{position:absolute;width:1px;height:1px;overflow:hidden;clip:rect(0 0 0 0);clip-path:inset(50%);white-space:nowrap}',
      '.rhn-main:focus-visible,.rhn-quick button:focus-visible,.rhn-backdrop:focus-visible{outline:2px solid var(--focus);outline-offset:2px}',
      '@media(max-width:520px){',
        '.rhn-launcher{right:16px;bottom:max(16px,env(safe-area-inset-bottom));width:calc(100vw - 32px)}',
        '.rhn-panel{right:8px;bottom:max(8px,env(safe-area-inset-bottom));left:8px;width:auto;',
          'height:min(82dvh,620px);max-height:calc(100dvh - 16px);border-radius:20px 20px 14px 14px;',
          'transform:translateY(calc(100% + 24px));transform-origin:bottom center}',
        '.rhn-panel.rhn-open{transform:translateY(0)}',
        '.rhn-backdrop{display:block}',
        '.rhn-shell.rhn-open .rhn-backdrop{opacity:1;pointer-events:auto}',
      '}',
      '@media(max-width:360px){.rhn-launcher{right:10px;width:calc(100vw - 20px);padding:10px}.rhn-quick{grid-template-columns:minmax(0,1fr) 38px 42px}.rhn-mic span{display:none}}',
      '@media(prefers-reduced-motion:reduce){.rhn-launcher,.rhn-panel,.rhn-backdrop,.rhn-open-icon,.rhn-quick button{transition-duration:.01ms!important;animation-duration:.01ms!important}}'
    ].join('');

    function svgIcon(kind) {
      var span = document.createElement('span');
      span.setAttribute('aria-hidden', 'true');
      if (kind === 'send') {
        span.innerHTML = '<svg viewBox="0 0 24 24"><path d="m4 4 16 8-16 8 3-8-3-8Z"/><path d="M7 12h13"/></svg>';
      } else {
        span.innerHTML = '<svg viewBox="0 0 24 24"><rect x="9" y="3" width="6" height="11" rx="3"/><path d="M6.5 11.5a5.5 5.5 0 0 0 11 0M12 17v4M9 21h6"/></svg>';
      }
      return span;
    }

    var shell = document.createElement('div');
    shell.className = 'rhn-shell';

    var backdrop = document.createElement('button');
    backdrop.className = 'rhn-backdrop';
    backdrop.type = 'button';
    backdrop.tabIndex = -1;
    backdrop.setAttribute('aria-hidden', 'true');
    backdrop.setAttribute('aria-label', 'Minimize conversation');

    var launcher = document.createElement('section');
    launcher.className = 'rhn-launcher';
    launcher.setAttribute('role', 'region');
    launcher.setAttribute('aria-label', 'Ruhana website assistant');

    var mainButton = document.createElement('button');
    mainButton.className = 'rhn-main';
    mainButton.type = 'button';
    mainButton.setAttribute('aria-expanded', 'false');
    mainButton.setAttribute('aria-controls', HOST_ID + '-panel');
    mainButton.setAttribute('aria-label', 'Open conversation with ' + AGENT.name);

    var avatar = document.createElement('span');
    avatar.className = 'rhn-avatar';
    avatar.textContent = (AGENT.name || 'R').split(/\\s+/).map(function (part) { return part.charAt(0); }).join('').slice(0, 2).toUpperCase() || 'R';
    if (AGENT.avatarImageUrl) {
      var image = document.createElement('img');
      image.src = AGENT.avatarImageUrl;
      image.alt = '';
      image.addEventListener('error', function () { image.remove(); });
      avatar.textContent = '';
      avatar.appendChild(image);
    }
    var presence = document.createElement('i');
    presence.className = 'rhn-presence';
    presence.setAttribute('aria-hidden', 'true');
    avatar.appendChild(presence);

    var copy = document.createElement('span');
    copy.className = 'rhn-copy';
    var name = document.createElement('strong');
    name.textContent = AGENT.name;
    var greeting = document.createElement('span');
    greeting.textContent = AGENT.greeting;
    greeting.setAttribute('aria-live', 'polite');
    copy.appendChild(name);
    copy.appendChild(greeting);

    var openIcon = document.createElement('span');
    openIcon.className = 'rhn-open-icon';
    openIcon.textContent = '›';
    openIcon.setAttribute('aria-hidden', 'true');
    mainButton.appendChild(avatar);
    mainButton.appendChild(copy);
    mainButton.appendChild(openIcon);

    var quickForm = document.createElement('form');
    quickForm.className = 'rhn-quick';
    var quickLabel = document.createElement('label');
    quickLabel.className = 'rhn-sr';
    quickLabel.htmlFor = HOST_ID + '-message';
    quickLabel.textContent = 'Type a question for ' + AGENT.name;
    var quickInput = document.createElement('input');
    quickInput.id = HOST_ID + '-message';
    quickInput.type = 'text';
    quickInput.maxLength = 1000;
    quickInput.autocomplete = 'off';
    quickInput.placeholder = 'Type a question…';
    var sendButton = document.createElement('button');
    sendButton.className = 'rhn-send';
    sendButton.type = 'submit';
    sendButton.setAttribute('aria-label', 'Send message');
    sendButton.appendChild(svgIcon('send'));
    var micButton = document.createElement('button');
    micButton.className = 'rhn-mic';
    micButton.type = 'button';
    micButton.setAttribute('aria-label', 'Start voice conversation');
    micButton.setAttribute('aria-pressed', 'false');
    micButton.appendChild(svgIcon('mic'));
    var micText = document.createElement('span');
    micText.textContent = 'Talk';
    micButton.appendChild(micText);
    quickForm.appendChild(quickLabel);
    quickForm.appendChild(quickInput);
    quickForm.appendChild(sendButton);
    quickForm.appendChild(micButton);

    launcher.appendChild(mainButton);
    launcher.appendChild(quickForm);

    var channel = window.crypto && typeof window.crypto.randomUUID === 'function'
      ? window.crypto.randomUUID()
      : String(Date.now()) + '-' + Math.random().toString(36).slice(2);
    var iframeUrl = ORIGIN + '/widget/' + encodeURIComponent(AGENT_ID)
      + '?parentOrigin=' + encodeURIComponent(window.location.origin)
      + '&channel=' + encodeURIComponent(channel);

    var panel = document.createElement('iframe');
    panel.id = HOST_ID + '-panel';
    panel.className = 'rhn-panel';
    panel.title = 'Conversation with ' + AGENT.name;
    panel.allow = 'microphone; autoplay';
    panel.referrerPolicy = 'strict-origin-when-cross-origin';
    panel.tabIndex = -1;
    panel.setAttribute('aria-hidden', 'true');

    var isOpen = false;
    var frameLoaded = false;
    var frameReady = false;
    var pendingActions = [];
    var lastOpener = mainButton;
    var widgetStatus = 'idle';
    var widgetMicMuted = true;
    var journeyKey = 'ruhana_journey_v1';
    var recentEvents = [];
    var lastClickDesc = null;
    var currentPath = window.location.pathname;
    var pageStartedAt = Date.now();
    var scrollMarks = {};
    var scrollUpdateTimer = null;

    try {
      var storedJourney = window.sessionStorage.getItem(journeyKey);
      var parsedJourney = storedJourney ? JSON.parse(storedJourney) : [];
      if (Array.isArray(parsedJourney)) recentEvents = parsedJourney.slice(-20);
    } catch (error) {
      recentEvents = [];
    }

    function rememberJourney(event) {
      recentEvents.push(event);
      if (recentEvents.length > 20) recentEvents.shift();
      try {
        window.sessionStorage.setItem(journeyKey, JSON.stringify(recentEvents));
      } catch (error) {
        // The widget still works when storage is unavailable.
      }
    }

    function getScrollDepth() {
      try {
        var scrollTop = window.scrollY || window.pageYOffset || document.documentElement.scrollTop || 0;
        var viewportHeight = window.innerHeight || 1;
        var documentHeight = Math.max(
          document.documentElement.scrollHeight,
          document.body ? document.body.scrollHeight : 1
        );
        return Math.min(100, Math.max(0, Math.round((scrollTop + viewportHeight) / documentHeight * 100)));
      } catch (error) {
        return 0;
      }
    }

    function getVisibleSection() {
      try {
        var candidates = document.querySelectorAll('h1,h2,h3,[data-section],section[aria-label]');
        var best = null;
        var bestDistance = Infinity;
        var viewportHeight = window.innerHeight || 800;
        for (var index = 0; index < candidates.length; index += 1) {
          var candidate = candidates[index];
          var rect = candidate.getBoundingClientRect();
          if (rect.top >= -40 && rect.top <= viewportHeight * 0.6) {
            var distance = Math.abs(rect.top - 80);
            if (distance < bestDistance) {
              bestDistance = distance;
              best = candidate;
            }
          }
        }
        if (!best) return null;
        var label = (best.innerText || best.getAttribute('aria-label') || '')
          .trim()
          .replace(/\\s+/g, ' ')
          .slice(0, 80);
        return label || null;
      } catch (error) {
        return null;
      }
    }

    function getLiveContext() {
      return {
        url: window.location.href.slice(0, 2048),
        path: window.location.pathname.slice(0, 512),
        scrollDepth: getScrollDepth(),
        visibleSection: getVisibleSection(),
        lastClick: lastClickDesc
      };
    }

    function contextDetail(extra) {
      return Object.assign({}, extra || {}, {
        liveContext: getLiveContext(),
        recentEvents: recentEvents.slice(-15)
      });
    }

    function sendLiveUpdate() {
      if (!isOpen || !frameReady) return;
      postToFrame('LIVE_CONTEXT_UPDATE', contextDetail());
    }

    function recordPageTime(path) {
      rememberJourney({
        type: 'page_time',
        path: path,
        seconds: Math.max(1, Math.round((Date.now() - pageStartedAt) / 1000)),
        ts: Date.now()
      });
    }

    function onNavigation() {
      if (window.location.pathname === currentPath) return;
      recordPageTime(currentPath);
      currentPath = window.location.pathname;
      pageStartedAt = Date.now();
      scrollMarks = {};
      rememberJourney({
        type: 'page_view',
        path: currentPath,
        title: (document.title || currentPath).slice(0, 120),
        ts: Date.now()
      });
      sendLiveUpdate();
    }

    rememberJourney({
      type: 'page_view',
      path: currentPath,
      title: (document.title || currentPath).slice(0, 120),
      ts: Date.now()
    });

    var originalPushState = window.history.pushState;
    if (originalPushState) {
      window.history.pushState = function () {
        var result = originalPushState.apply(this, arguments);
        onNavigation();
        return result;
      };
    }
    var originalReplaceState = window.history.replaceState;
    if (originalReplaceState) {
      window.history.replaceState = function () {
        var result = originalReplaceState.apply(this, arguments);
        onNavigation();
        return result;
      };
    }
    window.addEventListener('popstate', onNavigation);
    window.addEventListener('pagehide', function () {
      recordPageTime(window.location.pathname);
    });

    document.addEventListener('click', function (event) {
      try {
        var target = event.target;
        if (!target || !target.closest) return;
        var control = target.closest('a,button,[role="button"],input[type="submit"],input[type="button"]');
        if (!control || host.contains(control)) return;

        var tag = control.tagName.toLowerCase();
        var rawText = (control.innerText || control.value || control.getAttribute('aria-label') || '')
          .trim()
          .replace(/\\s+/g, ' ');
        var controlText = rawText.slice(0, 50);
        var href = control.getAttribute('href');
        var safeHref = null;
        if (href) {
          try {
            var hrefUrl = new URL(href, window.location.href);
            safeHref = hrefUrl.origin === window.location.origin
              ? hrefUrl.pathname.slice(0, 512)
              : hrefUrl.hostname.slice(0, 120);
          } catch (error) {
            safeHref = null;
          }
        }

        lastClickDesc = (controlText ? '"' + controlText + '" ' : '')
          + '(' + tag + (safeHref ? ' to ' + safeHref : '') + ')';
        rememberJourney({
          type: 'click',
          path: window.location.pathname,
          tag: tag,
          text: controlText || null,
          href: safeHref,
          ts: Date.now()
        });
        sendLiveUpdate();
      } catch (error) {
        // Host-page event tracking must never interrupt the page.
      }
    }, true);

    window.addEventListener('scroll', function () {
      var depth = getScrollDepth();
      [25, 50, 75, 100].forEach(function (milestone) {
        if (depth >= milestone && !scrollMarks[milestone]) {
          scrollMarks[milestone] = true;
          rememberJourney({
            type: 'scroll',
            path: window.location.pathname,
            depth: milestone,
            ts: Date.now()
          });
        }
      });
      if (!isOpen || !frameReady) return;
      if (scrollUpdateTimer) window.clearTimeout(scrollUpdateTimer);
      scrollUpdateTimer = window.setTimeout(sendLiveUpdate, 350);
    }, { passive: true });

    function postToFrame(type, detail) {
      if (!frameReady || !panel.contentWindow) return;
      var message = Object.assign({ type: type, channel: channel }, detail || {});
      panel.contentWindow.postMessage(message, ORIGIN);
    }

    function flushActions() {
      if (!frameReady || !isOpen) return;
      while (pendingActions.length) {
        var action = pendingActions.shift();
        postToFrame(action.type, action.detail);
      }
    }

    function updateLauncherState() {
      var isLive = widgetStatus === 'connected';
      micButton.classList.toggle('rhn-live', isLive && !widgetMicMuted);
      micButton.setAttribute('aria-pressed', String(isLive && !widgetMicMuted));
      if (isLive) {
        micText.textContent = widgetMicMuted ? 'Unmute' : 'Mute';
        micButton.setAttribute('aria-label', widgetMicMuted ? 'Unmute microphone' : 'Mute microphone');
        greeting.textContent = widgetMicMuted ? 'Live conversation · mic muted' : 'Live conversation · microphone on';
      } else if (widgetStatus === 'chatting' || widgetStatus === 'preparing') {
        micText.textContent = 'Talk';
        micButton.setAttribute('aria-label', 'Start voice conversation');
        greeting.textContent = 'Text chat ready · voice is optional';
      } else {
        micText.textContent = 'Talk';
        micButton.setAttribute('aria-label', 'Start voice conversation');
        greeting.textContent = AGENT.greeting;
      }
    }

    function ensureFrame() {
      if (frameLoaded) return;
      frameLoaded = true;
      panel.src = iframeUrl;
    }

    function openPanel(opener, action) {
      lastOpener = opener || lastOpener;
      if (action) pendingActions.push(action);
      isOpen = true;
      shell.classList.add('rhn-open');
      panel.classList.add('rhn-open');
      panel.tabIndex = 0;
      panel.setAttribute('aria-hidden', 'false');
      backdrop.tabIndex = 0;
      backdrop.setAttribute('aria-hidden', 'false');
      mainButton.setAttribute('aria-expanded', 'true');
      ensureFrame();
      window.setTimeout(function () { panel.focus(); }, 0);
      if (frameReady) {
        postToFrame('RUHANA_WIDGET_OPEN', contextDetail({ pageUrl: window.location.href }));
        flushActions();
      }
    }

    function minimizePanel(notifyFrame) {
      if (!isOpen) return;
      isOpen = false;
      shell.classList.remove('rhn-open');
      panel.classList.remove('rhn-open');
      panel.tabIndex = -1;
      panel.setAttribute('aria-hidden', 'true');
      backdrop.tabIndex = -1;
      backdrop.setAttribute('aria-hidden', 'true');
      mainButton.setAttribute('aria-expanded', 'false');
      if (notifyFrame) {
        postToFrame('RUHANA_WIDGET_HOST_MINIMIZE');
      }
      window.setTimeout(function () {
        if (lastOpener && typeof lastOpener.focus === 'function') lastOpener.focus();
      }, 0);
    }

    mainButton.addEventListener('click', function () {
      openPanel(mainButton);
    });

    quickForm.addEventListener('submit', function (event) {
      event.preventDefault();
      var text = quickInput.value.trim();
      if (!text) {
        openPanel(quickInput);
        return;
      }
      quickInput.value = '';
      openPanel(quickInput, {
        type: 'RUHANA_WIDGET_SEND_TEXT',
        detail: contextDetail({ text: text.slice(0, 1000), pageUrl: window.location.href })
      });
    });

    micButton.addEventListener('click', function () {
      openPanel(micButton, {
        type: 'RUHANA_WIDGET_START_VOICE',
        detail: contextDetail({ pageUrl: window.location.href })
      });
    });

    backdrop.addEventListener('click', function () {
      minimizePanel(true);
    });

    document.addEventListener('keydown', function (event) {
      if (event.key === 'Escape' && isOpen) minimizePanel(true);
    });

    window.addEventListener('message', function (event) {
      if (
        event.origin !== ORIGIN ||
        event.source !== panel.contentWindow ||
        !event.data ||
        event.data.channel !== channel
      ) return;

      if (event.data.type === 'RUHANA_WIDGET_READY') {
        frameReady = true;
        if (isOpen) {
          postToFrame('RUHANA_WIDGET_OPEN', contextDetail({ pageUrl: window.location.href }));
          flushActions();
        }
      }
      if (event.data.type === 'RUHANA_WIDGET_MINIMIZE') {
        minimizePanel(false);
      }
      if (event.data.type === 'RUHANA_WIDGET_STATE') {
        widgetStatus = event.data.status || widgetStatus;
        widgetMicMuted = event.data.micMuted !== false;
        updateLauncherState();
      }
    });

    shell.appendChild(backdrop);
    shell.appendChild(panel);
    shell.appendChild(launcher);
    root.appendChild(style);
    root.appendChild(shell);
    document.body.appendChild(host);
  }

  if (document.body) mount();
  else document.addEventListener('DOMContentLoaded', mount, { once: true });
})();
`.trim();

  return new NextResponse(js, {
    headers: {
      "Content-Type": "application/javascript; charset=utf-8",
      "Cache-Control": "public, max-age=60, stale-while-revalidate=300",
      "Access-Control-Allow-Origin": "*",
      "Cross-Origin-Resource-Policy": "cross-origin",
      "X-Content-Type-Options": "nosniff",
    },
  });
}
