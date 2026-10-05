import React, { useMemo, useRef, useState, useEffect } from "react";

// =====================
//  Constantes de pista
// =====================
const M = 40;                  // px por metro (20 m -> 800 px por media pista)
const COURT_W_M = 20;          // ancho estándar 20 m
const COURT_H_M = 20;          // alto de MEDIA pista en vertical (para full será 40)
const W = COURT_W_M * M;       // 800 px
const H = COURT_H_M * M;       // 800 px (media pista)

const GOAL_W_M = 3.0;          // ancho interior de portería (metros)
const GOAL_W = GOAL_W_M * M;   // 120 px
const LINE_W = 6;              // grosor de líneas
const R6 = 6 * M;              // 240 px
const R9 = 9 * M;              // 360 px
const GOAL_DEPTH = 10;         // grosor visual de la portería (px)

const COLORS = {
  court: "#1E6FBF",
  goalArea: "#109e70",
  white: "#fff",
  attacker: "#4A98F2",
  defender: "#EB4034",
  cone: "#F28C28",
  trajectory: "#FFD400", // amarillo para trayectorias y pases
  ball: "#FF7F0E",
  stroke: "#0b0b0b",
};

// =====================
//  Tipos
// =====================
const SHAPE_TYPES = {
  ATTACKER: "attacker",
  DEFENDER: "defender",
  CONE: "cone",
  TRAJECTORY: "trajectory",
  PASS: "pass",
  BALL: "ball",
  BENCH: "bench",
  CHIRIMBOLO: "chirimbolo",
};

// =====================
//  Utilidades
// =====================
function clamp(v, min, max) { return Math.max(min, Math.min(max, v)); }

// Geometría de portería + líneas 6/9 m (para MEDIA pista: orientación attack=portería arriba, defense=abajo)
function getGoalGeometry(orientation) {
  const yGoal = orientation === "attack" ? LINE_W / 2 + GOAL_DEPTH : H - (LINE_W / 2 + GOAL_DEPTH);
  const xLpost = W / 2 - GOAL_W / 2;
  const xRpost = W / 2 + GOAL_W / 2;
  const sign = orientation === "attack" ? 1 : -1; // hacia el campo
  const y6 = yGoal + sign * R6;
  const y9 = yGoal + sign * R9;
  return { yGoal, xLpost, xRpost, y6, y9, sign };
}

// =====================
//  Paths reales 6m / 9m (IHF) para MEDIA pista
// =====================
function build6mPath(orientation) {
  const { yGoal, xLpost, xRpost, y6 } = getGoalGeometry(orientation);
  const sweep = orientation === "attack" ? 0 : 1; // sentido hacia el campo

  const leftStartX = xLpost - R6, leftStartY = yGoal;
  const leftEndX   = xLpost,      leftEndY   = y6;
  const rightEndX  = xRpost + R6, rightEndY  = yGoal;

  const path6 =
    `M ${leftStartX} ${leftStartY}` +
    ` A ${R6} ${R6} 0 0 ${sweep} ${leftEndX} ${leftEndY}` +
    ` L ${xRpost} ${y6}` +
    ` A ${R6} ${R6} 0 0 ${sweep} ${rightEndX} ${rightEndY}`;

  const path6Fill = `${path6} L ${leftStartX} ${leftStartY} Z`;
  return { path6, path6Fill };
}

function build9mPath(orientation) {
  const { yGoal, xLpost, xRpost, y9 } = getGoalGeometry(orientation);
  const sweep = orientation === "attack" ? 0 : 1;

  const leftStartX = xLpost - R9, leftStartY = yGoal;
  const leftEndX   = xLpost,      leftEndY   = y9;
  const rightEndX  = xRpost + R9, rightEndY  = yGoal;

  const path9 =
    `M ${leftStartX} ${leftStartY}` +
    ` A ${R9} ${R9} 0 0 ${sweep} ${leftEndX} ${leftEndY}` +
    ` L ${xRpost} ${y9}` +
    ` A ${R9} ${R9} 0 0 ${sweep} ${rightEndX} ${rightEndY}`;

  return { path9 };
}

// Proyecta un punto (x,y) al arco de radio r centrado en (cx,cy)
function projectToArc(cx, cy, r, x, y) {
  const ang = Math.atan2(y - cy, x - cx);
  return { x: cx + r * Math.cos(ang), y: cy + r * Math.sin(ang) };
}

// Conos en 6 m alineados con los postes
function conesAtPosts(orientation) {
  const { xLpost, xRpost, y6 } = getGoalGeometry(orientation);
  return [ { x: xLpost, y: y6 }, { x: xRpost, y: y6 } ];
}

// =====================
//  Drag suave (rAF)
// =====================
function useDraggable(onDrag) {
  const ref = React.useRef(null);
  const rafRef = React.useRef(null);
  const lastRef = React.useRef({ x: 0, y: 0 });
  const draggingRef = React.useRef(false);

  React.useEffect(() => {
    const el = ref.current; if (!el) return; const svg = () => el.ownerSVGElement;
    const toLocal = (e) => { const s = svg(); const pt = s.createSVGPoint(); pt.x = e.clientX; pt.y = e.clientY; const ctm = s.getScreenCTM().inverse(); const p = pt.matrixTransform(ctm); return { x: p.x, y: p.y }; };
    const tick = () => { rafRef.current = null; onDrag?.(lastRef.current.x, lastRef.current.y); };
    const onPointerDown = (e) => { draggingRef.current = true; lastRef.current = toLocal(e); el.setPointerCapture(e.pointerId); e.preventDefault(); };
    const onPointerMove = (e) => { if (!draggingRef.current) return; lastRef.current = toLocal(e); if (!rafRef.current) rafRef.current = requestAnimationFrame(tick); };
    const onPointerUp = (e) => { draggingRef.current = false; el.releasePointerCapture(e.pointerId); };
    el.addEventListener("pointerdown", onPointerDown); el.addEventListener("pointermove", onPointerMove); el.addEventListener("pointerup", onPointerUp); el.addEventListener("pointercancel", onPointerUp);
    return () => { el.removeEventListener("pointerdown", onPointerDown); el.removeEventListener("pointermove", onPointerMove); el.removeEventListener("pointerup", onPointerUp); el.removeEventListener("pointercancel", onPointerUp); if (rafRef.current) cancelAnimationFrame(rafRef.current); };
  }, [onDrag]);
  return ref;
}

