(() => {
const canvas = document.getElementById("game"), ctx = canvas.getContext("2d");
const menu = document.getElementById("menu"), hud = document.getElementById("hud");
const status = document.getElementById("menuStatus");
let ws, myId, room, joined = false, players = new Map(), keys = {}, yaw = 0, pitch = 0;
let x = 2.5, y = 2.5, hp = 100, ammo = 30, reserve = 120, lastShot = 0, reloading = false, showBoard = false;
const W=15,H=15, FOV=Math.PI/2.7, MAX_DIST=18;
const map = [
"111111111111111","100000000000001","100011000110001","100000000000001","101100010001101",
"100000010000001","100000010000001","100110000011001","100000000000001","101000110001101",
"100000000000001","100011000110001","100000000000001","100000000000001","111111111111111"
];
function resize(){canvas.width=innerWidth*devicePixelRatio;canvas.height=innerHeight*devicePixelRatio;ctx.setTransform(devicePixelRatio,0,0,devicePixelRatio,0,0)}
addEventListener("resize",resize);resize();
const wall=(a,b)=>map[Math.floor(b)]?.[Math.floor(a)]!=="0";
function norm(a){return Math.atan2(Math.sin(a),Math.cos(a))}
function feed(t){const el=document.getElementById("feed");el.innerHTML=(t+"<br>"+el.innerHTML).slice(0,450)}
function connect(){
 room=document.getElementById("roomCode").value.trim().toUpperCase()||"LOBBY";
 const name=document.getElementById("playerName").value.trim()||"ROOKIE";
 const proto=location.protocol==="https:"?"wss":"ws";
 ws=new WebSocket(`${proto}://${location.host}`);
 ws.onopen=()=>ws.send(JSON.stringify({type:"join",room,name}));
 ws.onmessage=e=>{
  const m=JSON.parse(e.data);
  if(m.type==="welcome")myId=m.id;
  if(m.type==="joined"){
   joined=true;room=m.room;x=2.5;y=2.5;menu.classList.add("hidden");hud.classList.remove("hidden");
   document.getElementById("roomLabel").textContent="ROOM: "+room;
   m.players.forEach(p=>players.set(p.id,p));updateCount();feed("DEPLOYED TO "+room);
  }
  if(m.type==="error")status.textContent=m.message;
  if(m.type==="player_joined"){players.set(m.player.id,m.player);updateCount();feed(m.player.name+" JOINED");}
  if(m.type==="player_state"){players.set(m.player.id,m.player);updateCount();}
  if(m.type==="player_left"){const p=players.get(m.id);players.delete(m.id);updateCount();if(p)feed(p.name+" LEFT");}
  if(m.type==="hit"){if(m.shooter===myId)feed("HIT CONFIRMED");if(m.target===myId){hp=m.hp;updateHealth();if(hp===0)feed("ELIMINATED — RESPAWNING");}}
  if(m.type==="respawn"){x=m.x;y=m.y;hp=100;updateHealth();feed("BACK IN ACTION");}
 };
 ws.onclose=()=>{if(joined)feed("CONNECTION LOST — REFRESH TO REJOIN");};
}
function updateCount(){document.getElementById("playersLabel").textContent=`OPERATORS: ${players.size+1}/8`;renderBoard();}
function updateHealth(){document.getElementById("hpText").textContent=hp;document.getElementById("hpFill").style.width=hp+"%";}
function renderBoard(){
 const all=[{id:myId,name:document.getElementById("playerName").value,score:0},...players.values()];
 document.getElementById("scoreboard").innerHTML="<b>PRIVATE MATCH — "+room+"</b>"+all.sort((a,b)=>(b.score||0)-(a.score||0)).map(p=>`<div><span>${p.name}${p.id===myId?" (YOU)":""}</span><b>${p.score||0}</b></div>`).join("");
}
document.getElementById("joinBtn").onclick=connect;
addEventListener("keydown",e=>{keys[e.code]=true;if(e.code==="Tab"){e.preventDefault();showBoard=true;document.getElementById("scoreboard").classList.add("show");}if(e.code==="KeyR")reload();});
addEventListener("keyup",e=>{keys[e.code]=false;if(e.code==="Tab"){showBoard=false;document.getElementById("scoreboard").classList.remove("show");}});
canvas.addEventListener("click",()=>{if(joined)canvas.requestPointerLock();});
addEventListener("mousemove",e=>{if(document.pointerLockElement===canvas){yaw+=e.movementX*.0022;pitch=Math.max(-.5,Math.min(.5,pitch+e.movementY*.0015));}});
addEventListener("mousedown",e=>{if(e.button===0&&joined&&document.pointerLockElement===canvas)shoot();});
function reload(){if(reloading||ammo===30||reserve===0)return;reloading=true;setTimeout(()=>{const n=Math.min(30-ammo,reserve);ammo+=n;reserve-=n;reloading=false;document.getElementById("ammo").textContent=ammo;},1350);}
function shoot(){
 const now=performance.now();if(now-lastShot<115||reloading||ammo<=0){if(ammo<=0)reload();return;}lastShot=now;ammo--;document.getElementById("ammo").textContent=ammo;
 let target=null,best=.15;
 for(const p of players.values()){if(p.hp<=0)continue;const a=Math.atan2(p.y-y,p.x-x),d=Math.abs(norm(a-yaw)),dist=Math.hypot(p.x-x,p.y-y);if(d<best&&dist<11){best=d;target=p;}}
 if(target&&ws?.readyState===1)ws.send(JSON.stringify({type:"shot",target:target.id}));
}
function move(){
 if(!joined)return;
 const speed=(keys.ShiftLeft||keys.ShiftRight)?.085:.052;
 let dx=0,dy=0;
 if(keys.KeyW){dx+=Math.cos(yaw)*speed;dy+=Math.sin(yaw)*speed}
 if(keys.KeyS){dx-=Math.cos(yaw)*speed;dy-=Math.sin(yaw)*speed}
 if(keys.KeyA){dx+=Math.cos(yaw-Math.PI/2)*speed;dy+=Math.sin(yaw-Math.PI/2)*speed}
 if(keys.KeyD){dx+=Math.cos(yaw+Math.PI/2)*speed;dy+=Math.sin(yaw+Math.PI/2)*speed}
 if(!wall(x+dx,y))x+=dx;if(!wall(x,y+dy))y+=dy;
 if(ws?.readyState===1)ws.send(JSON.stringify({type:"state",x,y,angle:yaw}));
}
function cast(a){
 let d=0;while(d<MAX_DIST){d+=.025;const tx=x+Math.cos(a)*d,ty=y+Math.sin(a)*d;if(wall(tx,ty))return {d,tx,ty};}return {d:MAX_DIST,tx:0,ty:0};
}
function render(){
 const w=innerWidth,h=innerHeight;
 const sky=ctx.createLinearGradient(0,0,0,h*.52);sky.addColorStop(0,"#18221e");sky.addColorStop(1,"#657064");
 ctx.fillStyle=sky;ctx.fillRect(0,0,w,h*.52);
 const floor=ctx.createLinearGradient(0,h*.5,0,h);floor.addColorStop(0,"#343a31");floor.addColorStop(1,"#111713");ctx.fillStyle=floor;ctx.fillRect(0,h*.5,w,h*.5);
 const cols=Math.ceil(w/3),z=[];
 for(let i=0;i<cols;i++){const a=yaw+(i/cols-.5)*FOV,r=cast(a),correct=r.d*Math.cos(a-yaw);z[i]=correct;const wallH=Math.min(h*1.6,h/(correct*.78));const shade=Math.max(24,115-correct*8);const tx=Math.floor((r.tx*13+r.ty*7)%3);ctx.fillStyle=`rgb(${shade*.76+tx*5},${shade*.88+tx*4},${shade*.7+tx*3})`;ctx.fillRect(i*3,(h-wallH)/2+pitch*h,i===cols-1?3:3.2,wallH);ctx.fillStyle="rgba(0,0,0,.13)";ctx.fillRect(i*3,(h-wallH)/2+pitch*h,1,wallH);}
 const visible=[...players.values()].map(p=>({...p,dist:Math.hypot(p.x-x,p.y-y),a:norm(Math.atan2(p.y-y,p.x-x)-yaw)})).filter(p=>Math.abs(p.a)<FOV*.7&&p.dist<MAX_DIST&&p.hp>0).sort((a,b)=>b.dist-a.dist);
 for(const p of visible){const sx=(.5+p.a/FOV)*w, size=Math.min(h*.55,h/(p.dist*.9)), col=Math.floor(sx/3);if(z[col]&&z[col]<p.dist-.2)continue;ctx.fillStyle="#18221b";ctx.fillRect(sx-size*.18,h*.5-size*.35+pitch*h,size*.36,size*.7);ctx.fillStyle="#9caa8b";ctx.beginPath();ctx.arc(sx,h*.5-size*.43+pitch*h,size*.13,0,Math.PI*2);ctx.fill();ctx.fillStyle="#d8e2cb";ctx.font=`${Math.max(10,size*.1)}px Arial`;ctx.textAlign="center";ctx.fillText(p.name,sx,h*.5-size*.58+pitch*h);ctx.fillStyle="#381f1b";ctx.fillRect(sx-size*.2,h*.5-size*.72+pitch*h,size*.4,4);ctx.fillStyle="#a7c16d";ctx.fillRect(sx-size*.2,h*.5-size*.72+pitch*h,size*.4*p.hp/100,4);}
 // Minimal rifle silhouette
 ctx.fillStyle="#111713";ctx.fillRect(w*.46,h*.83,w*.08,h*.17);ctx.fillStyle="#333b32";ctx.fillRect(w*.485,h*.76,w*.03,h*.16);ctx.fillStyle="#171d18";ctx.fillRect(w*.497,h*.69,w*.006,h*.12);
 requestAnimationFrame(render);
}
let last=0;function loop(t){if(t-last>30){move();last=t;}requestAnimationFrame(loop)}
render();loop(0);
})();
