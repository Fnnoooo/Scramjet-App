'use strict';
const el=id=>document.getElementById(id);
const state={controller:null,connection:null,frame:null,url:'',ready:false,loading:false,history:[],index:-1};
const status=msg=>{const n=el('browser-loading');if(n){n.textContent=msg;n.hidden=!msg;}};
function stopFrame(){
  // Destroying the browsing context stops its audio/video and network activity.
  if(state.frame){try{state.frame.frame.src='about:blank';state.frame.frame.remove();}catch(e){console.warn(e);}state.frame=null;}
  el('browser-frame-host').replaceChildren();
}
function home(){stopFrame();state.url='';state.history=[];state.index=-1;document.body.classList.remove('browser-active');el('browser-view').hidden=true;el('homepage').hidden=false;el('address').value='';status('');}
function showBrowser(){el('browser-view').hidden=false;el('homepage').hidden=true;document.body.classList.add('browser-active');}
async function ensureProxy(){
 if(state.ready)return;
 if(typeof $scramjetLoadController!=='function')throw Error('Proxy script unavailable.');
 if(typeof BareMux==='undefined')throw Error('Transport script unavailable.');
 if(typeof registerSW!=='function')throw Error('Service worker unavailable.');
 const {ScramjetController}=$scramjetLoadController();
 state.controller=new ScramjetController({files:{wasm:'/scram/scramjet.wasm.wasm',all:'/scram/scramjet.all.js',sync:'/scram/scramjet.sync.js'}});
 await state.controller.init();await registerSW();
 state.connection=new BareMux.BareMuxConnection('/baremux/worker.js');
 const wisp=(location.protocol==='https:'?'wss':'ws')+'://'+location.host+'/wisp/';
 if((await state.connection.getTransport())!=='/libcurl/index.mjs')await state.connection.setTransport('/libcurl/index.mjs',[{websocket:wisp}]);
 state.ready=true;
}
function normalize(input){input=(input||'').trim();if(!input)return '';if(/^https?:\/\//i.test(input))return input;if(/^[\w-]+(\.[\w-]+)+([/:?#]|$)/.test(input))return 'https://'+input;return 'https://www.google.com/search?q='+encodeURIComponent(input);}
async function navigate(input,record=true){
 const url=normalize(input);if(!url||state.loading)return;
 state.loading=true;showBrowser();status('Loading…');el('address').value=url;
 try{
  await ensureProxy();
  // A new frame also guarantees the previous site's media stops.
  stopFrame();state.frame=state.controller.createFrame();state.frame.frame.id='sj-frame';el('browser-frame-host').appendChild(state.frame.frame);
  await state.frame.go(url);state.url=url;
  if(record){state.history=state.history.slice(0,state.index+1);state.history.push(url);state.index=state.history.length-1;}
 }catch(e){console.error('[NEXUS]',e);stopFrame();home();el('sj-error').textContent='Could not load that website. Try another URL.';}
 finally{state.loading=false;status('');}
}
function historyMove(delta){const i=state.index+delta;if(i>=0&&i<state.history.length){state.index=i;navigate(state.history[i],false);}else if(delta<0&&state.index===0){home();}}
el('searchform').addEventListener('submit',e=>{e.preventDefault();navigate(el('search').value);});
el('address').addEventListener('keydown',e=>{if(e.key==='Enter'){e.preventDefault();navigate(e.currentTarget.value);}});
document.querySelectorAll('[data-url]').forEach(b=>b.addEventListener('click',()=>navigate(b.dataset.url)));
el('nav-home').addEventListener('click',home);
el('nav-back').addEventListener('click',()=>historyMove(-1));
el('nav-forward').addEventListener('click',()=>historyMove(1));
el('nav-refresh').addEventListener('click',()=>state.url?navigate(state.url,false):location.reload());
el('fullscreen').addEventListener('click',()=>document.fullscreenElement?document.exitFullscreen():document.documentElement.requestFullscreen?.());
const themes=['default','halloween','christmas'];
function setTheme(theme){document.body.classList.remove('theme-halloween','theme-christmas');if(themes.includes(theme)&&theme!=='default')document.body.classList.add('theme-'+theme);}
const savedTheme=localStorage.getItem('nexus-theme')||'default';setTheme(savedTheme);el('theme').value=savedTheme;
window.nexusMotionEnabled=localStorage.getItem('nexus-motion')!=='off';el('motion').checked=window.nexusMotionEnabled;
el('settings').addEventListener('click',()=>{el('modal').classList.add('show');el('theme').value=localStorage.getItem('nexus-theme')||'default';el('motion').checked=window.nexusMotionEnabled;});
el('close').addEventListener('click',()=>el('modal').classList.remove('show'));
el('modal').addEventListener('click',e=>{if(e.target===el('modal'))el('modal').classList.remove('show');});
el('apply').addEventListener('click',()=>{
 const theme=el('theme').value;setTheme(theme);localStorage.setItem('nexus-theme',theme);
 window.nexusMotionEnabled=el('motion').checked;localStorage.setItem('nexus-motion',window.nexusMotionEnabled?'on':'off');
 if(el('cloak').checked){
  // Browser popup blocking requires a direct user click; use the Apply click.
  const tab=window.open('about:blank','_blank');
  if(tab){tab.document.title='New Tab';const iframe=tab.document.createElement('iframe');iframe.src=location.href;Object.assign(iframe.style,{position:'fixed',inset:'0',width:'100%',height:'100%',border:'0'});tab.document.body.style.margin='0';tab.document.body.appendChild(iframe);}else console.warn('Cloak tab was blocked by popup settings');
  el('cloak').checked=false;
 }
 el('modal').classList.remove('show');
});
// Tab closing cannot be intercepted reliably. Explicit exit is dependable.
el('exit-clever').addEventListener('click',()=>{stopFrame();location.assign('https://clever.com/');});
// Best-effort warning only; developer tools cannot be securely detected or disabled by a website.
const warning=el('inspect-warning');let flagged=false;
function checkInspect(){if(flagged)return;const threshold=180;if((window.outerWidth-window.innerWidth>threshold)||(window.outerHeight-window.innerHeight>threshold)){flagged=true;warning.hidden=false;stopFrame();}}
setInterval(checkInspect,1500);
