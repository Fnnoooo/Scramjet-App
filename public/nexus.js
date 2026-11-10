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
   if(entry.endsWith('0002')){entry='';gate.hidden=true;return;}
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
let proxyInitPromise=null;
async function ensureProxy(){
 if(state.ready && state.controller && state.connection)return;
 if(proxyInitPromise)return proxyInitPromise;
 proxyInitPromise=(async()=>{
  if(typeof $scramjetLoadController!=='function')throw Error('Scramjet bundle unavailable');
  if(typeof BareMux==='undefined')throw Error('BareMux bundle unavailable');
  if(typeof registerSW!=='function')throw Error('Service worker registration unavailable');
  // Register first, then wait for this page to be controlled. On first install,
  // the worker must claim the client before proxy requests are issued.
  await registerSW();
  if(!navigator.serviceWorker.controller){
   await Promise.race([
    new Promise(resolve=>navigator.serviceWorker.addEventListener('controllerchange',resolve,{once:true})),
    new Promise((_,reject)=>setTimeout(()=>reject(Error('Service worker did not take control; refresh the page')),12000))
   ]);
  }
  const {ScramjetController}=$scramjetLoadController();
  const controller=new ScramjetController({files:{wasm:'/scram/scramjet.wasm.wasm',all:'/scram/scramjet.all.js',sync:'/scram/scramjet.sync.js'}});
  await controller.init();
  const connection=new BareMux.BareMuxConnection('/baremux/worker.js');
  const wisp=(location.protocol==='https:'?'wss':'ws')+'://'+location.host+'/wisp/';
  // Set transport on every fresh page lifetime. A previous worker can retain
  // an old or disconnected transport even when getTransport() matches.
  await connection.setTransport('/libcurl/index.mjs',[{websocket:wisp}]);
  state.controller=controller;state.connection=connection;state.ready=true;
 })();
 try{await proxyInitPromise;}catch(e){state.ready=false;state.controller=null;state.connection=null;throw e;}
 finally{proxyInitPromise=null;}
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
// Best-effort developer-tools presentation only. Browser source remains inspectable.
const warning=el('inspect-warning');
let inspectShown=false, inspectHits=0;
function showInspectWarning(){
 if(inspectShown)return;
 inspectShown=true;
 warning.hidden=false;
 document.documentElement.classList.add('nexus-inspect-locked');
 stopFrame();destroyGame();
 console.clear();
 console.log('%cSTOP','color:#ff4747;font-size:64px;font-weight:900;text-shadow:0 0 22px #ff4747;');
 console.log('%cYour not supposed to be here, hurry and close up.','color:#ffffff;background:#171717;padding:12px 18px;font-size:19px;font-weight:700;border-left:5px solid #ff4747');
}
function checkInspect(){
 if(inspectShown||document.hidden)return;
 // Docked tools change the viewport. This is not a security boundary.
 const dw=Math.max(0,window.outerWidth-window.innerWidth);
 const dh=Math.max(0,window.outerHeight-window.innerHeight);
 if(dw>220||dh>220){if(++inspectHits>=3)showInspectWarning();}
 else inspectHits=0;
}
setInterval(checkInspect,1000);
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
 'geo':{name:'Fake Geo Dash',url:'https://www.miniplay.com/game/geometry-dash'},
 'chess':{name:'Chess.com',url:'https://www.chess.com/play/online'}
};
// Game sessions are isolated by a clean host-page reload on exit/restart.
// Scramjet's old frame/worker registrations and game WebSockets otherwise
// survive iframe cleanup and can leave Unity/WebGL games stuck at 99%.
const GAME_RESTORE_KEY='nexus-v13-next-game';
let selectedGame=null,gameLoadToken=0,activeGameFrame=null,gameKeepalive=null,gameWatchdog=null;
function pingGameWorker(){
 try{navigator.serviceWorker?.controller?.postMessage('nexus-game-keepalive');}catch(_){}
}
function startGameKeepalive(){
 if(gameKeepalive)return;
 pingGameWorker();
 gameKeepalive=setInterval(pingGameWorker,15000);
}
function destroyGame(){
 gameLoadToken++;
 if(gameWatchdog){clearTimeout(gameWatchdog);gameWatchdog=null;}
 if(gameKeepalive){clearInterval(gameKeepalive);gameKeepalive=null;}
 if(activeGameFrame){
  try{activeGameFrame.frame.src='about:blank';activeGameFrame.frame.remove();}catch(_){}
  activeGameFrame=null;
 }
 gameHost.querySelectorAll('iframe').forEach(f=>{
  try{f.src='about:blank';f.remove();}catch(_){}
 });
 gameHost.querySelectorAll('.game-connect-status').forEach(n=>n.remove());
}
function leaveGames(){
 destroyGame();
 gamesView.hidden=true;gamesLibrary.hidden=false;gamePlayer.hidden=true;
 document.body.classList.remove('games-active');
}
function showGames(){
 stopFrame();state.url='';state.history=[];state.index=-1;
 el('browser-view').hidden=true;el('homepage').hidden=true;
 document.body.classList.remove('browser-active');
 document.body.classList.add('games-active');
 gamesView.hidden=false;gamesLibrary.hidden=false;gamePlayer.hidden=true;
 el('address').value='';
}
function freshGameSession(next){
 // A full shell reload actually closes the Scramjet controller, transport,
 // outstanding requests and game WebGL contexts. No site data is erased.
 try{sessionStorage.setItem(GAME_RESTORE_KEY,JSON.stringify(next));}
 catch(e){console.warn('[NEXUS game restore]',e);}
 destroyGame();
 location.reload();
}
async function openGame(id){
 const game=gameCatalog[id];if(!game)return;
 selectedGame=id;destroyGame();const token=gameLoadToken;
 gamesLibrary.hidden=true;gamePlayer.hidden=false;
 el('game-current-title').textContent=game.name;
 el('game-external').href=game.url;
 const search=el('game-search');if(search)search.href='https://www.google.com/search?q='+encodeURIComponent(game.name+' play online');
 const hint=el('game-hint');
 hint.textContent='Connecting to '+game.name+'…';
 const message=document.createElement('div');message.className='game-connect-status';
 message.textContent='Starting game…';gameHost.append(message);
 try{
  if(game.direct){
   const f=document.createElement('iframe');f.title=game.name;f.loading='eager';
   f.setAttribute('allow','fullscreen; autoplay; gamepad');f.allowFullscreen=true;
   f.src=game.url;gameHost.append(f);message.remove();hint.textContent='Local game loaded.';return;
  }
  await ensureProxy();if(token!==gameLoadToken)return;
  // One fresh frame per host-page lifetime. The host reload on exit is
  // intentional: reusing a previously navigated WebGL iframe was insufficient.
  const proxyFrame=state.controller.createFrame();
  activeGameFrame=proxyFrame;
  const f=proxyFrame.frame;
  f.id='nexus-game-proxy';f.title=game.name;
  f.setAttribute('allow','fullscreen; autoplay; gamepad');f.allowFullscreen=true;
  gameHost.append(f);
  gameWatchdog=setTimeout(()=>{
   if(token!==gameLoadToken)return;
   message.hidden=false;
   message.textContent='Game is taking longer than expected. This can happen if game assets or WebSockets are blocked.';
   hint.textContent='Retry Connection creates a new game frame; Restart Session reloads the proxy connection.';
  },25000);
  message.textContent='Connecting through NEXUS proxy…';
  await proxyFrame.go(game.url);
  if(token!==gameLoadToken)return;
  message.hidden=true;
  hint.textContent='Game opened through Scramjet. If it stalls at 99%, try Restart Session or the direct game link.';
 }catch(e){
  if(token!==gameLoadToken)return;
  console.error('[NEXUS game]',game.name,e);
  destroyGame();
  gameHost.append(message);message.hidden=false;
  message.textContent='This game could not connect through the proxy. Try Restart, Open game directly, or Find another version below.';
  hint.textContent='Some games require cookies, WebGL, or connections the proxy cannot provide.';
 }
}
// Restore just the intended view after an intentional game cleanup reload.
// This is tab-scoped and consumed immediately; a normal fresh visit still
// shows the calculator until its normal unlock code is entered.
(function restoreGameView(){
 let next=null;
 try{
  const value=sessionStorage.getItem(GAME_RESTORE_KEY);
  if(value){sessionStorage.removeItem(GAME_RESTORE_KEY);next=JSON.parse(value);}
 }catch(_){}
 if(!next)return;
 el('calculator-gate').hidden=true;
 if(next.view==='game'&&gameCatalog[next.id]){
  showGames();openGame(next.id);
 }else if(next.view==='games'){showGames();}
})();
el('games-launch').addEventListener('click',showGames);
el('games-back').addEventListener('click',()=>{if(selectedGame)freshGameSession({view:'home'});else home();});
document.querySelectorAll('[data-game]').forEach(b=>b.addEventListener('click',()=>openGame(b.dataset.game)));
el('game-back').addEventListener('click',()=>freshGameSession({view:'games'}));
el('game-retry').addEventListener('click',()=>selectedGame&&freshGameSession({view:'game',id:selectedGame}));
el('game-restart').addEventListener('click',()=>selectedGame&&freshGameSession({view:'game',id:selectedGame}));
// Document PiP is opened directly from the main NEXUS tab. No popup host.
// The calculator and assistant live in ONE PiP iframe, so the user can switch
// to a captured tab while the floating assistant remains visible.
let learningWindow=null;
async function showLearningPanel(){
 if(learningWindow && !learningWindow.closed){
  try{learningWindow.focus();}catch(_){}
  return;
 }
 if(!window.documentPictureInPicture?.requestWindow){
  // Browser lacks Document PiP: show a single in-page fallback, no extra popup.
  let panel=document.getElementById('nexus-learning-fallback');
  if(!panel){
   panel=document.createElement('section');panel.id='nexus-learning-fallback';
   panel.style.cssText='position:fixed;right:12px;top:12px;width:min(440px,calc(100vw - 24px));height:min(690px,calc(100dvh - 24px));z-index:2147483647;background:#111827;border:1px solid #64748b;border-radius:18px;overflow:hidden;box-shadow:0 20px 70px #000b;';
   const close=document.createElement('button');close.textContent='×';close.title='Close Learning';close.style.cssText='position:absolute;right:8px;top:8px;z-index:3;border:0;border-radius:8px;background:#374151;color:white;font-size:22px;cursor:pointer';close.onclick=()=>panel.remove();
   const frame=document.createElement('iframe');frame.src='/learning.html';frame.allow='display-capture; clipboard-read; clipboard-write';frame.style.cssText='width:100%;height:100%;border:0';panel.append(frame,close);document.body.append(panel);
  }else panel.style.display='block';
  return;
 }
 try{
  const win=await documentPictureInPicture.requestWindow({width:460,height:710});
  learningWindow=win;
  win.document.title='Calculator';
  win.document.body.style.cssText='margin:0;background:#0b1020;height:100vh;overflow:hidden';
  const frame=win.document.createElement('iframe');
  frame.src='/learning.html';frame.title='Calculator';
  frame.allow='display-capture; clipboard-read; clipboard-write';
  frame.style.cssText='width:100%;height:100%;border:0;display:block';
  win.document.body.append(frame);
  win.addEventListener('pagehide',()=>{if(learningWindow===win)learningWindow=null;},{once:true});
 }catch(err){console.warn('Learning PiP unavailable:',err);}
}
el('ai-launch').addEventListener('click',showLearningPanel);
