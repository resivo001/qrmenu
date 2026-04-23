import { useState, useEffect, useMemo, useRef } from "react";
import { supabase } from "../supabase";

const DEFAULT_RESTAURANT_ID = "ac4e5a27-a9dd-46cf-b6c9-45469c1aaa7b";

const GS = () => (
  <style>{`
    @import url('https://fonts.googleapis.com/css2?family=Cormorant+Garamond:ital,wght@0,400;0,500;0,600;0,700;0,800;1,400;1,600&family=DM+Sans:wght@300;400;500;600;700;800&family=DM+Mono:wght@400;500&display=swap');
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
    @keyframes slideFromLeft {
      from { transform: translateX(-100%); }
      to { transform: translateX(0); }
    }
    .info-sidebar-panel {
      animation: slideFromLeft 0.3s cubic-bezier(0.16, 1, 0.3, 1) both;
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

// ⚠️ ALL user-visible strings must be defined here.
// Never hardcode strings in JSX — always use t.key
const UI = {
  AZ: {
    digitalMenu:        "RƏQƏMSAL MENYU",
    info:               "MƏLUMAT",
    serviceCharge:      "SERVİS HAQQI",
    serviceChargeVal:   "Servis haqqı: 10%",
    addressLabel:       "Ünvan",
    workingHoursLabel:  "İş vaxtı",
    phoneLabel:         "Telefon",
    emailLabel:         "E-poçt",
    websiteLabel:       "Vebsayt",
    instagramLabel:     "Instagram",
    socialLabel:        "Sosial şəbəkələr",
    contactLabel:       "Əlaqə",
    back:               "Geri",
    addToOrder:         "Sifariş et",
    askWaiterOrder:     "Sifariş üçün ofisianta müraciət edin",
    viewOrder:          "Sifarişə bax",
    yourOrder:          "Sifarişiniz",
    tableLabel:         "Masa",
    total:              "Cəmi",
    sending:            "Göndərilir…",
    placeOrderBtn:      "Sifariş ver →",
    sendWaiterBtn:      "Ofisiantə göndər →",
    payNowBtn:          "Ödə →",
    paymentSubtitle:    "Masada ödəniş",
    waiterSubtitle:     "Ofisiant gələcək",
    payingSubtitle:     "Ödəniş emal edilir…",
    orderPlacedTitle:   "Sifariş qəbul edildi!",
    orderSentTitle:     "Komandaya göndərildi!",
    successBody:        "Sifarişiniz mətbəxə göndərildi. Ofisiant tezliklə təsdiqləyəcək.",
    orderErrorGeneric:  "Xəta baş verdi. Yenidən cəhd edin.",
    paymentError:       "Ödəniş alınmadı. Yenidən cəhd edin.",
    loading:            "Yüklənir…",
    loadFailTitle:      "Menü yüklənmədi",
    restaurantNotFound: "Restoran tapılmadı",
    scanPrompt:         "Menüyə baxmaq üçün skan edin · Ofisiant sifariş alacaq",
  },
  RU: {
    digitalMenu:        "ЦИФРОВОЕ МЕНЮ",
    info:               "ИНФОРМАЦИЯ",
    serviceCharge:      "СЕРВИСНЫЙ СБОР",
    serviceChargeVal:   "Сервисный сбор: 10%",
    addressLabel:       "Адрес",
    workingHoursLabel:  "Часы работы",
    phoneLabel:         "Телефон",
    emailLabel:         "Эл. почта",
    websiteLabel:       "Веб-сайт",
    instagramLabel:     "Instagram",
    socialLabel:        "Социальные сети",
    contactLabel:       "Контакты",
    back:               "Назад",
    addToOrder:         "Добавить в заказ",
    askWaiterOrder:     "Попросите официанта принять заказ",
    viewOrder:          "Посмотреть заказ",
    yourOrder:          "Ваш заказ",
    tableLabel:         "Стол",
    total:              "Итого",
    sending:            "Отправка…",
    placeOrderBtn:      "Оформить заказ →",
    sendWaiterBtn:      "Отправить официанту →",
    payNowBtn:          "Оплатить →",
    paymentSubtitle:    "Оплата за столом",
    waiterSubtitle:     "Официант подойдёт к вашему столу",
    payingSubtitle:     "Обработка оплаты…",
    orderPlacedTitle:   "Заказ принят!",
    orderSentTitle:     "Отправлено команде!",
    successBody:        "Ваш заказ отправлен на кухню. Официант скоро подтвердит.",
    orderErrorGeneric:  "Что-то пошло не так. Попробуйте ещё раз.",
    paymentError:       "Ошибка оплаты. Попробуйте ещё раз или оплатите за столом.",
    loading:            "Загрузка…",
    loadFailTitle:      "Не удалось загрузить меню",
    restaurantNotFound: "Ресторан не найден",
    scanPrompt:         "Сканируйте для просмотра меню · Официант примет заказ",
  },
  EN: {
    digitalMenu:        "DIGITAL MENU",
    info:               "INFO",
    serviceCharge:      "SERVICE CHARGE",
    serviceChargeVal:   "Service charge: 10%",
    addressLabel:       "Address",
    workingHoursLabel:  "Working hours",
    phoneLabel:         "Phone",
    emailLabel:         "Email",
    websiteLabel:       "Website",
    instagramLabel:     "Instagram",
    socialLabel:        "Social media",
    contactLabel:       "Contact",
    back:               "Back",
    addToOrder:         "Add to Order",
    askWaiterOrder:     "Ask your waiter to order",
    viewOrder:          "View Order",
    yourOrder:          "Your Order",
    tableLabel:         "Table",
    total:              "Total",
    sending:            "Sending…",
    placeOrderBtn:      "Place Order →",
    sendWaiterBtn:      "Send to Waiter →",
    payNowBtn:          "Pay Now →",
    paymentSubtitle:    "Payment at the table",
    waiterSubtitle:     "A waiter will come to your table",
    payingSubtitle:     "Processing payment…",
    orderPlacedTitle:   "Order Placed!",
    orderSentTitle:     "Sent to the team!",
    successBody:        "Your order has been sent to the kitchen. A waiter will confirm shortly.",
    orderErrorGeneric:  "Something went wrong. Please try again.",
    paymentError:       "Payment failed. Please try again or pay at the table.",
    loading:            "Loading…",
    loadFailTitle:      "Couldn't load menu",
    restaurantNotFound: "Restaurant not found",
    scanPrompt:         "Scan to view our menu · Ask your waiter to order",
  },
};

/** Load error sentinel so the message follows `lang` via `t.restaurantNotFound`. */
const LOAD_ERR_RESTAURANT_NOT_FOUND = "__LOAD_ERR_RESTAURANT_NOT_FOUND__";

const LANG_FLAG = { AZ: "🇦🇿", RU: "🇷🇺", EN: "🇬🇧" };
const LANG_OPTIONS = [
  { code: "AZ", flag: "🇦🇿", label: "Azərbaycanca" },
  { code: "RU", flag: "🇷🇺", label: "Русский" },
  { code: "EN", flag: "🇬🇧", label: "English" },
];

function LangPicker({ lang, setLang, langMenuOpen, setLangMenuOpen, langMenuWrapRef, buttonStyle }) {
  return (
    <div ref={langMenuWrapRef} style={{ position: "relative" }}>
      <button
        type="button"
        aria-haspopup="listbox"
        aria-expanded={langMenuOpen}
        onClick={() => setLangMenuOpen((o) => !o)}
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          width: 44,
          height: 44,
          padding: 0,
          borderRadius: 12,
          border: "1px solid #e8d5c8",
          background: "rgba(255,255,255,0.92)",
          cursor: "pointer",
          fontSize: 22,
          lineHeight: 1,
          color: "#3d1c12",
          ...buttonStyle,
        }}
      >
        {LANG_FLAG[lang] || LANG_FLAG.AZ}
      </button>
      {langMenuOpen ? (
        <div
          role="listbox"
          style={{
            position: "absolute",
            top: "100%",
            right: 0,
            marginTop: 6,
            minWidth: 188,
            background: "#fff",
            border: "1px solid #e8d5c8",
            borderRadius: 12,
            boxShadow: "0 8px 24px rgba(61,28,18,0.1)",
            padding: "6px 0",
            zIndex: 60,
          }}
        >
          {LANG_OPTIONS.map(({ code, flag, label }) => (
            <button
              key={code}
              type="button"
              role="option"
              aria-selected={lang === code}
              onClick={() => {
                setLang(code);
                setLangMenuOpen(false);
              }}
              style={{
                display: "flex",
                alignItems: "center",
                gap: 10,
                width: "100%",
                padding: "10px 14px",
                border: "none",
                background: "transparent",
                cursor: "pointer",
                fontFamily: "DM Sans, sans-serif",
                fontSize: 13,
                fontWeight: 500,
                color: "#3d1c12",
                textAlign: "left",
              }}
            >
              <span style={{ fontSize: 18, lineHeight: 1 }} aria-hidden>
                {flag}
              </span>
              <span>{label}</span>
            </button>
          ))}
        </div>
      ) : null}
    </div>
  );
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
    name_az: row.name_az ?? "",
    name_ru: row.name_ru ?? "",
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

function localized(obj, field, lang) {
  if (lang === "AZ") return obj[`${field}_az`] || obj[field] || "";
  if (lang === "RU") return obj[`${field}_ru`] || obj[field] || "";
  return obj[field] || "";
}

function ItemSheet({ item, onClose, onAdd, orderingEnabled, t, lang }) {
  const [qty, setQty] = useState(1);
  return (
    <div style={{ position:"fixed", inset:0, zIndex:200, display:"flex", flexDirection:"column", justifyContent:"flex-end" }}>
      <div style={{ position:"absolute", inset:0, background:"rgba(61,28,18,0.55)" }} onClick={onClose} className="fade-in" />
      <div className="slide-up" style={{ position:"relative", background:"#fff", borderRadius:"24px 24px 0 0", maxHeight:"88vh", overflowY:"auto", paddingBottom:32 }}>
        <div style={{ width:"100%", height:260, overflow:"hidden", position:"relative", background:"#f7efe8" }}>
          {item.img ? (
            <div style={{ position:"absolute", inset:0 }}>
              <img src={item.img} alt={localized(item, "name", lang)} style={{ width:"100%", height:"100%", objectFit:"cover" }} onError={(e) => { e.target.parentElement.style.display = "none"; }} />
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
          <div style={{ fontFamily:"Cormorant Garamond", fontSize:28, fontWeight:700, color:"#3d1c12", lineHeight:1.2, marginBottom:8 }}>{localized(item, "name", lang)}</div>
          <div style={{ fontSize:14, color:"#7a4f3a", lineHeight:1.6, marginBottom:20 }}>{localized(item, "desc", lang)}</div>
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
function CartSheet({ cart, tableNumber, restaurantId, onClose, onQtyChange, paymentEnabled, onPlaceOrder, t, lang }) {
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
                  <img src={item.img} alt={localized(item, "name", lang)} style={{ width:52, height:52, objectFit:"cover", display:"block" }} onError={(e) => { e.target.parentElement.style.display = "none"; }} />
                </div>
              ) : (
                <div style={{ width:52, height:52, borderRadius:10, background:"#f7efe8", flexShrink:0 }} />
              )}
              <div style={{ flex:1 }}>
                <div style={{ fontSize:14, fontWeight:600, color:"#3d1c12", marginBottom:4 }}>{localized(item, "name", lang)}</div>
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

function ItemRow({ item, orderingOn, addedId, onAdd, onOpen, lang }) {
  return (
    <div
      onClick={() => onOpen(item)}
      style={{
        display: "flex",
        alignItems: "flex-start",
        gap: 14,
        padding: "18px 16px",
        borderBottom: "1px dashed #e8d5c8",
        cursor: "pointer",
        background: "#fff",
      }}
    >
      <div style={{ flex: 1, minWidth: 0 }}>
        {item.badge && (
          <div
            style={{
              display: "inline-block",
              fontSize: 10,
              fontWeight: 700,
              color: "#8b3a2a",
              background: "#f7efe8",
              borderRadius: 20,
              padding: "2px 8px",
              marginBottom: 6,
            }}
          >
            {item.badge}
          </div>
        )}
        <div
          style={{
            fontFamily: "DM Sans",
            fontSize: 15,
            fontWeight: 800,
            color: "#3d1c12",
            lineHeight: 1.3,
            marginBottom: 6,
            textTransform: "uppercase",
            letterSpacing: "0.02em",
          }}
        >
          {localized(item, "name", lang)}
        </div>
        <div style={{ fontSize: 14, fontWeight: 700, color: "#8b3a2a", marginBottom: 6, fontFamily: "DM Mono" }}>
          ₼{Number(item.price).toFixed(2)}
        </div>
        {localized(item, "desc", lang) && (
          <div
            style={{
              fontSize: 13,
              color: "#7a4f3a",
              lineHeight: 1.6,
              display: "-webkit-box",
              WebkitLineClamp: 3,
              WebkitBoxOrient: "vertical",
              overflow: "hidden",
            }}
          >
            {localized(item, "desc", lang)}
          </div>
        )}
        {orderingOn && (
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              onAdd(item);
            }}
            style={{
              marginTop: 10,
              width: 36,
              height: 36,
              borderRadius: 10,
              border: "1.5px solid #e8d5c8",
              cursor: "pointer",
              fontSize: 18,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              background: addedId === item.id ? "#4caf50" : "#fff",
              color: addedId === item.id ? "#fff" : "#3d1c12",
              transition: "all 0.15s",
            }}
          >
            {addedId === item.id ? "✓" : "+"}
          </button>
        )}
      </div>
      <div style={{ width: 110, height: 110, borderRadius: 12, overflow: "hidden", flexShrink: 0, background: "#f7efe8" }}>
        {item.img ? (
          <img
            src={item.img}
            alt={localized(item, "name", lang)}
            style={{ width: "100%", height: "100%", objectFit: "cover", display: "block" }}
            onError={(e) => {
              e.target.parentElement.style.background = "#f7efe8";
              e.target.style.display = "none";
            }}
          />
        ) : null}
      </div>
    </div>
  );
}

export default function CustomerMenu() {
  const { restaurantId, tableNum } = useMemo(() => readUrlContext(), []);

  const [lang, setLang] = useState("AZ");
  const t = useMemo(() => UI[lang] ?? UI.AZ, [lang]);
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
  const [view, setView] = useState("home");
  const [heroIndex, setHeroIndex] = useState(0);
  const heroTouchStartX = useRef(null);

  const heroItems = useMemo(() => items.filter((i) => i.img).slice(0, 6), [items]);
  const heroSlideIndex = heroItems.length === 0 ? 0 : heroIndex % heroItems.length;

  useEffect(() => {
    if (heroItems.length < 2) return undefined;
    const n = heroItems.length;
    const tick = setInterval(() => setHeroIndex((i) => (i + 1) % n), 3500);
    return () => clearInterval(tick);
  }, [heroItems.length]);

  useEffect(() => {
    if (view !== "menu") return undefined;
    const id = window.setTimeout(() => {
      document.getElementById(`cat-${activeCat}`)?.scrollIntoView({ behavior: "smooth", block: "start" });
    }, 0);
    return () => clearTimeout(id);
    // Intentionally only when `view` becomes "menu"; `activeCat` is taken from the same render as the navigation that opened the menu.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [view]);

  useEffect(() => {
    setLangMenuOpen(false);
  }, [view]);

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
      if (!rRes.data) { setLoadError(LOAD_ERR_RESTAURANT_NOT_FOUND); setLoading(false); return; }
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
    if (view !== "menu" || !cats.length) return;

    // Use a Map to track intersection ratios per section
    const visibleSections = new Map();

    const observers = cats.map((cat) => {
      const el = document.getElementById(`cat-${cat.id}`);
      if (!el) return null;

      const obs = new IntersectionObserver(
        ([entry]) => {
          visibleSections.set(cat.id, entry.intersectionRatio);

          // Find the section with the highest intersection ratio
          let maxRatio = 0;
          let mostVisible = null;
          visibleSections.forEach((ratio, id) => {
            if (ratio > maxRatio) {
              maxRatio = ratio;
              mostVisible = id;
            }
          });

          if (mostVisible) {
            setActiveCat(mostVisible);
          }
        },
        {
          root: null,
          rootMargin: "-100px 0px -40% 0px",
          threshold: [0, 0.1, 0.2, 0.3, 0.4, 0.5],
        }
      );

      obs.observe(el);
      return obs;
    }).filter(Boolean);

    return () => observers.forEach((o) => o.disconnect());
  }, [view, cats]);

  useEffect(() => {
    if (!activeCat || view !== "menu") return;

    // Small delay to let DOM settle after activeCat changes
    const timer = setTimeout(() => {
      const tabEl = document.getElementById(`tab-${activeCat}`);
      if (tabEl) {
        tabEl.scrollIntoView({
          behavior: "smooth",
          block: "nearest",
          inline: "center",
        });
      }
    }, 50);

    return () => clearTimeout(timer);
  }, [activeCat, view]);

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
          <div style={{ fontSize:14, color:"#7a4f3a", lineHeight:1.5 }}>{loadError === LOAD_ERR_RESTAURANT_NOT_FOUND ? t.restaurantNotFound : loadError}</div>
        </div>
      </div>
    );
  }

  const homeInfoRows = [
    { icon: "📍", label: t.addressLabel, val: restaurant?.location },
    { icon: "🕐", label: t.workingHoursLabel, val: restaurant?.working_hours },
    { icon: "📞", label: t.phoneLabel, val: restaurant?.phone },
    { icon: "✉️", label: t.emailLabel, val: restaurant?.contact_email },
    { icon: "🌐", label: t.websiteLabel, val: restaurant?.website },
    { icon: "📸", label: t.instagramLabel, val: restaurant?.instagram ? String(restaurant.instagram) : null },
  ].filter((r) => r.val);

  const heroCarousel =
    heroItems.length > 0 ? (
    <div
      style={{ position: "relative", width: "100%", height: 320, overflow: "hidden", background: "#1a140e", flexShrink: 0, touchAction: "pan-y" }}
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
        <div
          key={item.id}
          style={{
            position: "absolute",
            inset: 0,
            transition: "opacity 0.7s ease",
            opacity: i === heroSlideIndex ? 1 : 0,
            pointerEvents: i === heroSlideIndex ? "auto" : "none",
          }}
        >
          <img src={item.img} alt={localized(item, "name", lang)} style={{ width: "100%", height: "100%", objectFit: "cover", display: "block" }} />
          <div style={{ position: "absolute", inset: 0, background: "linear-gradient(to top, rgba(0,0,0,0.6) 0%, transparent 55%)" }} />
          <div
            style={{
              position: "absolute",
              bottom: 20,
              left: 16,
              background: "rgba(0,0,0,0.75)",
              borderRadius: 20,
              padding: "5px 14px",
              display: "flex",
              alignItems: "center",
              gap: 8,
            }}
          >
            <span style={{ fontSize: 12, fontWeight: 700, color: "#fff", fontFamily: "DM Sans", letterSpacing: "0.04em", textTransform: "uppercase" }}>{localized(item, "name", lang)}</span>
            <span style={{ fontSize: 12, fontWeight: 700, color: "#d4956a" }}>₼{Number(item.price).toFixed(2)}</span>
          </div>
        </div>
      ))}
      {restaurant?.logo_url && (
        <div style={{ position: "absolute", top: 16, left: 16, width: 72, height: 72, borderRadius: 14, overflow: "hidden", background: "#fff" }}>
          <img src={restaurant.logo_url} alt="" style={{ width: "100%", height: "100%", objectFit: "contain" }} />
        </div>
      )}
      <div style={{ position: "absolute", top: 16, right: 16, display: "flex", gap: 8, alignItems: "center" }}>
        <LangPicker lang={lang} setLang={setLang} langMenuOpen={langMenuOpen} setLangMenuOpen={setLangMenuOpen} langMenuWrapRef={langMenuWrapRef} buttonStyle={{}} />
        <button
          type="button"
          onClick={() => setShowInfo(true)}
          style={{
            width: 44,
            height: 44,
            borderRadius: 12,
            background: "rgba(255,255,255,0.92)",
            border: "none",
            cursor: "pointer",
            fontSize: 18,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            color: "#3d1c12",
          }}
        >
          ☰
        </button>
      </div>
      {heroItems.length > 1 && (
        <>
          <button
            type="button"
            onClick={() => setHeroIndex((i) => (i - 1 + heroItems.length) % heroItems.length)}
            style={{
              position: "absolute",
              left: 10,
              top: "50%",
              transform: "translateY(-50%)",
              width: 36,
              height: 36,
              borderRadius: 8,
              background: "rgba(0,0,0,0.45)",
              border: "none",
              color: "#fff",
              cursor: "pointer",
              fontSize: 18,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            ‹
          </button>
          <button
            type="button"
            onClick={() => setHeroIndex((i) => (i + 1) % heroItems.length)}
            style={{
              position: "absolute",
              right: 10,
              top: "50%",
              transform: "translateY(-50%)",
              width: 36,
              height: 36,
              borderRadius: 8,
              background: "rgba(0,0,0,0.45)",
              border: "none",
              color: "#fff",
              cursor: "pointer",
              fontSize: 18,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            ›
          </button>
        </>
      )}
    </div>
    ) : null;

  return (
    <div style={{ background: "#f5ede6", minHeight: "100vh", width: "100%" }}>
      <div
        style={{
          maxWidth: 480,
          margin: "0 auto",
          minHeight: "100vh",
          background: view === "menu" ? "#f5ede6" : "#f5ede6",
          display: "flex",
          flexDirection: "column",
          position: "relative",
        }}
      >
        <GS />

        {view === "home" ? (
          <>
            {heroCarousel ?? (
              <div
                style={{
                  background: "#fff",
                  padding: "12px 16px",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  borderBottom: "1px solid #e8d5c8",
                  flexShrink: 0,
                }}
              >
                <div style={{ display: "flex", alignItems: "center", minHeight: 72 }}>
                  {restaurant?.logo_url ? (
                    <div style={{ width: 72, height: 72, borderRadius: 14, overflow: "hidden", background: "#fff", border: "1px solid #e8d5c8" }}>
                      <img src={restaurant.logo_url} alt="" style={{ width: "100%", height: "100%", objectFit: "contain" }} />
                    </div>
                  ) : (
                    <div style={{ width: 1, height: 1 }} aria-hidden />
                  )}
                </div>
                <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
                  <LangPicker lang={lang} setLang={setLang} langMenuOpen={langMenuOpen} setLangMenuOpen={setLangMenuOpen} langMenuWrapRef={langMenuWrapRef} buttonStyle={{ background: "#fff" }} />
                  <button
                    type="button"
                    onClick={() => setShowInfo(true)}
                    style={{
                      width: 44,
                      height: 44,
                      borderRadius: 12,
                      background: "#fff",
                      border: "1px solid #e8d5c8",
                      cursor: "pointer",
                      fontSize: 18,
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      color: "#3d1c12",
                    }}
                  >
                    ☰
                  </button>
                </div>
              </div>
            )}

            <div style={{ background: "#fff", padding: "20px 16px 16px" }}>
              <div style={{ fontFamily: "Cormorant Garamond", fontSize: 30, fontWeight: 800, color: "#3d1c12", lineHeight: 1.1 }}>{restaurant.name}</div>
              {tagline ? <div style={{ fontSize: 14, color: "#b8907a", marginTop: 4 }}>{tagline}</div> : null}
              {orderingOn ? (
                <div style={{ fontSize: 11, color: "#b8907a", marginTop: 4, fontFamily: "DM Mono" }}>
                  {t.tableLabel} {tableNum}
                </div>
              ) : null}
            </div>

            <div style={{ padding: "0 16px", paddingBottom: 80, background: "#f5ede6" }}>
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 10,
                  padding: "16px 0 12px",
                  color: "#b8907a",
                  fontSize: 11,
                  fontFamily: "DM Mono, monospace",
                  letterSpacing: "0.12em",
                }}
              >
                <div style={{ flex: 1, height: 1, background: "#e8d5c8" }} />
                <span>{t.digitalMenu}</span>
                <div style={{ flex: 1, height: 1, background: "#e8d5c8" }} />
              </div>

              <div style={{ display: "flex", flexDirection: "column", gap: 10, marginBottom: 24 }}>
                {cats.map((cat) => (
                  <button
                    key={cat.id}
                    type="button"
                    onClick={() => {
                      setActiveCat(cat.id);
                      setView("menu");
                    }}
                    style={{
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "space-between",
                      width: "100%",
                      padding: "18px 20px",
                      background: "#fff",
                      border: "1px solid #e8d5c8",
                      borderRadius: 14,
                      cursor: "pointer",
                      fontFamily: "DM Sans",
                      fontSize: 15,
                      fontWeight: 700,
                      color: "#3d1c12",
                      letterSpacing: "0.02em",
                      boxShadow: "0 1px 4px rgba(61,28,18,0.05)",
                    }}
                  >
                    <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                      <span style={{ fontSize: 20 }}>{cat.icon}</span>
                      <span style={{ textTransform: "uppercase" }}>{localized(cat, "name", lang)}</span>
                    </div>
                    <span style={{ fontSize: 20, color: "#b8907a" }}>›</span>
                  </button>
                ))}
              </div>
            </div>

            <div style={{ padding: "0 16px 32px", background: "#f5ede6" }}>
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 10,
                  padding: "16px 0 16px",
                  color: "#b8907a",
                  fontSize: 11,
                  fontFamily: "DM Mono, monospace",
                  letterSpacing: "0.12em",
                }}
              >
                <div style={{ flex: 1, height: 1, background: "#e8d5c8" }} />
                <span>{t.info}</span>
                <div style={{ flex: 1, height: 1, background: "#e8d5c8" }} />
              </div>
              {homeInfoRows.map((row) => (
                <div
                  key={row.label}
                  style={{
                    display: "flex",
                    gap: 14,
                    padding: "14px 0",
                    borderBottom: "1px solid #f0e6dc",
                    alignItems: "flex-start",
                  }}
                >
                  <span style={{ fontSize: 22, flexShrink: 0 }}>{row.icon}</span>
                  <div>
                    <div style={{ fontSize: 11, color: "#b8907a", fontFamily: "DM Mono, monospace", marginBottom: 3 }}>{row.label}:</div>
                    <div style={{ fontSize: 15, color: "#3d1c12", fontWeight: 500 }}>{row.val}</div>
                  </div>
                </div>
              ))}

              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 10,
                  padding: "20px 0 12px",
                  color: "#b8907a",
                  fontSize: 11,
                  fontFamily: "DM Mono, monospace",
                  letterSpacing: "0.12em",
                }}
              >
                <div style={{ flex: 1, height: 1, background: "#e8d5c8" }} />
                <span>{t.serviceCharge}</span>
                <div style={{ flex: 1, height: 1, background: "#e8d5c8" }} />
              </div>
              <div style={{ textAlign: "center", fontSize: 15, fontWeight: 700, color: "#3d1c12", fontFamily: "DM Mono, monospace" }}>{t.serviceChargeVal}</div>
            </div>
          </>
        ) : (
          <>
            <header
              style={{
                background: "#fff",
                padding: "8px 16px",
                height: 52,
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                borderBottom: "1px solid #e8d5c8",
                position: "sticky",
                top: 0,
                zIndex: 50,
                flexShrink: 0,
              }}
            >
              <button
                type="button"
                onClick={() => setView("home")}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 6,
                  background: "#f7efe8",
                  border: "1px solid #e8d5c8",
                  borderRadius: 10,
                  padding: "6px 12px",
                  cursor: "pointer",
                  fontSize: 13,
                  fontWeight: 600,
                  color: "#3d1c12",
                  fontFamily: "DM Sans",
                  height: 36,
                  whiteSpace: "nowrap",
                }}
              >
                ← {t.back}
              </button>
              <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
                <LangPicker lang={lang} setLang={setLang} langMenuOpen={langMenuOpen} setLangMenuOpen={setLangMenuOpen} langMenuWrapRef={langMenuWrapRef} buttonStyle={{ background: "#fff" }} />
                <button
                  type="button"
                  onClick={() => setShowInfo(true)}
                  style={{
                    width: 44,
                    height: 44,
                    borderRadius: 12,
                    background: "#fff",
                    border: "1px solid #e8d5c8",
                    cursor: "pointer",
                    fontSize: 18,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    color: "#3d1c12",
                  }}
                >
                  ☰
                </button>
              </div>
            </header>

            <div
              style={{
                position: "sticky",
                top: 52,
                zIndex: 49,
                background: "#fff",
                borderBottom: "1px solid #e8d5c8",
                overflowX: "auto",
                scrollBehavior: "smooth",
                scrollbarWidth: "none",
                WebkitOverflowScrolling: "touch",
                display: "flex",
                padding: "0 16px",
              }}
            >
              {cats.map((cat) => (
                <button
                  key={cat.id}
                  id={`tab-${cat.id}`}
                  type="button"
                  onClick={() => {
                    setActiveCat(cat.id);
                    setTimeout(() => {
                      document.getElementById(`cat-${cat.id}`)?.scrollIntoView({ behavior: "smooth", block: "start" });
                    }, 50);
                  }}
                  style={{
                    padding: "10px 16px",
                    background: "none",
                    border: "none",
                    borderBottom: activeCat === cat.id ? "2px solid #8b3a2a" : "2px solid transparent",
                    color: activeCat === cat.id ? "#8b3a2a" : "#b8907a",
                    cursor: "pointer",
                    fontFamily: "DM Sans",
                    fontSize: 13,
                    fontWeight: 700,
                    flexShrink: 0,
                    transition: "color 0.2s, border-color 0.2s",
                    letterSpacing: "0.02em",
                    textTransform: "uppercase",
                    whiteSpace: "nowrap",
                    height: 44,
                    display: "flex",
                    alignItems: "center",
                  }}
                >
                  {localized(cat, "name", lang)}
                </button>
              ))}
            </div>

            <div style={{ flex: 1, overflowY: "auto", paddingBottom: orderingOn ? 120 : 80 }}>
              {grouped.map(({ cat, items: catItems }) => (
                <div key={cat.id} id={`cat-${cat.id}`} style={{ scrollMarginTop: "100px" }}>
                  <div
                    style={{
                      padding: "20px 16px 10px",
                      borderBottom: "1px solid #e8d5c8",
                      background: "transparent",
                      display: "flex",
                      alignItems: "center",
                      gap: 8,
                    }}
                  >
                    <span
                      style={{
                        fontFamily: "DM Sans",
                        fontSize: 15,
                        fontWeight: 800,
                        color: "#3d1c12",
                        textTransform: "uppercase",
                        letterSpacing: "0.04em",
                      }}
                    >
                      {cat.icon} {localized(cat, "name", lang)}
                    </span>
                    <span style={{ fontSize: 11, color: "#b8907a", fontFamily: "DM Mono" }}>
                      ({catItems.length})
                    </span>
                  </div>
                  {catItems.map((item) => (
                    <ItemRow key={item.id} item={item} orderingOn={orderingOn} addedId={addedId} onAdd={addToCart} onOpen={setSelectedItem} lang={lang} />
                  ))}
                </div>
              ))}
            </div>
          </>
        )}

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

      {!orderingOn && view === "menu" && (
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
          lang={lang}
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
          lang={lang}
        />
      )}
      {showInfo && (
        <div style={{ position:"fixed", inset:0, zIndex:300 }}>
          <div style={{ position:"absolute", inset:0, background:"rgba(61,28,18,0.4)" }} onClick={() => setShowInfo(false)} />
          <div className="info-sidebar-panel" style={{ position:"absolute", top:0, left:0, width:"85%", maxWidth:340, height:"100%", background:"#fff", overflowY:"auto", display:"flex", flexDirection:"column", boxShadow:"4px 0 24px rgba(61,28,18,0.08)" }}>
            <div style={{ display:"flex", justifyContent:"flex-end", padding:"16px 16px 0" }}>
              <button type="button" onClick={() => setShowInfo(false)}
                style={{ background:"#f7efe8", border:"none", borderRadius:"50%", width:32, height:32, cursor:"pointer", fontSize:16, color:"#7a4f3a", display:"flex", alignItems:"center", justifyContent:"center" }}>✕</button>
            </div>

            <div style={{ padding:"8px 0 4px 20px", fontSize:12, color:"#b8907a", fontFamily:"DM Mono, monospace", letterSpacing:"0.08em" }}>{t.contactLabel}</div>
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
                <div style={{ padding:"16px 0 4px 20px", fontSize:12, color:"#b8907a", fontFamily:"DM Mono, monospace", letterSpacing:"0.08em" }}>{t.socialLabel}</div>
                <a href={`https://instagram.com/${String(restaurant.instagram).replace("@", "")}`} target="_blank" rel="noopener noreferrer"
                  style={{ display:"flex", alignItems:"center", gap:14, padding:"14px 20px", borderBottom:"1px solid #f5f0ea", textDecoration:"none" }}>
                  <span style={{ fontSize:20 }}>📸</span>
                  <span style={{ flex:1, fontSize:14, color:"#3d1c12" }}>{t.instagramLabel}</span>
                  <span style={{ color:"#b8907a", fontSize:16 }}>→</span>
                </a>
              </>
            )}

            <div style={{ margin:"24px 20px 0", padding:"16px", background:"#f7efe8", borderRadius:12, fontSize:13, color:"#7a4f3a", fontFamily:"DM Mono, monospace", textAlign:"center" }}>
              {t.serviceChargeVal}
            </div>
          </div>
        </div>
      )}
      </div>
    </div>
  );
}