
const KEYS=["tsumManagerDataV9","tsumManagerDataV8","tsumManagerDataV7","tsumManagerDataV6","tsumManagerDataV5","tsumManagerDataV4","tsumManagerDataV3","tsumManagerDataV2","tsumManagerDataV1"];
const KEY="tsumManagerDataV9", HISTORY_KEY="tsumManagerHistoryV9", RECENT_KEY="tsumManagerRecentV9";
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
let activeView="home",category="すべて",status="all",activeTag="すべて",increment=1;
let compact=localStorage.getItem("tm-compact")==="1",gallery=localStorage.getItem("tm-gallery")==="1",editingImage="",ticketSelection="",detailId="";
function save(){localStorage.setItem(KEY,JSON.stringify(tsums))}
function saveHistory(){localStorage.setItem(HISTORY_KEY,JSON.stringify(history.slice(0,50)))}
function saveRecent(){localStorage.setItem(RECENT_KEY,JSON.stringify(recent.slice(0,20)))}
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
  if(view==="list")renderList();
  if(view==="box")renderBox();
  if(view==="training")renderTraining();
  if(view==="stats")renderStats();
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
  if(action==="plus")t.owned=Math.min(t.required,t.owned+increment);
  if(action==="minus")t.owned=Math.max(0,t.owned-increment);
  if(action==="favorite")t.favorite=!t.favorite;
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
  $("#progressRing").style.setProperty("--p",(s.percent*3.6)+"deg");
  $("#homeProgressBar").style.width=s.percent+"%";
  $("#homeOwned").textContent=s.ownedTsums;$("#homeMaxed").textContent=s.maxed;
  $("#homeRemaining").textContent=s.remaining.toLocaleString("ja-JP");
  $("#homeCoins").textContent=(s.remaining*30000).toLocaleString("ja-JP");
  const near=tsums.filter(t=>remain(t)>0&&remain(t)<=5).sort((a,b)=>remain(a)-remain(b));
  const priorities=tsums.filter(t=>t.priority>0&&remain(t)>0).sort((a,b)=>a.priority-b.priority||remain(a)-remain(b));
  const recommendations=tsums.filter(t=>t.owned>0&&remain(t)>0).sort((a,b)=>remain(a)-remain(b)||pct(b)-pct(a)).slice(0,5);
  $("#nearCount").textContent=near.length+"体";$("#unownedCount").textContent=tsums.filter(t=>t.owned===0).length+"体";
  $("#recommendList").innerHTML=recommendations.map(t=>miniHtml(t,true)).join("")||`<div class="helper">所持済みの育成候補はありません。</div>`;
  const recentTsums=recent.map(id=>tsums.find(t=>t.id===id)).filter(Boolean).slice(0,5);
  $("#recentTsumList").innerHTML=recentTsums.map(miniHtml).join("")||`<div class="helper">最近使ったツムはありません。</div>`;
  $("#homePriorityList").innerHTML=priorities.slice(0,5).map(miniHtml).join("")||`<div class="helper">育成予定は未登録です。</div>`;
  $("#homeNearList").innerHTML=near.slice(0,5).map(miniHtml).join("")||`<div class="helper">残り5体以内のツムはありません。</div>`;
  document.querySelectorAll(".mini-item button").forEach(b=>b.onclick=()=>{showView("list");$("#searchInput").value=b.dataset.name;renderList()});
}
function miniHtml(t,recommend=false){
  return `<div class="mini-item"><div class="avatar">${avatarHtml(t)}</div><div><strong>${esc(t.name)}</strong><small>${recommend?'<span class="recommend-badge">育成候補</span> ':''}残り${remain(t)} ・ ${pct(t)}%</small></div><button data-name="${esc(t.name)}">表示</button></div>`;
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
  if(activeView==="list")renderList();
  if(activeView==="training")renderTraining();
  if(activeView==="stats")renderStats();
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
function addHistory(type,detail){history.unshift({type,detail,time:new Date().toISOString()});saveHistory();renderHistory()}
function renderHistory(){
  $("#historyList").innerHTML=history.slice(0,15).map(h=>`<div class="history-item"><span>${esc(h.type)}：${esc(h.detail)}</span><span>${new Date(h.time).toLocaleString("ja-JP",{month:"numeric",day:"numeric",hour:"2-digit",minute:"2-digit"})}</span></div>`).join("")||`<div class="helper">入力履歴はありません。</div>`;
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
  let total=0;const details=[];for(const {t,count} of found){const before=t.owned;t.owned=Math.min(t.required,t.owned+count);const added=t.owned-before;if(added){total+=added;details.push(`${t.name}＋${added}`)}}
  found.forEach(({t})=>touchRecent(t.id));
  save();addHistory("BOX",details.join("、"));$("#boxText").value="";$("#boxPreview").textContent="入力内容がここに表示されます。";renderAll();toast(total+"体分を反映しました");
};
$("#ticketSearch").oninput=renderTicketCandidates;
$("#applyTicketButton").onclick=()=>{
  const t=tsums.find(x=>x.id===ticketSelection);if(!t){alert("対象ツムを選択してください");return}
  const amount=Number($("#ticketAmount").value),before=t.owned;t.owned=Math.min(t.required,t.owned+amount);const added=t.owned-before;
  touchRecent(t.id);save();addHistory("スキルチケット",`${t.name}＋${added}`);renderAll();toast(`${t.name}に${added}枚反映しました`);
};
$("#clearHistoryButton").onclick=()=>{if(confirm("入力履歴を削除しますか？")){history=[];saveHistory();renderHistory()}};
$("#trainingHelpButton").onclick=()=>openMessage("育成予定の使い方","一覧でツム名横の「•••」を押し、育成優先度を設定します。\n\n最優先 → 優先 → あとで の順に表示されます。");
$("#cancelEditButton").onclick=()=>$("#editDialog").close();
$("#closeMessageButton").onclick=()=>$("#messageDialog").close();

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
  const blob=new Blob([JSON.stringify({app:"TsumManager",version:9,exportedAt:new Date().toISOString(),tsums,history,recent},null,2)],{type:"application/json"});
  const a=document.createElement("a");a.href=URL.createObjectURL(blob);a.download=`TsumManager_backup_${new Date().toISOString().slice(0,10)}.json`;a.click();URL.revokeObjectURL(a.href);
};
$("#importInput").onchange=e=>{
  const f=e.target.files[0];if(!f)return;const r=new FileReader();
  r.onload=()=>{try{const j=JSON.parse(r.result),arr=Array.isArray(j)?j:j.tsums;if(!Array.isArray(arr))throw 0;tsums=mergeMaster(arr);if(Array.isArray(j.history))history=j.history;if(Array.isArray(j.recent))recent=j.recent;save();saveHistory();saveRecent();renderAll();toast("バックアップを読み込みました")}catch{alert("正しいバックアップファイルではありません")}};r.readAsText(f);
};
$("#mergeMasterButton").onclick=()=>{tsums=mergeMaster(tsums);save();renderAll();toast("収録ツムを再統合しました")};
$("#resetButton").onclick=()=>{if(confirm("所持数・画像・メモなどをすべて初期化しますか？")){tsums=master();history=[];recent=[];save();saveHistory();saveRecent();renderAll();toast("初期化しました")}};


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
