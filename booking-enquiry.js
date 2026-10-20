document.querySelectorAll('[data-booking-enquiry]').forEach(form => {
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
    const updateDestination = () => {
      const value = destination.value;
      const isJapan = value === 'Japan';
      const isNZ = value === 'New Zealand';
      calendar.hidden = !isJapan && !isNZ;
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
  }
  form.addEventListener('submit', event => {
    const channel = event.submitter?.value || 'email';
    if (!form.reportValidity()) { event.preventDefault(); return; }
    form.elements.availability_note.value = form.dataset.availabilityContext || '';
    if (channel === 'email') return; // Existing email service handles the POST and delivery result.
    event.preventDefault();
    const data = new FormData(form);
    const lines = ["Hi Ash, I'd like to enquire about skiing.", ''];
    for (const [key, label] of [['name','Name'],['email','Email'],['destination','Destination'],['dates','Preferred dates'],['product','Lesson / experience'],['skiers','Number of skiers'],['ability','Ability'],['staying','Staying'],['message','Further information'],['availability_note','Availability']]) {
      const value = String(data.get(key) || '').trim();
      if (value) lines.push(label + ': ' + value);
    }
    window.location.href = 'https://wa.me/6421754626?text=' + encodeURIComponent(lines.join('\n'));
  });
});
