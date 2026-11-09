"use strict";
const {ScramjetController}=$scramjetLoadController();
const scramjet=new ScramjetController({files:{wasm:'/scram/scramjet.wasm.wasm',all:'/scram/scramjet.all.js',sync:'/scram/scramjet.sync.js'}});
scramjet.init();
const connection=new BareMux.BareMuxConnection('/baremux/worker.js');
const $=id=>document.getElementById(id);
let frame=null,currentURL='',busy=false;
async function navigate(input){
 if(busy)return;
 const url=search(input,'https://www.google.com/search?q=%s');
 if(!url)return;
 busy=true; $('sj-error').textContent='';$('sj-error-code').textContent='';
 $('browser-loading').hidden=false;$('browser-view').hidden=false;$('homepage').hidden=true;
 document.querySelector('.footer').hidden=true;document.body.classList.add('browser-active');$('address').value=url;
 try{
  await registerSW();
  const wispUrl=(location.protocol==='https:'?'wss':'ws')+'://'+location.host+'/wisp/';
  if((await connection.getTransport())!=='/libcurl/index.mjs')await connection.setTransport('/libcurl/index.mjs',[{websocket:wispUrl}]);
  if(!frame){frame=scramjet.createFrame();frame.frame.id='sj-frame';$('browser-frame-host').appendChild(frame.frame)}
  currentURL=url;await frame.go(url);
  setTimeout(()=>{$('browser-loading').hidden=true},1800);
 }catch(err){$('browser-loading').hidden=true;home();$('sj-error').textContent='Unable to open this website.';$('sj-error-code').textContent=String(err)}finally{busy=false}
}
function home(){document.body.classList.remove('browser-active');$('browser-view').hidden=true;$('homepage').hidden=false;document.querySelector('.footer').hidden=false;$('address').value='';}
$('searchform').addEventListener('submit',e=>{e.preventDefault();navigate($('search').value)});
$('address').addEventListener('keydown',e=>{if(e.key==='Enter')navigate(e.target.value)});
document.querySelectorAll('[data-url]').forEach(b=>b.addEventListener('click',()=>navigate(b.dataset.url)));
$('nav-home').onclick=home;
$('nav-refresh').onclick=()=>{if(frame&&currentURL)navigate(currentURL);else location.reload()};
function historyNav(direction){if(!frame)return;try{const w=frame.frame.contentWindow;if(direction==='back')w.history.back();else w.history.forward()}catch{ /* Cross-origin history access may be unavailable */ }}
$('nav-back').onclick=()=>historyNav('back');$('nav-forward').onclick=()=>historyNav('forward');
$('settings').onclick=()=>{$('modal').classList.add('show')};
$('close').onclick=()=>{$('modal').classList.remove('show')};
$('modal').onclick=e=>{if(e.target.id==='modal')$('modal').classList.remove('show')};
$('fullscreen').onclick=()=>{if(!document.fullscreenElement)document.documentElement.requestFullscreen?.();else document.exitFullscreen?.()};
$('theme').onchange=e=>{document.body.classList.remove('theme-halloween','theme-christmas');if(e.target.value!=='default')document.body.classList.add('theme-'+e.target.value)};
$('motion').onchange=e=>{window.nexusMotionEnabled=e.target.checked};
