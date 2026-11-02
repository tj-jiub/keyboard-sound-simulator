// ==UserScript==
// @name         스크롤컷 - 숏폼 차단
// @description  인스타그램·유튜브 웹에서 릴스/쇼츠/탐색/추천/광고를 숨기고 DM은 유지합니다.
// @version      1.0.0
// @match        https://www.instagram.com/*
// @match        https://m.youtube.com/*
// @match        https://www.youtube.com/*
// @run-at       document-start
// @noframes
// ==/UserScript==
(function(){
'use strict';
const KEY='scrollcut.cfg';
const DEF={short:true,explore:true,recs:true,ads:true,live:false};
let cfg;try{cfg=Object.assign({},DEF,JSON.parse(localStorage.getItem(KEY)||'{}'))}catch(e){cfg={...DEF}}
const save=()=>{try{localStorage.setItem(KEY,JSON.stringify(cfg))}catch(e){}};
const host=location.hostname,IG=host.includes('instagram'),YT=host.includes('youtube');
const style=document.createElement('style');style.id='sc-style';
function css(){
 const r=[];
 if(IG){
  if(cfg.short)r.push('a[href="/reels/"],a[href^="/reels/"]:not([href*="/reels/audio"])');
  if(cfg.explore)r.push('a[href="/explore/"],a[href^="/explore/"]');
  if(cfg.live)r.push('a[href*="/live/"]');
 }
 if(YT){
  if(cfg.short)r.push('ytd-reel-shelf-renderer','ytd-rich-shelf-renderer[is-shorts]','ytm-reel-shelf-renderer','ytm-shorts-lockup-view-model','ytm-shorts-lockup-view-model-v2',
   'ytd-guide-entry-renderer:has(a[title="Shorts"])','ytd-mini-guide-entry-renderer[aria-label="Shorts"]','ytm-pivot-bar-item-renderer:has(.pivot-shorts)',
   'ytd-video-renderer:has(a[href^="/shorts/"])','ytd-grid-video-renderer:has(a[href^="/shorts/"])','ytm-video-with-context-renderer:has(a[href^="/shorts/"])');
  if(cfg.ads)r.push('ytd-ad-slot-renderer','ytd-in-feed-ad-layout-renderer','ytd-display-ad-renderer','ytm-promoted-sparkles-web-renderer','#masthead-ad');
  if(cfg.live)r.push('ytd-video-renderer:has(ytd-badge-supported-renderer .badge-style-type-live-now)');
 }
 style.textContent=(r.length?r.join(',')+'{display:none!important}':'')+
 '#sc-fab{position:fixed;right:10px;bottom:90px;z-index:2147483647;width:40px;height:40px;border-radius:50%;background:#6c5ce7;color:#fff;font:20px/40px sans-serif;text-align:center;opacity:.55;border:0}'+
 '#sc-panel{position:fixed;right:10px;bottom:140px;z-index:2147483647;background:#181a21;color:#fff;border-radius:14px;padding:12px;font:14px sans-serif;min-width:200px;box-shadow:0 4px 20px #0008}'+
 '#sc-panel label{display:flex;justify-content:space-between;gap:12px;padding:6px 0}';
}
const ADWORDS=['Sponsored','광고','협찬'],RECWORDS=['Suggested for you','회원님을 위한 추천','추천 게시물','Suggested posts'];
function sweep(){
 // redirects: feed-style views only. A single reel/short shared via DM still opens.
 const p=location.pathname;
 if(cfg.short){
  if(IG&&(p==='/reels/'||p==='/reels'))return void location.replace('/');
  if(YT&&p.startsWith('/shorts/')){const id=p.split('/')[2];if(id)return void location.replace('/watch?v='+id)}
 }
 if(IG&&cfg.explore&&(p==='/explore/'||p.startsWith('/explore/')&&!p.startsWith('/explore/tags/')&&!p.startsWith('/explore/locations/')))return void location.replace('/');
 if(IG&&(cfg.ads||cfg.recs))document.querySelectorAll('article:not([data-sc])').forEach(a=>{
  const t=a.innerText||'';a.dataset.sc='1';
  if(cfg.ads&&ADWORDS.some(w=>t.includes('\n'+w+'\n')||t.endsWith('\n'+w)))a.style.display='none';
  if(cfg.recs&&RECWORDS.some(w=>t.includes(w)))a.style.display='none';
 });
}
function ui(){
 if(document.getElementById('sc-fab')||!document.body)return;
 const f=document.createElement('button');f.id='sc-fab';f.textContent='✂';
 f.onclick=()=>{let p=document.getElementById('sc-panel');if(p)return p.remove();
  p=document.createElement('div');p.id='sc-panel';
  const L={short:'릴스·쇼츠',explore:'탐색',recs:'추천',ads:'광고',live:'라이브'};
  p.innerHTML='<b>스크롤컷</b>'+Object.keys(L).map(k=>`<label>${L[k]}<input type="checkbox" data-k="${k}" ${cfg[k]?'checked':''}></label>`).join('');
  p.onchange=e=>{cfg[e.target.dataset.k]=e.target.checked;save();css();document.querySelectorAll('[data-sc]').forEach(x=>{delete x.dataset.sc;x.style.display=''});sweep()};
  document.body.appendChild(p)};
 document.body.appendChild(f);
}
css();(document.head||document.documentElement).appendChild(style);
let t;const run=()=>{clearTimeout(t);t=setTimeout(()=>{sweep();ui()},120)};
new MutationObserver(run).observe(document.documentElement,{childList:true,subtree:true});
addEventListener('popstate',run);addEventListener('yt-navigate-finish',run);run();
})();
