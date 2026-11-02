'use strict';
const FEATS=[
 ['short','숏폼 피드 차단','릴스·쇼츠·스토리 외 영상 피드'],
 ['recs','추천·알고리즘 차단','추천 게시물과 제안 콘텐츠'],
 ['explore','탐색 페이지 차단','탐색·디스커버리 탭'],
 ['live','라이브·쇼핑 차단','라이브 방송과 쇼핑 탭'],
 ['ads','광고 차단','광고·협찬 게시물'],
 ['dm','DM 허용','메시지와 대화는 그대로'],
 ['onevid','받은 영상 1개만 보기','친구가 보낸 영상만, 다음 영상 스크롤 불가'],
 ['stories','스토리 유지','피드를 막아도 스토리는 보기']];
const PLATFORMS=[
 {id:'ig',name:'인스타그램',ico:'📸',bg:'#e1306c',def:{short:1,recs:1,explore:1,live:0,ads:1,dm:1,onevid:1,stories:1}},
 {id:'yt',name:'유튜브',ico:'▶️',bg:'#ff0033',def:{short:1,recs:0,explore:0,live:0,ads:0,dm:1,onevid:1,stories:1}},
 {id:'sc',name:'스냅챗',ico:'👻',bg:'#f5c800',def:{short:1,recs:1,explore:1,live:0,ads:1,dm:1,onevid:1,stories:0}},
 {id:'x',name:'X (트위터)',ico:'✖️',bg:'#333',def:{short:1,recs:1,explore:1,live:0,ads:1,dm:1,onevid:1,stories:0}},
 {id:'rd',name:'레딧',ico:'👽',bg:'#ff4500',def:{short:1,recs:1,explore:1,live:0,ads:1,dm:1,onevid:1,stories:0}},
 {id:'fb',name:'페이스북',ico:'📘',bg:'#1877f2',def:{short:1,recs:1,explore:1,live:1,ads:1,dm:1,onevid:1,stories:1}},
 {id:'tt',name:'틱톡',ico:'🎵',bg:'#111',def:{short:1,recs:1,explore:1,live:1,ads:1,dm:1,onevid:1,stories:0}}];
const PLANS=[
 {id:'m',name:'프로 월간',price:'월 5,900원',sub:'언제든 해지'},
 {id:'y',name:'프로 연간',price:'연 39,000원',sub:'월 3,250원 · 45% 할인',best:1},
 {id:'f',name:'가족 월간',price:'월 9,900원',sub:'최대 5명'}];
const FREE_LIMIT=1, DAYS=['월','화','수','목','금','토','일'];
const KEY='scrollcut.v1';
const fresh=()=>({onboarded:false,pro:false,tab:'home',platforms:Object.fromEntries(PLATFORMS.map(p=>[p.id,{on:p.id==='ig',feats:{...p.def}}])),
 routines:[{id:1,name:'업무 시간',from:'09:00',to:'18:00',days:[0,1,2,3,4],plats:['ig','yt'],on:true}],
 sleep:{on:false,from:'23:00',to:'07:00'},focus:false,postUntil:0,postPlat:null,
 stats:[142,118,96,88,64,51,0],blocked:0,open:null,pv:'ig',ob:0,plan:'y'});
let S;try{S=Object.assign(fresh(),JSON.parse(localStorage.getItem(KEY)||'{}'))}catch(e){S=fresh()}
const save=()=>{try{localStorage.setItem(KEY,JSON.stringify(S))}catch(e){}};
const $=s=>document.querySelector(s), P=id=>PLATFORMS.find(p=>p.id===id);
const activeCount=()=>PLATFORMS.filter(p=>S.platforms[p.id].on).length;
const toast=m=>{const t=$('#toast');t.textContent=m;t.classList.add('show');clearTimeout(toast.t);toast.t=setTimeout(()=>t.classList.remove('show'),1800)};
const hm=s=>{const [h,m]=s.split(':').map(Number);return h*60+m};
function inWindow(from,to,now){const f=hm(from),t=hm(to);return f<=t?now>=f&&now<t:now>=f||now<t}
function scheduledOn(pid){ // routine / sleep active now?
 const d=new Date(),now=d.getHours()*60+d.getMinutes(),wd=(d.getDay()+6)%7;
 if(S.sleep.on&&inWindow(S.sleep.from,S.sleep.to,now))return '수면 모드';
 for(const r of S.routines)if(r.on&&r.plats.includes(pid)&&r.days.includes(wd)&&inWindow(r.from,r.to,now))return r.name;
 return null}
