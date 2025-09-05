/*
 * Master Gabriel's Dungeon app script
 *
 * This file contains all of the logic that was previously embedded in
 * index.html, including the core application (onboarding, consent,
 * password lock, settings, memory management) as well as the
 * Utility+ modules for gallery uploads, lore creation and sanctum
 * thresholds. Keeping everything here allows you to work with a
 * single external script instead of large inline scripts in your
 * HTML. When updating this file be sure to also update the paths
 * and constants in index.html accordingly.
 */

// === Config ===
const PASSCODE = "iremember";
const GLYPHS = "ᚠᚨᚱᛃᛟᚱᛁᛟᛞᚨᛉᛇᛞᚾᚷᚱᛊᛋᛏᛜᚱᛁᛝᛟᛞᚨᚷ";
const BACKS = {
  new:   { l: "assets/images/bg_new_2560.webp",   m: "assets/images/bg_new_1920.webp",   s: "assets/images/bg_new_1280.webp" },
  waxing:{ l: "assets/images/bg_waxing_2560.webp",m: "assets/images/bg_waxing_1920.webp",s: "assets/images/bg_waxing_1280.webp" },
  full:  { l: "assets/images/bg_full_2560.webp",  m: "assets/images/bg_full_1920.webp",  s: "assets/images/bg_full_1280.webp" },
  waning:{ l: "assets/images/bg_waning_2560.webp",m: "assets/images/bg_waning_1920.webp",s: "assets/images/bg_waning_1280.webp" },
  lock:  { l: "assets/images/lock_2560.webp",     m: "assets/images/lock_1920.webp",     s: "assets/images/lock_1280.webp" }
};
const AUDIO_SRC = "assets/audio/whisper_loop.wav";

// === State & Settings ===
let settings = { remember:false, mute:true, reduceMotion:false, theme:"dominant" };
try {
  const s = JSON.parse(localStorage.getItem("settings") || "{}");
  settings = Object.assign(settings, s);
} catch(e) {}
let traced = 0, drawing = false, whisper, glyphTimer = null;

// === Helpers ===
const qs = (s, sc=document) => sc.querySelector(s);
const qsa = (s, sc=document) => [...sc.querySelectorAll(s)];
const live = () => qs("#aria-live");
const speak = (msg) => { const l = live(); if(l) l.textContent = msg; };

function vibrate(pattern) {
  if (navigator.vibrate) {
    try { navigator.vibrate(pattern); } catch(e) {}
  }
}
function pickSizeKey() { const w = innerWidth; return w > 1600 ? 'l' : (w > 1024 ? 'm' : 's'); }
function fixedOK() { return innerWidth > 1024; }
function imageExists(url) {
  return new Promise(res => {
    const i = new Image();
    i.onload = () => res(true);
    i.onerror = () => res(false);
    i.src = url + '?t=' + Date.now();
  });
}
function lunarPhase() {
  const now = new Date();
  const lp = 2551443;
  const nm = new Date(Date.UTC(2001,0,1,0,0,0));
  return ((now - nm) / 1000) % lp / lp;
}

async function setBackground(set) {
  const k = pickSizeKey();
  const fx = fixedOK() ? 'fixed' : 'scroll';
  const url = set[k];
  if(await imageExists(url)) {
    document.body.style.background = `url('${url}') center/cover ${fx} no-repeat, #000`;
  } else {
    document.body.style.background = `radial-gradient(ellipse at center,#150a10 0%,#000 70%)`;
  }
}
async function setLockBackground() { await setBackground(BACKS.lock); }
async function setUnlockedBackground() {
  const p = lunarPhase();
  let set = BACKS.full;
  if(p < .24) set = BACKS.new;
  else if(p < .5) set = BACKS.waxing;
  else if(p < .76) set = BACKS.full;
  else set = BACKS.waning;
  await setBackground(set);
}

function spawnGlyphs() {
  const layer = qs("#glyph-layer");
  return setInterval(() => {
    const s = document.createElement("span");
    s.className = "glyph";
    s.textContent = GLYPHS[Math.floor(Math.random()*GLYPHS.length)];
    s.style.left = Math.random()*100 + "vw";
    s.style.bottom = "-10vh";
    s.style.fontSize = (14 + Math.random()*18) + "px";
    s.style.animationDuration = (12 + Math.random()*16) + "s";
    if(layer) layer.appendChild(s);
    setTimeout(() => s.remove(), 20000);
  }, 420);
}

