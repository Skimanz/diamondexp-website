import fs from 'node:fs/promises';
import {pathToFileURL} from 'node:url';

export function paymentDeadline(issuedAt, firstLessonAt) {
  const zoned=/T\d{2}:\d{2}.*(?:Z|[+-]\d{2}:\d{2})$/;
  if (!zoned.test(issuedAt) || !zoned.test(firstLessonAt)) throw Error('Use full timestamps with timezone offsets.');
  const issued=new Date(issuedAt), lesson=new Date(firstLessonAt);
  if (!Number.isFinite(+issued)||!Number.isFinite(+lesson)||lesson<=issued) throw Error('Issue time must precede the lesson.');
  const duration=issued<new Date('2026-12-01T00:00:00+09:00')?7*24:48;
  const deadline=new Date(+issued+duration*3600000);
  if (deadline>=lesson) throw Error('Last-minute booking: agree a shorter deadline before the lesson.');
  return new Date(+deadline+9*3600000).toISOString().replace('Z','+09:00');
}

export function updateDays(data, status, dates) {
  if (!['pending','unavailable','available'].includes(status)||!dates.length) throw Error('Choose a status and at least one date.');
  const result=structuredClone(data);
  for (const day of dates) {
    if (!/^\d{4}-\d{2}-\d{2}$/.test(day)||!Number.isFinite(Date.parse(day))||new Date(day).toISOString().slice(0,10)!==day||day<data.seasonStart||day>data.seasonEnd) throw Error(`Invalid season date: ${day}`);
    if(status==='pending'&&data.days[day]?.status==='unavailable') throw Error(`Already unavailable: ${day}. Resolve the existing booking first.`);
    if(status==='available') delete result.days[day];
    else result.days[day]={status};
  }
  result.updatedAt=new Intl.DateTimeFormat('en-CA',{timeZone:'Asia/Tokyo',year:'numeric',month:'2-digit',day:'2-digit'}).format(new Date());
  result.days=Object.fromEntries(Object.entries(result.days).sort(([a],[b])=>a.localeCompare(b)));
  return result;
}

if (process.argv[1] && import.meta.url===pathToFileURL(process.argv[1]).href) {
  const [action,...args]=process.argv.slice(2);
  if(action==='deadline') console.log(paymentDeadline(...args));
  else {
    const path=new URL('../availability.json',import.meta.url);
    const data=JSON.parse(await fs.readFile(path,'utf8'));
    await fs.writeFile(path,JSON.stringify(updateDays(data,action,args),null,2)+'\n');
    console.log('Local calendar updated. Review and publish to update the website.');
  }
}
