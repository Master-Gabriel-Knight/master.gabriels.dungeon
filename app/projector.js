
function show(on){ const o=document.getElementById('projector-overlay'); if(o) o.style.display=on?'block':'none'; }
function setText(t){ const el=document.getElementById('projector-text'); if (el){ el.textContent = t; } }
export function bootstrapProjector(){
  document.getElementById('proj-open')?.addEventListener('click', ()=> show(true));
  document.getElementById('proj-close')?.addEventListener('click', ()=> show(false));
  window.addEventListener('mgd:phase', e=> setText(e.detail));
  window.addEventListener('mgd:cue', e=> setText(e.detail));
  window.addEventListener('mgd:scriptStep', e=> setText(e.detail?.say||e.detail?.decree||' '));
}
document.addEventListener('DOMContentLoaded', bootstrapProjector);
