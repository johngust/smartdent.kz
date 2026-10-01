/**
 * SmartDent Guard — Invisible Anti-Bot & Human Verification System
 * 
 * Provides transparent, 100% zero-friction verification for real patients.
 * Blocks automated scrapers, headless browsers (Puppeteer/Selenium), curl/python scripts,
 * and malicious honeypot spiders without third-party cloud dependencies.
 */

const BOT_STORAGE_KEY = '__sd_guard_flag';
const VERIFIED_STORAGE_KEY = '__sd_guard_pass';
const TG_HANDLE = 'smartdent_kz';
const TG_BASE_URL = `https://t.me/${TG_HANDLE}`;

class SmartDentGuard {
  constructor() {
    this.isBot = false;
    this.isVerified = false;
    this.modalOpenedAt = 0;
    this.interactionScore = 0;
  }

  init() {
    // 1. Check if visitor was previously flagged as bot
    try {
      if (sessionStorage.getItem(BOT_STORAGE_KEY) === 'bot') {
        this.isBot = true;
        this.renderBlockedView();
        return;
      }
    } catch (e) {}

    // 2. Allow official search engine crawlers (Google, Yandex) for SEO without breaking indexation
    if (this.isSearchEngineCrawler()) {
      return;
    }

    // 3. Inspect browser environment for automation & headless signatures
    const envCheck = this.inspectEnvironment();
    if (envCheck.isAutomation) {
      this.flagAsBot(`Automation signature: ${envCheck.reason}`);
      return;
    }

    // 4. Check if already verified in this session
    try {
      if (sessionStorage.getItem(VERIFIED_STORAGE_KEY)) {
        this.markVerified(false);
        this.initHoneypots();
        return;
      }
    } catch (e) {}

    // 5. Setup human presence heuristics (passive & natural)
    this.listenHumanPresence();
    this.initHoneypots();

    // 6. Fast-path fallback: If environment is clean and passes hardware GPU inspection,
    // verify automatically in 400ms so humans never experience delays even if idle.
    setTimeout(() => {
      if (!this.isBot && !this.isVerified) {
        this.markVerified(true);
      }
    }, 450);
  }

  isSearchEngineCrawler() {
    const ua = navigator.userAgent || '';
    return /(Googlebot|bingbot|YandexBot|YandexWebmaster|Mail\.RU_Bot|Baiduspider)/i.test(ua);
  }

  inspectEnvironment() {
    // A. Direct Webdriver flag (Selenium, Puppeteer, Playwright)
    if (navigator.webdriver === true) {
      return { isAutomation: true, reason: 'navigator.webdriver' };
    }

    // B. Automation properties on window
    const automationGlobals = [
      '_phantom',
      'callPhantom',
      '__nightmare',
      '_selenium',
      'domAutomation',
      'domAutomationController',
      '__webdriver_evaluate',
      '__selenium_evaluate',
      '__webdriver_script_function',
      '__puppeteer_evaluation_script__'
    ];
    for (const prop of automationGlobals) {
      if (prop in window) {
        return { isAutomation: true, reason: `global_${prop}` };
      }
    }

    // C. Webdriver attribute on HTML tag
    if (document.documentElement && document.documentElement.getAttribute('webdriver')) {
      return { isAutomation: true, reason: 'html_webdriver_attr' };
    }

    // D. Headless Chrome UA signature
    if (/HeadlessChrome/i.test(navigator.userAgent)) {
      return { isAutomation: true, reason: 'headless_ua' };
    }

    // E. Screen anomalies (headless runners often have 0x0 screens)
    if (window.screen && (window.screen.width === 0 || window.screen.height === 0)) {
      return { isAutomation: true, reason: 'zero_screen_dimensions' };
    }

    // F. Languages anomaly
    if (!navigator.languages || navigator.languages.length === 0) {
      return { isAutomation: true, reason: 'empty_languages' };
    }

    // G. Software WebGL renderer check (cloud servers without hardware GPU)
    const glRenderer = this.getWebGLRenderer();
    if (glRenderer) {
      const isSoftwareGPU = /(SwiftShader|llvmpipe|Mesa OffScreen|VirtualBox)/i.test(glRenderer);
      if (isSoftwareGPU) {
        // If software GPU AND missing plugins/touch, high chance of headless scraper
        if (!navigator.plugins || navigator.plugins.length === 0) {
          return { isAutomation: true, reason: `software_gpu_${glRenderer}` };
        }
      }
    }

    return { isAutomation: false };
  }

