import { useState, useEffect, useRef } from "react";

// ============================================================
// BRUTALIST DESIGN SYSTEM
// ============================================================
const B = {
  black: "#0a0a0a",
  white: "#f5f0e8",
  yellow: "#FFE500",
  red: "#FF2D00",
  blue: "#0057FF",
  green: "#00C853",
  border: "3px solid #0a0a0a",
  shadow: "4px 4px 0px #0a0a0a",
  shadowHover: "6px 6px 0px #0a0a0a",
  shadowInset: "inset 3px 3px 0px rgba(0,0,0,0.15)",
};

// ============================================================
// RICH TEXT EDITOR \u2014 BRUTALIST
// ============================================================
function RichEditor({ value, onChange, placeholder = "TULIS CATATAN..." }) {
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

  const TBtn = ({ label, action, k }) => (
    <button
      onMouseDown={(e) => { e.preventDefault(); action(); }}
      style={{
        padding: "4px 12px", border: B.border,
        background: isActive[k] ? B.yellow : B.white,
        color: B.black, cursor: "pointer", fontSize: 13,
        fontWeight: 800, fontFamily: "'Space Grotesk', sans-serif",
        boxShadow: isActive[k] ? "none" : "2px 2px 0 #0a0a0a",
        transform: isActive[k] ? "translate(2px,2px)" : "none",
        transition: "all 0.1s",
      }}
    >{label}</button>
  );

  return (
    <div style={{ border: B.border, background: B.white }}>
      <div style={{ display: "flex", gap: 4, padding: "8px", borderBottom: B.border, flexWrap: "wrap", background: "#e8e3d8" }}>
        <TBtn label="B" action={() => exec("bold")} k="bold" />
        <TBtn label="I" action={() => exec("italic")} k="italic" />
        <TBtn label="U" action={() => exec("underline")} k="underline" />
        <TBtn label="\u2022 LIST" action={() => exec("insertUnorderedList")} k="ul" />
        <TBtn label="1. LIST" action={() => exec("insertOrderedList")} k="ol" />
        <TBtn label="H1" action={() => exec("formatBlock", "<h2>")} k="h2" />
      </div>
      <div
        ref={editorRef}
        contentEditable
        suppressContentEditableWarning
        onInput={handleInput}
        onKeyUp={updateActive}
        onMouseUp={updateActive}
        data-placeholder={placeholder}
        style={{
          minHeight: 140, padding: "16px",
          outline: "none", color: B.black,
          fontSize: 15, lineHeight: 1.9,
          fontFamily: "'Courier Prime', 'Courier New', monospace",
        }}
      />
    </div>
  );
}

// ============================================================
// EMOJI PICKER
// ============================================================
const EMOJIS = ["\ud83d\udcda","\ud83c\udfaf","\ud83c\udf0d","\ud83d\udcbb","\ud83c\udfa8","\ud83c\udfb5","\ud83d\udd2c","\ud83c\udfc6","\u2728","\ud83d\ude80","\ud83e\udde0","\ud83d\udcdd","\ud83d\udca1","\ud83c\udf31","\ud83d\udd25","\u26a1","\ud83c\udfad","\ud83c\udfa4","\ud83d\udcca","\ud83d\udee0\ufe0f"];

function EmojiPicker({ onSelect }) {
  return (
    <div style={{
      display: "grid", gridTemplateColumns: "repeat(5,1fr)", gap: 4,
      background: B.white, border: B.border,
      boxShadow: B.shadow, padding: 10,
      position: "absolute", zIndex: 100, top: "100%", left: 0, marginTop: 4,
    }}>
      {EMOJIS.map(e => (
        <button key={e} onClick={() => onSelect(e)} style={{
          fontSize: 22, background: "none", border: "2px solid transparent",
          cursor: "pointer", padding: 4, transition: "all 0.1s"
        }}
          onMouseEnter={ev => { ev.target.style.background = B.yellow; ev.target.style.border = `2px solid ${B.black}`; }}
          onMouseLeave={ev => { ev.target.style.background = "none"; ev.target.style.border = "2px solid transparent"; }}
        >{e}</button>
      ))}
    </div>
  );
}

