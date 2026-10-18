(function () {
  'use strict';

  var CFG = window.SIA_CONFIG || {};
  var REDUCED = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  /* ------------------------------- Utilities ------------------------------- */
  function $(sel, ctx) { return (ctx || document).querySelector(sel); }
  function $all(sel, ctx) { return Array.prototype.slice.call((ctx || document).querySelectorAll(sel)); }
  function getCSRF() {
    var meta = document.querySelector('meta[name="csrf-token"]');
    return meta ? meta.getAttribute('content') : '';
  }
  function setSubmitting(btn, submitting, labelHtml) {
    if (!btn) return;
    btn.disabled = submitting;
    if (submitting) {
      btn.dataset.original = btn.querySelector('.sia-submit-label')
        ? btn.querySelector('.sia-submit-label').innerHTML
        : btn.innerHTML;
      btn.innerHTML = '<span class="sia-btn__spinner"></span> <span class="sia-submit-label">Processing&hellip;</span>';
    } else if (btn.dataset.original) {
      btn.innerHTML = '<span class="sia-submit-label">' + btn.dataset.original + '</span>';
      delete btn.dataset.original;
    } else if (labelHtml) {
      btn.innerHTML = labelHtml;
    }
  }
  function showFeedback(el, type, title, msg) {
    if (!el) return;
    el.className = 'sia-form-feedback is-' + type;
    el.innerHTML = (title ? '<strong>' + title + '</strong>' : '') + msg;
  }
  function clearFeedback(el) { if (el) { el.className = 'sia-form-feedback'; el.innerHTML = ''; } }

  /* ----------------------------- Email regex ------------------------------- */
  var EMAIL_RE = /^[A-Za-z0-9._%+\-]+@[A-Za-z0-9.\-]+\.[A-Za-z]{2,}$/;
  var PHONE_RE = /^[+()\-\s0-9]{7,20}$/;

  /* ----------------------- Field-level validation -------------------------- */
  function validateField(field) {
    var input = field.querySelector('input,select,textarea');
    if (!input) return true;
    var rules = (input.dataset.rules || '').split(',').filter(Boolean);
    var value = (input.value || '').trim();
    var errorEl = field.querySelector('.sia-error');
    var msg = '';

    for (var i = 0; i < rules.length; i++) {
      var r = rules[i];
      if (r === 'required' && !value) { msg = 'This field is required.'; break; }
      if (r === 'email' && value && !EMAIL_RE.test(value)) { msg = 'Please enter a valid business email address.'; break; }
      if (r === 'phone' && value && !PHONE_RE.test(value)) { msg = 'Please enter a valid phone number.'; break; }
    }
    if (input.type === 'email' && value && !EMAIL_RE.test(value) && msg === '') {
      msg = 'Please enter a valid business email address.';
    }

    if (msg) {
      field.classList.add('has-error');
      if (errorEl) errorEl.textContent = msg;
      input.setAttribute('aria-invalid', 'true');
      return false;
    }
    field.classList.remove('has-error');
    if (errorEl) errorEl.textContent = '';
    input.removeAttribute('aria-invalid');
    return true;
  }

  function validateForm(form) {
    var fields = $all('.sia-field', form);
    var ok = true;
    fields.forEach(function (f) {
      if (f.classList.contains('sia-field--honeypot')) return;
      if (!validateField(f)) ok = false;
    });
    return ok;
  }

  function attachFieldValidation(form) {
    $all('.sia-field', form).forEach(function (field) {
      if (field.classList.contains('sia-field--honeypot')) return;
      var input = field.querySelector('input,select,textarea');
      if (!input) return;
      input.addEventListener('blur', function () { validateField(field); });
      input.addEventListener('input', function () {
        if (field.classList.contains('has-error')) validateField(field);
      });
    });
  }

  /* --------------------------- Scroll reveal ------------------------------- */
  function initReveal() {
    var els = $all('.sia-reveal');
    if (REDUCED || !('IntersectionObserver' in window)) {
      els.forEach(function (el) { el.classList.add('is-visible'); });
      return;
    }
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (entry.isIntersecting) {
          entry.target.classList.add('is-visible');
          io.unobserve(entry.target);
        }
      });
    }, { threshold: 0.12, rootMargin: '0px 0px -40px 0px' });
    els.forEach(function (el) { io.observe(el); });
  }

  /* ------------------------------- FAQ ------------------------------------- */
  function initFAQ() {
    $all('.sia-faq-item').forEach(function (item) {
      var btn = item.querySelector('.sia-faq-q');
      var ans = item.querySelector('.sia-faq-a');
      if (!btn || !ans) return;
      btn.addEventListener('click', function () {
        var isOpen = item.classList.contains('is-open');
        $all('.sia-faq-item').forEach(function (other) {
          other.classList.remove('is-open');
          other.querySelector('.sia-faq-q').setAttribute('aria-expanded', 'false');
          other.querySelector('.sia-faq-a').style.maxHeight = '0px';
        });
        if (!isOpen) {
          item.classList.add('is-open');
          btn.setAttribute('aria-expanded', 'true');
          ans.style.maxHeight = ans.scrollHeight + 'px';
        }
      });
    });
    window.addEventListener('resize', function () {
      $all('.sia-faq-item.is-open').forEach(function (item) {
        var ans = item.querySelector('.sia-faq-a');
        ans.style.maxHeight = ans.scrollHeight + 'px';
      });
    });
  }

  /* --------------------------- Installer section --------------------------- */
  function initInstaller() {
    var cfg = CFG.INSTALLER || {};
    var btn = $('#siaDownloadBtn');
    var label = $('.sia-download-btn-label');
    var status = $('#siaDownloadStatus');
    if (!btn) return;

    function setMeta(id, val) {
      var el = $('#' + id);
      if (!el) return;
      if (val) el.textContent = val;
    }
    setMeta('metaPlatform', cfg.platform);
    setMeta('metaVersion', cfg.version);
    setMeta('metaRelease', cfg.releaseDate);
    setMeta('metaSize', cfg.fileSize);
    setMeta('metaOs', cfg.osRequirements);
    setMeta('metaChecksum', cfg.checksum);

    var docs = $('#siaDocsLink');
    if (cfg.docsUrl && docs) docs.setAttribute('href', cfg.docsUrl);

    if (cfg.url) {
      btn.disabled = false;
      btn.classList.remove('is-disabled');
      if (label) label.textContent = 'Download Installer';
      if (status) { status.className = 'sia-download-status'; status.style.display = 'none'; }
      btn.addEventListener('click', function () {
        var a = document.createElement('a');
        a.href = cfg.url;
        a.download = cfg.fileName || '';
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
      });
    } else {
      btn.disabled = true;
      btn.classList.add('is-disabled');
      if (label) label.textContent = 'Not available yet';
      if (status) { status.className = 'sia-download-status is-info'; status.style.display = 'block'; }
    }
  }

  /* ------------------------------- POC form -------------------------------- */
  function initPOC() {
    var form = $('#pocForm');
    if (!form) return;
    var submitBtn = $('#pocSubmit');
    var feedback = $('#pocFeedback');
    attachFieldValidation(form);

    form.addEventListener('submit', function (e) {
      e.preventDefault();
      clearFeedback(feedback);

      var honey = $('#pocWebsite');
      if (honey && honey.value.trim() !== '') return;

      if (!validateForm(form)) {
        showFeedback(feedback, 'error', 'Please fix the highlighted fields.',
          'Some required fields need your attention before submitting.');
        var firstErr = form.querySelector('.sia-field.has-error input, .sia-field.has-error select, .sia-field.has-error textarea');
        if (firstErr) firstErr.focus();
        return;
      }

      var cfg = CFG.POC || {};
      if (!cfg.endpoint) {
        showFeedback(feedback, 'error', 'Submission is temporarily unavailable.',
          'We could not transmit your request because the POC request endpoint has not been configured yet. ' +
          'Please email <a href="mailto:' + (CFG.CONTACT && CFG.CONTACT.email) + '">' +
          (CFG.CONTACT && CFG.CONTACT.email) + '</a> or call ' +
          (CFG.CONTACT && CFG.CONTACT.phone) + ' and our team will assist you.');
        return;
      }

      var payload = {
        _token: getCSRF(),
        formName: 'POC Request',
        product: 'SIA',
        name: form.name.value.trim(),
        email: form.email.value.trim(),
        company: form.company.value.trim(),
        useCase: form.useCase.value,
        phone: form.phone.value.trim(),
        jobTitle: form.jobTitle.value.trim(),
        orgSize: form.orgSize.value.trim(),
        deploymentModel: form.deploymentModel.value,
        requirements: form.requirements.value.trim()
      };

      setSubmitting(submitBtn, true);

      fetch(cfg.endpoint, {
        method: (cfg.method || 'POST').toUpperCase(),
        headers: {
          'Content-Type': 'application/json',
          'X-Requested-With': 'XMLHttpRequest',
          'X-CSRF-TOKEN': payload._token
        },
        body: JSON.stringify(payload)
      })
        .then(function (res) { return res.json().catch(function () { return {}; }).then(function (d) { return { ok: res.ok, data: d }; }); })
        .then(function (r) {
          setSubmitting(submitBtn, false);
          if (r.ok && (r.data.data === 'success' || r.data.success)) {
            form.reset();
            showFeedback(feedback, 'success', 'POC request submitted successfully.',
              'Our team will review your requirements and contact you regarding the next steps.');
            feedback.scrollIntoView({ behavior: REDUCED ? 'auto' : 'smooth', block: 'center' });
          } else {
            showFeedback(feedback, 'error', 'We could not submit your request.',
              (r.data && r.data.message) ? r.data.message :
              'Please try again in a moment, or contact us directly at ' +
              (CFG.CONTACT && CFG.CONTACT.email) + '.');
          }
        })
        .catch(function () {
          setSubmitting(submitBtn, false);
          showFeedback(feedback, 'error', 'Network error.',
            'We could not reach the server. Please check your connection and try again, ' +
            'or email ' + (CFG.CONTACT && CFG.CONTACT.email) + '.');
        });
    });
  }

  /* ------------------------------- Demo modal ------------------------------ */
  function initDemo() {
    var demoModalEl = $('#requestDemo');
    if (!demoModalEl) return;
    var modal = new bootstrap.Modal(demoModalEl, { backdrop: 'static', keyboard: false });
    var form = $('#demoForm');
    var submitBtn = $('#demoSubmit');
    var feedback = $('#demoFeedback');
    var cfg = CFG.DEMO || {};

    attachFieldValidation(form);

    $all('[data-open-demo]').forEach(function (btn) {
      btn.addEventListener('click', function () {
        var product = btn.getAttribute('data-product') || 'SIA';
        var p = $('#demoProduct'); if (p) p.value = product;
        var fn = $('#demoFormName'); if (fn) fn.value = 'Demo Request';
        var title = $('#requestDemoTitle');
        if (title) title.textContent = 'Request a Demo — ' + product;
        clearFeedback(feedback);
        form.classList.remove('was-validated');
        $all('.sia-field', form).forEach(function (f) { f.classList.remove('has-error'); });
        modal.show();
      });
    });

    form.addEventListener('submit', function (e) {
      e.preventDefault();
      clearFeedback(feedback);

      var honey = $('#demoWebsite');
      if (honey && honey.value.trim() !== '') return;

      if (!validateForm(form)) {
        showFeedback(feedback, 'error', 'Please fix the highlighted fields.',
          'Some required fields need your attention before submitting.');
        var firstErr = form.querySelector('.sia-field.has-error input, .sia-field.has-error select, .sia-field.has-error textarea');
        if (firstErr) firstErr.focus();
        return;
      }

      if (!cfg.endpoint) {
        showFeedback(feedback, 'error', 'Submission is temporarily unavailable.',
          'The demo request endpoint is not configured. Please email ' +
          (CFG.CONTACT && CFG.CONTACT.email) + ' to schedule a demo.');
        return;
      }

      var payload = {
        _token: getCSRF(),
        formName: $('#demoFormName').value,
        product: $('#demoProduct').value,
        name: form.name.value.trim(),
        designation: form.designation.value.trim(),
        company: form.company.value.trim(),
        emailId: form.emailId.value.trim(),
        contact: form.contact.value.trim(),
        demoDate: form.demoDate.value,
        description: form.description.value.trim()
      };

      setSubmitting(submitBtn, true);

      var body = new URLSearchParams();
      Object.keys(payload).forEach(function (k) { body.append(k, payload[k]); });

      fetch(cfg.endpoint, {
        method: (cfg.method || 'POST').toUpperCase(),
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
          'X-Requested-With': 'XMLHttpRequest',
          'X-CSRF-TOKEN': payload._token
        },
        body: body.toString()
      })
        .then(function (res) { return res.json().catch(function () { return {}; }).then(function (d) { return { ok: res.ok, data: d }; }); })
        .then(function (r) {
          setSubmitting(submitBtn, false);
          if (r.ok && (r.data.data === 'success' || r.data.success)) {
            form.reset();
            modal.hide();
            if (cfg.successRedirect) {
              window.location.href = cfg.successRedirect;
            } else {
              showFeedback(feedback, 'success', 'Demo request submitted.', 'We will contact you shortly.');
            }
          } else {
            showFeedback(feedback, 'error', 'We could not submit your request.',
              (r.data && r.data.message) ? r.data.message :
              'Please try again, or email ' + (CFG.CONTACT && CFG.CONTACT.email) + '.');
          }
        })
        .catch(function () {
          setSubmitting(submitBtn, false);
          showFeedback(feedback, 'error', 'Network error.',
            'We could not reach the server. Please try again or email ' +
            (CFG.CONTACT && CFG.CONTACT.email) + '.');
        });
    });

    demoModalEl.addEventListener('hidden.bs.modal', function () {
      clearFeedback(feedback);
      $all('.sia-field', form).forEach(function (f) { f.classList.remove('has-error'); });
    });
  }

  /* --------------------------- Smooth anchor scroll ------------------------ */
  function initSmoothScroll() {
    if (REDUCED) return;
    $all('a[href^="#"]').forEach(function (a) {
      a.addEventListener('click', function (e) {
        var id = a.getAttribute('href');
        if (!id || id === '#' || id.length < 2) return;
        var target = document.querySelector(id);
        if (!target) return;
        e.preventDefault();
        target.scrollIntoView({ behavior: 'smooth', block: 'start' });
        target.setAttribute('tabindex', '-1');
        target.focus({ preventScroll: true });
      });
    });
  }

  /* --------------------------------- Init ---------------------------------- */
  function init() {
    initReveal();
    initFAQ();
    initInstaller();
    initPOC();
    initDemo();
    initSmoothScroll();
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();