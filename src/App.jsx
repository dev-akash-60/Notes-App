import React, { useEffect, useMemo, useRef, useState } from "react";
import DOMPurify from "dompurify";
import {
  Archive, ArrowDownWideNarrow, Check, ChevronDown, FileText, Folder,
  Grid2X2, Heart, Home, List, Menu, Moon, MoreHorizontal, Pin, Plus,
  Search, Settings, SlidersHorizontal, Sun, Trash2, Undo2, X,
  Bold, Italic, Underline, List as ListIcon, ListOrdered, Palette,
  PanelLeftClose, PanelLeftOpen, Sparkles, Clock3, Command
} from "lucide-react";
import "./index.css";

const STORAGE_KEY = "atelier-notes-v1";
const COLORS = [
  { name: "Paper", value: "#fffdf8" },
  { name: "Lavender", value: "#f0edff" },
  { name: "Sage", value: "#eaf3eb" },
  { name: "Peach", value: "#fff0e7" },
  { name: "Blue", value: "#eaf2fb" },
  { name: "Rose", value: "#faeaf0" },
];

const starterNotes = [
  {
    id: "welcome-note",
    title: "A calmer way to think",
    content: "<p>Make space for the things that matter.</p><p>Your notes, ideas, and little sparks of inspiration belong here. Keep it simple, keep it yours.</p>",
    folder: "Personal",
    color: "#f0edff",
    favorite: true,
    pinned: true,
    deleted: false,
    updatedAt: Date.now() - 1000 * 60 * 18,
    createdAt: Date.now() - 1000 * 60 * 60 * 24,
  },
  {
    id: "project-ideas",
    title: "Ideas worth exploring",
    content: "<ul><li>Build something useful</li><li>Keep the experience beautifully simple</li><li>Make time for deep work</li></ul>",
    folder: "Work",
    color: "#eaf3eb",
    favorite: false,
    pinned: false,
    deleted: false,
    updatedAt: Date.now() - 1000 * 60 * 60 * 3,
    createdAt: Date.now() - 1000 * 60 * 60 * 5,
  },
  {
    id: "weekend-list",
    title: "A slow weekend",
    content: "<p>Read a few chapters, take a long walk, and make something good to eat.</p>",
    folder: "Personal",
    color: "#fff0e7",
    favorite: false,
    pinned: false,
    deleted: false,
    updatedAt: Date.now() - 1000 * 60 * 60 * 26,
    createdAt: Date.now() - 1000 * 60 * 60 * 30,
  },
];

function readNotes() {
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) return JSON.parse(saved);
    // Import compatible data if an earlier version saved an array under either key.
    for (const key of ["notes", "tasks", "task"]) {
      const legacy = localStorage.getItem(key);
      if (!legacy) continue;
      const parsed = JSON.parse(legacy);
      if (Array.isArray(parsed)) {
        return parsed.map((item, index) => ({
          id: item.id || `imported-${Date.now()}-${index}`,
          title: item.title || "Untitled note",
          content: item.content || `<p>${String(item.details || "").replaceAll("&", "&amp;").replaceAll("<", "&lt;").replaceAll(">", "&gt;").replaceAll("\n", "<br>")}</p>`,
          folder: item.folder || "Personal",
          color: item.color || "#fffdf8",
          favorite: Boolean(item.favorite),
          pinned: Boolean(item.pinned),
          deleted: Boolean(item.deleted),
          updatedAt: item.updatedAt || Date.now(),
          createdAt: item.createdAt || Date.now(),
        }));
      }
    }
  } catch (error) {
    console.error("Could not load saved notes:", error);
  }
  return starterNotes;
}

const plainText = (html = "") => {
  const element = document.createElement("div");
  element.innerHTML = DOMPurify.sanitize(html);
  return element.textContent || element.innerText || "";
};

const relativeDate = (value) => {
  const diff = Math.max(0, Date.now() - value);
  const minutes = Math.floor(diff / 60000);
  if (minutes < 1) return "Just now";
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  if (hours < 48) return "Yesterday";
  return new Date(value).toLocaleDateString(undefined, { month: "short", day: "numeric" });
};

