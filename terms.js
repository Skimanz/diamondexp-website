(() => {
  const modal = document.getElementById('booking-terms');
  if (!modal) return;
  function open() {
    if (!modal.open) modal.showModal();
    modal.scrollTop = 0;
    document.getElementById('booking-terms-title').focus({preventScroll:true});
  }
  document.querySelectorAll('[data-open-terms]').forEach(button => button.addEventListener('click', open));
  modal.querySelector('[data-close-terms]').addEventListener('click', () => modal.close());
  modal.addEventListener('click', event => {if (event.target === modal) modal.close();});
  function followLink() {if (window.location.hash === '#booking-terms') open();}
  window.addEventListener('hashchange', followLink);
  followLink();
})();