function postActive(pid){return S.postUntil>Date.now()&&S.postPlat===pid}
function blocking(pid){ // is blocking effectively active?
 if(postActive(pid))return false;
 return S.platforms[pid].on||S.focus||!!scheduledOn(pid)}
const toggle=(on,act,dis)=>`<div class="tog ${on?'on':''} ${dis?'dis':''}" data-act="${act}"></div>`;

function setPlat(id){
 const st=S.platforms[id];
 if(!st.on&&!S.pro&&activeCount()>=FREE_LIMIT){toast('무료 플랜은 앱 1개까지예요');S.tab='pro';return render()}
 st.on=!st.on;save();render()}
function startPost(id){
 if(!S.pro){toast('포스트 모드는 프로 기능이에요');S.tab='pro';return render()}
 S.postUntil=Date.now()+10*60000;S.postPlat=id;save();toast('10분간 차단을 잠시 해제합니다');render()}

/* ---------- views ---------- */
function vOnboard(){
 const pages=[
 ['🎯','스크롤은 끊고, 필요한 건 그대로','릴스·쇼츠 같은 끝없는 영상만 지워요.\nSNS를 완전히 끊지 않아도 됩니다.'],
 ['💬','DM은 남기고 피드는 지워요','메시지, 내가 찾은 프로필, 친구가 보낸 영상은 그대로.\n받은 영상은 1개만 보고 다음으로 넘어갈 수 없어요.'],
 ['🛡️','앱별로 켜고 끄세요','인스타·유튜브·스냅·X·레딧·페이스북·틱톡.\n루틴과 수면 모드로 시간대별 자동 차단도 가능해요.']];
 const [e,t,d]=pages[S.ob];
 return `<div class="center"><div class="emoji">${e}</div><h1>${t}</h1><p class="mut" style="white-space:pre-line">${d}</p>
 <div class="dots">${pages.map((_,i)=>`<i class="${i===S.ob?'on':''}"></i>`).join('')}</div>
 <button class="btn" data-act="obnext">${S.ob<2?'다음':'시작하기'}</button></div>`}

function vHome(){
 const on=PLATFORMS.filter(p=>blocking(p.id)).length;
 const left=S.postUntil-Date.now();
 const total=S.stats.slice(0,6).reduce((a,b)=>a+b,0)+Math.round(S.blocked*0.5);
 return `<h1>스크롤컷 <span class="pill ${S.pro?'pro':''}">${S.pro?'PRO':'FREE'}</span></h1>
 <p class="mut">${on?`지금 ${on}개 앱에서 숏폼을 차단 중이에요`:'차단 중인 앱이 없어요'}</p><div style="height:10px"></div>
 ${left>0?`<div class="banner">✍️ ${P(S.postPlat).name} 포스트 모드 · ${Math.floor(left/60000)}분 ${String(Math.floor(left/1000)%60).padStart(2,'0')}초 남음
 <button class="btn sm ghost" style="float:right" data-act="endpost">종료</button></div>`:''}
 <div class="hero"><div class="mut" style="color:#fff9">이번 주 아낀 시간 (예시 포함)</div><div class="big">${Math.floor(total/60)}시간 ${total%60}분</div>
 <p style="color:#fffc;font-size:13px">차단한 콘텐츠 ${S.blocked}개 (체험 탭 기준)</p></div>
 <div class="row card"><div class="ico" style="background:#2a2d38">🎧</div><div class="sp"><b>집중 모드</b><p class="mut">켜져 있는 동안 모든 앱을 차단</p></div>${toggle(S.focus,'focus')}</div>
 <h2>내 앱 ${S.pro?'':`<span class="mut">(무료 ${FREE_LIMIT}개)</span>`}</h2>
 ${PLATFORMS.map(p=>{const st=S.platforms[p.id],sc=scheduledOn(p.id),b=blocking(p.id);
  return `<div class="card"><div class="row" data-act="open:${p.id}" style="cursor:pointer"><div class="ico" style="background:${p.bg}">${p.ico}</div>
  <div class="sp"><b>${p.name}</b><p class="mut">${postActive(p.id)?'포스트 모드로 일시 해제':b?(st.on?'차단 중':`${sc||'집중 모드'}로 차단 중`):'차단 꺼짐'} · 설정 ›</p></div>
  <div data-stop onclick="event.stopPropagation()">${toggle(st.on,'plat:'+p.id)}</div></div>
  ${S.open===p.id?`<div style="margin-top:12px;border-top:1px solid var(--bd)">${FEATS.map(f=>`<div class="row" style="padding:10px 0"><div class="sp"><b style="font-size:14px">${f[1]}</b><p class="mut">${f[2]}</p></div>${toggle(st.feats[f[0]],`feat:${p.id}:${f[0]}`)}</div>`).join('')}
  <button class="btn ghost" data-act="post:${p.id}">✍️ 포스트 모드 (10분 해제) ${S.pro?'':'🔒'}</button></div>`:''}</div>`}).join('')}
 ${S.pro?'':`<div class="card" data-act="tab:pro" style="cursor:pointer;border-color:var(--ac2)"><b>⭐ 프로로 모든 앱 · 루틴 · 포스트 모드 열기</b><p class="mut">연 39,000원부터</p></div>`}`}

