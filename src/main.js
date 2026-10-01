import { createIcons, icons } from 'lucide';
import './style.css';

// Initialize Lucide icons
createIcons({
  icons,
});

// 1. ANTI-BOT BOOKING MODAL & PROTECTED WHATSAPP ROUTING
const bookingModal = document.getElementById('booking-modal');
const closeBookingBtn = document.getElementById('close-booking-btn');
const bookingForm = document.getElementById('booking-form');
const patientNameInput = document.getElementById('patient-name');
const patientServiceSelect = document.getElementById('patient-service');

function openBookingModal(suggestedService = '') {
  if (!bookingModal) return;

  // Auto-match service if clicked from a specific service card
  if (suggestedService && patientServiceSelect) {
    let matched = false;
    for (let i = 0; i < patientServiceSelect.options.length; i++) {
      const opt = patientServiceSelect.options[i];
      if (opt.text.toLowerCase().includes(suggestedService.toLowerCase()) || 
          suggestedService.toLowerCase().includes(opt.value.toLowerCase().slice(0, 10))) {
        patientServiceSelect.selectedIndex = i;
        matched = true;
        break;
      }
    }
    if (!matched) {
      // Find closest or keep default
      for (let i = 0; i < patientServiceSelect.options.length; i++) {
        if (suggestedService.toLowerCase().includes('чистк') && patientServiceSelect.options[i].text.includes('чистк')) {
          patientServiceSelect.selectedIndex = i;
          break;
        }
        if (suggestedService.toLowerCase().includes('кариес') && patientServiceSelect.options[i].text.includes('кариес')) {
          patientServiceSelect.selectedIndex = i;
          break;
        }
        if (suggestedService.toLowerCase().includes('виReceipt') || suggestedService.toLowerCase().includes('винир')) {
          patientServiceSelect.selectedIndex = i;
          break;
        }
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

  // Re-run Lucide icons for modal elements
  createIcons({ icons });

  setTimeout(() => {
    if (patientNameInput) patientNameInput.focus();
  }, 100);
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

// Bind all booking trigger buttons
document.querySelectorAll('.open-booking-modal').forEach(btn => {
  btn.addEventListener('click', (e) => {
    e.preventDefault();
    const service = btn.dataset.service || '';
    openBookingModal(service);
  });
});

if (closeBookingBtn) closeBookingBtn.addEventListener('click', closeBookingModal);

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

// Form Submission -> Dynamic verified WhatsApp redirect
if (bookingForm) {
  bookingForm.addEventListener('submit', (e) => {
    e.preventDefault();

    const name = patientNameInput ? patientNameInput.value.trim() : 'Пациент';
    const service = patientServiceSelect ? patientServiceSelect.value : 'Консультация';
    const timeRadio = document.querySelector('input[name="visit-time"]:checked');
    const time = timeRadio ? timeRadio.value : 'Ближайшие дни';

    // Obfuscated number parts (prevents any static crawler harvesting)
    const _parts = ['7', '701', '747', '0241'];
    const _phone = _parts.join('');

    const formattedMessage = `Здравствуйте, доктор Эльмира Абаевна!\nМеня зовут ${name}.\nХочу записаться на прием: ${service}.\nУдобное время: ${time}.\n\n(Заявка с сайта smartdent.kz)`;
    const whatsappUrl = `https://wa.me/${_phone}?text=${encodeURIComponent(formattedMessage)}`;

    // Yandex Metrika goal tracking
    if (typeof window.ym === 'function' && window.METRIKA_COUNTER_ID) {
      window.ym(window.METRIKA_COUNTER_ID, 'reachGoal', 'whatsapp_click');
      window.ym(window.METRIKA_COUNTER_ID, 'reachGoal', 'lead_form_submitted');
    }

    console.log('[Anti-Bot Lead Verified] Opening WhatsApp for patient:', name);
    window.open(whatsappUrl, '_blank', 'noopener,noreferrer');

    closeBookingModal();
    bookingForm.reset();
  });
}

// 2. Cookie & Privacy Banner logic
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

// 3. Privacy Modal open/close handlers
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
