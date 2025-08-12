/* Adapter für Lernkarten-Ansicht
   - hängt sich an den Lernkarten-View
   - liest Kategorie aus erstem <select> in diesem View
   - lädt adaptive Fragen via window.fetchAdaptiveCandidates(cat)
   - ruft vorhandene Render-Funktion, sonst einfacher Fallback
*/
(function () {
  console.log("[Adapter] flashcards loader active");

  // Hilfsfunktion: wartet, bis ein Element existiert
  function waitFor(sel, root = document) {
    return new Promise(resolve => {
      const el = root.querySelector(sel);
      if (el) return resolve(el);
      const mo = new MutationObserver(() => {
        const e2 = root.querySelector(sel);
        if (e2) {
          mo.disconnect();
          resolve(e2);
        }
      });
      mo.observe(document.documentElement, { childList: true, subtree: true });
    });
  }

  // Versucht, eine existierende Render-Funktion zu finden
  function callExistingRenderer(cards) {
    // häufige Funktionsnamen – wir probieren der Reihe nach
    const fns = [
      "startFlashcards",
      "renderFlashcards",
      "showFlashcards",
      "beginFlashcards",
      "initFlashcards"
    ];
    for (const name of fns) {
      const fn = window[name];
      if (typeof fn === "function") {
        try { fn(cards); return true; } catch (e) { console.warn(e); }
      }
    }
    return false;
  }

  // Minimaler Fallback, falls keine Render-Funktion existiert
  function showFallback(cards) {
    const host =
      document.querySelector("#view-flashcards") ||
      document.querySelector(".flashcards-view") ||
      document.querySelector("main") || document.body;

    let box = document.getElementById("flashcards-fallback");
    if (!box) {
      box = document.createElement("div");
      box.id = "flashcards-fallback";
      box.style.marginTop = "16px";
      box.style.padding = "12px";
      box.style.border = "1px solid var(--line, #2a2f3a)";
      box.style.borderRadius = "10px";
      host.appendChild(box);
    }

    if (!cards || !cards.length) {
      box.innerHTML = `<div class="card">Keine Karten gefunden.</div>`;
      return;
    }

    const q = cards[0]; // nur 1 Karte als Proof-of-Work
    const opts = (q.options || []).map((o, i) =>
      `<button class="btn option" data-i="${i}">${o}</button>`
    ).join("");

    box.innerHTML = `
      <div class="card">
        <div class="card-head"><b>Adaptive Lernkarten (Fallback)</b></div>
        <div style="margin-top:8px">${q.question}</div>
        <div class="options" style="margin-top:10px; display:grid; gap:8px;">
          ${opts}
        </div>
      </div>
    `;

    box.querySelectorAll(".option").forEach(btn => {
      btn.addEventListener("click", async () => {
        const i = Number(btn.dataset.i);
        const correct = (i === q.correct_index);
        btn.textContent += correct ? " ✅" : " ❌";
        try { await window.recordReview(q.id, correct); } catch {}
      });
    });
  }

  // Hängt sich an die Lernkarten-View
  async function hookFlashcardsView() {
    // Warte bis du auf der Lernkarten-Seite bist
    if (!(location.hash && /flash|card/i.test(location.hash))) return;

    // Versuche ein Select im Lernkarten-Bereich zu finden (erste Kategorie-Auswahl)
    const root =
      document.querySelector("#view-flashcards") ||
      document.querySelector(".flashcards-view") ||
      document;

    const select = await waitFor("select", root); // erster <select> im View
    // Finde einen "Laden"-Button (oder nimm den ersten Button als Notlösung)
    let loadBtn = root.querySelector('button.load, button[type="submit"], button');
    if (!loadBtn) loadBtn = await waitFor('button', root);

    if (loadBtn && !loadBtn.__patched) {
      loadBtn.addEventListener("click", async (e) => {
        try {
          // Standard-Laden blocken → wir laden adaptiv
          e.preventDefault();

          // Kategorie lesen (falls kein select -> Kategorie unverändert lassen)
          const cat = select ? select.value : undefined;

          // adaptive Kandidaten holen
          const cards = await (window.fetchAdaptiveCandidates
            ? window.fetchAdaptiveCandidates(cat)
            : Promise.resolve([]));

          // vorhandene Anzeige aufrufen oder Fallback
          if (!callExistingRenderer(cards)) {
            showFallback(cards);
          }
        } catch (err) {
          console.warn("[Adapter] load error", err);
        }
      });
      loadBtn.__patched = true;
    }
  }

  // Trigger beim Wechsel in die Lernkarten-Ansicht
  window.addEventListener("hashchange", () => {
    if (location.hash && /flash|card/i.test(location.hash)) {
      setTimeout(hookFlashcardsView, 50);
    }
  });
  window.addEventListener("DOMContentLoaded", () => {
    if (location.hash && /flash|card/i.test(location.hash)) {
      setTimeout(hookFlashcardsView, 50);
    }
  });
  setTimeout(() => {
    if (location.hash && /flash|card/i.test(location.hash)) {
      hookFlashcardsView();
    }
  }, 400);
})();
