"use client";
  import { useState, useRef, useEffect, useCallback } from "react";
  import { createClient } from "@supabase/supabase-js";

  /* ─────────────── SUPABASE ─────────────── */
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || "";
  const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "";
  const supabase = supabaseUrl && supabaseKey ? createClient(supabaseUrl, supabaseKey) : null;

  /* ─────────────── PARSERS ─────────────── */
  function parseItems(text) {
    const items = [];
    const regex = /ITEM_START\s+NAME:\s*(.+?)\s*\nBRAND:\s*(.+?)\s*\nPRICE:\s*(.+?)\s*\nDESCRIPTION:\s*([\s\S]+?)\nCATEG
  ORY:\s*(.+?)\s*\nURL:\s*(.+?)\s*\nIMAGE:\s*(.*?)\s*\nITEM_END/g;
    let m;
    while ((m = regex.exec(text)) !== null) {
      items.push({
        name: m[1].trim(), brand: m[2].trim(), price: m[3].trim(),
        description: m[4].trim(), category: m[5].trim().toLowerCase(),
        url: m[6].trim(), image: m[7].trim(),
        id: Math.random().toString(36).slice(2, 9),
      });
    }
    const cleaned = text.replace(/ITEM_START[\s\S]*?ITEM_END/g, "").replace(/\n{3,}/g, "\n\n").trim();
    return { items, conversationalText: cleaned };
  }


  /* ─────────────── THEMES ─────────────── */
  const DARK = {
    key: "dark", bg: "#0C0708", bgWarm: "#100A0C", surface: "#1A1012", surfaceHover: "#221518",
    card: "#160E10", border: "#2E1E22", borderLight: "#3D2A30",
    bordeaux: "#8B2942", bordeauxLight: "#A83255", bordeauxDeep: "#6B1E32",
    bordeauxGlow: "#C23B60", gold: "#D4A86A", goldMuted: "#B8925A", goldDim: "#8A6E42",
    cream: "#F2E8DA", textPrimary: "#EDE2D4", textSecondary: "#A09486",
    textDim: "#6E6258", textFaint: "#3A302C",
    userBubble: "linear-gradient(135deg, #8B2942, #6B1E32)",
    userBubbleBorder: "rgba(168,50,85,0.25)", userBubbleShadow: "rgba(139,41,66,0.3)",
    userBubbleText: "#F2E8DA", scrollThumb: "rgba(139,41,66,0.4)", inputBg: "#1A1012",
  };
  const LIGHT = {
    key: "light", bg: "#FAF5F0", bgWarm: "#F5EEEA", surface: "#FFFFFF", surfaceHover: "#FDF8F5",
    card: "#FFFFFF", border: "#E8DDD5", borderLight: "#D8C8BE",
    bordeaux: "#8B2942", bordeauxLight: "#A83255", bordeauxDeep: "#6B1E32",
    bordeauxGlow: "#C23B60", gold: "#A07838", goldMuted: "#8B6A35", goldDim: "#A08050",
    cream: "#FFFFFF", textPrimary: "#1A0E10", textSecondary: "#6B5D55",
    textDim: "#9C8E84", textFaint: "#D8CCC4",
    userBubble: "linear-gradient(135deg, #8B2942, #A83255)",
    userBubbleBorder: "rgba(168,50,85,0.2)", userBubbleShadow: "rgba(139,41,66,0.18)",
    userBubbleText: "#FFFFFF", scrollThumb: "rgba(139,41,66,0.2)", inputBg: "#FFFFFF",
  };
  const ACCENTS_D = ["#8B2942", "#D4A86A", "#A83255", "#B8925A", "#722238", "#C07878"];
  const ACCENTS_L = ["#8B2942", "#A07838", "#A83255", "#8B6A35", "#722238", "#B06060"];
  const FEED_FILTERS = ["All", "Tops", "Bottoms", "Dresses", "Outerwear", "Shoes", "Accessories"];

  /* ─────────────── API ─────────────── */
  async function callChat(messages) {
    const res = await fetch("/api/chat", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ messages }),
    });
    const data = await res.json();
    if (data.error) throw new Error(data.error);
    return data.text || "Something went wrong — try again?";
  }

  /* ─────────────── AUTH SCREEN ─────────────── */
  function AuthScreen({ onAuth, C }) {
    const [isLogin, setIsLogin] = useState(true);
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");
    const [success, setSuccess] = useState("");

    const handleSubmit = async () => {
      if (!email || !password) { setError("Please fill in all fields"); return; }
      if (password.length < 6) { setError("Password must be at least 6 characters"); return; }
      setLoading(true); setError(""); setSuccess("");
      try {
        if (!supabase) { setError("Auth not configured"); setLoading(false); return; }
        if (isLogin) {
          const { data, error: err } = await supabase.auth.signInWithPassword({ email, password });
          if (err) throw err;
          onAuth(data.user);
        } else {
          const { data, error: err } = await supabase.auth.signUp({ email, password });
          if (err) throw err;
          if (data.user?.identities?.length === 0) {
            setError("An account with this email already exists");
          } else {
            setSuccess("Account created! Check your email to confirm, then log in.");
            setIsLogin(true);
          }
        }
      } catch (err) {
        setError(err.message || "Something went wrong");
      }
      setLoading(false);
    };

    return (
      <div style={{
        width: "100%", height: "100vh", background: C.bg,
        display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center",
        fontFamily: "'DM Sans', sans-serif", padding: 24, position: "relative", overflow: "hidden",
      }}>
        <div style={{ position: "absolute", width: 400, height: 400, borderRadius: "50%", background: 
  `radial-gradient(circle, ${C.bordeaux}0C 0%, transparent 65%)`, filter: "blur(60px)", pointerEvents: "none" }} />
        <div style={{ position: "absolute", width: 250, height: 250, borderRadius: "50%", top: "20%", right: "10%",
  background: `radial-gradient(circle, ${C.gold}08 0%, transparent 65%)`, filter: "blur(40px)", pointerEvents: "none" }}
   />
        <div style={{ position: "relative", width: "100%", maxWidth: 360, textAlign: "center" }}>
          <div style={{ width: 56, height: 56, borderRadius: 14, margin: "0 auto 16px", background: 
  `linear-gradient(145deg, ${C.bordeaux}, ${C.bordeauxDeep})`, display: "flex", alignItems: "center", justifyContent: 
  "center", boxShadow: `0 6px 24px ${C.bordeaux}35` }}>
            <span style={{ fontFamily: "'Instrument Serif', serif", fontSize: 30, color: "#F2E8DA" }}>H</span>
          </div>
          <div style={{ fontFamily: "'Instrument Serif', serif", fontSize: 34, color: C.textPrimary, marginBottom: 4 
  }}>Hunt<span style={{ color: C.bordeauxLight }}>Fit</span></div>
          <div style={{ fontSize: 12, color: C.goldDim, fontWeight: 600, letterSpacing: "0.2em", textTransform: 
  "uppercase", marginBottom: 32 }}>Curated Style</div>
          <div style={{ background: C.surface, border: `1px solid ${C.border}`, borderRadius: 16, padding: 24,
  textAlign: "left" }}>
            <div style={{ fontSize: 18, fontWeight: 600, color: C.textPrimary, marginBottom: 20 }}>{isLogin ? "Welcome
  back" : "Create account"}</div>
            {error && <div style={{ background: `${C.bordeaux}15`, border: `1px solid ${C.bordeaux}30`, borderRadius: 8,
   padding: "10px 14px", marginBottom: 16, fontSize: 13, color: C.bordeauxLight }}>{error}</div>}
            {success && <div style={{ background: "#6B9B6B15", border: "1px solid #6B9B6B30", borderRadius: 8, padding: 
  "10px 14px", marginBottom: 16, fontSize: 13, color: "#6B9B6B" }}>{success}</div>}
            <div style={{ marginBottom: 14 }}>
              <div style={{ fontSize: 12, fontWeight: 600, color: C.textDim, marginBottom: 6, letterSpacing: "0.05em"
  }}>EMAIL</div>
              <input type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="your@email.com"
  onKeyDown={e => e.key === "Enter" && handleSubmit()} style={{ width: "100%", padding: "12px 14px", borderRadius: 10,
  border: `1px solid ${C.border}`, background: C.bg, color: C.textPrimary, fontSize: 14, fontFamily: "'DM Sans',
  sans-serif", outline: "none", transition: "border-color 0.3s" }} />
            </div>
            <div style={{ marginBottom: 20 }}>
              <div style={{ fontSize: 12, fontWeight: 600, color: C.textDim, marginBottom: 6, letterSpacing: "0.05em"
  }}>PASSWORD</div>
              <input type="password" value={password} onChange={e => setPassword(e.target.value)} placeholder="At least
  6 characters" onKeyDown={e => e.key === "Enter" && handleSubmit()} style={{ width: "100%", padding: "12px 14px",
  borderRadius: 10, border: `1px solid ${C.border}`, background: C.bg, color: C.textPrimary, fontSize: 14, fontFamily:
  "'DM Sans', sans-serif", outline: "none" }} />
            </div>
            <button onClick={handleSubmit} disabled={loading} style={{ width: "100%", padding: "13px 0", borderRadius: 
  10, border: "none", background: `linear-gradient(135deg, ${C.bordeaux}, ${C.bordeauxDeep})`, color: "#F2E8DA",
  fontSize: 15, fontWeight: 600, cursor: loading ? "default" : "pointer", fontFamily: "'DM Sans', sans-serif", opacity: 
  loading ? 0.6 : 1, boxShadow: `0 4px 18px ${C.bordeaux}30`, transition: "opacity 0.3s" }}>
              {loading ? "Please wait..." : isLogin ? "Sign in" : "Create account"}
            </button>
            <div style={{ textAlign: "center", marginTop: 16, fontSize: 13, color: C.textDim }}>
              {isLogin ? "Don't have an account?" : "Already have an account?"}{" "}
              <span onClick={() => { setIsLogin(!isLogin); setError(""); setSuccess(""); }} style={{ color:
  C.bordeauxLight, cursor: "pointer", fontWeight: 600 }}>{isLogin ? "Sign up" : "Sign in"}</span>
            </div>
          </div>
        </div>
      </div>
    );
  }

  /* ─────────────── SMALL COMPONENTS ─────────────── */
  function TypingDots({ C }) {
    return (
      <div style={{ display: "flex", gap: 8, padding: "6px 0", alignItems: "center" }}>
        {[0, 1, 2].map(i => (
          <div key={i} style={{ width: 5, height: 5, borderRadius: "50%", background: C.bordeauxLight, animation: 
  `breathe 1.6s ease-in-out ${i * 0.2}s infinite` }} />
        ))}
      </div>
    );
  }

  function ThemeToggle({ isDark, onToggle, C }) {
    return (
      <button onClick={onToggle} style={{ width: 52, height: 28, borderRadius: 14, border: `1px solid ${C.border}`,
  background: isDark ? C.surface : C.border, cursor: "pointer", position: "relative", transition: "all 0.4s ease",
  flexShrink: 0, padding: 0 }}>
        <div style={{ width: 22, height: 22, borderRadius: "50%", background: isDark ? `linear-gradient(135deg,
  ${C.bordeaux}, ${C.bordeauxDeep})` : `linear-gradient(135deg, ${C.gold}, #D4B080)`, position: "absolute", top: 2,
  left: isDark ? 3 : 26, transition: "all 0.4s cubic-bezier(0.68,-0.55,0.27,1.55)", boxShadow: isDark ? `0 2px 8px 
  ${C.bordeaux}50` : `0 2px 8px ${C.gold}40`, display: "flex", alignItems: "center", justifyContent: "center" }}>
          {isDark ? (
            <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="#F2E8DA" strokeWidth="2.5"><path d="M21
  12.79A9 9 0 1111.21 3 7 7 0 0021 12.79z"/></svg>
          ) : (
            <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="#FFF" strokeWidth="2.5"><circle cx="12" 
  cy="12" r="5"/><path d="M12 1v2M12 21v2M4.22 4.22l1.42 1.42M18.36 18.36l1.42 1.42M1 12h2M21 12h2M4.22
  19.78l1.42-1.42M18.36 5.64l1.42-1.42"/></svg>
          )}
        </div>
      </button>
    );
  }

  /* ─────────────── ITEM CARD ─────────────── */
  function ItemCard({ item, index, variant = "chat", C, accents }) {
    const [hovered, setHovered] = useState(false);
    const accent = accents[index % accents.length];
    const isFeed = variant === "feed";
    const isDark = C.key === "dark";
    return (
      <a href={item.url} target="_blank" rel="noopener noreferrer"
        onMouseEnter={() => setHovered(true)} onMouseLeave={() => setHovered(false)}
        style={{ display: "block", textDecoration: "none", color: "inherit", background: C.card, border: `1px solid
  ${hovered ? C.borderLight : C.border}`, borderRadius: isFeed ? 10 : 8, padding: isFeed ? 0 : "16px 18px", marginTop:
  isFeed ? 0 : 12, overflow: "hidden", transition: "all 0.4s cubic-bezier(0.25,0.1,0.25,1)", transform: hovered ?
  "translateY(-2px)" : "none", boxShadow: hovered ? `0 14px 44px rgba(139,41,66,0.12)` : `0 2px 10px rgba(0,0,0,${isDark
   ? '0.2' : '0.06'})` }}>
        {isFeed && (
          <div style={{ height: 130, position: "relative", overflow: "hidden", background: isDark ?
  `linear-gradient(160deg, ${C.bordeaux}14, ${C.bg})` : `linear-gradient(160deg, ${C.bordeaux}0A, ${C.bg})` }}>
            {item.image ? (
              <img src={item.image} alt={item.name} style={{ width: "100%", height: "100%", objectFit: "cover", opacity:
   0.85 }} onError={e => { e.currentTarget.style.display = "none"; }} />
            ) : (
              <div style={{ position: "absolute", inset: 0, opacity: isDark ? 0.08 : 0.05, background: 
  `radial-gradient(ellipse at 20% 30%, ${C.bordeauxGlow} 0%, transparent 55%), radial-gradient(ellipse at 80% 70%,
  ${C.gold} 0%, transparent 50%)` }} />
            )}
            <div style={{ position: "absolute", bottom: 12, left: 14, background: `linear-gradient(135deg,
  ${C.bordeaux}, ${C.bordeauxDeep})`, padding: "5px 14px", borderRadius: 5, fontFamily: "'DM Sans', sans-serif",
  fontSize: 13, fontWeight: 600, color: "#F2E8DA", boxShadow: `0 2px 10px ${C.bordeaux}40` }}>{item.price}</div>
            <div style={{ position: "absolute", top: 10, right: 10, width: 28, height: 28, borderRadius: "50%",
  background: hovered ? `${C.bordeaux}20` : `${C.bg}50`, border: `1px solid ${hovered ? C.bordeauxLight : C.border}`,
  display: "flex", alignItems: "center", justifyContent: "center", transition: "all 0.3s" }}>
              <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke={hovered ? C.bordeauxLight : C.textDim}
   strokeWidth="2.5"><path d="M7 17L17 7M17 7H7M17 7V17"/></svg>
            </div>
          </div>
        )}
        <div style={{ padding: isFeed ? "14px 14px 16px" : 0 }}>
          <div style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 10.5, fontWeight: 600, color: accent,
  letterSpacing: "0.16em", textTransform: "uppercase", marginBottom: 6 }}>{item.brand}</div>
          <div style={{ fontFamily: "'Instrument Serif', Georgia, serif", fontSize: isFeed ? 15 : 16, color: 
  C.textPrimary, lineHeight: 1.35, marginBottom: 8, display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: 
  "vertical", overflow: "hidden" }}>{item.name}</div>
          <div style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 12.5, color: C.textSecondary, lineHeight: 1.6,
  display: "-webkit-box", WebkitLineClamp: isFeed ? 2 : 3, WebkitBoxOrient: "vertical", overflow: "hidden"
  }}>{item.description}</div>
          {!isFeed && (
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: 14,
  paddingTop: 12, borderTop: `1px solid ${C.border}` }}>
              <span style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 15, fontWeight: 600, color: C.gold 
  }}>{item.price}</span>
              <span style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 11, fontWeight: 500, color: hovered ?
  C.bordeauxLight : C.textDim, letterSpacing: "0.1em", textTransform: "uppercase", transition: "color 0.3s", display: 
  "flex", alignItems: "center", gap: 5 }}>
                View <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" 
  strokeWidth="2.5"><path d="M7 17L17 7M17 7H7M17 7V17"/></svg>
              </span>
            </div>
          )}
        </div>
      </a>
    );
  }

  /* ─────────────── MESSAGE BUBBLE ─────────────── */
  function MessageBubble({ message, C }) {
    const isUser = message.role === "user";
    const { items, conversationalText } = isUser ? { items: [], conversationalText: message.content } :
  parseItems(message.content);
    const accents = C.key === "dark" ? ACCENTS_D : ACCENTS_L;
    return (
      <div style={{ display: "flex", justifyContent: isUser ? "flex-end" : "flex-start", marginBottom: 18, animation: 
  "fadeUp 0.4s ease-out" }}>
        {!isUser && (
          <div style={{ width: 34, height: 34, borderRadius: "50%", flexShrink: 0, marginRight: 10, marginTop: 2,
  background: `linear-gradient(145deg, ${C.bordeaux}, ${C.bordeauxDeep})`, display: "flex", alignItems: "center",
  justifyContent: "center", border: `1px solid ${C.bordeauxLight}30`, boxShadow: `0 3px 14px ${C.bordeaux}30` }}>
            <span style={{ fontFamily: "'Instrument Serif', serif", fontSize: 16, color: "#F2E8DA" }}>H</span>
          </div>
        )}
        <div style={{ maxWidth: isUser ? "72%" : "84%", background: isUser ? C.userBubble : C.surface, color: isUser ?
  C.userBubbleText : C.textPrimary, padding: isUser ? "11px 18px" : "15px 18px", borderRadius: isUser ? "20px 20px 4px 
  20px" : "20px 20px 20px 4px", fontFamily: "'DM Sans', sans-serif", fontSize: 14, lineHeight: 1.65, border: isUser ?
  `1px solid ${C.userBubbleBorder}` : `1px solid ${C.border}`, fontWeight: isUser ? 500 : 400, boxShadow: isUser ? `0 
  4px 20px ${C.userBubbleShadow}` : "none" }}>
          {conversationalText && <div style={{ whiteSpace: "pre-wrap" }}>{conversationalText}</div>}
          {items.length > 0 && (
            <div style={{ marginTop: conversationalText ? 14 : 0 }}>
              {items.map((item, i) => <ItemCard key={i} item={item} index={i} variant="chat" C={C} accents={accents} 
  />)}
            </div>
          )}
        </div>
      </div>
    );
  }

  /* ─────────────── MAIN APP ─────────────── */
  export default function HuntFit() {
    const [user, setUser] = useState(null);
    const [authLoading, setAuthLoading] = useState(true);
    const [isDark, setIsDark] = useState(true);
    const [tab, setTab] = useState("chat");
    const [messages, setMessages] = useState([]);
    const [feedItems, setFeedItems] = useState([]);
    const [feedFilter, setFeedFilter] = useState("All");
    const [input, setInput] = useState("");
    const [loading, setLoading] = useState(false);
    const [feedLoading, setFeedLoading] = useState(false);
    const scrollRef = useRef(null);

    const C = isDark ? DARK : LIGHT;
    const accents = isDark ? ACCENTS_D : ACCENTS_L;

    useEffect(() => {
      if (!supabase) { setAuthLoading(false); return; }
      supabase.auth.getSession().then(({ data: { session } }) => {
        setUser(session?.user || null);
        setAuthLoading(false);
      });
      const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
        setUser(session?.user || null);
      });
      return () => subscription.unsubscribe();
    }, []);

    useEffect(() => {
      if (!user || !supabase) return;
      supabase.from("user_collections").select("items").eq("user_id", user.id).single()
        .then(({ data }) => { if (data?.items) setFeedItems(data.items); });
    }, [user]);

    useEffect(() => {
      if (!user || !supabase || feedItems.length === 0) return;
      const timeout = setTimeout(() => {
        supabase.from("user_collections").upsert({ user_id: user.id, items: feedItems, updated_at: new
  Date().toISOString() }, { onConflict: "user_id" });
      }, 1000);
      return () => clearTimeout(timeout);
    }, [feedItems, user]);

    useEffect(() => {
      if (scrollRef.current) scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }, [messages, loading]);

    useEffect(() => {
      const all = [...feedItems];
      messages.filter(m => m.role === "assistant").forEach(m => {
        const { items } = parseItems(m.content);
        items.forEach(item => {
          if (!all.find(x => x.name === item.name && x.brand === item.brand)) all.push(item);
        });
      });
      if (all.length !== feedItems.length) setFeedItems(all);
    }, [messages]);

    const handleLogout = async () => {
      if (supabase) await supabase.auth.signOut();
      setUser(null); setMessages([]); setFeedItems([]);
    };

    const refreshFeed = useCallback(async () => {
      if (feedItems.length === 0) return;
      setFeedLoading(true);
      const cats = [...new Set(feedItems.map(i => i.category))];
      try {
        const text = await callChat([{ role: "user", content: `Find more refined ${cats.join(", ")} pieces. Clean
  aesthetic, quality materials, good value.` }]);
        const { items } = parseItems(text);
        setFeedItems(prev => {
          const combined = [...prev];
          items.forEach(item => { if (!combined.find(x => x.name === item.name)) combined.push(item); });
          return combined;
        });
      } catch (e) { console.error(e); }
      finally { setFeedLoading(false); }
    }, [feedItems]);

    const sendMessage = useCallback(async (text) => {
      const msg = text.trim();
      if (!msg || loading) return;
      setInput("");
      const newMsgs = [...messages, { role: "user", content: msg }];
      setMessages(newMsgs);
      setLoading(true);
      try {
        const reply = await callChat(newMsgs.map(m => ({ role: m.role, content: m.content })));
        setMessages(prev => [...prev, { role: "assistant", content: reply }]);
      } catch (e) {
        setMessages(prev => [...prev, { role: "assistant", content: "Connection issue — please try again." }]);
      } finally { setLoading(false); }
    }, [messages, loading]);

    const filteredFeed = feedFilter === "All" ? feedItems : feedItems.filter(i => i.category ===
  feedFilter.toLowerCase());

    const QUICK = [
      "Minimal outerwear, size M, under €200",
      "Clean tailored trousers for everyday",
      "Elevated basics — neutral tones",
      "Quality leather accessories under €150",
    ];

    if (authLoading) {
      return (
        <div style={{ width: "100%", height: "100vh", background: DARK.bg, display: "flex", alignItems: "center",
  justifyContent: "center" }}>
          <div style={{ fontFamily: "'Instrument Serif', serif", fontSize: 28, color: DARK.textPrimary }}>
            Hunt<span style={{ color: DARK.bordeauxLight }}>Fit</span>
          </div>
        </div>
      );
    }

    if (!user) {
      return (
        <>
          <style>{`
            @import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@300;400;500;600;700&family=Instrument+Ser
  if:ital@0;1&display=swap');
            input:focus { border-color: #8B2942 !important; }
          `}</style>
          <AuthScreen onAuth={setUser} C={isDark ? DARK : LIGHT} />
        </>
      );
    }

    return (
      <div style={{ width: "100%", height: "100vh", background: C.bg, display: "flex", flexDirection: "column",
  overflow: "hidden", fontFamily: "'DM Sans', sans-serif", transition: "background 0.5s ease" }}>
        <style>{`
          @keyframes breathe{0%,100%{opacity:.25;transform:scale(1)}50%{opacity:.8;transform:scale(1.15)}}
          @keyframes fadeUp{from{opacity:0;transform:translateY(10px)}to{opacity:1;transform:translateY(0)}}
          @keyframes spin{to{transform:rotate(360deg)}}
          @keyframes softGlow{0%,100%{opacity:0.06}50%{opacity:0.1}}
          ::-webkit-scrollbar{width:3px}::-webkit-scrollbar-track{background:transparent}
          ::-webkit-scrollbar-thumb{background:${C.scrollThumb};border-radius:10px}
          textarea:focus,button:focus{outline:none}
        `}</style>

        {/* HEADER */}
        <div style={{ padding: "18px 20px 0", flexShrink: 0, background: C.bgWarm, borderBottom: `1px solid 
  ${C.border}`, position: "relative", overflow: "hidden", transition: "all 0.5s ease" }}>
          {isDark && <div style={{ position: "absolute", top: -40, right: -40, width: 180, height: 180, borderRadius: 
  "50%", pointerEvents: "none", background: `radial-gradient(circle, ${C.bordeaux}12 0%, transparent 65%)`, animation: 
  "softGlow 6s ease-in-out infinite" }} />}
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 18,
  position: "relative" }}>
            <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
              <div style={{ width: 40, height: 40, borderRadius: 8, background: `linear-gradient(145deg, ${C.bordeaux},
  ${C.bordeauxDeep})`, display: "flex", alignItems: "center", justifyContent: "center", boxShadow: `0 4px 18px 
  ${C.bordeaux}30`, border: `1px solid ${C.bordeauxLight}20` }}>
                <span style={{ fontFamily: "'Instrument Serif', serif", fontSize: 22, color: "#F2E8DA" }}>H</span>
              </div>
              <div>
                <div style={{ fontFamily: "'Instrument Serif', serif", fontSize: 26, color: C.textPrimary,
  letterSpacing: "-0.01em", transition: "color 0.5s" }}>Hunt<span style={{ color: C.bordeauxLight }}>Fit</span></div>
                <div style={{ fontSize: 9.5, color: C.goldDim, fontWeight: 600, letterSpacing: "0.22em", textTransform: 
  "uppercase", marginTop: -1 }}>Curated Style</div>
              </div>
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
              <ThemeToggle isDark={isDark} onToggle={() => setIsDark(!isDark)} C={C} />
              <button onClick={handleLogout} style={{ background: C.surface, border: `1px solid ${C.border}`,
  borderRadius: 8, padding: "6px 12px", fontSize: 11, color: C.textDim, cursor: "pointer", fontFamily: "'DM Sans',
  sans-serif", fontWeight: 600, transition: "all 0.3s" }}>Sign out</button>
            </div>
          </div>
          <div style={{ display: "flex", gap: 32, paddingLeft: 2 }}>
            {[{ id: "chat", label: "Chat" }, { id: "feed", label: "Collection", badge: feedItems.length || null }].map(t
   => (
              <button key={t.id} onClick={() => setTab(t.id)} style={{ background: "none", border: "none", cursor:
  "pointer", padding: "0 0 14px", color: tab === t.id ? C.textPrimary : C.textDim, fontSize: 14, fontWeight: tab ===
  t.id ? 600 : 400, fontFamily: "'DM Sans', sans-serif", borderBottom: tab === t.id ? `2px solid ${C.bordeaux}` : "2px
  solid transparent", transition: "all 0.3s", display: "flex", alignItems: "center", gap: 7 }}>
                {t.label}
                {t.badge && <span style={{ background: `${C.bordeaux}20`, color: C.bordeauxLight, fontSize: 10,
  fontWeight: 600, padding: "2px 8px", borderRadius: 10, border: `1px solid ${C.bordeaux}25` }}>{t.badge}</span>}
              </button>
            ))}
          </div>
        </div>

        {/* CHAT TAB */}
        {tab === "chat" && (
          <div style={{ flex: 1, display: "flex", flexDirection: "column", overflow: "hidden" }}>
            <div ref={scrollRef} style={{ flex: 1, overflowY: "auto", padding: "24px 18px" }}>
              {messages.length === 0 && (
                <div style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center",
  height: "100%", textAlign: "center", animation: "fadeUp 0.6s ease-out", position: "relative" }}>
                  {isDark && <div style={{ position: "absolute", width: 350, height: 350, borderRadius: "50%",
  background: `radial-gradient(circle, ${C.bordeaux}0A 0%, transparent 65%)`, filter: "blur(50px)", pointerEvents: 
  "none" }} />}
                  <div style={{ width: 40, height: 1, background: `linear-gradient(90deg, transparent,
  ${C.bordeaux}${isDark ? '' : '60'}, transparent)`, marginBottom: 24, opacity: 0.5 }} />
                  <div style={{ fontFamily: "'Instrument Serif', serif", fontSize: 38, color: C.textPrimary, lineHeight:
   1.2, marginBottom: 12, transition: "color 0.5s" }}>
                    What are you<br />
                    <span style={{ fontStyle: "italic", background: `linear-gradient(135deg, ${C.bordeauxLight},
  ${C.gold})`, WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}>looking for?</span>
                  </div>
                  <div style={{ width: 60, height: 1, background: `linear-gradient(90deg, transparent, ${C.gold}40,
  transparent)`, marginBottom: 16 }} />
                  <div style={{ fontSize: 14, color: C.textSecondary, maxWidth: 300, lineHeight: 1.65, marginBottom: 34 
  }}>Describe the style, your size and budget — I'll curate the perfect pieces for you.</div>
                  <div style={{ display: "flex", flexDirection: "column", gap: 8, width: "100%", maxWidth: 340 }}>
                    {QUICK.map((p, i) => (
                      <button key={i} onClick={() => sendMessage(p)}
                        style={{ background: C.surface, border: `1px solid ${C.border}`, borderRadius: 10, padding:
  "14px 18px", fontSize: 13.5, color: C.textSecondary, textAlign: "left", fontFamily: "'DM Sans', sans-serif", cursor:
  "pointer", transition: "all 0.35s", display: "flex", alignItems: "center", gap: 12 }}
                        onMouseEnter={e => { e.currentTarget.style.borderColor = C.bordeaux + "50";
  e.currentTarget.style.color = C.textPrimary; e.currentTarget.style.background = C.surfaceHover; }}
                        onMouseLeave={e => { e.currentTarget.style.borderColor = C.border; e.currentTarget.style.color =
   C.textSecondary; e.currentTarget.style.background = C.surface; }}
                      >
                        <div style={{ width: 6, height: 6, borderRadius: "50%", background: C.bordeaux, flexShrink: 0,
  opacity: 0.5 }} />
                        {p}
                      </button>
                    ))}
                  </div>
                </div>
              )}
              {messages.map((msg, i) => <MessageBubble key={i} message={msg} C={C} />)}
              {loading && (
                <div style={{ display: "flex", gap: 10, animation: "fadeUp 0.3s ease-out" }}>
                  <div style={{ width: 34, height: 34, borderRadius: "50%", flexShrink: 0, background: 
  `linear-gradient(145deg, ${C.bordeaux}, ${C.bordeauxDeep})`, display: "flex", alignItems: "center", justifyContent: 
  "center", border: `1px solid ${C.bordeauxLight}30`, boxShadow: `0 3px 14px ${C.bordeaux}30` }}>
                    <span style={{ fontFamily: "'Instrument Serif', serif", fontSize: 16, color: "#F2E8DA" }}>H</span>
                  </div>
                  <div style={{ background: C.surface, border: `1px solid ${C.border}`, borderRadius: "18px 18px 18px 
  4px", padding: "12px 18px" }}>
                    <div style={{ fontSize: 11, color: C.textDim, fontWeight: 500, marginBottom: 2 }}>Curating...</div>
                    <TypingDots C={C} />
                  </div>
                </div>
              )}
            </div>
            <div style={{ padding: "12px 18px 18px", borderTop: `1px solid ${C.border}`, flexShrink: 0 }}>
              <div style={{ display: "flex", gap: 10, alignItems: "flex-end", background: C.inputBg, borderRadius: 14,
  padding: "5px 5px 5px 18px", border: `1px solid ${C.border}` }}>
                <textarea value={input} onChange={e => setInput(e.target.value)}
                  onKeyDown={e => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); sendMessage(input); } }}
                  placeholder="Describe what you're looking for..." rows={1}
                  style={{ flex: 1, border: "none", background: "transparent", fontSize: 14, fontFamily: "'DM Sans',
  sans-serif", color: C.textPrimary, resize: "none", padding: "10px 0", lineHeight: 1.5 }} />
                <button onClick={() => sendMessage(input)} disabled={!input.trim() || loading} style={{ width: 42,
  height: 42, borderRadius: 12, border: "none", background: input.trim() && !loading ? `linear-gradient(135deg,
  ${C.bordeaux}, ${C.bordeauxDeep})` : C.textFaint, cursor: input.trim() && !loading ? "pointer" : "default", display:
  "flex", alignItems: "center", justifyContent: "center", transition: "all 0.3s", flexShrink: 0, boxShadow: input.trim()
   && !loading ? `0 4px 14px ${C.bordeaux}30` : "none" }}>
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke={input.trim() && !loading ?
  "#F2E8DA" : C.textDim} strokeWidth="2.5"><path d="M12 19V5M5 12l7-7 7 7"/></svg>
                </button>
              </div>
            </div>
          </div>
        )}

        {/* FEED TAB */}
        {tab === "feed" && (
          <div style={{ flex: 1, display: "flex", flexDirection: "column", overflow: "hidden" }}>
            {feedItems.length === 0 ? (
              <div style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: 
  "center", textAlign: "center", padding: 28, animation: "fadeUp 0.5s ease-out" }}>
                <div style={{ width: 60, height: 60, borderRadius: "50%", marginBottom: 18, background: 
  `${C.bordeaux}12`, border: `1px solid ${C.bordeaux}18`, display: "flex", alignItems: "center", justifyContent: 
  "center" }}>
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke={C.bordeauxLight} 
  strokeWidth="1.5"><rect x="3" y="3" width="7" height="7" rx="1.5"/><rect x="14" y="3" width="7" height="7" 
  rx="1.5"/><rect x="3" y="14" width="7" height="7" rx="1.5"/><rect x="14" y="14" width="7" height="7" rx="1.5"/></svg>
                </div>
                <div style={{ fontFamily: "'Instrument Serif', serif", fontSize: 24, color: C.textPrimary, marginBottom:
   8 }}>Your collection is empty</div>
                <div style={{ fontSize: 14, color: C.textSecondary, maxWidth: 280, lineHeight: 1.6, marginBottom: 24 
  }}>Start a conversation — every piece discovered will appear here.</div>
                <button onClick={() => setTab("chat")} style={{ background: `linear-gradient(135deg, ${C.bordeaux},
  ${C.bordeauxDeep})`, color: "#F2E8DA", border: "none", borderRadius: 10, padding: "12px 28px", fontSize: 14,
  fontWeight: 600, cursor: "pointer", fontFamily: "'DM Sans', sans-serif", boxShadow: `0 4px 18px ${C.bordeaux}30`
  }}>Start exploring</button>
              </div>
            ) : (
              <>
                <div style={{ padding: "18px 18px 0", flexShrink: 0 }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 14
   }}>
                    <div>
                      <div style={{ fontFamily: "'Instrument Serif', serif", fontSize: 22, color: C.textPrimary }}>Your
  Collection</div>
                      <div style={{ fontSize: 12, color: C.textDim, marginTop: 3, fontWeight: 500 }}>{feedItems.length}
  piece{feedItems.length !== 1 ? "s" : ""} curated</div>
                    </div>
                    <button onClick={refreshFeed} disabled={feedLoading} style={{ background: C.surface, border: `1px 
  solid ${C.bordeaux}25`, borderRadius: 10, padding: "8px 16px", fontSize: 12, color: C.bordeauxLight, cursor: 
  "pointer", fontFamily: "'DM Sans', sans-serif", fontWeight: 500, display: "flex", alignItems: "center", gap: 6,
  opacity: feedLoading ? 0.5 : 1 }}>
                      <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" 
  style={{ animation: feedLoading ? "spin 1s linear infinite" : "none" }}><path d="M23 4v6h-6M1 20v-6h6"/><path d="M3.51
   9a9 9 0 0114.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0020.49 15"/></svg>
                      {feedLoading ? "Loading..." : "Discover more"}
                    </button>
                  </div>
                  <div style={{ display: "flex", gap: 6, overflowX: "auto", paddingBottom: 14 }}>
                    {FEED_FILTERS.map(f => {
                      const count = f === "All" ? feedItems.length : feedItems.filter(i => i.category ===
  f.toLowerCase()).length;
                      if (f !== "All" && count === 0) return null;
                      const active = feedFilter === f;
                      return (
                        <button key={f} onClick={() => setFeedFilter(f)} style={{ background: active ?
  `linear-gradient(135deg, ${C.bordeaux}, ${C.bordeauxDeep})` : "transparent", color: active ? "#F2E8DA" : C.textDim,
  border: `1px solid ${active ? C.bordeaux : C.border}`, borderRadius: 20, padding: "6px 16px", fontSize: 12,
  fontWeight: active ? 600 : 400, cursor: "pointer", fontFamily: "'DM Sans', sans-serif", whiteSpace: "nowrap",
  transition: "all 0.3s", boxShadow: active ? `0 2px 10px ${C.bordeaux}20` : "none" }}>{f}</button>
                      );
                    })}
                  </div>
                </div>
                <div style={{ flex: 1, overflowY: "auto", padding: "0 18px 20px" }}>
                  {filteredFeed.length === 0 ? (
                    <div style={{ textAlign: "center", padding: 40, color: C.textDim, fontSize: 13 }}>Nothing in this
  category yet.</div>
                  ) : (
                    <div style={{ display: "grid", gridTemplateColumns: "repeat(2, 1fr)", gap: 10 }}>
                      {filteredFeed.map((item, i) => (
                        <div key={item.id || i} style={{ animation: `fadeUp 0.4s ease-out ${i * 0.05}s both` }}>
                          <ItemCard item={item} index={i} variant="feed" C={C} accents={accents} />
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </>
            )}
          </div>
        )}
      </div>
    );
  }
