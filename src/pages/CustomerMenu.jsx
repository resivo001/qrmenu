import { useState, useEffect, useMemo, useRef } from "react";
import { supabase } from "../supabase";

const DEFAULT_RESTAURANT_ID = "ac4e5a27-a9dd-46cf-b6c9-45469c1aaa7b";

const GS = () => (
  <style>{`
    @import url('https://fonts.googleapis.com/css2?family=Cormorant+Garamond:ital,wght@0,400;0,500;0,600;0,700;1,400;1,600&family=DM+Sans:wght@300;400;500;600&family=DM+Mono:wght@400;500&display=swap');
    *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
    html {
      background: #f5ede6;
      min-height: 100%;
    }
    body {
      background: #f5ede6;
      min-height: 100%;
      font-family: 'DM Sans', sans-serif;
      -webkit-font-smoothing: antialiased;
    }
    #root {
      background: #f5ede6;
      min-height: 100vh;
    }
    ::-webkit-scrollbar { display: none; }
    @keyframes fadeUp   { from { opacity:0; transform:translateY(16px); } to { opacity:1; transform:translateY(0); } }
    @keyframes fadeIn   { from { opacity:0; } to { opacity:1; } }
    @keyframes slideUp  { from { opacity:0; transform:translateY(100%); } to { opacity:1; transform:translateY(0); } }
    @keyframes spin    { to { transform: rotate(360deg); } }
    @keyframes pulse   { 0%,100% { opacity:1; } 50% { opacity:0.5; } }
    .fade-up  { animation: fadeUp  0.4s cubic-bezier(0.16,1,0.3,1) both; }
    .fade-in  { animation: fadeIn  0.25s ease both; }
    .slide-up { animation: slideUp 0.4s cubic-bezier(0.16,1,0.3,1) both; }
    .item-card { transition: transform 0.15s ease; }
    .item-card:active { transform: scale(0.98); }
    .cat-btn { transition: all 0.2s ease; }
    .add-btn:active { transform: scale(0.92); }
    .menu-spinner {
      width: 36px; height: 36px; border-radius: 50%;
      border: 3px solid #e8d5c8; border-top-color: #8b3a2a;
      animation: spin 0.7s linear infinite;
    }
  `}</style>
);

const fmt = (n) => `₼${Number(n).toFixed(2)}`;

// ─────────────────────────────────────────────────────
// 💳 PAYMENT PROVIDER INTERFACE
// This is the "ready motor" — to activate a payment provider:
// 1. Set `PAYMENT_ENABLED = true` in the active provider
// 2. Implement `initiatePayment(params)` to open the payment gateway
// 3. Wire the result back to `onPaymentResult` in CartSheet
//
// Currently: all providers return { enabled: false } — waiter flow only.
// When payment features.payment flag is true AND a provider is enabled,
// the CartSheet will show the payment UI instead of the waiter button.
// ─────────────────────────────────────────────────────
const PAYMENT_PROVIDERS = {
  // Stripe (international)
  stripe: {
    enabled: false,
    name: "Stripe",
    async initiate({ totalAzn, orderId, tableNum }) {
      // TODO: call your backend to create a Stripe PaymentIntent
      // const res = await fetch("/api/stripe/create-payment-intent", { ... })
      // Then open Stripe Elements or redirect to Stripe Checkout
      console.log("[PaymentProvider:stripe] initiate", { totalAzn, orderId, tableNum });
      return { ok: false, message: "Stripe not configured" };
    },
  },
  // Kapital Bank (Azerbaijan)
  kapital: {
    enabled: false,
    name: "Kapital Bank",
    async initiate({ totalAzn, orderId, tableNum }) {
      // TODO: call your backend to get a Kapital payment URL
      // const res = await fetch("/api/kapital/create", { ... })
      console.log("[PaymentProvider:kapital] initiate", { totalAzn, orderId, tableNum });
      return { ok: false, message: "Kapital not configured" };
    },
  },
  // ABB Pay / local AZ provider
  abb: {
    enabled: false,
    name: "ABB Pay",
    async initiate({ totalAzn, orderId, tableNum }) {
      console.log("[PaymentProvider:abb] initiate", { totalAzn, orderId, tableNum });
      return { ok: false, message: "ABB Pay not configured" };
    },
  },
};

// Get the first enabled payment provider, or null
function getActivePaymentProvider() {
  return Object.values(PAYMENT_PROVIDERS).find((p) => p.enabled) ?? null;
}

// ─────────────────────────────────────────────────────