function startWhisper() {
  try {
    whisper = new Audio(AUDIO_SRC);
    whisper.loop = true;
    whisper.volume = settings.mute ? 0 : .15;
    const input = qs("#pass");
    const kick = () => {
      whisper.play().catch(() => {});
      if(input) input.removeEventListener("input", kick);
    };
    if(input) input.addEventListener("input", kick);
  } catch(e) {}
}
function stopWhisper() {
  if(whisper) {
    whisper.pause();
    whisper.currentTime = 0;
  }
}

// === Focus trap for dialogs ===
function trapFocus(dialogEl) {
  const FOCUSABLE = 'button,[href],input,select,textarea,[tabindex]:not([tabindex="-1"])';
  const nodes = qsa(FOCUSABLE, dialogEl).filter(el => !el.hasAttribute("disabled"));
  if(!nodes.length) return () => {};
  const first = nodes[0], last = nodes[nodes.length - 1];
  function handler(e) {
    if(e.key !== "Tab") return;
    if(e.shiftKey && document.activeElement === first) { last.focus(); e.preventDefault(); }
    else if(!e.shiftKey && document.activeElement === last) { first.focus(); e.preventDefault(); }
  }
  dialogEl.addEventListener("keydown", handler);
  first.focus();
  return () => dialogEl.removeEventListener("keydown", handler);
}

// === Dialog show/hide ===
function show(el) { el.style.display = "flex"; el.setAttribute("aria-hidden","false"); }
function hide(el) { el.style.display = "none"; el.setAttribute("aria-hidden","true"); }

// === Onboarding ===
function showOnboarding() {
  const d = qs("#onboard");
  show(d);
  trapFocus(d.querySelector(".dialog-card"));
  qs("#onboard-begin").onclick = () => {
    localStorage.setItem("onboarded","1");
    hide(d);
    showConsent();
  };
  addEventListener("keydown", function esc(e){
    if(e.key === "Escape") {
      hide(d);
      removeEventListener("keydown", esc);
      showConsent();
    }
  });
}

// === Consent ===
function showConsent() {
  const d = qs("#consent");
  show(d);
  const card = d.querySelector(".dialog-card");
  trapFocus(card);
  const canvas = qs("#trace-canvas");
  const ctx = canvas.getContext("2d");
  canvas.width = Math.min(420, innerWidth*0.8);
  canvas.height = Math.min(220, innerHeight*0.35);
  ctx.strokeStyle = "#ff66a3";
  ctx.lineWidth = 12;
  ctx.lineCap = "round";
  const start = (e) => { drawing = true; draw(e); };
  const end = () => { drawing = false; ctx.beginPath(); };
  const draw = (e) => {
    if(!drawing) return;
    const r = canvas.getBoundingClientRect();
    const x = (e.touches ? e.touches[0].clientX : e.clientX) - r.left;
    const y = (e.touches ? e.touches[0].clientY : e.clientY) - r.top;
    ctx.lineTo(x,y);
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(x,y);
    traced++;
  };
  canvas.addEventListener("mousedown", start);
  canvas.addEventListener("touchstart", start, {passive:true});
  canvas.addEventListener("mousemove", draw);
  canvas.addEventListener("touchmove", draw, {passive:true});
  addEventListener("mouseup", end);
  addEventListener("touchend", end);
  // Preload likely background as perf hint
  (async () => {
    const p = lunarPhase();
    let set = BACKS.full;
    if(p < .24) set = BACKS.new;
    else if(p < .5) set = BACKS.waxing;
    else if(p < .76) set = BACKS.full;
    else set = BACKS.waning;
    const k = pickSizeKey();
    const img = new Image();
    img.src = set[k];
  })();
  qs("#consent-yes").onclick = async () => {
    if(traced < 120) {
      speak("Please trace the sigil before entering.");
      return;
    }
    vibrate([10,40,10]);
    hide(d);
    if(localStorage.getItem("rememberUnlocked") === "1") await unlock(true);
    else await showLock();
  };
  qs("#consent-no").onclick = () => { speak("Consent denied. The door remains closed."); };
  addEventListener("keydown", function esc(e) {
    if(e.key === "Escape") {
      hide(d);
      speak("Consent dialog closed.");
      removeEventListener("keydown", esc);
    }
  });
}