function vPreview(){
 const pid=S.pv,p=P(pid),f=S.platforms[pid].feats,b=blocking(pid);
 const items=[
  {t:'short',who:'friend_a',tx:'🎬 릴스 · 고양이 점프 모음',c:'#6c5ce7',e:'🐱'},
  {t:'normal',who:'my_friend',tx:'오늘 점심 🍜',c:'#00b894',e:'🍜'},
  {t:'ads',who:'광고 · 브랜드샵',tx:'지금 사면 50% 할인!',c:'#d63031',e:'🛍️'},
  {t:'recs',who:'추천 · unknown_user',tx:'당신이 좋아할 만한 게시물',c:'#e17055',e:'✨'},
  {t:'explore',who:'탐색 · 인기 영상',tx:'지금 뜨는 콘텐츠',c:'#0984e3',e:'🔥'},
  {t:'live',who:'라이브 · streamer',tx:'🔴 LIVE 시청자 1.2만명',c:'#e84393',e:'📡'},
  {t:'normal',who:'family_kim',tx:'주말 가족사진 👨‍👩‍👧',c:'#00cec9',e:'🏞️'},
  {t:'short',who:'creator_b',tx:'🎬 쇼츠 · 10초 요리',c:'#fdcb6e',e:'🍳'}];
 let blockedHere=0;
 const feed=items.map(i=>{const hide=b&&i.t!=='normal'&&f[i.t];
  if(hide){blockedHere++;return `<div class="shield">🛡️ ${i.t==='short'?'숏폼':i.t==='ads'?'광고':i.t==='live'?'라이브':'추천 콘텐츠'} 차단됨</div>`}
  return `<div class="post"><b>${i.who}</b><div class="img" style="background:${i.c}33">${i.e}</div><span class="mut">${i.tx}</span></div>`}).join('');
 return `<h1>체험</h1><p class="mut">차단 설정이 피드에 어떻게 적용되는지 보여주는 미리보기예요.</p>
 <div style="margin:10px 0">${PLATFORMS.map(x=>`<span class="chip ${x.id===pid?'on':''}" data-act="pv:${x.id}">${x.ico} ${x.name}</span>`).join('')}</div>
 <p class="mut" style="margin-bottom:8px">${b?`🛡️ 차단 켜짐 · ${blockedHere}개 숨김`:'⚠️ 이 앱은 차단이 꺼져 있어요 (홈에서 켜기)'}</p>
 <div class="phone">${f.dm?'<div class="post" style="background:#1a2a1f">💬 <b>DM</b> · 친구가 영상을 보냈어요 <button class="btn sm ghost" data-act="onevid">▶ 보기</button></div>':'<div class="shield">💬 DM 차단됨</div>'}${feed}</div>`}

