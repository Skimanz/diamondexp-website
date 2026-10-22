import {test} from 'node:test';
import assert from 'node:assert/strict';
import {onRequestPost,onRequest} from '../functions/api/contact.js';
import {onRequestGet} from '../functions/api/form-config.js';
let saved=[], updates=[];
const db={prepare(sql){return {bind(...values){return {async run(){if(sql.startsWith('INSERT'))saved.push(values);else updates.push(values);return {success:true};}};}};}};
const env={TURNSTILE_SECRET_KEY:'unit-test-secret',TURNSTILE_SITE_KEY:'unit-test-key',ENQUIRIES:db,CONTACT_MODE:'resend',RESEND_API_KEY:'test',CONTACT_FROM:'Website <website@forms.example.com>'};
function request(changes={},headers={}) {
 const body=new URLSearchParams();
 for(const [k,v] of Object.entries({name:'Migration Test',email:'test@example.com',destination:'Japan',dates:'1 December 2026',product:'Niseko Resort Private — 6 Hours',skiers:'2',ability:'Intermediate',staying:'Hirafu',message:'Automated test',form_id:'japan-whatsapp-enquiry', 'cf-turnstile-response':'token',...changes}))body.set(k,v);
 return new Request('https://diamondexp.nz/api/contact',{method:'POST',headers:{Origin:'https://diamondexp.nz',...headers},body});
}
test('missing configuration never reports success',async()=>{assert.equal((await onRequestPost({request:request(),env:{}})).status,503);assert.equal(onRequestGet({env:{}}).status,503);});
test('cross-origin, honeypot, malformed fields, missing token and oversize submissions rejected',async()=>{
 for(const [changes,headers,status] of [[{}, {Origin:'https://evil.example'},403],[{website:'bot'}, {},400],[{email:'bad'}, {},400],[{name:'bad\nheader'}, {},400],[{'cf-turnstile-response':''},{},400],[{message:'x'.repeat(70000)},{},413]])assert.equal((await onRequestPost({request:request(changes,headers),env})).status,status);
 assert.equal(onRequest({request:request()}).status,405);
});
test('verification gates storage and delivery; email acceptance preserves original message',async()=>{
 const original=globalThis.fetch;
 try {
  for(const validation of [{success:false},{success:true,action:'wrong',hostname:'diamondexp.nz'},{success:true,action:'contact',hostname:'other.example'}]){
   let calls=0;globalThis.fetch=async()=>{calls++;return Response.json(validation);};
   assert.equal((await onRequestPost({request:request(),env})).status,400);assert.equal(calls,1);
  }
  for(const mailStatus of [200,422,500]){
   let delivered;
   globalThis.fetch=async(url,options)=>{
    if(url.includes('siteverify'))return Response.json({success:true,action:'contact',hostname:'diamondexp.nz'});
    delivered=JSON.parse(options.body);return Response.json(mailStatus===200 ? {id:'email-test'} : {error:'rejected'},{status:mailStatus});
   };
   const response=await onRequestPost({request:request(),env});
   assert.equal(response.status,200);
   if(mailStatus===200){assert.equal((await response.json()).message,'Thanks for contacting us! Ash will be in touch with you shortly.');assert.equal(delivered.subject,'Ash Johns Ski website enquiry');assert.deepEqual(delivered.to,['skiwithash@gmail.com']);assert.equal(delivered.reply_to,'test@example.com');assert.match(delivered.text,/Hirafu/);}
  }
  globalThis.fetch=async()=>{throw new Error('outage');};assert.equal((await onRequestPost({request:request(),env})).status,503);
 } finally {globalThis.fetch=original;}
});

test('storage must commit before delivery and outage never loses enquiries',async()=>{
 const original=globalThis.fetch;
 try {
  saved=[]; let mailCalls=0;
  globalThis.fetch=async(url)=>{
   if(url.includes('siteverify'))return Response.json({success:true,action:'contact',hostname:'diamondexp.nz'});
   mailCalls++;assert.equal(saved.length,1);throw new Error('email outage');
  };
  const response=await onRequestPost({request:request(),env});
  assert.equal(response.status,200);const data=await response.json();assert.equal(data.notification,'pending');assert.match(data.message,/email notification could not be confirmed/);assert.ok(data.reference);
  const failed={...env,ENQUIRIES:{prepare(){return {bind(){return {run(){throw new Error('disk');}};}};}}};
  assert.equal((await onRequestPost({request:request(),env:failed})).status,503);assert.equal(mailCalls,1);
  assert.equal(onRequestGet({env}).status,200);
  assert.equal(onRequestGet({env:{...env,CONTACT_MODE:'storage'}}).status,503);
 }finally{globalThis.fetch=original;}
});

test('Diamond field limits, optional contact dates/message and method/content type validation', async () => {
 for (const changes of [{destination:'Other'}, {skiers:'0'}, {skiers:'21'}, {skiers:'1.5'}, {ability:'Other'}, {dates:''}, {product:''}, {form_id:'unknown'}, {staying:'x'.repeat(501)}, {name:'x'.repeat(201)}, {email:'test@example.com\r\nBcc: bad@example.com'}]) {
  assert.equal((await onRequestPost({request:request(changes),env})).status,400);
 }
 assert.equal((await onRequestPost({request:request({}, {'Content-Type':'application/json'}),env})).status,415);
 const original=globalThis.fetch;
 try {
  globalThis.fetch=async(url)=>url.includes('siteverify') ? Response.json({success:true,action:'contact',hostname:'diamondexp.nz'}) : Response.json({id:'receipt'});
  const result=await onRequestPost({request:request({form_id:'contact-booking-enquiry',dates:'',message:''}),env});
  assert.equal(result.status,200);
 } finally {globalThis.fetch=original;}
});