export default function App() {
  const [notes, setNotes] = useState(readNotes);
  const [activeId, setActiveId] = useState(null);
  const [section, setSection] = useState("home");
  const [query, setQuery] = useState("");
  const [folderFilter, setFolderFilter] = useState("All folders");
  const [sortBy, setSortBy] = useState("updated");
  const [view, setView] = useState("grid");
  const [theme, setTheme] = useState(() => localStorage.getItem("atelier-theme") || "light");
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [mobileMenu, setMobileMenu] = useState(false);
  const [editorOpen, setEditorOpen] = useState(false);
  const [savedLabel, setSavedLabel] = useState("All changes saved");
  const [showSort, setShowSort] = useState(false);
  const [showColor, setShowColor] = useState(false);
  const [showFolder, setShowFolder] = useState(false);
  const [customFolder, setCustomFolder] = useState("");
  const [extraFolders, setExtraFolders] = useState(() => { try { return JSON.parse(localStorage.getItem("folio-folders") || "[]"); } catch { return []; } });
  const editorRef = useRef(null);
  const saveTimer = useRef(null);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(notes));
  }, [notes]);

  useEffect(() => {
    localStorage.setItem("folio-folders", JSON.stringify(extraFolders));
  }, [extraFolders]);

  useEffect(() => {
    document.documentElement.dataset.theme = theme;
    localStorage.setItem("atelier-theme", theme);
  }, [theme]);

  const activeNote = notes.find((note) => note.id === activeId) || null;
  useEffect(() => {
    if (editorOpen && activeNote && editorRef.current) editorRef.current.innerHTML = DOMPurify.sanitize(activeNote.content || "");
  }, [activeId, editorOpen]);
  const folders = useMemo(() => ["Personal", "Work", ...extraFolders, ...notes.map((n) => n.folder).filter(Boolean)].filter((v, i, a) => a.indexOf(v) === i), [notes, extraFolders]);
  const activeCount = notes.filter((n) => !n.deleted).length;

  const visibleNotes = useMemo(() => {
    let result = notes.filter((note) => {
      if (section === "trash") return note.deleted;
      if (note.deleted) return false;
      if (section === "favorites" && !note.favorite) return false;
      if (section === "pinned" && !note.pinned) return false;
      if (section === "folder" && note.folder !== folderFilter) return false;
      if (section === "home" && note.pinned) return true;
      return true;
    });
    if (section === "home") {
      const pinned = result.filter((n) => n.pinned);
      const recent = result.filter((n) => !n.pinned).sort((a, b) => b.updatedAt - a.updatedAt);
      result = [...pinned, ...recent];
    }
    if (folderFilter !== "All folders" && section !== "folder") result = result.filter((n) => n.folder === folderFilter);
    if (query.trim()) {
      const q = query.toLowerCase();
      result = result.filter((n) => n.title.toLowerCase().includes(q) || plainText(n.content).toLowerCase().includes(q));
    }
    return [...result].sort((a, b) => sortBy === "created" ? b.createdAt - a.createdAt : sortBy === "title" ? a.title.localeCompare(b.title) : b.updatedAt - a.updatedAt);
  }, [notes, section, folderFilter, query, sortBy]);

  const openNote = (note) => {
    setActiveId(note.id);
    setEditorOpen(true);
    setSavedLabel("All changes saved");
    setShowColor(false);
  };

  const createNote = () => {
    const now = Date.now();
    const note = {
      id: crypto.randomUUID ? crypto.randomUUID() : `note-${now}`,
      title: "",
      content: "",
      folder: "Personal",
      color: "#fffdf8",
      favorite: false,
      pinned: false,
      deleted: false,
      createdAt: now,
      updatedAt: now,
    };
    setNotes((prev) => [note, ...prev]);
    setActiveId(note.id);
    setEditorOpen(true);
    setSection("all");
    setSavedLabel("New note");
  };

  const updateNote = (patch) => {
    if (!activeId) return;
    setSavedLabel("Saving…");
    setNotes((prev) => prev.map((note) => note.id === activeId ? { ...note, ...patch, updatedAt: Date.now() } : note));
    clearTimeout(saveTimer.current);
    saveTimer.current = setTimeout(() => setSavedLabel("All changes saved"), 450);
  };

  const closeEditor = () => {
    setEditorOpen(false);
    setActiveId(null);
    setShowColor(false);
  };

  const toggleNoteFlag = (id, key) => setNotes((prev) => prev.map((n) => n.id === id ? { ...n, [key]: !n[key], updatedAt: Date.now() } : n));
  const moveToTrash = (id) => {
    setNotes((prev) => prev.map((n) => n.id === id ? { ...n, deleted: true, updatedAt: Date.now() } : n));
    if (id === activeId) closeEditor();
  };
  const restoreNote = (id) => setNotes((prev) => prev.map((n) => n.id === id ? { ...n, deleted: false, updatedAt: Date.now() } : n));
  const permanentlyDelete = (id) => {
    if (window.confirm("Delete this note permanently? This cannot be undone.")) setNotes((prev) => prev.filter((n) => n.id !== id));
  };
  const chooseSection = (value) => {
    setSection(value);
    setFolderFilter("All folders");
    setMobileMenu(false);
    closeEditor();
  };
  const execFormat = (command) => {
    editorRef.current?.focus();
    document.execCommand(command, false);
    if (editorRef.current) updateNote({ content: DOMPurify.sanitize(editorRef.current.innerHTML) });
  };
  const handleEditorInput = () => {
    if (editorRef.current) updateNote({ content: DOMPurify.sanitize(editorRef.current.innerHTML) });
  };
  const addFolder = () => {
    const name = customFolder.trim();
    if (name && !folders.includes(name)) setExtraFolders((prev) => [...prev, name]);
    if (name) setNotes((prev) => prev.map((n) => n.id === activeId ? { ...n, folder: name, updatedAt: Date.now() } : n));
    if (name) setCustomFolder("");
    setShowFolder(false);
  };

  const sectionTitle = section === "home" ? "Your space" : section === "all" ? "All notes" : section === "favorites" ? "Favorites" : section === "pinned" ? "Pinned notes" : section === "trash" ? "Recently deleted" : folderFilter;
  const navItems = [
    { id: "home", label: "Home", icon: Home },
    { id: "all", label: "All notes", icon: FileText, count: activeCount },
    { id: "favorites", label: "Favorites", icon: Heart },
    { id: "pinned", label: "Pinned", icon: Pin },
    { id: "trash", label: "Trash", icon: Trash2, count: notes.filter((n) => n.deleted).length },
  ];

  return (
    <div className="app-shell">
      <aside className={`sidebar ${sidebarOpen ? "sidebar-open" : "sidebar-closed"} ${mobileMenu ? "mobile-visible" : ""}`}>
        <div className="brand-row">
          <div className="brand-mark"><Sparkles size={18} strokeWidth={2.2} /></div>
          <span className="brand-name">folio<span>.</span></span>
          <button className="icon-button sidebar-collapse" aria-label="Collapse sidebar" onClick={() => setSidebarOpen(false)}><PanelLeftClose size={17} /></button>
          <button className="icon-button mobile-close" aria-label="Close menu" onClick={() => setMobileMenu(false)}><X size={18} /></button>
        </div>
        <button className="new-note-button" onClick={createNote}><Plus size={17} /> <span>New note</span><kbd>⌘ N</kbd></button>
        <div className="nav-label">WORKSPACE</div>
        <nav className="main-nav">
          {navItems.map(({ id, label, icon: Icon, count }) => (
            <button key={id} className={`nav-item ${section === id ? "active" : ""}`} onClick={() => chooseSection(id)}>
              <Icon size={17} strokeWidth={1.8} /><span>{label}</span>{count > 0 && <small>{count}</small>}
            </button>
          ))}
        </nav>
        <div className="nav-label folder-heading"><span>FOLDERS</span><button className="tiny-icon" onClick={() => setShowFolder((v) => !v)} aria-label="Add folder"><Plus size={15} /></button></div>
        {showFolder && (
          <form className="folder-create" onSubmit={(e) => { e.preventDefault(); if (customFolder.trim()) { const name = customFolder.trim(); setExtraFolders((prev) => prev.includes(name) ? prev : [...prev, name]); setFolderFilter(name); setSection("folder"); setCustomFolder(""); setShowFolder(false); } }}>
            <input value={customFolder} onChange={(e) => setCustomFolder(e.target.value)} placeholder="Folder name" autoFocus />
            <button type="submit"><Check size={14} /></button>
          </form>
        )}
        <nav className="folder-nav">
          {folders.map((folder) => <button key={folder} className={`nav-item ${section === "folder" && folderFilter === folder ? "active" : ""}`} onClick={() => { setSection("folder"); setFolderFilter(folder); setMobileMenu(false); closeEditor(); }}><Folder size={16} /><span>{folder}</span><small>{notes.filter((n) => !n.deleted && n.folder === folder).length}</small></button>)}
        </nav>
        <div className="sidebar-bottom">
          <div className="storage-card"><div className="storage-icon"><Sparkles size={15} /></div><div><strong>A little more clarity.</strong><span>Your thoughts, beautifully kept.</span></div></div>
          <button className="nav-item settings-link" onClick={() => chooseSection("settings")}><Settings size={17} /><span>Settings</span></button>
          <div className="profile-row"><div className="avatar">A</div><div className="profile-copy"><strong>My workspace</strong><span>Personal account</span></div><MoreHorizontal size={18} className="muted-icon" /></div>
        </div>
      </aside>

      <main className="main-area">
        <header className="topbar">
          <div className="topbar-left">
            {!sidebarOpen && <button className="icon-button" onClick={() => setSidebarOpen(true)} aria-label="Open sidebar"><PanelLeftOpen size={18} /></button>}
            <button className="icon-button mobile-menu-button" onClick={() => setMobileMenu(true)} aria-label="Open menu"><Menu size={19} /></button>
            <div className="breadcrumb">Workspace <span>/</span> <strong>{sectionTitle}</strong></div>
          </div>
          <div className="topbar-actions">
            <div className="topbar-date"><Clock3 size={14} /> {new Date().toLocaleDateString(undefined, { weekday: "short", month: "short", day: "numeric" })}</div>
            <button className="icon-button theme-toggle" aria-label="Toggle theme" onClick={() => setTheme(theme === "light" ? "dark" : "light")}>{theme === "light" ? <Moon size={17} /> : <Sun size={17} />}</button>
            <div className="avatar top-avatar">A</div>
          </div>
        </header>

        {section === "settings" ? (
          <section className="settings-page">
            <div className="eyebrow">PREFERENCES</div><h1>Settings</h1><p className="page-subtitle">Make Folio feel a little more like yours.</p>
            <div className="settings-panel"><div><strong>Appearance</strong><span>Choose the look that feels right.</span></div><div className="theme-options"><button className={theme === "light" ? "selected" : ""} onClick={() => setTheme("light")}><Sun size={17} /> Light</button><button className={theme === "dark" ? "selected" : ""} onClick={() => setTheme("dark")}><Moon size={17} /> Dark</button></div></div>
            <div className="settings-panel"><div><strong>Your notes</strong><span>{activeCount} active notes · {notes.filter((n) => n.deleted).length} in trash</span></div><span className="local-badge"><Check size={13} /> Saved on this device</span></div>
            <p className="settings-footnote">Your notes are stored locally in this browser. Clearing browser data may remove them, so export or back them up before resetting your device.</p>
          </section>
        ) : !editorOpen ? (
          <section className="content-area">
            <div className="welcome-row">
              <div><div className="eyebrow">{section === "home" ? "MONDAY STATE OF MIND" : "YOUR COLLECTION"}</div><h1>{section === "home" ? "A little space to think." : sectionTitle}</h1><p className="page-subtitle">{section === "home" ? "Keep your thoughts close and your mind clear." : section === "trash" ? "Notes stay here until you restore or permanently delete them." : "Everything you want to remember, in one calm place."}</p></div>
              <button className="primary-button desktop-create" onClick={createNote}><Plus size={17} /> Create note</button>
            </div>

            {section === "home" && (
              <div className="stats-strip">
                <div className="stat-card"><span className="stat-icon lavender"><FileText size={17} /></span><div><strong>{activeCount}</strong><span>Total notes</span></div></div>
                <div className="stat-card"><span className="stat-icon peach"><Pin size={17} /></span><div><strong>{notes.filter((n) => n.pinned && !n.deleted).length}</strong><span>Pinned notes</span></div></div>
                <div className="stat-card"><span className="stat-icon sage"><Heart size={17} /></span><div><strong>{notes.filter((n) => n.favorite && !n.deleted).length}</strong><span>Favorites</span></div></div>
              </div>
            )}

            <div className="notes-toolbar">
              <div className="search-box"><Search size={17} /><input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Search your notes..." /><kbd>⌘ K</kbd>{query && <button onClick={() => setQuery("")} aria-label="Clear search"><X size={14} /></button>}</div>
              <div className="toolbar-right">
                <select className="folder-select" value={folderFilter} onChange={(e) => setFolderFilter(e.target.value)} aria-label="Filter by folder"><option>All folders</option>{folders.map((f) => <option key={f}>{f}</option>)}</select>
                <div className="sort-wrap"><button className="toolbar-button" onClick={() => setShowSort((v) => !v)}><ArrowDownWideNarrow size={16} /><span>Sort</span></button>{showSort && <div className="popover-menu">{[["updated", "Last edited"], ["created", "Date created"], ["title", "Title A–Z"]].map(([v, label]) => <button key={v} onClick={() => { setSortBy(v); setShowSort(false); }}>{label}{sortBy === v && <Check size={14} />}</button>)}</div>}</div>
                <div className="view-switch"><button className={view === "grid" ? "chosen" : ""} onClick={() => setView("grid")} aria-label="Grid view"><Grid2X2 size={16} /></button><button className={view === "list" ? "chosen" : ""} onClick={() => setView("list")} aria-label="List view"><List size={17} /></button></div>
              </div>
            </div>

            <div className="section-heading"><div><h2>{section === "home" ? "Recently edited" : section === "trash" ? "Trash" : "Your notes"}</h2><span>{visibleNotes.length} {visibleNotes.length === 1 ? "note" : "notes"}</span></div>{section === "home" && <button className="text-button" onClick={() => chooseSection("all")}>View all <span>↗</span></button>}</div>

            {visibleNotes.length ? (
              <div className={`notes-grid ${view === "list" ? "list-view" : ""}`}>
                {visibleNotes.map((note) => (
                  <article key={note.id} className={`note-card ${view === "list" ? "note-row" : ""}`} style={{ "--note-color": note.color }} onClick={() => section !== "trash" && openNote(note)}>
                    <div className="note-card-top"><span className="note-folder"><Folder size={12} /> {note.folder}</span><div className="note-card-actions">
                      {!note.deleted && <button onClick={(e) => { e.stopPropagation(); toggleNoteFlag(note.id, "pinned"); }} aria-label="Toggle pin" className={note.pinned ? "flag-active" : ""}><Pin size={15} /></button>}
                      {!note.deleted && <button onClick={(e) => { e.stopPropagation(); toggleNoteFlag(note.id, "favorite"); }} aria-label="Toggle favorite" className={note.favorite ? "favorite-active" : ""}><Heart size={15} /></button>}
                      <button onClick={(e) => { e.stopPropagation(); note.deleted ? permanentlyDelete(note.id) : moveToTrash(note.id); }} aria-label={note.deleted ? "Delete permanently" : "Move to trash"}><Trash2 size={15} /></button>
                    </div></div>
                    <h3>{note.title || "Untitled note"}</h3><p className="note-excerpt">{plainText(note.content) || "A fresh page for your next idea…"}</p>
                    <div className="note-card-footer"><span>{relativeDate(note.updatedAt)}</span>{note.deleted ? <div className="restore-actions"><button onClick={(e) => { e.stopPropagation(); restoreNote(note.id); }}><Undo2 size={13} /> Restore</button><button onClick={(e) => { e.stopPropagation(); permanentlyDelete(note.id); }}>Delete forever</button></div> : <span className="note-open-hint">Open note ↗</span>}</div>
                  </article>
                ))}
              </div>
            ) : (
              <div className="empty-state"><div className="empty-art"><div className="empty-paper"><span /><span /><span /></div><Sparkles size={23} className="empty-sparkle" /></div><h3>{query ? "No notes found" : section === "trash" ? "Your trash is empty" : "A fresh page awaits."}</h3><p>{query ? "Try a different search or clear your filters." : section === "trash" ? "Deleted notes will appear here." : "Capture a thought before it slips away."}</p>{!query && section !== "trash" && <button className="primary-button" onClick={createNote}><Plus size={16} /> Create your first note</button>}</div>
            )}
          </section>
        ) : (
          <section className="editor-page">
            <div className="editor-topline"><button className="back-button" onClick={closeEditor}>← <span>All notes</span></button><div className="save-status"><span className="save-dot" />{savedLabel}</div><div className="editor-top-actions"><button className={`icon-button ${activeNote?.pinned ? "flag-active" : ""}`} onClick={() => toggleNoteFlag(activeId, "pinned")} aria-label="Pin note"><Pin size={17} /></button><button className={`icon-button ${activeNote?.favorite ? "favorite-active" : ""}`} onClick={() => toggleNoteFlag(activeId, "favorite")} aria-label="Favorite note"><Heart size={17} /></button><button className="icon-button danger-hover" onClick={() => moveToTrash(activeId)} aria-label="Move to trash"><Trash2 size={17} /></button></div></div>
            {activeNote && <div className="editor-paper" style={{ "--note-color": activeNote.color }}>
              <div className="editor-meta"><div className="editor-folder-wrap"><button className="editor-folder" onClick={() => setShowFolder((v) => !v)}><Folder size={14} /> {activeNote.folder} <ChevronDown size={13} /></button>{showFolder && <div className="popover-menu folder-popover">{folders.map((f) => <button key={f} onClick={() => { updateNote({ folder: f }); setShowFolder(false); }}>{f}{activeNote.folder === f && <Check size={14} />}</button>)}<div className="new-folder-line"><input value={customFolder} onChange={(e) => setCustomFolder(e.target.value)} placeholder="New folder…" /><button onClick={addFolder}><Plus size={14} /></button></div></div>}</div><span>Edited {relativeDate(activeNote.updatedAt)}</span></div>
              <input className="editor-title" value={activeNote.title} onChange={(e) => updateNote({ title: e.target.value })} placeholder="Untitled note" />
              <div className="format-toolbar">
                <button onClick={() => execFormat("bold")} title="Bold"><Bold size={16} /></button><button onClick={() => execFormat("italic")} title="Italic"><Italic size={16} /></button><button onClick={() => execFormat("underline")} title="Underline"><Underline size={16} /></button><span className="toolbar-divider" /><button onClick={() => execFormat("insertUnorderedList")} title="Bulleted list"><ListIcon size={17} /></button><button onClick={() => execFormat("insertOrderedList")} title="Numbered list"><ListOrdered size={17} /></button><span className="toolbar-divider" /><div className="color-picker-wrap"><button onClick={() => setShowColor((v) => !v)} title="Note color"><Palette size={16} /></button>{showColor && <div className="color-popover">{COLORS.map((c) => <button key={c.value} title={c.name} style={{ background: c.value }} className={activeNote.color === c.value ? "color-selected" : ""} onClick={() => { updateNote({ color: c.value }); setShowColor(false); }} />)}</div>}</div>
              </div>
              <div ref={editorRef} className="rich-editor" contentEditable suppressContentEditableWarning onInput={handleEditorInput} onBlur={handleEditorInput} data-placeholder="Start writing something wonderful…" />
              <div className="editor-footer"><span>{plainText(activeNote.content).trim().split(/\s+/).filter(Boolean).length} words</span><span>Folio keeps your changes automatically</span></div>
            </div>}
          </section>
        )}
      </main>
      {!editorOpen && section !== "settings" && <button className="floating-create" onClick={createNote} aria-label="Create note"><Plus size={23} /></button>}
      {mobileMenu && <div className="mobile-scrim" onClick={() => setMobileMenu(false)} />}
    </div>
  );
}
