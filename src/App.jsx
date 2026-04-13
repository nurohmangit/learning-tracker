import { useState, useEffect, useRef, useCallback } from "react";

// ============================================================
// RICH TEXT EDITOR (Minimal Tiptap-like with contenteditable)
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
    <button
      key={key}
      onMouseDown={(e) => { e.preventDefault(); action(); }}
      style={{
        padding: "4px 10px",
        borderRadius: 6,
        border: "none",
        background: isActive[key] ? "#6C63FF" : "rgba(255,255,255,0.08)",
        color: isActive[key] ? "#fff" : "#aaa",
        cursor: "pointer",
        fontSize: 13,
        fontWeight: 600,
        transition: "all 0.15s",
      }}
    >
      {label}
    </button>
  );

  return (
    <div style={{ borderRadius: 12, overflow: "hidden", border: "1.5px solid rgba(108,99,255,0.25)", background: "rgba(255,255,255,0.03)" }}>
      <div style={{ display: "flex", gap: 4, padding: "8px 10px", borderBottom: "1px solid rgba(255,255,255,0.06)", flexWrap: "wrap" }}>
        {toolbarBtn("B", () => exec("bold"), "bold")}
        {toolbarBtn("I", () => exec("italic"), "italic")}
        {toolbarBtn("U", () => exec("underline"), "underline")}
        {toolbarBtn("• List", () => exec("insertUnorderedList"), "ul")}
        {toolbarBtn("1. List", () => exec("insertOrderedList"), "ol")}
        {toolbarBtn("H1", () => exec("formatBlock", "<h2>"), "h2")}
        {toolbarBtn("—", () => exec("insertHorizontalRule"), "hr")}
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
          minHeight: 120,
          padding: "14px 16px",
          outline: "none",
          color: "#e0e0e0",
          fontSize: 14,
          lineHeight: 1.8,
          fontFamily: "'Lora', serif",
        }}
      />
    </div>
  );
}

// ============================================================
// EMOJI PICKER (simple)
// ============================================================
const EMOJIS = ["📚","🎯","🌍","💻","🎨","🎵","🔬","🏆","✨","🚀","🧠","📝","💡","🌱","🔥","⚡","🎭","🎤","📊","🛠️"];

function EmojiPicker({ onSelect }) {
  return (
    <div style={{
      display: "grid", gridTemplateColumns: "repeat(5,1fr)", gap: 6,
      background: "#1a1a2e", borderRadius: 12, padding: 12,
      border: "1px solid rgba(108,99,255,0.3)", position: "absolute",
      zIndex: 100, top: "100%", left: 0, marginTop: 6,
      boxShadow: "0 20px 60px rgba(0,0,0,0.5)"
    }}>
      {EMOJIS.map(e => (
        <button key={e} onClick={() => onSelect(e)}
          style={{ fontSize: 22, background: "none", border: "none", cursor: "pointer", borderRadius: 8, padding: 4,
            transition: "background 0.15s" }}
          onMouseEnter={ev => ev.target.style.background = "rgba(108,99,255,0.2)"}
          onMouseLeave={ev => ev.target.style.background = "none"}
        >{e}</button>
      ))}
    </div>
  );
}

// ============================================================
// COLOR PALETTE
// ============================================================
const COLORS = ["#6C63FF","#FF6584","#43E97B","#F7971E","#0891B2","#7C3AED","#EC4899","#10B981","#F59E0B","#EF4444"];

// ============================================================
// PROGRESS BAR
// ============================================================
function ProgressBar({ percent, color = "#6C63FF", height = 8 }) {
  return (
    <div style={{ background: "rgba(255,255,255,0.08)", borderRadius: 999, height, overflow: "hidden" }}>
      <div style={{
        height: "100%", width: `${percent}%`, borderRadius: 999,
        background: `linear-gradient(90deg, ${color}, ${color}aa)`,
        transition: "width 0.6s cubic-bezier(.4,0,.2,1)",
        boxShadow: `0 0 8px ${color}66`
      }} />
    </div>
  );
}

// ============================================================
// CALCULATE PROGRESS
// ============================================================
function calcProgress(chapters) {
  let total = 0, done = 0;
  chapters.forEach(ch => {
    if (ch.subs && ch.subs.length > 0) {
      ch.subs.forEach(s => { total++; if (s.done) done++; });
    } else {
      total++;
      if (ch.done) done++;
    }
  });
  return total === 0 ? 0 : Math.round((done / total) * 100);
}

// ============================================================
// GENERATE ID
// ============================================================
let _id = Date.now();
const uid = () => (++_id).toString(36);

