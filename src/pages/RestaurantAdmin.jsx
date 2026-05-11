import { useState, useRef, useEffect, useCallback } from "react";
import { QRCodeCanvas } from "qrcode.react";
import { supabase } from "../supabase";

// ✅ Dynamic base URL — works on any domain, no hardcoding
const MENU_QR_BASE = `${window.location.origin}/menu`;

const sanitizeFileName = (name) => {
  return name
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-zA-Z0-9._-]/g, "-")
    .toLowerCase();
};

// Resize to max 800px on the long edge, re-encode as JPEG q=0.7.
// Returns a Blob on success, or the original file as a fallback (e.g. SVG/HEIC the browser can't decode).
const compressImage = (file) => {
  return new Promise((resolve) => {
    if (!file || !file.type?.startsWith("image/")) { resolve(file); return; }
    const url = URL.createObjectURL(file);
    const img = document.createElement("img");
    img.onload = () => {
      const maxSize = 800;
      let width = img.width;
      let height = img.height;
      if (width > height && width > maxSize) {
        height = (height * maxSize) / width;
        width = maxSize;
      } else if (height > maxSize) {
        width = (width * maxSize) / height;
        height = maxSize;
      }
      const canvas = document.createElement("canvas");
      canvas.width = Math.round(width);
      canvas.height = Math.round(height);
      const ctx = canvas.getContext("2d");
      ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
      canvas.toBlob(
        (blob) => {
          URL.revokeObjectURL(url);
          resolve(blob || file);
        },
        "image/jpeg",
        0.7
      );
    };
    img.onerror = () => {
      URL.revokeObjectURL(url);
      resolve(file);
    };
    img.src = url;
  });
};

