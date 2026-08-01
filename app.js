
const KEYS=["tsumManagerDataV634","tsumManagerDataV633","tsumManagerDataV632","tsumManagerDataV631","tsumManagerDataV63","tsumManagerDataV62","tsumManagerDataV611","tsumManagerDataV61","tsumManagerDataV602","tsumManagerDataV601","tsumManagerDataV60","tsumManagerDataV53","tsumManagerDataV521","tsumManagerDataV52","tsumManagerDataV51","tsumManagerDataV50","tsumManagerDataV40","tsumManagerDataV30","tsumManagerDataV20","tsumManagerDataV12","tsumManagerDataV11","tsumManagerDataV10","tsumManagerDataV9","tsumManagerDataV8","tsumManagerDataV7","tsumManagerDataV6","tsumManagerDataV5","tsumManagerDataV4","tsumManagerDataV3","tsumManagerDataV2","tsumManagerDataV1"];
const KEY="tsumManagerDataV634", HISTORY_KEY="tsumManagerHistoryV634", RECENT_KEY="tsumManagerRecentV634", PLAN_KEY="tsumManagerPlansV634", TODAY_KEY="tsumManagerTodayV634", UNDO_KEY="tsumManagerUndoV634", GOAL_KEY="tsumManagerGoalsV634", TICKET_STOCK_KEY="tsumManagerTicketStockV634", SNAPSHOT_KEY="tsumManagerSnapshotsV634", TASK_KEY="tsumManagerTasksV634", UNDO_HISTORY_KEY="tsumManagerUndoHistoryV634", BACKUP_META_KEY="tsumManagerBackupMetaV634";
const $=q=>document.querySelector(q);

// iPhone Safariの意図しない画面拡大を防止する。
document.addEventListener("gesturestart",e=>e.preventDefault(),{passive:false});
document.addEventListener("gesturechange",e=>e.preventDefault(),{passive:false});
document.addEventListener("gestureend",e=>e.preventDefault(),{passive:false});


function stabilizeMobileViewport(){
  document.documentElement.style.setProperty("--app-vw",`${document.documentElement.clientWidth}px`);
}
window.addEventListener("resize",stabilizeMobileViewport,{passive:true});
window.addEventListener("orientationchange",()=>setTimeout(stabilizeMobileViewport,150),{passive:true});
stabilizeMobileViewport();

