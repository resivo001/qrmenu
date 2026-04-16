import { useState } from "react";

const GlobalStyles = () => (
  <style>{`
    @import url('https://fonts.googleapis.com/css2?family=Syne:wght@400;500;600;700;800&family=DM+Mono:wght@300;400;500&display=swap');
    *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
    body { background: #f5f0e8; color: #1a1714; }
    ::-webkit-scrollbar { width: 3px; }
    ::-webkit-scrollbar-thumb { background: #d4c9b8; }
    input, select, textarea { font-family: inherit; }
    input:focus, select:focus, textarea:focus { outline: none; }
    @keyframes fadeUp { from { opacity:0; transform:translateY(12px); } to { opacity:1; transform:translateY(0); } }
    @keyframes fadeIn { from { opacity:0; } to { opacity:1; } }
    .fade-up { animation: fadeUp 0.35s cubic-bezier(0.16,1,0.3,1) both; }
    .fade-in { animation: fadeIn 0.25s ease both; }
    .row-hover:hover { background: #ede7da !important; }
    .nav-btn:hover { background: #ede7da !important; color: #1a1714 !important; }
    .pill-btn:hover { opacity: 0.85; }
    .icon-btn:hover { background: #e4dcd0 !important; }
  `}</style>
);

const MOCK_RESTAURANTS = [
  { id: "1", name: "Lumière", location: "Port Baku, AZ", plan: "pro", status: "active", password: "lumi2024!", joinDate: "2024-01-15", tables: 12, menuItems: 34, ordersToday: 47, revenue: 8420, contact: "manager@lumiere.az", lastActive: "2 min ago" },
  { id: "2", name: "The House Cafe", location: "Nizami St, AZ", plan: "pro", status: "active", password: "house@baku", joinDate: "2024-02-03", tables: 8, menuItems: 28, ordersToday: 31, revenue: 5180, contact: "info@housecafe.az", lastActive: "18 min ago" },
  { id: "3", name: "Zafferano", location: "Dubai, UAE", plan: "enterprise", status: "active", password: "zaff#2024", joinDate: "2024-03-20", tables: 24, menuItems: 62, ordersToday: 112, revenue: 24600, contact: "ops@zafferano.ae", lastActive: "Just now" },
  { id: "4", name: "Baku Grill House", location: "Sahil, AZ", plan: "starter", status: "disabled", password: "grill123", joinDate: "2024-04-10", tables: 5, menuItems: 18, ordersToday: 0, revenue: 1230, contact: "owner@bakugrill.az", lastActive: "3 days ago" },
  { id: "5", name: "Novikov Baku", location: "Flame Towers, AZ", plan: "enterprise", status: "active", password: "novikov!@#", joinDate: "2024-05-01", tables: 30, menuItems: 88, ordersToday: 204, revenue: 51200, contact: "baku@novikov.com", lastActive: "5 min ago" },
  { id: "6", name: "Chinar", location: "Bulvar, AZ", plan: "starter", status: "suspended", password: "chinar22", joinDate: "2024-06-18", tables: 6, menuItems: 22, ordersToday: 0, revenue: 3100, contact: "chinar@mail.ru", lastActive: "12 days ago" },
];

const PLAN_META = {
  starter:    { label: "Starter",    color: "#ede7da", text: "#8a7d6b", price: "$29/mo" },
  pro:        { label: "Pro",        color: "#e8f0e8", text: "#3d7a3d", price: "$79/mo" },
  enterprise: { label: "Enterprise", color: "#e8ecf5", text: "#3d55a0", price: "$199/mo" },
};

const STATUS_META = {
  active:    { label: "Active",    bg: "#eaf5ea", text: "#2e7d32" },
  disabled:  { label: "Disabled",  bg: "#fef6e8", text: "#b45309" },
  suspended: { label: "Suspended", bg: "#fdecea", text: "#c62828" },
};

const fmt = (n) => `$${Number(n).toLocaleString()}`;

