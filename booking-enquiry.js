// Adapted from Basalt Capital temporary-contact public/site.js.
const spamReady = fetch('/api/form-config', {cache: 'no-store'})
  .then(async response => {
    if (!response.ok) throw new Error('The enquiry form is not available yet. Please email skiwithash@gmail.com.');
    const config = await response.json();
    if (!config.siteKey) throw new Error('Spam protection is unavailable.');
    await new Promise((resolve, reject) => {
      if (window.turnstile) { resolve(); return; }
      window.onSkiSpamReady = resolve;
      const script = document.createElement('script');
      script.src = 'https://challenges.cloudflare.com/turnstile/v0/api.js?onload=onSkiSpamReady&render=explicit';
      script.async = true;
      script.onerror = () => reject(new Error('Spam protection could not load. Please refresh and try again.'));
      document.head.append(script);
    });
    return config.siteKey;
  });
// Attach a rejection handler immediately, including while a modal is still closed.
spamReady.catch(() => {});
function showEnquiryConfirmation(form, receipt) {
  const modal = form.closest('dialog');
  if (!modal) return;
  const confirmation = document.createElement('section');
  confirmation.className = 'enquiry-success';
  confirmation.innerHTML = `
    <span class="enquiry-success-check" aria-hidden="true">✓</span>
    <p class="eyebrow">Ash Johns Ski</p>
    <h2>Enquiry received!</h2>
    <p>Thank you for getting in touch. Ash will be in touch to discuss your ski experience.</p>
    <p class="enquiry-success-reference">Your reference<br><strong></strong></p>
    <p class="enquiry-success-notice">This is an enquiry, not a confirmed booking.</p>
    <p class="enquiry-success-warning" hidden></p>
    <button class="button" type="button">Close</button>`;
  const heading = confirmation.querySelector('h2');
  heading.id = form.id + '-success-title';
  heading.tabIndex = -1;
  // The server reference is text, never HTML, and is displayed without alteration.
  confirmation.querySelector('strong').textContent = receipt.reference;
  if (receipt.notification !== 'accepted') {
    const warning = confirmation.querySelector('.enquiry-success-warning');
    warning.hidden = false;
    warning.textContent = receipt.message;
  }
  const previousLabel = modal.getAttribute('aria-labelledby');
  form.after(confirmation);
  form.hidden = true;
  modal.setAttribute('aria-labelledby', heading.id);
  confirmation.querySelector('button').addEventListener('click', () => modal.close());
  modal.addEventListener('close', () => {
    confirmation.remove();
    form.hidden = false;
    if (previousLabel === null) modal.removeAttribute('aria-labelledby');
    else modal.setAttribute('aria-labelledby', previousLabel);
  }, {once: true});
  modal.scrollTop = 0;
  heading.focus();
}
document.querySelectorAll('[data-booking-enquiry]').forEach(form => {
  let widget;
  const status = document.createElement('p');
  status.dataset.enquiryStatus = '';
  status.setAttribute('role', 'status');
  status.setAttribute('aria-live', 'polite');
  const spam = document.createElement('div');
  spam.style.gridColumn = status.style.gridColumn = '1 / -1';
  const actions = form.querySelector('.enquiry-send-actions');
  actions.before(spam, status);
  const emailButton = form.querySelector('[type="submit"][value="email"]');
  emailButton.disabled = true;
  const observer = new IntersectionObserver(entries => {
    if (!entries.some(entry => entry.isIntersecting)) return;
    observer.disconnect();
    spamReady.then(siteKey => {
      widget = window.turnstile.render(spam, {
        sitekey: siteKey, action: 'contact', theme: 'light', size: 'flexible',
        callback: () => { if (!form.dataset.submitting) emailButton.disabled = false; },
        'expired-callback': () => { emailButton.disabled = true; },
        'error-callback': () => {
          emailButton.disabled = true;
          status.textContent = 'Spam protection could not load. Please refresh or email skiwithash@gmail.com.';
        }
      });
    }).catch(error => { status.textContent = error.message; });
  });
  observer.observe(form);
  const email = form.elements.email;
  email.required = true;
  const destination = form.elements.destination;
  const product = form.elements.product;
  const japanOptions = product.innerHTML;
  const calendar = form.querySelector('[data-contact-calendar]');
  const calendarLabel = calendar?.querySelector('span');
  const terms = form.querySelector('[data-contact-terms]');
  const dates = form.elements.dates;
  const staying = form.elements.staying;
  const nzOptions = '<option value="" disabled selected>Select an experience</option><option>Premium Private Experience</option><option>Performance Private</option><option>Premium Family Private</option><option>Full Day Private Lesson</option><option>Half Day Private Lesson</option><option>Please advise</option>';
  const generalOptions = '<option value="" disabled selected>Select an experience</option><option>Private ski coaching</option><option>Race coaching</option><option>Instructor training</option><option>Please advise</option>';
  if (calendar) {
    calendar.addEventListener('click', () => {
      window.location.href = destination.value === 'New Zealand' ? 'new-zealand.html#nz-availability' : 'japan.html#availability';
    });
  }
  const updateDestination = () => {
      const value = destination.value;
      const isJapan = value === 'Japan';
      const isNZ = value === 'New Zealand';
      if (calendar) calendar.hidden = !isJapan && !isNZ;
      if (calendarLabel) calendarLabel.textContent = isNZ ? 'Check New Zealand availability' : 'Check Japan availability';
      product.innerHTML = isJapan ? japanOptions : isNZ ? nzOptions : generalOptions;
      if (dates) dates.placeholder = isNZ ? 'e.g. 14–18 July 2027' : isJapan ? 'e.g. 6–13 February 2027' : 'Tell me your preferred dates';
      if (staying) staying.placeholder = isNZ ? 'e.g. Queenstown' : isJapan ? 'e.g. Hirafu, Niseko Village, Kutchan' : 'Town or accommodation';
      if (terms) {
        terms.closest('.enquiry-terms').hidden = !isJapan && !isNZ;
        terms.textContent = isNZ ? 'NZSki terms & conditions' : 'Japan terms & conditions';
        terms.href = isNZ ? 'https://www.coronetpeak.co.nz/footer/terms-conditions' : 'japan.html#booking-terms';
        terms.target = isNZ ? '_blank' : '';
        terms.rel = isNZ ? 'noopener' : '';
      }
  };
  destination.addEventListener('change', updateDestination);
  updateDestination();
  form.addEventListener('submit', async event => {
    const channel = event.submitter?.value || 'email';
    if (!form.reportValidity()) { event.preventDefault(); return; }
    form.elements.availability_note.value = form.dataset.availabilityContext || '';
    event.preventDefault();
    if (form.dataset.submitting === 'true') return;
    if (channel === 'email') {
      if (widget === undefined || !window.turnstile.getResponse(widget)) {
        status.textContent = 'Please complete the spam protection check.';
        return;
      }
      form.dataset.submitting = 'true';
      const buttons = [...form.querySelectorAll('[type="submit"]')];
      const previousDisabled = buttons.map(button => button.disabled);
      status.textContent = '';
      buttons.forEach(button => { button.disabled = true; });
      try {
        const data = new FormData(form);
        data.set('channel', 'email');
        const response = await fetch(form.action, {
          method: 'POST', body: data, headers: {Accept: 'application/json'}
        });
        const receipt = await response.json();
        if (!response.ok || typeof receipt.reference !== 'string' || !receipt.reference.trim()) throw new Error(receipt.error || 'Submission could not be confirmed.');
        // A durable D1 save is a lead, not a confirmed booking or email delivery receipt.
        form.dispatchEvent(new CustomEvent('enquiry:success', {bubbles: true}));
        status.textContent = receipt.message + ' Reference: ' + receipt.reference;
        form.reset();
        form.dataset.availabilityContext = '';
        updateDestination();
        showEnquiryConfirmation(form, receipt);
      } catch (error) {
        status.textContent = error.message || 'Your enquiry could not be confirmed. Please try again or email skiwithash@gmail.com.';
      } finally {
        delete form.dataset.submitting;
        buttons.forEach((button, index) => { button.disabled = previousDisabled[index]; });
        emailButton.disabled = true;
        window.turnstile.reset(widget);
      }
      return;
    }
    window.trackSkiEnquiry?.('whatsapp_click', form);
    const data = new FormData(form);
    const lines = ["Hi Ash, I'd like to enquire about skiing.", ''];
    for (const [key, label] of [['name','Name'],['email','Email'],['destination','Destination'],['dates','Preferred dates'],['product','Lesson / experience'],['skiers','Number of skiers'],['ability','Ability'],['staying','Staying'],['message','Further information'],['availability_note','Availability']]) {
      const value = String(data.get(key) || '').trim();
      if (value) lines.push(label + ': ' + value);
    }
    window.location.href = 'https://wa.me/6421754626?text=' + encodeURIComponent(lines.join('\n'));
  });
});