const esc=s=>String(s??"").replace(/[&<>"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;","\"":"&quot;","'":"&#39;"}[c]));
const norm=t=>({
  id:t.id||crypto.randomUUID(),name:String(t.name||"名称未設定"),category:String(t.category||"未分類"),
  required:Math.max(1,Number(t.required||t.maxCopies||36)),owned:Math.max(0,Number(t.owned||0)),
  releaseYear:Number(t.releaseYear||t.year||0),releaseDate:String(t.releaseDate||""),releaseOrder:Number(t.releaseOrder||0),series:String(t.series||""),favorite:!!t.favorite,image:String(t.image||""),
  memo:String(t.memo||t.note||""),priority:Number(t.priority||0),
  tags:Array.isArray(t.tags)?t.tags.map(x=>String(x).trim()).filter(Boolean):String(t.tags||"").split(",").map(x=>x.trim()).filter(Boolean),
  coinRating:Math.max(0,Math.min(5,Number(t.coinRating||0))),
  scoreRating:Math.max(0,Math.min(5,Number(t.scoreRating||0))),
  easeRating:Math.max(0,Math.min(5,Number(t.easeRating||0))),
  missionTags:Array.isArray(t.missionTags)?t.missionTags.map(x=>String(x).trim()).filter(Boolean):String(t.missionTags||"").split(",").map(x=>x.trim()).filter(Boolean),
  requiredVerified:!!t.requiredVerified,requiredSource:String(t.requiredSource||"")
});
const master=()=>window.TSUM_MASTER_DATA.map(norm);
function mergeMaster(existing){
  const oldMap=new Map(existing.map(x=>[x.name,norm(x)]));
  const merged=[];
  for(const m of master()){
    const old=oldMap.get(m.name);
    if(old){
      merged.push(norm({
        ...m,
        ...old,
        required:m.required,
        requiredVerified:m.requiredVerified,
        requiredSource:m.requiredSource,
        owned:Math.min(Number(old.owned||0),Number(m.required||36)),
        releaseDate:old.releaseDate||m.releaseDate,
        releaseYear:old.releaseYear||m.releaseYear,
        releaseOrder:old.releaseOrder||m.releaseOrder
      }));
      oldMap.delete(m.name);
    }else{
      merged.push(m);
    }
  }
  for(const old of oldMap.values())merged.push(old);
  return merged;
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
let snapshots=(()=>{try{return JSON.parse(localStorage.getItem(SNAPSHOT_KEY)||"[]")}catch(e){return[]}})();
let dailyTasks=(()=>{try{return JSON.parse(localStorage.getItem(TASK_KEY)||"[]")}catch(e){return[]}})();
let undoHistory=(()=>{try{return JSON.parse(localStorage.getItem(UNDO_HISTORY_KEY)||"[]")}catch(e){return[]}})();
let viewerIndex=0,pendingBulkImages=[];
let todayTrainingId=localStorage.getItem(TODAY_KEY)||"";
let undoState=(()=>{try{return JSON.parse(localStorage.getItem(UNDO_KEY)||"null")}catch(e){return null}})();
let activeView="home",category="すべて",status="all",activeTag="すべて",releaseYearFilter="all",releaseMonthFilter="all",seriesFilter="all",collectionCategory="すべて",collectionLimit=60,rankingType="coin",rankingOwnedOnly=true,missingMode="release",increment=1;
let compact=localStorage.getItem("tm-compact")==="1",gallery=localStorage.getItem("tm-gallery")==="1",editingImage="",ticketSelection="",detailId="";
function save(){localStorage.setItem(KEY,JSON.stringify(tsums))}
function saveHistory(){localStorage.setItem(HISTORY_KEY,JSON.stringify(history.slice(0,50)))}
function saveRecent(){localStorage.setItem(RECENT_KEY,JSON.stringify(recent.slice(0,20)))}
function savePlans(){localStorage.setItem(PLAN_KEY,JSON.stringify(plans))}
function saveGoals(){localStorage.setItem(GOAL_KEY,JSON.stringify(goals))}
function saveTicketStock(){localStorage.setItem(TICKET_STOCK_KEY,String(ticketStock))}
function saveSnapshots(){localStorage.setItem(SNAPSHOT_KEY,JSON.stringify(snapshots.slice(-60)))}
function saveTasks(){localStorage.setItem(TASK_KEY,JSON.stringify(dailyTasks))}
function saveUndoHistory(){localStorage.setItem(UNDO_HISTORY_KEY,JSON.stringify(undoHistory.slice(0,20)))}
function saveToday(){todayTrainingId?localStorage.setItem(TODAY_KEY,todayTrainingId):localStorage.removeItem(TODAY_KEY)}
function saveUndo(){undoState?localStorage.setItem(UNDO_KEY,JSON.stringify(undoState)):localStorage.removeItem(UNDO_KEY)}
function setUndo(description,changes){
  undoState={description,changes,time:new Date().toISOString()};
  undoHistory.unshift(JSON.parse(JSON.stringify(undoState)));
  undoHistory=undoHistory.slice(0,20);
  saveUndo();saveUndoHistory();
  renderUndo();renderUndoHistory();
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
  if(view==="strategy")renderStrategy();
  if(view==="goals")renderGoals();
  if(view==="planner")renderPlanner();
  if(view==="settings")renderSettings();
  scrollTo({top:0,behavior:"smooth"});
}
function avatarHtml(t){return t.image?`<img src="${esc(t.image)}" alt="">`:esc(t.name.slice(0,1))}
function cardHtml(t){
  const tag=priorityText(t.priority);
  return `<article class="tsum-card ${remain(t)>0&&remain(t)<=5?"near-max":""}">
    <button class="avatar" data-action="${t.image?"viewer":"detail"}" data-id="${t.id}">${avatarHtml(t)}</button>
    <div>
      <div class="title-row">
        <button class="star ${t.favorite?"on":""}" data-action="favorite" data-id="${t.id}">★</button>
        <strong role="button" data-action="detail" data-id="${t.id}">${esc(t.name)}</strong>
        ${tag?`<span class="priority-tag">${tag}</span>`:""}
        <button class="more" data-action="edit" data-id="${t.id}">•••</button>
      </div>
      <div class="meta">${esc(t.category)} ・ ${skillText(t)} ・ 残り${remain(t)} ・ ${pct(t)}%</div>
      <div class="release-label">${t.releaseDate?`登場 ${esc(t.releaseDate.replace("-", "年"))}月`:"登場年月未登録"}</div>
      ${t.series?`<div class="series-label">${esc(t.series)}</div>`:""}
      ${t.tags.length?`<div class="tag-list">${t.tags.slice(0,3).map(tag=>`<span class="tag-pill">${esc(tag)}</span>`).join("")}</div>`:""}
      ${(t.coinRating||t.scoreRating||t.easeRating)?`<div class="rating-stars">C${"★".repeat(t.coinRating)} S${"★".repeat(t.scoreRating)} E${"★".repeat(t.easeRating)}</div>`:""}
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
  if(action==="viewer"){touchRecent(t.id);openImageViewer(t);return}
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
  renderSnapshots();
  renderDailyTasks();
  renderMonthlyReport();
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





function renderDailyTasks(){
  const list=$("#dailyTaskList");if(!list)return;
  list.innerHTML=dailyTasks.length?dailyTasks.map(t=>`<div class="task-item ${t.done?"done":""}">
    <input type="checkbox" data-task-check="${t.id}" ${t.done?"checked":""}>
    <div><strong>${esc(t.title)}</strong><small>${t.tsumName?esc(t.tsumName)+" ・ ":""}${t.target?`目標 ${t.target}`:""}</small></div>
    <button data-edit-task="${t.id}">編集</button>
  </div>`).join(""):`<div class="helper">今日のタスクはありません。</div>`;
  list.querySelectorAll("[data-task-check]").forEach(c=>c.onchange=()=>{const t=dailyTasks.find(x=>x.id===c.dataset.taskCheck);if(t){t.done=c.checked;saveTasks();renderDailyTasks()}});
  list.querySelectorAll("[data-edit-task]").forEach(b=>b.onclick=()=>{const t=dailyTasks.find(x=>x.id===b.dataset.editTask);if(t)openTask(t)});
  const done=dailyTasks.filter(t=>t.done).length,total=dailyTasks.length,p=total?Math.round(done/total*100):0;
  $("#taskProgressBar").style.width=p+"%";
  $("#taskProgressText").textContent=total?`${done}/${total}件完了（${p}%）`:"";
}
function openTask(task=null){
  $("#taskDialogTitle").textContent=task?"今日のタスクを編集":"今日のタスクを追加";
  $("#taskId").value=task?.id||"";
  $("#taskTitle").value=task?.title||"";
  $("#taskTsumName").value=task?.tsumName||"";
  $("#taskTarget").value=task?.target||1;
  $("#deleteTaskButton").style.display=task?"":"none";
  $("#taskDialog").showModal();
}
function renderMonthlyReport(){
  const el=$("#monthlyReport");if(!el)return;
  const now=new Date(),month=now.getMonth(),year=now.getFullYear();
  const monthRows=snapshots.filter(s=>{const d=new Date(s.date);return d.getMonth()===month&&d.getFullYear()===year});
  const first=monthRows[0],last=monthRows[monthRows.length-1];
  const ownedDiff=first&&last?last.ownedTsums-first.ownedTsums:0;
  const maxDiff=first&&last?last.maxed-first.maxed:0;
  const progressDiff=first&&last?last.percent-first.percent:0;
  const taskDone=dailyTasks.filter(t=>t.done).length;
  el.innerHTML=`<div><b>${ownedDiff>=0?"+":""}${ownedDiff}</b><span>所持ツム増加</span></div><div><b>${maxDiff>=0?"+":""}${maxDiff}</b><span>スキルマ増加</span></div><div><b>${progressDiff>=0?"+":""}${progressDiff}%</b><span>進捗増加</span></div><div><b>${taskDone}</b><span>今日の完了タスク</span></div>`;
}
function renderUndoHistory(){
  const el=$("#undoHistoryList");if(!el)return;
  el.innerHTML=undoHistory.length?undoHistory.map((u,i)=>`<div class="history-item"><span>${esc(u.description)}</span><span>${new Date(u.time).toLocaleString("ja-JP",{month:"numeric",day:"numeric",hour:"2-digit",minute:"2-digit"})}</span><button data-undo-history-index="${i}">戻す</button></div>`).join(""):`<div class="helper">取り消し履歴はありません。</div>`;
  el.querySelectorAll("[data-undo-history-index]").forEach(b=>b.onclick=()=>applyUndoHistory(Number(b.dataset.undoHistoryIndex)));
}
function applyUndoHistory(index){
  const u=undoHistory[index];if(!u||!Array.isArray(u.changes))return;
  for(const c of u.changes){
    const t=tsums.find(x=>x.id===c.id);if(!t)continue;
    if(Number.isFinite(c.owned))t.owned=c.owned;
    if(typeof c.favorite==="boolean")t.favorite=c.favorite;
  }
  undoHistory.splice(index,1);saveUndoHistory();save();renderAll();renderUndoHistory();toast("履歴から操作を戻しました");
}
function imageRows(){return tsums.filter(t=>t.image)}
function openImageViewer(t){
  const rows=imageRows();viewerIndex=Math.max(0,rows.findIndex(x=>x.id===t.id));
  renderImageViewer();$("#imageViewerDialog").showModal();
}
function renderImageViewer(){
  const rows=imageRows();if(!rows.length)return;
  const t=rows[viewerIndex];
  $("#viewerImage").src=t.image;$("#viewerName").textContent=t.name;
  $("#prevImageButton").disabled=viewerIndex<=0;$("#nextImageButton").disabled=viewerIndex>=rows.length-1;
}

function ratingValue(t,type){
  if(type==="coin")return t.coinRating;
  if(type==="score")return t.scoreRating;
  if(type==="ease")return t.easeRating;
  return Number(((t.coinRating+t.scoreRating+t.easeRating)/3).toFixed(2));
}
function renderStrategy(){
  $("#rankingOwnedOnlyButton").textContent=rankingOwnedOnly?"所持ツムのみ":"全ツム表示";
  
$("#addTaskButton").onclick=()=>openTask();
$("#cancelTaskButton").onclick=()=>$("#taskDialog").close();
$("#taskForm").onsubmit=e=>{
  e.preventDefault();
  const id=$("#taskId").value||crypto.randomUUID();
  const obj={id,title:$("#taskTitle").value.trim(),tsumName:$("#taskTsumName").value.trim(),target:Number($("#taskTarget").value)||0,done:dailyTasks.find(t=>t.id===id)?.done||false};
  const i=dailyTasks.findIndex(t=>t.id===id);if(i>=0)dailyTasks[i]=obj;else dailyTasks.push(obj);
  saveTasks();$("#taskDialog").close();renderDailyTasks();renderMonthlyReport();toast("タスクを保存しました");
};
$("#deleteTaskButton").onclick=()=>{const id=$("#taskId").value;if(id&&confirm("このタスクを削除しますか？")){dailyTasks=dailyTasks.filter(t=>t.id!==id);saveTasks();$("#taskDialog").close();renderDailyTasks();renderMonthlyReport()}};
$("#refreshMonthlyReportButton").onclick=()=>{renderMonthlyReport();toast("月次レポートを更新しました")};
$("#clearUndoHistoryButton").onclick=()=>{if(confirm("取り消し履歴を削除しますか？")){undoHistory=[];saveUndoHistory();renderUndoHistory()}};
$("#closeImageViewerButton").onclick=()=>$("#imageViewerDialog").close();
$("#prevImageButton").onclick=()=>{viewerIndex=Math.max(0,viewerIndex-1);renderImageViewer()};
$("#nextImageButton").onclick=()=>{viewerIndex=Math.min(imageRows().length-1,viewerIndex+1);renderImageViewer()};

document.querySelectorAll("[data-ranking-type]").forEach(b=>b.classList.toggle("active",b.dataset.rankingType===rankingType));
  let rows=tsums.filter(t=>(!rankingOwnedOnly||t.owned>0)&&ratingValue(t,rankingType)>0);
  rows.sort((a,b)=>ratingValue(b,rankingType)-ratingValue(a,rankingType)||a.name.localeCompare(b.name,"ja"));
  $("#personalRankingList").innerHTML=rows.slice(0,30).map((t,i)=>`<div class="personal-ranking-item">
    <span>${i+1}</span><div class="avatar">${avatarHtml(t)}</div><div><strong>${esc(t.name)}</strong><small>${rankingType==="overall"?"総合":rankingType==="coin"?"コイン":rankingType==="score"?"スコア":"使いやすさ"} ${ratingValue(t,rankingType).toFixed(rankingType==="overall"?1:0)}／5</small></div><button data-strategy-id="${t.id}">詳細</button>
  </div>`).join("")||`<div class="helper">評価を登録したツムがありません。</div>`;
  $("#personalRankingList").querySelectorAll("[data-strategy-id]").forEach(b=>b.onclick=()=>{const t=tsums.find(x=>x.id===b.dataset.strategyId);if(t)openDetail(t)});
  renderMissionSearch();
  const coin=tsums.filter(t=>t.coinRating>0).length,score=tsums.filter(t=>t.scoreRating>0).length,ease=tsums.filter(t=>t.easeRating>0).length;
  $("#ratingCoverage").innerHTML=`<div><b>${coin}</b><span>コイン評価済み</span></div><div><b>${score}</b><span>スコア評価済み</span></div><div><b>${ease}</b><span>使いやすさ評価済み</span></div>`;
}
function renderMissionSearch(){
  const q=$("#missionSearchInput").value.trim().toLowerCase();
  const rows=q?tsums.filter(t=>t.missionTags.some(tag=>tag.toLowerCase().includes(q))&&(t.owned>0||!rankingOwnedOnly)).sort((a,b)=>ratingValue(b,"overall")-ratingValue(a,"overall")).slice(0,30):[];
  $("#missionResultList").innerHTML=rows.map(t=>`<div class="mini-item"><div class="avatar">${avatarHtml(t)}</div><div><strong>${esc(t.name)}</strong><small>${t.missionTags.filter(tag=>tag.toLowerCase().includes(q)).map(tag=>`<span class="mission-match">${esc(tag)}</span>`).join("")}</small></div><button data-mission-id="${t.id}">詳細</button></div>`).join("")||`<div class="helper">${q?"一致する適性タグがありません。":"ミッション名を入力してください。"}</div>`;
  $("#missionResultList").querySelectorAll("[data-mission-id]").forEach(b=>b.onclick=()=>{const t=tsums.find(x=>x.id===b.dataset.missionId);if(t)openDetail(t)});
}

function createSnapshot(){
  const s=summary();
  snapshots.push({
    id:crypto.randomUUID(),
    date:new Date().toISOString(),
    percent:s.percent,
    ownedTsums:s.ownedTsums,
    maxed:s.maxed,
    remaining:s.remaining,
    totalOwned:s.owned
  });
  snapshots=snapshots.slice(-60);
  saveSnapshots();
  renderSnapshots();
  renderDailyTasks();
  renderMonthlyReport();
  toast("現在の進捗を記録しました");
}
function renderSnapshots(){
  const summaryEl=$("#snapshotSummary"),chart=$("#snapshotChart");
  if(!summaryEl||!chart)return;
  if(!snapshots.length){
    summaryEl.innerHTML=`<div><b>0</b><span>記録数</span></div><div><b>—</b><span>前回比</span></div><div><b>—</b><span>スキルマ増加</span></div>`;
    chart.innerHTML=`<div class="snapshot-empty">「現在を記録」を押すと、進捗の変化を確認できます。</div>`;
    return;
  }
  const latest=snapshots[snapshots.length-1],prev=snapshots[snapshots.length-2];
  const diff=prev?latest.percent-prev.percent:0;
  const maxDiff=prev?latest.maxed-prev.maxed:0;
  summaryEl.innerHTML=`<div><b>${snapshots.length}</b><span>記録数</span></div><div><b>${diff>=0?"+":""}${diff}%</b><span>前回比</span></div><div><b>${maxDiff>=0?"+":""}${maxDiff}</b><span>スキルマ増加</span></div>`;
  const rows=snapshots.slice(-12);
  const maxPercent=Math.max(1,...rows.map(x=>x.percent));
  chart.innerHTML=rows.map(x=>{
    const h=Math.max(3,Math.round(x.percent/maxPercent*100));
    const d=new Date(x.date);
    return `<div class="snapshot-bar"><b>${x.percent}%</b><i style="height:${h}%"></i><span>${d.getMonth()+1}/${d.getDate()}</span></div>`;
  }).join("");
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
      <div class="goal-card-meta"><span>${g.type==="max"?"スキルマ":`所持数${target}`}</span><span>残り${need}</span>${g.deadline?`<span>期限 ${esc(g.deadline)}</span>`:""}${g.milestone?`<span class="milestone-badge">途中目標 ${g.milestone}</span>`:""}</div>
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
  $("#goalMilestone").value=goal?.milestone||"";
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
  const releaseYears=[...new Set(tsums.filter(t=>t.releaseDate).map(t=>t.releaseDate.slice(0,4)))].sort();
  $("#releaseYearFilter").innerHTML=`<option value="all">登場年：すべて</option>`+releaseYears.map(y=>`<option value="${y}" ${releaseYearFilter===y?"selected":""}>${y}年</option>`).join("");
  $("#releaseMonthFilter").innerHTML=`<option value="all">登場月：すべて</option>`+Array.from({length:12},(_,i)=>String(i+1).padStart(2,"0")).map(m=>`<option value="${m}" ${releaseMonthFilter===m?"selected":""}>${Number(m)}月</option>`).join("");
  const seriesList=[...new Set(tsums.map(t=>t.series).filter(Boolean))].sort((a,b)=>a.localeCompare(b,"ja"));
  $("#seriesFilter").innerHTML=`<option value="all">シリーズ：すべて</option>`+seriesList.map(s=>`<option value="${esc(s)}" ${seriesFilter===s?"selected":""}>${esc(s)}</option>`).join("");
  let rows=tsums.filter(t=>{
    const matchStatus=status==="all"||(status==="unowned"&&t.owned===0)||(status==="owned"&&t.owned>0&&remain(t)>0)||(status==="max"&&remain(t)===0)||(status==="near"&&remain(t)>0&&remain(t)<=5)||(status==="favorite"&&t.favorite)||(status==="priority"&&t.priority>0)||(status==="noimage"&&!t.image);
    const releaseMatch=(releaseYearFilter==="all"||(t.releaseDate&&t.releaseDate.slice(0,4)===releaseYearFilter))&&(releaseMonthFilter==="all"||(t.releaseDate&&t.releaseDate.slice(5,7)===releaseMonthFilter));
    const seriesMatch=seriesFilter==="all"||t.series===seriesFilter;
    return (category==="すべて"||t.category===category)&&(activeTag==="すべて"||t.tags.includes(activeTag))&&releaseMatch&&seriesMatch&&matchStatus&&(t.name.toLowerCase().includes(q)||t.memo.toLowerCase().includes(q)||t.tags.some(tag=>tag.toLowerCase().includes(q)));
  });
  rows.sort((a,b)=>{
    if(sort==="remain")return remain(a)-remain(b)||a.name.localeCompare(b.name,"ja");
    if(sort==="progress")return pct(b)-pct(a)||a.name.localeCompare(b.name,"ja");
    if(sort==="owned")return b.owned-a.owned||a.name.localeCompare(b.name,"ja");
    if(sort==="favorite")return Number(b.favorite)-Number(a.favorite)||a.name.localeCompare(b.name,"ja");
    if(sort==="releaseOld"){
      if(a.releaseDate&&b.releaseDate)return a.releaseDate.localeCompare(b.releaseDate)||a.releaseOrder-b.releaseOrder||a.name.localeCompare(b.name,"ja");
      if(a.releaseDate)return -1;if(b.releaseDate)return 1;
      return a.releaseOrder-b.releaseOrder||a.name.localeCompare(b.name,"ja");
    }
    if(sort==="releaseNew"){
      if(a.releaseDate&&b.releaseDate)return b.releaseDate.localeCompare(a.releaseDate)||b.releaseOrder-a.releaseOrder||a.name.localeCompare(b.name,"ja");
      if(a.releaseDate)return -1;if(b.releaseDate)return 1;
      return b.releaseOrder-a.releaseOrder||a.name.localeCompare(b.name,"ja");
    }
    if(sort==="series")return (a.series||"未登録").localeCompare(b.series||"未登録","ja")||a.name.localeCompare(b.name,"ja");
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
function renderSettings(){
  $("#masterCount").textContent=window.TSUM_MASTER_DATA.length+"体";
  const dated=tsums.filter(t=>t.releaseDate).length;
  const seriesCount=tsums.filter(t=>t.series).length;
  const imageCount=tsums.filter(t=>t.image).length;
  $("#releaseDateCoverage").textContent=`${dated}/${tsums.length}体`;
  $("#seriesCoverage").textContent=`${seriesCount}/${tsums.length}体`;
  $("#masterDataStatus").innerHTML=`<div><b>${dated}</b><span>年月登録</span></div><div><b>${seriesCount}</b><span>シリーズ登録</span></div><div><b>${imageCount}</b><span>画像登録</span></div>`;
  renderUndoHistory();

  renderBackupSummary();
  renderStorageHealth();
}
function renderAll(){
  renderHome();
  if(activeView==="collection")renderCollection();
  if(activeView==="list")renderList();
  if(activeView==="training")renderTraining();
  if(activeView==="stats")renderStats();
  if(activeView==="strategy")renderStrategy();
  if(activeView==="goals")renderGoals();
  if(activeView==="planner")renderPlanner();
  if(activeView==="box")renderBox();
}
function openEdit(t=null){
  $("#dialogTitle").textContent=t?"ツムを編集":"ツムを追加";$("#editId").value=t?.id||"";
  $("#editName").value=t?.name||"";$("#editCategory").value=t?.category||"プレミアム";
  $("#editRequired").value=t?.required||36;$("#editReleaseDate").value=t?.releaseDate||"";$("#editSeries").value=t?.series||"";$("#editOwned").value=t?.owned||0;
  $("#editPriority").value=String(t?.priority||0);$("#editTags").value=(t?.tags||[]).join(",");
  $("#editCoinRating").value=String(t?.coinRating||0);$("#editScoreRating").value=String(t?.scoreRating||0);$("#editEaseRating").value=String(t?.easeRating||0);
  $("#editMissionTags").value=(t?.missionTags||[]).join(",");$("#editMemo").value=t?.memo||"";
  editingImage=t?.image||"";renderImagePreview();$("#deleteButton").style.display=t?"":"none";$("#editDialog").showModal();
}
function renderImagePreview(){
  const zone=$("#imagePreview");
  zone.innerHTML=editingImage?`<img src="${editingImage}" alt="登録画像">`:`<span>画像をタップして選択</span>`;
}

function compressImageFile(file){
  return new Promise((resolve,reject)=>{
    if(!file||!file.type.startsWith("image/")){reject(new Error("画像ファイルではありません"));return}
    const reader=new FileReader();
    reader.onerror=()=>reject(new Error("画像を読み込めませんでした"));
    reader.onload=()=>{
      const img=new Image();
      img.onerror=()=>reject(new Error("画像を開けませんでした"));
      img.onload=()=>{
        const size=240,canvas=document.createElement("canvas"),ctx=canvas.getContext("2d");
        canvas.width=size;canvas.height=size;
        const scale=Math.max(size/img.width,size/img.height);
        const w=img.width*scale,h=img.height*scale;
        ctx.drawImage(img,(size-w)/2,(size-h)/2,w,h);
        resolve(canvas.toDataURL("image/jpeg",0.72));
      };
      img.src=reader.result;
    };
    reader.readAsDataURL(file);
  });
}
async function applySelectedImage(file){
  try{
    editingImage=await compressImageFile(file);
    renderImagePreview();
    toast("画像を登録しました");
  }catch(err){alert(err.message)}
}
$("#editImageInput").onchange=e=>{const f=e.target.files[0];if(f)applySelectedImage(f)};
$("#editCameraInput").onchange=e=>{const f=e.target.files[0];if(f)applySelectedImage(f)};
$("#editForm").onsubmit=e=>{
  e.preventDefault();const id=$("#editId").value,obj=norm({id:id||undefined,name:$("#editName").value.trim(),category:$("#editCategory").value.trim(),required:$("#editRequired").value,owned:$("#editOwned").value,releaseDate:$("#editReleaseDate").value,releaseYear:$("#editReleaseDate").value?Number($("#editReleaseDate").value.slice(0,4)):0,releaseOrder:tsums.find(t=>t.id===id)?.releaseOrder||tsums.length+1,series:$("#editSeries").value.trim(),priority:$("#editPriority").value,image:editingImage,tags:$("#editTags").value,
  coinRating:$("#editCoinRating").value,scoreRating:$("#editScoreRating").value,easeRating:$("#editEaseRating").value,
  missionTags:$("#editMissionTags").value,memo:$("#editMemo").value});
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
$("#releaseYearFilter").onchange=e=>{releaseYearFilter=e.target.value;renderList()};
$("#releaseMonthFilter").onchange=e=>{releaseMonthFilter=e.target.value;renderList()};
$("#seriesFilter").onchange=e=>{seriesFilter=e.target.value;renderList()};
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


$("#imagePreview").onclick=()=>$("#editImageInput").click();
$("#imagePreview").onkeydown=e=>{if(e.key==="Enter"||e.key===" "){e.preventDefault();$("#editImageInput").click()}};
["dragenter","dragover"].forEach(type=>$("#imagePreview").addEventListener(type,e=>{e.preventDefault();$("#imagePreview").classList.add("dragover")}));
["dragleave","drop"].forEach(type=>$("#imagePreview").addEventListener(type,e=>{e.preventDefault();$("#imagePreview").classList.remove("dragover")}));
$("#imagePreview").addEventListener("drop",e=>{const f=e.dataTransfer.files[0];if(f)applySelectedImage(f)});


function isQuotaError(err){
  return !!err && (
    err.name==="QuotaExceededError" ||
    err.name==="NS_ERROR_DOM_QUOTA_REACHED" ||
    err.code===22 ||
    err.code===1014
  );
}
function localStorageUsageBytes(){
  let chars=0;
  try{
    for(let i=0;i<localStorage.length;i++){
      const key=localStorage.key(i)||"";
      chars+=key.length+(localStorage.getItem(key)||"").length;
    }
  }catch(e){}
  return chars*2;
}
function safeSaveWithMessage(){
  try{
    save();
    return {ok:true};
  }catch(err){
    if(isQuotaError(err)){
      return {
        ok:false,
        quota:true,
        message:"Safariの保存容量が不足しています。画像込みバックアップを保存した後、不要な画像を削除するか、画像を少しずつ登録してください。"
      };
    }
    return {ok:false,quota:false,message:err?.message||String(err)};
  }
}

function normalizeImageFileName(name){
  return name.replace(/\.[^.]+$/,"").trim()
    .normalize("NFKC")
    .replace(/[・･_\-‐‑‒–—―()（）\[\]【】「」『』'’"“”]/g,"")
    .replace(/\s+/g,"")
    .toLowerCase();
}
function levenshteinDistance(a,b){
  const dp=Array.from({length:a.length+1},()=>Array(b.length+1).fill(0));
  for(let i=0;i<=a.length;i++)dp[i][0]=i;
  for(let j=0;j<=b.length;j++)dp[0][j]=j;
  for(let i=1;i<=a.length;i++){
    for(let j=1;j<=b.length;j++){
      const cost=a[i-1]===b[j-1]?0:1;
      dp[i][j]=Math.min(dp[i-1][j]+1,dp[i][j-1]+1,dp[i-1][j-1]+cost);
    }
  }
  return dp[a.length][b.length];
}
function candidateScore(fileBase,tsumName){
  const name=normalizeImageFileName(tsumName);
  if(name===fileBase)return 1000;
  const maxLen=Math.max(fileBase.length,name.length,1);
  let score=100-(levenshteinDistance(fileBase,name)/maxLen*100);
  if(name.includes(fileBase)||fileBase.includes(name))score+=20;
  return score;
}
function getBulkCandidates(fileBase){
  return tsums
    .filter(t=>!t.image)
    .map(t=>({t,score:candidateScore(fileBase,t.name)}))
    .sort((a,b)=>b.score-a.score||a.t.name.localeCompare(b.t.name,"ja"))
    .slice(0,8);
}
function renderPendingBulkImages(){
  const holder=$("#bulkImagePending"),button=$("#applyBulkCandidatesButton");
  holder.innerHTML=pendingBulkImages.map((item,index)=>{
    const options=item.candidates.map((c,i)=>`<option value="${c.t.id}" ${i===0?"selected":""}>${esc(c.t.name)}（近さ ${Math.max(0,Math.round(c.score))}%）</option>`).join("");
    return `<div class="bulk-pending-item">
      <img src="${item.image}" alt="">
      <div>
        <strong>${esc(item.fileName)}</strong>
        <select data-pending-select="${index}">
          <option value="">登録しない</option>
          ${options}
        </select>
        <div class="bulk-pending-note">画像未登録のツムから近い名前順に表示しています。</div>
      </div>
    </div>`;
  }).join("");
  button.hidden=pendingBulkImages.length===0;
}
$("#bulkImageInput").onchange=async e=>{
  const files=[...e.target.files];
  if(!files.length)return;

  const result=$("#bulkImageResult");
  const pendingHolder=$("#bulkImagePending");
  const applyButton=$("#applyBulkCandidatesButton");
  let matched=0,failed=[],quotaStopped=false;
  pendingBulkImages=[];

  result.innerHTML=`画像を準備しています… 0/${files.length}件`;
  pendingHolder.innerHTML="";
  applyButton.hidden=true;

  await new Promise(resolve=>setTimeout(resolve,40));

  for(let i=0;i<files.length;i++){
    const file=files[i];
    result.innerHTML=`画像を処理しています… ${i+1}/${files.length}件<br>登録済み：${matched}件<br>候補選択待ち：${pendingBulkImages.length}件`;

    try{
      const base=normalizeImageFileName(file.name);
      const exactCandidates=tsums.filter(x=>normalizeImageFileName(x.name)===base);
      const exact=exactCandidates.length===1?exactCandidates[0]:null;
      const image=await compressImageFile(file);

      if(exact){
        const before=exact.image;
        exact.image=image;

        const saved=safeSaveWithMessage();
        if(!saved.ok){
          exact.image=before;
          quotaStopped=true;
          result.innerHTML=`<span class="bulk-result-warn">保存容量不足のため途中で停止しました。</span><br>登録成功：${matched}件<br>未処理：${files.length-i}件<br><br>${esc(saved.message)}<br><br>現在の推定使用量：約${formatBytes(localStorageUsageBytes())}`;
          break;
        }
        matched++;
      }else{
        pendingBulkImages.push({
          fileName:file.name,
          image,
          candidates:getBulkCandidates(base)
        });
      }
    }catch(err){
      failed.push(`${file.name}：${err?.message||String(err)}`);
    }

    await new Promise(resolve=>setTimeout(resolve,0));
  }

  renderAll();
  renderPendingBulkImages();

  if(!quotaStopped){
    result.innerHTML=`<span class="bulk-result-good">完全一致で登録：${matched}件</span><br><span class="bulk-result-warn">候補選択待ち：${pendingBulkImages.length}件</span><br>読込失敗：${failed.length}件<br>現在の推定使用量：約${formatBytes(localStorageUsageBytes())}${failed.length?`<br><br>失敗：<br>${failed.slice(0,20).map(esc).join("<br>")}`:""}`;
    toast(`${matched}体の画像を登録しました`);
  }

  e.target.value="";
};


function masterDataCsvEscape(value){
  const text=String(value??"");
  return /[",\n]/.test(text)?`"${text.replace(/"/g,'""')}"`:text;
}
$("#exportMasterCsvButton").onclick=()=>{
  const rows=tsums.map(t=>[t.name,t.releaseDate,t.series,t.releaseOrder].map(masterDataCsvEscape).join(","));
  const csv="\uFEFF"+["name,releaseDate,series,releaseOrder",...rows].join("\r\n");
  const blob=new Blob([csv],{type:"text/csv;charset=utf-8"});
  const a=document.createElement("a");
  a.href=URL.createObjectURL(blob);
  a.download=`TsumManager_master_${new Date().toISOString().slice(0,10)}.csv`;
  a.click();
  URL.revokeObjectURL(a.href);
};
$("#importMasterCsvInput").onchange=e=>{
  const file=e.target.files[0];if(!file)return;
  const reader=new FileReader();
  reader.onload=()=>{
    try{
      const rows=parseCsv(String(reader.result).replace(/^\uFEFF/,""));
      if(rows.length<2)throw new Error("データがありません");
      const header=rows[0].map(x=>x.trim());
      const pos=name=>header.indexOf(name);
      let updated=0,missing=[];
      for(const row of rows.slice(1)){
        const name=row[pos("name")]?.trim();if(!name)continue;
        const t=tsums.find(x=>x.name===name);
        if(!t){missing.push(name);continue}
        if(pos("releaseDate")>=0){
          const value=(row[pos("releaseDate")]||"").trim();
          if(!value||/^\d{4}-\d{2}$/.test(value)){
            t.releaseDate=value;
            t.releaseYear=value?Number(value.slice(0,4)):0;
          }
        }
        if(pos("series")>=0)t.series=(row[pos("series")]||"").trim();
        if(pos("releaseOrder")>=0&&Number(row[pos("releaseOrder")])>0)t.releaseOrder=Number(row[pos("releaseOrder")]);
        updated++;
      }
      save();renderAll();renderSettings();
      if(missing.length)openMessage("年月・シリーズCSV読込",`更新：${updated}体\n未登録名：${missing.slice(0,30).join("、")}${missing.length>30?" ほか":""}`);
      else toast(`${updated}体の年月・シリーズを更新しました`);
    }catch(err){alert("CSVを読み込めませんでした："+err.message)}
  };
  reader.readAsText(file);
};
function openMissingData(mode){
  missingMode=mode;
  $("#missingDataTitle").textContent=mode==="release"?"登場年月未登録":"シリーズ未登録";
  $("#missingDataSearch").value="";
  renderMissingData();
  $("#missingDataDialog").showModal();
}
function renderMissingData(){
  const q=$("#missingDataSearch").value.trim().toLowerCase();
  const rows=tsums.filter(t=>(missingMode==="release"?!t.releaseDate:!t.series)&&t.name.toLowerCase().includes(q));
  $("#missingDataList").innerHTML=rows.map(t=>`<div class="missing-data-item">
    <strong>${esc(t.name)}</strong>
    <input type="month" data-missing-release="${t.id}" value="${esc(t.releaseDate)}">
    <input type="text" data-missing-series="${t.id}" value="${esc(t.series)}" placeholder="シリーズ">
  </div>`).join("")||`<div class="helper">未登録データはありません。</div>`;
  $("#missingDataList").querySelectorAll("[data-missing-release]").forEach(input=>input.onchange=()=>{
    const t=tsums.find(x=>x.id===input.dataset.missingRelease);if(!t)return;
    t.releaseDate=input.value;t.releaseYear=input.value?Number(input.value.slice(0,4)):0;save();renderSettings();
  });
  $("#missingDataList").querySelectorAll("[data-missing-series]").forEach(input=>input.onchange=()=>{
    const t=tsums.find(x=>x.id===input.dataset.missingSeries);if(!t)return;
    t.series=input.value.trim();save();renderSettings();
  });
}
$("#showMissingReleaseButton").onclick=()=>openMissingData("release");
$("#showMissingSeriesButton").onclick=()=>openMissingData("series");
$("#missingDataSearch").oninput=renderMissingData;
$("#closeMissingDataButton").onclick=()=>{$("#missingDataDialog").close();renderAll()};