function Triangle({ id, x, y, size = 32, fill, stroke, strokeWidth, onMove, onSelect }) {
  const ref = useDraggable((nx, ny) => onMove?.(nx, ny));
  const h = size; const half = size * 0.6; const points = `${x},${y - h / 2} ${x - half},${y + h / 2} ${x + half},${y + h / 2}`;
  return (
    <g
      ref={ref}
      data-shape-id={id}
      onPointerDown={(e) => { e.stopPropagation(); onSelect?.({ id, type: SHAPE_TYPES.DEFENDER }); }}
      style={{ cursor: "grab", touchAction: "none" }}
    >
      <polygon points={points} fill={fill} stroke={stroke} strokeWidth={strokeWidth} />
    </g>
  );
}

function Circle({ id, x, y, r = 16, fill, stroke, strokeWidth, onMove, onSelect }) {
  const ref = useDraggable((nx, ny) => onMove?.(nx, ny));
  return (
    <g
      ref={ref}
      data-shape-id={id}
      onPointerDown={(e) => { e.stopPropagation(); onSelect?.({ id, type: SHAPE_TYPES.ATTACKER }); }}
      style={{ cursor: "grab", touchAction: "none" }}
    >
      <circle cx={x} cy={y} r={r} fill={fill} stroke={stroke} strokeWidth={strokeWidth} />
    </g>
  );
}

function Cone({ id, x, y, size = 22, fill, stroke, strokeWidth, onMove, onSelect }) {
  const ref = useDraggable((nx, ny) => onMove?.(nx, ny));
  const h = size * 1.1; const base = size; const points = `${x},${y - h / 2} ${x - base / 2},${y + h / 2} ${x + base / 2},${y + h / 2}`;
  return (
    <g
      ref={ref}
      data-shape-id={id}
      onPointerDown={(e) => { e.stopPropagation(); onSelect?.({ id, type: SHAPE_TYPES.CONE }); }}
      style={{ cursor: "grab", touchAction: "none" }}
    >
      <polygon points={points} fill={fill} stroke={stroke} strokeWidth={strokeWidth} />
    </g>
  );
}

function Ball({ id, x, y, r = 10, onMove, onSelect }) {
  const ref = useDraggable((nx, ny) => onMove?.(nx, ny));
  return (
    <g
      ref={ref}
      data-shape-id={id}
      onPointerDown={(e) => { e.stopPropagation(); onSelect?.({ id, type: SHAPE_TYPES.BALL }); }}
      style={{ cursor: "grab", touchAction: "none" }}
    >
      <circle cx={x} cy={y} r={r} fill={COLORS.ball} stroke={COLORS.stroke} strokeWidth={3} />
      {/* costuras simples */}
      <path d={`M ${x - r*0.9} ${y} Q ${x} ${y - r*0.7} ${x + r*0.9} ${y}`} fill="none" stroke="#222" strokeWidth={1.5} />
      <path d={`M ${x - r*0.9} ${y} Q ${x} ${y + r*0.7} ${x + r*0.9} ${y}`} fill="none" stroke="#222" strokeWidth={1.5} />
    </g>
  );
}

function Chirimbolo({ id, x, y, r = 18, onMove, onSelect }) {
  // Vista superior con ligera sensación 3D: anillo (cuerpo) rojo + tapa amarilla
  const ref = useDraggable((nx, ny) => onMove?.(nx, ny));
  const ringSW = Math.max(6, r * 0.38); // grosor del anillo
  const innerR = Math.max(2, r - ringSW / 2 - 1); // radio de la tapa amarilla
  return (
    <g
      ref={ref}
      data-shape-id={id}
      onPointerDown={(e) => { e.stopPropagation(); onSelect?.({ id, type: SHAPE_TYPES.CHIRIMBOLO }); }}
      style={{ cursor: "grab", touchAction: "none" }}
    >
      {/* Cuerpo (anillo) rojo del cilindro */}
      <circle cx={x} cy={y} r={r} fill="none" stroke="#D32F2F" strokeWidth={ringSW} />
      {/* sombra suave inferior del anillo para efecto 3D */}
      <path d={`M ${x - r + 2} ${y} A ${r-2} ${r-2} 0 0 0 ${x + r - 2} ${y}`} stroke="#000" strokeOpacity={0.18} strokeWidth={Math.max(2, ringSW * 0.25)} fill="none" />
      {/* Tapa amarilla */}
      <circle cx={x} cy={y} r={innerR} fill="#FFD54F" stroke={COLORS.stroke} strokeWidth={2.5} />
      {/* brillo sutil en la tapa */}
      <ellipse cx={x - innerR * 0.25} cy={y - innerR * 0.25} rx={innerR * 0.55} ry={innerR * 0.35} fill="#fff" opacity={0.18} />
    </g>
  );
}

function Bench({ id, x, y, len = 140, w = 20, angle = 0, onMove, onSelect }) {
  const ref = useDraggable((nx, ny) => onMove?.(nx, ny));
  const hx = len / 2, hy = w / 2;
  return (
    <g
      ref={ref}
      data-shape-id={id}
      onPointerDown={(e) => { e.stopPropagation(); onSelect?.({ id, type: SHAPE_TYPES.BENCH }); }}
      style={{ cursor: "grab", touchAction: "none" }}
      transform={`rotate(${angle}, ${x}, ${y})`}
    >
      {/* tablero visto desde arriba */}
      <rect x={x - hx} y={y - hy} width={len} height={w} rx={w/3} ry={w/3} fill="#B07D33" stroke={COLORS.stroke} strokeWidth={4} />
      {/* remate claro para lectura */}
      <rect x={x - hx + 6} y={y - hy + 4} width={len - 12} height={w - 8} fill="#C9913F" opacity={0.65} />
    </g>
  );
}

