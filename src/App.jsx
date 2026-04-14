import { useState, useEffect, useRef } from "react";
import { auth, provider, db } from "./firebase";
import { signInWithPopup, signOut, onAuthStateChanged } from "firebase/auth";
import { doc, getDoc, setDoc } from "firebase/firestore";

// ============================================================
// THEME — CSS VARIABLES (dark default)
// ============================================================
const DARK = {
  "--bg":              "#0d0d1a",
  "--bg2":             "#13131f",
  "--bg3":             "rgba(255,255,255,0.04)",
  "--border":          "rgba(255,255,255,0.07)",
  "--border2":         "rgba(108,99,255,0.2)",
  "--text":            "#f0f0f0",
  "--text2":           "#888",
  "--text3":           "#555",
  "--nav":             "rgba(13,13,26,0.92)",
  "--btnGhost":        "rgba(255,255,255,0.06)",
  "--btnGhostBorder":  "rgba(255,255,255,0.1)",
  "--btnGhostColor":   "#bbb",
  "--danger":          "rgba(239,68,68,0.12)",
  "--dangerBorder":    "rgba(239,68,68,0.2)",
  "--editorBg":        "rgba(255,255,255,0.03)",
  "--editorToolbar":   "rgba(255,255,255,0.02)",
  "--editorBorder":    "rgba(108,99,255,0.25)",
  "--editorColor":     "#e0e0e0",
  "--sidebarBg":       "#13131f",
  "--inputBg":         "rgba(255,255,255,0.05)",
  "--inputBorder":     "rgba(255,255,255,0.1)",
  "--inputColor":      "#f0f0f0",
};

const LIGHT = {
  "--bg":              "#f0f4ff",
  "--bg2":             "#ffffff",
  "--bg3":             "rgba(0,0,0,0.03)",
  "--border":          "rgba(0,0,0,0.08)",
  "--border2":         "rgba(108,99,255,0.25)",
  "--text":            "#1a1a2e",
  "--text2":           "#666",
  "--text3":           "#999",
  "--nav":             "rgba(240,244,255,0.95)",
  "--btnGhost":        "rgba(0,0,0,0.05)",
  "--btnGhostBorder":  "rgba(0,0,0,0.12)",
  "--btnGhostColor":   "#555",
  "--danger":          "rgba(239,68,68,0.08)",
  "--dangerBorder":    "rgba(239,68,68,0.2)",
  "--editorBg":        "#fafafa",
  "--editorToolbar":   "#efefef",
  "--editorBorder":    "rgba(108,99,255,0.2)",
  "--editorColor":     "#1a1a2e",
  "--sidebarBg":       "#ffffff",
  "--inputBg":         "#ffffff",
  "--inputBorder":     "rgba(0,0,0,0.15)",
  "--inputColor":      "#1a1a2e",
};

function applyTheme(dark) {
  const vars = dark ? DARK : LIGHT;
  Object.entries(vars).forEach(([k, v]) => document.documentElement.style.setProperty(k, v));
  document.body.style.background = vars["--bg"];
  document.body.style.color = vars["--text"];
}


// ============================================================
// RICH TEXT EDITOR — MOBILE OPTIMIZED
// ============================================================
function RichEditor({ value, onChange, placeholder = "Tulis catatan..." }) {
  const editorRef = useRef(null);
  const [isActive, setIsActive] = useState({});

  useEffect(() => {
    if (editorRef.current && editorRef.current.innerHTML !== value) {
      editorRef.current.innerHTML = value || "";
    }
  }, []);

  const exec = (cmd, val = null) => {
    document.execCommand(cmd, false, val);
    editorRef.current?.focus();
    updateActive();
  };

  const updateActive = () => {
    setIsActive({
      bold: document.queryCommandState("bold"),
      italic: document.queryCommandState("italic"),
      underline: document.queryCommandState("underline"),
      ul: document.queryCommandState("insertUnorderedList"),
      ol: document.queryCommandState("insertOrderedList"),
    });
  };

  const handleInput = () => {
    onChange(editorRef.current?.innerHTML || "");
    updateActive();
  };

  const toolbarBtn = (label, action, key) => (
    <button key={key} onMouseDown={(e) => { e.preventDefault(); action(); }}
      style={{
        padding: "8px 12px", borderRadius: 8, border: "none",
        background: isActive[key] ? "#6C63FF" : "var(--btnGhost)",
        color: isActive[key] ? "#fff" : "var(--text2)",
        cursor: "pointer", fontSize: 14, fontWeight: 600,
        minWidth: 42, minHeight: 38,
      }}
    >{label}</button>
  );

  return (
    <div style={{ borderRadius: 14, overflow: "hidden", border: "1.5px solid var(--editorBorder)", background: "var(--editorBg)" }}>
      <div style={{ display: "flex", gap: 6, padding: "10px 12px", borderBottom: "1px solid rgba(255,255,255,0.06)", flexWrap: "wrap", background: "var(--editorToolbar)" }}>
        {toolbarBtn("B", () => exec("bold"), "bold")}
        {toolbarBtn("I", () => exec("italic"), "italic")}
        {toolbarBtn("U", () => exec("underline"), "underline")}
        {toolbarBtn("•", () => exec("insertUnorderedList"), "ul")}
        {toolbarBtn("1.", () => exec("insertOrderedList"), "ol")}
        {toolbarBtn("H", () => exec("formatBlock", "<h2>"), "h2")}
      </div>
      <div ref={editorRef} contentEditable suppressContentEditableWarning
        onInput={handleInput} onKeyUp={updateActive} onMouseUp={updateActive} onTouchEnd={updateActive}
        data-placeholder={placeholder}
        style={{ minHeight: 200, padding: "16px", outline: "none", color: "var(--editorColor)", fontSize: 16, lineHeight: 1.9, fontFamily: "'Lora', serif", WebkitUserSelect: "text" }}
      />
    </div>
  );
}

// ============================================================
// EMOJI PICKER
// ============================================================
const EMOJIS = ["📚","🎯","🌍","💻","🎨","🎵","🔬","🏆","✨","🚀","🧠","📝","💡","🌱","🔥","⚡","🎭","🎤","📊","🛠️"];

