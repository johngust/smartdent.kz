import { createIcons, icons } from 'lucide';
import './style.css';
import { guard } from './guard';

// Initialize Lucide icons
createIcons({
  icons,
});

// Initialize SmartDent Guard (100% invisible bot & human verification shield)
guard.init();

// =========================================================================
// 1. CONFIGURATION (TELEGRAM CLINIC ROUTING)
// =========================================================================
export const TELEGRAM_USERNAME = 'smartdent_kz'; // @smartdent_kz
export const TELEGRAM_URL = `https://t.me/${TELEGRAM_USERNAME}`;

// DOM Elements
const bookingModal = document.getElementById('booking-modal');
const closeBookingBtn = document.getElementById('close-booking-btn');
const bookingTelegramView = document.getElementById('booking-telegram-view');
const telegramServiceSelect = document.getElementById('telegram-service-select');
const launchTelegramBtn = document.getElementById('launch-telegram-btn');
const switchToFormBtn = document.getElementById('switch-to-form-btn');
const backToTelegramBtn = document.getElementById('back-to-telegram-btn');

const bookingForm = document.getElementById('booking-form');
const bookingSuccess = document.getElementById('booking-success');
const patientNameInput = document.getElementById('patient-name');
const patientPhoneInput = document.getElementById('patient-phone');
const submitBookingBtn = document.getElementById('submit-booking-btn');
const successPatientName = document.getElementById('success-patient-name');
const successCloseBtn = document.getElementById('success-close-btn');

// =========================================================================
// 2. MODAL CONTROLS
// =========================================================================
function openBookingModal(suggestedService = '') {
  if (guard.isBot) return;
  guard.recordModalOpen();

  if (!bookingModal) return;

  // Default to Telegram View
  if (bookingTelegramView) bookingTelegramView.classList.remove('hidden');
  if (bookingForm) bookingForm.classList.add('hidden');
  if (bookingSuccess) bookingSuccess.classList.add('hidden');

  // Auto-match service in Telegram select
  if (suggestedService && telegramServiceSelect) {
    for (let i = 0; i < telegramServiceSelect.options.length; i++) {
      const opt = telegramServiceSelect.options[i];
      if (opt.text.toLowerCase().includes(suggestedService.toLowerCase()) || 
          suggestedService.toLowerCase().includes(opt.value.toLowerCase().slice(0, 8))) {
        telegramServiceSelect.selectedIndex = i;
        break;
      }
    }
  }

  bookingModal.classList.remove('opacity-0', 'pointer-events-none');
  const innerCard = bookingModal.querySelector('.transform');
  if (innerCard) {
    innerCard.classList.remove('scale-95');
    innerCard.classList.add('scale-100');
  }
  document.body.style.overflow = 'hidden';

  createIcons({ icons });
}

function closeBookingModal() {
  if (!bookingModal) return;
  bookingModal.classList.add('opacity-0', 'pointer-events-none');
  const innerCard = bookingModal.querySelector('.transform');
  if (innerCard) {
    innerCard.classList.remove('scale-100');
    innerCard.classList.add('scale-95');
  }
  document.body.style.overflow = '';
}

// Bind all booking trigger buttons on the page with human event verification
document.querySelectorAll('.open-booking-modal').forEach(btn => {
  btn.addEventListener('click', (e) => {
    if (guard.isBot || (e && e.isTrusted === false)) {
      e.preventDefault();
      return;
    }
    e.preventDefault();
    const service = btn.dataset.service || '';
    openBookingModal(service);
  });
});

// Protect direct telegram links
document.querySelectorAll('[data-tg-shield]').forEach(link => {
  link.addEventListener('click', (e) => {
    if (guard.isBot || (e && e.isTrusted === false)) {
      e.preventDefault();
      return;
    }
    const currentHref = link.getAttribute('href');
    if (!currentHref || currentHref.startsWith('javascript')) {
      e.preventDefault();
      window.open(TELEGRAM_URL, '_blank', 'noopener,noreferrer');
    }
  });
});

if (closeBookingBtn) closeBookingBtn.addEventListener('click', closeBookingModal);
if (successCloseBtn) successCloseBtn.addEventListener('click', closeBookingModal);

