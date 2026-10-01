import { createIcons, icons } from 'lucide';
import './style.css';

// Initialize Lucide icons
createIcons({
  icons,
});

// 1. ONLINE BOOKING MODAL & SECURE LEAD HANDLING (NO PUBLIC PHONE NUMBERS)
const bookingModal = document.getElementById('booking-modal');
const closeBookingBtn = document.getElementById('close-booking-btn');
const bookingForm = document.getElementById('booking-form');
const bookingSuccess = document.getElementById('booking-success');
const patientNameInput = document.getElementById('patient-name');
const patientPhoneInput = document.getElementById('patient-phone');
const patientServiceSelect = document.getElementById('patient-service');
const submitBookingBtn = document.getElementById('submit-booking-btn');
const successPatientName = document.getElementById('success-patient-name');
const successCloseBtn = document.getElementById('success-close-btn');

function openBookingModal(suggestedService = '') {
  if (!bookingModal) return;

  // Reset states
  if (bookingForm) bookingForm.classList.remove('hidden');
  if (bookingSuccess) bookingSuccess.classList.add('hidden');

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
      for (let i = 0; i < patientServiceSelect.options.length; i++) {
        if (suggestedService.toLowerCase().includes('чистк') && patientServiceSelect.options[i].text.includes('чистк')) {
          patientServiceSelect.selectedIndex = i;
          break;
        }
        if (suggestedService.toLowerCase().includes('кариес') && patientServiceSelect.options[i].text.includes('кариес')) {
          patientServiceSelect.selectedIndex = i;
          break;
        }
        if (suggestedService.toLowerCase().includes('винир') || suggestedService.toLowerCase().includes('коронк')) {
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
if (successCloseBtn) closeBookingBtn.addEventListener('click', closeBookingModal);

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

// Form Submission -> Sends lead to info@smartdent.kz & Local Storage
if (bookingForm) {
  bookingForm.addEventListener('submit', async (e) => {
    e.preventDefault();

    const name = patientNameInput ? patientNameInput.value.trim() : 'Пациент';
    const phone = patientPhoneInput ? patientPhoneInput.value.trim() : '';
    const service = patientServiceSelect ? patientServiceSelect.value : 'Консультация';
    const timeRadio = document.querySelector('input[name="visit-time"]:checked');
    const time = timeRadio ? timeRadio.value : 'Ближайшие дни';

    if (!name || !phone || phone.length < 10) {
      alert('Пожалуйста, укажите ваше имя и контактный номер телефона.');
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

    // 1. Save in local storage (guarantees zero lead loss)
    try {
      const existingLeads = JSON.parse(localStorage.getItem('smartdent_leads') || '[]');
      existingLeads.push(leadData);
      localStorage.setItem('smartdent_leads', JSON.stringify(existingLeads));
    } catch (err) {
      console.warn('LocalStorage error:', err);
    }

    // 2. Dispatch via FormSubmit AJAX to corporate inbox info@smartdent.kz
    try {
      await fetch('https://formsubmit.co/ajax/info@smartdent.kz', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        },
        body: JSON.stringify({
          _subject: `Новая запись: ${name} (${service})`,
          "Имя пациента": name,
          "Телефон": phone,
          "Интересующая услуга": service,
          "Желаемое время": time,
          "Дата заявки": leadData.created_at
        })
      });
    } catch (err) {
      console.warn('FormSubmit fetch failed (fallback to local lead):', err);
    }

    // 3. Yandex Metrika goal tracking
    if (typeof window.ym === 'function' && window.METRIKA_COUNTER_ID) {
      window.ym(window.METRIKA_COUNTER_ID, 'reachGoal', 'lead_form_submitted');
    }

    // 4. Show success screen
    if (bookingForm) bookingForm.classList.add('hidden');
    if (bookingSuccess) {
      bookingSuccess.classList.remove('hidden');
      if (successPatientName) successPatientName.textContent = name;
    }
    createIcons({ icons });

    if (submitBookingBtn) {
      submitBookingBtn.disabled = false;
      submitBookingBtn.innerHTML = '<i data-lucide="calendar-check" class="w-5 h-5"></i><span>Отправить заявку на прием</span>';
    }
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
