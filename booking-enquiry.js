document.querySelectorAll('[data-booking-enquiry]').forEach(form => {
  const email = form.elements.email;
  email.required = true;
  const destination = form.elements.destination;
  const product = form.elements.product;
  const japanOptions = product.innerHTML;
  const calendar = form.querySelector('[data-contact-calendar]');
  if (calendar) {
    calendar.addEventListener('click', () => { window.location.href = 'japan.html#availability'; });
    destination.addEventListener('change', () => {
      calendar.hidden = destination.value !== 'Japan';
      product.innerHTML = destination.value === 'Japan' ? japanOptions : '<option value="" disabled selected>Select an experience</option><option>Private ski coaching</option><option>Race coaching</option><option>Instructor training</option><option>Please advise</option>';
      form.querySelector('.enquiry-terms').hidden = destination.value !== 'Japan';
    });
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
