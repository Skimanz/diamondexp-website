(() => {
  const modal = document.getElementById('booking-terms');
  if (!modal) return;
  const target = modal.querySelector('[data-terms-content]');
  let termsPromise;

  function loadTerms() {
    if (termsPromise) return termsPromise;
    termsPromise = fetch('/terms/', {headers: {'Accept': 'text/html'}})
      .then(response => {
        if (!response.ok) throw new Error(`Terms request failed: ${response.status}`);
        return response.text();
      })
      .then(html => {
        const documentFromResponse = new DOMParser().parseFromString(html, 'text/html');
        const source = documentFromResponse.getElementById('terms-shared-content');
        if (!source) throw new Error('Shared terms content was not found');
        target.replaceChildren(...Array.from(source.childNodes).map(node => node.cloneNode(true)));
        const title = target.querySelector('#terms-title');
        if (title) {
          const modalTitle = document.createElement('h2');
          Array.from(title.attributes).forEach(attribute => modalTitle.setAttribute(attribute.name, attribute.value));
          modalTitle.id = 'booking-terms-title';
          modalTitle.tabIndex = -1;
          modalTitle.innerHTML = title.innerHTML;
          title.replaceWith(modalTitle);
        }
      })
      .catch(() => {
        target.innerHTML = '<p class="eyebrow">Japan private bookings</p><h2 id="booking-terms-title" tabindex="-1">Terms &amp; conditions</h2><p>Sorry, the terms could not be loaded here.</p><p><a href="/terms/">Open the full Terms &amp; Conditions page</a></p>';
      });
    return termsPromise;
  }

  async function open() {
    if (!modal.open) modal.showModal();
    modal.scrollTop = 0;
    await loadTerms();
    document.getElementById('booking-terms-title')?.focus({preventScroll:true});
  }
  document.querySelectorAll('[data-open-terms]').forEach(button => button.addEventListener('click', open));
  modal.querySelector('[data-close-terms]').addEventListener('click', () => modal.close());
  modal.addEventListener('click', event => {if (event.target === modal) modal.close();});
  function followLink() {if (window.location.hash === '#booking-terms') open();}
  window.addEventListener('hashchange', followLink);
  loadTerms();
  followLink();
})();