$("#applyBulkCandidatesButton").onclick=()=>{
  let applied=0,skipped=0,duplicates=[],quotaStopped=false;
  const selections=[...$("#bulkImagePending").querySelectorAll("[data-pending-select]")];

  for(const select of selections){
    const index=Number(select.dataset.pendingSelect);
    const item=pendingBulkImages[index];
    const id=select.value;
    if(!item||!id){skipped++;continue}

    const t=tsums.find(x=>x.id===id);
    if(!t){skipped++;continue}
    if(t.image){duplicates.push(t.name);continue}

    const before=t.image;
    t.image=item.image;
    const saved=safeSaveWithMessage();

    if(!saved.ok){
      t.image=before;
      quotaStopped=true;
      $("#bulkImageResult").innerHTML=`<span class="bulk-result-warn">保存容量不足のため途中で停止しました。</span><br>候補から登録：${applied}件<br><br>${esc(saved.message)}<br>現在の推定使用量：約${formatBytes(localStorageUsageBytes())}`;
      break;
    }
    applied++;
  }

  renderAll();

  if(!quotaStopped){
    pendingBulkImages=[];
    renderPendingBulkImages();
    $("#bulkImageResult").innerHTML=`<span class="bulk-result-good">候補から登録：${applied}件</span><br>登録しなかった画像：${skipped}件${duplicates.length?`<br><span class="bulk-result-warn">既に画像あり：${duplicates.map(esc).join("、")}</span>`:""}<br>現在の推定使用量：約${formatBytes(localStorageUsageBytes())}`;
    toast(`${applied}体へ画像を登録しました`);
  }
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
  const blob=new Blob([JSON.stringify({app:"TsumManager",version:"6.3.4",exportedAt:new Date().toISOString(),tsums,history,recent,plans,todayTrainingId,goals,ticketStock,snapshots,dailyTasks,undoHistory},null,2)],{type:"application/json"});
  const a=document.createElement("a");a.href=URL.createObjectURL(blob);a.download=`TsumManager_backup_${new Date().toISOString().slice(0,10)}.json`;a.click();URL.revokeObjectURL(a.href);
};
$("#importInput").onchange=e=>{
  const f=e.target.files[0];if(!f)return;const r=new FileReader();
  r.onload=()=>{try{const j=JSON.parse(r.result),arr=Array.isArray(j)?j:j.tsums;if(!Array.isArray(arr))throw 0;tsums=mergeMaster(arr);if(Array.isArray(j.history))history=j.history;if(Array.isArray(j.recent))recent=j.recent;if(Array.isArray(j.plans))plans=j.plans;if(typeof j.todayTrainingId==="string")todayTrainingId=j.todayTrainingId;if(Array.isArray(j.goals))goals=j.goals;if(Number.isFinite(j.ticketStock))ticketStock=Math.max(0,j.ticketStock);if(Array.isArray(j.snapshots))snapshots=j.snapshots;if(Array.isArray(j.dailyTasks))dailyTasks=j.dailyTasks;if(Array.isArray(j.undoHistory))undoHistory=j.undoHistory;save();saveHistory();saveRecent();savePlans();saveToday();saveGoals();saveTicketStock();saveSnapshots();saveTasks();saveUndoHistory();renderAll();toast("バックアップを読み込みました")}catch{alert("正しいバックアップファイルではありません")}};r.readAsText(f);
};
$("#mergeMasterButton").onclick=()=>{tsums=mergeMaster(tsums);save();renderAll();toast("収録ツムを再統合しました")};
$("#resetButton").onclick=()=>{if(confirm("所持数・画像・メモなどをすべて初期化しますか？")){tsums=master();history=[];recent=[];plans=[];goals=[];snapshots=[];dailyTasks=[];undoHistory=[];ticketStock=0;todayTrainingId="";undoState=null;save();saveHistory();saveRecent();savePlans();saveGoals();saveTicketStock();saveSnapshots();saveTasks();saveUndoHistory();saveToday();saveUndo();renderAll();toast("初期化しました")}};


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