function RotateHandle({ cx, cy, angleDeg, onRotate }) {
  // handle a una distancia fija del centro en la dirección del ángulo actual
  const R = 90; // px desde el centro
  const rad = (angleDeg * Math.PI) / 180;
  const hx = cx + Math.cos(rad) * R;
  const hy = cy + Math.sin(rad) * R;
  const ref = useDraggable((nx, ny) => {
    const ang = (Math.atan2(ny - cy, nx - cx) * 180) / Math.PI; // en grados
    onRotate?.(ang);
  });
  return (
    <g ref={ref} onPointerDown={(e) => e.stopPropagation()} style={{ cursor: "grab", touchAction: "none" }}>
      <line x1={cx} y1={cy} x2={hx} y2={hy} stroke="#333" strokeWidth={2} strokeDasharray="6 6" />
      <circle cx={hx} cy={hy} r={10} fill="#fff" stroke="#333" strokeWidth={2} />
    </g>
  );
}

// Manejador (handle) para puntos de control de trayectorias/pases
function Handle({ trajId, idx, x, y, onMove, onSelect, shapeType = SHAPE_TYPES.TRAJECTORY }) {
  const ref = useDraggable((nx, ny) => onMove?.(trajId, idx, nx, ny));
  return (
    <g ref={ref} data-handle-for={trajId} onPointerDown={(e) => { e.stopPropagation(); onSelect?.({ id: trajId, type: shapeType }); }} style={{ cursor: "grab", touchAction: "none" }}>
      <circle cx={x} cy={y} r={7} fill="#fff" stroke="#333" strokeWidth={2} />
    </g>
  );
}

// =====================
//  Exportar / Copiar PNG (robusto en sandbox)
// =====================
async function svgToCanvas(svgEl) {
  const clone = svgEl.cloneNode(true);
  clone.setAttribute("xmlns", "http://www.w3.org/2000/svg");
  const vb = clone.getAttribute("viewBox")?.split(" ").map(Number) || [0,0,W,H];
  const targetW = vb[2];
  const targetH = vb[3];
  clone.setAttribute("width", String(targetW));
  clone.setAttribute("height", String(targetH));
  const serializer = new XMLSerializer();
  const src = serializer.serializeToString(clone);
  const dataUrl = "data:image/svg+xml;charset=utf-8," + encodeURIComponent(src);
  return await new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => {
      const canvas = document.createElement("canvas");
      canvas.width = targetW; canvas.height = targetH;
      const ctx = canvas.getContext("2d");
      ctx.fillStyle = COLORS.court; ctx.fillRect(0, 0, canvas.width, canvas.height);
      ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
      resolve(canvas);
    };
    img.onerror = (e) => reject(e);
    img.src = dataUrl;
  });
}

async function canvasToBlob(canvas) {
  if (canvas.toBlob) {
    const blob = await new Promise((res) => canvas.toBlob(res, "image/png"));
    if (blob) return blob;
  }
  const dataUrl = canvas.toDataURL("image/png");
  const resp = await fetch(dataUrl);
  return await resp.blob();
}

async function downloadPNG(svgRef, filename = "ejercicio_balonmano.png") {
  try {
    const svg = svgRef.current; if (!svg) return;
    const canvas = await svgToCanvas(svg);
    const blob = await canvasToBlob(canvas);
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = filename;
    a.click();
    setTimeout(() => URL.revokeObjectURL(a.href), 2500);
  } catch (err) {
    console.warn("[Export] downloadPNG fallback:", err);
  }
}

async function copyPNGToClipboard(svgRef, setMsg) {
  const svg = svgRef.current; if (!svg) return;
  const canvas = await svgToCanvas(svg);
  const isSecure = window.isSecureContext;
  const hasClipboardWrite = typeof navigator !== "undefined" && navigator.clipboard && navigator.clipboard.write;
  const hasClipboardItem = typeof window !== "undefined" && (window.ClipboardItem || window.WebKitClipboardItem);
  try {
    // 1) Intento nativo: escribir PNG como imagen
    if (isSecure && hasClipboardWrite && hasClipboardItem) {
      const blob = await canvasToBlob(canvas);
      const ClipboardItemCtor = window.ClipboardItem || window.WebKitClipboardItem;
      await navigator.clipboard.write([new ClipboardItemCtor({ "image/png": blob })]);
      setMsg?.({ type: "ok", text: "PNG copiado al portapapeles." });
      return;
    }
    throw new Error("Clipboard image API no disponible");
  } catch (e1) {
    try {
      // 2) Fallback: copiar DataURL PNG como texto
      const dataUrl = canvas.toDataURL("image/png");
      if (isSecure && navigator.clipboard?.writeText) {
        await navigator.clipboard.writeText(dataUrl);
        setMsg?.({ type: "ok", text: "PNG (dataURL) copiado al portapapeles." });
        return;
      }
      throw new Error("No se pudo copiar dataURL");
    } catch (e2) {
      try {
        // 3) Fallback: copiar SVG como texto
        const serializer = new XMLSerializer();
        const src = serializer.serializeToString(svg);
        if (isSecure && navigator.clipboard?.writeText) {
          await navigator.clipboard.writeText(src);
          setMsg?.({ type: "ok", text: "SVG copiado al portapapeles (fallback)." });
          return;
        }
        // 3b) Fallback manual execCommand
        const ta = document.createElement("textarea");
        ta.value = src; ta.style.position = "fixed"; ta.style.opacity = "0"; document.body.appendChild(ta);
        ta.focus(); ta.select(); ta.setSelectionRange(0, ta.value.length);
        const ok = document.execCommand("copy");
        document.body.removeChild(ta);
        if (ok) { setMsg?.({ type: "ok", text: "SVG copiado con fallback manual." }); return; }
      } catch {}
      // 4) Último recurso: descargar PNG
      const blob = await canvasToBlob(canvas);
      const a = document.createElement("a");
      a.href = URL.createObjectURL(blob);
      a.download = "ejercicio_balonmano.png";
      a.click();
      setMsg?.({ type: "warn", text: "No se pudo acceder al portapapeles. Descargado PNG como alternativa." });
    }
  }
}

