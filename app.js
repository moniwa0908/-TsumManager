
const KEYS=["tsumManagerDataV20","tsumManagerDataV12","tsumManagerDataV11","tsumManagerDataV10","tsumManagerDataV9","tsumManagerDataV8","tsumManagerDataV7","tsumManagerDataV6","tsumManagerDataV5","tsumManagerDataV4","tsumManagerDataV3","tsumManagerDataV2","tsumManagerDataV1"];
const KEY="tsumManagerDataV20", HISTORY_KEY="tsumManagerHistoryV20", RECENT_KEY="tsumManagerRecentV20", PLAN_KEY="tsumManagerPlansV20", TODAY_KEY="tsumManagerTodayV20", UNDO_KEY="tsumManagerUndoV20", GOAL_KEY="tsumManagerGoalsV20", TICKET_STOCK_KEY="tsumManagerTicketStockV20";
const $=q=>document.querySelector(q);
const esc=s=>String(s??"").replace(/[&<>"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;","\"":"&quot;","'":"&#39;"}[c]));
const norm=t=>({
  id:t.id||crypto.randomUUID(),name:String(t.name||"名称未設定"),category:String(t.category||"未分類"),
  required:Math.max(1,Number(t.required||t.maxCopies||36)),owned:Math.max(0,Number(t.owned||0)),
  releaseYear:Number(t.releaseYear||t.year||0),favorite:!!t.favorite,image:String(t.image||""),
  memo:String(t.memo||t.note||""),priority:Number(t.priority||0),
  tags:Array.isArray(t.tags)?t.tags.map(x=>String(x).trim()).filter(Boolean):String(t.tags||"").split(",").map(x=>x.trim()).filter(Boolean)
});
const master=()=>window.TSUM_MASTER_DATA.map(norm);
function mergeMaster(existing){
  const map=new Map(existing.map(x=>[x.name,norm(x)]));
  for(const m of master())if(!map.has(m.name))map.set(m.name,m);
  return [...map.values()];
}
function loadData(){
  for(const key of KEYS){
    try{
      const data=JSON.parse(localStorage.getItem(key)||"null");
      if(Array.isArray(data)&&data.length)return mergeMaster(data);
    }catch(e){}
  }
  return master();
}
let tsums=loadData();
let history=(()=>{try{return JSON.parse(localStorage.getItem(HISTORY_KEY)||"[]")}catch(e){return[]}})();
let recent=(()=>{try{return JSON.parse(localStorage.getItem(RECENT_KEY)||"[]")}catch(e){return[]}})();
let plans=(()=>{try{return JSON.parse(localStorage.getItem(PLAN_KEY)||"[]")}catch(e){return[]}})();
let goals=(()=>{try{return JSON.parse(localStorage.getItem(GOAL_KEY)||"[]")}catch(e){return[]}})();
let ticketStock=Math.max(0,Number(localStorage.getItem(TICKET_STOCK_KEY)||0));
let todayTrainingId=localStorage.getItem(TODAY_KEY)||"";
let undoState=(()=>{try{return JSON.parse(localStorage.getItem(UNDO_KEY)||"null")}catch(e){return null}})();
let activeView="home",category="すべて",status="all",activeTag="すべて",collectionCategory="すべて",collectionLimit=60,increment=1;
let compact=localStorage.getItem("tm-compact")==="1",gallery=localStorage.getItem("tm-gallery")==="1",editingImage="",ticketSelection="",detailId="";
function save(){localStorage.setItem(KEY,JSON.stringify(tsums))}
function saveHistory(){localStorage.setItem(HISTORY_KEY,JSON.stringify(history.slice(0,50)))}
function saveRecent(){localStorage.setItem(RECENT_KEY,JSON.stringify(recent.slice(0,20)))}
function savePlans(){localStorage.setItem(PLAN_KEY,JSON.stringify(plans))}
function saveGoals(){localStorage.setItem(GOAL_KEY,JSON.stringify(goals))}
function saveTicketStock(){localStorage.setItem(TICKET_STOCK_KEY,String(ticketStock))}
function saveToday(){todayTrainingId?localStorage.setItem(TODAY_KEY,todayTrainingId):localStorage.removeItem(TODAY_KEY)}
function saveUndo(){undoState?localStorage.setItem(UNDO_KEY,JSON.stringify(undoState)):localStorage.removeItem(UNDO_KEY)}
function setUndo(description,changes){
  undoState={description,changes,time:new Date().toISOString()};
  saveUndo();
  renderUndo();
}
function renderUndo(){
  const button=$("#undoButton"),desc=$("#undoDescription");
  if(!button||!desc)return;
  if(!undoState){desc.textContent="取り消せる操作はありません。";button.disabled=true;return}
  desc.textContent=undoState.description;
  button.disabled=false;
}
function touchRecent(id){
  recent=[id,...recent.filter(x=>x!==id)].slice(0,20);
  saveRecent();
}
save();
const remain=t=>Math.max(0,t.required-t.owned);
const pct=t=>Math.min(100,Math.round(t.owned/t.required*100));
function skillText(t){
  if(t.owned===0)return"未所持";
  if(remain(t)===0)return"スキルMAX";
  const p=t.owned/t.required;
  if(p<.08)return"SL1";
  if(p<.20)return"SL2目安";
  if(p<.38)return"SL3目安";
  if(p<.58)return"SL4目安";
  if(p<.79)return"SL5目安";
  return"SL6途中";
}
const priorityText=n=>n===1?"最優先":n===2?"優先":n===3?"あとで":"";
function toast(message){
  const el=$("#toast");el.textContent=message;el.classList.add("show");
  setTimeout(()=>el.classList.remove("show"),1700);
}
function openMessage(title,body){$("#messageTitle").textContent=title;$("#messageBody").textContent=body;$("#messageDialog").showModal()}
function showView(view){
  activeView=view;
  document.querySelectorAll(".view").forEach(el=>el.hidden=el.id!==view+"View");
  document.querySelectorAll(".bottom-nav button").forEach(b=>b.classList.toggle("active",b.dataset.view===view));
  if(view==="home")renderHome();
  if(view==="collection")renderCollection();
  if(view==="list")renderList();
  if(view==="box")renderBox();
  if(view==="training")renderTraining();
  if(view==="stats")renderStats();
  if(view==="goals")renderGoals();
  if(view==="planner")renderPlanner();
  if(view==="settings")renderSettings();
  scrollTo({top:0,behavior:"smooth"});
}
function avatarHtml(t){return t.image?`<img src="${esc(t.image)}" alt="">`:esc(t.name.slice(0,1))}
function cardHtml(t){
  const tag=priorityText(t.priority);
  return `<article class="tsum-card ${remain(t)>0&&remain(t)<=5?"near-max":""}">
    <button class="avatar" data-action="detail" data-id="${t.id}">${avatarHtml(t)}</button>
    <div>
      <div class="title-row">
        <button class="star ${t.favorite?"on":""}" data-action="favorite" data-id="${t.id}">★</button>
        <strong role="button" data-action="detail" data-id="${t.id}">${esc(t.name)}</strong>
        ${tag?`<span class="priority-tag">${tag}</span>`:""}
        <button class="more" data-action="edit" data-id="${t.id}">•••</button>
      </div>
      <div class="meta">${esc(t.category)} ・ ${skillText(t)} ・ 残り${remain(t)} ・ ${pct(t)}%</div>
      ${t.tags.length?`<div class="tag-list">${t.tags.slice(0,3).map(tag=>`<span class="tag-pill">${esc(tag)}</span>`).join("")}</div>`:""}
      <div class="mini-progress"><i style="width:${pct(t)}%"></i></div>
    </div>
    <div class="counter">
      <button data-action="minus" data-id="${t.id}">−</button>
      <b class="${remain(t)===0?"maxed":""}">${t.owned}/${t.required}</b>
      <button class="plus" data-action="plus" data-id="${t.id}">＋</button>
    </div>
  </article>`;
}
function wireCards(scope){
  scope.querySelectorAll("[data-action]").forEach(b=>b.onclick=()=>handleCardAction(b.dataset.action,b.dataset.id));
}
function handleCardAction(action,id){
  const t=tsums.find(x=>x.id===id);if(!t)return;
  if(action==="plus"){
    const before=t.owned;t.owned=Math.min(t.required,t.owned+increment);
    if(t.owned!==before)setUndo(`${t.name}の所持数変更を取り消す`,[{id:t.id,owned:before}]);
  }
  if(action==="minus"){
    const before=t.owned;t.owned=Math.max(0,t.owned-increment);
    if(t.owned!==before)setUndo(`${t.name}の所持数変更を取り消す`,[{id:t.id,owned:before}]);
  }
  if(action==="favorite"){
    const before=t.favorite;t.favorite=!t.favorite;
    setUndo(`${t.name}のお気に入り変更を取り消す`,[{id:t.id,favorite:before}]);
  }
  if(action==="detail"){touchRecent(t.id);openDetail(t);return}
  if(action==="edit"){touchRecent(t.id);openEdit(t);return}
  touchRecent(t.id);
  save();renderAll();
}
function summary(){
  const total=tsums.reduce((s,t)=>s+t.required,0);
  const owned=tsums.reduce((s,t)=>s+Math.min(t.owned,t.required),0);
  const remaining=tsums.reduce((s,t)=>s+remain(t),0);
  return{
    total,owned,remaining,percent:total?Math.round(owned/total*100):0,
    ownedTsums:tsums.filter(t=>t.owned>0).length,maxed:tsums.filter(t=>remain(t)===0).length
  };
}
function renderHome(){
  const s=summary();
  $("#homePercent").textContent=s.percent+"%";$("#ringPercent").textContent=s.percent+"%";
  const today=tsums.find(t=>t.id===todayTrainingId);
  $("#todayTrainingCard").innerHTML=today?`<div class="avatar">${avatarHtml(today)}</div><div><strong>${esc(today.name)}</strong><small>${skillText(today)} ・ 残り${remain(today)} ・ ${pct(today)}%</small></div><button data-today-detail="${today.id}">詳細</button>`:`<div class="helper">今日の育成ツムは未設定です。</div>`;
  $("#todayTrainingCard").querySelectorAll("[data-today-detail]").forEach(b=>b.onclick=()=>{const t=tsums.find(x=>x.id===b.dataset.todayDetail);if(t)openDetail(t)});
  renderUndo();
  $("#progressRing").style.setProperty("--p",(s.percent*3.6)+"deg");
  $("#homeProgressBar").style.width=s.percent+"%";
  $("#homeOwned").textContent=s.ownedTsums;$("#homeMaxed").textContent=s.maxed;
  $("#homeRemaining").textContent=s.remaining.toLocaleString("ja-JP");
  $("#homeCoins").textContent=(s.remaining*30000).toLocaleString("ja-JP");
  const near=tsums.filter(t=>remain(t)>0&&remain(t)<=5).sort((a,b)=>remain(a)-remain(b));
  const priorities=tsums.filter(t=>t.priority>0&&remain(t)>0).sort((a,b)=>a.priority-b.priority||remain(a)-remain(b));
  const recommendations=tsums.filter(t=>t.owned>0&&remain(t)>0).sort((a,b)=>remain(a)-remain(b)||pct(b)-pct(a)).slice(0,5);
  $("#nearCount").textContent=near.length+"体";$("#unownedCount").textContent=tsums.filter(t=>t.owned===0).length+"体";
  const nearRanking=tsums.filter(t=>t.owned>0&&remain(t)>0).sort((a,b)=>remain(a)-remain(b)||pct(b)-pct(a)).slice(0,5);
  const coinRanking=tsums.filter(t=>remain(t)>0).sort((a,b)=>remain(b)-remain(a)||a.name.localeCompare(b.name,"ja")).slice(0,5);
  const assistantCandidates=buildAssistantSuggestions();
  $("#assistantSuggestions").innerHTML=assistantCandidates.map(x=>`<div class="assistant-card"><div class="avatar">${avatarHtml(x.t)}</div><div><strong>${esc(x.t.name)}</strong><small>${esc(x.reason)}</small></div><button data-assistant-id="${x.t.id}">詳細</button></div>`).join("")||`<div class="helper">提案できる育成候補がありません。</div>`;
  $("#assistantSuggestions").querySelectorAll("[data-assistant-id]").forEach(b=>b.onclick=()=>{const t=tsums.find(x=>x.id===b.dataset.assistantId);if(t)openDetail(t)});
  $("#nearRankingList").innerHTML=nearRanking.map((t,i)=>rankingHtml(t,i+1,`あと${remain(t)}体`)).join("")||`<div class="helper">育成中のツムがありません。</div>`;
  $("#coinRankingList").innerHTML=coinRanking.map((t,i)=>rankingHtml(t,i+1,`${(remain(t)*30000).toLocaleString("ja-JP")}コイン`)).join("")||`<div class="helper">対象ツムがありません。</div>`;
  document.querySelectorAll(".ranking-item button").forEach(b=>b.onclick=()=>{const t=tsums.find(x=>x.id===b.dataset.rankingId);if(t)openDetail(t)});
  $("#recommendList").innerHTML=recommendations.map(t=>miniHtml(t,true)).join("")||`<div class="helper">所持済みの育成候補はありません。</div>`;
  const recentTsums=recent.map(id=>tsums.find(t=>t.id===id)).filter(Boolean).slice(0,5);
  $("#recentTsumList").innerHTML=recentTsums.map(miniHtml).join("")||`<div class="helper">最近使ったツムはありません。</div>`;
  $("#homePriorityList").innerHTML=priorities.slice(0,5).map(miniHtml).join("")||`<div class="helper">育成予定は未登録です。</div>`;
  $("#homeNearList").innerHTML=near.slice(0,5).map(miniHtml).join("")||`<div class="helper">残り5体以内のツムはありません。</div>`;
  document.querySelectorAll(".mini-item button").forEach(b=>b.onclick=()=>{showView("list");$("#searchInput").value=b.dataset.name;renderList()});
}
function rankingHtml(t,rank,caption){
  return `<div class="ranking-item"><span>${rank}</span><div><strong>${esc(t.name)}</strong><small>${caption} ・ ${pct(t)}%</small></div><button data-ranking-id="${t.id}">詳細</button></div>`;
}
function miniHtml(t,recommend=false){
  return `<div class="mini-item"><div class="avatar">${avatarHtml(t)}</div><div><strong>${esc(t.name)}</strong><small>${recommend?'<span class="recommend-badge">育成候補</span> ':''}残り${remain(t)} ・ ${pct(t)}%</small></div><button data-name="${esc(t.name)}">表示</button></div>`;
}


