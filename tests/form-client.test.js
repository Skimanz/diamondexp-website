import {test} from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import vm from 'node:vm';
const code=readFileSync(new URL('../booking-enquiry.js',import.meta.url),'utf8');
const tick=()=>new Promise(resolve=>setImmediate(resolve));
async function setup(response, failure=false) {
 const handlers={}, statuses=[], events=[], requests=[];
 const emailButton={disabled:false}, whatsappButton={disabled:false};
 const fields={email:{},destination:{value:'Japan',addEventListener(){}},product:{innerHTML:''},availability_note:{}};
 const actions={before(...nodes){statuses.push(...nodes);}};
 const form={elements:fields,dataset:{},querySelector(selector){return selector==='.enquiry-send-actions'?actions:selector.includes('[type="submit"]')?emailButton:null;},querySelectorAll:()=>[emailButton,whatsappButton],addEventListener:(n,fn)=>handlers[n]=fn,reportValidity:()=>true,reset(){},dispatchEvent:event=>events.push(event)};
 let readyCallback, resetCount=0;
 const window={turnstile:{render(element,opts){readyCallback=opts.callback;return 'widget';},getResponse:()=> 'token',reset(){resetCount++;}}};
 const context={window,document:{querySelectorAll:()=>[form],createElement:()=>({dataset:{},style:{},setAttribute(){}})},IntersectionObserver:class{constructor(callback){this.callback=callback;}observe(){this.callback([{isIntersecting:true}]);}disconnect(){}},fetch:async(url,options)=>{
  if(url==='/api/form-config')return {ok:true,json:async()=>({siteKey:'public-key'})};
  requests.push({url,options});if(failure)throw Error('offline');return response;
 },FormData:class{set(){}},CustomEvent:class{constructor(name){this.type=name;}},Error};
 vm.runInNewContext(code,context);await tick();readyCallback();
 return {form,handlers,statuses,events,requests,emailButton,whatsappButton,get resets(){return resetCount;}};
}
test('accepted durable enquiry emits exactly one lead and resets Turnstile',async()=>{
 const state=await setup({ok:true,json:async()=>({reference:'ref',message:'Saved',notification:'pending'})});
 const event={submitter:{value:'email'},preventDefault(){}};
 await Promise.all([state.handlers.submit(event),state.handlers.submit(event)]);
 assert.equal(state.requests.length,1);assert.equal(state.events.length,1);assert.equal(state.events[0].type,'enquiry:success');
 assert.equal(state.resets,1);assert.equal(state.emailButton.disabled,true);assert.equal(state.whatsappButton.disabled,false);
 assert.match(state.statuses[1].textContent,/Reference: ref/);
});
test('rejected, malformed and failed submissions never emit a lead',async()=>{
 for(const [response,failure] of [[{ok:false,json:async()=>({error:'Invalid'})},false],[{ok:true,json:async()=>({})},false],[{},true]]){
  const state=await setup(response,failure);await state.handlers.submit({submitter:{value:'email'},preventDefault(){}});
  assert.equal(state.events.length,0);assert.equal(state.resets,1);
 }
});