// ============================================================
// COLOR PALETTE
// ============================================================
const COLORS = ["#FFE500","#FF2D00","#0057FF","#00C853","#FF6B35","#9B59B6","#1ABC9C","#E74C3C","#F39C12","#2C3E50"];

// ============================================================
// PROGRESS BAR \u2014 BRUTALIST
// ============================================================
function ProgressBar({ percent, color = B.yellow, height = 20 }) {
  return (
    <div style={{ border: B.border, height, background: B.white, position: "relative", overflow: "hidden" }}>
      <div style={{
        height: "100%", width: `${percent}%`,
        background: color, transition: "width 0.5s ease",
        borderRight: percent > 0 && percent < 100 ? B.border : "none",
      }} />
      <span style={{
        position: "absolute", right: 8, top: "50%", transform: "translateY(-50%)",
        fontSize: 11, fontWeight: 800, fontFamily: "'Space Grotesk', sans-serif",
        color: B.black, mixBlendMode: "multiply"
      }}>{percent}%</span>
    </div>
  );
}

// ============================================================
// CALC PROGRESS
// ============================================================
function calcProgress(chapters) {
  let total = 0, done = 0;
  chapters.forEach(ch => {
    if (ch.subs && ch.subs.length > 0) {
      ch.subs.forEach(s => { total++; if (s.done) done++; });
    } else { total++; if (ch.done) done++; }
  });
  return total === 0 ? 0 : Math.round((done / total) * 100);
}

let _id = Date.now();
const uid = () => (++_id).toString(36);

