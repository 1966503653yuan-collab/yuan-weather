import test from 'node:test';import assert from 'node:assert/strict';import {defaults,q,sample,distance,assess,worst,totals,hours,review,parseCSV,cell,validate} from '../web/dist/core.mjs';
const good={t:100,a:0,p50:0,p90:0,prob:0,n:64,expected:64,at:25,gt:25,wind:2,gust:3,code:0,cape:0,wet:0};
const s=structuredClone(defaults),p={id:'a',pk:'K0+000',lat:7,lon:2};
for(let [name,h,activity,expected,stale]of [
 ['green',{},'asphalt',0],['prob30',{prob:30},'earth',1],['prob60',{prob:60},'earth',1],['prob61',{prob:61},'earth',2],['rain5',{a:5},'earth',2],['missing',{p90:null},'earth',-1],['partial ensemble',{n:63},'earth',-1],['stale',{},'earth',-1,true],['red persists',{code:95,p90:null},'earth',2,true],['gust',{gust:11},'lifting',2],['wind boundary',{gust:10},'emulsion',0],['cold',{at:14},'asphalt',2],['unknown temp',{at:null},'asphalt',-1],['concrete',{at:26},'concrete',1],['wet',{wet:30},'earth',1],['cape',{cape:1000},'earth',1],['cape not thunder',{cape:2000},'lifting',1],['code missing',{code:null},'earth',-1]
])test(name,()=>assert.equal(assess({...good,...h},s,p,activity,stale).level,expected));
test('worst priority',()=>{assert.equal(worst([0,1,-1]),-1);assert.equal(worst([2,-1]),2);assert.equal(worst([]),-1)});
test('quantile',()=>assert.equal(q([0,10],.9),9));
test('route sampling on bent road',()=>{let r=sample([[7,2],[7.1,2],[7.1,2.1]],12500);assert.equal(r.sites[0].pk,'K12+500');assert.equal(r.sites[1].pk,'K17+500');assert.ok(Math.abs(distance([7,2],[r.sites[1].lat,r.sites[1].lon])-5000)<.01);assert.ok(Math.abs(r.sites.at(-1).lon-2.1)<1e-8)});
test('route validation',()=>assert.throws(()=>sample([[100,2],[7,2]])));
test('sum before quantile',()=>{let f={g:{hourly:{time:[1,2],precipitation_member01:[0,10],precipitation_member02:[10,0],precipitation_member03:[5,null]}}};assert.equal(totals(f,[{t:1,a:1},{t:2,a:1}]).p90,10);assert.equal(totals(f,[{t:1},{t:2}]).n,2)});
test('missing hours remain unknown',()=>{assert.equal(hours({},0,72).length,72);assert.equal(hours({},0)[0].p90,null)});
test('prior24 requires all',()=>assert.equal(hours({},0)[0].wet,null));
test('CSV quoted',()=>assert.deepEqual(parseCSV('a,b\n"K1,2","a""b"'),[['a','b'],['K1,2','a"b']]));
test('CSV safe formula and negative coordinate',()=>{assert.equal(cell('=1+1'),'"\'=1+1"');assert.equal(cell(-2.1),'"-2.1"')});
test('settings reject NaN',()=>assert.throws(()=>validate({...s,wind:NaN})));
test('duplicate PK rejected',()=>assert.throws(()=>validate({...s,sites:[p,p]})));
test('review matched lead',()=>{let t=Date.parse('2026-10-14T11:00:00Z')/1000,h=[{fetched:t*1000-24*3600000,rows:[{id:'a',t,p50:3}]}],r=review('chainage,hour_end,rain_mm\nK0+000,2026-10-14 12:00,2',h,{...s,sites:[p]},t*1000+3600000);assert.equal(r[0].error,1)});
test('review no fabricated history',()=>assert.equal(review('chainage,hour_end,rain_mm\nK0+000,2026-10-14 12:00,2',[],{...s,sites:[p]},Date.parse('2026-10-14T12:00:00Z')).length,0));
