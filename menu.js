document.querySelectorAll('.site-header').forEach((header) => {
  const toggle = header.querySelector('.menu-toggle');
  const navigation = header.querySelector('nav');

  if (!toggle || !navigation) return;

  const closeMenu = () => {
    header.classList.remove('menu-open');
    toggle.setAttribute('aria-expanded', 'false');
    toggle.setAttribute('aria-label', 'Open menu');
  };

  toggle.addEventListener('click', () => {
    const isOpen = header.classList.toggle('menu-open');
    toggle.setAttribute('aria-expanded', String(isOpen));
    toggle.setAttribute('aria-label', isOpen ? 'Close menu' : 'Open menu');
  });

  navigation.querySelectorAll('a').forEach((link) => link.addEventListener('click', closeMenu));
  document.addEventListener('keydown', (event) => {
    if (event.key === 'Escape') closeMenu();
  });
});
