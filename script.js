const SAVE_KEY="fmpocket_v1";
let game=null, match=null, activeScreen="dashboard";

const $=s=>document.querySelector(s);
const fmtMoney=n=>new Intl.NumberFormat("pt-BR",{style:"currency",currency:"EUR",maximumFractionDigits:0}).format(n);
const esc=s=>String(s).replace(/[&<>"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#039;"}[c]));
const club=()=>game.clubs.find(c=>c.id===game.clubId);
const teamName=id=>game.clubs.find(c=>c.id===id)?.name||"Clube";
const team=id=>game.clubs.find(c=>c.id===id);

function deepClone(x){return JSON.parse(JSON.stringify(x))}
function initGame(clubId, coach){
 const clubs=deepClone(BASE_CLUBS);
 const my=clubs.find(c=>c.id===clubId);
 my.players.forEach(p=>{p.morale=85;p.energy=100;p.form=80});
 game={coach:{name:coach||"Novo Treinador",reputation:50,titles:0,wins:0,draws:0,losses:0,matches:0,clubs:[my.name]},
 clubId,clubs,season:2026,round:1,table:{},results:[],news:[],transactions:[],settings:{sound:true},formation:"4-3-3",
 lineup:[],captain:null,setPieces:{free:null,pen:null,corner:null},savedAt:null};
 setupSeason(); autoLineup(); addNews(`Você assumiu o comando do ${my.name}. Boa temporada!`); saveGame();
}
function setupSeason(){
 game.table={};
 game.clubs.forEach(c=>game.table[c.id]={played:0,wins:0,draws:0,losses:0,gf:0,ga:0,pts:0});
 // calendário circular simples: 19 rodadas, todos enfrentam todos uma vez.
 game.schedule=[];
 const ids=game.clubs.map(c=>c.id), n=ids.length;
 for(let r=0;r<n-1;r++){
  for(let i=0;i<n/2;i++){
   let a=ids[i],b=ids[n-1-i];
   if((r+i)%2) [a,b]=[b,a];
   game.schedule.push({round:r+1,home:a,away:b});
  }
  ids.splice(1,0,ids.pop());
 }
 game.round=1;
}
function autoLineup(){
 const c=club(), formation=FORMATIONS[game.formation];
 const used=new Set(); game.lineup=[];
 formation.forEach(pos=>{
  let candidates=c.players.filter(p=>!used.has(p.id)&&p.injury<=0&&p.position===pos);
  if(!candidates.length)candidates=c.players.filter(p=>!used.has(p.id)&&p.injury<=0);
  candidates.sort((a,b)=>b.overall+b.form/20-b.energy/20-(a.morale-b.morale)/30-(a.injury>0?99:0));
  if(candidates[0]){used.add(candidates[0].id);game.lineup.push(candidates[0].id)}
 });
 if(game.lineup.length<11)c.players.filter(p=>!used.has(p.id)&&p.injury<=0).slice(0,11-game.lineup.length).forEach(p=>game.lineup.push(p.id));
 if(!game.captain)game.captain=game.lineup[0];
 if(!game.setPieces.free)game.setPieces={free:game.lineup[7],pen:game.lineup[10],corner:game.lineup[7]};
}
function saveGame(){
 if(!game)return;
 game.savedAt=new Date().toISOString();
 localStorage.setItem(SAVE_KEY,JSON.stringify(game));
 toast("SALVO AUTOMATICAMENTE");
 renderTop();
}
function loadGame(){
 const raw=localStorage.getItem(SAVE_KEY);
 if(!raw)return false;
 try{
  game=JSON.parse(raw);
  // Migração da V1: os valores antigos estavam baixos demais.
  game.clubs.forEach(cl=>cl.players.forEach(p=>{
   const ageFactor=p.age<21?1.45:p.age<25?1.30:p.age<29?1.05:p.age<32?.82:.62;
   const potentialFactor=1+Math.max(0,p.potential-p.overall)*.035;
   p.value=Math.max(450000,Math.round(Math.pow(p.overall,3)*35*ageFactor*potentialFactor));
   p.salary=Math.max(5000,Math.round(Math.pow(p.overall,2)*6.2+500));
  }));
  return true;
 }catch(e){return false}
}
function addNews(text){game.news.unshift({id:makeId("n"),text,date:new Date().toLocaleDateString("pt-BR")});game.news=game.news.slice(0,20)}
function toast(msg){
 const box=$("#toast-container"); if(!box)return;
 const el=document.createElement("div");el.className="toast";el.textContent=msg;
 Object.assign(el.style,{position:"fixed",right:"15px",bottom:"15px",zIndex:100,padding:"12px 16px",background:"#16233a",border:"1px solid #31435f",borderRadius:"12px",boxShadow:"0 15px 35px #000",fontWeight:"800"});
 box.appendChild(el);setTimeout(()=>el.remove(),2200);
}
function renderTop(){
 const t=$("#topbar"); if(!game){t.innerHTML="";return}
 const c=club();
 t.innerHTML=`<div class="top-inner"><div class="brand">⚽ <span>FMP</span> · ${esc(c.name)}</div><div class="money">${fmtMoney(c.money)}</div></div>`;
}
function go(screen){activeScreen=screen;render()}
function render(){
 renderTop(); const s=$("#screen");
 if(!game){renderHome(s);return}
 if(activeScreen==="dashboard")renderDashboard(s);
 else if(activeScreen==="squad")renderSquad(s);
 else if(activeScreen==="tactics")renderTactics(s);
 else if(activeScreen==="match")renderMatch(s);
 else if(activeScreen==="table")renderTable(s);
 else if(activeScreen==="transfers")renderTransfers(s);
 else if(activeScreen==="finance")renderFinance(s);
 else if(activeScreen==="club")renderClub(s);
 else if(activeScreen==="stats")renderStats(s);
 else if(activeScreen==="settings")renderSettings(s);
}
function nav(){
 return `<div class="tabs">
 <button class="btn" onclick="go('dashboard')">🏠 Início</button><button class="btn" onclick="go('squad')">👥 Elenco</button>
 <button class="btn" onclick="go('tactics')">📋 Escalação</button><button class="btn" onclick="go('transfers')">🔄 Transferências</button>
 <button class="btn" onclick="go('table')">📊 Tabela</button><button class="btn" onclick="go('finance')">💰 Finanças</button>
 <button class="btn" onclick="go('club')">🏟️ Clube</button><button class="btn" onclick="go('stats')">📈 Estatísticas</button>
 </div>`;
}
function renderHome(s){
 s.innerHTML=`<section class="hero"><div style="font-size:65px">⚽</div><h1>FOOTBALL MANAGER POCKET</h1><p class="muted">Seu clube. Suas decisões. Sua história.</p>
 <div class="actions" style="justify-content:center;margin-top:18px"><button class="btn primary" onclick="newGame()">NOVO JOGO</button><button class="btn blue" ${localStorage.getItem(SAVE_KEY)?"":"disabled"} onclick="continueGame()">CONTINUAR</button><button class="btn" onclick="showSettingsHome()">CONFIGURAÇÕES</button></div></section>
 <div class="grid grid-3"><div class="card"><h3>⚡ Partidas rápidas</h3><p class="muted">Decida a estratégia durante o jogo e veja a partida evoluir minuto a minuto.</p></div><div class="card"><h3>📈 Carreira</h3><p class="muted">Evolua seu treinador, conquiste títulos e construa uma trajetória.</p></div><div class="card"><h3>💾 Save local</h3><p class="muted">Seu progresso fica salvo no navegador, sem backend.</p></div></div>`;
}
function newGame(){showClubPicker()}
function continueGame(){if(loadGame()){autoLineup();render();toast("CARREIRA CARREGADA")}}
function showClubPicker(){
 const s=$("#screen");
 s.innerHTML=`<div class="section-title"><div><h2>Escolha seu clube</h2><p class="muted">Todos os clubes e identidades são fictícios.</p></div></div>
 <div class="club-grid">${BASE_CLUBS.map((c,i)=>`<div class="card club-card" onclick="pickClub('${c.id}')"><div class="club-choice">${logo(c)}<div><b>${esc(c.name)}</b><div class="muted small">${c.country} · ${c.league}</div></div></div><div class="section-title"><span class="small">${c.stadium}</span><b>${c.strength} OVR</b></div><div class="small muted">Caixa inicial: ${fmtMoney(c.money*1000000)}</div></div>`).join("")}</div>`;
}
function pickClub(id){
 const name=prompt("Nome do treinador:","Meu Treinador");
 if(name===null)return;
 initGame(id,name.trim()||"Novo Treinador");render();
}
function logo(c){return `<div class="club-logo" style="background:${COLORS[c.id?.split("_")[1]%COLORS.length||0]}">${esc(c.name.split(/\s+/).slice(0,2).map(x=>x[0]).join(""))}</div>`}
function renderDashboard(s){
 const c=club(), standings=sortedTable(), pos=standings.findIndex(x=>x.id===c.id)+1;
 const next=getNextFixture(); const opp=next?(next.home===c.id?team(next.away):team(next.home)):null;
 const myPlayers=c.players.filter(p=>p.injury<=0); const avg=Math.round(myPlayers.reduce((a,p)=>a+p.overall,0)/myPlayers.length);
 s.innerHTML=nav()+`<div class="card"><div class="club-head">${logo(c)}<div><h2>${esc(c.name)}</h2><div class="muted">${c.country} · ${c.league} · ${c.division}ª divisão</div></div></div>
 <div class="grid grid-4" style="margin-top:15px"><div class="kpi"><small>Caixa</small><strong class="money">${fmtMoney(c.money)}</strong></div><div class="kpi"><small>Posição</small><strong>${pos}º</strong></div><div class="kpi"><small>Força</small><strong>${avg}</strong></div><div class="kpi"><small>Temporada</small><strong>${game.season}</strong></div></div></div>
 <div class="big-actions"><button class="btn primary" onclick="prepareMatch()">⚽ JOGAR PARTIDA</button><button class="btn" onclick="go('squad')">👥 ELENCO</button><button class="btn" onclick="go('transfers')">🔄 TRANSFERÊNCIAS</button><button class="btn" onclick="go('table')">📊 TABELA</button><button class="btn" onclick="go('finance')">💰 FINANÇAS</button></div>
 <div class="grid grid-2"><div class="card"><h3>📅 Próxima partida</h3>${opp?`<div class="club-head">${logo(opp)}<div><b>${esc(c.name)} × ${esc(opp.name)}</b><div class="muted">Rodada ${next.round}</div></div></div>`:`<p class="muted">Temporada encerrada.</p>`}</div>
 <div class="card"><h3>📰 Notícias</h3><div class="news">${game.news.slice(0,5).map(n=>`<div class="news-item">${esc(n.text)} <span class="muted small">${n.date}</span></div>`).join("")||"<p class='muted'>Sem notícias.</p>"}</div></div></div>
 <div class="card" style="margin-top:14px"><h3>💾 Progresso</h3><p class="muted">Último salvamento: ${game.savedAt?new Date(game.savedAt).toLocaleString("pt-BR"):"ainda não salvo"}.</p><button class="btn primary" onclick="saveGame()">SALVAR AGORA</button></div>`;
}
function getNextFixture(){return game.schedule.find(x=>x.round===game.round&&(x.home===game.clubId||x.away===game.clubId))}
function sortedTable(){return Object.entries(game.table).map(([id,t])=>({id,...t,gd:t.gf-t.ga})).sort((a,b)=>b.pts-a.pts||b.gd-a.gd||b.gf-a.gf)}
function renderTable(s){
 s.innerHTML=nav()+`<div class="section-title"><div><h2>📊 Tabela</h2><p class="muted">Temporada ${game.season} · Rodada ${Math.min(game.round,19)}/19</p></div></div>
 <div class="card"><table><thead><tr><th>#</th><th>Clube</th><th>J</th><th>V</th><th>E</th><th>D</th><th>SG</th><th>PTS</th></tr></thead><tbody>${sortedTable().map((r,i)=>`<tr class="${r.id===game.clubId?"me":""}"><td>${i+1}</td><td>${esc(teamName(r.id))}</td><td>${r.played}</td><td>${r.wins}</td><td>${r.draws}</td><td>${r.losses}</td><td>${r.gd}</td><td><b>${r.pts}</b></td></tr>`).join("")}</tbody></table></div>
 <div class="card" style="margin-top:14px"><h3>📜 Últimos resultados</h3>${game.results.slice(-8).reverse().map(r=>`<div class="event"><span class="minute">${r.homeScore}-${r.awayScore}</span>${esc(teamName(r.home))} × ${esc(teamName(r.away))}</div>`).join("")||"<p class='muted'>Nenhuma partida disputada.</p>"}</div>`;
}
function renderSquad(s){
 const c=club();
 s.innerHTML=nav()+`<div class="section-title"><div><h2>👥 Elenco</h2><p class="muted">${c.players.length} jogadores</p></div><button class="btn primary" onclick="go('tactics')">EDITAR ESCALAÇÃO</button></div>
 <div class="card"><table><thead><tr><th>#</th><th>Jogador</th><th>POS</th><th>OVR</th><th>Id.</th><th>Forma</th><th>Energia</th><th>Contrato</th><th>Valor</th></tr></thead><tbody>${c.players.sort((a,b)=>b.overall-a.overall).map(p=>`<tr><td>${p.number}</td><td><b>${esc(p.name)}</b><br><span class="muted small">${p.nation}</span></td><td>${p.position}</td><td><b>${p.overall}</b></td><td>${p.age}</td><td>${formBadge(p.form)}</td><td>${Math.round(p.energy)}%</td><td>${p.contract}a</td><td>${fmtMoney(p.value)}</td></tr>`).join("")}</tbody></table></div>`;
}
function formBadge(v){return `<span class="badge ${v>=85?"good":v>=65?"warn":"bad"}">${v>=90?"🔥":v>=75?"🟢":v>=55?"🟡":"🔴"} ${v}</span>`}
function renderTactics(s){
 const c=club(), formation=FORMATIONS[game.formation];
 const dots=game.lineup.map((id,i)=>{const p=c.players.find(x=>x.id===id);const xy=formationXY(game.formation,i);return `<div class="player-dot" style="left:${xy.x}%;top:${xy.y}%"><span>${p?esc(p.name.split(" ")[0].slice(0,8)):"-"}</span><small>${p?.position||""} ${p?.overall||""}</small></div>`}).join("");
 s.innerHTML=nav()+`<div class="section-title"><div><h2>📋 Escalação</h2><p class="muted">Escolha a formação e os titulares.</p></div></div>
 <div class="card"><div class="actions">${Object.keys(FORMATIONS).map(f=>`<button class="btn ${game.formation===f?"primary":""}" onclick="changeFormation('${f}')">${f}</button>`).join("")}</div>
 <div class="pitch"><div class="center-circle"></div>${dots}</div>
 <div class="grid grid-2"><div class="card"><h3>Capitão</h3><select class="form" onchange="setCaptain(this.value)">${game.lineup.map(id=>{let p=c.players.find(x=>x.id===id);return `<option value="${id}" ${id===game.captain?"selected":""}>${esc(p.name)}</option>`}).join("")}</select></div>
 <div class="card"><h3>Batedores</h3><div class="form"><select onchange="setPiece('free',this.value)">${pieceOptions(c,"free")}</select><select onchange="setPiece('pen',this.value)">${pieceOptions(c,"pen")}</select><select onchange="setPiece('corner',this.value)">${pieceOptions(c,"corner")}</select></div></div></div></div>
 <div class="card" style="margin-top:14px"><h3>Substituições antes da partida</h3><p class="muted small">Clique em um titular e depois em um reserva para trocar.</p><div class="grid grid-3">${game.lineup.map(id=>{let p=c.players.find(x=>x.id===id);return `<button class="btn" onclick="chooseSwap('${id}')">${esc(p.name)} · ${p.position} · ${p.overall}</button>`}).join("")}</div></div>`;
}
function formationXY(f,i){
 const map={ "4-3-3":[[50,91],[20,76],[40,82],[60,82],[80,76],[30,61],[50,55],[70,61],[18,32],[50,24],[82,32]],
 "4-4-2":[[50,91],[20,76],[40,82],[60,82],[80,76],[18,55],[40,58],[60,58],[82,55],[38,25],[62,25]],
 "4-2-3-1":[[50,91],[20,76],[40,82],[60,82],[80,76],[38,62],[62,62],[20,38],[50,38],[80,38],[50,20]],
 "3-5-2":[[50,91],[30,78],[50,82],[70,78],[12,53],[32,58],[50,60],[68,58],[88,53],[38,25],[62,25]],
 "5-3-2":[[50,91],[12,76],[30,82],[50,84],[70,82],[88,76],[30,55],[50,58],[70,55],[38,25],[62,25]],
 "4-4-1-1":[[50,91],[20,76],[40,82],[60,82],[80,76],[18,55],[40,58],[60,58],[82,55],[50,34],[50,20]]};
 const a=map[f]||map["4-3-3"];return {x:a[i][0],y:a[i][1]};
}
let swapTarget=null;
function chooseSwap(id){
 if(!swapTarget){swapTarget=id;toast("Agora clique no jogador reserva para trocar.");return}
 const c=club(), a=c.players.find(p=>p.id===swapTarget), b=c.players.find(p=>p.id===id);
 if(a&&b){const ia=game.lineup.indexOf(a.id),ib=game.lineup.indexOf(b.id);if(ia>=0&&ib>=0){game.lineup[ia]=b.id;game.lineup[ib]=a.id}else if(ia>=0&&ib<0){game.lineup[ia]=b.id}saveGame();render()}
 swapTarget=null;
}
function changeFormation(f){game.formation=f;autoLineup();saveGame();render()}
function setCaptain(id){game.captain=id;saveGame()}
function pieceOptions(c,type){let arr=c.players.filter(p=>game.lineup.includes(p.id));return `<option disabled selected>${type==="pen"?"Pênalti":type==="free"?"Falta":"Escanteio"}</option>`+arr.map(p=>`<option value="${p.id}" ${game.setPieces[type]===p.id?"selected":""}>${esc(p.name)}</option>`).join("")}
function setPiece(type,id){game.setPieces[type]=id;saveGame()}
function prepareMatch(){
 const fx=getNextFixture();if(!fx){endSeason();return}
 autoLineup(); match={fixture:fx,minute:0,homeScore:0,awayScore:0,tactic:"EQUILIBRADO",events:[],ended:false,substitutions:0};
 go("match");
 startMatchClock();
}
let matchTimer=null;
function startMatchClock(){clearInterval(matchTimer);matchTimer=setInterval(()=>{if(!match||match.ended)return;for(let i=0;i<3;i++)simulateMinute();renderMatch($("#screen"));if(match.minute>=90)finishMatch()},900)}
function simulateMinute(){
 if(match.ended)return;
 match.minute=Math.min(90,match.minute+1);
 const c=club(), fx=match.fixture, opponent=team(fx.home===c.id?fx.away:fx.home), isHome=fx.home===c.id;
 const myStrength=lineupStrength(c), oppStrength=opponent.strength+rand(-3,3);
 const tactic=match.tactic;
 let attack=0.055*(myStrength/(myStrength+oppStrength))*tacticMod(tactic,"attack");
 let concede=0.045*(oppStrength/(myStrength+oppStrength))*tacticMod(tactic,"concede");
 let r=Math.random();
 if(r<attack){let goal=Math.random()<.42; if(goal){if(isHome)match.homeScore++;else match.awayScore++;const scorer=pick(c.players.filter(p=>game.lineup.includes(p.id)));if(scorer){scorer.goals++;scorer.apps++;scorer.form=Math.min(100,scorer.form+2)}match.events.unshift({m:match.minute,t:"⚽",text:`GOL! ${scorer?.name||"O atacante"} marcou para ${c.name}.`})}else match.events.unshift({m:match.minute,t:"💥",text:`Chute perigoso do ${c.name}, mas a defesa bloqueou.`})}
 else if(r<attack+concede){let goal=Math.random()<.35;if(goal){if(isHome)match.awayScore++;else match.homeScore++;match.events.unshift({m:match.minute,t:"⚽",text:`Contra-ataque! ${opponent.name} marcou.`})}else match.events.unshift({m:match.minute,t:"🧤",text:`Defesa importante do goleiro do ${c.name}.`})}
 else if(r<.30){match.events.unshift({m:match.minute,t:"🏃",text:pick(["Ataque pela ponta.","Troca rápida de passes.","Recuperação no meio-campo.","Escanteio perigoso.","Falta no setor ofensivo."])})}
 else if(r<.33){match.events.unshift({m:match.minute,t:"🟨",text:`Cartão amarelo em uma disputa forte.`})}
 if(Math.random()<.018){let p=pick(c.players.filter(p=>game.lineup.includes(p.id)));if(p){p.injury=rand(1,3);match.events.unshift({m:match.minute,t:"🚑",text:`${p.name} sentiu e precisará ser substituído.`})}}
}
function tacticMod(t,type){
 const mods={ATACAR:{attack:1.55,concede:1.35},DEFENDER:{attack:.55,concede:.55},PRESSAO:{attack:1.25,concede:1.1},CONTRA:{attack:1.2,concede:.75},EQUILIBRADO:{attack:1,concede:1}};
 return mods[t]?.[type]||1;
}
function lineupStrength(c){
 const ps=game.lineup.map(id=>c.players.find(p=>p.id===id)).filter(Boolean);
 return ps.reduce((sum,p)=>sum+p.overall*(.65+.35*p.form/100)*(.65+.35*p.energy/100)*(.8+.2*p.morale/100),0)/Math.max(1,ps.length)+rand(-2,2);
}
function setTactic(t){if(!match)return;match.tactic=t;toast("Estratégia: "+t)}
function makeSub(){
 const c=club();const starters=game.lineup.map(id=>c.players.find(p=>p.id===id)).filter(Boolean);const bench=c.players.filter(p=>!game.lineup.includes(p.id)&&p.injury<=0);
 if(!bench.length||match.substitutions>=5){toast("Não há substituições disponíveis.");return}
 const tired=starters.sort((a,b)=>a.energy-b.energy)[0], inP=bench.sort((a,b)=>b.energy-a.energy)[0];
 if(tired&&inP){game.lineup[game.lineup.indexOf(tired.id)]=inP.id;match.substitutions++;inP.energy=Math.max(0,inP.energy-5);match.events.unshift({m:match.minute,t:"🔄",text:`Substituição: ${inP.name} entrou no lugar de ${tired.name}.`});saveGame();renderMatch($("#screen"))}
}
function renderMatch(s){
 const c=club(),fx=match.fixture,opp=team(fx.home===c.id?fx.away:fx.home);
 const home=fx.home===c.id?c:opp,away=fx.away===c.id?c:opp;
 const ballX=18+((match.minute*7)%64), ballY=28+Math.sin(match.minute/6)*18;
 const homeDots=renderMatchPlayers(home,true),awayDots=renderMatchPlayers(away,false);
 s.innerHTML=`<div class="tabs"><button class="btn" onclick="if(confirm('Sair da partida? O jogo será encerrado.')){clearInterval(matchTimer);go('dashboard')}">← Sair</button></div>
 <div class="match-layout"><div class="card match-main"><div class="match-score"><div class="match-meta"><span>RODADA ${fx.round}</span><b>${match.minute}'</b><span>${match.tactic}</span></div>
 <div class="match-teams"><div class="match-team">${logo(home)}<b>${esc(home.name)}</b></div><div class="score">${match.homeScore} <span>–</span> ${match.awayScore}</div><div class="match-team">${logo(away)}<b>${esc(away.name)}</b></div></div></div>
 <div class="live-pitch"><div class="pitch-lines"></div><div class="center-circle"></div><div class="center-spot"></div><div class="penalty-box left"></div><div class="penalty-box right"></div><div class="goal left"></div><div class="goal right"></div>${homeDots}${awayDots}<div class="match-ball" style="left:${ballX}%;top:${ballY}%">⚽</div></div>
 <div class="tactics match-tactics">${[["ATACAR","⚔️"],["EQUILIBRADO","⚖️"],["DEFENDER","🛡️"],["PRESSAO","🔥"],["CONTRA","🏃"]].map(([x,i])=>`<button class="btn tactic ${match.tactic===x?"active":""}" onclick="setTactic('${x}')">${i} ${x}</button>`).join("")}</div>
 <div class="actions" style="margin-top:10px"><button class="btn blue" onclick="makeSub()">🔄 SUBSTITUIÇÃO (${5-match.substitutions})</button><button class="btn" onclick="saveGame()">💾 SALVAR</button></div></div>
 <div class="card match-feed"><h3>📣 Narração</h3><div class="match-events">${match.events.slice(0,60).map(e=>`<div class="event"><span class="minute">${e.m}'</span>${e.t} ${esc(e.text)}</div>`).join("")||"<div class='empty'>A bola rolou...</div>"}</div></div></div>`;
}
function renderMatchPlayers(t,isHome){
 const c=club(),source=t.id===c.id?game.lineup.map(id=>c.players.find(p=>p.id===id)).filter(Boolean):t.players.slice().sort((a,b)=>b.overall-a.overall).slice(0,11);
 const positions=isHome?[[9,50],[22,25],[22,42],[22,58],[22,75],[42,20],[42,40],[42,60],[42,80],[64,38],[64,62]]:[[91,50],[78,25],[78,42],[78,58],[78,75],[58,20],[58,40],[58,60],[58,80],[36,38],[36,62]];
 return source.slice(0,11).map((p,i)=>matchPlayerDot(p,positions[i],isHome)).join("");
}
function matchPlayerDot(p,pos,isHome){return `<div class="match-player ${isHome?"home-player":"away-player"}" style="left:${pos[0]}%;top:${pos[1]}%" title="${esc(p.name)}"><span>${p.number}</span><small>${esc(p.name.split(" ")[0].slice(0,7))}</small></div>`;}

