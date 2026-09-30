(function(){
"use strict";

var STORE="classroom_seating_local_v3";
var PRIVACY_NOTICE_STORE="classroom_seating_share_notice_v1";
var ORIENTATION_LAYOUT_VERSION=2;
function initialState(){return {rows:7,cols:7,desk:"bottom",orientationLayoutVersion:ORIENTATION_LAYOUT_VERSION,students:[],seats:{},closed:[],rules:[],draft:{studentId:"",cells:[]},groups:[],candidates:[]};}
var state=initialState();
var contextKey="";
function byId(id){return document.getElementById(id);}
function cellKey(r,c){return r+"-"+c;}
function newId(prefix){return prefix+"_"+Date.now().toString(36)+"_"+Math.random().toString(36).slice(2,9);}
function copy(value){return JSON.parse(JSON.stringify(value));}
function escapeHtml(value){return String(value==null?"":value).replace(/&/g,"&amp;").replace(/</g,"&lt;").replace(/>/g,"&gt;").replace(/"/g,"&quot;").replace(/'/g,"&#39;");}
function student(id){return state.students.find(function(s){return s.id===id;})||null;}
function label(id){var s=student(id);return s?s.no+" "+s.name:"已移除學生";}
function allCells(){var out=[];for(var r=1;r<=state.rows;r++){for(var c=1;c<=state.cols;c++){out.push(cellKey(r,c));}}return out;}
function isClosed(k){return state.closed.indexOf(k)!==-1;}
function availableCells(){return allCells().filter(function(k){return !isClosed(k);});}
function studentSeat(id){var keys=Object.keys(state.seats);for(var i=0;i<keys.length;i++){if(state.seats[keys[i]]===id)return keys[i];}return "";}
function posLabel(k,closedCells,totalColumns){
  var p=k.split("-"),seatDepth=parseInt(p[0],10),column=parseInt(p[1],10);
  var closed=Array.isArray(closedCells)?closedCells:state.closed;
  var cols=parseInt(totalColumns,10)||state.cols;
  var ordinal=0;
  for(var depth=1;depth<=seatDepth;depth++){
    if(closed.indexOf(cellKey(depth,column))===-1)ordinal++;
  }
  return (cols-column+1)+"-"+ordinal;
}
function positionLabels(cells,closedCells,totalColumns){
  return cells.map(function(k){return posLabel(k,closedCells,totalColumns);});
}
function mapVisual(vr,vc,rows,cols,desk){return desk==="bottom"?{r:rows-vr+1,c:cols-vc+1}:{r:vr,c:vc};}
function flipDesk(desk){return desk==="top"?"bottom":"top";}
function migrateLegacyOrientation(snapshot){
  if(!snapshot||snapshot.orientationLayoutVersion>=ORIENTATION_LAYOUT_VERSION)return snapshot;
  if(snapshot.desk==="top"||snapshot.desk==="bottom")snapshot.desk=flipDesk(snapshot.desk);
  if(Array.isArray(snapshot.candidates)){
    snapshot.candidates.forEach(function(candidate){
      if(candidate&&(candidate.desk==="top"||candidate.desk==="bottom"))candidate.desk=flipDesk(candidate.desk);
    });
  }
  snapshot.orientationLayoutVersion=ORIENTATION_LAYOUT_VERSION;
  return snapshot;
}
function save(){try{localStorage.setItem(STORE,JSON.stringify(state));}catch(e){}}
function restore(){
  try{
    var saved=JSON.parse(localStorage.getItem(STORE));
    if(saved&&saved.rows&&saved.cols){
      state=Object.assign(state,migrateLegacyOrientation(saved));
      if(!state.draft)state.draft={studentId:"",cells:[]};
      if(!state.rules)state.rules=[];
      if(!state.groups)state.groups=[];
      if(!state.candidates)state.candidates=[];
      if(!state.closed)state.closed=[];
    }
  }catch(e){}
}
function say(message,type){
  var box=byId("notice");
  box.textContent=message;
  box.className="notice "+(type||"ok");
}
function clearNotice(){byId("notice").className="notice";}
function prune(){
  var valid={};
  allCells().forEach(function(k){valid[k]=true;});
  state.closed=state.closed.filter(function(k,i,a){return valid[k]&&a.indexOf(k)===i;});
  Object.keys(state.seats).forEach(function(k){
    if(!valid[k]||isClosed(k)||!student(state.seats[k]))delete state.seats[k];
  });
  state.rules=state.rules.filter(function(r){return student(r.studentId);}).map(function(r){
    r.cells=(r.cells||[]).filter(function(k,i,a){return valid[k]&&!isClosed(k)&&a.indexOf(k)===i;});
    return r;
  });
  state.draft.cells=(state.draft.cells||[]).filter(function(k,i,a){return valid[k]&&!isClosed(k)&&a.indexOf(k)===i;});
  if(state.draft.studentId&&!student(state.draft.studentId))state.draft={studentId:"",cells:[]};
  state.groups.forEach(function(g){
    g.ids=(g.ids||[]).filter(function(id,i,a){return student(id)&&a.indexOf(id)===i;});
  });
}
function renderAll(){
  prune();
  renderGrid();
  renderRoster();
  renderRuleSelector();
  renderRules();
  renderGroups();
  renderCandidates();
  renderMeta();
  save();
}
function renderMeta(){
  byId("rows").value=state.rows;
  byId("cols").value=state.cols;
  byId("studentCount").textContent=state.students.length+" 人";
  byId("roomStats").textContent=state.students.length?state.students.length+" 位學生｜"+availableCells().length+" 個可用座位｜"+state.closed.length+" 個已關閉":"尚未匯入名單｜"+availableCells().length+" 個可用座位";
  var bottom=state.desk==="bottom";
  byId("orientation").textContent=bottom?"講台在下方｜1-1 在左下":"講台在上方｜1-1 在右上";
  byId("toggleDesk").textContent=bottom?"講台在下方（點擊切換）":"講台在上方（點擊切換）";
  byId("ruleCount").textContent=state.rules.length+" / 3";
  byId("candidateCount").textContent=state.candidates.length+" / 10";
  var active=student(state.draft.studentId);
  var draft=byId("draft");
  if(active){
    draft.innerHTML="<b>"+escapeHtml(label(active.id))+"</b>：已選 "+state.draft.cells.length+" 格"+(state.draft.cells.length?"（"+positionLabels(state.draft.cells).join("、")+"）":"。請在左側點選座位。");
  }else{
    draft.textContent="選擇學生後，在左側點選可出現的座位。選一格即固定，多格會在範圍內隨機。";
  }
}
function renderGrid(){
  var grid=byId("seatGrid");
  grid.innerHTML="";
  grid.style.gridTemplateColumns="repeat("+state.cols+", minmax(58px,86px))";
  byId("classroom").className="classroom "+(state.desk==="bottom"?"bottom":"topside");
  for(var vr=1;vr<=state.rows;vr++){
    for(var vc=1;vc<=state.cols;vc++){
      var logical=mapVisual(vr,vc,state.rows,state.cols,state.desk);
      var k=cellKey(logical.r,logical.c);
      var closed=isClosed(k);
      var id=state.seats[k];
      var s=student(id);
      var node=document.createElement("div");
      node.className="seat"+(closed?" closed":"")+(state.draft.cells.indexOf(k)!==-1?" selected":"");
      node.dataset.key=k;
      node.dataset.student=id||"";
      if(closed){
        node.innerHTML="<span class='closed-word'>此座位已關閉</span>";
      }else if(s){
        node.draggable=true;
        node.innerHTML="<span class='coord'>"+posLabel(k)+"</span><span class='seat-number'>"+escapeHtml(s.no)+"</span><span class='seat-name'>"+escapeHtml(s.name)+"</span>";
      }else{
        node.innerHTML="<span class='coord'>"+posLabel(k)+"</span><span class='empty'>空座位</span>";
      }
      node.addEventListener("click",pickRuleCell);
      node.addEventListener("contextmenu",showContext);
      node.addEventListener("dragstart",startSeatDrag);
      node.addEventListener("dragover",dragSeatOver);
      node.addEventListener("dragleave",function(e){e.currentTarget.classList.remove("over");});
      node.addEventListener("drop",dropOnSeat);
      grid.appendChild(node);
    }
  }
}
function pickRuleCell(e){
  var k=e.currentTarget.dataset.key;
  if(isClosed(k)||!state.draft.studentId)return;
  var index=state.draft.cells.indexOf(k);
  if(index===-1)state.draft.cells.push(k);
  else state.draft.cells.splice(index,1);
  renderAll();
}
function showContext(e){
  e.preventDefault();
  contextKey=e.currentTarget.dataset.key;
  byId("toggleClosed").textContent=isClosed(contextKey)?"重新開啟此座位":"關閉此座位";
  var menu=byId("context");
  menu.style.left=e.clientX+"px";
  menu.style.top=e.clientY+"px";
  menu.style.display="block";
}
function hideContext(){byId("context").style.display="none";contextKey="";}
function flipClosed(){
  if(!contextKey)return;
  if(isClosed(contextKey)){
    state.closed=state.closed.filter(function(k){return k!==contextKey;});
  }else{
    var id=state.seats[contextKey];
    if(id&&!confirm("此座位已有 "+label(id)+"。關閉後會取消該生的座位，確定嗎？")){hideContext();return;}
    delete state.seats[contextKey];
    state.closed.push(contextKey);
    state.rules.forEach(function(r){r.cells=r.cells.filter(function(k){return k!==contextKey;});});
    state.draft.cells=state.draft.cells.filter(function(k){return k!==contextKey;});
  }
  hideContext();
  renderAll();
}
function startSeatDrag(e){
  var id=e.currentTarget.dataset.student;
  if(!id){e.preventDefault();return;}
  e.dataTransfer.effectAllowed="move";
  e.dataTransfer.setData("text/plain",JSON.stringify({id:id,from:e.currentTarget.dataset.key,kind:"seat"}));
}
function dragPayload(e){
  try{return JSON.parse(e.dataTransfer.getData("text/plain"));}catch(err){return null;}
}
function dragSeatOver(e){
  if(isClosed(e.currentTarget.dataset.key))return;
  e.preventDefault();
  e.currentTarget.classList.add("over");
}
function dropOnSeat(e){
  e.preventDefault();
  var target=e.currentTarget;
  target.classList.remove("over");
  var to=target.dataset.key;
  if(isClosed(to))return;
  var payload=dragPayload(e);
  if(!payload||!student(payload.id))return;
  var from=studentSeat(payload.id);
  if(payload.kind==="roster"&&from&&from!==to){
    alert(label(payload.id)+" 已安排在 "+posLabel(from)+"；為避免重複安排，未放入新座位。");
    return;
  }
  if(from===to)return;
  var targetId=state.seats[to];
  if(from){
    if(targetId)state.seats[from]=targetId;
    else delete state.seats[from];
  }
  state.seats[to]=payload.id;
  renderAll();
}
function renderRoster(){
  var box=byId("roster");
  if(!state.students.length){
    box.innerHTML="<div class='hint'>匯入後可拖曳學生到空座位。</div>";
    return;
  }
  box.innerHTML="";
  state.students.slice().sort(function(a,b){return String(a.no).localeCompare(String(b.no),undefined,{numeric:true});}).forEach(function(s){
    var item=document.createElement("div");
    item.className="student"+(studentSeat(s.id)?" used":"");
    item.draggable=true;
    item.textContent=s.no+"｜"+s.name+(studentSeat(s.id)?"（已安排）":"");
    item.addEventListener("dragstart",function(e){
      e.dataTransfer.effectAllowed="copy";
      e.dataTransfer.setData("text/plain",JSON.stringify({id:s.id,from:"",kind:"roster"}));
    });
    box.appendChild(item);
  });
}
function renderRuleSelector(){
  var select=byId("ruleStudent");
  var old=state.draft.studentId;
  select.innerHTML="<option value=''>請先選擇學生</option>";
  state.students.slice().sort(function(a,b){return String(a.no).localeCompare(String(b.no),undefined,{numeric:true});}).forEach(function(s){
    var isSaved=state.rules.some(function(r){return r.studentId===s.id;});
    var option=document.createElement("option");
    option.value=s.id;
    option.textContent=s.no+"｜"+s.name+(isSaved?"（已有安排）":"");
    option.disabled=isSaved;
    select.appendChild(option);
  });
  select.value=old||"";
}
function renderRules(){
  var box=byId("rules");
  box.innerHTML="";
  if(!state.rules.length){
    box.innerHTML="<div class='hint'>尚未儲存特定安排（最多 3 組）。</div>";
    return;
  }
  state.rules.forEach(function(rule,index){
    var wrap=document.createElement("div");
    wrap.className="rule";
    wrap.innerHTML="<div><b>"+escapeHtml(label(rule.studentId))+"</b><div class='rule-detail'>可出現："+(rule.cells.length?positionLabels(rule.cells).join("、"):"沒有可用座位")+"</div></div><button class='remove' title='取消此安排'>×</button>";
    wrap.querySelector("button").addEventListener("click",function(){state.rules.splice(index,1);renderAll();});
    box.appendChild(wrap);
  });
}
function addGroup(){
  state.groups.push({id:newId("group"),name:"群組 "+(state.groups.length+1),ids:[]});
  renderAll();
}
function renderGroups(){
  var box=byId("groups");
  box.innerHTML="";
  if(!state.groups.length){
    box.innerHTML="<div class='hint'>尚未建立群組。</div>";
    return;
  }
  state.groups.forEach(function(group,index){
    var wrap=document.createElement("div");
    wrap.innerHTML="<div class='group-head'><span>"+escapeHtml(group.name)+"（"+group.ids.length+" 人）</span><button class='remove'>×</button></div><div class='group-drop'></div>";
    wrap.querySelector(".remove").addEventListener("click",function(){state.groups.splice(index,1);renderAll();});
    var drop=wrap.querySelector(".group-drop");
    drop.addEventListener("dragover",function(e){e.preventDefault();drop.classList.add("over");});
    drop.addEventListener("dragleave",function(){drop.classList.remove("over");});
    drop.addEventListener("drop",function(e){
      e.preventDefault();
      drop.classList.remove("over");
      var payload=dragPayload(e);
      if(payload&&student(payload.id)&&group.ids.indexOf(payload.id)===-1)group.ids.push(payload.id);
      renderAll();
    });
    if(!group.ids.length){
      drop.innerHTML="<span class='hint'>拖曳學生到這裡</span>";
    }else{
      group.ids.forEach(function(id,i){
        var chip=document.createElement("span");
        chip.className="chip";
        chip.textContent=label(id);
        var remove=document.createElement("button");
        remove.textContent="×";
        remove.addEventListener("click",function(){group.ids.splice(i,1);renderAll();});
        chip.appendChild(remove);
        drop.appendChild(chip);
      });
    }
    box.appendChild(wrap);
  });
}
function shuffle(items){
  var out=items.slice();
  for(var i=out.length-1;i>0;i--){
    var j=Math.floor(Math.random()*(i+1)),temp=out[i];
    out[i]=out[j];out[j]=temp;
  }
  return out;
}
function makeRandomMap(){
  var open=availableCells();
  if(state.students.length>open.length)throw new Error("可用座位只有 "+open.length+" 個，但名單有 "+state.students.length+" 人。請增加座位或重新開啟部分座位。");
  var result={},occupied={},lockedIds=[];
  var rules=shuffle(state.rules);
  for(var i=0;i<rules.length;i++){
    var rule=rules[i];
    var choices=shuffle(rule.cells.filter(function(k){return open.indexOf(k)!==-1&&!occupied[k];}));
    if(!choices.length)throw new Error(label(rule.studentId)+" 的指定範圍沒有可用座位。請修改特定安排。");
    result[choices[0]]=rule.studentId;
    occupied[choices[0]]=true;
    lockedIds.push(rule.studentId);
  }
  var rest=shuffle(state.students.filter(function(s){return lockedIds.indexOf(s.id)===-1;}));
  var free=shuffle(open.filter(function(k){return !occupied[k];}));
  rest.forEach(function(s,i){result[free[i]]=s.id;});
  return result;
}
function spreadScore(seats){
  var points={};
  Object.keys(seats).forEach(function(k){points[seats[k]]=k.split("-").map(Number);});
  var score=0;
  state.groups.forEach(function(group){
    for(var i=0;i<group.ids.length;i++){
      for(var j=i+1;j<group.ids.length;j++){
        var a=points[group.ids[i]],b=points[group.ids[j]];
        if(a&&b){
          var distance=Math.abs(a[0]-b[0])+Math.abs(a[1]-b[1]);
          if(distance===1)score+=16;
          else if(distance===2)score+=5;
          else if(distance===3)score+=1;
        }
      }
    }
  });
  return score;
}
function randomize(showError){
  if(!state.students.length){
    if(showError)alert("請先匯入班級名單。");
    return false;
  }
  try{
    var best=null,bestScore=Infinity;
    for(var i=0;i<100;i++){
      var candidate=makeRandomMap();
      var score=spreadScore(candidate);
      if(score<bestScore){
        best=candidate;bestScore=score;
        if(score===0)break;
      }
    }
    state.seats=best;
    renderAll();
    return true;
  }catch(err){
    if(showError)alert(err.message);
    return false;
  }
}
function addCandidate(){
  if(!state.students.length){alert("請先匯入名單。");return;}
  state.candidates.push({id:newId("candidate"),rows:state.rows,cols:state.cols,desk:state.desk,seats:copy(state.seats),closed:copy(state.closed),created:new Date().toLocaleString("zh-TW")});
  while(state.candidates.length>10)state.candidates.shift();
  renderAll();
}
function createFive(){
  if(!state.students.length){alert("請先匯入名單。");return;}
  var made=0;
  for(var i=0;i<5;i++){
    if(randomize(false)){addCandidate();made++;}
  }
  if(!made)alert("無法產生候選，請檢查座位數與特定安排。");
}
function miniHtml(c){
  var html="";
  var closedCells=c.closed||[];
  for(var vr=1;vr<=c.rows;vr++){
    for(var vc=1;vc<=c.cols;vc++){
      var p=mapVisual(vr,vc,c.rows,c.cols,c.desk);
      var k=cellKey(p.r,p.c),id=c.seats[k],s=student(id);
      html+="<div class='mini-seat"+(closedCells.indexOf(k)!==-1?" closed":"")+"'>"+(s?escapeHtml(s.no+" "+s.name):(closedCells.indexOf(k)!==-1?"關閉":""))+"</div>";
    }
  }
  return html;
}
function renderCandidates(){
  var box=byId("candidateGrid");
  box.innerHTML="";
  if(!state.candidates.length){
    box.innerHTML="<div class='empty-candidates'>按「加入候選」或「產生 5 張」，座位表會出現在這裡。</div>";
    return;
  }
  state.candidates.forEach(function(c,index){
    var item=document.createElement("div");
    item.className="candidate";
    item.innerHTML="<div class='candidate-top'><label><input class='print-check' type='checkbox' checked> 候選 "+(index+1)+"</label><button class='remove delete' title='刪除'>×</button></div>"+(c.desk==="top"?"<div class='mini-desk'></div>":"")+"<div class='candidate-mini' style='grid-template-columns:repeat("+c.cols+",1fr)'>"+miniHtml(c)+"</div>"+(c.desk==="bottom"?"<div class='mini-desk'></div>":"")+"<div class='hint'>"+escapeHtml(c.created)+"</div>";
    item.addEventListener("click",function(e){
      if(e.target.closest("button")||e.target.closest("label"))return;
      if(confirm("載入候選 "+(index+1)+" 的座位表？")){
        state.rows=c.rows;state.cols=c.cols;state.desk=c.desk;state.seats=copy(c.seats);state.closed=copy(c.closed);
        renderAll();
      }
    });
    item.querySelector(".delete").addEventListener("click",function(){state.candidates.splice(index,1);renderAll();});
    box.appendChild(item);
  });
}
function printChosen(){
  var chosen=[];
  document.querySelectorAll(".candidate").forEach(function(item,index){if(item.querySelector(".print-check").checked)chosen.push(state.candidates[index]);});
  if(!chosen.length){alert("請至少勾選一張候選座位表。");return;}
  var pages=chosen.map(function(c,index){
    return "<section><h2>高校座位表達人 "+(index+1)+"</h2>"+(c.desk==="top"?"<div class='desk'>講台</div>":"")+"<div class='grid' style='grid-template-columns:repeat("+c.cols+",1fr)'>"+miniHtml(c)+"</div>"+(c.desk==="bottom"?"<div class='desk'>講台</div>":"")+"</section>";
  }).join("");
  var w=window.open("","_blank");
  if(!w){alert("瀏覽器阻擋了列印視窗，請允許彈出視窗後再試。");return;}
  w.document.write("<!doctype html><html><head><meta charset='utf-8'><title>列印座位表</title><style>body{font-family:Arial,'Microsoft JhengHei',sans-serif;margin:18px}.sheet{display:grid;grid-template-columns:repeat(2,1fr);gap:14px}section{border:1px solid #aaa;padding:10px;break-inside:avoid}h2{text-align:center;font-size:16px}.grid{display:grid;gap:3px}.mini-seat{height:34px;border:1px solid #777;font-size:10px;line-height:33px;text-align:center;white-space:nowrap;overflow:hidden}.closed{background:#ddd}.desk{text-align:center;border:2px solid #b77d24;background:#ffe2ad;padding:7px;margin:7px 0;font-weight:bold}@media print{body{margin:0}}</style></head><body><div class='sheet'>"+pages+"</div><script>window.onload=function(){window.print();};<\/script></body></html>");
  w.document.close();
}
function selectedCandidateEntries(){
  var chosen=[];
  document.querySelectorAll(".candidate").forEach(function(item,index){
    var check=item.querySelector(".print-check");
    if(check&&check.checked&&state.candidates[index])chosen.push({candidate:state.candidates[index],number:index+1});
  });
  return chosen;
}
function twoDigits(value){return String(value).padStart(2,"0");}
function exportDate(){
  var now=new Date();
  return now.getFullYear()+"."+twoDigits(now.getMonth()+1)+"."+twoDigits(now.getDate());
}
function pngFilename(number){return exportDate()+" 高校座位表達人 "+number+".png";}
function pngArchiveFilename(){return exportDate()+" 高校座位表達人 PNG.zip";}
function roundedCanvasPath(ctx,x,y,width,height,radius){
  var r=Math.min(radius,width/2,height/2);
  ctx.beginPath();
  ctx.moveTo(x+r,y);
  ctx.arcTo(x+width,y,x+width,y+height,r);
  ctx.arcTo(x+width,y+height,x,y+height,r);
  ctx.arcTo(x,y+height,x,y,r);
  ctx.arcTo(x,y,x+width,y,r);
  ctx.closePath();
}
function roundedCanvasRect(ctx,x,y,width,height,radius,fill,stroke){
  roundedCanvasPath(ctx,x,y,width,height,radius);
  if(fill){ctx.fillStyle=fill;ctx.fill();}
  if(stroke){ctx.strokeStyle=stroke;ctx.stroke();}
}
function canvasText(ctx,text,maxWidth){
  var value=String(text);
  if(ctx.measureText(value).width<=maxWidth)return value;
  while(value.length&&ctx.measureText(value+"…").width>maxWidth)value=value.slice(0,-1);
  return value+"…";
}
function drawPngCandidate(candidate,number){
  var rows=candidate.rows,cols=candidate.cols;
  var cellWidth=126,cellHeight=82,gap=10,margin=38,headerHeight=88,deskHeight=54,deskGap=18;
  var gridWidth=cols*cellWidth+(cols-1)*gap;
  var gridHeight=rows*cellHeight+(rows-1)*gap;
  var width=gridWidth+margin*2;
  var height=headerHeight+deskHeight+deskGap+gridHeight+margin;
  var scale=2;
  var canvas=document.createElement("canvas");
  canvas.width=width*scale;
  canvas.height=height*scale;
  var ctx=canvas.getContext("2d");
  ctx.scale(scale,scale);
  ctx.fillStyle="#ffffff";
  ctx.fillRect(0,0,width,height);
  ctx.fillStyle="#19243a";
  ctx.font="700 28px 'Microsoft JhengHei','Noto Sans TC',sans-serif";
  ctx.textAlign="left";
  ctx.textBaseline="middle";
  ctx.fillText(exportDate()+" 高校座位表達人 "+number,margin,34);
  ctx.fillStyle="#66758c";
  ctx.font="16px 'Microsoft JhengHei','Noto Sans TC',sans-serif";
  ctx.fillText(candidate.desk==="top"?"講台在上方｜1-1 在右上":"講台在下方｜1-1 在左下",margin,62);
  var gridY=candidate.desk==="top"?headerHeight+deskHeight+deskGap:headerHeight;
  var deskY=candidate.desk==="top"?headerHeight:gridY+gridHeight+deskGap;
  roundedCanvasRect(ctx,margin,deskY,gridWidth,deskHeight,10,"#ffe5b9","#bd7a19");
  ctx.fillStyle="#70460f";
  ctx.font="700 20px 'Microsoft JhengHei','Noto Sans TC',sans-serif";
  ctx.textAlign="center";
  ctx.fillText("講台",margin+gridWidth/2,deskY+deskHeight/2);
  var closedCells=candidate.closed||[];
  for(var vr=1;vr<=rows;vr++){
    for(var vc=1;vc<=cols;vc++){
      var logical=mapVisual(vr,vc,rows,cols,candidate.desk);
      var k=cellKey(logical.r,logical.c);
      var x=margin+(vc-1)*(cellWidth+gap);
      var y=gridY+(vr-1)*(cellHeight+gap);
      var closed=closedCells.indexOf(k)!==-1;
      var id=candidate.seats[k],s=student(id);
      roundedCanvasRect(ctx,x,y,cellWidth,cellHeight,9,closed?"#e8edf2":"#ffffff",closed?"#b7c3d1":"#9eafc5");
      if(closed){
        ctx.save();
        roundedCanvasPath(ctx,x+1,y+1,cellWidth-2,cellHeight-2,8);
        ctx.clip();
        ctx.strokeStyle="#c4ceda";
        ctx.lineWidth=2;
        for(var d=-cellHeight;d<cellWidth;d+=16){
          ctx.beginPath();
          ctx.moveTo(x+d,y+cellHeight);
          ctx.lineTo(x+d+cellHeight,y);
          ctx.stroke();
        }
        ctx.restore();
      }
      if(!closed){
        ctx.fillStyle="#738299";
        ctx.font="12px 'Microsoft JhengHei','Noto Sans TC',sans-serif";
        ctx.textAlign="left";
        ctx.textBaseline="top";
        ctx.fillText(posLabel(k,closedCells,cols),x+8,y+7);
      }
      ctx.textAlign="center";
      ctx.textBaseline="middle";
      if(closed){
        ctx.fillStyle="#687587";
        ctx.font="700 14px 'Microsoft JhengHei','Noto Sans TC',sans-serif";
        ctx.fillText("此座位已關閉",x+cellWidth/2,y+cellHeight/2+9);
      }else if(s){
        ctx.fillStyle="#4f72a8";
        ctx.font="14px 'Microsoft JhengHei','Noto Sans TC',sans-serif";
        ctx.fillText(canvasText(ctx,s.no,cellWidth-16),x+cellWidth/2,y+37);
        ctx.fillStyle="#19243a";
        ctx.font="700 20px 'Microsoft JhengHei','Noto Sans TC',sans-serif";
        ctx.fillText(canvasText(ctx,s.name,cellWidth-16),x+cellWidth/2,y+61);
      }else{
        ctx.fillStyle="#9aa6b7";
        ctx.font="14px 'Microsoft JhengHei','Noto Sans TC',sans-serif";
        ctx.fillText("空座位",x+cellWidth/2,y+cellHeight/2+8);
      }
    }
  }
  return canvas;
}
function canvasPngBlob(canvas){
  return new Promise(function(resolve,reject){
    canvas.toBlob(function(blob){
      if(blob)resolve(blob);
      else reject(new Error("PNG 轉檔失敗。"));
    },"image/png");
  });
}
function directDownload(blob,filename){
  var link=document.createElement("a");
  var url=URL.createObjectURL(blob);
  link.href=url;
  link.download=filename;
  document.body.appendChild(link);
  link.click();
  setTimeout(function(){link.remove();URL.revokeObjectURL(url);},30000);
}
function pngExportFiles(entries){
  return (async function(){
    var files=[];
    for(var i=0;i<entries.length;i++){
      var entry=entries[i];
      var canvas=drawPngCandidate(entry.candidate,entry.number);
      files.push({filename:pngFilename(entry.number),blob:await canvasPngBlob(canvas)});
      canvas.width=1;canvas.height=1;
    }
    return files;
  })();
}
function zipUint16(bytes,offset,value){bytes[offset]=value&255;bytes[offset+1]=(value>>>8)&255;}
function zipUint32(bytes,offset,value){bytes[offset]=value&255;bytes[offset+1]=(value>>>8)&255;bytes[offset+2]=(value>>>16)&255;bytes[offset+3]=(value>>>24)&255;}
function zipCrc32(bytes){
  var crc=0xffffffff;
  for(var i=0;i<bytes.length;i++){
    crc^=bytes[i];
    for(var bit=0;bit<8;bit++)crc=(crc>>>1)^((crc&1)?0xedb88320:0);
  }
  return (crc^0xffffffff)>>>0;
}
function zipDosTime(date){
  var year=Math.max(1980,date.getFullYear());
  return {time:(date.getSeconds()>>1)|(date.getMinutes()<<5)|(date.getHours()<<11),date:date.getDate()|((date.getMonth()+1)<<5)|((year-1980)<<9)};
}
async function pngArchiveBlob(entries){
  var files=await pngExportFiles(entries);
  var encoder=new TextEncoder();
  var timestamp=zipDosTime(new Date());
  var localParts=[],centralParts=[],offset=0,centralSize=0;
  for(var i=0;i<files.length;i++){
    var name=encoder.encode(files[i].filename);
    var data=new Uint8Array(await files[i].blob.arrayBuffer());
    var crc=zipCrc32(data);
    var local=new Uint8Array(30);
    zipUint32(local,0,0x04034b50);zipUint16(local,4,20);zipUint16(local,6,0x0800);zipUint16(local,8,0);
    zipUint16(local,10,timestamp.time);zipUint16(local,12,timestamp.date);zipUint32(local,14,crc);
    zipUint32(local,18,data.length);zipUint32(local,22,data.length);zipUint16(local,26,name.length);zipUint16(local,28,0);
    localParts.push(local,name,data);
    var central=new Uint8Array(46);
    zipUint32(central,0,0x02014b50);zipUint16(central,4,20);zipUint16(central,6,20);zipUint16(central,8,0x0800);zipUint16(central,10,0);
    zipUint16(central,12,timestamp.time);zipUint16(central,14,timestamp.date);zipUint32(central,16,crc);
    zipUint32(central,20,data.length);zipUint32(central,24,data.length);zipUint16(central,28,name.length);zipUint16(central,30,0);zipUint16(central,32,0);
    zipUint16(central,34,0);zipUint16(central,36,0);zipUint32(central,38,0);zipUint32(central,42,offset);
    centralParts.push(central,name);
    offset+=local.length+name.length+data.length;
    centralSize+=central.length+name.length;
  }
  var end=new Uint8Array(22);
  zipUint32(end,0,0x06054b50);zipUint16(end,4,0);zipUint16(end,6,0);zipUint16(end,8,files.length);zipUint16(end,10,files.length);
  zipUint32(end,12,centralSize);zipUint32(end,16,offset);zipUint16(end,20,0);
  return new Blob(localParts.concat(centralParts,[end]),{type:"application/zip"});
}
var pngExportBusy=false;
function setPngExportBusy(busy){
  var button=byId("savePng");
  if(!button)return;
  button.disabled=busy;
  button.textContent=busy?"正在產生 PNG…":"另存 PNG（勾選項目）";
}
async function savePngFiles(){
  if(pngExportBusy)return;
  var entries=selectedCandidateEntries();
  if(!entries.length){alert("請至少勾選一張候選座位表。");return;}
  pngExportBusy=true;
  setPngExportBusy(true);
  try{
    if(entries.length===1){
      var one=entries[0];
      if(typeof window.showSaveFilePicker==="function"){
        var fileHandle=await window.showSaveFilePicker({
          suggestedName:pngFilename(one.number),
          types:[{description:"PNG 圖片",accept:{"image/png":[".png"]}}]
        });
        var oneBlob=await canvasPngBlob(drawPngCandidate(one.candidate,one.number));
        var writable=await fileHandle.createWritable();
        await writable.write(oneBlob);
        await writable.close();
      }else{
        var fallbackOneBlob=await canvasPngBlob(drawPngCandidate(one.candidate,one.number));
        directDownload(fallbackOneBlob,pngFilename(one.number));
      }
      alert("已另存 PNG："+pngFilename(one.number));
      return;
    }
    if(typeof window.showDirectoryPicker==="function"){
      var folderHandle=await window.showDirectoryPicker({mode:"readwrite"});
      var pngFiles=await pngExportFiles(entries);
      for(var i=0;i<pngFiles.length;i++){
        var childHandle=await folderHandle.getFileHandle(pngFiles[i].filename,{create:true});
        var childWritable=await childHandle.createWritable();
        await childWritable.write(pngFiles[i].blob);
        await childWritable.close();
      }
      alert("已將 "+pngFiles.length+" 張 PNG 儲存到所選資料夾。");
      return;
    }
    if(typeof window.showSaveFilePicker==="function"){
      var archiveHandle=await window.showSaveFilePicker({
        suggestedName:pngArchiveFilename(),
        types:[{description:"ZIP 壓縮檔（內含 PNG）",accept:{"application/zip":[".zip"]}}]
      });
      var archive=await pngArchiveBlob(entries);
      var archiveWritable=await archiveHandle.createWritable();
      await archiveWritable.write(archive);
      await archiveWritable.close();
    }else{
      var fallbackArchive=await pngArchiveBlob(entries);
      directDownload(fallbackArchive,pngArchiveFilename());
    }
    alert("此瀏覽器無法一次直接寫入多張 PNG，已改為下載一個 ZIP 壓縮檔；解壓縮後即可取得 "+entries.length+" 張 PNG。");
  }catch(error){
    if(!error||error.name!=="AbortError")alert("另存 PNG 失敗："+(error&&error.message?error.message:"請再試一次。"));
  }finally{
    pngExportBusy=false;
    setPngExportBusy(false);
  }
}
function normal(value){return String(value==null?"":value).replace(/^\uFEFF/,"").trim().toLowerCase().replace(/[\s_－-]/g,"");}
function separator(text){
  var lines=text.split(/\r?\n/).filter(function(line){return line.trim();}).slice(0,8);
  var choices=["\t",",",";","，"],best=",",bestScore=-1;
  choices.forEach(function(mark){
    var n=0;
    lines.forEach(function(line){n+=line.split(mark).length-1;});
    if(n>bestScore){best=mark;bestScore=n;}
  });
  return best;
}
function parseCsv(text,mark){
  var rows=[],row=[],field="",quote=false;
  for(var i=0;i<text.length;i++){
    var ch=text[i],next=text[i+1];
    if(ch==='"'){
      if(quote&&next==='"'){field+='"';i++;}
      else quote=!quote;
    }else if(ch===mark&&!quote){
      row.push(field.trim());field="";
    }else if((ch==="\n"||ch==="\r")&&!quote){
      if(ch==="\r"&&next==="\n")i++;
      row.push(field.trim());
      if(row.some(function(v){return v!=="";}))rows.push(row.slice());
      row.length=0;field="";
    }else field+=ch;
  }
  row.push(field.trim());
  if(row.some(function(v){return v!=="";}))rows.push(row);
  return rows;
}
function applyImport(rows,fileName){
  if(!rows.length)throw new Error("檔案沒有可讀取的資料。");
  var noNames=["座號","座号","no","number","seatno","studentno","學號","学号"];
  var nameNames=["姓名","名字","name","studentname","學生姓名","学生姓名"];
  var headers=rows[0].map(normal);
  var noCol=-1,nameCol=-1;
  headers.forEach(function(h,i){if(noNames.indexOf(h)!==-1)noCol=i;if(nameNames.indexOf(h)!==-1)nameCol=i;});
  var start=1;
  if(noCol===-1&&nameCol===-1){noCol=0;nameCol=1;start=0;}
  else if(noCol===-1||nameCol===-1)throw new Error("找不到「座號」與「姓名」兩欄。偵測到的欄名："+rows[0].join("、")+"。請下載範本後貼上資料。");
  var list=[],seen={},issues=[];
  for(var r=start;r<rows.length;r++){
    var no=String(rows[r][noCol]||"").replace(/^\uFEFF/,"").trim();
    var name=String(rows[r][nameCol]||"").trim();
    if(!no&&!name)continue;
    if(!no||!name){issues.push("第 "+(r+1)+" 列資料不完整");continue;}
    var signature=normal(no)+"|"+normal(name);
    if(seen[signature]){issues.push("第 "+(r+1)+" 列重複");continue;}
    seen[signature]=true;
    list.push({id:newId("student"),no:no,name:name});
  }
  if(!list.length)throw new Error("沒有找到有效的座號、姓名資料。請確認兩欄都已填寫。");
  state.students=list;
  state.seats={};
  state.rules=[];
  state.draft={studentId:"",cells:[]};
  state.groups=[];
  state.candidates=[];
  renderAll();
  say("已成功匯入 "+list.length+" 位學生："+fileName+(issues.length?"；略過 "+issues.length+" 列不完整或重複資料。":"。"),issues.length?"err":"ok");
}
function decode(buffer){
  var bytes=new Uint8Array(buffer);
  var text=new TextDecoder("utf-8",{fatal:false}).decode(bytes);
  if(text.indexOf("\ufffd")!==-1){
    try{
      var big5=new TextDecoder("big5",{fatal:false}).decode(bytes);
      if(big5.indexOf("\ufffd")===-1)text=big5;
    }catch(e){}
  }
  return text;
}
function zipIndex(buffer){
  var bytes=new Uint8Array(buffer);
  var view=new DataView(buffer);
  var end=-1;
  var min=Math.max(0,bytes.length-65557);
  for(var cursor=bytes.length-22;cursor>=min;cursor--){
    if(view.getUint32(cursor,true)===0x06054b50){end=cursor;break;}
  }
  if(end===-1)throw new Error("這不是可讀取的 xlsx 檔。");
  var total=view.getUint16(end+10,true);
  var position=view.getUint32(end+16,true);
  var entries={};
  for(var i=0;i<total;i++){
    if(view.getUint32(position,true)!==0x02014b50)throw new Error("xlsx 壓縮結構無法讀取。");
    var method=view.getUint16(position+10,true);
    var compressedSize=view.getUint32(position+20,true);
    var nameLength=view.getUint16(position+28,true);
    var extraLength=view.getUint16(position+30,true);
    var commentLength=view.getUint16(position+32,true);
    var localOffset=view.getUint32(position+42,true);
    var name=new TextDecoder("utf-8").decode(bytes.slice(position+46,position+46+nameLength));
    entries[name]={method:method,compressedSize:compressedSize,localOffset:localOffset};
    position+=46+nameLength+extraLength+commentLength;
  }
  return {buffer:buffer,view:view,entries:entries};
}
async function zipEntryBuffer(zip,name){
  var entry=zip.entries[name];
  if(!entry)throw new Error("xlsx 缺少必要工作表資料。");
  var view=zip.view;
  var start=entry.localOffset;
  if(view.getUint32(start,true)!==0x04034b50)throw new Error("xlsx 檔案內容無法讀取。");
  var nameLength=view.getUint16(start+26,true);
  var extraLength=view.getUint16(start+28,true);
  var dataStart=start+30+nameLength+extraLength;
  var data=new Uint8Array(zip.buffer,dataStart,entry.compressedSize);
  if(entry.method===0)return data.slice().buffer;
  if(entry.method===8){
    if(typeof DecompressionStream==="undefined")throw new Error("此瀏覽器不支援離線 xlsx 讀取。請改存 UTF-8 CSV 後匯入。");
    var stream=new Blob([data]).stream().pipeThrough(new DecompressionStream("deflate-raw"));
    return new Response(stream).arrayBuffer();
  }
  throw new Error("此 xlsx 壓縮格式不受支援。請改存 UTF-8 CSV 後匯入。");
}
async function zipEntryText(zip,name){
  return new TextDecoder("utf-8").decode(await zipEntryBuffer(zip,name));
}
function xmlDoc(text){
  var documentXml=new DOMParser().parseFromString(text,"application/xml");
  if(documentXml.getElementsByTagName("parsererror").length)throw new Error("xlsx 內的工作表格式無法讀取。");
  return documentXml;
}
function zipPath(base,target){
  if(String(target).charAt(0)==="/")return String(target).replace(/^\/+/,"");
  var parts=[];
  (base+"/"+target).replace(/\\/g,"/").split("/").forEach(function(part){
    if(!part||part===".")return;
    if(part==="..")parts.pop();
    else parts.push(part);
  });
  return parts.join("/");
}
function firstSheetPath(zip,workbook,references){
  var sheets=workbook.getElementsByTagName("sheet");
  var relationId=sheets.length?(sheets[0].getAttribute("r:id")||sheets[0].getAttributeNS("http://schemas.openxmlformats.org/officeDocument/2006/relationships","id")):"";
  var relations=references.getElementsByTagName("Relationship");
  for(var i=0;i<relations.length;i++){
    if(relations[i].getAttribute("Id")===relationId){
      var target=relations[i].getAttribute("Target");
      var path=zipPath("xl",target);
      if(zip.entries[path])return path;
    }
  }
  var paths=Object.keys(zip.entries).filter(function(name){return name.indexOf("xl/worksheets/")===0&&/\.xml$/i.test(name);}).sort();
  if(paths.length)return paths[0];
  throw new Error("xlsx 找不到工作表。");
}
function xlsxSharedStrings(xml){
  var strings=[];
  var nodes=xml.getElementsByTagName("si");
  for(var i=0;i<nodes.length;i++)strings.push(nodes[i].textContent||"");
  return strings;
}
function xlsxColumn(reference){
  var letters=(reference.match(/[A-Za-z]+/)||[""])[0].toUpperCase();
  var value=0;
  for(var i=0;i<letters.length;i++)value=value*26+letters.charCodeAt(i)-64;
  return value-1;
}
function xlsxRows(xml,shared){
  var cells=xml.getElementsByTagName("c");
  var rows=[];
  for(var i=0;i<cells.length;i++){
    var cell=cells[i];
    var reference=cell.getAttribute("r")||"";
    var rowMatch=reference.match(/\d+/);
    if(!rowMatch)continue;
    var rowIndex=parseInt(rowMatch[0],10)-1;
    var columnIndex=xlsxColumn(reference);
    if(columnIndex<0)continue;
    var type=cell.getAttribute("t")||"";
    var valueNode=cell.getElementsByTagName("v")[0];
    var value=valueNode?valueNode.textContent:"";
    if(type==="s")value=shared[parseInt(value,10)]||"";
    else if(type==="inlineStr"){
      var inline=cell.getElementsByTagName("is")[0];
      value=inline?inline.textContent:"";
    }else if(type==="b")value=value==="1"?"TRUE":"FALSE";
    if(!rows[rowIndex])rows[rowIndex]=[];
    rows[rowIndex][columnIndex]=value;
  }
  var normalized=[];
  for(var rowIndex=0;rowIndex<rows.length;rowIndex++)normalized.push(rows[rowIndex]||[]);
  return normalized;
}
async function readXlsxLocally(buffer){
  var zip=zipIndex(buffer);
  var shared=[];
  if(zip.entries["xl/sharedStrings.xml"])shared=xlsxSharedStrings(xmlDoc(await zipEntryText(zip,"xl/sharedStrings.xml")));
  var workbook=xmlDoc(await zipEntryText(zip,"xl/workbook.xml"));
  var references=xmlDoc(await zipEntryText(zip,"xl/_rels/workbook.xml.rels"));
  var sheetPath=firstSheetPath(zip,workbook,references);
  return xlsxRows(xmlDoc(await zipEntryText(zip,sheetPath)),shared);
}
function importFile(file){
  clearNotice();
  var ext=(file.name.split(".").pop()||"").toLowerCase();
  if(ext==="xlsx"){
    file.arrayBuffer().then(readXlsxLocally).then(function(rows){
      applyImport(rows,file.name);
    }).catch(function(err){say(err.message||"xlsx 讀取失敗。","err");});
    return;
  }
  if(ext==="xls"){
    say("分享版不連網讀取舊式 .xls。請先用 Excel 另存為 .xlsx 或 UTF-8 CSV。","err");
    return;
  }
  file.arrayBuffer().then(function(buffer){
    var text=decode(buffer);
    applyImport(parseCsv(text,separator(text)),file.name);
  }).catch(function(err){say(err.message||"讀取檔案時發生問題。","err");});
}
function downloadTemplate(){
  var text="\ufeff座號,姓名\n1,王小明\n2,陳小華\n3,林小美\n";
  var blob=new Blob([text],{type:"text/csv;charset=utf-8"});
  var link=document.createElement("a");
  link.href=URL.createObjectURL(blob);
  link.download="高校座位表達人_名單範本.csv";
  document.body.appendChild(link);
  link.click();
  link.remove();
  URL.revokeObjectURL(link.href);
}
function changeSize(){
  var rows=parseInt(byId("rows").value,10),cols=parseInt(byId("cols").value,10);
  if(!rows||!cols||rows<1||cols<1||rows>12||cols>12){alert("請輸入 1 到 12 的列數與行數。");return;}
  state.rows=rows;state.cols=cols;renderAll();
}
function seatsInCodeOrder(){
  var ordered=[];
  for(var column=state.cols;column>=1;column--){
    for(var depth=1;depth<=state.rows;depth++){
      var key=cellKey(depth,column);
      if(!isClosed(key))ordered.push(key);
    }
  }
  return ordered;
}
function compareStudentNumbers(a,b){
  var aNo=String(a.no==null?"":a.no).trim(),bNo=String(b.no==null?"":b.no).trim();
  var aValue=Number(aNo),bValue=Number(bNo);
  var aIsNumber=aNo!==""&&Number.isFinite(aValue),bIsNumber=bNo!==""&&Number.isFinite(bValue);
  if(aIsNumber&&bIsNumber&&aValue!==bValue)return aValue-bValue;
  if(aIsNumber!==bIsNumber)return aIsNumber?-1:1;
  return aNo.localeCompare(bNo,"zh-Hant",{numeric:true,sensitivity:"base"});
}
function clearCurrentSeats(){
  if(!Object.keys(state.seats).length){say("目前座位表已是空白；名單與設定均已保留。","ok");return;}
  if(!confirm("清空目前座位表？名單、座位尺寸、關閉座位、特定安排、拆散群組與候選表都會保留。"))return;
  state.seats={};
  renderAll();
  say("已清空目前座位表；名單與設定均已保留。","ok");
}
function orderByStudentNumber(){
  if(!state.students.length){alert("請先匯入班級名單。");return;}
  var orderedSeats=seatsInCodeOrder();
  if(state.students.length>orderedSeats.length){
    alert("可用座位只有 "+orderedSeats.length+" 個，但名單有 "+state.students.length+" 人。請增加座位或重新開啟部分座位。");
    return;
  }
  if(Object.keys(state.seats).length&&!confirm("按照座號排列會覆蓋目前座位表；特定安排與拆散群組設定會保留，但本次不套用。確定嗎？"))return;
  var students=state.students.slice().sort(compareStudentNumbers);
  var arranged={};
  students.forEach(function(s,index){arranged[orderedSeats[index]]=s.id;});
  state.seats=arranged;
  renderAll();
  say("已依座號由 1-1、1-2、1-3… 依序排列 "+students.length+" 位學生。","ok");
}
function clearAll(){
  if(!confirm("這會清除本機儲存的名單、座位及候選表，確定嗎？"))return;
  localStorage.removeItem(STORE);
  state=initialState();
  renderAll();
}
function backupData(){
  var payload={format:"classroom-seating-backup",version:1,createdAt:new Date().toISOString(),state:state};
  var blob=new Blob([JSON.stringify(payload,null,2)],{type:"application/json;charset=utf-8"});
  directDownload(blob,"高校座位表達人備份 "+exportDate()+".json");
}
function restoreBackup(file){
  file.text().then(function(text){
    var backup=JSON.parse(text);
    if(!backup||backup.format!=="classroom-seating-backup"||!backup.state||!Array.isArray(backup.state.students)||typeof backup.state.seats!=="object"){
      throw new Error("這不是可用的班級座位表備份檔。");
    }
    if(!confirm("還原會覆蓋目前瀏覽器內的名單、座位與候選表，確定嗎？"))return;
    var restored=Object.assign(initialState(),migrateLegacyOrientation(backup.state));
    if(!Array.isArray(restored.closed))restored.closed=[];
    if(!Array.isArray(restored.rules))restored.rules=[];
    if(!Array.isArray(restored.groups))restored.groups=[];
    if(!Array.isArray(restored.candidates))restored.candidates=[];
    if(!restored.draft)restored.draft={studentId:"",cells:[]};
    state=restored;
    renderAll();
    say("已還原備份："+file.name,"ok");
  }).catch(function(error){say(error.message||"無法讀取備份檔。","err");});
}
function showPrivacyNotice(){
  try{
    if(localStorage.getItem(PRIVACY_NOTICE_STORE)==="1")return;
  }catch(error){}
  byId("privacyModal").classList.add("show");
}
function acceptPrivacyNotice(){
  try{localStorage.setItem(PRIVACY_NOTICE_STORE,"1");}catch(error){}
  byId("privacyModal").classList.remove("show");
}
function saveRule(){
  if(!state.draft.studentId){alert("請先選擇學生。");return;}
  if(!state.draft.cells.length){alert("請在左側至少選擇一個座位。");return;}
  if(state.rules.length>=3){alert("特定安排最多儲存 3 組。");return;}
  state.rules.push({studentId:state.draft.studentId,cells:copy(state.draft.cells)});
  state.draft={studentId:"",cells:[]};
  renderAll();
}
function wire(){
  byId("file").addEventListener("change",function(e){if(e.target.files[0])importFile(e.target.files[0]);e.target.value="";});
  byId("downloadTemplate").addEventListener("click",downloadTemplate);
  byId("sizeApply").addEventListener("click",changeSize);
  byId("ruleStudent").addEventListener("change",function(e){state.draft={studentId:e.target.value,cells:[]};renderAll();});
  byId("saveRule").addEventListener("click",saveRule);
  byId("cancelRule").addEventListener("click",function(){state.draft={studentId:"",cells:[]};renderAll();});
  byId("addGroup").addEventListener("click",addGroup);
  byId("random").addEventListener("click",function(){randomize(true);});
  byId("capture").addEventListener("click",addCandidate);
  byId("makeFive").addEventListener("click",createFive);
  byId("toggleDesk").addEventListener("click",function(){state.desk=state.desk==="bottom"?"top":"bottom";renderAll();});
  byId("toggleClosed").addEventListener("click",flipClosed);
  byId("orderByNumber").addEventListener("click",orderByStudentNumber);
  byId("clearSeats").addEventListener("click",clearCurrentSeats);
  byId("clearAll").addEventListener("click",clearAll);
  byId("backupData").addEventListener("click",backupData);
  byId("restoreFile").addEventListener("change",function(e){if(e.target.files[0])restoreBackup(e.target.files[0]);e.target.value="";});
  byId("acceptPrivacy").addEventListener("click",acceptPrivacyNotice);
  byId("savePng").addEventListener("click",savePngFiles);
  byId("print").addEventListener("click",printChosen);
  document.addEventListener("click",function(e){if(!e.target.closest("#context"))hideContext();});
}
restore();
wire();
renderAll();
showPrivacyNotice();
})();