if (bookingModal) {
  bookingModal.addEventListener('click', (e) => {
    if (e.target === bookingModal) closeBookingModal();
  });
}

// Handle Escape key to close modals
document.addEventListener('keydown', (e) => {
  if (e.key === 'Escape') {
    closeBookingModal();
    closePrivacyModal();
  }
});

// View switching
if (switchToFormBtn) {
  switchToFormBtn.addEventListener('click', (e) => {
    if (guard.isBot || (e && e.isTrusted === false)) return;
    if (bookingTelegramView) bookingTelegramView.classList.add('hidden');
    if (bookingForm) {
      bookingForm.classList.remove('hidden');
      createIcons({ icons });
      setTimeout(() => {
        if (patientNameInput) patientNameInput.focus();
      }, 100);
    }
  });
}

if (backToTelegramBtn) {
  backToTelegramBtn.addEventListener('click', (e) => {
    if (guard.isBot || (e && e.isTrusted === false)) return;
    if (bookingForm) bookingForm.classList.add('hidden');
    if (bookingTelegramView) {
      bookingTelegramView.classList.remove('hidden');
      createIcons({ icons });
    }
  });
}

// =========================================================================
// 3. TELEGRAM LAUNCHER
// =========================================================================
if (launchTelegramBtn) {
  launchTelegramBtn.addEventListener('click', (e) => {
    if (guard.isBot || (e && e.isTrusted === false)) {
      e.preventDefault();
      return;
    }

    const service = telegramServiceSelect ? telegramServiceSelect.value : 'Консультация';
    const message = `Здравствуйте! Хочу записаться на прием в клинику «Смарт Дент».\nИнтересующая процедура: ${service}.\n(Заявка с сайта smartdent.kz)`;
    const telegramUrl = `https://t.me/${TELEGRAM_USERNAME}?text=${encodeURIComponent(message)}`;

    // Track analytics
    if (typeof window.ym === 'function' && window.METRIKA_COUNTER_ID) {
      window.ym(window.METRIKA_COUNTER_ID, 'reachGoal', 'telegram_click');
    }

    console.log('[Lead] Opening Telegram for service:', service);
    window.open(telegramUrl, '_blank', 'noopener,noreferrer');
    closeBookingModal();
  });
}

// Auto phone formatting for patient phone input
if (patientPhoneInput) {
  patientPhoneInput.addEventListener('input', (e) => {
    let val = e.target.value.replace(/\D/g, '');
    if (!val) {
      e.target.value = '';
      return;
    }
    if (val[0] === '8') val = '7' + val.slice(1);
    if (val[0] !== '7') val = '7' + val;

    let formatted = '+7';
    if (val.length > 1) formatted += ' (' + val.substring(1, 4);
    if (val.length >= 4) formatted += ') ' + val.substring(4, 7);
    if (val.length >= 7) formatted += '-' + val.substring(7, 9);
    if (val.length >= 9) formatted += '-' + val.substring(9, 11);

    e.target.value = formatted;
  });
}

