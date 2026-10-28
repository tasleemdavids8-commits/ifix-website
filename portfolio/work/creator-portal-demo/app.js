/* ==========================================================================
   STUDIO NALEDI — COLLABORATION DESK ENGINE
   Clean, dependency-free vanilla JS · Built by IFIX-I.T SERVICES
   ========================================================================== */

(function () {
  'use strict';

  var CFG = window.CREATOR_CONFIG || {};
  var CREATOR_EMAIL = CFG.email || 'collabs@studionaledi.example';
  var CREATOR_NAME = CFG.name || 'Studio Naledi';
  var REF_PREFIX = CFG.refPrefix || 'SN-2026-';

  // Fill every spot that shows the creator's email from the single config value
  [].slice.call(document.querySelectorAll('[data-creator-email]')).forEach(function (el) {
    el.textContent = CREATOR_EMAIL;
  });

  var state = {
    refCode: REF_PREFIX + Math.floor(510 + Math.random() * 480),
    reason: 'Paid Promo Video',
    otherReason: '',
    deliverables: ['Instagram Reel', 'TikTok Video (30–60s)'],
    compType: 'Paid Campaign',
    budget: 'R5,000 – R12,000',
    commissionTerms: '',
    prGiftInfo: '',
    windowChoice: 'Within 2–3 Weeks',
    includeSchedule: false,
    autoSchedule: false,
    dateVal: '2026-11-12',
    timeVal: '10:30',
    slotPurpose: '15-min Briefing Call',
    locationVal: '',
    senderName: '',
    brandName: '',
    senderEmail: '',
    brandHandle: '',
    whatsapp: '',
    briefNotes: '',
    sampleCursor: 0
  };

  var campaignCases = {
    skincare: {
      eyebrow: 'Skincare Partnership',
      title: 'Luminae Botanica — Barrier Serum Launch',
      metrics: ['148,400 Organic Views', '4.2% Link CTR', '620+ Saves in 48h'],
      deliverables: ['Instagram Reel', 'TikTok Video (30–60s)', 'Paid Usage / Spark Code (30d)'],
      reason: 'Paid Promo Video',
      compType: 'Paid Campaign',
      budget: 'R12,000 – R25,000',
      summary: 'Filmed in natural morning light overlooking Clifton. Delivered one hero vertical film cross-posted to Instagram and TikTok alongside a 30-day Spark whitelisting code.'
    },
    cafe: {
      eyebrow: 'Hospitality Launch',
      title: 'Kloof Matcha Bar — Opening Week Feature',
      metrics: ['92,100 Cape Town Views', '1,420 Map Saves', 'Sold-Out Opening Weekend'],
      deliverables: ['In-Person Attendance', 'IG Story Set (3–5 frames)', 'Instagram Reel'],
      reason: 'Event, Hosting or Shoot',
      compType: 'Paid Campaign',
      budget: 'R5,000 – R12,000',
      summary: 'Morning preview attendance with live 4-frame story coverage and an editorial launch reel published the following morning.'
    },
    fashion: {
      eyebrow: 'Travel & Wardrobe',
      title: 'La Vallée Franschhoek — Autumn Suite & Capsule',
      metrics: ['214,000 Combined Views', '38 Direct Suite Enquiries', '3-Part Editorial'],
      deliverables: ['Instagram Reel', 'TikTok Video (30–60s)', 'Photo Carousel'],
      reason: 'Brand Partnership',
      compType: 'Paid + Commission',
      budget: 'R12,000 – R25,000',
      summary: 'Two-night hosted stay paired with a curated autumn linen capsule edit across Reels, TikTok, and an 8-frame still carousel.'
    }
  };

  var sampleBriefs = [
    {
      label: 'Paid Skincare Campaign',
      reason: 'Paid Promo Video',
      otherReason: '',
      deliverables: ['Instagram Reel', 'TikTok Video (30–60s)', 'Paid Usage / Spark Code (30d)'],
      compType: 'Paid Campaign',
      budget: 'R12,000 – R25,000',
      commissionTerms: '',
      prGiftInfo: '',
      windowChoice: 'Within 2–3 Weeks',
      includeSchedule: true,
      autoSchedule: false,
      dateVal: '2026-11-05',
      timeVal: '11:00',
      slotPurpose: '15-min Briefing Call',
      locationVal: 'Google Meet (link shared upon confirmation)',
      senderName: 'Maya Vance · Brand Lead',
      brandName: 'Solstice Botanicals',
      senderEmail: 'maya@solsticebotanicals.example',
      brandHandle: '@solsticebotanicals.demo',
      whatsapp: '+27 00 000 0000',
      briefNotes: 'Launching our SPF50 Mineral Dew Tint in November. Looking for one calm morning routine piece in natural coastal light plus 30-day Spark ad usage.'
    },
    {
      label: 'Event & Hosting Invitation',
      reason: 'Event, Hosting or Shoot',
      otherReason: '',
      deliverables: ['In-Person Attendance', 'IG Story Set (3–5 frames)', 'Instagram Reel'],
      compType: 'Paid Campaign',
      budget: 'R5,000 – R12,000',
      commissionTerms: '',
      prGiftInfo: '',
      windowChoice: 'Within 2–3 Weeks',
      includeSchedule: true,
      autoSchedule: true,
      dateVal: '2026-11-14',
      timeVal: '18:30',
      slotPurpose: 'Event / Attendance',
      locationVal: 'Silo District Rooftop, Cape Town',
      senderName: 'Claire Maren · PR Director',
      brandName: 'Maison Oranje',
      senderEmail: 'claire@maisonoranje.example',
      brandHandle: 'maisonoranje.example',
      whatsapp: '+27 00 000 0000',
      briefNotes: 'Hosting an intimate 28-guest sunset preview dinner for our Resort collection. Paid attendance fee, private return transfer, and custom gifting included.'
    },
    {
      label: 'Custom Unlisted Enquiry',
      reason: 'Other',
      otherReason: 'Editorial Conversation & Studio Video Feature',
      deliverables: ['In-Person Attendance', 'Instagram Reel'],
      compType: 'Paid Campaign',
      budget: 'R2,500 – R5,000',
      commissionTerms: '',
      prGiftInfo: '',
      windowChoice: 'Next Month',
      includeSchedule: true,
      autoSchedule: false,
      dateVal: '2026-11-20',
      timeVal: '14:00',
      slotPurpose: 'Location Shoot',
      locationVal: 'Woodstock Daylight Studio, Cape Town',
      senderName: 'Julian Reed · Commissioning Editor',
      brandName: 'Cape Design Journal',
      senderEmail: 'editorial@capedesignjournal.example',
      brandHandle: '@capedesignjournal.demo',
      whatsapp: '+27 00 000 0000',
      briefNotes: 'Inviting Studio Naledi as our Season 3 opening guest for a filmed conversation on visual storytelling and spatial aesthetics. Includes honorarium and vertical cutdowns.'
    }
  ];

  function byId(id) {
    return document.getElementById(id);
  }

  function showToast(message) {
    var toast = byId('toastBar');
    if (!toast) return;
    toast.textContent = message;
    toast.classList.add('is-visible');
    clearTimeout(showToast._t);
    showToast._t = setTimeout(function () {
      toast.classList.remove('is-visible');
    }, 2400);
  }

  function copyToClipboard(text, message) {
    if (navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard.writeText(text).then(function () {
        showToast(message);
      }).catch(function () {
        legacyCopy(text, message);
      });
    } else {
      legacyCopy(text, message);
    }
  }

  function legacyCopy(text, message) {
    var ta = document.createElement('textarea');
    ta.value = text;
    ta.style.position = 'fixed';
    ta.style.opacity = '0';
    document.body.appendChild(ta);
    ta.select();
    try { document.execCommand('copy'); } catch (e) {}
    document.body.removeChild(ta);
    showToast(message);
  }

  function escapeHtml(str) {
    return String(str || '')
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;');
  }

  function formatReadableDate(iso) {
    if (!iso) return '';
    var parts = iso.split('-');
    if (parts.length !== 3) return iso;
    var d = new Date(Number(parts[0]), Number(parts[1]) - 1, Number(parts[2]));
    if (isNaN(d.getTime())) return iso;
    return d.toLocaleDateString('en-ZA', {
      weekday: 'short',
      day: '2-digit',
      month: 'short',
      year: 'numeric'
    });
  }

  function shortBudgetLabel(b) {
    if (b.indexOf('2,500') !== -1) return 'R2.5k–R5k';
    if (b.indexOf('5,000 – R12,000') !== -1) return 'R5k–R12k';
    if (b.indexOf('12,000') !== -1) return 'R12k–R25k';
    if (b.indexOf('25,000+') !== -1) return 'R25k+';
    return 'Rate Card';
  }

  function shortDeliverableSummary() {
    if (!state.deliverables.length) return 'Custom Scope';
    var labels = state.deliverables.slice(0, 2).map(function (item) {
      if (item.indexOf('Instagram Reel') !== -1) return 'IG Reel';
      if (item.indexOf('TikTok') !== -1) return 'TikTok';
      if (item.indexOf('Story') !== -1) return 'Stories';
      if (item.indexOf('Carousel') !== -1) return 'Carousel';
      if (item.indexOf('UGC') !== -1) return 'UGC';
      if (item.indexOf('Spark') !== -1) return 'Spark 30d';
      if (item.indexOf('In-Person') !== -1) return 'Attendance';
      return 'Custom';
    });
    var extra = state.deliverables.length > 2 ? ' +' + (state.deliverables.length - 2) : '';
    return labels.join(' + ') + extra;
  }

  function compileBrief() {
    var effectiveReason = state.reason === 'Other'
      ? (state.otherReason.trim() || 'Custom Enquiry')
      : state.reason;

    var brand = state.brandName.trim() || 'Your Brand';
    var sender = state.senderName.trim() || 'Brand Contact';
    var replyMail = state.senderEmail.trim() || 'your@brand.co.za';
    var handleRef = state.brandHandle.trim() || 'Not specified';

    var tagPrefix = '';
    if (state.reason === 'Event, Hosting or Shoot' && state.includeSchedule && state.dateVal) {
      var shortDate = formatReadableDate(state.dateVal).replace(/,?\s*\d{4}$/, '');
      tagPrefix = 'EVENT · ' + shortDate + (state.timeVal ? ' @ ' + state.timeVal : '');
    } else if (state.compType === 'PR / Gifted Only') {
      tagPrefix = 'PR GIFTING';
    } else if (state.compType === 'Paid + Commission') {
      tagPrefix = 'PAID + COMM · ' + shortBudgetLabel(state.budget);
    } else {
      tagPrefix = 'PAID · ' + shortBudgetLabel(state.budget);
    }

    var subject = '[' + tagPrefix + ' | ' + shortDeliverableSummary() + '] ' + brand + ' — ' + effectiveReason;

    var compLines = '';
    if (state.compType === 'PR / Gifted Only') {
      compLines = 'PR / Gifted Only (Editorial consideration)' +
        (state.prGiftInfo.trim() ? '\nParcel Details: ' + state.prGiftInfo.trim() : '');
    } else if (state.compType === 'Paid + Commission') {
      compLines = 'Paid + Commission · Base Budget: ' + state.budget +
        (state.commissionTerms.trim() ? '\nCommission Terms: ' + state.commissionTerms.trim() : '');
    } else {
      compLines = 'Paid Campaign · Estimated Budget: ' + state.budget;
    }

    var scheduleText = 'Target Window: ' + state.windowChoice;
    if (state.includeSchedule && state.dateVal) {
      scheduleText += '\nRequested Slot (' + state.slotPurpose + '): ' +
        formatReadableDate(state.dateVal) + (state.timeVal ? ' at ' + state.timeVal + ' SAST' : '');
      if (state.locationVal.trim()) {
        scheduleText += '\nLocation / Call Note: ' + state.locationVal.trim();
      }
    }

    var delivList = state.deliverables.length
      ? state.deliverables.map(function (d) { return '- ' + d; }).join('\n')
      : '- Open to creator recommendation';

    var phoneLine = state.whatsapp.trim() ? '\nPhone: ' + state.whatsapp.trim() : '';
    var notesText = state.briefNotes.trim() || '(Add project notes or campaign talking points in Step 05)';

    var body = [
      'TO: ' + CREATOR_NAME + ' <' + CREATOR_EMAIL + '>',
      'FROM / REPLY-TO: ' + sender + ' <' + replyMail + '>',
      'REFERENCE: ' + state.refCode,
      '--------------------------------------------------',
      '',
      '01. ENQUIRY TYPE',
      effectiveReason,
      '',
      '02. PLATFORMS & DELIVERABLES',
      delivList,
      '',
      '03. COMPENSATION & BUDGET',
      compLines,
      '',
      '04. TIMELINE & SCHEDULE',
      scheduleText,
      '',
      '05. BRAND & CONTACT DETAILS',
      'Brand / Agency: ' + brand,
      'Contact Person: ' + sender,
      'Reply Email: ' + replyMail + phoneLine,
      'Brand @Handle / Web: ' + handleRef,
      '',
      '06. PROJECT NOTES',
      notesText,
      '',
      '--------------------------------------------------',
      'Formatted via ' + CREATOR_NAME + ' Partnerships Desk · Built by IFIX-I.T SERVICES'
    ].join('\n');

    var mailtoUrl = 'mailto:' + CREATOR_EMAIL +
      '?subject=' + encodeURIComponent(subject) +
      '&body=' + encodeURIComponent(body);

    return {
      subject: subject,
      body: body,
      mailtoUrl: mailtoUrl
    };
  }

  function renderUI() {
    var reasonTiles = document.querySelectorAll('#reasonGrid .reason-tile');
    for (var i = 0; i < reasonTiles.length; i++) {
      var tile = reasonTiles[i];
      tile.classList.toggle('is-selected', tile.getAttribute('data-reason') === state.reason);
    }
    byId('otherReasonReveal').classList.toggle('is-open', state.reason === 'Other');

    var delivPills = document.querySelectorAll('#deliverablesGroup .select-pill');
    for (var j = 0; j < delivPills.length; j++) {
      var pill = delivPills[j];
      var dVal = pill.getAttribute('data-deliverable');
      pill.classList.toggle('is-selected', state.deliverables.indexOf(dVal) !== -1);
    }

    var compBtns = document.querySelectorAll('#compTabs .comp-tab');
    for (var k = 0; k < compBtns.length; k++) {
      var cBtn = compBtns[k];
      cBtn.classList.toggle('is-selected', cBtn.getAttribute('data-comp') === state.compType);
    }

    var isPR = state.compType === 'PR / Gifted Only';
    var isHybrid = state.compType === 'Paid + Commission';
    byId('budgetBlock').style.display = isPR ? 'none' : 'block';
    byId('commissionReveal').classList.toggle('is-open', isHybrid);
    byId('prReveal').classList.toggle('is-open', isPR);

    var budgetBtns = document.querySelectorAll('#budgetGroup .budget-btn');
    for (var m = 0; m < budgetBtns.length; m++) {
      var bBtn = budgetBtns[m];
      bBtn.classList.toggle('is-selected', bBtn.getAttribute('data-budget') === state.budget);
    }

    var winPills = document.querySelectorAll('#windowGroup .select-pill');
    for (var n = 0; n < winPills.length; n++) {
      var wPill = winPills[n];
      wPill.classList.toggle('is-selected', wPill.getAttribute('data-window') === state.windowChoice);
    }

    byId('scheduleReveal').classList.toggle('is-open', state.includeSchedule);
    var schedBtn = byId('btnToggleSchedule');
    schedBtn.classList.toggle('is-active', state.includeSchedule);
    schedBtn.textContent = state.includeSchedule
      ? '− Remove specific date & time'
      : '+ Specify a date & time (event, shoot, call, or embargo)';
    byId('autoScheduleNote').classList.toggle('is-visible', state.includeSchedule && state.autoSchedule);

    var hasHandle = state.brandHandle.trim().length > 0;
    var vetEl = byId('vettingStatus');
    vetEl.classList.toggle('is-visible', hasHandle);
    if (hasHandle) {
      vetEl.textContent = 'Attached to brief: ' + state.brandHandle.trim();
    }

    var compiled = compileBrief();
    byId('draftRefLabel').textContent = 'REF ' + state.refCode;
    var sMail = state.senderEmail.trim();
    var sName = state.senderName.trim();
    byId('draftReplyTo').textContent = sMail
      ? (sName ? sName + ' <' + sMail + '>' : sMail)
      : 'your@brand.co.za (enter in Step 05)';
    byId('draftSubject').textContent = compiled.subject;
    byId('draftBody').textContent = compiled.body;
  }

  document.addEventListener('click', function (ev) {
    // 1. Theme Switcher
    var themeBtn = ev.target.closest('[data-theme-choice]');
    if (themeBtn) {
      var chosenTheme = themeBtn.getAttribute('data-theme-choice');
      document.documentElement.setAttribute('data-theme', chosenTheme);
      var allThemeBtns = document.querySelectorAll('[data-theme-choice]');
      for (var t = 0; t < allThemeBtns.length; t++) {
        allThemeBtns[t].classList.toggle('active', allThemeBtns[t] === themeBtn);
      }
      var names = { goldwhite: 'White & Gold', champagne: 'Warm Champagne', noir: 'Midnight Noir' };
      showToast('Theme switched to ' + (names[chosenTheme] || chosenTheme));
      return;
    }

    // 2. Reason Tiles
    var reasonTile = ev.target.closest('#reasonGrid .reason-tile');
    if (reasonTile) {
      var newReason = reasonTile.getAttribute('data-reason');
      var needsEventSlot = reasonTile.getAttribute('data-event-slot') === 'true';
      state.reason = newReason;

      if (needsEventSlot) {
        state.includeSchedule = true;
        state.autoSchedule = true;
        state.slotPurpose = 'Event / Attendance';
        byId('slotPurposeField').value = 'Event / Attendance';
        if (state.deliverables.indexOf('In-Person Attendance') === -1) {
          state.deliverables.push('In-Person Attendance');
        }
      } else if (state.autoSchedule) {
        state.includeSchedule = false;
        state.autoSchedule = false;
      }

      if (newReason === 'PR / Gifted Seeding') {
        state.compType = 'PR / Gifted Only';
      } else if (state.compType === 'PR / Gifted Only') {
        state.compType = 'Paid Campaign';
      }

      renderUI();
      if (newReason === 'Other') {
        setTimeout(function () { byId('otherReasonField').focus(); }, 40);
      }
      return;
    }

    // 3. Deliverables Pills
    var delivPill = ev.target.closest('#deliverablesGroup .select-pill');
    if (delivPill) {
      var delivName = delivPill.getAttribute('data-deliverable');
      var idx = state.deliverables.indexOf(delivName);
      if (idx !== -1) {
        state.deliverables.splice(idx, 1);
      } else {
        state.deliverables.push(delivName);
      }
      renderUI();
      return;
    }

    // 4. Compensation Tabs
    var compTab = ev.target.closest('#compTabs .comp-tab');
    if (compTab) {
      state.compType = compTab.getAttribute('data-comp');
      renderUI();
      return;
    }

    // 5. Budget Buttons
    var budgetBtn = ev.target.closest('#budgetGroup .budget-btn');
    if (budgetBtn) {
      state.budget = budgetBtn.getAttribute('data-budget');
      renderUI();
      return;
    }

    // 6. Window Pills
    var winPill = ev.target.closest('#windowGroup .select-pill');
    if (winPill) {
      state.windowChoice = winPill.getAttribute('data-window');
      renderUI();
      return;
    }

    // 7. Campaign Cards
    var campCard = ev.target.closest('.campaign-item');
    if (campCard) {
      var key = campCard.getAttribute('data-campaign');
      var imgEl = campCard.querySelector('img');
      openCampaignCaseModal(key, imgEl ? imgEl.src : '');
      return;
    }

    // 8. Close Modal buttons
    var closeBtn = ev.target.closest('[data-close]');
    if (closeBtn) {
      closeModal(closeBtn.getAttribute('data-close'));
      return;
    }

    if (ev.target.classList && ev.target.classList.contains('modal-overlay')) {
      ev.target.classList.remove('is-open');
    }
  });

  document.addEventListener('keydown', function (ev) {
    if (ev.key === 'Escape') {
      var overlays = document.querySelectorAll('.modal-overlay.is-open');
      for (var i = 0; i < overlays.length; i++) {
        overlays[i].classList.remove('is-open');
      }
    }
  });

  byId('btnToggleSchedule').addEventListener('click', function () {
    state.includeSchedule = !state.includeSchedule;
    state.autoSchedule = false;
    renderUI();
  });

  byId('btnToggleDemographics').addEventListener('click', function () {
    var panel = byId('demographicsPanel');
    var opened = panel.classList.toggle('open');
    this.textContent = opened ? 'Audience Breakdown −' : 'Audience Breakdown +';
  });

  byId('btnCopyEmail').addEventListener('click', function () {
    var btn = this;
    copyToClipboard(CREATOR_EMAIL, 'Copied ' + CREATOR_EMAIL);
    btn.textContent = 'Copied';
    setTimeout(function () { btn.textContent = 'Copy Email'; }, 1800);
  });

  function bindInput(id, key) {
    var elem = byId(id);
    if (!elem) return;
    elem.addEventListener('input', function () {
      state[key] = elem.value;
      elem.classList.remove('has-error');
      renderUI();
    });
    elem.addEventListener('change', function () {
      state[key] = elem.value;
      renderUI();
    });
  }

  byId('dateField').value = state.dateVal;
  bindInput('otherReasonField', 'otherReason');
  bindInput('commissionField', 'commissionTerms');
  bindInput('prValueField', 'prGiftInfo');
  bindInput('dateField', 'dateVal');
  bindInput('timeField', 'timeVal');
  bindInput('slotPurposeField', 'slotPurpose');
  bindInput('locationField', 'locationVal');
  bindInput('senderNameField', 'senderName');
  bindInput('brandNameField', 'brandName');
  bindInput('senderEmailField', 'senderEmail');
  bindInput('brandHandleField', 'brandHandle');
  bindInput('whatsappField', 'whatsapp');
  bindInput('briefNotesField', 'briefNotes');

  byId('btnSampleFill').addEventListener('click', function () {
    var sample = sampleBriefs[state.sampleCursor % sampleBriefs.length];
    state.sampleCursor += 1;

    state.reason = sample.reason;
    state.otherReason = sample.otherReason;
    state.deliverables = sample.deliverables.slice();
    state.compType = sample.compType;
    state.budget = sample.budget;
    state.commissionTerms = sample.commissionTerms;
    state.prGiftInfo = sample.prGiftInfo;
    state.windowChoice = sample.windowChoice;
    state.includeSchedule = sample.includeSchedule;
    state.autoSchedule = sample.autoSchedule;
    state.dateVal = sample.dateVal;
    state.timeVal = sample.timeVal;
    state.slotPurpose = sample.slotPurpose;
    state.locationVal = sample.locationVal;
    state.senderName = sample.senderName;
    state.brandName = sample.brandName;
    state.senderEmail = sample.senderEmail;
    state.brandHandle = sample.brandHandle;
    state.whatsapp = sample.whatsapp;
    state.briefNotes = sample.briefNotes;

    byId('otherReasonField').value = state.otherReason;
    byId('commissionField').value = state.commissionTerms;
    byId('prValueField').value = state.prGiftInfo;
    byId('dateField').value = state.dateVal;
    byId('timeField').value = state.timeVal;
    byId('slotPurposeField').value = state.slotPurpose;
    byId('locationField').value = state.locationVal;
    byId('senderNameField').value = state.senderName;
    byId('brandNameField').value = state.brandName;
    byId('senderEmailField').value = state.senderEmail;
    byId('brandHandleField').value = state.brandHandle;
    byId('whatsappField').value = state.whatsapp;
    byId('briefNotesField').value = state.briefNotes;

    var errInputs = document.querySelectorAll('.has-error');
    for (var i = 0; i < errInputs.length; i++) {
      errInputs[i].classList.remove('has-error');
    }

    renderUI();
    showToast('Sample loaded: ' + sample.label);
  });

  byId('btnMailtoDirect').addEventListener('click', function () {
    var compiled = compileBrief();
    window.location.href = compiled.mailtoUrl;
  });

  function copyFullDraft() {
    var compiled = compileBrief();
    copyToClipboard('To: ' + CREATOR_EMAIL + '\nSubject: ' + compiled.subject + '\n\n' + compiled.body, 'Formatted brief copied');
  }

  byId('btnCopyBriefDirect').addEventListener('click', copyFullDraft);
  byId('btnCopyFromDraft').addEventListener('click', copyFullDraft);

  function openModal(id) {
    byId(id).classList.add('is-open');
  }

  function closeModal(id) {
    byId(id).classList.remove('is-open');
  }

  function openCampaignCaseModal(key, imgSrc) {
    var data = campaignCases[key];
    if (!data) return;

    byId('campaignModalEyebrow').textContent = data.eyebrow;
    byId('campaignModalHeading').textContent = data.title;

    var bodyContainer = byId('campaignModalBody');
    var pillsHtml = data.metrics.map(function (m) {
      return '<span style="padding:5px 11px; border-radius:99px; border:1px solid var(--gold-line); background:var(--gold-tint); font-size:12px; font-weight:600; color:var(--ink);">' + escapeHtml(m) + '</span>';
    }).join('');

    bodyContainer.innerHTML =
      (imgSrc ? '<div style="border-radius:8px; overflow:hidden; max-height:240px; border:1px solid var(--line); margin-bottom:16px;"><img src="' + escapeHtml(imgSrc) + '" alt="' + escapeHtml(data.title) + '" style="width:100%; height:240px; object-fit:cover;" /></div>' : '') +
      '<div style="display:flex; flex-wrap:wrap; gap:8px; margin-bottom:14px;">' + pillsHtml + '</div>' +
      '<p style="margin:0 0 14px; color:var(--ink-soft); font-size:14.5px;">' + escapeHtml(data.summary) + '</p>' +
      '<div style="margin-bottom:20px; font-size:13px; color:var(--ink);"><strong>Deliverables:</strong> ' + escapeHtml(data.deliverables.join(' · ')) + '</div>' +
      '<button type="button" class="btn-gold" id="btnUseCampaignScope" style="width:100%; min-height:46px;">Select This Scope in Brief Builder &darr;</button>';

    openModal('campaignModal');

    byId('btnUseCampaignScope').onclick = function () {
      state.reason = data.reason;
      state.deliverables = data.deliverables.slice();
      state.compType = data.compType;
      state.budget = data.budget;
      if (data.reason === 'Event, Hosting or Shoot') {
        state.includeSchedule = true;
        state.autoSchedule = true;
      }
      renderUI();
      closeModal('campaignModal');
      byId('brief-builder').scrollIntoView({ behavior: 'smooth' });
      showToast('Scope applied to brief builder');
    };
  }

  byId('collabForm').addEventListener('submit', function (ev) {
    ev.preventDefault();

    var hasErr = false;
    if (state.reason === 'Other' && !state.otherReason.trim()) {
      byId('otherReasonField').classList.add('has-error');
      hasErr = true;
    }
    if (!state.senderName.trim()) {
      byId('senderNameField').classList.add('has-error');
      hasErr = true;
    }
    if (!state.brandName.trim()) {
      byId('brandNameField').classList.add('has-error');
      hasErr = true;
    }
    var mail = state.senderEmail.trim();
    if (!mail || mail.indexOf('@') === -1) {
      byId('senderEmailField').classList.add('has-error');
      hasErr = true;
    }

    if (hasErr) {
      showToast('Please enter your Name, Brand & Email (or tap Fill Sample Enquiry)');
      var firstErr = document.querySelector('.has-error');
      if (firstErr) firstErr.focus();
      return;
    }

    state.refCode = REF_PREFIX + Math.floor(510 + Math.random() * 480);
    renderUI();
    var compiled = compileBrief();

    byId('modalRefEyebrow').textContent = 'REF ' + state.refCode;
    byId('modalReplyTo').textContent = state.senderName.trim() + ' <' + state.senderEmail.trim() + '>';
    byId('modalSubjectText').textContent = compiled.subject;
    byId('btnOpenMailClient').href = compiled.mailtoUrl;

    byId('btnCopyModalBrief').onclick = function () {
      copyToClipboard('To: ' + CREATOR_EMAIL + '\nSubject: ' + compiled.subject + '\n\n' + compiled.body, 'Full email text copied');
    };

    openModal('dispatchModal');
  });

  renderUI();
})();