const getMenuImagePublicUrl = (value) => {
  if (!value) return "";
  if (/^https?:\/\//i.test(value)) return value;

  const storageKey = value.replace(/^\/+/, "").replace(/^menu_images\//, "");
  const { data } = supabase.storage.from("menu_images").getPublicUrl(storageKey);
  return data?.publicUrl || "";
};

const GS = () => (
  <style>{`
    @import url('https://fonts.googleapis.com/css2?family=Syne:wght@400;500;600;700;800&family=DM+Mono:wght@300;400;500&display=swap');
    *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
    body { background: #f5f0e8; }
    ::-webkit-scrollbar { width: 3px; }
    ::-webkit-scrollbar-thumb { background: #d4c9b8; }
    input, select, textarea { font-family: inherit; }
    input:focus, select:focus, textarea:focus { outline: none; border-color: #1a1714 !important; }
    @keyframes fadeUp { from { opacity:0; transform:translateY(10px); } to { opacity:1; transform:translateY(0); } }
    @keyframes fadeIn  { from { opacity:0; } to { opacity:1; } }
    @keyframes shake   { 0%,100%{transform:translateX(0)} 20%{transform:translateX(-8px)} 40%{transform:translateX(8px)} 60%{transform:translateX(-5px)} 80%{transform:translateX(5px)} }
    .fade-up  { animation: fadeUp 0.3s cubic-bezier(0.16,1,0.3,1) both; }
    .fade-in  { animation: fadeIn 0.2s ease both; }
    .row-hover:hover { background: #ede7da !important; }
    .nav-hover:hover { background: #f0ebe2 !important; color: #1a1714 !important; }
    .icon-hover:hover { background: #e4dcd0 !important; }
    .btn-accent { transition: opacity 0.15s ease, transform 0.12s ease; }
    .btn-accent:hover:not(:disabled) { opacity: 0.9; }
    .btn-accent:active:not(:disabled) { transform: scale(0.99); }
    .btn-ghost { transition: background 0.15s ease, border-color 0.15s ease, color 0.15s ease; }
    .btn-ghost:hover:not(:disabled) { background: #faf7f2 !important; border-color: #c4b8a8 !important; color: #1a1714 !important; }
    .btn-signout { transition: background 0.15s ease, border-color 0.15s ease, color 0.15s ease; }
    .btn-signout:hover { background: #faf7f2 !important; border-color: #c4b8a8 !important; color: #1a1714 !important; }
    .btn-qr-download { transition: background 0.15s ease, border-color 0.15s ease, color 0.15s ease; }
    .btn-qr-download:hover { background: #faf7f2 !important; border-color: #c4b8a8 !important; color: #1a1714 !important; }
    .btn-close { transition: background 0.15s ease, color 0.15s ease; }
    .btn-close:hover { background: #e4dcd0 !important; color: #1a1714 !important; }
    .chip-avail { transition: filter 0.12s ease, opacity 0.12s ease; }
    .chip-avail:hover { filter: brightness(0.97); }
    .admin-table-wrap { overflow-x: auto; -webkit-overflow-scrolling: touch; }
    .orders-board { display: grid; grid-template-columns: repeat(4, 1fr); gap: 16px; }
    .qr-card { transition: box-shadow 0.2s ease, transform 0.15s ease; }
    .qr-card:hover { box-shadow: 0 4px 20px rgba(0,0,0,0.08) !important; transform: translateY(-1px); }
    @media (max-width: 1100px) {
      .orders-board { grid-template-columns: repeat(2, 1fr); }
    }
    @media (max-width: 640px) {
      .orders-board { grid-template-columns: 1fr; }
    }
    @media (max-width: 768px) {
      .admin-root { flex-direction: column !important; height: auto !important; min-height: 100vh; overflow: visible !important; }
      .admin-sidebar { width: 100% !important; flex-shrink: 0; border-right: none !important; border-bottom: 1px solid #e4dcd0; }
      .admin-sidebar-nav { display: flex !important; flex-direction: row !important; overflow-x: auto; flex-wrap: nowrap; gap: 4px; padding: 10px 12px !important; -webkit-overflow-scrolling: touch; border-top: 1px solid #ede7da; }
      .admin-sidebar-nav > button { flex: 0 0 auto; white-space: nowrap; }
      .admin-main { padding: 20px 16px !important; }
      .menu-toolbar { flex-direction: column !important; align-items: stretch !important; gap: 14px !important; }
      .menu-toolbar-controls { flex-direction: column !important; width: 100%; gap: 10px !important; }
      .menu-toolbar-controls input, .menu-toolbar-controls select { width: 100% !important; }
    }
  `}</style>
);

const ORDER_META = {
  new:       { label:"New",       bg:"#fef6e8", text:"#b45309", dot:"#f59e0b" },
  preparing: { label:"Preparing", bg:"#e8ecf5", text:"#3d55a0", dot:"#5c6bc0" },
  ready:     { label:"Ready",     bg:"#eaf5ea", text:"#2e7d32", dot:"#4caf50" },
  done:      { label:"Done",      bg:"#f5f0e8", text:"#a89880", dot:"#c4b8a8" },
};

const fmt = (n) => `₼${Number(n).toFixed(2)}`;

function normalizeFeatures(row) {
  const f = row?.features;
  if (f && typeof f === "object" && !Array.isArray(f)) {
    const ordering = f.ordering === true;
    return { ordering, payment: ordering && !!f.payment };
  }
  return { ordering: false, payment: false };
}

function formatRelativeTime(iso) {
  if (!iso) return "—";
  const t = new Date(iso).getTime();
  if (Number.isNaN(t)) return "—";
  const s = Math.max(0, Math.floor((Date.now() - t) / 1000));
  if (s < 60) return `${s || 1} sec ago`;
  if (s < 3600) return `${Math.floor(s / 60)} min ago`;
  if (s < 86400) return `${Math.floor(s / 3600)} hr ago`;
  return `${Math.floor(s / 86400)} days ago`;
}

function parseOrderItems(raw) {
  if (Array.isArray(raw)) return raw;
  if (typeof raw === "string") {
    try {
      const v = JSON.parse(raw);
      return Array.isArray(v) ? v : [];
    } catch {
      return [];
    }
  }
  return [];
}

function mapCategoryFromDb(row) {
  return {
    id: String(row.id),
    name: row.name ?? "",
    icon: row.icon || "🍽️",
    sort: row.sort_order ?? row.sort ?? 0,
  };
}

function mapItemFromDb(row) {
  return {
    id: String(row.id),
    cat: String(row.category_id ?? row.cat ?? ""),
    name: row.name ?? "",
    name_az: row.name_az ?? "",
    name_ru: row.name_ru ?? "",
    desc: row.description ?? row.desc ?? "",
    desc_az: row.desc_az ?? "",
    desc_ru: row.desc_ru ?? "",
    price: Number(row.price ?? 0),
    img: getMenuImagePublicUrl(row.image_url ?? row.img ?? ""),
    available: !!row.available,
  };
}

function mapOrderFromDb(row) {
  const items = parseOrderItems(row.items).map((it) => ({
    name: it.name ?? "",
    qty: Number(it.qty ?? it.quantity ?? 1),
  }));
  return {
    id: String(row.id),
    table: row.table_number ?? row.table ?? 0,
    status: row.status,
    items,
    total: Number(row.total ?? 0),
    time: formatRelativeTime(row.created_at),
  };
}

function Login({ onLogin, busy }) {
  const [pw, setPw] = useState("");
  const [err, setErr] = useState(false);
  const [shake, setShake] = useState(false);
  const attempt = async () => {
    setErr(false);
    const ok = await onLogin(pw);
    if (!ok) {
      setErr(true);
      setShake(true);
      setTimeout(() => setShake(false), 500);
    }
  };
  return (
    <div style={{ minHeight:"100vh", background:"#f5f0e8", display:"flex", alignItems:"center", justifyContent:"center", fontFamily:"Syne, sans-serif" }}>
      <GS />
      <div className="fade-up" style={{ width:380, padding:"48px 40px", background:"#fff", border:"1px solid #e4dcd0", borderRadius:20, boxShadow:"0 4px 32px rgba(0,0,0,0.06)" }}>
        <div style={{ width:48, height:48, background:"#1a1714", borderRadius:12, display:"flex", alignItems:"center", justifyContent:"center", fontSize:22, marginBottom:24 }}>🍽️</div>
        <div style={{ fontSize:24, fontWeight:800, color:"#1a1714", letterSpacing:"-0.02em", marginBottom:4 }}>Restaurant Admin</div>
        <div style={{ fontSize:12, color:"#a89880", fontFamily:"DM Mono", marginBottom:36 }}>Sign in with your restaurant password</div>
        <div style={{ fontSize:10, color:"#b0a090", fontFamily:"DM Mono", letterSpacing:"0.12em", marginBottom:8 }}>PASSWORD</div>
        <input type="password" value={pw} autoFocus disabled={busy}
          onChange={e => { setPw(e.target.value); setErr(false); }}
          onKeyDown={e => e.key==="Enter" && !busy && attempt()}
          placeholder="Enter your password"
          style={{ width:"100%", background:"#faf7f2", border:`1.5px solid ${err?"#ef5350":"#e4dcd0"}`, borderRadius:10, padding:"12px 14px", color:"#1a1714", fontSize:14, fontFamily:"DM Mono", animation:shake?"shake 0.4s ease":"none", transition:"border-color 0.2s", opacity:busy?0.7:1 }}
        />
        {err && <div style={{ color:"#c62828", fontSize:11, fontFamily:"DM Mono", marginTop:6 }}>Incorrect password</div>}
        <button type="button" className="btn-accent" disabled={busy} onClick={attempt} style={{ marginTop:20, width:"100%", background:"#1a1714", color:"#f5f0e8", border:"none", borderRadius:10, padding:"13px", fontSize:13, fontWeight:700, cursor:busy?"wait":"pointer", fontFamily:"Syne", minHeight:44, opacity:busy?0.85:1 }}>
          {busy ? "Signing in…" : "Sign In →"}
        </button>
      </div>
    </div>
  );
}

function Field({ label, children, style }) {
  return (
    <div style={{ display:"flex", flexDirection:"column", gap:6, ...style }}>
      <label style={{ fontSize:10, fontFamily:"DM Mono", color:"#a89880", letterSpacing:"0.1em" }}>{label.toUpperCase()}</label>
      {children}
    </div>
  );
}

const ITEM_LANG_TABS = [
  { code: "EN", label: "EN" },
  { code: "AZ", label: "AZ" },
  { code: "RU", label: "RU" },
];

function itemModalInitialForm(item, cats) {
  if (!item) {
    return {
      name: "",
      name_az: "",
      name_ru: "",
      desc: "",
      desc_az: "",
      desc_ru: "",
      price: "",
      cat: cats[0]?.id ?? "",
      img: "",
      available: true,
    };
  }
  return {
    id: item.id,
    name: item.name ?? "",
    name_az: item.name_az ?? "",
    name_ru: item.name_ru ?? "",
    desc: item.desc ?? "",
    desc_az: item.desc_az ?? "",
    desc_ru: item.desc_ru ?? "",
    price: String(item.price ?? ""),
    cat: item.cat,
    img: item.img ?? "",
    available: !!item.available,
  };
}

function ItemModal({ item, cats, onSave, onClose, showToast }) {
  const [form, setForm] = useState(() => itemModalInitialForm(item, cats));
  const [langTab, setLangTab] = useState("EN");
  const [imageUploading, setImageUploading] = useState(false);
  const [itemSaving, setItemSaving] = useState(false);
  const fileInputRef = useRef(null);
  const set = (k, v) => setForm((p) => ({ ...p, [k]: v }));
  useEffect(() => {
    setForm(itemModalInitialForm(item, cats));
    setLangTab("EN");
  }, [item, cats]);
  const nameKey = langTab === "EN" ? "name" : langTab === "AZ" ? "name_az" : "name_ru";
  const descKey = langTab === "EN" ? "desc" : langTab === "AZ" ? "desc_az" : "desc_ru";
  const valid = form.name.trim() && form.price;
  const onImageFile = async (e) => {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;
    try {
      setImageUploading(true);
      const compressed = await compressImage(file);
      const storageKey = `${Date.now()}-${sanitizeFileName(file.name)}`;
      const { error } = await supabase.storage.from("menu_images").upload(storageKey, compressed, {
        cacheControl: "31536000",
        contentType: compressed?.type || file.type,
      });
      if (error) {
        showToast(error.message, "warn");
        return;
      }
      const publicUrl = getMenuImagePublicUrl(storageKey);
      if (publicUrl) set("img", publicUrl);
    } catch (err) {
      console.error("Upload error:", err);
      showToast(err?.message || "Image upload failed", "warn");
    } finally {
      setImageUploading(false);
    }
  };
  const handleSave = async () => {
    if (!valid || imageUploading || itemSaving) return;
    setItemSaving(true);
    try {
      await onSave(form);
    } finally {
      setItemSaving(false);
    }
  };
  return (
    <div style={S.overlay} onClick={onClose}>
      <div
        className="fade-up"
        style={{ ...S.modal, maxHeight:"90vh", overflowY:"hidden", display:"flex", flexDirection:"column", paddingBottom:0 }}
        onClick={e=>e.stopPropagation()}
      >
        <div style={{ flexShrink:0, paddingBottom:20 }}>
          <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center" }}>
            <span style={S.modalTitle}>{item?"Edit Item":"New Item"}</span>
            <button type="button" className="btn-close" style={S.closeBtn} onClick={onClose} aria-label="Close">✕</button>
          </div>
        </div>
        <div style={{ flex:1, minHeight:0, overflowY:"auto", WebkitOverflowScrolling:"touch" }}>
          <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:14, paddingBottom:8 }}>
            <div style={{ gridColumn:"1/-1" }}>
              <label style={{ fontSize:10, fontFamily:"DM Mono", color:"#a89880", letterSpacing:"0.1em", display:"block", marginBottom:6 }}>LANGUAGE</label>
              <div style={{ display:"flex", gap:4, marginBottom:14, background:"#faf7f2", borderRadius:8, padding:4, border:"1px solid #ede7da" }}>
                {ITEM_LANG_TABS.map(({ code, label }) => (
                  <button
                    key={code}
                    type="button"
                    onClick={() => setLangTab(code)}
                    style={{
                      flex: 1,
                      padding: "8px 10px",
                      borderRadius: 6,
                      border: "none",
                      cursor: "pointer",
                      fontFamily: "DM Mono, monospace",
                      fontSize: 11,
                      fontWeight: 600,
                      letterSpacing: "0.06em",
                      transition: "background 0.15s, color 0.15s",
                      background: langTab === code ? "#1a1714" : "transparent",
                      color: langTab === code ? "#f5f0e8" : "#8a7d6b",
                    }}
                  >
                    {label}
                  </button>
                ))}
              </div>
            </div>
            <Field label="Item Name" style={{ gridColumn:"1/-1" }}>
              <input
                style={S.inp}
                value={form[nameKey] ?? ""}
                onChange={(e) => set(nameKey, e.target.value)}
                placeholder={langTab === "EN" ? "e.g. Truffle Risotto" : langTab === "AZ" ? "Azərbaycan dilində ad" : "Название по-русски"}
              />
            </Field>
            <Field label="Price (₼)">
              <input style={S.inp} type="number" value={form.price} onChange={e=>set("price",e.target.value)} placeholder="0.00" />
            </Field>
            <Field label="Category">
              <select style={S.inp} value={form.cat} onChange={e=>set("cat",e.target.value)}>
                {cats.map(c=><option key={c.id} value={c.id}>{c.icon} {c.name}</option>)}
              </select>
            </Field>
            <Field label="Image" style={{ gridColumn:"1/-1" }}>
              <div style={{ width:"100%", height:180, borderRadius:10, marginBottom:10, background:"#faf7f2", overflow:"hidden" }}>
                {form.img ? (
                  <img src={form.img} alt="" style={{ width:"100%", height:"100%", objectFit:"cover", display:"block" }} onError={(ev)=>{ ev.target.style.display="none"; }} />
                ) : null}
              </div>
              <input ref={fileInputRef} type="file" accept="image/*" style={{ display:"none" }} onChange={(ev)=>void onImageFile(ev)} />
              <button type="button" className="btn-ghost" style={S.ghostBtn} disabled={imageUploading} onClick={()=>fileInputRef.current?.click()}>
                {imageUploading ? "Uploading..." : "Choose image"}
              </button>
            </Field>
            <Field label="Description" style={{ gridColumn:"1/-1" }}>
              <textarea
                style={{ ...S.inp, minHeight: 68, resize: "vertical" }}
                value={form[descKey] ?? ""}
                onChange={(e) => set(descKey, e.target.value)}
                placeholder={langTab === "EN" ? "Describe the dish…" : langTab === "AZ" ? "Təsvir (AZ)…" : "Описание (RU)…"}
              />
            </Field>
          </div>
          <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", padding:"12px 0", borderTop:"1px solid #f0ebe4", marginBottom:8 }}>
            <span style={{ fontSize:13, color:"#555", fontFamily:"Syne" }}>Available on menu</span>
            <div onClick={()=>set("available",!form.available)} style={{ width:44, height:24, borderRadius:12, background:form.available?"#1a1714":"#ddd", cursor:"pointer", transition:"background 0.2s", position:"relative" }}>
              <div style={{ position:"absolute", top:2, left:form.available?22:2, width:20, height:20, borderRadius:"50%", background:"#fff", boxShadow:"0 1px 4px rgba(0,0,0,0.2)", transition:"left 0.2s" }} />
            </div>
          </div>
          <div style={{ position:"sticky", bottom:0, background:"#fff", padding:"16px 0 4px", display:"flex", gap:10, justifyContent:"flex-end", flexWrap:"wrap" }}>
            <button type="button" className="btn-ghost" style={S.ghostBtn} onClick={onClose}>Cancel</button>
            <button
              type="button"
              className="btn-accent"
              style={{ ...S.accentBtn, opacity:valid&&!imageUploading&&!itemSaving?1:0.4, cursor:valid&&!imageUploading&&!itemSaving?"pointer":"not-allowed" }}
              disabled={!valid||imageUploading||itemSaving}
              onClick={()=>void handleSave()}
            >
              {itemSaving ? "Saving..." : item ? "Save Changes" : "Add Item"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

function CatModal({ cat, onSave, onClose }) {
  const [form, setForm] = useState(() => (cat ? { ...cat, sort: cat.sort ?? 0 } : { name: "", icon: "🍽️", sort: 0 }));
  const ICONS = ["🥗","🍽️","🍮","🥂","🍣","🥩","🥘","🍰","☕","🍹","🥐","🍜","🫕","🥙","🧆"];
  const valid = form.name.trim();
  return (
    <div style={S.overlay} onClick={onClose}>
      <div className="fade-up" style={{ ...S.modal, maxWidth:400 }} onClick={e=>e.stopPropagation()}>
        <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:20 }}>
          <span style={S.modalTitle}>{cat?"Edit Category":"New Category"}</span>
          <button type="button" className="btn-close" style={S.closeBtn} onClick={onClose} aria-label="Close">✕</button>
        </div>
        <div style={{ display:"flex", flexDirection:"column", gap:16, marginBottom:20 }}>
          <Field label="Name">
            <input style={S.inp} value={form.name} onChange={e=>setForm(p=>({...p,name:e.target.value}))} placeholder="e.g. Pasta" />
          </Field>
          <Field label="Icon">
            <div style={{ display:"flex", flexWrap:"wrap", gap:8 }}>
              {ICONS.map(ic=>(
                <div key={ic} onClick={()=>setForm(p=>({...p,icon:ic}))}
                  style={{ width:40, height:40, display:"flex", alignItems:"center", justifyContent:"center", fontSize:20, borderRadius:8, cursor:"pointer", border:form.icon===ic?"2px solid #1a1714":"2px solid transparent", background:form.icon===ic?"#f5f0e8":"#faf7f2" }}>
                  {ic}
                </div>
              ))}
            </div>
          </Field>
        </div>
        <div style={{ display:"flex", gap:10, justifyContent:"flex-end", flexWrap:"wrap" }}>
          <button type="button" className="btn-ghost" style={S.ghostBtn} onClick={onClose}>Cancel</button>
          <button type="button" className="btn-accent" style={{ ...S.accentBtn, opacity:valid?1:0.4, cursor:valid?"pointer":"not-allowed" }} disabled={!valid} onClick={()=>valid&&onSave(form)}>{cat?"Save":"Add"}</button>
        </div>
      </div>
    </div>
  );
}

function Confirm({ msg, onConfirm, onCancel, showSubline = true }) {
  return (
    <div style={S.overlay} onClick={onCancel}>
      <div className="fade-up" style={{ ...S.modal, maxWidth:340, padding:32, textAlign:"center" }} onClick={e=>e.stopPropagation()}>
        <div style={{ fontSize:36, marginBottom:14 }}>🗑</div>
        <div style={{ fontSize:15, fontWeight:600, color:"#1a1714", marginBottom: showSubline ? 6 : 24 }}>{msg}</div>
        {showSubline ? <div style={{ fontSize:12, color:"#a89880", fontFamily:"DM Mono", marginBottom:24 }}>Cannot be undone.</div> : null}
        <div style={{ display:"flex", gap:10 }}>
          <button type="button" className="btn-ghost" style={{ ...S.ghostBtn, flex:1 }} onClick={onCancel}>Cancel</button>
          <button type="button" className="btn-accent" style={{ ...S.accentBtn, flex:1, background:"#c62828" }} onClick={onConfirm}>Delete</button>
        </div>
      </div>
    </div>
  );
}

function OrderCard({ order, onStatusChange }) {
  const om = ORDER_META[order.status];
  const next = { new:"preparing", preparing:"ready", ready:"done" };
  const nextStatus = next[order.status];
  return (
    <div style={{ background:"#fff", border:"1px solid #e4dcd0", borderRadius:14, padding:"16px 18px 14px", boxShadow:"0 1px 8px rgba(0,0,0,0.03)", display:"flex", flexDirection:"column" }}>
      <div style={{ display:"flex", justifyContent:"space-between", alignItems:"flex-start", gap:12, marginBottom:10 }}>
        <div style={{ fontWeight:800, fontSize:16, color:"#1a1714", letterSpacing:"-0.02em" }}>Table {order.table}</div>
        <span style={{ fontSize:10, color:"#d4c9b8", fontFamily:"DM Mono", fontWeight:400, flexShrink:0, paddingTop:3 }}>{order.time}</span>
      </div>
      <div style={{ marginBottom:12 }}>
        <span style={{ display:"inline-flex", alignItems:"center", fontSize:11, fontFamily:"DM Mono", fontWeight:600, padding:"4px 12px", borderRadius:20, background:om.bg, color:om.text, lineHeight:1.2 }}>
          <span style={{ color:om.dot, marginRight:6, fontSize:8 }}>●</span>
          {om.label}
        </span>
      </div>
      <div style={{ display:"flex", flexDirection:"column", gap:6, marginBottom:14, flex:1 }}>
        {order.items.map((it,i)=>(
          <div key={i} style={{ display:"flex", justifyContent:"space-between", gap:10, fontSize:13, color:"#555", lineHeight:1.35 }}>
            <span style={{ flex:1 }}>{it.name}</span>
            <span style={{ fontFamily:"DM Mono", color:"#a89880", flexShrink:0 }}>×{it.qty}</span>
          </div>
        ))}
      </div>
      <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", borderTop:"1px solid #f5f0e8", paddingTop:12, marginBottom:10 }}>
        <span style={{ fontSize:11, fontFamily:"DM Mono", color:"#c4b8a8", letterSpacing:"0.04em" }}>Total</span>
        <span style={{ fontWeight:700, fontSize:16, color:"#1a1714", fontFamily:"DM Mono" }}>{fmt(order.total)}</span>
      </div>
      {nextStatus ? (
        <button type="button" className="btn-accent" onClick={()=>onStatusChange(order.id, nextStatus)}
          style={{ width:"100%", background:"#1a1714", color:"#f5f0e8", border:"none", borderRadius:10, padding:"12px 16px", fontSize:13, fontWeight:700, cursor:"pointer", fontFamily:"Syne", minHeight:44 }}>
          Mark {ORDER_META[nextStatus].label} →
        </button>
      ) : (
        <div style={{ width:"100%", textAlign:"center", fontSize:11, color:"#c4b8a8", fontFamily:"DM Mono", padding:"12px 8px", borderRadius:10, border:"1px solid #ede7da", background:"#faf7f2" }}>
          Completed ✓
        </div>
      )}
    </div>
  );
}

// ✅ Improved QR card: branded, copy link, download PNG, shows URL
function QRCard({ url, headline, subline, downloadFilename, qrTitle, restaurantName }) {
  const canvasRef = useRef(null);
  const [copied, setCopied] = useState(false);

  const downloadPng = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    // Create a branded canvas with label below the QR
    const padding = 20;
    const qrSize = 200;
    const labelHeight = subline ? 64 : 44;
    const totalH = qrSize + labelHeight + padding * 2;
    const totalW = qrSize + padding * 2;

    const offscreen = document.createElement("canvas");
    offscreen.width = totalW;
    offscreen.height = totalH;
    const ctx = offscreen.getContext("2d");

    // Background
    ctx.fillStyle = "#ffffff";
    ctx.fillRect(0, 0, totalW, totalH);

    // Draw QR from the rendered canvas
    ctx.drawImage(canvas, padding, padding, qrSize, qrSize);

    // Restaurant name
    ctx.fillStyle = "#1a1714";
    ctx.font = "bold 13px 'Arial', sans-serif";
    ctx.textAlign = "center";
    ctx.fillText(restaurantName || headline, totalW / 2, qrSize + padding + 20);

    // Table label
    if (subline) {
      ctx.fillStyle = "#8a7d6b";
      ctx.font = "11px 'Arial', sans-serif";
      ctx.fillText(subline, totalW / 2, qrSize + padding + 38);
    }

    const a = document.createElement("a");
    a.href = offscreen.toDataURL("image/png");
    a.download = downloadFilename;
    a.click();
  };

  const copyLink = async () => {
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // fallback: select text
    }
  };

  return (
    <div className="qr-card" style={{ background:"#fff", border:"1px solid #e4dcd0", borderRadius:16, padding:"20px 16px", display:"flex", flexDirection:"column", alignItems:"center", gap:12, boxShadow:"0 1px 8px rgba(0,0,0,0.03)" }}>
      {/* QR Code */}
      <div style={{ padding:12, border:"1.5px solid #ede7da", borderRadius:12, background:"#fff", lineHeight:0 }}>
        <QRCodeCanvas
          ref={canvasRef}
          value={url}
          size={160}
          level="M"
          marginSize={1}
          bgColor="#ffffff"
          fgColor="#1a1714"
          title={qrTitle}
        />
      </div>

      {/* Label */}
      <div style={{ textAlign:"center" }}>
        <div style={{ fontWeight:800, fontSize:15, color:"#1a1714", letterSpacing:"-0.01em" }}>{headline}</div>
        {subline && <div style={{ fontSize:11, color:"#a89880", fontFamily:"DM Mono", marginTop:2 }}>{subline}</div>}
      </div>

      {/* URL display */}
      <div style={{ fontSize:9, color:"#c4b8a8", fontFamily:"DM Mono", textAlign:"center", wordBreak:"break-all", maxWidth:"100%", lineHeight:1.4, padding:"6px 10px", background:"#faf7f2", borderRadius:8, width:"100%" }}>
        {url}
      </div>

      {/* Actions */}
      <div style={{ display:"flex", gap:6, width:"100%" }}>
        <button
          type="button"
          onClick={copyLink}
          style={{ flex:1, fontSize:11, color: copied ? "#2e7d32" : "#8a7d6b", border:`1.5px solid ${copied ? "#c6e6c6" : "#e4dcd0"}`, background: copied ? "#eaf5ea" : "#fff", borderRadius:8, padding:"8px 6px", cursor:"pointer", fontFamily:"Syne", fontWeight:600, minHeight:36, transition:"all 0.2s" }}>
          {copied ? "✓ Copied" : "Copy Link"}
        </button>
        <button
          type="button"
          className="btn-qr-download"
          onClick={downloadPng}
          style={{ flex:1, fontSize:11, color:"#8a7d6b", border:"1.5px solid #e4dcd0", background:"#fff", borderRadius:8, padding:"8px 6px", cursor:"pointer", fontFamily:"Syne", fontWeight:600, minHeight:36 }}>
          ↓ PNG
        </button>
      </div>
    </div>
  );
}