// =========================================================================
// 4. SECONDARY FORM SUBMISSION (FOR VISITORS WITHOUT TELEGRAM)
// =========================================================================
if (bookingForm) {
  bookingForm.addEventListener('submit', async (e) => {
    e.preventDefault();

    if (guard.isBot || (e && e.isTrusted === false)) {
      return;
    }

    // Check honeypot
    const hpTitle = document.getElementById('hp_company_title');
    const hpEmail = document.getElementById('hp_direct_email');
    if ((hpTitle && hpTitle.value.trim() !== '') || (hpEmail && hpEmail.value.trim() !== '')) {
      console.warn('Bot detected by honeypot');
      return;
    }

    const name = patientNameInput ? patientNameInput.value.trim() : 'Пациент';
    const phone = patientPhoneInput ? patientPhoneInput.value.trim() : '';
    const service = telegramServiceSelect ? telegramServiceSelect.value : 'Консультация';
    const timeRadio = document.querySelector('input[name="visit-time"]:checked');
    const time = timeRadio ? timeRadio.value : 'Ближайшие дни';

    if (!name || !phone || phone.length < 10) {
      alert('Пожалуйста, укажите ваше имя и контактный телефон.');
      return;
    }

    if (submitBookingBtn) {
      submitBookingBtn.disabled = true;
      submitBookingBtn.innerHTML = '<span>Отправка заявки...</span>';
    }

    const leadData = {
      name,
      phone,
      service,
      preferred_time: time,
      created_at: new Date().toLocaleString('ru-RU'),
      source: 'smartdent.kz'
    };

    // Save in local storage (zero lead loss)
    try {
      const existingLeads = JSON.parse(localStorage.getItem('smartdent_leads') || '[]');
      existingLeads.push(leadData);
      localStorage.setItem('smartdent_leads', JSON.stringify(existingLeads));
    } catch (err) {
      console.warn('LocalStorage error:', err);
    }

    // Dispatch via FormSubmit AJAX to corporate inbox info@smartdent.kz
    try {
      await fetch('https://formsubmit.co/ajax/info@smartdent.kz', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        },
        body: JSON.stringify({
          _subject: `Новая заявка с сайта: ${name} (${service})`,
          "Имя пациента": name,
          "Телефон": phone,
          "Интересующая услуга": service,
          "Желаемое время": time,
          "Дата заявки": leadData.created_at
        })
      });
    } catch (err) {
      console.warn('FormSubmit fetch fallback:', err);
    }

    if (typeof window.ym === 'function' && window.METRIKA_COUNTER_ID) {
      window.ym(window.METRIKA_COUNTER_ID, 'reachGoal', 'lead_form_submitted');
    }

    // Show success view
    if (bookingForm) bookingForm.classList.add('hidden');
    if (bookingSuccess) {
      bookingSuccess.classList.remove('hidden');
      if (successPatientName) successPatientName.textContent = name;
    }
    createIcons({ icons });

    if (submitBookingBtn) {
      submitBookingBtn.disabled = false;
      submitBookingBtn.innerHTML = '<i data-lucide="calendar-check" class="w-4 h-4"></i><span>Отправить заявку</span>';
    }
    bookingForm.reset();
  });
}

// =========================================================================
// 5. COOKIE & PRIVACY BANNER
// =========================================================================
const cookieBanner = document.getElementById('cookie-banner');
const acceptCookieBtn = document.getElementById('accept-cookie-btn');
const privacyModal = document.getElementById('privacy-modal');
const openPrivacyBtn = document.getElementById('open-privacy-btn');
const bannerPrivacyLink = document.getElementById('banner-privacy-link');
const closePrivacyBtn = document.getElementById('close-privacy-btn');
const modalOkBtn = document.getElementById('modal-ok-btn');

const hasAcceptedCookie = localStorage.getItem('smartdent_cookie_consent');
if (!hasAcceptedCookie && cookieBanner) {
  setTimeout(() => {
    cookieBanner.classList.remove('translate-y-32', 'opacity-0', 'pointer-events-none');
  }, 800);
}

if (acceptCookieBtn && cookieBanner) {
  acceptCookieBtn.addEventListener('click', () => {
    localStorage.setItem('smartdent_cookie_consent', 'true');
    cookieBanner.classList.add('translate-y-32', 'opacity-0', 'pointer-events-none');
  });
}

function openPrivacyModal() {
  if (!privacyModal) return;
  privacyModal.classList.remove('opacity-0', 'pointer-events-none');
  document.body.style.overflow = 'hidden';
}

function closePrivacyModal() {
  if (!privacyModal) return;
  privacyModal.classList.add('opacity-0', 'pointer-events-none');
  document.body.style.overflow = '';
}

if (openPrivacyBtn) openPrivacyBtn.addEventListener('click', openPrivacyModal);
if (bannerPrivacyLink) bannerPrivacyLink.addEventListener('click', openPrivacyModal);
if (closePrivacyBtn) closePrivacyBtn.addEventListener('click', closePrivacyModal);
if (modalOkBtn) modalOkBtn.addEventListener('click', closePrivacyModal);

if (privacyModal) {
  privacyModal.addEventListener('click', (e) => {
    if (e.target === privacyModal) closePrivacyModal();
  });
}