// ============================================================
// EXPORT / IMPORT
// ============================================================
function exportData(courses) {
  const blob = new Blob([JSON.stringify({ version: 1, courses, exportedAt: new Date().toISOString() }, null, 2)], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a"); a.href = url;
  a.download = `learntrack-${Date.now()}.json`; a.click();
  URL.revokeObjectURL(url);
}

function importData(file, onSuccess) {
  const reader = new FileReader();
  reader.onload = e => {
    try {
      const data = JSON.parse(e.target.result);
      if (data.courses) onSuccess(data.courses);
    } catch { alert("File tidak valid!"); }
  };
  reader.readAsText(file);
}

// ============================================================
// BRUTALIST BUTTON
// ============================================================
function BBtn({ children, onClick, color = B.yellow, style = {}, small = false }) {
  const [pressed, setPressed] = useState(false);
  return (
    <button
      onClick={onClick}
      onMouseDown={() => setPressed(true)}
      onMouseUp={() => setPressed(false)}
      onMouseLeave={() => setPressed(false)}
      style={{
        padding: small ? "5px 12px" : "10px 20px",
        border: B.border, background: color,
        color: B.black, fontWeight: 800,
        fontSize: small ? 12 : 14,
        cursor: "pointer", fontFamily: "'Space Grotesk', sans-serif",
        boxShadow: pressed ? "none" : B.shadow,
        transform: pressed ? "translate(4px,4px)" : "none",
        transition: "all 0.08s", letterSpacing: 0.5,
        ...style
      }}
    >{children}</button>
  );
}

function BDangerBtn({ children, onClick }) {
  return <BBtn onClick={onClick} color={B.red} small style={{ color: B.white }}>{children}</BBtn>;
}

// ============================================================
// BRUTALIST INPUT
// ============================================================
function BInput({ value, onChange, placeholder, onKeyDown, autoFocus, style = {} }) {
  return (
    <input
      value={value} onChange={onChange} placeholder={placeholder}
      onKeyDown={onKeyDown} autoFocus={autoFocus}
      style={{
        border: B.border, padding: "10px 14px",
        background: B.white, color: B.black,
        fontSize: 14, fontWeight: 600, outline: "none",
        fontFamily: "'Space Grotesk', sans-serif",
        boxShadow: B.shadowInset, width: "100%",
        ...style
      }}
    />
  );
}

// ============================================================
// MAIN APP
// ============================================================
export default function App() {
  const [courses, setCourses] = useState(() => {
    try { return JSON.parse(localStorage.getItem("lt_courses") || "[]"); } catch { return []; }
  });
  const [view, setView] = useState("dashboard");
  const [activeCourse, setActiveCourse] = useState(null);
  const [activeChapter, setActiveChapter] = useState(null);
  const [activeSub, setActiveSub] = useState(null);
  const [showNewCourse, setShowNewCourse] = useState(false);
  const importRef = useRef();

  useEffect(() => {
    localStorage.setItem("lt_courses", JSON.stringify(courses));
  }, [courses]);

  const updateCourses = (fn) => setCourses(prev => fn([...prev]));

  const addCourse = (course) => setCourses(prev => [...prev, { ...course, id: uid(), chapters: [] }]);
  const deleteCourse = (id) => setCourses(prev => prev.filter(c => c.id !== id));
  const getCourse = (id) => courses.find(c => c.id === id);
  const getChapter = (courseId, chId) => getCourse(courseId)?.chapters.find(ch => ch.id === chId);

  const addChapter = (courseId, title) => updateCourses(cs => {
    const c = cs.find(x => x.id === courseId);
    if (c) c.chapters.push({ id: uid(), title, done: false, note: "", subs: [] });
    return cs;
  });
  const updateChapter = (courseId, chId, patch) => updateCourses(cs => {
    const c = cs.find(x => x.id === courseId);
    if (c) { const ch = c.chapters.find(x => x.id === chId); if (ch) Object.assign(ch, patch); }
    return cs;
  });
  const deleteChapter = (courseId, chId) => updateCourses(cs => {
    const c = cs.find(x => x.id === courseId);
    if (c) c.chapters = c.chapters.filter(x => x.id !== chId);
    return cs;
  });
  const addSub = (courseId, chId, title) => updateCourses(cs => {
    const c = cs.find(x => x.id === courseId);
    const ch = c?.chapters.find(x => x.id === chId);
    if (ch) ch.subs.push({ id: uid(), title, done: false, note: "" });
    return cs;
  });
  const updateSub = (courseId, chId, subId, patch) => updateCourses(cs => {
    const c = cs.find(x => x.id === courseId);
    const ch = c?.chapters.find(x => x.id === chId);
    const sub = ch?.subs.find(x => x.id === subId);
    if (sub) Object.assign(sub, patch);
    return cs;
  });
  const deleteSub = (courseId, chId, subId) => updateCourses(cs => {
    const c = cs.find(x => x.id === courseId);
    const ch = c?.chapters.find(x => x.id === chId);
    if (ch) ch.subs = ch.subs.filter(x => x.id !== subId);
    return cs;
  });

  const course = activeCourse ? getCourse(activeCourse) : null;
  const chapter = (activeCourse && activeChapter) ? getChapter(activeCourse, activeChapter) : null;

  return (
    <div style={{ minHeight: "100vh", background: B.white, fontFamily: "'Space Grotesk', sans-serif", color: B.black }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Space+Grotesk:wght@400;600;700;800&family=Courier+Prime:ital,wght@0,400;0,700;1,400&display=swap');
        * { box-sizing: border-box; margin: 0; padding: 0; }
        ::-webkit-scrollbar { width: 8px; }
        ::-webkit-scrollbar-track { background: #e8e3d8; }
        ::-webkit-scrollbar-thumb { background: #0a0a0a; }
        [contenteditable]:empty:before { content: attr(data-placeholder); color: #999; pointer-events: none; font-style: italic; }
        .brut-card { border: 3px solid #0a0a0a; box-shadow: 4px 4px 0 #0a0a0a; transition: box-shadow 0.1s, transform 0.1s; background: #f5f0e8; }
        .brut-card:hover { box-shadow: 7px 7px 0 #0a0a0a; transform: translate(-2px,-2px); }
        h1,h2,h3,h4 { font-family: 'Space Grotesk', sans-serif; }
      `}</style>

      {/* NAVBAR */}
      <nav style={{
        position: "sticky", top: 0, zIndex: 50,
        background: B.black, borderBottom: `4px solid ${B.black}`,
        padding: "0 24px", height: 60,
        display: "flex", alignItems: "center", justifyContent: "space-between"
      }}>
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          {view !== "dashboard" && (
            <BBtn small color={B.white