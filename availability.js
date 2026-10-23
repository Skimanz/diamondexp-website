(() => {
  'use strict';
  const root = document.getElementById('availability');
  if (!root) return;
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
  const datePattern = /^\d{4}-\d{2}-\d{2}$/;
  const date = key => new Date(`${key}T00:00:00Z`);
  const label = key => date(key).toLocaleDateString('en-NZ', {timeZone:'UTC', day:'numeric', month:'long', year:'numeric'});
  const today = new Intl.DateTimeFormat('en-CA', {timeZone:'Asia/Tokyo', year:'numeric', month:'2-digit', day:'2-digit'}).format(new Date());
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
    const first = date(`${month}-01`);
    const year = first.getUTCFullYear(), m = first.getUTCMonth();
    monthLabel.textContent = first.toLocaleDateString('en-NZ', {month:'long', year:'numeric', timeZone:'UTC'});
    previous.disabled = month <= data.seasonStart.slice(0,7);
    next.disabled = month >= data.seasonEnd.slice(0,7);
    grid.replaceChildren();
    for (let i=0; i<(first.getUTCDay()+6)%7; i++) {
      const gap = document.createElement('span'); gap.setAttribute('aria-hidden','true'); grid.append(gap);
    }
    const count = new Date(Date.UTC(year,m+1,0)).getUTCDate();
    for (let day=1; day<=count; day++) {
      const key = `${month}-${String(day).padStart(2,'0')}`;
      const status = data.days[key]?.status || 'available';
      const outside = key < data.seasonStart || key > data.seasonEnd || key < today;
      const button = document.createElement('button');
      button.type = 'button'; button.className = `availability-day ${outside?'past':status}`;
      button.disabled = outside || status === 'unavailable';
      const state = outside ? 'Past / closed' : {available:'Enquire',pending:'Pending',unavailable:'Unavailable'}[status];
      button.setAttribute('aria-label', `${label(key)}: ${state}${status==='pending'?', enquire as backup':''}`);
      const number = document.createElement('strong'); number.textContent = day;
      const tag = document.createElement('span'); tag.textContent = state;
      button.append(number,tag);
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
    const d = date(`${month}-01`); d.setUTCMonth(d.getUTCMonth()+amount);
    month = d.toISOString().slice(0,7); draw();
  }
  previous.addEventListener('click',()=>move(-1));
  next.addEventListener('click',()=>move(1));
  fetch('availability.json', {cache:'no-store'})
    .then(response => {if (!response.ok) throw Error('Availability unavailable');return response.json();})
    .then(value => {
      if (!datePattern.test(value.seasonStart) || !datePattern.test(value.seasonEnd) || value.seasonStart>value.seasonEnd || !value.days || typeof value.days!=='object' || Array.isArray(value.days)) throw Error('Invalid calendar');
      for (const [key,entry] of Object.entries(value.days)) {
        if (!datePattern.test(key) || !entry || !['pending','unavailable'].includes(entry.status)) throw Error('Invalid date status');
      }
      data=value;
      month = today < data.seasonStart ? data.seasonStart.slice(0,7) : today > data.seasonEnd ? data.seasonEnd.slice(0,7) : today.slice(0,7);
      draw();
      notice.textContent = `Japan time · Updated ${label(value.updatedAt)}`;
    }).catch(() => {
      grid.replaceChildren(); previous.disabled=true; next.disabled=true;
      monthLabel.textContent='Please check with Ash';
      notice.textContent='The calendar could not be loaded. Please enquire directly to check your dates.';
    });
})();