function buildAssistantSuggestions(){
  const rows=[];
  const seen=new Set();
  const add=(t,reason)=>{if(t&&!seen.has(t.id)&&remain(t)>0){seen.add(t.id);rows.push({t,reason})}};
  const today=tsums.find(t=>t.id===todayTrainingId);
  if(today)add(today,"今日の育成に設定されています");
  goals.filter(g=>g.type==="max").forEach(g=>add(tsums.find(t=>t.name===g.tsumName),"育成目標に登録されています"));
  tsums.filter(t=>t.priority>0&&remain(t)>0).sort((a,b)=>a.priority-b.priority||remain(a)-remain(b)).slice(0,2).forEach(t=>add(t,`${priorityText(t.priority)}に設定されています`));
  tsums.filter(t=>t.owned>0&&remain(t)>0&&remain(t)<=ticketStock).sort((a,b)=>remain(a)-remain(b)).slice(0,3).forEach(t=>add(t,`スキルチケット${remain(t)}枚でスキルマ可能`));
  tsums.filter(t=>t.owned>0&&remain(t)>0).sort((a,b)=>remain(a)-remain(b)).slice(0,3).forEach(t=>add(t,`スキルマまであと${remain(t)}体`));
  return rows.slice(0,5);
}
function goalTarget(goal,t){
  if(goal.type==="max")return t.required;
  return Math.min(t.required,Math.max(1,Number(goal.targetOwned)||t.required));
}
function renderGoals(){
  $("#ticketStockValue").textContent=ticketStock;
  $("#goalList").innerHTML=goals.length?goals.map(g=>{
    const t=tsums.find(x=>x.name===g.tsumName);
    if(!t)return `<article class="goal-card"><div class="goal-card-head"><strong>${esc(g.tsumName)}</strong><button data-edit-goal="${g.id}">編集</button></div><div class="goal-warning">登録ツムが見つかりません。</div></article>`;
    const target=goalTarget(g,t),need=Math.max(0,target-t.owned),p=Math.min(100,Math.round(t.owned/target*100));
    const deadline=g.deadline?new Date(g.deadline+"T00:00:00"):null;
    const days=deadline?Math.ceil((deadline-new Date())/86400000):null;
    return `<article class="goal-card">
      <div class="goal-card-head"><strong>${esc(t.name)}</strong><button data-edit-goal="${g.id}">編集</button></div>
      <div class="goal-card-meta"><span>${g.type==="max"?"スキルマ":`所持数${target}`}</span><span>残り${need}</span>${g.deadline?`<span>期限 ${esc(g.deadline)}</span>`:""}</div>
      <div class="goal-progress"><i style="width:${p}%"></i></div>
      ${days!==null&&days<0?`<div class="goal-warning">期限を過ぎています。</div>`:days!==null?`<div class="goal-warning">期限まであと${days}日</div>`:""}
    </article>`;
  }).join(""):`<div class="helper">育成目標はまだありません。</div>`;
  $("#goalList").querySelectorAll("[data-edit-goal]").forEach(b=>b.onclick=()=>{const g=goals.find(x=>x.id===b.dataset.editGoal);if(g)openGoal(g)});
  const active=goals.map(g=>{const t=tsums.find(x=>x.name===g.tsumName);if(!t)return null;return{g,t,need:Math.max(0,goalTarget(g,t)-t.owned)}}).filter(Boolean);
  const totalNeed=active.reduce((s,x)=>s+x.need,0);
  const completable=active.filter(x=>x.need<=ticketStock).sort((a,b)=>a.need-b.need);
  $("#goalSimulation").innerHTML=active.length?`登録目標：${active.length}件<br>目標達成に必要：${totalNeed}枚<br>スキルチケット在庫：${ticketStock}枚<br>不足：${Math.max(0,totalNeed-ticketStock)}枚<br><br>${completable.length?`現在の在庫で達成可能：<br>${completable.map(x=>`${esc(x.t.name)}（${x.need}枚）`).join("<br>")}`:"現在の在庫だけで達成できる目標はありません。"}`:`目標を登録すると、必要枚数と不足数を表示します。`;
}
function openGoal(goal=null){
  $("#goalDialogTitle").textContent=goal?"育成目標を編集":"育成目標を作成";
  $("#goalId").value=goal?.id||"";
  $("#goalTsumName").value=goal?.tsumName||"";
  $("#goalType").value=goal?.type||"max";
  $("#goalTargetOwned").value=goal?.targetOwned||36;
  $("#goalDeadline").value=goal?.deadline||"";
  $("#goalMemo").value=goal?.memo||"";
  $("#deleteGoalButton").style.display=goal?"":"none";
  toggleGoalTarget();
  $("#goalDialog").showModal();
}
function toggleGoalTarget(){$("#goalTargetWrap").style.display=$("#goalType").value==="owned"?"grid":"none"}

