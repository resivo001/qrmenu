import { useState, useEffect, useMemo } from "react";
import { supabase } from "../supabase";

const DEFAULT_RESTAURANT_ID = "ac4e5a27-a9dd-46cf-b6c9-45469c1aaa7b";

const GS = () => (
  <style>{`
    @import url('https://fonts.googleapis.com/css2?family=Cormorant+Garamond:ital,wght@0,400;0,500;0,600;0,700;1,400;1,600&family=DM+Sans:wght@300;400;500;600&family=DM+Mono:wght@400;500&display=swap');
    *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
    html, body, #root { height: 100%; }
    body { background: #faf8f4; font-family: 'DM Sans', sans-serif; -webkit-font-smoothing: antialiased; }
    ::-webkit-scrollbar { display: none; }
    @keyframes fadeUp   { from { opacity:0; transform:translateY(16px); } to { opacity:1; transform:translateY(0); } }
    @keyframes fadeIn   { from { opacity:0; } to { opacity:1; } }
    @keyframes slideUp  { from { opacity:0; transform:translateY(100%); } to { opacity:1; transform:translateY(0); } }
    @keyframes spin    { to { transform: rotate(360deg); } }
    .fade-up  { animation: fadeUp  0.4s cubic-bezier(0.16,1,0.3,1) both; }
    .fade-in  { animation: fadeIn  0.25s ease both; }
    .slide-up { animation: slideUp 0.4s cubic-bezier(0.16,1,0.3,1) both; }
    .item-card { transition: transform 0.15s ease; }
    .item-card:active { transform: scale(0.98); }
    .cat-btn { transition: all 0.2s ease; }
    .add-btn:active { transform: scale(0.92); }
    .menu-spinner {
      width: 36px;
      height: 36px;
      border-radius: 50%;
      border: 3px solid #e4dcd0;
      border-top-color: #1a140e;
      animation: spin 0.7s linear infinite;
    }
  `}</style>
);

const fmt = (n) => `₼${Number(n).toFixed(2)}`;

const UI = {
  EN: {
    scanPrompt: "Scan to view our menu · Ask your waiter to order",
    viewOrder: "View Order",
    yourOrder: "Your Order",
    placeOrderBtn: "Place Order →",
    sendWaiterBtn: "Send Order to Waiter →",
    paymentSubtitle: "Payment at the table",
    waiterSubtitle: "A waiter will come to your table",
    orderPlacedTitle: "Order Placed!",
    orderSentTitle: "Sent to the team!",
    successBody: "Your order has been sent to the kitchen. A waiter will confirm shortly.",
    total: "Total",
    addToOrder: "Add to Order",
    askWaiterOrder: "Ask your waiter to order",
    sending: "Sending…",
    tableLabel: "Table",
    loading: "Loading…",
    loadFailTitle: "Couldn't load menu",
    restaurantNotFound: "Restaurant not found",
    orderErrorGeneric: "Something went wrong",
  },
  AZ: {
    scanPrompt: "Menüyə baxmaq üçün skan edin · Ofisiant sifariş alacaq",
    viewOrder: "Sifarişə bax",
    yourOrder: "Sifarişiniz",
    placeOrderBtn: "Sifariş ver →",
    sendWaiterBtn: "Ofisiantə göndər →",
    paymentSubtitle: "Masada ödəniş",
    waiterSubtitle: "Ofisiant gələcək",
    orderPlacedTitle: "Sifariş qəbul edildi!",
    orderSentTitle: "Komandaya göndərildi!",
    successBody: "Sifarişiniz mətbəxə göndərildi. Ofisiant təsdiqləyəcək.",
    total: "Cəmi",
    addToOrder: "Əlavə et",
    askWaiterOrder: "Sifariş üçün ofisianta müraciət edin",
    sending: "Göndərilir…",
    tableLabel: "Masa",
    loading: "Yüklənir…",
    loadFailTitle: "Menü yüklənmədi",
    restaurantNotFound: "Restoran tapılmadı",
    orderErrorGeneric: "Xəta baş verdi",
  },
  RU: {
    scanPrompt: "Сканируйте меню · Официант примет заказ",
    viewOrder: "Посмотреть заказ",
    yourOrder: "Ваш заказ",
    placeOrderBtn: "Оформить заказ →",
    sendWaiterBtn: "Отправить официанту →",
    paymentSubtitle: "Оплата за столом",
    waiterSubtitle: "Официант подойдет",
    orderPlacedTitle: "Заказ принят!",
    orderSentTitle: "Отправлено!",
    successBody: "Заказ отправлен на кухню. Официант подтвердит.",
    total: "Итого",
    addToOrder: "Добавить",
    askWaiterOrder: "Попросите официанта принять заказ",
    sending: "Отправка…",
    tableLabel: "Стол",
    loading: "Загрузка…",
    loadFailTitle: "Не удалось загрузить меню",
    restaurantNotFound: "Ресторан не найден",
    orderErrorGeneric: "Что-то пошло не так",
  },
};

