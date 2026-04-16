import { useState, useRef } from "react";
import { QRCodeCanvas } from "qrcode.react";

const MENU_QR_BASE = "https://qrmenu-virid.vercel.app/menu";

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

const RESTAURANT = { name: "The House Cafe", location: "Nizami St, Baku", plan: "pro", tables: 8, features: { ordering: true, payment: false } };

const INIT_CATS = [
  { id: "1", name: "Starters",     icon: "🥗", sort: 1 },
  { id: "2", name: "Main Course",  icon: "🍽️", sort: 2 },
  { id: "3", name: "Desserts",     icon: "🍮", sort: 3 },
  { id: "4", name: "Drinks",       icon: "🥂", sort: 4 },
];

const INIT_ITEMS = [
  { id:"1",  cat:"1", name:"Burrata & Heirloom Tomato",  desc:"Creamy burrata, heirloom tomatoes, aged balsamic, micro basil", price:18, img:"https://images.unsplash.com/photo-1607877361964-d41a1f258be2?w=400&q=80", available:true },
  { id:"2",  cat:"1", name:"Tuna Tartare",               desc:"Yellowfin tuna, avocado mousse, sesame oil, crispy wonton",      price:24, img:"https://images.unsplash.com/photo-1534482421-64566f976cfa?w=400&q=80", available:true },
  { id:"3",  cat:"1", name:"Foie Gras Torchon",          desc:"House-cured foie gras, brioche, fig jam, Sauternes gelée",       price:32, img:"https://images.unsplash.com/photo-1551218808-94e220e084d2?w=400&q=80", available:false },
  { id:"4",  cat:"2", name:"Wagyu Beef Tenderloin",      desc:"A5 Wagyu, truffle jus, pomme purée, seasonal vegetables",        price:95, img:"https://images.unsplash.com/photo-1546964124-0cce460f38ef?w=400&q=80", available:true },
  { id:"5",  cat:"2", name:"Pan-Seared Sea Bass",        desc:"Mediterranean sea bass, saffron beurre blanc, fennel, capers",   price:52, img:"https://images.unsplash.com/photo-1519708227418-c8fd9a32b7a2?w=400&q=80", available:true },
  { id:"6",  cat:"3", name:"Chocolate Soufflé",          desc:"Valrhona dark chocolate, vanilla crème anglaise, sea salt",      price:16, img:"https://images.unsplash.com/photo-1578985545062-69928b1d9587?w=400&q=80", available:true },
  { id:"7",  cat:"3", name:"Crème Brûlée",               desc:"Madagascar vanilla, caramelised sugar, seasonal berries",        price:14, img:"https://images.unsplash.com/photo-1470324161839-ce2bb6fa6bc3?w=400&q=80", available:true },
  { id:"8",  cat:"4", name:"Signature Negroni",          desc:"Gin, Campari, sweet vermouth, orange peel, smoked ice",          price:22, img:"https://images.unsplash.com/photo-1514362453360-8f94243c9996?w=400&q=80", available:true },
  { id:"9",  cat:"4", name:"Château Margaux 2018",       desc:"Bordeaux Premier Grand Cru Classé, glass",                       price:85, img:"https://images.unsplash.com/photo-1510812431401-41d2bd2722f3?w=400&q=80", available:true },
];

const INIT_ORDERS = [
  { id:"o1", table:3, status:"new",       items:[{name:"Wagyu Beef Tenderloin",qty:1},{name:"Signature Negroni",qty:2}], total:139, time:"2 min ago" },
  { id:"o2", table:7, status:"preparing", items:[{name:"Tuna Tartare",qty:2},{name:"Crème Brûlée",qty:2}],              total:76,  time:"8 min ago" },
  { id:"o3", table:1, status:"ready",     items:[{name:"Burrata & Heirloom Tomato",qty:1}],                             total:18,  time:"14 min ago" },
  { id:"o4", table:5, status:"done",      items:[{name:"Pan-Seared Sea Bass",qty:2},{name:"Château Margaux 2018",qty:1}],total:189, time:"32 min ago" },
];