function vRoutine(){
 const lock=!S.pro;
 return `<h1>루틴</h1><p class="mut">정해진 시간에 자동으로 차단해요 ${lock?'<span class="pill pro">PRO</span>':''}</p>
 <div class="row card"><div class="ico" style="background:#2a2d38">🌙</div><div class="sp"><b>수면 모드</b><p class="mut"><input type="time" value="${S.sleep.from}" data-sl="from"> ~ <input type="time" value="${S.sleep.to}" data-sl="to"></p></div>${toggle(S.sleep.on,'sleep')}</div>
 <h2>시간대 루틴</h2>
 ${S.routines.map(r=>`<div class="card"><div class="row"><b class="sp">${r.name}</b>${toggle(r.on,'rt:'+r.id)}<span data-act="del:${r.id}" style="cursor:pointer">🗑️</span></div>
 <p class="mut" style="margin:8px 0"><input type="time" value="${r.from}" data-rt="${r.id}:from"> ~ <input type="time" value="${r.to}" data-rt="${r.id}:to"></p>
 <div>${DAYS.map((d,i)=>`<span class="chip ${r.days.includes(i)?'on':''}" data-act="rd:${r.id}:${i}">${d}</span>`).join('')}</div>
 <div>${PLATFORMS.map(x=>`<span class="chip ${r.plats.includes(x.id)?'on':''}" data-act="rp:${r.id}:${x.id}">${x.ico}</span>`).join('')}</div></div>`).join('')}
 <button class="btn" data-act="addrt">＋ 루틴 추가</button>`}

function vStats(){
 const days=['월','화','수','목','금','토','오늘'];
 const v=[...S.stats.slice(0,6),Math.round(S.blocked*0.5)];const mx=Math.max(...v,60);
 return `<h1>통계</h1><p class="mut">하루에 아낀 시간(분). 오늘 이전 값은 예시 데이터예요.</p>
 <div class="card"><div class="bars">${v.map((x,i)=>`<div><i style="height:${Math.max(4,x/mx*100)}px"></i>${days[i]}<br>${x}</div>`).join('')}</div></div>
 <div class="card"><b>오늘 차단한 콘텐츠</b><p style="font-size:28px;font-weight:800">${S.blocked}개</p><p class="mut">체험 탭에서 차단 화면이 나올 때마다 집계돼요. 1개당 0.5분으로 환산합니다.</p></div>`}

function vPro(){
 return `<h1>⭐ 스크롤컷 프로</h1><p class="mut">끝없는 스크롤에서 시간을 되찾으세요</p><div style="height:12px"></div>
 <div class="card">✔ 모든 앱 동시 차단 (무료는 1개)<br>✔ 루틴 · 수면 모드 자동화<br>✔ 포스트 모드 (10분 임시 해제)<br>✔ 상세 통계와 가족 공유</div>
 ${PLANS.map(p=>`<div class="sub ${S.plan===p.id?'sel':''}" data-act="plan:${p.id}"><div class="row"><div class="sp"><b>${p.name}</b> ${p.best?'<span class="pill pro">추천</span>':''}<p class="mut">${p.sub}</p></div><b>${p.price}</b></div></div>`).join('')}
 ${S.pro?`<button class="btn ghost" data-act="cancel">구독 해지 (데모)</button>`:`<button class="btn" data-act="buy">7일 무료 체험 시작</button>`}
 <p class="mut" style="margin-top:10px">※ 데모 앱이라 실제 결제는 이루어지지 않아요.</p>`}

function vSettings(){
 return `<h1>설정</h1>
 <div class="card row" data-act="tab:pro" style="cursor:pointer"><b class="sp">구독 관리</b><span class="mut">${S.pro?'PRO 이용 중':'무료'} ›</span></div>
 <div class="card"><b>🧩 실제 차단 켜기 (사파리)</b>
 <p class="mut" style="margin:6px 0">1. App Store에서 무료 앱 <b>Userscripts</b> 설치 → 설정 &gt; Safari &gt; 확장 프로그램에서 켜기, 모든 웹사이트 허용<br>2. 아래 버튼으로 스크립트를 열고 Userscripts 안내에 따라 설치<br>3. 사파리에서 instagram.com / youtube.com 사용 (네이티브 앱은 삭제 권장)<br>4. 페이지 오른쪽 아래 ✂ 버튼으로 항목별 켜고 끄기</p>
 <a class="btn" style="text-decoration:none;text-align:center" href="scrollcut.user.js">스크립트 열기</a>
 <p class="mut" style="margin-top:8px">사이트 화면 구조가 바뀌면 일부가 안 막힐 수 있어요.</p></div>
 <div class="card"><b>iOS 앱으로 전환하려면</b><p class="mut">이 웹앱은 화면과 설정 흐름을 구현한 버전이에요. 브라우저는 다른 앱(인스타·유튜브)을 실제로 차단할 수 없어, 진짜 차단은 iOS의 스크린타임(Family Controls) API를 쓰는 네이티브 앱이 필요합니다.</p></div>
 <button class="btn ghost" data-act="reset">모든 데이터 초기화</button>`}

