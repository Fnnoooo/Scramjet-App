 'use strict';
// Calculator is a normal functional landing page, not an authentication barrier.
(function calculator(){
 const gate=document.getElementById('calculator-gate');
 const display=document.getElementById('calc-display');
 const expr=document.getElementById('calc-expression');
 let raw='0', lhs=null, op=null, fresh=false, entry='';
 const show=()=>{display.textContent=raw;expr.textContent=lhs!==null?String(lhs)+' '+op:'Standard';};
 function press(k){
  if(/^\d$/.test(k)){
   entry+=k;entry=entry.slice(-20);
   if(entry.endsWith('0002')){gate.hidden=true;entry='';return;}
   raw=(fresh||raw==='0')?k:raw+k;fresh=false;raw=raw.slice(-18);
  } else if(k==='C'){raw='0';lhs=null;op=null;fresh=false;entry='';}
  else if(k==='⌫'){raw=raw.length>1?raw.slice(0,-1):'0';entry=entry.slice(0,-1);}
  else if(k==='.') {if(fresh){raw='0';fresh=false;}if(!raw.includes('.'))raw+='.';entry='';}
  else if(k==='±'){raw=String(-Number(raw));entry='';}
  else if(k==='%'){raw=String(Number(raw)/100);entry='';}
  else if(['+','−','×','÷'].includes(k)){lhs=Number(raw);op=k;fresh=true;entry='';}
  else if(k==='='&&lhs!==null){let b=Number(raw),n=op==='+'?lhs+b:op==='−'?lhs-b:op==='×'?lhs*b:b===0?NaN:lhs/b;raw=Number.isFinite(n)?String(Number(n.toPrecision(12))):'Error';lhs=null;op=null;fresh=true;entry='';}
  show();
 }
 gate.querySelectorAll('[data-calc]').forEach(b=>b.addEventListener('click',()=>press(b.dataset.calc)));
 document.addEventListener('keydown',e=>{
  if(gate.hidden||e.altKey||e.ctrlKey||e.metaKey)return;
  const map={'*':'×','/':'÷','-':'−','Enter':'=','Backspace':'⌫','Escape':'C'};
  const key=map[e.key]||e.key;
  if(/^[0-9.]$/.test(key)||['+','−','×','÷','=','⌫','C'].includes(key)){e.preventDefault();press(key);}
 });
 show();
})();
const el=id=>document.getElementById(id);
const state={controller:null,connection:null,frame:null,url:'',ready:false,loading:false,history:[],index:-1};
const status=msg=>{const n=el('browser-loading');if(n){n.textContent=msg;n.hidden=!msg;}};
function stopFrame(){
  // Destroying the browsing context stops its audio/video and network activity.
  if(state.frame){try{state.frame.frame.src='about:blank';state.frame.frame.remove();}catch(e){console.warn(e);}state.frame=null;}
  el('browser-frame-host').replaceChildren();
}
function home(){leaveGames();stopFrame();state.url='';state.history=[];state.index=-1;document.body.classList.remove('browser-active');el('browser-view').hidden=true;el('homepage').hidden=false;el('address').value='';status('');}
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
 leaveGames();state.loading=true;showBrowser();status('Loading…');el('address').value=url;
 try{
  await ensureProxy();
  // A new frame also guarantees the previous site's media stops.
  stopFrame();state.frame=state.controller.createFrame();state.frame.frame.id='sj-frame';el('browser-frame-host').appendChild(state.frame.frame);
  await state.frame.go(url);state.url=url;
  if(record){state.history=state.history.slice(0,state.index+1);state.history.push(url);state.index=state.history.length-1;}
 }catch(e){console.error('[NEXUS]',e);stopFrame();home();el('sj-error').textContent='This site could not be loaded through the proxy. Some sites or embedded video hosts may have certificate or compatibility errors.';}
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
// Save cloak preference until explicitly disabled. A browser may block automatic
// popups on page load, so offer a click-to-open button as a reliable fallback.
const CLOAK_KEY='nexus-auto-cloak';
function launchCloak(){
  if(window.top!==window.self)return false; // Never recurse inside the cloak iframe.
  const tab=window.open('about:blank','_blank');
  if(!tab)return false;
  try{
    tab.document.title='Super Math Learning!';
    const iframe=tab.document.createElement('iframe');
    iframe.src=location.href;
    iframe.title='Browser';
    Object.assign(iframe.style,{position:'fixed',inset:'0',width:'100%',height:'100%',border:'0'});
    tab.document.body.style.margin='0';tab.document.body.appendChild(iframe);
    location.assign('https://clever.com/');
    return true;
  }catch(err){try{tab.close()}catch(_){}return false;}
}
function offerCloakLaunch(){
  if(document.getElementById('nexus-cloak-launch'))return;
  const b=document.createElement('button');b.id='nexus-cloak-launch';
  b.textContent='Open saved about:blank mode';
  b.setAttribute('aria-label','Open saved about blank mode');
  Object.assign(b.style,{position:'fixed',bottom:'18px',right:'18px',zIndex:'999999',padding:'12px 16px',background:'#29213e',color:'#fff',border:'1px solid #7a6dd1',borderRadius:'12px',cursor:'pointer'});
  b.onclick=()=>{if(launchCloak())b.remove();};document.body.appendChild(b);
}
el('cloak').checked=localStorage.getItem(CLOAK_KEY)==='on';
el('apply').addEventListener('click',()=>{
 const theme=el('theme').value;setTheme(theme);localStorage.setItem('nexus-theme',theme);
 window.nexusMotionEnabled=el('motion').checked;localStorage.setItem('nexus-motion',window.nexusMotionEnabled?'on':'off');
 const enabled=el('cloak').checked;
 localStorage.setItem(CLOAK_KEY,enabled?'on':'off');
 if(enabled){if(!launchCloak())offerCloakLaunch();}
 else document.getElementById('nexus-cloak-launch')?.remove();
 el('modal').classList.remove('show');
});
if(localStorage.getItem(CLOAK_KEY)==='on' && window.top===window.self){
 // On load, Chrome commonly blocks window.open without a user gesture.
 // The explicit button is provided instead of claiming automatic launch works.
 setTimeout(()=>{if(!launchCloak())offerCloakLaunch();},0);
}
// Tab closing cannot be intercepted reliably. Explicit exit is dependable.
el('exit-clever').addEventListener('click',()=>{stopFrame();location.assign('https://clever.com/');});
// Best-effort warning only; developer tools cannot be securely detected or disabled by a website.
const warning=el('inspect-warning');let flagged=false;
function checkInspect(){if(flagged)return;const threshold=180;if((window.outerWidth-window.innerWidth>threshold)||(window.outerHeight-window.innerHeight>threshold)){flagged=true;warning.hidden=false;stopFrame();}}
setInterval(checkInspect,1500);

