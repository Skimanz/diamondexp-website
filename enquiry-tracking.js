(() => {
  'use strict';
  if (window.trackSkiEnquiry) return;
  const events = new Set(['whatsapp_click', 'email_click', 'booking_click', 'generate_lead']);
  // Only fixed labels are sent. Never include link URLs, text, form values or query strings.
  window.trackSkiEnquiry = (name, element) => {
    if (!events.has(name) || typeof window.gtag !== 'function') return;
    const location = element.closest('footer') ? 'footer'
      : element.closest('header') ? 'header'
      : element.closest('form') ? 'enquiry_form'
      : element.closest('dialog') ? 'availability_dialog' : 'page_content';
    window.gtag('event', name, {button_location: location, transport_type: 'beacon'});
  };
  document.addEventListener('click', event => {
    const element = event.target.closest('a, button');
    if (!element) return;
    if (element.matches('[data-open-availability], [data-open-nz-availability], [data-contact-calendar], [data-continue-dates]')) {
      if (!element.disabled) window.trackSkiEnquiry('booking_click', element);
      return;
    }
    if (!element.matches('a')) return;
    const href = element.getAttribute('href') || '';
    if (/^mailto:/i.test(href)) window.trackSkiEnquiry('email_click', element);
    else if (/^https:\/\/wa\.me\/6421754626(?:[/?#]|$)/i.test(href)) window.trackSkiEnquiry('whatsapp_click', element);
  });
  document.addEventListener('enquiry:success', event => {
    if (event.target.matches('form[data-booking-enquiry]')) window.trackSkiEnquiry('generate_lead', event.target);
  });
})();
