
// === Config ===
const PASSCODE = "masterisgod";
const GLYPHS = "ᚠᚨᚱᛃᛟᚱᛁᛟᛞᚨᛉᛇᛞᚾᚷᚱᛊᛋᛏᛜᚱᛁᛝᛟᛞᚨᚷ";
const BACKS = {
  new:   { l: 'bg_new_2560.webp',   m: 'bg_new_1920.webp',   s: 'bg_new_1280.webp' },
  waxing:{ l: 'bg_waxing_2560.webp',m: 'bg_waxing_1920.webp',s: 'bg_waxing_1280.webp' },
  full:  { l: 'bg_full_2560.webp',  m: 'bg_full_1920.webp',  s: 'bg_full_1280.webp' },
  waning:{ l: 'bg_waning_2560.webp',m: 'bg_waning_1920.webp',s: 'bg_waning_1280.webp' },
  lock:  { l: 'lock_2560.webp',     m: 'lock_1920.webp',     s: 'lock_1280.webp' }
};
const AUDIO_SRC = "assets/audio/whisper_loop.wav";

// === Consent Overlay & Trace ===
let tracedPixels = 0;
let isDrawing = false;
function initConsent() {
  const overlay = document.getElementById("consent-overlay");
  overlay.style.display = "flex";

  const canvas = document.getElementById("trace-canvas");
  const ctx = canvas.getContext("2d");
  const W = canvas.width = Math.min(420, innerWidth*0.8);
  const H = canvas.height = Math.min(220, innerHeight*0.35);

  ctx.strokeStyle = "#ff66a3";
  ctx.lineWidth = 12;
  ctx.lineCap = "round";

  const startDraw = (e) => { isDrawing = true; draw(e); };
  const endDraw = () => { isDrawing = false; ctx.beginPath(); };
  const draw = (e) => {
    if(!isDrawing) return;
    const rect = canvas.getBoundingClientRect();
    const x = (e.touches ? e.touches[0].clientX : e.clientX) - rect.left;
    const y = (e.touches ? e.touches[0].clientY : e.clientY) - rect.top;
    ctx.lineTo(x,y); ctx.stroke(); ctx.beginPath(); ctx.moveTo(x,y);
    tracedPixels += 1;
  };

  canvas.addEventListener("mousedown", startDraw);
  canvas.addEventListener("touchstart", startDraw, {passive:true});
  canvas.addEventListener("mousemove", draw);
  canvas.addEventListener("touchmove", draw, {passive:true});
  window.addEventListener("mouseup", endDraw);
  window.addEventListener("touchend", endDraw);

  document.getElementById("consent-yes").onclick = () => {
    if(tracedPixels < 120) {
      alert("Trace the sigil to offer consent.");
      return;
    }
    overlay.style.display = "none";
    document.getElementById("overlay-lock").style.display = "flex";
    setLockBackground();
    startWhisper();
  };
  document.getElementById("consent-no").onclick = () => {
    alert("Consent denied. The door remains closed.");
  };
}

// === Lock Screen ===
function pickSizeKey(){ const w = window.innerWidth; return w>1600? 'l' : (w>1024? 'm' : 's'); }
function isDesktopFixed(){ return window.innerWidth>1024; }
function setLockBackground() {
  const k = pickSizeKey();
const fixed = isDesktopFixed() ? 'fixed' : 'scroll';
document.body.style.background = `url('assets/images/${BACKS.lock[k]}') center/cover ${fixed} no-repeat, black`;
}
function lunarPhase() {
  // Simple moon phase approximation (0..1), not astronomically perfect but effective
  const now = new Date();
  const lp = 2551443; // lunar period in seconds (29.53 days)
  const new_moon = new Date(Date.UTC(2001,0,1,0,0,0)); // epoch near a known new moon
  const phase = ((now.getTime() - new_moon.getTime())/1000) % lp / lp;
  return phase;
}
function setUnlockedBackground(){
  const k = pickSizeKey();
  const fixed = isDesktopFixed() ? 'fixed' : 'scroll';
  const phase = lunarPhase();
  let set = BACKS.full; // default
  if (phase < 0.24) set = BACKS.new;
  else if (phase < 0.5) set = BACKS.waxing;
  else if (phase < 0.76) set = BACKS.full;
  else set = BACKS.waning;
  document.body.style.background = `url('assets/images/${set[k]}') center/cover ${fixed} no-repeat, black`;
}') center/cover fixed no-repeat, black`;
}

