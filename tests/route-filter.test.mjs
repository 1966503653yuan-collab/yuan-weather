import test from 'node:test';import assert from 'node:assert/strict';import {screenAnnotations} from '../web/dist/route-filter.mjs';
const r=(length,group=0,name='Style',i=0)=>({length,group,name,source:'doc',path:[[1,i],[1,i+.0001]]});
const axis=r(200000,0,'Style1',99),cloud=Array.from({length:30},(_,i)=>r(25,1,'Style3',i));
test('dense annotation group hidden, road kept',()=>{let a=screenAnnotations([axis,...cloud]);assert.equal(a.routes.length,1);assert.equal(a.hidden.length,30);assert.equal(a.summary.total,31)});
test('small route-only file not hidden',()=>assert.equal(screenAnnotations(cloud).hidden.length,0));
test('isolated short branches retained',()=>assert.equal(screenAnnotations([axis,r(25,1)]).hidden.length,0));
test('explicit road names protected',()=>assert.equal(screenAnnotations([axis,...cloud.map(r=>({...r,name:'支路'}))]).hidden.length,0));
test('connected short spur protected',()=>{let a=screenAnnotations([axis,...cloud,{...r(30,1),path:[axis.path[1],[2,3]]}]);assert.equal(a.routes.length,2)});
test('named annotation hidden but long route with label retained',()=>{let a=screenAnnotations([axis,r(20,2,'桩号'),r(5000,3,'文字道路轴线')]);assert.equal(a.hidden.length,1);assert.equal(a.routes.length,2)});
test('Style numbers not hardcoded',()=>assert.equal(screenAnnotations([r(5000,3,'Style3',99),...cloud.map(x=>({...x,name:'Style1'}))]).routes.length,1));

test('repeated chainage ticks hidden even at axis endpoint',()=>{let ticks=Array.from({length:150},(_,i)=>r(50,2,'Style2',i));let a=screenAnnotations([axis,...ticks]);assert.equal(a.routes.length,1);assert.equal(a.hidden.length,150)});