function Login({ onLogin }) {
  const [pw, setPw] = useState("");
  const [err, setErr] = useState(false);
  const [shake, setShake] = useState(false);
  const attempt = () => {
    if (pw === "superadmin") { onLogin(); }
    else { setErr(true); setShake(true); setTimeout(() => setShake(false), 500); }
  };
  return (
    <div style={{ minHeight:"100vh", background:"#f5f0e8", display:"flex", alignItems:"center", justifyContent:"center", fontFamily:"Syne, sans-serif" }}>
      <GlobalStyles />
      <style>{`@keyframes shake { 0%,100%{transform:translateX(0)} 20%{transform:translateX(-10px)} 40%{transform:translateX(10px)} 60%{transform:translateX(-6px)} 80%{transform:translateX(6px)} }`}</style>
      <div className="fade-up" style={{ width:380, padding:"48px 40px", background:"#fff", border:"1px solid #e4dcd0", borderRadius:20, boxShadow:"0 4px 32px rgba(0,0,0,0.06)" }}>
        <div style={{ width:48, height:48, background:"#1a1714", borderRadius:12, display:"flex", alignItems:"center", justifyContent:"center", fontSize:20, fontWeight:800, color:"#f5f0e8", marginBottom:28 }}>S</div>
        <div style={{ fontSize:26, fontWeight:800, color:"#1a1714", letterSpacing:"-0.02em", marginBottom:4 }}>Super Admin</div>
        <div style={{ fontSize:12, color:"#a89880", fontFamily:"DM Mono", marginBottom:36 }}>QRMenu Platform · God Mode</div>
        <div style={{ fontSize:10, color:"#b0a090", fontFamily:"DM Mono", letterSpacing:"0.12em", marginBottom:8 }}>MASTER PASSWORD</div>
        <input type="password" value={pw} autoFocus
          onChange={(e) => { setPw(e.target.value); setErr(false); }}
          onKeyDown={(e) => e.key === "Enter" && attempt()}
          placeholder="Enter master password"
          style={{ width:"100%", background:"#faf7f2", border:`1.5px solid ${err?"#ef5350":"#e4dcd0"}`, borderRadius:10, padding:"12px 14px", color:"#1a1714", fontSize:14, fontFamily:"DM Mono", animation: shake ? "shake 0.4s ease" : "none", transition:"border-color 0.2s" }}
        />
        {err && <div style={{ color:"#c62828", fontSize:11, fontFamily:"DM Mono", marginTop:6 }}>// ACCESS DENIED</div>}
        <button onClick={attempt} style={{ marginTop:20, width:"100%", background:"#1a1714", color:"#f5f0e8", border:"none", borderRadius:10, padding:"13px", fontSize:13, fontWeight:700, cursor:"pointer", fontFamily:"Syne" }}>
          AUTHENTICATE →
        </button>
        <div style={{ marginTop:16, fontSize:11, color:"#c4b8a8", fontFamily:"DM Mono", textAlign:"center" }}>
          demo: <span style={{ color:"#8a7d6b" }}>superadmin</span>
        </div>
      </div>
    </div>
  );
}

function MField({ label, children, style }) {
  return (
    <div style={{ display:"flex", flexDirection:"column", gap:6, ...style }}>
      <label style={{ fontSize:10, fontFamily:"DM Mono", color:"#a89880", letterSpacing:"0.1em" }}>{label.toUpperCase()}</label>
      {children}
    </div>
  );
}

function EditModal({ restaurant, onSave, onClose }) {
  const [form, setForm] = useState({ ...restaurant });
  const [showPw, setShowPw] = useState(false);
  const set = (k, v) => setForm(p => ({ ...p, [k]: v }));
  return (
    <div style={S.overlay} onClick={onClose}>
      <div className="fade-up" style={S.modal} onClick={e => e.stopPropagation()}>
        <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:24 }}>
          <span style={S.modalTitle}>Edit Restaurant</span>
          <button style={S.closeBtn} onClick={onClose}>✕</button>
        </div>
        <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:14 }}>
          <MField label="Restaurant Name" style={{ gridColumn:"1/-1" }}>
            <input style={S.inp} value={form.name} onChange={e => set("name", e.target.value)} />
          </MField>
          <MField label="Location">
            <input style={S.inp} value={form.location} onChange={e => set("location", e.target.value)} />
          </MField>
          <MField label="Contact Email">
            <input style={S.inp} value={form.contact} onChange={e => set("contact", e.target.value)} />
          </MField>
          <MField label="Admin Password" style={{ gridColumn:"1/-1" }}>
            <div style={{ position:"relative" }}>
              <input style={{ ...S.inp, fontFamily:"DM Mono", paddingRight:64 }} type={showPw ? "text" : "password"} value={form.password} onChange={e => set("password", e.target.value)} />
              <button onClick={() => setShowPw(p => !p)} style={{ position:"absolute", right:10, top:"50%", transform:"translateY(-50%)", background:"none", border:"none", color:"#a89880", cursor:"pointer", fontSize:11, fontFamily:"DM Mono" }}>
                {showPw ? "HIDE" : "SHOW"}
              </button>
            </div>
          </MField>
          <MField label="Plan">
            <select style={S.inp} value={form.plan} onChange={e => set("plan", e.target.value)}>
              <option value="starter">Starter — $29/mo</option>
              <option value="pro">Pro — $79/mo</option>
              <option value="enterprise">Enterprise — $199/mo</option>
            </select>
          </MField>
          <MField label="Status">
            <select style={S.inp} value={form.status} onChange={e => set("status", e.target.value)}>
              <option value="active">Active</option>
              <option value="disabled">Disabled</option>
              <option value="suspended">Suspended</option>
            </select>
          </MField>
          <MField label="Tables">
            <input style={S.inp} type="number" value={form.tables} onChange={e => set("tables", e.target.value)} />
          </MField>
          <MField label="Join Date">
            <input style={S.inp} type="date" value={form.joinDate} onChange={e => set("joinDate", e.target.value)} />
          </MField>
        </div>
        <div style={{ display:"flex", gap:10, marginTop:24, justifyContent:"flex-end" }}>
          <button style={S.ghostBtn} onClick={onClose}>Cancel</button>
          <button style={S.accentBtn} onClick={() => onSave(form)}>Save Changes</button>
        </div>
      </div>
    </div>
  );
}

