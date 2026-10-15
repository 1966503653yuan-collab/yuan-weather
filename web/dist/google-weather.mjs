// Google processed forecasts are deliberately separate from raw model ensembles.
const num=x=>typeof x==='number'&&Number.isFinite(x)?x:null;
const bounded=(x,a,b)=>num(x)!==null&&x>=a&&x<=b?x:null;
function temperature(x){let n=num(x?.degrees);return n===null?null:x.unit==='CELSIUS'?n:x.unit==='FAHRENHEIT'?(n-32)*5/9:null}
function wind(x){let n=bounded(x?.value,0,500);return n===null?null:x.unit==='KILOMETERS_PER_HOUR'?n/3.6:x.unit==='MILES_PER_HOUR'?n*.44704:null}
function rain(x){let n=bounded(x?.quantity,0,10000);return n===null?null:x.unit==='MILLIMETERS'?n:x.unit==='INCHES'?n*25.4:null}
export function normalizeGoogleHour(h){let start=Date.parse(h?.interval?.startTime),end=Date.parse(h?.interval?.endTime);if(!Number.isFinite(start)||end-start!==3600000)throw Error('Google: invalid hourly interval / 时段无效');return {t:end/1000,temp:temperature(h.temperature),rain:rain(h.precipitation?.qpf),prob:bounded(h.precipitation?.probability?.percent,0,100),wind:wind(h.wind?.speed),gust:wind(h.wind?.gust),thunder:bounded(h.thunderstormProbability,0,100),condition:String(h.weatherCondition?.type||''),thunderstorm:/THUNDERSTORM/.test(h.weatherCondition?.type||''),description:String(h.weatherCondition?.description?.text||'')}}
export async function fetchGoogleWeather({lat,lon,key,hours=72,lang='zh',signal,history=false},fetcher=fetch){
 if(!Number.isFinite(lat)||Math.abs(lat)>90||!Number.isFinite(lon)||Math.abs(lon)>180||!(history?[24]:[1,72,168]).includes(hours)||!key?.trim())throw Error('Google: check coordinates, key and hours / 检查坐标、密钥和时长');
 let rows=[],token='',seen=new Set(),requests=0,limit=Math.ceil(hours/24);
 do{let url=new URL('https://weather.googleapis.com/v1/'+(history?'history':'forecast')+'/hours:lookup');Object.entries({'location.latitude':lat,'location.longitude':lon,unitsSystem:'METRIC',pageSize:Math.min(24,hours),hours,languageCode:lang==='fr'?'fr':lang==='en'?'en':'zh-CN',...(token?{pageToken:token}:{})}).forEach(([k,v])=>url.searchParams.set(k,v));
 let response;try{response=await fetcher(url.href,{headers:{'X-Goog-Api-Key':key.trim()},signal:signal?AbortSignal.any([signal,AbortSignal.timeout(45000)]):AbortSignal.timeout(45000),cache:'no-store',credentials:'omit'})}catch(e){if(signal?.aborted)throw Error('Google: cancelled / 已取消');throw Error('Google: connection failed or timed out / 连接失败或超时')}
 requests++;if(!response.ok)throw Error(`Google HTTP ${response.status} — ${response.status===401||response.status===403?'检查密钥、Weather API启用状态、账单和应用限制 / Vérifier clé, API, facturation et restrictions':response.status===429?'配额不足，不自动重试 / Quota atteint, aucun nouvel essai':'请求失败，不自动重试 / Échec sans nouvel essai'}`);
 let data;try{data=await response.json()}catch{throw Error('Google: invalid JSON / 返回数据无效')}
 if(history)data.forecastHours=Array.isArray(data.historyHours)?data.historyHours.slice().sort((a,b)=>Date.parse(a.interval?.endTime)-Date.parse(b.interval?.endTime)):null;
 if(!Array.isArray(data.forecastHours)||!data.forecastHours.length||data.forecastHours.length>Math.min(24,hours))throw Error('Google: invalid forecast page / 预报页无效');
 for(let h of data.forecastHours){let row=normalizeGoogleHour(h);if(rows.length&&row.t!==rows.at(-1).t+3600)throw Error('Google: duplicate or discontinuous hours / 小时重复或不连续');rows.push(row)}
 token=data.nextPageToken||'';if(typeof token!=='string'||seen.has(token)&&token)throw Error('Google: invalid page token / 分页无效');seen.add(token);
 }while(token&&requests<limit&&rows.length<hours);
 if(rows.length>hours)throw Error('Google: excess hours / 时段数量异常');
 return {rows,requests,requestedHours:hours,complete:rows.length===hours,fetched:Date.now()};
}