function renderCollection(){
  const q=$("#collectionSearch").value.trim().toLowerCase();
  const filter=$("#collectionFilter").value;
  const cats=["すべて",...new Set(tsums.map(t=>t.category))];
  $("#collectionCategoryChips").innerHTML=cats.map(c=>`<button data-collection-category="${esc(c)}" class="${c===collectionCategory?"active":""}">${esc(c)}</button>`).join("");
  $("#collectionCategoryChips").querySelectorAll("button").forEach(b=>b.onclick=()=>{collectionCategory=b.dataset.collectionCategory;collectionLimit=60;renderCollection()});
  let rows=tsums.filter(t=>{
    const matchesFilter=filter==="all"||(filter==="owned"&&t.owned>0)||(filter==="unowned"&&t.owned===0)||(filter==="max"&&remain(t)===0)||(filter==="image"&&t.image)||(filter==="favorite"&&t.favorite);
    return matchesFilter&&(collectionCategory==="すべて"||t.category===collectionCategory)&&(t.name.toLowerCase().includes(q)||t.tags.some(tag=>tag.toLowerCase().includes(q)));
  });
  rows.sort((a,b)=>a.name.localeCompare(b.name,"ja"));
  const owned=tsums.filter(t=>t.owned>0).length;
  const maxed=tsums.filter(t=>remain(t)===0).length;
  $("#collectionRate").textContent=Math.round(owned/tsums.length*100)+"%";
  $("#collectionOwned").textContent=owned;
  $("#collectionMissing").textContent=tsums.length-owned;
  $("#collectionMaxed").textContent=maxed;
  const visibleRows=rows.slice(0,collectionLimit);
  $("#collectionGrid").innerHTML=visibleRows.map(t=>`<button class="collection-item ${t.owned===0?"unowned":""} ${remain(t)===0?"max":""}" data-collection-id="${t.id}">
    ${remain(t)===0?'<span class="collection-mark">MAX</span>':""}
    <div class="avatar">${avatarHtml(t)}</div>
    <strong>${esc(t.name)}</strong>
    <small>${t.owned}/${t.required}</small>
  </button>`).join("")||`<div class="panel helper">該当するツムがありません。</div>`;
  $("#loadMoreCollectionButton").hidden=collectionLimit>=rows.length;
  $("#loadMoreCollectionButton").textContent=`さらに表示（${Math.min(60,rows.length-collectionLimit)}体）`;
  $("#collectionGrid").querySelectorAll("[data-collection-id]").forEach(b=>b.onclick=()=>{
    const t=tsums.find(x=>x.id===b.dataset.collectionId);if(t)openDetail(t);
  });
}
function planStats(names){
  const found=[],missing=[];
  for(const name of names){
    const t=tsums.find(x=>x.name===name);
    t?found.push(t):missing.push(name);
  }
  const remaining=found.reduce((s,t)=>s+remain(t),0);
  return{found,missing,remaining,coins:remaining*30000,maxed:found.filter(t=>remain(t)===0).length};
}
function renderPlanner(){
  $("#planList").innerHTML=plans.length?plans.map(p=>{
    const stats=planStats(p.tsums||[]);
    return `<article class="plan-card">
      <div class="plan-card-head"><div><span class="plan-type">${esc(p.type)}</span><strong> ${esc(p.name)}</strong></div><button data-edit-plan="${p.id}">編集</button></div>
      <div class="plan-card-stats">
        <div><b>${stats.found.length}</b><span>対象ツム</span></div>
        <div><b>${stats.remaining.toLocaleString("ja-JP")}</b><span>残り必要数</span></div>
        <div><b>${stats.coins.toLocaleString("ja-JP")}</b><span>必要コイン</span></div>
      </div>
      <div class="plan-progress"><i style="width:${stats.found.length?Math.round(stats.maxed/stats.found.length*100):0}%"></i></div>
      ${stats.missing.length?`<p class="helper">未登録：${stats.missing.map(esc).join("、")}</p>`:""}
      ${p.memo?`<p class="helper">${esc(p.memo)}</p>`:""}
    </article>`;
  }).join(""):`<div class="helper">ガチャ計画はまだありません。</div>`;
  $("#planList").querySelectorAll("[data-edit-plan]").forEach(b=>b.onclick=()=>{
    const p=plans.find(x=>x.id===b.dataset.editPlan);if(p)openPlan(p);
  });
}
function openPlan(plan=null){
  $("#planDialogTitle").textContent=plan?"ガチャ計画を編集":"ガチャ計画を作成";
  $("#planId").value=plan?.id||"";
  $("#planName").value=plan?.name||"";
  $("#planType").value=plan?.type||"セレクトBOX";
  $("#planTsums").value=(plan?.tsums||[]).join("\n");
  $("#planMemo").value=plan?.memo||"";
  $("#deletePlanButton").style.display=plan?"":"none";
  $("#planDialog").showModal();
}

