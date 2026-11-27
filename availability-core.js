(() => {
  'use strict';
  const datePattern = /^\d{4}-\d{2}-\d{2}$/;
  const allowedStatuses = ['pending', 'booked', 'unavailable'];
  const date = key => new Date(`${key}T00:00:00Z`);
  const labelDate = key => date(key).toLocaleDateString('en-NZ', {timeZone:'UTC', day:'numeric', month:'long', year:'numeric'});
  const todayIn = timeZone => new Intl.DateTimeFormat('en-CA', {timeZone, year:'numeric', month:'2-digit', day:'2-digit'}).format(new Date());

  function validate(value) {
    if (!datePattern.test(value.seasonStart) || !datePattern.test(value.seasonEnd) || value.seasonStart > value.seasonEnd || !value.days || typeof value.days !== 'object' || Array.isArray(value.days)) throw Error('Invalid calendar data');
    for (const [key, entry] of Object.entries(value.days)) {
      if (!datePattern.test(key) || !entry || !allowedStatuses.includes(entry.status)) throw Error('Invalid day status');
    }
    return value;
  }

  async function fetchData(filename) {
    const sources = [new URL(filename, document.baseURI).href, `https://raw.githubusercontent.com/Skimanz/skiwithash-website/main/${filename}`];
    let error;
    for (const source of sources) {
      try {
        const url = new URL(source);
        url.searchParams.set('v', String(Date.now()));
        const response = await fetch(url.href, {cache:'no-store'});
        if (!response.ok) throw Error(`Calendar request failed: ${response.status}`);
        return validate(await response.json());
      } catch (cause) { error = cause; }
    }
    throw error || Error('Calendar unavailable');
  }

  function moveMonth(month, amount) {
    const value = date(`${month}-01`);
    value.setUTCMonth(value.getUTCMonth() + amount);
    return value.toISOString().slice(0, 7);
  }

  function renderMonth(options) {
    const {data, month, grid, monthLabel, previous, next, labels, selected, onSelect, minimumDate, pastLabel = 'Season closed'} = options;
    const first = date(`${month}-01`);
    const year = first.getUTCFullYear();
    const monthIndex = first.getUTCMonth();
    monthLabel.textContent = first.toLocaleDateString('en-NZ', {month:'long', year:'numeric', timeZone:'UTC'});
    previous.disabled = month <= data.seasonStart.slice(0, 7);
    next.disabled = month >= data.seasonEnd.slice(0, 7);
    grid.replaceChildren();
    for (let i = 0; i < (first.getUTCDay() + 6) % 7; i++) {
      const gap = document.createElement('span');
      gap.setAttribute('aria-hidden', 'true');
      grid.append(gap);
    }
    const count = new Date(Date.UTC(year, monthIndex + 1, 0)).getUTCDate();
    for (let dayNumber = 1; dayNumber <= count; dayNumber++) {
      const key = `${month}-${String(dayNumber).padStart(2, '0')}`;
      const status = data.days[key]?.status || 'available';
      const outside = key < data.seasonStart || key > data.seasonEnd || (minimumDate && key < minimumDate);
      const state = outside ? pastLabel : labels[status];
      const selectable = Boolean(onSelect) && !outside && status !== 'unavailable' && status !== 'booked';
      const tile = document.createElement(onSelect ? 'button' : 'div');
      if (onSelect) tile.type = 'button';
      tile.className = `availability-day ${outside ? 'past' : status}`;
      if (onSelect) tile.disabled = !selectable;
      tile.setAttribute('aria-label', `${labelDate(key)}: ${state}${status === 'pending' ? ', enquire as backup' : ''}`);
      const number = document.createElement('strong');
      number.textContent = dayNumber;
      const tag = document.createElement('span');
      tag.textContent = state;
      tile.append(number, tag);
      if (selected) {
        tile.setAttribute('aria-pressed', String(selected.has(key)));
        tile.classList.toggle('selected', selected.has(key));
      }
      if (selectable) tile.addEventListener('click', () => onSelect(key, tile));
      grid.append(tile);
    }
  }

  window.AvailabilityCalendar = {fetchData, labelDate, moveMonth, renderMonth, todayIn};
})();
