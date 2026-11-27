const canonicalHost = 'skiwithash.com';
const redirectHosts = new Set([
  'diamondexp.nz',
  'www.diamondexp.nz',
  'www.skiwithash.com',
]);

export function onRequest({ request, next }) {
  const url = new URL(request.url);
  if (!redirectHosts.has(url.hostname) || !['GET', 'HEAD'].includes(request.method)) {
    return next();
  }

  url.protocol = 'https:';
  url.hostname = canonicalHost;
  url.port = '';
  return Response.redirect(url.href, 301);
}