function renderList(){
  const q=$("#searchInput").value.trim().toLowerCase(),sort=$("#sortSelect").value;
  const cats=["すべて",...new Set(tsums.map(t=>t.category))];
  $("#categoryChips").innerHTML=cats.map(c=>`<button data-category="${esc(c)}" class="${c===category?"active":""}">${esc(c)}</button>`).join("");
  $("#categoryChips").querySelectorAll("button").forEach(b=>b.onclick=()=>{category=b.dataset.category;renderList()});
  const statuses=[["all","すべて"],["unowned","未所持"],["owned","所持済み"],["max","スキルマ"],["near","目前"],["favorite","★お気に入り"],["priority","育成予定"],["noimage","画像なし"]];
  $("#statusChips").innerHTML=statuses.map(([k,v])=>`<button data-status="${k}" class="${k===status?"active":""}">${v}</button>`).join("");
  $("#statusChips").querySelectorAll("button").forEach(b=>b.onclick=()=>{status=b.dataset.status;renderList()});
  const tags=["すべて",...new Set(tsums.flatMap(t=>t.tags))].sort((a,b)=>a==="すべて"?-1:b==="すべて"?1:a.localeCompare(b,"ja"));
  $("#tagChips").innerHTML=tags.map(tag=>`<button data-tag="${esc(tag)}" class="${tag===activeTag?"active":""}">${esc(tag)}</button>`).join("");
  $("#tagChips").querySelectorAll("button").forEach(b=>b.onclick=()=>{activeTag=b.dataset.tag;renderList()});
  let rows=tsums.filter(t=>{
    const matchStatus=status==="all"||(status==="unowned"&&t.owned===0)||(status==="owned"&&t.owned>0&&remain(t)>0)||(status==="max"&&remain(t)===0)||(status==="near"&&remain(t)>0&&remain(t)<=5)||(status==="favorite"&&t.favorite)||(status==="priority"&&t.priority>0)||(status==="noimage"&&!t.image);
    return (category==="すべて"||t.category===category)&&(activeTag==="すべて"||t.tags.includes(activeTag))&&matchStatus&&(t.name.toLowerCase().includes(q)||t.memo.toLowerCase().includes(q)||t.tags.some(tag=>tag.toLowerCase().includes(q)));
  });
  rows.sort((a,b)=>{
    if(sort==="remain")return remain(a)-remain(b)||a.name.localeCompare(b.name,"ja");
    if(sort==="progress")return pct(b)-pct(a)||a.name.localeCompare(b.name,"ja");
    if(sort==="owned")return b.owned-a.owned||a.name.localeCompare(b.name,"ja");
    if(sort==="favorite")return Number(b.favorite)-Number(a.favorite)||a.name.localeCompare(b.name,"ja");
    return a.name.localeCompare(b.name,"ja");
  });
  $("#resultCount").textContent=rows.length+"体表示";
  const list=$("#tsumList");
  list.classList.toggle("compact",compact&&!gallery);
  list.classList.toggle("gallery",gallery);
  list.innerHTML=rows.map(cardHtml).join("")||`<article class="panel helper">該当するツムがありません。</article>`;
  wireCards(list);
  $("#layoutMode").textContent=compact?"標準表示":"コンパクト";
  $("#galleryMode").textContent=gallery?"カード表示":"ギャラリー";
}

function runSkillSimulator(){
  let tickets=Math.max(0,Number($("#simTicketCount").value)||0);
  const candidates=tsums.filter(t=>t.owned>0&&remain(t)>0).sort((a,b)=>remain(a)-remain(b)||a.name.localeCompare(b.name,"ja"));
  const selected=[];
  for(const t of candidates){
    const need=remain(t);
    if(need<=tickets){
      selected.push({t,need});
      tickets-=need;
    }
  }
  const result=$("#simulatorResult");
  if(!selected.length){
    const nearest=candidates.slice(0,5);
    result.innerHTML=nearest.length?`この枚数でスキルマにできるツムはありません。<br><br>最も近い候補：<br>${nearest.map(t=>`${esc(t.name)}：あと${remain(t)}枚`).join("<br>")}`:"育成中のツムがありません。";
    return;
  }
  result.innerHTML=`スキルマにできる候補：${selected.length}体<br>使用予定：${selected.reduce((s,x)=>s+x.need,0)}枚／残り：${tickets}枚<br><br>${selected.map((x,i)=>`<div class="sim-row"><span>${i+1}. ${esc(x.t.name)}</span><b>${x.need}枚</b></div>`).join("")}`;
}
$("#runSimulatorButton").onclick=runSkillSimulator;

