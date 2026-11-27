(() => {
  'use strict';
  const calendar = window.AvailabilityCalendar;
  if (!calendar) return;
  const configs = {
    japan: {filename:'availability.json', eyebrow:'Niseko · Japan · December 2026 – March 2027', intro:'Check dates for private ski coaching and guiding with Ash. Availability may change as enquiries are confirmed. All dates are Japan local time.', labels:{available:'Enquire',pending:'On Hold',booked:'Booked',unavailable:'Unavailable'}, legend:['Enquire — open','On Hold — backup enquiries welcome','Booked — guest booking','Unavailable — other commitment'], note:'You can send a backup enquiry for dates marked On Hold. If your preferred date is blocked, contact Ash to discuss options.', link:'/japan.html#availability', button:'Enquire about Japan dates', location:'Japan'},
    newzealand: {filename:'nz-availability.json', eyebrow:'Queenstown · New Zealand · June–October 2027', intro:'Check dates for private ski coaching with Ash in Queenstown. Availability may change as work and enquiries are confirmed. All dates are New Zealand local time.', labels:{available:'Available',pending:'On Hold',booked:'Booked',unavailable:'Unavailable'}, legend:['Available — open','On Hold — backup enquiries welcome','Booked — guest booking','Unavailable — other commitment'], note:'You can send a backup enquiry for dates marked On Hold. Final lesson availability and booking are confirmed through NZSki.', link:'/new-zealand.html#nz-availability', button:'Enquire about New Zealand dates', location:'New Zealand'}
  };
  const elements = {
    eyebrow:document.querySelector('[data-availability-eyebrow]'), intro:document.querySelector('[data-availability-intro]'), legend:document.querySelector('[data-availability-legend]'), grid:document.getElementById('calendar'), month:document.getElementById('month'), notice:document.getElementById('notice'), previous:document.getElementById('prev'), next:document.getElementById('next'), note:document.querySelector('[data-availability-note]'), link:document.querySelector('[data-availability-link]'), tabs:[...document.querySelectorAll('[data-availability-country]')]
  };
  let data, month, active = 'japan', request = 0;
  function draw() { calendar.renderMonth({data, month, grid:elements.grid, monthLabel:elements.month, previous:elements.previous, next:elements.next, labels:configs[active].labels, pastLabel:'—'}); }
  async function show(country) {
    const config = configs[country];
    if (!config) return;
    active = country;
    const currentRequest = ++request;
    elements.tabs.forEach(tab => { const selected = tab.dataset.availabilityCountry === country; tab.setAttribute('aria-selected', String(selected)); tab.tabIndex = selected ? 0 : -1; });
    elements.eyebrow.textContent = config.eyebrow;
    elements.intro.textContent = config.intro;
    elements.legend.querySelectorAll('span').forEach((item, index) => item.lastChild.textContent = config.legend[index]);
    elements.note.textContent = config.note;
    elements.link.href = config.link;
    elements.link.textContent = config.button;
    elements.month.textContent = 'Loading…';
    elements.grid.replaceChildren();
    elements.previous.disabled = elements.next.disabled = true;
    elements.notice.textContent = `Loading ${config.location} availability…`;
    try {
      const value = await calendar.fetchData(config.filename);
      if (currentRequest !== request) return;
      data = value;
      month = data.seasonStart.slice(0, 7);
      draw();
      elements.notice.textContent = `${config.location} local dates · Updated ${calendar.labelDate(data.updatedAt)}`;
    } catch (error) {
      console.error(`${config.location} availability page load failed`, error);
      elements.month.textContent = 'Availability unavailable';
      elements.notice.textContent = 'Please contact Ash to check your preferred dates.';
    }
  }
  elements.previous.addEventListener('click', () => { month = calendar.moveMonth(month, -1); draw(); });
  elements.next.addEventListener('click', () => { month = calendar.moveMonth(month, 1); draw(); });
  elements.tabs.forEach(tab => tab.addEventListener('click', () => show(tab.dataset.availabilityCountry)));
  show(new URLSearchParams(location.search).get('country') === 'nz' ? 'newzealand' : 'japan');
})();