function AddModal({ onSave, onClose }) {
  const [form, setForm] = useState({ name:"", location:"", contact:"", password:"", plan:"pro", status:"active", tables:10, joinDate: new Date().toISOString().split("T")[0] });
  const set = (k, v) => setForm(p => ({ ...p, [k]: v }));
  const valid = form.name.trim() && form.password.trim();
  return (
    <div style={S.overlay} onClick={onClose}>
      <div className="fade-up" style={S.modal} onClick={e => e.stopPropagation()}>
        <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:24 }}>
          <span style={S.modalTitle}>Add Restaurant</span>
          <button style={S.closeBtn} onClick={onClose}>✕</button>
        </div>
        <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:14 }}>
          <MField label="Restaurant Name" style={{ gridColumn:"1/-1" }}>
            <input style={S.inp} placeholder="e.g. Baku Steakhouse" value={form.name} onChange={e => set("name", e.target.value)} />
          </MField>
          <MField label="Location">
            <input style={S.inp} placeholder="City, Country" value={form.location} onChange={e => set("location", e.target.value)} />
          </MField>
          <MField label="Contact Email">
            <input style={S.inp} placeholder="admin@restaurant.com" value={form.contact} onChange={e => set("contact", e.target.value)} />
          </MField>
          <MField label="Admin Password" style={{ gridColumn:"1/-1" }}>
            <input style={{ ...S.inp, fontFamily:"DM Mono" }} placeholder="Set their login password" value={form.password} onChange={e => set("password", e.target.value)} />
          </MField>
          <MField label="Plan">
            <select style={S.inp} value={form.plan} onChange={e => set("plan", e.target.value)}>
              <option value="starter">Starter — $29/mo</option>
              <option value="pro">Pro — $79/mo</option>
              <option value="enterprise">Enterprise — $199/mo</option>
            </select>
          </MField>
          <MField label="Tables">
            <input style={S.inp} type="number" value={form.tables} onChange={e => set("tables", e.target.value)} />
          </MField>
        </div>
        <div style={{ display:"flex", gap:10, marginTop:24, justifyContent:"flex-end" }}>
          <button style={S.ghostBtn} onClick={onClose}>Cancel</button>
          <button style={{ ...S.accentBtn, opacity: valid ? 1 : 0.4, cursor: valid ? "pointer" : "not-allowed" }} onClick={() => valid && onSave(form)}>
            Create Restaurant
          </button>
        </div>
      </div>
    </div>
  );
}

function DetailDrawer({ restaurant: r, onEdit, onDelete, onToggle, onClose }) {
  const [showPw, setShowPw] = useState(false);
  const sm = STATUS_META[r.status];
  const pm = PLAN_META[r.plan];
  return (
    <div style={{ ...S.overlay, justifyContent:"flex-end", alignItems:"stretch" }} onClick={onClose}>
      <div className="fade-in" style={S.drawer} onClick={e => e.stopPropagation()}>
        <div style={{ display:"flex", justifyContent:"space-between", alignItems:"flex-start", marginBottom:28 }}>
          <div>
            <div style={{ fontSize:22, fontWeight:800, color:"#1a1714", letterSpacing:"-0.02em" }}>{r.name}</div>
            <div style={{ fontSize:12, color:"#a89880", fontFamily:"DM Mono", marginTop:4 }}>{r.location}</div>
          </div>
          <button style={S.closeBtn} onClick={onClose}>✕</button>
        </div>
        <div style={{ display:"flex", gap:8, marginBottom:24 }}>
          <span style={{ fontSize:11, fontFamily:"DM Mono", padding:"4px 10px", borderRadius:20, background:sm.bg, color:sm.text }}>● {sm.label}</span>
          <span style={{ fontSize:11, fontFamily:"DM Mono", padding:"4px 10px", borderRadius:20, background:pm.color, color:pm.text }}>{pm.label} · {pm.price}</span>
        </div>
        <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:10, marginBottom:24 }}>
          {[
            { label:"Tables", val: r.tables },
            { label:"Menu Items", val: r.menuItems },
            { label:"Orders Today", val: r.ordersToday },
            { label:"Total Revenue", val: fmt(r.revenue) },
          ].map(({ label, val }) => (
            <div key={label} style={{ background:"#faf7f2", borderRadius:12, padding:"14px 16px", border:"1px solid #e4dcd0" }}>
              <div style={{ fontSize:20, fontWeight:700, color:"#1a1714", fontFamily:"DM Mono" }}>{val}</div>
              <div style={{ fontSize:11, color:"#a89880", marginTop:4 }}>{label}</div>
            </div>
          ))}
        </div>
        <div style={{ display:"flex", flexDirection:"column", gap:10, marginBottom:28 }}>
          {[
            { label:"Contact", val: r.contact, mono: true },
            { label:"Joined", val: r.joinDate, mono: true },
            { label:"Last Active", val: r.lastActive },
          ].map(({ label, val, mono }) => (
            <div key={label} style={{ display:"flex", justifyContent:"space-between", alignItems:"center", padding:"10px 14px", background:"#faf7f2", borderRadius:10, border:"1px solid #e4dcd0" }}>
              <span style={{ fontSize:10, color:"#a89880", fontFamily:"DM Mono", letterSpacing:"0.1em" }}>{label.toUpperCase()}</span>
              <span style={{ fontSize:13, color:"#3a3028", fontFamily: mono ? "DM Mono" : "Syne" }}>{val}</span>
            </div>
          ))}
          <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", padding:"12px 14px", background:"#faf7f2", borderRadius:10, border:"1px solid #e4dcd0" }}>
            <div>
              <div style={{ fontSize:10, color:"#a89880", fontFamily:"DM Mono", letterSpacing:"0.1em", marginBottom:5 }}>ADMIN PASSWORD</div>
              <div style={{ fontSize:14, fontFamily:"DM Mono", color:"#1a1714" }}>{showPw ? r.password : "••••••••••"}</div>
            </div>
            <button onClick={() => setShowPw(p => !p)} style={{ background:"#ede7da", border:"1px solid #d4c9b8", borderRadius:8, padding:"6px 12px", color:"#8a7d6b", fontSize:10, fontFamily:"DM Mono", cursor:"pointer" }}>
              {showPw ? "HIDE" : "REVEAL"}
            </button>
          </div>
        </div>
        <div style={{ display:"flex", flexDirection:"column", gap:8 }}>
          <button style={S.drawerBtn} onClick={() => onEdit(r)}>✏️ Edit Restaurant</button>
          <button style={{ ...S.drawerBtn, color: r.status==="active" ? "#b45309" : "#2e7d32" }} onClick={() => onToggle(r.id)}>
            {r.status==="active" ? "⏸ Temporarily Disable" : "▶ Re-enable Restaurant"}
          </button>
          <button style={{ ...S.drawerBtn, color:"#c62828", borderColor:"#fdecea", background:"#fef9f9" }} onClick={() => onDelete(r.id)}>
            🗑 Delete Restaurant
          </button>
        </div>
      </div>
    </div>
  );
}