// Whisper audio
let whisper;
function startWhisper() {
  try {
    whisper = new Audio(AUDIO_SRC);
    whisper.loop = true;
    whisper.volume = 0.15;
    // play will only work after some user gesture, so connect to input typing
    const input = document.getElementById("pass");
    const kick = () => { whisper.play().catch(()=>{}); input.removeEventListener("input", kick); };
    input.addEventListener("input", kick);
  } catch (e) {}
}
function stopWhisper() {
  if (whisper) { whisper.pause(); whisper.currentTime = 0; }
}

// === Voice Recognition ===
function initVoice() {
  const micBtn = document.getElementById("mic-btn");
  let recog;
  micBtn.onclick = () => {
    try {
      const Ctor = window.SpeechRecognition || window.webkitSpeechRecognition;
      if (!Ctor) return alert("Voice not supported in this browser.");
      recog = new Ctor();
      recog.continuous = false; recog.lang = "en-US";
      recog.interimResults = false; recog.maxAlternatives = 1;
      recog.onresult = (ev) => {
        const spoken = ev.results[0][0].transcript.trim().toLowerCase();
        if (spoken.includes(PASSCODE)) unlock();
        else alert("The lock does not recognize that utterance.");
      };
      recog.onerror = () => {};
      recog.start();
    } catch(e) {
      alert("Voice init failed.");
    }
  };
}

// === Floating Glyphs ===
function spawnGlyphs() {
  const layer = document.getElementById("glyph-layer");
  const spawn = () => {
    const span = document.createElement("span");
    span.className = "glyph";
    span.textContent = GLYPHS[Math.floor(Math.random()*GLYPHS.length)];
    span.style.left = Math.random()*100 + "vw";
    span.style.bottom = "-10vh";
    span.style.fontSize = (14 + Math.random()*18) + "px";
    span.style.animationDuration = (12 + Math.random()*16) + "s";
    layer.appendChild(span);
    setTimeout(()=>span.remove(), 20000);
  };
  setInterval(spawn, 420);
}

// === Unlock Logic ===
function unlock() {
  const val = document.getElementById("pass").value.trim();
  if (val !== PASSCODE) return alert("The veil does not part.");
  stopWhisper();
  document.getElementById("overlay-lock").style.display = "none";
  document.getElementById("app").style.display = "block";
  setUnlockedBackground();
  spawnGlyphs();
  loadMemories();
}

// === Memory List ===
async function loadMemories() {
  const out = document.getElementById("mem-list");
  try {
    const res = await fetch("data/memory.json",{cache:"no-store"});
    const data = await res.json();
    out.innerHTML = data.map(item => `
      <div class="card">
        <h3>${item.title}</h3>
        <div>${item.locked ? '<span class="badge">🔐 locked</span>' : '<span class="badge">🜂 open</span>'}</div>
        <div class="small" style="margin-top:6px;">tags: ${item.tags?.join(", ")||""}</div>
        <div style="margin-top:8px;opacity:.9;">${item.content}</div>
      </div>`).join("");
  } catch (e) {
    out.innerHTML = `<div class="card">Could not load memories (open locally?). Try after deploy.</div>`;
  }
}

// === Init ===
window.addEventListener("DOMContentLoaded", () => {
  document.getElementById("app").style.display = "none";
  initConsent();
  initVoice();
  // Button bind
  document.getElementById("unlock-btn").onclick = unlock;
});