const UI = {
  EN: {
    scanPrompt: "Scan to view our menu · Ask your waiter to order",
    viewOrder: "View Order",
    yourOrder: "Your Order",
    placeOrderBtn: "Place Order →",
    sendWaiterBtn: "Send Order to Waiter →",
    payNowBtn: "Pay Now →",
    paymentSubtitle: "Payment at the table",
    waiterSubtitle: "A waiter will come to your table",
    payingSubtitle: "Processing payment…",
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
    paymentError: "Payment failed. Please try again or pay at the table.",
  },
  AZ: {
    scanPrompt: "Menüyə baxmaq üçün skan edin · Ofisiant sifariş alacaq",
    viewOrder: "Sifarişə bax",
    yourOrder: "Sifarişiniz",
    placeOrderBtn: "Sifariş ver →",
    sendWaiterBtn: "Ofisiantə göndər →",
    payNowBtn: "Ödə →",
    paymentSubtitle: "Masada ödəniş",
    waiterSubtitle: "Ofisiant gələcək",
    payingSubtitle: "Ödəniş emal edilir…",
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
    paymentError: "Ödəniş alınmadı. Yenidən cəhd edin.",
  },
  RU: {
    scanPrompt: "Сканируйте меню · Официант примет заказ",
    viewOrder: "Посмотреть заказ",
    yourOrder: "Ваш заказ",
    placeOrderBtn: "Оформить заказ →",
    sendWaiterBtn: "Отправить официанту →",
    payNowBtn: "Оплатить →",
    paymentSubtitle: "Оплата за столом",
    waiterSubtitle: "Официант подойдет",
    payingSubtitle: "Обработка оплаты…",
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
    paymentError: "Ошибка оплаты. Попробуйте ещё раз.",
  },
};