// ============================================================
// EXPORT / IMPORT
// ============================================================
function exportData(courses) {
  const blob = new Blob([JSON.stringify({ version: 1, courses, exportedAt: new Date().toISOString() }, null, 2)], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a"); a.href = url;
  a.download = `learning-tracker-${Date.now()}.json`; a.click();
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
// MAIN APP
// ============================================================
export default function App() {
  const [courses, setCourses] = useState(() => {
    try { return JSON.parse(localStorage.getItem("lt_courses") || "[]"); } catch { return []; }
  });
  const [view, setView] = useState("dashboard"); // dashboard | course | chapter | allnotes
  const [activeCourse, setActiveCourse] = useState(null);
  const [activeChapter, setActiveChapter] = useState(null);
  const [activeSub, setActiveSub] = useState(null);
  const [showNewCourse, setShowNewCourse] = useState(false);
  const [showAllNotes, setShowAllNotes] = useState(false);
  const importRef = useRef();

  useEffect(() => {
    localStorage.setItem("lt_courses", JSON.stringify(courses));
  }, [courses]);

  const updateCourses = (fn) => setCourses(prev => fn([...prev]));

  // ---- COURSE CRUD ----
  const addCourse = (course) => {
    setCourses(prev => [...prev, { ...course, id: uid(), chapters: [] }]);
  };
  const deleteCourse = (id) => setCourses(prev => prev.filter(c => c.id !== id));

  const getCourse = (id) => courses.find(c => c.id === id);
  const getChapter = (courseId, chId) => getCourse(courseId)?.chapters.find(ch => ch.id === chId);

  // ---- CHAPTER CRUD ----
  const addChapter = (courseId, title) => {
    updateCourses(cs => {
      const c = cs.find(x => x.id === courseId);
      if (c) c.chapters.push({ id: uid(), title, done: false, note: "", subs: [] });
      return cs;
    });
  };
  const updateChapter = (courseId, chId, patch) => {
    updateCourses(cs => {
      const c = cs.find(x => x.id === courseId);
      if (c) { const ch = c.chapters.find(x => x.id === chId); if (ch) Object.assign(ch, patch); }
      return cs;
    });
  };
  const deleteChapter = (courseId, chId) => {
    updateCourses(cs => {
      const c = cs.find(x => x.id === courseId);
      if (c) c.chapters = c.chapters.filter(x => x.id !== chId);
      return cs;
    });
  };

  // ---- SUB CRUD ----
  const addSub = (courseId, chId, title) => {
    updateCourses(cs => {
      const c = cs.find(x => x.id === courseId);
      const ch = c?.chapters.find(x => x.id === chId);
      if (ch) ch.subs.push({ id: uid(), title, done: false, note: "" });
      return cs;
    });
  };
  const updateSub = (courseId, chId, subId, patch) => {
    updateCourses(cs => {
      const c = cs.find(x => x.id === courseId);
      const ch = c?.chapters.find(x => x.id === chId);
      const sub = ch?.subs.find(x => x.id === subId);
      if (sub) Object.assign(sub, patch);
      return cs;
    });
  };
  const deleteSub = (courseId, chId, subId) => {
    updateCourses(cs => {
      const c = cs.find(x => x.id === courseId);
      const ch = c?.chapters.find(x => x.id === chId);
      if (ch) ch.subs = ch.subs.filter(x => x.id !== subId);
      return cs;
    });
  };

  const course = activeCourse ? getCourse(activeCourse) : null;
  const chapter = (activeCourse && activeChapter) ? getChapter(activeCourse, activeChapter) : null;

  // ============================================================
  // RENDER
  // ============================================================
  return (
    <div style={{
      minHeight: "100vh",
      background: "#0d0d1a",
      fontFamily: "'DM Sans', 'Segoe UI', sans-serif",
      color: "#f0f0f0",
    }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@300;400;500;600;700&family=Lora:ital,wght@0,400;0,600;1,400&family=Space+Mono:wght@400;700&display=swap');
        * { box-sizing: border-box; margin: 0; padding: 0; }
        ::-webkit-scrollbar { width: 6px; }
        ::-webkit-scrollbar-track { background: transparent; }
        ::-webkit-scrollbar-thumb { background: #6C63FF44; border-radius: 99px; }
        [contenteditable]:empty:before { content: attr(data-placeholder); color: #555; pointer-events: none; }
        .hover-lift { transition: transform 0.2s, box-shadow 0.2s; }
        .hover-lift:hover { transform: translateY(-3px); box-shadow: 0 12px 40px rgba(108,99,255,0.25) !important; }
        .btn-primary { background: linear-gradient(135deg,#6C63FF,#a855f7); color: #fff; border: none; border-radius: 10px; padding: 10px 20px; font-size: 14px; font-weight: 600; cursor: pointer; transition: opacity 0.2s, transform 0.15s; font-family: inherit; }
        .btn-primary:hover { opacity: 0.88; transform: scale(1.02); }
        .btn-ghost { background: rgba(255,255,255,0.06); color: #bbb; border: 1px solid rgba(255,255,255,0.1); border-radius: 10px; padding: 8px 16px; font-size: 14px; cursor: pointer; transition: background 0.2s; font-family: inherit; }
        .btn-ghost:hover { background: rgba(255,255,255,0.12); color: #fff; }
        .btn-danger { background: rgba(239,68,68,0.12); color: #ef4444; border: 1px solid rgba(239,68,68,0.2); border-radius: 8px; padding: 6px 12px; font-size: 13px; cursor: pointer; font-family: inherit; transition: background 0.2s; }
        .btn-danger:hover { background: rgba(239,68,68,0.25); }
        .input-base { background: rgba(255,255,255,0.05); border: 1.5px solid rgba(255,255,255,0.1); border-radius: 10px; padding: 10px 14px; color: #f0f0f0; font-size: 14px; outline: none; font-family: inherit; transition: border-color 0.2s; width: 100%; }
        .input-base:focus { border-color: #6C63FF; }
        .chip { display: inline-flex; align-items: center; gap: 4px; padding: 3px 10px; border-radius: 99px; font-size: 12px; font-weight: 600; }
        .fade-in { animation: fadeIn 0.35s ease; }
        @keyframes fadeIn { from { opacity:0; transform:translateY(8px); } to { opacity:1; transform:none; } }
      `}</style>

      {/* NAVBAR */}
      <nav style={{
        position: "sticky", top: 0, zIndex: 50,
        background: "rgba(13,13,26,0.85)", backdropFilter: "blur(20px)",
        borderBottom: "1px solid rgba(108,99,255,0.15)",
        padding: "0 24px", height: 60,
        display: "flex", alignItems: "center", justifyContent: "space-between"
      }}>
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          {view !== "dashboard" && (
            <button onClick={() => {
              if (view === "chapter" || view === "allnotes") { setView("course"); setActiveChapter(null); setActiveSub(null); }
              else { setView("dashboard"); setActiveCourse(null); }
            }} className="btn-ghost" style={{ padding: "6px 12px" }}>← Kembali</button>
          )}
          <span style={{ fontFamily: "'Space Mono', monospace", fontWeight: 700, fontSize: 16, letterSpacing: -0.5 }}>
            <span style={{ color: "#6C63FF" }}>◆</span> LearnTrack
          </span>
          {view === "course" && course && (
            <span style={{ color: "#666", fontSize: 13 }}>/ {course.emoji} {course.title}</span>
          )}
          {view === "chapter" && chapter && (
            <span style={{ color: "#666", fontSize: 13 }}>/ {course?.emoji} {course?.title} / {chapter.title}</span>
          )}
        </div>
        <div style={{ display: "flex", gap: 8 }}>
          <button onClick={() => exportData(courses)} className="btn-ghost" style={{ fontSize: 13 }}>⬆ Export</button>
          <button onClick={() => importRef.current?.click()} className="btn-ghost" style={{ fontSize: 13 }}>⬇ Import</button>
          <input ref={importRef} type="file" accept=".json" style={{ display: "none" }}
            onChange={e => { if (e.target.files[0]) importData(e.target.files[0], (data) => { setCourses(data); e.target.value = ""; }); }} />
        </div>
      </nav>

      {/* VIEWS */}
      <div style={{ maxWidth: 900, margin: "0 auto", padding: "32px 20px" }} className="fade-in">
        {view === "dashboard" && (
          <DashboardView
            courses={courses}
            onOpen={(id) => { setActiveCourse(id); setView("course"); }}
            onDelete={deleteCourse}
            onAdd={() => setShowNewCourse(true)}
          />
        )}
        {view === "course" && course && (
          <CourseView
            course={course}
            onOpenChapter={(chId) => { setActiveChapter(chId); setActiveSub(null); setView("chapter"); }}
            onAddChapter={(title) => addChapter(course.id, title)}
            onDeleteChapter={(chId) => deleteChapter(course.id, chId)}
            onToggleChapter={(chId, done) => updateChapter(course.id, chId, { done })}
            onShowAllNotes={() => setView("allnotes")}
            onUpdateCourse={(patch) => {
              setCourses(prev => prev.map(c => c.id === course.id ? { ...c, ...patch } : c));
            }}
          />
        )}
        {view === "chapter" && course && chapter && (
          <ChapterView
            course={course}
            chapter={chapter}
            onUpdateNote={(note) => updateChapter(course.id, chapter.id, { note })}
            onToggleDone={(done) => updateChapter(course.id, chapter.id, { done })}
            onAddSub={(title) => addSub(course.id, chapter.id, title)}
            onDeleteSub={(subId) => deleteSub(course.id, chapter.id, subId)}
            onUpdateSub={(subId, patch) => updateSub(course.id, chapter.id, subId, patch)}
            onSelectSub={(subId) => setActiveSub(subId)}
            activeSub={activeSub}
          />
        )}
        {view === "allnotes" && course && (
          <AllNotesView course={course} />
        )}
      </div>

      {/* MODAL NEW COURSE */}
      {showNewCourse && (
        <NewCourseModal
          onClose={() => setShowNewCourse(false)}
          onSave={(c) => { addCourse(c); setShowNewCourse(false); }}
        />
      )}
    </div>
  );
}

// ============================================================
// DASHBOARD VIEW
// ============================================================
function DashboardView({ courses, onOpen, onDelete, onAdd }) {
  return (
    <div>
      <div style={{ marginBottom: 40 }}>
        <div style={{ display: "flex", alignItems: "flex-end", justifyContent: "space-between", flexWrap: "wrap", gap: 16 }}>
          <div>
            <p style={{ color: "#6C63FF", fontWeight: 600, fontSize: 13, letterSpacing: 2, textTransform: "uppercase", marginBottom: 6 }}>Your Learning Journey</p>
            <h1 style={{ fontSize: 36, fontWeight: 700, lineHeight: 1.1, fontFamily: "'DM Sans', sans-serif" }}>
              Dashboard
              <span style={{ display: "block", fontSize: 16, fontWeight: 400, color: "#666", marginTop: 4 }}>
                {courses.length} course aktif
              </span>
            </h1>
          </div>
          <button className="btn-primary" onClick={onAdd} style={{ display: "flex", alignItems: "center", gap: 6 }}>
            + Course Baru
          </button>
        </div>

        {/* SUMMARY STATS */}
        {courses.length > 0 && (
          <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 16, marginTop: 28 }}>
            {[
              { label: "Total Course", value: courses.length, icon: "📚" },
              { label: "Selesai", value: courses.filter(c => calcProgress(c.chapters) === 100).length, icon: "🏆" },
              { label: "Rata-rata Progress", value: courses.length ? Math.round(courses.reduce((a, c) => a + calcProgress(c.chapters), 0) / courses.length) + "%" : "0%", icon: "📊" },
            ].map((s, i) => (
              <div key={i} style={{
                background: "rgba(108,99,255,0.07)", borderRadius: 16, padding: "18px 20px",
                border: "1px solid rgba(108,99,255,0.15)"
              }}>
                <div style={{ fontSize: 24, marginBottom: 6 }}>{s.icon}</div>
                <div style={{ fontSize: 28, fontWeight: 700, color: "#6C63FF" }}>{s.value}</div>
                <div style={{ fontSize: 13, color: "#888", marginTop: 2 }}>{s.label}</div>
              </div>
            ))}
          </div>
        )}
      </div>

      {courses.length === 0 ? (
        <div style={{ textAlign: "center", padding: "80px 20px" }}>
          <div style={{ fontSize: 64, marginBottom: 16 }}>🎯</div>
          <h2 style={{ color: "#666", fontWeight: 500 }}>Belum ada course</h2>
          <p style={{ color: "#444", marginTop: 8, marginBottom: 24 }}>Mulai perjalanan belajarmu dengan membuat course pertama</p>
          <button className="btn-primary" onClick={onAdd}>+ Buat Course Pertama</button>
        </div>
      ) : (
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(260px, 1fr))", gap: 20 }}>
          {courses.map(c => {
            const progress = calcProgress(c.chapters);
            const color = c.color || "#6C63FF";
            return (
              <div key={c.id} className="hover-lift" style={{
                borderRadius: 20, overflow: "hidden", cursor: "pointer",
                background: "#13131f", border: "1px solid rgba(255,255,255,0.07)",
                boxShadow: "0 4px 20px rgba(0,0,0,0.3)",
              }}>
                {/* THUMBNAIL */}
                <div onClick={() => onOpen(c.id)} style={{
                  height: 140, position: "relative", overflow: "hidden",
                  background: c.thumbnail ? "none" : `linear-gradient(135deg, ${color}33, ${color}11)`,
                }}>
                  {c.thumbnail ? (
                    <img src={c.thumbnail} alt="" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                  ) : (
                    <div style={{ width: "100%", height: "100%", display: "flex", alignItems: "center", justifyContent: "center" }}>
                      <span style={{ fontSize: 56 }}>{c.emoji || "📚"}</span>
                    </div>
                  )}
                  <div style={{
                    position: "absolute", bottom: 0, left: 0, right: 0, height: "50%",
                    background: "linear-gradient(to top, #13131f, transparent)"
                  }} />
                  {progress === 100 && (
                    <div style={{ position: "absolute", top: 12, right: 12 }}>
                      <span className="chip" style={{ background: "#10B98122", color: "#10B981", border: "1px solid #10B98133" }}>✓ Selesai</span>
                    </div>
                  )}
                </div>

                {/* INFO */}
                <div onClick={() => onOpen(c.id)} style={{ padding: "16px 18px 12px" }}>
                  <h3 style={{ fontWeight: 700, fontSize: 16, marginBottom: 4 }}>{c.emoji} {c.title}</h3>
                  <p style={{ color: "#777", fontSize: 13, marginBottom: 14, minHeight: 18 }}>{c.description || ""}</p>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}>
                    <span style={{ fontSize: 13, color: color, fontWeight: 600 }}>{progress}% selesai</span>
                    <span style={{ fontSize: 12, color: "#555" }}>{c.chapters.length} bab</span>
                  </div>
                  <ProgressBar percent={progress} color={color} />
                </div>
                <div style={{ padding: "0 18px 14px", display: "flex", justifyContent: "flex-end" }}>
                  <button className="btn-danger" onClick={(e) => { e.stopPropagation(); if (confirm("Hapus course ini?")) onDelete(c.id); }}>Hapus</button>
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
function CourseView({ course, onOpenChapter, onAddChapter, onDeleteChapter, onToggleChapter, onShowAllNotes, onUpdateCourse }) {
  const [newChTitle, setNewChTitle] = useState("");
  const [editTitle, setEditTitle] = useState(false);
  const progress = calcProgress(course.chapters);
  const color = course.color || "#6C63FF";

  return (
    <div>
      {/* COURSE HEADER */}
      <div style={{
        borderRadius: 24, overflow: "hidden", marginBottom: 32,
        background: "#13131f", border: "1px solid rgba(255,255,255,0.07)"
      }}>
        <div style={{
          height: 180, position: "relative",
          background: course.thumbnail ? "none" : `linear-gradient(135deg, ${color}22, ${color}08)`,
        }}>
          {course.thumbnail ? (
            <img src={course.thumbnail} alt="" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
          ) : (
            <div style={{ width: "100%", height: "100%", display: "flex", alignItems: "center", justifyContent: "center" }}>
              <span style={{ fontSize: 80 }}>{course.emoji || "📚"}</span>
            </div>
          )}
          <div style={{ position: "absolute", inset: 0, background: "linear-gradient(to top, #13131f 15%, transparent)" }} />
        </div>
        <div style={{ padding: "0 28px 28px" }}>
          <h1 style={{ fontSize: 28, fontWeight: 700, marginBottom: 8 }}>{course.emoji} {course.title}</h1>
          {course.description && <p style={{ color: "#888", marginBottom: 20 }}>{course.description}</p>}
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 10 }}>
            <span style={{ fontWeight: 700, color, fontSize: 18 }}>{progress}%</span>
            <button className="btn-ghost" style={{ fontSize: 13 }} onClick={onShowAllNotes}>📋 Semua Catatan</button>
          </div>
          <ProgressBar percent={progress} color={color} height={10} />
          <p style={{ color: "#555", fontSize: 13, marginTop: 8 }}>
            {course.chapters.filter(ch => ch.subs?.length > 0
              ? ch.subs.every(s => s.done)
              : ch.done
            ).length} / {course.chapters.length} bab selesai
          </p>
        </div>
      </div>

      {/* CHAPTERS */}
      <div style={{ marginBottom: 16 }}>
        <h2 style={{ fontSize: 18, fontWeight: 700, marginBottom: 16 }}>📖 Daftar Bab</h2>
        {course.chapters.length === 0 && (
          <p style={{ color: "#555", fontSize: 14, marginBottom: 16 }}>Belum ada bab. Tambahkan bab pertama di bawah.</p>
        )}
        <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
          {course.chapters.map((ch, i) => {
            const chProgress = ch.subs?.length > 0
              ? Math.round(ch.subs.filter(s => s.done).length / ch.subs.length * 100)
              : (ch.done ? 100 : 0);
            const isDone = ch.subs?.length > 0 ? ch.subs.every(s => s.done) : ch.done;
            return (
              <div key={ch.id} style={{
                background: "#13131f", borderRadius: 14,
                border: `1px solid ${isDone ? color + "33" : "rgba(255,255,255,0.07)"}`,
                padding: "14px 18px", display: "flex", alignItems: "center", gap: 14,
                transition: "border-color 0.3s"
              }}>
                <span style={{ color: "#666", fontSize: 13, fontFamily: "'Space Mono', monospace", minWidth: 28 }}>{String(i + 1).padStart(2, "0")}</span>
                <div style={{ flex: 1, cursor: "pointer" }} onClick={() => onOpenChapter(ch.id)}>
                  <div style={{ fontWeight: 600, fontSize: 15, marginBottom: ch.subs?.length > 0 ? 6 : 0 }}>{ch.title}</div>
                  {ch.subs?.length > 0 && (
                    <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                      <ProgressBar percent={chProgress} color={color} height={5} />
                      <span style={{ fontSize: 11, color: "#666", whiteSpace: "nowrap" }}>{ch.subs.filter(s => s.done).length}/{ch.subs.length}</span>
                    </div>
                  )}
                </div>
                {ch.note && <span title="Ada catatan" style={{ fontSize: 16 }}>📝</span>}
                {ch.subs?.length === 0 && (
                  <input type="checkbox" checked={ch.done} onChange={e => onToggleChapter(ch.id, e.target.checked)}
                    style={{ width: 18, height: 18, accentColor: color, cursor: "pointer" }} />
                )}
                <button className="btn-ghost" style={{ padding: "5px 10px", fontSize: 13 }} onClick={() => onOpenChapter(ch.id)}>Buka →</button>
                <button className="btn-danger" onClick={() => { if (confirm("Hapus bab ini?")) onDeleteChapter(ch.id); }}>✕</button>
              </div>
            );
          })}
        </div>
      </div>

      {/* ADD CHAPTER */}
      <div style={{ display: "flex", gap: 10, marginTop: 20 }}>
        <input className="input-base" placeholder="Nama bab baru..." value={newChTitle}
          onChange={e => setNewChTitle(e.target.value)}
          onKeyDown={e => { if (e.key === "Enter" && newChTitle.trim()) { onAddChapter(newChTitle.trim()); setNewChTitle(""); } }} />
        <button className="btn-primary" onClick={() => { if (newChTitle.trim()) { onAddChapter(newChTitle.trim()); setNewChTitle(""); } }}>+ Bab</button>
      </div>
    </div>
  );
}

// ============================================================
// CHAPTER VIEW
// ============================================================
function ChapterView({ course, chapter, onUpdateNote, onToggleDone, onAddSub, onDeleteSub, onUpdateSub, onSelectSub, activeSub }) {
  const [newSubTitle, setNewSubTitle] = useState("");
  const color = course.color || "#6C63FF";
  const currentSub = activeSub ? chapter.subs.find(s => s.id === activeSub) : null;

  return (
    <div style={{ display: "grid", gridTemplateColumns: currentSub ? "1fr 1fr" : "1fr", gap: 24 }}>
      {/* LEFT: Chapter content */}
      <div>
        <div style={{ marginBottom: 24 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 6 }}>
            <h1 style={{ fontSize: 24, fontWeight: 700 }}>{chapter.title}</h1>
            {chapter.subs.length === 0 && (
              <label style={{ display: "flex", alignItems: "center", gap: 6, cursor: "pointer", userSelect: "none" }}>
                <input type="checkbox" checked={chapter.done} onChange={e => onToggleDone(e.target.checked)}
                  style={{ width: 18, height: 18, accentColor: color }} />
                <span style={{ fontSize: 13, color: "#888" }}>Tandai selesai</span>
              </label>
            )}
          </div>
          <p style={{ color: "#555", fontSize: 13 }}>{course.emoji} {course.title}</p>
        </div>

        {/* CHAPTER NOTE */}
        <div style={{ marginBottom: 28 }}>
          <h3 style={{ fontSize: 14, fontWeight: 600, color: "#888", marginBottom: 10, textTransform: "uppercase", letterSpacing: 1 }}>📝 Catatan Bab</h3>
          <RichEditor value={chapter.note} onChange={onUpdateNote} placeholder="Tulis catatan untuk bab ini..." />
        </div>

        {/* SUB CHAPTERS */}
        <div>
          <h3 style={{ fontSize: 14, fontWeight: 600, color: "#888", marginBottom: 12, textTransform: "uppercase", letterSpacing: 1 }}>📑 Sub Bab</h3>
          {chapter.subs.length === 0 && (
            <p style={{ color: "#555", fontSize: 14, marginBottom: 12 }}>Belum ada sub bab.</p>
          )}
          <div style={{ display: "flex", flexDirection: "column", gap: 8, marginBottom: 14 }}>
            {chapter.subs.map((s, i) => (
              <div key={s.id} style={{
                background: activeSub === s.id ? `${color}15` : "#13131f",
                border: `1px solid ${activeSub === s.id ? color + "44" : s.done ? color + "22" : "rgba(255,255,255,0.07)"}`,
                borderRadius: 12, padding: "12px 16px",
                display: "flex", alignItems: "center", gap: 12,
                cursor: "pointer", transition: "all 0.2s"
              }} onClick={() => onSelectSub(activeSub === s.id ? null : s.id)}>
                <span style={{ color: "#666", fontSize: 12, fontFamily: "'Space Mono', monospace", minWidth: 24 }}>{i + 1}.</span>
                <span style={{ flex: 1, fontWeight: 500, fontSize: 14, textDecoration: s.done ? "line-through" : "none", color: s.done ? "#666" : "#f0f0f0" }}>{s.title}</span>
                {s.note && <span title="Ada catatan" style={{ fontSize: 14 }}>📝</span>}
                <input type="checkbox" checked={s.done} onChange={e => { e.stopPropagation(); onUpdateSub(s.id, { done: e.target.checked }); }}
                  style={{ width: 16, height: 16, accentColor: color, cursor: "pointer" }} />
                <button className="btn-danger" style={{ padding: "4px 8px" }} onClick={e => { e.stopPropagation(); if (confirm("Hapus sub bab?")) onDeleteSub(s.id); }}>✕</button>
              </div>
            ))}
          </div>
          <div style={{ display: "flex", gap: 10 }}>
            <input className="input-base" placeholder="Nama sub bab baru..." value={newSubTitle}
              onChange={e => setNewSubTitle(e.target.value)}
              onKeyDown={e => { if (e.key === "Enter" && newSubTitle.trim()) { onAddSub(newSubTitle.trim()); setNewSubTitle(""); } }} />
            <button className="btn-primary" onClick={() => { if (newSubTitle.trim()) { onAddSub(newSubTitle.trim()); setNewSubTitle(""); } }}>+ Sub</button>
          </div>
        </div>
      </div>

      {/* RIGHT: Sub note editor */}
      {currentSub && (
        <div className="fade-in" style={{
          background: "#13131f", borderRadius: 20, padding: 24,
          border: `1px solid ${color}33`, position: "sticky", top: 80, alignSelf: "start"
        }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
            <div>
              <h3 style={{ fontWeight: 700, fontSize: 16 }}>{currentSub.title}</h3>
              <p style={{ color: "#666", fontSize: 12, marginTop: 2 }}>Sub bab</p>
            </div>
            <label style={{ display: "flex", alignItems: "center", gap: 6, cursor: "pointer" }}>
              <input type="checkbox" checked={currentSub.done}
                onChange={e => onUpdateSub(currentSub.id, { done: e.target.checked })}
                style={{ width: 18, height: 18, accentColor: color }} />
              <span style={{ fontSize: 13, color: "#888" }}>Selesai</span>
            </label>
          </div>
          <RichEditor
            value={currentSub.note}
            onChange={val => onUpdateSub(currentSub.id, { note: val })}
            placeholder="Tulis catatan sub bab..."
          />
        </div>
      )}
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
    ch.subs?.forEach(s => {
      if (s.note) allNotes.push({ type: "sub", title: s.title, parent: ch.title, note: s.note });
    });
  });

  return (
    <div>
      <div style={{ marginBottom: 28 }}>
        <h1 style={{ fontSize: 26, fontWeight: 700 }}>📋 Semua Catatan</h1>
        <p style={{ color: "#666", marginTop: 4 }}>{course.emoji} {course.title} · {allNotes.length} catatan</p>
      </div>
      {allNotes.length === 0 ? (
        <div style={{ textAlign: "center", padding: "60px 20px" }}>
          <div style={{ fontSize: 48, marginBottom: 12 }}>📭</div>
          <p style={{ color: "#555" }}>Belum ada catatan di course ini.</p>
        </div>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
          {allNotes.map((n, i) => (
            <div key={i} style={{
              background: "#13131f", borderRadius: 16, padding: "20px 24px",
              border: "1px solid rgba(255,255,255,0.07)"
            }}>
              <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 12 }}>
                <span className="chip" style={{
                  background: n.type === "chapter" ? "rgba(108,99,255,0.15)" : "rgba(168,85,247,0.15)",
                  color: n.type === "chapter" ? "#6C63FF" : "#a855f7",
                  border: `1px solid ${n.type === "chapter" ? "#6C63FF33" : "#a855f733"}`
                }}>{n.type === "chapter" ? "Bab" : "Sub Bab"}</span>
                <span style={{ fontWeight: 600, fontSize: 15 }}>{n.title}</span>
                {n.parent && <span style={{ color: "#555", fontSize: 13 }}>← {n.parent}</span>}
              </div>
              <div style={{ color: "#ccc", fontSize: 14, lineHeight: 1.8, fontFamily: "'Lora', serif" }}
                dangerouslySetInnerHTML={{ __html: n.note }} />
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ============================================================
// NEW COURSE MODAL
// ============================================================
function NewCourseModal({ onClose, onSave }) {
  const [title, setTitle] = useState("");
  const [desc, setDesc] = useState("");
  const [emoji, setEmoji] = useState("📚");
  const [color, setColor] = useState("#6C63FF");
  const [thumbnail, setThumbnail] = useState(null);
  const [showEmoji, setShowEmoji] = useState(false);
  const [thumbnailMode, setThumbnailMode] = useState("emoji"); // emoji | upload
  const fileRef = useRef();

  const handleSave = () => {
    if (!title.trim()) return;
    onSave({ title: title.trim(), description: desc, emoji, color, thumbnail });
  };

  return (
    <div style={{
      position: "fixed", inset: 0, background: "rgba(0,0,0,0.7)", backdropFilter: "blur(8px)",
      display: "flex", alignItems: "center", justifyContent: "center", zIndex: 200, padding: 20
    }} onClick={e => { if (e.target === e.currentTarget) onClose(); }}>
      <div className="fade-in" style={{
        background: "#13131f", borderRadius: 24, padding: 32, width: "100%", maxWidth: 500,
        border: "1px solid rgba(108,99,255,0.25)", boxShadow: "0 40px 80px rgba(0,0,0,0.6)"
      }}>
        <h2 style={{ fontWeight: 700, fontSize: 22, marginBottom: 24 }}>✨ Course Baru</h2>

        {/* PREVIEW */}
        <div style={{
          height: 100, borderRadius: 16, marginBottom: 20, display: "flex", alignItems: "center", justifyContent: "center",
          background: thumbnail ? "none" : `linear-gradient(135deg, ${color}22, ${color}08)`,
          border: "1px solid rgba(255,255,255,0.07)", overflow: "hidden"
        }}>
          {thumbnail ? (
            <img src={thumbnail} alt="" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
          ) : (
            <span style={{ fontSize: 48 }}>{emoji}</span>
          )}
        </div>

        {/* THUMBNAIL MODE */}
        <div style={{ display: "flex", gap: 8, marginBottom: 16 }}>
          <button className={thumbnailMode === "emoji" ? "btn-primary" : "btn-ghost"}
            style={{ flex: 1, padding: "8px 0" }}
            onClick={() => { setThumbnailMode("emoji"); setThumbnail(null); }}>Emoji + Warna</button>
          <button className={thumbnailMode === "upload" ? "btn-primary" : "btn-ghost"}
            style={{ flex: 1, padding: "8px 0" }}
            onClick={() => setThumbnailMode("upload")}>Upload Gambar</button>
        </div>

        {thumbnailMode === "emoji" && (
          <div style={{ marginBottom: 16, display: "flex", gap: 12, alignItems: "center" }}>
            <div style={{ position: "relative" }}>
              <button className="btn-ghost" onClick={() => setShowEmoji(p => !p)} style={{ fontSize: 22, padding: "8px 14px" }}>{emoji}</button>
              {showEmoji && <EmojiPicker onSelect={e => { setEmoji(e); setShowEmoji(false); }} />}
            </div>
            <div style={{ display: "flex", gap: 6, flexWrap: "wrap", flex: 1 }}>
              {COLORS.map(c => (
                <button key={c} onClick={() => setColor(c)} style={{
                  width: 28, height: 28, borderRadius: "50%", background: c, border: `3px solid ${color === c ? "#fff" : "transparent"}`,
                  cursor: "pointer", transition: "border 0.15s"
                }} />
              ))}
            </div>
          </div>
        )}

        {thumbnailMode === "upload" && (
          <div style={{ marginBottom: 16 }}>
            <input type="file" accept="image/*" ref={fileRef} style={{ display: "none" }}
              onChange={e => {
                const f = e.target.files[0];
                if (f) { const r = new FileReader(); r.onload = ev => setThumbnail(ev.target.result); r.readAsDataURL(f); }
              }} />
            <button className="btn-ghost" style={{ width: "100%", padding: 16 }} onClick={() => fileRef.current?.click()}>
              {thumbnail ? "✓ Gambar dipilih — klik untuk ganti" : "📁 Pilih gambar dari perangkat"}
            </button>
          </div>
        )}

        <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
          <input className="input-base" placeholder="Judul course (wajib)" value={title}
            onChange={e => setTitle(e.target.value)} autoFocus />
          <input className="input-base" placeholder="Deskripsi singkat (opsional)" value={desc}
            onChange={e => setDesc(e.target.value)} />
        </div>

        <div style={{ display: "flex", gap: 10, marginTop: 24 }}>
          <button className="btn-ghost" style={{ flex: 1 }} onClick={onClose}>Batal</button>
          <button className="btn-primary" style={{ flex: 2 }} onClick={handleSave} disabled={!title.trim()}>Buat Course →</button>
        </div>
      </div>
    </div>
  );
}

