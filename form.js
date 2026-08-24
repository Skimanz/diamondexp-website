(() => {
  const params = new URLSearchParams(window.location.search);
  const destination = params.get('destination');
  const service = params.get('service');
  if (destination) document.getElementById('destination').value = destination;
  if (service) document.getElementById('service').value = service;
})();
