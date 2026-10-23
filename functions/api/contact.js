const successMessage = 'Thanks for contacting us! Ash will be in touch with you shortly.';
const storedMessage = 'Your enquiry has been saved securely, but email notification could not be confirmed. Please email skiwithash@gmail.com if you need a prompt response.';
const reply = (data, status = 200) => Response.json(data, {status, headers:{'Cache-Control':'no-store','X-Content-Type-Options':'nosniff'}});

export async function onRequestPost({request,env}) {
  const url = new URL(request.url);
  const origin = request.headers.get('Origin');
  if (origin !== url.origin) return reply({error:'Please submit the form from this website.'},403);
  if (!env.TURNSTILE_SECRET_KEY || !env.ENQUIRIES || env.CONTACT_MODE !== 'resend' || !env.RESEND_API_KEY || !env.CONTACT_FROM) return reply({error:'The contact form is not available yet. Please try again later.'},503);
  if (!/^(multipart\/form-data|application\/x-www-form-urlencoded)/i.test(request.headers.get('Content-Type') || '')) return reply({error:'Unsupported form submission.'},415);
  // Enforce the limit while streaming, including when Content-Length is absent.
  let size=0;
  const reader=request.body?.getReader();
  if (!reader) return reply({error:'Please complete all required fields.'},400);
  const chunks=[];
  while (true) {
    const {value,done}=await reader.read();
    if(done) break;
    size+=value.byteLength;
    if(size>65536){await reader.cancel();return reply({error:'Your message is too long.'},413);}
    chunks.push(value);
  }
  let data;
  try {data=await new Response(new Blob(chunks),{headers:{'Content-Type':request.headers.get('Content-Type')}}).formData();}
  catch {return reply({error:'Invalid form submission.'},400);}
  const field=name=>typeof data.get(name)==='string' ? data.get(name).trim() : '';
  if (field('website')) return reply({error:'Your message could not be sent.'},400);
  const name=field('name'),email=field('email'),destination=field('destination'),dates=field('dates'),product=field('product'),skiers=field('skiers'),ability=field('ability'),staying=field('staying'),message=field('message'),availability=field('availability_note'),token=field('cf-turnstile-response');
  const limits={name:200,email:254,destination:30,dates:2000,product:200,skiers:2,ability:100,staying:500,message:10000,availability_note:2000};
  const validDestination=['Japan','New Zealand','Not sure yet'].includes(destination);
  const validAbility=['First time / Beginner','Intermediate','Advanced / Expert','Instructor / Race training','Mixed group'].includes(ability);
  if (!name || !product || !validDestination || !validAbility || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) || /[\r\n]/.test(email+name) || !/^([1-9]|1[0-9]|20)$/.test(skiers) || Object.entries(limits).some(([key,max])=>field(key).length>max) || (field('form_id')!=='contact-booking-enquiry' && !dates) || !['contact-booking-enquiry','japan-whatsapp-enquiry','nz-booking-enquiry'].includes(field('form_id'))) return reply({error:'Please complete all required fields with valid details.'},400);
  if(!token || token.length>2048) return reply({error:'Please complete the spam protection check.'},400);
  try {
    const verification=await fetch('https://challenges.cloudflare.com/turnstile/v0/siteverify',{
      method:'POST',body:new URLSearchParams({secret:env.TURNSTILE_SECRET_KEY,response:token,remoteip:request.headers.get('CF-Connecting-IP') || ''}),signal:AbortSignal.timeout(10000)
    });
    if(!verification.ok) return reply({error:'Spam protection is temporarily unavailable. Please try again.'},503);
    const result=await verification.json();
    if(result.success !== true || result.action!=='contact' || result.hostname!==url.hostname) return reply({error:'Spam protection could not verify your submission. Please try again.'},400);
    // Commit the enquiry before attempting any external notification.
    const id=crypto.randomUUID();
    const saved=await env.ENQUIRIES.prepare(
      'INSERT INTO enquiries (id, created_at, name, email, destination, dates, product, skiers, ability, staying, message, availability_note, notification_status) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)'
    ).bind(id,new Date().toISOString(),name,email,destination,dates,product,Number(skiers),ability,staying,message,availability,'pending').run();
    if(!saved.success) throw new Error('storage unavailable');
    let notification='pending';
    let providerId=null;
    {
      try {
        const mail=await fetch('https://api.resend.com/emails',{
          method:'POST',headers:{'Content-Type':'application/json','Authorization':'Bearer '+env.RESEND_API_KEY,'Idempotency-Key':'diamond-'+id},
          body:JSON.stringify({from:env.CONTACT_FROM,to:['skiwithash@gmail.com'],reply_to:email,subject:'Ash Johns Ski website enquiry',
            text:`Reference: ${id}\nName: ${name}\nEmail: ${email}\nDestination: ${destination}\nPreferred dates: ${dates}\nLesson / experience: ${product}\nSkiers: ${skiers}\nAbility: ${ability}\nStaying: ${staying}\nAvailability: ${availability}\n\n${message}`}),signal:AbortSignal.timeout(15000)
        });
        if(!mail.ok) notification='not_sent';
        if(mail.ok) {
          const receipt=await mail.json();
          if(typeof receipt.id==='string' && receipt.id) {notification='accepted';providerId=receipt.id;}
        }
      } catch { /* The committed enquiry remains available to the operator. */ }
    }
    try {
      const updated=await env.ENQUIRIES.prepare('UPDATE enquiries SET notification_status = ?, provider_id = ? WHERE id = ?').bind(notification,providerId,id).run();
      if(!updated.success) throw new Error('status update failed');
    } catch {
      // Pending status means an operator must reconcile with the provider before resending.
      console.error(JSON.stringify({event:'contact_notification_status_unknown',id}));
    }
    return reply({message:notification==='accepted' ? successMessage : storedMessage,reference:id,notification});
  } catch {
    console.error(JSON.stringify({event:'contact_service_unavailable'}));
    return reply({error:'Your enquiry could not be saved. Please try again later or email skiwithash@gmail.com.'},503);
  }
}

export function onRequest({request}) {return reply({error:'Method not allowed.'},405);}
