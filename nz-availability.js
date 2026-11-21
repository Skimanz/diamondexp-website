(() => {
  'use strict';
  const calendar = window.AvailabilityCalendar;
  const root = document.getElementById('nz-availability');
  const form = document.getElementById('nz-booking-enquiry');
  const enquiry = document.getElementById('nz-enquiry-modal');
  if (!root || !form || !enquiry || !calendar) return;

  const openCalendar = () => {
    if (!root.open) root.showModal();
    document.getElementById('nz-availability-title').focus();
  };
  document.querySelectorAll('[data-open-nz-availability]').forEach(button => button.addEventListener('click', openCalendar));
  root.querySelector('[data-close-nz-availability]').addEventListener('click', () => root.close());
  root.addEventListener('click', event => { if (event.target === root) root.close(); });
  enquiry.querySelector('.jp-modal-close').addEventListener('click', () => enquiry.close());
  enquiry.addEventListener('click', event => { if (event.target === enquiry) enquiry.close(); });
  const followHash = () => { if (location.hash === '#nz-availability') openCalendar(); };
  window.addEventListener('hashchange', followHash);
  followHash();

  const grid = root.querySelector('[data-calendar]');
  const monthLabel = root.querySelector('[data-month]');
  const previous = root.querySelector('[data-previous]');
  const next = root.querySelector('[data-next]');
  const notice = root.querySelector('[data-calendar-notice]');
  const nextStep = root.querySelector('[data-continue-dates]');
  const summary = root.querySelector('[data-selection-summary]');
  const selected = new Set();
  const label = calendar.labelDate;
  let data, month;

  function updateSelection() {
    const keys = [...selected].sort();
    summary.textContent = keys.length ? keys.map(label).join(' · ') : 'No dates selected';
    nextStep.disabled = !keys.length;
  }

  nextStep.addEventListener('click', () => {
    const keys = [...selected].sort();
    if (!keys.length) return;
    form.elements.dates.value = keys.map(label).join('; ');
    const pending = keys.filter(key => data.days[key]?.status === 'pending');
    const note = pending.length ? 'Backup request: ' + pending.map(label).join('; ') : '';
    form.dataset.availabilityContext = note;
    document.getElementById('nz-availability-selection').textContent = note;
    root.close();
    enquiry.showModal();
    form.elements.name.focus();
  });

  form.elements.dates.addEventListener('input', () => {
    form.dataset.availabilityContext = '';
    document.getElementById('nz-availability-selection').textContent = '';
  });

  function draw() {
    calendar.renderMonth({data, month, grid, monthLabel, previous, next, labels:{available:'Available',pending:'Pending',booked:'Booked',unavailable:'Unavailable'}, selected, pastLabel:'Season closed', onSelect:(key, button) => {
      if (selected.has(key)) selected.delete(key); else selected.add(key);
      button.setAttribute('aria-pressed', String(selected.has(key)));
      button.classList.toggle('selected', selected.has(key));
      updateSelection();
    }});
  }

  function move(amount) {
    month = calendar.moveMonth(month, amount);
    draw();
  }
  previous.addEventListener('click', () => move(-1));
  next.addEventListener('click', () => move(1));

  calendar.fetchData('nz-availability.json')
    .then(value => {
      data = value;
      month = data.seasonStart.slice(0,7);
      draw();
      notice.textContent = `New Zealand time · 14 June–10 October 2027 · Updated ${label(value.updatedAt)}`;
    })
    .catch(error => {
      console.error('NZ availability calendar load failed', error);
      grid.replaceChildren();
      previous.disabled = true;
      next.disabled = true;
      monthLabel.textContent = 'Please check with Ash';
      notice.textContent = 'The calendar could not be loaded. Please enquire directly to check your dates.';
    });
})();
