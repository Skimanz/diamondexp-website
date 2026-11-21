(() => {
  'use strict';
  const calendar = window.AvailabilityCalendar;
  const root = document.getElementById('availability');
  if (!root || !calendar) return;
  const openCalendar = () => { if (!root.open) root.showModal(); document.getElementById('availability-title').focus(); };
  document.querySelectorAll('[data-open-availability]').forEach(button => button.addEventListener('click', openCalendar));
  root.querySelector('[data-close-availability]').addEventListener('click', () => root.close());
  root.addEventListener('click', event => { if (event.target === root) root.close(); });
  const followHash = () => { if (location.hash === '#availability') openCalendar(); };
  window.addEventListener('hashchange', followHash);
  followHash();
  const grid = root.querySelector('[data-calendar]');
  const monthLabel = root.querySelector('[data-month]');
  const previous = root.querySelector('[data-previous]');
  const next = root.querySelector('[data-next]');
  const notice = root.querySelector('[data-calendar-notice]');
  const label = calendar.labelDate;
  const today = calendar.todayIn('Asia/Tokyo');
  let data, month;
  const selected = new Set();
  const nextStep = root.querySelector('[data-continue-dates]');
  const summary = root.querySelector('[data-selection-summary]');
  const form = document.getElementById('japan-whatsapp-enquiry');
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
    document.getElementById('availability-selection').textContent = note;
    root.close();
    document.getElementById('japan-enquiry-modal').showModal();
    form.elements.name.focus();
  });
  form.elements.dates.addEventListener('input', () => {
    form.dataset.availabilityContext = '';
    document.getElementById('availability-selection').textContent = '';
  });
  function draw() {
    calendar.renderMonth({data, month, grid, monthLabel, previous, next, labels:{available:'Enquire',pending:'Pending',booked:'Booked',unavailable:'Unavailable'}, selected, minimumDate:today, pastLabel:'Past / closed', onSelect:(key, button) => {
      if (selected.has(key)) selected.delete(key); else selected.add(key);
      button.setAttribute('aria-pressed', String(selected.has(key)));
      button.classList.toggle('selected', selected.has(key));
      updateSelection();
    }});
  }
  function move(amount) {
    month = calendar.moveMonth(month, amount); draw();
  }
  previous.addEventListener('click',()=>move(-1));
  next.addEventListener('click',()=>move(1));
  calendar.fetchData('availability.json')
    .then(value => {
      data=value;
      month = today < data.seasonStart ? data.seasonStart.slice(0,7) : today > data.seasonEnd ? data.seasonEnd.slice(0,7) : today.slice(0,7);
      draw();
      notice.textContent = `Japan time · Updated ${label(value.updatedAt)}`;
    }).catch(error => {
      console.error('Japan availability calendar load failed', error);
      grid.replaceChildren(); previous.disabled=true; next.disabled=true;
      monthLabel.textContent='Please check with Ash';
      notice.textContent='The calendar could not be loaded. Please enquire directly to check your dates.';
    });
})();
