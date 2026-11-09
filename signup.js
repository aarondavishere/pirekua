/* pirekua — home page sign-up dialogs: "Stay in the loop" (hero button) and
   "Get the cookbook" (section 4 button). One script, two <dialog>s with the same
   fields, validation, sending and success state. Needs i18n.js and common.js
   first. Vanilla JS, no dependencies. */

/* ---------------- Tuning knobs ---------------- */

// Chile confetti from the submit button when a sign-up goes through (never with
// reduced motion). false turns it off.
const SIGNUP_CONFETTI = true;
// Optional "Anything we should know?" box: longest note we keep.
const SIGNUP_NOTE_MAX = 500;

(() => {
  'use strict';

  const P = window.pirekua;
  const t = P.t;
  // Same rules as the Reserve page.
  const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;
  const ZIP_RE = /^\d{5}(?:-?\d{4})?$/;
  const FIELDS = ['first_name', 'last_name', 'email', 'zip'];   // required; `note` is optional

  document.querySelectorAll('dialog[data-signup]').forEach((dialogEl) => {
    const kind = dialogEl.dataset.signup;                       // "loop" or "cookbook"
    const form = dialogEl.querySelector('form');
    const formView = dialogEl.querySelector('[data-signup-view="form"]');
    const doneView = dialogEl.querySelector('[data-signup-view="done"]');
    const formTitle = formView.querySelector('.modal__title');
    const doneTitle = doneView.querySelector('.modal__title');
    const doneText = doneView.querySelector('[data-done-text]');
    const button = form.querySelector('[data-signup-submit]');
    const buttonLabel = button.querySelector('[data-btn-label]');
    const fieldset = form.querySelector('[data-fields]');
    const sendMsg = form.querySelector('[data-send-msg]');
    let submitted = false, sending = false, doneName = '';

    const dialog = P.createDialog(dialogEl, {
      // Every opening starts fresh: an empty form (a finished sign-up never shows again).
      beforeOpen: () => { if (!doneView.hidden || !sending) reset(); },
      initialFocus: () => (doneView.hidden ? form.elements.first_name : doneTitle),
    });
    document.querySelectorAll('[data-open-signup="' + kind + '"]').forEach((b) => b.addEventListener('click', () => dialog.open(b)));

    /* ---- validation (same behavior and wording as the Reserve form) ---- */
    function errorFor(name) {
      const v = String(form.elements[name].value || '').trim();
      if (!v) return 'form.required';
      if (name === 'email' && (!EMAIL_RE.test(v) || v.length > 254)) return 'form.emailBad';
      if (name === 'zip' && !ZIP_RE.test(v)) return 'form.zipBad';
      return '';
    }
    function showFieldError(name, key) {
      const input = form.elements[name];
      const msg = document.getElementById(input.getAttribute('aria-describedby'));
      msg.dataset.key = key || '';
      msg.textContent = key ? t(key) : '';
      if (key) input.setAttribute('aria-invalid', 'true'); else input.removeAttribute('aria-invalid');
    }
    function showMsg(key) {
      sendMsg.dataset.key = key || '';
      sendMsg.textContent = key ? t(key) : '';
    }
    FIELDS.forEach((name) => {
      const input = form.elements[name];
      input.addEventListener('blur', () => {
        if (sending) return;
        if (submitted || String(input.value).trim()) showFieldError(name, errorFor(name));
      });
      input.addEventListener('input', () => {
        if (input.getAttribute('aria-invalid') === 'true' && !errorFor(name)) showFieldError(name, '');
      });
    });

    function setBusy(on) {
      sending = on;
      button.setAttribute('aria-busy', on ? 'true' : 'false');
      if (on) button.setAttribute('aria-disabled', 'true'); else button.removeAttribute('aria-disabled');
      buttonLabel.textContent = t(on ? 'signup.busy' : 'signup.' + kind + '.button');
      fieldset.disabled = on;
    }

    function reset() {
      form.reset();                                  // hidden source/form-name keep their defaults
      FIELDS.forEach((name) => showFieldError(name, ''));
      showMsg('');
      submitted = false;
      doneName = '';
      setBusy(false);
      formView.hidden = false;
      doneView.hidden = true;
      dialogEl.setAttribute('aria-labelledby', formTitle.id);
    }

    form.addEventListener('submit', async (e) => {
      e.preventDefault();
      if (sending) return;                           // no double submits; the button is never disabled
      submitted = true;
      showMsg('');
      const bad = [];
      FIELDS.forEach((name) => {
        const key = errorFor(name);
        showFieldError(name, key);
        if (key) bad.push(form.elements[name]);
      });
      if (bad.length) { bad[0].focus(); return; }

      ['first_name', 'last_name', 'email', 'zip'].forEach((n) => { form.elements[n].value = form.elements[n].value.trim(); });
      form.elements.note.value = form.elements.note.value.trim().slice(0, SIGNUP_NOTE_MAX);
      form.elements.lang.value = P.lang();
      const body = new URLSearchParams(new FormData(form)).toString();   // before the fields lock
      const first = form.elements.first_name.value;
      setBusy(true);
      try {
        const res = await fetch('/', {
          method: 'POST',
          headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
          body,
        });
        if (!res.ok) throw new Error('HTTP ' + res.status);
      } catch (err) {
        setBusy(false);
        showMsg('signup.error');                     // nothing is cleared
        button.focus();
        return;
      }

      // Success: confetti from the button (above the dialog), then the thank-you.
      if (SIGNUP_CONFETTI) P.party(button, dialogEl);
      setBusy(false);
      doneName = first;
      fillDone();
      formView.hidden = true;
      doneView.hidden = false;
      dialogEl.setAttribute('aria-labelledby', doneTitle.id);
      dialogEl.querySelector('.modal__panel').scrollTop = 0;
      doneTitle.focus();
    });

    function fillDone() {
      doneText.textContent = t('signup.' + kind + '.doneText', { name: doneName });
    }

    P.onLang(() => {
      FIELDS.forEach((name) => {
        const msg = document.getElementById(form.elements[name].getAttribute('aria-describedby'));
        if (msg.dataset.key) msg.textContent = t(msg.dataset.key);
      });
      if (sendMsg.dataset.key) sendMsg.textContent = t(sendMsg.dataset.key);
      buttonLabel.textContent = t(sending ? 'signup.busy' : 'signup.' + kind + '.button');
      if (!doneView.hidden) fillDone();
    });
  });
})();
