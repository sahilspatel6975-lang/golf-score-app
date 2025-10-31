// Golf Scorekeeper logic
const holesSel = document.getElementById('holes');
const playerCountSel = document.getElementById('playerCount');
const playerNamesDiv = document.getElementById('playerNames');
const tableEl = document.getElementById('scoreTable');
const totalsBar = document.getElementById('totalsBar');
const undoBtn = document.getElementById('undoBtn');
const clearLastBtn = document.getElementById('clearLastBtn');
const resetBtn = document.getElementById('resetBtn');
const wakeLockBtn = document.getElementById('wakeLockBtn');

let state = {
  holes: 18,
  playerCount: 4,
  names: ['Player 1','Player 2','Player 3','Player 4'],
  scores: [], // [holeIndex][playerIndex] = strokes (number or null)
  lastEdits: [] // stack of {row, col, prev, next}
};

// ---------- Persistence ----------
const KEY = 'golf_score_state_v1';
function save() {
  localStorage.setItem(KEY, JSON.stringify(state));
}
function load() {
  const raw = localStorage.getItem(KEY);
  if(!raw) return;
  try{
    const obj = JSON.parse(raw);
    if (obj && typeof obj === 'object') {
      state = Object.assign(state, obj);
    }
  }catch(e){ console.warn('Bad state', e); }
}

// ---------- UI Builders ----------
function buildNamesInputs() {
  playerNamesDiv.innerHTML = '';
  for (let i=0;i<state.playerCount;i++){
    const row = document.createElement('div');
    row.className = 'row';
    const label = document.createElement('label');
    label.textContent = `P${i+1}:`;
    const input = document.createElement('input');
    input.type = 'text';
    input.value = state.names[i] || `Player ${i+1}`;
    input.placeholder = `Player ${i+1}`;
    input.addEventListener('input', ()=>{
      state.names[i] = input.value || `Player ${i+1}`;
      renderTotals();
      save();
    });
    row.appendChild(label);
    row.appendChild(input);
    playerNamesDiv.appendChild(row);
  }
}
function ensureScoresGrid(){
  const rows = state.holes;
  const cols = state.playerCount;
  // Resize rows
  if (!Array.isArray(state.scores)) state.scores = [];
  if (state.scores.length < rows){
    for(let r=state.scores.length; r<rows; r++){
      state.scores[r] = Array(cols).fill(null);
    }
  } else if (state.scores.length > rows){
    state.scores.length = rows;
  }
  // Resize columns for each row
  for(let r=0;r<rows;r++){
    if (!Array.isArray(state.scores[r])) state.scores[r] = [];
    if (state.scores[r].length < cols){
      for(let c=state.scores[r].length; c<cols; c++) state.scores[r][c]=null;
    } else if (state.scores[r].length > cols){
      state.scores[r].length = cols;
    }
  }
}
function buildTable(){
  tableEl.innerHTML = '';
  const thead = document.createElement('thead');
  const htr = document.createElement('tr');
  let th = document.createElement('th'); th.textContent = 'Hole'; htr.appendChild(th);
  for (let c=0;c<state.playerCount;c++){
    const thp = document.createElement('th');
    thp.textContent = state.names[c] || `Player ${c+1}`;
    htr.appendChild(thp);
  }
  thead.appendChild(htr);
  const tbody = document.createElement('tbody');

  for (let r=0;r<state.holes;r++){
    const tr = document.createElement('tr');
    const tdHole = document.createElement('td');
    tdHole.textContent = (r+1);
    tr.appendChild(tdHole);

    for (let c=0;c<state.playerCount;c++){
      const td = document.createElement('td');
      const inp = document.createElement('input');
      inp.className = 'stroke';
      inp.type = 'number';
      inp.inputMode = 'numeric';
      inp.min = '0';
      inp.placeholder = '-';
      inp.value = state.scores[r][c] ?? '';
      inp.addEventListener('focus', ()=> inp.select());
      inp.addEventListener('input', (e)=> onCellEdit(r,c, e.target.value));
      td.appendChild(inp);
      tr.appendChild(td);
    }

    tbody.appendChild(tr);
  }

  tableEl.appendChild(thead);
  tableEl.appendChild(tbody);
}
function renderTotals(){
  totalsBar.innerHTML = '';
  const sums = getSums();
  for(let i=0;i<state.playerCount;i++){
    const badge = document.createElement('div');
    badge.className = 'badge';
    const name = document.createElement('span');
    name.className = 'name';
    name.textContent = state.names[i] || `Player ${i+1}`;
    const sum = document.createElement('span');
    sum.className = 'sum';
    sum.textContent = (sums[i] ?? 0);
    badge.appendChild(name);
    badge.appendChild(sum);
    totalsBar.appendChild(badge);
  }
}