function finishMatch(){
 if(!match||match.ended)return;match.ended=true;clearInterval(matchTimer);
 const c=club(),fx=match.fixture,opp=team(fx.home===c.id?fx.away:fx.home), hs=match.homeScore,as=match.awayScore;
 const myHome=fx.home===c.id, myScore=myHome?hs:as, oppScore=myHome?as:hs;
 const mt=game.table[c.id], ot=game.table[opp.id];mt.played++;ot.played++;mt.gf+=myScore;mt.ga+=oppScore;ot.gf+=oppScore;ot.ga+=myScore;
 if(myScore>oppScore){mt.wins++;mt.pts+=3;ot.losses++;game.coach.wins++;addNews(`${c.name} venceu ${opp.name} por ${myScore}–${oppScore}.`)}
 else if(myScore===oppScore){mt.draws++;mt.pts++;ot.draws++;ot.pts++;game.coach.draws++;addNews(`${c.name} empatou com ${opp.name} em ${myScore}–${oppScore}.`)}
 else {mt.losses++;ot.wins++;ot.pts+=3;game.coach.losses++;addNews(`${c.name} perdeu para ${opp.name} por ${myScore}–${oppScore}.`)}
 game.coach.matches++;
 const starters=c.players.filter(p=>game.lineup.includes(p.id));starters.forEach(p=>{p.apps++;p.energy=Math.max(0,p.energy-(match.tactic==="PRESSAO"?25:18));p.form=Math.max(35,Math.min(100,p.form+(myScore>oppScore?3:myScore===oppScore?0:-3)));p.morale=Math.max(20,Math.min(100,p.morale+(myScore>oppScore?4:myScore===oppScore?0:-4)));if(p.injury>0)p.injury=Math.max(0,p.injury-1)});
 c.money+=450000+(myScore>oppScore?180000:myScore===oppScore?70000:0);
 game.results.push({round:game.round,home:fx.home,away:fx.away,homeScore:hs,awayScore:as});
 game.round++;
 if(game.round>19){saveGame();setTimeout(endSeason,500);return}
 saveGame();renderMatch($("#screen"));setTimeout(()=>{alert(`${c.name} ${myScore} × ${oppScore} ${opp.name}\nPróxima rodada: ${game.round}`);go("dashboard")},350);
}
function endSeason(){
 clearInterval(matchTimer);const standings=sortedTable(),pos=standings.findIndex(x=>x.id===game.clubId)+1,c=club();
 const champion=standings[0];if(champion.id===c.id){game.coach.titles++;c.money+=5000000;addNews(`🏆 ${c.name} conquistou o título da temporada ${game.season}!`)}
 else addNews(`Temporada encerrada. ${c.name} terminou em ${pos}º lugar.`);
 // recuperação + evolução
 game.clubs.forEach(cl=>cl.players.forEach(p=>{p.energy=100;p.contract=Math.max(0,p.contract-1);if(p.age<25)p.overall=Math.min(p.potential,p.overall+(Math.random()<.7?rand(0,2):0));if(p.age>=31)p.overall=Math.max(40,p.overall-(Math.random()<.6?1:0));(()=>{const ageFactor=p.age<21?1.45:p.age<25?1.30:p.age<29?1.05:p.age<32?.82:.62;const potentialFactor=1+Math.max(0,p.potential-p.overall)*.035;p.value=Math.max(450000,Math.round(Math.pow(p.overall,3)*35*ageFactor*potentialFactor));})()}));
 game.season++;setupSeason();autoLineup();saveGame();
 alert(`FIM DA TEMPORADA!\n${c.name}: ${pos}º lugar.\nNova temporada: ${game.season}`);
 go("dashboard");
}
function renderTransfers(s){
 const c=club();
 s.innerHTML=nav()+`<div class="section-title"><div><h2>🔄 Mercado</h2><p class="muted">Nenhum jogador chega sem uma proposta aceita. Valores e interesse variam conforme o mercado.</p></div></div>
 <div class="card"><div class="grid grid-4"><div class="field"><label>Posição</label><select id="filter-pos"><option value="">Todas</option>${POSITIONS.map(x=>`<option>${x}</option>`).join("")}</select></div><div class="field"><label>Overall mínimo</label><input id="filter-ovr" type="number" value="0" min="0" max="99"></div><div class="field"><label>Idade máxima</label><input id="filter-age" type="number" value="40" min="15" max="50"></div><div class="field"><label>Busca</label><input id="filter-name" placeholder="Nome"></div></div><button class="btn primary" style="margin-top:10px" onclick="renderMarket()">FILTRAR</button></div>
 <div id="market-list" style="margin-top:14px"></div><div class="card" style="margin-top:14px"><h3>📤 Vender jogador</h3><div class="grid grid-3">${c.players.map(p=>`<div class="card"><b>${esc(p.name)}</b><div class="muted">${p.position} · ${p.overall} OVR</div><div>${fmtMoney(p.value)}</div><button class="btn danger" style="margin-top:8px" onclick="sellPlayer('${p.id}')">COLOCAR À VENDA</button></div>`).join("")}</div></div>`; renderMarket();
}
function renderMarket(){
 const c=club(),pos=$("#filter-pos")?.value||"",ovr=+( $("#filter-ovr")?.value||0),age=+( $("#filter-age")?.value||40),name=($("#filter-name")?.value||"").toLowerCase();
 const pool=game.clubs.filter(x=>x.id!==c.id).flatMap(x=>x.players.map(p=>({...p,clubId:x.id}))).filter(p=>(!pos||p.position===pos)&&p.overall>=ovr&&p.age<=age&&p.name.toLowerCase().includes(name)).sort((a,b)=>b.overall-a.overall).slice(0,30);
 $("#market-list").innerHTML=`<div class="card"><h3>🌍 Jogadores disponíveis</h3><table><thead><tr><th>Jogador</th><th>POS</th><th>OVR</th><th>Idade</th><th>Clube</th><th>Valor</th><th></th></tr></thead><tbody>${pool.map(p=>`<tr><td><b>${esc(p.name)}</b><br><span class="muted small">${p.nation}</span></td><td>${p.position}</td><td><b>${p.overall}</b></td><td>${p.age}</td><td>${esc(teamName(p.clubId))}</td><td>${fmtMoney(p.value)}</td><td><button class="btn primary" onclick="openNegotiation('${p.clubId}','${p.id}')">NEGOCIAR</button></td></tr>`).join("")||`<tr><td colspan="7" class="empty">Nenhum jogador encontrado.</td></tr>`}</tbody></table></div>`;
}
function marketInterest(buyer,seller,p){return Math.max(12,Math.min(92,58+(buyer.strength-seller.strength)*.9+(buyer.money>p.value*2?8:0)-(p.overall>buyer.strength+7?18:0)));}
function openNegotiation(fromId,pid){
 const seller=team(fromId),p=seller.players.find(x=>x.id===pid),buyer=club();if(!p)return;
 const min=Math.round(p.value*.92),interest=Math.round(marketInterest(buyer,seller,p));
 const backdrop=document.createElement("div");backdrop.className="modal-backdrop";backdrop.id="negotiation-modal";
 backdrop.innerHTML=`<div class="modal"><div class="section-title"><div><h2>🤝 Negociação</h2><p class="muted">${esc(seller.name)} · ${esc(p.name)}</p></div><button class="btn" onclick="closeNegotiation()">✕</button></div><div class="grid grid-3"><div class="card"><small>OVR</small><strong>${p.overall}</strong></div><div class="card"><small>Valor de mercado</small><strong>${fmtMoney(p.value)}</strong></div><div class="card"><small>Interesse</small><strong>${interest}%</strong></div></div><div class="card" style="margin-top:12px"><p><b>${esc(p.name)}</b> recebe ${fmtMoney(p.salary)} por temporada.</p><p class="muted small">Ofertas baixas podem ser recusadas ou gerar contraproposta. Jogadores muito acima do nível do seu clube podem não querer negociar.</p><div class="field"><label>Oferta pelo jogador</label><input id="offer-value" type="number" value="${min}" min="100000" step="100000"></div><div class="field" style="margin-top:10px"><label>Salário oferecido</label><input id="offer-salary" type="number" value="${p.salary}" min="100" step="100"></div><div class="actions" style="margin-top:12px"><button class="btn primary" onclick="submitNegotiation('${fromId}','${pid}')">ENVIAR PROPOSTA</button></div></div></div>`;
 document.body.appendChild(backdrop);
}
function closeNegotiation(){$("#negotiation-modal")?.remove()}
function submitNegotiation(fromId,pid){
 const seller=team(fromId),buyer=club(),p=seller.players.find(x=>x.id===pid);if(!p)return;
 const offer=+$("#offer-value").value,salary=+$("#offer-salary").value,interest=marketInterest(buyer,seller,p);if(!Number.isFinite(offer)||!Number.isFinite(salary)||offer<=0){toast("Preencha uma oferta válida.");return}if(buyer.money<offer){toast("Seu caixa não suporta essa proposta.");return}
 if(interest<28){closeNegotiation();alert(`${p.name} não tem interesse em se transferir para ${buyer.name} neste momento.`);return}
 const minimum=Math.round(p.value*(p.overall>=buyer.strength+5?1.10:.90)),salaryMinimum=Math.round(p.salary*(p.overall>buyer.strength+6?1.20:.92));
 if(offer>=minimum&&salary>=salaryMinimum){completeTransfer(fromId,pid,offer,salary);return}
 const counter=Math.round(Math.max(minimum,offer*1.16)),counterSalary=Math.round(Math.max(salaryMinimum,salary*1.08));closeNegotiation();
 if(confirm(`${seller.name} fez uma contraproposta:\n\n💰 ${fmtMoney(counter)}\n💵 Salário: ${fmtMoney(counterSalary)}\n\nDeseja aceitar?`)){if(buyer.money<counter){alert("Você não tem dinheiro suficiente.");return}completeTransfer(fromId,pid,counter,counterSalary)}else toast("Negociação encerrada.");
}
function completeTransfer(fromId,pid,fee,salary){
 const buyer=club(),seller=team(fromId),p=seller.players.find(x=>x.id===pid);if(!p||buyer.money<fee)return;
 buyer.money-=fee;seller.money+=fee;seller.players=seller.players.filter(x=>x.id!==pid);p.contract=4;p.salary=salary;p.morale=82;p.energy=100;buyer.players.push(p);game.transactions.push({type:"Compra",player:p.name,value:fee,season:game.season});addNews(`${buyer.name} fechou a contratação de ${p.name} por ${fmtMoney(fee)}.`);autoLineup();saveGame();closeNegotiation();renderTransfers($("#screen"));toast("CONTRATAÇÃO CONCLUÍDA");
}
function sellPlayer(pid){
 const c=club();if(c.players.length<=15){toast("Mantenha pelo menos 15 jogadores.");return}const p=c.players.find(x=>x.id===pid);if(!p)return;const offer=Math.round(p.value*rand(72,100)/100);if(!confirm(`Colocar ${p.name} à venda por cerca de ${fmtMoney(offer)}?`))return;c.money+=offer;c.players=c.players.filter(x=>x.id!==pid);game.lineup=game.lineup.filter(id=>id!==pid);game.transactions.push({type:"Venda",player:p.name,value:offer,season:game.season});addNews(`${c.name} vendeu ${p.name} por ${fmtMoney(offer)}.`);autoLineup();saveGame();renderTransfers($("#screen"));
}

