(() => {
  'use strict';
  const root = document.getElementById('availability');
  if (!root) return;
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
      const state = outside ? 'Past / closed' : {available:'Available',pending:'Pending',unavailable:'Unavailable'}[status];
      button.setAttribute('aria-label', `${label(key)}: ${state}${status==='pending'?', enquire as backup':''}`);
      const number = document.createElement('strong'); number.textContent = day;
      const tag = document.createElement('span'); tag.textContent = state;
      button.append(number,tag);
      if (!button.disabled) button.addEventListener('click', () => {
        const form = document.getElementById('japan-whatsapp-enquiry');
        form.elements.dates.value = label(key);
        const pending = status === 'pending';
        const context = document.getElementById('availability-selection');
        context.textContent = pending ? 'This date is pending. Your enquiry is for a backup place; it does not reserve the date.' : 'Ask Ash about this date. An enquiry does not reserve it.';
        // Do not replace the guest's own message when choosing another day.
        form.dataset.availabilityContext = pending ? 'Backup enquiry for a pending date.' : '';
        document.getElementById('japan-enquiry-modal').showModal();
        form.elements.name.focus();
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
      notice.textContent = `Availability updated ${label(value.updatedAt)}. Japan time. Available dates are open for enquiries and subject to Ash's confirmation.`;
    }).catch(() => {
      grid.replaceChildren(); previous.disabled=true; next.disabled=true;
      monthLabel.textContent='Please check with Ash';
      notice.textContent='The calendar could not be loaded. Please enquire directly to check your dates.';
    });
})();