// ✅ Full QR section with Download All button
function QRSection({ restaurantId, restaurantName, orderingEnabled, tablesCount }) {
  const [downloadingAll, setDownloadingAll] = useState(false);
  const rid = encodeURIComponent(restaurantId);
  const menuOnlyUrl = `${MENU_QR_BASE}?restaurant=${rid}`;

  // Build list of all QR entries
  const qrList = orderingEnabled
    ? Array.from({ length: tablesCount }, (_, i) => ({
        key: `table-${i + 1}`,
        url: `${MENU_QR_BASE}?restaurant=${rid}&table=${i + 1}`,
        headline: `Table ${i + 1}`,
        subline: restaurantName,
        downloadFilename: `table-${i + 1}-qr.png`,
        qrTitle: `Menu QR for table ${i + 1}`,
      }))
    : [{
        key: "menu-only",
        url: menuOnlyUrl,
        headline: "Menu QR Code",
        subline: restaurantName,
        downloadFilename: "menu-qr.png",
        qrTitle: "Menu QR code",
      }];

  // Download all as individual PNGs (triggers one by one with delay)
  const downloadAll = async () => {
    setDownloadingAll(true);
    for (let i = 0; i < qrList.length; i++) {
      const { url, downloadFilename, headline } = qrList[i];

      // Draw QR to offscreen canvas
      const { toCanvas } = await import("qrcode");
      const offscreen = document.createElement("canvas");
      const padding = 20;
      const qrSize = 200;
      offscreen.width = qrSize + padding * 2;
      offscreen.height = qrSize + 64 + padding * 2;
      const ctx = offscreen.getContext("2d");
      ctx.fillStyle = "#ffffff";
      ctx.fillRect(0, 0, offscreen.width, offscreen.height);

      const qrCanvas = document.createElement("canvas");
      await toCanvas(qrCanvas, url, { width: qrSize, margin: 1, color: { dark: "#1a1714", light: "#ffffff" } });
      ctx.drawImage(qrCanvas, padding, padding);

      ctx.fillStyle = "#1a1714";
      ctx.font = "bold 13px Arial, sans-serif";
      ctx.textAlign = "center";
      ctx.fillText(restaurantName || headline, offscreen.width / 2, qrSize + padding + 20);

      ctx.fillStyle = "#8a7d6b";
      ctx.font = "11px Arial, sans-serif";
      ctx.fillText(headline, offscreen.width / 2, qrSize + padding + 38);

      const a = document.createElement("a");
      a.href = offscreen.toDataURL("image/png");
      a.download = downloadFilename;
      a.click();

      // Small delay between downloads
      if (i < qrList.length - 1) {
        await new Promise((r) => setTimeout(r, 300));
      }
    }
    setDownloadingAll(false);
  };

  return (
    <div className="fade-up">
      {/* Header */}
      <div style={{ display:"flex", justifyContent:"space-between", alignItems:"flex-end", marginBottom:24, gap:16, flexWrap:"wrap" }}>
        <div>
          <h1 style={S.pageTitle}>QR Codes</h1>
          <p style={S.pageSub}>
            {orderingEnabled
              ? `${tablesCount} table${tablesCount !== 1 ? "s" : ""} · guests scan to view menu & order`
              : "Guests scan to open your menu"}
          </p>
        </div>
        {qrList.length > 1 && (
          <button
            type="button"
            className="btn-accent"
            disabled={downloadingAll}
            onClick={() => void downloadAll()}
            style={{ ...S.accentBtn, opacity: downloadingAll ? 0.7 : 1, cursor: downloadingAll ? "wait" : "pointer" }}>
            {downloadingAll ? `Downloading… (${qrList.length})` : `↓ Download All (${qrList.length})`}
          </button>
        )}
      </div>

      {/* Info banner if no tables set */}
      {orderingEnabled && tablesCount === 0 && (
        <div style={{ background:"#fef6e8", border:"1px solid #f5d89e", borderRadius:12, padding:"14px 18px", fontSize:13, color:"#b45309", fontFamily:"DM Mono", marginBottom:20, lineHeight:1.5 }}>
          ⚠️ Set the number of tables in Settings to generate per-table QR codes
        </div>
      )}

      {/* QR Grid */}
      <div style={{ display:"grid", gridTemplateColumns:"repeat(auto-fill, minmax(200px,1fr))", gap:16 }}>
        {qrList.map((q) => (
          <QRCard
            key={q.key}
            url={q.url}
            headline={q.headline}
            subline={q.subline}
            downloadFilename={q.downloadFilename}
            qrTitle={q.qrTitle}
            restaurantName={restaurantName}
          />
        ))}
      </div>

      {/* Footer note for menu-only mode */}
      {!orderingEnabled && (
        <p style={{ fontSize:11, color:"#a89880", fontFamily:"DM Mono", marginTop:16, maxWidth:480, lineHeight:1.5 }}>
          Enable Online Ordering in Settings to generate per-table QR codes with ordering support.
        </p>
      )}
    </div>
  );
}