async function copySVGText(svgRef, setMsg) {
  try {
    const svg = svgRef.current; if (!svg) return;
    const serializer = new XMLSerializer();
    const src = serializer.serializeToString(svg);
    if (navigator.clipboard?.writeText) {
      await navigator.clipboard.writeText(src);
      setMsg?.({ type: "ok", text: "SVG (código) copiado al portapapeles." });
      return;
    }
    const ta = document.createElement("textarea");
    ta.value = src; ta.style.position = "fixed"; ta.style.opacity = "0"; document.body.appendChild(ta);
    ta.focus(); ta.select(); ta.setSelectionRange(0, ta.value.length);
    const ok = document.execCommand("copy");
    document.body.removeChild(ta);
    if (ok) setMsg?.({ type: "ok", text: "SVG (código) copiado con fallback." });
    else setMsg?.({ type: "warn", text: "No se pudo copiar automáticamente. Pega manualmente." });
  } catch (err) {
    setMsg?.({ type: "error", text: "No se pudo copiar el SVG." });
  }
}

async function copySmart(svgRef, setMsg) {
  const isSecure = window.isSecureContext;
  const canClipboard = typeof navigator !== "undefined" && navigator.clipboard && (window.ClipboardItem || window.WebKitClipboardItem);
  if (isSecure && canClipboard) return await copyPNGToClipboard(svgRef, setMsg);
  return await copySVGText(svgRef, setMsg);
}

