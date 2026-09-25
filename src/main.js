import { createIcons, icons } from 'lucide';
import './style.css';

// Initialize Lucide icons
createIcons({
  icons,
});

// Single unified message for ALL WhatsApp buttons
const UNIFIED_MESSAGE = encodeURIComponent('Здравствуйте! Пишу с сайта smartdent.kz');
const WHATSAPP_URL = `https://wa.me/77017470241?text=${UNIFIED_MESSAGE}`;

document.querySelectorAll('a[href*="wa.me"]').forEach(link => {
  // Set strictly the unified text
  link.href = WHATSAPP_URL;

  // Analytics event on click for Yandex Direct
  link.addEventListener('click', () => {
    if (typeof window.ym === 'function' && window.METRIKA_COUNTER_ID) {
      window.ym(window.METRIKA_COUNTER_ID, 'reachGoal', 'whatsapp_click');
    }
    console.log('[Lead] WhatsApp click:', link.href);
  });
});

// 2. Cookie & Privacy Banner logic
const cookieBanner = document.getElementById('cookie-banner');
const acceptCookieBtn = document.getElementById('accept-cookie-btn');
const privacyModal = document.getElementById('privacy-modal');
const openPrivacyBtn = document.getElementById('open-privacy-btn');
const bannerPrivacyLink = document.getElementById('banner-privacy-link');
const closePrivacyBtn = document.getElementById('close-privacy-btn');
const modalOkBtn = document.getElementById('modal-ok-btn');

// Check if user already accepted cookie
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
function openModal() {
  if (!privacyModal) return;
  privacyModal.classList.remove('opacity-0', 'pointer-events-none');
  document.body.style.overflow = 'hidden';
}

function closeModal() {
  if (!privacyModal) return;
  privacyModal.classList.add('opacity-0', 'pointer-events-none');
  document.body.style.overflow = '';
}

if (openPrivacyBtn) openPrivacyBtn.addEventListener('click', openModal);
if (bannerPrivacyLink) bannerPrivacyLink.addEventListener('click', openModal);
if (closePrivacyBtn) closePrivacyBtn.addEventListener('click', closeModal);
if (modalOkBtn) modalOkBtn.addEventListener('click', closeModal);

if (privacyModal) {
  privacyModal.addEventListener('click', (e) => {
    if (e.target === privacyModal) closeModal();
  });
}