function EmojiPicker({ onSelect }) {
  return (
    <div style={{ display: "grid", gridTemplateColumns: "repeat(5,1fr)", gap: 6, background: "var(--sidebarBg)", borderRadius: 12, padding: 12, border: "1px solid rgba(108,99,255,0.3)", position: "absolute", zIndex: 100, top: "100%", left: 0, marginTop: 6, boxShadow: "0 20px 60px rgba(0,0,0,0.5)" }}>
      {EMOJIS.map(e => (
        <button key={e} onClick={() => onSelect(e)} style={{ fontSize: 24, background: "none", border: "none", cursor: "pointer", borderRadius: 8, padding: 6, minWidth: 44, minHeight: 44 }}>{e}</button>
      ))}
    </div>
  );
}

const COLORS = ["#6C63FF","#FF6584","#43E97B","#F7971E","#0891B2","#7C3AED","#EC4899","#10B981","#F59E0B","#EF4444"];

function ProgressBar({ percent, color = "#6C63FF", height = 8 }) {
  return (
    <div style={{ background: "var(--bg3)", borderRadius: 999, height, overflow: "hidden" }}>
      <div style={{ height: "100%", width: `${percent}%`, borderRadius: 999, background: `linear-gradient(90deg, ${color}, ${color}aa)`, transition: "width 0.6s cubic-bezier(.4,0,.2,1)", boxShadow: `0 0 8px ${color}66` }} />
    </div>
  );
}

function calcProgress(chapters) {
  let total = 0, done = 0;
  chapters.forEach(ch => {
    if (ch.subs && ch.subs.length > 0) { ch.subs.forEach(s => { total++; if (s.done) done++; }); }
    else { total++; if (ch.done) done++; }
  });
  return total === 0 ? 0 : Math.round((done / total) * 100);
}

let _id = Date.now();
const uid = () => (++_id).toString(36);

