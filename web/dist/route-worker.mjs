import {prepareRouteFile} from './route-stream.mjs';
self.onmessage=async e=>{try{const result=await prepareRouteFile(e.data,p=>self.postMessage({progress:p}));self.postMessage({result})}catch(e){self.postMessage({error:e.message})}};
