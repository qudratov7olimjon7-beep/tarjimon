const $ = (id) => document.getElementById(id);
const src = $("src"), out = $("out"), statusEl = $("status"), detectedEl = $("detected"), copyBtn = $("copy");
const MAX = 5000;
const langName = (code) => {
  for (const loc of ["uz", "en"]) {
    try {
      const name = new Intl.DisplayNames([loc], { type: "language" }).of(code);
      if (name && name.toLowerCase() !== code) return name;
    } catch { /* unsupported locale */ }
  }
  return code;
};
const decode = (s) => { const t = document.createElement("textarea"); t.innerHTML = s; return t.value; };

// Each provider returns { text, lang }. Tried in order until one succeeds.
const providers = [
  async (q) => {
    const r = await fetch("https://translate.googleapis.com/translate_a/single?client=gtx&sl=auto&tl=uz&dt=t&q=" + encodeURIComponent(q));
    if (!r.ok) throw new Error(r.status);
    const d = await r.json();
    return { text: d[0].map((p) => p[0]).join(""), lang: d[2] };
  },
  async (q) => {
    const r = await fetch("https://clients5.google.com/translate_a/t?client=dict-chrome-ex&sl=auto&tl=uz&q=" + encodeURIComponent(q));
    if (!r.ok) throw new Error(r.status);
    const [[text, lang]] = await r.json();
    return { text, lang };
  },
  async (q) => {
    const r = await fetch("https://api.mymemory.translated.net/get?langpair=Autodetect|uz&q=" + encodeURIComponent(q.slice(0, 500)));
    const d = await r.json();
    if (d.responseStatus !== 200) throw new Error(d.responseDetails);
    return { text: decode(d.responseData.translatedText), lang: d.responseData.detectedLanguage };
  },
];

async function translate(q) {
  for (const p of providers) {
    try { return await p(q); } catch { /* try next provider */ }
  }
  throw new Error("all providers failed");
}

let seq = 0;
async function run() {
  const q = src.value.trim();
  const id = ++seq;
  statusEl.className = "muted";
  if (!q) { out.textContent = ""; statusEl.textContent = ""; detectedEl.textContent = "Til avtomatik aniqlanadi"; copyBtn.disabled = true; return; }
  statusEl.textContent = "Tarjima qilinmoqda…";
  try {
    const { text, lang } = await translate(q);
    if (id !== seq) return;
    const base = (lang || "").toLowerCase().split(/[-_]/)[0];
    // Already Uzbek: only convert the alphabet, keep the user's wording.
    out.textContent = UzConvert.toNewUzbek(base === "uz" ? q : text);
    detectedEl.textContent = base ? "Aniqlangan til: " + langName(base) : "Til aniqlanmadi";
    statusEl.textContent = "";
    copyBtn.disabled = false;
  } catch {
    if (id !== seq) return;
    statusEl.className = "muted error";
    statusEl.textContent = "Tarjima qilib boʻlmadi. Internet aloqasini tekshirib, qayta urinib koʻring.";
  }
}

let timer;
src.addEventListener("input", () => {
  $("count").textContent = `${src.value.length} / ${MAX}`;
  clearTimeout(timer);
  timer = setTimeout(run, 600);
});
src.addEventListener("keydown", (e) => { if (e.key === "Enter" && (e.ctrlKey || e.metaKey)) { clearTimeout(timer); run(); } });
$("go").addEventListener("click", () => { clearTimeout(timer); run(); });
copyBtn.addEventListener("click", async () => {
  try { await navigator.clipboard.writeText(out.textContent); copyBtn.textContent = "Nusxalandi ✓"; }
  catch { copyBtn.textContent = "Xatolik"; }
  setTimeout(() => (copyBtn.textContent = "Nusxalash"), 1500);
});
