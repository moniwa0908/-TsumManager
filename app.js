
const KEY="tsumManagerDataV4", V3KEY="tsumManagerDataV3", V2KEY="tsumManagerDataV2", V1KEY="tsumManagerDataV1";
const $=q=>document.querySelector(q), esc=s=>String(s??"").replace(/[&<>"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;","\"":"&quot;","'":"&#39;"}[c]));
let category="すべて", status="all", increment=1, editingImage="", compact=localStorage.getItem("tm-compact")==="1";
const norm=t=>({
 id:t.id||crypto.randomUUID(), name:String(t.name||"名称未設定"), category:String(t.category||"未分類"),
 required:Math.max(1,Number(t.required||t.maxCopies||36)), owned:Math.max(0,Number(t.owned||0)),
 releaseYear:Number(t.releaseYear||t.year||0), favorite:!!t.favorite, image:String(t.image||""),
 memo:String(t.memo||t.note||""), priority:Number(t.priority||0)
});
function master(){return window.TSUM_MASTER_DATA.map(norm)}
function merge(existing){
 const map=new Map(existing.map(x=>[x.name,norm(x)]));
 for(const m of master()) if(!map.has(m.name))map.set(m.name,m);
 return [...map.values()];
}
function load(){
 for(const key of [KEY,V3KEY,V2KEY,V1KEY]){
  try{const v=JSON.parse(localStorage.getItem(key)||"null");if(Array.isArray(v)&&v.length)return merge(v)}catch(e){}
 }
 return master();
}
let tsums=load(); save();
function save(){localStorage.setItem(KEY,JSON.stringify(tsums))}
const remain=t=>Math.max(0,t.required-t.owned), pct=t=>Math.min(100,Math.round(t.owned/t.required*100));
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
function priorityText(n){return n===1?"最優先":n===2?"優先":n===3?"あとで":""}
function toast(s){const e=$("#toast");e.textContent=s;e.classList.add("show");setTimeout(()=>e.classList.remove("show"),1700)}
function renderCard(t){
 const im=t.image?`<img src="${esc(t.image)}" alt="">`:esc(t.name.slice(0,1));
 const pr=priorityText(t.priority);
 return `<article class="tsum">
  <div class="avatar">${im}</div>
  <div>
   <div class="title-row">
    <button class="star ${t.favorite?"on":""}" data-a="fav" data-id="${t.id}">★</button>
    <strong>${esc(t.name)}</strong>
    ${pr?`<span class="priority-badge">${pr}</span>`:""}
    <button class="more" data-a="edit" data-id="${t.id}">•••</button>
   </div>
   <div class="meta">${esc(t.category)} ・ ${skillText(t)} ・ 残り${remain(t)} ・ ${pct(t)}%</div>
   <div class="mini-progress"><i style="width:${pct(t)}%"></i></div>
  </div>
  <div class="counter">
   <button data-a="minus" data-id="${t.id}">−</button>
   <b class="${remain(t)===0?"maxed":""}">${t.owned}/${t.required}</b>
   <button class="plus" data-a="plus" data-id="${t.id}">＋</button>
  </div>
 </article>`;
}
function wireButtons(scope){
 scope.querySelectorAll("button[data-a]").forEach(b=>b.onclick=()=>act(b.dataset.a,b.dataset.id));
}
function render(){
 const q=$("#searchInput").value.trim().toLowerCase(), sort=$("#sortSelect").value;
 const cats=["すべて",...new Set(tsums.map(t=>t.category))];
 $("#categoryChips").innerHTML=cats.map(c=>`<button data-c="${esc(c)}" class="${c===category?"active":""}">${esc(c)}</button>`).join("");
 $("#categoryChips").querySelectorAll("button").forEach(b=>b.onclick=()=>{category=b.dataset.c;render()});
 const statuses=[["all","すべて"],["unowned","未所持"],["owned","所持済み"],["max","スキルマ"],["favorite","★お気に入り"],["priority","育成予定"]];
 $("#statusChips").innerHTML=statuses.map(([k,v])=>`<button data-s="${k}" class="${k===status?"active":""}">${v}</button>`).join("");
 $("#statusChips").querySelectorAll("button").forEach(b=>b.onclick=()=>{status=b.dataset.s;render()});

 let rows=tsums.filter(t=>{
  const st=status==="all"||(status==="unowned"&&t.owned===0)||(status==="owned"&&t.owned>0&&remain(t)>0)||(status==="max"&&remain(t)===0)||(status==="favorite"&&t.favorite)||(status==="priority"&&t.priority>0);
  return (category==="すべて"||t.category===category)&&st&&(t.name.toLowerCase().includes(q)||t.memo.toLowerCase().includes(q));
 });
 rows.sort((a,b)=>{
  if(sort==="progress")return pct(b)-pct(a)||a.name.localeCompare(b.name,"ja");
  if(sort==="remain")return remain(a)-remain(b)||a.name.localeCompare(b.name,"ja");
  if(sort==="owned")return b.owned-a.owned||a.name.localeCompare(b.name,"ja");
  if(sort==="favorite")return Number(b.favorite)-Number(a.favorite)||a.name.localeCompare(b.name,"ja");
  return a.name.localeCompare(b.name,"ja");
 });
 $("#resultCount").textContent=`${rows.length}体表示`;
 const list=$("#tsumList"); list.classList.toggle("compact",compact);
 list.innerHTML=rows.map(renderCard).join("")||`<div class="panel" style="text-align:center;color:var(--muted)">該当するツムがありません</div>`;
 wireButtons(list);

 const priorities=tsums.filter(t=>t.priority>0&&remain(t)>0).sort((a,b)=>a.priority-b.priority||remain(a)-remain(b));
 $("#priorityList").innerHTML=priorities.map(renderCard).join("")||`<div class="small">育成予定はまだ登録されていません。</div>`;
 wireButtons($("#priorityList"));

 const total=tsums.reduce((s,t)=>s+t.required,0), own=tsums.reduce((s,t)=>s+Math.min(t.owned,t.required),0), rem=tsums.reduce((s,t)=>s+remain(t),0), p=total?Math.round(own/total*100):0;
 $("#overallPercent").textContent=p+"%";$("#overallBar").style.width=p+"%";
 $("#maxCount").textContent=tsums.filter(t=>remain(t)===0).length;
 $("#ownedTsumCount").textContent=tsums.filter(t=>t.owned>0).length;
 $("#remainCount").textContent=rem.toLocaleString("ja-JP");
 $("#coinCount").textContent=(rem*30000).toLocaleString("ja-JP");
 $("#layoutMode").textContent=compact?"標準表示":"コンパクト";
 renderStats();
}
function act(a,id){
 const t=tsums.find(x=>x.id===id);if(!t)return;
 if(a==="plus")t.owned=Math.min(t.required,t.owned+increment);
 if(a==="minus")t.owned=Math.max(0,t.owned-increment);
 if(a==="fav")t.favorite=!t.favorite;
 if(a==="edit"){openEdit(t);return}
 save();render();
}
function renderStats(){
 const cats=[...new Set(tsums.map(t=>t.category))];
 $("#categoryStats").innerHTML=cats.map(c=>{
  const a=tsums.filter(t=>t.category===c),tot=a.reduce((s,t)=>s+t.required,0),own=a.reduce((s,t)=>s+Math.min(t.owned,t.required),0),p=tot?Math.round(own/tot*100):0;
  return `<div class="stat-row"><div><span>${esc(c)}</span><b>${p}%</b></div><div class="progress"><i style="width:${p}%"></i></div></div>`;
 }).join("");
 const u=tsums.filter(t=>t.owned===0).length,o=tsums.filter(t=>t.owned>0&&remain(t)>0).length,m=tsums.filter(t=>remain(t)===0).length;
 $("#statusStats").innerHTML=`<div class="stat-row"><div><span>未所持</span><b>${u}体</b></div></div><div class="stat-row"><div><span>育成中</span><b>${o}体</b></div></div><div class="stat-row"><div><span>スキルマ</span><b>${m}体</b></div></div>`;
 $("#coinStats").innerHTML=cats.map(c=>{
  const rem=tsums.filter(t=>t.category===c).reduce((s,t)=>s+remain(t),0);
  return `<div class="stat-row"><div><span>${esc(c)}</span><b>${(rem*30000).toLocaleString("ja-JP")}コイン</b></div></div>`;
 }).join("");
}
function openEdit(t=null){
 $("#dialogTitle").textContent=t?"ツムを編集":"ツムを追加";$("#editId").value=t?.id||"";
 $("#editName").value=t?.name||"";$("#editCategory").value=t?.category||"プレミアム";$("#editRequired").value=t?.required||36;
 $("#editOwned").value=t?.owned||0;$("#editPriority").value=String(t?.priority||0);$("#editMemo").value=t?.memo||"";
 editingImage=t?.image||"";preview();$("#deleteTsum").style.display=t?"":"none";$("#editDialog").showModal();
}
function preview(){$("#imagePreview").innerHTML=editingImage?`<img src="${editingImage}" alt="">`:""}
$("#editImageFile").onchange=e=>{const f=e.target.files[0];if(!f)return;const r=new FileReader();r.onload=()=>{editingImage=r.result;preview()};r.readAsDataURL(f)};
$("#editForm").onsubmit=e=>{
 e.preventDefault();const id=$("#editId").value,obj=norm({id:id||undefined,name:$("#editName").value.trim(),category:$("#editCategory").value.trim(),required:$("#editRequired").value,owned:$("#editOwned").value,image:editingImage,memo:$("#editMemo").value,priority:$("#editPriority").value});
 if(id){const i=tsums.findIndex(t=>t.id===id);tsums[i]={...tsums[i],...obj,id}}else tsums.push(obj);
 save();$("#editDialog").close();render();toast("保存しました");
};
$("#deleteTsum").onclick=()=>{const id=$("#editId").value;if(confirm("削除しますか？")){tsums=tsums.filter(t=>t.id!==id);save();$("#editDialog").close();render()}};
$("#cancelEdit").onclick=()=>$("#editDialog").close();$("#addButton").onclick=()=>openEdit();$("#searchInput").oninput=render;$("#sortSelect").onchange=render;
$("#incrementMode").onclick=()=>{increment=increment===1?5:1;$("#incrementMode").textContent=`＋${increment}モード`};
$("#layoutMode").onclick=()=>{compact=!compact;localStorage.setItem("tm-compact",compact?"1":"0");$("#compactToggle").checked=compact;render()};