function renderTraining(){
  const rows=tsums.filter(t=>t.priority>0&&remain(t)>0).sort((a,b)=>a.priority-b.priority||remain(a)-remain(b));
  $("#trainingList").innerHTML=rows.map(cardHtml).join("")||`<div class="helper">育成予定はまだ登録されていません。</div>`;
  wireCards($("#trainingList"));
}
function renderStats(){
  const cats=[...new Set(tsums.map(t=>t.category))];
  $("#categoryStats").innerHTML=cats.map(c=>{
    const a=tsums.filter(t=>t.category===c),total=a.reduce((s,t)=>s+t.required,0),owned=a.reduce((s,t)=>s+Math.min(t.owned,t.required),0),p=total?Math.round(owned/total*100):0;
    return `<div class="stat-row"><div><span>${esc(c)}</span><b>${p}%</b></div><div class="stat-progress"><i style="width:${p}%"></i></div></div>`;
  }).join("");
  const unowned=tsums.filter(t=>t.owned===0).length,growing=tsums.filter(t=>t.owned>0&&remain(t)>0).length,maxed=tsums.filter(t=>remain(t)===0).length;
  $("#statusStats").innerHTML=`<div><b>${unowned}</b><span>未所持</span></div><div><b>${growing}</b><span>育成中</span></div><div><b>${maxed}</b><span>スキルマ</span></div>`;
  const tags=[...new Set(tsums.flatMap(t=>t.tags))].sort((a,b)=>a.localeCompare(b,"ja"));
  $("#tagStats").innerHTML=tags.length?tags.map(tag=>{
    const rows=tsums.filter(t=>t.tags.includes(tag));
    const owned=rows.filter(t=>t.owned>0).length;
    const p=rows.length?Math.round(owned/rows.length*100):0;
    return `<div class="stat-row"><div><span>${esc(tag)}（${owned}/${rows.length}体）</span><b>${p}%</b></div><div class="stat-progress"><i style="width:${p}%"></i></div></div>`;
  }).join(""):`<div class="helper">タグを登録すると、ここにコレクション率が表示されます。</div>`;
  $("#coinStats").innerHTML=cats.map(c=>{const r=tsums.filter(t=>t.category===c).reduce((s,t)=>s+remain(t),0);return `<div class="stat-row"><div><span>${esc(c)}</span><b>${(r*30000).toLocaleString("ja-JP")}コイン</b></div></div>`}).join("");
}
function renderBox(){
  renderHistory();
  if($("#ticketSearch").value)renderTicketCandidates();
}
function renderSettings(){$("#masterCount").textContent=window.TSUM_MASTER_DATA.length+"体"}
function renderAll(){
  renderHome();
  if(activeView==="collection")renderCollection();
  if(activeView==="list")renderList();
  if(activeView==="training")renderTraining();
  if(activeView==="stats")renderStats();
  if(activeView==="goals")renderGoals();
  if(activeView==="planner")renderPlanner();
  if(activeView==="box")renderBox();
}
function openEdit(t=null){
  $("#dialogTitle").textContent=t?"ツムを編集":"ツムを追加";$("#editId").value=t?.id||"";
  $("#editName").value=t?.name||"";$("#editCategory").value=t?.category||"プレミアム";
  $("#editRequired").value=t?.required||36;$("#editOwned").value=t?.owned||0;
  $("#editPriority").value=String(t?.priority||0);$("#editTags").value=(t?.tags||[]).join(",");$("#editMemo").value=t?.memo||"";
  editingImage=t?.image||"";renderImagePreview();$("#deleteButton").style.display=t?"":"none";$("#editDialog").showModal();
}
function renderImagePreview(){$("#imagePreview").innerHTML=editingImage?`<img src="${editingImage}" alt="">`:""}
$("#editImageInput").onchange=e=>{
  const f=e.target.files[0];if(!f)return;
  if(!f.type.startsWith("image/")){alert("画像ファイルを選択してください");return}
  const reader=new FileReader();
  reader.onload=()=>{
    const img=new Image();
    img.onload=()=>{
      const size=320,canvas=document.createElement("canvas"),ctx=canvas.getContext("2d");
      canvas.width=size;canvas.height=size;
      const scale=Math.max(size/img.width,size/img.height);
      const w=img.width*scale,h=img.height*scale;
      ctx.drawImage(img,(size-w)/2,(size-h)/2,w,h);
      editingImage=canvas.toDataURL("image/jpeg",0.82);
      renderImagePreview();
      toast("画像を登録しました");
    };
    img.src=reader.result;
  };
  reader.readAsDataURL(f);
};
$("#editForm").onsubmit=e=>{
  e.preventDefault();const id=$("#editId").value,obj=norm({id:id||undefined,name:$("#editName").value.trim(),category:$("#editCategory").value.trim(),required:$("#editRequired").value,owned:$("#editOwned").value,priority:$("#editPriority").value,image:editingImage,tags:$("#editTags").value,memo:$("#editMemo").value});
  if(id){const i=tsums.findIndex(t=>t.id===id);tsums[i]={...tsums[i],...obj,id}}else tsums.push(obj);
  save();$("#editDialog").close();renderAll();toast("保存しました");
};
$("#deleteButton").onclick=()=>{const id=$("#editId").value;if(confirm("このツムを削除しますか？")){tsums=tsums.filter(t=>t.id!==id);save();$("#editDialog").close();renderAll()}};

function openDetail(t){
  detailId=t.id;
  $("#detailAvatar").innerHTML=avatarHtml(t);
  $("#detailCategory").textContent=t.category;
  $("#detailName").textContent=t.name;
  $("#detailSkill").textContent=skillText(t);
  $("#detailPercent").textContent=pct(t)+"%";
  $("#detailBar").style.width=pct(t)+"%";
  $("#detailOwned").textContent=t.owned;
  $("#detailRequired").textContent=t.required;
  $("#detailRemaining").textContent=remain(t);
  $("#detailCoins").textContent=(remain(t)*30000).toLocaleString("ja-JP");
  $("#detailOwnedInput").value=t.owned;
  $("#detailMemo").textContent=t.memo||"メモはありません。";
  $("#detailFavoriteButton").textContent=t.favorite?"★ お気に入り済み":"☆ お気に入り";
  $("#detailDialog").showModal();
}
$("#closeDetailButton").onclick=()=>$("#detailDialog").close();
$("#detailEditButton").onclick=()=>{
  const t=tsums.find(x=>x.id===detailId);if(!t)return;
  $("#detailDialog").close();openEdit(t);
};
$("#detailFavoriteButton").onclick=()=>{
  const t=tsums.find(x=>x.id===detailId);if(!t)return;
  t.favorite=!t.favorite;save();renderAll();openDetail(t);
};
$("#saveDetailOwnedButton").onclick=()=>{
  const t=tsums.find(x=>x.id===detailId);if(!t)return;
  const value=Math.max(0,Math.min(t.required,Number($("#detailOwnedInput").value)||0));
  t.owned=value;touchRecent(t.id);save();renderAll();openDetail(t);toast("所持数を更新しました");
};
$("#openDetailFromEditButton").onclick=()=>{
  const t=tsums.find(x=>x.id===$("#editId").value);
  if(!t){toast("追加前のツムは詳細表示できません");return}
  $("#editDialog").close();openDetail(t);
};

