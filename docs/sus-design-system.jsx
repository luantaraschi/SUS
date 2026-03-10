import { useState, useEffect, useRef } from "react";

const SUSDesignSystemV3 = () => {
  const [activeSection, setActiveSection] = useState("overview");
  const [hoveredBtn, setHoveredBtn] = useState(null);
  const canvasRef = useRef(null);

  // Animated sunburst background
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    let frame = 0;
    let animId;
    const resize = () => { canvas.width = window.innerWidth; canvas.height = window.innerHeight; };
    resize();
    window.addEventListener("resize", resize);

    const draw = () => {
      frame += 0.002;
      const w = canvas.width, h = canvas.height;
      const cx = w / 2, cy = h / 2;
      const maxR = Math.sqrt(cx * cx + cy * cy) * 1.3;
      const hueShift = Math.sin(frame) * 25;

      // Radial gradient base
      const grad = ctx.createRadialGradient(cx, cy, 0, cx, cy, maxR);
      grad.addColorStop(0, `hsl(${50 + hueShift}, 95%, 72%)`);
      grad.addColorStop(0.25, `hsl(${35 + hueShift}, 92%, 60%)`);
      grad.addColorStop(0.55, `hsl(${320 + hueShift * 0.5}, 72%, 52%)`);
      grad.addColorStop(1, `hsl(${268 + hueShift * 0.3}, 75%, 25%)`);
      ctx.fillStyle = grad;
      ctx.fillRect(0, 0, w, h);

      // Sunburst rays
      ctx.save();
      ctx.translate(cx, cy);
      ctx.rotate(frame * 0.3);
      const numRays = 24;
      for (let i = 0; i < numRays; i++) {
        const angle = (i / numRays) * Math.PI * 2;
        const nextAngle = ((i + 0.5) / numRays) * Math.PI * 2;
        ctx.beginPath();
        ctx.moveTo(0, 0);
        ctx.arc(0, 0, maxR, angle, nextAngle);
        ctx.closePath();
        ctx.fillStyle = `rgba(255,255,255,${0.04 + Math.sin(frame * 2 + i) * 0.02})`;
        ctx.fill();
      }
      ctx.restore();

      // Corner halftone dots
      const dotSize = 6;
      const spacing = 18;
      ctx.fillStyle = "rgba(32,2,104,0.12)";
      for (let x = 0; x < w * 0.25; x += spacing) {
        for (let y = 0; y < h * 0.25; y += spacing) {
          const dist = Math.sqrt(x * x + y * y);
          const alpha = Math.max(0, 1 - dist / (w * 0.22));
          if (alpha > 0.05) {
            ctx.globalAlpha = alpha * 0.4;
            // Top-left
            ctx.beginPath(); ctx.arc(x, y, dotSize * alpha, 0, Math.PI * 2); ctx.fill();
            // Top-right
            ctx.beginPath(); ctx.arc(w - x, y, dotSize * alpha, 0, Math.PI * 2); ctx.fill();
            // Bottom-left
            ctx.beginPath(); ctx.arc(x, h - y, dotSize * alpha, 0, Math.PI * 2); ctx.fill();
            // Bottom-right
            ctx.beginPath(); ctx.arc(w - x, h - y, dotSize * alpha, 0, Math.PI * 2); ctx.fill();
          }
        }
      }
      ctx.globalAlpha = 1;

      animId = requestAnimationFrame(draw);
    };
    draw();
    return () => { cancelAnimationFrame(animId); window.removeEventListener("resize", resize); };
  }, []);

  // Design Tokens
  const T = {
    colors: {
      bg: { center: "#FAFA39", mid1: "#FF8940", mid2: "#D64DC2", outer: "#902EED", deepPurple: "#200268" },
      bgValid: { center: "#4DDBA8", mid1: "#00B8EB", mid2: "#602BFF", outer: "#852EFF" },
      bgInvalid: { center: "#FF577B", mid1: "#D12977", outer: "#8100B0" },
      surface: { primary: "#200268", secondary: "#36128F", white: "#FFFFFF", overlay: "rgba(32,2,104,0.80)" },
      text: { onDark: "#FFFFFF", onLight: "#200268", muted: "rgba(255,255,255,0.65)", accent: "#DFCBFF" },
      logo: { green: "#7ED957", greenDark: "#4CA82B", burstBg: "#200268", burstBorder: "#FFFFFF" },
      impostor: "#FF577B", safe: "#4DDBA8", info: "#00B8EB", warning: "#FF8940", special: "#D64DC2",
    },
    font: {
      display: "'Londrina Solid', cursive",
      body: "'Balsamiq Sans', cursive",
      hand: "'Kalam', cursive",
      condensed: "'Oswald', sans-serif",
      mono: "'JetBrains Mono', monospace",
    },
    r: { sm: "8px", md: "12px", lg: "16px", xl: "24px", pill: "999px" },
  };

  const sections = [
    { id: "overview", label: "Visao Geral" },
    { id: "colors", label: "Cores" },
    { id: "type", label: "Tipografia" },
    { id: "logo", label: "Logo" },
    { id: "components", label: "Componentes" },
    { id: "layout", label: "Layout" },
    { id: "states", label: "Game States" },
  ];

  // Glassmorphism panel
  const Glass = ({ children, style = {} }) => (
    <div style={{
      background: "rgba(32,2,104,0.45)", backdropFilter: "blur(16px)", WebkitBackdropFilter: "blur(16px)",
      borderRadius: T.r.xl, border: "2px solid rgba(255,255,255,0.1)", padding: 28, ...style,
    }}>{children}</div>
  );

  const SectionTitle = ({ children }) => (
    <h3 style={{ fontFamily: T.font.display, fontSize: 30, color: "#fff", marginBottom: 20, letterSpacing: 1 }}>{children}</h3>
  );

  const SubTitle = ({ children }) => (
    <h4 style={{ fontFamily: T.font.display, fontSize: 20, color: T.colors.info, marginBottom: 12, letterSpacing: 0.5 }}>{children}</h4>
  );

  const Note = ({ children }) => (
    <p style={{ fontFamily: T.font.body, fontSize: 13, color: T.colors.text.accent, lineHeight: 1.6, marginTop: 10 }}>{children}</p>
  );

  // ===== OVERVIEW =====
  const Overview = () => (
    <div style={{ display: "flex", flexDirection: "column", gap: 32, alignItems: "center" }}>
      <div style={{ textAlign: "center", maxWidth: 680 }}>
        <div style={{ fontFamily: T.font.display, fontSize: 56, color: "#fff", letterSpacing: 4, textShadow: "4px 4px 0 rgba(32,2,104,0.7)" }}>
          Design System
        </div>
        <div style={{ fontFamily: T.font.display, fontSize: 28, color: T.colors.text.accent, marginTop: 4 }}>
          SUS — Jogo de Deducao Social
        </div>
      </div>

      <div style={{ display: "flex", gap: 16, flexWrap: "wrap", justifyContent: "center" }}>
        {[
          { icon: "🌀", title: "Sunburst BG", desc: "Raios girando + gradiente radial amarelo-rosa-roxo + halftone dots nos cantos" },
          { icon: "⚪", title: "Circulo Central", desc: "Conteudo principal dentro de um circulo branco com borda #200268" },
          { icon: "🪑", title: "Mesa Redonda", desc: "Jogadores distribuidos AO REDOR do circulo como numa mesa de jogo" },
          { icon: "💥", title: "Logo Burst", desc: "Logo SUS em verde cartoon com estrela/burst atras em roxo escuro" },
          { icon: "🎨", title: "SVG Organico", desc: "Bordas de botoes e inputs com paths irregulares feitos a mao" },
          { icon: "🎬", title: "Video Blend", desc: "Video animado com mix-blend-mode: color-burn sobre o gradiente" },
        ].map((p, i) => (
          <Glass key={i} style={{ width: 175, padding: "20px 16px", textAlign: "center" }}>
            <div style={{ fontSize: 32, marginBottom: 6 }}>{p.icon}</div>
            <div style={{ fontFamily: T.font.display, fontSize: 15, color: "#fff", marginBottom: 4 }}>{p.title}</div>
            <div style={{ fontFamily: T.font.body, fontSize: 11, color: T.colors.text.accent, lineHeight: 1.4 }}>{p.desc}</div>
          </Glass>
        ))}
      </div>

      {/* Mini lobby preview */}
      <div style={{ position: "relative", width: 420, height: 420 }}>
        {/* Players around circle */}
        {[
          { name: "Rock", emoji: "😎", angle: -90 },
          { name: "Lelety", emoji: "🤪", angle: 180 },
          { name: "Be", emoji: "🤓", angle: 0 },
          { name: "Anonimo", emoji: "😜", angle: 90 },
        ].map((p, i) => {
          const rad = (p.angle * Math.PI) / 180;
          const dist = 195;
          const x = 210 + Math.cos(rad) * dist - 30;
          const y = 210 + Math.sin(rad) * dist - 30;
          return (
            <div key={i} style={{
              position: "absolute", left: x, top: y, width: 60, textAlign: "center", zIndex: 2,
            }}>
              <div style={{
                width: 48, height: 48, borderRadius: "50%", margin: "0 auto",
                backgroundColor: T.colors.surface.primary, border: "3px solid #fff",
                display: "flex", alignItems: "center", justifyContent: "center", fontSize: 22,
                boxShadow: "0 2px 8px rgba(0,0,0,0.3)",
              }}>{p.emoji}</div>
              <div style={{
                fontFamily: T.font.display, fontSize: 11, color: "#fff", marginTop: 3,
                textShadow: "1px 1px 3px rgba(0,0,0,0.5)",
              }}>[{p.name}]</div>
            </div>
          );
        })}
        {/* Main circle */}
        <div style={{
          position: "absolute", inset: 40, borderRadius: "50%",
          backgroundColor: "#fff", border: `5px solid ${T.colors.surface.primary}`,
          display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center",
          gap: 8, padding: 40, boxShadow: "0 0 60px rgba(32,2,104,0.2)",
        }}>
          <div style={{ fontFamily: T.font.display, fontSize: 16, color: T.colors.surface.primary, letterSpacing: 2 }}>
            ROOM CODE:
          </div>
          <div style={{
            display: "flex", gap: 6, marginBottom: 12,
          }}>
            {["X", "X", "X", "X"].map((c, i) => (
              <div key={i} style={{
                width: 28, height: 28, borderRadius: 6,
                backgroundColor: T.colors.info, color: "#fff",
                fontFamily: T.font.display, fontSize: 16,
                display: "flex", alignItems: "center", justifyContent: "center",
              }}>{c}</div>
            ))}
          </div>
          <div style={{ display: "flex", gap: 24 }}>
            <div style={{ textAlign: "center" }}>
              <div style={{ fontFamily: T.font.display, fontSize: 12, color: T.colors.surface.primary }}>PLAYERS:</div>
              <div style={{ fontFamily: T.font.display, fontSize: 24, color: T.colors.surface.primary }}>8</div>
            </div>
            <div style={{ textAlign: "center" }}>
              <div style={{ fontFamily: T.font.display, fontSize: 12, color: T.colors.surface.primary }}>ROUNDS:</div>
              <div style={{ fontFamily: T.font.display, fontSize: 24, color: T.colors.surface.primary }}>3</div>
            </div>
          </div>
          <div style={{
            width: "85%", padding: "8px 0", borderRadius: T.r.pill, marginTop: 8,
            backgroundColor: T.colors.surface.primary, color: "#fff",
            fontFamily: T.font.display, fontSize: 18, textAlign: "center", letterSpacing: 2,
          }}>
            ▶ START
          </div>
          <div style={{
            width: "85%", padding: "8px 0", borderRadius: T.r.pill,
            border: `2.5px solid ${T.colors.surface.primary}`, color: T.colors.surface.primary,
            fontFamily: T.font.display, fontSize: 16, textAlign: "center", letterSpacing: 2,
          }}>
            ◀ BACK
          </div>
        </div>
      </div>
    </div>
  );

  // ===== COLORS =====
  const Colors = () => (
    <div style={{ display: "flex", flexDirection: "column", gap: 36 }}>
      <div>
        <SectionTitle>Gradientes de Fundo</SectionTitle>
        <div style={{ display: "flex", gap: 16, flexWrap: "wrap" }}>
          {[
            { name: "Default", g: `radial-gradient(circle, #FAFA39 0%, #FF8940 35%, #D64DC2 70%, #902EED 100%)`, desc: "Tela principal, lobby" },
            { name: "Valid", g: `radial-gradient(circle, #4DDBA8 10%, #00B8EB 40%, #602BFF 70%, #852EFF 100%)`, desc: "Codigo correto, sucesso" },
            { name: "Invalid", g: `radial-gradient(circle, #FF577B 36%, #D12977 59%, #8100B0 100%)`, desc: "Erro, sala cheia" },
            { name: "Game (Logo)", g: `linear-gradient(180deg, #2D0B72 0%, #200268 50%, #150045 100%)`, desc: "Tela da logo / splash" },
          ].map((item, i) => (
            <div key={i} style={{ textAlign: "center" }}>
              <div style={{
                width: 160, height: 100, borderRadius: T.r.lg, background: item.g,
                border: "3px solid rgba(255,255,255,0.2)", boxShadow: "0 4px 16px rgba(0,0,0,0.2)",
              }} />
              <div style={{ fontFamily: T.font.display, fontSize: 14, color: "#fff", marginTop: 6 }}>{item.name}</div>
              <div style={{ fontFamily: T.font.body, fontSize: 11, color: T.colors.text.accent }}>{item.desc}</div>
            </div>
          ))}
        </div>
        <Note>Gradiente radial + 24 raios (sunburst) girando lentamente com CSS animation + video em color-burn + textura overlay + halftone dots nos 4 cantos.</Note>
      </div>

      <div>
        <SectionTitle>Superficies</SectionTitle>
        <div style={{ display: "flex", gap: 12, flexWrap: "wrap" }}>
          {[
            { name: "Primary", hex: "#200268", bg: "#200268", fg: "#fff" },
            { name: "Secondary", hex: "#36128F", bg: "#36128F", fg: "#fff" },
            { name: "White", hex: "#FFFFFF", bg: "#FFFFFF", fg: "#200268" },
            { name: "Overlay", hex: "rgba(32,2,104,0.8)", bg: "rgba(32,2,104,0.8)", fg: "#fff" },
          ].map((c, i) => (
            <div key={i} style={{
              width: 110, height: 80, borderRadius: T.r.lg, backgroundColor: c.bg,
              border: "3px solid rgba(255,255,255,0.15)",
              display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center",
            }}>
              <span style={{ fontFamily: T.font.display, fontSize: 12, color: c.fg }}>{c.name}</span>
              <span style={{ fontFamily: T.font.mono, fontSize: 9, color: c.fg, opacity: 0.6, marginTop: 2 }}>{c.hex}</span>
            </div>
          ))}
        </div>
      </div>

      <div>
        <SectionTitle>Semanticas do Jogo</SectionTitle>
        <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
          {[
            { name: "Impostor", hex: "#FF577B", use: "Eliminar, perigo" },
            { name: "Safe", hex: "#4DDBA8", use: "Seguro, correto" },
            { name: "Info", hex: "#00B8EB", use: "Timer, links" },
            { name: "Warning", hex: "#FF8940", use: "Suspeito, atencao" },
            { name: "Special", hex: "#D64DC2", use: "Mestre, badge" },
            { name: "Logo Green", hex: "#7ED957", use: "Logo, destaque" },
          ].map((c, i) => (
            <div key={i} style={{ textAlign: "center" }}>
              <div style={{
                width: 88, height: 60, borderRadius: T.r.md, backgroundColor: c.hex,
                border: "2px solid rgba(255,255,255,0.15)", boxShadow: `0 4px 12px ${c.hex}30`,
                display: "flex", alignItems: "flex-end", justifyContent: "center", paddingBottom: 4,
              }}>
                <span style={{ fontFamily: T.font.mono, fontSize: 8, color: "#fff" }}>{c.hex}</span>
              </div>
              <div style={{ fontFamily: T.font.display, fontSize: 11, color: "#fff", marginTop: 4 }}>{c.name}</div>
              <div style={{ fontFamily: T.font.body, fontSize: 9, color: T.colors.text.accent }}>{c.use}</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );

  // ===== TYPOGRAPHY =====
  const TypeSection = () => (
    <div style={{ display: "flex", flexDirection: "column", gap: 28 }}>
      {[
        { name: "Londrina Solid", fam: T.font.display, role: "Display / Logo / Botoes", desc: "Titulos, logo, labels de botao, numeros grandes, room code label", samples: [{ t: "SUS", s: 64 }, { t: "VOCE E O IMPOSTOR!", s: 32 }, { t: "CRIAR SALA", s: 24 }, { t: "ROOM CODE:", s: 18 }] },
        { name: "Balsamiq Sans", fam: T.font.body, role: "Body / Descricoes", desc: "Regras, descricoes, respostas, dialogo, textos de erro, tooltips", samples: [{ t: "Essa sala nao existe.", s: 20 }, { t: "Discutam e descubram quem esta blefando!", s: 16 }] },
        { name: "Kalam", fam: T.font.hand, role: "Handwritten / Nomes", desc: "Nomes de jogadores entre colchetes, notas informais, respostas manuscritas", samples: [{ t: "[Luan]", s: 28 }, { t: "Acho que e a Maria...", s: 18 }] },
        { name: "Oswald", fam: T.font.condensed, role: "Condensed / Labels", desc: "Badges, labels compactas, subtitulos, contadores PLAYERS/ROUNDS", samples: [{ t: "PLAYERS: 8", s: 18 }, { t: "ELIMINADO", s: 14 }] },
        { name: "JetBrains Mono", fam: T.font.mono, role: "Mono / Codigos", desc: "Codigo de sala (XXXX), timer, contadores", samples: [{ t: "ABCD", s: 32 }, { t: "02:45", s: 24 }] },
      ].map((f, i) => (
        <Glass key={i}>
          <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 10, flexWrap: "wrap" }}>
            <span style={{ fontFamily: T.font.display, fontSize: 20, color: "#fff" }}>{f.name}</span>
            <span style={{
              fontFamily: T.font.condensed, fontSize: 10, color: T.colors.info, letterSpacing: 1,
              background: `${T.colors.info}15`, padding: "2px 10px", borderRadius: 12, textTransform: "uppercase",
            }}>{f.role}</span>
          </div>
          <p style={{ fontFamily: T.font.body, fontSize: 12, color: T.colors.text.accent, marginBottom: 14 }}>{f.desc}</p>
          {f.samples.map((s, j) => (
            <div key={j} style={{ display: "flex", alignItems: "baseline", gap: 10, marginBottom: 4, flexWrap: "wrap" }}>
              <span style={{ fontFamily: T.font.mono, fontSize: 10, color: T.colors.text.muted, minWidth: 32 }}>{s.s}px</span>
              <span style={{ fontFamily: f.fam, fontSize: s.s, color: "#fff", lineHeight: 1.3 }}>{s.t}</span>
            </div>
          ))}
        </Glass>
      ))}
    </div>
  );

  // ===== LOGO =====
  const LogoSection = () => (
    <div style={{ display: "flex", flexDirection: "column", gap: 32, alignItems: "center" }}>
      <SectionTitle>Logo SUS</SectionTitle>

      {/* Burst logo recreation */}
      <div style={{ position: "relative", width: 320, height: 320 }}>
        {/* Burst star shape */}
        <svg viewBox="0 0 300 300" style={{ position: "absolute", inset: 0, width: "100%", height: "100%" }}>
          <defs>
            <filter id="shadow">
              <feDropShadow dx="3" dy="3" stdDeviation="4" floodOpacity="0.4" />
            </filter>
          </defs>
          {/* Outer burst */}
          <polygon
            points={Array.from({ length: 16 }, (_, i) => {
              const angle = (i / 16) * Math.PI * 2 - Math.PI / 2;
              const r = i % 2 === 0 ? 145 : 105;
              return `${150 + Math.cos(angle) * r},${150 + Math.sin(angle) * r}`;
            }).join(" ")}
            fill="#fff" stroke="#fff" strokeWidth="4" filter="url(#shadow)"
          />
          <polygon
            points={Array.from({ length: 16 }, (_, i) => {
              const angle = (i / 16) * Math.PI * 2 - Math.PI / 2;
              const r = i % 2 === 0 ? 138 : 100;
              return `${150 + Math.cos(angle) * r},${150 + Math.sin(angle) * r}`;
            }).join(" ")}
            fill={T.colors.surface.primary}
          />
        </svg>
        {/* Logo text */}
        <div style={{
          position: "absolute", inset: 0, display: "flex", alignItems: "center", justifyContent: "center", zIndex: 2,
        }}>
          <div style={{
            fontFamily: "'Bungee Shade', 'Londrina Solid', cursive",
            fontSize: 88, fontWeight: 900, color: T.colors.logo.green,
            textShadow: `4px 4px 0 ${T.colors.logo.greenDark}, -2px -2px 0 #fff, 2px -2px 0 #fff, -2px 2px 0 #fff`,
            letterSpacing: 4,
          }}>
            SuS
          </div>
        </div>
        {/* Floating emojis */}
        {[
          { emoji: "😡", x: -20, y: 30, size: 36, rot: -15 },
          { emoji: "👍", x: 290, y: 40, size: 36, rot: 15 },
          { emoji: "😡", x: 10, y: 240, size: 30, rot: 10 },
          { emoji: "👍", x: 270, y: 220, size: 30, rot: -10 },
          { emoji: "😡", x: 60, y: -10, size: 28, rot: -20 },
          { emoji: "👍", x: 230, y: 280, size: 28, rot: 20 },
        ].map((e, i) => (
          <div key={i} style={{
            position: "absolute", left: e.x, top: e.y, fontSize: e.size,
            transform: `rotate(${e.rot}deg)`, zIndex: 3,
          }}>{e.emoji}</div>
        ))}
      </div>

      <Glass style={{ maxWidth: 500 }}>
        <SubTitle>Especificacao da Logo</SubTitle>
        <div style={{ fontFamily: T.font.body, fontSize: 14, color: T.colors.text.accent, lineHeight: 1.8 }}>
          <div><strong style={{ color: "#fff" }}>Estrela/Burst:</strong> 16 pontas, fundo #200268 com borda branca de 4px</div>
          <div><strong style={{ color: "#fff" }}>Texto "SuS":</strong> Verde #7ED957, contorno branco, sombra #4CA82B</div>
          <div><strong style={{ color: "#fff" }}>Emojis:</strong> 😡 (angry) e 👍 (thumbs up) flutuando ao redor, referencia a votacao e suspeiacao</div>
          <div><strong style={{ color: "#fff" }}>Confetti:</strong> Pequenos triangulos e formas em roxo/rosa espalhados</div>
          <div><strong style={{ color: "#fff" }}>Fonte ideal:</strong> Bungee Shade ou custom cartoon bold com bordas arredondadas grossas</div>
        </div>
      </Glass>
    </div>
  );

  // ===== COMPONENTS =====
  const ComponentsSection = () => (
    <div style={{ display: "flex", flexDirection: "column", gap: 36 }}>
      {/* Buttons */}
      <div>
        <SectionTitle>Botoes</SectionTitle>
        <div style={{ display: "flex", gap: 14, flexWrap: "wrap", alignItems: "center" }}>
          {[
            { label: "START", icon: "▶", variant: "filled" },
            { label: "CRIAR SALA", icon: "➕", variant: "filled" },
            { label: "BACK", icon: "◀", variant: "outline" },
            { label: "COMO JOGAR", icon: "📖", variant: "outline" },
            { label: "VOTAR", icon: "🗳️", variant: "danger" },
            { label: "PRONTO", icon: "✓", variant: "success" },
          ].map((btn, i) => {
            const isFilled = btn.variant === "filled";
            const isDanger = btn.variant === "danger";
            const isSuccess = btn.variant === "success";
            const h = hoveredBtn === `c-${i}`;
            return (
              <button key={i}
                onMouseEnter={() => setHoveredBtn(`c-${i}`)}
                onMouseLeave={() => setHoveredBtn(null)}
                style={{
                  display: "inline-flex", alignItems: "center", gap: 10,
                  fontFamily: T.font.display, fontSize: 18, fontWeight: 900,
                  textTransform: "uppercase", letterSpacing: 1.5,
                  padding: "12px 32px", borderRadius: T.r.pill,
                  backgroundColor: isDanger ? T.colors.impostor : isSuccess ? T.colors.safe : isFilled ? T.colors.surface.primary : "transparent",
                  color: isSuccess ? T.colors.surface.primary : isFilled || isDanger ? "#fff" : T.colors.surface.primary,
                  border: `3px solid ${isDanger ? T.colors.impostor : isSuccess ? T.colors.safe : T.colors.surface.primary}`,
                  cursor: "pointer", transition: "all 0.15s ease",
                  transform: h ? "scale(1.06)" : "scale(1)",
                  boxShadow: h ? "0 6px 20px rgba(32,2,104,0.3)" : "0 2px 8px rgba(32,2,104,0.1)",
                }}>
                <span>{btn.icon}</span>
                {btn.label}
              </button>
            );
          })}
        </div>
        <Note>Bordas de 3px, border-radius: pill, font: Londrina Solid uppercase. Hover: scale(1.06). Padrão do Funocracy: fundo filled (#200268) ou outline (transparent com borda #200268).</Note>
      </div>

      {/* Inputs */}
      <div>
        <SectionTitle>Inputs (dentro do circulo branco)</SectionTitle>
        <div style={{
          background: "#fff", borderRadius: T.r.xl, padding: 28, maxWidth: 340,
          border: `4px solid ${T.colors.surface.primary}`, boxShadow: "0 8px 32px rgba(32,2,104,0.15)",
        }}>
          {[
            { label: "Nome", value: "Anonimo482", state: "default" },
            { label: "Codigo", value: "_ _ _ _", state: "placeholder" },
            { label: "Focus", value: "ABCD", state: "focus" },
            { label: "Erro", value: "XXXX", state: "error" },
          ].map((inp, i) => (
            <div key={i} style={{ marginBottom: 14 }}>
              <label style={{ fontFamily: T.font.condensed, fontSize: 11, color: inp.state === "error" ? T.colors.impostor : T.colors.surface.primary, textTransform: "uppercase", letterSpacing: 1, display: "block", marginBottom: 4 }}>
                {inp.label}
              </label>
              <div style={{
                padding: "10px 16px", borderRadius: T.r.pill,
                border: `2.5px solid ${inp.state === "focus" ? T.colors.info : inp.state === "error" ? T.colors.impostor : T.colors.surface.primary + (inp.state === "placeholder" ? "40" : "")}`,
                fontFamily: inp.label === "Codigo" || inp.state === "focus" || inp.state === "error" ? T.font.mono : T.font.body,
                fontSize: inp.label === "Codigo" ? 18 : 15,
                color: inp.state === "placeholder" ? "#bbb" : inp.state === "error" ? T.colors.impostor : T.colors.surface.primary,
                letterSpacing: inp.label === "Codigo" ? 6 : 0, textAlign: inp.label === "Codigo" ? "center" : "left",
                boxShadow: inp.state === "focus" ? `0 0 0 3px ${T.colors.info}20` : inp.state === "error" ? `0 0 0 3px ${T.colors.impostor}20` : "none",
              }}>
                {inp.value}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Player cards */}
      <div>
        <SectionTitle>Cards de Jogador (ao redor do circulo)</SectionTitle>
        <div style={{ display: "flex", gap: 16, flexWrap: "wrap" }}>
          {[
            { name: "[Rock]", emoji: "😎", host: true },
            { name: "[Lelety]", emoji: "🤪" },
            { name: "[Be]", emoji: "🤓" },
            { name: "[???]", emoji: "⏳", waiting: true },
          ].map((p, i) => (
            <div key={i} style={{ textAlign: "center", opacity: p.waiting ? 0.35 : 1 }}>
              <div style={{
                width: 64, height: 64, borderRadius: "50%", margin: "0 auto",
                backgroundColor: T.colors.surface.primary, border: p.host ? `3px solid ${T.colors.bg.center}` : "3px solid #fff",
                display: "flex", alignItems: "center", justifyContent: "center", fontSize: 28,
                boxShadow: p.host ? `0 0 16px ${T.colors.bg.center}50` : "0 2px 8px rgba(0,0,0,0.3)",
                position: "relative",
              }}>
                {p.emoji}
                {p.host && <div style={{
                  position: "absolute", top: -6, right: -6, fontSize: 14,
                }}>👑</div>}
              </div>
              <div style={{
                fontFamily: T.font.hand, fontSize: 16, color: "#fff", marginTop: 4,
                textShadow: "1px 1px 3px rgba(0,0,0,0.5)",
              }}>{p.name}</div>
            </div>
          ))}
        </div>
        <Note>Avatar circular #200268 com borda branca. Host tem borda amarela + coroa. Nomes em Kalam (handwritten) com colchetes. Distribuidos ao redor do circulo principal em posicoes cardeais.</Note>
      </div>

      {/* Badges */}
      <div>
        <SectionTitle>Badges</SectionTitle>
        <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
          {[
            { label: "HOST", bg: T.colors.bg.center, fg: T.colors.surface.primary },
            { label: "IMPOSTOR", bg: T.colors.impostor, fg: "#fff" },
            { label: "SEGURO", bg: T.colors.safe, fg: T.colors.surface.primary },
            { label: "MESTRE", bg: T.colors.special, fg: "#fff" },
            { label: "PRONTO", bg: T.colors.info, fg: "#fff" },
            { label: "ELIMINADO", bg: "#444", fg: "#888" },
            { label: "ONLINE", bg: "#0D3D2D", fg: T.colors.safe },
          ].map((b, i) => (
            <span key={i} style={{
              fontFamily: T.font.condensed, fontSize: 11, fontWeight: 700,
              backgroundColor: b.bg, color: b.fg, padding: "3px 12px",
              borderRadius: T.r.pill, letterSpacing: 1, textTransform: "uppercase",
            }}>{b.label}</span>
          ))}
        </div>
      </div>
    </div>
  );

  // ===== LAYOUT =====
  const LayoutSection = () => (
    <div style={{ display: "flex", flexDirection: "column", gap: 32 }}>
      <SectionTitle>Estrutura de Layout</SectionTitle>
      <Glass>
        <SubTitle>Camadas do Background (z-index)</SubTitle>
        <div style={{ fontFamily: T.font.body, fontSize: 14, color: T.colors.text.accent, lineHeight: 2.2 }}>
          <div><span style={{ fontFamily: T.font.mono, fontSize: 12, color: T.colors.info }}>z:1</span> — Gradiente radial (animado, cicla hue)</div>
          <div><span style={{ fontFamily: T.font.mono, fontSize: 12, color: T.colors.info }}>z:2</span> — Video em loop (mix-blend-mode: color-burn, opacity: ~0.4)</div>
          <div><span style={{ fontFamily: T.font.mono, fontSize: 12, color: T.colors.info }}>z:3</span> — Textura noise (webp, mix-blend-mode: overlay)</div>
          <div><span style={{ fontFamily: T.font.mono, fontSize: 12, color: T.colors.info }}>z:4</span> — Raios sunburst (SVG ou CSS, mix-blend-mode: screen, rotacao suave)</div>
          <div><span style={{ fontFamily: T.font.mono, fontSize: 12, color: T.colors.info }}>z:5</span> — Vinhetas nos cantos (halftone dots + sombra)</div>
        </div>
      </Glass>

      <Glass>
        <SubTitle>Layout do Lobby</SubTitle>
        <div style={{ fontFamily: T.font.body, fontSize: 14, color: T.colors.text.accent, lineHeight: 2 }}>
          <div><strong style={{ color: "#fff" }}>Centro:</strong> Circulo branco (~636px) com borda animada #200268 de 5px</div>
          <div><strong style={{ color: "#fff" }}>Dentro do circulo:</strong> Room code, config (players/rounds), botoes START/BACK</div>
          <div><strong style={{ color: "#fff" }}>Ao redor:</strong> Jogadores em posicoes cardeais (top, right, bottom, left, + diagonais)</div>
          <div><strong style={{ color: "#fff" }}>Top-left:</strong> Logo do SUS</div>
          <div><strong style={{ color: "#fff" }}>Top-right:</strong> Botoes de som e idioma</div>
          <div><strong style={{ color: "#fff" }}>Bottom-center:</strong> Footer com links (Privacy, Terms, Contact)</div>
          <div><strong style={{ color: "#fff" }}>Bottom-right:</strong> Social media icons</div>
        </div>
      </Glass>

      <Glass>
        <SubTitle>Transicoes de Tela</SubTitle>
        <div style={{ fontFamily: T.font.body, fontSize: 14, color: T.colors.text.accent, lineHeight: 2 }}>
          <div><strong style={{ color: "#fff" }}>Entrada:</strong> scale(0.23) + opacity(0) → scale(1) + opacity(1) em 300ms com cubic-bezier(1,0,1,0.61)</div>
          <div><strong style={{ color: "#fff" }}>Saida:</strong> Inverso, 300ms com cubic-bezier(0,1,0.61,1)</div>
          <div><strong style={{ color: "#fff" }}>Gradiente muda:</strong> transition: background 300ms ease-in-out (troca de default → valid → invalid)</div>
          <div><strong style={{ color: "#fff" }}>Resultado certo:</strong> Bounce animation (scale oscila 0.85-1.05) por 900ms</div>
          <div><strong style={{ color: "#fff" }}>Resultado errado:</strong> Shake horizontal (translateX ±10px) por 500ms</div>
        </div>
      </Glass>
    </div>
  );

  // ===== GAME STATES =====
  const GameStates = () => (
    <div style={{ display: "flex", flexDirection: "column", gap: 36 }}>
      {/* Secret reveal */}
      <div>
        <SectionTitle>Revelacao Secreta</SectionTitle>
        <div style={{ display: "flex", gap: 20, flexWrap: "wrap" }}>
          <div style={{
            background: "#fff", borderRadius: T.r.xl, padding: 28, width: 240, textAlign: "center",
            border: `4px solid ${T.colors.surface.primary}`, boxShadow: "0 8px 32px rgba(32,2,104,0.2)",
          }}>
            <div style={{ fontFamily: T.font.body, fontSize: 13, color: "#999" }}>Sua palavra secreta:</div>
            <div style={{ fontFamily: T.font.display, fontSize: 44, color: T.colors.surface.primary, letterSpacing: 2 }}>PIZZA</div>
            <div style={{ fontSize: 36 }}>🍕</div>
          </div>

          <div style={{
            background: T.colors.surface.primary, borderRadius: T.r.xl, padding: 28, width: 240, textAlign: "center",
            border: `4px solid ${T.colors.impostor}`, boxShadow: `0 0 40px ${T.colors.impostor}25`,
          }}>
            <div style={{ fontSize: 36, marginBottom: 6 }}>🕵️</div>
            <div style={{ fontFamily: T.font.display, fontSize: 26, color: T.colors.impostor, letterSpacing: 2 }}>IMPOSTOR!</div>
            <div style={{ fontFamily: T.font.body, fontSize: 12, color: T.colors.text.accent, marginTop: 6 }}>Blefe o melhor que puder</div>
            <div style={{
              marginTop: 14, background: `${T.colors.impostor}10`, borderRadius: T.r.md, padding: 10,
              border: `1.5px solid ${T.colors.impostor}25`,
            }}>
              <div style={{ fontFamily: T.font.condensed, fontSize: 9, color: T.colors.text.muted, textTransform: "uppercase", letterSpacing: 1 }}>Dica</div>
              <div style={{ fontFamily: T.font.display, fontSize: 22, color: T.colors.warning }}>COMIDA 🍽️</div>
            </div>
          </div>
        </div>
      </div>

      {/* Phase indicator */}
      <div>
        <SectionTitle>Fases da Rodada</SectionTitle>
        <Glass>
          <div style={{ display: "flex", gap: 4, alignItems: "center" }}>
            {[
              { label: "Segredo", done: true },
              { label: "Resposta", done: true },
              { label: "Revelacao", active: true },
              { label: "Discussao" },
              { label: "Votacao" },
              { label: "Resultado" },
            ].map((ph, i, arr) => (
              <div key={i} style={{ display: "flex", alignItems: "center", gap: 3, flex: 1 }}>
                <div style={{
                  flex: 1, textAlign: "center", padding: "7px 3px", borderRadius: T.r.sm,
                  backgroundColor: ph.active ? `${T.colors.info}20` : ph.done ? `${T.colors.safe}12` : "rgba(255,255,255,0.03)",
                  border: ph.active ? `2px solid ${T.colors.info}` : ph.done ? `1px solid ${T.colors.safe}35` : "1px solid rgba(255,255,255,0.05)",
                }}>
                  <span style={{
                    fontFamily: T.font.condensed, fontSize: 10, textTransform: "uppercase", letterSpacing: 0.3,
                    color: ph.active ? T.colors.info : ph.done ? T.colors.safe : T.colors.text.muted,
                    fontWeight: ph.active ? 700 : 400,
                  }}>{ph.done ? "✓ " : ""}{ph.label}</span>
                </div>
                {i < arr.length - 1 && <div style={{ width: 8, height: 2, backgroundColor: ph.done ? `${T.colors.safe}50` : "rgba(255,255,255,0.06)" }} />}
              </div>
            ))}
          </div>
        </Glass>
      </div>

      {/* Vote result */}
      <div>
        <SectionTitle>Resultado da Votacao</SectionTitle>
        <div style={{
          background: "#fff", borderRadius: T.r.xl, padding: 24, maxWidth: 360,
          border: `4px solid ${T.colors.surface.primary}`,
        }}>
          <div style={{ fontFamily: T.font.display, fontSize: 20, color: T.colors.surface.primary, textAlign: "center", marginBottom: 14 }}>VOTACAO</div>
          {[
            { name: "[Pedro]", votes: 3, max: 5, out: true },
            { name: "[Luan]", votes: 1, max: 5 },
            { name: "[Maria]", votes: 1, max: 5 },
          ].map((v, i) => (
            <div key={i} style={{
              display: "flex", alignItems: "center", gap: 8, padding: "6px 10px", marginBottom: 3,
              borderRadius: T.r.sm,
              backgroundColor: v.out ? `${T.colors.impostor}08` : "transparent",
              border: v.out ? `1.5px solid ${T.colors.impostor}25` : "1.5px solid transparent",
            }}>
              <span style={{
                fontFamily: T.font.hand, fontSize: 15, flex: 1,
                color: v.out ? T.colors.impostor : T.colors.surface.primary,
                textDecoration: v.out ? "line-through" : "none",
              }}>{v.name}</span>
              <div style={{ width: 70, height: 5, borderRadius: 3, backgroundColor: "#eee", overflow: "hidden" }}>
                <div style={{
                  width: `${(v.votes / v.max) * 100}%`, height: "100%",
                  backgroundColor: v.out ? T.colors.impostor : T.colors.surface.secondary, borderRadius: 3,
                }} />
              </div>
              <span style={{ fontFamily: T.font.display, fontSize: 16, color: v.out ? T.colors.impostor : T.colors.surface.primary }}>{v.votes}</span>
            </div>
          ))}
          <div style={{
            marginTop: 14, textAlign: "center", padding: 14,
            background: `${T.colors.impostor}06`, borderRadius: T.r.md, border: `2px dashed ${T.colors.impostor}25`,
          }}>
            <div style={{ fontFamily: T.font.body, fontSize: 13, color: T.colors.impostor }}>Pedro era o IMPOSTOR! 🕵️</div>
            <div style={{ fontFamily: T.font.display, fontSize: 26, color: T.colors.safe, marginTop: 2 }}>JOGADORES VENCEM!</div>
          </div>
        </div>
      </div>
    </div>
  );

  const renderSection = () => {
    switch (activeSection) {
      case "overview": return <Overview />;
      case "colors": return <Colors />;
      case "type": return <TypeSection />;
      case "logo": return <LogoSection />;
      case "components": return <ComponentsSection />;
      case "layout": return <LayoutSection />;
      case "states": return <GameStates />;
      default: return null;
    }
  };

  return (
    <>
      <link href="https://fonts.googleapis.com/css2?family=Londrina+Solid:wght@400;900&family=Balsamiq+Sans:wght@400;700&family=Kalam:wght@400;700&family=Oswald:wght@400;700&family=JetBrains+Mono:wght@400;700&family=Bungee+Shade&display=swap" rel="stylesheet" />
      <div style={{ minHeight: "100vh", position: "relative", overflow: "hidden" }}>
        <canvas ref={canvasRef} style={{ position: "fixed", inset: 0, zIndex: 0 }} />
        <div style={{ position: "relative", zIndex: 1 }}>
          <div style={{ display: "flex", gap: 5, padding: "16px 20px", justifyContent: "center", flexWrap: "wrap" }}>
            {sections.map(s => (
              <button key={s.id} onClick={() => setActiveSection(s.id)} style={{
                fontFamily: T.font.display, fontSize: 15, padding: "7px 18px", borderRadius: T.r.pill,
                backgroundColor: activeSection === s.id ? "#fff" : "rgba(32,2,104,0.4)",
                color: activeSection === s.id ? T.colors.surface.primary : "#fff",
                border: `2px solid ${activeSection === s.id ? T.colors.surface.primary : "rgba(255,255,255,0.15)"}`,
                cursor: "pointer", transition: "all 0.2s", textTransform: "uppercase", letterSpacing: 1,
                backdropFilter: "blur(8px)",
              }}>{s.label}</button>
            ))}
          </div>
          <div style={{ padding: "8px 28px 60px", maxWidth: 880, margin: "0 auto" }}>
            {renderSection()}
          </div>
        </div>
      </div>
    </>
  );
};

export default SUSDesignSystemV3;
