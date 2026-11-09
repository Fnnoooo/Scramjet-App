"use strict";
// NEXUS interface controls are deliberately initialized before the proxy.
const el = id => document.getElementById(id);
const state = {controller:null, connection:null, frame:null, url:'', loading:false, ready:false};
const error = (message, details='') => {
  const status=el('sj-error'), code=el('sj-error-code');
  if(status) status.textContent=message;
  if(code) code.textContent=details;
  console.error('[NEXUS]',message,details);
};
const status = message => {const n=el('browser-loading');if(n){n.textContent=message;n.hidden=!message;}};
function home(){
  document.body.classList.remove('browser-active');
  el('browser-view').hidden=true; el('homepage').hidden=false;
  const footer=document.querySelector('.footer');if(footer)footer.hidden=false;
  el('address').value='';status('');
}
function showBrowser(){
  el('browser-view').hidden=false;el('homepage').hidden=true;
  const footer=document.querySelector('.footer');if(footer)footer.hidden=true;
  document.body.classList.add('browser-active');
}
async function ensureProxy(){
  if(state.ready)return;
  if(typeof $scramjetLoadController!=='function')throw new Error('Scramjet library did not load. Check /scram/scramjet.all.js.');
  if(typeof BareMux==='undefined')throw new Error('BareMux library did not load. Check /baremux/index.js.');
  if(typeof registerSW!=='function')throw new Error('Service worker helper missing.');
  const {ScramjetController}=$scramjetLoadController();
  state.controller=new ScramjetController({files:{wasm:'/scram/scramjet.wasm.wasm',all:'/scram/scramjet.all.js',sync:'/scram/scramjet.sync.js'}});
  await state.controller.init();
  await registerSW();
  state.connection=new BareMux.BareMuxConnection('/baremux/worker.js');
  const wispUrl=(location.protocol==='https:'?'wss':'ws')+'://'+location.host+'/wisp/';
  if((await state.connection.getTransport())!=='/libcurl/index.mjs'){
    await state.connection.setTransport('/libcurl/index.mjs',[{websocket:wispUrl}]);
  }
  state.ready=true;
}
function normalize(input){
  input=(input||'').trim();if(!input)return '';
  if(/^https?:\/\//i.test(input))return input;
  if(/^[\w-]+(\.[\w-]+)+([/:?#]|$)/.test(input))return 'https://'+input;
  return 'https://www.google.com/search?q='+encodeURIComponent(input);
}
async function navigate(input){
  const url=normalize(input);if(!url||state.loading)return;
  state.loading=true;el('sj-error').textContent='';el('sj-error-code').textContent='';
  showBrowser();status('Opening website…');el('address').value=url;
  try{
    await ensureProxy();
    if(!state.frame){
      state.frame=state.controller.createFrame();
      state.frame.frame.id='sj-frame';
      el('browser-frame-host').appendChild(state.frame.frame);
    }
    await state.frame.go(url);
    state.url=url;
    status('');
  }catch(e){
    home();error('Could not open website.',String(e?.message||e));
  }finally{state.loading=false;}
}
// Register all UI actions independently of proxy initialization.
el('searchform')?.addEventListener('submit',e=>{e.preventDefault();navigate(el('search').value);});
el('address')?.addEventListener('keydown',e=>{if(e.key==='Enter'){e.preventDefault();navigate(e.currentTarget.value);}});
document.querySelectorAll('[data-url]').forEach(button=>button.addEventListener('click',()=>navigate(button.dataset.url)));
el('nav-home').addEventListener('click',home);
el('nav-refresh').addEventListener('click',()=>{if(state.frame&&state.url){const u=state.url;state.url='';navigate(u);}else location.reload();});
function moveHistory(direction){
  if(!state.frame)return;
  try{const w=state.frame.frame.contentWindow;direction==='back'?w.history.back():w.history.forward();}
  catch(e){error('This page does not expose browser history.',String(e));}
}
el('nav-back').addEventListener('click',()=>moveHistory('back'));
el('nav-forward').addEventListener('click',()=>moveHistory('forward'));
el('settings').addEventListener('click',()=>el('modal').classList.add('show'));
el('close').addEventListener('click',()=>el('modal').classList.remove('show'));
el('modal').addEventListener('click',e=>{if(e.target===el('modal'))el('modal').classList.remove('show');});
el('fullscreen').addEventListener('click',()=>{if(document.fullscreenElement)document.exitFullscreen?.();else document.documentElement.requestFullscreen?.();});
el('theme').addEventListener('change',e=>{document.body.classList.remove('theme-halloween','theme-christmas');if(e.target.value!=='default')document.body.classList.add('theme-'+e.target.value);});
el('motion').addEventListener('change',e=>{window.nexusMotionEnabled=e.target.checked;});
window.addEventListener('error',e=>console.error('[NEXUS browser error]',e.message));