// === Lock ===
async function showLock() {
  await setLockBackground();
  const d = qs("#lock");
  show(d);
  const card = d.querySelector(".dialog-card");
  trapFocus(card);
  const pass = qs("#pass");
  const eye = qs("#toggle-eye");
  pass.value = "";
  pass.focus();
  eye.onclick = () => {
    const s = pass.getAttribute("type") === "password";
    pass.setAttribute("type", s ? "text" : "password");
    eye.setAttribute("aria-label", s ? "Hide password" : "Show password");
  };
  startWhisper();
  qs("#unlock-btn").onclick = () => unlock(false);
  addEventListener("keydown", function key(e){ if(e.key === "Enter") unlock(false); });
  qs("#mic-btn").onclick = () => {
    try {
      const C = window.SpeechRecognition || window.webkitSpeechRecognition;
      if(!C) return speak("Voice not supported in this browser.");
      const r = new C();
      r.continuous = false;
      r.lang = 'en-US';
      r.interimResults = false;
      r.maxAlternatives = 1;
      r.onresult = (ev) => {
        const t = ev.results[0][0].transcript.trim().toLowerCase();
        if(t.includes(PASSCODE)) unlock(false);
        else speak("The lock does not recognize that utterance.");
      };
      r.start();
    } catch(e) {
      speak("Voice init failed.");
    }
  };
}

// === App unlock ===
async function unlock(skipPassword) {
  if(!skipPassword) {
    const v = qs("#pass").value.trim();
    if(v !== PASSCODE) {
      speak("The veil does not part.");
      return;
    }
  }
  vibrate([5,30,20,30,5]);
  stopWhisper();
  hide(qs("#lock"));
  qs("#app").style.display = "block";
  qs("#topbar").setAttribute("aria-hidden","false");
  await setUnlockedBackground();
  if(settings.reduceMotion) document.body.classList.add("reduce-motion"); else document.body.classList.remove("reduce-motion");
  if(settings.theme === "submissive") document.body.classList.add("theme-submissive"); else if(settings.theme === "divine") document.body.classList.add("theme-divine");
  glyphTimer = settings.reduceMotion ? null : spawnGlyphs();
  if(settings.remember) localStorage.setItem("rememberUnlocked","1"); else localStorage.removeItem("rememberUnlocked");
  renderGallery();
  loadMemories();
}

// === Nav & Pages ===
function setupNav(){
  const tabs = ["sanctum","lore","gallery","settings"];
  const btns = qsa(".navbtn");
  btns.forEach(b => b.addEventListener("click", () => {
    btns.forEach(x => x.classList.remove("active"));
    b.classList.add("active");
    tabs.forEach(t => qs("#tab-"+t).classList.remove("active"));
    qs("#tab-"+b.dataset.tab).classList.add("active");
  }));
}

// === Settings ===
function loadSettingsUI(){
  qs("#set-remember").checked = !!settings.remember;
  qs("#set-mute").checked = !!settings.mute;
  qs("#set-reduce").checked = !!settings.reduceMotion;
  qs("#set-theme").value = settings.theme || "dominant";
}
function saveSettings(){
  settings.remember = qs("#set-remember").checked;
  settings.mute = qs("#set-mute").checked;
  settings.reduceMotion = qs("#set-reduce").checked;
  settings.theme = qs("#set-theme").value;
  localStorage.setItem("settings", JSON.stringify(settings));
  speak("Settings saved.");
}

