/*!
 * IFIX — Site Assistant Widget  ("Fixi")
 * A custom, on-brand chat widget for ifix-itservices.co.za
 *
 * INSTALL (anywhere before </body>):
 *   <script>
 *     window.IFIX_BOT_CONFIG = { apiUrl: 'https://YOUR-WORKER.workers.dev/' };
 *   </script>
 *   <script src="/js/ifix-bot.js" defer></script>
 *
 * Without apiUrl the widget runs on its built-in quick answers (offline mode).
 * With apiUrl it asks the AI worker, and falls back to quick answers if the API is down.
 *
 * No dependencies. No cookies. Transcript kept in sessionStorage only.
 */
(function () {
  'use strict';
  if (window.__IFIX_BOT__) return;
  window.__IFIX_BOT__ = true;

  /* ---------------------------------------------------------------- config */

  var script = document.currentScript;

  function attr(name) {
    try { return script && script.getAttribute(name); } catch (e) { return null; }
  }

  var CFG = {
    apiUrl: '',                                   /* AI worker endpoint (leave empty for offline mode) */
    botName: 'Fixi',
    subtitle: 'IFIX Assistant',
    avatarStyle: 'robot',                         /* 'robot' or 'person' */
    launcherSize: 48,                             /* px — the little figure's button */
    accent: '#3DDC84',
    whatsapp: '27677368173',                      /* digits only */
    whatsappText: 'Hi IFIX! I was chatting with Fixi on your website and have a question.',
    teaser: true,
    teaserDelay: 9000,
    teaserText: 'Hi, I\u2019m Fixi. Ask me anything about our services, pricing or terms.',
    startOpen: false,
    position: 'right',                            /* 'right' or 'left' */
    maxInput: 600,
    maxHistory: 10,                               /* messages sent to the API */
    storageKey: 'ifixBotChatV1'
  };

  if (window.IFIX_BOT_CONFIG) {
    for (var k in window.IFIX_BOT_CONFIG) {
      if (Object.prototype.hasOwnProperty.call(window.IFIX_BOT_CONFIG, k)) CFG[k] = window.IFIX_BOT_CONFIG[k];
    }
  }
  /* Zero-config install: if this script is served from a different origin than
     the page (i.e. straight from the Worker), the chat endpoint is that origin.
     An explicit apiUrl / data-api always wins. */
  try {
    if (!CFG.apiUrl && script && script.src && /^https?:/i.test(script.src)) {
      var u = new URL(script.src);
      if (u.host !== location.host) CFG.apiUrl = u.origin + '/';
    }
  } catch (e) {}

  if (attr('data-api')) CFG.apiUrl = attr('data-api');
  if (attr('data-name')) CFG.botName = attr('data-name');
  if (attr('data-whatsapp')) CFG.whatsapp = attr('data-whatsapp');
  if (attr('data-position')) CFG.position = attr('data-position');

  /* ---------------------------------------------------------------- helpers */

  function esc(s) {
    return String(s == null ? '' : s)
      .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;').replace(/'/g, '&#39;');
  }

  function store(key, val) {
    try { sessionStorage.setItem(key, JSON.stringify(val)); } catch (e) {}
  }
  function read(key) {
    try { var v = sessionStorage.getItem(key); return v ? JSON.parse(v) : null; } catch (e) { return null; }
  }

  var WA_LINK = 'https://wa.me/' + CFG.whatsapp + '?text=' + encodeURIComponent(CFG.whatsappText);

  /* Turn safe-ish text into HTML: markdown links, bare links, **bold**, line breaks.
     Trusted = our own copy (already contains HTML entities), so it is not re-escaped. */
  function fmt(text) { return fmtCore(text, false); }
  function fmtTrusted(text) { return fmtCore(text, true); }

  function fmtCore(text, trusted) {
    var h = trusted ? String(text == null ? '' : text) : esc(text);
    h = h.replace(/\[([^\]]+)\]\((#[^\s)]+|\/[^\s)]*|https?:\/\/[^\s)]+)\)/g, function (_, label, url) {
      return anchor(label, url);
    });
    h = h.replace(/(^|\s)(https?:\/\/[^\s<]+)/g, function (_, pre, url) {
      return pre + anchor(url, url);
    });
    h = h.replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>');
    h = h.replace(/\n/g, '<br>');
    return h;
  }

  function anchor(label, url) {
    var ext = /^https?:\/\//i.test(url);
    return '<a class="ifx-link" href="' + esc(url) + '"' +
      (ext ? ' target="_blank" rel="noopener"' : '') + '>' + esc(label) + '</a>';
  }

  /* ------------------------------------------------------------ quick answers */
  /* Same facts as the AI knowledge base. Used offline, or as an instant fallback. */

  var ESTIMATOR = 'https://ifix-itservices.co.za/#webservices-tools';
  var TERMS = 'https://ifix-itservices.co.za/#terms';
  var PORTFOLIO = 'https://ifix-itservices.co.za/portfolio/';

  function say(html) { return html; }

  var INTENTS = [
    {
      id: 'greet',
      keys: ['hi', 'hello', 'hey', 'good morning', 'good afternoon', 'good evening', 'howzit', 'salaam', 'assalam', 'greetings'],
      answer: function () {
        return say('Hello! I\u2019m <strong>Fixi</strong>, the IFIX site assistant. I can walk you through what we build, pricing, hosting, our terms — or point you to the right page. What would you like to know?');
      },
      chips: ['What do you build?', 'Website pricing', 'See the work', 'Talk to a human']
    },
    {
      id: 'services',
      keys: ['what do you do', 'what do you build', 'services', 'offer', 'what can you make', 'what do you offer', 'help me with', 'web app', 'web apps'],
      answer: function () {
        return say('We build four things, all from scratch — no templates:<br>' +
          '• <strong>Custom websites, booking &amp; ordering systems</strong> — from R6,500<br>' +
          '• <strong>Celebration sites</strong> (birthdays, weddings, Nikah, memorials) — R450–R2,400<br>' +
          '• <strong>Creator Portals</strong> for brand collabs — R2,500 / R4,000<br>' +
          '• <strong>Corporate client gifting</strong> — quoted per volume<br><br>' +
          'See live examples: ' + '[Open the portfolio](' + PORTFOLIO + ')');
      },
      chips: ['Website pricing', 'Celebration site prices', 'Creator Portal', 'How does it work?']
    },
    {
      id: 'website-price',
      keys: ['website price', 'how much is a website', 'how much for a website', 'price', 'pricing', 'cost', 'quote', 'estimate', 'estimator', 'budget', 'how much does a site cost'],
      answer: function () {
        return say('Websites start at <strong>R6,500</strong> for the standard setup (custom homepage, core framework, mobile-responsive). Add-ons:' +
          '<br>• Extra pages — R750 each' +
          '<br>• E-commerce — R3,500' +
          '<br>• Media &amp; content placement — R950' +
          '<br>• Advanced SEO — R1,800' +
          '<br>• Domain &amp; hosting setup — R1,200' +
          '<br><br>Build your own live quote with our estimator: ' + '[Open the build estimator](' + ESTIMATOR + '). A 50% deposit starts the build.');
      },
      chips: ['Hosting & monthly fee', 'Deposit & payment terms', 'Show me live examples']
    },
    {
      id: 'booking',
      keys: ['booking', 'appointment', 'book a slot', 'booking system', 'ordering system', 'online shop', 'ecommerce', 'e-commerce', 'store', 'checkout', 'card payment', 'yoco', 'admin panel'],
      answer: function () {
        return say('Yes — booking and ordering systems are our core work. Clients browse, pick a service or products, a date and time, and pay securely; the order lands with you ready to action, instead of living in your DMs.' +
          '<br><br>See live builds: ' + '[Hobby Corner, a shop with Yoco checkout](https://hobbycorner.co.za/) and ' + '[The Sambo House barbershop](https://www.sambohouse.co.za/)' + '. Systems start from R6,500, plus R3,500 if you want card checkout wired in.');
      },
      chips: ['Website pricing', 'How long does it take?', 'Talk to a human']
    },
    {
      id: 'celebration',
      keys: ['celebration', 'birthday', 'wedding', 'anniversary', 'nikah', 'walima', 'umrah', 'hajj', 'memorial', 'tribute', 'baby', 'aqiqah', 'matric', 'eid', 'ramadan', 'proposal', 'engagement', 'retirement', 'occasion', 'card', 'keepsake'],
      answer: function () {
        return say('Celebration sites are made for one person, one occasion:' +
          '<br>• <strong>The Card</strong> — R450 (one scrolling page, live within 48 hours)' +
          '<br>• <strong>The Experience</strong> — R950 (five chapters, interactive)' +
          '<br>• <strong>Occasions</strong> — R1,800 (weddings, anniversaries, memorials)' +
          '<br>• <strong>Nikah &amp; Walima</strong> — from R2,400' +
          '<br>• <strong>Umrah &amp; Hajj</strong> — from R1,200' +
          '<br>• <strong>Memorial &amp; Tribute</strong> — from R1,500' +
          '<br><br>Have a look: ' + '[Open the demos](' + PORTFOLIO + '#work)');
      },
      chips: ['See celebration demos', 'Talk to a human', 'How does it work?']
    },
    {
      id: 'creator',
      keys: ['creator', 'portal', 'influencer', 'brand deal', 'media kit', 'creator portal', 'collab'],
      answer: function () {
        return say('A <strong>Creator Portal</strong> is a one-page site built around you, so brands send a structured brief instead of emailing your bio. It\u2019s <strong>R2,500</strong>, hosting included, with no monthly fee. ' +
          '<strong>Creator Portal Pro</strong> is <strong>R4,000</strong> and adds a custom theme, separate enquiry types, a rate card download, minimum budget, availability dates and a custom domain.' +
          '<br><br>' + '[Try the concept demo](' + PORTFOLIO + 'work/creator-portal-demo/index.html)');
      },
      chips: ['See the demo', 'Talk to a human', 'What do you build?']
    },
    {
      id: 'hosting',
      keys: ['hosting', 'monthly', 'maintenance', 'subscription', 'r550', 'r1,100', 'base tier', 'active tier', 'per month', 'monthly fee', 'cancel'],
      answer: function () {
        return say('Web &amp; booking sites carry <strong>R550/month</strong> (Base Tier) — hosting management, SSL security and keeping the site online. In months where you ask for changes, content or layout updates, it\u2019s <strong>R1,100/month</strong> (Active Tier), up to an agreed hour limit.' +
          '<br><br>You can cancel anytime with 30 days\u2019 notice and we hand over a full export. Creator Portals are once-off with hosting included — no monthly fee. Full detail: ' + '[Terms, section 02](' + TERMS + ')');
      },
      chips: ['Deposit & payment terms', 'Revisions & ownership', 'Talk to a human']
    },
    {
      id: 'deposit',
      keys: ['deposit', 'payment', 'pay', 'eft', 'invoice', 'refund', '50%', 'terms', 'balance', 'when do i pay'],
      answer: function () {
        return say('A <strong>50% deposit</strong> is required before any build starts, and it\u2019s non-refundable once development has begun (it covers reserved project time). The balance is due on completion — after you approve the private preview and before the site goes live. Payment is by EFT, and quotes are valid for 30 days.' +
          '<br><br>Full wording: ' + '[Terms, section 01](' + TERMS + ')');
      },
      chips: ['Hosting & monthly fee', 'Revisions & ownership', 'Read the full terms']
    },
    {
      id: 'revisions',
      keys: ['revision', 'changes', 'change request', 'edit after', 'after launch', 'ownership', 'own the site', 'export', 'locked in', 'my files'],
      answer: function () {
        return say('Every build includes <strong>one round of revisions</strong> on your private preview link before going live. Further changes, or changes after launch, fall under the monthly maintenance tiers (R1,100 in active months).' +
          '<br><br>On full payment the site, design and code are <strong>yours</strong>. If you ever move elsewhere we provide a full export at no charge — you\u2019re never locked in. See ' + '[Terms, sections 02–03](' + TERMS + ')');
      },
      chips: ['Deposit & payment terms', 'Warranty & support', 'Talk to a human']
    },
    {
      id: 'warranty',
      keys: ['warranty', 'support', 'bug', 'broken', 'backup', 'uptime', 'after launch', 'guarantee'],
      answer: function () {
        return say('We give a <strong>30-day warranty</strong> on the build — any fault or broken function caused by our work is fixed free within that period. Sites on an active monthly plan are monitored, backed up and kept updated.' +
          '<br><br>The warranty doesn\u2019t cover changes made by you or a third party after handover, or failures in external services. See ' + '[Terms, section 04](' + TERMS + ')');
      },
      chips: ['Hosting & monthly fee', 'Talk to a human']
    },
    {
      id: 'process',
      keys: ['how does it work', 'process', 'steps', 'start', 'get started', 'begin', 'how do we start', 'brief', 'preview'],
      answer: function () {
        return say('Four steps:' +
          '<br><strong>1.</strong> Build your own quote in the estimator and send it via WhatsApp or email with the reference code.' +
          '<br><strong>2.</strong> We confirm the scope and send a formal invoice; a 50% deposit starts the build.' +
          '<br><strong>3.</strong> You get a private preview link and can request changes.' +
          '<br><strong>4.</strong> Once approved and settled, it goes live — and we host, secure and maintain it.' +
          '<br><br>' + '[Start with the estimator](' + ESTIMATOR + ')');
      },
      chips: ['Website pricing', 'Talk to a human', 'See the work']
    },
    {
      id: 'time',
      keys: ['how long', 'turnaround', 'deadline', 'how soon', 'lead time', '48 hours', 'timeline', 'when will it be ready'],
      answer: function () {
        return say('A <strong>celebration Card</strong> can have a live link within <strong>48 hours</strong>. Larger builds — websites, booking systems, Creator Portals — depend on the scope, and we confirm a timeline with your quote. You also get a private preview link before anything goes live.');
      },
      chips: ['Website pricing', 'How does it work?', 'Talk to a human']
    },
    {
      id: 'contact',
      keys: ['contact', 'whatsapp', 'email', 'phone', 'number', 'reach you', 'speak', 'call', 'hours', 'open', 'human', 'agent', 'person'],
      answer: function () {
        return say('The fastest way is <strong>WhatsApp: +27 67 736 8173</strong> — or email <strong>info@ifix-itservices.co.za</strong>. We reply Monday to Friday, 09:00–16:00, and anything sent after hours gets answered first thing. ' +
          '[Message us on WhatsApp](' + WA_LINK + ')');
      },
      chips: ['Talk to a human', 'Website pricing', 'How does it work?']
    },
    {
      id: 'about',
      keys: ['who are you', 'about', 'tasleem', 'founder', 'company', 'where are you', 'based', 'located', 'cape town', 'b-bbee', 'bbbee', 'cipc', 'sars', 'registered', 'legit', 'trust'],
      answer: function () {
        return say('IFIX — I.T Services (Pty) Ltd is a studio founded and led by <strong>Tasleem</strong>, based in Cape Town and working remotely nationwide. We\u2019re CIPC-registered (2026 / 473706 / 07), <strong>B-BBEE Level 1 EME</strong> with a sworn affidavit available on request, and SARS tax compliant. Everything is built from scratch — no templates. ' + '[More about the studio](https://ifix-itservices.co.za/)');
      },
      chips: ['What do you build?', 'See the work', 'Talk to a human']
    },
    {
      id: 'work',
      keys: ['portfolio', 'examples', 'show me', 'see the work', 'your work', 'projects', 'demos', 'sambo', 'hobby corner', 'miss j', 'waheed', 'golden hour', 'emerald', 'studio naledi'],
      answer: function () {
        return say('Have a click around — these are real, live builds:' +
          '<br>• ' + '[Hobby Corner](https://hobbycorner.co.za/) — shop with card checkout' +
          '<br>• ' + '[The Sambo House](https://www.sambohouse.co.za/) — barbershop bookings' +
          '<br>• ' + '[Nailed by Miss J](https://jesslyn-vert.vercel.app/) — nail studio bookings' +
          '<br>• Celebration demos &amp; Creator Portal: ' + '[portfolio](' + PORTFOLIO + '#work)');
      },
      chips: ['Website pricing', 'Celebration site prices', 'Talk to a human']
    },
    {
      id: 'privacy',
      keys: ['popia', 'privacy', 'personal information', 'data', 'gdpr', 'information officer', 'consent'],
      answer: function () {
        return say('Under POPIA, IFIX is the responsible party for the details you send us (name, contact, project info, media, billing). We use it only to quote, build, host and maintain your site, never sell it, and keep it only as long as needed or as the law requires. Where a site we build collects your customers\u2019 data, you\u2019re the responsible party and we act as your operator. Rights requests: info@ifix-itservices.co.za. ' + '[Terms, section 06](' + TERMS + ')');
      },
      chips: ['Talk to a human', 'Read the full terms']
    },
    {
      id: 'terms',
      keys: ['terms', 'conditions', 't&c', 'contract', 'policy'],
      answer: function () {
        return say('Our full Terms &amp; Conditions cover deposits and payment (01), development and monthly maintenance (02), ownership, content and revisions (03), support and warranty (04), governance (05), POPIA (06) and contact (07). ' + '[Read the full terms](' + TERMS + ')');
      },
      chips: ['Deposit & payment terms', 'Hosting & monthly fee', 'Privacy & POPIA']
    },
    {
      id: 'thanks',
      keys: ['thanks', 'thank you', 'great', 'awesome', 'perfect', 'cool', 'okay', 'ok'],
      answer: function () {
        return say('A pleasure. If you\u2019re ready, the free estimator gives you a quote in a minute — or message us on WhatsApp and we\u2019ll take it from there. ' + '[Open the estimator](' + ESTIMATOR + ')');
      },
      chips: ['Website pricing', 'Talk to a human']
    }
  ];

  var DEFAULT_CHIPS = ['Website pricing', 'What do you build?', 'Hosting & monthly fee', 'See the work', 'Talk to a human'];

  function normalise(s) {
    return ' ' + String(s).toLowerCase().replace(/[^a-z0-9]+/g, ' ').replace(/\s+/g, ' ').trim() + ' ';
  }

  function matchIntent(text) {
    var n = normalise(text), best = null, bestScore = 0;
    for (var i = 0; i < INTENTS.length; i++) {
      var it = INTENTS[i], score = 0;
      for (var j = 0; j < it.keys.length; j++) {
        var key = normalise(it.keys[j]);
        if (n.indexOf(key) !== -1) score += key.length > 8 ? 3 : 1.5;
      }
      if (score > bestScore) { bestScore = score; best = it; }
    }
    return bestScore > 0 ? best : null;
  }

  function quickAnswer(text) {
    var it = matchIntent(text);
    if (it) return { html: it.answer(), chips: it.chips };
    return null;
  }

  function fallbackAnswer() {
    return {
      html: 'I can help with our services, pricing, hosting, the build process, our terms and POPIA, and I can point you to any page on the site. For anything specific to your project, WhatsApp is fastest: ' +
        '[' + 'Message +27 67 736 8173](' + WA_LINK + ')',
      chips: DEFAULT_CHIPS
    };
  }

  /* ---------------------------------------------------------------- styles */

  var css = [
    '.ifxbot{--ifx-accent:' + CFG.accent + ';--ifx-bg:#0A0A0C;--ifx-panel:#0C0C0E;--ifx-elev:#16161A;--ifx-line:rgba(255,255,255,.10);--ifx-line-soft:rgba(255,255,255,.06);--ifx-text:#F2F3F5;--ifx-muted:#8E8E93;--ifx-faint:#5A5A60;--ifx-ease:cubic-bezier(.16,1,.3,1);font-family:"Inter",system-ui,-apple-system,"Segoe UI",sans-serif;position:fixed;z-index:2147483000;' + (CFG.position === 'left' ? 'left:20px;' : 'right:20px;') + 'bottom:20px;display:block}',
    '.ifxbot *,.ifxbot *::before,.ifxbot *::after{box-sizing:border-box}',
    '.ifxbot button{font-family:inherit;cursor:pointer}',

    /* FAB */
    '.ifx-fab{position:relative;width:' + CFG.launcherSize + 'px;height:' + CFG.launcherSize + 'px;border-radius:50%;background:radial-gradient(circle at 30% 24%,#1a1c20,#0e0f11 70%);border:1px solid rgba(255,255,255,.16);display:flex;align-items:center;justify-content:center;box-shadow:0 10px 26px rgba(0,0,0,.5),0 0 0 4px rgba(61,220,132,.06);transition:transform .3s var(--ifx-ease),border-color .2s,box-shadow .3s;animation:ifx-fab-in .5s var(--ifx-ease) both}',
    '.ifxbot.ifx-hasnews .ifx-fab .ifx-badge{display:block;animation:ifx-pulse 2s infinite}',
    '.ifx-fab:hover{transform:translateY(-2px);border-color:rgba(61,220,132,.55);box-shadow:0 14px 30px rgba(0,0,0,.55),0 0 0 5px rgba(61,220,132,.10)}',
    '.ifx-fab:active{transform:translateY(0) scale(.96)}',
    '.ifxbot:not(.ifx-open) .ifx-fab::before{content:"";position:absolute;inset:-5px;border-radius:50%;border:1px solid rgba(61,220,132,.32);animation:ifx-halo 3.4s ease-out infinite;pointer-events:none}',
    '.ifxbot.ifx-open .ifx-fab::before{display:none}',
    '.ifx-fig-wrap{width:78%;height:78%;display:flex;align-items:center;justify-content:center}',
    '.ifx-fig{width:100%;height:100%;display:block;overflow:visible}',
    '.ifx-fig-float{animation:ifx-fig-float 3.6s ease-in-out infinite;transform-origin:50% 60%}',
    '.ifx-antenna{animation:ifx-blink-led 2.6s ease-in-out infinite}',
    '.ifx-eye{animation:ifx-blink 4.6s infinite;transform-box:fill-box;transform-origin:center}',
    '.ifxbot.ifx-open .ifx-fig-float,.ifxbot.ifx-open .ifx-antenna,.ifxbot.ifx-open .ifx-eye{animation-play-state:paused}',
    '.ifx-fab .ifx-fab-x{display:none;width:24px;height:24px}',
    '.ifx-fab .ifx-fab-x svg{width:24px;height:24px;display:block}',
    '.ifx-fab .ifx-fig-wrap{display:flex}',
    '.ifxbot.ifx-open .ifx-fab{background:var(--ifx-accent);border-color:var(--ifx-accent);box-shadow:0 10px 26px rgba(0,0,0,.5),0 0 0 5px rgba(61,220,132,.14)}',
    '.ifxbot.ifx-open .ifx-fab .ifx-fig-wrap{display:none}',
    '.ifxbot.ifx-open .ifx-fab .ifx-fab-x{display:block}',
    '.ifx-avatar .ifx-fig{width:132%;height:132%;margin-top:-2%}',
    '.ifx-avatar{overflow:hidden}',

    /* Teaser */
    '.ifx-teaser{position:absolute;bottom:calc(' + (CFG.launcherSize + 14) + 'px);' + (CFG.position === 'left' ? 'left:0;' : 'right:0;') + 'width:262px;background:var(--ifx-elev);border:1px solid var(--ifx-line);border-radius:14px;padding:12px 34px 12px 14px;font-size:13px;line-height:1.5;color:var(--ifx-text);box-shadow:0 18px 44px rgba(0,0,0,.5);opacity:0;transform:translateY(8px);pointer-events:none;transition:opacity .3s var(--ifx-ease),transform .3s var(--ifx-ease)}',
    '.ifx-teaser.ifx-show{opacity:1;transform:none;pointer-events:auto;cursor:pointer}',
    '.ifx-teaser .ifx-teaser-x{position:absolute;top:6px;right:6px;width:22px;height:22px;border:0;background:transparent;color:var(--ifx-faint);font-size:14px;line-height:1;border-radius:6px}',
    '.ifx-teaser .ifx-teaser-x:hover{color:#fff;background:rgba(255,255,255,.06)}',

    /* Panel */
    '.ifx-panel{position:absolute;bottom:calc(' + (CFG.launcherSize + 18) + 'px);' + (CFG.position === 'left' ? 'left:0;' : 'right:0;') + 'width:384px;max-width:calc(100vw - 32px);height:min(600px,calc(100vh - 130px));background:var(--ifx-panel);border:1px solid var(--ifx-line);border-radius:18px;overflow:hidden;display:flex;flex-direction:column;box-shadow:0 40px 90px rgba(0,0,0,.65),0 0 0 1px rgba(0,0,0,.4);opacity:0;transform:translateY(14px) scale(.98);pointer-events:none;transition:opacity .32s var(--ifx-ease),transform .32s var(--ifx-ease);transform-origin:bottom ' + (CFG.position === 'left' ? 'left' : 'right') + '}',
    '.ifxbot.ifx-open .ifx-panel{opacity:1;transform:none;pointer-events:auto}',

    /* Header */
    '.ifx-head{display:flex;align-items:center;gap:10px;padding:12px 12px 12px 14px;background:#121214;border-bottom:1px solid var(--ifx-line-soft);flex:0 0 auto}',
    '.ifx-avatar{width:36px;height:36px;border-radius:50%;background:radial-gradient(circle at 30% 25%,#3DDC84,#0f7a45 70%);display:flex;align-items:center;justify-content:center;flex:0 0 auto;box-shadow:0 0 0 3px rgba(61,220,132,.12)}',
    '.ifx-avatar svg{width:19px;height:19px}',
    '.ifx-meta{display:flex;flex-direction:column;gap:2px;min-width:0;flex:1}',
    '.ifx-meta strong{font-family:"Space Grotesk",var(--ifx-display,system-ui),sans-serif;font-size:14.5px;font-weight:600;color:#fff;letter-spacing:.01em;line-height:1.1}',
    '.ifx-meta span{font-family:"IBM Plex Mono",ui-monospace,monospace;font-size:10px;letter-spacing:.08em;text-transform:uppercase;color:var(--ifx-muted);display:flex;align-items:center;gap:5px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}',
    '.ifx-dot{width:6px;height:6px;border-radius:50%;background:var(--ifx-accent);box-shadow:0 0 0 3px rgba(61,220,132,.15)}',
    '.ifx-hbtn{height:30px;padding:0 11px;border-radius:8px;border:1px solid var(--ifx-line);background:transparent;color:var(--ifx-muted);font-size:11px;font-family:"IBM Plex Mono",ui-monospace,monospace;letter-spacing:.04em;transition:color .15s,border-color .15s,background .15s;white-space:nowrap;text-decoration:none;display:inline-flex;align-items:center;gap:6px}',
    '.ifx-hbtn:hover{color:#fff;border-color:rgba(255,255,255,.22);background:rgba(255,255,255,.04)}',
    '.ifx-hbtn.ifx-wa{color:var(--ifx-accent);border-color:rgba(61,220,132,.3)}',
    '.ifx-hbtn.ifx-wa:hover{background:rgba(61,220,132,.08);color:var(--ifx-accent)}',
    '.ifx-xbtn{width:30px;height:30px;border-radius:8px;border:1px solid transparent;background:transparent;color:var(--ifx-faint);display:flex;align-items:center;justify-content:center;font-size:15px;transition:color .15s,background .15s}',
    '.ifx-xbtn:hover{color:#fff;background:rgba(255,255,255,.06)}',

    /* Log */
    '.ifx-log{flex:1;overflow-y:auto;padding:16px 14px 8px;display:flex;flex-direction:column;gap:10px;scrollbar-width:thin;scrollbar-color:rgba(255,255,255,.14) transparent;overflow-anchor:none}',
    '.ifx-log::-webkit-scrollbar{width:5px}',
    '.ifx-log::-webkit-scrollbar-thumb{background:rgba(255,255,255,.14);border-radius:4px}',
    '.ifx-msg{max-width:86%;font-size:13.5px;line-height:1.6;padding:10px 13px;border-radius:14px;word-break:break-word;animation:ifx-in .28s var(--ifx-ease) both}',
    '.ifx-msg.ifx-bot{align-self:flex-start;background:var(--ifx-elev);border:1px solid var(--ifx-line-soft);color:#E8ECF4;border-top-left-radius:5px}',
    '.ifx-msg.ifx-user{align-self:flex-end;background:var(--ifx-accent);color:#06170D;border-top-right-radius:5px;font-weight:500}',
    '.ifx-msg strong{font-weight:600;color:#fff}',
    '.ifx-msg.ifx-user strong{color:#06170D}',
    '.ifx-link{color:var(--ifx-accent);text-decoration:underline;text-underline-offset:2px;text-decoration-thickness:1px;font-weight:500}',
    '.ifx-link:hover{text-decoration-thickness:2px}',
    '.ifx-msg.ifx-user .ifx-link{color:#06170D}',
    '.ifx-sys{align-self:center;font-family:"IBM Plex Mono",ui-monospace,monospace;font-size:10px;letter-spacing:.06em;text-transform:uppercase;color:var(--ifx-faint);padding:2px 0}',

    /* typing */
    '.ifx-typing{align-self:flex-start;background:var(--ifx-elev);border:1px solid var(--ifx-line-soft);border-radius:14px;border-top-left-radius:5px;padding:13px 15px;display:flex;gap:5px;animation:ifx-in .2s var(--ifx-ease) both}',
    '.ifx-typing i{width:6px;height:6px;border-radius:50%;background:var(--ifx-muted);animation:ifx-bounce 1.2s infinite}',
    '.ifx-typing i:nth-child(2){animation-delay:.15s}',
    '.ifx-typing i:nth-child(3){animation-delay:.3s}',

    /* chips */
    '.ifx-chips{flex:0 0 auto;display:flex;gap:7px;padding:8px 14px 10px;overflow-x:auto;scrollbar-width:none;-ms-overflow-style:none}',
    '.ifx-chips::-webkit-scrollbar{display:none}',
    '.ifx-chip{flex:0 0 auto;padding:6px 11px;border-radius:999px;border:1px solid var(--ifx-line);background:transparent;color:var(--ifx-muted);font-size:11.5px;font-family:"IBM Plex Mono",ui-monospace,monospace;letter-spacing:.02em;transition:all .15s;white-space:nowrap}',
    '.ifx-chip:hover{color:#06170D;background:var(--ifx-accent);border-color:var(--ifx-accent)}',

    /* composer */
    '.ifx-form{flex:0 0 auto;display:flex;align-items:center;gap:8px;padding:10px 12px 8px;border-top:1px solid var(--ifx-line-soft);background:#0B0B0D}',
    '.ifx-input{flex:1;min-width:0;height:42px;padding:0 13px;border-radius:11px;border:1px solid var(--ifx-line);background:#121214;color:#fff;font-size:13.5px;font-family:inherit;outline:none;transition:border-color .15s,box-shadow .15s}',
    '.ifx-input::placeholder{color:var(--ifx-faint)}',
    '.ifx-input:focus{border-color:rgba(61,220,132,.55);box-shadow:0 0 0 3px rgba(61,220,132,.12)}',
    '.ifx-send{width:42px;height:42px;border-radius:11px;border:0;background:var(--ifx-accent);color:#06170D;display:flex;align-items:center;justify-content:center;transition:transform .15s,filter .15s;flex:0 0 auto}',
    '.ifx-send:hover{filter:brightness(1.08);transform:translateY(-1px)}',
    '.ifx-send:disabled{opacity:.45;cursor:default;transform:none}',
    '.ifx-send svg{width:18px;height:18px}',
    '.ifx-foot{flex:0 0 auto;text-align:center;font-size:9.5px;font-family:"IBM Plex Mono",ui-monospace,monospace;letter-spacing:.05em;color:var(--ifx-faint);padding:0 12px 9px;background:#0B0B0D;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}',
    '.ifx-foot a{color:var(--ifx-faint);text-decoration:underline;text-underline-offset:2px}',

    /* focus + motion */
    '.ifxbot button:focus-visible,.ifxbot a:focus-visible,.ifxbot input:focus-visible{outline:2px solid var(--ifx-accent);outline-offset:2px}',
    '@keyframes ifx-in{from{opacity:0;transform:translateY(6px)}to{opacity:1;transform:none}}',
    '@keyframes ifx-bounce{0%,60%,100%{transform:translateY(0);opacity:.5}30%{transform:translateY(-4px);opacity:1}}',
    '@keyframes ifx-fig-float{0%,100%{transform:translateY(0)}50%{transform:translateY(-1.4px)}}',
    '@keyframes ifx-blink{0%,92%,100%{transform:scaleY(1)}95%{transform:scaleY(.12)}}',
    '@keyframes ifx-blink-led{0%,100%{opacity:1}50%{opacity:.35}}',
    '@keyframes ifx-halo{0%{transform:scale(.92);opacity:0}35%{opacity:.9}100%{transform:scale(1.22);opacity:0}}',
    '@keyframes ifx-fab-in{from{opacity:0;transform:translateY(10px) scale(.9)}to{opacity:1;transform:none}}',
    '@keyframes ifx-pulse{0%{box-shadow:0 0 0 0 rgba(61,220,132,.5)}70%{box-shadow:0 0 0 8px rgba(61,220,132,0)}100%{box-shadow:0 0 0 0 rgba(61,220,132,0)}}',
    '@media (max-width:420px){.ifx-hbtn{padding:0 8px;font-size:10px}.ifx-meta strong{font-size:13.5px}.ifx-meta span{font-size:9px;letter-spacing:.05em}.ifx-msg{font-size:13px}}',
    '@media (max-width:520px){.ifxbot{' + (CFG.position === 'left' ? 'left:12px;' : 'right:12px;') + 'bottom:12px}.ifx-panel{position:fixed;left:12px;right:12px;bottom:84px;width:auto;height:calc(100vh - 110px);max-height:none;border-radius:16px}.ifx-teaser{position:fixed;bottom:calc(' + (CFG.launcherSize + 26) + 'px);' + (CFG.position === 'left' ? 'left:12px;' : 'right:12px;') + '}}',
    '@media (prefers-reduced-motion:reduce){.ifxbot *,.ifxbot *::before,.ifxbot *::after{animation-duration:.001s!important;transition-duration:.001s!important}}'
  ].join('\n');

  var style = document.createElement('style');
  style.id = 'ifix-bot-style';
  style.textContent = css;
  document.head.appendChild(style);

  /* ---------------------------------------------------------------- markup */

  /* ---- the character ----------------------------------------------------
     Two hand-drawn inline SVG mascots. No image files, no network requests,
     crisp at 40px. Both blink; the antenna and float are pure CSS. */

  var ROBOT_SVG =
    '<svg class="ifx-fig" viewBox="0 0 48 48" fill="none" aria-hidden="true">' +
      '<g class="ifx-fig-float">' +
        /* antenna */
        '<path d="M24 10.4V7.2" stroke="#C9CFD8" stroke-width="1.5" stroke-linecap="round"/>' +
        '<circle class="ifx-antenna" cx="24" cy="5.8" r="2" fill="#3DDC84"/>' +
        /* head */
        '<rect x="12.4" y="9.6" width="23.2" height="17.6" rx="8" fill="#EDF1F5"/>' +
        '<rect x="12.4" y="9.6" width="23.2" height="7.2" rx="8" fill="#F8FAFC" opacity=".7"/>' +
        /* ears */
        '<rect x="9.9" y="15.6" width="2.3" height="5.8" rx="1.15" fill="#C3CAD4"/>' +
        '<rect x="35.8" y="15.6" width="2.3" height="5.8" rx="1.15" fill="#C3CAD4"/>' +
        /* visor + eyes */
        '<rect x="15.6" y="13.8" width="16.8" height="9.2" rx="4.6" fill="#0B0B0D"/>' +
        '<circle class="ifx-eye ifx-eye-l" cx="20.2" cy="18.4" r="2.2" fill="#3DDC84"/>' +
        '<circle class="ifx-eye ifx-eye-r" cx="27.8" cy="18.4" r="2.2" fill="#3DDC84"/>' +
        '<path d="M22.4 21.2h3.2" stroke="#3DDC84" stroke-opacity=".45" stroke-width="1.2" stroke-linecap="round"/>' +
        /* neck */
        '<rect x="21.9" y="26.6" width="4.2" height="3.6" rx="1.6" fill="#B9C1CB"/>' +
        /* arms reaching forward to the laptop */
        '<rect x="11.6" y="30.2" width="3.6" height="10.2" rx="1.8" fill="#C3CAD4" transform="rotate(7 13.4 35.3)"/>' +
        '<rect x="32.8" y="30.2" width="3.6" height="10.2" rx="1.8" fill="#C3CAD4" transform="rotate(-7 34.6 35.3)"/>' +
        /* laptop lid */
        '<rect x="13.6" y="30.2" width="20.8" height="11.8" rx="2.4" fill="#2A3038"/>' +
        '<rect x="15.3" y="31.9" width="17.4" height="8.4" rx="1.3" fill="#0B0B0D"/>' +
        /* little green lines on the screen — reads as "open on the site" */
        '<path d="M17.6 34.4h6.2M17.6 36.4h9.4M17.6 38.4h4.4" stroke="#3DDC84" stroke-width="1" stroke-linecap="round" opacity=".95"/>' +
        /* keyboard base */
        '<path d="M11.4 42.2h25.2l-1.6 3.3a1.9 1.9 0 01-1.7 1.1H14.7a1.9 1.9 0 01-1.7-1.1l-1.6-3.3z" fill="#C3CAD4"/>' +
        /* hands on the edges of the lid */
        '<rect x="12.3" y="38.4" width="3.1" height="4.6" rx="1.55" fill="#DCE2E9"/>' +
        '<rect x="32.6" y="38.4" width="3.1" height="4.6" rx="1.55" fill="#DCE2E9"/>' +
      '</g>' +
    '</svg>';

  var PERSON_SVG =
    '<svg class="ifx-fig" viewBox="0 0 48 48" fill="none" aria-hidden="true">' +
      '<g class="ifx-fig-float">' +
        '<path d="M9.4 43.2v-1.1c0-5.5 6.5-8.9 14.6-8.9s14.6 3.4 14.6 8.9v1.1z" fill="#2FC873"/>' +
        '<path d="M17.4 35.6c1.6 2 4 3.1 6.6 3.1s5-1.1 6.6-3.1" stroke="#0B0B0D" stroke-opacity=".14" stroke-width="1.4" stroke-linecap="round"/>' +
        '<rect x="21.3" y="28.4" width="5.4" height="4.2" rx="2.1" fill="#E3C09D"/>' +
        '<circle cx="24" cy="19.6" r="10.3" fill="#F0CFAE"/>' +
        '<path d="M13.7 19.3c-.7-6.5 4.1-10.5 10.3-10.5s11 4 10.3 10.5c-.7-3.3-2.5-4.7-4.1-5-2.6-.5-4.6.5-6.2.5-2.6 0-4-1.2-6.2-.5-1.6.3-3.4 1.7-4.1 5z" fill="#16161A"/>' +
        '<ellipse class="ifx-eye ifx-eye-l" cx="20.7" cy="20.3" rx="1.3" ry="1.7" fill="#0B0B0D"/>' +
        '<ellipse class="ifx-eye ifx-eye-r" cx="27.3" cy="20.3" rx="1.3" ry="1.7" fill="#0B0B0D"/>' +
        '<path d="M21.2 24.5c.8 1.2 1.8 1.8 2.8 1.8s2-.6 2.8-1.8" stroke="#0B0B0D" stroke-width="1.3" stroke-linecap="round"/>' +
        '<circle cx="17.8" cy="23.3" r="1.4" fill="#F2A18F" opacity=".4"/>' +
        '<circle cx="30.2" cy="23.3" r="1.4" fill="#F2A18F" opacity=".4"/>' +
      '</g>' +
    '</svg>';

  /* head-only robot: reads clearly at the 36 px header avatar size */
  var ROBOT_HEAD_SVG =
    '<svg class="ifx-fig" viewBox="0 0 48 48" fill="none" aria-hidden="true">' +
      '<path d="M24 12.4V8.4" stroke="#C9CFD8" stroke-width="1.6" stroke-linecap="round"/>' +
      '<circle class="ifx-antenna" cx="24" cy="6.6" r="2.4" fill="#3DDC84"/>' +
      '<rect x="9.4" y="12.6" width="29.2" height="24" rx="10.6" fill="#EDF1F5"/>' +
      '<rect x="9.4" y="12.6" width="29.2" height="9.6" rx="10.6" fill="#F8FAFC" opacity=".7"/>' +
      '<rect x="6.4" y="20" width="2.6" height="7.4" rx="1.3" fill="#C3CAD4"/>' +
      '<rect x="39" y="20" width="2.6" height="7.4" rx="1.3" fill="#C3CAD4"/>' +
      '<rect x="13.4" y="18.2" width="21.2" height="12" rx="6" fill="#0B0B0D"/>' +
      '<circle class="ifx-eye ifx-eye-l" cx="19.4" cy="24.2" r="2.8" fill="#3DDC84"/>' +
      '<circle class="ifx-eye ifx-eye-r" cx="28.6" cy="24.2" r="2.8" fill="#3DDC84"/>' +
      '<path d="M21.8 27.6h4.4" stroke="#3DDC84" stroke-opacity=".45" stroke-width="1.4" stroke-linecap="round"/>' +
    '</svg>';

  function figureSVG(style) { return (style === 'person') ? PERSON_SVG : ROBOT_SVG; }
  function avatarSVG(style) { return (style === 'person') ? PERSON_SVG : ROBOT_HEAD_SVG; }

  var ICON_CLOSE = '<svg viewBox="0 0 24 24" fill="none" aria-hidden="true"><path d="M6 6l12 12M18 6L6 18" stroke="#0B0B0D" stroke-width="2.2" stroke-linecap="round"/></svg>';

  var ICON_SEND = '<svg viewBox="0 0 24 24" fill="none" aria-hidden="true"><path d="M12 19V5M5.5 11.5L12 5l6.5 6.5" stroke="currentColor" stroke-width="2.1" stroke-linecap="round" stroke-linejoin="round"/></svg>';

  var root = document.createElement('div');
  root.className = 'ifxbot';
  root.innerHTML =
    '<div class="ifx-teaser" id="ifx-teaser" role="button" tabindex="0" aria-label="Open chat">' +
      '<button class="ifx-teaser-x" type="button" aria-label="Dismiss">✕</button>' +
      '<div class="ifx-teaser-txt"></div>' +
    '</div>' +
    '<section class="ifx-panel" role="dialog" aria-label="IFIX assistant chat" aria-modal="false">' +
      '<header class="ifx-head">' +
        '<div class="ifx-avatar">' + avatarSVG(CFG.avatarStyle) + '</div>' +
        '<div class="ifx-meta"><strong>' + esc(CFG.botName) + '</strong><span><i class="ifx-dot"></i>' + esc(CFG.subtitle) + ' · Online</span></div>' +
        '<a class="ifx-hbtn ifx-wa" href="' + WA_LINK + '" target="_blank" rel="noopener">WhatsApp</a>' +
        '<button class="ifx-xbtn" type="button" aria-label="Close chat">✕</button>' +
      '</header>' +
      '<div class="ifx-log" role="log" aria-live="polite" aria-relevant="additions"></div>' +
      '<div class="ifx-chips" aria-label="Suggested questions"></div>' +
      '<form class="ifx-form" autocomplete="off">' +
        '<input class="ifx-input" type="text" maxlength="' + CFG.maxInput + '" placeholder="Ask about pricing, hosting, terms…" aria-label="Your message">' +
        '<button class="ifx-send" type="submit" aria-label="Send message">' + ICON_SEND + '</button>' +
      '</form>' +
      '<div class="ifx-foot">IFIX Assistant · No card details or passwords</div>' +
    '</section>' +
    '<button class="ifx-fab" type="button" aria-expanded="false" aria-label="Open chat with ' + esc(CFG.botName) + '">' +
      '<span class="ifx-fig-wrap">' + figureSVG(CFG.avatarStyle) + '</span>' +
      '<span class="ifx-fab-x" aria-hidden="true">' + ICON_CLOSE + '</span>' +
      '<i class="ifx-badge"></i>' +
    '</button>';

  function boot() {
    document.body.appendChild(root);

    var panel = root.querySelector('.ifx-panel');
    var log = root.querySelector('.ifx-log');
    var chipsEl = root.querySelector('.ifx-chips');
    var form = root.querySelector('.ifx-form');
    var input = root.querySelector('.ifx-input');
    var fab = root.querySelector('.ifx-fab');
    var teaser = root.querySelector('.ifx-teaser');
    var teaserTxt = root.querySelector('.ifx-teaser-txt');

    var open = false;
    var busy = false;
    var failures = 0;
    var convo = [];           /* [{role:'user'|'assistant', content:'plain'}] sent to API */
    var rendered = [];        /* persisted bubbles [{r:'bot'|'user', h:html}] */

    /* -------- persistence -------- */

    function save() {
      store(CFG.storageKey, rendered.slice(-30));
    }

    function toBottom() {
      requestAnimationFrame(function () {
        log.scrollTop = log.scrollHeight;
        requestAnimationFrame(function () { log.scrollTop = log.scrollHeight; });
      });
    }

    function addMsg(role, html, opts) {
      opts = opts || {};
      var el = document.createElement('div');
      el.className = 'ifx-msg ' + (role === 'user' ? 'ifx-user' : 'ifx-bot');
      el.innerHTML = html;
      log.appendChild(el);
      toBottom();
      if (!opts.noSave) {
        rendered.push({ r: role === 'user' ? 'user' : 'bot', h: html });
        save();
      }
      return el;
    }

    function setTyping(on) {
      var t = log.querySelector('.ifx-typing');
      if (on && !t) {
        var el = document.createElement('div');
        el.className = 'ifx-typing';
        el.setAttribute('aria-label', CFG.botName + ' is typing');
        el.innerHTML = '<i></i><i></i><i></i>';
        log.appendChild(el);
        toBottom();
      } else if (!on && t) {
        t.remove();
      }
    }

    function setChips(labels) {
      chipsEl.innerHTML = '';
      (labels || []).forEach(function (label) {
        var b = document.createElement('button');
        b.type = 'button';
        b.className = 'ifx-chip';
        b.textContent = label;
        b.addEventListener('click', function () { send(label); });
        chipsEl.appendChild(b);
      });
    }

    function reply(text, chips) {
      setTyping(false);
      addMsg('bot', fmt(text));
      convo.push({ role: 'assistant', content: String(text).replace(/<[^>]*>/g, '') });
      setChips(chips || DEFAULT_CHIPS);
      busy = false;
      fab.classList.remove('ifx-hasnews');
    }

    /* -------- opening / closing -------- */

    function setOpen(state) {
      open = state;
      root.classList.toggle('ifx-open', open);
      fab.setAttribute('aria-expanded', open ? 'true' : 'false');
      hideTeaser();
      if (open) {
        setTimeout(function () { try { input.focus({ preventScroll: true }); } catch (e) { input.focus(); } }, 260);
        toBottom();
      }
    }

    fab.addEventListener('click', function () { setOpen(!open); });
    root.querySelector('.ifx-xbtn').addEventListener('click', function () { setOpen(false); });

    document.addEventListener('keydown', function (e) {
      if (e.key === 'Escape' && open) setOpen(false);
    });

    /* -------- teaser -------- */

    function hideTeaser() { teaser.classList.remove('ifx-show'); }

    function showTeaser() {
      if (!CFG.teaser || open) return;
      if (read(CFG.storageKey + '-teaser')) return;
      teaserTxt.textContent = CFG.teaserText;
      teaser.classList.add('ifx-show');
      fab.classList.add('ifx-hasnews');
    }

    teaser.addEventListener('click', function (e) {
      if (e.target.closest('.ifx-teaser-x')) {
        hideTeaser();
        store(CFG.storageKey + '-teaser', '1');
        return;
      }
      store(CFG.storageKey + '-teaser', '1');
      setOpen(true);
    });
    teaser.addEventListener('keydown', function (e) {
      if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); setOpen(true); }
    });
    setTimeout(showTeaser, CFG.teaserDelay || 9000);

    /* -------- navigation links inside messages -------- */

    log.addEventListener('click', function (e) {
      var a = e.target.closest('a.ifx-link');
      if (!a) return;
      var href = a.getAttribute('href') || '';
      if (href.charAt(0) === '#') {
        var target = document.querySelector(href);
        if (target) {
          e.preventDefault();
          target.scrollIntoView({ behavior: 'smooth', block: 'start' });
          setOpen(false);
        }
      }
    });

    /* -------- ask the AI worker -------- */

    function callApi(text) {
      var ctrl = ('AbortController' in window) ? new AbortController() : null;
      var timer = setTimeout(function () { if (ctrl) ctrl.abort(); }, 20000);

      var payload = {
        messages: convo.slice(-CFG.maxHistory).filter(function (m) {
          return m.role === 'user' || m.role === 'assistant';
        })
      };

      fetch(CFG.apiUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
        signal: ctrl ? ctrl.signal : undefined
      })
        .then(function (r) { if (!r.ok) throw new Error('HTTP ' + r.status); return r.json(); })
        .then(function (data) {
          clearTimeout(timer);
          var text2 = (data && (data.reply || data.response || data.result)) || '';
          if (!text2) {
            /* worker said "free tier exhausted / provider down": answer locally
               so the visitor just gets a helpful reply. */
            if (data && data.fallback) {
              var local = quickAnswer(text) || fallbackAnswer();
              var el = document.createElement('div');
              el.className = 'ifx-msg ifx-bot';
              el.innerHTML = fmtTrusted(local.html);
              log.appendChild(el);
              toBottom();
              rendered.push({ r: 'bot', h: fmtTrusted(local.html) });
              save();
              convo.push({ role: 'assistant', content: String(local.html).replace(/<[^>]*>/g, '') });
              setChips(local.chips || DEFAULT_CHIPS);
              setTyping(false);
              busy = false;
              return;
            }
            throw new Error('Empty reply');
          }
          failures = 0;
          reply(text2, (data && data.chips) || DEFAULT_CHIPS);
        })
        .catch(function () {
          clearTimeout(timer);
          /* The AI is unreachable (allowance spent, network, or not deployed yet).
             Answer from the built-in quick answers so the visitor still gets help.
             Only after repeated failures do we mention WhatsApp — a working bot
             should never sound broken. */
          var qa = quickAnswer(text) || fallbackAnswer();
          setTyping(false);
          addMsg('bot', fmtTrusted(qa.html));
          convo.push({ role: 'assistant', content: String(qa.html).replace(/<[^>]*>/g, '') });
          setChips(qa.chips || DEFAULT_CHIPS);
          busy = false;

          failures++;
          if (failures >= 2) {
            addMsg('bot', '<em>If I can\u2019t answer something here, the studio replies personally on ' +
              '<a class="ifx-link" href="' + WA_LINK + '" target="_blank" rel="noopener">WhatsApp +27 67 736 8173</a>.</em>');
          }
        });
    }

    /* -------- sending -------- */

    function send(raw) {
      var text = String(raw == null ? input.value : raw).trim();
      if (!text || busy) return;
      text = text.slice(0, CFG.maxInput);

      setOpen(true);
      input.value = '';
      addMsg('user', esc(text));
      convo.push({ role: 'user', content: text });
      busy = true;
      setChips([]);
      setTyping(true);

      var lower = text.toLowerCase();

      if (/^\s*(\/)?(reset|clear|start over|restart)\s*$/.test(lower)) {
        convo = []; rendered = []; save();
        log.innerHTML = '';
        setTimeout(function () { reply('Fresh start. What would you like to know about IFIX?', DEFAULT_CHIPS); }, 300);
        return;
      }

      if (/(human|person|agent|someone|call me|phone me|whatsapp|real person|owner|tasleem)/.test(lower)) {
        setTimeout(function () {
          reply('Of course — WhatsApp is the quickest way to reach the studio: **+27 67 736 8173** (Mon–Fri, 09:00–16:00). I\u2019m opening the chat for you now.',
            ['Website pricing', 'See the work']);
          try { window.open(WA_LINK, '_blank', 'noopener'); } catch (e) {}
        }, 500);
        return;
      }

      if (CFG.apiUrl) {
        callApi(text);
      } else {
        setTimeout(function () {
          var qa = quickAnswer(text) || fallbackAnswer();
          replyHtmlSafe(qa);
        }, 450 + Math.random() * 350);
      }

      function replyHtmlSafe(qa) {
        setTyping(false);
        addMsg('bot', fmtTrusted(qa.html));
        convo.push({ role: 'assistant', content: String(qa.html).replace(/<[^>]*>/g, '') });
        setChips(qa.chips || DEFAULT_CHIPS);
        busy = false;
      }
    }

    form.addEventListener('submit', function (e) {
      e.preventDefault();
      send();
    });

    /* -------- restore or greet -------- */

    var saved = read(CFG.storageKey);
    if (saved && saved.length) {
      saved.forEach(function (m) { addMsg(m.r === 'user' ? 'user' : 'bot', m.h, { noSave: true }); });
      rendered = saved;
      setChips(DEFAULT_CHIPS);
      if (CFG.startOpen) setOpen(true);
    } else {
      setTimeout(function () {
        reply('Hi, I\u2019m **' + CFG.botName + '** — the IFIX assistant.\nAsk me anything: what we build, pricing, hosting, how a project works, or our terms. What are you working on?', DEFAULT_CHIPS);
        convo = []; /* greeting not part of API context */
      }, 250);
      if (CFG.startOpen) setOpen(true);
    }

    /* -------- public API (for buttons on the page) -------- */

    window.IFIX_BOT = {
      open: function () { setOpen(true); },
      close: function () { setOpen(false); },
      toggle: function () { setOpen(!open); },
      send: function (text) { send(text); },
      reset: function () { send('reset'); }
    };
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', boot);
  } else {
    boot();
  }
})();