function stringsFor(lang) { return UI[lang] || UI.EN; }
const LANG_FLAG = { AZ: "🇦🇿", RU: "🇷🇺", EN: "🇬🇧" };
const LANG_OPTIONS = [
  { code: "AZ", flag: "🇦🇿", label: "Azərbaycanca" },
  { code: "RU", flag: "🇷🇺", label: "Русский" },
  { code: "EN", flag: "🇬🇧", label: "English" },
];

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
      <div style={{ position:"absolute", inset:0, background:"rgba(61,28,18,0.55)" }} onClick={onClose} className="fade-in" />
      <div className="slide-up" style={{ position:"relative", background:"#fff", borderRadius:"24px 24px 0 0", maxHeight:"88vh", overflowY:"auto", paddingBottom:32 }}>
        <div style={{ width:"100%", height:260, overflow:"hidden", position:"relative", background:"#f7efe8" }}>
          {item.img ? (
            <div style={{ position:"absolute", inset:0 }}>
              <img src={item.img} alt={item.name} style={{ width:"100%", height:"100%", objectFit:"cover" }} onError={(e) => { e.target.parentElement.style.display = "none"; }} />
            </div>
          ) : (
            <div style={{ width:"100%", height:"100%", background:"#f7efe8" }} />
          )}
          <div style={{ position:"absolute", inset:0, background:"linear-gradient(to top, rgba(0,0,0,0.3) 0%, transparent 60%)" }} />
          {item.badge && (
            <div style={{ position:"absolute", top:16, left:16, background:"rgba(255,255,255,0.95)", borderRadius:20, padding:"4px 12px", fontSize:11, fontWeight:600, color:"#3d1c12" }}>
              {item.badge}
            </div>
          )}
          <button type="button" onClick={onClose} style={{ position:"absolute", top:16, right:16, width:32, height:32, borderRadius:"50%", background:"rgba(255,255,255,0.9)", border:"none", cursor:"pointer", fontSize:16, display:"flex", alignItems:"center", justifyContent:"center", color:"#3d1c12" }}>✕</button>
        </div>
        <div style={{ padding:"24px 20px 0" }}>
          <div style={{ fontFamily:"Cormorant Garamond", fontSize:28, fontWeight:700, color:"#3d1c12", lineHeight:1.2, marginBottom:8 }}>{item.name}</div>
          <div style={{ fontSize:14, color:"#7a4f3a", lineHeight:1.6, marginBottom:20 }}>{item.desc}</div>
          {orderingEnabled ? (
            <div style={{ display:"flex", alignItems:"center", gap:16 }}>
              <div style={{ display:"flex", alignItems:"center", background:"#f7efe8", borderRadius:28, padding:"4px" }}>
                <button type="button" onClick={()=>setQty(q=>Math.max(1,q-1))} style={{ width:36, height:36, borderRadius:"50%", border:"none", background:qty===1?"transparent":"#fff", cursor:"pointer", fontSize:18, fontWeight:600, color:"#3d1c12", display:"flex", alignItems:"center", justifyContent:"center", boxShadow:qty===1?"none":"0 1px 4px rgba(0,0,0,0.1)" }}>−</button>
                <span style={{ width:36, textAlign:"center", fontWeight:700, fontSize:16, color:"#3d1c12" }}>{qty}</span>
                <button type="button" onClick={()=>setQty(q=>q+1)} style={{ width:36, height:36, borderRadius:"50%", border:"none", background:"#8b3a2a", cursor:"pointer", fontSize:18, color:"#fff", display:"flex", alignItems:"center", justifyContent:"center" }}>+</button>
              </div>
              <button type="button" onClick={()=>{ onAdd(item, qty); onClose(); }}
                style={{ flex:1, background:"#8b3a2a", color:"#fff", border:"none", borderRadius:28, padding:"15px 24px", fontSize:14, fontWeight:600, cursor:"pointer", fontFamily:"DM Sans", display:"flex", justifyContent:"space-between", alignItems:"center" }}>
                <span>{t.addToOrder}</span>
                <span style={{ fontWeight:700, color:"#d4956a" }}>{fmt(item.price * qty)}</span>
              </button>
            </div>
          ) : (
            <div style={{ paddingTop:4, fontSize:13, color:"#b8907a", textAlign:"center", lineHeight:1.5 }}>
              {t.askWaiterOrder} · <span style={{ fontFamily:"Cormorant Garamond", fontSize:18, fontWeight:700, color:"#3d1c12" }}>{fmt(item.price)}</span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────
// CartSheet — payment-ready with waiter fallback
// ─────────────────────────────────────────────────────
function CartSheet({ cart, tableNumber, restaurantId, onClose, onQtyChange, paymentEnabled, onPlaceOrder, t }) {
  const total = cart.reduce((s,i)=>s+i.price*i.qty,0);
  const [placed, setPlaced] = useState(false);
  const [placing, setPlacing] = useState(false);
  const [paying, setPaying] = useState(false);
  const [orderError, setOrderError] = useState(null);

  const activeProvider = paymentEnabled ? getActivePaymentProvider() : null;
  const canPay = paymentEnabled && activeProvider !== null;

  // Step 1: always save the order to Supabase first
  const submitOrder = async () => {
    setOrderError(null);
    setPlacing(true);
    const result = await onPlaceOrder();
    setPlacing(false);
    return result;
  };

  // Waiter flow: submit order → show success
  const handleWaiterOrder = async () => {
    const result = await submitOrder();
    if (result.ok) setPlaced(true);
    else setOrderError(result.message || t.orderErrorGeneric);
  };

  // Payment flow: submit order → initiate payment → show success
  const handlePayment = async () => {
    const orderResult = await submitOrder();
    if (!orderResult.ok) {
      setOrderError(orderResult.message || t.orderErrorGeneric);
      return;
    }
    setPaying(true);
    try {
      const payResult = await activeProvider.initiate({
        totalAzn: total,
        orderId: orderResult.orderId,
        tableNum: tableNumber,
        restaurantId,
      });
      if (payResult.ok) {
        setPlaced(true);
      } else {
        // Payment failed — order already saved, show error with waiter fallback
        setOrderError(t.paymentError);
      }
    } catch (err) {
      setOrderError(err?.message || t.paymentError);
    } finally {
      setPaying(false);
    }
  };

  const busy = placing || paying;

  if (placed) return (
    <div style={{ position:"fixed", inset:0, zIndex:300, display:"flex", alignItems:"center", justifyContent:"center", background:"rgba(61,28,18,0.6)" }}>
      <div className="fade-up" style={{ background:"#fff", borderRadius:24, padding:"40px 32px", textAlign:"center", margin:24, maxWidth:320 }}>
        <div style={{ fontSize:52, marginBottom:16 }}>✅</div>
        <div style={{ fontFamily:"Cormorant Garamond", fontSize:28, fontWeight:700, color:"#3d1c12", marginBottom:8 }}>
          {canPay ? t.orderPlacedTitle : t.orderSentTitle}
        </div>
        <div style={{ fontSize:14, color:"#7a4f3a", marginBottom:24, lineHeight:1.5 }}>{t.successBody}</div>
        <div style={{ fontSize:13, color:"#b8907a", fontFamily:"DM Mono, monospace" }}>{t.tableLabel} {tableNumber}</div>
      </div>
    </div>
  );

  return (
    <div style={{ position:"fixed", inset:0, zIndex:200, display:"flex", flexDirection:"column", justifyContent:"flex-end" }}>
      <div style={{ position:"absolute", inset:0, background:"rgba(61,28,18,0.55)" }} onClick={onClose} className="fade-in" />
      <div className="slide-up" style={{ position:"relative", background:"#fff", borderRadius:"24px 24px 0 0", maxHeight:"85vh", display:"flex", flexDirection:"column" }}>
        <div style={{ padding:"20px 20px 0", display:"flex", justifyContent:"space-between", alignItems:"center" }}>
          <div style={{ fontFamily:"Cormorant Garamond", fontSize:26, fontWeight:700, color:"#3d1c12" }}>{t.yourOrder}</div>
          <button type="button" onClick={onClose} style={{ background:"#f7efe8", border:"none", borderRadius:"50%", width:32, height:32, cursor:"pointer", fontSize:16, display:"flex", alignItems:"center", justifyContent:"center", color:"#7a4f3a" }}>✕</button>
        </div>
        <div style={{ fontSize:12, color:"#b8907a", padding:"4px 20px 16px", fontFamily:"DM Mono, monospace" }}>{t.tableLabel} {tableNumber}</div>

        <div style={{ overflowY:"auto", flex:1, padding:"0 20px" }}>
          {cart.map(item=>(
            <div key={item.id} style={{ display:"flex", alignItems:"center", gap:12, paddingBottom:16, marginBottom:16, borderBottom:"1px solid #f7efe8" }}>
              {item.img ? (
                <div style={{ width:52, height:52, borderRadius:10, overflow:"hidden", flexShrink:0, background:"#f7efe8" }}>
                  <img src={item.img} alt="" style={{ width:52, height:52, objectFit:"cover", display:"block" }} onError={(e) => { e.target.parentElement.style.display = "none"; }} />
                </div>
              ) : (
                <div style={{ width:52, height:52, borderRadius:10, background:"#f7efe8", flexShrink:0 }} />
              )}
              <div style={{ flex:1 }}>
                <div style={{ fontSize:14, fontWeight:600, color:"#3d1c12", marginBottom:4 }}>{item.name}</div>
                <div style={{ fontSize:14, fontWeight:700, color:"#3d1c12" }}>{fmt(item.price)}</div>
              </div>
              <div style={{ display:"flex", alignItems:"center", background:"#f7efe8", borderRadius:24, padding:"3px" }}>
                <button type="button" onClick={()=>onQtyChange(item.id, item.qty-1)} style={{ width:28, height:28, borderRadius:"50%", border:"none", background:item.qty===1?"transparent":"#fff", cursor:"pointer", fontSize:15, color:"#3d1c12", display:"flex", alignItems:"center", justifyContent:"center" }}>
                  {item.qty===1?"🗑":"−"}
                </button>
                <span style={{ width:28, textAlign:"center", fontSize:14, fontWeight:700, color:"#3d1c12" }}>{item.qty}</span>
                <button type="button" onClick={()=>onQtyChange(item.id, item.qty+1)} style={{ width:28, height:28, borderRadius:"50%", border:"none", background:"#8b3a2a", cursor:"pointer", fontSize:15, color:"#fff", display:"flex", alignItems:"center", justifyContent:"center" }}>+</button>
              </div>
            </div>
          ))}
        </div>

        <div style={{ padding:"16px 20px 32px", borderTop:"1px solid #f7efe8" }}>
          <div style={{ display:"flex", justifyContent:"space-between", marginBottom:16 }}>
            <span style={{ fontSize:14, color:"#7a4f3a" }}>{t.total}</span>
            <span style={{ fontFamily:"Cormorant Garamond", fontSize:24, fontWeight:700, color:"#3d1c12" }}>{fmt(total)}</span>
          </div>

          {orderError && (
            <div style={{ fontSize:12, color:"#c62828", marginBottom:12, textAlign:"center", lineHeight:1.4, padding:"10px 14px", background:"#fdecea", borderRadius:10 }}>
              {orderError}
            </div>
          )}

          {/* ── Payment button (only shown when provider is active) ── */}
          {canPay && (
            <button
              type="button"
              disabled={busy}
              onClick={()=>void handlePayment()}
              style={{ width:"100%", background:"#8b3a2a", color:"#fff", border:"none", borderRadius:28, padding:"16px", fontSize:15, fontWeight:600, cursor:busy?"wait":"pointer", fontFamily:"DM Sans", opacity:busy?0.85:1, marginBottom:10 }}>
              {paying ? t.payingSubtitle : t.payNowBtn}
            </button>
          )}

          {/* ── Waiter / Place order button ── */}
          <button
            type="button"
            disabled={busy}
            onClick={()=>void handleWaiterOrder()}
            style={{
              width:"100%",
              background: canPay ? "transparent" : "#8b3a2a",
              color: canPay ? "#7a4f3a" : "#fff",
              border: canPay ? "1px solid #e8d5c8" : "none",
              borderRadius:28,
              padding:"16px",
              fontSize: canPay ? 13 : 15,
              fontWeight:600,
              cursor:busy?"wait":"pointer",
              fontFamily:"DM Sans",
              opacity:busy?0.85:1,
            }}>
            {placing ? t.sending : (canPay ? t.sendWaiterBtn : t.placeOrderBtn)}
          </button>

          <div style={{ textAlign:"center", fontSize:12, color:"#b8907a", marginTop:10 }}>
            {canPay ? t.paymentSubtitle : t.waiterSubtitle}
          </div>
        </div>
      </div>
    </div>
  );
}

function ItemRow({ item, orderingOn, addedId, onAdd, onOpen }) {
  return (
    <div onClick={() => onOpen(item)}
      style={{ display:"flex", alignItems:"flex-start", gap:16, padding:"18px 0", borderBottom:"1px solid #f0e6dc", cursor:"pointer" }}>
      <div style={{ flex:1, minWidth:0, display:"flex", flexDirection:"column", alignItems:"center", textAlign:"center", paddingRight:4 }}>
        {item.badge && (
          <div style={{ fontSize:10, fontWeight:700, color:"#8b3a2a", background:"#f7efe8", borderRadius:20, padding:"2px 8px", marginBottom:6 }}>{item.badge}</div>
        )}
        <div style={{ fontFamily:"Cormorant Garamond", fontSize:18, fontWeight:700, color:"#3d1c12", lineHeight:1.3, marginBottom:6 }}>
          {item.name}
        </div>
        {item.desc && (
          <div style={{ fontSize:12, color:"#b8907a", lineHeight:1.55, display:"-webkit-box", WebkitLineClamp:3, WebkitBoxOrient:"vertical", overflow:"hidden", marginBottom:8 }}>
            {item.desc}
          </div>
        )}
        <div style={{ display:"flex", alignItems:"center", gap:12, marginTop:"auto" }}>
          <span style={{ fontSize:17, fontWeight:700, color:"#d4956a", fontFamily:"Cormorant Garamond" }}>
            ₼{Number(item.price).toFixed(2)}
          </span>
          {orderingOn && (
            <button type="button" onClick={(e) => { e.stopPropagation(); onAdd(item); }}
              style={{ width:28, height:28, borderRadius:"50%", border:"none", cursor:"pointer", fontSize:15, display:"flex", alignItems:"center", justifyContent:"center", background: addedId === item.id ? "#4caf50" : "#8b3a2a", color:"#fff", transition:"background 0.15s" }}>
              {addedId === item.id ? "✓" : "+"}
            </button>
          )}
        </div>
      </div>
      <div style={{ width:110, height:110, borderRadius:14, overflow:"hidden", flexShrink:0, background:"#f7efe8" }}>
        {item.img
          ? <img src={item.img} alt={item.name} style={{ width:"100%", height:"100%", objectFit:"cover", display:"block" }} onError={(e) => { e.target.parentElement.style.background = "#f7efe8"; e.target.style.display = "none"; }} />
          : null}
      </div>
    </div>
  );
}

export default function CustomerMenu() {
  const { restaurantId, tableNum } = useMemo(() => readUrlContext(), []);

  const [lang, setLang] = useState("AZ");
  const t = useMemo(() => stringsFor(lang), [lang]);
  const [langMenuOpen, setLangMenuOpen] = useState(false);
  const langMenuWrapRef = useRef(null);

  useEffect(() => {
    if (!langMenuOpen) return;
    const close = (e) => {
      if (langMenuWrapRef.current && !langMenuWrapRef.current.contains(e.target)) setLangMenuOpen(false);
    };
    document.addEventListener("mousedown", close);
    return () => document.removeEventListener("mousedown", close);
  }, [langMenuOpen]);

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
  const [showInfo, setShowInfo] = useState(false);
  const [heroIndex, setHeroIndex] = useState(0);
  const heroTouchStartX = useRef(null);

  const heroItems = useMemo(() => items.filter((i) => i.img).slice(0, 5), [items]);
  const heroSlideIndex = heroItems.length === 0 ? 0 : heroIndex % heroItems.length;

  useEffect(() => {
    if (heroItems.length < 2) return undefined;
    const n = heroItems.length;
    const t = setInterval(() => setHeroIndex((i) => (i + 1) % n), 3000);
    return () => clearInterval(t);
  }, [heroItems.length]);

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
      if (rRes.error) { setLoadError(rRes.error.message); setLoading(false); return; }
      if (!rRes.data) { setLoadError("Restaurant not found"); setLoading(false); return; }
      if (cRes.error) { setLoadError(cRes.error.message); setLoading(false); return; }
      if (iRes.error) { setLoadError(iRes.error.message); setLoading(false); return; }
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

  useEffect(() => {
    if (!cats.length) return undefined;
    const observers = [];
    cats.forEach((cat) => {
      const el = document.getElementById(`cat-${cat.id}`);
      if (!el) return;
      const obs = new IntersectionObserver(
        ([entry]) => {
          if (entry.isIntersecting) setActiveCat(cat.id);
        },
        { threshold: 0.2, rootMargin: "-100px 0px -60% 0px" }
      );
      obs.observe(el);
      observers.push(obs);
    });
    return () => observers.forEach((o) => o.disconnect());
  }, [cats]);

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

  // Returns { ok, orderId?, message? }
  const placeOrder = async () => {
    const { data, error } = await supabase
      .from("orders")
      .insert({
        restaurant_id: restaurantId,
        table_number: tableNum,
        status: "new",
        items: cart.map((i) => ({ name: i.name, qty: i.qty })),
        total: cartTotal,
      })
      .select("id")
      .single();
    if (error) return { ok: false, message: error.message };
    setCart([]);
    return { ok: true, orderId: data?.id };
  };

  const orderingOn = features.ordering === true;
  const paymentOn = features.payment === true;
  const bottomPad = orderingOn ? 120 : 72;
  const tagline = restaurant?.location || restaurant?.tagline || "";
  const grouped = cats
    .map((cat) => ({ cat, items: items.filter((i) => i.cat === cat.id) }))
    .filter((g) => g.items.length > 0);

  if (loading) {
    return (
      <div style={{ background:"#f5ede6", minHeight:"100vh", width:"100%" }}>
        <div style={{ maxWidth:480, margin:"0 auto", minHeight:"100vh", background:"#f5ede6", display:"flex", flexDirection:"column", alignItems:"center", justifyContent:"center", position:"relative" }}>
          <GS />
          <div className="menu-spinner" aria-hidden />
          <div style={{ marginTop:16, fontSize:13, color:"#b8907a", fontFamily:"DM Sans" }}>{t.loading}</div>
        </div>
      </div>
    );
  }

  if (loadError || !restaurant) {
    return (
      <div style={{ background:"#f5ede6", minHeight:"100vh", width:"100%" }}>
        <div style={{ maxWidth:480, margin:"0 auto", minHeight:"100vh", background:"#f5ede6", display:"flex", flexDirection:"column", alignItems:"center", justifyContent:"center", padding:24, textAlign:"center", position:"relative" }}>
          <GS />
          <div style={{ fontFamily:"Cormorant Garamond", fontSize:22, fontWeight:700, color:"#3d1c12", marginBottom:8 }}>{t.loadFailTitle}</div>
          <div style={{ fontSize:14, color:"#7a4f3a", lineHeight:1.5 }}>{loadError || t.restaurantNotFound}</div>
        </div>
      </div>
    );
  }

  return (
    <div style={{ background:"#f5ede6", minHeight:"100vh", width:"100%" }}>
      <div style={{ maxWidth:480, margin:"0 auto", minHeight:"100vh", background:"#f5ede6", display:"flex", flexDirection:"column", position:"relative" }}>
      <GS />

      {heroItems.length > 0 && (
        <div
          style={{ position:"relative", width:"100%", height:320, overflow:"hidden", background:"#1a140e", flexShrink:0, touchAction:"pan-y" }}
          onTouchStart={(e) => {
            heroTouchStartX.current = e.touches[0]?.clientX ?? null;
          }}
          onTouchEnd={(e) => {
            const start = heroTouchStartX.current;
            heroTouchStartX.current = null;
            if (start == null || heroItems.length < 2) return;
            const endX = e.changedTouches[0]?.clientX;
            if (endX == null) return;
            const d = endX - start;
            if (Math.abs(d) < 48) return;
            if (d > 0) setHeroIndex((i) => (i - 1 + heroItems.length) % heroItems.length);
            else setHeroIndex((i) => (i + 1) % heroItems.length);
          }}
        >
          {heroItems.map((item, i) => (
            <div key={item.id} style={{ position:"absolute", inset:0, transition:"opacity 0.6s ease", opacity: i === heroSlideIndex ? 1 : 0, pointerEvents: i === heroSlideIndex ? "auto" : "none" }}>
              <img src={item.img} alt={item.name} style={{ width:"100%", height:"100%", objectFit:"cover", display:"block" }} />
              <div style={{ position:"absolute", inset:0, background:"linear-gradient(to top, rgba(0,0,0,0.55) 0%, transparent 50%)" }} />
              <div style={{ position:"absolute", bottom:16, left:16, background:"rgba(255,255,255,0.92)", borderRadius:20, padding:"5px 14px", display:"flex", alignItems:"center", gap:8 }}>
                <span style={{ fontSize:12, fontWeight:700, color:"#3d1c12", fontFamily:"DM Sans" }}>{item.name}</span>
                <span style={{ fontSize:12, fontWeight:700, color:"#d4956a", fontFamily:"Cormorant Garamond" }}>₼{Number(item.price).toFixed(2)}</span>
              </div>
            </div>
          ))}
          <div style={{ position:"absolute", bottom:16, right:16, display:"flex", gap:5 }}>
            {heroItems.map((_, i) => (
              <button key={i} type="button" aria-label={`Slide ${i + 1}`} onClick={() => setHeroIndex(i)}
                style={{ width: i === heroSlideIndex ? 20 : 6, height:6, borderRadius:3, background: i === heroSlideIndex ? "#fff" : "rgba(255,255,255,0.4)", cursor:"pointer", transition:"all 0.3s", border:"none", padding:0 }} />
            ))}
          </div>
          {restaurant?.logo_url && (
            <div style={{ position:"absolute", top:16, left:16, width:56, height:56, borderRadius:12, overflow:"hidden", background:"#fff", padding:4 }}>
              <img src={restaurant.logo_url} alt="logo" style={{ width:"100%", height:"100%", objectFit:"contain" }} />
            </div>
          )}
        </div>
      )}

      <div style={{ padding:"16px 16px 0", background:"#fff" }}>
        <div style={{ fontFamily:"Cormorant Garamond", fontSize:28, fontWeight:700, color:"#3d1c12", lineHeight:1.1 }}>{restaurant.name}</div>
        {tagline ? <div style={{ fontSize:13, color:"#b8907a", marginTop:4 }}>{tagline}</div> : null}
        {orderingOn && (
          <div style={{ fontSize:11, color:"#b8907a", marginTop:4, fontFamily:"DM Mono" }}>{t.tableLabel} {tableNum}</div>
        )}
      </div>

      <header style={{ background:"#fff", padding:"8px 16px", position:"sticky", top:0, zIndex:50, boxShadow:"0 1px 0 #f0ebe4", display:"flex", justifyContent:"flex-end", alignItems:"center", gap:8 }}>
        <div ref={langMenuWrapRef} style={{ position:"relative" }}>
          <button type="button" aria-label="Language" aria-haspopup="listbox" aria-expanded={langMenuOpen}
            onClick={() => setLangMenuOpen((o) => !o)}
            style={{ display:"flex", alignItems:"center", justifyContent:"center", width:44, height:36, padding:0, borderRadius:20, border:"1px solid #e8d5c8", background:"#fff", cursor:"pointer", fontSize:22, lineHeight:1 }}>
            {LANG_FLAG[lang] || LANG_FLAG.AZ}
          </button>
          {langMenuOpen ? (
            <div role="listbox"
              style={{ position:"absolute", top:"100%", right:0, marginTop:6, minWidth:188, background:"#fff", border:"1px solid #e8d5c8", borderRadius:12, boxShadow:"0 8px 24px rgba(61,28,18,0.1)", padding:"6px 0", zIndex:60 }}>
              {LANG_OPTIONS.map(({ code, flag, label }) => (
                <button key={code} type="button" role="option" aria-selected={lang === code}
                  onClick={() => { setLang(code); setLangMenuOpen(false); }}
                  style={{ display:"flex", alignItems:"center", gap:10, width:"100%", padding:"10px 14px", border:"none", background:"transparent", cursor:"pointer", fontFamily:"DM Sans, sans-serif", fontSize:13, fontWeight:500, color:"#3d1c12", textAlign:"left" }}>
                  <span style={{ fontSize:18, lineHeight:1 }} aria-hidden>{flag}</span>
                  <span>{label}</span>
                </button>
              ))}
            </div>
          ) : null}
        </div>
        <button type="button" onClick={() => setShowInfo(true)}
          style={{ width:44, height:36, borderRadius:20, border:"1px solid #e8d5c8", background:"#fff", cursor:"pointer", fontSize:16, display:"flex", alignItems:"center", justifyContent:"center", color:"#3d1c12" }}>
          ☰
        </button>
      </header>

      <div style={{ position:"sticky", top:44, zIndex:49, background:"#fff", borderBottom:"1px solid #e8d5c8", padding:"10px 16px" }}>
        <div style={{ display:"flex", gap:6, overflowX:"auto", scrollbarWidth:"none" }}>
          {cats.map((cat) => (
            <button type="button" key={cat.id} className="cat-btn" onClick={() => {
              setActiveCat(cat.id);
              document.getElementById(`cat-${cat.id}`)?.scrollIntoView({ behavior:"smooth", block:"start" });
            }}
              style={{ display:"flex", alignItems:"center", gap:6, padding:"7px 14px", borderRadius:24, border:"none", cursor:"pointer", fontFamily:"DM Sans", fontSize:13, fontWeight:500, flexShrink:0,
                background: activeCat === cat.id ? "#8b3a2a" : "#f7efe8",
                color: activeCat === cat.id ? "#fff" : "#7a4f3a",
              }}>
              <span style={{ fontSize:14 }}>{cat.icon}</span>
              <span>● {cat.name}</span>
            </button>
          ))}
        </div>
      </div>

      <div style={{ flex:1, padding:`0 16px ${bottomPad}px` }}>
        {grouped.map(({ cat, items: catItems }) => (
          <div key={cat.id} id={`cat-${cat.id}`} style={{ scrollMarginTop:"100px" }}>
            <div style={{ display:"flex", alignItems:"center", gap:8, padding:"20px 0 4px", borderBottom:"2px solid #e8d5c8", marginBottom:0 }}>
              <span style={{ fontSize:20 }}>{cat.icon}</span>
              <span style={{ fontFamily:"Cormorant Garamond", fontSize:22, fontWeight:700, color:"#3d1c12" }}>{cat.name}</span>
              <span style={{ fontSize:11, color:"#b8907a", fontFamily:"DM Mono", marginLeft:2 }}>({catItems.length})</span>
            </div>
            <div>
              {catItems.map((item) => (
                <ItemRow key={item.id} item={item} orderingOn={orderingOn} addedId={addedId} onAdd={addToCart} onOpen={setSelectedItem} />
              ))}
            </div>
          </div>
        ))}
      </div>

      {orderingOn && cartCount > 0 && (
        <div style={{ position:"fixed", bottom:24, left:"50%", transform:"translateX(-50%)", width:"calc(100% - 32px)", maxWidth:448, zIndex:100 }}>
          <button type="button" onClick={()=>setShowCart(true)}
            style={{ width:"100%", background:"#8b3a2a", color:"#fff", border:"none", borderRadius:28, padding:"16px 24px", display:"flex", alignItems:"center", justifyContent:"space-between", cursor:"pointer", fontFamily:"DM Sans", boxShadow:"0 8px 32px rgba(139,58,42,0.28)" }}>
            <div style={{ display:"flex", alignItems:"center", gap:10 }}>
              <div style={{ background:"#d4956a", borderRadius:"50%", width:26, height:26, display:"flex", alignItems:"center", justifyContent:"center", fontSize:12, fontWeight:700, color:"#fff" }}>{cartCount}</div>
              <span style={{ fontSize:14, fontWeight:600 }}>{t.viewOrder}</span>
            </div>
            <span style={{ fontFamily:"Cormorant Garamond", fontSize:20, fontWeight:700, color:"#d4956a" }}>{fmt(cartTotal)}</span>
          </button>
        </div>
      )}

      {!orderingOn && (
        <div style={{ position:"fixed", bottom:0, left:0, right:0, zIndex:90, display:"flex", justifyContent:"center", pointerEvents:"none" }}>
          <div style={{ maxWidth:480, width:"100%", padding:"12px 20px 20px", background:"linear-gradient(to top, rgba(245,237,230,0.98) 60%, transparent)" }}>
            <div style={{ textAlign:"center", fontSize:12, fontWeight:500, color:"#b8907a", letterSpacing:"0.02em", lineHeight:1.5 }}>
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
          restaurantId={restaurantId}
          onClose={()=>setShowCart(false)}
          onQtyChange={changeQty}
          paymentEnabled={paymentOn}
          onPlaceOrder={placeOrder}
          t={t}
        />
      )}
      {showInfo && (
        <div style={{ position:"fixed", inset:0, zIndex:300 }}>
          <div style={{ position:"absolute", inset:0, background:"rgba(61,28,18,0.4)" }} onClick={() => setShowInfo(false)} />
          <div style={{ position:"absolute", top:0, left:0, width:"85%", maxWidth:340, height:"100%", background:"#fff", overflowY:"auto", display:"flex", flexDirection:"column" }}>
            <div style={{ display:"flex", justifyContent:"flex-end", padding:"16px 16px 0" }}>
              <button type="button" onClick={() => setShowInfo(false)}
                style={{ background:"#f7efe8", border:"none", borderRadius:"50%", width:32, height:32, cursor:"pointer", fontSize:16, color:"#7a4f3a", display:"flex", alignItems:"center", justifyContent:"center" }}>✕</button>
            </div>

            <div style={{ padding:"8px 0 4px 20px", fontSize:12, color:"#b8907a", fontFamily:"DM Mono", letterSpacing:"0.08em" }}>Əlaqə</div>
            {[
              { icon:"📍", val: restaurant?.location, href: restaurant?.location ? `https://maps.google.com/?q=${encodeURIComponent(restaurant.location)}` : null },
              { icon:"📞", val: restaurant?.phone, href: restaurant?.phone ? `tel:${restaurant.phone}` : null },
              { icon:"✉️", val: restaurant?.contact_email, href: restaurant?.contact_email ? `mailto:${restaurant.contact_email}` : null },
              { icon:"🌐", val: restaurant?.website, href: restaurant?.website },
            ].filter((r) => r.val).map((row, i) => (
              <a key={i} href={row.href || "#"} target="_blank" rel="noopener noreferrer"
                style={{ display:"flex", alignItems:"center", gap:14, padding:"14px 20px", borderBottom:"1px solid #f5f0ea", textDecoration:"none" }}>
                <span style={{ fontSize:20, flexShrink:0 }}>{row.icon}</span>
                <span style={{ flex:1, fontSize:14, color:"#3d1c12" }}>{row.val}</span>
                <span style={{ color:"#b8907a", fontSize:16 }}>→</span>
              </a>
            ))}

            {restaurant?.instagram && (
              <>
                <div style={{ padding:"16px 0 4px 20px", fontSize:12, color:"#b8907a", fontFamily:"DM Mono", letterSpacing:"0.08em" }}>Social</div>
                <a href={`https://instagram.com/${String(restaurant.instagram).replace("@", "")}`} target="_blank" rel="noopener noreferrer"
                  style={{ display:"flex", alignItems:"center", gap:14, padding:"14px 20px", borderBottom:"1px solid #f5f0ea", textDecoration:"none" }}>
                  <span style={{ fontSize:20 }}>📸</span>
                  <span style={{ flex:1, fontSize:14, color:"#3d1c12" }}>Instagram</span>
                  <span style={{ color:"#b8907a", fontSize:16 }}>→</span>
                </a>
              </>
            )}

            <div style={{ margin:"24px 20px 0", padding:"16px", background:"#f7efe8", borderRadius:12, fontSize:13, color:"#7a4f3a", fontFamily:"DM Mono", textAlign:"center" }}>
              Service charge: 10%
            </div>
          </div>
        </div>
      )}
      </div>
    </div>
  );
}