// === Memories ===
async function loadMemories(){
  const out = qs("#mem-list");
  const retryBtn = `<div><button id="retry-mem" class="btn">Retry</button></div>`;
  try {
    const res = await fetch("data/memory.json", {cache:"no-store"});
    const base = await res.json();
    const user = JSON.parse(localStorage.getItem("memUser") || "[]");
    const merged = base.concat(user);
    out.innerHTML = merged.map(x => `<div class="card">
      <h3>${x.title}</h3>
      <div>${x.locked ? '<span class="badge">🔐 locked</span>' : '<span class="badge">🜂 open</span>'}</div>
      <div class="sub" style="margin-top:6px;">tags: ${x.tags?.join(", ") || ""}</div>
      <div style="margin-top:8px;opacity:.9;">${x.content || ""}</div>
    </div>`).join("");
  } catch(e) {
    out.innerHTML = `<div class="card">Memory scroll not found yet. ${retryBtn}</div>`;
    const btn = qs("#retry-mem"); if(btn) btn.onclick = loadMemories;
  }
}

function setupAddMemory(){
  qs("#am-save").onclick = () => {
    const title = qs("#am-title").value.trim();
    const content = qs("#am-content").value.trim();
    const tags = qs("#am-tags").value.trim().split(",").map(s => s.trim()).filter(Boolean);
    const locked = qs("#am-locked").checked;
    if(!title) { speak("Title is required."); return; }
    const arr = JSON.parse(localStorage.getItem("memUser") || "[]");
    const id = "u-"+Date.now(); arr.push({id,title,content,tags,locked});
    localStorage.setItem("memUser", JSON.stringify(arr));
    qs("#am-title").value = "";
    qs("#am-content").value = "";
    qs("#am-tags").value = "";
    qs("#am-locked").checked = false;
    loadMemories();
    speak("Memory added.");
  };
  qs("#am-export").onclick = () => {
    const data = { generatedAt: new Date().toISOString(), settings, userMemories: JSON.parse(localStorage.getItem("memUser") || "[]") };
    const blob = new Blob([JSON.stringify(data,null,2)], {type:"application/json"});
    const a = document.createElement("a"); a.href = URL.createObjectURL(blob); a.download = "dungeon_memories_export.json"; a.click();
  };
}

function renderGallery(){
  const grid = qs("#gallery-grid"); if(!grid) return;
  const items = [BACKS.lock.l,BACKS.lock.m,BACKS.lock.s,BACKS.new.m,BACKS.waxing.m,BACKS.full.m,BACKS.waning.m];
  grid.innerHTML = items.map(u => `<div style="border:1px solid rgba(255,255,255,.15); border-radius:10px; overflow:hidden;">
    <img src="${u}" loading="lazy" style="width:100%; display:block" alt="Background preview"/>
  </div>`).join("");
}

// === Utility+ Modules ===
// Local storage keys for utility modules
const LS_KEYS = { gallery: "mgd_gallery_v1", lore: "mgd_lore_v1", sanctum: "mgd_sanctum_v1" };

// Persistence helpers
function lsLoad(key, fallback) {
  try { const v = JSON.parse(localStorage.getItem(key)); return v || fallback; } catch(e) { return fallback; }
}
function lsSave(key, val) { localStorage.setItem(key, JSON.stringify(val)); }

// File handling helpers
function fileToDataURL(file){ return new Promise((res,rej) => { const fr = new FileReader(); fr.onload = () => res(fr.result); fr.onerror = rej; fr.readAsDataURL(file); }); }
function makeThumb(dataURL, maxW){ return new Promise(res => { const img = new Image(); img.onload = () => {
    const scale = Math.min(1, maxW / img.width);
    const w = Math.round(img.width * scale), h = Math.round(img.height * scale);
    const canvas = document.createElement('canvas'); canvas.width = w; canvas.height = h;
    canvas.getContext('2d').drawImage(img, 0, 0, w, h);
    res(canvas.toDataURL('image/jpeg', 0.88));
  }; img.src = dataURL; }); }