function parseBox(){
  const names=$("#boxText").value.split(/\r?\n/).map(x=>x.trim()).filter(Boolean),counts=new Map();
  names.forEach(n=>counts.set(n,(counts.get(n)||0)+1));
  const found=[],missing=[];for(const [name,count] of counts){const t=tsums.find(x=>x.name===name);t?found.push({t,count}):missing.push(name)}
  return{names,found,missing};
}
function previewBox(){
  const {names,found,missing}=parseBox();
  $("#boxPreview").innerHTML=`入力：${names.length}体<br>${found.map(x=>`${esc(x.t.name)} ＋${x.count}`).join("<br>")||"一致するツムなし"}${missing.length?`<br><span style="color:var(--danger)">未登録：${missing.map(esc).join("、")}</span>`:""}`;
}
function addHistory(type,detail,changes=null){history.unshift({type,detail,time:new Date().toISOString(),changes});saveHistory();renderHistory()}
function restoreHistory(index){
  const h=history[index];if(!h||!Array.isArray(h.changes))return;
  for(const c of h.changes){
    const t=tsums.find(x=>x.id===c.id);if(t&&Number.isFinite(c.owned))t.owned=c.owned;
  }
  history.splice(index,1);save();saveHistory();renderAll();renderHistory();toast("履歴の操作を戻しました");
}
function renderHistory(){
  $("#historyList").innerHTML=history.slice(0,15).map((h,i)=>`<div class="history-item"><span>${esc(h.type)}：${esc(h.detail)}</span><span>${new Date(h.time).toLocaleString("ja-JP",{month:"numeric",day:"numeric",hour:"2-digit",minute:"2-digit"})}</span>${h.changes?`<button data-restore-history="${i}">戻す</button>`:""}</div>`).join("")||`<div class="helper">入力履歴はありません。</div>`;
  $("#historyList").querySelectorAll("[data-restore-history]").forEach(b=>b.onclick=()=>restoreHistory(Number(b.dataset.restoreHistory)));
}
function renderTicketCandidates(){
  const q=$("#ticketSearch").value.trim().toLowerCase();
  const rows=q?tsums.filter(t=>t.name.toLowerCase().includes(q)).slice(0,20):[];
  $("#ticketCandidates").innerHTML=rows.map(t=>`<div class="candidate"><span>${esc(t.name)}（${t.owned}/${t.required}）</span><button data-id="${t.id}" class="${ticketSelection===t.id?"selected":""}">${ticketSelection===t.id?"選択中":"選択"}</button></div>`).join("");
  $("#ticketCandidates").querySelectorAll("button").forEach(b=>b.onclick=()=>{ticketSelection=b.dataset.id;renderTicketCandidates()});
}
document.querySelectorAll(".bottom-nav button").forEach(b=>b.onclick=()=>showView(b.dataset.view));
document.querySelectorAll("[data-open-view]").forEach(b=>b.onclick=()=>showView(b.dataset.openView));
document.querySelectorAll("[data-home-filter]").forEach(b=>b.onclick=()=>{status=b.dataset.homeFilter;$("#searchInput").value="";showView("list")});
$("#showNearButton").onclick=()=>{status="near";$("#searchInput").value="";showView("list")};
$("#quickAddButton").onclick=()=>openEdit();
$("#searchInput").oninput=renderList;$("#sortSelect").onchange=renderList;
$("#incrementMode").onclick=()=>{increment=increment===1?5:1;$("#incrementMode").textContent="＋"+increment;toast("増減単位を"+increment+"にしました")};

$("#galleryMode").onclick=()=>{
  gallery=!gallery;
  if(gallery)compact=false;
  localStorage.setItem("tm-gallery",gallery?"1":"0");
  localStorage.setItem("tm-compact",compact?"1":"0");
  $("#compactToggle").checked=compact;
  renderList();
};
$("#refreshRecommendButton").onclick=()=>{renderHome();toast("おすすめ候補を再計算しました")};

$("#layoutMode").onclick=()=>{compact=!compact;gallery=false;localStorage.setItem("tm-gallery","0");localStorage.setItem("tm-compact",compact?"1":"0");$("#compactToggle").checked=compact;renderList()};
$("#clearBoxButton").onclick=()=>{$("#boxText").value="";$("#boxPreview").textContent="入力内容がここに表示されます。"};
$("#previewBoxButton").onclick=previewBox;
$("#applyBoxButton").onclick=()=>{
  const {found,missing}=parseBox();if(!found.length){alert("登録済みのツム名が見つかりません");return}
  if(missing.length&&!confirm("未登録の名前があります。\n"+missing.join("、")+"\n\n一致したツムだけ反映しますか？"))return;
  let total=0;const details=[],changes=[];for(const {t,count} of found){const before=t.owned;t.owned=Math.min(t.required,t.owned+count);const added=t.owned-before;if(added){total+=added;details.push(`${t.name}＋${added}`);changes.push({id:t.id,owned:before})}}
  found.forEach(({t})=>touchRecent(t.id));
  save();addHistory("BOX",details.join("、"),changes);setUndo("直前のBOX入力を取り消す",changes);$("#boxText").value="";$("#boxPreview").textContent="入力内容がここに表示されます。";renderAll();toast(total+"体分を反映しました");
};
$("#ticketSearch").oninput=renderTicketCandidates;
$("#applyTicketButton").onclick=()=>{
  const t=tsums.find(x=>x.id===ticketSelection);if(!t){alert("対象ツムを選択してください");return}
  const amount=Number($("#ticketAmount").value),before=t.owned;t.owned=Math.min(t.required,t.owned+amount);const added=t.owned-before;
  const changes=[{id:t.id,owned:before}];
  touchRecent(t.id);save();addHistory("スキルチケット",`${t.name}＋${added}`,changes);setUndo(`${t.name}へのスキルチケット使用を取り消す`,changes);renderAll();toast(`${t.name}に${added}枚反映しました`);
};
$("#clearHistoryButton").onclick=()=>{if(confirm("入力履歴を削除しますか？")){history=[];saveHistory();renderHistory()}};
$("#trainingHelpButton").onclick=()=>openMessage("育成予定の使い方","一覧でツム名横の「•••」を押し、育成優先度を設定します。\n\n最優先 → 優先 → あとで の順に表示されます。");
$("#cancelEditButton").onclick=()=>$("#editDialog").close();
$("#closeMessageButton").onclick=()=>$("#messageDialog").close();



function renderTodayTrainingCandidates(){
  const q=$("#todayTrainingSearch").value.trim().toLowerCase();
  const rows=tsums.filter(t=>!q||t.name.toLowerCase().includes(q)).slice(0,40);
  $("#todayTrainingCandidates").innerHTML=rows.map(t=>`<div class="candidate"><span>${esc(t.name)}（${t.owned}/${t.required}）</span><button data-today-id="${t.id}" class="${todayTrainingId===t.id?"selected":""}">${todayTrainingId===t.id?"設定中":"選択"}</button></div>`).join("");
  $("#todayTrainingCandidates").querySelectorAll("[data-today-id]").forEach(b=>b.onclick=()=>{
    todayTrainingId=b.dataset.todayId;saveToday();renderTodayTrainingCandidates();renderHome();toast("今日の育成ツムを設定しました");
  });
}
$("#changeTodayTrainingButton").onclick=()=>{renderTodayTrainingCandidates();$("#todayTrainingDialog").showModal()};
$("#todayTrainingSearch").oninput=renderTodayTrainingCandidates;
$("#closeTodayTrainingButton").onclick=()=>$("#todayTrainingDialog").close();
$("#clearTodayTrainingButton").onclick=()=>{todayTrainingId="";saveToday();renderHome();$("#todayTrainingDialog").close();toast("設定を解除しました")};
$("#undoButton").onclick=()=>{
  if(!undoState||!Array.isArray(undoState.changes))return;
  for(const c of undoState.changes){
    const t=tsums.find(x=>x.id===c.id);if(!t)continue;
    if(Number.isFinite(c.owned))t.owned=c.owned;
    if(typeof c.favorite==="boolean")t.favorite=c.favorite;
  }
  undoState=null;saveUndo();save();renderAll();toast("操作を取り消しました");
};
$("#restoreLastHistoryButton").onclick=()=>{if(history.length&&history[0].changes)restoreHistory(0);else toast("戻せる履歴がありません")};