const ORDER_META = {
  new:       { label:"New",       bg:"#fef6e8", text:"#b45309", dot:"#f59e0b" },
  preparing: { label:"Preparing", bg:"#e8ecf5", text:"#3d55a0", dot:"#5c6bc0" },
  ready:     { label:"Ready",     bg:"#eaf5ea", text:"#2e7d32", dot:"#4caf50" },
  done:      { label:"Done",      bg:"#f5f0e8", text:"#a89880", dot:"#c4b8a8" },
};

const fmt = (n) => `$${Number(n).toFixed(2)}`;

function Login({ onLogin }) {
  const [pw, setPw] = useState("");
  const [err, setErr] = useState(false);
  const [shake, setShake] = useState(false);
  const attempt = () => {
    if (pw === "admin123") { onLogin(); }
    else { setErr(true); setShake(true); setTimeout(() => setShake(false), 500); }
  };
  return (
    <div style={{ minHeight:"100vh", background:"#f5f0e8", display:"flex", alignItems:"center", justifyContent:"center", fontFamily:"Syne, sans-serif" }}>
      <GS />
      <div className="fade-up" style={{ width:380, padding:"48px 40px", background:"#fff", border:"1px solid #e4dcd0", borderRadius:20, boxShadow:"0 4px 32px rgba(0,0,0,0.06)" }}>
        <div style={{ width:48, height:48, background:"#1a1714", borderRadius:12, display:"flex", alignItems:"center", justifyContent:"center", fontSize:22, marginBottom:24 }}>🍽️</div>
        <div style={{ fontSize:24, fontWeight:800, color:"#1a1714", letterSpacing:"-0.02em", marginBottom:4 }}>{RESTAURANT.name}</div>
        <div style={{ fontSize:12, color:"#a89880", fontFamily:"DM Mono", marginBottom:36 }}>Restaurant Admin · {RESTAURANT.location}</div>
        <div style={{ fontSize:10, color:"#b0a090", fontFamily:"DM Mono", letterSpacing:"0.12em", marginBottom:8 }}>PASSWORD</div>
        <input type="password" value={pw} autoFocus
          onChange={e => { setPw(e.target.value); setErr(false); }}
          onKeyDown={e => e.key==="Enter" && attempt()}
          placeholder="Enter your password"
          style={{ width:"100%", background:"#faf7f2", border:`1.5px solid ${err?"#ef5350":"#e4dcd0"}`, borderRadius:10, padding:"12px 14px", color:"#1a1714", fontSize:14, fontFamily:"DM Mono", animation:shake?"shake 0.4s ease":"none", transition:"border-color 0.2s" }}
        />
        {err && <div style={{ color:"#c62828", fontSize:11, fontFamily:"DM Mono", marginTop:6 }}>Incorrect password</div>}
        <button type="button" className="btn-accent" onClick={attempt} style={{ marginTop:20, width:"100%", background:"#1a1714", color:"#f5f0e8", border:"none", borderRadius:10, padding:"13px", fontSize:13, fontWeight:700, cursor:"pointer", fontFamily:"Syne", minHeight:44 }}>
          Sign In →
        </button>
        <div style={{ marginTop:16, fontSize:11, color:"#c4b8a8", fontFamily:"DM Mono", textAlign:"center" }}>demo: <span style={{ color:"#8a7d6b" }}>admin123</span></div>
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

function ItemModal({ item, cats, onSave, onClose }) {
  const [form, setForm] = useState(item || { name:"", desc:"", price:"", cat:cats[0]?.id, img:"", available:true });
  const set = (k,v) => setForm(p=>({...p,[k]:v}));
  const valid = form.name.trim() && form.price;
  return (
    <div style={S.overlay} onClick={onClose}>
      <div className="fade-up" style={S.modal} onClick={e=>e.stopPropagation()}>
        <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:20 }}>
          <span style={S.modalTitle}>{item?"Edit Item":"New Item"}</span>
          <button type="button" className="btn-close" style={S.closeBtn} onClick={onClose} aria-label="Close">✕</button>
        </div>
        {form.img && <img src={form.img} alt="" style={{ width:"100%", height:160, objectFit:"cover", borderRadius:10, marginBottom:16 }} onError={e=>e.target.style.display="none"} />}
        <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:14 }}>
          <Field label="Item Name" style={{ gridColumn:"1/-1" }}>
            <input style={S.inp} value={form.name} onChange={e=>set("name",e.target.value)} placeholder="e.g. Truffle Risotto" />
          </Field>
          <Field label="Price ($)">
            <input style={S.inp} type="number" value={form.price} onChange={e=>set("price",e.target.value)} placeholder="0.00" />
          </Field>
          <Field label="Category">
            <select style={S.inp} value={form.cat} onChange={e=>set("cat",e.target.value)}>
              {cats.map(c=><option key={c.id} value={c.id}>{c.icon} {c.name}</option>)}
            </select>
          </Field>
          <Field label="Image URL" style={{ gridColumn:"1/-1" }}>
            <input style={S.inp} value={form.img} onChange={e=>set("img",e.target.value)} placeholder="https://..." />
          </Field>
          <Field label="Description" style={{ gridColumn:"1/-1" }}>
            <textarea style={{ ...S.inp, minHeight:68, resize:"vertical" }} value={form.desc} onChange={e=>set("desc",e.target.value)} placeholder="Describe the dish..." />
          </Field>
        </div>
        <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", padding:"12px 0", borderTop:"1px solid #f0ebe4", margin:"16px 0 20px" }}>
          <span style={{ fontSize:13, color:"#555", fontFamily:"Syne" }}>Available on menu</span>
          <div onClick={()=>set("available",!form.available)} style={{ width:44, height:24, borderRadius:12, background:form.available?"#1a1714":"#ddd", cursor:"pointer", transition:"background 0.2s", position:"relative" }}>
            <div style={{ position:"absolute", top:2, left:form.available?22:2, width:20, height:20, borderRadius:"50%", background:"#fff", boxShadow:"0 1px 4px rgba(0,0,0,0.2)", transition:"left 0.2s" }} />
          </div>
        </div>
        <div style={{ display:"flex", gap:10, justifyContent:"flex-end", flexWrap:"wrap" }}>
          <button type="button" className="btn-ghost" style={S.ghostBtn} onClick={onClose}>Cancel</button>
          <button type="button" className="btn-accent" style={{ ...S.accentBtn, opacity:valid?1:0.4, cursor:valid?"pointer":"not-allowed" }} disabled={!valid} onClick={()=>valid&&onSave(form)}>
            {item?"Save Changes":"Add Item"}
          </button>
        </div>
      </div>
    </div>
  );
}