$("#addTaskButton").onclick=()=>openTask();
$("#cancelTaskButton").onclick=()=>$("#taskDialog").close();
$("#taskForm").onsubmit=e=>{
  e.preventDefault();
  const id=$("#taskId").value||crypto.randomUUID();
  const obj={id,title:$("#taskTitle").value.trim(),tsumName:$("#taskTsumName").value.trim(),target:Number($("#taskTarget").value)||0,done:dailyTasks.find(t=>t.id===id)?.done||false};
  const i=dailyTasks.findIndex(t=>t.id===id);if(i>=0)dailyTasks[i]=obj;else dailyTasks.push(obj);
  saveTasks();$("#taskDialog").close();renderDailyTasks();renderMonthlyReport();toast("タスクを保存しました");
};
$("#deleteTaskButton").onclick=()=>{const id=$("#taskId").value;if(id&&confirm("このタスクを削除しますか？")){dailyTasks=dailyTasks.filter(t=>t.id!==id);saveTasks();$("#taskDialog").close();renderDailyTasks();renderMonthlyReport()}};
$("#refreshMonthlyReportButton").onclick=()=>{renderMonthlyReport();toast("月次レポートを更新しました")};
$("#clearUndoHistoryButton").onclick=()=>{if(confirm("取り消し履歴を削除しますか？")){undoHistory=[];saveUndoHistory();renderUndoHistory()}};
$("#closeImageViewerButton").onclick=()=>$("#imageViewerDialog").close();
$("#prevImageButton").onclick=()=>{viewerIndex=Math.max(0,viewerIndex-1);renderImageViewer()};
$("#nextImageButton").onclick=()=>{viewerIndex=Math.min(imageRows().length-1,viewerIndex+1);renderImageViewer()};

