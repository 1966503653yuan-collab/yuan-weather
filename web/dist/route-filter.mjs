// Conservative CAD annotation screening after continuous fragments have been joined.
// Source/group names alone (e.g. Style1) never determine whether a line is a road.
export function screenAnnotations(routes){
 const groups=new Map(),endpoints=new Set();
 const key=p=>p[0]+','+p[1];
 const roadName=/道路|轴线|中线|主线|支路|匝道|便道|中心线|\b(road|route|axis|axe|centerline|centreline|ramp|access)\b/i;
 const textName=/文字|标注|桩号|注记|尺寸|\b(text|label|annotation|dimension|chainage|stationing)\b/i;
 for(const r of routes){const id=JSON.stringify([r.source,r.group]);if(!groups.has(id))groups.set(id,[]);groups.get(id).push(r);if(r.length>=1000)for(const p of [r.path[0],r.path.at(-1)])endpoints.add(key(p))}
 const hasAxis=routes.some(r=>r.length>=1000),hidden=new Map();
 for(const group of groups.values()){
  const shortCloud=hasAxis&&group.length>=20&&group.every(r=>r.length<=100);
  const lengths=group.map(r=>r.length),min=lengths.reduce((a,b)=>Math.min(a,b),Infinity),max=lengths.reduce((a,b)=>Math.max(a,b),0);
  const repeatedTicks=shortCloud&&group.length>=100&&min>0&&max/min<1.05;
  for(const r of group){if(roadName.test(r.name))continue;
   const attached=endpoints.has(key(r.path[0]))||endpoints.has(key(r.path.at(-1)));
   if(hasAxis&&r.length<=250&&textName.test(r.name))hidden.set(r,'named-annotation');
   else if(shortCloud&&(!attached||repeatedTicks))hidden.set(r,'dense-short-group');
  }
 }
 const axes=routes.filter(r=>!hidden.has(r));
 // Never present an empty result merely because a heuristic classified everything.
 if(!axes.length)return {routes,hidden:[],summary:{hidden:0,total:routes.length}};
 return {routes:axes,hidden:routes.filter(r=>hidden.has(r)).map(r=>({...r,annotationReason:hidden.get(r)})),summary:{hidden:hidden.size,total:routes.length}};
}
