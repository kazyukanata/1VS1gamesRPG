(()=>{

const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');
const phaseLabel = document.getElementById('phaseLabel');
const hpLabel = document.getElementById('hpLabel');
const logBox = document.getElementById('log');
const overlay = document.getElementById('overlay');
const overlayText = document.getElementById('overlayText');
const overlayBtn = document.getElementById('overlayBtn');

function addLog(msg){
  const p = document.createElement('div');
  p.textContent = msg;
  logBox.appendChild(p);
  logBox.scrollTop = logBox.scrollHeight;
}

function showOverlay(text, btnLabel, onClick){
  overlayText.textContent = text;
  overlayBtn.textContent = btnLabel;
  overlay.classList.remove('hidden');
  overlayBtn.onclick = ()=>{
    overlay.classList.add('hidden');
    onClick();
  };
}

function clearCanvas(){
  ctx.fillStyle = '#000';
  ctx.fillRect(0,0,canvas.width,canvas.height);
}

function drawHeroSprite(x,y){
  ctx.fillStyle = '#0f0';
  ctx.fillRect(x,y,20,20);
}

function drawMaouSprite(x,y){
  ctx.fillStyle = '#f00';
  ctx.fillRect(x,y,20,20);
}

function drawMonster(type,x,y){
  ctx.fillStyle = '#ff0';
  ctx.fillRect(x,y,15,15);
}

const STATE = {
  phase:'TITLE',
  heroHP:100,
  heroMaxHP:100,
  maouHP:120,
  maouMaxHP:120,
  heroStatsBonus:0,
  heroParty:[],
  maouMonsters:[],
  maouCastleDefense:0,
  heroGold:0,
  heroStory:0,
  pendingTrap:null,
  mainMapPos:0,
  turn:1,
  maxTurn:10,
  finalBattleStarted:false,
  winner:null,
  mainMap:['village','town','cave','spring','chest','town','cave','spring','chest','castle']
};

function drawMainMap(){
  clearCanvas();
  ctx.fillStyle='#fff';
  ctx.font='14px sans-serif';
  ctx.fillText('勇者の位置: '+STATE.mainMapPos,10,20);
  ctx.fillText('マス: '+STATE.mainMap[STATE.mainMapPos],10,40);
}

function updateHPLabel(){
  if(STATE.phase==='MAOU_SETUP'){
    hpLabel.textContent = '魔王 HP: '+STATE.maouHP+' / '+STATE.maouMaxHP;
  } else if(STATE.phase==='HERO_SETUP'){
    hpLabel.textContent = '勇者 HP: '+STATE.heroHP+' / '+STATE.heroMaxHP;
  } else {
    hpLabel.textContent =
      '勇者 HP: '+STATE.heroHP+' / '+STATE.heroMaxHP+
      ' | 魔王 HP: '+STATE.maouHP+' / '+STATE.maouMaxHP;
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

function startMaouSetup(){
  updatePhaseLabel();
  updateHPLabel();
  drawMainMap();

  showChoices([
    {label:'モンスター召喚',onSelect:()=>{ chooseSummon(); }},
    {label:'トラップ設置',onSelect:()=>{ chooseTrap(); }},
    {label:'城の防御強化',onSelect:()=>{
      STATE.maouCastleDefense += 10;
      addLog('魔王城の防御力が上昇した！');
      endMaouSetup();
    }}
  ]);
}

function showChoices(list){
  overlay.classList.remove('hidden');
  overlayText.textContent = '選択してください';
  overlayBtn.textContent = list[0].label;
  overlayBtn.onclick = ()=>{
    overlay.classList.add('hidden');
    list[0].onSelect();
  };
}

function endMaouSetup(){
  STATE.phase = 'HERO_SETUP';
  updatePhaseLabel();
  startHeroSetup();
}

function startHeroSetup(){
  updatePhaseLabel();
  updateHPLabel();
  drawMainMap();

  showChoices([
    {label:'仲間を集める',onSelect:()=>{ heroRecruit(); }},
    {label:'装備を整える',onSelect:()=>{ heroEquip(); }},
    {label:'休息する',onSelect:()=>{
      STATE.heroHP = Math.min(STATE.heroMaxHP, STATE.heroHP + 20);
      addLog('勇者は休息し、HPが回復した！');
      endHeroSetup();
    }}
  ]);
}

function endHeroSetup(){
  STATE.phase = 'MOVE';
  updatePhaseLabel();
  startMovePhase();
}

function startMovePhase(){
  updatePhaseLabel();
  updateHPLabel();
  drawMainMap();

  STATE.mainMapPos = Math.min(STATE.mainMapPos + 1, STATE.maxTurn - 1);
  addLog('勇者は前進した！');

  drawMainMap();

  const cell = STATE.mainMap[STATE.mainMapPos];
  triggerMapEvent(cell);

  if(cell==='castle'){
    STATE.phase = 'FINAL';
    updatePhaseLabel();
    startFinalBattleIntro();
    return;
  }

  STATE.turn++;
  if(STATE.turn > STATE.maxTurn){
    STATE.phase = 'FINAL';
    updatePhaseLabel();
    startFinalBattleIntro();
    return;
  }

  STATE.phase = 'MAOU_SETUP';
  updatePhaseLabel();
  startMaouSetup();
}

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

function chooseSummon(){
  STATE.maouMonsters.push('slime');
  addLog('魔王はスライムを召喚した！');
  endMaouSetup();
}

function chooseTrap(){
  STATE.pendingTrap = 'poison';
  addLog('魔王は毒霧トラップを設置した！');
  endMaouSetup();
}

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

function heroEquip(){
  STATE.heroStatsBonus += 3;
  addLog('勇者は装備を強化した！能力が上昇！');
  endHeroSetup();
}

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

function startFinalBattle(){
  clearCanvas();
  updatePhaseLabel();
  updateHPLabel();

  drawHeroSprite(40, 60);
  drawMaouSprite(160, 60);

  let mx = 120;
  let my = 100;
  STATE.maouMonsters.forEach(m=>{
    drawMonster(m, mx, my);
    mx += 20;
  });

  finalBattleRound();
}

function finalBattleRound(){
  let heroAtk = 20 + STATE.heroStatsBonus + STATE.heroParty.length * 5;
  let maouDef = 10 + STATE.maouCastleDefense;

  let dmgToMaou = Math.max(1, heroAtk - maouDef);
  let dmgToHero = 15 + STATE.maouMonsters.length * 5;

  STATE.maouHP -= dmgToMaou;
  STATE.heroHP -= dmgToHero;

  addLog('勇者の攻撃！ 魔王に ' + dmgToMaou + ' ダメージ！');
  addLog('魔王の反撃！ 勇者に ' + dmgToHero + ' ダメージ！');

  updateHPLabel();

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

  setTimeout(()=>{
    startFinalBattle();
  }, 1200);
}

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

})();
