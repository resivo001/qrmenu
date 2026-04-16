import { useState } from "react";

const GS = () => (
  <style>{`
    @import url('https://fonts.googleapis.com/css2?family=Cormorant+Garamond:ital,wght@0,400;0,500;0,600;0,700;1,400;1,600&family=DM+Sans:wght@300;400;500;600&display=swap');
    *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
    html, body, #root { height: 100%; }
    body { background: #faf8f4; font-family: 'DM Sans', sans-serif; -webkit-font-smoothing: antialiased; }
    ::-webkit-scrollbar { display: none; }
    @keyframes fadeUp   { from { opacity:0; transform:translateY(16px); } to { opacity:1; transform:translateY(0); } }
    @keyframes fadeIn   { from { opacity:0; } to { opacity:1; } }
    @keyframes slideUp  { from { opacity:0; transform:translateY(100%); } to { opacity:1; transform:translateY(0); } }
    .fade-up  { animation: fadeUp  0.4s cubic-bezier(0.16,1,0.3,1) both; }
    .fade-in  { animation: fadeIn  0.25s ease both; }
    .slide-up { animation: slideUp 0.4s cubic-bezier(0.16,1,0.3,1) both; }
    .item-card { transition: transform 0.15s ease; }
    .item-card:active { transform: scale(0.98); }
    .cat-btn { transition: all 0.2s ease; }
    .add-btn:active { transform: scale(0.92); }
  `}</style>
);

const RESTAURANT = { name: "The House Cafe", tagline: "Nizami St · Baku", table: 3 };

/** Demo flags — replace with API / restaurant record later */
const RESTAURANT_FEATURES = { ordering: true, payment: false };

const CATS = [
  { id:"1", name:"Starters",  icon:"🥗" },
  { id:"2", name:"Mains",     icon:"🍽️" },
  { id:"3", name:"Desserts",  icon:"🍮" },
  { id:"4", name:"Drinks",    icon:"🥂" },
];

const ITEMS = [
  { id:"1",  cat:"1", name:"Burrata & Heirloom Tomato", desc:"Creamy burrata, heirloom tomatoes, aged balsamic, micro basil",        price:18, img:"https://images.unsplash.com/photo-1607877361964-d41a1f258be2?w=600&q=80", badge:null },
  { id:"2",  cat:"1", name:"Tuna Tartare",              desc:"Yellowfin tuna, avocado mousse, sesame oil, crispy wonton",             price:24, img:"https://images.unsplash.com/photo-1534482421-64566f976cfa?w=600&q=80", badge:"Chef's Pick" },
  { id:"3",  cat:"1", name:"Foie Gras Torchon",         desc:"House-cured foie gras, brioche, fig jam, Sauternes gelée",             price:32, img:"https://images.unsplash.com/photo-1551218808-94e220e084d2?w=600&q=80", badge:null },
  { id:"4",  cat:"2", name:"Wagyu Beef Tenderloin",     desc:"A5 Wagyu, truffle jus, pomme purée, seasonal vegetables",              price:95, img:"https://images.unsplash.com/photo-1546964124-0cce460f38ef?w=600&q=80", badge:"Signature" },
  { id:"5",  cat:"2", name:"Pan-Seared Sea Bass",       desc:"Mediterranean sea bass, saffron beurre blanc, fennel, capers",         price:52, img:"https://images.unsplash.com/photo-1519708227418-c8fd9a32b7a2?w=600&q=80", badge:null },
  { id:"6",  cat:"2", name:"Rack of Lamb",              desc:"Herb-crusted lamb, merguez jus, roasted garlic, ratatouille",          price:68, img:"https://images.unsplash.com/photo-1544025162-d76694265947?w=600&q=80", badge:null },
  { id:"7",  cat:"3", name:"Chocolate Soufflé",         desc:"Valrhona dark chocolate, vanilla crème anglaise, sea salt",            price:16, img:"https://images.unsplash.com/photo-1578985545062-69928b1d9587?w=600&q=80", badge:"Must Try" },
  { id:"8",  cat:"3", name:"Crème Brûlée",              desc:"Madagascar vanilla, caramelised sugar, seasonal berries",              price:14, img:"https://images.unsplash.com/photo-1470324161839-ce2bb6fa6bc3?w=600&q=80", badge:null },
  { id:"9",  cat:"4", name:"Signature Negroni",         desc:"Gin, Campari, sweet vermouth, orange peel, smoked ice",                price:22, img:"https://images.unsplash.com/photo-1514362453360-8f94243c9996?w=600&q=80", badge:"Popular" },
  { id:"10", cat:"4", name:"Château Margaux 2018",      desc:"Bordeaux Premier Grand Cru Classé, glass",                             price:85, img:"https://images.unsplash.com/photo-1510812431401-41d2bd2722f3?w=600&q=80", badge:null },
  { id:"11", cat:"4", name:"Sparkling Elderflower",     desc:"House-made elderflower cordial, sparkling water, cucumber, mint",      price:9,  img:"https://images.unsplash.com/photo-1556679343-c7306c1976bc?w=600&q=80", badge:null },
];