  getWebGLRenderer() {
    try {
      const canvas = document.createElement('canvas');
      const gl = canvas.getContext('webgl') || canvas.getContext('experimental-webgl');
      if (!gl) return '';
      const debugInfo = gl.getExtension('WEBGL_debug_renderer_info');
      if (!debugInfo) return '';
      return gl.getParameter(debugInfo.UNMASKED_RENDERER_WEBGL) || '';
    } catch (e) {
      return '';
    }
  }

  listenHumanPresence() {
    const onHumanSignal = (e) => {
      if (this.isVerified || this.isBot) return;

      // Ensure event is genuine user action, not synthetic .dispatchEvent()
      if (e && e.isTrusted === false) {
        return;
      }

      this.interactionScore += 1;
      if (this.interactionScore >= 1) {
        this.markVerified(true);
        cleanup();
      }
    };

    const cleanup = () => {
      window.removeEventListener('mousemove', onHumanSignal);
      window.removeEventListener('touchstart', onHumanSignal);
      window.removeEventListener('scroll', onHumanSignal);
      window.removeEventListener('keydown', onHumanSignal);
      window.removeEventListener('click', onHumanSignal);
    };

    window.addEventListener('mousemove', onHumanSignal, { passive: true, once: true });
    window.addEventListener('touchstart', onHumanSignal, { passive: true, once: true });
    window.addEventListener('scroll', onHumanSignal, { passive: true, once: true });
    window.addEventListener('keydown', onHumanSignal, { passive: true, once: true });
    window.addEventListener('click', onHumanSignal, { passive: true, once: true });
  }

  markVerified(saveSession = true) {
    this.isVerified = true;
    if (saveSession) {
      try {
        const token = btoa(`${Date.now()}:${navigator.userAgent.slice(0, 15)}`);
        sessionStorage.setItem(VERIFIED_STORAGE_KEY, token);
      } catch (e) {}
    }

    // Uncloak and activate protected Telegram links for verified humans
    this.activateProtectedLinks();

    // Dispatch verification event for UI components
    window.dispatchEvent(new CustomEvent('smartdent:verified'));
  }

  activateProtectedLinks() {
    const protectedLinks = document.querySelectorAll('[data-tg-shield]');
    protectedLinks.forEach(link => {
      link.setAttribute('href', TG_BASE_URL);
      link.setAttribute('target', '_blank');
      link.setAttribute('rel', 'noopener noreferrer');
    });
  }

  initHoneypots() {
    // 1. Invisible crawler trap link
    const trapLink = document.getElementById('bot-trap-link');
    if (trapLink) {
      trapLink.addEventListener('click', (e) => {
        e.preventDefault();
        e.stopPropagation();
        this.flagAsBot('honeypot_link_clicked');
      });
    }

    // 2. Form honeypot inputs check
    const bookingForm = document.getElementById('booking-form');
    if (bookingForm) {
      bookingForm.addEventListener('submit', (e) => {
        const hpTitle = document.getElementById('hp_company_title');
        const hpEmail = document.getElementById('hp_direct_email');
        if ((hpTitle && hpTitle.value.trim() !== '') || (hpEmail && hpEmail.value.trim() !== '')) {
          e.preventDefault();
          e.stopPropagation();
          this.flagAsBot('honeypot_form_filled');
          return;
        }

        // Fast submit gate (less than 1.2s from modal opening)
        if (this.modalOpenedAt > 0 && (Date.now() - this.modalOpenedAt < 1200)) {
          e.preventDefault();
          e.stopPropagation();
          this.flagAsBot('fast_submission');
          return;
        }
      }, true);
    }
  }

  recordModalOpen() {
    this.modalOpenedAt = Date.now();
  }

  flagAsBot(reason) {
    this.isBot = true;
    try {
      sessionStorage.setItem(BOT_STORAGE_KEY, 'bot');
    } catch (e) {}
    console.warn('[SmartDent Guard] Security trigger:', reason);
    this.renderBlockedView();
  }

  renderBlockedView() {
    // Replace interactive content with a security notice
    const bookingModal = document.getElementById('booking-modal');
    if (bookingModal) {
      bookingModal.remove();
    }

    // Disable all booking buttons
    document.querySelectorAll('.open-booking-modal, [data-tg-shield]').forEach(el => {
      el.removeAttribute('href');
      el.style.pointerEvents = 'none';
      el.style.opacity = '0.5';
    });
  }
}

export const guard = new SmartDentGuard();