function Confirm({ msg, onConfirm, onCancel }) {
  return (
    <div style={S.overlay} onClick={onCancel}>
      <div className="fade-up" style={{ ...S.modal, maxWidth:360, padding:32, textAlign:"center" }} onClick={e => e.stopPropagation()}>
        <div style={{ fontSize:40, marginBottom:16 }}>⚠️</div>
        <div style={{ fontSize:15, color:"#1a1714", marginBottom:8, fontWeight:600 }}>{msg}</div>
        <div style={{ fontSize:12, color:"#a89880", fontFamily:"DM Mono", marginBottom:28 }}>This action cannot be undone.</div>
        <div style={{ display:"flex", gap:10 }}>
          <button style={{ ...S.ghostBtn, flex:1 }} onClick={onCancel}>Cancel</button>
          <button style={{ ...S.accentBtn, flex:1, background:"#c62828" }} onClick={onConfirm}>Delete</button>
        </div>
      </div>
    </div>
  );
}

export default function SuperAdmin() {
  const [authed, setAuthed] = useState(false);
  const [tab, setTab] = useState("restaurants");
  const [restaurants, setRestaurants] = useState(MOCK_RESTAURANTS);
  const [search, setSearch] = useState("");
  const [filterStatus, setFilterStatus] = useState("all");
  const [filterPlan, setFilterPlan] = useState("all");
  const [editModal, setEditModal] = useState(null);
  const [addModal, setAddModal] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(null);
  const [detail, setDetail] = useState(null);
  const [toast, setToast] = useState(null);

  const showToast = (msg, type="ok") => { setToast({ msg, type }); setTimeout(() => setToast(null), 2800); };
  const saveEdit = (form) => { setRestaurants(p => p.map(r => r.id===form.id ? { ...r, ...form } : r)); setEditModal(null); setDetail(null); showToast("Restaurant updated ✓"); };
  const addRestaurant = (form) => { setRestaurants(p => [...p, { ...form, id: Date.now().toString(), menuItems:0, ordersToday:0, revenue:0, lastActive:"Just now" }]); setAddModal(false); showToast("Restaurant created ✓"); };
  const deleteRestaurant = (id) => { setRestaurants(p => p.filter(r => r.id!==id)); setConfirmDelete(null); setDetail(null); showToast("Restaurant deleted", "warn"); };
  const toggleStatus = (id) => {
    setRestaurants(p => p.map(r => r.id!==id ? r : { ...r, status: r.status==="active" ? "disabled" : "active" }));
    setDetail(prev => prev ? { ...prev, status: prev.status==="active" ? "disabled" : "active" } : prev);
    showToast("Status updated ✓");
  };

  const filtered = restaurants.filter(r => {
    const ms = r.name.toLowerCase().includes(search.toLowerCase()) || r.location.toLowerCase().includes(search.toLowerCase());
    return ms && (filterStatus==="all" || r.status===filterStatus) && (filterPlan==="all" || r.plan===filterPlan);
  });

  const totalRevenue = restaurants.reduce((s,r) => s+r.revenue, 0);
  const activeCount = restaurants.filter(r => r.status==="active").length;
  const totalOrders = restaurants.reduce((s,r) => s+r.ordersToday, 0);
  const mrr = restaurants.filter(r=>r.status==="active").reduce((s,r) => s+(r.plan==="starter"?29:r.plan==="pro"?79:199), 0);

  if (!authed) return <Login onLogin={() => setAuthed(true)} />;

  return (
    <div style={S.root}>
      <GlobalStyles />
      <aside style={S.sidebar}>
        <div style={S.sideTop}>
          <div style={S.logoMark}>S</div>
          <div style={S.platformName}>QRMenu</div>
          <div style={{ fontSize:9, fontFamily:"DM Mono", color:"#c62828", letterSpacing:"0.15em", marginTop:2 }}>SUPER ADMIN</div>
        </div>
        <nav style={{ padding:"12px 0", flex:1 }}>
          {[
            { key:"restaurants", icon:"🏪", label:"Restaurants" },
            { key:"analytics",   icon:"📊", label:"Analytics" },
            { key:"billing",     icon:"💳", label:"Billing" },
            { key:"logs",        icon:"📋", label:"Activity Logs" },
            { key:"settings",    icon:"⚙️",  label:"Platform Settings" },
          ].map(({ key, icon, label }) => (
            <button key={key} className="nav-btn" onClick={() => setTab(key)}
              style={{ ...S.navBtn, ...(tab===key ? S.navBtnActive : {}) }}>
              <span style={{ fontSize:15 }}>{icon}</span>
              <span>{label}</span>
            </button>
          ))}
        </nav>
        <div style={S.sideFooter}>
          <div style={{ fontSize:10, fontFamily:"DM Mono", color:"#c4b8a8", marginBottom:6 }}>Logged in as</div>
          <div style={{ fontSize:12, fontFamily:"DM Mono", color:"#c62828", fontWeight:600 }}>superadmin</div>
          <button style={{ marginTop:12, width:"100%", background:"transparent", border:"1px solid #e4dcd0", borderRadius:8, padding:"8px", color:"#a89880", fontSize:11, fontFamily:"DM Mono", cursor:"pointer" }}
            onClick={() => setAuthed(false)}>SIGN OUT</button>
        </div>
      </aside>

      <main style={S.main}>
        {tab==="restaurants" && (
          <div className="fade-up">
            <div style={S.kpiRow}>
              {[
                { label:"Total Restaurants", val: restaurants.length, sub:`${activeCount} active` },
                { label:"Platform Revenue",  val: fmt(totalRevenue), sub:"all time" },
                { label:"MRR",               val: fmt(mrr), sub:"from active plans" },
                { label:"Orders Today",      val: totalOrders, sub:"across all venues" },
              ].map(({ label, val, sub }) => (
                <div key={label} style={S.kpiCard}>
                  <div style={S.kpiVal}>{val}</div>
                  <div style={S.kpiLabel}>{label}</div>
                  <div style={S.kpiSub}>{sub}</div>
                </div>
              ))}
            </div>
            <div style={{ display:"flex", gap:10, alignItems:"center", marginBottom:20, flexWrap:"wrap" }}>
              <input value={search} onChange={e=>setSearch(e.target.value)} placeholder="Search restaurants…" style={S.searchInput} />
              <select value={filterStatus} onChange={e=>setFilterStatus(e.target.value)} style={S.filterSelect}>
                <option value="all">All Status</option>
                <option value="active">Active</option>
                <option value="disabled">Disabled</option>
                <option value="suspended">Suspended</option>
              </select>
              <select value={filterPlan} onChange={e=>setFilterPlan(e.target.value)} style={S.filterSelect}>
                <option value="all">All Plans</option>
                <option value="starter">Starter</option>
                <option value="pro">Pro</option>
                <option value="enterprise">Enterprise</option>
              </select>
              <div style={{ marginLeft:"auto" }}>
                <button style={S.accentBtn} onClick={() => setAddModal(true)}>+ Add Restaurant</button>
              </div>
            </div>
            <div style={S.table}>
              <div style={S.thead}>
                <span style={{ flex:3 }}>Restaurant</span>
                <span style={{ flex:2 }}>Plan</span>
                <span style={{ flex:2 }}>Status</span>
                <span style={{ flex:2 }}>Revenue</span>
                <span style={{ flex:2 }}>Orders Today</span>
                <span style={{ flex:1 }}>Actions</span>
              </div>
              {filtered.length===0 && <div style={{ padding:"48px", textAlign:"center", color:"#c4b8a8", fontFamily:"DM Mono", fontSize:13 }}>No restaurants found</div>}
              {filtered.map(r => {
                const sm = STATUS_META[r.status];
                const pm = PLAN_META[r.plan];
                return (
                  <div key={r.id} className="row-hover" style={S.trow} onClick={() => setDetail(r)}>
                    <span style={{ flex:3 }}>
                      <div style={{ fontWeight:700, fontSize:14, color:"#1a1714" }}>{r.name}</div>
                      <div style={{ fontSize:11, color:"#a89880", fontFamily:"DM Mono", marginTop:3 }}>{r.location} · {r.lastActive}</div>
                    </span>
                    <span style={{ flex:2 }}><span style={{ fontSize:11, fontFamily:"DM Mono", padding:"3px 10px", borderRadius:20, background:pm.color, color:pm.text }}>{pm.label}</span></span>
                    <span style={{ flex:2 }}><span style={{ fontSize:11, fontFamily:"DM Mono", padding:"3px 10px", borderRadius:20, background:sm.bg, color:sm.text }}>● {sm.label}</span></span>
                    <span style={{ flex:2, fontFamily:"DM Mono", fontSize:14, color:"#1a1714", fontWeight:600 }}>{fmt(r.revenue)}</span>
                    <span style={{ flex:2, fontFamily:"DM Mono", fontSize:14, color: r.ordersToday>0 ? "#2e7d32" : "#c4b8a8" }}>{r.ordersToday}</span>
                    <span style={{ flex:1, display:"flex", gap:5 }} onClick={e=>e.stopPropagation()}>
                      <button className="icon-btn" style={S.iconBtn} onClick={() => setEditModal(r)}>✏️</button>
                      <button className="icon-btn" style={S.iconBtn} onClick={() => toggleStatus(r.id)}>{r.status==="active"?"⏸":"▶"}</button>
                      <button className="icon-btn" style={S.iconBtn} onClick={() => setConfirmDelete(r.id)}>🗑</button>
                    </span>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {tab==="analytics" && (
          <div className="fade-up">
            <h1 style={S.pageTitle}>Analytics</h1>
            <p style={S.pageSub}>Platform-wide performance overview</p>
            <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:16, marginTop:24 }}>
              {[
                { label:"Top by Revenue", val:[...restaurants].sort((a,b)=>b.revenue-a.revenue)[0]?.name, sub: fmt([...restaurants].sort((a,b)=>b.revenue-a.revenue)[0]?.revenue) },
                { label:"Top by Orders", val:[...restaurants].sort((a,b)=>b.ordersToday-a.ordersToday)[0]?.name, sub:`${[...restaurants].sort((a,b)=>b.ordersToday-a.ordersToday)[0]?.ordersToday} orders today` },
                { label:"Avg Revenue / Restaurant", val: fmt(Math.round(totalRevenue/restaurants.length)), sub:"all time" },
                { label:"Enterprise Clients", val: restaurants.filter(r=>r.plan==="enterprise").length, sub:`of ${restaurants.length} total` },
              ].map(({ label, val, sub }) => (
                <div key={label} style={{ background:"#fff", border:"1px solid #e4dcd0", borderRadius:16, padding:"24px" }}>
                  <div style={{ fontSize:11, fontFamily:"DM Mono", color:"#a89880", marginBottom:12, letterSpacing:"0.1em" }}>{label.toUpperCase()}</div>
                  <div style={{ fontSize:26, fontWeight:800, color:"#1a1714", letterSpacing:"-0.02em" }}>{val}</div>
                  <div style={{ fontSize:12, color:"#a89880", fontFamily:"DM Mono", marginTop:6 }}>{sub}</div>
                </div>
              ))}
            </div>
            <div style={{ marginTop:16, background:"#fff", border:"1px solid #e4dcd0", borderRadius:16, padding:"24px" }}>
              <div style={{ fontSize:11, fontFamily:"DM Mono", color:"#a89880", marginBottom:20, letterSpacing:"0.1em" }}>REVENUE BY PLAN</div>
              {["enterprise","pro","starter"].map(plan => {
                const rev = restaurants.filter(r=>r.plan===plan).reduce((s,r)=>s+r.revenue,0);
                const pct = Math.round((rev/totalRevenue)*100) || 0;
                const pm = PLAN_META[plan];
                return (
                  <div key={plan} style={{ marginBottom:18 }}>
                    <div style={{ display:"flex", justifyContent:"space-between", marginBottom:7 }}>
                      <span style={{ fontSize:12, color:pm.text, fontFamily:"DM Mono", fontWeight:500 }}>{pm.label}</span>
                      <span style={{ fontSize:12, color:"#a89880", fontFamily:"DM Mono" }}>{fmt(rev)} · {pct}%</span>
                    </div>
                    <div style={{ height:6, background:"#ede7da", borderRadius:3 }}>
                      <div style={{ height:"100%", width:`${pct}%`, background:pm.text, borderRadius:3, transition:"width 0.5s ease" }} />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {tab==="billing" && (
          <div className="fade-up">
            <h1 style={S.pageTitle}>Billing</h1>
            <p style={S.pageSub}>Subscription & payment overview</p>
            <div style={{ marginTop:24, background:"#fff", border:"1px solid #e4dcd0", borderRadius:16, overflow:"hidden" }}>
              <div style={S.thead}>
                <span style={{ flex:3 }}>Restaurant</span>
                <span style={{ flex:2 }}>Plan</span>
                <span style={{ flex:2 }}>Amount</span>
                <span style={{ flex:2 }}>Status</span>
                <span style={{ flex:2 }}>Next Billing</span>
              </div>
              {restaurants.map(r => {
                const pm = PLAN_META[r.plan];
                return (
                  <div key={r.id} className="row-hover" style={{ ...S.trow, cursor:"default" }}>
                    <span style={{ flex:3, fontWeight:600, color:"#1a1714", fontSize:14 }}>{r.name}</span>
                    <span style={{ flex:2 }}><span style={{ fontSize:11, fontFamily:"DM Mono", padding:"3px 10px", borderRadius:20, background:pm.color, color:pm.text }}>{pm.label}</span></span>
                    <span style={{ flex:2, fontFamily:"DM Mono", color:"#1a1714", fontWeight:500 }}>{pm.price}</span>
                    <span style={{ flex:2, fontSize:12, fontFamily:"DM Mono", color: r.status==="active" ? "#2e7d32" : "#c62828" }}>{r.status==="active" ? "● Paying" : "○ Inactive"}</span>
                    <span style={{ flex:2, fontFamily:"DM Mono", color:"#a89880", fontSize:12 }}>{r.status==="active" ? "May 15, 2026" : "—"}</span>
                  </div>
                );s
              })}
            </div>
          </div>
        )}

        {tab==="logs" && (
          <div className="fade-up">
            <h1 style={S.pageTitle}>Activity Logs</h1>
            <p style={S.pageSub}>Recent platform events</p>
            <div style={{ marginTop:24, display:"flex", flexDirection:"column", gap:8 }}>
              {[
                { time:"2 min ago",  icon:"🟢", msg:"Novikov Baku — 12 new orders placed" },
                { time:"18 min ago", icon:"✏️", msg:"The House Cafe — menu item updated" },
                { time:"1 hr ago",   icon:"🔴", msg:"Baku Grill House — disabled by super admin" },
                { time:"2 hr ago",   icon:"🟢", msg:"Zafferano — new restaurant added" },
                { time:"3 hr ago",   icon:"💳", msg:"Lumière — plan upgraded to Pro" },
                { time:"Yesterday",  icon:"✏️", msg:"Chinar — password changed" },
                { time:"2 days ago", icon:"⚠️", msg:"Baku Grill House — payment failed" },
              ].map((log, i) => (
                <div key={i} style={{ display:"flex", gap:14, padding:"14px 16px", background:"#fff", border:"1px solid #e4dcd0", borderRadius:12, alignItems:"center" }}>
                  <span style={{ fontSize:18 }}>{log.icon}</span>
                  <span style={{ flex:1, fontSize:13, color:"#3a3028" }}>{log.msg}</span>
                  <span style={{ fontSize:11, fontFamily:"DM Mono", color:"#c4b8a8" }}>{log.time}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {tab==="settings" && (
          <div className="fade-up" style={{ maxWidth:520 }}>
            <h1 style={S.pageTitle}>Platform Settings</h1>
            <p style={S.pageSub}>Global configuration</p>
            <div style={{ marginTop:24, background:"#fff", border:"1px solid #e4dcd0", borderRadius:16, padding:24, display:"flex", flexDirection:"column", gap:16 }}>
              {[
                { label:"Platform Name", val:"QRMenu" },
                { label:"Platform URL", val:"qrmenu.app" },
                { label:"Support Email", val:"support@qrmenu.app" },
                { label:"Super Admin Password", val:"superadmin", type:"password" },
              ].map(({ label, val, type }) => (
                <div key={label} style={{ display:"flex", flexDirection:"column", gap:6 }}>
                  <label style={{ fontSize:10, fontFamily:"DM Mono", color:"#a89880", letterSpacing:"0.1em" }}>{label.toUpperCase()}</label>
                  <input type={type||"text"} defaultValue={val} style={S.inp} />
                </div>
              ))}
              <button style={{ ...S.accentBtn, alignSelf:"flex-start", marginTop:4 }}>Save Settings</button>
            </div>
          </div>
        )}
      </main>

      {editModal    && <EditModal restaurant={editModal} onSave={saveEdit} onClose={() => setEditModal(null)} />}
      {addModal     && <AddModal onSave={addRestaurant} onClose={() => setAddModal(false)} />}
      {confirmDelete && <Confirm msg={`Delete "${restaurants.find(r=>r.id===confirmDelete)?.name}"?`} onConfirm={() => deleteRestaurant(confirmDelete)} onCancel={() => setConfirmDelete(null)} />}
      {detail       && <DetailDrawer restaurant={detail} onEdit={r => { setEditModal(r); setDetail(null); }} onDelete={id => { setDetail(null); setConfirmDelete(id); }} onToggle={toggleStatus} onClose={() => setDetail(null)} />}

      {toast && (
        <div style={{ ...S.toast, background: toast.type==="warn" ? "#fdecea" : "#eaf5ea", color: toast.type==="warn" ? "#c62828" : "#2e7d32", border:`1px solid ${toast.type==="warn"?"#f5c6c6":"#c6e6c6"}` }}>
          {toast.msg}
        </div>
      )}
    </div>
  );
}

const S = {
  root:        { display:"flex", height:"100vh", fontFamily:"Syne, sans-serif", background:"#f5f0e8", overflow:"hidden" },
  sidebar:     { width:220, background:"#fff", borderRight:"1px solid #e4dcd0", display:"flex", flexDirection:"column", flexShrink:0 },
  sideTop:     { padding:"28px 22px 22px", borderBottom:"1px solid #ede7da" },
  logoMark:    { width:36, height:36, background:"#1a1714", borderRadius:10, display:"flex", alignItems:"center", justifyContent:"center", fontSize:18, fontWeight:800, color:"#f5f0e8", marginBottom:10 },
  platformName:{ fontSize:18, fontWeight:800, color:"#1a1714", letterSpacing:"-0.02em" },
  navBtn:      { display:"flex", alignItems:"center", gap:10, width:"100%", padding:"10px 22px", background:"transparent", border:"none", color:"#b0a090", cursor:"pointer", fontSize:13, fontFamily:"Syne", fontWeight:500, textAlign:"left", transition:"all 0.15s", borderLeft:"2px solid transparent" },
  navBtnActive:{ background:"#faf7f2", color:"#1a1714", borderLeft:"2px solid #1a1714" },
  sideFooter:  { padding:"16px 22px", borderTop:"1px solid #ede7da" },
  main:        { flex:1, overflowY:"auto", padding:"32px 36px" },
  kpiRow:      { display:"grid", gridTemplateColumns:"repeat(4,1fr)", gap:12, marginBottom:28 },
  kpiCard:     { background:"#fff", border:"1px solid #e4dcd0", borderRadius:14, padding:"20px 18px", boxShadow:"0 1px 8px rgba(0,0,0,0.03)" },
  kpiVal:      { fontSize:26, fontWeight:800, color:"#1a1714", fontFamily:"DM Mono", letterSpacing:"-0.02em" },
  kpiLabel:    { fontSize:11, color:"#a89880", marginTop:6 },
  kpiSub:      { fontSize:10, color:"#c4b8a8", fontFamily:"DM Mono", marginTop:3 },
  searchInput: { padding:"9px 14px", background:"#fff", border:"1px solid #e4dcd0", borderRadius:8, color:"#1a1714", fontSize:13, fontFamily:"DM Mono", width:220 },
  filterSelect:{ padding:"9px 12px", background:"#fff", border:"1px solid #e4dcd0", borderRadius:8, color:"#8a7d6b", fontSize:12, fontFamily:"DM Mono", cursor:"pointer" },
  table:       { background:"#fff", borderRadius:16, overflow:"hidden", border:"1px solid #e4dcd0", boxShadow:"0 1px 8px rgba(0,0,0,0.03)" },
  thead:       { display:"flex", padding:"12px 20px", background:"#faf7f2", borderBottom:"1px solid #ede7da", fontSize:10, fontFamily:"DM Mono", color:"#c4b8a8", letterSpacing:"0.1em", gap:12 },
  trow:        { display:"flex", padding:"15px 20px", borderBottom:"1px solid #f5f0e8", alignItems:"center", gap:12, cursor:"pointer", transition:"background 0.15s" },
  iconBtn:     { background:"#faf7f2", border:"none", borderRadius:8, width:30, height:30, display:"flex", alignItems:"center", justifyContent:"center", cursor:"pointer", fontSize:13, transition:"background 0.15s" },
  accentBtn:   { background:"#1a1714", color:"#f5f0e8", border:"none", borderRadius:10, padding:"10px 20px", fontSize:13, fontWeight:700, cursor:"pointer", fontFamily:"Syne" },
  ghostBtn:    { background:"transparent", color:"#8a7d6b", border:"1px solid #e4dcd0", borderRadius:10, padding:"10px 20px", fontSize:13, cursor:"pointer", fontFamily:"Syne" },
  overlay:     { position:"fixed", inset:0, background:"rgba(26,23,20,0.35)", zIndex:500, display:"flex", alignItems:"center", justifyContent:"center", padding:20 },
  modal:       { background:"#fff", border:"1px solid #e4dcd0", borderRadius:18, width:"100%", maxWidth:540, maxHeight:"90vh", overflowY:"auto", padding:"28px", boxShadow:"0 16px 64px rgba(0,0,0,0.1)" },
  drawer:      { background:"#fff", borderLeft:"1px solid #e4dcd0", width:420, height:"100vh", overflowY:"auto", padding:"32px 28px", boxShadow:"-8px 0 40px rgba(0,0,0,0.07)" },
  modalTitle:  { fontSize:20, fontWeight:800, color:"#1a1714", letterSpacing:"-0.02em" },
  closeBtn:    { background:"#faf7f2", border:"none", borderRadius:"50%", width:30, height:30, color:"#a89880", cursor:"pointer", fontSize:13, display:"flex", alignItems:"center", justifyContent:"center" },
  inp:         { width:"100%", background:"#faf7f2", border:"1.5px solid #e4dcd0", borderRadius:8, padding:"10px 12px", color:"#1a1714", fontSize:13, fontFamily:"Syne", transition:"border-color 0.2s" },
  drawerBtn:   { width:"100%", background:"#faf7f2", border:"1px solid #e4dcd0", borderRadius:10, padding:"13px 16px", color:"#8a7d6b", fontSize:13, fontWeight:600, cursor:"pointer", fontFamily:"Syne", textAlign:"left" },
  toast:       { position:"fixed", bottom:28, left:"50%", transform:"translateX(-50%)", padding:"11px 22px", borderRadius:28, fontSize:12, fontFamily:"DM Mono", fontWeight:500, zIndex:999 },
  pageTitle:   { fontSize:28, fontWeight:800, color:"#1a1714", letterSpacing:"-0.02em" },
  pageSub:     { fontSize:12, fontFamily:"DM Mono", color:"#a89880", marginTop:6 },
};