document.querySelectorAll(".tabs button").forEach(b=>b.onclick=()=>{
 document.querySelectorAll(".tabs button").forEach(x=>x.classList.toggle("active",x===b));
 ["list","priority","stats","settings"].forEach(v=>$("#"+v+"View").hidden=v!==b.dataset.view);
});

function parseDraw(){
 const names=$("#drawText").value.split(/\r?\n/).map(x=>x.trim()).filter(Boolean);
 const counts=new Map();for(const n of names)counts.set(n,(counts.get(n)||0)+1);
 const found=[],missing=[];
 for(const [name,count] of counts){const t=tsums.find(x=>x.name===name);if(t)found.push({t,count});else missing.push(name)}
 return {found,missing,total:names.length};
}
function showDrawPreview(){
 const {found,missing,total}=parseDraw();
 $("#drawSummary").innerHTML=`入力 ${total}体<br>${found.map(x=>`${esc(x.t.name)} ＋${x.count}`).join("<br>")}${missing.length?`<br><span style="color:var(--danger)">未登録：${missing.map(esc).join("、")}</span>`:""}`;
}
$("#drawButton").onclick=()=>{$("#drawText").value="";$("#drawSummary").textContent="";$("#drawDialog").showModal()};
$("#previewDraw").onclick=showDrawPreview;$("#cancelDraw").onclick=()=>$("#drawDialog").close();
$("#drawForm").onsubmit=e=>{
 e.preventDefault();const {found,missing}=parseDraw();
 if(missing.length&&!confirm(`未登録の名前があります。\n${missing.join("、")}\n\n登録済みのツムだけ反映しますか？`))return;
 let added=0;for(const {t,count} of found){const before=t.owned;t.owned=Math.min(t.required,t.owned+count);added+=t.owned-before}
 save();$("#drawDialog").close();render();toast(`${added}体分を反映しました`);
};

