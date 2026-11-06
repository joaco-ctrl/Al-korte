import { useCallback, useEffect, useMemo, useRef, useState } from "react";

const API = import.meta.env.VITE_API_URL || "http://localhost:3000/api";
const menu = [
  ["overview", "⌂", "Inicio"],
  ["garage", "▣", "Garaje"],
  ["shop", "◇", "Tienda"],
  ["boxes", "▧", "Cajas"],
  ["races", "⌁", "Carreras"],
  ["blacklist", "⚑", "Blacklist"],
  ["casino", "♠", "Casino"],
];
const currency = (amount) => `$${Number(amount || 0).toLocaleString("es-AR")}`;
const rarityClass = (name = "") => `rarity-${name.toLowerCase().replaceAll("é", "e")}`;
const rarities = ["Común", "Raro", "Épico", "Legendario", "Especial"];
const rouletteNumbers = [0, 32, 15, 19, 4, 21, 2, 25, 17, 34, 6, 27, 13, 36, 11, 30, 8, 23, 10, 5, 24, 16, 33, 1, 20, 14, 31, 9, 22, 18, 29, 7, 28, 12, 35, 3, 26];
const rouletteRedNumbers = new Set([1, 3, 5, 7, 9, 12, 14, 16, 18, 19, 21, 23, 25, 27, 30, 32, 34, 36]);
const rouletteColor = (number) => number === 0 ? "green" : rouletteRedNumbers.has(number) ? "red" : "black";
const rouletteSegmentAngle = 360 / rouletteNumbers.length;
const rouletteWheelGradient = `conic-gradient(${rouletteNumbers.map((number, index) => `${number === 0 ? "#17623e" : rouletteRedNumbers.has(number) ? "#9b253d" : "#16191a"} ${index * rouletteSegmentAngle}deg ${(index + 1) * rouletteSegmentAngle}deg`).join(", ")})`;
const pieceCategories = [
  { value: "escapes", label: "Escapes", terms: ["escape"] },
  { value: "induccion", label: "Inducción/Turbos", terms: ["turbo", "induccion", "forzada"] },
  { value: "admision", label: "Admisión", terms: ["admision", "filtro"] },
  { value: "electronica", label: "Electrónica/ECU", terms: ["electronica", "ecu", "repro"] },
  { value: "motor", label: "Motor", terms: ["motor", "bloque", "piston", "buj"] },
  { value: "transmision", label: "Transmisión", terms: ["transmision", "caja", "embrague"] },
  { value: "neumaticos", label: "Neumáticos", terms: ["neumatico", "rueda"] },
];
const normalizeLabel = (value = "") => value.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");

function CatalogFilters({ label, options, value, onChange }) {
  return <div className="catalog-filter">
    <span className="eyebrow">{label}</span>
    <div className="filter-pills" role="group" aria-label={label}>
      <button type="button" className={value === "all" ? "current" : ""} aria-pressed={value === "all"} onClick={() => onChange("all")}>TODAS</button>
      {options.map((option) => {
        const optionValue = typeof option === "string" ? normalizeLabel(option) : option.value;
        const optionLabel = typeof option === "string" ? option : option.label;
        return <button type="button" key={optionValue} className={value === optionValue ? "current" : ""} aria-pressed={value === optionValue} onClick={() => onChange(optionValue)}>{optionLabel}</button>;
      })}
    </div>
  </div>;
}

async function request(path, token, options = {}) {
  const response = await fetch(`${API}${path}`, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...options.headers,
    },
  });
  const body = await response.json().catch(() => ({}));
  if (!response.ok) throw new Error(body.error || "No se pudo completar la operación.");
  return body;
}

function Button({ children, variant = "", ...props }) {
  return <button className={`button ${variant}`} {...props}>{children}</button>;
}

function Stat({ label, value, icon }) {
  return <div className="stat-card"><span className="stat-icon">{icon}</span><div><span className="eyebrow">{label}</span><strong>{value}</strong></div></div>;
}