document.querySelectorAll("[data-ranking-type]").forEach(b=>b.onclick=()=>{rankingType=b.dataset.rankingType;renderStrategy()});
$("#rankingOwnedOnlyButton").onclick=()=>{rankingOwnedOnly=!rankingOwnedOnly;renderStrategy()};
$("#missionSearchInput").oninput=renderMissionSearch;
const probabilityButton=$("#calculateProbabilityButton");
if(probabilityButton){
  probabilityButton.onclick=()=>{
    const total=Math.max(1,Number($("#probTsumCount")?.value)||1);
    const target=Math.max(1,Math.min(total,Number($("#probTargetCount")?.value)||1));
    const draws=Math.max(1,Number($("#probDrawCount")?.value)||1);
    const cost=Math.max(1,Number($("#probBoxCost")?.value)||30000);
    const p=target/total;
    const atLeastOne=1-Math.pow(1-p,draws);
    const expected=draws*p;
    const fifty=Math.ceil(Math.log(0.5)/Math.log(1-p));
    const ninety=Math.ceil(Math.log(0.1)/Math.log(1-p));
    const result=$("#probabilityResult");
    if(result){
      result.innerHTML=`1回あたりの当選確率：${(p*100).toFixed(2)}%<br>${draws}回で1体以上引ける確率：${(atLeastOne*100).toFixed(2)}%<br>期待獲得数：${expected.toFixed(2)}体<br>50%到達の目安：${fifty}回（${(fifty*cost).toLocaleString("ja-JP")}コイン）<br>90%到達の目安：${ninety}回（${(ninety*cost).toLocaleString("ja-JP")}コイン）`;
    }
  };
}

