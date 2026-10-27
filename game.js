const canvas = document.getElementById("gameCanvas");
const ctx = canvas.getContext("2d");
const scoreEl = document.getElementById("score");
const highScoreEl = document.getElementById("highScore");
const applesEl = document.getElementById("apples");
const targetEl = document.getElementById("target");
const levelLabel = document.getElementById("levelLabel");
const levelName = document.getElementById("levelName");
const progressFill = document.getElementById("progressFill");
const challengeText = document.getElementById("challengeText");
const statusText = document.getElementById("statusText");
const status = document.querySelector(".status");
const overlay = document.getElementById("gameOverlay");
const overlayIcon = document.getElementById("overlayIcon");
const overlayEyebrow = document.getElementById("overlayEyebrow");
const overlayTitle = document.getElementById("overlayTitle");
const overlayMessage = document.getElementById("overlayMessage");
const overlayButton = document.getElementById("overlayButton");
const replayLevelButton = document.getElementById("replayLevelButton");

const SIZE = 24;
const levels = [
  { name: "Sprout Meadow", target: 4, speed: 145, walls: [] },
  { name: "Fern Valley", target: 5, speed: 130, walls: [{ x: 8, y: 7, w: 8, h: 1 }, { x: 8, y: 16, w: 8, h: 1 }] },
  { name: "Moonlit Grove", target: 5, speed: 115, walls: [{ x: 5, y: 5, w: 1, h: 14 }, { x: 18, y: 5, w: 1, h: 14 }] },
  { name: "Thorn Passage", target: 6, speed: 102, walls: [{ x: 4, y: 6, w: 7, h: 1 }, { x: 13, y: 6, w: 7, h: 1 }, { x: 4, y: 17, w: 7, h: 1 }, { x: 13, y: 17, w: 7, h: 1 }] },
  { name: "Wild Labyrinth", target: 6, speed: 90, spawn: { x: 12, y: 8, direction: { x: 1, y: 0 } }, walls: [{ x: 5, y: 4, w: 1, h: 7 }, { x: 5, y: 13, w: 1, h: 7 }, { x: 18, y: 4, w: 1, h: 7 }, { x: 18, y: 13, w: 1, h: 7 }, { x: 9, y: 11, w: 6, h: 2 }] },
  { name: "The Grand Orchard", target: 8, speed: 78, walls: [{ x: 3, y: 4, w: 7, h: 1 }, { x: 14, y: 4, w: 7, h: 1 }, { x: 3, y: 19, w: 7, h: 1 }, { x: 14, y: 19, w: 7, h: 1 }, { x: 4, y: 8, w: 1, h: 8 }, { x: 19, y: 8, w: 1, h: 8 }] }
];

let highScore = Number(localStorage.getItem("neon-orchard-high-score") || 0);
let levelIndex = 0, score = 0, collected = 0, snake = [], apple = null;
let direction = { x: 1, y: 0 }, queuedDirection = direction, timer = null;
let playing = true, paused = false, awaitingInput = true, soundOn = true;

function resetLevel() {
  const spawn = levels[levelIndex].spawn || { x: Math.floor(SIZE / 2), y: Math.floor(SIZE / 2), direction: { x: 1, y: 0 } };
  const directionSign = spawn.direction;
  snake = [
    { x: spawn.x, y: spawn.y },
    { x: spawn.x - directionSign.x, y: spawn.y - directionSign.y },
    { x: spawn.x - directionSign.x * 2, y: spawn.y - directionSign.y * 2 }
  ];
  direction = directionSign; queuedDirection = direction; collected = 0; paused = false; playing = true; awaitingInput = true;
  placeApple(); updateHud(); updateStatus(); startTimer(); draw();
}

function startTimer() {
  clearInterval(timer);
  timer = setInterval(tick, levels[levelIndex].speed);
}

function placeApple() {
  const level = levels[levelIndex];
  const open = [];
  for (let y = 1; y < SIZE - 1; y++) for (let x = 1; x < SIZE - 1; x++) {
    if (!snake.some(part => part.x === x && part.y === y) && !level.walls.some(w => x >= w.x && x < w.x + w.w && y >= w.y && y < w.y + w.h)) open.push({ x, y });
  }
  apple = open[Math.floor(Math.random() * open.length)];
}

