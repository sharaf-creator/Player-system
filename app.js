const $=id=>document.getElementById(id);
const STORAGE="playerSystemSave_v1";
const statDefs={strength:{label:"STRENGTH",icon:"⚔",desc:"Training & physical power"},intelligence:{label:"INTELLIGENCE",icon:"▣",desc:"Study & learning"},agility:{label:"AGILITY",icon:"➶",desc:"Sport & mobility"},vitality:{label:"VITALITY",icon:"✚",desc:"Sleep & recovery"},discipline:{label:"DISCIPLINE",icon:"◈",desc:"Consistency & self-control"}};
const defaults=[
 {id:"workout",name:"Train or move your body for 30 minutes",stat:"strength",xp:30},
 {id:"study",name:"Focused study session (60 minutes)",stat:"intelligence",xp:30},
 {id:"learn",name:"Learn something new for 20 minutes",stat:"intelligence",xp:15},
 {id:"movement",name:"Walk, stretch or practice a sport",stat:"agility",xp:15},
 {id:"water",name:"Drink enough water throughout the day",stat:"vitality",xp:10},
 {id:"sleep",name:"Protect your sleep routine",stat:"vitality",xp:15},
 {id:"skincare",name:"Complete your simple skincare routine",stat:"discipline",xp:10},
 {id:"focus",name:"Keep one promise to yourself",stat:"discipline",xp:15}
];
let state=load();
function fresh(){return {name:"HUNTER",xp:0,stats:{strength:10,intelligence:10,agility:10,vitality:10,discipline:10},quests:defaults.map(q=>({...q})),completed:{},history:[],streak:0,lastActive:"",bossClaimed:[],created:Date.now()};}
function load(){try{const s=JSON.parse(localStorage.getItem(STORAGE));return s&&s.stats&&s.quests?s:fresh()}catch{return fresh()}}
function save(){localStorage.setItem(STORAGE,JSON.stringify(state))}
function dayKey(d=new Date()){return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,"0")}-${String(d.getDate()).padStart(2,"0")}`}
function weekKey(){const d=new Date();const first=new Date(d.getFullYear(),0,1);return `${d.getFullYear()}-W${Math.ceil((((d-first)/86400000)+first.getDay()+1)/7)}`}
function levelInfo(){let level=1,remaining=state.xp;while(remaining>=level*100){remaining-=level*100;level++}return {level,into:remaining,need:level*100}}
function rankFor(level){return level>=50?"NATIONAL":level>=35?"S":level>=25?"A":level>=17?"B":level>=10?"C":level>=5?"D":"E"}
function todayDone(){return state.completed[dayKey()]||[]}
function allHistory(){return [...state.history].slice(-30).reverse()}
function toast(msg){const t=$("toast");t.textContent=msg;t.classList.add("show");setTimeout(()=>t.classList.remove("show"),2200)}
function render(){
 const li=levelInfo(),rank=rankFor(li.level);$("greeting").textContent=`WELCOME, ${(state.name||"HUNTER").toUpperCase()}`;$("rank").textContent=rank==="NATIONAL"?"N":rank;$("level").textContent=String(li.level).padStart(2,"0");$("title").textContent=li.level<5?"New Awakening":li.level<10?"Rising Hunter":li.level<17?"Trained Hunter":li.level<25?"Elite Hunter":li.level<35?"Master Hunter":"Shadow Monarch";$("totalXp").textContent=state.xp.toLocaleString();$("xpLabel").textContent=`${li.into} / ${li.need} XP`;$("xpPercent").textContent=`${Math.floor(li.into/li.need*100)}%`;$("xpBar").style.width=`${li.into/li.need*100}%`;$("streak").textContent=`${state.streak} DAY STREAK`;$("today").textContent=new Date().toLocaleDateString(undefined,{weekday:"short",month:"short",day:"numeric"}).toUpperCase();
 $("statsGrid").innerHTML=Object.entries(statDefs).map(([k,v])=>`<article class="stat-card"><div class="stat-top"><span class="stat-name">${v.label}</span><span class="stat-icon">${v.icon}</span></div><div class="stat-value">${state.stats[k]}</div><div class="stat-bar"><i style="width:${Math.min(100,state.stats[k])}%"></i></div><div class="stat-sub">${v.desc}</div></article>`).join("");
 const done=todayDone();let earned=0;$("questList").innerHTML=state.quests.map(q=>{const yes=done.includes(q.id);if(yes)earned+=q.xp;return `<label class="quest ${yes?"done":""}"><input class="check" type="checkbox" data-q="${q.id}" ${yes?"checked":""}><span class="quest-main"><span class="quest-name">${esc(q.name)}</span><span class="quest-meta">${statDefs[q.stat]?.label||"DISCIPLINE"} · ${q.custom?"CUSTOM QUEST":"DAILY QUEST"}</span></span><span class="quest-xp">+${q.xp} XP</span></label>`}).join("");
 $("questCount").textContent=`${done.length} / ${state.quests.length} COMPLETE`;$("questXp").textContent=`+${earned} XP EARNED`;$("questBar").style.width=`${state.quests.length?done.length/state.quests.length*100:0}%`;
 document.querySelectorAll("[data-q]").forEach(el=>el.addEventListener("change",()=>toggleQuest(el.dataset.q,el.checked)));
 const weekCount=state.history.filter(h=>h.week===weekKey()).length;const pct=Math.min(100,weekCount/20*100);$("bossProgress").textContent=`${Math.min(20,weekCount)} / 20 QUESTS`;$("bossPercent").textContent=`${Math.floor(pct)}%`;$("bossBar").style.width=`${pct}%`;
 if(weekCount>=20&&!state.bossClaimed.includes(weekKey())){state.bossClaimed.push(weekKey());state.xp+=150;state.history.push({name:"Weekly Boss: Conquer Your Week",xp:150,date:dayKey(),week:weekKey(),stat:"discipline"});save();toast("DUNGEON CLEARED · +150 XP");}
 const h=allHistory().slice(0,4);$("activity").innerHTML=h.length?h.map(x=>`<div class="activity-item"><span>${esc(x.name)}<br><small style="color:var(--muted)">${x.date}</small></span><strong>+${x.xp} XP</strong></div>`).join(""):'<p class="empty">Your victories will appear here.</p>';
}
function esc(s){return String(s).replace(/[&<>"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]))}
function toggleQuest(id,checked){const q=state.quests.find(x=>x.id===id);if(!q)return;let done=todayDone();if(checked&&!done.includes(id)){done.push(id);state.completed[dayKey()]=done;state.xp+=q.xp;state.stats[q.stat]=Math.min(100,state.stats[q.stat]+Math.max(1,Math.round(q.xp/10)));updateStreak();state.history.push({name:q.name,xp:q.xp,date:dayKey(),week:weekKey(),stat:q.stat});toast(`QUEST CLEARED · +${q.xp} XP`)}else if(!checked&&done.includes(id)){done=done.filter(x=>x!==id);state.completed[dayKey()]=done;state.xp=Math.max(0,state.xp-q.xp);state.stats[q.stat]=Math.max(10,state.stats[q.stat]-Math.max(1,Math.round(q.xp/10)));state.history=state.history.filter((h,i)=>!(h.date===dayKey()&&h.name===q.name&&i===state.history.length-1));toast("QUEST REVERTED")}save();render()}
function updateStreak(){const today=dayKey(),yesterday=dayKey(new Date(Date.now()-86400000));if(state.lastActive!==today){state.streak=state.lastActive===yesterday?state.streak+1:1;state.lastActive=today}}
$("addQuest").onclick=()=>{$("questDialog").showModal();$("questName").focus()};
$("questForm").onsubmit=e=>{e.preventDefault();const name=$("questName").value.trim();if(!name)return;state.quests.push({id:"custom_"+Date.now(),name,stat:$("questStat").value,xp:+$("questReward").value,custom:true});save();$("questDialog").close();$("questName").value="";render();toast("NEW QUEST ADDED")};
$("settingsBtn").onclick=()=>{$("playerName").value=state.name==="HUNTER"?"":state.name;$("settingsDialog").showModal()};
$("settingsForm").onsubmit=e=>e.preventDefault();
$("playerName").onchange=e=>{state.name=e.target.value.trim()||"HUNTER";save();render();toast("PLAYER PROFILE UPDATED")};
$("exportBtn").onclick=()=>{const blob=new Blob([JSON.stringify(state,null,2)],{type:"application/json"});const a=document.createElement("a");a.href=URL.createObjectURL(blob);a.download="player-system-save.json";a.click();URL.revokeObjectURL(a.href);toast("SAVE FILE EXPORTED")};
$("importFile").onchange=async e=>{try{const obj=JSON.parse(await e.target.files[0].text());if(!obj.stats||!obj.quests||typeof obj.xp!=="number")throw Error();state=obj;save();render();$("settingsDialog").close();toast("SAVE FILE RESTORED")}catch{toast("INVALID SAVE FILE")}};
$("resetBtn").onclick=()=>{if(confirm("Reset all levels, XP, quests and history? This cannot be undone.")){state=fresh();save();render();$("settingsDialog").close();toast("PLAYER DATA RESET")}};
$("historyBtn").onclick=()=>{$("historyList").innerHTML=allHistory().length?allHistory().map(h=>`<div class="history-item"><span>${esc(h.name)}<br><small style="color:var(--muted)">${h.date}</small></span><strong style="color:var(--green)">+${h.xp} XP</strong></div>`).join(""):'<p class="empty">No cleared quests yet.</p>';$("historyDialog").showModal()};
$("closeHistory").onclick=()=>$("historyDialog").close();
document.querySelectorAll(".close").forEach(b=>b.addEventListener("click",()=>b.closest("dialog").close()));
document.querySelectorAll(".bottom-nav a").forEach(a=>a.addEventListener("click",()=>{document.querySelectorAll(".bottom-nav a").forEach(x=>x.classList.remove("active"));a.classList.add("active")}));
if("serviceWorker"in navigator&&location.protocol.startsWith("http"))navigator.serviceWorker.register("./sw.js").catch(()=>{});
render();