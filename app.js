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
function showChoices
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
      ctx.fillStyle='#f2d3b0'; ctx.fillRect
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
  }
}

function updatePhaseLabel(){
  const p = STATE.phase;
  if(p==='TITLE') phaseLabel.textContent = 'タイトル';
  else if(p==='MAOU_SETUP') phaseLabel.textContent = '魔王軍フェーズ';
  else if(p==='HERO_SETUP') phaseLabel.textContent = '勇者軍フェーズ';
  else if(p==='MOVE') phaseLabel.textContent = '勇者移動フェーズ';
  else if(p==='FINAL') phaseLabel.textContent = '最終決戦';
}

/* ============================================================
   タイトル画面
============================================================ */
function startTitle(){
  showOverlay(
    '勇者軍 VS 魔王軍\n2人対戦RPG\n\n画面をタップして開始',
    'ゲーム開始',
    ()=>{
      STATE.phase = 'MAOU_SETUP';
      updatePhaseLabel();
      startMaouSetup();
    }
  );
}
startTitle();

/* ============================================================
   魔王軍フェーズ（作戦フェーズ）
============================================================ */
function startMaouSetup(){
  updatePhaseLabel();
  updateHPLabel();
  drawMainMap();

  showChoices([
    {
      label:'モンスター召喚',
      onSelect:()=>{ chooseSummon(); }
    },
    {
      label:'トラップ設置',
      onSelect:()=>{ chooseTrap(); }
    },
    {
      label:'城の防御強化',
      onSelect:()=>{
        STATE.maouCastleDefense += 10;
        addLog('魔王城の防御力が上昇した！');
        endMaouSetup();
      }
    }
  ]);
}

function endMaouSetup(){
  STATE.phase = 'HERO_SETUP';
  updatePhaseLabel();
  startHeroSetup();
}

/* ============================================================
   勇者軍フェーズ（作戦フェーズ）
============================================================ */
function startHeroSetup(){
  updatePhaseLabel();
  updateHPLabel();
  drawMainMap();

  showChoices([
    {
      label:'仲間を集める',
      onSelect:()=>{ heroRecruit(); }
    },
    {
      label:'装備を整える',
      onSelect:()=>{ heroEquip(); }
    },
    {
      label:'休息する',
      onSelect:()=>{
        STATE.heroHP = Math.min(STATE.heroMaxHP, STATE.heroHP + 20);
        addLog('勇者は休息し、HPが回復した！');
        endHeroSetup();
      }
    }
  ]);
}

function endHeroSetup(){
  STATE.phase = 'MOVE';
  updatePhaseLabel();
  startMovePhase();
}

/* ============================================================
   勇者移動フェーズ（すごろく式）
============================================================ */
function startMovePhase(){
  updatePhaseLabel();
  updateHPLabel();
  drawMainMap();

  // 勇者は1マス進む
  STATE.mainMapPos = Math.min(STATE.mainMapPos + 1, STATE.maxTurn - 1);
  addLog('勇者は前進した！');

  drawMainMap();

  // 止まったマスのイベント
  const cell = STATE.mainMap[STATE.mainMapPos];
  triggerMapEvent(cell);

  // 最終マスなら最終決戦へ
  if(cell==='castle'){
    STATE.phase = 'FINAL';
    updatePhaseLabel();
    startFinalBattleIntro();
    return;
  }

  // 次のターンへ
  STATE.turn++;
  if(STATE.turn > STATE.maxTurn){
    STATE.phase = 'FINAL';
    updatePhaseLabel();
    startFinalBattleIntro();
    return;
  }

  // 魔王軍フェーズへ戻る
  STATE.phase = 'MAOU_SETUP';
  updatePhaseLabel();
  startMaouSetup();
}
/* ============================================================
   マップイベント（すごろく式）
============================================================ */
function triggerMapEvent(cell){
  switch(cell){
    case 'village':
      addLog('勇者は村に立ち寄った。仲間集めが少し有利になる。');
      STATE.heroStory++;
      break;

    case 'town':
      addLog('勇者は街で買い物をした。装備が少し強化された。');
      STATE.heroStatsBonus += 2;
      break;

    case 'cave':
      addLog('勇者は洞窟でモンスターと遭遇した！');
      startAutoBattle('cave');
      break;

    case 'spring':
      const heal = 30;
      STATE.heroHP = Math.min(STATE.heroMaxHP, STATE.heroHP + heal);
      addLog('精霊の泉の力で勇者のHPが '+heal+' 回復した！');
      break;

    case 'chest':
      triggerChestEvent();
      break;

    case 'castle':
      addLog('勇者はついに魔王城へ到達した！');
      break;
  }
}

/* ============================================================
   宝箱イベント
============================================================ */
function triggerChestEvent(){
  const r = Math.random();
  if(r < 0.33){
    STATE.heroGold += 50;
    addLog('宝箱の中には金貨50枚が入っていた！');
  } else if(r < 0.66){
    STATE.heroStatsBonus += 5;
    addLog('宝箱の中には不思議な薬があり、勇者の能力が上昇した！');
  } else {
    STATE.heroHP = Math.max(1, STATE.heroHP - 20);
    addLog('宝箱は罠だった！勇者はダメージを受けた！');
  }
}