$("#saveSnapshotButton").onclick=createSnapshot;
$("#deleteLastSnapshotButton").onclick=()=>{
  if(!snapshots.length){toast("削除する記録がありません");return}
  snapshots.pop();saveSnapshots();renderSnapshots();toast("最新の記録を削除しました");
};
$("#clearSnapshotsButton").onclick=()=>{
  if(confirm("進捗記録をすべて削除しますか？")){snapshots=[];saveSnapshots();renderSnapshots();toast("進捗記録を削除しました")}
};
$("#calculateBudgetButton").onclick=()=>{
  const current=Math.max(0,Number($("#budgetCurrentCoins").value)||0);
  const daily=Math.max(0,Number($("#budgetDailyCoins").value)||0);
  const cost=Math.max(1,Number($("#budgetBoxCost").value)||30000);
  const targetText=$("#budgetTargetDate").value;
  if(!targetText){alert("目標日を選択してください");return}
  const target=new Date(targetText+"T23:59:59");
  const now=new Date();
  const days=Math.max(0,Math.ceil((target-now)/86400000));
  const future=current+daily*days;
  const boxes=Math.floor(future/cost);
  const remainder=future-boxes*cost;
  $("#budgetResult").innerHTML=`目標日まで：${days}日<br>予想コイン：${future.toLocaleString("ja-JP")}コイン<br>引けるBOX：${boxes.toLocaleString("ja-JP")}回<br>BOX後の残り：${remainder.toLocaleString("ja-JP")}コイン`;
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
  const obj={id,tsumName:name,type:$("#goalType").value,targetOwned:Number($("#goalTargetOwned").value)||36,deadline:$("#goalDeadline").value,milestone:Number($("#goalMilestone").value)||0,memo:$("#goalMemo").value.trim()};
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

function buildFullBackup(){
  return {
    app:"TsumManager",
    version:"6.3.4",
    schemaVersion:1,
    exportedAt:new Date().toISOString(),
    device:{
      userAgent:navigator.userAgent,
      language:navigator.language
    },
    tsums,
    history,
    recent,
    plans,
    todayTrainingId,
    goals,
    ticketStock,
    snapshots,
    dailyTasks,
    undoHistory,
    settings:{
      category,
      status,
      activeTag,
      releaseYearFilter,
      releaseMonthFilter,
      seriesFilter,
      collectionCategory,
      rankingType,
      rankingOwnedOnly,
      increment
    }
  };
}
function makeBackupFile(data,fileName){
  const json=JSON.stringify(data,null,2);
  const blob=new Blob([json],{type:"application/json;charset=utf-8"});
  let file=null;
  try{
    file=new File([blob],fileName,{type:"application/json",lastModified:Date.now()});
  }catch(e){}
  return {json,blob,file,size:blob.size,fileName};
}
async function saveBackupFile(data,fileName,preferShare=true){
  const result=makeBackupFile(data,fileName);

  // iPhone/iPadでは共有シートを開き、「ファイルに保存」を選べるようにする。
  if(preferShare&&result.file&&navigator.share&&navigator.canShare){
    try{
      if(navigator.canShare({files:[result.file]})){
        await navigator.share({
          files:[result.file],
          title:"TsumManagerバックアップ",
          text:"画像を含むTsumManagerのバックアップです。"
        });
        return {...result,method:"share"};
      }
    }catch(err){
      if(err&&err.name==="AbortError"){
        return {...result,method:"cancelled"};
      }
      console.warn("共有保存に失敗したためダウンロードへ切替",err);
    }
  }

  // PCや共有非対応ブラウザでは通常のダウンロード。
  const url=URL.createObjectURL(result.blob);
  const a=document.createElement("a");
  a.href=url;
  a.download=fileName;
  a.rel="noopener";
  a.style.display="none";
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(()=>URL.revokeObjectURL(url),10000);
  return {...result,method:"download"};
}
function backupFileName(prefix="TsumManager_Backup"){
  const d=new Date();
  const stamp=`${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,"0")}-${String(d.getDate()).padStart(2,"0")}_${String(d.getHours()).padStart(2,"0")}${String(d.getMinutes()).padStart(2,"0")}`;
  return `${prefix}_${stamp}.json`;
}
async function exportFullBackup(prefix="TsumManager_Backup",preferShare=true){
  const status=$("#backupStatus");
  const fullButton=$("#exportFullBackupButton");
  const quickButton=$("#quickBackupButton");
  const oldFull=fullButton?.textContent;
  const oldQuick=quickButton?.textContent;

  try{
    if(status)status.innerHTML="バックアップを作成しています…";
    if(fullButton)fullButton.disabled=true;
    if(quickButton)quickButton.disabled=true;

    // タップ処理をSafariへ返してから大きなJSONを生成する。
    await new Promise(resolve=>setTimeout(resolve,30));

    const data=buildFullBackup();
    const result=await saveBackupFile(data,backupFileName(prefix),preferShare);

    if(result.method==="cancelled"){
      if(status)status.innerHTML="保存をキャンセルしました。データは変更されていません。";
      return null;
    }

    const meta={
      time:new Date().toISOString(),
      size:result.size,
      images:tsums.filter(t=>t.image).length,
      version:"6.3.4",
      method:result.method
    };
    localStorage.setItem(BACKUP_META_KEY,JSON.stringify(meta));
    renderBackupSummary();

    const guide=result.method==="share"
      ?"共有画面で「ファイルに保存」を選び、iCloud Driveなどへ保存してください。"
      :"ダウンロードされたJSONファイルを「ファイル」アプリなどへ保管してください。";

    if(status){
      status.innerHTML=`バックアップを作成しました。<br>画像：${meta.images}体<br>ファイルサイズ：約${formatBytes(result.size)}<br>${guide}`;
    }
    toast("バックアップを作成しました");
    return meta;
  }catch(err){
    console.error(err);
    if(status)status.innerHTML=`バックアップに失敗しました。<br>${esc(err?.message||String(err))}`;
    alert("バックアップに失敗しました："+(err?.message||String(err)));
    return null;
  }finally{
    if(fullButton){fullButton.disabled=false;fullButton.textContent=oldFull}
    if(quickButton){quickButton.disabled=false;quickButton.textContent=oldQuick}
  }
}
function formatBytes(bytes){
  if(bytes<1024)return `${bytes} B`;
  if(bytes<1024*1024)return `${(bytes/1024).toFixed(1)} KB`;
  return `${(bytes/1024/1024).toFixed(1)} MB`;
}
function validateBackup(data){
  if(!data||data.app!=="TsumManager")throw new Error("TsumManagerのバックアップではありません");
  if(!Array.isArray(data.tsums))throw new Error("ツムデータがありません");
  if(data.tsums.length<1)throw new Error("ツムデータが空です");
  return true;
}
function restoreFullBackup(data){
  validateBackup(data);
  tsums=mergeMaster(data.tsums);
  history=Array.isArray(data.history)?data.history:[];
  recent=Array.isArray(data.recent)?data.recent:[];
  plans=Array.isArray(data.plans)?data.plans:[];
  todayTrainingId=typeof data.todayTrainingId==="string"?data.todayTrainingId:"";
  goals=Array.isArray(data.goals)?data.goals:[];
  ticketStock=Number.isFinite(data.ticketStock)?Math.max(0,data.ticketStock):0;
  snapshots=Array.isArray(data.snapshots)?data.snapshots:[];
  dailyTasks=Array.isArray(data.dailyTasks)?data.dailyTasks:[];
  undoHistory=Array.isArray(data.undoHistory)?data.undoHistory:[];
  if(data.settings){
    category=data.settings.category||"すべて";
    status=data.settings.status||"all";
    activeTag=data.settings.activeTag||"すべて";
    releaseYearFilter=data.settings.releaseYearFilter||"all";
    releaseMonthFilter=data.settings.releaseMonthFilter||"all";
    seriesFilter=data.settings.seriesFilter||"all";
    collectionCategory=data.settings.collectionCategory||"すべて";
    rankingType=data.settings.rankingType||"coin";
    rankingOwnedOnly=data.settings.rankingOwnedOnly!==false;
    increment=Number(data.settings.increment)||1;
  }
  save();saveHistory();saveRecent();savePlans();saveToday();saveGoals();saveTicketStock();saveSnapshots();saveTasks();saveUndoHistory();
  renderAll();renderSettings();
}
function renderBackupSummary(){
  const images=tsums.filter(t=>t.image).length;
  let imageBytes=0;
  for(const t of tsums)if(t.image)imageBytes+=t.image.length;
  let meta=null;
  try{meta=JSON.parse(localStorage.getItem(BACKUP_META_KEY)||"null")}catch(e){}
  $("#backupSummary").innerHTML=`<div><b>${tsums.length}</b><span>ツム数</span></div><div><b>${images}</b><span>画像登録</span></div><div><b>${goals.length}</b><span>育成目標</span></div><div><b>${formatBytes(imageBytes)}</b><span>画像容量目安</span></div>`;
  if(meta){
    $("#backupStatus").innerHTML=`最終バックアップ：${new Date(meta.time).toLocaleString("ja-JP")}<br>画像：${meta.images}体／約${formatBytes(meta.size)}`;
  }
}
function renderStorageHealth(){
  const holder=$("#storageHealth");
  if(!holder)return;
  const images=tsums.filter(t=>t.image).length;
  let approx=0;
  try{
    for(let i=0;i<localStorage.length;i++){
      const key=localStorage.key(i);
      approx+=(key?.length||0)+(localStorage.getItem(key)?.length||0);
    }
  }catch(e){}
  const lastBackup=localStorage.getItem(BACKUP_META_KEY);
  holder.innerHTML=`<div><b>ブラウザ内保存</b><span>推定使用量：約${formatBytes(approx*2)}</span></div><div><b>画像登録 ${images}体</b><span>Safariの履歴・Webサイトデータを消去すると失われる可能性があります。</span></div><div><b>${lastBackup?"バックアップ作成済み":"バックアップ未作成"}</b><span>${lastBackup?"更新前にも再作成してください。":"今すぐ完全バックアップを作成してください。"}</span></div>`;
}

function csvEscape(value){
  const text=String(value??"");
  return /[",\n]/.test(text)?`"${text.replace(/"/g,'""')}"`:text;
}

$("#exportFullBackupButton").onclick=async e=>{
  e.preventDefault();
  await exportFullBackup("TsumManager_Backup",true);
};
$("#quickBackupButton").onclick=async e=>{
  e.preventDefault();
  await exportFullBackup("TsumManager_UpdateBefore",true);
};
const backupTestButton=$("#backupTestButton");
if(backupTestButton){
  backupTestButton.onclick=()=>{
    $("#backupStatus").innerHTML="ボタンは正常に反応しています。続けて「更新前クイックバックアップ」を押してください。";
    toast("バックアップボタンは反応しています");
  };
}
const checkStorageButton=$("#checkStorageButton");
if(checkStorageButton){
  checkStorageButton.onclick=()=>{renderStorageHealth();toast("保存状態を確認しました")};
}
$("#importFullBackupInput").onchange=e=>{
  const file=e.target.files[0];if(!file)return;
  const reader=new FileReader();
  reader.onload=async ()=>{
    try{
      const data=JSON.parse(String(reader.result));
      validateBackup(data);
      const imageCount=data.tsums.filter(t=>t.image).length;
      const message=`バックアップを読み込みます。\n\nツム数：${data.tsums.length}体\n画像：${imageCount}体\n作成日時：${data.exportedAt?new Date(data.exportedAt).toLocaleString("ja-JP"):"不明"}\n\n現在のデータは置き換えられます。`;
      if(!confirm(message))return;
      if($("#autoBackupBeforeImport").checked)await exportFullBackup("TsumManager_BeforeRestore",false);
      restoreFullBackup(data);
      $("#backupStatus").innerHTML=`バックアップを復元しました。<br>ツム：${data.tsums.length}体／画像：${imageCount}体`;
      toast("バックアップを復元しました");
    }catch(err){
      alert("バックアップを読み込めませんでした："+err.message);
    }finally{
      e.target.value="";
    }
  };
  reader.readAsText(file);
};

$("#exportCsvButton").onclick=()=>{
  const header=["name","category","owned","required","favorite","priority","tags","coinRating","scoreRating","easeRating","missionTags","memo"];
  const rows=tsums.map(t=>[
    t.name,t.category,t.owned,t.required,t.favorite?1:0,t.priority,(t.tags||[]).join("|"),t.coinRating,t.scoreRating,t.easeRating,(t.missionTags||[]).join("|"),t.memo
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
        if(indexOf("coinRating")>=0)t.coinRating=Math.max(0,Math.min(5,Number(row[indexOf("coinRating")])||0));
        if(indexOf("scoreRating")>=0)t.scoreRating=Math.max(0,Math.min(5,Number(row[indexOf("scoreRating")])||0));
        if(indexOf("easeRating")>=0)t.easeRating=Math.max(0,Math.min(5,Number(row[indexOf("easeRating")])||0));
        if(indexOf("missionTags")>=0)t.missionTags=(row[indexOf("missionTags")]||"").split("|").map(x=>x.trim()).filter(Boolean);
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
