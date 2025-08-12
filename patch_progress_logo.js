/* Patch v2: Erweiterter Fortschritt + Logo-Fix (robust)
   Einbinden: vor </body>
   <script src="patch_progress_logo.js"></script>
*/
(function(){
  console.log("[Patch] geladen");

  // ---------------- Branding (Logo) ----------------
  function findLogoKey(){
    for (let i=0;i<localStorage.length;i++){
      const k = localStorage.key(i) || '';
      if (k.toLowerCase().includes('logo')) return k;
    }
    return 'lernapp_logo_url';
  }
  const KEY_LOGO = findLogoKey();

  function applyBranding(){
    try{
      const logo = localStorage.getItem(KEY_LOGO);
      if (!logo) return;
      const el = document.querySelector('.brand .logo, .app-logo, .logo, header img');
      if (!el) return;
      if (el.tagName && el.tagName.toLowerCase()==='img'){
        el.src = logo;
      } else {
        el.style.backgroundImage = `url(${logo})`;
        el.style.backgroundSize = 'cover';
        el.style.backgroundPosition = 'center';
        el.style.backgroundRepeat = 'no-repeat';
        el.style.borderRadius = '8px';
        el.style.border = '1px solid var(--line, #2a2f3a)';
      }
    }catch(e){ console.warn("[Patch] Logo error", e); }
  }

  // ---------------- Helpers ----------------
  const supa = window.supa || window.supabaseClient || null;
  function getLocalProgress(){
    try { return JSON.parse(localStorage.getItem('progress_local') || '{"seen":0,"correct":0}'); }
    catch(e){ return {seen:0, correct:0}; }
  }
  function fmtDate(ts){ try { return new Date(ts).toLocaleString(); } catch { return ts||''; } }

  function ensureProgressContainer(){
    let box = document.getElementById('progress-extended') || document.getElementById('progressSummary');
    if (box) return box;
    const m = document.querySelector('main') || document.body;
    box = document.createElement('div');
    box.id = 'progress-extended';
    box.style.marginTop = '16px';
    m.appendChild(box);
    return box;
  }

  // ---------------- Renderer ----------------
  async function renderProgressExtended(){
    const box = ensureProgressContainer();
    if (!box) return;

    const local = getLocalProgress();
    let totalQuestions = 0;
    let cloudSeen = 0, cloudCorrect = 0;
    let learnedDistinct = 0;
    let examRows = [];

    if (supa && supa.from){
      try{
        const { data: { user } = {} } = await supa.auth.getUser();
        const qCount = await supa.from('questions').select('*', { count:'exact', head:true });
        totalQuestions = qCount.count || 0;

        if (user && user.id){
          const rSeen  = await supa.from('reviews').select('*', { count:'exact', head:true }).eq('user_id', user.id);
          const rRight = await supa.from('reviews').select('*', { count:'exact', head:true }).eq('user_id', user.id).eq('correct', true);
          cloudSeen    = rSeen.count  || 0;
          cloudCorrect = rRight.count || 0;

          const rLearn = await supa.from('reviews')
            .select('question_id')
            .eq('user_id', user.id)
            .eq('correct', true)
            .limit(10000);
          if (Array.isArray(rLearn.data)) {
            learnedDistinct = new Set(rLearn.data.map(r=>r.question_id)).size;
          }

          const ex = await supa.from('exam_sessions')
            .select('id, started_at, finished_at, total, correct')
            .eq('user_id', user.id)
            .order('started_at', { ascending:false })
            .limit(5);
          examRows = ex.data || [];
        }
      }catch(e){
        console.warn("[Patch] Supabase reads failed (ok offline/RLS):", e);
      }
    }

    const accLocal = local.seen ? Math.round(local.correct/local.seen*100) : 0;
    const accCloud = cloudSeen   ? Math.round(cloudCorrect/cloudSeen*100) : 0;
    const open = Math.max(0, totalQuestions - learnedDistinct);

    box.innerHTML = `
      <div class="card">
        <div class="card-head"><b>Letzte Sitzung (lokal)</b></div>
        <div>Beantwortet: <b>${local.seen}</b> • Richtig: <b>${local.correct}</b> • Quote: <b>${accLocal}%</b></div>
      </div>
      <div class="card">
        <div class="card-head"><b>Gesamt (Cloud)</b></div>
        <div>Fragen gesamt: <b>${totalQuestions}</b></div>
        <div>Antworten gesamt: <b>${cloudSeen}</b> • Richtig: <b>${cloudCorrect}</b> • Quote: <b>${accCloud}%</b></div>
        <div>Gelernt (mind. 1× richtig): <b>${learnedDistinct}</b> • Offen: <b>${open}</b></div>
      </div>
      <div class="card">
        <div class="card-head"><b>Letzte Prüfungen</b></div>
        ${
          examRows.length === 0
          ? '<div>Keine Prüfungen vorhanden.</div>'
          : `<div class="table small">
              <div class="tr th"><div>Datum</div><div>Dauer</div><div>Ergebnis</div></div>
              ${examRows.map(r=>{
                const durMs = (new Date(r.finished_at || r.started_at) - new Date(r.started_at)) || 0;
                const mins = Math.max(0, Math.round(durMs/60000));
                const pct  = r.total ? Math.round((r.correct||0)/r.total*100) : 0;
                return `<div class="tr">
                  <div>${fmtDate(r.started_at)}</div>
                  <div>${mins} min</div>
                  <div>${r.correct||0}/${r.total||0} (${pct}%)</div>
                </div>`;
              }).join('')}
            </div>`
        }
      </div>
    `;
  }

  // Exponieren & Trigger sicher setzen
  window.renderProgress = (window.renderProgress && typeof window.renderProgress==='function')
    ? (async ()=>{ try{ await renderProgressExtended(); }catch(e){ console.warn(e); } })
    : (async ()=>{ try{ await renderProgressExtended(); }catch(e){ console.warn(e); } });

  function attachProgressButtonTrigger(){
    const btn = document.querySelector('[data-view="progress"], button[href="#progress"], a[href="#progress"]');
    if (btn && !btn.__patchBound){
      btn.addEventListener('click', ()=>{
        setTimeout(()=>window.renderProgress && window.renderProgress(), 50);
      });
      btn.__patchBound = true;
    }
  }

  // Initial
  window.addEventListener('DOMContentLoaded', ()=>{
    applyBranding();
    attachProgressButtonTrigger();
    if (location.hash && location.hash.includes('progress')){
      setTimeout(()=>window.renderProgress && window.renderProgress(), 50);
    }
  });
  window.addEventListener('hashchange', ()=>{
    if (location.hash && location.hash.includes('progress')){
      setTimeout(()=>window.renderProgress && window.renderProgress(), 50);
    }
    attachProgressButtonTrigger();
  });

  // Fallback: nach kurzer Zeit einmal rendern (falls UI anders ist)
  setTimeout(()=>{
    if (location.hash && location.hash.includes('progress')){
      window.renderProgress && window.renderProgress();
    }
  }, 400);

})();