// ---------- Logic ----------
function onCellEdit(r,c,val){
  let parsed = (val === '' ? null : Math.max(0, parseInt(val,10) || 0));
  const prev = state.scores[r][c];
  if (prev === parsed) return;
  state.scores[r][c] = parsed;
  state.lastEdits.push({row:r,col:c,prev,next:parsed});
  if (state.lastEdits.length>200) state.lastEdits.shift();
  renderTotals();
  save();
}
function getSums(){
  const sums = Array(state.playerCount).fill(0);
  for (let r=0;r<state.holes;r++){
    for (let c=0;c<state.playerCount;c++){
      const v = state.scores[r][c];
      if (typeof v === 'number') sums[c]+=v;
    }
  }
  return sums;
}
function undo(){
  const edit = state.lastEdits.pop();
  if (!edit) return;
  state.scores[edit.row][edit.col] = edit.prev ?? null;
  // reflect in UI
  const tbody = tableEl.tBodies[0];
  const rowEl = tbody.rows[edit.row];
  const inputEl = rowEl.cells[edit.col+1].querySelector('input.stroke');
  inputEl.value = (edit.prev ?? '');
  renderTotals();
  save();
}
function clearLast(){
  const tbody = tableEl.tBodies[0];
  // find the last non-empty cell scanning backwards
  for (let r=state.holes-1; r>=0; r--){
    for (let c=state.playerCount-1; c>=0; c--){
      if (state.scores[r][c] != null){
        state.lastEdits.push({row:r,col:c,prev:state.scores[r][c],next:null});
        state.scores[r][c] = null;
        const rowEl = tbody.rows[r];
        const inputEl = rowEl.cells[c+1].querySelector('input.stroke');
        inputEl.value = '';
        renderTotals();
        save();
        return;
      }
    }
  }
}
function fullReset(){
  if (!confirm('Clear all scores and settings?')) return;
  const holes = state.holes, pc = state.playerCount;
  state = {
    holes, playerCount: pc,
    names: Array.from({length:pc}, (_,i)=>`Player ${i+1}`),
    scores: Array.from({length:holes}, ()=> Array(pc).fill(null)),
    lastEdits: []
  };
  holesSel.value = String(holes);
  playerCountSel.value = String(pc);
  buildNamesInputs();
  buildTable();
  renderTotals();
  save();
}

// ---------- Wake Lock ----------
let wakeLock = null;
async function requestWakeLock(){
  try{
    wakeLock = await navigator.wakeLock.request('screen');
    wakeLockBtn.textContent = 'Screen Awake: ON';
    wakeLock.addEventListener('release', ()=>{
      wakeLockBtn.textContent = 'Keep Screen Awake';
    });
  }catch(err){
    alert('Screen Wake Lock not supported on this device/browser.');
  }
}
document.addEventListener('visibilitychange', async ()=>{
  if (wakeLock && document.visibilityState === 'visible'){
    try{ wakeLock = await navigator.wakeLock.request('screen'); }catch{}
  }
});

// ---------- Init ----------
function rebuildAll(){
  ensureScoresGrid();
  buildNamesInputs();
  buildTable();
  renderTotals();
  save();
}

function init(){
  load();
  holesSel.value = String(state.holes);
  playerCountSel.value = String(state.playerCount);

  holesSel.addEventListener('change', ()=>{
    state.holes = parseInt(holesSel.value,10);
    rebuildAll();
  });
  playerCountSel.addEventListener('change', ()=>{
    state.playerCount = parseInt(playerCountSel.value,10);
    // keep previous names, extend if needed
    while(state.names.length < state.playerCount){
      state.names.push(`Player ${state.names.length+1}`);
    }
    state.names.length = state.playerCount;
    rebuildAll();
  });

  undoBtn.addEventListener('click', undo);
  clearLastBtn.addEventListener('click', clearLast);
  resetBtn.addEventListener('click', fullReset);
  wakeLockBtn.addEventListener('click', requestWakeLock);

  rebuildAll();
}
init();