$("#exportFile").onclick=()=>{const blob=new Blob([JSON.stringify({app:"TsumManager",version:4,exportedAt:new Date().toISOString(),tsums},null,2)],{type:"application/json"}),a=document.createElement("a");a.href=URL.createObjectURL(blob);a.download=`TsumManager_backup_${new Date().toISOString().slice(0,10)}.json`;a.click();URL.revokeObjectURL(a.href)};
$("#importFile").onchange=e=>{const f=e.target.files[0];if(!f)return;const r=new FileReader();r.onload=()=>{try{const j=JSON.parse(r.result),a=Array.isArray(j)?j:j.tsums;if(!Array.isArray(a))throw 0;tsums=merge(a);save();render();toast("読み込みました")}catch{alert("正しいバックアップファイルではありません")}};r.readAsText(f)};
$("#mergeMaster").onclick=()=>{tsums=merge(tsums);save();render();toast("収録ツムを再統合しました")};
$("#resetData").onclick=()=>{if(confirm("すべての登録内容を初期化しますか？")){tsums=master();save();render();toast("初期化しました")}};

const dark=localStorage.getItem("tm-dark")==="1";document.documentElement.classList.toggle("dark",dark);$("#darkToggle").checked=dark;
$("#darkToggle").onchange=e=>{document.documentElement.classList.toggle("dark",e.target.checked);localStorage.setItem("tm-dark",e.target.checked?"1":"0")};
$("#compactToggle").checked=compact;$("#compactToggle").onchange=e=>{compact=e.target.checked;localStorage.setItem("tm-compact",compact?"1":"0");render()};
$("#masterCount").textContent=window.TSUM_MASTER_DATA.length;
if("serviceWorker"in navigator)addEventListener("load",()=>navigator.serviceWorker.register("./service-worker.js"));
render();