/* ============================================================
   魔王軍：モンスター召喚
============================================================ */
function chooseSummon(){
  showChoices([
    {
      label:'スライム',
      onSelect:()=>{
        STATE.maouMonsters.push('slime');
        addLog('魔王はスライムを召喚した！');
        endMaouSetup();
      }
    },
    {
      label:'ゾンビ',
      onSelect:()=>{
        STATE.maouMonsters.push('zombie');
        addLog('魔王はゾンビを召喚した！');
        endMaouSetup();
      }
    },
    {
      label:'ドラゴン',
      onSelect:()=>{
        STATE.maouMonsters.push('dragon');
        addLog('魔王はドラゴンを召喚した！');
        endMaouSetup();
      }
    }
  ]);
}

/* ============================================================
   魔王軍：トラップ設置
============================================================ */
function chooseTrap(){
  showChoices([
    {
      label:'毒霧トラップ',
      onSelect:()=>{
        STATE.pendingTrap = 'poison';
        addLog('魔王は毒霧トラップを設置した！');
        endMaouSetup();
      }
    },
    {
      label:'落とし穴',
      onSelect:()=>{
        STATE.pendingTrap = 'hole';
        addLog('魔王は落とし穴を設置した！');
        endMaouSetup();
      }
    }
  ]);
}

/* ============================================================
   勇者軍：仲間集め
============================================================ */
function heroRecruit(){
  const r = Math.random();
  if(r < 0.5){
    STATE.heroParty.push('戦士');
    addLog('勇者は戦士を仲間にした！');
  } else {
    STATE.heroParty.push('魔法使い');
    addLog('勇者は魔法使いを仲間にした！');
  }
  endHeroSetup();
}

/* ============================================================
   勇者軍：装備強化
============================================================ */
function heroEquip(){
  STATE.heroStatsBonus += 3;
  addLog('勇者は装備を強化した！能力が上昇！');
  endHeroSetup();
}

/* ============================================================
   洞窟での自動戦闘
============================================================ */
function startAutoBattle(type){
  let dmg = 10 + STATE.heroStatsBonus;
  STATE.heroHP -= dmg;
  addLog('洞窟のモンスターとの戦闘で勇者は '+dmg+' のダメージを受けた！');

  if(STATE.heroHP <= 0){
    STATE.heroHP = 0;
    STATE.winner = 'MAOU';
    STATE.phase = 'FINAL';
    startFinalBattleIntro();
  }
}
/* ============================================================
   最終決戦：導入
============================================================ */
function startFinalBattleIntro(){
  showOverlay(
    '最終決戦が始まる…！\n\n勇者と魔王、運命の対決！',
    '戦闘開始',
    ()=>{
      STATE.finalBattleStarted = true;
      startFinalBattle();
    }
  );
}

/* ============================================================
   最終決戦：戦闘処理
============================================================ */
function startFinalBattle(){
  clearCanvas();
  updatePhaseLabel();
  updateHPLabel();

  // 勇者と魔王を描画
  drawHeroSprite(40, 60);
  drawMaouSprite(160, 60);

  // 魔王軍のモンスターを描画
  let mx = 120;
  let my = 100;
  STATE.maouMonsters.forEach(m=>{
    drawMonster(m, mx, my);
    mx += 20;
  });

  // 戦闘ロジック
  finalBattleRound();
}

/* ============================================================
   最終決戦：1ラウンド処理
============================================================ */
function finalBattleRound(){
  // 勇者の攻撃力
  let heroAtk = 20 + STATE.heroStatsBonus + STATE.heroParty.length * 5;

  // 魔王の防御力
  let maouDef = 10 + STATE.maouCastleDefense;

  // ダメージ計算
  let dmgToMaou = Math.max(1, heroAtk - maouDef);
  let dmgToHero = 15 + STATE.maouMonsters.length * 5;

  STATE.maouHP -= dmgToMaou;
  STATE.heroHP -= dmgToHero;

  addLog('勇者の攻撃！ 魔王に ' + dmgToMaou + ' ダメージ！');
  addLog('魔王の反撃！ 勇者に ' + dmgToHero + ' ダメージ！');

  updateHPLabel();

  // 勝敗判定
  if(STATE.maouHP <= 0){
    STATE.maouHP = 0;
    STATE.winner = 'HERO';
    endGame();
    return;
  }
  if(STATE.heroHP <= 0){
    STATE.heroHP = 0;
    STATE.winner = 'MAOU';
    endGame();
    return;
  }

  // 次のラウンドへ
  setTimeout(()=>{
    startFinalBattle();
  }, 1200);
}

/* ============================================================
   ゲーム終了
============================================================ */
function endGame(){
  let msg = '';

  if(STATE.winner === 'HERO'){
    msg = '勇者は魔王を倒した！\n世界に平和が訪れた！';
  } else {
    msg = '魔王は勇者を打ち倒した！\n世界は闇に包まれた…';
  }

  showOverlay(
    msg + '\n\nゲーム終了',
    'タイトルへ戻る',
    ()=>{
      location.reload();
    }
  );
}

/* ============================================================
   ここまでで app.js 完全版が終了
============================================================ */
})();