// =====================
//  Componente principal
// =====================
export default function HandballGenerator() {
  // orientation: attack | defense | counter  (counter = pista completa)
  const [orientation, setOrientation] = useState("attack");
  const isFull = orientation === "counter";

  const [snap, setSnap] = useState("none");                 // none | 6m | 9m (ignoramos en full)
  const [shapes, setShapes] = useState([]);
  const [debug, setDebug] = useState(false);                // guía visual (solo media pista)
  const [msg, setMsg] = useState(null);                     // mensajes de exportación
  const [selected, setSelected] = useState(null);           // { id, type }
  const svgRef = useRef(null);

  const onCanvasPointerDown = (e) => {
    let node = e.target;
    while (node && node !== svgRef.current) {
      if (node.dataset && (node.dataset.trajId || node.dataset.handleFor || node.dataset.shapeId)) return;
      node = node.parentNode;
    }
    setSelected(null);
  };

  // Centro polar (para plantillas por ángulo) – no se usa en full directamente
  const { yGoal } = getGoalGeometry("attack");
  const cx = W / 2; const cy = yGoal;

  // Añadir figuras
  const addShape = (type) => {
    // En full, posición inicial por defecto: línea central
    if (isFull) {
      const id = Math.random().toString(36).slice(2);
      const x = W * 0.5; const y = H; // medio campo longitudinal
      if (type === SHAPE_TYPES.BENCH) {
        return setShapes((s) => [...s, { id, type, x, y, angle: 0, len: 140, w: 20 }]);
      }
      return setShapes((s) => [...s, { id, type, x, y }]);
    }
    const g = getGoalGeometry(orientation);
    let x = cx; let y = g.y9; if (type === SHAPE_TYPES.DEFENDER) y = g.y6;
    const id = Math.random().toString(36).slice(2);
    if (type === SHAPE_TYPES.BENCH) {
      return setShapes((s) => [...s, { id, type, x, y, angle: 0, len: 140, w: 20 }]);
    }
    setShapes((s) => [...s, { id, type, x, y }]);
  };

  const addConesAtPosts = () => {
    // En full, usamos postes de la portería superior (attack)
    const ori = isFull ? "attack" : orientation;
    const [L, R] = conesAtPosts(ori);
    const mk = (pt) => ({ id: Math.random().toString(36).slice(2), type: SHAPE_TYPES.CONE, x: pt.x, y: pt.y });
    setShapes((s) => [...s, mk(L), mk(R)]);
  };

  // Añadir curva (trayectoria/pase)
  const addTrajectory = () => {
    const id = Math.random().toString(36).slice(2);
    if (isFull) {
      const p0 = { x: W * 0.25, y: H * 0.8 };
      const p1 = { x: W * 0.50, y: H * 1.1 };
      const p2 = { x: W * 0.75, y: H * 1.3 };
      return setShapes((s) => [...s, { id, type: SHAPE_TYPES.TRAJECTORY, points: [p0, p1, p2] }]);
    }
    const g = getGoalGeometry(orientation);
    const p0 = { x: W * 0.25, y: g.y9 };
    const p1 = { x: W * 0.50, y: (g.y6 + g.y9) / 2 };
    const p2 = { x: W * 0.75, y: g.y6 + (orientation === "attack" ? 40 : -40) };
    setShapes((s) => [...s, { id, type: SHAPE_TYPES.TRAJECTORY, points: [p0, p1, p2] }]);
  };

  const addPass = () => {
    const id = Math.random().toString(36).slice(2);
    if (isFull) {
      const p0 = { x: W * 0.30, y: H * 0.9 };
      const p1 = { x: W * 0.50, y: H * 1.0 };
      const p2 = { x: W * 0.70, y: H * 1.1 };
      return setShapes((s) => [...s, { id, type: SHAPE_TYPES.PASS, points: [p0, p1, p2] }]);
    }
    const g = getGoalGeometry(orientation);
    const p0 = { x: W * 0.30, y: g.y9 };
    const p1 = { x: W * 0.50, y: (g.y6 + g.y9) / 2 - (orientation === "attack" ? 20 : -20) };
    const p2 = { x: W * 0.70, y: g.y6 + (orientation === "attack" ? 20 : -20) };
    setShapes((s) => [...s, { id, type: SHAPE_TYPES.PASS, points: [p0, p1, p2] }]);
  };

  const clear = () => setShapes([]);

  const deleteSelected = () => {
    if (!selected) return;
    setShapes((s) => s.filter((sh) => sh.id !== selected.id));
    setSelected(null);
  };

  const rotateSelectedBench = (deltaDeg) => {
    if (!selected) return;
    setShapes((s) => s.map((sh) => {
      if (sh.id !== selected.id || sh.type !== SHAPE_TYPES.BENCH) return sh;
      const angle = ((sh.angle ?? 0) + deltaDeg);
      return { ...sh, angle };
    }));
  };

  // Atajo de teclado: Supr/Backspace elimina el elemento seleccionado; flechas giran banco
  useEffect(() => {
    const onKey = (e) => {
      const t = e.target;
      const tag = t && t.tagName ? t.tagName.toLowerCase() : "";
      const isTyping = tag === "input" || tag === "textarea" || (t && t.isContentEditable);
      if (isTyping) return;

      if (selected && (e.key === "Delete" || e.key === "Backspace")) {
        e.preventDefault();
        deleteSelected();
        return;
      }

      if (selected && selected.type === SHAPE_TYPES.BENCH) {
        if (e.key === "ArrowLeft") { e.preventDefault(); rotateSelectedBench(-5); }
        if (e.key === "ArrowRight") { e.preventDefault(); rotateSelectedBench(5); }
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [selected]);

  const moveShape = (id, nx, ny) => {
    setShapes((s) => s.map((sh) => {
      if (sh.id !== id) return sh;
      if (sh.type === SHAPE_TYPES.TRAJECTORY || sh.type === SHAPE_TYPES.PASS) return sh;
      let x = nx, y = ny;
      if (!isFull && (snap === "6m" || snap === "9m")) {
        const r = snap === "6m" ? R6 : R9; const g = getGoalGeometry(orientation);
        const { xLpost, xRpost, yGoal, y6, y9 } = g; const targetY = snap === "6m" ? y6 : y9;
        if (nx < xLpost) { const p = projectToArc(xLpost, yGoal, r, nx, ny); x = p.x; y = p.y; }
        else if (nx > xRpost) { const p = projectToArc(xRpost, yGoal, r, nx, ny); x = p.x; y = p.y; }
        else { x = clamp(nx, xLpost, xRpost); y = targetY; }
      }
      const maxH = isFull ? H * 2 : H;
      x = clamp(x, LINE_W + 5, W - LINE_W - 5); y = clamp(y, LINE_W + 5, maxH - LINE_W - 5);
      return { ...sh, x, y };
    }));
  };

  const moveTrajectoryPoint = (id, idx, nx, ny) => {
    setShapes((s) => s.map((sh) => {
      if (sh.id !== id || (sh.type !== SHAPE_TYPES.TRAJECTORY && sh.type !== SHAPE_TYPES.PASS)) return sh;
      const pts = sh.points ? [...sh.points] : [];
      const maxH = isFull ? H * 2 : H;
      const x = clamp(nx, LINE_W + 5, W - LINE_W - 5);
      const y = clamp(ny, LINE_W + 5, maxH - LINE_W - 5);
      pts[idx] = { x, y };
      return { ...sh, points: pts };
    }));
  };

  // ========= Simetría: replicar elementos de la mitad derecha en la mitad izquierda =========
  const mirrorX = (x) => W - x;
  const isRightHalf = (sh) => {
    if (sh.type === SHAPE_TYPES.TRAJECTORY || sh.type === SHAPE_TYPES.PASS) {
      const pts = sh.points || [];
      const cx = pts.length ? (pts.reduce((a,p)=>a+p.x,0) / pts.length) : 0;
      return cx > W/2;
    }
    return sh.x > W/2;
  };
  const cloneMirrored = (sh) => {
    const id = Math.random().toString(36).slice(2);
    if (sh.type === SHAPE_TYPES.TRAJECTORY || sh.type === SHAPE_TYPES.PASS) {
      const pts = (sh.points||[]).map(p => ({ x: mirrorX(p.x), y: p.y }));
      return { id, type: sh.type, points: pts };
    }
    if (sh.type === SHAPE_TYPES.BENCH) {
      return { id, type: sh.type, x: mirrorX(sh.x), y: sh.y, angle: (180 - (sh.angle || 0)), len: sh.len, w: sh.w };
    }
    return { id, type: sh.type, x: mirrorX(sh.x), y: sh.y };
  };
  const applySymmetryRightToLeft = () => {
    setShapes((s) => {
      const rights = s.filter(isRightHalf);
      const mirrored = rights.map(cloneMirrored);
      return [...s, ...mirrored];
    });
  };

  // Paths de media pista (se usan solo si no es full)
  const { path6, path6Fill } = useMemo(() => build6mPath(orientation === "counter" ? "attack" : orientation), [orientation]);
  const { path9 } = useMemo(() => build9mPath(orientation === "counter" ? "attack" : orientation), [orientation]);

  const svgViewBox = isFull ? `0 0 ${W} ${H * 2}` : `0 0 ${W} ${H}`;

  // Tests simples
  useEffect(() => {
    if (isFull) return; // solo validan media pista
    const g = getGoalGeometry(orientation);
    console.debug("[TEST] 6m tramo recto =", GOAL_W, "px, y6-yGoal=", Math.abs(g.y6 - g.yGoal));
    console.debug("[TEST] postes xL/xR:", g.xLpost, g.xRpost);
  }, [orientation, isFull]);

  const tests = useMemo(() => {
    if (isFull) return [
      { name: "Modo contraataque (pista completa) activo", pass: true },
    ];
    const g = getGoalGeometry(orientation);
    const okRecto6 = Math.abs((g.xRpost - g.xLpost) - GOAL_W) < 1e-6;
    const okY6 = Math.abs(Math.abs(g.y6 - g.yGoal) - R6) < 1e-6;
    const okY9 = Math.abs(Math.abs(g.y9 - g.yGoal) - R9) < 1e-6;
    const okOrient = (orientation === "attack" ? g.y6 > g.yGoal && g.y9 > g.yGoal : g.y6 < g.yGoal && g.y9 < g.yGoal);
    const [cL, cR] = conesAtPosts(orientation);
    const okCones = Math.abs(cL.y - g.y6) < 1e-6 && Math.abs(cR.y - g.y6) < 1e-6 && Math.abs(cL.x - g.xLpost) < 1e-6 && Math.abs(cR.x - g.xRpost) < 1e-6;
    const hasCurves = shapes.some((s) => s.type === SHAPE_TYPES.TRAJECTORY || s.type === SHAPE_TYPES.PASS);
    const okPts = shapes.filter((s) => s.type === SHAPE_TYPES.TRAJECTORY || s.type === SHAPE_TYPES.PASS).every((t) => Array.isArray(t.points) && t.points.length === 3);
    const arr = [
      { name: "Tramo recto 6m = 3m", pass: okRecto6 },
      { name: "Distancia vertical 6m = R6", pass: okY6 },
      { name: "Distancia vertical 9m = R9", pass: okY9 },
      { name: "Orientación correcta (6/9 hacia el campo)", pass: okOrient },
      { name: "Conos alineados a postes/6m", pass: okCones },
    ];
    if (hasCurves) arr.push({ name: "Curvas con 3 puntos (trayecto/pase)", pass: okPts });
    return arr;
  }, [orientation, shapes, isFull]);

  useEffect(() => {
    if (selected && !shapes.some((s) => s.id === selected.id)) setSelected(null);
  }, [shapes, selected]);

  // ======== Helpers de render ========
  const HalfCourtLayer = ({ ori }) => {
    const { path6: p6, path6Fill: p6f } = build6mPath(ori);
    const { path9: p9 } = build9mPath(ori);
    const isAttack = ori === "attack";
    return (
      <g>
        {/* Área 6 m */}
        <path d={p6f} fill={COLORS.goalArea} opacity={0.9} />
        {/* Línea 6 m */}
        <path d={p6} stroke={COLORS.white} strokeWidth={LINE_W} strokeLinecap="round" fill="none" />
        {/* Línea 9 m */}
        <path d={p9} stroke={COLORS.white} strokeWidth={LINE_W} strokeDasharray="28 18" strokeLinecap="round" fill="none" />
        {/* Portería */}
        {isAttack ? (
          <rect x={(W - GOAL_W) / 2} y={LINE_W / 2} width={GOAL_W} height={GOAL_DEPTH} stroke={COLORS.white} strokeWidth={LINE_W / 2} fill="none" />
        ) : (
          <rect x={(W - GOAL_W) / 2} y={H - GOAL_DEPTH - LINE_W / 2} width={GOAL_W} height={GOAL_DEPTH} stroke={COLORS.white} strokeWidth={LINE_W / 2} fill="none" />
        )}
      </g>
    );
  };

  const maxHeight = isFull ? H * 2 : H;

  // Orden de capas: conos/bancos/chirimbolo (fondo) < líneas (trayectorias/pases) < jugadores < pelotas (frente)
  const orderedShapes = useMemo(() => {
    const rank = (t) => (
      t === SHAPE_TYPES.CONE || t === SHAPE_TYPES.BENCH || t === SHAPE_TYPES.CHIRIMBOLO ? 0 :
      (t === SHAPE_TYPES.TRAJECTORY || t === SHAPE_TYPES.PASS) ? 1 :
      (t === SHAPE_TYPES.ATTACKER || t === SHAPE_TYPES.DEFENDER) ? 2 :
      t === SHAPE_TYPES.BALL ? 3 : 1
    );
    return [...shapes].sort((a, b) => rank(a.type) - rank(b.type));
  }, [shapes]);

  // Migración suave: asegura ángulo por defecto para bancos existentes
  useEffect(() => {
    setShapes((s) => s.map((sh) => (sh.type === SHAPE_TYPES.BENCH && sh.angle === undefined)
      ? { ...sh, angle: 0, len: sh.len ?? 140, w: sh.w ?? 20 }
      : sh));
  }, []);

  return (
    <div className="w-full min-h-screen bg-slate-100">
      <div className="max-w-[1100px] mx-auto p-4 grid grid-cols-1 lg:grid-cols-[340px_1fr] gap-4">
        {/* Panel de controles */}
        <div className="bg-white rounded-2xl shadow p-4 space-y-3">
          <h2 className="text-xl font-semibold">Generador de ejercicios {isFull ? "(pista completa)" : "(media pista)"}</h2>

          <div className="flex items-center gap-2"><label className="font-medium">Orientación:</label>
            <select className="border rounded px-2 py-1" value={orientation} onChange={(e) => setOrientation(e.target.value)}>
              <option value="attack">Ataque (portería arriba)</option>
              <option value="defense">Defensa (portería abajo)</option>
              <option value="counter">Contraataque (pista completa)</option>
            </select>
          </div>

          {!isFull && (
            <div className="flex items-center gap-2"><label className="font-medium">Snap:</label>
              <select className="border rounded px-2 py-1" value={snap} onChange={(e) => setSnap(e.target.value)}>
                <option value="none">Sin snap</option>
                <option value="6m">Snap a 6 m</option>
                <option value="9m">Snap a 9 m</option>
              </select>
            </div>
          )}

          <div className="flex items-center gap-2">
            <input id="debug" type="checkbox" className="mr-2" checked={debug} onChange={(e) => setDebug(e.target.checked)} disabled={isFull} />
            <label htmlFor="debug" className="text-sm">Mostrar guía (centros de arco y postes){isFull && " — solo en media pista"}</label>
          </div>

          <div className="grid grid-cols-2 gap-2">
            <button className="bg-blue-600 hover:bg-blue-700 text-white rounded-lg py-2" onClick={() => addShape(SHAPE_TYPES.ATTACKER)}>+ Atacante</button>
            <button className="bg-red-600 hover:bg-red-700 text-white rounded-lg py-2" onClick={() => addShape(SHAPE_TYPES.DEFENDER)}>+ Defensor</button>
            <button className="bg-amber-500 hover:bg-amber-600 text-white rounded-lg py-2" onClick={() => addShape(SHAPE_TYPES.CONE)}>+ Cono</button>
            <button className="bg-teal-600 hover:bg-teal-700 text-white rounded-lg py-2" onClick={() => addShape(SHAPE_TYPES.BENCH)}>+ Banco</button>
            <button className="bg-orange-500 hover:bg-orange-600 text-white rounded-lg py-2" onClick={() => addShape(SHAPE_TYPES.BALL)}>+ Pelota</button>
            <button className="bg-slate-600 hover:bg-slate-700 text-white rounded-lg py-2" onClick={addConesAtPosts}>Conos en postes</button>
            <button className="bg-red-600 hover:bg-red-700 text-white rounded-lg py-2" onClick={() => addShape(SHAPE_TYPES.CHIRIMBOLO)}>+ Chirimbolo</button>
            <button className="bg-yellow-500 hover:bg-yellow-600 text-white rounded-lg py-2 col-span-2" onClick={addTrajectory}>+ Trayectoria (3 puntos)</button>
            <button className="bg-yellow-400 hover:bg-yellow-500 text-white rounded-lg py-2 col-span-2" onClick={addPass}>+ Pase (línea discontinua)</button>
          </div>

          <div className="flex flex-wrap gap-2 pt-2">
            <button className="bg-slate-200 hover:bg-slate-300 rounded-lg px-3 py-2" onClick={clear}>Vaciar</button>
            <button className="bg-rose-600 hover:bg-rose-700 text-white rounded-lg px-3 py-2" onClick={deleteSelected}>Eliminar seleccionado</button>
            <button className="bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg px-3 py-2" onClick={applySymmetryRightToLeft}>Simetría der→izq</button>
            <button className="bg-sky-600 hover:bg-sky-700 text-white rounded-lg px-3 py-2" onClick={() => rotateSelectedBench(-10)}>⟲ Rotar banco -10°</button>
            <button className="bg-sky-600 hover:bg-sky-700 text-white rounded-lg px-3 py-2" onClick={() => rotateSelectedBench(10)}>Rotar banco +10° ⟳</button>
            <button className="bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg px-3 py-2" onClick={() => downloadPNG(svgRef, isFull ? "ejercicio_balonmano_full.png" : "ejercicio_balonmano.png")}>
              Exportar PNG
            </button>
            <button className="bg-emerald-700 hover:bg-emerald-800 text-white rounded-lg px-3 py-2" onClick={() => copySmart(svgRef, setMsg)}>
              Copiar al portapapeles (auto)
            </button>
          </div>

          {msg && (
            <div className={`mt-2 text-sm ${msg.type === "ok" ? "text-emerald-700" : msg.type === "warn" ? "text-amber-700" : "text-rose-700"}`}>
              {msg.text}
            </div>
          )}

          <div className="pt-2 space-y-2 text-sm text-slate-600">
            <div className="flex gap-2">
              <button className="border rounded px-2 py-1 hover:bg-slate-100" onClick={() => downloadPNG(svgRef, isFull ? "test_export_full.png" : "test_export.png")}>
                Test exportar PNG
              </button>
              {!isFull && (
                <button className="border rounded px-2 py-1 hover:bg-slate-100" onClick={() => { const g = getGoalGeometry(orientation); console.log("[TEST] yGoal:", g.yGoal, " y6:", g.y6, " y9:", g.y9, " xL/xR:", g.xLpost, g.xRpost); }}>
                  Test geometría 6/9 m
                </button>
              )}
              <button className="border rounded px-2 py-1 hover:bg-slate-100" onClick={() => copySmart(svgRef, setMsg)}>
                Test copiar (auto)
              </button>
              <button className="border rounded px-2 py-1 hover:bg-slate-100" onClick={() => copySVGText(svgRef, setMsg)}>
                Test copiar SVG (texto)
              </button>
            </div>
            <ul className="list-disc ml-5">
              {tests.map((t) => (
                <li key={t.name} className={t.pass ? "text-emerald-700" : "text-rose-700"}>
                  {t.pass ? "✓" : "✗"} {t.name}
                </li>
              ))}
            </ul>
          </div>
        </div>

        {/* Lienzo */}
        <div className="bg-white rounded-2xl shadow p-2 flex items-center justify-center">
          <svg
            ref={svgRef}
            viewBox={svgViewBox}
            width="100%"
            height="100%"
            className="max-h-[85vh]"
            shapeRendering="geometricPrecision"
            xmlns="http://www.w3.org/2000/svg"
            onPointerDown={onCanvasPointerDown}
          >
            <defs>
              <marker id="arrowHead" markerWidth="6" markerHeight="6" refX="5" refY="3" orient="auto" markerUnits="strokeWidth">
                <path d="M 0 0 L 6 3 L 0 6 z" fill={COLORS.trajectory}></path>
              </marker>
            </defs>

            {/* Fondo */}
            <rect x={0} y={0} width={W} height={maxHeight} fill={COLORS.court} />

            {/* Borde exterior */}
            <rect x={LINE_W/2} y={LINE_W/2} width={W-LINE_W} height={maxHeight-LINE_W} fill="none" stroke={COLORS.white} strokeWidth={LINE_W} />

            {/* Render según modo */}
            {isFull ? (
              <>
                {/* Línea central */}
                <line x1={LINE_W} x2={W-LINE_W} y1={H} y2={H} stroke={COLORS.white} strokeWidth={LINE_W} />
                {/* Media pista superior (portería arriba) */}
                <HalfCourtLayer ori="attack" />
                {/* Media pista inferior (portería abajo) desplazada */}
                <g transform={`translate(0, ${H})`}>
                  <HalfCourtLayer ori="defense" />
                </g>
              </>
            ) : (
              <>
                {/* Área 6 m + líneas en media pista actual */}
                <path d={path6Fill} fill={COLORS.goalArea} opacity={0.9} />
                <path d={path6} stroke={COLORS.white} strokeWidth={LINE_W} strokeLinecap="round" fill="none" />
                <path d={path9} stroke={COLORS.white} strokeWidth={LINE_W} strokeDasharray="28 18" strokeLinecap="round" fill="none" />
                {/* Portería */}
                {orientation === "attack" ? (
                  <rect x={(W - GOAL_W) / 2} y={LINE_W / 2} width={GOAL_W} height={GOAL_DEPTH} stroke={COLORS.white} strokeWidth={LINE_W / 2} fill="none" />
                ) : (
                  <rect x={(W - GOAL_W) / 2} y={H - GOAL_DEPTH - LINE_W / 2} width={GOAL_W} height={GOAL_DEPTH} stroke={COLORS.white} strokeWidth={LINE_W / 2} fill="none" />
                )}

                {/* Guía debug opcional */}
                {debug && (
                  <g>
                    {(() => { const g = getGoalGeometry(orientation); return (
                      <>
                        <circle cx={g.xLpost} cy={g.yGoal} r={5} fill="#ff0" />
                        <circle cx={g.xRpost} cy={g.yGoal} r={5} fill="#ff0" />
                        <line x1={g.xLpost} y1={g.y6} x2={g.xRpost} y2={g.y6} stroke="#ff0" strokeDasharray="6 6" />
                        <line x1={g.xLpost} y1={g.y9} x2={g.xRpost} y2={g.y9} stroke="#ff0" strokeDasharray="6 6" />
                      </>
                    ); })()}
                  </g>
                )}
              </>
            )}

            {/* Figuras (orden por capas): Conos/Bancos → Líneas → Jugadores → Pelota */}
            {orderedShapes.map((sh) => {
              if (sh.type === SHAPE_TYPES.ATTACKER) return <Circle key={sh.id} id={sh.id} x={sh.x} y={sh.y} r={16} fill={COLORS.attacker} stroke={COLORS.stroke} strokeWidth={4} onMove={(nx, ny) => moveShape(sh.id, nx, ny)} onSelect={setSelected} />;
              if (sh.type === SHAPE_TYPES.DEFENDER) return <Triangle key={sh.id} id={sh.id} x={sh.x} y={sh.y} size={32} fill={COLORS.defender} stroke={COLORS.stroke} strokeWidth={4} onMove={(nx, ny) => moveShape(sh.id, nx, ny)} onSelect={setSelected} />;
              if (sh.type === SHAPE_TYPES.CONE)     return <Cone key={sh.id} id={sh.id} x={sh.x} y={sh.y} size={22} fill={COLORS.cone} stroke={COLORS.stroke} strokeWidth={4} onMove={(nx, ny) => moveShape(sh.id, nx, ny)} onSelect={setSelected} />;
              if (sh.type === SHAPE_TYPES.BENCH)    return (
                <g key={sh.id}>
                  <Bench id={sh.id} x={sh.x} y={sh.y} len={sh.len ?? 140} w={sh.w ?? 20} angle={sh.angle ?? 0}
                    onMove={(nx, ny) => moveShape(sh.id, nx, ny)} onSelect={setSelected} />
                  {selected && selected.id === sh.id && (
                    <RotateHandle cx={sh.x} cy={sh.y} angleDeg={sh.angle ?? 0}
                      onRotate={(ang) => setShapes((s) => s.map((it) => it.id === sh.id ? { ...it, angle: ang } : it))} />
                  )}
                </g>
              );
              if (sh.type === SHAPE_TYPES.BALL)     return <Ball key={sh.id} id={sh.id} x={sh.x} y={sh.y} r={10} onMove={(nx, ny) => moveShape(sh.id, nx, ny)} onSelect={setSelected} />;
              if (sh.type === SHAPE_TYPES.CHIRIMBOLO) return <Chirimbolo key={sh.id} id={sh.id} x={sh.x} y={sh.y} r={18} onMove={(nx, ny) => moveShape(sh.id, nx, ny)} onSelect={setSelected} />;

              if (sh.type === SHAPE_TYPES.TRAJECTORY) {
                const id = sh.id;
                const [p0, p1, p2] = sh.points || [{ x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }];
                const d = `M ${p0.x} ${p0.y} Q ${p1.x} ${p1.y} ${p2.x} ${p2.y}`;
                const isSelected = selected && selected.id === id && selected.type === SHAPE_TYPES.TRAJECTORY;
                return (
                  <g key={id} data-traj-id={id}>
                    <path
                      d={d}
                      stroke={COLORS.trajectory}
                      strokeWidth={6}
                      fill="none"
                      strokeLinecap="round"
                      style={{ cursor: "pointer" }}
                      markerEnd="url(#arrowHead)"
                      onPointerDown={(e) => { e.stopPropagation(); setSelected({ id, type: SHAPE_TYPES.TRAJECTORY }); }}
                    />
                    {isSelected && (
                      <>
                        <Handle trajId={id} idx={0} x={p0.x} y={p0.y} onMove={moveTrajectoryPoint} onSelect={setSelected} shapeType={SHAPE_TYPES.TRAJECTORY} />
                        <Handle trajId={id} idx={1} x={p1.x} y={p1.y} onMove={moveTrajectoryPoint} onSelect={setSelected} shapeType={SHAPE_TYPES.TRAJECTORY} />
                        <Handle trajId={id} idx={2} x={p2.x} y={p2.y} onMove={moveTrajectoryPoint} onSelect={setSelected} shapeType={SHAPE_TYPES.TRAJECTORY} />
                      </>
                    )}
                  </g>
                );
              }

              if (sh.type === SHAPE_TYPES.PASS) {
                const id = sh.id;
                const [p0, p1, p2] = sh.points || [{ x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }];
                const d = `M ${p0.x} ${p0.y} Q ${p1.x} ${p1.y} ${p2.x} ${p2.y}`;
                const isSelected = selected && selected.id === id && selected.type === SHAPE_TYPES.PASS;
                return (
                  <g key={id} data-traj-id={id}>
                    <path
                      d={d}
                      stroke={COLORS.trajectory}
                      strokeWidth={6}
                      fill="none"
                      strokeLinecap="round"
                      strokeDasharray="12 10"
                      style={{ cursor: "pointer" }}
                      markerEnd="url(#arrowHead)"
                      onPointerDown={(e) => { e.stopPropagation(); setSelected({ id, type: SHAPE_TYPES.PASS }); }}
                    />
                    {isSelected && (
                      <>
                        <Handle trajId={id} idx={0} x={p0.x} y={p0.y} onMove={moveTrajectoryPoint} onSelect={setSelected} shapeType={SHAPE_TYPES.PASS} />
                        <Handle trajId={id} idx={1} x={p1.x} y={p1.y} onMove={moveTrajectoryPoint} onSelect={setSelected} shapeType={SHAPE_TYPES.PASS} />
                        <Handle trajId={id} idx={2} x={p2.x} y={p2.y} onMove={moveTrajectoryPoint} onSelect={setSelected} shapeType={SHAPE_TYPES.PASS} />
                      </>
                    )}
                  </g>
                );
              }

              return null;
            })}
          </svg>
        </div>
      </div>
    </div>
  );
}
