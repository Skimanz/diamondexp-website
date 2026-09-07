(() => {
  const params = new URLSearchParams(window.location.search);
  const destination = params.get('destination');
  const service = params.get('service');
  const destinationField = document.getElementById('destination');
  const serviceField = document.getElementById('service');
  if (destination && destinationField) destinationField.value = destination;
  if (service && serviceField) serviceField.value = service;
})();