function CatModal({ cat, onSave, onClose }) {
  const [form, setForm] = useState(cat||{name:"",icon:"🍽️"});
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

function Confirm({ msg, onConfirm, onCancel }) {
  return (
    <div style={S.overlay} onClick={onCancel}>
      <div className="fade-up" style={{ ...S.modal, maxWidth:340, padding:32, textAlign:"center" }} onClick={e=>e.stopPropagation()}>
        <div style={{ fontSize:36, marginBottom:14 }}>🗑</div>
        <div style={{ fontSize:15, fontWeight:600, color:"#1a1714", marginBottom:6 }}>{msg}</div>
        <div style={{ fontSize:12, color:"#a89880", fontFamily:"DM Mono", marginBottom:24 }}>Cannot be undone.</div>
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

function TableQRCard({ tableNum }) {
  const canvasRef = useRef(null);
  const url = `${MENU_QR_BASE}?table=${tableNum}`;
  const downloadPng = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const a = document.createElement("a");
    a.href = canvas.toDataURL("image/png");
    a.download = `table-${tableNum}-qr.png`;
    a.click();
  };
  return (
    <div style={{ background:"#fff", border:"1px solid #e4dcd0", borderRadius:16, padding:"20px 16px", display:"flex", flexDirection:"column", alignItems:"center", gap:10, boxShadow:"0 1px 8px rgba(0,0,0,0.03)" }}>
      <div style={{ padding:10, border:"1.5px solid #ede7da", borderRadius:10, background:"#fff", lineHeight:0 }}>
        <QRCodeCanvas
          ref={canvasRef}
          value={url}
          size={112}
          level="M"
          marginSize={2}
          bgColor="#ffffff"
          fgColor="#1a1714"
          title={`Menu QR for table ${tableNum}`}
        />
      </div>
      <div style={{ fontWeight:800, fontSize:15, color:"#1a1714" }}>Table {tableNum}</div>
      <div style={{ fontSize:9, color:"#c4b8a8", fontFamily:"DM Mono", textAlign:"center", wordBreak:"break-all", maxWidth:"100%", lineHeight:1.35 }}>{url}</div>
      <button type="button" className="btn-qr-download" onClick={downloadPng} style={{ fontSize:11, color:"#8a7d6b", border:"1.5px solid #e4dcd0", background:"#fff", borderRadius:8, padding:"8px 16px", cursor:"pointer", fontFamily:"Syne", fontWeight:500, width:"100%", minHeight:40 }}>
        ↓ Download PNG
      </button>
    </div>
  );
}

function QRSection({ tables }) {
  return (
    <div className="fade-up">
      <div style={{ marginBottom:24 }}>
        <h1 style={S.pageTitle}>QR Codes</h1>
        <p style={S.pageSub}>One per table — guests scan to view menu & order</p>
      </div>
      <div style={{ display:"grid", gridTemplateColumns:"repeat(auto-fill, minmax(168px,1fr))", gap:14 }}>
        {Array.from({ length: tables }, (_, i) => i + 1).map((t) => (
          <TableQRCard key={t} tableNum={t} />
        ))}
      </div>
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
  const [tab, setTab] = useState("orders");
  const [features, setFeatures] = useState(() => ({ ...RESTAURANT.features }));
  const [cats, setCats] = useState(INIT_CATS);
  const [items, setItems] = useState(INIT_ITEMS);
  const [orders, setOrders] = useState(INIT_ORDERS);
  const [search, setSearch] = useState("");
  const [filterCat, setFilterCat] = useState("all");
  const [itemModal, setItemModal] = useState(null);
  const [catModal, setCatModal] = useState(null);
  const [confirmDel, setConfirmDel] = useState(null);
  const [toast, setToast] = useState(null);

  const showToast = (msg, type="ok") => { setToast({msg,type}); setTimeout(()=>setToast(null), 2500); };

  const saveItem = (form) => {
    const data = { ...form, price: Number(form.price) };
    if (form.id) { setItems(p=>p.map(i=>i.id===form.id?data:i)); showToast("Item updated ✓"); }
    else { setItems(p=>[...p,{...data,id:Date.now().toString()}]); showToast("Item added ✓"); }
    setItemModal(null);
  };

  const deleteItem = (id) => { setItems(p=>p.filter(i=>i.id!==id)); setConfirmDel(null); showToast("Deleted","warn"); };
  const toggleAvail = (id) => setItems(p=>p.map(i=>i.id===id?{...i,available:!i.available}:i));

  const saveCat = (form) => {
    if (form.id) { setCats(p=>p.map(c=>c.id===form.id?{...form}:c)); }
    else { setCats(p=>[...p,{...form,id:Date.now().toString(),sort:p.length+1}]); }
    setCatModal(null); showToast("Category saved ✓");
  };

  const updateOrderStatus = (id, status) => {
    setOrders(p=>p.map(o=>o.id===id?{...o,status}:o));
    showToast(`Order marked ${ORDER_META[status].label}`);
  };

  const catName = (id) => cats.find(c=>c.id===id)?.name || "—";

  const filteredItems = items.filter(i =>
    i.name.toLowerCase().includes(search.toLowerCase()) && (filterCat==="all" || i.cat===filterCat)
  );

  const newOrders = orders.filter(o=>o.status==="new").length;
  const todayRevenue = orders.reduce((s,o)=>s+o.total,0);

  if (!authed) return <Login onLogin={()=>setAuthed(true)} />;

  return (
    <div className="admin-root" style={S.root}>
      <GS />
      <aside className="admin-sidebar" style={S.sidebar}>
        <div style={S.sideTop}>
          <div style={{ fontSize:28, marginBottom:10 }}>🍽️</div>
          <div style={S.restName}>{RESTAURANT.name}</div>
          <div style={{ fontSize:9, fontFamily:"DM Mono", color:"#a89880", letterSpacing:"0.12em", marginTop:2 }}>{RESTAURANT.location}</div>
        </div>
        <nav className="admin-sidebar-nav" style={{ padding:"12px 0", flex:1 }}>
          {[
            { key:"orders",     icon:"🧾", label:"Orders",      badge:newOrders||null },
            { key:"menu",       icon:"🍽",  label:"Menu Items" },
            { key:"categories", icon:"📂", label:"Categories" },
            { key:"qr",         icon:"📱", label:"QR Codes" },
            { key:"settings",   icon:"⚙️",  label:"Settings" },
          ].map(({key,icon,label,badge})=>(
            <button type="button" key={key} className="nav-hover" onClick={()=>setTab(key)}
              style={{ ...S.navBtn, ...(tab===key?S.navActive:{}) }}>
              <span style={{ fontSize:15 }}>{icon}</span>
              <span style={{ flex:1 }}>{label}</span>
              {badge && <span style={{ background:"#c62828", color:"#fff", fontSize:10, fontFamily:"DM Mono", fontWeight:700, padding:"2px 7px", borderRadius:20 }}>{badge}</span>}
            </button>
          ))}
        </nav>
        <div style={S.sideFooter}>
          <div style={{ fontSize:10, fontFamily:"DM Mono", color:"#c4b8a8", marginBottom:4 }}>Plan</div>
          <div style={{ fontSize:12, fontFamily:"DM Mono", color:"#3d7a3d", fontWeight:600, marginBottom:12 }}>● {RESTAURANT.plan}</div>
          <button type="button" className="btn-signout" style={{ width:"100%", background:"transparent", border:"1px solid #e4dcd0", borderRadius:8, padding:"10px", color:"#a89880", fontSize:11, fontFamily:"DM Mono", cursor:"pointer", minHeight:40 }}
            onClick={()=>setAuthed(false)}>Sign Out</button>
        </div>
      </aside>

      <main className="admin-main" style={S.main}>
        {tab==="orders" && (
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

        {tab==="menu" && (
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
            <div className="admin-table-wrap" style={S.table}>
              <div style={S.thead}>
                <span style={{ flex:4 }}>Item</span>
                <span style={{ flex:2 }}>Category</span>
                <span style={{ flex:1 }}>Price</span>
                <span style={{ flex:1 }}>Status</span>
                <span style={{ flex:1 }}>Actions</span>
              </div>
              {filteredItems.length===0 && <div style={{ padding:"40px", textAlign:"center", color:"#c4b8a8", fontFamily:"DM Mono" }}>No items found</div>}
              {filteredItems.map(item=>(
                <div
                  key={item.id}
                  role="button"
                  tabIndex={0}
                  className="row-hover"
                  style={{ ...S.trow, cursor:"pointer" }}
                  onClick={()=>setItemModal(item)}
                  onKeyDown={(e)=>{ if(e.key==="Enter"||e.key===" "){ e.preventDefault(); setItemModal(item);} }}
                >
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
                    <span
                      role="button"
                      tabIndex={0}
                      className="chip-avail"
                      onClick={(e)=>{ e.stopPropagation(); toggleAvail(item.id); }}
                      onKeyDown={(e)=>{ if(e.key==="Enter"||e.key===" "){ e.preventDefault(); e.stopPropagation(); toggleAvail(item.id);} }}
                      style={{ display:"inline-flex", alignItems:"center", justifyContent:"center", boxSizing:"border-box", minWidth:84, fontSize:11, fontFamily:"DM Mono", fontWeight:600, padding:"5px 10px", borderRadius:20, cursor:"pointer", background:item.available?"#eaf5ea":"#fdecea", color:item.available?"#2e7d32":"#c62828", lineHeight:1.2 }}
                    >
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

        {tab==="categories" && (
          <div className="fade-up">
            <div className="menu-toolbar" style={{ display:"flex", justifyContent:"space-between", alignItems:"flex-end", marginBottom:24, gap:16, flexWrap:"wrap" }}>
              <div>
                <h1 style={S.pageTitle}>Categories</h1>
                <p style={S.pageSub}>Organise your menu sections</p>
              </div>
              <button type="button" className="btn-accent" style={S.accentBtn} onClick={()=>setCatModal("new")}>+ Add Category</button>
            </div>
            <div className="admin-table-wrap" style={S.table}>
              <div style={S.thead}>
                <span style={{ flex:1 }}>Icon</span>
                <span style={{ flex:4 }}>Name</span>
                <span style={{ flex:2 }}>Items</span>
                <span style={{ flex:1 }}>Actions</span>
              </div>
              {cats.map(cat=>{
                const count = items.filter(i=>i.cat===cat.id).length;
                const avail = items.filter(i=>i.cat===cat.id&&i.available).length;
                return (
                  <div key={cat.id} className="row-hover" style={S.trow}>
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

        {tab==="qr" && <QRSection tables={RESTAURANT.tables} />}

        {tab==="settings" && (
          <div className="fade-up" style={{ maxWidth:520 }}>
            <h1 style={S.pageTitle}>Settings</h1>
            <p style={S.pageSub}>Restaurant configuration</p>
            <div style={{ marginTop:24, background:"#fff", border:"1px solid #e4dcd0", borderRadius:16, padding:24, display:"flex", flexDirection:"column", gap:16 }}>
              {[
                { label:"Restaurant Name", val:RESTAURANT.name },
                { label:"Location",        val:RESTAURANT.location },
                { label:"Contact Email",   val:"info@housecafe.az" },
                { label:"Menu URL",        val:"menu.app/housecafe" },
              ].map(({label,val})=>(
                <div key={label} style={{ display:"flex", flexDirection:"column", gap:6 }}>
                  <label style={{ fontSize:10, fontFamily:"DM Mono", color:"#a89880", letterSpacing:"0.1em" }}>{label.toUpperCase()}</label>
                  <input defaultValue={val} style={S.inp} />
                </div>
              ))}
              <div style={{ display:"flex", flexDirection:"column", gap:6 }}>
                <label style={{ fontSize:10, fontFamily:"DM Mono", color:"#a89880", letterSpacing:"0.1em" }}>NEW PASSWORD</label>
                <input type="password" placeholder="Leave blank to keep current" style={S.inp} />
              </div>
              <button type="button" className="btn-accent" style={{ ...S.accentBtn, alignSelf:"flex-start", marginTop:4 }}>Save Settings</button>
            </div>
            <div style={{ marginTop:16, background:"#fff", border:"1px solid #e4dcd0", borderRadius:16, padding:24 }}>
              <div style={{ fontSize:11, fontFamily:"DM Mono", color:"#a89880", letterSpacing:"0.1em", marginBottom:16 }}>FEATURES</div>
              <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", padding:"12px 0", borderTop:"1px solid #f0ebe4", gap:16 }}>
                <div>
                  <div style={{ fontSize:13, fontWeight:600, color:"#1a1714", fontFamily:"Syne", marginBottom:4 }}>Online Ordering</div>
                  <div style={{ fontSize:12, color:"#8a7d6b", lineHeight:1.45 }}>Allow customers to order directly from their phone</div>
                </div>
                <AdminToggle
                  checked={features.ordering}
                  onChange={(v) => setFeatures((f) => ({ ...f, ordering: v, payment: v ? f.payment : false }))}
                />
              </div>
              <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", padding:"12px 0 0", borderTop:"1px solid #f0ebe4", marginTop:4, gap:16 }}>
                <div>
                  <div style={{ fontSize:13, fontWeight:600, color:"#1a1714", fontFamily:"Syne", marginBottom:4 }}>Online Payment</div>
                  <div style={{ fontSize:12, color:"#8a7d6b", lineHeight:1.45 }}>Allow customers to pay from their phone (requires ordering to be enabled)</div>
                </div>
                <AdminToggle
                  checked={features.payment}
                  disabled={!features.ordering}
                  onChange={(v) => setFeatures((f) => ({ ...f, payment: v }))}
                />
              </div>
            </div>
          </div>
        )}
      </main>

      {itemModal && <ItemModal item={itemModal==="new"?null:itemModal} cats={cats} onSave={saveItem} onClose={()=>setItemModal(null)} />}
      {catModal  && <CatModal  cat={catModal==="new"?null:catModal} onSave={saveCat} onClose={()=>setCatModal(null)} />}
      {confirmDel && <Confirm msg={`Delete "${confirmDel.name}"?`} onConfirm={()=>confirmDel.type==="item"?deleteItem(confirmDel.id):(setCats(p=>p.filter(c=>c.id!==confirmDel.id)),setConfirmDel(null),showToast("Deleted","warn"))} onCancel={()=>setConfirmDel(null)} />}

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