function exportData(courses) {
  const blob = new Blob([JSON.stringify({ version: 1, courses, exportedAt: new Date().toISOString() }, null, 2)], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a"); a.href = url; a.download = `learning-tracker-${Date.now()}.json`; a.click();
  URL.revokeObjectURL(url);
}

function importData(file, onSuccess) {
  const reader = new FileReader();
  reader.onload = e => { try { const data = JSON.parse(e.target.result); if (data.courses) onSuccess(data.courses); } catch { alert("File tidak valid!"); } };
  reader.readAsText(file);
}

// ============================================================
// SIDEBAR
// ============================================================
function SidebarItem({ icon, label, onClick }) {
  return (
    <button onClick={onClick} style={{ width: "100%", padding: "14px 16px", borderRadius: 12, background: "var(--bg3)", border: "1px solid transparent", color: "var(--text2)", fontSize: 15, fontWeight: 500, cursor: "pointer", fontFamily: "inherit", display: "flex", alignItems: "center", gap: 12, textAlign: "left", minHeight: 52 }}>
      <span style={{ fontSize: 22 }}>{icon}</span><span>{label}</span>
    </button>
  );
}

function Sidebar({ open, onClose, user, onLogout, onExport, onImport, saving, isDark, onToggleTheme }) {
  return (
    <>
      {open && <div onClick={onClose} style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.6)", zIndex: 90, backdropFilter: "blur(4px)" }} />}
      <div style={{ position: "fixed", top: 0, left: 0, bottom: 0, width: 300, background: "var(--sidebarBg)", borderRight: "1px solid var(--border2)", zIndex: 100, transform: open ? "translateX(0)" : "translateX(-100%)", transition: "transform 0.3s cubic-bezier(.4,0,.2,1)", display: "flex", flexDirection: "column", boxShadow: open ? "8px 0 40px rgba(0,0,0,0.5)" : "none" }}>
        {/* HEADER */}
        <div style={{ padding: "28px 20px 20px", borderBottom: "1px solid var(--border)", background: "rgba(108,99,255,0.06)" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20 }}>
            <span style={{ fontFamily: "'Space Mono', monospace", fontWeight: 700, fontSize: 18, color: "#6C63FF" }}>◆ LearnTrack</span>
            <button onClick={onClose} style={{ background: "var(--bg3)", border: "none", color: "var(--text2)", width: 38, height: 38, borderRadius: "50%", cursor: "pointer", fontSize: 18 }}>✕</button>
          </div>
          {user && (
            <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
              <img src={user.photoURL} alt="" style={{ width: 48, height: 48, borderRadius: "50%", border: "2px solid #6C63FF" }} />
              <div>
                <p style={{ fontWeight: 600, fontSize: 15, color: "var(--text)" }}>{user.displayName}</p>
                <p style={{ fontSize: 12, color: "var(--text2)", marginTop: 2 }}>{user.email}</p>
              </div>
            </div>
          )}
        </div>

        {/* MENU */}
        <div style={{ flex: 1, padding: "16px 12px", display: "flex", flexDirection: "column", gap: 6, overflowY: "auto" }}>
          {saving && (
            <div style={{ padding: "10px 14px", borderRadius: 10, background: "rgba(108,99,255,0.1)", marginBottom: 4 }}>
              <p style={{ fontSize: 13, color: "#6C63FF", fontWeight: 500 }}>💾 Menyimpan ke cloud...</p>
            </div>
          )}
          <SidebarItem icon="⬆" label="Export Data" onClick={() => { onExport(); onClose(); }} />
          <SidebarItem icon="⬇" label="Import Data" onClick={() => { onImport(); onClose(); }} />
          <div style={{ height: 1, background: "var(--border)", margin: "4px 0" }} />
          <button onClick={onToggleTheme} style={{ width: "100%", padding: "14px 16px", borderRadius: 12, background: isDark ? "rgba(255,229,0,0.08)" : "rgba(13,13,26,0.06)", border: "1px solid transparent", color: "var(--text2)", fontSize: 15, fontWeight: 500, cursor: "pointer", fontFamily: "inherit", display: "flex", alignItems: "center", justifyContent: "space-between", minHeight: 52 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
              <span style={{ fontSize: 22 }}>{isDark ? "☀️" : "🌙"}</span>
              <span>{isDark ? "Light Mode" : "Dark Mode"}</span>
            </div>
            <div style={{ width: 44, height: 26, borderRadius: 99, background: isDark ? "#6C63FF" : "#ddd", position: "relative", transition: "background 0.3s" }}>
              <div style={{ position: "absolute", top: 3, left: isDark ? 21 : 3, width: 20, height: 20, borderRadius: "50%", background: "#fff", transition: "left 0.3s", boxShadow: "0 1px 4px rgba(0,0,0,0.3)" }} />
            </div>
          </button>
          <div style={{ height: 1, background: "var(--border)", margin: "4px 0" }} />
          <SidebarItem icon="🌐" label="Vercel Dashboard" onClick={() => { window.open("https://vercel.com", "_blank"); onClose(); }} />
          <SidebarItem icon="🔥" label="Firebase Console" onClick={() => { window.open("https://console.firebase.google.com", "_blank"); onClose(); }} />
        </div>

        {/* LOGOUT */}
        <div style={{ padding: "16px 12px", borderTop: "1px solid var(--border)" }}>
          <button onClick={() => { onLogout(); onClose(); }} style={{ width: "100%", padding: "14px", borderRadius: 12, background: "rgba(239,68,68,0.1)", border: "1px solid rgba(239,68,68,0.2)", color: "#ef4444", fontSize: 15, fontWeight: 600, cursor: "pointer", fontFamily: "inherit", minHeight: 52 }}>
            🚪 Keluar
          </button>
        </div>
      </div>
    </>
  );
}

// ============================================================
// LOGIN SCREEN
// ============================================================
function LoginScreen({ onLogin, loading }) {
  return (
    <div style={{ minHeight: "100vh", background: "#0d0d1a", display: "flex", alignItems: "center", justifyContent: "center", fontFamily: "'DM Sans', sans-serif", padding: 24 }}>
      <div style={{ background: "#13131f", borderRadius: 24, padding: "48px 32px", border: "1px solid rgba(108,99,255,0.2)", boxShadow: "0 40px 80px rgba(0,0,0,0.5)", maxWidth: 400, width: "100%", textAlign: "center" }}>
        <div style={{ fontSize: 56, marginBottom: 16, color: "#6C63FF" }}>◆</div>
        <h1 style={{ fontSize: 32, fontWeight: 700, color: "#f0f0f0", marginBottom: 8, fontFamily: "'Space Mono', monospace" }}>LearnTrack</h1>
        <p style={{ color: "#666", fontSize: 15, marginBottom: 40, lineHeight: 1.7 }}>Pantau progress belajarmu dari mana saja, kapan saja.</p>
        <button onClick={onLogin} disabled={loading} style={{ width: "100%", padding: "16px 20px", background: loading ? "#333" : "white", color: "#333", border: "none", borderRadius: 14, fontSize: 16, fontWeight: 600, cursor: loading ? "not-allowed" : "pointer", display: "flex", alignItems: "center", justifyContent: "center", gap: 12, fontFamily: "'DM Sans', sans-serif", minHeight: 56 }}>
          {loading ? <span style={{ color: "#666" }}>Memuat...</span> : (
            <><svg width="22" height="22" viewBox="0 0 48 48"><path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z"/><path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z"/><path fill="#FBBC05" d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z"/><path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.18 1.48-4.97 2.31-8.16 2.31-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z"/></svg>Masuk dengan Google</>
          )}
        </button>
        <p style={{ color: "#444", fontSize: 13, marginTop: 20 }}>Data tersimpan aman di akun Google kamu</p>
      </div>
    </div>
  );
}

// ============================================================
// MAIN APP
// ============================================================
export default function App() {
  const [user, setUser] = useState(null);
  const [authLoading, setAuthLoading] = useState(true);
  const [loginLoading, setLoginLoading] = useState(false);
  const [courses, setCourses] = useState([]);
  const [saving, setSaving] = useState(false);
  const [view, setView] = useState("dashboard");
  const [activeCourse, setActiveCourse] = useState(null);
  const [activeChapter, setActiveChapter] = useState(null);
  const [activeSub, setActiveSub] = useState(null);
  const [showNewCourse, setShowNewCourse] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [isDark, setIsDark] = useState(() => {
    const saved = localStorage.getItem("lt_theme");
    return saved ? saved === "dark" : true;
  });
  const importRef = useRef();
  const saveTimeout = useRef(null);

  useEffect(() => {
    applyTheme(isDark);
    localStorage.setItem("lt_theme", isDark ? "dark" : "light");
  }, [isDark]);

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, async (u) => {
      setUser(u); setAuthLoading(false);
      if (u) await loadData(u.uid);
    });
    return unsub;
  }, []);

  const loadData = async (uid) => {
    try {
      const snap = await getDoc(doc(db, "users", uid));
      if (snap.exists()) setCourses(snap.data().courses || []);
    } catch (e) { console.error(e); }
  };

  const saveData = (newCourses) => {
    if (!user) return;
    if (saveTimeout.current) clearTimeout(saveTimeout.current);
    setSaving(true);
    saveTimeout.current = setTimeout(async () => {
      try { await setDoc(doc(db, "users", user.uid), { courses: newCourses, updatedAt: new Date().toISOString() }); }
      catch (e) { console.error(e); } finally { setSaving(false); }
    }, 1000);
  };

  const updateCourses = (fn) => setCourses(prev => { const next = fn([...prev]); saveData(next); return next; });

  const handleLogin = async () => { setLoginLoading(true); try { await signInWithPopup(auth, provider); } catch (e) { console.error(e); setLoginLoading(false); } };
  const handleLogout = async () => { if (confirm("Keluar?")) { await signOut(auth); setCourses([]); setView("dashboard"); setActiveCourse(null); } };

  const addCourse = (course) => updateCourses(cs => [...cs, { ...course, id: uid(), chapters: [] }]);
  const deleteCourse = (id) => updateCourses(cs => cs.filter(c => c.id !== id));
  const getCourse = (id) => courses.find(c => c.id === id);
  const getChapter = (cId, chId) => getCourse(cId)?.chapters.find(ch => ch.id === chId);

  const addChapter = (cId, title) => updateCourses(cs => { const c = cs.find(x => x.id === cId); if (c) c.chapters.push({ id: uid(), title, done: false, note: "", subs: [] }); return cs; });
  const updateChapter = (cId, chId, patch) => updateCourses(cs => { const c = cs.find(x => x.id === cId); if (c) { const ch = c.chapters.find(x => x.id === chId); if (ch) Object.assign(ch, patch); } return cs; });
  const deleteChapter = (cId, chId) => updateCourses(cs => { const c = cs.find(x => x.id === cId); if (c) c.chapters = c.chapters.filter(x => x.id !== chId); return cs; });
  const addSub = (cId, chId, title) => updateCourses(cs => { const ch = cs.find(x => x.id === cId)?.chapters.find(x => x.id === chId); if (ch) ch.subs.push({ id: uid(), title, done: false, note: "" }); return cs; });
  const updateSub = (cId, chId, subId, patch) => updateCourses(cs => { const sub = cs.find(x => x.id === cId)?.chapters.find(x => x.id === chId)?.subs.find(x => x.id === subId); if (sub) Object.assign(sub, patch); return cs; });
  const deleteSub = (cId, chId, subId) => updateCourses(cs => { const ch = cs.find(x => x.id === cId)?.chapters.find(x => x.id === chId); if (ch) ch.subs = ch.subs.filter(x => x.id !== subId); return cs; });

  const course = activeCourse ? getCourse(activeCourse) : null;
  const chapter = (activeCourse && activeChapter) ? getChapter(activeCourse, activeChapter) : null;
  const sub = (chapter && activeSub) ? chapter.subs.find(s => s.id === activeSub) : null;

  const goBack = () => {
    if (view === "subnote") { setView("chapter"); setActiveSub(null); }
    else if (view === "chapter") { setView("course"); setActiveChapter(null); }
    else if (view === "allnotes") { setView("course"); }
    else { setView("dashboard"); setActiveCourse(null); }
  };

  if (authLoading) return (
    <div style={{ minHeight: "100vh", background: "#0d0d1a", display: "flex", alignItems: "center", justifyContent: "center" }}>
      <div style={{ color: "#6C63FF", fontSize: 40, fontFamily: "'Space Mono', monospace", animation: "pulse 1.5s infinite" }}>◆</div>
    </div>
  );

  if (!user) return <LoginScreen onLogin={handleLogin} loading={loginLoading} />;

  return (
    <div style={{ minHeight: "100vh", background: "var(--bg)", fontFamily: "'DM Sans', sans-serif", color: "var(--text)", overflowX: "hidden" }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@300;400;500;600;700&family=Lora:ital,wght@0,400;0,600;1,400&family=Space+Mono:wght@400;700&display=swap');
        * { box-sizing: border-box; margin: 0; padding: 0; -webkit-tap-highlight-color: transparent; }
        body { background: #0d0d1a; margin: 0; }
        ::-webkit-scrollbar { width: 4px; }
        ::-webkit-scrollbar-thumb { background: #6C63FF44; border-radius: 99px; }
        [contenteditable]:empty:before { content: attr(data-placeholder); color: #555; pointer-events: none; }
        .btn-primary { background: linear-gradient(135deg,#6C63FF,#a855f7); color: #fff; border: none; border-radius: 12px; padding: 12px 22px; font-size: 15px; font-weight: 600; cursor: pointer; font-family: inherit; min-height: 48px; }
        .btn-ghost { background: var(--btnGhost); color: var(--btnGhostColor); border: 1px solid var(--btnGhostBorder); border-radius: 12px; padding: 10px 18px; font-size: 14px; cursor: pointer; font-family: inherit; min-height: 44px; }
        .btn-danger { background: var(--danger); color: #ef4444; border: 1px solid var(--dangerBorder); border-radius: 10px; padding: 8px 14px; font-size: 14px; cursor: pointer; font-family: inherit; min-height: 40px; }
        .input-base { background: var(--inputBg); border: 1.5px solid var(--inputBorder); border-radius: 12px; padding: 12px 16px; color: var(--inputColor); font-size: 16px; outline: none; font-family: inherit; width: 100%; min-height: 48px; }
        .input-base:focus { border-color: #6C63FF; }
        .chip { display: inline-flex; align-items: center; padding: 4px 12px; border-radius: 99px; font-size: 12px; font-weight: 600; }
        .card { background: var(--bg2); border-radius: 16px; border: 1px solid var(--border); }
        .fade-in { animation: fadeIn 0.3s ease; }
        @keyframes fadeIn { from { opacity:0; transform:translateY(6px); } to { opacity:1; transform:none; } }
        @keyframes pulse { 0%,100%{opacity:1} 50%{opacity:0.3} }
      `}</style>

      <Sidebar open={sidebarOpen} onClose={() => setSidebarOpen(false)} user={user}
        onLogout={handleLogout} onExport={() => exportData(courses)}
        onImport={() => importRef.current?.click()} saving={saving}
        isDark={isDark} onToggleTheme={() => setIsDark(p => !p)} />
      <input ref={importRef} type="file" accept=".json" style={{ display: "none" }}
        onChange={e => { if (e.target.files[0]) importData(e.target.files[0], (data) => { updateCourses(() => data); e.target.value = ""; }); }} />

      {/* NAVBAR */}
      <nav style={{ position: "sticky", top: 0, zIndex: 50, background: "var(--nav)", backdropFilter: "blur(20px)", borderBottom: "1px solid var(--border2)", padding: "0 16px", height: 56, display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        {/* LEFT: hamburger (dashboard) atau back icon (halaman lain) */}
        {view === "dashboard" ? (
          <button onClick={() => setSidebarOpen(true)} style={{ background: "none", border: "none", cursor: "pointer", padding: 8, display: "flex", flexDirection: "column", gap: 5, alignItems: "center", justifyContent: "center", minWidth: 40, minHeight: 40 }}>
            <span style={{ display: "block", width: 22, height: 2, background: "var(--text)", borderRadius: 2 }} />
            <span style={{ display: "block", width: 22, height: 2, background: "#f0f0f0", borderRadius: 2 }} />
            <span style={{ display: "block", width: 22, height: 2, background: "#f0f0f0", borderRadius: 2 }} />
          </button>
        ) : (
          <button onClick={goBack} style={{ background: "none", border: "none", color: "var(--text)", cursor: "pointer", minWidth: 40, minHeight: 40, display: "flex", alignItems: "center", justifyContent: "center", borderRadius: 10, padding: 8 }}>
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="15 18 9 12 15 6" />
            </svg>
          </button>
        )}
        {/* CENTER: Logo */}
        <span style={{ fontFamily: "'Space Mono', monospace", fontWeight: 700, fontSize: 15, color: "#6C63FF", position: "absolute", left: "50%", transform: "translateX(-50%)" }}>◆ LearnTrack</span>
        {/* RIGHT: Avatar */}
        <img src={user.photoURL} alt="" onClick={() => setSidebarOpen(true)} style={{ width: 34, height: 34, borderRadius: "50%", border: "2px solid #6C63FF", cursor: "pointer" }} />
      </nav>

      {/* CONTENT */}
      <div style={{ padding: "20px 16px 100px", maxWidth: 680, margin: "0 auto" }} className="fade-in">
        {view === "dashboard" && <DashboardView courses={courses} onOpen={(id) => { setActiveCourse(id); setView("course"); }} onDelete={deleteCourse} onAdd={() => setShowNewCourse(true)} user={user} />}
        {view === "course" && course && <CourseView course={course} onOpenChapter={(chId) => { setActiveChapter(chId); setActiveSub(null); setView("chapter"); }} onAddChapter={(t) => addChapter(course.id, t)} onDeleteChapter={(chId) => deleteChapter(course.id, chId)} onToggleChapter={(chId, done) => updateChapter(course.id, chId, { done })} onShowAllNotes={() => setView("allnotes")} />}
        {view === "chapter" && course && chapter && <ChapterView course={course} chapter={chapter} onUpdateNote={(note) => updateChapter(course.id, chapter.id, { note })} onToggleDone={(done) => updateChapter(course.id, chapter.id, { done })} onAddSub={(t) => addSub(course.id, chapter.id, t)} onDeleteSub={(subId) => deleteSub(course.id, chapter.id, subId)} onUpdateSub={(subId, patch) => updateSub(course.id, chapter.id, subId, patch)} onOpenSub={(subId) => { setActiveSub(subId); setView("subnote"); }} />}
        {view === "subnote" && course && chapter && sub && <SubNoteView course={course} chapter={chapter} sub={sub} onUpdateSub={(patch) => updateSub(course.id, chapter.id, activeSub, patch)} />}
        {view === "allnotes" && course && <AllNotesView course={course} />}
      </div>

      {showNewCourse && <NewCourseModal onClose={() => setShowNewCourse(false)} onSave={(c) => { addCourse(c); setShowNewCourse(false); }} />}
    </div>
  );
}

// ============================================================
// DASHBOARD
// ============================================================
function DashboardView({ courses, onOpen, onDelete, onAdd, user }) {
  return (
    <div>
      <div style={{ marginBottom: 28 }}>
        <p style={{ color: "#6C63FF", fontWeight: 600, fontSize: 13, letterSpacing: 1.5, textTransform: "uppercase", marginBottom: 6 }}>Halo, {user.displayName?.split(" ")[0]} 👋</p>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12 }}>
          <h1 style={{ fontSize: 28, fontWeight: 700 }}>Dashboard</h1>
          <button className="btn-primary" onClick={onAdd} style={{ flexShrink: 0 }}>+ Baru</button>
        </div>
      </div>

      {courses.length > 0 && (
        <div style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: 10, marginBottom: 28 }}>
          {[
            { label: "Course", value: courses.length, icon: "📚" },
            { label: "Selesai", value: courses.filter(c => calcProgress(c.chapters) === 100).length, icon: "🏆" },
            { label: "Progress", value: (courses.length ? Math.round(courses.reduce((a, c) => a + calcProgress(c.chapters), 0) / courses.length) : 0) + "%", icon: "📊" },
          ].map((s, i) => (
            <div key={i} className="card" style={{ padding: "14px 10px", textAlign: "center" }}>
              <div style={{ fontSize: 20, marginBottom: 4 }}>{s.icon}</div>
              <div style={{ fontSize: 22, fontWeight: 700, color: "#6C63FF" }}>{s.value}</div>
              <div style={{ fontSize: 11, color: "#666", marginTop: 2 }}>{s.label}</div>
            </div>
          ))}
        </div>
      )}

      {courses.length === 0 ? (
        <div className="card" style={{ textAlign: "center", padding: "60px 20px" }}>
          <div style={{ fontSize: 56, marginBottom: 12 }}>🎯</div>
          <h2 style={{ color: "#666", fontWeight: 500, marginBottom: 8 }}>Belum ada course</h2>
          <p style={{ color: "#444", marginBottom: 24, fontSize: 14 }}>Mulai perjalanan belajarmu!</p>
          <button className="btn-primary" onClick={onAdd}>+ Buat Course Pertama</button>
        </div>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
          {courses.map(c => {
            const progress = calcProgress(c.chapters);
            const color = c.color || "#6C63FF";
            return (
              <div key={c.id} className="card" style={{ overflow: "hidden" }}>
                <div onClick={() => onOpen(c.id)} style={{ height: 120, background: c.thumbnail ? "none" : `linear-gradient(135deg, ${color}33, ${color}11)`, position: "relative", overflow: "hidden", cursor: "pointer" }}>
                  {c.thumbnail ? <img src={c.thumbnail} alt="" style={{ width: "100%", height: "100%", objectFit: "cover" }} /> : <div style={{ width: "100%", height: "100%", display: "flex", alignItems: "center", justifyContent: "center" }}><span style={{ fontSize: 48 }}>{c.emoji || "📚"}</span></div>}
                  <div style={{ position: "absolute", bottom: 0, left: 0, right: 0, height: "50%", background: "linear-gradient(to top, var(--bg2), transparent)" }} />
                  {progress === 100 && <div style={{ position: "absolute", top: 10, right: 10 }}><span className="chip" style={{ background: "#10B98122", color: "#10B981", border: "1px solid #10B98133" }}>✓ Selesai</span></div>}
                </div>
                <div style={{ padding: "14px 16px" }} onClick={() => onOpen(c.id)}>
                  <h3 style={{ fontWeight: 700, fontSize: 16, marginBottom: 4 }}>{c.emoji} {c.title}</h3>
                  {c.description && <p style={{ color: "#666", fontSize: 13, marginBottom: 10 }}>{c.description}</p>}
                  <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 8 }}>
                    <span style={{ fontSize: 13, color, fontWeight: 600 }}>{progress}%</span>
                    <span style={{ fontSize: 12, color: "#555" }}>{c.chapters.length} bab</span>
                  </div>
                  <ProgressBar percent={progress} color={color} height={8} />
                </div>
                <div style={{ padding: "0 16px 14px", display: "flex", justifyContent: "flex-end" }}>
                  <button className="btn-danger" onClick={e => { e.stopPropagation(); if (confirm("Hapus course?")) onDelete(c.id); }}>Hapus</button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

// ============================================================
// COURSE VIEW
// ============================================================
function CourseView({ course, onOpenChapter, onAddChapter, onDeleteChapter, onToggleChapter, onShowAllNotes }) {
  const [newChTitle, setNewChTitle] = useState("");
  const progress = calcProgress(course.chapters);
  const color = course.color || "#6C63FF";

  return (
    <div>
      <div className="card" style={{ marginBottom: 20, overflow: "hidden" }}>
        <div style={{ height: 160, background: course.thumbnail ? "none" : `linear-gradient(135deg, ${color}22, ${color}08)`, position: "relative", overflow: "hidden" }}>
          {course.thumbnail ? <img src={course.thumbnail} alt="" style={{ width: "100%", height: "100%", objectFit: "cover" }} /> : <div style={{ width: "100%", height: "100%", display: "flex", alignItems: "center", justifyContent: "center" }}><span style={{ fontSize: 72 }}>{course.emoji || "📚"}</span></div>}
          <div style={{ position: "absolute", inset: 0, background: "linear-gradient(to top, var(--bg2) 10%, transparent)" }} />
        </div>
        <div style={{ padding: "16px 18px 20px" }}>
          <h1 style={{ fontSize: 22, fontWeight: 700, marginBottom: 6 }}>{course.emoji} {course.title}</h1>
          {course.description && <p style={{ color: "#888", marginBottom: 14, fontSize: 14 }}>{course.description}</p>}
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 10 }}>
            <span style={{ fontWeight: 700, color, fontSize: 15 }}>{progress}% selesai</span>
            <button className="btn-ghost" style={{ fontSize: 13, padding: "8px 14px" }} onClick={onShowAllNotes}>📋 Semua Catatan</button>
          </div>
          <ProgressBar percent={progress} color={color} height={10} />
          <p style={{ color: "#555", fontSize: 13, marginTop: 8 }}>{course.chapters.filter(ch => ch.subs?.length > 0 ? ch.subs.every(s => s.done) : ch.done).length} / {course.chapters.length} bab selesai</p>
        </div>
      </div>

      <h2 style={{ fontSize: 16, fontWeight: 700, marginBottom: 12 }}>📖 Daftar Bab</h2>
      {course.chapters.length === 0 && <p style={{ color: "var(--text3)", fontSize: 14, marginBottom: 14 }}>Tambahkan bab pertama.</p>}
      <div style={{ display: "flex", flexDirection: "column", gap: 8, marginBottom: 16 }}>
        {course.chapters.map((ch, i) => {
          const chProgress = ch.subs?.length > 0 ? Math.round(ch.subs.filter(s => s.done).length / ch.subs.length * 100) : (ch.done ? 100 : 0);
          const isDone = ch.subs?.length > 0 ? ch.subs.every(s => s.done) : ch.done;
          return (
            <div key={ch.id} className="card" style={{ padding: "14px 16px", border: `1px solid ${isDone ? color + "33" : "rgba(255,255,255,0.07)"}` }}
              onClick={() => onOpenChapter(ch.id)}>
              <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                <span style={{ color: "var(--text3)", fontSize: 13, fontFamily: "'Space Mono', monospace", minWidth: 26 }}>{String(i + 1).padStart(2, "0")}</span>
                <div style={{ flex: 1 }}>
                  <div style={{ fontWeight: 600, fontSize: 15 }}>{ch.title}</div>
                  {ch.subs?.length > 0 && (
                    <div style={{ display: "flex", alignItems: "center", gap: 8, marginTop: 6 }}>
                      <ProgressBar percent={chProgress} color={color} height={5} />
                      <span style={{ fontSize: 11, color: "#666", whiteSpace: "nowrap" }}>{ch.subs.filter(s => s.done).length}/{ch.subs.length}</span>
                    </div>
                  )}
                </div>
                {ch.note && <span style={{ fontSize: 15 }}>📝</span>}
                {ch.subs?.length === 0 && <input type="checkbox" checked={ch.done} onChange={e => { e.stopPropagation(); onToggleChapter(ch.id, e.target.checked); }} style={{ width: 20, height: 20, accentColor: color, cursor: "pointer", flexShrink: 0 }} />}
                <button className="btn-danger" style={{ flexShrink: 0 }} onClick={e => { e.stopPropagation(); if (confirm("Hapus bab?")) onDeleteChapter(ch.id); }}>✕</button>
              </div>
            </div>
          );
        })}
      </div>
      <div style={{ display: "flex", gap: 10 }}>
        <input className="input-base" placeholder="Nama bab baru..." value={newChTitle} onChange={e => setNewChTitle(e.target.value)} onKeyDown={e => { if (e.key === "Enter" && newChTitle.trim()) { onAddChapter(newChTitle.trim()); setNewChTitle(""); } }} />
        <button className="btn-primary" style={{ flexShrink: 0 }} onClick={() => { if (newChTitle.trim()) { onAddChapter(newChTitle.trim()); setNewChTitle(""); } }}>+ Bab</button>
      </div>
    </div>
  );
}

// ============================================================
// CHAPTER VIEW
// ============================================================
function ChapterView({ course, chapter, onUpdateNote, onToggleDone, onAddSub, onDeleteSub, onUpdateSub, onOpenSub }) {
  const [newSubTitle, setNewSubTitle] = useState("");
  const color = course.color || "#6C63FF";

  return (
    <div>
      <div className="card" style={{ padding: "16px 18px", marginBottom: 20, borderLeft: `4px solid ${color}` }}>
        <p style={{ color: "var(--text2)", fontSize: 12, marginBottom: 4 }}>{course.emoji} {course.title}</p>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12 }}>
          <h1 style={{ fontSize: 20, fontWeight: 700, lineHeight: 1.3 }}>{chapter.title}</h1>
          {chapter.subs.length === 0 && (
            <label style={{ display: "flex", alignItems: "center", gap: 6, cursor: "pointer", flexShrink: 0 }}>
              <input type="checkbox" checked={chapter.done} onChange={e => onToggleDone(e.target.checked)} style={{ width: 20, height: 20, accentColor: color }} />
              <span style={{ fontSize: 13, color: "#888" }}>Selesai</span>
            </label>
          )}
        </div>
      </div>

      {/* CHAPTER NOTE — FULL WIDTH */}
      <div style={{ marginBottom: 24 }}>
        <h3 style={{ fontSize: 13, fontWeight: 600, color: "var(--text2)", marginBottom: 10, textTransform: "uppercase", letterSpacing: 1 }}>📝 Catatan Bab</h3>
        <RichEditor value={chapter.note} onChange={onUpdateNote} placeholder="Tulis catatan bab ini..." />
      </div>

      {/* SUB CHAPTERS */}
      <div>
        <h3 style={{ fontSize: 13, fontWeight: 600, color: "var(--text2)", marginBottom: 12, textTransform: "uppercase", letterSpacing: 1 }}>📑 Sub Bab</h3>
        {chapter.subs.length === 0 && <p style={{ color: "var(--text3)", fontSize: 14, marginBottom: 12 }}>Belum ada sub bab.</p>}
        <div style={{ display: "flex", flexDirection: "column", gap: 8, marginBottom: 14 }}>
          {chapter.subs.map((s, i) => (
            <div key={s.id} className="card" style={{ padding: "14px 16px", border: `1px solid ${s.done ? color + "33" : "rgba(255,255,255,0.07)"}`, cursor: "pointer" }}
              onClick={() => onOpenSub(s.id)}>
              <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                <span style={{ color: "var(--text3)", fontSize: 12, fontFamily: "'Space Mono', monospace", minWidth: 22 }}>{i + 1}.</span>
                <span style={{ flex: 1, fontWeight: 500, fontSize: 15, textDecoration: s.done ? "line-through" : "none", color: s.done ? "var(--text3)" : "var(--text)" }}>{s.title}</span>
                {s.note && <span style={{ fontSize: 14 }}>📝</span>}
                <input type="checkbox" checked={s.done} onChange={e => { e.stopPropagation(); onUpdateSub(s.id, { done: e.target.checked }); }} style={{ width: 20, height: 20, accentColor: color, cursor: "pointer", flexShrink: 0 }} />
                <button className="btn-danger" style={{ flexShrink: 0 }} onClick={e => { e.stopPropagation(); if (confirm("Hapus sub bab?")) onDeleteSub(s.id); }}>✕</button>
              </div>
            </div>
          ))}
        </div>
        <div style={{ display: "flex", gap: 10 }}>
          <input className="input-base" placeholder="Nama sub bab baru..." value={newSubTitle} onChange={e => setNewSubTitle(e.target.value)} onKeyDown={e => { if (e.key === "Enter" && newSubTitle.trim()) { onAddSub(newSubTitle.trim()); setNewSubTitle(""); } }} />
          <button className="btn-primary" style={{ flexShrink: 0 }} onClick={() => { if (newSubTitle.trim()) { onAddSub(newSubTitle.trim()); setNewSubTitle(""); } }}>+ Sub</button>
        </div>
      </div>
    </div>
  );
}

// ============================================================
// SUB NOTE VIEW — FULL SCREEN
// ============================================================
function SubNoteView({ course, chapter, sub, onUpdateSub }) {
  const color = course.color || "#6C63FF";
  return (
    <div>
      <div className="card" style={{ padding: "16px 18px", marginBottom: 20, borderLeft: `4px solid ${color}` }}>
        <p style={{ color: "#666", fontSize: 12, marginBottom: 4 }}>{course.emoji} {course.title} / {chapter.title}</p>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12 }}>
          <h1 style={{ fontSize: 20, fontWeight: 700 }}>{sub.title}</h1>
          <label style={{ display: "flex", alignItems: "center", gap: 6, cursor: "pointer", flexShrink: 0 }}>
            <input type="checkbox" checked={sub.done} onChange={e => onUpdateSub({ done: e.target.checked })} style={{ width: 20, height: 20, accentColor: color }} />
            <span style={{ fontSize: 13, color: "#888" }}>Selesai</span>
          </label>
        </div>
      </div>
      <h3 style={{ fontSize: 13, fontWeight: 600, color: "#888", marginBottom: 10, textTransform: "uppercase", letterSpacing: 1 }}>📝 Catatan Sub Bab</h3>
      <RichEditor value={sub.note} onChange={val => onUpdateSub({ note: val })} placeholder="Tulis catatan sub bab ini..." />
    </div>
  );
}

// ============================================================
// ALL NOTES VIEW
// ============================================================
function AllNotesView({ course }) {
  const allNotes = [];
  course.chapters.forEach(ch => {
    if (ch.note) allNotes.push({ type: "chapter", title: ch.title, note: ch.note });
    ch.subs?.forEach(s => { if (s.note) allNotes.push({ type: "sub", title: s.title, parent: ch.title, note: s.note }); });
  });

  return (
    <div>
      <div style={{ marginBottom: 24 }}>
        <h1 style={{ fontSize: 24, fontWeight: 700 }}>📋 Semua Catatan</h1>
        <p style={{ color: "#666", marginTop: 4, fontSize: 14 }}>{course.emoji} {course.title} · {allNotes.length} catatan</p>
      </div>
      {allNotes.length === 0 ? (
        <div className="card" style={{ textAlign: "center", padding: "48px 20px" }}>
          <div style={{ fontSize: 40, marginBottom: 10 }}>📭</div>
          <p style={{ color: "#555" }}>Belum ada catatan.</p>
        </div>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
          {allNotes.map((n, i) => (
            <div key={i} className="card" style={{ overflow: "hidden" }}>
              <div style={{ padding: "10px 16px", borderBottom: "1px solid var(--border)", display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
                <span className="chip" style={{ background: n.type === "chapter" ? "rgba(108,99,255,0.15)" : "rgba(168,85,247,0.15)", color: n.type === "chapter" ? "#6C63FF" : "#a855f7", border: `1px solid ${n.type === "chapter" ? "#6C63FF33" : "#a855f733"}` }}>{n.type === "chapter" ? "Bab" : "Sub Bab"}</span>
                <span style={{ fontWeight: 600, fontSize: 14 }}>{n.title}</span>
                {n.parent && <span style={{ color: "#555", fontSize: 12 }}>← {n.parent}</span>}
              </div>
              <div style={{ padding: "14px 16px", color: "var(--text2)", fontSize: 15, lineHeight: 1.9, fontFamily: "'Lora', serif" }} dangerouslySetInnerHTML={{ __html: n.note }} />
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ============================================================
// NEW COURSE MODAL — BOTTOM SHEET
// ============================================================
function NewCourseModal({ onClose, onSave }) {
  const [title, setTitle] = useState("");
  const [desc, setDesc] = useState("");
  const [emoji, setEmoji] = useState("📚");
  const [color, setColor] = useState("#6C63FF");
  const [thumbnail, setThumbnail] = useState(null);
  const [showEmoji, setShowEmoji] = useState(false);
  const [thumbnailMode, setThumbnailMode] = useState("emoji");
  const fileRef = useRef();

  return (
    <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.75)", backdropFilter: "blur(8px)", display: "flex", alignItems: "flex-end", justifyContent: "center", zIndex: 200 }}
      onClick={e => { if (e.target === e.currentTarget) onClose(); }}>
      <div style={{ background: "var(--bg2)", borderRadius: "24px 24px 0 0", padding: "20px 20px 44px", width: "100%", maxWidth: 600, border: "1px solid var(--border2)", maxHeight: "92vh", overflowY: "auto" }}>
        {/* DRAG HANDLE */}
        <div style={{ width: 40, height: 4, background: "var(--border)", borderRadius: 99, margin: "0 auto 20px" }} />
        <h2 style={{ fontWeight: 700, fontSize: 20, marginBottom: 20 }}>✨ Course Baru</h2>

        <div style={{ height: 90, borderRadius: 14, marginBottom: 16, display: "flex", alignItems: "center", justifyContent: "center", background: thumbnail ? "none" : `linear-gradient(135deg, ${color}22, ${color}08)`, border: "1px solid rgba(255,255,255,0.07)", overflow: "hidden" }}>
          {thumbnail ? <img src={thumbnail} alt="" style={{ width: "100%", height: "100%", objectFit: "cover" }} /> : <span style={{ fontSize: 44 }}>{emoji}</span>}
        </div>

        <div style={{ display: "flex", gap: 8, marginBottom: 16 }}>
          <button className={thumbnailMode === "emoji" ? "btn-primary" : "btn-ghost"} style={{ flex: 1 }} onClick={() => { setThumbnailMode("emoji"); setThumbnail(null); }}>Emoji</button>
          <button className={thumbnailMode === "upload" ? "btn-primary" : "btn-ghost"} style={{ flex: 1 }} onClick={() => setThumbnailMode("upload")}>Gambar</button>
        </div>

        {thumbnailMode === "emoji" && (
          <div style={{ marginBottom: 16 }}>
            <div style={{ position: "relative", display: "inline-block", marginBottom: 12 }}>
              <button className="btn-ghost" onClick={() => setShowEmoji(p => !p)} style={{ fontSize: 24, padding: "10px 16px" }}>{emoji}</button>
              {showEmoji && <EmojiPicker onSelect={e => { setEmoji(e); setShowEmoji(false); }} />}
            </div>
            <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
              {COLORS.map(c => (<button key={c} onClick={() => setColor(c)} style={{ width: 36, height: 36, borderRadius: "50%", background: c, border: `3px solid ${color === c ? "#fff" : "transparent"}`, cursor: "pointer" }} />))}
            </div>
          </div>
        )}

        {thumbnailMode === "upload" && (
          <div style={{ marginBottom: 16 }}>
            <input type="file" accept="image/*" ref={fileRef} style={{ display: "none" }} onChange={e => { const f = e.target.files[0]; if (f) { const r = new FileReader(); r.onload = ev => setThumbnail(ev.target.result); r.readAsDataURL(f); } }} />
            <button className="btn-ghost" style={{ width: "100%", padding: 16 }} onClick={() => fileRef.current?.click()}>{thumbnail ? "✓ Gambar dipilih" : "📁 Pilih gambar"}</button>
          </div>
        )}

        <div style={{ display: "flex", flexDirection: "column", gap: 10, marginBottom: 20 }}>
          <input className="input-base" placeholder="Judul course (wajib)" value={title} onChange={e => setTitle(e.target.value)} autoFocus />
          <input className="input-base" placeholder="Deskripsi singkat (opsional)" value={desc} onChange={e => setDesc(e.target.value)} />
        </div>

        <div style={{ display: "flex", gap: 10 }}>
          <button className="btn-ghost" style={{ flex: 1 }} onClick={onClose}>Batal</button>
          <button className="btn-primary" style={{ flex: 2 }} onClick={() => { if (title.trim()) onSave({ title: title.trim(), description: desc, emoji, color, thumbnail }); }} disabled={!title.trim()}>Buat Course →</button>
        </div>
      </div>
    </div>
  );
}
