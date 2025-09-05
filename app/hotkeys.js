
function show(id,on=true){ const x=document.getElementById(id); if (x) x.style.display=on?'flex':'none'; }
export function bootstrapHotkeys(){
  window.addEventListener('keydown', (e)=>{
    // Help overlay toggled with Alt+? (shift+/ on many keyboards) to avoid interfering with typing
    if (e.altKey && e.key==='?'){ e.preventDefault(); show('hotkeys-overlay', true); return; }
    // Launch Breath overlay only when Alt+F is pressed; single-letter 'b' is now ignored
    if (e.altKey && (e.key==='F' || e.key==='f')){ e.preventDefault(); const btn=document.getElementById('breath-start'); if(btn){ show('breath-overlay', true); } else { document.getElementById('open-playdeck')?.click(); } return; }
    // Toggle kink mode with Alt+K
    if (e.altKey && (e.key==='K' || e.key==='k')){ const box=document.getElementById('kink-enabled'); if (box){ box.checked=!box.checked; box.dispatchEvent(new Event('change')); } return; }
    // Toggle guardian with Alt+U (since 'g' reserved for gallery)
    if (e.altKey && (e.key==='U' || e.key==='u')){ const g=document.getElementById('guardian-enable'); if (g){ g.checked=!g.checked; g.dispatchEvent(new Event('change')); } return; }
    // Trigger panic stop with Alt+P
    if (e.altKey && (e.key==='P' || e.key==='p')){ document.getElementById('panic-stop')?.click(); return; }
    // Close hotkeys overlay with Escape
    if (e.key==='Escape'){ show('hotkeys-overlay', false); }
  });
  document.getElementById('hotkeys-close')?.addEventListener('click', ()=> show('hotkeys-overlay', false));
}
document.addEventListener('DOMContentLoaded', bootstrapHotkeys);
