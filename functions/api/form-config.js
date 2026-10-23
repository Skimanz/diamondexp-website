export function onRequestGet({env}) {
  const ready=Boolean(env.TURNSTILE_SITE_KEY && env.TURNSTILE_SECRET_KEY && env.ENQUIRIES &&
    env.CONTACT_MODE==='resend' && env.RESEND_API_KEY && env.CONTACT_FROM);
  return Response.json(ready ? {siteKey:env.TURNSTILE_SITE_KEY} : {error:'Form configuration is pending.'}, {status:ready ? 200 : 503,headers:{'Cache-Control':'no-store'}});
}