const VIEWS={home:vHome,preview:vPreview,routine:vRoutine,stats:vStats,pro:vPro,settings:vSettings};
function countBlocked(){const id=S.pv;if(blocking(id)){const f=S.platforms[id].feats;S.blocked+=['short','short','ads','recs','explore','live'].filter(k=>f[k]).length}}
function render(){
 const a=$('#app');
 if(!S.onboarded){a.innerHTML=vOnboard();return}
 const nav=[['home','🏠','홈'],['preview','👀','체험'],['routine','⏰','루틴'],['stats','📊','통계'],['settings','⚙️','설정']];
 a.innerHTML=VIEWS[S.tab]()+`<nav>${nav.map(n=>`<a class="${S.tab===n[0]||(S.tab==='pro'&&n[0]==='settings')?'on':''}" data-act="tab:${n[0]}"><b>${n[1]}</b>${n[2]}</a>`).join('')}</nav>`}

document.addEventListener('click',e=>{
 const el=e.target.closest('[data-act]');if(!el)return;
 const [k,a,b]=el.dataset.act.split(':');
 switch(k){
  case 'obnext':if(S.ob<2)S.ob++;else S.onboarded=true;break;
  case 'tab':S.tab=a;if(a==='preview')countBlocked();break;
  case 'focus':S.focus=!S.focus;toast(S.focus?'집중 모드 켜짐':'집중 모드 꺼짐');break;
  case 'plat':return setPlat(a);
  case 'open':S.open=S.open===a?null:a;break;
  case 'feat':{const f=S.platforms[a].feats;f[b]=f[b]?0:1;break}
  case 'post':return startPost(a);
  case 'endpost':S.postUntil=0;break;
  case 'pv':S.pv=a;countBlocked();break;
  case 'onevid':toast('이 영상만 볼 수 있어요. 다음 영상으로 넘길 수 없어요');return;
  case 'sleep':if(!S.pro){toast('수면 모드는 프로 기능이에요');S.tab='pro';break}S.sleep.on=!S.sleep.on;break;
  case 'rt':if(!S.pro){toast('루틴은 프로 기능이에요');S.tab='pro';break}{const r=S.routines.find(x=>x.id==a);r.on=!r.on}break;
  case 'del':S.routines=S.routines.filter(x=>x.id!=a);break;
  case 'rd':{const r=S.routines.find(x=>x.id==a),i=+b;r.days=r.days.includes(i)?r.days.filter(d=>d!==i):[...r.days,i];break}
  case 'rp':{const r=S.routines.find(x=>x.id==a);r.plats=r.plats.includes(b)?r.plats.filter(d=>d!==b):[...r.plats,b];break}
  case 'addrt':if(!S.pro){toast('루틴 추가는 프로 기능이에요');S.tab='pro';break}
   S.routines.push({id:Date.now(),name:'새 루틴',from:'20:00',to:'22:00',days:[0,1,2,3,4,5,6],plats:['ig'],on:true});break;
  case 'plan':S.plan=a;break;
  case 'buy':S.pro=true;S.tab='home';toast('프로 활성화! (데모)');break;
  case 'cancel':S.pro=false;Object.values(S.platforms).forEach((s,i)=>{if(i>0)s.on=false});toast('구독이 해지됐어요');break;
  case 'reset':if(confirm('모든 데이터를 초기화할까요?')){S=fresh()}else return;break;
 }
 save();render()});
document.addEventListener('change',e=>{
 const t=e.target;if(t.dataset.sl){S.sleep[t.dataset.sl]=t.value}
 if(t.dataset.rt){const [id,f]=t.dataset.rt.split(':');S.routines.find(x=>x.id==id)[f]=t.value}save()});
setInterval(()=>{if(S.tab==='home'&&S.postUntil>0){if(S.postUntil<Date.now()){S.postUntil=0;save();toast('포스트 모드 종료 · 차단 재개')}render()}},1000);
render();
if('serviceWorker'in navigator)navigator.serviceWorker.register('sw.js').catch(()=>{});
