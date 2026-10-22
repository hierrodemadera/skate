// Service worker de SKATE: la app funciona sin conexión.
// Estrategia: se sirve lo guardado al instante y se actualiza en segundo plano
// (la versión nueva aparece la siguiente vez que abres la app con internet).
const CACHE='skate-v1';
self.addEventListener('install',e=>{self.skipWaiting();});
self.addEventListener('activate',e=>{
  e.waitUntil(caches.keys().then(ks=>Promise.all(ks.filter(k=>k!==CACHE).map(k=>caches.delete(k)))).then(()=>self.clients.claim()));
});
self.addEventListener('fetch',e=>{
  const req=e.request;
  if(req.method!=='GET')return;
  const url=new URL(req.url);
  if(url.origin!==location.origin)return;
  e.respondWith((async()=>{
    const cache=await caches.open(CACHE);
    const cached=await cache.match(req,{ignoreSearch:true});
    const net=fetch(req).then(res=>{
      if(res&&res.ok&&res.type==='basic')cache.put(req.mode==='navigate'?url.origin+url.pathname:req,res.clone());
      return res;
    }).catch(()=>null);
    if(cached){e.waitUntil(net);return cached;}
    const res=await net;
    if(res)return res;
    // sin conexión y sin copia exacta: devolver la página guardada
    const keys=await cache.keys();
    const page=keys.find(k=>/\.html?$|\/$/.test(new URL(k.url).pathname));
    return page?cache.match(page):new Response('Sin conexión',{status:503,headers:{'Content-Type':'text/plain'}});
  })());
});
