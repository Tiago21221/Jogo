// Mines Game Script
const BOARD_SIZE = 5;
let minesCount = 3;
let minesBet = 1;
let saldo = 1000;
let mines = [];
let revealed = [];
let playing = false;
let safeRevealed = 0;
let multiplier = 1;
let currentUser = localStorage.getItem('currentUser');

const saldoSpan = document.getElementById('saldo');
const minesCountInput = document.getElementById('mines-count');
const minesBetInput = document.getElementById('mines-bet');
const minesBoard = document.getElementById('mines-board');
const minesMsg = document.getElementById('mines-msg');
const minesResult = document.getElementById('mines-result');
const btnStart = document.getElementById('btn-start-mines');
const btnCashout = document.getElementById('btn-cashout');

function loadMinesSaldo() {
  const users = JSON.parse(localStorage.getItem('users') || '[]');
  const user = users.find(u => u.username === currentUser);
  if (user) {
    saldo = user.saldo;
    saldoSpan.innerText = saldo;
  }
}
function saveMinesSaldo() {
  const users = JSON.parse(localStorage.getItem('users') || '[]');
  const idx = users.findIndex(u => u.username === currentUser);
  if (idx !== -1) {
    users[idx].saldo = saldo;
    localStorage.setItem('users', JSON.stringify(users));
  }
}

function startMinesGame() {
  minesCount = Math.max(1, Math.min(24, parseInt(minesCountInput.value)));
  minesBet = Math.max(1, parseInt(minesBetInput.value));
  if (saldo < minesBet) {
    minesMsg.innerText = 'Saldo insuficiente!';
    return;
  }
  saldo -= minesBet;
  saveMinesSaldo();
  saldoSpan.innerText = saldo;
  minesMsg.innerText = '';
  minesResult.innerText = '';
  playing = true;
  safeRevealed = 0;
  multiplier = 1;
  revealed = Array(BOARD_SIZE * BOARD_SIZE).fill(false);
  // Gerar minas
  mines = [];
  while (mines.length < minesCount) {
    let idx = Math.floor(Math.random() * (BOARD_SIZE * BOARD_SIZE));
    if (!mines.includes(idx)) mines.push(idx);
  }
  renderMinesBoard();
  btnStart.style.display = 'none';
  btnCashout.style.display = 'inline-block';
}

function renderMinesBoard() {
  let html = '';
  for (let i = 0; i < BOARD_SIZE * BOARD_SIZE; i++) {
    let content = '';
    let style = 'background:#1a2332; color:#8fd6ff; border-radius:18px; font-size:2.7em; font-weight:bold; border:3px solid #3ec6ff; height:120px; width:120px; display:flex; align-items:center; justify-content:center; cursor:pointer; box-shadow:0 6px 32px #0007, 0 0 16px #3ec6ff22 inset; transition:background 0.2s, color 0.2s, box-shadow 0.2s; position:relative;';
    if (revealed[i]) {
      if (mines.includes(i)) {
        // SVG bomba
        content = `<svg width='48' height='48' viewBox='0 0 48 48'><circle cx='24' cy='24' r='18' fill='#2d2d3a'/><circle cx='24' cy='24' r='15' fill='#3ec6ff'/><circle cx='24' cy='24' r='12' fill='#1a2332'/><circle cx='24' cy='24' r='10' fill='#ff4444'/><rect x='22' y='8' width='4' height='10' fill='#ffb300' rx='2' transform='rotate(-20 24 13)'/></svg>`;
        style += 'background:#2d2d3a;';
      } else {
        // SVG diamante
        content = `<svg width='48' height='48' viewBox='0 0 48 48'><polygon points='24,6 42,18 24,42 6,18' fill='#3ec6ff' stroke='#8fd6ff' stroke-width='2'/><polygon points='24,6 36,18 24,42 12,18' fill='#8fd6ff' stroke='#3ec6ff' stroke-width='1.5'/></svg>`;
        style += 'background:#22304a;';
      }
    } else {
      style += 'filter:brightness(1);';
    }
    html += `<div style='${style}' onclick='revealMinesCell(${i})' onmouseover='this.style.boxShadow="0 0 32px #3ec6ff88, 0 6px 32px #0007"' onmouseout='this.style.boxShadow="0 6px 32px #0007, 0 0 16px #3ec6ff22 inset"'>${content}</div>`;
  }
  minesBoard.innerHTML = html;
}

function updateBarInfo() {
  document.getElementById('mines-bar-ganho').innerText = `Ganho: R$ ${(safeRevealed > 0 ? (minesBet * multiplier).toFixed(2) : '0,00')}`;
  document.getElementById('mines-bar-mult').innerText = `Multiplicador: x${multiplier.toFixed(2)}`;
}

function revealMinesCell(idx) {
  if (!playing || revealed[idx]) return;
  revealed[idx] = true;
  if (mines.includes(idx)) {
    // Perdeu: revelar todas as casas
    for (let i = 0; i < revealed.length; i++) {
      revealed[i] = true;
    }
    renderMinesBoard();
    minesMsg.innerText = '💥 Você acertou uma mina!';
    btnStart.style.display = 'inline-block';
    btnCashout.style.display = 'none';
    playing = false;
    updateBarInfo();
    return;
  } else {
    safeRevealed++;
    multiplier = getMinesMultiplier(safeRevealed, minesCount);
    renderMinesBoard();
    minesResult.innerText = `Multiplicador: x${multiplier.toFixed(2)} | Possível ganho: R$ ${(minesBet * multiplier).toFixed(2)}`;
    updateBarInfo();
  }
}

function getMinesMultiplier(safe, mines) {
  // Fórmula aproximada de cassino
  let total = BOARD_SIZE * BOARD_SIZE;
  let prob = 1;
  for (let i = 0; i < safe; i++) {
    prob *= (total - mines - i) / (total - i);
  }
  return 0.97 / prob; // 3% house edge
}

function cashoutMines() {
  if (!playing || safeRevealed === 0) return;
  let ganho = Math.round(minesBet * multiplier * 100) / 100;
  saldo += ganho;
  saveMinesSaldo();
  saldoSpan.innerText = saldo;
  minesMsg.innerText = `💰 Você sacou R$ ${ganho.toFixed(2)}!`;
  minesResult.innerText = '';
  btnStart.style.display = 'inline-block';
  btnCashout.style.display = 'none';
  playing = false;
  renderMinesBoard();
  updateBarInfo();
}

btnStart.onclick = startMinesGame;
btnCashout.onclick = cashoutMines;
window.addEventListener('DOMContentLoaded', () => {
  loadMinesSaldo();
  renderMinesBoard();
  updateBarInfo();
}); 