// NEXUS games: each launch creates a fresh iframe; exiting destroys it so media and timers stop.
const gamesView=el('games-view'),gamesLibrary=el('games-library'),gamePlayer=el('game-player'),gameHost=el('game-frame-host');
function destroyGame(){const f=gameHost.querySelector('iframe');if(f){try{f.src='about:blank';}catch(_){}f.remove();}gameHost.replaceChildren();}
function leaveGames(){destroyGame();gamesView.hidden=true;gamesLibrary.hidden=false;gamePlayer.hidden=true;document.body.classList.remove('games-active');}
function showGames(){stopFrame();state.url='';state.history=[];state.index=-1;el('browser-view').hidden=true;el('homepage').hidden=true;document.body.classList.remove('browser-active');document.body.classList.add('games-active');gamesView.hidden=false;gamesLibrary.hidden=false;gamePlayer.hidden=true;el('address').value='';}
function openGame(){destroyGame();gamesLibrary.hidden=true;gamePlayer.hidden=false;const f=document.createElement('iframe');f.src='/games/star-dodge.html';f.title='Star Dodge';f.setAttribute('allow','fullscreen');gameHost.append(f);}
el('games-launch').addEventListener('click',showGames);
el('games-back').addEventListener('click',home);
el('game-star-dodge').addEventListener('click',openGame);
el('game-back').addEventListener('click',()=>{destroyGame();gamePlayer.hidden=true;gamesLibrary.hidden=false;});
el('game-restart').addEventListener('click',openGame);
// Standalone top-level assistant avoids Document PiP restrictions inside an iframe.
el('ai-launch').addEventListener('click',()=>{
 const win=window.open('/learning.html','nexus_learning','popup=yes,width=420,height=650,resizable=yes,scrollbars=yes');
 if(win)win.focus();else window.location.href='/learning.html';
});