function stringsFor(lang) {
  return UI[lang] || UI.EN;
}

function normalizeFeatures(row) {
  const f = row?.features;
  if (f && typeof f === "object" && !Array.isArray(f)) {
    const ordering = f.ordering === true;
    return { ordering, payment: ordering && !!f.payment };
  }
  return { ordering: false, payment: false };
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
    desc: row.description ?? row.desc ?? "",
    price: Number(row.price ?? 0),
    img: row.image_url ?? row.img ?? "",
    badge: row.badge ?? null,
  };
}

function readUrlContext() {
  const params = new URLSearchParams(window.location.search);
  const restaurantId = params.get("restaurant") || DEFAULT_RESTAURANT_ID;
  const tableRaw = params.get("table");
  let tableNum = 1;
  if (tableRaw != null && tableRaw !== "") {
    const n = Number(tableRaw);
    if (!Number.isNaN(n) && n > 0) tableNum = n;
  }
  return { restaurantId, tableNum };
}

function ItemSheet({ item, onClose, onAdd, orderingEnabled, t }) {
  const [qty, setQty] = useState(1);
  return (
    <div style={{ position:"fixed", inset:0, zIndex:200, display:"flex", flexDirection:"column", justifyContent:"flex-end" }}>
      <div style={{ position:"absolute", inset:0, background:"rgba(26,20,14,0.5)" }} onClick={onClose} className="fade-in" />
      <div className="slide-up" style={{ position:"relative", background:"#fff", borderRadius:"24px 24px 0 0", maxHeight:"88vh", overflowY:"auto", paddingBottom:32 }}>
        <div style={{ width:"100%", height:260, overflow:"hidden", position:"relative", background:"#f5f0e8" }}>
          {item.img ? (
            <div style={{ position:"absolute", inset:0 }}>
              <img src={item.img} alt={item.name} style={{ width:"100%", height:"100%", objectFit:"cover" }} onError={(e) => { e.target.parentElement.style.display = "none"; }} />
            </div>
          ) : (
            <div style={{ width:"100%", height:"100%", background:"#f5f0e8" }} />
          )}
          <div style={{ position:"absolute", inset:0, background:"linear-gradient(to top, rgba(0,0,0,0.3) 0%, transparent 60%)" }} />
          {item.badge && (
            <div style={{ position:"absolute", top:16, left:16, background:"rgba(255,255,255,0.95)", borderRadius:20, padding:"4px 12px", fontSize:11, fontWeight:600, color:"#1a140e" }}>
              {item.badge}
            </div>
          )}
          <button type="button" onClick={onClose} style={{ position:"absolute", top:16, right:16, width:32, height:32, borderRadius:"50%", background:"rgba(255,255,255,0.9)", border:"none", cursor:"pointer", fontSize:16, display:"flex", alignItems:"center", justifyContent:"center", color:"#1a140e" }}>✕</button>
        </div>
        <div style={{ padding:"24px 20px 0" }}>
          <div style={{ fontFamily:"Cormorant Garamond", fontSize:28, fontWeight:700, color:"#1a140e", lineHeight:1.2, marginBottom:8 }}>{item.name}</div>
          <div style={{ fontSize:14, color:"#8a7d6b", lineHeight:1.6, marginBottom:20 }}>{item.desc}</div>
          <div style={{ display:"flex", gap:8, marginBottom:24 }}>
            {["Gluten-free","Dairy"].map(a=>(
              <span key={a} style={{ fontSize:11, color:"#a89880", border:"1px solid #e4dcd0", borderRadius:20, padding:"3px 10px" }}>{a}</span>
            ))}
          </div>
          {orderingEnabled ? (
            <div style={{ display:"flex", alignItems:"center", gap:16 }}>
              <div style={{ display:"flex", alignItems:"center", background:"#f5f0e8", borderRadius:28, padding:"4px" }}>
                <button type="button" onClick={()=>setQty(q=>Math.max(1,q-1))} style={{ width:36, height:36, borderRadius:"50%", border:"none", background:qty===1?"transparent":"#fff", cursor:"pointer", fontSize:18, fontWeight:600, color:"#1a140e", display:"flex", alignItems:"center", justifyContent:"center", boxShadow:qty===1?"none":"0 1px 4px rgba(0,0,0,0.1)" }}>−</button>
                <span style={{ width:36, textAlign:"center", fontWeight:700, fontSize:16, color:"#1a140e" }}>{qty}</span>
                <button type="button" onClick={()=>setQty(q=>q+1)} style={{ width:36, height:36, borderRadius:"50%", border:"none", background:"#1a140e", cursor:"pointer", fontSize:18, color:"#fff", display:"flex", alignItems:"center", justifyContent:"center" }}>+</button>
              </div>
              <button type="button" onClick={()=>{ onAdd(item, qty); onClose(); }}
                style={{ flex:1, background:"#1a140e", color:"#faf8f4", border:"none", borderRadius:28, padding:"15px 24px", fontSize:14, fontWeight:600, cursor:"pointer", fontFamily:"DM Sans", display:"flex", justifyContent:"space-between", alignItems:"center" }}>
                <span>{t.addToOrder}</span>
                <span style={{ fontWeight:700 }}>{fmt(item.price * qty)}</span>
              </button>
            </div>
          ) : (
            <div style={{ paddingTop:4, fontSize:13, color:"#a89880", textAlign:"center", lineHeight:1.5 }}>
              {t.askWaiterOrder} · <span style={{ fontFamily:"Cormorant Garamond", fontSize:18, fontWeight:700, color:"#1a140e" }}>{fmt(item.price)}</span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function CartSheet({ cart, tableNumber, onClose, onQtyChange, paymentEnabled, onPlaceOrder, t }) {
  const total = cart.reduce((s,i)=>s+i.price*i.qty,0);
  const [placed, setPlaced] = useState(false);
  const [placing, setPlacing] = useState(false);
  const [orderError, setOrderError] = useState(null);

  const handlePlace = async () => {
    setOrderError(null);
    setPlacing(true);
    const result = await onPlaceOrder();
    setPlacing(false);
    if (result.ok) {
      setPlaced(true);
    } else {
      setOrderError(result.message || t.orderErrorGeneric);
    }
  };

  if (placed) return (
    <div style={{ position:"fixed", inset:0, zIndex:300, display:"flex", alignItems:"center", justifyContent:"center", background:"rgba(26,20,14,0.6)" }}>
      <div className="fade-up" style={{ background:"#fff", borderRadius:24, padding:"40px 32px", textAlign:"center", margin:24, maxWidth:320 }}>
        <div style={{ fontSize:52, marginBottom:16 }}>✅</div>
        <div style={{ fontFamily:"Cormorant Garamond", fontSize:28, fontWeight:700, color:"#1a140e", marginBottom:8 }}>{paymentEnabled ? t.orderPlacedTitle : t.orderSentTitle}</div>
        <div style={{ fontSize:14, color:"#8a7d6b", marginBottom:24, lineHeight:1.5 }}>
          {t.successBody}
        </div>
        <div style={{ fontSize:13, color:"#a89880", fontFamily:"DM Mono, monospace" }}>{t.tableLabel} {tableNumber}</div>
      </div>
    </div>
  );

  return (
    <div style={{ position:"fixed", inset:0, zIndex:200, display:"flex", flexDirection:"column", justifyContent:"flex-end" }}>
      <div style={{ position:"absolute", inset:0, background:"rgba(26,20,14,0.5)" }} onClick={onClose} className="fade-in" />
      <div className="slide-up" style={{ position:"relative", background:"#fff", borderRadius:"24px 24px 0 0", maxHeight:"85vh", display:"flex", flexDirection:"column" }}>
        <div style={{ padding:"20px 20px 0", display:"flex", justifyContent:"space-between", alignItems:"center" }}>
          <div style={{ fontFamily:"Cormorant Garamond", fontSize:26, fontWeight:700, color:"#1a140e" }}>{t.yourOrder}</div>
          <button type="button" onClick={onClose} style={{ background:"#f5f0e8", border:"none", borderRadius:"50%", width:32, height:32, cursor:"pointer", fontSize:16, display:"flex", alignItems:"center", justifyContent:"center", color:"#8a7d6b" }}>✕</button>
        </div>
        <div style={{ fontSize:12, color:"#a89880", padding:"4px 20px 16px", fontFamily:"DM Mono, monospace" }}>{t.tableLabel} {tableNumber}</div>
        <div style={{ overflowY:"auto", flex:1, padding:"0 20px" }}>
          {cart.map(item=>(
            <div key={item.id} style={{ display:"flex", alignItems:"center", gap:12, paddingBottom:16, marginBottom:16, borderBottom:"1px solid #f5f0e8" }}>
              {item.img ? (
                <div style={{ width:52, height:52, borderRadius:10, overflow:"hidden", flexShrink:0, background:"#f5f0e8" }}>
                  <img src={item.img} alt="" style={{ width:52, height:52, objectFit:"cover", display:"block" }} onError={(e) => { e.target.parentElement.style.display = "none"; }} />
                </div>
              ) : (
                <div style={{ width:52, height:52, borderRadius:10, background:"#f5f0e8", flexShrink:0 }} />
              )}
              <div style={{ flex:1 }}>
                <div style={{ fontSize:14, fontWeight:600, color:"#1a140e", marginBottom:4 }}>{item.name}</div>
                <div style={{ fontSize:14, fontWeight:700, color:"#1a140e" }}>{fmt(item.price)}</div>
              </div>
              <div style={{ display:"flex", alignItems:"center", background:"#f5f0e8", borderRadius:24, padding:"3px" }}>
                <button type="button" onClick={()=>onQtyChange(item.id, item.qty-1)} style={{ width:28, height:28, borderRadius:"50%", border:"none", background:item.qty===1?"transparent":"#fff", cursor:"pointer", fontSize:15, color:"#1a140e", display:"flex", alignItems:"center", justifyContent:"center" }}>
                  {item.qty===1?"🗑":"−"}
                </button>
                <span style={{ width:28, textAlign:"center", fontSize:14, fontWeight:700, color:"#1a140e" }}>{item.qty}</span>
                <button type="button" onClick={()=>onQtyChange(item.id, item.qty+1)} style={{ width:28, height:28, borderRadius:"50%", border:"none", background:"#1a140e", cursor:"pointer", fontSize:15, color:"#fff", display:"flex", alignItems:"center", justifyContent:"center" }}>+</button>
              </div>
            </div>
          ))}
        </div>
        <div style={{ padding:"16px 20px 32px", borderTop:"1px solid #f5f0e8" }}>
          <div style={{ display:"flex", justifyContent:"space-between", marginBottom:16 }}>
            <span style={{ fontSize:14, color:"#8a7d6b" }}>{t.total}</span>
            <span style={{ fontFamily:"Cormorant Garamond", fontSize:24, fontWeight:700, color:"#1a140e" }}>{fmt(total)}</span>
          </div>
          {orderError && (
            <div style={{ fontSize:12, color:"#c62828", marginBottom:12, textAlign:"center", lineHeight:1.4 }}>{orderError}</div>
          )}
          <button type="button" disabled={placing} onClick={handlePlace} style={{ width:"100%", background:"#1a140e", color:"#faf8f4", border:"none", borderRadius:28, padding:"16px", fontSize:15, fontWeight:600, cursor:placing?"wait":"pointer", fontFamily:"DM Sans", opacity:placing?0.85:1 }}>
            {placing ? t.sending : (paymentEnabled ? t.placeOrderBtn : t.sendWaiterBtn)}
          </button>
          <div style={{ textAlign:"center", fontSize:12, color:"#c4b8a8", marginTop:10 }}>
            {paymentEnabled ? t.paymentSubtitle : t.waiterSubtitle}
          </div>
        </div>
      </div>
    </div>
  );
}

const LANG_CODES = ["AZ", "RU", "EN"];

export default function CustomerMenu() {
  const { restaurantId, tableNum } = useMemo(() => readUrlContext(), []);

  const [lang, setLang] = useState("EN");
  const t = useMemo(() => stringsFor(lang), [lang]);

  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState(null);
  const [restaurant, setRestaurant] = useState(null);
  const [features, setFeatures] = useState({ ordering: false, payment: false });
  const [cats, setCats] = useState([]);
  const [items, setItems] = useState([]);
  const [activeCat, setActiveCat] = useState("");
  const [selectedItem, setSelectedItem] = useState(null);
  const [cart, setCart] = useState([]);
  const [showCart, setShowCart] = useState(false);
  const [addedId, setAddedId] = useState(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      setLoading(true);
      setLoadError(null);
      const [rRes, cRes, iRes] = await Promise.all([
        supabase.from("restaurants").select("*").eq("id", restaurantId).maybeSingle(),
        supabase.from("categories").select("*").eq("restaurant_id", restaurantId).order("sort_order", { ascending: true }),
        supabase.from("menu_items").select("*").eq("restaurant_id", restaurantId).eq("available", true),
      ]);
      if (cancelled) return;
      if (rRes.error) {
        setLoadError(rRes.error.message);
        setLoading(false);
        return;
      }
      if (!rRes.data) {
        setLoadError("Restaurant not found");
        setLoading(false);
        return;
      }
      if (cRes.error) {
        setLoadError(cRes.error.message);
        setLoading(false);
        return;
      }
      if (iRes.error) {
        setLoadError(iRes.error.message);
        setLoading(false);
        return;
      }
      setRestaurant(rRes.data);
      setFeatures(normalizeFeatures(rRes.data));
      const mappedCats = (cRes.data || []).map(mapCategoryFromDb);
      setCats(mappedCats);
      setItems((iRes.data || []).map(mapItemFromDb));
      if (mappedCats.length) setActiveCat(mappedCats[0].id);
      setLoading(false);
    })();
    return () => { cancelled = true; };
  }, [restaurantId]);

  const addToCart = (item, qty=1) => {
    setCart(prev => {
      const ex = prev.find(i=>i.id===item.id);
      if (ex) return prev.map(i=>i.id===item.id?{...i,qty:i.qty+qty}:i);
      return [...prev, {...item, qty}];
    });
    setAddedId(item.id);
    setTimeout(()=>setAddedId(null), 1000);
  };

  const changeQty = (id, qty) => {
    if (qty <= 0) setCart(p=>p.filter(i=>i.id!==id));
    else setCart(p=>p.map(i=>i.id===id?{...i,qty}:i));
  };

  const cartCount = cart.reduce((s,i)=>s+i.qty,0);
  const cartTotal = cart.reduce((s,i)=>s+i.price*i.qty,0);

  const placeOrder = async () => {
    const { error } = await supabase.from("orders").insert({
      restaurant_id: restaurantId,
      table_number: tableNum,
      status: "new",
      items: cart.map((i) => ({ name: i.name, qty: i.qty })),
      total: cartTotal,
    });
    if (error) return { ok: false, message: error.message };
    setCart([]);
    return { ok: true };
  };

  const orderingOn = features.ordering === true;
  const paymentOn = features.payment === true;
  const bottomPad = orderingOn ? 120 : 72;
  const filtered = items.filter((i) => i.cat === activeCat);
  const tagline = restaurant?.location || restaurant?.tagline || "";

  if (loading) {
    return (
      <div style={{ maxWidth:480, margin:"0 auto", minHeight:"100vh", background:"#faf8f4", display:"flex", flexDirection:"column", alignItems:"center", justifyContent:"center", position:"relative" }}>
        <GS />
        <div className="menu-spinner" aria-hidden />
        <div style={{ marginTop:16, fontSize:13, color:"#a89880", fontFamily:"DM Sans" }}>{t.loading}</div>
      </div>
    );
  }

  if (loadError || !restaurant) {
    return (
      <div style={{ maxWidth:480, margin:"0 auto", minHeight:"100vh", background:"#faf8f4", display:"flex", flexDirection:"column", alignItems:"center", justifyContent:"center", padding:24, textAlign:"center", position:"relative" }}>
        <GS />
        <div style={{ fontFamily:"Cormorant Garamond", fontSize:22, fontWeight:700, color:"#1a140e", marginBottom:8 }}>{t.loadFailTitle}</div>
        <div style={{ fontSize:14, color:"#8a7d6b", lineHeight:1.5 }}>{loadError || t.restaurantNotFound}</div>
      </div>
    );
  }

  return (
    <div style={{ maxWidth:480, margin:"0 auto", minHeight:"100vh", background:"#faf8f4", display:"flex", flexDirection:"column", position:"relative" }}>
      <GS />

      <header style={{ background:"#fff", padding:"20px 20px 0", position:"sticky", top:0, zIndex:50, boxShadow:"0 1px 0 #f0ebe4" }}>
        <div style={{ display:"flex", justifyContent:"space-between", alignItems:"flex-start", marginBottom:16 }}>
          <div>
            <div style={{ fontFamily:"Cormorant Garamond", fontSize:26, fontWeight:700, color:"#1a140e", lineHeight:1.1 }}>{restaurant.name}</div>
            {tagline ? <div style={{ fontSize:12, color:"#a89880", marginTop:3 }}>{tagline}</div> : null}
            {orderingOn ? (
              <div style={{ fontSize:11, color:"#a89880", marginTop:4, fontFamily:"DM Mono, monospace", letterSpacing:"0.02em" }}>
                {t.tableLabel} {tableNum}
              </div>
            ) : null}
          </div>
          <div
            role="group"
            aria-label="Language"
            style={{ display:"flex", marginTop:4, borderRadius:20, border:"1px solid #e4dcd0", overflow:"hidden", flexShrink:0 }}
          >
            {LANG_CODES.map((code, i) => (
              <button
                key={code}
                type="button"
                onClick={() => setLang(code)}
                style={{
                  padding:"6px 12px",
                  fontSize:11,
                  fontWeight:600,
                  fontFamily:"DM Mono, monospace",
                  border:"none",
                  borderLeft: i ? "1px solid #e4dcd0" : "none",
                  cursor:"pointer",
                  background: lang === code ? "#1a140e" : "transparent",
                  color: lang === code ? "#faf8f4" : "#8a7d6b",
                  lineHeight:1.2,
                }}
              >
                {code}
              </button>
            ))}
          </div>
        </div>
        <div style={{ display:"flex", gap:6, overflowX:"auto", paddingBottom:16, scrollbarWidth:"none" }}>
          {cats.map(cat=>(
            <button type="button" key={cat.id} className="cat-btn" onClick={()=>setActiveCat(cat.id)}
              style={{ display:"flex", alignItems:"center", gap:6, padding:"8px 16px", borderRadius:24, border:"none", cursor:"pointer", fontFamily:"DM Sans", fontSize:13, fontWeight:500, flexShrink:0,
                background: activeCat===cat.id?"#1a140e":"#f5f0e8",
                color:      activeCat===cat.id?"#faf8f4":"#8a7d6b",
              }}>
              <span style={{ fontSize:15 }}>{cat.icon}</span>
              <span>{cat.name}</span>
            </button>
          ))}
        </div>
      </header>

      <div style={{ flex:1, padding:`16px 16px ${bottomPad}px` }}>
        <div style={{ display:"flex", flexDirection:"column", gap:12 }}>
          {filtered.map((item, i) => (
            <div key={item.id} className="item-card fade-up" style={{ animationDelay:`${i*0.05}s`, background:"#fff", borderRadius:18, overflow:"hidden", boxShadow:"0 1px 8px rgba(26,20,14,0.06)", cursor:"pointer" }}
              onClick={()=>setSelectedItem(item)}>
              <div style={{ display:"flex" }}>
                <div style={{ flex:1, padding:"16px 14px 16px 16px", display:"flex", flexDirection:"column", justifyContent:"space-between" }}>
                  <div>
                    {item.badge && (
                      <div style={{ display:"inline-block", fontSize:10, fontWeight:600, color:"#8a7d6b", background:"#f5f0e8", borderRadius:20, padding:"2px 8px", marginBottom:6 }}>
                        {item.badge}
                      </div>
                    )}
                    <div style={{ fontFamily:"Cormorant Garamond", fontSize:18, fontWeight:600, color:"#1a140e", lineHeight:1.25, marginBottom:6 }}>{item.name}</div>
                    <div style={{ fontSize:12, color:"#a89880", lineHeight:1.5, display:"-webkit-box", WebkitLineClamp:2, WebkitBoxOrient:"vertical", overflow:"hidden" }}>{item.desc}</div>
                  </div>
                  <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", marginTop:12 }}>
                    <span style={{ fontFamily:"Cormorant Garamond", fontSize:20, fontWeight:700, color:"#1a140e" }}>{fmt(item.price)}</span>
                    {orderingOn ? (
                    <button type="button" className="add-btn"
                      onClick={e=>{ e.stopPropagation(); addToCart(item); }}
                      style={{ width:34, height:34, borderRadius:"50%", border:"none", cursor:"pointer", fontSize:18, display:"flex", alignItems:"center", justifyContent:"center", transition:"all 0.15s",
                        background: addedId===item.id?"#4caf50":"#1a140e", color:"#fff" }}>
                      {addedId===item.id?"✓":"+"}
                    </button>
                    ) : <span style={{ width:34 }} aria-hidden />}
                  </div>
                </div>
                <div style={{ width:120, height:120, flexShrink:0, overflow:"hidden" }}>
                  {item.img ? (
                    <img src={item.img} alt={item.name} style={{ width:120, height:120, objectFit:"cover", display:"block" }} onError={(e) => { e.target.parentElement.style.display = "none"; }} />
                  ) : (
                    <div style={{ width:120, height:120, background:"#f5f0e8" }} />
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {orderingOn && cartCount > 0 && (
        <div style={{ position:"fixed", bottom:24, left:"50%", transform:"translateX(-50%)", width:"calc(100% - 32px)", maxWidth:448, zIndex:100 }}>
          <button type="button" onClick={()=>setShowCart(true)}
            style={{ width:"100%", background:"#1a140e", color:"#faf8f4", border:"none", borderRadius:28, padding:"16px 24px", display:"flex", alignItems:"center", justifyContent:"space-between", cursor:"pointer", fontFamily:"DM Sans", boxShadow:"0 8px 32px rgba(26,20,14,0.25)" }}>
            <div style={{ display:"flex", alignItems:"center", gap:10 }}>
              <div style={{ background:"#c9a96e", borderRadius:"50%", width:26, height:26, display:"flex", alignItems:"center", justifyContent:"center", fontSize:12, fontWeight:700, color:"#1a140e" }}>{cartCount}</div>
              <span style={{ fontSize:14, fontWeight:600 }}>{t.viewOrder}</span>
            </div>
            <span style={{ fontFamily:"Cormorant Garamond", fontSize:20, fontWeight:700, color:"#c9a96e" }}>{fmt(cartTotal)}</span>
          </button>
        </div>
      )}

      {!orderingOn && (
        <div style={{ position:"fixed", bottom:0, left:0, right:0, zIndex:90, display:"flex", justifyContent:"center", pointerEvents:"none" }}>
          <div style={{ maxWidth:480, width:"100%", padding:"12px 20px 20px", background:"linear-gradient(to top, rgba(250,248,244,0.98) 60%, transparent)" }}>
            <div style={{ textAlign:"center", fontSize:12, fontWeight:500, color:"#a89880", letterSpacing:"0.02em", lineHeight:1.5 }}>
              {t.scanPrompt}
            </div>
          </div>
        </div>
      )}

      {selectedItem && (
        <ItemSheet
          key={selectedItem.id}
          item={selectedItem}
          orderingEnabled={orderingOn}
          onClose={()=>setSelectedItem(null)}
          onAdd={addToCart}
          t={t}
        />
      )}
      {orderingOn && showCart && (
        <CartSheet
          cart={cart}
          tableNumber={tableNum}
          onClose={()=>setShowCart(false)}
          onQtyChange={changeQty}
          paymentEnabled={paymentOn}
          onPlaceOrder={placeOrder}
          t={t}
        />
      )}
    </div>
  );
}