function AdminToggle({ checked, onChange, disabled }) {
  return (
    <div
      role="switch"
      aria-checked={checked}
      onClick={() => !disabled && onChange(!checked)}
      style={{
        width: 44,
        height: 24,
        borderRadius: 12,
        background: disabled ? "#ede7da" : checked ? "#1a1714" : "#ddd",
        cursor: disabled ? "not-allowed" : "pointer",
        transition: "background 0.2s",
        position: "relative",
        flexShrink: 0,
        opacity: disabled ? 0.45 : 1,
      }}
    >
      <div
        style={{
          position: "absolute",
          top: 2,
          left: checked ? 22 : 2,
          width: 20,
          height: 20,
          borderRadius: "50%",
          background: "#fff",
          boxShadow: "0 1px 4px rgba(0,0,0,0.2)",
          transition: "left 0.2s",
          pointerEvents: "none",
        }}
      />
    </div>
  );
}

export default function RestaurantAdmin() {
  const [authed, setAuthed] = useState(false);
  const [loginBusy, setLoginBusy] = useState(false);
  const [restaurant, setRestaurant] = useState(null);
  const [dataLoading, setDataLoading] = useState(false);
  const [tab, setTab] = useState("menu");
  const [features, setFeatures] = useState({ ordering: false, payment: false });
  const [cats, setCats] = useState([]);
  const [items, setItems] = useState([]);
  const [orders, setOrders] = useState([]);
  const [search, setSearch] = useState("");
  const [filterCat, setFilterCat] = useState("all");
  const [itemModal, setItemModal] = useState(null);
  const [catModal, setCatModal] = useState(null);
  const [confirmDel, setConfirmDel] = useState(null);
  const [selectedItems, setSelectedItems] = useState(() => new Set());
  const [selectedCats, setSelectedCats] = useState(() => new Set());
  const [bulkItemsConfirm, setBulkItemsConfirm] = useState(null);
  const [bulkCatsConfirm, setBulkCatsConfirm] = useState(null);
  const selectAllItemsRef = useRef(null);
  const selectAllCatsRef = useRef(null);
  const logoFileRef = useRef(null);
  const galleryFileRef = useRef(null);
  const [toast, setToast] = useState(null);
  const [settingsSaving, setSettingsSaving] = useState(false);
  const [settingsForm, setSettingsForm] = useState({
    name: "",
    location: "",
    contact_email: "",
    phone: "",
    website: "",
    instagram: "",
    logo_url: "",
    gallery: [],
    tables_count: "",
    new_password: "",
  });

  const showToast = (msg, type = "ok") => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 3500);
  };

  useEffect(() => {
    if (!authed || !restaurant) return;
    setFeatures(normalizeFeatures(restaurant));
  }, [authed, restaurant]);

  const loadRestaurantData = useCallback(async (r) => {
    const rid = r.id;
    const [cRes, iRes, oRes] = await Promise.all([
      supabase.from("categories").select("*").eq("restaurant_id", rid).order("sort_order", { ascending: true }),
      supabase.from("menu_items").select("*").eq("restaurant_id", rid),
      supabase.from("orders").select("*").eq("restaurant_id", rid).order("created_at", { ascending: false }),
    ]);
    if (cRes.error) showToast(cRes.error.message, "warn");
    if (iRes.error) showToast(iRes.error.message, "warn");
    if (oRes.error) showToast(oRes.error.message, "warn");
    if (!cRes.error) setCats((cRes.data || []).map(mapCategoryFromDb));
    if (!iRes.error) setItems((iRes.data || []).map(mapItemFromDb));
    if (!oRes.error) setOrders((oRes.data || []).map(mapOrderFromDb));
  }, []);

  const refreshOrders = useCallback(async (rid) => {
    const { data, error } = await supabase
      .from("orders")
      .select("*")
      .eq("restaurant_id", rid)
      .order("created_at", { ascending: false });
    if (error) {
      showToast(error.message, "warn");
      return;
    }
    setOrders((data || []).map(mapOrderFromDb));
  }, []);

  const handleLogin = async (pw) => {
    const { data, error } = await supabase.from("restaurants").select("*").eq("password", pw).single();
    if (error) {
      if (error.code === "PGRST116") return false;
      showToast(error.message, "warn");
      return false;
    }
    if (!data) return false;
    const nf = normalizeFeatures(data);
    setRestaurant(data);
    setSettingsForm({
      name: data.name ?? "",
      location: data.location ?? "",
      contact_email: data.contact_email ?? "",
      phone: data.phone ?? "",
      website: data.website ?? "",
      instagram: data.instagram ?? "",
      logo_url: data.logo_url ?? "",
      gallery: Array.isArray(data.gallery) ? data.gallery : [],
      tables_count: String(data.tables_count ?? data.tables ?? ""),
      new_password: "",
    });
    setFeatures(nf);
    setTab(nf.ordering ? "orders" : "menu");
    setAuthed(true);
    setDataLoading(true);
    await loadRestaurantData(data);
    setDataLoading(false);
    return true;
  };

  const signOut = () => {
    setAuthed(false);
    setRestaurant(null);
    setCats([]);
    setItems([]);
    setOrders([]);
    setTab("menu");
    setFeatures({ ordering: false, payment: false });
    setSearch("");
    setFilterCat("all");
    setItemModal(null);
    setCatModal(null);
    setConfirmDel(null);
    setSelectedItems(new Set());
    setSelectedCats(new Set());
    setBulkItemsConfirm(null);
    setBulkCatsConfirm(null);
    setSettingsForm({
      name: "",
      location: "",
      contact_email: "",
      phone: "",
      website: "",
      instagram: "",
      logo_url: "",
      gallery: [],
      tables_count: "",
      new_password: "",
    });
  };

  const saveItem = async (form) => {
    if (!restaurant?.id) return undefined;
    const imageUrl = getMenuImagePublicUrl(form.img);
    const row = {
      restaurant_id: restaurant.id,
      category_id: form.cat,
      name: form.name.trim(),
      name_az: (form.name_az ?? "").trim(),
      name_ru: (form.name_ru ?? "").trim(),
      description: form.desc || "",
      desc_az: form.desc_az || "",
      desc_ru: form.desc_ru || "",
      price: Number(form.price),
      image_url: imageUrl,
      available: !!form.available,
    };
    if (form.id) {
      const { error } = await supabase.from("menu_items").update(row).eq("id", form.id).eq("restaurant_id", restaurant.id);
      if (error) { showToast(error.message, "warn"); return false; }
      setItems((p) => p.map((i) => (i.id === String(form.id)
        ? {
            ...i,
            cat: String(form.cat),
            name: row.name,
            name_az: row.name_az,
            name_ru: row.name_ru,
            desc: row.description,
            desc_az: row.desc_az,
            desc_ru: row.desc_ru,
            price: row.price,
            img: row.image_url,
            available: row.available,
          }
        : i)));
      showToast("Item updated ✓");
    } else {
      const { data, error } = await supabase.from("menu_items").insert(row).select().single();
      if (error) { showToast(error.message, "warn"); return false; }
      setItems((p) => [...p, mapItemFromDb(data)]);
      showToast("Item added ✓");
    }
    setItemModal(null);
    return true;
  };

  const deleteItem = async (id) => {
    if (!restaurant?.id) return;
    const { error } = await supabase.from("menu_items").delete().eq("id", id).eq("restaurant_id", restaurant.id);
    if (error) { showToast(error.message, "warn"); return; }
    setItems((p) => p.filter((i) => i.id !== String(id)));
    setSelectedItems((prev) => {
      const n = new Set(prev);
      n.delete(String(id));
      return n;
    });
    setConfirmDel(null);
    showToast("Deleted", "warn");
  };

  const toggleAvail = async (id) => {
    if (!restaurant?.id) return;
    const cur = items.find((i) => i.id === String(id));
    if (!cur) return;
    const next = !cur.available;
    const { error } = await supabase.from("menu_items").update({ available: next }).eq("id", id).eq("restaurant_id", restaurant.id);
    if (error) { showToast(error.message, "warn"); return; }
    setItems((p) => p.map((i) => (i.id === String(id) ? { ...i, available: next } : i)));
  };

  const saveCat = async (form) => {
    if (!restaurant?.id) return;
    const base = { restaurant_id: restaurant.id, name: form.name.trim(), icon: form.icon || "🍽️" };
    if (form.id) {
      const { error } = await supabase.from("categories").update({ ...base, sort_order: form.sort ?? 0 }).eq("id", form.id).eq("restaurant_id", restaurant.id);
      if (error) { showToast(error.message, "warn"); return; }
      setCats((p) => p.map((c) => (c.id === String(form.id) ? { ...c, name: base.name, icon: base.icon, sort: form.sort ?? 0 } : c)));
      showToast("Category saved ✓");
    } else {
      const nextSort = cats.length ? Math.max(...cats.map((c) => c.sort)) + 1 : 1;
      const { data, error } = await supabase.from("categories").insert({ ...base, sort_order: nextSort }).select().single();
      if (error) { showToast(error.message, "warn"); return; }
      setCats((p) => [...p, mapCategoryFromDb(data)]);
      showToast("Category saved ✓");
    }
    setCatModal(null);
  };

  const deleteCategory = async (id) => {
    if (!restaurant?.id) return;
    const { error } = await supabase.from("categories").delete().eq("id", id).eq("restaurant_id", restaurant.id);
    if (error) { showToast(error.message, "warn"); return; }
    setCats((p) => p.filter((c) => c.id !== String(id)));
    setSelectedCats((prev) => {
      const n = new Set(prev);
      n.delete(String(id));
      return n;
    });
    setConfirmDel(null);
    showToast("Deleted", "warn");
  };

  const updateOrderStatus = async (id, status) => {
    if (!restaurant?.id) return;
    const { error } = await supabase.from("orders").update({ status }).eq("id", id).eq("restaurant_id", restaurant.id);
    if (error) { showToast(error.message, "warn"); return; }
    setOrders((p) => p.map((o) => (o.id === String(id) ? { ...o, status } : o)));
    showToast(`Order marked ${ORDER_META[status].label}`);
  };

  const persistFeatures = async (next) => {
    if (!restaurant?.id) return;
    const { error } = await supabase.from("restaurants").update({ features: next }).eq("id", restaurant.id);
    if (error) showToast(error.message, "warn");
    else setRestaurant((r) => (r ? { ...r, features: next } : r));
  };

  const saveSettings = async () => {
    const rid = restaurant?.id;
    if (rid == null || rid === "") { showToast("Missing restaurant id", "warn"); return; }
    setSettingsSaving(true);
    try {
      const newPassword = settingsForm.new_password.trim();
      const tablesNum = Math.max(0, Math.floor(Number(settingsForm.tables_count) || 0));
      const payload = {
        name: settingsForm.name.trim(),
        location: settingsForm.location.trim(),
        contact_email: settingsForm.contact_email.trim(),
        phone: settingsForm.phone.trim(),
        website: settingsForm.website.trim(),
        instagram: settingsForm.instagram.trim(),
        logo_url: settingsForm.logo_url.trim(),
        gallery: settingsForm.gallery,
        tables_count: tablesNum,
      };
      if (newPassword) payload.password = newPassword;
      const { error } = await supabase.from("restaurants").update(payload).eq("id", String(rid));
      if (error) { showToast(error.message, "warn"); return; }
      setRestaurant((r) => (r
        ? {
            ...r,
            name: payload.name,
            location: payload.location,
            contact_email: payload.contact_email,
            phone: payload.phone,
            website: payload.website,
            instagram: payload.instagram,
            logo_url: payload.logo_url,
            gallery: payload.gallery,
            tables_count: tablesNum,
            ...(newPassword ? { password: newPassword } : {}),
          }
        : r));
      setSettingsForm((f) => ({ ...f, new_password: "" }));
      showToast("Settings saved ✓");
    } catch (e) {
      showToast(e?.message || String(e), "warn");
    } finally {
      setSettingsSaving(false);
    }
  };

  const catName = (id) => cats.find((c) => c.id === id)?.name || "—";
  const filteredItems = items.filter((i) => {
    const q = search.toLowerCase();
    const matchesSearch =
      (i.name?.toLowerCase().includes(q)) ||
      (i.name_az?.toLowerCase().includes(q)) ||
      (i.name_ru?.toLowerCase().includes(q));
    return matchesSearch && (filterCat === "all" || i.cat === filterCat);
  });
  const newOrders = orders.filter((o) => o.status === "new").length;
  const todayRevenue = orders.reduce((s, o) => s + o.total, 0);
  const displayTab = !features.ordering && tab === "orders" ? "menu" : tab;

  useEffect(() => {
    setSelectedItems(new Set());
  }, [search, filterCat]);

  useEffect(() => {
    if (displayTab !== "menu") setSelectedItems(new Set());
  }, [displayTab]);

  useEffect(() => {
    if (displayTab !== "categories") setSelectedCats(new Set());
  }, [displayTab]);

  useEffect(() => {
    const el = selectAllItemsRef.current;
    if (!el) return;
    const filtIds = filteredItems.map((i) => i.id);
    const n = filtIds.filter((id) => selectedItems.has(id)).length;
    el.indeterminate = filtIds.length > 0 && n > 0 && n < filtIds.length;
  }, [filteredItems, selectedItems]);

  useEffect(() => {
    const el = selectAllCatsRef.current;
    if (!el) return;
    const ids = cats.map((c) => c.id);
    const n = ids.filter((id) => selectedCats.has(id)).length;
    el.indeterminate = ids.length > 0 && n > 0 && n < ids.length;
  }, [cats, selectedCats]);

  const cbWrap = { flex: "0 0 20px", display: "flex", alignItems: "center", justifyContent: "center" };
  const cbStyle = { width: 16, height: 16, accentColor: "#1a1714", cursor: "pointer" };

  const allFilteredSelected = filteredItems.length > 0 && filteredItems.every((i) => selectedItems.has(i.id));
  const toggleSelectAllFiltered = () => {
    setSelectedItems((prev) => {
      const ids = filteredItems.map((i) => i.id);
      if (ids.length === 0) return prev;
      if (ids.every((id) => prev.has(id))) {
        const n = new Set(prev);
        ids.forEach((id) => n.delete(id));
        return n;
      }
      return new Set([...prev, ...ids]);
    });
  };

  const allCatsSelected = cats.length > 0 && cats.every((c) => selectedCats.has(c.id));
  const toggleSelectAllCats = () => {
    setSelectedCats((prev) => {
      const ids = cats.map((c) => c.id);
      if (ids.length === 0) return prev;
      if (ids.every((id) => prev.has(id))) {
        const n = new Set(prev);
        ids.forEach((id) => n.delete(id));
        return n;
      }
      return new Set([...prev, ...ids]);
    });
  };

  const toggleItemSelected = (id, e) => {
    e.stopPropagation();
    setSelectedItems((prev) => {
      const n = new Set(prev);
      if (n.has(id)) n.delete(id);
      else n.add(id);
      return n;
    });
  };

  const toggleCatSelected = (id, e) => {
    e.stopPropagation();
    setSelectedCats((prev) => {
      const n = new Set(prev);
      if (n.has(id)) n.delete(id);
      else n.add(id);
      return n;
    });
  };

  const runBulkDeleteItems = async () => {
    const ids = bulkItemsConfirm;
    if (!restaurant?.id || !ids?.length) {
      setBulkItemsConfirm(null);
      return;
    }
    const { error } = await supabase.from("menu_items").delete().in("id", ids).eq("restaurant_id", restaurant.id);
    setBulkItemsConfirm(null);
    if (error) {
      showToast(error.message, "warn");
      return;
    }
    const idSet = new Set(ids.map(String));
    setItems((p) => p.filter((i) => !idSet.has(i.id)));
    setSelectedItems(new Set());
    showToast(`${ids.length} items deleted`);
  };

  const runBulkDeleteCats = async () => {
    const ids = bulkCatsConfirm;
    if (!restaurant?.id || !ids?.length) {
      setBulkCatsConfirm(null);
      return;
    }
    const idStrs = ids.map(String);
    const { error } = await supabase.from("categories").delete().in("id", idStrs).eq("restaurant_id", restaurant.id);
    setBulkCatsConfirm(null);
    if (error) {
      showToast(error.message, "warn");
      return;
    }
    const deletedSet = new Set(idStrs);
    setCats((p) => p.filter((c) => !deletedSet.has(c.id)));
    setItems((p) => p.filter((i) => !deletedSet.has(i.cat)));
    setSelectedCats(new Set());
    showToast(`${ids.length} categories deleted`);
  };

  useEffect(() => {
    if (!authed || !restaurant?.id) return undefined;
    const channel = supabase
      .channel("orders")
      .on("postgres_changes", { event: "*", schema: "public", table: "orders", filter: `restaurant_id=eq.${restaurant.id}` }, () => { void refreshOrders(restaurant.id); })
      .subscribe();
    return () => { void supabase.removeChannel(channel); };
  }, [authed, restaurant?.id, refreshOrders]);

  if (!authed) return <Login busy={loginBusy} onLogin={async (pw) => { setLoginBusy(true); try { return await handleLogin(pw); } finally { setLoginBusy(false); } }} />;

  const tablesCount = Number(restaurant?.tables_count ?? restaurant?.tables) || 0;

  return (
    <div className="admin-root" style={S.root}>
      <GS />
      <aside className="admin-sidebar" style={S.sidebar}>
        <div style={S.sideTop}>
          <div style={{ fontSize:28, marginBottom:10 }}>🍽️</div>
          <div style={S.restName}>{restaurant?.name}</div>
          <div style={{ fontSize:9, fontFamily:"DM Mono", color:"#a89880", letterSpacing:"0.12em", marginTop:2 }}>{restaurant?.location}</div>
        </div>
        <nav className="admin-sidebar-nav" style={{ padding:"12px 0", flex:1 }}>
          {[
            { key:"orders",     icon:"🧾", label:"Orders",      badge:newOrders||null },
            { key:"menu",       icon:"🍽",  label:"Menu Items" },
            { key:"categories", icon:"📂", label:"Categories" },
            { key:"qr",         icon:"📱", label:"QR Codes" },
            { key:"settings",   icon:"⚙️",  label:"Settings" },
          ].filter((entry) => features.ordering || entry.key !== "orders").map(({key,icon,label,badge})=>(
            <button type="button" key={key} className="nav-hover" onClick={()=>setTab(key)}
              style={{ ...S.navBtn, ...(displayTab===key?S.navActive:{}) }}>
              <span style={{ fontSize:15 }}>{icon}</span>
              <span style={{ flex:1 }}>{label}</span>
              {badge && <span style={{ background:"#c62828", color:"#fff", fontSize:10, fontFamily:"DM Mono", fontWeight:700, padding:"2px 7px", borderRadius:20 }}>{badge}</span>}
            </button>
          ))}
        </nav>
        <div style={S.sideFooter}>
          <div style={{ fontSize:10, fontFamily:"DM Mono", color:"#c4b8a8", marginBottom:4 }}>Plan</div>
          <div style={{ fontSize:12, fontFamily:"DM Mono", color:"#3d7a3d", fontWeight:600, marginBottom:12 }}>● {restaurant?.plan}</div>
          <button type="button" className="btn-signout" style={{ width:"100%", background:"transparent", border:"1px solid #e4dcd0", borderRadius:8, padding:"10px", color:"#a89880", fontSize:11, fontFamily:"DM Mono", cursor:"pointer", minHeight:40 }} onClick={signOut}>Sign Out</button>
        </div>
      </aside>

      <main className="admin-main" style={S.main}>
        {dataLoading ? (
          <div style={{ display:"flex", alignItems:"center", justifyContent:"center", minHeight:240, fontFamily:"DM Mono", fontSize:14, color:"#a89880" }}>Loading…</div>
        ) : (
          <>
            {displayTab==="orders" && (
              <div className="fade-up">
                <div style={{ display:"flex", justifyContent:"space-between", alignItems:"flex-end", marginBottom:24 }}>
                  <div>
                    <h1 style={S.pageTitle}>Orders</h1>
                    <p style={S.pageSub}>Live order management — today: <strong style={{ color:"#1a1714" }}>{fmt(todayRevenue)}</strong></p>
                  </div>
                </div>
                <div className="orders-board">
                  {["new","preparing","ready","done"].map(status=>{
                    const om = ORDER_META[status];
                    const col = orders.filter(o=>o.status===status);
                    return (
                      <div key={status}>
                        <div style={{ display:"flex", alignItems:"center", gap:8, marginBottom:12, padding:"6px 12px", background:om.bg, borderRadius:20, width:"fit-content" }}>
                          <span style={{ fontSize:10, color:om.dot }}>●</span>
                          <span style={{ fontSize:11, fontFamily:"DM Mono", fontWeight:600, color:om.text }}>{om.label}</span>
                          <span style={{ fontSize:10, fontFamily:"DM Mono", color:om.text, opacity:0.7 }}>{col.length}</span>
                        </div>
                        <div style={{ display:"flex", flexDirection:"column", gap:10 }}>
                          {col.length===0 && <div style={{ fontSize:12, color:"#c4b8a8", fontFamily:"DM Mono", padding:"20px 0", textAlign:"center" }}>Empty</div>}
                          {col.map(o=><OrderCard key={o.id} order={o} onStatusChange={updateOrderStatus}/>)}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {displayTab==="menu" && (
              <div className="fade-up">
                <div className="menu-toolbar" style={{ display:"flex", justifyContent:"space-between", alignItems:"flex-end", marginBottom:24, gap:16, flexWrap:"wrap" }}>
                  <div>
                    <h1 style={S.pageTitle}>Menu Items</h1>
                    <p style={S.pageSub}>{items.length} items · {items.filter(i=>i.available).length} available</p>
                  </div>
                  <div className="menu-toolbar-controls" style={{ display:"flex", gap:10, alignItems:"center" }}>
                    <input value={search} onChange={e=>setSearch(e.target.value)} placeholder="Search…" style={S.searchInput} />
                    <select value={filterCat} onChange={e=>setFilterCat(e.target.value)} style={S.filterSel}>
                      <option value="all">All Categories</option>
                      {cats.map(c=><option key={c.id} value={c.id}>{c.icon} {c.name}</option>)}
                    </select>
                    <button type="button" className="btn-accent" style={S.accentBtn} onClick={()=>setItemModal("new")}>+ Add Item</button>
                  </div>
                </div>
                {selectedItems.size > 0 && (
                  <div style={{ position:"sticky", top:0, zIndex:4, background:"#1a1714", color:"#faf8f4", borderRadius:12, padding:"12px 20px", display:"flex", alignItems:"center", gap:12, marginBottom:12, fontSize:13, fontFamily:"Syne, sans-serif" }}>
                    <span style={{ flex:1, fontWeight:600 }}>{selectedItems.size} selected</span>
                    <button type="button" onClick={() => setBulkItemsConfirm([...selectedItems])} style={{ background:"#c62828", color:"#fff", border:"none", borderRadius:8, padding:"8px 16px", fontWeight:700, cursor:"pointer", fontFamily:"Syne, sans-serif", fontSize:13 }}>Delete Selected</button>
                    <button type="button" onClick={() => setSelectedItems(new Set())} style={{ background:"transparent", color:"#c4b8a8", border:"1px solid rgba(255,255,255,0.2)", borderRadius:8, padding:"8px 16px", cursor:"pointer", fontFamily:"Syne, sans-serif", fontSize:13 }}>Deselect All</button>
                  </div>
                )}
                <div className="admin-table-wrap" style={S.table}>
                  <div style={S.thead}>
                    <span style={cbWrap} onClick={(e) => e.stopPropagation()}>
                      <input ref={selectAllItemsRef} type="checkbox" checked={allFilteredSelected} onChange={toggleSelectAllFiltered} style={cbStyle} title="Select all" aria-label="Select all filtered items" />
                    </span>
                    <span style={{ flex:4 }}>Item</span>
                    <span style={{ flex:2 }}>Category</span>
                    <span style={{ flex:1 }}>Price</span>
                    <span style={{ flex:1 }}>Status</span>
                    <span style={{ flex:1 }}>Actions</span>
                  </div>
                  {filteredItems.length===0 && <div style={{ padding:"40px", textAlign:"center", color:"#c4b8a8", fontFamily:"DM Mono" }}>No items found</div>}
                  {filteredItems.map(item=>(
                    <div key={item.id} role="button" tabIndex={0} className="row-hover"
                      style={{ ...S.trow, cursor:"pointer", background: selectedItems.has(item.id) ? "#f5f0e8" : undefined }}
                      onClick={()=>setItemModal(item)}
                      onKeyDown={(e)=>{ if(e.key==="Enter"||e.key===" "){ e.preventDefault(); setItemModal(item);} }}>
                      <span style={cbWrap} onClick={(e) => e.stopPropagation()} onMouseDown={(e) => e.stopPropagation()}>
                        <input type="checkbox" checked={selectedItems.has(item.id)} onChange={(e) => toggleItemSelected(item.id, e)} style={cbStyle} aria-label={`Select ${item.name}`} />
                      </span>
                      <span style={{ flex:4, display:"flex", alignItems:"center", gap:12, minWidth:0 }}>
                        {item.img && <img src={item.img} alt="" style={{ width:46, height:46, borderRadius:10, objectFit:"cover", flexShrink:0 }} onError={e=>e.target.style.display="none"} />}
                        <span style={{ minWidth:0 }}>
                          <div style={{ fontWeight:600, fontSize:14, color:"#1a1714" }}>{item.name}</div>
                          <div style={{ fontSize:11, color:"#c4b8a8", marginTop:2 }}>{item.desc?.slice(0,50)}…</div>
                        </span>
                      </span>
                      <span style={{ flex:2 }}><span style={{ fontSize:11, fontFamily:"DM Mono", padding:"3px 10px", borderRadius:20, background:"#f5f0e8", color:"#8a7d6b" }}>{catName(item.cat)}</span></span>
                      <span style={{ flex:1, fontFamily:"DM Mono", fontWeight:600, fontSize:14, color:"#1a1714" }}>{fmt(item.price)}</span>
                      <span style={{ flex:1 }}>
                        <span role="button" tabIndex={0} className="chip-avail"
                          onClick={(e)=>{ e.stopPropagation(); toggleAvail(item.id); }}
                          onKeyDown={(e)=>{ if(e.key==="Enter"||e.key===" "){ e.preventDefault(); e.stopPropagation(); toggleAvail(item.id);} }}
                          style={{ display:"inline-flex", alignItems:"center", justifyContent:"center", boxSizing:"border-box", minWidth:84, fontSize:11, fontFamily:"DM Mono", fontWeight:600, padding:"5px 10px", borderRadius:20, cursor:"pointer", background:item.available?"#eaf5ea":"#fdecea", color:item.available?"#2e7d32":"#c62828", lineHeight:1.2 }}>
                          {item.available?"● On":"○ Off"}
                        </span>
                      </span>
                      <span style={{ flex:1, display:"flex", gap:8, justifyContent:"flex-end" }} onClick={e=>e.stopPropagation()}>
                        <button type="button" className="icon-hover" style={S.iconBtn} onClick={()=>setItemModal(item)} aria-label="Edit item">✏️</button>
                        <button type="button" className="icon-hover" style={S.iconBtn} onClick={()=>setConfirmDel({type:"item",id:item.id,name:item.name})} aria-label="Delete item">🗑</button>
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {displayTab==="categories" && (
              <div className="fade-up">
                <div className="menu-toolbar" style={{ display:"flex", justifyContent:"space-between", alignItems:"flex-end", marginBottom:24, gap:16, flexWrap:"wrap" }}>
                  <div>
                    <h1 style={S.pageTitle}>Categories</h1>
                    <p style={S.pageSub}>Organise your menu sections</p>
                  </div>
                  <button type="button" className="btn-accent" style={S.accentBtn} onClick={()=>setCatModal("new")}>+ Add Category</button>
                </div>
                {selectedCats.size > 0 && (
                  <div style={{ position:"sticky", top:0, zIndex:4, background:"#1a1714", color:"#faf8f4", borderRadius:12, padding:"12px 20px", display:"flex", alignItems:"center", gap:12, marginBottom:12, fontSize:13, fontFamily:"Syne, sans-serif" }}>
                    <span style={{ flex:1, fontWeight:600 }}>{selectedCats.size} selected</span>
                    <button type="button" onClick={() => setBulkCatsConfirm([...selectedCats])} style={{ background:"#c62828", color:"#fff", border:"none", borderRadius:8, padding:"8px 16px", fontWeight:700, cursor:"pointer", fontFamily:"Syne, sans-serif", fontSize:13 }}>Delete Selected</button>
                    <button type="button" onClick={() => setSelectedCats(new Set())} style={{ background:"transparent", color:"#c4b8a8", border:"1px solid rgba(255,255,255,0.2)", borderRadius:8, padding:"8px 16px", cursor:"pointer", fontFamily:"Syne, sans-serif", fontSize:13 }}>Deselect All</button>
                  </div>
                )}
                <div className="admin-table-wrap" style={S.table}>
                  <div style={S.thead}>
                    <span style={cbWrap} onClick={(e) => e.stopPropagation()}>
                      <input ref={selectAllCatsRef} type="checkbox" checked={allCatsSelected} onChange={toggleSelectAllCats} style={cbStyle} title="Select all" aria-label="Select all categories" />
                    </span>
                    <span style={{ flex:1 }}>Icon</span>
                    <span style={{ flex:4 }}>Name</span>
                    <span style={{ flex:2 }}>Items</span>
                    <span style={{ flex:1 }}>Actions</span>
                  </div>
                  {cats.map(cat=>{
                    const count = items.filter(i=>i.cat===cat.id).length;
                    const avail = items.filter(i=>i.cat===cat.id&&i.available).length;
                    return (
                      <div key={cat.id} className="row-hover" style={{ ...S.trow, background: selectedCats.has(cat.id) ? "#f5f0e8" : undefined }}>
                        <span style={cbWrap} onClick={(e) => e.stopPropagation()} onMouseDown={(e) => e.stopPropagation()}>
                          <input type="checkbox" checked={selectedCats.has(cat.id)} onChange={(e) => toggleCatSelected(cat.id, e)} style={cbStyle} aria-label={`Select ${cat.name}`} />
                        </span>
                        <span style={{ flex:1, fontSize:24 }}>{cat.icon}</span>
                        <span style={{ flex:4, fontWeight:700, fontSize:15, color:"#1a1714" }}>{cat.name}</span>
                        <span style={{ flex:2, fontSize:13, color:"#a89880", fontFamily:"DM Mono" }}>{count} items · {avail} available</span>
                        <span style={{ flex:1, display:"flex", gap:8, justifyContent:"flex-end" }}>
                          <button type="button" className="icon-hover" style={S.iconBtn} onClick={()=>setCatModal(cat)} aria-label="Edit category">✏️</button>
                          <button type="button" className="icon-hover" style={S.iconBtn} onClick={()=>setConfirmDel({type:"cat",id:cat.id,name:cat.name})} aria-label="Delete category">🗑</button>
                        </span>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {displayTab==="qr" && restaurant?.id && (
              <QRSection
                restaurantId={String(restaurant.id)}
                restaurantName={restaurant.name || ""}
                orderingEnabled={features.ordering}
                tablesCount={tablesCount}
              />
            )}

            {displayTab==="settings" && (
              <div className="fade-up" style={{ maxWidth:520 }}>
                <h1 style={S.pageTitle}>Settings</h1>
                <p style={S.pageSub}>Restaurant configuration</p>
                <form style={{ marginTop:24, background:"#fff", border:"1px solid #e4dcd0", borderRadius:16, padding:24, display:"flex", flexDirection:"column", gap:16 }}
                  onSubmit={(e) => { e.preventDefault(); void saveSettings(); }}>
                  {[
                    { label:"Restaurant Name", key:"name" },
                    { label:"Location",        key:"location" },
                    { label:"Contact Email",   key:"contact_email" },
                  ].map(({ label, key }) => (
                    <div key={label} style={{ display:"flex", flexDirection:"column", gap:6 }}>
                      <label style={{ fontSize:10, fontFamily:"DM Mono", color:"#a89880", letterSpacing:"0.1em" }}>{label.toUpperCase()}</label>
                      <input style={S.inp} value={settingsForm[key]} onChange={(e) => setSettingsForm((p) => ({ ...p, [key]: e.target.value }))} disabled={settingsSaving} />
                    </div>
                  ))}
                  {[
                    { label:"Phone Number", key:"phone", placeholder:"+994 12 000 00 00" },
                    { label:"Website URL", key:"website", placeholder:"https://yourrestaurant.com" },
                    { label:"Instagram", key:"instagram", placeholder:"@yourrestaurant" },
                  ].map(({ label, key, placeholder }) => (
                    <div key={label} style={{ display:"flex", flexDirection:"column", gap:6 }}>
                      <label style={{ fontSize:10, fontFamily:"DM Mono", color:"#a89880", letterSpacing:"0.1em" }}>{label.toUpperCase()}</label>
                      <input style={S.inp} placeholder={placeholder} value={settingsForm[key]} onChange={(e) => setSettingsForm((p) => ({ ...p, [key]: e.target.value }))} disabled={settingsSaving} />
                    </div>
                  ))}
                  <div style={{ display:"flex", flexDirection:"column", gap:6 }}>
                    <label style={{ fontSize:10, fontFamily:"DM Mono", color:"#a89880", letterSpacing:"0.1em" }}>LOGO</label>
                    {settingsForm.logo_url && (
                      <div style={{ width:80, height:80, borderRadius:12, overflow:"hidden", background:"#f5f0e8", marginBottom:8 }}>
                        <img src={settingsForm.logo_url} alt="logo" style={{ width:"100%", height:"100%", objectFit:"cover" }} />
                      </div>
                    )}
                    <input
                      ref={logoFileRef}
                      type="file"
                      accept="image/*"
                      style={{ display:"none" }}
                      onChange={async (e) => {
                        const file = e.target.files?.[0];
                        e.target.value = "";
                        if (!file || !restaurant?.id) return;
                        try {
                          const compressed = await compressImage(file);
                          const fileName = `logo-${restaurant.id}-${Date.now()}`;
                          const { error } = await supabase.storage.from("menu_images").upload(fileName, compressed, { upsert: true, cacheControl: "31536000", contentType: compressed?.type || file.type });
                          if (error) { showToast(error.message, "warn"); return; }
                          const { data: urlData } = supabase.storage.from("menu_images").getPublicUrl(fileName);
                          const url = urlData?.publicUrl;
                          if (url) setSettingsForm((p) => ({ ...p, logo_url: url }));
                        } catch (err) {
                          console.error("Logo upload error:", err);
                          showToast(err?.message || "Logo upload failed", "warn");
                        }
                      }}
                    />
                    <button type="button" className="btn-ghost" style={S.ghostBtn}
                      onClick={() => logoFileRef.current?.click()}>
                      {settingsForm.logo_url ? "Change Logo" : "Upload Logo"}
                    </button>
                  </div>
                  <div style={{ display:"flex", flexDirection:"column", gap:6 }}>
                    <label style={{ fontSize:10, fontFamily:"DM Mono", color:"#a89880", letterSpacing:"0.1em" }}>GALLERY PHOTOS</label>
                    <div style={{ fontSize:11, color:"#c4b8a8", fontFamily:"DM Mono", marginBottom:6 }}>
                      These appear in the customer menu info sidebar. Max 5 photos.
                    </div>
                    {settingsForm.gallery.length > 0 && (
                      <div style={{ display:"flex", gap:8, flexWrap:"wrap", marginBottom:8 }}>
                        {settingsForm.gallery.map((url, i) => (
                          <div key={i} style={{ position:"relative", width:80, height:80 }}>
                            <img src={url} alt="" style={{ width:80, height:80, borderRadius:10, objectFit:"cover", display:"block" }} />
                            <button type="button"
                              onClick={() => setSettingsForm((p) => ({ ...p, gallery: p.gallery.filter((_, idx) => idx !== i) }))}
                              style={{ position:"absolute", top:-6, right:-6, width:20, height:20, borderRadius:"50%", background:"#c62828", color:"#fff", border:"none", cursor:"pointer", fontSize:12, display:"flex", alignItems:"center", justifyContent:"center" }}>
                              ✕
                            </button>
                          </div>
                        ))}
                      </div>
                    )}
                    <input
                      ref={galleryFileRef}
                      type="file"
                      accept="image/*"
                      style={{ display:"none" }}
                      onChange={async (e) => {
                        const file = e.target.files?.[0];
                        e.target.value = "";
                        if (!file || !restaurant?.id) return;
                        if (settingsForm.gallery.length >= 5) { showToast("Max 5 gallery photos", "warn"); return; }
                        try {
                          const compressed = await compressImage(file);
                          const fileName = `gallery-${restaurant.id}-${Date.now()}`;
                          const { error } = await supabase.storage.from("menu_images").upload(fileName, compressed, { cacheControl: "31536000", contentType: compressed?.type || file.type });
                          if (error) { showToast(error.message, "warn"); return; }
                          const { data: urlData } = supabase.storage.from("menu_images").getPublicUrl(fileName);
                          const url = urlData?.publicUrl;
                          if (url) setSettingsForm((p) => ({ ...p, gallery: [...p.gallery, url] }));
                        } catch (err) {
                          console.error("Gallery upload error:", err);
                          showToast(err?.message || "Gallery upload failed", "warn");
                        }
                      }}
                    />
                    <button type="button" className="btn-ghost" style={S.ghostBtn}
                      disabled={settingsForm.gallery.length >= 5}
                      onClick={() => galleryFileRef.current?.click()}>
                      + Add Photo ({settingsForm.gallery.length}/5)
                    </button>
                  </div>
                  <div style={{ display:"flex", flexDirection:"column", gap:6 }}>
                    <label style={{ fontSize:10, fontFamily:"DM Mono", color:"#a89880", letterSpacing:"0.1em" }}>NUMBER OF TABLES</label>
                    <input type="number" min={0} style={S.inp} value={settingsForm.tables_count} onChange={(e) => setSettingsForm((p) => ({ ...p, tables_count: e.target.value }))} disabled={settingsSaving} />
                  </div>
                  <div style={{ display:"flex", flexDirection:"column", gap:6 }}>
                    <label style={{ fontSize:10, fontFamily:"DM Mono", color:"#a89880", letterSpacing:"0.1em" }}>NEW PASSWORD</label>
                    <input type="password" placeholder="Leave blank to keep current" style={S.inp} value={settingsForm.new_password} onChange={(e) => setSettingsForm((p) => ({ ...p, new_password: e.target.value }))} disabled={settingsSaving} />
                  </div>
                  <button type="submit" className="btn-accent" disabled={settingsSaving}
                    style={{ ...S.accentBtn, alignSelf:"flex-start", marginTop:4, opacity: settingsSaving ? 0.85 : 1, cursor: settingsSaving ? "wait" : "pointer" }}>
                    {settingsSaving ? "Saving..." : "Save Settings"}
                  </button>
                </form>
                <div style={{ marginTop:16, background:"#fff", border:"1px solid #e4dcd0", borderRadius:16, padding:24 }}>
                  <div style={{ fontSize:11, fontFamily:"DM Mono", color:"#a89880", letterSpacing:"0.1em", marginBottom:16 }}>FEATURES</div>
                  <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", padding:"12px 0", borderTop:"1px solid #f0ebe4", gap:16 }}>
                    <div>
                      <div style={{ fontSize:13, fontWeight:600, color:"#1a1714", fontFamily:"Syne", marginBottom:4 }}>Online Ordering</div>
                      <div style={{ fontSize:12, color:"#8a7d6b", lineHeight:1.45 }}>Allow customers to order directly from their phone</div>
                    </div>
                    <AdminToggle checked={features.ordering} onChange={(v) => {
                      if (!v) setTab((t) => (t === "orders" ? "menu" : t));
                      setFeatures((f) => {
                        const next = { ordering: v, payment: v ? f.payment : false };
                        void persistFeatures(next);
                        return next;
                      });
                    }} />
                  </div>
                  <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", padding:"12px 0 0", borderTop:"1px solid #f0ebe4", marginTop:4, gap:16 }}>
                    <div>
                      <div style={{ fontSize:13, fontWeight:600, color:"#1a1714", fontFamily:"Syne", marginBottom:4 }}>Online Payment</div>
                      <div style={{ fontSize:12, color:"#8a7d6b", lineHeight:1.45 }}>
                        Allow customers to pay from their phone (requires ordering to be enabled)
                      </div>
                    </div>
                    <AdminToggle checked={features.payment} disabled={!features.ordering} onChange={(v) => {
                      setFeatures((f) => {
                        const next = { ...f, payment: v };
                        void persistFeatures(next);
                        return next;
                      });
                    }} />
                  </div>
                </div>
              </div>
            )}
          </>
        )}
      </main>

      {itemModal && (
        <ItemModal key={itemModal === "new" ? "new-item" : itemModal.id} item={itemModal === "new" ? null : itemModal} cats={cats} onSave={saveItem} onClose={() => setItemModal(null)} showToast={showToast} />
      )}
      {catModal && (
        <CatModal key={catModal === "new" ? "new-cat" : catModal.id} cat={catModal === "new" ? null : catModal} onSave={saveCat} onClose={() => setCatModal(null)} />
      )}
      {confirmDel && (
        <Confirm msg={`Delete "${confirmDel.name}"?`} onConfirm={() => (confirmDel.type === "item" ? deleteItem(confirmDel.id) : deleteCategory(confirmDel.id))} onCancel={() => setConfirmDel(null)} />
      )}
      {bulkItemsConfirm && (
        <Confirm
          msg={`Delete ${bulkItemsConfirm.length} items? This cannot be undone.`}
          showSubline={false}
          onConfirm={() => void runBulkDeleteItems()}
          onCancel={() => setBulkItemsConfirm(null)}
        />
      )}
      {bulkCatsConfirm && (
        <Confirm
          msg={`Delete ${bulkCatsConfirm.length} categories? This cannot be undone.`}
          showSubline={false}
          onConfirm={() => void runBulkDeleteCats()}
          onCancel={() => setBulkCatsConfirm(null)}
        />
      )}
      {toast && (
        <div style={{ position:"fixed", bottom:28, left:"50%", transform:"translateX(-50%)", padding:"11px 22px", borderRadius:28, fontSize:12, fontFamily:"DM Mono", fontWeight:500, zIndex:999, background:toast.type==="warn"?"#fdecea":"#eaf5ea", color:toast.type==="warn"?"#c62828":"#2e7d32", border:`1px solid ${toast.type==="warn"?"#f5c6c6":"#c6e6c6"}` }}>
          {toast.msg}
        </div>
      )}
    </div>
  );
}

const S = {
  root:       { display:"flex", height:"100vh", fontFamily:"Syne, sans-serif", background:"#f5f0e8", overflow:"hidden" },
  sidebar:    { width:230, background:"#fff", borderRight:"1px solid #e4dcd0", display:"flex", flexDirection:"column", flexShrink:0 },
  sideTop:    { padding:"28px 22px 22px", borderBottom:"1px solid #ede7da" },
  restName:   { fontSize:17, fontWeight:800, color:"#1a1714", letterSpacing:"-0.02em", lineHeight:1.2 },
  navBtn:     { display:"flex", alignItems:"center", gap:10, width:"100%", padding:"10px 22px", background:"transparent", border:"none", color:"#b0a090", cursor:"pointer", fontSize:13, fontFamily:"Syne", fontWeight:500, textAlign:"left", transition:"all 0.15s", borderLeft:"2px solid transparent" },
  navActive:  { background:"#faf7f2", color:"#1a1714", borderLeft:"2px solid #1a1714" },
  sideFooter: { padding:"16px 22px", borderTop:"1px solid #ede7da" },
  main:       { flex:1, overflowY:"auto", padding:"32px 36px" },
  pageTitle:  { fontSize:28, fontWeight:800, color:"#1a1714", letterSpacing:"-0.02em" },
  pageSub:    { fontSize:13, color:"#a89880", marginTop:4, fontFamily:"DM Mono" },
  searchInput:{ padding:"10px 14px", background:"#fff", border:"1px solid #e4dcd0", borderRadius:8, color:"#1a1714", fontSize:13, fontFamily:"DM Mono", width:180, minHeight:44, transition:"border-color 0.15s ease, box-shadow 0.15s ease" },
  filterSel:  { padding:"10px 12px", background:"#fff", border:"1px solid #e4dcd0", borderRadius:8, color:"#8a7d6b", fontSize:12, fontFamily:"DM Mono", cursor:"pointer", minHeight:44, transition:"border-color 0.15s ease" },
  table:      { background:"#fff", borderRadius:16, overflow:"hidden", border:"1px solid #e4dcd0", boxShadow:"0 1px 8px rgba(0,0,0,0.03)" },
  thead:      { display:"flex", padding:"12px 20px", background:"#faf7f2", borderBottom:"1px solid #ede7da", fontSize:10, fontFamily:"DM Mono", color:"#c4b8a8", letterSpacing:"0.1em", gap:12 },
  trow:       { display:"flex", padding:"14px 20px", borderBottom:"1px solid #f5f0e8", alignItems:"center", gap:12, transition:"background 0.1s" },
  iconBtn:    { background:"#faf7f2", border:"none", borderRadius:10, width:40, height:40, minWidth:40, minHeight:40, display:"flex", alignItems:"center", justifyContent:"center", cursor:"pointer", fontSize:15, transition:"background 0.15s ease" },
  accentBtn:  { background:"#1a1714", color:"#f5f0e8", border:"none", borderRadius:10, padding:"12px 20px", fontSize:13, fontWeight:700, cursor:"pointer", fontFamily:"Syne", minHeight:44 },
  ghostBtn:   { background:"transparent", color:"#8a7d6b", border:"1px solid #e4dcd0", borderRadius:10, padding:"12px 20px", fontSize:13, cursor:"pointer", fontFamily:"Syne", minHeight:44 },
  overlay:    { position:"fixed", inset:0, background:"rgba(26,23,20,0.35)", zIndex:500, display:"flex", alignItems:"center", justifyContent:"center", padding:20 },
  modal:      { background:"#fff", border:"1px solid #e4dcd0", borderRadius:18, width:"100%", maxWidth:540, maxHeight:"90vh", overflowY:"auto", padding:"28px", boxShadow:"0 16px 64px rgba(0,0,0,0.1)" },
  modalTitle: { fontSize:20, fontWeight:800, color:"#1a1714", letterSpacing:"-0.02em" },
  closeBtn:   { background:"#faf7f2", border:"none", borderRadius:"50%", width:40, height:40, minWidth:40, minHeight:40, color:"#a89880", cursor:"pointer", fontSize:14, display:"flex", alignItems:"center", justifyContent:"center" },
  inp:        { width:"100%", background:"#faf7f2", border:"1.5px solid #e4dcd0", borderRadius:8, padding:"10px 12px", color:"#1a1714", fontSize:13, fontFamily:"Syne", transition:"border-color 0.2s" },
};