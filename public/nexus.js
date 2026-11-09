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
// Cloak is opt-in and manually launched only. No automatic popups or launch banners.
const CLOAK_KEY='nexus-auto-cloak';
function launchCloak(){
 if(window.top!==window.self)return false;
 const tab=window.open('about:blank','_blank');
 if(!tab)return false;
 try{
  tab.document.title='Super Math Learning!';
  const iframe=tab.document.createElement('iframe');iframe.src=location.href;
  iframe.title='NEXUS Browser';Object.assign(iframe.style,{position:'fixed',inset:'0',width:'100%',height:'100%',border:'0'});
  tab.document.body.style.margin='0';tab.document.body.appendChild(iframe);
  return true;
 }catch(e){try{tab.close();}catch(_){}return false;}
}
el('cloak').checked=localStorage.getItem(CLOAK_KEY)==='on';
el('apply').addEventListener('click',()=>{
 const theme=el('theme').value;setTheme(theme);localStorage.setItem('nexus-theme',theme);
 window.nexusMotionEnabled=el('motion').checked;localStorage.setItem('nexus-motion',window.nexusMotionEnabled?'on':'off');
 localStorage.setItem(CLOAK_KEY,el('cloak').checked?'on':'off');
 el('modal').classList.remove('show');
});
// A click is required by browsers; only offer this within Settings, never on page load.
el('open-cloak')?.addEventListener('click',()=>{
 if(!launchCloak())el('cloak-help').textContent='Your browser blocked the new tab. Allow popups for this site to use this option.';
});
// Tab closing cannot be intercepted reliably. Explicit exit is dependable.
el('exit-clever').addEventListener('click',()=>{stopFrame();location.assign('https://clever.com/');});
// Best-effort warning only; developer tools cannot be securely detected or disabled by a website.
const warning=el('inspect-warning');let flagged=false;
function checkInspect(){if(flagged)return;const threshold=180;if((window.outerWidth-window.innerWidth>threshold)||(window.outerHeight-window.innerHeight>threshold)){flagged=true;warning.hidden=false;stopFrame();}}
// Disabled intrusive polling to reduce CPU usage and false positives.

// Game pages are created only when selected, and destroyed immediately on exit.
const gamesView=el('games-view'),gamesLibrary=el('games-library'),gamePlayer=el('game-player'),gameHost=el('game-frame-host');
const gameCatalog={
 'star-dodge':{name:'Star Dodge',url:'/games/star-dodge.html',direct:true},
 '2v2':{name:'2v2.io',url:'https://2v2.io/'},
 'fallzone':{name:'Fallzone.io',url:'https://fallzone.io/'},
 'among-us':{name:'Among Us',url:'https://wasm.rip/files/amongus/latest/'},
 'subway':{name:'Subway Surfers',url:'https://poki.com/se/g/subway-surfers'},
 'minecraft':{name:'Minecraft Classic',url:'https://classic.minecraft.net/'},
 'baldi':{name:"Baldi's Basics Party",url:'https://wasm.rip/files/birthdaybash/index.html'},
 'fnaf':{name:'Five Nights at Freddy’s',url:'https://www.miniplay.com/game/five-nights-at-freddys'},
 'granny':{name:'Granny Original',url:'https://playhop.com/app/granny-original-259805'},
 'geo':{name:'Fake Geo Dash',url:'https://www.miniplay.com/game/geometry-dash'}
};
let selectedGame=null,gameLoadToken=0,activeGameFrame=null;
function destroyGame(){
 gameLoadToken++;
 if(activeGameFrame){try{activeGameFrame.frame.src='about:blank';activeGameFrame.frame.remove();}catch(_){}activeGameFrame=null;}
 gameHost.querySelectorAll('iframe').forEach(f=>{try{f.src='about:blank';}catch(_){}f.remove();});
 gameHost.replaceChildren();
}
function leaveGames(){destroyGame();gamesView.hidden=true;gamesLibrary.hidden=false;gamePlayer.hidden=true;document.body.classList.remove('games-active');}
function showGames(){stopFrame();state.url='';state.history=[];state.index=-1;el('browser-view').hidden=true;el('homepage').hidden=true;document.body.classList.remove('browser-active');document.body.classList.add('games-active');gamesView.hidden=false;gamesLibrary.hidden=false;gamePlayer.hidden=true;el('address').value='';}
async function openGame(id){
 const game=gameCatalog[id];if(!game)return;
 selectedGame=id;destroyGame();const token=gameLoadToken;
 gamesLibrary.hidden=true;gamePlayer.hidden=false;
 el('game-current-title').textContent=game.name;
 el('game-external').href=game.url;
 const search=el('game-search');if(search)search.href='https://www.google.com/search?q='+encodeURIComponent(game.name+' play online');
 const hint=el('game-hint');
 hint.textContent='Connecting to '+game.name+'…';
 const message=document.createElement('div');message.className='game-connect-status';message.textContent='Starting game…';gameHost.append(message);
 try{
  if(game.direct){
   const f=document.createElement('iframe');f.title=game.name;f.loading='eager';f.setAttribute('allow','fullscreen; autoplay; gamepad');f.allowFullscreen=true;
   f.src=game.url;gameHost.append(f);message.remove();hint.textContent='Local game loaded.';return;
  }
  // Third-party games must use the same Scramjet proxy as other browser shortcuts.
  await ensureProxy();if(token!==gameLoadToken)return;
  const proxyFrame=state.controller.createFrame();activeGameFrame=proxyFrame;
  const f=proxyFrame.frame;f.title=game.name;f.id='nexus-game-proxy';f.setAttribute('allow','fullscreen; autoplay; gamepad');f.allowFullscreen=true;
  gameHost.append(f);message.textContent='Connecting through NEXUS proxy…';
  await proxyFrame.go(game.url);if(token!==gameLoadToken)return;
  message.remove();hint.textContent='Loaded through NEXUS proxy. If the game stays blank, try Open game directly or Find another version.';
 }catch(e){
  if(token!==gameLoadToken)return;
  console.error('[NEXUS game]',game.name,e);
  if(activeGameFrame){try{activeGameFrame.frame.remove();}catch(_){}activeGameFrame=null;}
  message.textContent='This game could not connect through the proxy. Try Open game directly or Find another version below.';
  hint.textContent='Some games block proxies, require cookies or WebGL, or refuse embedded connections.';
 }
}
el('games-launch').addEventListener('click',showGames);
el('games-back').addEventListener('click',home);
document.querySelectorAll('[data-game]').forEach(b=>b.addEventListener('click',()=>openGame(b.dataset.game)));
el('game-back').addEventListener('click',()=>{destroyGame();gamePlayer.hidden=true;gamesLibrary.hidden=false;});
el('game-restart').addEventListener('click',()=>selectedGame&&openGame(selectedGame));
// Standalone top-level assistant avoids Document PiP restrictions inside an iframe.
el('ai-launch').addEventListener('click',()=>{
 const win=window.open('/learning.html','nexus_learning','popup=yes,width=420,height=650,resizable=yes,scrollbars=yes');
 if(win)win.focus();else window.location.href='/learning.html';
});
