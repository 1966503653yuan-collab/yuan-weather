import {screenAnnotations} from './route-filter.mjs';
import sax from './sax.mjs';
import {geo,distance} from './core.mjs';
import {kmzFileDocuments,mergeConnectedRoutes} from './route-import.mjs';
const error=message=>new Error(message);
// Limits apply to useful geometry rather than descriptions or embedded media.
export function routeSink(source,budget={vertices:0,segments:0}){
 const parser=sax.parser(true,{xmlns:true,strictEntities:true});let decoder,prefix=new Uint8Array(),stack=[],groups=[],serial=0,geometry=null,capture=null,routes=[],root=false;
 const local=n=>n.local||n.name;
 const add=p=>{if(!geo(p))throw error('坐标无效 / Coordonnées invalides');if(++budget.vertices>2000000)throw error('有效线路坐标超过200万个，请分段导出 / Plus de 2 millions de coordonnées ; exporter par section');if(!geometry.path.length||geometry.path.at(-1)[0]!==p[0]||geometry.path.at(-1)[1]!==p[1])geometry.path.push(p)};
 function coordinate(token){let a=token.split(',');if(a.length<2||a.length>3||!a[0].trim()||!a[1].trim())throw error('KML坐标格式无效 / Coordonnées KML invalides');add([Number(a[1]),Number(a[0])])}
 parser.onerror=e=>{throw e};parser.ondoctype=()=>{throw error('不支持DTD / DTD non pris en charge')};parser.onsgmldeclaration=()=>{throw error('不支持实体声明 / Déclaration non prise en charge')};
 parser.onopentag=n=>{let tag=local(n);if(!root){if(tag!=='kml')throw error('不是KML文档 / Document non KML');root=true}let parent=stack.at(-1);stack.push(tag);if(stack.length>256)throw error('XML嵌套过深 / XML trop imbriqué');
  if(tag==='Placemark')groups.push({id:++serial,name:'',routes:[]});
  if(tag==='LineString'||(tag==='Track'&&n.uri==='http://www.google.com/kml/ext/2.2')){if(geometry)throw error('嵌套线路无效 / Tracé imbriqué invalide');geometry={depth:stack.length,path:[],group:groups.at(-1)}}
  if(tag==='name'&&parent==='Placemark')capture={kind:'name',depth:stack.length,text:''};
  if(tag==='coordinates'&&geometry&&parent==='LineString')capture={kind:'coordinates',depth:stack.length,text:''};
  if(tag==='coord'&&geometry&&n.uri==='http://www.google.com/kml/ext/2.2')capture={kind:'track',depth:stack.length,text:''};
 };
 function text(s){if(!capture)return;if(capture.kind==='coordinates'){let a=(capture.text+s).split(/\s+/);capture.text=a.pop();for(let token of a)if(token)coordinate(token);if(capture.text.length>256)throw error('坐标过长 / Coordonnée trop longue')}else {capture.text+=s;if(capture.text.length>4096)throw error('名称或坐标过长 / Nom ou coordonnée trop long')}}
 parser.ontext=text;parser.oncdata=text;
 parser.onclosetag=()=>{let tag=stack.at(-1);
  if(capture&&capture.depth===stack.length){if(capture.kind==='coordinates'){if(capture.text.trim())coordinate(capture.text.trim())}else if(capture.kind==='track'){let a=capture.text.trim().split(/\s+/);if(a.length<2)throw error('轨迹坐标无效 / Trace invalide');add([Number(a[1]),Number(a[0])])}else if(groups.length)groups.at(-1).name=capture.text.trim();capture=null}
  if(geometry&&geometry.depth===stack.length){if(geometry.path.length<2)throw error('线路至少需要两个坐标 / Deux coordonnées requises');if(++budget.segments>200000)throw error('线路段数超过20万 / Plus de 200000 segments');let g=geometry.group,r={group:g?.id||0,name:'',source,path:geometry.path,length:0};for(let i=1;i<r.path.length;i++)r.length+=distance(r.path[i-1],r.path[i]);routes.push(r);if(g)g.routes.push(r);else r.name=source;geometry=null}
  if(tag==='Placemark'){let g=groups.pop();for(let r of g.routes)r.name=g.name||source}
  stack.pop();
 };
 function write(bytes,final=false){if(!decoder){let b=new Uint8Array(prefix.length+bytes.length);b.set(prefix);b.set(bytes,prefix.length);prefix=b;if(b.length<4&&!final)return;decoder=new TextDecoder(b[0]===255&&b[1]===254?'utf-16le':b[0]===254&&b[1]===255?'utf-16be':'utf-8',{fatal:true});bytes=b;prefix=null}let s=decoder.decode(bytes,{stream:!final});for(let i=0;i<s.length;i+=16384)parser.write(s.slice(i,i+16384))}
 return {push:b=>write(b),end(){write(new Uint8Array(),true);parser.close();if(!root)throw error('空KML / KML vide');return routes}};
}
export async function prepareRouteFile(file,onProgress=()=>{}){
 const budget={vertices:0,segments:0};let routes=[];const factory=name=>routeSink(name,budget);
 onProgress({stage:'read'});
 if(/\.kmz$/i.test(file.name)){let docs=await kmzFileDocuments(file,factory);for(let d of docs){onProgress({stage:'merge',segments:budget.segments});for(let r of mergeConnectedRoutes(d.result))routes.push(r)}}
 else if(/\.kml$/i.test(file.name)){let sink=factory(file.name);for(let at=0;at<file.size;at+=65536){sink.push(new Uint8Array(await file.slice(at,at+65536).arrayBuffer()));if(at%1048576===0)onProgress({stage:'read',percent:Math.round(at/file.size*100)})}routes=mergeConnectedRoutes(sink.end())}
 else throw error('请选择KML或KMZ / Choisir KML ou KMZ');
 if(!routes.length)throw error('未发现线路 / Aucun tracé');routes.sort((a,b)=>b.length-a.length);const screened=screenAnnotations(routes);return {routes:screened.routes,hiddenRoutes:screened.hidden,summary:{segments:budget.segments,vertices:budget.vertices,routes:screened.routes.length,hidden:screened.hidden.length,total:routes.length}};
}