function tick() {
  if (!playing || paused || awaitingInput) return;
  direction = queuedDirection;
  const head = { x: snake[0].x + direction.x, y: snake[0].y + direction.y };
  const level = levels[levelIndex];
  const hitWall = head.x < 0 || head.x >= SIZE || head.y < 0 || head.y >= SIZE ||
    level.walls.some(w => head.x >= w.x && head.x < w.x + w.w && head.y >= w.y && head.y < w.y + w.h);
  const ate = apple && head.x === apple.x && head.y === apple.y;
  const bodyToCheck = ate ? snake : snake.slice(0, -1);
  if (hitWall || bodyToCheck.some(part => part.x === head.x && part.y === head.y)) return endGame();
  snake.unshift(head);
  if (ate) {
    collected++; score += 10; highScore = Math.max(highScore, score);
    localStorage.setItem("neon-orchard-high-score", String(highScore));
    if (collected >= level.target) return advanceLevel();
    placeApple();
  } else snake.pop();
  updateHud(); draw();
}

function advanceLevel() {
  clearInterval(timer);
  if (levelIndex === levels.length - 1) return finishGame();
  levelIndex++; playing = false; updateHud(); updateStatus();
  showOverlay("LEVEL COMPLETE", `${levels[levelIndex - 1].name} cleared.`, "Replay this garden or continue to the next challenge.", "Continue");
  replayLevelButton.classList.remove("hidden");
}

function endGame() {
  playing = false; clearInterval(timer); updateStatus();
  showOverlay("RUN ENDED", "The orchard got you.", `Try level ${levelIndex + 1} again. Your run stays on this level.`, "Try level again", "×");
}

function finishGame() {
  playing = false; updateStatus();
  showOverlay("ORCHARD COMPLETE", "You grew a legend.", `All six gardens cleared with a score of ${String(score).padStart(4, "0")}.`, "Play again");
}

function showOverlay(eyebrow, title, message, button, icon = "✦") {
  overlayEyebrow.textContent = eyebrow; overlayTitle.textContent = title; overlayMessage.textContent = message; overlayButton.textContent = button; overlayIcon.textContent = icon;
  replayLevelButton.classList.toggle("hidden", eyebrow !== "LEVEL COMPLETE");
  overlay.classList.remove("hidden");
}

function updateHud() {
  const level = levels[levelIndex];
  scoreEl.textContent = String(score).padStart(4, "0"); highScoreEl.textContent = String(highScore).padStart(4, "0");
  applesEl.textContent = collected; targetEl.textContent = level.target; levelLabel.textContent = `${String(levelIndex + 1).padStart(2, "0")} / 06`;
  levelName.textContent = level.name; challengeText.textContent = `CHALLENGE ${String(levelIndex + 1).padStart(2, "0")}`;
  progressFill.style.width = `${((levelIndex + collected / level.target) / levels.length) * 100}%`;
}

function updateStatus() {
  const isActive = playing && !paused;
  statusText.textContent = isActive ? awaitingInput ? "READY TO RUN" : "RUN ACTIVE" : paused ? "RUN PAUSED" : "RUN COMPLETE";
  status.classList.toggle("paused", paused || !playing);
}