function renderFinance(s){
 const c=club(),salary=c.players.reduce((a,p)=>a+p.salary,0);
 s.innerHTML=nav()+`<div class="section-title"><div><h2>💰 Finanças</h2><p class="muted">Controle o caixa da temporada.</p></div></div><div class="grid grid-3">
 <div class="card kpi"><small>Saldo</small><strong class="money">${fmtMoney(c.money)}</strong></div><div class="card kpi"><small>Folha salarial</small><strong>${fmtMoney(salary)}<small>/jogadores</small></strong></div><div class="card kpi"><small>Receita por partida</small><strong>${fmtMoney(450000)}</strong></div></div>
 <div class="card" style="margin-top:14px"><h3>📜 Histórico financeiro</h3><table><thead><tr><th>Tipo</th><th>Jogador</th><th>Valor</th><th>Temporada</th></tr></thead><tbody>${game.transactions.slice().reverse().map(x=>`<tr><td>${x.type}</td><td>${esc(x.player||"-")}</td><td>${fmtMoney(x.value)}</td><td>${x.season}</td></tr>`).join("")||"<tr><td colspan='4' class='empty'>Nenhuma transferência registrada.</td></tr>"}</tbody></table></div>`;
}
function renderClub(s){
 const c=club();
 s.innerHTML=nav()+`<div class="card"><div class="club-head">${logo(c)}<div><h2>${esc(c.name)}</h2><div class="muted">${c.stadium} · Torcida: ${c.fans}</div></div></div></div>
 <div class="grid grid-3" style="margin-top:14px"><div class="card"><h3>⭐ Força</h3><strong style="font-size:30px">${c.strength}</strong></div><div class="card"><h3>🏟️ Estádio</h3><strong>${esc(c.stadium)}</strong></div><div class="card"><h3>👥 Torcida</h3><strong>${esc(c.fans)}</strong></div></div>
 <div class="card" style="margin-top:14px"><h3>👔 Treinador</h3><p>${esc(game.coach.name)}</p><p class="muted">Reputação: ${game.coach.reputation} · Jogos: ${game.coach.matches} · Títulos: ${game.coach.titles}</p></div>`;
}
function renderStats(s){
 const c=club(), ps=c.players.slice().sort((a,b)=>b.goals-a.goals),apps=c.players.slice().sort((a,b)=>b.apps-a.apps);
 s.innerHTML=nav()+`<div class="section-title"><div><h2>📈 Estatísticas</h2><p class="muted">Desempenho do elenco e da carreira.</p></div></div>
 <div class="grid grid-3"><div class="card"><h3>⚽ Artilheiro</h3><strong>${esc(ps[0]?.name||"-")}</strong><div class="muted">${ps[0]?.goals||0} gols</div></div><div class="card"><h3>👕 Mais jogos</h3><strong>${esc(apps[0]?.name||"-")}</strong><div class="muted">${apps[0]?.apps||0} jogos</div></div><div class="card"><h3>🏆 Treinador</h3><strong>${game.coach.titles}</strong><div class="muted">títulos</div></div></div>
 <div class="card" style="margin-top:14px"><h3>Elenco · produção</h3><table><thead><tr><th>Jogador</th><th>OVR</th><th>Jogos</th><th>Gols</th><th>Forma</th></tr></thead><tbody>${c.players.slice().sort((a,b)=>b.goals-a.goals||b.overall-a.overall).map(p=>`<tr><td>${esc(p.name)}</td><td>${p.overall}</td><td>${p.apps}</td><td>${p.goals}</td><td>${formBadge(p.form)}</td></tr>`).join("")}</tbody></table></div>`;
}
function renderSettings(s){
 s.innerHTML=game?nav()+`<div class="card"><h2>⚙️ Configurações</h2><div class="actions" style="margin-top:15px"><button class="btn primary" onclick="saveGame()">💾 SALVAR</button><button class="btn danger" onclick="newCareerConfirm()">🗑️ NOVA CARREIRA</button></div><p class="muted small">O save é armazenado somente neste navegador.</p></div>`:`<div class="card"><h2>⚙️ Configurações</h2><p class="muted">Versão 1.0 · sem backend · save local.</p></div>`;
}
function showSettingsHome(){renderSettings($("#screen"))}
function newCareerConfirm(){if(confirm("Apagar a carreira atual e começar outra?")){localStorage.removeItem(SAVE_KEY);game=null;render()}}
window.addEventListener("DOMContentLoaded",()=>setTimeout(()=>{$("#loading-screen").classList.add("hidden");$("#app").classList.remove("hidden");render()},1600));

// Pequenos atalhos para celular/teclado.
document.addEventListener("keydown",e=>{if(e.key==="Escape"&&match&&!match.ended){clearInterval(matchTimer);go("dashboard")}});
