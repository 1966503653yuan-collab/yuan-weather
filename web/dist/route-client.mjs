import {importRoutes} from './route-import.mjs';
let active;
export function cancelRouteImport(){if(active){active.worker.terminate();active.reject(new Error('导入已取消 / Import annulé'));active=null}}
export async function importRouteAutomatically(file,onProgress){
 cancelRouteImport();if(/\.csv$/i.test(file.name))return {routes:await importRoutes(file),summary:null};
 return new Promise((resolve,reject)=>{let worker=new Worker(new URL('./route-worker.mjs',import.meta.url),{type:'module'});active={worker,reject};const finish=()=>{worker.terminate();if(active?.worker===worker)active=null};worker.onmessage=e=>{if(e.data.progress){onProgress(e.data.progress);return}finish();if(e.data.error)reject(new Error(e.data.error));else resolve(e.data.result)};worker.onerror=()=>{finish();reject(new Error('线路处理模块未能启动，请重启更新后的软件 / Redémarrer la version mise à jour'))};worker.postMessage(file)});
}