function draw() {
  const cell = canvas.width / SIZE, level = levels[levelIndex];
  ctx.fillStyle = "#0b2019"; ctx.fillRect(0, 0, canvas.width, canvas.height);
  ctx.strokeStyle = "rgba(130, 215, 164, .075)"; ctx.lineWidth = 1;
  for (let i = 1; i < SIZE; i++) { ctx.beginPath(); ctx.moveTo(i * cell, 0); ctx.lineTo(i * cell, canvas.height); ctx.stroke(); ctx.beginPath(); ctx.moveTo(0, i * cell); ctx.lineTo(canvas.width, i * cell); ctx.stroke(); }
  level.walls.forEach(w => {
    ctx.fillStyle = "#244b3a"; ctx.shadowColor = "rgba(112, 218, 144, .2)"; ctx.shadowBlur = 12; roundRect(w.x * cell + 2, w.y * cell + 2, w.w * cell - 4, w.h * cell - 4, 6); ctx.fill(); ctx.shadowBlur = 0;
    ctx.fillStyle = "rgba(151, 219, 148, .28)"; ctx.fillRect(w.x * cell + 7, w.y * cell + 7, Math.max(2, w.w * cell - 14), 2);
  });
  if (apple) {
    const ax = apple.x * cell + cell / 2, ay = apple.y * cell + cell / 2;
    ctx.shadowColor = "#ff845d"; ctx.shadowBlur = 22; ctx.fillStyle = "#ff845d"; ctx.beginPath(); ctx.arc(ax, ay + 2, cell * .28, 0, Math.PI * 2); ctx.fill(); ctx.shadowBlur = 0;
    ctx.fillStyle = "#ffb36e"; ctx.beginPath(); ctx.arc(ax - 4, ay - 3, cell * .1, 0, Math.PI * 2); ctx.fill();
    ctx.strokeStyle = "#8bdb86"; ctx.lineWidth = 3; ctx.beginPath(); ctx.moveTo(ax, ay - cell * .22); ctx.quadraticCurveTo(ax + 2, ay - cell * .38, ax + 8, ay - cell * .37); ctx.stroke();
  }
  snake.slice().reverse().forEach((part, index) => {
    const isHead = index === snake.length - 1; const pad = isHead ? 3 : 4;
    ctx.fillStyle = isHead ? "#c9f76e" : `hsl(${145 + Math.min(index * 2, 20)} 55% ${48 - Math.min(index, 9)}%)`;
    ctx.shadowColor = isHead ? "rgba(203,248,109,.65)" : "transparent"; ctx.shadowBlur = isHead ? 14 : 0;
    roundRect(part.x * cell + pad, part.y * cell + pad, cell - pad * 2, cell - pad * 2, 7); ctx.fill(); ctx.shadowBlur = 0;
    if (isHead) { ctx.fillStyle = "#173126"; const eyeX = direction.x < 0 ? 8 : direction.x > 0 ? cell - 8 : cell / 2 - 5; const eyeY = direction.y < 0 ? 8 : direction.y > 0 ? cell - 8 : cell / 2 - 5; ctx.beginPath(); ctx.arc(part.x * cell + eyeX, part.y * cell + eyeY, 2.2, 0, Math.PI * 2); ctx.fill(); if (direction.y === 0) { ctx.beginPath(); ctx.arc(part.x * cell + eyeX, part.y * cell + eyeY + 9, 2.2, 0, Math.PI * 2); ctx.fill(); } }
  });
}

function roundRect(x, y, w, h, radius) { ctx.beginPath(); ctx.roundRect(x, y, w, h, radius); }
function setDirection(x, y) {
  if (x + direction.x !== 0 || y + direction.y !== 0) {
    queuedDirection = { x, y };
    if (awaitingInput) { awaitingInput = false; updateStatus(); }
  }
}
document.addEventListener("keydown", event => {
  const key = event.key.toLowerCase();
  const controls = { w: [0, -1], arrowup: [0, -1], s: [0, 1], arrowdown: [0, 1], a: [-1, 0], arrowleft: [-1, 0], d: [1, 0], arrowright: [1, 0] };
  if (controls[key]) { event.preventDefault(); setDirection(...controls[key]); }
  if (key === " " || key === "p") togglePause();
});
document.getElementById("pauseButton").addEventListener("click", togglePause);
document.getElementById("restartButton").addEventListener("click", () => { levelIndex = 0; score = 0; overlay.classList.add("hidden"); resetLevel(); });
overlayButton.addEventListener("click", () => {
  const overlayType = overlayEyebrow.textContent;
  if (overlayType === "LEVEL COMPLETE") {
    overlay.classList.add("hidden");
    resetLevel();
    return;
  }
  if (overlayType === "RUN ENDED") {
    overlay.classList.add("hidden");
    resetLevel();
    return;
  }
  levelIndex = 0; score = 0; overlay.classList.add("hidden"); resetLevel();
});
replayLevelButton.addEventListener("click", () => {
  levelIndex--;
  overlay.classList.add("hidden");
  resetLevel();
});
document.getElementById("soundButton").addEventListener("click", event => { soundOn = !soundOn; event.currentTarget.classList.toggle("active", soundOn); event.currentTarget.querySelector("span").textContent = soundOn ? "Sound on" : "Sound off"; });
function togglePause() { if (!playing) return; paused = !paused; updateStatus(); document.getElementById("pauseButton").querySelector("span").textContent = paused ? "Resume" : "Pause"; }
updateHud(); resetLevel();
