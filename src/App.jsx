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
@@ -41,17 +102,17 @@ function RichEditor({ value, onChange, placeholder = "Tulis catatan..." }) {
<button key={key} onMouseDown={(e) => { e.preventDefault(); action(); }}
style={{
padding: "8px 12px", borderRadius: 8, border: "none",
        background: isActive[key] ? "#6C63FF" : "rgba(255,255,255,0.08)",
        color: isActive[key] ? "#fff" : "#aaa",
        background: isActive[key] ? "#6C63FF" : "var(--btnGhost)",
        color: isActive[key] ? "#fff" : "var(--text2)",
cursor: "pointer", fontSize: 14, fontWeight: 600,
minWidth: 42, minHeight: 38,
}}
>{label}</button>
);

return (
    <div style={{ borderRadius: 14, overflow: "hidden", border: "1.5px solid rgba(108,99,255,0.25)", background: "rgba(255,255,255,0.03)" }}>
      <div style={{ display: "flex", gap: 6, padding: "10px 12px", borderBottom: "1px solid rgba(255,255,255,0.06)", flexWrap: "wrap", background: "rgba(255,255,255,0.02)" }}>
    <div style={{ borderRadius: 14, overflow: "hidden", border: "1.5px solid var(--editorBorder)", background: "var(--editorBg)" }}>
      <div style={{ display: "flex", gap: 6, padding: "10px 12px", borderBottom: "1px solid rgba(255,255,255,0.06)", flexWrap: "wrap", background: "var(--editorToolbar)" }}>
{toolbarBtn("B", () => exec("bold"), "bold")}
{toolbarBtn("I", () => exec("italic"), "italic")}
{toolbarBtn("U", () => exec("underline"), "underline")}
@@ -62,7 +123,7 @@ function RichEditor({ value, onChange, placeholder = "Tulis catatan..." }) {
<div ref={editorRef} contentEditable suppressContentEditableWarning
onInput={handleInput} onKeyUp={updateActive} onMouseUp={updateActive} onTouchEnd={updateActive}
data-placeholder={placeholder}
        style={{ minHeight: 200, padding: "16px", outline: "none", color: "#e0e0e0", fontSize: 16, lineHeight: 1.9, fontFamily: "'Lora', serif", WebkitUserSelect: "text" }}
        style={{ minHeight: 200, padding: "16px", outline: "none", color: "var(--editorColor)", fontSize: 16, lineHeight: 1.9, fontFamily: "'Lora', serif", WebkitUserSelect: "text" }}
/>
</div>
);
@@ -75,7 +136,7 @@ const EMOJIS = ["📚","🎯","🌍","💻","🎨","🎵","🔬","🏆","✨","

function EmojiPicker({ onSelect }) {
return (
    <div style={{ display: "grid", gridTemplateColumns: "repeat(5,1fr)", gap: 6, background: "#1a1a2e", borderRadius: 12, padding: 12, border: "1px solid rgba(108,99,255,0.3)", position: "absolute", zIndex: 100, top: "100%", left: 0, marginTop: 6, boxShadow: "0 20px 60px rgba(0,0,0,0.5)" }}>
    <div style={{ display: "grid", gridTemplateColumns: "repeat(5,1fr)", gap: 6, background: "var(--sidebarBg)", borderRadius: 12, padding: 12, border: "1px solid rgba(108,99,255,0.3)", position: "absolute", zIndex: 100, top: "100%", left: 0, marginTop: 6, boxShadow: "0 20px 60px rgba(0,0,0,0.5)" }}>
{EMOJIS.map(e => (
<button key={e} onClick={() => onSelect(e)} style={{ fontSize: 24, background: "none", border: "none", cursor: "pointer", borderRadius: 8, padding: 6, minWidth: 44, minHeight: 44 }}>{e}</button>
))}
@@ -87,7 +148,7 @@ const COLORS = ["#6C63FF","#FF6584","#43E97B","#F7971E","#0891B2","#7C3AED","#EC

function ProgressBar({ percent, color = "#6C63FF", height = 8 }) {
return (
    <div style={{ background: "rgba(255,255,255,0.08)", borderRadius: 999, height, overflow: "hidden" }}>
    <div style={{ background: "var(--bg3)", borderRadius: 999, height, overflow: "hidden" }}>
<div style={{ height: "100%", width: `${percent}%`, borderRadius: 999, background: `linear-gradient(90deg, ${color}, ${color}aa)`, transition: "width 0.6s cubic-bezier(.4,0,.2,1)", boxShadow: `0 0 8px ${color}66` }} />
</div>
);
@@ -123,29 +184,29 @@ function importData(file, onSuccess) {
// ============================================================
function SidebarItem({ icon, label, onClick }) {
return (
    <button onClick={onClick} style={{ width: "100%", padding: "14px 16px", borderRadius: 12, background: "rgba(255,255,255,0.04)", border: "1px solid transparent", color: "#ccc", fontSize: 15, fontWeight: 500, cursor: "pointer", fontFamily: "inherit", display: "flex", alignItems: "center", gap: 12, textAlign: "left", minHeight: 52 }}>
    <button onClick={onClick} style={{ width: "100%", padding: "14px 16px", borderRadius: 12, background: "var(--bg3)", border: "1px solid transparent", color: "var(--text2)", fontSize: 15, fontWeight: 500, cursor: "pointer", fontFamily: "inherit", display: "flex", alignItems: "center", gap: 12, textAlign: "left", minHeight: 52 }}>
<span style={{ fontSize: 22 }}>{icon}</span><span>{label}</span>
</button>
);
}

function Sidebar({ open, onClose, user, onLogout, onExport, onImport, saving }) {
function Sidebar({ open, onClose, user, onLogout, onExport, onImport, saving, isDark, onToggleTheme }) {
return (
<>
{open && <div onClick={onClose} style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.6)", zIndex: 90, backdropFilter: "blur(4px)" }} />}
      <div style={{ position: "fixed", top: 0, left: 0, bottom: 0, width: 300, background: "#13131f", borderRight: "1px solid rgba(108,99,255,0.2)", zIndex: 100, transform: open ? "translateX(0)" : "translateX(-100%)", transition: "transform 0.3s cubic-bezier(.4,0,.2,1)", display: "flex", flexDirection: "column", boxShadow: open ? "8px 0 40px rgba(0,0,0,0.5)" : "none" }}>
      <div style={{ position: "fixed", top: 0, left: 0, bottom: 0, width: 300, background: "var(--sidebarBg)", borderRight: "1px solid var(--border2)", zIndex: 100, transform: open ? "translateX(0)" : "translateX(-100%)", transition: "transform 0.3s cubic-bezier(.4,0,.2,1)", display: "flex", flexDirection: "column", boxShadow: open ? "8px 0 40px rgba(0,0,0,0.5)" : "none" }}>
{/* HEADER */}
        <div style={{ padding: "28px 20px 20px", borderBottom: "1px solid rgba(255,255,255,0.06)", background: "rgba(108,99,255,0.06)" }}>
        <div style={{ padding: "28px 20px 20px", borderBottom: "1px solid var(--border)", background: "rgba(108,99,255,0.06)" }}>
<div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20 }}>
<span style={{ fontFamily: "'Space Mono', monospace", fontWeight: 700, fontSize: 18, color: "#6C63FF" }}>◆ LearnTrack</span>
            <button onClick={onClose} style={{ background: "rgba(255,255,255,0.08)", border: "none", color: "#aaa", width: 38, height: 38, borderRadius: "50%", cursor: "pointer", fontSize: 18 }}>✕</button>
            <button onClick={onClose} style={{ background: "var(--bg3)", border: "none", color: "var(--text2)", width: 38, height: 38, borderRadius: "50%", cursor: "pointer", fontSize: 18 }}>✕</button>
</div>
{user && (
<div style={{ display: "flex", alignItems: "center", gap: 12 }}>
<img src={user.photoURL} alt="" style={{ width: 48, height: 48, borderRadius: "50%", border: "2px solid #6C63FF" }} />
<div>
                <p style={{ fontWeight: 600, fontSize: 15, color: "#f0f0f0" }}>{user.displayName}</p>
                <p style={{ fontSize: 12, color: "#666", marginTop: 2 }}>{user.email}</p>
                <p style={{ fontWeight: 600, fontSize: 15, color: "var(--text)" }}>{user.displayName}</p>
                <p style={{ fontSize: 12, color: "var(--text2)", marginTop: 2 }}>{user.email}</p>
</div>
</div>
)}
@@ -160,13 +221,23 @@ function Sidebar({ open, onClose, user, onLogout, onExport, onImport, saving })
)}
<SidebarItem icon="⬆" label="Export Data" onClick={() => { onExport(); onClose(); }} />
<SidebarItem icon="⬇" label="Import Data" onClick={() => { onImport(); onClose(); }} />
          <div style={{ height: 1, background: "rgba(255,255,255,0.06)", margin: "4px 0" }} />
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
        <div style={{ padding: "16px 12px", borderTop: "1px solid rgba(255,255,255,0.06)" }}>
        <div style={{ padding: "16px 12px", borderTop: "1px solid var(--border)" }}>
<button onClick={() => { onLogout(); onClose(); }} style={{ width: "100%", padding: "14px", borderRadius: 12, background: "rgba(239,68,68,0.1)", border: "1px solid rgba(239,68,68,0.2)", color: "#ef4444", fontSize: 15, fontWeight: 600, cursor: "pointer", fontFamily: "inherit", minHeight: 52 }}>
🚪 Keluar
</button>
@@ -212,9 +283,18 @@ export default function App() {
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
@@ -277,7 +357,7 @@ export default function App() {
if (!user) return <LoginScreen onLogin={handleLogin} loading={loginLoading} />;

return (
    <div style={{ minHeight: "100vh", background: "#0d0d1a", fontFamily: "'DM Sans', sans-serif", color: "#f0f0f0", overflowX: "hidden" }}>
    <div style={{ minHeight: "100vh", background: "var(--bg)", fontFamily: "'DM Sans', sans-serif", color: "var(--text)", overflowX: "hidden" }}>
<style>{`
       @import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@300;400;500;600;700&family=Lora:ital,wght@0,400;0,600;1,400&family=Space+Mono:wght@400;700&display=swap');
       * { box-sizing: border-box; margin: 0; padding: 0; -webkit-tap-highlight-color: transparent; }
@@ -286,34 +366,35 @@ export default function App() {
       ::-webkit-scrollbar-thumb { background: #6C63FF44; border-radius: 99px; }
       [contenteditable]:empty:before { content: attr(data-placeholder); color: #555; pointer-events: none; }
       .btn-primary { background: linear-gradient(135deg,#6C63FF,#a855f7); color: #fff; border: none; border-radius: 12px; padding: 12px 22px; font-size: 15px; font-weight: 600; cursor: pointer; font-family: inherit; min-height: 48px; }
        .btn-ghost { background: rgba(255,255,255,0.06); color: #bbb; border: 1px solid rgba(255,255,255,0.1); border-radius: 12px; padding: 10px 18px; font-size: 14px; cursor: pointer; font-family: inherit; min-height: 44px; }
        .btn-danger { background: rgba(239,68,68,0.12); color: #ef4444; border: 1px solid rgba(239,68,68,0.2); border-radius: 10px; padding: 8px 14px; font-size: 14px; cursor: pointer; font-family: inherit; min-height: 40px; }
        .input-base { background: rgba(255,255,255,0.05); border: 1.5px solid rgba(255,255,255,0.1); border-radius: 12px; padding: 12px 16px; color: #f0f0f0; font-size: 16px; outline: none; font-family: inherit; width: 100%; min-height: 48px; }
        .btn-ghost { background: var(--btnGhost); color: var(--btnGhostColor); border: 1px solid var(--btnGhostBorder); border-radius: 12px; padding: 10px 18px; font-size: 14px; cursor: pointer; font-family: inherit; min-height: 44px; }
        .btn-danger { background: var(--danger); color: #ef4444; border: 1px solid var(--dangerBorder); border-radius: 10px; padding: 8px 14px; font-size: 14px; cursor: pointer; font-family: inherit; min-height: 40px; }
        .input-base { background: var(--inputBg); border: 1.5px solid var(--inputBorder); border-radius: 12px; padding: 12px 16px; color: var(--inputColor); font-size: 16px; outline: none; font-family: inherit; width: 100%; min-height: 48px; }
       .input-base:focus { border-color: #6C63FF; }
       .chip { display: inline-flex; align-items: center; padding: 4px 12px; border-radius: 99px; font-size: 12px; font-weight: 600; }
        .card { background: #13131f; border-radius: 16px; border: 1px solid rgba(255,255,255,0.07); }
        .card { background: var(--bg2); border-radius: 16px; border: 1px solid var(--border); }
       .fade-in { animation: fadeIn 0.3s ease; }
       @keyframes fadeIn { from { opacity:0; transform:translateY(6px); } to { opacity:1; transform:none; } }
       @keyframes pulse { 0%,100%{opacity:1} 50%{opacity:0.3} }
     `}</style>

<Sidebar open={sidebarOpen} onClose={() => setSidebarOpen(false)} user={user}
onLogout={handleLogout} onExport={() => exportData(courses)}
        onImport={() => importRef.current?.click()} saving={saving} />
        onImport={() => importRef.current?.click()} saving={saving}
        isDark={isDark} onToggleTheme={() => setIsDark(p => !p)} />
<input ref={importRef} type="file" accept=".json" style={{ display: "none" }}
onChange={e => { if (e.target.files[0]) importData(e.target.files[0], (data) => { updateCourses(() => data); e.target.value = ""; }); }} />

{/* NAVBAR */}
      <nav style={{ position: "sticky", top: 0, zIndex: 50, background: "rgba(13,13,26,0.92)", backdropFilter: "blur(20px)", borderBottom: "1px solid rgba(108,99,255,0.12)", padding: "0 16px", height: 56, display: "flex", alignItems: "center", justifyContent: "space-between" }}>
      <nav style={{ position: "sticky", top: 0, zIndex: 50, background: "var(--nav)", backdropFilter: "blur(20px)", borderBottom: "1px solid var(--border2)", padding: "0 16px", height: 56, display: "flex", alignItems: "center", justifyContent: "space-between" }}>
{/* LEFT: hamburger (dashboard) atau back icon (halaman lain) */}
{view === "dashboard" ? (
<button onClick={() => setSidebarOpen(true)} style={{ background: "none", border: "none", cursor: "pointer", padding: 8, display: "flex", flexDirection: "column", gap: 5, alignItems: "center", justifyContent: "center", minWidth: 40, minHeight: 40 }}>
            <span style={{ display: "block", width: 22, height: 2, background: "#f0f0f0", borderRadius: 2 }} />
            <span style={{ display: "block", width: 22, height: 2, background: "var(--text)", borderRadius: 2 }} />
<span style={{ display: "block", width: 22, height: 2, background: "#f0f0f0", borderRadius: 2 }} />
<span style={{ display: "block", width: 22, height: 2, background: "#f0f0f0", borderRadius: 2 }} />
</button>
) : (
          <button onClick={goBack} style={{ background: "none", border: "none", color: "#f0f0f0", cursor: "pointer", minWidth: 40, minHeight: 40, display: "flex", alignItems: "center", justifyContent: "center", borderRadius: 10, padding: 8 }}>
          <button onClick={goBack} style={{ background: "none", border: "none", color: "var(--text)", cursor: "pointer", minWidth: 40, minHeight: 40, display: "flex", alignItems: "center", justifyContent: "center", borderRadius: 10, padding: 8 }}>
<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
<polyline points="15 18 9 12 15 6" />
</svg>
@@ -385,7 +466,7 @@ function DashboardView({ courses, onOpen, onDelete, onAdd, user }) {
<div key={c.id} className="card" style={{ overflow: "hidden" }}>
<div onClick={() => onOpen(c.id)} style={{ height: 120, background: c.thumbnail ? "none" : `linear-gradient(135deg, ${color}33, ${color}11)`, position: "relative", overflow: "hidden", cursor: "pointer" }}>
{c.thumbnail ? <img src={c.thumbnail} alt="" style={{ width: "100%", height: "100%", objectFit: "cover" }} /> : <div style={{ width: "100%", height: "100%", display: "flex", alignItems: "center", justifyContent: "center" }}><span style={{ fontSize: 48 }}>{c.emoji || "📚"}</span></div>}
                  <div style={{ position: "absolute", bottom: 0, left: 0, right: 0, height: "50%", background: "linear-gradient(to top, #13131f, transparent)" }} />
                  <div style={{ position: "absolute", bottom: 0, left: 0, right: 0, height: "50%", background: "linear-gradient(to top, var(--bg2), transparent)" }} />
{progress === 100 && <div style={{ position: "absolute", top: 10, right: 10 }}><span className="chip" style={{ background: "#10B98122", color: "#10B981", border: "1px solid #10B98133" }}>✓ Selesai</span></div>}
</div>
<div style={{ padding: "14px 16px" }} onClick={() => onOpen(c.id)}>
@@ -422,7 +503,7 @@ function CourseView({ course, onOpenChapter, onAddChapter, onDeleteChapter, onTo
<div className="card" style={{ marginBottom: 20, overflow: "hidden" }}>
<div style={{ height: 160, background: course.thumbnail ? "none" : `linear-gradient(135deg, ${color}22, ${color}08)`, position: "relative", overflow: "hidden" }}>
{course.thumbnail ? <img src={course.thumbnail} alt="" style={{ width: "100%", height: "100%", objectFit: "cover" }} /> : <div style={{ width: "100%", height: "100%", display: "flex", alignItems: "center", justifyContent: "center" }}><span style={{ fontSize: 72 }}>{course.emoji || "📚"}</span></div>}
          <div style={{ position: "absolute", inset: 0, background: "linear-gradient(to top, #13131f 10%, transparent)" }} />
          <div style={{ position: "absolute", inset: 0, background: "linear-gradient(to top, var(--bg2) 10%, transparent)" }} />
</div>
<div style={{ padding: "16px 18px 20px" }}>
<h1 style={{ fontSize: 22, fontWeight: 700, marginBottom: 6 }}>{course.emoji} {course.title}</h1>
@@ -437,7 +518,7 @@ function CourseView({ course, onOpenChapter, onAddChapter, onDeleteChapter, onTo
</div>

<h2 style={{ fontSize: 16, fontWeight: 700, marginBottom: 12 }}>📖 Daftar Bab</h2>
      {course.chapters.length === 0 && <p style={{ color: "#555", fontSize: 14, marginBottom: 14 }}>Tambahkan bab pertama.</p>}
      {course.chapters.length === 0 && <p style={{ color: "var(--text3)", fontSize: 14, marginBottom: 14 }}>Tambahkan bab pertama.</p>}
<div style={{ display: "flex", flexDirection: "column", gap: 8, marginBottom: 16 }}>
{course.chapters.map((ch, i) => {
const chProgress = ch.subs?.length > 0 ? Math.round(ch.subs.filter(s => s.done).length / ch.subs.length * 100) : (ch.done ? 100 : 0);
@@ -446,7 +527,7 @@ function CourseView({ course, onOpenChapter, onAddChapter, onDeleteChapter, onTo
<div key={ch.id} className="card" style={{ padding: "14px 16px", border: `1px solid ${isDone ? color + "33" : "rgba(255,255,255,0.07)"}` }}
onClick={() => onOpenChapter(ch.id)}>
<div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                <span style={{ color: "#555", fontSize: 13, fontFamily: "'Space Mono', monospace", minWidth: 26 }}>{String(i + 1).padStart(2, "0")}</span>
                <span style={{ color: "var(--text3)", fontSize: 13, fontFamily: "'Space Mono', monospace", minWidth: 26 }}>{String(i + 1).padStart(2, "0")}</span>
<div style={{ flex: 1 }}>
<div style={{ fontWeight: 600, fontSize: 15 }}>{ch.title}</div>
{ch.subs?.length > 0 && (
@@ -482,7 +563,7 @@ function ChapterView({ course, chapter, onUpdateNote, onToggleDone, onAddSub, on
return (
<div>
<div className="card" style={{ padding: "16px 18px", marginBottom: 20, borderLeft: `4px solid ${color}` }}>
        <p style={{ color: "#666", fontSize: 12, marginBottom: 4 }}>{course.emoji} {course.title}</p>
        <p style={{ color: "var(--text2)", fontSize: 12, marginBottom: 4 }}>{course.emoji} {course.title}</p>
<div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12 }}>
<h1 style={{ fontSize: 20, fontWeight: 700, lineHeight: 1.3 }}>{chapter.title}</h1>
{chapter.subs.length === 0 && (
@@ -496,21 +577,21 @@ function ChapterView({ course, chapter, onUpdateNote, onToggleDone, onAddSub, on

{/* CHAPTER NOTE — FULL WIDTH */}
<div style={{ marginBottom: 24 }}>
        <h3 style={{ fontSize: 13, fontWeight: 600, color: "#888", marginBottom: 10, textTransform: "uppercase", letterSpacing: 1 }}>📝 Catatan Bab</h3>
        <h3 style={{ fontSize: 13, fontWeight: 600, color: "var(--text2)", marginBottom: 10, textTransform: "uppercase", letterSpacing: 1 }}>📝 Catatan Bab</h3>
<RichEditor value={chapter.note} onChange={onUpdateNote} placeholder="Tulis catatan bab ini..." />
</div>

{/* SUB CHAPTERS */}
<div>
        <h3 style={{ fontSize: 13, fontWeight: 600, color: "#888", marginBottom: 12, textTransform: "uppercase", letterSpacing: 1 }}>📑 Sub Bab</h3>
        {chapter.subs.length === 0 && <p style={{ color: "#555", fontSize: 14, marginBottom: 12 }}>Belum ada sub bab.</p>}
        <h3 style={{ fontSize: 13, fontWeight: 600, color: "var(--text2)", marginBottom: 12, textTransform: "uppercase", letterSpacing: 1 }}>📑 Sub Bab</h3>
        {chapter.subs.length === 0 && <p style={{ color: "var(--text3)", fontSize: 14, marginBottom: 12 }}>Belum ada sub bab.</p>}
<div style={{ display: "flex", flexDirection: "column", gap: 8, marginBottom: 14 }}>
{chapter.subs.map((s, i) => (
<div key={s.id} className="card" style={{ padding: "14px 16px", border: `1px solid ${s.done ? color + "33" : "rgba(255,255,255,0.07)"}`, cursor: "pointer" }}
onClick={() => onOpenSub(s.id)}>
<div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                <span style={{ color: "#555", fontSize: 12, fontFamily: "'Space Mono', monospace", minWidth: 22 }}>{i + 1}.</span>
                <span style={{ flex: 1, fontWeight: 500, fontSize: 15, textDecoration: s.done ? "line-through" : "none", color: s.done ? "#555" : "#f0f0f0" }}>{s.title}</span>
                <span style={{ color: "var(--text3)", fontSize: 12, fontFamily: "'Space Mono', monospace", minWidth: 22 }}>{i + 1}.</span>
                <span style={{ flex: 1, fontWeight: 500, fontSize: 15, textDecoration: s.done ? "line-through" : "none", color: s.done ? "var(--text3)" : "var(--text)" }}>{s.title}</span>
{s.note && <span style={{ fontSize: 14 }}>📝</span>}
<input type="checkbox" checked={s.done} onChange={e => { e.stopPropagation(); onUpdateSub(s.id, { done: e.target.checked }); }} style={{ width: 20, height: 20, accentColor: color, cursor: "pointer", flexShrink: 0 }} />
<button className="btn-danger" style={{ flexShrink: 0 }} onClick={e => { e.stopPropagation(); if (confirm("Hapus sub bab?")) onDeleteSub(s.id); }}>✕</button>
@@ -575,12 +656,12 @@ function AllNotesView({ course }) {
<div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
{allNotes.map((n, i) => (
<div key={i} className="card" style={{ overflow: "hidden" }}>
              <div style={{ padding: "10px 16px", borderBottom: "1px solid rgba(255,255,255,0.06)", display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
              <div style={{ padding: "10px 16px", borderBottom: "1px solid var(--border)", display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
<span className="chip" style={{ background: n.type === "chapter" ? "rgba(108,99,255,0.15)" : "rgba(168,85,247,0.15)", color: n.type === "chapter" ? "#6C63FF" : "#a855f7", border: `1px solid ${n.type === "chapter" ? "#6C63FF33" : "#a855f733"}` }}>{n.type === "chapter" ? "Bab" : "Sub Bab"}</span>
<span style={{ fontWeight: 600, fontSize: 14 }}>{n.title}</span>
{n.parent && <span style={{ color: "#555", fontSize: 12 }}>← {n.parent}</span>}
</div>
              <div style={{ padding: "14px 16px", color: "#ccc", fontSize: 15, lineHeight: 1.9, fontFamily: "'Lora', serif" }} dangerouslySetInnerHTML={{ __html: n.note }} />
              <div style={{ padding: "14px 16px", color: "var(--text2)", fontSize: 15, lineHeight: 1.9, fontFamily: "'Lora', serif" }} dangerouslySetInnerHTML={{ __html: n.note }} />
</div>
))}
</div>
@@ -605,9 +686,9 @@ function NewCourseModal({ onClose, onSave }) {
return (
<div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.75)", backdropFilter: "blur(8px)", display: "flex", alignItems: "flex-end", justifyContent: "center", zIndex: 200 }}
onClick={e => { if (e.target === e.currentTarget) onClose(); }}>
      <div style={{ background: "#13131f", borderRadius: "24px 24px 0 0", padding: "20px 20px 44px", width: "100%", maxWidth: 600, border: "1px solid rgba(108,99,255,0.2)", maxHeight: "92vh", overflowY: "auto" }}>
      <div style={{ background: "var(--bg2)", borderRadius: "24px 24px 0 0", padding: "20px 20px 44px", width: "100%", maxWidth: 600, border: "1px solid var(--border2)", maxHeight: "92vh", overflowY: "auto" }}>
{/* DRAG HANDLE */}
        <div style={{ width: 40, height: 4, background: "#333", borderRadius: 99, margin: "0 auto 20px" }} />
        <div style={{ width: 40, height: 4, background: "var(--border)", borderRadius: 99, margin: "0 auto 20px" }} />
<h2 style={{ fontWeight: 700, fontSize: 20, marginBottom: 20 }}>✨ Course Baru</h2>

<div style={{ height: 90, borderRadius: 14, marginBottom: 16, display: "flex", alignItems: "center", justifyContent: "center", background: thumbnail ? "none" : `linear-gradient(135deg, ${color}22, ${color}08)`, border: "1px solid rgba(255,255,255,0.07)", overflow: "hidden" }}>
