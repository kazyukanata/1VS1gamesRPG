(function(){
/* ============================================================
   基本セットアップ
============================================================ */
const canvas = document.getElementById('game-canvas');
const ctx = canvas.getContext('2d');
const phaseLabel = document.getElementById('phase-label');
const hpLabel = document.getElementById('hp-label');
const logEl = document.getElementById('log');
const overlay = document.getElementById('overlay');
const overlayText = document.getElementById('overlay-text');
const overlayBtn = document.getElementById('overlay-btn');
const choicePanel = document.getElementById('choice-panel');

/* スマホ向けレスポンシブ */
function resizeCanvas(){
  const w = window.innerWidth;
  const h = window.innerHeight;
  const aspect = canvas.width / canvas.height;
  let cw = w, ch = h;
  if(cw/ch > aspect){
    cw = ch * aspect;
  } else {
    ch = cw / aspect;
  }
  canvas.style.width = cw + 'px';
  canvas.style.height = ch + 'px';
}
window.addEventListener('resize', resizeCanvas);
resizeCanvas();

/* ============================================================
   ゲーム状態
============================================================ */
const STATE = {
  phase: 'TITLE',   // タイトル画面から開始
  turn: 1,
  maxTurn: 30,

  heroHP: 100,
  heroMaxHP: 100,
  maouHP: 300,
  maouMaxHP: 300,

  heroActionsThisTurn: 1,
  heroCarry: 0,
  maouActionsThisTurn: 2,
  maouCarry: 0,

  heroStory: 1,
  heroGold: 0,
  heroParty: [],
  heroStatsBonus: 0,
  heroTrapCursedFog: false,

  maouCastleDefense: 0,
  maouMonsters: [],
  maouFusionRate: 80,

  mainMapPos: 0,
  mainMap: [],
  pendingTrap: null,
  pendingSummon: null,

  finalBattleStarted: false,
  winner: null
};

/* ============================================================
   ログ
============================================================ */
function addLog(msg){
  const div = document.createElement('div');
  div.textContent = msg;
  logEl.appendChild(div);
  logEl.scrollTop = logEl.scrollHeight;
}

/* ============================================================
   オーバーレイ
============================================================ */
function showOverlay(text, buttonLabel, cb){
  overlayText.innerHTML = text.replace(/\n/g,'<br>');
  overlayBtn.textContent = buttonLabel || '画面をタップして進む';
  overlay.style.display = 'flex';
  overlayBtn.onclick = function(){
    overlay.style.display = 'none';
    if(cb) cb();
  };
}

/* ============================================================
   選択肢パネル
============================================================ */
function showChoices(choices){
  choicePanel.innerHTML = '';
  choicePanel.style.display = 'block';
  choices.forEach(c=>{
    const btn = document.createElement('button');
    btn.textContent = c.label;
    btn.onclick = ()=>{ choicePanel.style.display='none'; c.onSelect(); };
    choicePanel.appendChild(btn);
  });
}

/* ============================================================
   すごろく式メインマップ生成
============================================================ */
function generateMainMap(){
  const types = ['grass','village','town','cave','spring','chest'];
  STATE.mainMap = [];
  for(let i=0;i<STATE.maxTurn;i++){
    if(i===STATE.maxTurn-1){
      STATE.mainMap.push('castle');
    } else {
      STATE.mainMap.push(types[Math.floor(Math.random()*types.length)]);
    }
  }
}
generateMainMap();

/* ============================================================
   ドット絵描画（キャラ）
============================================================ */
function clearCanvas(){
  ctx.fillStyle = '#111';
  ctx.fillRect(0,0,canvas.width,canvas.height);
}

/* --- 勇者 --- */
function drawHeroSprite(x,y){
  ctx.fillStyle = '#f2d3b0'; ctx.fillRect(x+5,y+1,6,5);
  ctx.fillStyle = '#303030'; ctx.fillRect(x+4,y,8,2);
  ctx.fillStyle = '#1a4fff'; ctx.fillRect(x+4,y+6,8,8);
  ctx.fillStyle = '#f2d3b0'; ctx.fillRect(x+3,y+7,2,4);
  ctx.fillRect(x+11,y+7,2,4);
  ctx.fillStyle = '#444'; ctx.fillRect(x+5,y+14,2,2);
  ctx.fillRect(x+9,y+14,2,2);
}

/* --- 魔王 --- */
function drawMaouSprite(x,y){
  ctx.fillStyle='#f2d3b0'; ctx.fillRect(x+5,y+1,6,5);
  ctx.fillStyle='#d4b000'; ctx.fillRect(x+4,y,8,2);
  ctx.fillRect(x+4,y-1,2,1); ctx.fillRect(x+10,y-1,2,1);
  ctx.fillStyle='#8b0000'; ctx.fillRect(x+4,y+6,8,8);
  ctx.fillStyle='#f2d3b0'; ctx.fillRect(x+3,y+7,2,4);
  ctx.fillRect(x+11,y+7,2,4);
  ctx.fillStyle='#333'; ctx.fillRect(x+5,y+14,2,2);
  ctx.fillRect(x+9,y+14,2,2);
}

/* ============================================================
   ドット絵描画（NPC）
============================================================ */
function drawNPCSprite(type,x,y){
  ctx.save();
  switch(type){
    case 'hero_tavern':
      ctx.fillStyle='#f2d3b0'; ctx.fillRect(x+5,y+1,6,5);
      ctx.fillStyle='#7a4a00'; ctx.fillRect(x+4,y+6,8,8);
      ctx.fillStyle='#e0e0e0'; ctx.fillRect(x+5,y+8,6,6);
      ctx.fillStyle='#f2d3b0'; ctx.fillRect(x+3,y+7,2,4);
      ctx.fillRect(x+11,y+7,2,4);
      ctx.fillStyle='#444'; ctx.fillRect(x+5,y+14,2,2);
      ctx.fillRect(x+9,y+14,2,2);
      break;

    case 'hero_trainer':
      ctx.fillStyle='#f2d3b0'; ctx.fillRect(x+5,y+1,6,5);
      ctx.fillStyle='#888'; ctx.fillRect(x+4,y+6,8,8);
      ctx.fillStyle='#aaa'; ctx.fillRect(x+3,y+6,2,3);
      ctx.fillRect(x+11,y+6,2,3);
      ctx.fillStyle='#f2d3b0'; ctx.fillRect(x+3,y+9,2,4);
      ctx.fillRect(x+11,y+9,2,4);
      ctx.fillStyle='#555'; ctx.fillRect(x+5,y+14,2,2);
      ctx.fillRect(x+9,y+14,2,2);
      break;

    case 'hero_merchant':
      ctx.fillStyle='#f2d3b0'; ctx.fillRect(x+5,y+1,6,5);
      ctx.fillStyle='#006600'; ctx.fillRect(x+4,y+6,8,8);
      ctx.fillStyle='#7a4a00'; ctx.fillRect(x+3,y+9,3,4);
      ctx.fillStyle='#f2d3b0'; ctx.fillRect(x+11,y+7,2,4);
      ctx.fillStyle='#444'; ctx.fillRect(x+5,y+14,2,2);
      ctx.fillRect(x+9,y+14,2,2);
      break;

    case 'hero_guide':
      ctx.fillStyle='#f2d3b0'; ctx.fillRect(x+5,y+1,6,5);
      ctx.fillStyle='#fff'; ctx.fillRect(x+4,y+3,8,2);
      ctx.fillStyle='#4040a0'; ctx.fillRect(x+4,y+6,8,8);
      ctx.fillStyle='#f2d3b0'; ctx.fillRect(x+3,y+7,2,4);
      ctx.fillRect(x+11,y+7,2,4);
      ctx.fillStyle='#444'; ctx.fillRect(x+5,y+14,2,2);
      ctx.fillRect(x+9,y+14,2,2);
      break;

    case 'maou_priest':
      ctx.fillStyle='#f2d3b0'; ctx.fillRect(x+5,y+1,6,5);
      ctx.fillStyle='#400040'; ctx.fillRect(x+4,y+6,8,8);
      ctx.fillStyle='#f2d3b0'; ctx.fillRect(x+3,y+7,2,4);
      ctx.fillRect(x+11,y+7,2,4);
      ctx.fillStyle='#333'; ctx.fillRect(x+5,y+14,2,2);
      ctx.fillRect(x+9,y+14,2,2);
      break;

    case 'maou_engineer':
      ctx.fillStyle='#f2d3b0'; ctx.fillRect(x+5,y+1,6,5);
      ctx.fillStyle='#606060'; ctx.fillRect(x+4,y+6,8,8);
      ctx.fillStyle='#303030'; ctx.fillRect(x+3,y+9,3,4);
      ctx.fillStyle='#f2d3b0'; ctx.fillRect(x+11,y+7,2,4);
      ctx.fillStyle='#444'; ctx.fillRect(x+5,y+14,2,2);
      ctx.fillRect(x+9,y+14,2,2);
      break;

    case 'maou_darkmerchant':
      ctx.fillStyle='#f2d3b0'; ctx.fillRect(x+5,y+1,6,5);
      ctx.fillStyle='#202020'; ctx.fillRect(x+4,y+6,8,8);
      ctx.fillStyle='#7a4a00'; ctx.fillRect(x+3,y+9,3,4);
      ctx.fillStyle='#f2d3b0'; ctx.fillRect(x+11,y+7,2,4);
      ctx.fillStyle='#444'; ctx.fillRect(x+5,y+14,2,2);
      ctx.fillRect(x+9,y+14,2,2);
      break;

    case 'maou_butler':
      ctx.fillStyle='#f2d3b0'; ctx.fillRect(x+5,y+1,6,5);
      ctx.fillStyle='#202020'; ctx.fillRect(x+4,y+6,8,8);
      ctx.fillStyle='#fff'; ctx.fillRect(x+6,y+8,4,2);
      ctx.fillStyle='#f2d3b0'; ctx.fillRect(x+3,y+7,2,4);
      ctx.fillRect(x+11,y+7,2,4);
      ctx.fillStyle='#444'; ctx.fillRect(x+5,y+14,2,2);
      ctx.fillRect(x+9,y+14,2,2);
      break;
  }
  ctx.restore();
}

/* ============================================================
   ドット絵描画（モンスター）
============================================================ */
function drawMonster(type,x,y){
  switch(type){
    case 'slime':
      ctx.fillStyle='#00b0b0';
      ctx.fillRect(x+4,y+8,8,6);
      ctx.fillRect(x+5,y+6,6,4);
      ctx.fillStyle='#fff';
      ctx.fillRect(x+6,y+7,2,1);
      ctx.fillRect(x+8,y+7,2,1);
      break;

    case 'zombie':
      ctx.fillStyle='#80c080'; ctx.fillRect(x+5,y+1,6,5);
      ctx.fillStyle='#408040'; ctx.fillRect(x+4,y+6,8,8);
      ctx.fillStyle='#80c080'; ctx.fillRect(x+3,y+7,2,4);
      ctx.fillRect(x+11,y+7,2,4);
      ctx.fillStyle='#444'; ctx.fillRect(x+5,y+14,2,2);
      ctx.fillRect(x+9,y+14,2,2);
      break;

    case 'dragon':
      ctx.fillStyle='#a00000'; ctx.fillRect(x+4,y+6,10,6);
      ctx.fillRect(x+3,y+4,4,4);
      ctx.fillStyle='#ffff00'; ctx.fillRect(x+4,y+5,2,1);
      ctx.fillStyle='#700000'; ctx.fillRect(x+2,y+7,4,3);
      ctx.fillRect(x+12,y+7,4,3);
      break;

    case 'evilwarrior':
      ctx.fillStyle='#f2d3b0'; ctx.fillRect(x+5,y+1,6,5);
      ctx.fillStyle='#404040'; ctx.fillRect(x+4,y+6,8,8);
      ctx.fillStyle='#800000'; ctx.fillRect(x+2,y+6,2,8);
      ctx.fillStyle='#f2d3b0'; ctx.fillRect(x+11,y+7,2,4);
      ctx.fillStyle='#444'; ctx.fillRect(x+5,y+14,2,2);
      ctx.fillRect(x+9,y+14,2,2);
      break;
  }
}

/* ============================================================
   RPG風タイルマップ（すごろく式）
============================================================ */
function drawTile_grass(x,y){
  ctx.fillStyle='#2a7f2a'; ctx.fillRect(x,y,16,16);
  ctx.fillStyle='#3a9f3a'; ctx.fillRect(x+2,y+2,3,3);
  ctx.fillRect(x+10,y+8,3,3);
}
function drawTile_house(x,y){
  ctx.fillStyle='#c8b090'; ctx.fillRect(x+2,y+6,12,10);
  ctx.fillStyle='#a03030'; ctx.fillRect(x+1,y+2,14,6);
  ctx.fillStyle='#603000'; ctx.fillRect(x+7,y+10,4,6);
}
function drawTile_shop(x,y){
  ctx.fillStyle='#d0c0a0'; ctx.fillRect(x+2,y+6,12,10);
  ctx.fillStyle='#3050a0'; ctx.fillRect(x+1,y+2,14,6);
  ctx.fillStyle='#fff'; ctx.fillRect(x+4,y+4,8,2);
}
function drawTile_cave(x,y){
  ctx.fillStyle='#444'; ctx.fillRect(x,y,16,16);
  ctx.fillStyle='#000'; ctx.fillRect(x+4,y+6,8,8);
}
function drawTile_spring(x,y){
  ctx.fillStyle='#2a7f2a'; ctx.fillRect(x,y,16,16);
  ctx.fillStyle='#4ac8ff'; ctx.fillRect(x+3,y+5,10,6);
  ctx.fillStyle='#a0e8ff'; ctx.fillRect(x+5,y+7,6,2);
}
function drawTile_chest(x,y){
  ctx.fillStyle='#7a4a00'; ctx.fillRect(x+3,y+6,10,8);
  ctx.fillStyle='#d0d000'; ctx.fillRect(x+7,y+9,2,2);
}
function drawTile_castle(x,y){
  ctx.fillStyle='#555'; ctx.fillRect(x,y,16,16);
  ctx.fillStyle='#222'; ctx.fillRect(x+4,y+4,3,3);
  ctx.fillRect(x+9,y+4,3,3);
  ctx.fillStyle='#303030'; ctx.fillRect(x+6,y+10,4,6);
}

/* ============================================================
   メインマップ描画（すごろく式）
============================================================ */
function drawMainMap(){
  clearCanvas();
  const tileSize = 16;
  const startX = 10;
  const startY = 60;

  for(let i=0;i<STATE.mainMap.length;i++){
    const x = startX + i * tileSize;
    const cell = STATE.mainMap[i];

    if(cell==='grass') drawTile_grass(x,startY);
    if(cell==='village') drawTile_house(x,startY);
    if(cell==='town') drawTile_shop(x,startY);
    if(cell==='cave') drawTile_cave(x,startY);
    if(cell==='spring') drawTile_spring(x,startY);
    if(cell==='chest') drawTile_chest(x,startY);
    if(cell==='castle') drawTile_castle(x,startY);
  }

  const heroX = startX + STATE.mainMapPos * tileSize;
  drawHeroSprite(heroX, startY - 20);

  ctx.fillStyle='#fff';
  ctx.font='10px sans-serif';
  ctx.fillText('勇者の位置：'+STATE.mainMapPos+' / '+(STATE.maxTurn-1),10,20);
}

/* ============================================================
   HP・フェーズ表示
============================================================ */
function updateHPLabel(){
  if(STATE.phase==='MAOU_SETUP'){
    hpLabel.textContent = '魔王 HP: '+STATE.maouHP+' / '+STATE.maouMaxHP;
  } else if(STATE.phase==='HERO_SETUP'){
    hpLabel.textContent = '勇者 HP: '+STATE.heroHP+' / '+STATE.heroMaxHP;
  } else {
    hpLabel.textContent =
      '勇者 HP: '+STATE.heroHP+' / '+STATE.heroMaxHP+
      '　|　魔王 HP: '+STATE.maouHP+' / '+STATE.maouMaxHP;
 