const fmt = (n) => `$${Number(n).toFixed(2)}`;

function ItemSheet({ item, onClose, onAdd, orderingEnabled }) {
  const [qty, setQty] = useState(1);
  return (
    <div style={{ position:"fixed", inset:0, zIndex:200, display:"flex", flexDirection:"column", justifyContent:"flex-end" }}>
      <div style={{ position:"absolute", inset:0, background:"rgba(26,20,14,0.5)" }} onClick={onClose} className="fade-in" />
      <div className="slide-up" style={{ position:"relative", background:"#fff", borderRadius:"24px 24px 0 0", maxHeight:"88vh", overflowY:"auto", paddingBottom:32 }}>
        <div style={{ width:"100%", height:260, overflow:"hidden", position:"relative" }}>
          <img src={item.img} alt={item.name} style={{ width:"100%", height:"100%", objectFit:"cover" }} />
          <div style={{ position:"absolute", inset:0, background:"linear-gradient(to top, rgba(0,0,0,0.3) 0%, transparent 60%)" }} />
          {item.badge && (
            <div style={{ position:"absolute", top:16, left:16, background:"rgba(255,255,255,0.95)", borderRadius:20, padding:"4px 12px", fontSize:11, fontWeight:600, color:"#1a140e" }}>
              {item.badge}
            </div>
          )}
          <button onClick={onClose} style={{ position:"absolute", top:16, right:16, width:32, height:32, borderRadius:"50%", background:"rgba(255,255,255,0.9)", border:"none", cursor:"pointer", fontSize:16, display:"flex", alignItems:"center", justifyContent:"center", color:"#1a140e" }}>✕</button>
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
                <button onClick={()=>setQty(q=>Math.max(1,q-1))} style={{ width:36, height:36, borderRadius:"50%", border:"none", background:qty===1?"transparent":"#fff", cursor:"pointer", fontSize:18, fontWeight:600, color:"#1a140e", display:"flex", alignItems:"center", justifyContent:"center", boxShadow:qty===1?"none":"0 1px 4px rgba(0,0,0,0.1)" }}>−</button>
                <span style={{ width:36, textAlign:"center", fontWeight:700, fontSize:16, color:"#1a140e" }}>{qty}</span>
                <button onClick={()=>setQty(q=>q+1)} style={{ width:36, height:36, borderRadius:"50%", border:"none", background:"#1a140e", cursor:"pointer", fontSize:18, color:"#fff", display:"flex", alignItems:"center", justifyContent:"center" }}>+</button>
              </div>
              <button onClick={()=>{ onAdd(item, qty); onClose(); }}
                style={{ flex:1, background:"#1a140e", color:"#faf8f4", border:"none", borderRadius:28, padding:"15px 24px", fontSize:14, fontWeight:600, cursor:"pointer", fontFamily:"DM Sans", display:"flex", justifyContent:"space-between", alignItems:"center" }}>
                <span>Add to Order</span>
                <span style={{ fontWeight:700 }}>{fmt(item.price * qty)}</span>
              </button>
            </div>
          ) : (
            <div style={{ paddingTop:4, fontSize:13, color:"#a89880", textAlign:"center", lineHeight:1.5 }}>
              Ask your waiter to order · <span style={{ fontFamily:"Cormorant Garamond", fontSize:18, fontWeight:700, color:"#1a140e" }}>{fmt(item.price)}</span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function CartSheet({ cart, onClose, onQtyChange, paymentEnabled }) {
  const total = cart.reduce((s,i)=>s+i.price*i.qty,0);
  const [placed, setPlaced] = useState(false);

  if (placed) return (
    <div style={{ position:"fixed", inset:0, zIndex:300, display:"flex", alignItems:"center", justifyContent:"center", background:"rgba(26,20,14,0.6)" }}>
      <div className="fade-up" style={{ background:"#fff", borderRadius:24, padding:"40px 32px", textAlign:"center", margin:24, maxWidth:320 }}>
        <div style={{ fontSize:52, marginBottom:16 }}>✅</div>
        <div style={{ fontFamily:"Cormorant Garamond", fontSize:28, fontWeight:700, color:"#1a140e", marginBottom:8 }}>{paymentEnabled ? "Order Placed!" : "Sent to the team!"}</div>
        <div style={{ fontSize:14, color:"#8a7d6b", marginBottom:24, lineHeight:1.5 }}>
          {paymentEnabled
            ? "Your order has been sent to the kitchen. You can complete payment on the next step when available."
            : "Your order has been sent to the kitchen. A waiter will come to your table shortly."}
        </div>
        <div style={{ fontSize:13, color:"#a89880" }}>Table {RESTAURANT.table}</div>
      </div>
    </div>
  );

  return (
    <div style={{ position:"fixed", inset:0, zIndex:200, display:"flex", flexDirection:"column", justifyContent:"flex-end" }}>
      <div style={{ position:"absolute", inset:0, background:"rgba(26,20,14,0.5)" }} onClick={onClose} className="fade-in" />
      <div className="slide-up" style={{ position:"relative", background:"#fff", borderRadius:"24px 24px 0 0", maxHeight:"85vh", display:"flex", flexDirection:"column" }}>
        <div style={{ padding:"20px 20px 0", display:"flex", justifyContent:"space-between", alignItems:"center" }}>
          <div style={{ fontFamily:"Cormorant Garamond", fontSize:26, fontWeight:700, color:"#1a140e" }}>Your Order</div>
          <button onClick={onClose} style={{ background:"#f5f0e8", border:"none", borderRadius:"50%", width:32, height:32, cursor:"pointer", fontSize:16, display:"flex", alignItems:"center", justifyContent:"center", color:"#8a7d6b" }}>✕</button>
        </div>
        <div style={{ fontSize:12, color:"#a89880", padding:"4px 20px 16px" }}>Table {RESTAURANT.table}</div>
        <div style={{ overflowY:"auto", flex:1, padding:"0 20px" }}>
          {cart.map(item=>(
            <div key={item.id} style={{ display:"flex", alignItems:"center", gap:12, paddingBottom:16, marginBottom:16, borderBottom:"1px solid #f5f0e8" }}>
              <img src={item.img} alt="" style={{ width:52, height:52, borderRadius:12, objectFit:"cover", flexShrink:0 }} />
              <div style={{ flex:1 }}>
                <div style={{ fontSize:14, fontWeight:600, color:"#1a140e", marginBottom:4 }}>{item.name}</div>
                <div style={{ fontSize:14, fontWeight:700, color:"#1a140e" }}>{fmt(item.price)}</div>
              </div>
              <div style={{ display:"flex", alignItems:"center", background:"#f5f0e8", borderRadius:24, padding:"3px" }}>
                <button onClick={()=>onQtyChange(item.id, item.qty-1)} style={{ width:28, height:28, borderRadius:"50%", border:"none", background:item.qty===1?"transparent":"#fff", cursor:"pointer", fontSize:15, color:"#1a140e", display:"flex", alignItems:"center", justifyContent:"center" }}>
                  {item.qty===1?"🗑":"−"}
                </button>
                <span style={{ width:28, textAlign:"center", fontSize:14, fontWeight:700, color:"#1a140e" }}>{item.qty}</span>
                <button onClick={()=>onQtyChange(item.id, item.qty+1)} style={{ width:28, height:28, borderRadius:"50%", border:"none", background:"#1a140e", cursor:"pointer", fontSize:15, color:"#fff", display:"flex", alignItems:"center", justifyContent:"center" }}>+</button>
              </div>
            </div>
          ))}
        </div>
        <div style={{ padding:"16px 20px 32px", borderTop:"1px solid #f5f0e8" }}>
          <div style={{ display:"flex", justifyContent:"space-between", marginBottom:16 }}>
            <span style={{ fontSize:14, color:"#8a7d6b" }}>Total</span>
            <span style={{ fontFamily:"Cormorant Garamond", fontSize:24, fontWeight:700, color:"#1a140e" }}>{fmt(total)}</span>
          </div>
          <button onClick={()=>setPlaced(true)} style={{ width:"100%", background:"#1a140e", color:"#faf8f4", border:"none", borderRadius:28, padding:"16px", fontSize:15, fontWeight:600, cursor:"pointer", fontFamily:"DM Sans" }}>
            {paymentEnabled ? "Place Order & Pay →" : "Send Order to Waiter →"}
          </button>
          <div style={{ textAlign:"center", fontSize:12, color:"#c4b8a8", marginTop:10 }}>
            {paymentEnabled ? "Secure payment from your phone" : "A waiter will come to your table"}
          </div>
        </div>
      </div>
    </div>
  );
}

export default function CustomerMenu() {
  const [activeCat, setActiveCat] = useState("1");
  const [selectedItem, setSelectedItem] = useState(null);
  const [cart, setCart] = useState([]);
  const [showCart, setShowCart] = useState(false);
  const [addedId, setAddedId] = useState(null);

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
  const filtered  = ITEMS.filter(i=>i.cat===activeCat);
  const orderingOn = RESTAURANT_FEATURES.ordering === true;
  const paymentOn = RESTAURANT_FEATURES.payment === true;
  const bottomPad = orderingOn ? 120 : 72;

  return (
    <div style={{ maxWidth:480, margin:"0 auto", minHeight:"100vh", background:"#faf8f4", display:"flex", flexDirection:"column", position:"relative" }}>
      <GS />

      <header style={{ background:"#fff", padding:"20px 20px 0", position:"sticky", top:0, zIndex:50, boxShadow:"0 1px 0 #f0ebe4" }}>
        <div style={{ display:"flex", justifyContent:"space-between", alignItems:"flex-start", marginBottom:16 }}>
          <div>
            <div style={{ fontFamily:"Cormorant Garamond", fontSize:26, fontWeight:700, color:"#1a140e", lineHeight:1.1 }}>{RESTAURANT.name}</div>
            <div style={{ fontSize:12, color:"#a89880", marginTop:3 }}>{RESTAURANT.tagline}</div>
          </div>
          <div style={{ background:"#f5f0e8", borderRadius:20, padding:"6px 14px", fontSize:12, fontWeight:600, color:"#8a7d6b", marginTop:4 }}>
            Table {RESTAURANT.table}
          </div>
        </div>
        <div style={{ display:"flex", gap:6, overflowX:"auto", paddingBottom:16, scrollbarWidth:"none" }}>
          {CATS.map(cat=>(
            <button key={cat.id} className="cat-btn" onClick={()=>setActiveCat(cat.id)}
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
                    <button className="add-btn"
                      onClick={e=>{ e.stopPropagation(); addToCart(item); }}
                      style={{ width:34, height:34, borderRadius:"50%", border:"none", cursor:"pointer", fontSize:18, display:"flex", alignItems:"center", justifyContent:"center", transition:"all 0.15s",
                        background: addedId===item.id?"#4caf50":"#1a140e", color:"#fff" }}>
                      {addedId===item.id?"✓":"+"}
                    </button>
                    ) : <span style={{ width:34 }} aria-hidden />}
                  </div>
                </div>
                <div style={{ width:120, flexShrink:0 }}>
                  <img src={item.img} alt={item.name} style={{ width:"100%", height:"100%", objectFit:"cover", display:"block" }} />
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {orderingOn && cartCount > 0 && (
        <div style={{ position:"fixed", bottom:24, left:"50%", transform:"translateX(-50%)", width:"calc(100% - 32px)", maxWidth:448, zIndex:100 }}>
          <button onClick={()=>setShowCart(true)}
            style={{ width:"100%", background:"#1a140e", color:"#faf8f4", border:"none", borderRadius:28, padding:"16px 24px", display:"flex", alignItems:"center", justifyContent:"space-between", cursor:"pointer", fontFamily:"DM Sans", boxShadow:"0 8px 32px rgba(26,20,14,0.25)" }}>
            <div style={{ display:"flex", alignItems:"center", gap:10 }}>
              <div style={{ background:"#c9a96e", borderRadius:"50%", width:26, height:26, display:"flex", alignItems:"center", justifyContent:"center", fontSize:12, fontWeight:700, color:"#1a140e" }}>{cartCount}</div>
              <span style={{ fontSize:14, fontWeight:600 }}>View Order</span>
            </div>
            <span style={{ fontFamily:"Cormorant Garamond", fontSize:20, fontWeight:700, color:"#c9a96e" }}>{fmt(cartTotal)}</span>
          </button>
        </div>
      )}

      {!orderingOn && (
        <div style={{ position:"fixed", bottom:0, left:0, right:0, zIndex:90, display:"flex", justifyContent:"center", pointerEvents:"none" }}>
          <div style={{ maxWidth:480, width:"100%", padding:"12px 20px 20px", background:"linear-gradient(to top, rgba(250,248,244,0.98) 60%, transparent)" }}>
            <div style={{ textAlign:"center", fontSize:12, fontWeight:500, color:"#a89880", letterSpacing:"0.02em", lineHeight:1.5 }}>
              Scan to view our menu · Ask your waiter to order
            </div>
          </div>
        </div>
      )}

      {selectedItem && <ItemSheet item={selectedItem} orderingEnabled={orderingOn} onClose={()=>setSelectedItem(null)} onAdd={addToCart} />}
      {orderingOn && showCart && <CartSheet cart={cart} onClose={()=>setShowCart(false)} onQtyChange={changeQty} paymentEnabled={paymentOn} />}
    </div>
  );
}