$("#collectionSearch").oninput=()=>{collectionLimit=60;renderCollection()};
$("#collectionFilter").onchange=()=>{collectionLimit=60;renderCollection()};
$("#newPlanButton").onclick=()=>openPlan();
$("#cancelPlanButton").onclick=()=>$("#planDialog").close();
$("#planForm").onsubmit=e=>{
  e.preventDefault();
  const id=$("#planId").value||crypto.randomUUID();
  const obj={id,name:$("#planName").value.trim(),type:$("#planType").value,tsums:$("#planTsums").value.split(/\r?\n/).map(x=>x.trim()).filter(Boolean),memo:$("#planMemo").value.trim()};
  const i=plans.findIndex(p=>p.id===id);
  if(i>=0)plans[i]=obj;else plans.push(obj);
  savePlans();$("#planDialog").close();renderPlanner();toast("ガチャ計画を保存しました");
};
$("#deletePlanButton").onclick=()=>{
  const id=$("#planId").value;
  if(id&&confirm("このガチャ計画を削除しますか？")){plans=plans.filter(p=>p.id!==id);savePlans();$("#planDialog").close();renderPlanner()}
};
$("#clearQuickPlanButton").onclick=()=>{$("#quickPlanText").value="";$("#quickPlanResult").textContent="対象ツムを入力してください。"};
$("#calcQuickPlanButton").onclick=()=>{
  const names=$("#quickPlanText").value.split(/\r?\n/).map(x=>x.trim()).filter(Boolean);
  const s=planStats(names);
  $("#quickPlanResult").innerHTML=`対象：${s.found.length}体<br>スキルマ済み：${s.maxed}体<br>残り必要数：${s.remaining.toLocaleString("ja-JP")}体<br>必要コイン：${s.coins.toLocaleString("ja-JP")}コイン${s.missing.length?`<br><span style="color:var(--danger)">未登録：${s.missing.map(esc).join("、")}</span>`:""}`;
};

$("#removeImageButton").onclick=()=>{
  if(!editingImage){toast("画像は登録されていません");return}
  editingImage="";
  renderImagePreview();
  toast("保存すると画像が削除されます");
};
function renderImageManager(){
  const rows=tsums.filter(t=>t.image);
  $("#imageManagerGrid").innerHTML=rows.length?rows.map(t=>`
    <div class="image-manager-item">
      <img src="${t.image}" alt="">
      <strong>${esc(t.name)}</strong>
      <button data-remove-image="${t.id}">画像削除</button>
    </div>`).join(""):`<div class="image-manager-empty">登録済み画像はありません。</div>`;
  $("#imageManagerGrid").querySelectorAll("[data-remove-image]").forEach(b=>b.onclick=()=>{
    const t=tsums.find(x=>x.id===b.dataset.removeImage);if(!t)return;
    if(confirm(`${t.name}の画像を削除しますか？`)){t.image="";save();renderImageManager();renderAll();toast("画像を削除しました")}
  });
}
$("#openImageManagerButton").onclick=()=>{renderImageManager();$("#imageManagerDialog").showModal()};
$("#closeImageManagerButton").onclick=()=>$("#imageManagerDialog").close();
$("#clearRecentButton").onclick=()=>{recent=[];saveRecent();renderHome();toast("最近使った履歴を削除しました")};

$("#exportButton").onclick=()=>{
  const blob=new Blob([JSON.stringify({app:"TsumManager",version:"2.0",exportedAt:new Date().toISOString(),tsums,history,recent,plans,todayTrainingId,goals,ticketStock},null,2)],{type:"application/json"});
  const a=document.createElement("a");a.href=URL.createObjectURL(blob);a.download=`TsumManager_backup_${new Date().toISOString().slice(0,10)}.json`;a.click();URL.revokeObjectURL(a.href);
};
$("#importInput").onchange=e=>{
  const f=e.target.files[0];if(!f)return;const r=new FileReader();
  r.onload=()=>{try{const j=JSON.parse(r.result),arr=Array.isArray(j)?j:j.tsums;if(!Array.isArray(arr))throw 0;tsums=mergeMaster(arr);if(Array.isArray(j.history))history=j.history;if(Array.isArray(j.recent))recent=j.recent;if(Array.isArray(j.plans))plans=j.plans;if(typeof j.todayTrainingId==="string")todayTrainingId=j.todayTrainingId;if(Array.isArray(j.goals))goals=j.goals;if(Number.isFinite(j.ticketStock))ticketStock=Math.max(0,j.ticketStock);save();saveHistory();saveRecent();savePlans();saveToday();saveGoals();saveTicketStock();renderAll();toast("バックアップを読み込みました")}catch{alert("正しいバックアップファイルではありません")}};r.readAsText(f);
};
$("#mergeMasterButton").onclick=()=>{tsums=mergeMaster(tsums);save();renderAll();toast("収録ツムを再統合しました")};
$("#resetButton").onclick=()=>{if(confirm("所持数・画像・メモなどをすべて初期化しますか？")){tsums=master();history=[];recent=[];plans=[];goals=[];ticketStock=0;todayTrainingId="";undoState=null;save();saveHistory();saveRecent();savePlans();saveGoals();saveTicketStock();saveToday();saveUndo();renderAll();toast("初期化しました")}};


$("#applyQuickOwnedButton").onclick=()=>{
  const lines=$("#quickOwnedText").value.split(/\r?\n/).map(x=>x.trim()).filter(Boolean);
  let updated=0;const missing=[];
  for(const line of lines){
    const parts=line.split(",").map(x=>x.trim());
    if(parts.length<2)continue;
    const [name,valueText]=parts;
    const t=tsums.find(x=>x.name===name);
    if(!t){missing.push(name);continue}
    const value=Math.max(0,Math.min(t.required,Number(valueText)||0));
    t.owned=value;touchRecent(t.id);updated++;
  }
  save();renderAll();
  $("#quickOwnedText").value="";
  if(missing.length)openMessage("一部反映できませんでした",`更新：${updated}体\n未登録：${missing.join("、")}`);
  else toast(`${updated}体を更新しました`);
};