function AuthScreen({ onAuth }) {
  const [mode, setMode] = useState("login");
  const [form, setForm] = useState({ nombre: "", email: "", password: "" });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function submit(event) {
    event.preventDefault();
    setError("");
    setLoading(true);
    try {
      const body = await request(mode === "login" ? "/login" : "/registro", "", {
        method: "POST",
        body: JSON.stringify(form),
      });
      onAuth(body);
    } catch (issue) {
      setError(issue.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="auth-page">
      <div className="auth-backdrop" />
      <div className="auth-layout">
        <div className="auth-pitch">
          <div className="brand"><span className="brand-mark">AK</span><span>AL<span className="accent">-</span>KORTE</span></div>
          <p className="eyebrow">STREET RACING • EST. 1994</p>
          <h1>La calle<br /><span>te espera.</span></h1>
          <p>Armá tu máquina, ganá respeto y reclamá tu lugar en la Blacklist.</p>
          <div className="auth-visual"><span>🏎️</span><div className="speed-lines" /></div>
          <div className="auth-points"><span>01 / TUNEÁ</span><span>02 / CORRÉ</span><span>03 / DOMINÁ</span></div>
        </div>
        <form className="auth-card" onSubmit={submit}>
          <div className="eyebrow">PILOTO / ACCESO</div>
          <h2>{mode === "login" ? "Volvé a la pista" : "Creá tu piloto"}</h2>
          <p className="muted">{mode === "login" ? "La ciudad todavía se acuerda de vos." : "Tu primer auto te está esperando."}</p>
          {mode === "register" && <label>Nombre de piloto<input required minLength="2" maxLength="25" value={form.nombre} onChange={(e) => setForm({ ...form, nombre: e.target.value })} /></label>}
          <label>Email<input type="email" required autoComplete="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} /></label>
          <label>Contraseña<input type="password" required minLength="8" autoComplete={mode === "login" ? "current-password" : "new-password"} value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} /></label>
          {error && <div className="notice error">{error}</div>}
          <Button disabled={loading}>{loading ? "Cargando..." : mode === "login" ? "ENTRAR AL JUEGO ↗" : "CREAR CUENTA ↗"}</Button>
          <p className="switch-auth">{mode === "login" ? "¿Nuevo por acá?" : "¿Ya tenés cuenta?"}{" "}
            <button type="button" onClick={() => { setError(""); setMode(mode === "login" ? "register" : "login"); }}> {mode === "login" ? "Registrate" : "Iniciá sesión"}</button>
          </p>
          <div className="secure-note">● PROGRESO GUARDADO EN TU CUENTA</div>
        </form>
      </div>
    </main>
  );
}

function App() {
  const [token, setToken] = useState(() => localStorage.getItem("alkorte_token") || "");
  const [data, setData] = useState(null);
  const [page, setPage] = useState("overview");
  const [notice, setNotice] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const [race, setRace] = useState(null);
  const [raceProgress, setRaceProgress] = useState({ player: 0, rival: 0 });

  const refresh = useCallback(async (authToken = token) => {
    if (!authToken) return;
    const result = await request("/game", authToken);
    setData(result);
  }, [token]);

  useEffect(() => {
    if (!token) return;
    refresh().catch((issue) => {
      setError(issue.message);
      if (issue.message.includes("sesión")) {
        localStorage.removeItem("alkorte_token");
        setToken("");
      }
    });
  }, [token, refresh]);

  useEffect(() => {
    if (!race?.turns?.length) return undefined;
    let turn = 0;
    const timer = window.setInterval(() => {
      const tick = race.turns[turn];
      if (!tick) {
        window.clearInterval(timer);
        return;
      }
      setRaceProgress({ player: tick.player, rival: tick.rival });
      turn += 1;
      if (turn >= race.turns.length) window.clearInterval(timer);
    }, 420);
    return () => window.clearInterval(timer);
  }, [race]);

  const activeCar = useMemo(() => data?.garage?.find((car) => car.activo) || data?.garage?.[0], [data]);
  const equipped = useMemo(() => data?.inventory?.filter((piece) => piece.id_auto === activeCar?.id_auto) || [], [data, activeCar]);
  const equippedStats = useMemo(() => {
    if (!activeCar) return { HP: 0, NM: 0, Agarre: 0, PR: 0 };
    const stats = equipped.reduce((sum, item) => ({ HP: sum.HP + item.HP, NM: sum.NM + item.NM, Agarre: sum.Agarre + item.Agarre }), { HP: activeCar.HP, NM: activeCar.NM, Agarre: activeCar.Agarre });
    return { ...stats, PR: Math.round((stats.HP + stats.NM + stats.Agarre) / 3) };
  }, [activeCar, equipped]);

  async function doAction(path, options = {}, successMessage = "") {
    setBusy(true);
    setError("");
    setNotice("");
    try {
      const result = await request(path, token, options);
      if (result.garage) setData(result);
      else if (result.user?.id) setData((current) => ({ ...current, user: result.user }));
      if (successMessage) setNotice(successMessage);
      return result;
    } catch (issue) {
      setError(issue.message);
      return null;
    } finally {
      setBusy(false);
    }
  }

  function authComplete(session) {
    localStorage.setItem("alkorte_token", session.token);
    setToken(session.token);
    setData(null);
    setError("");
  }

  function logout() {
    localStorage.removeItem("alkorte_token");
    setToken("");
    setData(null);
    setPage("overview");
  }

  if (!token) return <AuthScreen onAuth={authComplete} />;
  if (!data) return <div className="loading-screen"><div className="loader" /><span>PREPARANDO LA PISTA...</span>{error && <p className="error-text">{error}</p>}</div>;

  async function raceAction(path, options = {}) {
    setRace(null);
    setRaceProgress({ player: 0, rival: 0 });
    const result = await doAction(path, { method: "POST", ...options });
    if (!result) return;
    setRace(result);
    if (result.garage) setData(result);
    else {
      try {
        await refresh();
      } catch (issue) {
        setError(issue.message);
      }
    }
    if (result.won) setNotice(result.reward ? `¡Ganaste la carrera! +${currency(result.reward)}` : `¡Victoria! ${result.recompensa || ""}`);
    else setNotice(result.recompensa || "Fin de la carrera. Volvé a intentarlo.");
  }

  const nav = [...menu, ...(data.user.rol === "admin" ? [["admin", "⚙", "Administración"]] : [])];

  return (
    <div className="app-shell">
      <aside className="sidebar">
        <div className="brand"><span className="brand-mark">AK</span><span>AL<span className="accent">-</span>KORTE</span></div>
        <div className="sidebar-label">GARAGE / 01</div>
        <nav>{nav.map(([key, icon, label]) => <button key={key} className={page === key ? "nav-link selected" : "nav-link"} onClick={() => { setPage(key); setError(""); setNotice(""); }}><span>{icon}</span>{label}{key === "blacklist" && <small>{Math.min(data.user.blacklist_nivel, 3)}/3</small>}</button>)}</nav>
        <div className="sidebar-bottom">
          <div className="rep-card"><span className="eyebrow">PILOTO</span><strong>{data.user.nombre}</strong><span>RANGO · {data.user.rol === "admin" ? "ADMIN" : `#${Math.max(1, 4 - data.user.blacklist_nivel)}`}</span></div>
          <button className="logout" onClick={logout}>↪ Cerrar sesión</button>
          <span className="version">AL-KORTE / BUILD 01.26</span>
        </div>
      </aside>
      <main className="main-panel">
        <header className="topbar">
          <div className="mobile-brand"><span className="brand-mark">AK</span> AL-KORTE</div>
          <div className="breadcrumb"><span>CALLE /</span> {nav.find(([key]) => key === page)?.[2]?.toUpperCase()}</div>
          <div className="wallets"><div className="wallet"><span>◈</span>{currency(data.user.saldo)}</div><div className="wallet tokens"><span>✦</span>{Number(data.user.fichas_casino).toLocaleString("es-AR")} <small>FICHAS</small></div></div>
        </header>
        <section className="content">
          {error && <div className="notice error">{error}<button onClick={() => setError("")}>×</button></div>}
          {notice && <div className="notice success">{notice}<button onClick={() => setNotice("")}>×</button></div>}
          {page === "overview" && <Overview data={data} car={activeCar} stats={equippedStats} onNavigate={setPage} />}
          {page === "garage" && <Garage data={data} activeCar={activeCar} stats={equippedStats} busy={busy} action={doAction} />}
          {page === "shop" && <Shop data={data} busy={busy} action={doAction} />}
          {page === "boxes" && <Boxes busy={busy} onReveal={(prize, type) => setNotice(`¡${prize.nombre} ${type === "auto" ? "se sumó al garaje" : "se sumó al inventario"}!`)} action={async (type) => { const result = await doAction("/boxes/open", { method: "POST", body: JSON.stringify({ type }) }); if (result) setData(result); return result; }} />}
          {page === "races" && <Races race={race} progress={raceProgress} busy={busy} hasCar={Boolean(activeCar)} action={() => raceAction("/races")} />}
          {page === "blacklist" && <Blacklist data={data} race={race} progress={raceProgress} busy={busy} action={() => raceAction("/blacklist/race")} />}
          {page === "casino" && <Casino data={data} busy={busy} action={doAction} />}
          {page === "admin" && data.user.rol === "admin" && <Admin data={data} token={token} />}
        </section>
      </main>
    </div>
  );
}

function PageTitle({ eyebrow, title, copy, action }) {
  return <div className="page-title"><div><span className="eyebrow">{eyebrow}</span><h1>{title}</h1>{copy && <p>{copy}</p>}</div>{action}</div>;
}

function Overview({ data, car, stats, onNavigate }) {
  const level = Math.min(data.user.blacklist_nivel, 3);
  return <div className="page">
    <PageTitle eyebrow="JUEVES, 23:40 · CENTRO" title={<>La noche es <span className="accent">tuya.</span></>} copy="Cada carrera cuenta. Cada pieza cambia el juego." action={<div className="live-pill"><i /> CIRCUITO ACTIVO</div>} />
    <div className="hero-card">
      <div className="hero-copy"><span className="eyebrow">AUTO ACTIVO / #{car?.id_auto || "--"}</span><h2>{car?.nombre || "Sin auto activo"}</h2><p>El asfalto no espera.<br />Ajustá tu línea y salí a correr.</p><Button onClick={() => onNavigate("races")}>IR A LA PISTA <span>↗</span></Button></div>
      <div className="hero-car"><div className="hero-glow" /><div className="car-number">AK / 01</div><span>🏎️</span><div className="hero-sparks">✳</div></div>
      <div className="hero-stats"><div><span>POWER SCORE</span><strong>{stats.PR}<small> PR</small></strong></div><div><span>BLACKLIST</span><strong>{String(level).padStart(2, "0")}<small> / 03</small></strong></div><div><span>VICTORIAS</span><strong>—</strong></div></div>
    </div>
    <div className="section-heading"><div><span className="eyebrow">TU PROGRESO</span><h2>Tablero de piloto</h2></div><span className="subtle">DATOS EN TIEMPO REAL</span></div>
    <div className="stats-grid">
      <Stat icon="◈" label="SALDO DISPONIBLE" value={currency(data.user.saldo)} />
      <Stat icon="✦" label="FICHAS DE CASINO" value={Number(data.user.fichas_casino).toLocaleString("es-AR")} />
      <Stat icon="▣" label="AUTOS EN GARAJE" value={String(data.garage.length).padStart(2, "0")} />
      <Stat icon="⌁" label="PIEZAS EQUIPADAS" value={String(data.inventory.filter((item) => item.id_auto).length).padStart(2, "0")} />
    </div>
    <div className="dashboard-bottom">
      <div className="panel blacklist-preview"><div className="panel-head"><div><span className="eyebrow">TU PRÓXIMO DESAFÍO</span><h3>Blacklist / Nivel {level}</h3></div><span className="danger-tag">PINK SLIP</span></div><p>Vencelo y ganá su auto. Si perdés, el tuyo se queda en la calle.</p><Button variant="outline" onClick={() => onNavigate("blacklist")}>VER RIVAL <span>→</span></Button><div className="panel-index">01 — 03</div></div>
      <div className="panel quick-panel"><span className="eyebrow">ACCESO RÁPIDO</span><h3>¿Qué sigue, piloto?</h3><div className="quick-links"><button onClick={() => onNavigate("shop")}>◇ <span>Mejorar mi auto</span><b>↗</b></button><button onClick={() => onNavigate("boxes")}>▧ <span>Abrir una caja</span><b>↗</b></button><button onClick={() => onNavigate("casino")}>♠ <span>Probar suerte</span><b>↗</b></button></div></div>
    </div>
  </div>;
}

function Garage({ data, activeCar, stats, busy, action }) {
  const equipped = data.inventory.filter((piece) => piece.id_auto === activeCar?.id_auto);
  const availablePieces = data.inventory.filter((piece) => !piece.id_auto);
  const ownedCars = data.garage;
  return <div className="page">
    <PageTitle eyebrow="COLECCIÓN / TUNING" title={<>Tu <span className="accent">garaje.</span></>} copy={`${ownedCars.length} ${ownedCars.length === 1 ? "máquina lista" : "máquinas listas"} para la calle.`} />
    {ownedCars.length === 0 ? <Empty title="Garaje vacío" copy="Conseguí un auto en la tienda o ganá uno en la Blacklist." /> : <>
      <div className="garage-layout">
        <div className="car-showcase">
          <div className="showcase-top"><span className="eyebrow">{activeCar?.activo ? "AUTO SELECCIONADO" : "TU GARAJE"}</span><span className={`rarity ${rarityClass(activeCar?.rareza)}`}>{activeCar?.rareza || "Común"}</span></div>
          <div className="showcase-art"><div className="car-orbit" /><span>🏎️</span><span className="art-label">AL / KORTE</span></div>
          <div className="showcase-name"><div><h2>{activeCar?.nombre}</h2><span>CHASIS #{String(activeCar?.id_auto).padStart(3, "0")}</span></div><div className="pr-badge"><strong>{stats.PR}</strong><span>POWER SCORE</span></div></div>
          <div className="spec-bars">{[["HP", stats.HP], ["NM", stats.NM], ["AGARRE", stats.Agarre]].map(([label, value]) => <div className="spec-row" key={label}><span>{label}</span><div className="meter"><i style={{ width: `${Math.min(100, Math.max(5, Number(value)))}%` }} /></div><b>{value}</b></div>)}</div>
          <div className="car-selector">{ownedCars.map((car) => <button key={car.cuenta_auto_id} className={car.activo ? "car-chip active" : "car-chip"} onClick={() => action(`/garage/${car.id_auto}/active`, { method: "PUT" }, `${car.nombre} está listo para correr.`)}><span>🏎</span><span>{car.nombre}</span>{car.activo && <b>ACTIVO</b>}</button>)}</div>
        </div>
        <div className="inventory-panel">
          <div className="panel-head"><div><span className="eyebrow">TUNING / EQUIPAMIENTO</span><h3>Piezas instaladas</h3></div><span className="count-badge">{equipped.length} / {data.categories.length}</span></div>
          {equipped.length ? <div className="piece-list">{equipped.map((piece) => <div className="piece-row" key={piece.cuenta_pieza_id}><span className="piece-icon">⌁</span><div className="piece-info"><strong>{piece.nombre}</strong><span>{piece.categoria} · {piece.rareza}</span></div><span className="piece-bonus">+{piece.HP} HP<br />+{piece.NM} NM</span><button aria-label={`Desequipar ${piece.nombre}`} onClick={() => action(`/inventory/${piece.cuenta_pieza_id}/equip`, { method: "DELETE" }, "Pieza guardada en el inventario.")}>−</button></div>)}</div> : <Empty title="Sin piezas equipadas" copy="Instalá piezas desde tu inventario." />}
          {availablePieces.length > 0 && <div className="equip-tools"><label>INVENTARIO<select id="piece-to-equip" defaultValue=""><option value="" disabled>Elegí una pieza</option>{availablePieces.map((piece) => <option key={piece.cuenta_pieza_id} value={piece.cuenta_pieza_id}>{piece.nombre} · {piece.categoria}</option>)}</select></label><Button variant="small" disabled={busy} onClick={() => { const id = document.getElementById("piece-to-equip").value; if (id) action("/inventory/equip", { method: "POST", body: JSON.stringify({ inventoryId: id, carId: activeCar.id_auto }) }, "Pieza instalada."); }}>EQUIPAR</Button></div>}
        </div>
      </div>
      <div className="section-heading"><div><span className="eyebrow">REPUESTOS</span><h2>Inventario de piezas</h2></div><span className="subtle">{availablePieces.length} DISPONIBLES</span></div>
      {availablePieces.length ? <div className="catalog-grid">{availablePieces.map((piece) => <article className="product-card compact-product" key={piece.cuenta_pieza_id}><span className={`rarity ${rarityClass(piece.rareza)}`}>{piece.rareza}</span><div className="product-icon">⚙</div><h3>{piece.nombre}</h3><p>{piece.categoria}</p><div className="product-stats">HP {piece.HP} · NM {piece.NM} · AG {piece.Agarre}</div><Button variant="outline small" disabled={busy} onClick={() => action("/inventory/sell", { method: "POST", body: JSON.stringify({ type: "pieza", id: piece.cuenta_pieza_id }) }, "Pieza revendida.")}>REVENDER {currency(Math.floor(piece.precio / 2))}</Button></article>)}</div> : <div className="empty-line">No tenés piezas libres. Revisá la tienda para sumar mejoras.</div>}
      {ownedCars.length > 1 && <div className="section-heading"><div><span className="eyebrow">REVENTA</span><h2>Autos que podés vender</h2></div></div>}
      {ownedCars.length > 1 && <div className="catalog-grid">{ownedCars.filter((car) => car.cuenta_auto_id !== activeCar?.cuenta_auto_id).map((car) => <article className="product-card compact-product" key={car.cuenta_auto_id}><div className="product-icon">🏎️</div><h3>{car.nombre}</h3><p>Power score {car.PR}</p><Button variant="outline small" disabled={busy} onClick={() => action("/inventory/sell", { method: "POST", body: JSON.stringify({ type: "auto", id: car.cuenta_auto_id }) }, "Auto vendido.")}>REVENDER {currency(Math.floor(car.precio / 2))}</Button></article>)}</div>}
    </>}
  </div>;
}

function Shop({ data, busy, action }) {
  const [tab, setTab] = useState("autos");
  const [rarityFilter, setRarityFilter] = useState("all");
  const [categoryFilter, setCategoryFilter] = useState("all");
  const list = (data.shop[tab] || []).filter((item) => {
    if (tab === "autos") return rarityFilter === "all" || normalizeLabel(item.rareza) === rarityFilter;
    if (categoryFilter === "all") return true;
    const category = pieceCategories.find((option) => option.value === categoryFilter);
    const normalizedCategory = normalizeLabel(item.categoria);
    return category?.terms.some((term) => normalizedCategory.includes(term));
  });
  return <div className="page"><PageTitle eyebrow="MARKET / STREET PARTS" title={<>La <span className="accent">tienda.</span></>} copy="Piezas para afinar. Máquinas para hacer historia." />
    <div className="tabs shop-tabs" role="tablist" aria-label="Secciones de la tienda"><button role="tab" aria-selected={tab === "autos"} className={tab === "autos" ? "current" : ""} onClick={() => setTab("autos")}>AUTOS <span>{data.shop.autos.length}</span></button><button role="tab" aria-selected={tab === "piezas"} className={tab === "piezas" ? "current" : ""} onClick={() => setTab("piezas")}>PIEZAS <span>{data.shop.piezas.length}</span></button></div>
    {tab === "autos"
      ? <CatalogFilters label="FILTRAR AUTOS POR RAREZA" options={rarities} value={rarityFilter} onChange={setRarityFilter} />
      : <CatalogFilters label="FILTRAR PIEZAS POR CATEGORÍA" options={pieceCategories} value={categoryFilter} onChange={setCategoryFilter} />}
    <div className="catalog-grid">{list.map((item) => {
      const owned = tab === "autos" ? data.garage.some((car) => car.id_auto === item.id) : data.inventory.some((piece) => piece.id_pieza === item.id);
      return <article className="product-card" key={item.id}><div className="product-top"><span className={`rarity ${rarityClass(item.rareza)}`}>{item.rareza}</span><span className="item-id">#{String(item.id).padStart(3, "0")}</span></div><div className="product-icon">{tab === "autos" ? "🏎️" : "⚙"}</div><h3>{item.nombre}</h3><p>{tab === "piezas" ? item.categoria : "Street machine"}</p><div className="product-stats">HP {item.HP} <i /> NM {item.NM} <i /> AG {item.Agarre}</div><div className="product-buy"><strong>{currency(item.precio)}</strong><Button variant="small" disabled={busy || owned || item.precio <= 0} onClick={() => action("/shop/buy", { method: "POST", body: JSON.stringify({ type: tab === "autos" ? "auto" : "pieza", id: item.id }) }, "Compra realizada. ¡A disfrutar!")}>{owned ? "EN TU GARAJE" : "COMPRAR"}</Button></div></article>;
    })}</div>
    {!list.length && <Empty title="No hay artículos con este filtro" copy="Probá otra rareza o categoría para ver más opciones." />}
    <div className="footer-note">Los autos comprados incluyen piezas iniciales. Todas las ventas se pagan al 50% del valor original.</div>
  </div>;
}

function Boxes({ busy, action, onReveal }) {
  const [prizeType, setPrizeType] = useState("auto");
  const [opened, setOpened] = useState(null);
  const [opening, setOpening] = useState(false);
  const [rollingPrize, setRollingPrize] = useState(null);
  const [reelSettling, setReelSettling] = useState(false);
  async function open(type) {
    setPrizeType(type);
    setOpened(null);
    setRollingPrize(null);
    setReelSettling(false);
    setOpening(true);
    const result = await action(type);
    if (result) {
      setRollingPrize(result.premio);
      window.requestAnimationFrame(() => setReelSettling(true));
      window.setTimeout(() => {
        setOpened(result.premio);
        setOpening(false);
        setRollingPrize(null);
        onReveal(result.premio, type);
      }, 1500);
    } else setOpening(false);
  }
  return <div className="page"><PageTitle eyebrow="DROP / RAREZA ALEATORIA" title={<>Cajas de <span className="accent">suerte.</span></>} copy="Una tirada. Un premio. ¿Qué te va a tocar?" />
    <div className="box-stage">{opening && rollingPrize ? <div className="marquee-viewport"><div className={`marquee-track ${reelSettling ? "settling" : ""}`}>{Array.from({ length: 9 }, (_, index) => <div className={`marquee-item ${rarityClass(["Común", "Raro", "Épico", "Legendario"][index % 4])}`} key={index}><span>{index % 2 ? "🏎️" : "⚙️"}</span><small>{["TURBO X", "STREET KIT", "DRIFT SPEC", "NIGHT RUN"][index % 4]}</small></div>)}<div className={`marquee-item winner ${rarityClass(rollingPrize.rareza)}`}><span>{prizeType === "auto" ? "🏎️" : "⚙️"}</span><small>{rollingPrize.nombre}</small></div><div className="marquee-item rarity-raro"><span>⚙️</span><small>RACING PART</small></div></div><i className="marquee-marker" /></div> : <div className={`loot-box ${opening ? "shaking" : ""}`}>{opened ? <span>{prizeType === "auto" ? "🏎️" : "⚙️"}</span> : <span>▧</span>}<i /><b /></div>}{opening && <div className="roulette-lights">● ● ● ● ● ● ● ● ● ● ● ●</div>}</div>
    {opened && <div className="prize-reveal"><span className="eyebrow">PREMIO DESBLOQUEADO</span><h2>{opened.nombre}</h2><span className={`rarity ${rarityClass(dataRarety(opened))}`}>{dataRarety(opened)}</span></div>}
    <div className="box-options"><article className="box-card"><span className="eyebrow">AUTO DROP / 01</span><div>🏎️</div><h3>Caja de autos</h3><p>Una máquina nueva para tu colección.</p><Button disabled={busy || opening} onClick={() => open("auto")}>ABRIR CAJA · $650</Button></article><article className="box-card magenta"><span className="eyebrow">PART DROP / 02</span><div>⚙️</div><h3>Caja de piezas</h3><p>Una mejora aleatoria para tu inventario.</p><Button variant="pink" disabled={busy || opening} onClick={() => open("pieza")}>ABRIR CAJA · $650</Button></article></div>
    <div className="odds"><span>PROBABILIDADES</span><div><i className="dot common" />Común <b>58%</b></div><div><i className="dot rare" />Raro <b>25%</b></div><div><i className="dot epic" />Épico <b>11%</b></div><div><i className="dot legendary" />Legendario <b>5%</b></div><div><i className="dot special" />Especial <b>1%</b></div></div>
  </div>;
}

function dataRarety(item) { return item?.rareza || "Premio"; }

function RaceTrack({ race, progress }) {
  const playerPosition = Math.min(100, Math.max(0, progress.player));
  const rivalPosition = Math.min(100, Math.max(0, progress.rival));
  return <div className="race-track"><div className="track-row"><span>YOU</span><div className="track"><i style={{ width: `${playerPosition}%` }} /><span className="track-car" style={{ left: `calc(${playerPosition}% - 18px)` }}>🏎️</span></div><b>{progress.player}%</b></div><div className="track-row rival"><span>RIVAL</span><div className="track"><i style={{ width: `${rivalPosition}%` }} /><span className="track-car" style={{ left: `calc(${rivalPosition}% - 18px)` }}>🏎️</span></div><b>{progress.rival}%</b></div>{race && <div className={`race-result ${race.won ? "won" : "lost"}`}>{race.won ? "VICTORIA" : "DERROTA"}{race.turns?.some((tick) => tick.spunOut) && <small> · Derrape detectado {race.slipRisk}% riesgo de patinar</small>}</div>}</div>;
}

function Races({ race, progress, busy, hasCar, action }) {
  const [bracket, setBracket] = useState("street");
  return <div className="page"><PageTitle eyebrow="RACE MODE / SIMULACIÓN POR TURNOS" title={<>Naciste para <span className="accent">correr.</span></>} copy="La potencia abre camino. El agarre decide si llegás." />
    <div className="race-layout"><div className="race-main panel"><div className="panel-head"><div><span className="eyebrow">CIRCUITO / AUTOPISTA SUR</span><h2>Duelo callejero</h2></div><span className="live-pill"><i /> 12 TURNS</span></div><div className="track-skyline"><span>🌃</span><span>🌆</span><span>🌃</span></div><RaceTrack race={race} progress={progress} /><div className="race-footer"><span>PR {race?.playerPR || "—"} <i>VS</i> {race?.opponentPR || "RIVAL"}</span><Button disabled={busy || !hasCar} onClick={action}>{busy ? "CORRIENDO..." : hasCar ? "CORRER AHORA ↗" : "COMPRÁ UN AUTO PARA CORRER"}</Button></div></div>
      <aside className="race-aside panel"><span className="eyebrow">CAMPEONATO</span><h3>Subí de categoría.</h3><p>Inscripción $300 · Premio al ganador $1.400.</p><label>CLASE<select value={bracket} onChange={(event) => setBracket(event.target.value)}><option value="street">Street · PR hasta 55</option><option value="pro">Pro · PR 56 a 100</option><option value="elite">Elite · PR 101+</option></select></label><Button variant="outline" disabled={busy || !hasCar} onClick={() => action("/championships/enter", { method: "POST", body: JSON.stringify({ bracket }) })}>INSCRIBIRSE →</Button></aside></div>
    <div className="race-rules"><span>⌁</span><p><strong>Ojo con el derrape.</strong> Si tu potencia supera el agarre, aumenta la posibilidad de perder un turno. Mejorá los neumáticos antes de pisar a fondo.</p></div>
  </div>;
}

function Blacklist({ data, race, progress, busy, action }) {
  const currentLevel = Number(data.user.blacklist_nivel);
  const rival = data.rivals.find((item) => item.nivel === currentLevel);
  return <div className="page"><PageTitle eyebrow="TRES NIVELES / UN SOLO CAMPEÓN" title={<>La <span className="pink-text">Blacklist.</span></>} copy="No hay reinicio. No hay segunda oportunidad para tu auto." />
    {currentLevel > 3 ? <div className="completed-card"><span>🏆</span><h2>La ciudad es tuya.</h2><p>Venciste a los tres rivales de la Blacklist.</p></div> : <div className="blacklist-layout"><div className="rival-card"><div className="rival-banner"><span className="eyebrow">BOSS / 0{currentLevel}</span><div className="rival-symbol">♛</div><span className="rival-level">NIVEL {currentLevel}</span></div><div className="rival-details"><span className="eyebrow">OBJETIVO DE LA NOCHE</span><h2>{rival?.nombre_rival || "Rival desconocido"}</h2><p>Un nombre pesado. Un auto que puede ser tuyo si ganás.</p><div className="rival-stats"><div><span>HP</span><b>{rival?.hp_rival}</b></div><div><span>NM</span><b>{rival?.nm_rival}</b></div><div><span>AGARRE</span><b>{rival?.agarre_rival}</b></div></div><div className="pinkslip-warning"><b>⚠ PINK SLIP</b><span>Si perdés, el auto activo se elimina de tu garaje.</span></div><Button variant="pink" disabled={busy || !data.garage.length} onClick={action}>{busy ? "ENFRENTAMIENTO..." : "DESAFIAR AL RIVAL ↗"}</Button></div></div>
      <div className="blacklist-progress"><span className="eyebrow">TU CAMINO</span><h3>Escalá posiciones</h3>{data.rivals.map((item) => <div className={`rival-step ${item.nivel < currentLevel ? "done" : item.nivel === currentLevel ? "active" : ""}`} key={item.nivel}><b>{item.nivel < currentLevel ? "✓" : `0${item.nivel}`}</b><div><strong>{item.nombre_rival}</strong><span>{item.nivel < currentLevel ? "DERROTADO" : item.nivel === currentLevel ? "SIGUIENTE RIVAL" : "BLOQUEADO"}</span></div><span>→</span></div>)}<p className="small-warning">La recompensa por victoria es el auto del rival. Siempre queda guardado en tu garaje.</p></div>
    </div>}
    {race && <RaceTrack race={race} progress={progress} />}
  </div>;
}

function Casino({ data, busy, action }) {
  const [view, setView] = useState("roulette");
  const [amount, setAmount] = useState(10);
  const [choice, setChoice] = useState("red");
  const [betType, setBetType] = useState("color");
  const [result, setResult] = useState(null);
  const [wheelPhase, setWheelPhase] = useState("idle");
  const [wheelRotation, setWheelRotation] = useState(0);
  const [ballRotation, setBallRotation] = useState(0);
  const [blackjack, setBlackjack] = useState(null);
  const [specialTab, setSpecialTab] = useState("autos");
  const [rarityFilter, setRarityFilter] = useState("all");
  const [categoryFilter, setCategoryFilter] = useState("all");
  const wheelRotationRef = useRef(0);
  const ballRotationRef = useRef(0);
  const spinIntervalRef = useRef(null);
  const ballIntervalRef = useRef(null);
  const spinFinishRef = useRef(null);
  const ballReturnRef = useRef(null);

  useEffect(() => () => {
    window.clearInterval(spinIntervalRef.current);
    window.clearInterval(ballIntervalRef.current);
    window.clearTimeout(spinFinishRef.current);
    window.clearTimeout(ballReturnRef.current);
  }, []);

  function updateWheelRotation(rotation) {
    wheelRotationRef.current = rotation;
    setWheelRotation(rotation);
  }

  function updateBallRotation(rotation) {
    ballRotationRef.current = rotation;
    setBallRotation(rotation);
  }

  function resetBall() {
    window.clearTimeout(ballReturnRef.current);
    setWheelPhase("returning");
    updateBallRotation(0);
    ballReturnRef.current = window.setTimeout(() => setWheelPhase("idle"), 650);
  }

  async function roulette() {
    if (wheelPhase !== "idle") return;
    window.clearTimeout(ballReturnRef.current);
    setResult(null);
    setWheelPhase("rolling");
    spinIntervalRef.current = window.setInterval(() => {
      updateWheelRotation(wheelRotationRef.current + 360);
    }, 900);
    ballIntervalRef.current = window.setInterval(() => {
      updateBallRotation(ballRotationRef.current + 36);
    }, 75);
    const body = await action("/casino/roulette", { method: "POST", body: JSON.stringify({ amount: Number(amount), choice, betType }) });
    window.clearInterval(spinIntervalRef.current);
    spinIntervalRef.current = null;
    window.clearInterval(ballIntervalRef.current);
    ballIntervalRef.current = null;
    if (!body) {
      resetBall();
      return;
    }

    const winningIndex = rouletteNumbers.indexOf(body.number);
    if (winningIndex < 0) {
      resetBall();
      return;
    }
    const pocketAngle = (winningIndex + 0.5) * rouletteSegmentAngle;
    const currentAngle = ((wheelRotationRef.current % 360) + 360) % 360;
    const alignment = (360 - ((pocketAngle + currentAngle) % 360)) % 360;
    updateWheelRotation(wheelRotationRef.current + 5 * 360 + alignment);
    const currentBallAngle = ((ballRotationRef.current % 360) + 360) % 360;
    const ballAlignment = (360 - currentBallAngle) % 360;
    updateBallRotation(ballRotationRef.current + 4 * 360 + ballAlignment);
    setWheelPhase("settling");
    spinFinishRef.current = window.setTimeout(() => {
      setWheelPhase("result");
      setResult(body);
      ballReturnRef.current = window.setTimeout(resetBall, 1800);
    }, 4300);
  }
  async function blackjackAction(actionName) {
    const body = await action("/casino/blackjack", { method: "POST", body: JSON.stringify({ action: actionName, amount: Number(amount) }) });
    if (body?.game) setBlackjack(body.resultado ? { ...body, game: { ...body.game, done: true } } : body);
  }

  const selectedBetLabel = betType === "number"
    ? `NÚMERO ${choice}`
    : betType === "dozen"
      ? `${choice === "first" ? "1.ª" : choice === "second" ? "2.ª" : "3.ª"} DOCENA`
      : betType === "column"
        ? `${choice === "first" ? "1.ª" : choice === "second" ? "2.ª" : "3.ª"} COLUMNA`
        : betType === "outside"
          ? { low: "1–18", even: "PAR", odd: "IMPAR", high: "19–36", red: "ROJO", black: "NEGRO" }[choice]
          : choice === "red" ? "ROJO" : "NEGRO";

  const items = (data.casinoStore[specialTab] || []).filter((item) => {
    if (specialTab === "autos") return rarityFilter === "all" || normalizeLabel(item.rareza) === rarityFilter;
    if (categoryFilter === "all") return true;
    const category = pieceCategories.find((option) => option.value === categoryFilter);
    const normalizedCategory = normalizeLabel(item.categoria);
    return category?.terms.some((term) => normalizedCategory.includes(term));
  });
  return <div className="page casino-page"><PageTitle eyebrow="SOLO FICHAS / NUNCA SALDO" title={<>La suerte es <span className="pink-text">un juego.</span></>} copy="Las fichas del casino no se compran con dinero: se ganan en la pista." action={<div className="token-display">✦ {Number(data.user.fichas_casino).toLocaleString("es-AR")} FICHAS</div>} />
    <nav className="casino-subnav" role="tablist" aria-label="Secciones del casino">
      {[["roulette", "Ruleta", "01"], ["blackjack", "Blackjack", "02"], ["store", "Tienda de fichas", "03"]].map(([key, label, index]) => <button key={key} type="button" role="tab" aria-selected={view === key} className={view === key ? "current" : ""} onClick={() => setView(key)}><span>{index}</span>{label}</button>)}
    </nav>
    {view === "roulette" && <section className="casino-game casino-single-game roulette-casino-game" role="tabpanel">
      <div className="game-title"><span className="eyebrow">01 / RULETA EUROPEA</span><span>37 CASILLAS · PAGO INSTANTÁNEO</span></div>
      <div className="roulette-layout">
        <div className="roulette-wheel-column">
          <div className="roulette-wheel-stage">
            <span className="roulette-pointer" aria-hidden="true">▼</span>
            <div className={`roulette-wheel ${wheelPhase}`} style={{ transform: `rotate(${wheelRotation}deg)` }}>
              <div className="roulette-wheel-track" style={{ background: rouletteWheelGradient }}>
                {rouletteNumbers.map((number, index) => {
                  const angle = (index + 0.5) * rouletteSegmentAngle;
                  return <span key={number} className={`roulette-pocket ${rouletteColor(number)}`} style={{ transform: `translate(-50%, -50%) rotate(${angle}deg) translateY(var(--pocket-offset)) rotate(${-angle}deg)` }}>{number}</span>;
                })}
                <div className="roulette-hub"><span>AL-KORTE</span><strong>{wheelPhase === "rolling" || wheelPhase === "settling" ? "· · ·" : result?.number ?? "00"}</strong><small>{result ? result.color.toUpperCase() : "EUROPEAN"}</small></div>
              </div>
            </div>
            <span className={`roulette-ball-track ${wheelPhase === "rolling" ? "moving" : wheelPhase === "settling" ? "settling" : wheelPhase === "result" ? "result" : wheelPhase === "returning" ? "returning" : ""}`} style={{ transform: `rotate(${ballRotation}deg)`, "--ball-position-y": wheelPhase === "returning" || wheelPhase === "idle" ? "50%" : "9%" }} aria-hidden="true"><i /></span>
          </div>
          <div className="roulette-wheel-caption"><span>♣</span> RULETA EUROPEA <span>0 — 36</span></div>
        </div>
        <div className="roulette-table-panel">
          <div className="roulette-table-heading">
            <div><span className="eyebrow">PAÑO DE APUESTAS</span><strong>Elegí una casilla de la mesa</strong></div>
            <label className="roulette-wager">FICHAS A APOSTAR<input type="number" min="1" max={data.user.fichas_casino} value={amount} disabled={busy || wheelPhase !== "idle"} onChange={(event) => setAmount(event.target.value)} /></label>
          </div>
          <div className="roulette-betting-felt">
            <div className="roulette-number-board" aria-label="Mesa de ruleta: números del cero al treinta y seis">
              <button type="button" className={`roulette-table-number green ${betType === "number" && Number(choice) === 0 ? "selected" : ""}`} style={{ gridColumn: 1, gridRow: "1 / span 3" }} aria-pressed={betType === "number" && Number(choice) === 0} disabled={busy || wheelPhase !== "idle"} onClick={() => { setBetType("number"); setChoice(0); }}>0</button>
              {[3, 2, 1].map((rowNumber, row) => Array.from({ length: 12 }, (_, column) => {
                const number = column * 3 + rowNumber;
                return <button key={number} type="button" className={`roulette-table-number ${rouletteColor(number)} ${betType === "number" && Number(choice) === number ? "selected" : ""}`} style={{ gridColumn: column + 2, gridRow: row + 1 }} aria-pressed={betType === "number" && Number(choice) === number} disabled={busy || wheelPhase !== "idle"} onClick={() => { setBetType("number"); setChoice(number); }}>{number}</button>;
              }))}
            </div>
            <div className="roulette-dozens" aria-label="Apuestas por docena">
              {[["first", "1.ª DOCENA", "1 — 12"], ["second", "2.ª DOCENA", "13 — 24"], ["third", "3.ª DOCENA", "25 — 36"]].map(([value, label, range]) => <button key={value} type="button" aria-pressed={betType === "dozen" && choice === value} className={betType === "dozen" && choice === value ? "selected" : ""} disabled={busy || wheelPhase !== "idle"} onClick={() => { setBetType("dozen"); setChoice(value); }}><span>{label}</span><small>{range} · PAGA 2:1</small></button>)}
            </div>
            <div className="roulette-columns" aria-label="Apuestas por columna">
              <span>COLUMNAS</span>
              {[["first", "1.ª"], ["second", "2.ª"], ["third", "3.ª"]].map(([value, label]) => <button key={value} type="button" aria-pressed={betType === "column" && choice === value} className={betType === "column" && choice === value ? "selected" : ""} disabled={busy || wheelPhase !== "idle"} onClick={() => { setBetType("column"); setChoice(value); }}>{label} · 2:1</button>)}
            </div>
            <div className="roulette-outside-bets">
              {[["low", "1–18"], ["even", "PAR"], ["red", "ROJO"], ["black", "NEGRO"], ["odd", "IMPAR"], ["high", "19–36"]].map(([value, label]) => <button key={value} type="button" aria-pressed={betType === "outside" && choice === value} className={`${value} ${betType === "outside" && choice === value ? "selected" : ""}`} disabled={busy || wheelPhase !== "idle"} onClick={() => { setBetType("outside"); setChoice(value); }}>{label}<small>1:1</small></button>)}
            </div>
            <div className="roulette-table-footer"><span className="roulette-selected-bet">APUESTA: <strong>{selectedBetLabel}</strong></span><Button variant="pink roulette-spin-button" disabled={busy || wheelPhase !== "idle" || Number(amount) < 1 || Number(amount) > Number(data.user.fichas_casino)} onClick={roulette}>{wheelPhase !== "idle" ? "GIRANDO..." : "GIRAR RULETA"} <span>↗</span></Button></div>
          </div>
          <p className="roulette-payout-note">{betType === "number" ? "Número exacto · pago 35:1" : ["dozen", "column"].includes(betType) ? `${betType === "dozen" ? "Docena" : "Columna"} acertada · pago 2:1` : "Apuesta exterior acertada · pago 1:1"}. Se devuelve la apuesta al ganar.</p>
        </div>
      </div>
    </section>}
    {view === "blackjack" && <BlackjackTable
      blackjack={blackjack}
      amount={amount}
      fichas={Number(data.user.fichas_casino)}
      busy={busy}
      onAmountChange={setAmount}
      onAction={blackjackAction}
    />}
    {view === "store" && <section className="casino-store-view" role="tabpanel">
      <div className="section-heading casino-store-heading"><div><span className="eyebrow">REWARD SHOP / RAREZA ESPECIAL</span><h2>Tienda de fichas</h2></div></div>
      <div className="tabs shop-tabs" role="tablist" aria-label="Catálogo de fichas"><button role="tab" aria-selected={specialTab === "autos"} className={specialTab === "autos" ? "current" : ""} onClick={() => setSpecialTab("autos")}>AUTOS</button><button role="tab" aria-selected={specialTab === "piezas"} className={specialTab === "piezas" ? "current" : ""} onClick={() => setSpecialTab("piezas")}>PIEZAS</button></div>
      {specialTab === "autos"
        ? <CatalogFilters label="FILTRAR AUTOS POR RAREZA" options={rarities} value={rarityFilter} onChange={setRarityFilter} />
        : <CatalogFilters label="FILTRAR PIEZAS POR CATEGORÍA" options={pieceCategories} value={categoryFilter} onChange={setCategoryFilter} />}
      <div className="catalog-grid">{items.map((item) => <article className="product-card special-card" key={item.id}><span className="rarity rarity-especial">ESPECIAL</span><div className="product-icon">{specialTab === "autos" ? "🏎️" : "⚙"}</div><h3>{item.nombre}</h3><p>{item.categoria || "Edición especial"}</p><div className="product-buy"><strong>✦ {item.precio_fichas}</strong><Button variant="small pink" disabled={busy} onClick={() => action("/casino/store/buy", { method: "POST", body: JSON.stringify({ type: specialTab === "autos" ? "auto" : "pieza", id: item.id }) }, "Canje realizado.")}>CANJEAR</Button></div></article>)}</div>
      {!items.length && <div className="empty-line">No hay artículos con este filtro. Probá otra rareza o categoría.</div>}
    </section>}
    {result && <div className={`notice ${result.win ? "success" : "error"}`}>{result.casinoMessage || `La ruleta cayó en ${result.number} ${result.color}. ${result.win ? `¡Ganaste ${result.pago} fichas!` : "Esta vez no salió."}`}<button onClick={() => setResult(null)}>×</button></div>}
  </div>;
}

function BlackjackTable({ blackjack, amount, fichas, busy, onAmountChange, onAction }) {
  const game = blackjack?.game;
  const hands = game?.hands || (game ? [{ id: 1, cards: game.player || [], total: game.playerTotal, wager: Number(amount), done: false }] : []);
  const activeHand = hands[game?.activeHand] || hands[0];
  const activeTurn = Boolean(game && !game.done && activeHand && !activeHand.done);
  const firstPairRank = activeHand?.cards?.[0]?.pairRank ?? activeHand?.cards?.[0]?.rank;
  const secondPairRank = activeHand?.cards?.[1]?.pairRank ?? activeHand?.cards?.[1]?.rank;
  const canHit = game?.canHit ?? activeTurn;
  const canDouble = game?.canDouble ?? Boolean(activeTurn && activeHand.cards.length === 2);
  const canSplit = game?.canSplit ?? Boolean(activeTurn && activeHand.cards.length === 2 && firstPairRank === secondPairRank && hands.length < 4);
  const canStart = !game || game.done;
  const betOptions = [10, 25, 50, 100].filter((value) => value <= fichas);

  return <section className="casino-game casino-single-game blackjack-table" role="tabpanel">
    <div className="game-title"><span className="eyebrow">02 / BLACKJACK</span><span>21 · DEALER SE PLANTA EN 17</span></div>
    <div className="blackjack-felt">
      <div className="blackjack-table-lights" />
      <div className="blackjack-dealer">
        <div className="blackjack-seat-label"><span>CRUPIER</span><strong>{game?.dealerTotal ?? "—"}</strong></div>
        <div className="blackjack-card-row dealer-cards">{game?.dealer?.length
          ? game.dealer.map((card, index) => <Card key={`dealer-${index}-${card.hidden ? "hidden" : card.name}`} card={card} index={index} delay={index * 360} />)
          : <><Card card={{ hidden: true }} index={0} delay={0} /><Card card={{ hidden: true }} index={1} delay={360} /></>}
        </div>
      </div>
      <div className="blackjack-table-divider"><span>✦</span><i /><span>✦</span></div>
      <div className="blackjack-player-hands">
        {hands.length ? hands.map((hand, handIndex) => <div key={hand.id ?? handIndex} className={`blackjack-hand ${game && !game.done && game.activeHand === handIndex ? "active" : ""} ${hand.result ? `hand-${hand.result === "Ganaste" ? "won" : hand.result === "Empate" ? "push" : "lost"}` : ""}`}>
          <div className="blackjack-seat-label"><span>{hands.length > 1 ? `MANO ${handIndex + 1}` : "TU MANO"}</span><strong>{hand.total ?? "—"}</strong></div>
          <div className="blackjack-card-row">{hand.cards.map((card, index) => <Card key={`${hand.id ?? handIndex}-${index}`} card={card} index={index} delay={180 + index * 360} />)}</div>
          <div className="blackjack-hand-stake"><span>APUESTA</span><b>✦ {Number(hand.wager || amount).toLocaleString("es-AR")}</b>{hand.doubled && <em>DOBLADA</em>}{hand.result && <strong>{hand.result.toUpperCase()}</strong>}</div>
        </div>) : <div className="blackjack-hand blackjack-empty-hand">
          <div className="blackjack-seat-label"><span>TU MANO</span><strong>—</strong></div>
          <div className="blackjack-card-row"><Card card={{ hidden: true }} index={0} /><Card card={{ hidden: true }} index={1} /></div>
          <div className="blackjack-hand-stake"><span>APUESTA</span><b>✦ {Number(amount || 0).toLocaleString("es-AR")}</b></div>
        </div>}
      </div>
      {blackjack?.resultado && <div className={`blackjack-result ${blackjack.resultado === "Perdiste" ? "lost" : blackjack.resultado === "Ganaste" ? "won" : "push"}`}><span>{blackjack.resultado === "Ganaste" ? "¡MANO GANADORA!" : blackjack.resultado === "Perdiste" ? "FIN DE LA MANO" : blackjack.resultado.toUpperCase()}</span><strong>{blackjack.pago > 0 ? `✦ ${Number(blackjack.pago).toLocaleString("es-AR")}` : "SIN PREMIO"}</strong></div>}
    </div>
    <div className="blackjack-action-panel">
      {canStart ? <>
        <div className="blackjack-bet-area">
          <div className="blackjack-bet-heading"><div><span className="eyebrow">PREPARÁ TU APUESTA</span><strong>¿Cuánto jugamos?</strong></div><span className="blackjack-balance">SALDO · ✦ {fichas.toLocaleString("es-AR")}</span></div>
          <div className="blackjack-chip-row">
            {[...new Set([...betOptions, Number(amount)].filter((value) => value > 0 && value <= fichas))].map((value, index) => <button key={`${value}-${index}`} type="button" className={`blackjack-chip chip-${index % 4} ${Number(amount) === value ? "selected" : ""}`} disabled={busy} onClick={() => onAmountChange(value)}><span>✦</span>{value}</button>)}
          </div>
          <label className="blackjack-custom-bet">APUESTA PERSONALIZADA<input type="number" min="1" max={fichas} value={amount} disabled={busy} onChange={(event) => onAmountChange(event.target.value)} /></label>
        </div>
        <Button variant="pink blackjack-deal-button" disabled={busy || Number(amount) < 1 || Number(amount) > fichas} onClick={() => onAction("start")}>{busy ? "REPARTIENDO..." : "REPARTIR CARTAS"} <span>↗</span></Button>
      </> : <>
        <div className="blackjack-turn-message"><span className="eyebrow">TU TURNO</span><strong>Elegí cómo jugar esta mano.</strong></div>
        <div className="blackjack-controls">
          <Button variant="outline" disabled={busy || !canHit} onClick={() => onAction("hit")}><span className="action-icon">＋</span>PEDIR</Button>
          <Button variant="outline" disabled={busy || !canDouble || fichas < activeHand?.wager} onClick={() => onAction("double")}><span className="action-icon">×2</span>DOBLAR</Button>
          <Button variant="outline" disabled={busy || !canSplit || fichas < activeHand?.wager} onClick={() => onAction("split")}><span className="action-icon">↗↙</span>DIVIDIR</Button>
          <Button variant="pink" disabled={busy || !activeTurn} onClick={() => onAction("stand")}><span className="action-icon">Ⅱ</span>PLANTARSE</Button>
        </div>
      </>}
      <p className="blackjack-rules">Doblar y dividir requieren una apuesta adicional igual a la mano. Podés dividir hasta cuatro manos; los ases divididos reciben una sola carta.</p>
    </div>
  </section>;
}

function Card({ card, index = 0, delay = index * 130 }) {
  const red = ["♥", "♦"].includes(card.suit);
  return <div className={`playing-card ${card.hidden ? "card-back" : ""} ${red ? "red-card" : ""}`} style={{ "--deal-delay": `${Math.min(delay, 2200)}ms` }}>
    {card.hidden ? <><span className="card-back-pattern">AK</span><i>AL-KORTE</i></> : <><b>{card.name}</b><span>{card.suit || "♠"}</span><small>{card.name}<br />{card.suit || "♠"}</small></>}
  </div>;
}

function Empty({ title, copy }) { return <div className="empty-state"><span>◇</span><h3>{title}</h3><p>{copy}</p></div>; }

const adminTypes = {
  autos: { title: "Autos", fields: [["nombre", "Nombre"], ["precio", "Precio $"], ["precio_fichas", "Precio fichas"], ["HP", "HP"], ["NM", "NM"], ["Agarre", "Agarre"], ["id_rareza", "ID rareza"], ["imagen", "Imagen"]] },
  piezas: { title: "Piezas", fields: [["nombre", "Nombre"], ["precio", "Precio $"], ["precio_fichas", "Precio fichas"], ["HP", "HP"], ["NM", "NM"], ["Agarre", "Agarre"], ["id_categoria", "ID categoría"], ["id_rareza", "ID rareza"], ["imagen", "Imagen"]] },
  categorias: { title: "Categorías", fields: [["nombre", "Nombre"]] },
  rarezas: { title: "Rarezas", fields: [["nombre", "Nombre"]] },
};

function Admin({ data, token }) {
  const [type, setType] = useState("autos");
  const [rows, setRows] = useState([]);
  const [form, setForm] = useState({});
  const [editing, setEditing] = useState(null);
  const [message, setMessage] = useState("");
  const config = adminTypes[type];

  useEffect(() => {
    let active = true;
    request(`/admin/${type}`, token)
      .then((records) => { if (active) setRows(records); })
      .catch((issue) => { if (active) setMessage(issue.message); });
    return () => { active = false; };
  }, [type, token]);

  async function save(event) {
    event.preventDefault();
    setMessage("");
    try {
      const path = editing ? `/admin/${type}/${editing}` : `/admin/${type}`;
      setRows(await request(path, token, { method: editing ? "PUT" : "POST", body: JSON.stringify(form) }));
      setForm({});
      setEditing(null);
      setMessage("Cambios guardados en la base de datos.");
    } catch (issue) { setMessage(issue.message); }
  }

  async function remove(id) {
    if (!window.confirm("¿Eliminar este registro? Esta acción no se puede deshacer.")) return;
    try { setRows(await request(`/admin/${type}/${id}`, token, { method: "DELETE" })); setMessage("Registro eliminado."); }
    catch (issue) { setMessage(issue.message); }
  }

  return <div className="page"><PageTitle eyebrow="ADMIN / DB MANAGEMENT" title={<>Panel de <span className="accent">control.</span></>} copy={`Sesión de administrador: ${data.user.nombre}.`} />
    <div className="admin-tabs">{Object.entries(adminTypes).map(([key, item]) => <button key={key} className={type === key ? "current" : ""} onClick={() => { setType(key); setEditing(null); setForm({}); setMessage(""); }}>{item.title.toUpperCase()}</button>)}</div>
    <div className="admin-layout"><form className="admin-form panel" onSubmit={save}><span className="eyebrow">{editing ? `EDITANDO #${editing}` : "NUEVO REGISTRO"}</span><h3>{config.title}</h3>{config.fields.map(([key, label]) => <label key={key}>{label}<input required value={form[key] ?? ""} onChange={(event) => setForm({ ...form, [key]: event.target.value })} /></label>)}<Button>{editing ? "GUARDAR CAMBIOS" : "CREAR REGISTRO"}</Button>{editing && <Button type="button" variant="outline" onClick={() => { setEditing(null); setForm({}); }}>CANCELAR</Button>}{message && <div className="notice success">{message}</div>}</form>
      <div className="admin-table panel"><div className="panel-head"><div><span className="eyebrow">CATÁLOGO / MYSQL</span><h3>{config.title} registrados</h3></div><span className="count-badge">{rows.length}</span></div>{rows.map((row) => <div className="admin-row" key={row.id}><div><strong>{row.nombre}</strong><span>#{row.id}{row.precio ? ` · ${currency(row.precio)}` : ""}</span></div><button onClick={() => { setEditing(row.id); setForm(Object.fromEntries(config.fields.map(([key]) => [key, row[key] ?? ""]))); }}>EDITAR</button><button className="delete-action" onClick={() => remove(row.id)}>BORRAR</button></div>)}</div>
    </div>
  </div>;
}

export default App;
