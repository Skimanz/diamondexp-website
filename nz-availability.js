(() => {
  'use strict';
  const root = document.getElementById('nz-availability');
  const form = document.getElementById('nz-booking-enquiry');
  const enquiry = document.getElementById('nz-enquiry-modal');
  if (!root || !form || !enquiry) return;

  const openCalendar = () => {
    if (!root.open) root.showModal();
    document.getElementById('nz-availability-title').focus();
  };
  document.querySelectorAll('[data-open-nz-availability]').forEach(button => button.addEventListener('click', openCalendar));
  root.querySelector('[data-close-nz-availability]').addEventListener('click', () => root.close());
  root.addEventListener('click', event => { if (event.target === root) root.close(); });
  enquiry.querySelector('.jp-modal-close').addEventListener('click', () => enquiry.close());
  enquiry.addEventListener('click', event => { if (event.target === enquiry) enquiry.close(); });

  const grid = root.querySelector('[data-calendar]');
  const monthLabel = root.querySelector('[data-month]');
  const previous = root.querySelector('[data-previous]');
  const next = root.querySelector('[data-next]');
  const notice = root.querySelector('[data-calendar-notice]');
  const nextStep = root.querySelector('[data-continue-dates]');
  const summary = root.querySelector('[data-selection-summary]');
  const selected = new Set();
  const datePattern = /^\d{4}-\d{2}-\d{2}$/;
  const date = key => new Date(`${key}T00:00:00Z`);
  const label = key => date(key).toLocaleDateString('en-NZ', {timeZone:'UTC', day:'numeric', month:'long', year:'numeric'});
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
    const first = date(`${month}-01`);
    const year = first.getUTCFullYear();
    const monthIndex = first.getUTCMonth();
    monthLabel.textContent = first.toLocaleDateString('en-NZ', {month:'long', year:'numeric', timeZone:'UTC'});
    previous.disabled = month <= data.seasonStart.slice(0,7);
    next.disabled = month >= data.seasonEnd.slice(0,7);
    grid.replaceChildren();
    for (let i = 0; i < (first.getUTCDay() + 6) % 7; i++) {
      const gap = document.createElement('span');
      gap.setAttribute('aria-hidden', 'true');
      grid.append(gap);
    }
    const count = new Date(Date.UTC(year, monthIndex + 1, 0)).getUTCDate();
    for (let day = 1; day <= count; day++) {
      const key = `${month}-${String(day).padStart(2, '0')}`;
      const status = data.days[key]?.status || 'available';
      const outside = key < data.seasonStart || key > data.seasonEnd;
      const button = document.createElement('button');
      button.type = 'button';
      button.className = `availability-day ${outside ? 'past' : status}`;
      button.disabled = outside || status === 'unavailable';
      const state = outside ? 'Season closed' : {available:'Available', pending:'Pending', unavailable:'Unavailable'}[status];
      button.setAttribute('aria-label', `${label(key)}: ${state}${status === 'pending' ? ', enquire as backup' : ''}`);
      const number = document.createElement('strong');
      number.textContent = day;
      const tag = document.createElement('span');
      tag.textContent = state;
      button.append(number, tag);
      button.setAttribute('aria-pressed', String(selected.has(key)));
      if (selected.has(key)) button.classList.add('selected');
      if (!button.disabled) button.addEventListener('click', () => {
        if (selected.has(key)) selected.delete(key); else selected.add(key);
        button.setAttribute('aria-pressed', String(selected.has(key)));
        button.classList.toggle('selected', selected.has(key));
        updateSelection();
      });
      grid.append(button);
    }
  }

  function move(amount) {
    const value = date(`${month}-01`);
    value.setUTCMonth(value.getUTCMonth() + amount);
    month = value.toISOString().slice(0,7);
    draw();
  }
  previous.addEventListener('click', () => move(-1));
  next.addEventListener('click', () => move(1));

  fetch('nz-availability.json', {cache:'no-store'})
    .then(response => { if (!response.ok) throw Error('Availability unavailable'); return response.json(); })
    .then(value => {
      if (!datePattern.test(value.seasonStart) || !datePattern.test(value.seasonEnd) || value.seasonStart > value.seasonEnd || !value.days || typeof value.days !== 'object' || Array.isArray(value.days)) throw Error('Invalid calendar');
      data = value;
      month = data.seasonStart.slice(0,7);
      draw();
      notice.textContent = `New Zealand time · 14 June–10 October 2027 · Updated ${label(value.updatedAt)}`;
    })
    .catch(() => {
      grid.replaceChildren();
      previous.disabled = true;
      next.disabled = true;
      monthLabel.textContent = 'Please check with Ash';
      notice.textContent = 'The calendar could not be loaded. Please enquire directly to check your dates.';
    });
})();