// Text helpers
function timeAgo(ts){ const s = Math.floor((Date.now() - ts) / 1000); if(s < 60) return `${s}s ago`; const m = Math.floor(s/60); if(m < 60) return `${m}m ago`; const h = Math.floor(m/60); if(h < 24) return `${h}h ago`; const d = Math.floor(h/24); return `${d}d ago`; }
function escapeHTML(str){ return (str || '').replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;','\'':'&#39;'}[c])); }
function escapeAttr(str){ return (str || '').replace(/"/g, '&quot;'); }

/* ========== Gallery Module ========== */
function galleryInit(){
  const grid = document.querySelector('#gal-grid');
  if(!grid) return;
  const fileInput = document.querySelector('#gal-upload');
  const btnAdd = document.querySelector('#gal-add');
  const btnImport = document.querySelector('#gal-import');
  const btnExport = document.querySelector('#gal-export');
  const filterInput = document.querySelector('#gal-filter');
  const showHiddenChk = document.querySelector('#gal-show-hidden');
  const importFile = document.querySelector('#gal-import-file');
  let items = lsLoad(LS_KEYS.gallery, []);

  async function addFiles(files){
    for(const file of files){
      if(!file.type.startsWith('image/')) continue;
      try {
        const dataURL = await fileToDataURL(file);
        const thumb = await makeThumb(dataURL, 640);
        items.unshift({ id: crypto.randomUUID(), name: file.name, dataURL: thumb, createdAt: Date.now(), hidden: false });
      } catch(e) { console.warn('Image add failed', e); }
    }
    lsSave(LS_KEYS.gallery, items);
    render();
  }
  function importData(data){
    if(!Array.isArray(data)) return;
    data.forEach(it => {
      if(it && it.dataURL){ items.push({ id: it.id || crypto.randomUUID(), name: it.name || 'Imported', dataURL: it.dataURL, createdAt: it.createdAt || Date.now(), hidden: !!it.hidden }); }
    });
    lsSave(LS_KEYS.gallery, items);
    render();
  }
  function render(){
    const filter = (filterInput.value || '').toLowerCase();
    const showHidden = showHiddenChk.checked;
    grid.innerHTML = '';
    items.filter(it => (showHidden || !it.hidden))
         .filter(it => !filter || (it.name || '').toLowerCase().includes(filter))
         .forEach(it => {
           const card = document.createElement('div'); card.className = 'card';
           card.innerHTML = `\
        <div class="row">\
          <div class="sub">${escapeHTML(it.name || 'Unnamed')}</div>\
          <span class="small" style="opacity:.7">${timeAgo(it.createdAt)}</span>\
        </div>\
        <img src="${escapeAttr(it.dataURL)}" alt="${escapeAttr(it.name || 'image')}" style="width:100%;height:auto;border-radius:8px;display:block;"/>\
        <div class="row" style="margin-top:.4rem;gap:.5rem;">\
          <label class="row" style="gap:.4rem;"><input type="checkbox" class="gal-toggle-hidden" data-id="${it.id}" ${it.hidden?'checked':''}/> Hidden</label>\
        </div>`;
           grid.appendChild(card);
         });
    grid.querySelectorAll('.gal-toggle-hidden').forEach(el => {
      el.addEventListener('change', e => {
        const id = e.target.getAttribute('data-id');
        items = items.map(it => it.id === id ? { ...it, hidden: e.target.checked } : it);
        lsSave(LS_KEYS.gallery, items);
        render();
      });
    });
  }
  btnAdd?.addEventListener('click', () => { if(fileInput.files && fileInput.files.length){ addFiles(fileInput.files); fileInput.value = ''; } });
  btnExport?.addEventListener('click', () => {
    const blob = new Blob([JSON.stringify(items, null, 2)], {type:'application/json'});
    const a = document.createElement('a'); a.href = URL.createObjectURL(blob); a.download = 'gallery_export.json'; a.click(); URL.revokeObjectURL(a.href);
  });
  btnImport?.addEventListener('click', () => { importFile.click(); });
  importFile?.addEventListener('change', e => {
    const file = e.target.files && e.target.files[0]; if(!file) return;
    const fr = new FileReader(); fr.onload = () => { try { const data = JSON.parse(fr.result); importData(data); } catch(err){ console.warn('Import failed', err); } }; fr.readAsText(file);
    importFile.value = '';
  });
  filterInput?.addEventListener('input', render);
  showHiddenChk?.addEventListener('change', render);
  render();
}

/* ========== Lore Module ========== */
function loreInit(){
  const list = document.querySelector('#lore-list');
  if(!list) return;
  const titleInput = document.querySelector('#lore-title');
  const textInput = document.querySelector('#lore-input');
  const btnAdd = document.querySelector('#lore-add');
  const btnImport = document.querySelector('#lore-import');
  const btnExport = document.querySelector('#lore-export');
  const filterInput = document.querySelector('#lore-filter');
  const showHiddenChk = document.querySelector('#lore-show-hidden');
  const importFile = document.querySelector('#lore-import-file');
  let items = lsLoad(LS_KEYS.lore, []);
  function importData(data){
    if(!Array.isArray(data)) return;
    data.forEach(it => {
      if(it && (it.text || it.title)) {
        items.push({ id: it.id || crypto.randomUUID(), title: it.title || 'Imported', text: it.text || '', createdAt: it.createdAt || Date.now(), hidden: !!it.hidden });
      }
    });
    lsSave(LS_KEYS.lore, items);
    render();
  }
  function render(){
    const filter = (filterInput.value || '').toLowerCase();
    const showHidden = showHiddenChk.checked;
    list.innerHTML = '';
    items.filter(it => (showHidden || !it.hidden))
         .filter(it => !filter || (it.title || '').toLowerCase().includes(filter) || (it.text || '').toLowerCase().includes(filter))
         .forEach(it => {
           const el = document.createElement('div'); el.className = 'card';
           el.innerHTML = `\
        <div class="row"><div class="sub">${escapeHTML(it.title || 'Lore Entry')}</div><span class="small" style="opacity:.7">${timeAgo(it.createdAt)}</span></div>\
        <div class="small" style="white-space:pre-wrap;margin-top:.4rem;">${escapeHTML(it.text || '')}</div>\
        <div class="row" style="gap:.5rem;margin-top:.5rem;">\
          <label class="row" style="gap:.4rem;"><input type="checkbox" class="lore-toggle-hidden" data-id="${it.id}" ${it.hidden?'checked':''}/> Hidden</label>\
        </div>`;
           list.appendChild(el);
         });
    list.querySelectorAll('.lore-toggle-hidden').forEach(el => {
      el.addEventListener('change', e => {
        const id = e.target.getAttribute('data-id');
        items = items.map(it => it.id === id ? { ...it, hidden: e.target.checked } : it);
        lsSave(LS_KEYS.lore, items);
        render();
      });
    });
  }
  btnAdd?.addEventListener('click', () => {
    const text = (textInput.value || '').trim(); if(!text) return;
    const title = (titleInput.value || '').trim() || 'Lore Fragment';
    items.unshift({ id: crypto.randomUUID(), title, text, createdAt: Date.now(), hidden: false });
    lsSave(LS_KEYS.lore, items);
    textInput.value = '';
    titleInput.value = '';
    render();
  });
  btnExport?.addEventListener('click', () => {
    const blob = new Blob([JSON.stringify(items, null, 2)], {type:'application/json'});
    const a = document.createElement('a'); a.href = URL.createObjectURL(blob); a.download = 'lore_export.json'; a.click(); URL.revokeObjectURL(a.href);
  });
  btnImport?.addEventListener('click', () => { importFile.click(); });
  importFile?.addEventListener('change', e => {
    const file = e.target.files && e.target.files[0]; if(!file) return;
    const fr = new FileReader(); fr.onload = () => { try { const data = JSON.parse(fr.result); importData(data); } catch(err){ console.warn('Lore import failed', err); } }; fr.readAsText(file);
    importFile.value = '';
  });
  filterInput?.addEventListener('input', render);
  showHiddenChk?.addEventListener('change', render);
  render();
}

/* ========== Sanctum Thresholds Module ========== */
function sanctumInit(){
  const grid = document.querySelector('#sanctum-grid');
  if(!grid) return;
  const modal = document.querySelector('#modal-sanctum-item');
  const lockModal = document.querySelector('#modal-lock');
  const titleEl = document.querySelector('#sanctum-item-title');
  const bodyEl = document.querySelector('#sanctum-item-body');
  const toggleHidden = document.querySelector('#sanctum-toggle-hidden');
  const toggleLocked = document.querySelector('#sanctum-toggle-locked');
  const closeBtn = document.querySelector('#sanctum-close');
  const lockCloseBtn = document.querySelector('#lock-close');
  const showHiddenChk = document.querySelector('#sanctum-show-hidden');
  const btnImport = document.querySelector('#sanctum-import');
  const btnExport = document.querySelector('#sanctum-export');
  const importFile = document.querySelector('#sanctum-import-file');
  let items = lsLoad(LS_KEYS.sanctum, [
    { key:'door_chamber', title:'Chamber Door', body:'A quiet chamber hums behind this door.', hidden:false, locked:true },
    { key:'door_vault',   title:'Vault Door',   body:'The vault keeps its secrets sealed.',   hidden:false, locked:true },
    { key:'door_library', title:'Library Door', body:'Stacks of forgotten scrolls wait in the dark.', hidden:false, locked:true },
    { key:'door_oracle',  title:'Oracle Door',  body:'Whispers rise and fall, answering only to ritual.', hidden:false, locked:true }
  ]);
  function save(){ lsSave(LS_KEYS.sanctum, items); }
  function render(){
    const showHidden = showHiddenChk && showHiddenChk.checked;
    grid.querySelectorAll('.sanctum-item').forEach(btn => {
      const state = items.find(it => it.key === btn.dataset.key);
      if(!state) return;
      btn.style.opacity = (state.hidden && !showHidden) ? '0.25' : '1';
      btn.style.pointerEvents = (state.hidden && !showHidden) ? 'none' : 'auto';
    });
  }
  function openItem(key){
    const item = items.find(it => it.key === key);
    if(!item) return;
    if(item.locked){
      lockModal?.showModal();
      return;
    }
    titleEl.textContent = item.title || key;
    bodyEl.textContent = item.body || '';
    toggleHidden.checked = !!item.hidden;
    toggleLocked.checked = !!item.locked;
    const sync = () => {
      items = items.map(it => it.key === key ? { ...it, hidden: toggleHidden.checked, locked: toggleLocked.checked } : it);
      save(); render();
    };
    toggleHidden.onchange = sync;
    toggleLocked.onchange = sync;
    modal?.showModal();
  }
  grid.querySelectorAll('.sanctum-item').forEach(btn => {
    btn.addEventListener('click', () => openItem(btn.dataset.key));
  });
  if(lockCloseBtn) lockCloseBtn.addEventListener('click', () => lockModal?.close());
  if(closeBtn) closeBtn.addEventListener('click', () => modal?.close());
  if(showHiddenChk) showHiddenChk.addEventListener('change', render);
  if(btnExport) btnExport.addEventListener('click', () => {
    const blob = new Blob([JSON.stringify(items, null, 2)], {type:'application/json'});
    const a = document.createElement('a'); a.href = URL.createObjectURL(blob); a.download = 'sanctum_export.json'; a.click(); URL.revokeObjectURL(a.href);
  });
  if(btnImport) btnImport.addEventListener('click', () => { importFile.click(); });
  if(importFile) importFile.addEventListener('change', e => {
    const file = e.target.files && e.target.files[0]; if(!file) return;
    const fr = new FileReader(); fr.onload = () => {
      try {
        const data = JSON.parse(fr.result);
        if(Array.isArray(data)) {
          items = data.map(it => ({ key: it.key || crypto.randomUUID(), title: it.title || '', body: it.body || '', hidden: !!it.hidden, locked: !!it.locked }));
          save(); render();
        }
      } catch(err){ console.warn('Sanctum import failed', err); }
    };
    fr.readAsText(file);
    importFile.value = '';
  });
  render();
}

// === Boot ===
window.addEventListener('DOMContentLoaded', async () => {
  setupNav();
  loadSettingsUI();
  const saveBtn = qs("#set-save"); if(saveBtn) saveBtn.onclick = saveSettings;
  setupAddMemory();
  if(settings.reduceMotion) document.body.classList.add("reduce-motion");
  // Start onboarding or consent
  if(localStorage.getItem("onboarded") === "1") showConsent(); else showOnboarding();
  // Initialise utility modules
  try { galleryInit(); } catch(e){ console.warn('Gallery init error', e); }
  try { loreInit(); } catch(e){ console.warn('Lore init error', e); }
  try { sanctumInit(); } catch(e){ console.warn('Sanctum init error', e); }
});