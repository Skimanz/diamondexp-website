import test from 'node:test';
import assert from 'node:assert/strict';
import {updateDays} from '../tools/availability-admin.mjs';

test('availability admin supports the public booked status', () => {
  const data = {seasonStart:'2026-12-01', seasonEnd:'2027-03-31', updatedAt:'2026-11-01', days:{}};
  const result = updateDays(data, 'booked', ['2027-01-20']);
  assert.deepEqual(result.days['2027-01-20'], {status:'booked'});
  assert.equal(data.days['2027-01-20'], undefined);
});

test('booked status does not overwrite a personal commitment', () => {
  const data = {seasonStart:'2026-12-01', seasonEnd:'2027-03-31', updatedAt:'2026-11-01', days:{'2027-01-20':{status:'unavailable'}}};
  assert.throws(() => updateDays(data, 'booked', ['2027-01-20']), /Already unavailable/);
});