$("#refreshAssistantButton").onclick=()=>{renderHome();toast("育成候補を更新しました")};
$("#newGoalButton").onclick=()=>openGoal();
$("#goalType").onchange=toggleGoalTarget;
$("#cancelGoalButton").onclick=()=>$("#goalDialog").close();
$("#goalForm").onsubmit=e=>{
  e.preventDefault();
  const name=$("#goalTsumName").value.trim();
  const t=tsums.find(x=>x.name===name);
  if(!t&&!confirm("登録済みツムと名前が一致しません。このまま保存しますか？"))return;
  const id=$("#goalId").value||crypto.randomUUID();
  const obj={id,tsumName:name,type:$("#goalType").value,targetOwned:Number($("#goalTargetOwned").value)||36,deadline:$("#goalDeadline").value,memo:$("#goalMemo").value.trim()};
  const i=goals.findIndex(g=>g.id===id);if(i>=0)goals[i]=obj;else goals.push(obj);
  saveGoals();$("#goalDialog").close();renderGoals();renderHome();toast("育成目標を保存しました");
};
$("#deleteGoalButton").onclick=()=>{
  const id=$("#goalId").value;
  if(id&&confirm("この育成目標を削除しますか？")){goals=goals.filter(g=>g.id!==id);saveGoals();$("#goalDialog").close();renderGoals();renderHome()}
};
$("#ticketStockMinus").onclick=()=>{ticketStock=Math.max(0,ticketStock-1);saveTicketStock();renderGoals();renderHome()};
$("#ticketStockPlus").onclick=()=>{ticketStock++;saveTicketStock();renderGoals();renderHome()};

$("#loadMoreCollectionButton").onclick=()=>{collectionLimit+=60;renderCollection()};
$("#openNearRankingButton").onclick=()=>{status="near";showView("list")};
$("#openCoinRankingButton").onclick=()=>{$("#sortSelect").value="remain";status="all";showView("list")};
window.addEventListener("scroll",()=>$("#scrollTopButton").classList.toggle("show",scrollY>500),{passive:true});
$("#scrollTopButton").onclick=()=>scrollTo({top:0,behavior:"smooth"});
function csvEscape(value){
  const text=String(value??"");
  return /[",\n]/.test(text)?`"${text.replace(/"/g,'""')}"`:text;
}
$("#exportCsvButton").onclick=()=>{
  const header=["name","category","owned","required","favorite","priority","tags","memo"];
  const rows=tsums.map(t=>[
    t.name,t.category,t.owned,t.required,t.favorite?1:0,t.priority,(t.tags||[]).join("|"),t.memo
  ].map(csvEscape).join(","));
  const csv="\uFEFF"+[header.join(","),...rows].join("\r\n");
  const blob=new Blob([csv],{type:"text/csv;charset=utf-8"});
  const a=document.createElement("a");a.href=URL.createObjectURL(blob);a.download=`TsumManager_${new Date().toISOString().slice(0,10)}.csv`;a.click();URL.revokeObjectURL(a.href);
};
function parseCsv(text){
  const rows=[];let row=[],field="",quoted=false;
  for(let i=0;i<text.length;i++){
    const c=text[i],next=text[i+1];
    if(c==='"'&&quoted&&next==='"'){field+='"';i++;continue}
    if(c==='"'){quoted=!quoted;continue}
    if(c===","&&!quoted){row.push(field);field="";continue}
    if((c==="\n"||c==="\r")&&!quoted){
      if(c==="\r"&&next==="\n")i++;
      row.push(field);if(row.some(x=>x!==""))rows.push(row);row=[];field="";continue
    }
    field+=c;
  }
  row.push(field);if(row.some(x=>x!==""))rows.push(row);
  return rows;
}
$("#importCsvInput").onchange=e=>{
  const file=e.target.files[0];if(!file)return;
  const reader=new FileReader();
  reader.onload=()=>{
    try{
      const rows=parseCsv(String(reader.result).replace(/^\uFEFF/,""));
      if(rows.length<2)throw new Error("データがありません");
      const header=rows[0].map(x=>x.trim());
      const indexOf=name=>header.indexOf(name);
      let updated=0,missing=[];
      for(const row of rows.slice(1)){
        const name=row[indexOf("name")]?.trim();if(!name)continue;
        const t=tsums.find(x=>x.name===name);if(!t){missing.push(name);continue}
        const owned=Number(row[indexOf("owned")]),required=Number(row[indexOf("required")]);
        if(Number.isFinite(required)&&required>0)t.required=required;
        if(Number.isFinite(owned))t.owned=Math.max(0,Math.min(t.required,owned));
        if(indexOf("category")>=0&&row[indexOf("category")])t.category=row[indexOf("category")];
        if(indexOf("favorite")>=0)t.favorite=["1","true","TRUE"].includes(row[indexOf("favorite")]);
        if(indexOf("priority")>=0)t.priority=Number(row[indexOf("priority")])||0;
        if(indexOf("tags")>=0)t.tags=(row[indexOf("tags")]||"").split("|").map(x=>x.trim()).filter(Boolean);
        if(indexOf("memo")>=0)t.memo=row[indexOf("memo")]||"";
        updated++;
      }
      save();renderAll();
      if(missing.length)openMessage("CSV読込結果",`更新：${updated}体\n未登録：${missing.slice(0,20).join("、")}${missing.length>20?" ほか":""}`);
      else toast(`${updated}体をCSVから更新しました`);
    }catch(err){alert("CSVを読み込めませんでした："+err.message)}
  };
  reader.readAsText(file);
};

function runHealthCheck(){
  const duplicateNames=[...new Set(tsums.map(t=>t.name).filter((name,i,a)=>a.indexOf(name)!==i))];
  const invalidRequired=tsums.filter(t=>!Number.isFinite(t.required)||t.required<1);
  const overOwned=tsums.filter(t=>t.owned>t.required);
  const missingNames=tsums.filter(t=>!t.name.trim());
  const result=$("#healthResult");
  const issues=[];
  if(duplicateNames.length)issues.push(`重複名：${duplicateNames.length}件`);
  if(invalidRequired.length)issues.push(`必要数異常：${invalidRequired.length}件`);
  if(overOwned.length)issues.push(`所持数超過：${overOwned.length}件`);
  if(missingNames.length)issues.push(`名称未設定：${missingNames.length}件`);
  if(!issues.length){
    result.className="health-result ok";
    result.textContent=`問題は見つかりませんでした。登録${tsums.length}体、画像${tsums.filter(t=>t.image).length}体、保存データは正常です。`;
  }else{
    result.className="health-result warn";
    result.textContent="確認が必要です："+issues.join("／");
  }
}
$("#runHealthCheckButton").onclick=runHealthCheck;

const dark=localStorage.getItem("tm-dark")==="1";document.documentElement.classList.toggle("dark",dark);$("#darkToggle").checked=dark;
$("#darkToggle").onchange=e=>{document.documentElement.classList.toggle("dark",e.target.checked);localStorage.setItem("tm-dark",e.target.checked?"1":"0")};
$("#compactToggle").checked=compact;$("#compactToggle").onchange=e=>{compact=e.target.checked;gallery=false;localStorage.setItem("tm-compact",compact?"1":"0");localStorage.setItem("tm-gallery","0");if(activeView==="list")renderList()};
$("#masterCount").textContent=window.TSUM_MASTER_DATA.length+"体";
if("serviceWorker"in navigator)addEventListener("load",()=>navigator.serviceWorker.register("./service-worker.js").catch(()=>{}));
renderAll();showView("home");
