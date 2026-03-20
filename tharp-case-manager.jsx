import { useState, useEffect, useCallback, useMemo, useRef } from "react";

// ── Google Fonts ──────────────────────────────────────────────────────────────
const fontLink = document.createElement("link");
fontLink.rel = "stylesheet";
fontLink.href = "https://fonts.googleapis.com/css2?family=DM+Sans:ital,opsz,wght@0,9..40,300;0,9..40,400;0,9..40,500;0,9..40,600;0,9..40,700;1,9..40,400&family=DM+Mono:wght@400;500&display=swap";
document.head.appendChild(fontLink);

// ── CSS Keyframes ────────────────────────────────────────────────────────────
const styleSheet = document.createElement("style");
styleSheet.textContent = `@keyframes spin { to { transform: rotate(360deg); } }
@keyframes fadeInUp { from { opacity: 0; transform: translateY(8px); } to { opacity: 1; transform: translateY(0); } }`;
document.head.appendChild(styleSheet);

// ── IndexedDB PDF Storage ────────────────────────────────────────────────────
const IDBNAME = "tharp-attachments";
const IDBSTORE = "pdfs";
function openIDB() {
  return new Promise((resolve, reject) => {
    const req = indexedDB.open(IDBNAME, 1);
    req.onupgradeneeded = () => req.result.createObjectStore(IDBSTORE);
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });
}
async function idbPut(key, blob) {
  const db = await openIDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(IDBSTORE, "readwrite");
    tx.objectStore(IDBSTORE).put(blob, key);
    tx.oncomplete = () => { db.close(); resolve(); };
    tx.onerror = () => { db.close(); reject(tx.error); };
  });
}
async function idbGet(key) {
  const db = await openIDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(IDBSTORE, "readonly");
    const req = tx.objectStore(IDBSTORE).get(key);
    req.onsuccess = () => { db.close(); resolve(req.result); };
    req.onerror = () => { db.close(); reject(req.error); };
  });
}
async function idbDelete(key) {
  const db = await openIDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(IDBSTORE, "readwrite");
    tx.objectStore(IDBSTORE).delete(key);
    tx.oncomplete = () => { db.close(); resolve(); };
    tx.onerror = () => { db.close(); reject(tx.error); };
  });
}
async function idbKeys() {
  const db = await openIDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(IDBSTORE, "readonly");
    const req = tx.objectStore(IDBSTORE).getAllKeys();
    req.onsuccess = () => { db.close(); resolve(req.result); };
    req.onerror = () => { db.close(); reject(req.error); };
  });
}

// ── Design Tokens ─────────────────────────────────────────────────────────────
const T = {
  bg: "#FAFAF8",
  surface: "#FFFFFF",
  surfaceHover: "#F5F4F1",
  border: "#E8E6E1",
  borderStrong: "#D4D0C8",
  text: "#1A1814",
  textMid: "#5C5852",
  textMuted: "#8A867F",
  accent: "#B8860B",
  accentBg: "#FDF8EE",
  accentBorder: "#E8C860",
  accentHover: "#A07608",
  red: "#DC2626",
  redBg: "#FEF2F2",
  redBorder: "#FECACA",
  amber: "#D97706",
  amberBg: "#FFFBEB",
  amberBorder: "#FDE68A",
  blue: "#2563EB",
  blueBg: "#EFF6FF",
  blueBorder: "#BFDBFE",
  green: "#16A34A",
  greenBg: "#F0FDF4",
  greenBorder: "#BBF7D0",
  purple: "#7C3AED",
  purpleBg: "#F5F3FF",
  purpleBorder: "#DDD6FE",
  navBg: "#111110",
  navText: "#9E9A93",
  navActive: "#FFFFFF",
  font: "'DM Sans', system-ui, -apple-system, sans-serif",
  mono: "'DM Mono', 'Fira Code', monospace",
  // Typography scale
  fs1: 11, fs2: 12, fs3: 13, fs4: 15, fs5: 18, fs6: 22, fs7: 28,
  lh: 1.5, lhTight: 1.2, lhLoose: 1.7,
  // Spacing scale (4px grid)
  sp1: 4, sp2: 8, sp3: 12, sp4: 16, sp5: 20, sp6: 24, sp7: 32,
  // Border radius tiers
  r1: 6, r2: 10, r3: 16,
  radius: 12,
  sh1: "0 1px 3px rgba(0,0,0,0.04), 0 1px 2px rgba(0,0,0,0.02)",
  sh2: "0 4px 12px rgba(0,0,0,0.06), 0 1px 3px rgba(0,0,0,0.04)",
  sh3: "0 12px 32px rgba(0,0,0,0.08), 0 4px 8px rgba(0,0,0,0.04)",
  fast: "all 0.15s ease",
  med: "all 0.25s ease",
};

// ── Icon System (inline SVG) ─────────────────────────────────────────────────
function Ic({ name, size = 16, color = "currentColor", sw = 1.75, style = {} }) {
  const P = {
    "file-text":    "M14.5 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V7.5L14.5 2z|M14 2v6h6|M16 13H8|M16 17H8|M10 9H8",
    "folder":       "M22 19a2 2 0 01-2 2H4a2 2 0 01-2-2V5a2 2 0 012-2h5l2 3h9a2 2 0 012 2z",
    "dollar":       "M12 1v22|M17 5H9.5a3.5 3.5 0 000 7h5a3.5 3.5 0 010 7H6",
    "refresh":      "M23 4v6h-6|M1 20v-6h6|M3.51 9a9 9 0 0114.85-3.36L23 10|M20.49 15a9 9 0 01-14.85 3.36L1 14",
    "mail":         "M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z|M22 6l-10 7L2 6",
    "receipt":      "M4 2v20l2-1 2 1 2-1 2 1 2-1 2 1 2-1 2 1V2l-2 1-2-1-2 1-2-1-2 1-2-1-2 1z|M16 8H8|M16 12H8|M10 16H8",
    "search":       "M19 19l-4.35-4.35|M11 19a8 8 0 100-16 8 8 0 000 16z",
    "camera":       "M23 19a2 2 0 01-2 2H3a2 2 0 01-2-2V8a2 2 0 012-2h4l2-3h6l2 3h4a2 2 0 012 2z|M12 13a4 4 0 100-8 4 4 0 000 8z",
    "scale":        "M16 16l3-8 3 8c-.87.65-1.92 1-3 1s-2.13-.35-3-1z|M2 16l3-8 3 8c-.87.65-1.92 1-3 1s-2.13-.35-3-1z|M7 21h10|M12 3v18|M3 7h2c2 0 5-1 7-2 2 1 5 2 7 2h2",
    "book":         "M4 19.5A2.5 2.5 0 016.5 17H20|M4 19.5A2.5 2.5 0 006.5 22H20V2H6.5A2.5 2.5 0 004 4.5v15z",
    "bar-chart":    "M12 20V10|M18 20V4|M6 20v-4",
    "edit":         "M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7|M18.5 2.5a2.12 2.12 0 013 3L12 15l-4 1 1-4 9.5-9.5z",
    "image":        "M19 3H5a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2V5a2 2 0 00-2-2z|M8.5 10a1.5 1.5 0 100-3 1.5 1.5 0 000 3z|M21 15l-5-5L5 21",
    "zap":          "M13 2L3 14h9l-1 10 10-12h-9l1-10z",
    "settings":     "M12 15a3 3 0 100-6 3 3 0 000 6z|M19.4 15a1.65 1.65 0 00.33 1.82l.06.06a2 2 0 010 2.83 2 2 0 01-2.83 0l-.06-.06a1.65 1.65 0 00-1.82-.33 1.65 1.65 0 00-1 1.51V21a2 2 0 01-4 0v-.09A1.65 1.65 0 009 19.4a1.65 1.65 0 00-1.82.33l-.06.06a2 2 0 01-2.83 0 2 2 0 010-2.83l.06-.06A1.65 1.65 0 004.68 15a1.65 1.65 0 00-1.51-1H3a2 2 0 010-4h.09A1.65 1.65 0 004.6 9a1.65 1.65 0 00-.33-1.82l-.06-.06a2 2 0 112.83-2.83l.06.06A1.65 1.65 0 009 4.68a1.65 1.65 0 001-1.51V3a2 2 0 114 0v.09a1.65 1.65 0 001 1.51 1.65 1.65 0 001.82-.33l.06-.06a2 2 0 012.83 2.83l-.06.06a1.65 1.65 0 00-.33 1.82V9a1.65 1.65 0 001.51 1H21a2 2 0 010 4h-.09a1.65 1.65 0 00-1.51 1z",
    "cloud":        "M18 10h-1.26A8 8 0 109 20h9a5 5 0 000-10z",
    "key":          "M21 2l-2 2m-7.61 7.61a5.5 5.5 0 11-7.78 7.78 5.5 5.5 0 017.78-7.78zm0 0L15.5 7.5m0 0l3 3L22 7l-3-3m-3.5 3.5L19 4",
    "check":        "M20 6L9 17l-5-5",
    "alert":        "M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z|M12 9v4|M12 17h.01",
    "flag":         "M4 15s1-1 4-1 5 2 8 2 4-1 4-1V3s-1 1-4 1-5-2-8-2-4 1-4 1z|M4 22V15",
    "x":            "M18 6L6 18|M6 6l12 12",
    "map-pin":      "M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0118 0z|M12 10a3 3 0 100-6 3 3 0 000 6z",
    "shield":       "M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z",
    "users":        "M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2|M9 11a4 4 0 100-8 4 4 0 000 8z|M23 21v-2a4 4 0 00-3-3.87|M16 3.13a4 4 0 010 7.75",
    "upload":       "M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4|M17 8l-5-5-5 5|M12 3v12",
    "chevron-r":    "M9 18l6-6-6-6",
    "clipboard":    "M16 4h2a2 2 0 012 2v14a2 2 0 01-2 2H6a2 2 0 01-2-2V6a2 2 0 012-2h2|M9 2h6a1 1 0 011 1v1a1 1 0 01-1 1H9a1 1 0 01-1-1V3a1 1 0 011-1z",
    "trending-up":  "M23 6l-9.5 9.5-5-5L1 18|M17 6h6v6",
    "crosshair":    "M12 22a10 10 0 100-20 10 10 0 000 20z|M22 12h-4|M6 12H2|M12 6V2|M12 22v-4",
    "grid":         "M3 3h7v7H3z|M14 3h7v7h-7z|M14 14h7v7h-7z|M3 14h7v7H3z",
    "cpu":          "M6 2h12a4 4 0 014 4v12a4 4 0 01-4 4H6a4 4 0 01-4-4V6a4 4 0 014-4z|M9 9h6v6H9z|M9 1v2|M15 1v2|M9 21v2|M15 21v2|M1 9h2|M1 15h2|M21 9h2|M21 15h2",
    "target":       "M12 22a10 10 0 100-20 10 10 0 000 20z|M12 18a6 6 0 100-12 6 6 0 000 12z|M12 14a2 2 0 100-4 2 2 0 000 4z",
    "play":         "M5 3l14 9-14 9V3z",
    "clock":        "M12 22a10 10 0 100-20 10 10 0 000 20z|M12 6v6l4 2",
    "copy":         "M20 9h-9a2 2 0 00-2 2v9a2 2 0 002 2h9a2 2 0 002-2v-9a2 2 0 00-2-2z|M5 15H4a2 2 0 01-2-2V4a2 2 0 012-2h9a2 2 0 012 2v1",
    "trash":        "M3 6h18|M8 6V4a2 2 0 012-2h4a2 2 0 012 2v2|M19 6v14a2 2 0 01-2 2H7a2 2 0 01-2-2V6|M10 11v6|M14 11v6",
    "user":         "M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2|M12 11a4 4 0 100-8 4 4 0 000 8z",
    "message-circle":"M21 11.5a8.38 8.38 0 01-.9 3.8 8.5 8.5 0 01-7.6 4.7 8.38 8.38 0 01-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 01-.9-3.8 8.5 8.5 0 014.7-7.6 8.38 8.38 0 013.8-.9h.5a8.48 8.48 0 018 8v.5z",
    "help-circle":  "M12 22a10 10 0 100-20 10 10 0 000 20z|M9.09 9a3 3 0 015.83 1c0 2-3 3-3 3|M12 17h.01",
    "send":         "M22 2L11 13|M22 2l-7 20-4-9-9-4 20-7z",
    "paperclip":    "M21.44 11.05l-9.19 9.19a6 6 0 01-8.49-8.49l9.19-9.19a4 4 0 015.66 5.66l-9.2 9.19a2 2 0 01-2.83-2.83l8.49-8.48",
    "eye":          "M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z|M12 15a3 3 0 100-6 3 3 0 000 6z",
    "download":     "M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4|M7 10l5 5 5-5|M12 15V3",
    "link":         "M10 13a5 5 0 007.54.54l3-3a5 5 0 00-7.07-7.07l-1.72 1.71|M14 11a5 5 0 00-7.54-.54l-3 3a5 5 0 007.07 7.07l1.71-1.71",
    "external-link":"M18 13v6a2 2 0 01-2 2H5a2 2 0 01-2-2V8a2 2 0 012-2h6|M15 3h6v6|M10 14L21 3",
  };
  const d = P[name];
  if (!d) return null;
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none"
      stroke={color} strokeWidth={sw} strokeLinecap="round" strokeLinejoin="round"
      style={{ display: "inline-block", verticalAlign: "middle", flexShrink: 0, ...style }}>
      {d.split("|").map((seg, i) => <path key={i} d={seg} />)}
    </svg>
  );
}

// ── Constants ─────────────────────────────────────────────────────────────────
const AUDIT_FLAGS = [
  { id: "blended_rate", label: "Blended labor rate — not actual payroll", risk: "HIGH" },
  { id: "sub_as_labor", label: "Subcontractor billed as direct labor", risk: "HIGH" },
  { id: "overhead_as_material", label: "Overhead items billed as materials", risk: "HIGH" },
  { id: "missing_invoice", label: "Missing or deficient subcontractor invoice", risk: "HIGH" },
  { id: "markup_on_markup", label: "25% markup applied to already-marked-up cost", risk: "HIGH" },
  { id: "duplicate", label: "Possible duplicate billing", risk: "HIGH" },
  { id: "no_timesheet", label: "No timesheet or payroll support for labor hours", risk: "MEDIUM" },
  { id: "rate_anomaly", label: "Labor rate anomaly vs trade classification", risk: "MEDIUM" },
  { id: "no_scope_desc", label: "Invoice lacks scope description or dates", risk: "MEDIUM" },
  { id: "owner_supplied", label: "Owner-supplied material billed incorrectly", risk: "MEDIUM" },
  { id: "co_missing", label: "Change order work billed without signed CO", risk: "MEDIUM" },
  { id: "retainage_error", label: "Retainage calculation error", risk: "LOW" },
];

const OWNER_CLAIMS_INITIAL = [
  { id: 1, description: "Incorrect insulation R38 vs R49 — 10yr energy cost", ownerAmount: 3000, agreedAmount: 0, status: "WAIVED", defense: "Architect failed to distribute revised plans. Owner declined upgrade twice. Consequential damages waived §21.11.", strength: "STRONG" },
  { id: 2, description: "Misplaced electrical switches — too far from doors", ownerAmount: 15000, agreedAmount: 3300, status: "AGREED", defense: "7 switches agreed at actual value $3,300.", strength: "MODERATE" },
  { id: 3, description: "Air return placement — guest room & bedroom 1", ownerAmount: 15000, agreedAmount: 0, status: "DISPUTED", defense: "Existing framing prohibited placement. Weekly architect meetings confirmed soffit locations. Owner refused mechanical engineer.", strength: "STRONG" },
  { id: 4, description: "Fireplace — stone sloppy, blue board showing, chips", ownerAmount: 45000, agreedAmount: 0, status: "DISPUTED", defense: "Manufacturer rep approved photos. Owner selected stone type/color. Durock per spec. Corrective work offered and refused.", strength: "STRONG" },
  { id: 5, description: "Construction delays Nov 2021–May 2023 / rental income", ownerAmount: 26600, agreedAmount: 0, status: "WAIVED", defense: "Consequential damages WAIVED §21.11. 125 COs caused delay. Owner refused to document changes.", strength: "STRONG" },
  { id: 6, description: "Shower glass cannot be installed as one piece", ownerAmount: 3000, agreedAmount: 0, status: "DISPUTED", defense: "Plan A-402 shows 3 equal panes. One-piece requires wall demo + crane. Not in contract documents.", strength: "STRONG" },
  { id: 7, description: "Dining room + kitchen floor replacement", ownerAmount: 25000, agreedAmount: 9719.38, status: "AGREED", defense: "MC acknowledged dining room flood damage. Kitchen floor undamaged. Agreed value = actual replacement cost.", strength: "MODERATE" },
  { id: 8, description: "Re-do roofing — curled/mismatched shingles", ownerAmount: 8500, agreedAmount: 0, status: "DISPUTED", defense: "Manufacturer confirmed common nailing scenario. Minor modifications sufficient. Roofing sub will correct.", strength: "MODERATE" },
  { id: 9, description: "Install two quiet air handlers (upgrade)", ownerAmount: 14000, agreedAmount: 0, status: "DISPUTED", defense: "Upgrade beyond designed system. No MEP spec provided. Installed under budget.", strength: "STRONG" },
  { id: 10, description: "Primary bedroom beams don't match at seam", ownerAmount: 3000, agreedAmount: 600, status: "AGREED", defense: "Replacement beam ordered at no cost. Credit = 2 carpenters × 4 hrs.", strength: "MODERATE" },
  { id: 11, description: "Additional living room insulation to R49", ownerAmount: 2000, agreedAmount: 0, status: "DISPUTED", defense: "Owner declined upgrade twice. Change order work, not base contract.", strength: "STRONG" },
  { id: 12, description: "Painting supply/return covers — wrong color", ownerAmount: 1000, agreedAmount: 1000, status: "AGREED", defense: "Agreed.", strength: "N/A" },
  { id: 13, description: "Kitchen bluestone walkway construction damage", ownerAmount: 1000, agreedAmount: 1000, status: "AGREED", defense: "Agreed.", strength: "N/A" },
  { id: 14, description: "New ceiling fan — primary bedroom", ownerAmount: 800, agreedAmount: 800, status: "AGREED", defense: "Agreed.", strength: "N/A" },
  { id: 15, description: "Re-stain spiral stair treads", ownerAmount: 600, agreedAmount: 600, status: "AGREED", defense: "Agreed.", strength: "N/A" },
  { id: 16, description: "Re-stain step to cow barn and cow barn floor", ownerAmount: 750, agreedAmount: 250, status: "AGREED", defense: "Agreed re-stain step. Cow barn floor adequately installed.", strength: "N/A" },
  { id: 17, description: "Wrong ceiling on kitchen porch", ownerAmount: 900, agreedAmount: 900, status: "AGREED", defense: "Agreed.", strength: "N/A" },
  { id: 18, description: "Front door framing / windows / siding uneven", ownerAmount: 8500, agreedAmount: 2260, status: "AGREED", defense: "MC replacing door trim at no cost. Windows correct. Agreed on siding.", strength: "MODERATE" },
  { id: 19, description: "French drain — basement leaked for months", ownerAmount: 10000, agreedAmount: 0, status: "DISPUTED", defense: "Existing drain installed upside down pre-Montana. No monetary basement damage caused.", strength: "STRONG" },
  { id: 20, description: "Molding around french doors — incorrect measurement", ownerAmount: 3000, agreedAmount: 1140, status: "AGREED", defense: "Agreed concept, corrected value.", strength: "N/A" },
  { id: 21, description: "Lost/stolen Kohler sink", ownerAmount: 99, agreedAmount: 0, status: "DISPUTED", defense: "Client-ordered fixture. Replacement obtained at no cost.", strength: "MODERATE" },
  { id: 22, description: "Repair and paint pantry wall and ceiling", ownerAmount: 1000, agreedAmount: 1000, status: "AGREED", defense: "Agreed.", strength: "N/A" },
  { id: 23, description: "Most doors not hung properly — gaps, rattle", ownerAmount: 3000, agreedAmount: 0, status: "DISPUTED", defense: "Punchlist work — Montana offered to complete upon receipt of past-due payment. Owner independently hired the same subcontractor who originally hung the doors and paid him to finish/balance them, undermining this claim.", strength: "STRONG" },
  { id: 24, description: "12-month warranty escrow for winter systems", ownerAmount: 10000, agreedAmount: 0, status: "DISPUTED", defense: "Warranties issue upon final payment per contract. Owner's withholding creates this condition.", strength: "STRONG" },
];

// Excel CM Tracker line items per req (trade breakdown)
const EXCEL_TRADES = {
  1:  { "Demolition & Protection": 20331.61, "Containers & Waste Removal": 6458.15, "Framing (Material)": 1908.84, "HVAC": 7600.00 },
  2:  { "Demolition & Protection": 17190.00, "Containers & Waste Removal": 2460.63, "Concrete": 7253.00, "Framing (Material)": 30627.23, "Framing (Labor)": 11020.00, "Insulation": 160.40, "Drywall & Carpentry": 678.53, "Electric": 15000.00 },
  3:  { "Concrete": 15849.00, "Framing (Material)": 8055.58, "Framing (Labor)": 10300.00, "Plumbing": 7600.00, "Electric": 20000.00, "Excavation and Fill": 7549.33 },
  4:  { "Demolition & Protection": 12838.39, "Containers & Waste Removal": 1097.88, "Concrete": 3898.00, "Railing (Allowance)": 5250.00, "Framing (Material)": 20606.47, "Composite Roof Shingles": 921.63, "Drywall & Carpentry": 321.72, "Plumbing": 13950.00, "HVAC": 20465.00, "Earthwork": 288.17 },
  5:  { "Masonry": 1945.00, "Framing (Material)": 5551.22, "Framing (Labor)": 23075.00, "Composite Roof Shingles": 9089.77, "Siding and Related Trim": 13462.03, "Windows": 8325.00, "Drywall & Carpentry": 270.92, "Electric": 12000.00, "Excavation and Fill": 2670.00 },
  6:  { "Containers & Waste Removal": 669.76, "Masonry": 3000.00, "Framing (Material)": 1895.43, "Framing (Labor)": -2387.21, "Composite Roof Shingles": 19016.50, "Siding and Related Trim": 4172.95, "Drywall & Carpentry": 10113.86 },
  7:  { "Containers & Waste Removal": 785.94, "Concrete": 24.11, "Masonry": 8910.00, "Railing (Allowance)": 2396.04, "Framing (Material)": 387.21, "Stairs & Railings (Allowance)": 9841.81, "Composite Roof Shingles": 1642.96, "Siding and Related Trim": 4067.88, "Drywall & Carpentry": 12000.00, "HVAC": 10800.00, "Electric": 20948.63 },
  8:  { "Containers & Waste Removal": 694.64, "Railing (Allowance)": 2708.15, "Framing (Material)": 95.49, "Framing (Labor)": 3600.00, "Stairs & Railings (Allowance)": 9841.67, "Composite Roof Shingles": 21393.59, "Siding and Related Trim": 12776.03, "Windows": 825.00, "Drywall & Carpentry": 15000.00, "Tile": 34925.00, "Wood Flooring": 27000.00, "HVAC": 4177.43, "Electric": 20695.00 },
  9:  { "Framing (Material)": 79.87, "Stairs & Railings (Allowance)": 6375.00, "Composite Roof Shingles": 107.29, "Siding and Related Trim": 11897.58, "Tile": 325.00, "Painting": 13565.00, "Cooling": 3102.70 },
  10: { "Materials (GC)": 623.70, "Demolition & Protection": 360.00, "Concrete": 375.00, "Masonry": 20.37, "Framing (Material)": 476.99, "Framing (Labor)": 675.00, "Composite Roof Shingles": 518.82, "Siding and Related Trim": 7740.00, "Doors, Frames & HW": 9113.04, "Drywall & Carpentry": 2446.74, "HVAC": 8735.00 },
  11: { "Containers & Waste Removal": 672.40, "Interior Trim": 19062.47, "Siding and Related Trim": 3431.93, "Drywall & Carpentry": 75.68, "Painting": 18112.50 },
  12: { "Interior Trim": 4639.64, "Gutters & Leaders": 10200.00, "Doors, Frames & HW": 16.03, "Painting": 24580.00 },
  13: { "Concrete": -24.11, "Masonry": -9902.87, "Railing (Allowance)": -2737.85, "Custom Casework": 3975.00, "Framing (Material)": -556.86, "Framing (Labor)": -2400.00, "Stairs & Railings (Allowance)": -720.00, "Interior Trim": 11548.96, "Insulation": 4599.68, "Composite Roof Shingles": 487.68, "Siding and Related Trim": 8300.66, "Doors, Frames & HW": -5151.53, "Windows": -825.00, "Drywall & Carpentry": -7992.49, "Tile": -12100.00, "Wood Flooring": -7325.22, "HVAC": -8545.13, "Electric": -41823.63, "Excavation and Fill": -1200.00 },
  14: { "Masonry": 75.00, "Custom Casework": 2081.25, "Stairs & Railings (Allowance)": 6619.40, "Interior Trim": 1291.71, "Drywall & Carpentry": 11159.69, "Wood Flooring": 20225.22, "Painting": -1997.50, "HVAC": 72615.00 },
  15: { "Railing (Allowance)": 7440.00, "Stairs & Railings (Allowance)": -7440.00, "Siding and Related Trim": 146.31, "Electric": 5015.00 },
  16: { "Foundation Waterproofing": 500.00, "Sawcutting": 8000.00, "Masonry": 20382.13, "Railing (Allowance)": 4943.66, "Custom Casework": 41793.75, "Insulation": 15819.92, "Doors, Frames & HW": 22622.47, "Shower Enclosures": 20000.00, "Windows": 6675.00, "Drywall & Carpentry": 5125.35, "Tile": 2700.00, "Wood Flooring": 1950.00, "Painting": 240.00, "Plumbing": 15450.00, "Electric": 49940.00, "Excavation and Fill": 8192.50, "Cooling": -3102.70 },
};

// ── BACKUP VARIANCE DATA ─────────────────────────────────────────────────────
// amountBilled = Cost of Work including COs (from variance analysis, Column D)
// backupDocs   = Sum of third-party invoices on file (Column E)
// directLabor  = Self-performed work by Montana Contracting (no third-party invoice)
const BACKUP_VARIANCE = {
  1:  { amountBilled: 48298.60,  backupDocs: 29835.09,  directLabor: 18360.00, items: [
    { trade: "2100 Demolition", desc: "Self-Performed Demolition", vendor: "Montana Contracting", amount: 18360.00 },
  ]},
  2:  { amountBilled: 84389.79,  backupDocs: 77879.79,  directLabor: 6510.00, items: [
    { trade: "2100 Demolition", desc: "Self-Performed Demolition", vendor: "Montana Contracting", amount: 5790.00 },
    { trade: "6400-S Framing Labor", desc: "Self-Performed Framing", vendor: "Montana Contracting", amount: 720.00 },
  ]},
  3:  { amountBilled: 81849.11,  backupDocs: 85453.91,  directLabor: 0, items: [] },
  4:  { amountBilled: 103325.37, backupDocs: 84819.55,  directLabor: 0, items: [] },
  // NOTE: backupDocs includes $12,838.39 Demolition line item closeout (NOT self-performed work).
  // Montana billed demolition to 100% of budget per AIA A110 §3.3.2 savings-split provision.
  // PCO#017 credits the owner half of the savings ($8,024). Backup = contract terms, not sub invoices.
  5:  { amountBilled: 76388.94,  backupDocs: 111522.67, directLabor: 0, items: [] },
  6:  { amountBilled: 61164.66,  backupDocs: 55312.79,  directLabor: 11850.00, items: [
    { trade: "CO#20 Framing Changes", desc: "Ceiling Padding — Living Room", vendor: "Montana Contracting", amount: 2700.00 },
    { trade: "CO#20 Framing Changes", desc: "Exterior Wall Height — Gym/Closet", vendor: "Montana Contracting", amount: 2400.00 },
    { trade: "CO#20 Framing Changes", desc: "Reframing and New Wall — Cow Barn 2nd Fl", vendor: "Montana Contracting", amount: 1200.00 },
    { trade: "CO#20 Framing Changes", desc: "Low Voltage Closet — Primary Suite", vendor: "Montana Contracting", amount: 1200.00 },
    { trade: "CO#20 Framing Changes", desc: "Floor Reframing — Powder Room", vendor: "Montana Contracting", amount: 1200.00 },
    { trade: "CO#20 Framing Changes", desc: "Shower Wall Padding — Primary Suite", vendor: "Montana Contracting", amount: 900.00 },
    { trade: "CO#20 Framing Changes", desc: "Door & Wall Relocation — Primary Suite", vendor: "Montana Contracting", amount: 600.00 },
    { trade: "CO#20 Framing Changes", desc: "Attic Plywood Flooring — Gym/Closet", vendor: "Montana Contracting", amount: 450.00 },
    { trade: "CO#20 Framing Changes", desc: "Reframing of Window Opening — Powder Room", vendor: "Montana Contracting", amount: 300.00 },
    { trade: "CO#20 Framing Changes", desc: "Wall Framing Modifications — Mudroom", vendor: "Montana Contracting", amount: 300.00 },
    { trade: "CO#20 Framing Changes", desc: "Laundry Closet — Gym", vendor: "Montana Contracting", amount: 225.00 },
    { trade: "CO#20 Framing Changes", desc: "Minor Modifications Under Tub — Primary Suite", vendor: "Montana Contracting", amount: 150.00 },
    { trade: "CO#20 Framing Changes", desc: "Attic Access Ladder Opening — Gym/Closet", vendor: "Montana Contracting", amount: 150.00 },
    { trade: "CO#20 Framing Changes", desc: "New Window Installation — Powder Room", vendor: "Montana Contracting", amount: 75.00 },
  ]},
  7:  { amountBilled: 72117.01,  backupDocs: 72366.73,  directLabor: 0, items: [] },
  8:  { amountBilled: 153732.00, backupDocs: 161769.79, directLabor: 4860.00, items: [
    { trade: "6400-S Framing Labor", desc: "Self-Performed Framing", vendor: "Montana Contracting", amount: 1200.00 },
    { trade: "7460 Siding", desc: "Self-Performed Siding", vendor: "Montana Contracting", amount: 3660.00 },
  ]},
  9:  { amountBilled: 40289.22,  backupDocs: 39642.74,  directLabor: 0, items: [] },
  10: { amountBilled: 72334.79,  backupDocs: 61384.79,  directLabor: 16230.00, items: [
    { trade: "2100 Demolition", desc: "Self-Performed Demolition (4 hrs; partial realloc → PCCO#68)", vendor: "Montana Contracting", amount: 600.00 },
    { trade: "3100 Concrete", desc: "Self-Performed Concrete Work", vendor: "Montana Contracting", amount: 375.00 },
    { trade: "6400-S Framing Labor", desc: "Self-Performed Framing (38 hrs; partial realloc → PCCO#64, #67)", vendor: "Montana Contracting", amount: 3525.00 },
    { trade: "7460 Siding", desc: "Self-Performed Siding (24 hrs partial realloc → PCCO#66)", vendor: "Montana Contracting", amount: 9180.00 },
    { trade: "9200 Drywall & Carpentry", desc: "Self-Performed Drywall/Install (10 hrs realloc → PCCO#65)", vendor: "Montana Contracting", amount: 2550.00 },
  ]},
  11: { amountBilled: 74121.03,  backupDocs: 59017.20,  directLabor: 3431.93, items: [
    { trade: "7460 Siding", desc: "Self-Performed Siding (Sandoval, Laubauskas timecards)", vendor: "Montana Contracting", amount: 3431.93 },
  ]},
  12: { amountBilled: 57465.48,  backupDocs: 55871.07,  directLabor: 0, items: [] },
  13: { amountBilled: 147391.18, backupDocs: 147271.75, directLabor: 0, items: [] },
  14: { amountBilled: 205051.14, backupDocs: 192733.58, directLabor: 15862.50, items: [
    { trade: "4200 Masonry", desc: "Self-Performed Masonry", vendor: "Montana Contracting", amount: 75.00 },
    { trade: "6200 Custom Casework", desc: "Self-Performed Casework (partial realloc → PCCO#120)", vendor: "Montana Contracting", amount: 2550.00 },
    { trade: "6400-S Interior Trim", desc: "Self-Performed Trim Work", vendor: "Montana Contracting", amount: 225.00 },
    { trade: "9200 Drywall & Carpentry", desc: "Self-Performed Drywall/Carpentry (partial realloc → Decking CO, PCCO#120, #121)", vendor: "Montana Contracting", amount: 13012.50 },
  ]},
  15: { amountBilled: 5161.31,   backupDocs: 5161.31,   directLabor: 0, items: [] },
  16: { amountBilled: 188369.02, backupDocs: 0,         directLabor: 188369.02, items: [
    { trade: "Base Trade Closeout", desc: "29 base contract lines + OH&P closed to 100% of budget per AIA G702/G703 — Montana's 50% savings share captured here", vendor: "Contractual (AIA continuation sheet)", amount: 202304.38 },
    { trade: "Remaining Approved COs", desc: "18 COs billed to completion (CO#2,4,10,14,16,26,32,34,41,42,48,52,54,58,81,93,99–101,111,118,125)", vendor: "Approved CO Log", amount: 48786.58 },
    { trade: "Base Subcontract Credits", desc: "Plumbing (#8), Electric (#9), Lighting (#11), Excavation (#24), Window (#25) base credits applied", vendor: "Credit to Owner", amount: -35797.90 },
    { trade: "CO#126 Allowance Reconciliation", desc: "Unused allowance credits returned — Railing, Stair, Shutters, Doors & Frames", vendor: "Credit to Owner", amount: -19398.59 },
    { trade: "CO#127 GC/Owner Variance Split", desc: "50/50 base budget savings credit to owner (Contract §3.3.2) — 26 trades reconciled", vendor: "Credit to Owner", amount: -53111.51 },
    { trade: "CO#128 Owner-Supplied Items", desc: "25% markup on owner-provided materials (Contract §3.3) — owner refused to furnish receipts when requested 1/8/2024", vendor: "Various (owner-furnished)", amount: 45586.06 },
  ]},
};

// ── TIMECARD DATA (from pdftotext extraction of Legal/Timecards PDFs) ────────
// REQs 1-3 are cumulative exports; REQs 4-15 are incremental per billing period
// Grand total: 3,726.25 hours · 17 unique employees · $60/hr billed rate
const TIMECARD_DATA = [
  { req: 1,  dateRange: "01/25/21 – 09/20/23", hours: 3726.25, empCount: 17, sentDate: "2022.01.27", type: "cumulative",
    employees: ["Sadequl Ameen","John Torres","Chris Lange","Thomas Ficucello","Vidal Sandoval","John Yuvienco","Jesse Grosso","Pedro Avelino","Anthony Falsetti","Jose Palacios","Michael Laubauskas","Dean Slavin","Michael Montana","Rodney Sheppard","Joseph M Montana","Duglas Berrios Martinez","Ryan O'Donohue"] },
  { req: 2,  dateRange: "01/28/22 – 09/20/23", hours: 3229.25, empCount: 16, sentDate: "2022.03.02", type: "cumulative",
    employees: ["Thomas Ficucello","Anthony Falsetti","John Yuvienco","John Torres","Pedro Avelino","Vidal Sandoval","Chris Lange","Jose Palacios","Michael Laubauskas","Dean Slavin","Michael Montana","Rodney Sheppard","Jesse Grosso","Joseph M Montana","Duglas Berrios Martinez","Ryan O'Donohue"] },
  { req: 3,  dateRange: "03/03/22 – 09/20/23", hours: 3121.25, empCount: 16, sentDate: "2022.03.31", type: "cumulative",
    employees: ["Chris Lange","Thomas Ficucello","Anthony Falsetti","John Yuvienco","Jose Palacios","John Torres","Pedro Avelino","Vidal Sandoval","Michael Laubauskas","Dean Slavin","Michael Montana","Rodney Sheppard","Jesse Grosso","Joseph M Montana","Duglas Berrios Martinez","Ryan O'Donohue"] },
  { req: 4,  dateRange: "04/01/22 – 05/03/22", hours: 167.25, empCount: 5, sentDate: "2022.05.03", type: "incremental",
    employees: ["Chris Lange","Thomas Ficucello","Anthony Falsetti","John Yuvienco","John Torres"] },
  { req: 5,  dateRange: "05/04/22 – 06/07/22", hours: 298.00, empCount: 7, sentDate: "2022.06.07", type: "incremental",
    employees: ["Thomas Ficucello","Anthony Falsetti","Jose Palacios","John Yuvienco","Vidal Sandoval","Chris Lange","Michael Laubauskas"] },
  { req: 6,  dateRange: "06/08/22 – 07/20/22", hours: 351.50, empCount: 8, sentDate: "2022.07.20", type: "incremental",
    employees: ["Vidal Sandoval","Thomas Ficucello","Michael Laubauskas","Chris Lange","Dean Slavin","Jose Palacios","Michael Montana","Anthony Falsetti"] },
  { req: 7,  dateRange: "07/21/22 – 07/28/22", hours: 150.00, empCount: 4, sentDate: "2022.08.21", type: "incremental",
    employees: ["Thomas Ficucello","Michael Laubauskas","Vidal Sandoval","John Yuvienco"] },
  { req: 8,  dateRange: "08/02/22 – 09/09/22", hours: 205.50, empCount: 6, sentDate: "2022.09.15", type: "incremental",
    employees: ["John Torres","Thomas Ficucello","Anthony Falsetti","Michael Laubauskas","Vidal Sandoval","Jose Palacios"] },
  { req: 9,  dateRange: "09/16/22 – 10/06/22", hours: 156.00, empCount: 5, sentDate: "2022.10.06", type: "incremental",
    employees: ["Thomas Ficucello","Michael Laubauskas","Vidal Sandoval","Chris Lange","Jose Palacios"] },
  { req: 10, dateRange: "10/07/22 – 11/02/22", hours: 221.00, empCount: 8, sentDate: "2022.11.02", type: "incremental",
    employees: ["Thomas Ficucello","Jose Palacios","Michael Laubauskas","Vidal Sandoval","Rodney Sheppard","Anthony Falsetti","Jesse Grosso","Chris Lange"] },
  { req: 11, dateRange: "11/03/22 – 12/01/22", hours: 239.00, empCount: 7, sentDate: "2022.12.01", type: "incremental",
    employees: ["Anthony Falsetti","Thomas Ficucello","Michael Laubauskas","Vidal Sandoval","Jose Palacios","Rodney Sheppard","Jesse Grosso"] },
  { req: 12, dateRange: "12/02/22 – 01/05/23", hours: 157.50, empCount: 8, sentDate: "2023.01.05", type: "incremental",
    employees: ["Chris Lange","Thomas Ficucello","Vidal Sandoval","Joseph M Montana","Jose Palacios","Duglas Berrios Martinez","Anthony Falsetti","Jesse Grosso"] },
  { req: 13, dateRange: "01/06/23 – 03/24/23", hours: 665.00, empCount: 9, sentDate: "2023.03.27", type: "incremental",
    employees: ["Thomas Ficucello","Anthony Falsetti","Vidal Sandoval","Jose Palacios","Jesse Grosso","Michael Laubauskas","Rodney Sheppard","Chris Lange","Duglas Berrios Martinez"] },
  { req: 14, dateRange: "03/28/23 – 05/31/23", hours: 351.50, empCount: 8, sentDate: "2023.05.31", type: "incremental",
    employees: ["Thomas Ficucello","Anthony Falsetti","Vidal Sandoval","Rodney Sheppard","Jose Palacios","Jesse Grosso","Ryan O'Donohue","Chris Lange"] },
  { req: 15, dateRange: "06/01/23 – 09/20/23", hours: 12.00, empCount: 3, sentDate: "NOT SENT", type: "incremental",
    employees: ["Thomas Ficucello","Chris Lange","Anthony Falsetti"] },
];

// ── LABOR COST CODE ANALYSIS (from QB timecard CSV export) ──────────────────
// Cost codes categorized: supervision/PM codes = non-billable (absorbed by 25% O&P)
// Trade codes = billable direct labor at $60/hr
const LABOR_ANALYSIS = {
  supervisionCodes: [
    "01-000-1-200-L", // Project Supervision
    "01-000-1-210-L", // General Supervision
    "01-000-1-225-L", // Asst Project Supervision
    "01-000-1-275-L", // Asst Project Management
    "01-000-1-285-L", // Office Administration
    "01-000-1-910-O", // Estimating
  ],
  employees: [
    { name: "Thomas Ficucello", role: "Job Superintendent", supHours: 1397.0, tradeHours: 157.0, totalHours: 1554.0, dateRange: "2021-12-06 to 2023-08-28",
      codes: { "01-000-1-200-L Project Supervision": 1387.0, "01-000-1-210-L General Supervision": 10.0, "01-000-1-100-L General Conditions": 54.5, "02-000-2-100-L Demolition": 37.0, "06-000-6-400-L Framing": 27.0, "09-000-9-200-L Drywall & Carpentry": 20.0, "07-000-7-400-L Siding": 8.0, "08-000-8-100-L Doors & Frames": 3.0, "03-000-3-100-L Concrete": 2.0 } },
    { name: "Vidal Sandoval", role: "Tradesman", supHours: 0, tradeHours: 692.0, totalHours: 692.0, dateRange: "2021-12-16 to 2023-05-09",
      codes: { "07-000-7-400-L Siding": 247.0, "09-000-9-200-L Drywall & Carpentry": 132.0, "06-000-6-400-L Framing": 117.0, "06-000-6-325-L Millwork": 115.0, "02-000-2-100-L Demolition": 45.0, "06-000-6-800-L Interior Trim": 32.0, "06-000-6-600-M Decks": 4.0 } },
    { name: "Michael Laubauskas", role: "Tradesman", supHours: 0, tradeHours: 435.0, totalHours: 435.0, dateRange: "2022-06-03 to 2023-03-16",
      codes: { "07-000-7-400-L Siding": 227.0, "09-000-9-200-L Drywall & Carpentry": 89.5, "06-000-6-400-L Framing": 85.5, "06-000-6-800-L Interior Trim": 19.0, "06-000-6-325-L Millwork": 13.0, "01-000-1-100-L General Conditions": 1.0 } },
    { name: "Jose Palacios", role: "Tradesman", supHours: 0, tradeHours: 336.5, totalHours: 336.5, dateRange: "2022-03-23 to 2023-05-09",
      codes: { "01-000-1-100-L General Conditions": 247.5, "02-000-2-100-L Demolition": 38.0, "09-000-9-200-L Drywall & Carpentry": 32.0, "03-000-3-100-L Concrete": 9.0, "07-000-7-400-L Siding": 6.0, "06-000-6-600-M Decks": 4.0 } },
    { name: "John Yuvienco", role: "Tradesman", supHours: 0, tradeHours: 184.25, totalHours: 184.25, dateRange: "2021-12-17 to 2022-07-29",
      codes: { "02-000-2-100-L Demolition": 85.0, "01-000-1-100-L General Conditions": 83.25, "07-000-7-400-L Siding": 16.0 } },
    { name: "Jesse Grosso", role: "Tradesman", supHours: 25.0, tradeHours: 95.25, totalHours: 120.25, dateRange: "2021-12-17 to 2023-04-04",
      codes: { "02-000-2-100-L Demolition": 49.0, "01-000-1-100-L General Conditions": 38.25, "01-000-1-225-L Asst Project Supervision": 25.0, "02-000-2-100-S Demolition (Sub)": 8.0 } },
    { name: "Anthony Falsetti", role: "Tradesman", supHours: 0, tradeHours: 114.5, totalHours: 114.5, dateRange: "2022-01-07 to 2023-09-20",
      codes: { "01-000-1-100-L General Conditions": 81.0, "02-000-2-100-L Demolition": 16.0, "09-000-9-900-L Painting": 9.5, "03-000-3-100-L Concrete": 3.0, "09-000-9-300-S Tile": 2.0, "04-000-4-100-L Masonry": 1.0, "06-000-6-400-L Framing": 1.0, "07-000-7-400-L Siding": 1.0 } },
    { name: "Pedro Avelino", role: "Tradesman", supHours: 0, tradeHours: 110.0, totalHours: 110.0, dateRange: "2021-12-17 to 2022-03-30",
      codes: { "02-000-2-100-L Demolition": 90.0, "01-000-1-100-L General Conditions": 20.0 } },
    { name: "Chris Lange", role: "Supervisor", supHours: 108.0, tradeHours: 0, totalHours: 108.0, dateRange: "2021-10-20 to 2023-09-19",
      codes: { "01-000-1-210-L General Supervision": 93.0, "01-000-1-200-L Project Supervision": 15.0 } },
    { name: "Rodney Sheppard", role: "Tradesman", supHours: 0, tradeHours: 40.5, totalHours: 40.5, dateRange: "2022-10-19 to 2023-04-26",
      codes: { "01-000-1-100-L General Conditions": 40.5 } },
    { name: "John Torres", role: "Asst Project Manager", supHours: 35.5, tradeHours: 2.5, totalHours: 38.0, dateRange: "2021-10-12 to 2022-09-13",
      codes: { "01-000-1-275-L Asst Project Management": 34.5, "01-000-1-100-L General Conditions": 2.5, "01-000-1-225-L Asst Project Supervision": 0.5, "01-000-1-910-O Estimating": 0.5 } },
    { name: "Duglas Berrios Martinez", role: "Tradesman", supHours: 0, tradeHours: 29.0, totalHours: 29.0, dateRange: "2022-12-30 to 2023-03-22",
      codes: { "03-000-3-100-L Concrete": 15.0, "01-000-1-100-L General Conditions": 8.0, "09-000-9-200-L Drywall & Carpentry": 6.0 } },
    { name: "Ryan O'Donohue", role: "Tradesman", supHours: 6.0, tradeHours: 18.5, totalHours: 24.5, dateRange: "2023-04-19 to 2023-04-26",
      codes: { "09-000-9-200-L Drywall & Carpentry": 18.5, "01-000-1-210-L General Supervision": 6.0 } },
    { name: "Michael Montana", role: "Tradesman", supHours: 0, tradeHours: 24.0, totalHours: 24.0, dateRange: "2022-07-13 to 2022-07-15",
      codes: { "07-000-7-400-L Siding": 16.0, "06-000-6-400-L Framing": 8.0 } },
    { name: "Dean Slavin", role: "Tradesman", supHours: 0, tradeHours: 17.0, totalHours: 17.0, dateRange: "2022-06-22 to 2022-07-27",
      codes: { "02-000-2-100-L Demolition": 11.0, "01-000-1-100-L General Conditions": 6.0 } },
    { name: "Joseph M Montana", role: "Tradesman", supHours: 0, tradeHours: 9.0, totalHours: 9.0, dateRange: "2022-12-30 to 2022-12-30",
      codes: {} },
    { name: "Sadequl Ameen", role: "Office Admin", supHours: 2.0, tradeHours: 0, totalHours: 2.0, dateRange: "2021-09-20 to 2021-11-10",
      codes: { "01-000-1-285-L Office Administration": 2.0 } },
  ],
  totals: { supHours: 1573.5, tradeHours: 2265.0, totalHours: 3838.5 },
};

// ── PAYROLL COST DATA (from Montana Contracting Payroll Summary 11/28/2023) ──
// Actual burdened cost per employee on Tharp project
// Burden includes: employer taxes (FICA 7.65%, NY UI 3.03%, WC 17%, etc.) + vacation + 25% overhead
// Billed rate: all labor billed at uniform $60/hr blended rate
const PAYROLL_COST_DATA = [
  { name: "Ficucello, Thomas",       role: "Job Superintendent", hourlyBase: 39.66, employerContrib: 11.50, vacation: 2.00, totalCostHr: 53.16, burden25: 13.29, burdenedRate: 66.45, hours: 1554.00, actualCost: 103266, billingRate: 60 },
  { name: "Sandoval, Vidal A",       role: "Tradesman",          hourlyBase: 35.00, employerContrib: 10.15, vacation: 2.00, totalCostHr: 47.15, burden25: 11.79, burdenedRate: 58.94, hours: 692.00,  actualCost: 40785,  billingRate: 60 },
  { name: "Laubauskas, Michael",     role: "Tradesman",          hourlyBase: 28.00, employerContrib: 8.12,  vacation: 2.00, totalCostHr: 38.12, burden25: 9.53,  burdenedRate: 47.65, hours: 435.00,  actualCost: 20728,  billingRate: 60 },
  { name: "Palacios, Jose",          role: "Tradesman",          hourlyBase: 24.00, employerContrib: 6.96,  vacation: 2.00, totalCostHr: 32.96, burden25: 8.24,  burdenedRate: 41.20, hours: 336.50,  actualCost: 13864,  billingRate: 60 },
  { name: "Yuvienco, John",          role: "Tradesman",          hourlyBase: 22.00, employerContrib: 6.38,  vacation: 2.00, totalCostHr: 30.38, burden25: 7.60,  burdenedRate: 37.98, hours: 184.25,  actualCost: 6997,   billingRate: 60 },
  { name: "Grosso, Jessica",         role: "Tradesman",          hourlyBase: 31.25, employerContrib: 9.06,  vacation: 2.00, totalCostHr: 42.31, burden25: 10.58, burdenedRate: 52.89, hours: 120.25,  actualCost: 6360,   billingRate: 60 },
  { name: "Falsetti, Anthony J",     role: "Tradesman",          hourlyBase: 25.00, employerContrib: 7.25,  vacation: 2.00, totalCostHr: 34.25, burden25: 8.56,  burdenedRate: 42.81, hours: 114.50,  actualCost: 4902,   billingRate: 60 },
  { name: "Avelino, Pedro",          role: "Tradesman",          hourlyBase: 17.00, employerContrib: 4.93,  vacation: 2.00, totalCostHr: 23.93, burden25: 5.98,  burdenedRate: 29.91, hours: 110.00,  actualCost: 3290,   billingRate: 60 },
  { name: "Lange, Chris",            role: "Supervisor",         hourlyBase: 57.69, employerContrib: 16.73, vacation: 2.00, totalCostHr: 76.42, burden25: 19.11, burdenedRate: 95.53, hours: 108.00,  actualCost: 10317,  billingRate: 60 },
  { name: "Sheppard, Rodney L",      role: "Tradesman",          hourlyBase: 23.00, employerContrib: 6.67,  vacation: 2.00, totalCostHr: 31.67, burden25: 7.92,  burdenedRate: 39.59, hours: 40.50,   actualCost: 1603,   billingRate: 60 },
  { name: "Torres, John",            role: "Asst Project Mgr",   hourlyBase: 28.85, employerContrib: 8.37,  vacation: 2.00, totalCostHr: 39.22, burden25: 9.80,  burdenedRate: 49.02, hours: 38.00,   actualCost: 1863,   billingRate: 60 },
  { name: "Berrios Martinez, Duglas",role: "Tradesman",          hourlyBase: 25.00, employerContrib: 7.25,  vacation: 2.00, totalCostHr: 34.25, burden25: 8.56,  burdenedRate: 42.81, hours: 29.00,   actualCost: 1242,   billingRate: 60 },
  { name: "O'Donahue, Ryan",         role: "Supervisor",         hourlyBase: 43.27, employerContrib: 12.55, vacation: 2.00, totalCostHr: 57.82, burden25: 14.45, burdenedRate: 72.27, hours: 24.50,   actualCost: 1771,   billingRate: 60 },
  { name: "Montana, Michael",        role: "Tradesman",          hourlyBase: 28.00, employerContrib: 8.12,  vacation: 2.00, totalCostHr: 38.12, burden25: 9.53,  burdenedRate: 47.65, hours: 24.00,   actualCost: 1144,   billingRate: 60 },
  { name: "Slavin, Dean",            role: "Tradesman",          hourlyBase: 18.00, employerContrib: 5.22,  vacation: 2.00, totalCostHr: 25.22, burden25: 6.31,  burdenedRate: 31.53, hours: 17.00,   actualCost: 536,    billingRate: 60 },
  { name: "Montana, Joseph M.",      role: "Project Manager",    hourlyBase: 48.00, employerContrib: 13.92, vacation: 2.00, totalCostHr: 63.92, burden25: 15.98, burdenedRate: 79.90, hours: 9.00,    actualCost: 719,    billingRate: 60 },
];
// Control total: 3,852 hours · $219,387 actual burdened cost
// Employer tax/burden breakdown: Fed UI 0.60%, SS 6.20%, Medicare 1.45%, NY Disability 0.45%, NY UI 3.03%, NY Re-employment 0.08%, Workers Comp 17.00% = 28.80% total

// ── PARSED INVOICE TOTALS (from Matt's invoice labeling spreadsheet) ────────
// These are BASE CONTRACT cost-of-work totals per req (pre-markup)
// Source: extracted_invoice_spreadsheet_tabs.txt BASE CONTRACT TOTALS row
const PARSED_INVOICE_TOTALS = {
  1:  36298.60,
  2:  72989.79,
  3:  69353.91,
  4:  79637.26,
  5:  76388.94,
  6:  36481.29,
  7:  71804.58,
  8:  153732.00,
  9:  35452.44,
  10: 30460.96,
  11: 41354.98,
  12: 39435.67,
  13: -72392.71,  // REQ-13R1 credit/reversal
  14: 112069.77,
  15: 5161.31,
  16: 0,          // Closeout req — not in parsed spreadsheet
};

// ── PLAINTIFF CLAIMED AMOUNTS (per req — what Tharp says Montana invoiced) ──
// TODO: populate with actual plaintiff figures when available
const PLAINTIFF_CLAIMED = {
  // 1: 0, 2: 0, ... etc — awaiting data from Matt
};

// ── INVOICE CATALOGUE ────────────────────────────────────────────────────────
// Parsed from billing admin spreadsheet. Base contract invoices (REQs 1-15).
// CO reallocation entries and REQ-16 closeout to be added in future update.
const INVOICE_CATALOGUE = [
  // ── REQ-01 ──
  { id: "R01-001", req: 1, vendor: "Home Depot", desc: "Miscellaneous materials", amount: 99.52, hasBackup: true, type: "invoice" },
  { id: "R01-002", req: 1, vendor: "Home Depot", desc: "Miscellaneous materials", amount: 210.66, hasBackup: true, type: "invoice" },
  { id: "R01-005", req: 1, vendor: "Beckerle", desc: "Tempered Hardboard", amount: 52.02, hasBackup: true, type: "invoice" },
  { id: "R01-006", req: 1, vendor: "Beckerle", desc: "Blades", amount: 28.11, hasBackup: true, type: "invoice" },
  { id: "R01-007", req: 1, vendor: "Beckerle", desc: "Protection Material", amount: 414.29, hasBackup: true, type: "invoice" },
  { id: "R01-008", req: 1, vendor: "BFS", desc: "Temporary Wall Materials", amount: 264.65, hasBackup: true, type: "invoice" },
  { id: "R01-009", req: 1, vendor: "Home Depot", desc: "Misc. Materials", amount: 122.85, hasBackup: true, type: "invoice" },
  { id: "R01-010", req: 1, vendor: "Home Depot", desc: "Misc. Materials", amount: 117.46, hasBackup: true, type: "invoice" },
  { id: "R01-011", req: 1, vendor: "Home Depot", desc: "Misc. Materials", amount: 115.51, hasBackup: true, type: "invoice" },
  { id: "R01-012", req: 1, vendor: "Home Depot", desc: "Misc. Materials", amount: 47.63, hasBackup: true, type: "invoice" },
  { id: "R01-013", req: 1, vendor: "Home Depot", desc: "Misc. Materials", amount: 222.11, hasBackup: true, type: "invoice" },
  { id: "R01-014", req: 1, vendor: "Montana Contracting", desc: "Demolition", amount: 18360, hasBackup: true, type: "self-performed" },
  { id: "R01-015", req: 1, vendor: "Robert Hiep", desc: "Container", amount: 670.28, hasBackup: true, type: "invoice" },
  { id: "R01-016", req: 1, vendor: "Robert Hiep", desc: "Container", amount: 753.21, hasBackup: true, type: "invoice" },
  { id: "R01-017", req: 1, vendor: "Robert Hiep", desc: "Container", amount: 861.58, hasBackup: true, type: "invoice" },
  { id: "R01-018", req: 1, vendor: "Robert Hiep", desc: "Container", amount: 1886.51, hasBackup: true, type: "invoice" },
  { id: "R01-019", req: 1, vendor: "Robert Hiep", desc: "Container", amount: 765.86, hasBackup: true, type: "invoice" },
  { id: "R01-020", req: 1, vendor: "Robert Hiep", desc: "Container", amount: 494.42, hasBackup: true, type: "invoice" },
  { id: "R01-021", req: 1, vendor: "Robert Hiep", desc: "Container", amount: 574.89, hasBackup: true, type: "invoice" },
  { id: "R01-022", req: 1, vendor: "Robert Hiep", desc: "Container", amount: 451.4, hasBackup: true, type: "invoice" },
  { id: "R01-023", req: 1, vendor: "Beckerle Lumber", desc: "Window wrap", amount: 65.68, hasBackup: true, type: "invoice" },
  { id: "R01-024", req: 1, vendor: "Valley Mechanical Services", desc: "Relocate Furnace", amount: 7600, hasBackup: true, type: "invoice" },
  // ── REQ-02 ──
  { id: "R02-001", req: 2, vendor: "Patriot Sawcutting", desc: "Sawcut & chop concrete slab", amount: 11400, hasBackup: true, type: "invoice" },
  { id: "R02-003a", req: 2, vendor: "Robert Hiep", desc: "Dumpster", amount: 433.5, hasBackup: true, type: "invoice" },
  { id: "R02-003b", req: 2, vendor: "Paul Bitts", desc: "Excavation", amount: 4400, hasBackup: true, type: "invoice" },
  { id: "R02-003c", req: 2, vendor: "Rockland Masonry Depot", desc: "Masonry sand", amount: 285.95, hasBackup: true, type: "invoice" },
  { id: "R02-003d", req: 2, vendor: "Rockland Masonry Depot", desc: "Blue stone", amount: 250.18, hasBackup: true, type: "invoice" },
  { id: "R02-003e", req: 2, vendor: "Rockland Masonry Depot", desc: "Blue stone", amount: 671.38, hasBackup: true, type: "invoice" },
  { id: "R02-003f", req: 2, vendor: "Home Depot", desc: "Foamular", amount: 84.47, hasBackup: true, type: "invoice" },
  { id: "R02-003g", req: 2, vendor: "Builders First Source", desc: "Foamular", amount: 1520.46, hasBackup: true, type: "invoice" },
  { id: "R02-003h", req: 2, vendor: "Beckerle", desc: "Foam", amount: 50.94, hasBackup: true, type: "invoice" },
  { id: "R02-003i", req: 2, vendor: "Paul Bitts", desc: "Excavate & backfill", amount: 2670, hasBackup: true, type: "invoice" },
  { id: "R02-004", req: 2, vendor: "Robert Hiep", desc: "Dumpster", amount: 921.84, hasBackup: true, type: "invoice" },
  { id: "R02-005", req: 2, vendor: "Robert Hiep", desc: "Dumpster", amount: 581.32, hasBackup: true, type: "invoice" },
  { id: "R02-006", req: 2, vendor: "Robert Hiep", desc: "Dumpster", amount: 523.97, hasBackup: true, type: "invoice" },
  { id: "R02-007", req: 2, vendor: "Echo Stamp Concrete", desc: "Cow Barn Slab", amount: 7253, hasBackup: true, type: "invoice" },
  { id: "R02-008", req: 2, vendor: "Beckerle Lumber", desc: "Douglas FIR", amount: 468.18, hasBackup: true, type: "invoice" },
  { id: "R02-010", req: 2, vendor: "H&J Home Improvements", desc: "Labor for framing", amount: 10300, hasBackup: true, type: "invoice" },
  { id: "R02-012", req: 2, vendor: "Builders First Source", desc: "Materials", amount: 109.46, hasBackup: true, type: "invoice" },
  { id: "R02-013", req: 2, vendor: "Builders First Source", desc: "Materials", amount: 50.94, hasBackup: true, type: "invoice" },
  { id: "R02-014", req: 2, vendor: "Lowe's", desc: "Materials", amount: 173.49, hasBackup: true, type: "invoice" },
  { id: "R02-015", req: 2, vendor: "Home Depot", desc: "Materials", amount: 194.97, hasBackup: true, type: "invoice" },
  { id: "R02-016", req: 2, vendor: "Home Depot", desc: "Materials", amount: 86.43, hasBackup: true, type: "invoice" },
  { id: "R02-017", req: 2, vendor: "Home Depot", desc: "Materials", amount: 21.36, hasBackup: true, type: "invoice" },
  { id: "R02-018", req: 2, vendor: "Beckerle Lumber", desc: "Halite/Rock salt", amount: 18.79, hasBackup: true, type: "invoice" },
  { id: "R02-019", req: 2, vendor: "Beckerle Lumber", desc: "Tarp, Hammer Tacker", amount: 183.49, hasBackup: true, type: "invoice" },
  { id: "R02-020", req: 2, vendor: "DeLeonardis Electric", desc: "Electrical", amount: 15000, hasBackup: true, type: "invoice" },
  // ── REQ-03 ──
  { id: "R03-001a", req: 3, vendor: "Echo Stamp Concrete", desc: "East Foundation Walls CCO#1 to Sub | Base Contract to Client", amount: 9950, hasBackup: true, type: "invoice" },
  { id: "R03-001b", req: 3, vendor: "Echo Stamp Concrete", desc: "West Foundation Walls Per Base Contract", amount: 5899, hasBackup: true, type: "invoice" },
  { id: "R03-002", req: 3, vendor: "Builders First Source", desc: "Misc. materials", amount: 90.16, hasBackup: true, type: "invoice" },
  { id: "R03-003", req: 3, vendor: "Home Depot", desc: "Misc. materials", amount: 39.98, hasBackup: true, type: "invoice" },
  { id: "R03-004", req: 3, vendor: "H&J Home Improvements", desc: "Labor for Framing", amount: 10300, hasBackup: true, type: "invoice" },
  { id: "R03-005", req: 3, vendor: "Smith Cooling & Heating", desc: "Plumbing", amount: 7600, hasBackup: true, type: "invoice" },
  { id: "R03-006", req: 3, vendor: "DeLeonardis Electric", desc: "Electrical", amount: 20000, hasBackup: true, type: "invoice" },
  // ── REQ-04 ──
  { id: "R04-001", req: 4, vendor: "Montana Contracting", desc: "Line Item Closeout", amount: 12838.39, hasBackup: true, type: "self-performed" },
  { id: "R04-002", req: 4, vendor: "Robert Hiep", desc: "Containers & Waste Removal", amount: 335.14, hasBackup: true, type: "invoice" },
  { id: "R04-003", req: 4, vendor: "Robert Hiep", desc: "Containers & Waste Removal", amount: 374.93, hasBackup: true, type: "invoice" },
  { id: "R04-004", req: 4, vendor: "Robert Hiep", desc: "Containers & Waste Removal", amount: 387.81, hasBackup: true, type: "invoice" },
  { id: "R04-005", req: 4, vendor: "Echo Stamp", desc: "Final Payment", amount: 6400, hasBackup: true, type: "invoice" },
  { id: "R04-006", req: 4, vendor: "Echo Stamp", desc: "Credit for Winter Conditions. See Change Orders - MN", amount: -2102, hasBackup: true, type: "credit" },
  { id: "R04-007", req: 4, vendor: "Echo Stamp", desc: "Credit for $400 Additional Pier - See Change Orders", amount: -400, hasBackup: true, type: "credit" },
  { id: "R04-008", req: 4, vendor: "Pauli D's Mobile Welding", desc: "Steel Bracket SC#07", amount: 250, hasBackup: true, type: "invoice" },
  { id: "R04-009", req: 4, vendor: "Pauli D's Mobile Welding", desc: "Structural Steel SC#02", amount: 5000, hasBackup: true, type: "invoice" },
  { id: "R04-010", req: 4, vendor: "Beckerle Lumber", desc: "Urethane. Adhesive", amount: 61.5, hasBackup: true, type: "invoice" },
  { id: "R04-011", req: 4, vendor: "Builders First Source", desc: "Misc. Materials", amount: 3597.29, hasBackup: true, type: "invoice" },
  { id: "R04-012", req: 4, vendor: "Builders First Source", desc: "Misc. Materials", amount: 83.78, hasBackup: true, type: "invoice" },
  { id: "R04-013", req: 4, vendor: "Builders First Source", desc: "Misc. Materials", amount: 837.85, hasBackup: true, type: "invoice" },
  { id: "R04-014", req: 4, vendor: "Bauco Access Panel Solutions", desc: "Access Panels", amount: 321.72, hasBackup: true, type: "invoice" },
  { id: "R04-015", req: 4, vendor: "Smith Cooling & Heating", desc: "Base Contract 50% Progress Payment", amount: 13950, hasBackup: true, type: "invoice" },
  { id: "R04-016", req: 4, vendor: "Valley Mechanical", desc: "Relocate 2nd Floor Boiler & Piping SC#01", amount: 3465, hasBackup: true, type: "invoice" },
  { id: "R04-017", req: 4, vendor: "Valley Mechanical", desc: "Radiant Heat Zone @ Living Room & Entry CCO#002", amount: 8500, hasBackup: true, type: "invoice" },
  { id: "R04-018", req: 4, vendor: "Valley Mechanical", desc: "Radiant Heat Zone @ Bedrooms CCO#002", amount: 8500, hasBackup: true, type: "invoice" },
  { id: "R04-019", req: 4, vendor: "Beckerle", desc: "Blade, gorilla tape, paint", amount: 52.43, hasBackup: true, type: "invoice" },
  { id: "R04-020", req: 4, vendor: "Beckerle", desc: "Pipe insulation", amount: 1.72, hasBackup: true, type: "invoice" },
  { id: "R04-021", req: 4, vendor: "Beckerle", desc: "Mason sand", amount: 141.3, hasBackup: true, type: "invoice" },
  { id: "R04-022", req: 4, vendor: "Home Depot", desc: "Flex coupling, drain pipe", amount: 38.1, hasBackup: true, type: "invoice" },
  { id: "R04-023", req: 4, vendor: "Rockland Masonry Depot", desc: "Bluestone", amount: 54.62, hasBackup: true, type: "invoice" },
  // ── REQ-05 ──
  { id: "R05-001", req: 5, vendor: "Masonry depot", desc: "Cutstock, stone rip cutting", amount: 700.64, hasBackup: true, type: "invoice" },
  { id: "R05-002", req: 5, vendor: "Masonry depot", desc: "Eldorado Nantucket", amount: 1244.36, hasBackup: true, type: "invoice" },
  { id: "R05-003", req: 5, vendor: "Home Depot", desc: "Deck screw, silicone", amount: 219.69, hasBackup: true, type: "invoice" },
  { id: "R05-004", req: 5, vendor: "H&J Home Improvements", desc: "Base Contract Progress Payment", amount: 11300, hasBackup: true, type: "invoice" },
  { id: "R05-006", req: 5, vendor: "H&J Home Improvements", desc: "Progress Payment", amount: 15862.5, hasBackup: true, type: "invoice" },
  { id: "R05-007", req: 5, vendor: "Quatrochi & Sons Roofing", desc: "Ice & Water shield on roof", amount: 1912.5, hasBackup: true, type: "invoice" },
  { id: "R05-008", req: 5, vendor: "National Building Supply", desc: "Roofing material", amount: 5243.18, hasBackup: true, type: "invoice" },
  { id: "R05-009", req: 5, vendor: "Builders First Source", desc: "Henry Eaveguard", amount: 91.71, hasBackup: true, type: "invoice" },
  { id: "R05-010", req: 5, vendor: "ABC Supply Co.", desc: "Copper Soft Roll", amount: 1842.38, hasBackup: true, type: "invoice" },
  { id: "R05-011", req: 5, vendor: "Dykes", desc: "Azek trim boards", amount: 13462.03, hasBackup: true, type: "invoice" },
  { id: "R05-012", req: 5, vendor: "H&J Home Improvements", desc: "Window Installation (Complete Contract Value)", amount: 8250, hasBackup: true, type: "invoice" },
  { id: "R05-013", req: 5, vendor: "Bauco Acces Panel Solutions", desc: "Access Panels", amount: 270.92, hasBackup: true, type: "invoice" },
  // ── REQ-06 ──
  { id: "R06-001", req: 6, vendor: "Robert Hiep", desc: "Container", amount: 669.76, hasBackup: true, type: "invoice" },
  { id: "R06-002", req: 6, vendor: "Coppola & Sons", desc: "Labor & materials", amount: 3000, hasBackup: true, type: "invoice" },
  { id: "R06-005", req: 6, vendor: "ABC Supply", desc: "Roofing material", amount: 19016.5, hasBackup: true, type: "invoice" },
  { id: "R06-006", req: 6, vendor: "Dykes Lumber", desc: "Azek trim", amount: 1754.59, hasBackup: true, type: "invoice" },
  { id: "R06-007", req: 6, vendor: "Home Depot", desc: "Azek trim", amount: 99.64, hasBackup: true, type: "invoice" },
  { id: "R06-008a", req: 6, vendor: "Builders First Source", desc: "Framing material", amount: 529.29, hasBackup: true, type: "invoice" },
  { id: "R06-008b", req: 6, vendor: "Ontime Supply", desc: "Wire coil", amount: 985.84, hasBackup: true, type: "invoice" },
  { id: "R06-009", req: 6, vendor: "Beckerle Lumber", desc: "Wasp & hornet spray", amount: 8.6, hasBackup: true, type: "invoice" },
  { id: "R06-010", req: 6, vendor: "Beckerle Lumber", desc: "Alum trim coil", amount: 183.59, hasBackup: true, type: "invoice" },
  { id: "R06-011", req: 6, vendor: "Dykes Lumber", desc: "Angled paslode finish nail", amount: 932.79, hasBackup: true, type: "invoice" },
  { id: "R06-012", req: 6, vendor: "Builders First Source", desc: "Misc. Materials", amount: 204.83, hasBackup: true, type: "invoice" },
  { id: "R06-013", req: 6, vendor: "Beckerle Lumber", desc: "Misc. Materials", amount: 3.07, hasBackup: true, type: "invoice" },
  { id: "R06-014", req: 6, vendor: "Home Depot", desc: "Fire barrier foam", amount: 29.87, hasBackup: true, type: "invoice" },
  { id: "R06-015", req: 6, vendor: "Home Depot", desc: "Fire barrier foam, rapid mortar", amount: 50.43, hasBackup: true, type: "invoice" },
  { id: "R06-016", req: 6, vendor: "Dykes Lumber", desc: "Lauan wiggle board", amount: 271.36, hasBackup: true, type: "invoice" },
  { id: "R06-017", req: 6, vendor: "Drywall Center", desc: "Misc. Materials", amount: 9059.25, hasBackup: true, type: "invoice" },
  { id: "R06-018", req: 6, vendor: "Drywall Center", desc: "Misc. Materials", amount: 702.95, hasBackup: true, type: "invoice" },
  // ── REQ-07 ──
  { id: "R07-001", req: 7, vendor: "Robert Hiep", desc: "Container", amount: 785.94, hasBackup: true, type: "invoice" },
  { id: "R07-002", req: 7, vendor: "Rockland Masonry Depot", desc: "Materials/Services", amount: 24.11, hasBackup: true, type: "invoice" },
  { id: "R07-003", req: 7, vendor: "Black Wolf Contracting", desc: "Misc. Materials", amount: 2411, hasBackup: true, type: "invoice" },
  { id: "R07-004", req: 7, vendor: "Black Wolf Contracting", desc: "Sandblast", amount: 6499, hasBackup: true, type: "invoice" },
  { id: "R07-006", req: 7, vendor: "Beckerle", desc: "Materials/Services", amount: 137.85, hasBackup: true, type: "invoice" },
  { id: "R07-007", req: 7, vendor: "Paragon Stairs", desc: "Materials/Services", amount: 9841.81, hasBackup: true, type: "invoice" },
  { id: "R07-008", req: 7, vendor: "Quatrochi & Sons", desc: "Materials/Services", amount: 1544.34, hasBackup: true, type: "invoice" },
  { id: "R07-009", req: 7, vendor: "ABC Supply", desc: "Roof cap", amount: 98.62, hasBackup: true, type: "invoice" },
  { id: "R07-010", req: 7, vendor: "Beckerle", desc: "Materials/Services", amount: 20.63, hasBackup: true, type: "invoice" },
  { id: "R07-011", req: 7, vendor: "Beckerle", desc: "Materials/Services", amount: 119.8, hasBackup: true, type: "invoice" },
  { id: "R07-012", req: 7, vendor: "Beckerle", desc: "Materials/Services", amount: 51.43, hasBackup: true, type: "invoice" },
  { id: "R07-013", req: 7, vendor: "Beckerle", desc: "Materials/Services", amount: 21.61, hasBackup: true, type: "invoice" },
  { id: "R07-014", req: 7, vendor: "Beckerle", desc: "House wrap, saw", amount: 151.27, hasBackup: true, type: "invoice" },
  { id: "R07-015", req: 7, vendor: "Dykes", desc: "Trim boards", amount: 1122.11, hasBackup: true, type: "invoice" },
  { id: "R07-016", req: 7, vendor: "Dykes", desc: "Materials/Services", amount: 914.36, hasBackup: true, type: "invoice" },
  { id: "R07-017", req: 7, vendor: "Dykes", desc: "Materials/Services", amount: 528.6, hasBackup: true, type: "invoice" },
  { id: "R07-018", req: 7, vendor: "Home Depot", desc: "Housewrap", amount: 136.94, hasBackup: true, type: "invoice" },
  { id: "R07-019", req: 7, vendor: "Home Depot", desc: "Materials/Services", amount: 69.26, hasBackup: true, type: "invoice" },
  { id: "R07-020", req: 7, vendor: "Ontime Supply", desc: "Materials/Services", amount: 281.67, hasBackup: true, type: "invoice" },
  { id: "R07-021", req: 7, vendor: "Ontime Supply", desc: "Max combination", amount: 650.2, hasBackup: true, type: "invoice" },
  { id: "R07-022", req: 7, vendor: "Dyer Drywall", desc: "Drywall", amount: 12000, hasBackup: true, type: "invoice" },
  { id: "R07-023", req: 7, vendor: "Valley Mechanical", desc: "Install AC in new living room area & replace two furnace coil units", amount: 10800, hasBackup: true, type: "invoice" },
  { id: "R07-024", req: 7, vendor: "DeLeonardis", desc: "Materials/Services", amount: 20948.63, hasBackup: true, type: "invoice" },
  // ── REQ-08 ──
  { id: "R08-001", req: 8, vendor: "Robert Hiep", desc: "Container", amount: 694.64, hasBackup: true, type: "invoice" },
  { id: "R08-002", req: 8, vendor: "Paragon Stairs", desc: "Materials/Services", amount: 2708.15, hasBackup: true, type: "invoice" },
  { id: "R08-003", req: 8, vendor: "Home Depot", desc: "Materials/Services", amount: 13.74, hasBackup: true, type: "invoice" },
  { id: "R08-004", req: 8, vendor: "H&J Home Improvements", desc: "Materials/Services", amount: 2400, hasBackup: true, type: "invoice" },
  { id: "R08-005", req: 8, vendor: "Montana Contracting", desc: "not in R7 base", amount: 1200, hasBackup: true, type: "self-performed" },
  { id: "R08-006", req: 8, vendor: "Paragon Stairs", desc: "Materials/Services", amount: 9841.67, hasBackup: true, type: "invoice" },
  { id: "R08-007", req: 8, vendor: "Quatrochi & Sons Roofing", desc: "Materials/Services", amount: 8000, hasBackup: true, type: "invoice" },
  { id: "R08-008", req: 8, vendor: "Quatrochi & Sons Roofing", desc: "Roofing labor", amount: 12000, hasBackup: true, type: "invoice" },
  { id: "R08-009", req: 8, vendor: "Builders First Source", desc: "Materials/Services", amount: 264.32, hasBackup: true, type: "invoice" },
  { id: "R08-010", req: 8, vendor: "ABC Supply", desc: "Materials/Services", amount: 1129.27, hasBackup: true, type: "invoice" },
  { id: "R08-011", req: 8, vendor: "Dykes Lumber", desc: "Materials/Services", amount: 319.44, hasBackup: true, type: "invoice" },
  { id: "R08-012", req: 8, vendor: "Dykes Lumber", desc: "Materials/Services", amount: 843.61, hasBackup: true, type: "invoice" },
  { id: "R08-013", req: 8, vendor: "Dykes Lumber", desc: "Materials/Services", amount: 7952.98, hasBackup: true, type: "invoice" },
  { id: "R08-014", req: 8, vendor: "Montana Contracting", desc: "Self-Performed Work", amount: 3660, hasBackup: true, type: "self-performed" },
  { id: "R08-015", req: 8, vendor: "H&J Home Improvements", desc: "Materials/Services", amount: 825, hasBackup: true, type: "invoice" },
  { id: "R08-016", req: 8, vendor: "Dyer Drywall", desc: "Drywall", amount: 15000, hasBackup: true, type: "invoice" },
  { id: "R08-017", req: 8, vendor: "Vision Tile & Marble", desc: "Materials/Services", amount: 31575, hasBackup: true, type: "invoice" },
  { id: "R08-018", req: 8, vendor: "Stone Surfaces", desc: "Materials/Services", amount: 3350, hasBackup: true, type: "invoice" },
  { id: "R08-019", req: 8, vendor: "Carpet World Flooring Center", desc: "Materials/Services", amount: 27000, hasBackup: true, type: "invoice" },
  { id: "R08-020", req: 8, vendor: "Sunbelt Rentals", desc: "Materials/Services", amount: 4177.43, hasBackup: true, type: "invoice" },
  { id: "R08-021", req: 8, vendor: "DeLeonardis Electric", desc: "Materials/Services", amount: 20695, hasBackup: true, type: "invoice" },
  // ── REQ-09 ──
  { id: "R09-001", req: 9, vendor: "Beckerle Lumber", desc: "Materials/Services", amount: 79.87, hasBackup: true, type: "invoice" },
  { id: "R09-002", req: 9, vendor: "Glen Rock Stair Corp.", desc: "Materials/Services", amount: 6375, hasBackup: true, type: "invoice" },
  { id: "R09-003", req: 9, vendor: "Beckerle Lumber", desc: "Materials/Services", amount: 107.29, hasBackup: true, type: "invoice" },
  { id: "R09-004", req: 9, vendor: "Dykes Lumber", desc: "Materials/Services", amount: 10356.32, hasBackup: true, type: "invoice" },
  { id: "R09-005", req: 9, vendor: "Dykes Lumber", desc: "Materials/Services", amount: 618.78, hasBackup: true, type: "invoice" },
  { id: "R09-006", req: 9, vendor: "H&J Home Improvements", desc: "Materials/Services", amount: 687.5, hasBackup: true, type: "invoice" },
  { id: "R09-007", req: 9, vendor: "Beckerle Lumber", desc: "Lumber", amount: 22.76, hasBackup: true, type: "invoice" },
  { id: "R09-008", req: 9, vendor: "Beckerle Lumber", desc: "Materials/Services", amount: 127.75, hasBackup: true, type: "invoice" },
  { id: "R09-009", req: 9, vendor: "Home Depot", desc: "Materials/Services", amount: 84.47, hasBackup: true, type: "invoice" },
  { id: "R09-010", req: 9, vendor: "Stone Surfaces", desc: "Materials/Services", amount: 325, hasBackup: true, type: "invoice" },
  { id: "R09-011", req: 9, vendor: "Korth & Shannahan Painting Company", desc: "Materials/Services", amount: 7527.5, hasBackup: true, type: "invoice" },
  { id: "R09-012", req: 9, vendor: "Korth & Shannahan Painting Company", desc: "Painting", amount: 6037.5, hasBackup: true, type: "invoice" },
  { id: "R09-013", req: 9, vendor: "Home Depot", desc: "Materials/Services", amount: 63.22, hasBackup: true, type: "invoice" },
  { id: "R09-014", req: 9, vendor: "Sunbelt", desc: "Equipment rental", amount: 3039.48, hasBackup: true, type: "invoice" },
  // ── REQ-10 ──
  { id: "R10-001", req: 10, vendor: "Montana Contracting", desc: "Self-Performed Work", amount: 600, hasBackup: true, type: "self-performed" },
  { id: "R10-002", req: 10, vendor: "Montana Contracting", desc: "Work - allocated to PCCO #68 4 hours", amount: -240, hasBackup: false, type: "self-performed" },
  { id: "R10-003", req: 10, vendor: "Montana Contracting", desc: "Self-Performed Work", amount: 375, hasBackup: true, type: "self-performed" },
  { id: "R10-004", req: 10, vendor: "Masonry Depot", desc: "Materials/Services", amount: 20.37, hasBackup: true, type: "invoice" },
  { id: "R10-005", req: 10, vendor: "Builders First Source", desc: "Materials", amount: 476.99, hasBackup: true, type: "invoice" },
  { id: "R10-006", req: 10, vendor: "Montana Contracting", desc: "Self-Performed Work", amount: 3525, hasBackup: true, type: "self-performed" },
  { id: "R10-007", req: 10, vendor: "Montana Contracting", desc: "Work - allocated to PCCO #64 30 hours", amount: -2250, hasBackup: false, type: "self-performed" },
  { id: "R10-008", req: 10, vendor: "Montana Contracting", desc: "Work - allocated to PCCO #67 8 hours", amount: -600, hasBackup: false, type: "self-performed" },
  { id: "R10-009", req: 10, vendor: "ABC Supply Co.", desc: "Materials/Services", amount: 460.59, hasBackup: true, type: "invoice" },
  { id: "R10-010", req: 10, vendor: "Builders First Source", desc: "Materials/Services", amount: 58.23, hasBackup: true, type: "invoice" },
  { id: "R10-011", req: 10, vendor: "Montana Contracting", desc: "Self-Performed Work", amount: 9180, hasBackup: true, type: "self-performed" },
  { id: "R10-012", req: 10, vendor: "Montana Contracting", desc: "Self-Performed (PCCO #66 24 hrs)", amount: -1440, hasBackup: false, type: "self-performed" },
  { id: "R10-013", req: 10, vendor: "Montana Contracting", desc: "Self-Performed Work", amount: 9113.04, hasBackup: true, type: "invoice" },
  { id: "R10-014", req: 10, vendor: "Builders First Source", desc: "Materials/Services", amount: 646.74, hasBackup: true, type: "invoice" },
  { id: "R10-015", req: 10, vendor: "Montana Contracting", desc: "Self-Performed Work", amount: 2550, hasBackup: true, type: "self-performed" },
  { id: "R10-016", req: 10, vendor: "Montana Contracting", desc: "Self-Performed (PCCO #65 10 hrs)", amount: -750, hasBackup: false, type: "self-performed" },
  { id: "R10-017", req: 10, vendor: "Valley Mechanical", desc: "Materials/Services", amount: 8735, hasBackup: true, type: "invoice" },
  // ── REQ-11 ──
  { id: "R11-001", req: 11, vendor: "Robert Hiep", desc: "Materials/Services", amount: 672.4, hasBackup: true, type: "invoice" },
  { id: "R11-002", req: 11, vendor: "Korth & Shannahan", desc: "Materials/Services", amount: 9825, hasBackup: true, type: "invoice" },
  { id: "R11-003", req: 11, vendor: "Home Depot", desc: "Materials/Services", amount: 200.32, hasBackup: true, type: "invoice" },
  { id: "R11-004", req: 11, vendor: "Dykes Lumber Company", desc: "Materials/Services", amount: 1146.17, hasBackup: true, type: "invoice" },
  { id: "R11-005", req: 11, vendor: "Dykes Lumber Company", desc: "Materials/Services", amount: 7185.34, hasBackup: true, type: "invoice" },
  { id: "R11-006", req: 11, vendor: "Builders First Source", desc: "Materials", amount: 313.55, hasBackup: true, type: "invoice" },
  { id: "R11-007", req: 11, vendor: "Builders First Source", desc: "Materials/Services", amount: 121.9, hasBackup: true, type: "invoice" },
  { id: "R11-008", req: 11, vendor: "Builders First Source", desc: "Materials/Services", amount: 20.54, hasBackup: true, type: "invoice" },
  { id: "R11-009", req: 11, vendor: "Builders First Source", desc: "S6400-M", amount: 249.65, hasBackup: true, type: "invoice" },
  { id: "R11-010", req: 11, vendor: "Montana Contracting", desc: "Self-Performed Labor", amount: 2962.5, hasBackup: true, type: "self-performed" },
  { id: "R11-011", req: 11, vendor: "Ontime Supply", desc: "Materials", amount: 107.6, hasBackup: true, type: "invoice" },
  { id: "R11-012", req: 11, vendor: "Home Depot", desc: "Materials/Services", amount: 43.32, hasBackup: true, type: "invoice" },
  { id: "R11-013", req: 11, vendor: "Dykes Lumber", desc: "Materials/Services", amount: 154.87, hasBackup: true, type: "invoice" },
  { id: "R11-014", req: 11, vendor: "Beckerle Lumber", desc: "Materials/Services", amount: 119.21, hasBackup: true, type: "invoice" },
  { id: "R11-015", req: 11, vendor: "Beckerle Lumber", desc: "Materials", amount: 44.43, hasBackup: true, type: "invoice" },
  { id: "R11-016", req: 11, vendor: "Beckerle Lumber", desc: "Materials/Services", amount: 75.68, hasBackup: true, type: "invoice" },
  { id: "R11-017", req: 11, vendor: "Korth & Shannahan", desc: "Materials/Services", amount: 18112.5, hasBackup: true, type: "invoice" },
  // ── REQ-12 ──
  { id: "R12-001", req: 12, vendor: "Dykes Lumber", desc: "Materials/Services", amount: 4016.05, hasBackup: true, type: "invoice" },
  { id: "R12-002", req: 12, vendor: "Beckerle Lumber", desc: "Materials/Services", amount: 164.73, hasBackup: true, type: "invoice" },
  { id: "R12-006", req: 12, vendor: "Builders First Source", desc: "Materials/Services", amount: 213.61, hasBackup: true, type: "invoice" },
  { id: "R12-008", req: 12, vendor: "A&J Reliable", desc: "Demolition", amount: 10200, hasBackup: true, type: "invoice" },
  { id: "R12-010", req: 12, vendor: "Korth & Shannahan", desc: "Materials/Services", amount: 24580, hasBackup: true, type: "invoice" },
  // ── REQ-13 ──
  { id: "R13R1-015a", req: 13, vendor: "Korth & Shannahan", desc: "Progress Payment", amount: 8575, hasBackup: true, type: "invoice" },
  { id: "R13R1-015b", req: 13, vendor: "Carpet World Flooring Center", desc: "Materials/Services", amount: 20225.22, hasBackup: true, type: "invoice" },
  { id: "R13R1-016a", req: 13, vendor: "Beckerle", desc: "BOST.18GA 1 1/4\" Brad SS Nails", amount: 29.07, hasBackup: true, type: "invoice" },
  { id: "R13R1-016b", req: 13, vendor: "Valley Mechanical", desc: "Materials/Services", amount: 17000, hasBackup: true, type: "invoice" },
  { id: "R13R1-017a", req: 13, vendor: "Beckerle", desc: "Trim Caulking Materials", amount: 54.56, hasBackup: true, type: "invoice" },
  { id: "R13R1-017b", req: 13, vendor: "Valley Mechanical", desc: "Base Contract Final Payment", amount: 42015, hasBackup: true, type: "invoice" },
  { id: "R13R1-018a", req: 13, vendor: "BFS", desc: "Trim Materials", amount: 604.11, hasBackup: true, type: "invoice" },
  { id: "R13R1-018b", req: 13, vendor: "Valley Mechanical", desc: "Relocate 2nd Floor Boiler & Piping", amount: 8400, hasBackup: true, type: "invoice" },
  { id: "R13R1-019a", req: 13, vendor: "Dykes", desc: "Cedar trim", amount: 820.59, hasBackup: true, type: "invoice" },
  { id: "R13R1-019b", req: 13, vendor: "Valley Mechanical", desc: "Living Room AC", amount: 5200, hasBackup: true, type: "invoice" },
  { id: "R13R1-020", req: 13, vendor: "Dykes", desc: "Trim Materials", amount: 675, hasBackup: true, type: "invoice" },
  { id: "R13R1-021", req: 13, vendor: "Dykes", desc: "x4 Pine Delivered", amount: 374.2, hasBackup: true, type: "invoice" },
  { id: "R13R1-022", req: 13, vendor: "Home Depot", desc: "X-Board", amount: 77.93, hasBackup: true, type: "invoice" },
  { id: "R13R1-023", req: 13, vendor: "Home Depot", desc: "Diablo CSB", amount: 119.91, hasBackup: true, type: "invoice" },
  { id: "R13R1-024", req: 13, vendor: "Home Depot", desc: "X Board", amount: 162.4, hasBackup: true, type: "invoice" },
  { id: "R13R1-025", req: 13, vendor: "Home Depot", desc: "X Board & Wipes", amount: 56.19, hasBackup: true, type: "invoice" },
  { id: "R13R1-026", req: 13, vendor: "Eastern", desc: "Insulation", amount: 4599.68, hasBackup: true, type: "invoice" },
  { id: "R13R1-027", req: 13, vendor: "Builders First Source", desc: "Materials/Services", amount: 88.34, hasBackup: true, type: "invoice" },
  { id: "R13R1-028a", req: 13, vendor: "A Touch of Glass", desc: "Materials/Services", amount: 8295, hasBackup: true, type: "invoice" },
  { id: "R13R1-028b", req: 13, vendor: "Montana Contracting", desc: "Removed Per Site Meeting 4.27.23. Owner Paid Direct.", amount: -8295, hasBackup: true, type: "credit" },
  { id: "R13R1-029", req: 13, vendor: "Bauco Access Panel Solutions", desc: "Materials/Services", amount: 466.86, hasBackup: true, type: "invoice" },
  { id: "R13R1-030", req: 13, vendor: "Valley Mechanical", desc: "Living Room AC", amount: 5200, hasBackup: true, type: "invoice" },
  { id: "R13R1-031", req: 13, vendor: "DeLeonardis Electric", desc: "(Req 7) Adjusting Credit for Service Relocation - See CO 12", amount: -9500, hasBackup: false, type: "credit" },
  // ── REQ-14 ──
  { id: "R14-001", req: 14, vendor: "Dykes", desc: "Materials/Services", amount: 1325.64, hasBackup: true, type: "invoice" },
  { id: "R14-002", req: 14, vendor: "Dykes", desc: "Materials/Services", amount: -958.47, hasBackup: true, type: "credit" },
  { id: "R14-003", req: 14, vendor: "Glen Rock", desc: "Materials/Services", amount: 6375, hasBackup: true, type: "invoice" },
  { id: "R14-004", req: 14, vendor: "Dykes", desc: "Materials", amount: 176.12, hasBackup: true, type: "invoice" },
  { id: "R14-005", req: 14, vendor: "Lowes", desc: "Materials/Services", amount: 39.86, hasBackup: true, type: "invoice" },
  { id: "R14-006", req: 14, vendor: "Beckerle", desc: "Materials/Services", amount: 117.05, hasBackup: true, type: "invoice" },
  { id: "R14-007", req: 14, vendor: "Beckerle", desc: "Materials/Services", amount: 7.58, hasBackup: true, type: "invoice" },
  { id: "R14-008", req: 14, vendor: "Beckerle", desc: "Materials", amount: 40.43, hasBackup: true, type: "invoice" },
  { id: "R14-009", req: 14, vendor: "Beckerle", desc: "Materials/Services", amount: 33.81, hasBackup: true, type: "invoice" },
  { id: "R14-010", req: 14, vendor: "Dykes", desc: "Materials/Services", amount: 106.86, hasBackup: true, type: "invoice" },
  { id: "R14-011", req: 14, vendor: "Glen Rock Stair Corp.", desc: "Stairs & Railings", amount: 545, hasBackup: true, type: "invoice" },
  { id: "R14-012", req: 14, vendor: "Home Depot", desc: "Materials/Services", amount: 97.19, hasBackup: true, type: "invoice" },
  { id: "R14-013", req: 14, vendor: "Montana Contracting", desc: "Less Decking CO 24 Hours", amount: -1800, hasBackup: false, type: "credit" },
  { id: "R14-014", req: 14, vendor: "Montana Contracting", desc: "Less Wood Plug Labor PCCO#120", amount: -450, hasBackup: false, type: "credit" },
  // ── REQ-15 ──
  { id: "R15-004", req: 15, vendor: "DeLeonardis", desc: "DeLeonardis Base Contract Balance", amount: 5015, hasBackup: true, type: "invoice" },
];

// ── TIMELINE EVENTS ──────────────────────────────────────────────────────────
const TIMELINE_EVENTS = [
  { date: "2021-06-15", category: "contract",     desc: "AIA A110-2021 Contract Executed — Cost-Plus with 25% Fee" },
  { date: "2021-11-15", category: "field",         desc: "Construction commenced — 240-day substantial completion clock starts" },
  { date: "2022-01-01", category: "billing",       desc: "REQ-01 submitted — $60,373.25 (incl. Kitchen Radiant CO #3)" },
  { date: "2022-02-01", category: "billing",       desc: "REQ-02 submitted — $105,487.24 (DeLeonardis Electric mobilization, H&J #1316)" },
  { date: "2022-03-04", category: "billing",       desc: "REQ-03 submitted — $102,311.39 (H&J #1316 DUPLICATE detected, 2 COs)" },
  { date: "2022-04-04", category: "billing",       desc: "REQ-04 submitted — $129,156.71 (5 COs billed, framing 146% of budget)" },
  { date: "2022-05-05", category: "billing",       desc: "REQ-05 submitted — $95,486.18" },
  { date: "2022-06-05", category: "billing",       desc: "REQ-06 submitted — $76,455.82 (6 COs, CO#20 framing changes)" },
  { date: "2022-07-06", category: "billing",       desc: "REQ-07 submitted — $90,146.26 (4 new subs, drywall & masonry)" },
  { date: "2022-07-13", category: "dispute",       desc: "240-day substantial completion deadline reached — project incomplete" },
  { date: "2022-08-06", category: "billing",       desc: "REQ-08 submitted — $192,165.00 (LARGEST REQ, tile 135% over budget)" },
  { date: "2022-09-06", category: "billing",       desc: "REQ-09 submitted — $50,381.66 (painting begins)" },
  { date: "2022-10-07", category: "billing",       desc: "REQ-10 submitted — $90,418.49 (self-performed $16,230)" },
  { date: "2022-11-07", category: "billing",       desc: "REQ-11 submitted — $92,651.29 (interior trim, painting $18K)" },
  { date: "2022-12-08", category: "billing",       desc: "REQ-12 submitted — $71,831.85 (estimates used as invoices)" },
  { date: "2023-01-08", category: "billing",       desc: "REQ-13R1 submitted — $184,238.97 (REVISED, negative Excel)" },
  { date: "2023-04-23", category: "billing",       desc: "REQ-14 submitted — $256,313.93 (HVAC $72K dispute, casework)" },
  { date: "2023-05-24", category: "billing",       desc: "REQ-15 submitted — $6,451.64 (FINAL regular req)" },
  { date: "2023-05-24", category: "dispute",       desc: "Final requisition submitted — 7-month gap follows" },
  { date: "2022-04-15", category: "change_order",  desc: "PCO#020/021 Framing Changes — $28,225 (largest single CO)" },
  { date: "2022-06-20", category: "change_order",  desc: "6 Change Orders billed in REQ-06 totaling $30,854" },
  { date: "2022-08-31", category: "change_order",  desc: "Net COs reach $252,403 (+$79,508 in one period)" },
  { date: "2023-12-30", category: "change_order",  desc: "$135K in unapplied credit COs at 0% — never credited to owner" },
  { date: "2024-01-30", category: "billing",       desc: "REQ-16 submitted — $235,461.28 (closeout req, base-to-CO conversion)" },
  { date: "2023-12-01", category: "dispute",       desc: "Owner submits 24-item deficiency/punch list" },
  { date: "2024-01-15", category: "dispute",       desc: "AAA Demand for Arbitration filed (Case No. 01-24-0004-6683)" },
  { date: "2024-03-01", category: "dispute",       desc: "Robin S. Abramowitz appointed as Arbitrator" },
  { date: "2022-05-15", category: "field",         desc: "Tile installation begins — immediately 135% over-budget" },
  { date: "2022-09-15", category: "field",         desc: "Painting begins (Korth & Shannahan) — will reach 182% of contract" },
  { date: "2021-12-15", category: "field",         desc: "Demolition & site preparation complete — first requisition period opens" },
];

// ── CHANGE ORDERS (full Procore export — 128 PCCOs) ─────────────────────────
// PCO = Potential Change Order (verbally approved by owner before creating PCCO)
// PCCO = Prime Contract Change Order (official contract modification)
// req field = approximate billing period based on review date
const CHANGE_ORDERS = [
  { co: 1,   desc: "Basement Boiler Piping & Kitchen Radiant", amount: 25000, req: 1, status: "Approved", reviewDate: "2022-01-25" },
  { co: 2,   desc: "Bed #2 Bath & Cow Barn Laundry Closet Rough", amount: 14587.03, req: 3, status: "Approved", reviewDate: "2022-03-07" },
  { co: 3,   desc: "Air Handler Replacement", amount: 7500, req: 3, status: "Approved", reviewDate: "2022-03-07" },
  { co: 4,   desc: "Gas Main Relocation", amount: 6375, req: 3, status: "Approved", reviewDate: "2022-03-07" },
  { co: 5,   desc: "Low Voltage Wiring", amount: 26918.75, req: 3, status: "Approved", reviewDate: "2022-03-17" },
  { co: 6,   desc: "Underground Plumbing Repairs", amount: 10750, req: 3, status: "Approved", reviewDate: "2022-03-31" },
  { co: 7,   desc: "HVAC Base Subcontract Credit", amount: -11725, req: 3, status: "Approved", reviewDate: "2022-03-16" },
  { co: 8,   desc: "Plumbing Base Subcontract Credit", amount: -4550, req: 3, status: "Approved", reviewDate: "2022-03-16" },
  { co: 9,   desc: "Electrical Base Subcontract Credit", amount: -16270, req: 3, status: "Approved", reviewDate: "2022-03-16" },
  { co: 10,  desc: "Concrete Excavation", amount: 2500, req: 3, status: "Approved", reviewDate: "2022-03-31" },
  { co: 11,  desc: "Lighting Fixture Credit to Owner", amount: -14500, req: 3, status: "Approved", reviewDate: "2022-03-23" },
  { co: 12,  desc: "Electrical Service Relocation", amount: 11875, req: 3, status: "Approved", reviewDate: "2022-03-23" },
  { co: 13,  desc: "Concrete Winter Conditions", amount: 2627.5, req: 3, status: "Approved", reviewDate: "2022-03-31" },
  { co: 14,  desc: "Additional Sawcutting", amount: 4250, req: 3, status: "Approved", reviewDate: "2022-03-31" },
  { co: 15,  desc: "Demolition Base Budget Credit to Owner", amount: -8024, req: 3, status: "Approved", reviewDate: "2022-03-23" },
  { co: 16,  desc: "East Foundation Wall Corrective Work", amount: 7081.25, req: 3, status: "Approved", reviewDate: "2022-03-31" },
  { co: 17,  desc: "Living Room Structural Steel", amount: 6250, req: 4, status: "Approved", reviewDate: "2022-04-06" },
  { co: 18,  desc: "Cow Barn Sewer Line Camera", amount: 468.75, req: 4, status: "Approved", reviewDate: "2022-04-25" },
  { co: 19,  desc: "Framing Changes through 04.25.2022", amount: 28225.38, req: 4, status: "Approved", reviewDate: "2022-05-03" },
  { co: 20,  desc: "Framing Changes 04.26.2022-05.23.2022", amount: 17796.51, req: 6, status: "Approved", reviewDate: "2022-06-07" },
  { co: 21,  desc: "Additional Stone Veneer at Living Room Exterior", amount: 5625, req: 6, status: "Approved", reviewDate: "2022-06-07" },
  { co: 22,  desc: "Brick Finish Removal", amount: 8171.88, req: 6, status: "Approved", reviewDate: "2022-06-16" },
  { co: 23,  desc: "Insulation Scope Changes & Base Budget Credit", amount: 27975.2, req: 6, status: "Approved", reviewDate: "2022-06-16" },
  { co: 24,  desc: "Excavation Base Budget Credit", amount: -5208.63, req: 6, status: "Approved", reviewDate: "2022-06-16" },
  { co: 25,  desc: "Window Installation Base Budget Credit", amount: -4218.75, req: 6, status: "Approved", reviewDate: "2022-06-16" },
  { co: 26,  desc: "Fireplace & Chimney Inspection", amount: 701.05, req: 6, status: "Approved", reviewDate: "2022-06-29" },
  { co: 27,  desc: "Additional Drywall Material", amount: 1490.76, req: 6, status: "Approved", reviewDate: "2022-06-30" },
  { co: 28,  desc: "Generator Pad", amount: 759.41, req: 7, status: "Approved", reviewDate: "2022-07-07" },
  { co: 29,  desc: "Exhaust Fans Upgrade", amount: 2122.14, req: 7, status: "Approved", reviewDate: "2022-07-08" },
  { co: 30,  desc: "Additional Insulation", amount: 2217.5, req: 7, status: "Approved", reviewDate: "2022-07-20" },
  { co: 31,  desc: "Interior Doors Changes", amount: 1658.16, req: 7, status: "Approved", reviewDate: "2022-07-27" },
  { co: 32,  desc: "Drywall Scope Changes", amount: 9025, req: 7, status: "Approved", reviewDate: "2022-08-01" },
  { co: 33,  desc: "TRX Bracket", amount: 312.5, req: 7, status: "Approved", reviewDate: "2022-08-01" },
  { co: 34,  desc: "Chimney Demolition", amount: 2250, req: 7, status: "Approved", reviewDate: "2022-08-03" },
  { co: 35,  desc: "Additional Framing Labor 06.26.2022-07.29.2022", amount: 6150, req: 7, status: "Approved", reviewDate: "2022-08-03" },
  { co: 36,  desc: "Grout Material & Additional Tile Areas", amount: 10531.25, req: 9, status: "Approved", reviewDate: "2022-09-07" },
  { co: 37,  desc: "Living Room Flat Ceiling Insulation", amount: 0, req: null, status: "Void", reviewDate: null },
  { co: 38,  desc: "Electrical Extras through 07.20.2022", amount: 25868.75, req: 9, status: "Approved", reviewDate: "2022-09-13" },
  { co: 39,  desc: "Additional Wood Flooring", amount: 18569.24, req: 9, status: "Approved", reviewDate: "2022-09-13" },
  { co: 40,  desc: "Additional Roofing Labor", amount: 609.6, req: 9, status: "Approved", reviewDate: "2022-09-13" },
  { co: 41,  desc: "Stone Saddles & Niche Pieces", amount: 4187.5, req: 9, status: "Approved", reviewDate: "2022-09-13" },
  { co: 42,  desc: "Upper Chimney Framing", amount: 1478.01, req: 9, status: "Approved", reviewDate: "2022-09-13" },
  { co: 43,  desc: "Guest Bathroom Layout Change", amount: 5832.44, req: 9, status: "Approved", reviewDate: "2022-09-13" },
  { co: 44,  desc: "Additional Framing Sub Labor 06.21-08.31.2022", amount: 4031.25, req: 9, status: "Approved", reviewDate: "2022-09-13" },
  { co: 45,  desc: "Additional Siding Material", amount: 9709.05, req: 9, status: "Approved", reviewDate: "2022-10-03" },
  { co: 46,  desc: "Living Room Fireplace Demolition", amount: 2875.38, req: 9, status: "Approved", reviewDate: "2022-10-03" },
  { co: 47,  desc: "Front Porch Ceiling Replacement", amount: 1373.48, req: 9, status: "Approved", reviewDate: "2022-10-03" },
  { co: 48,  desc: "Guest Bath Niche Pieces", amount: 406.25, req: 9, status: "Approved", reviewDate: "2022-10-04" },
  { co: 49,  desc: "Wet Area Balcony Railings", amount: 4370.36, req: 9, status: "Approved", reviewDate: "2022-10-04" },
  { co: 50,  desc: "Water Closet Ceiling", amount: 474.84, req: 9, status: "Approved", reviewDate: "2022-10-04" },
  { co: 51,  desc: "Guest Bath Shower Drain", amount: 79.03, req: 9, status: "Approved", reviewDate: "2022-10-04" },
  { co: 52,  desc: "Dining Room Stairs", amount: 1800, req: 9, status: "Approved", reviewDate: "2022-10-04" },
  { co: 53,  desc: "Additional HVAC Rent", amount: 3799.35, req: 9, status: "Approved", reviewDate: "2022-10-04" },
  { co: 54,  desc: "Labor for Low Voltage Work", amount: 450, req: 9, status: "Approved", reviewDate: "2022-10-04" },
  { co: 55,  desc: "Soffit Replacement Labor", amount: 450, req: 9, status: "Approved", reviewDate: "2022-10-04" },
  { co: 56,  desc: "Additional Window & Door Labor", amount: 1500, req: 9, status: "Approved", reviewDate: "2022-10-04" },
  { co: 57,  desc: "Living Room Fireplace Framing", amount: 1430.13, req: 10, status: "Approved", reviewDate: "2022-10-25" },
  { co: 58,  desc: "Living Room Ceiling Material", amount: 7249.41, req: 10, status: "Approved", reviewDate: "2022-10-25" },
  { co: 59,  desc: "Mason-Lite Fireplace", amount: 18750, req: 10, status: "Approved", reviewDate: "2022-10-25" },
  { co: 60,  desc: "Exhaust Ductwork & Guest Bath Radiant", amount: 6500, req: 10, status: "Approved", reviewDate: "2022-10-25" },
  { co: 61,  desc: "Primary Bedroom Balcony Structure & Railing", amount: 27820.29, req: 10, status: "Approved", reviewDate: "2022-10-25" },
  { co: 62,  desc: "Living Room Fireplace Additional Metal Framing Material", amount: 187.59, req: 10, status: "Approved", reviewDate: "2022-10-26" },
  { co: 63,  desc: "October 2022 Minor Repairs & Changes", amount: 469.51, req: 10, status: "Approved", reviewDate: "2022-10-26" },
  { co: 64,  desc: "Living Room Fireplace CMU & Interior Framing Labor", amount: 4125, req: 10, status: "Approved", reviewDate: "2022-10-26" },
  { co: 65,  desc: "Medicine Cabinets & Vanities Installation Labor", amount: 937.5, req: 10, status: "Approved", reviewDate: "2022-10-26" },
  { co: 66,  desc: "Primary / Kitchen Siding", amount: 1800, req: 10, status: "Approved", reviewDate: "2022-10-26" },
  { co: 67,  desc: "Cricket/Scupper Framing", amount: 750, req: 10, status: "Approved", reviewDate: "2022-10-26" },
  { co: 68,  desc: "Basement Wall Demolition", amount: 300, req: 10, status: "Approved", reviewDate: "2022-10-26" },
  { co: 69,  desc: "West Side Leader Drainage", amount: 7812.5, req: 10, status: "Approved", reviewDate: "2022-10-26" },
  { co: 70,  desc: "Sheathing Repair & Additional Studs", amount: 223.86, req: 10, status: "Approved", reviewDate: "2022-11-01" },
  { co: 71,  desc: "Copper Pipe Flashing, Caps & Crickets", amount: 3656.25, req: 10, status: "Approved", reviewDate: "2022-11-01" },
  { co: 72,  desc: "Additional Painting", amount: 42962.5, req: 11, status: "Approved", reviewDate: "2022-11-28" },
  { co: 73,  desc: "Additional Interior Trim", amount: 31012.5, req: 11, status: "Approved", reviewDate: "2022-11-28" },
  { co: 74,  desc: "Living Room Fireplace Chimney Framing Above Roof", amount: 2882.09, req: 11, status: "Approved", reviewDate: "2022-11-28" },
  { co: 75,  desc: "Miscellaneous Carpentry November 2022", amount: 8573.16, req: 11, status: "Approved", reviewDate: "2022-11-28" },
  { co: 76,  desc: "Additional Drywall Labor", amount: 1875, req: 11, status: "Approved", reviewDate: "2022-11-28" },
  { co: 77,  desc: "Hinges for Millwork Doors", amount: 64.81, req: 11, status: "Approved", reviewDate: "2022-11-29" },
  { co: 78,  desc: "Fireplace Stone Veneer", amount: 10574.69, req: 12, status: "Approved", reviewDate: "2022-12-13" },
  { co: 79,  desc: "Gym Cedar Material #1", amount: 3968.1, req: 12, status: "Approved", reviewDate: "2023-01-04" },
  { co: 80,  desc: "Cow Barn Mechanical Room Door Slab", amount: 309.98, req: 12, status: "Approved", reviewDate: "2023-01-04" },
  { co: 81,  desc: "Dining Room Stairs Revised Plan", amount: 3176, req: 12, status: "Approved", reviewDate: "2023-01-05" },
  { co: 82,  desc: "Additional Gutter Work", amount: 250, req: 12, status: "Approved", reviewDate: "2023-01-04" },
  { co: 83,  desc: "Primary Bedroom Decorative Beams", amount: 7416.91, req: 12, status: "Approved", reviewDate: "2023-01-04" },
  { co: 84,  desc: "Fireplace Enclosure Cement Board", amount: 260.03, req: 12, status: "Approved", reviewDate: "2023-01-04" },
  { co: 85,  desc: "Miscellaneous Carpentry December 2022", amount: 1968.75, req: 12, status: "Approved", reviewDate: "2023-01-05" },
  { co: 86,  desc: "Additional Gym Cedar Boards & Additional Trim Material", amount: 1418.81, req: 13, status: "Approved", reviewDate: "2023-01-11" },
  { co: 87,  desc: "Bed 2 Bath Transom Window", amount: 331.25, req: 13, status: "Approved", reviewDate: "2023-01-11" },
  { co: 88,  desc: "Sewer Backup Cleanup", amount: 270.94, req: 13, status: "Approved", reviewDate: "2023-01-23" },
  { co: 89,  desc: "Additional Shower Enclosures", amount: 16200, req: 13, status: "Approved", reviewDate: "2023-02-02" },
  { co: 90,  desc: "Dining Room Stairs Labor", amount: 2250, req: 13, status: "Approved", reviewDate: "2023-02-02" },
  { co: 91,  desc: "Fireplace Wood Storage Framing", amount: 810.16, req: 13, status: "Approved", reviewDate: "2023-02-02" },
  { co: 92,  desc: "Miscellaneous Carpentry January 2023", amount: 2903.63, req: 13, status: "Approved", reviewDate: "2023-02-02" },
  { co: 93,  desc: "Additional Trim Material", amount: 398.81, req: 13, status: "Approved", reviewDate: "2023-02-02" },
  { co: 94,  desc: "Interior Door Hardware", amount: 2990.35, req: 13, status: "Approved", reviewDate: "2023-02-02" },
  { co: 95,  desc: "Additional Stone Material at Living Room Exterior", amount: 1215.63, req: 13, status: "Approved", reviewDate: "2023-02-07" },
  { co: 96,  desc: "Brick Finish Removal (Additional Cost)", amount: 2965.63, req: 13, status: "Approved", reviewDate: "2023-02-07" },
  { co: 97,  desc: "Temporary Air Conditioning", amount: 5221.79, req: 13, status: "Approved", reviewDate: "2023-02-07" },
  { co: 98,  desc: "Balcony Decking Material", amount: 2196.23, req: 13, status: "Approved", reviewDate: "2023-02-13" },
  { co: 99,  desc: "Specialty Hinges", amount: 282.45, req: 13, status: "Approved", reviewDate: "2023-02-13" },
  { co: 100, desc: "Living Room Fireplace Stone Labor", amount: 22500, req: 13, status: "Approved", reviewDate: "2023-03-01" },
  { co: 101, desc: "Material for Additional Trim Scope", amount: 1975.33, req: 13, status: "Approved", reviewDate: "2023-03-20" },
  { co: 102, desc: "Fireplace Hearth Modifications", amount: 234.23, req: 13, status: "Approved", reviewDate: "2023-03-21" },
  { co: 103, desc: "Primary Bedroom Brick Finish Removal", amount: 369.36, req: 13, status: "Approved", reviewDate: "2023-03-21" },
  { co: 104, desc: "Fireplace Alternate Stone Samples", amount: 560.16, req: 13, status: "Approved", reviewDate: "2023-03-21" },
  { co: 105, desc: "Miscellaneous Carpentry February 2023", amount: 3937.5, req: 13, status: "Approved", reviewDate: "2023-03-21" },
  { co: 106, desc: "Gym Landing & Stairs Labor", amount: 1687.5, req: 13, status: "Approved", reviewDate: "2023-03-21" },
  { co: 107, desc: "Guest Room Ledge & Primary Bedroom Faux Beams Labor", amount: 3562.5, req: 13, status: "Approved", reviewDate: "2023-03-21" },
  { co: 108, desc: "Hardscape Restoration", amount: 4375, req: 13, status: "Approved", reviewDate: "2023-03-27" },
  { co: 109, desc: "2nd Floor Guest Radiant", amount: 6606.25, req: 14, status: "Approved", reviewDate: "2023-04-28" },
  { co: 110, desc: "Diffuser Upgrade", amount: 1527.06, req: 14, status: "Approved", reviewDate: "2023-05-09" },
  { co: 111, desc: "Basement Handrail and Wall Sealing", amount: 496.65, req: 14, status: "Approved", reviewDate: "2023-05-09" },
  { co: 112, desc: "Fireplace Door", amount: 2342.93, req: 14, status: "Approved", reviewDate: "2023-05-09" },
  { co: 113, desc: "Sewer Line Snaking & Camera Inspections", amount: 2312.5, req: 14, status: "Approved", reviewDate: "2023-05-09" },
  { co: 114, desc: "Additional Wood Floor Finishing", amount: 4768.49, req: 14, status: "Approved", reviewDate: "2023-05-09" },
  { co: 115, desc: "Returned Flooring Credit", amount: -812.81, req: 14, status: "Approved", reviewDate: "2023-05-09" },
  { co: 116, desc: "Chimney Exterior Brick Veneer", amount: 1349.28, req: 14, status: "Approved", reviewDate: "2023-05-17" },
  { co: 117, desc: "Decking Labor + Additional Material", amount: 2375.36, req: 14, status: "Approved", reviewDate: "2023-05-17" },
  { co: 118, desc: "Additional & Returned Door Hardware", amount: 1514.03, req: 14, status: "Approved", reviewDate: "2023-05-17" },
  { co: 119, desc: "Twin Door Lattice Molding", amount: 49.55, req: 14, status: "Approved", reviewDate: "2023-05-17" },
  { co: 120, desc: "Reconciliation of Interior Trim Labor due to Change in Contractor", amount: -11695.31, req: 15, status: "Approved", reviewDate: "2023-05-25" },
  { co: 121, desc: "Miscellaneous Additional Carpentry March - May 2023", amount: 562.5, req: 15, status: "Approved", reviewDate: "2023-05-25" },
  { co: 122, desc: "Additional Interior Trim #2", amount: 6237.5, req: 15, status: "Approved", reviewDate: "2023-05-25" },
  { co: 123, desc: "Additional Painting #2", amount: 12475, req: 15, status: "Approved", reviewDate: "2023-05-25" },
  { co: 124, desc: "Electrical Extras 07.21.22 - 04.17.23", amount: 42400, req: 15, status: "Approved", reviewDate: "2023-05-25" },
  { co: 125, desc: "Additional Interior Trim #3", amount: 8250, req: 15, status: "Approved", reviewDate: "2023-05-30" },
  { co: 126, desc: "Allowance Reconciliation", amount: -24248.24, req: 16, status: "Approved", reviewDate: "2024-01-17" },
  { co: 127, desc: "GC/Owner Variance Split", amount: -66389.39, req: 16, status: "Approved", reviewDate: "2024-01-17" },
  { co: 128, desc: "Owner-Supplied Items", amount: 56982.57, req: 16, status: "Approved", reviewDate: "2024-01-18" },
];

const REQ_DEFAULTS = (i) => ({
  id: i + 1,
  reqNumber: `REQ-${String(i + 1).padStart(2, "0")}`,
  date: "",
  totalBilled: 0,        // PDF / AIA G702 certified amount
  paidAmount: 0,         // Payments received from owner
  architectApproved: 0,
  retainageHeld: 0,
  laborCost: 0,
  materialCost: 0,
  subCost: 0,
  backupStatus: "MISSING",
  flags: [],
  notes: "",
  laborRate: 60,
  hasPayrollSupport: false,
  hasInvoiceSupport: false,
  hasCheckVouchers: false,
  excelTotal: 0,         // Excel CM Tracker total (with fee)
  excelSubtotal: 0,      // Excel pre-fee subtotal
  excelFee: 0,           // Excel 25% OH&P fee
  pdfReqNum: "",         // AIA G702 application number
  arbitratorQA: [],      // Array of { q, a, status } for anticipated arbitrator questions
});

// Excel data per req: [excelTotal, excelSubtotal, excelFee, month, reqNum]
const EXCEL_DATA = [
  [45373.25,  36298.60,   9074.65,  "2022-01-01", "1"],
  [105487.24, 84389.79,  21097.45,  "2022-02-01", "2"],
  [86692.39,  69353.91,  17338.48,  "2022-03-04", "3"],
  [99546.57,  79637.26,  19909.31,  "2022-04-04", "4"],
  [95486.18,  76388.94,  19097.24,  "2022-05-05", "5"],
  [45601.61,  36481.29,   9120.32,  "2022-06-05", "6"],
  [89833.76,  71804.58,  18029.18,  "2022-07-06", "7"],
  [192165.00,153732.00,  38433.00,  "2022-08-06", "8"],
  [44315.55,  35452.44,   8863.11,  "2022-09-06", "9"],
  [38076.20,  30460.96,   7615.24,  "2022-10-07", "10"],
  [51693.73,  41354.98,  10338.75,  "2022-11-07", "11"],
  [49294.59,  39435.67,   9858.92,  "2022-12-08", "12"],
  [-90489.90,-72392.71, -18097.19,  "2023-01-08", "13R1"],
  [140087.21,112069.77,  28017.44,  "2023-04-23", "14"],
  [6451.64,   5161.31,   1290.33,   "2023-05-24", "15"],
  [235461.28, 188369.02, 47092.26,  "2024-01-30", "16"],
];

const REQS_INITIAL = Array.from({ length: 16 }, (_, i) => {
  const base = REQ_DEFAULTS(i);
  const [excelTotal, excelSubtotal, excelFee, month, pdfReqNum] = EXCEL_DATA[i];
  return { ...base, date: month, excelTotal, excelSubtotal, excelFee, pdfReqNum };
});

// Override REQ-01 with PDF-derived data (already reviewed)
REQS_INITIAL[0] = {
  ...REQS_INITIAL[0],
  totalBilled: 60373.25,
  paidAmount: 60373.25,
  architectApproved: 60373.25,
  retainageHeld: 0,
  laborCost: 18360.00,
  materialCost: 759.07,
  subCost: 0,
  backupStatus: "PARTIAL",
  laborRate: 60,
  hasPayrollSupport: true,
  hasInvoiceSupport: true,
  hasCheckVouchers: false,
  flags: ["blended_rate", "sub_as_labor", "overhead_as_material"],
  notes: `Period: 12/15/21–01/15/22. AIA G702 App No. 1, certified $60,373.25.

LINE ITEMS (G703): Demolition $20,331.61 · Containers $6,458.15 · Framing Material $1,908.84 · HVAC $7,600.00 · OH&P $9,074.65 · CO Kitchen Radiant $15,000.00

LABOR ($18,360 @ $60/hr): Sandoval, Ficucello, Grosso, Yuvienco, Avelino, Falsetti
DSL Landscaping 3-man crew (24hrs @ $60 = $1,440)
DSL Landscaping 2-man crew (16hrs @ $60 = $960)
DSL Landscaping multiple days 1/12–1/14

MATERIALS: Builders FirstSource $264.65 (framing) · Beckerle tempered hardboard $52.02 · Beckerle saw blades $28.11 · Beckerle 3M dust masks $22.77`,
  arbitratorQA: [
    {
      q: "DSL Landscaping appears on timesheets as direct labor but is a subcontractor. Why is a sub billed through the labor column?",
      a: "DSL Landscaping is a per-diem labor subcontractor Montana uses for incidental labor needs. No formal subcontract was issued. $60/hr is DSL's billing rate — what Montana pays them. This arrangement was reviewed with the owner multiple times. The 25% OH&P markup applies uniformly to all cost categories (labor, materials, subs), so billing DSL through the labor column vs. the sub column has no financial impact to the owner.",
      status: "answered",
    },
    {
      q: "The timesheets show six different workers all billed at the same $60/hr rate. What are their actual payroll rates?",
      a: "Montana disclosed to the owner that it would normalize its billing rate to $60/hr because it would be impossible to bill each employee using their independent costs, burden, and rates across each budgeted line item while maintaining accurate cost control. The $60/hr rate is an aggregated unit cost covering payroll, burden, travel, and consumables related to the trade-specific work being performed. This rate was presented on all change orders provided to the client throughout the entire course of construction. It was never contested, and all change orders were paid until the owner stopped releasing payments.",
      status: "answered",
    },
    {
      q: "Saw blades ($28.11) and dust masks ($22.77) are billed as materials. Are these reimbursable costs or contractor overhead?",
      a: "When Montana self-performs trade work, it stands in the place of a subcontractor. A subcontractor would embed these costs — blades, PPE, consumables — in their invoice without itemization, and the owner would pay that invoice plus 25%. Montana's approach gives the owner at-cost transparency rather than a sub's marked-up lump sum. The saw blades were purchased to cut lumber for framing and are properly charged to the framing materials line item. The dust masks ($22.77) could arguably be considered general conditions — Montana is willing to concede items like this where appropriate, but the total exposure is minimal.",
      status: "answered",
    },
    {
      q: "Demolition is the largest line item at $20,331.61 (34% of the requisition). What backup supports this amount?",
      a: "Demolition was self-performed by Montana Contracting. The timesheets on file support $18,360.00 in labor. The remainder consists of material purchases directly associated with performing the demolition work (containers, waste removal, etc.).",
      status: "answered",
    },
    {
      q: "Was the Kitchen Radiant change order (PCO#003, $15,000) approved by the owner before work was performed?",
      a: "Yes. All change orders were approved by the owner prior to the work being performed. A signed PCO#003 is on file.",
      status: "answered",
    },
    {
      q: "What was the scope of the $7,600 HVAC charge and what backup invoice supports it?",
      a: "HVAC work was performed by Valley Mechanical. Their invoice is in the backup documentation.",
      status: "answered",
    },
  ],
};

// Override REQ-02 with PDF-derived data (Invoice #2.pdf — 30 pages reviewed)
REQS_INITIAL[1] = {
  ...REQS_INITIAL[1],
  totalBilled: 105487.24,
  paidAmount: 105487.24,
  architectApproved: 105487.24,
  retainageHeld: 0,
  laborCost: 11020.00,
  materialCost: 31516.16,
  subCost: 41853.63,
  backupStatus: "PARTIAL",
  laborRate: 60,
  hasPayrollSupport: false,
  hasInvoiceSupport: true,
  hasCheckVouchers: false,
  flags: ["overhead_as_material", "no_timesheet"],
  notes: `Period: 02/01/22–02/28/22. AIA G702 App No. 2, certified $105,487.24.

G703 LINE ITEMS (THIS PERIOD):
Demolition $17,190.00 · Containers/Waste $2,460.63 · Concrete $7,253.00 · Framing Material $30,627.23 · Framing Labor $11,020.00 · Insulation $160.40 · Drywall $678.53 · Electric $15,000.00 · OH&P (25%) $21,097.45

BACKUP INVOICES:
DeLeonardis Electric #2544/2681-T: $15,000 mobilization per subcontract terms
H&J Improvements #1316: $10,300 partial payment against base framing contract
Patriot Saw Cuts #23376: $11,400 sawcutting concrete 3 areas
Robert Hiep Inc: $523.97+ waste removal 30-yd roll off + dumping
Concrete sub est. #1361: $7,253 slab poured
Builders FirstSource #57135683: ~$27,381 framing lumber/LVL beams/CDX plywood
Builders FirstSource #57244457: $109.46 treated lumber
Builders FirstSource: $163.30 treated 2x4s
Beckerle Lumber: $50.94 foam insulation R-10
Home Depot: $75.78 masonry nails + Sakrete expansion joints
Home Depot: $194.97 Ficucello Thomas
Lowe's: $173.49 repair jamb bracket, baseboard end cap, misc

SELF-PERFORMED: $5,790 demolition + $720 framing = $6,510 direct labor @ $60/hr

CONCESSIONS: Rock salt $17.34 + Rain-X deicer $3.97 = $21.31 general conditions`,
  arbitratorQA: [
    {
      q: "DeLeonardis Electric invoiced $15,000 for 'Mobilization.' What does this cover and where is the scope documentation?",
      a: "The $15,000 mobilization payment was per DeLeonardis Electric's agreed subcontract terms. The owner approved these terms. The subcontract on file defines the scope and payment structure — the invoice is a draw against that contract.",
      status: "answered",
    },
    {
      q: "H&J Improvements #1316 invoiced $10,300 for 'Labor only for framing partial payment.' Where is the detailed scope?",
      a: "H&J Improvements had a base subcontract with Montana that defines the scope of work. This invoice is a partial payment against that base contract for work performed during this period. The subcontract is on file.",
      status: "answered",
    },
    {
      q: "There are no timesheets in the 30-page backup. What supports the self-performed labor?",
      a: "Montana self-performed $5,790 in demolition and $720 in framing labor ($6,510 total) during this period at the agreed $60/hr rate. Timesheets were not consistently included in requisition backup. The owner never requested timesheets during the course of construction and paid this requisition without objection. The self-performed labor is a small portion of the $105,487.24 total — the vast majority is supported by third-party sub invoices and material receipts on file.",
      status: "answered",
    },
    {
      q: "Rock salt and Rain-X windshield deicer ($21.31) — are these reimbursable project costs?",
      a: "Montana concedes these items ($21.31) as general conditions covered by the 25% OH&P markup. They are not trade-specific materials.",
      status: "answered",
    },
  ],
};

// Override REQ-03 with PDF-derived data (Invoice #3.pdf — 38 pages reviewed)
REQS_INITIAL[2] = {
  ...REQS_INITIAL[2],
  totalBilled: 102311.39,
  paidAmount: 100511.39,
  architectApproved: 102311.39,
  retainageHeld: 0,
  laborCost: 10300.00,
  materialCost: 8055.58,
  subCost: 51098.33,
  backupStatus: "PARTIAL",
  laborRate: 60,
  hasPayrollSupport: false,
  hasInvoiceSupport: true,
  hasCheckVouchers: false,
  flags: ["duplicate", "missing_invoice", "overhead_as_material", "no_scope_desc", "no_timesheet"],
  notes: `Period: 03/01/22–03/31/22. AIA G702 App No. 3, Invoice No. 3, certified $102,311.39. Excel CM Tracker: $86,692.39.
VARIANCE: +$15,619.00 — Change orders billed on G703 (PCO#006 Gas Main $4,869 + PCO#008 Underground Plumbing $10,750) tracked separately in Excel.

G703 BASE CONTRACT LINE ITEMS (THIS PERIOD $86,692.39):
Concrete $15,849.00 · Framing Material $8,055.58 · Framing Labor $10,300.00 · Plumbing $7,600.00 · Electric $20,000.00 · Excavation and Fill $7,549.33 · OH&P (25%) $17,338.48
CHANGE ORDERS THIS PERIOD ($15,619.00): PCO#006 Gas Main $4,869.00 · PCO#008 Underground Plumbing $10,750.00
CO SUMMARY: 16 PCOs listed (net $69,523.03). Previous COs: $25,000. New this month: $99,592.03 additions / ($55,069.00) deductions.

BACKUP INVOICES:
Echo Stamp Concrete #1784: $15,849 footings/walls (adequate — detailed scope w/ cost codes)
Echo Stamp Concrete #1786: $8,500 repour 26 LF wall per CO 1374 (adequate — CO work)
Builders FirstSource (multiple): ~$3,017 framing lumber/CDX/hardware across 5+ invoices (adequate)
Smith Cooling & Heating: $7,600 plumbing 20% progress on $38K contract (adequate — detailed scope)
Smith Cooling & Heating CO: $3,900 gas main supply/install per CO #2 (adequate — detailed scope)
DeLeonardis Electric REQ.2: $20,000 — shows contract breakdown ($51,835 base + $21,535 CO = $73,370 total), includes retainage calc
Paul Bitts Co #22-52: $8,100 excavation with dated line items (adequate)
Beckerle Lumber #2202-285066: $468.18 2x4 douglas fir (adequate)
Rockland Masonry Depot: $671.38 + $285.95 sand/materials (adequate)
Home Depot (multiple): $79.02 + $353.53 + $39.98 + $84.47

⚠ DUPLICATE: H&J Improvements #1316: $10,300 "Labor only for framing partial payment" — SAME INVOICE NUMBER (#1316) and SAME AMOUNT ($10,300) as REQ-02. Date 2/16/22. Potential duplicate billing across requisitions.
⚠ DeLeonardis Electric: $20,000 — sub invoice shows 10% retainage withheld ($2,000) but G702 shows 0% retainage to owner. Retainage discrepancy.
⚠ H&J Improvements: Still deficient — no dates, hours, workers, or scope description.

⚠ Home Depot overhead-as-materials (§9.3.1):
  11-in-1 multi-bit screwdriver $15.97 · Non-contact voltage tester $19.97 · HDX 55" shingle stripper $62.00 · 4-outlet metal power block $12.74 · 7000 lumen LED work light $218.00 · 14/3 50' extension cord $33.47
Total overhead-as-materials exposure this req: $362.15 minimum

CRITICAL: NO TIMESHEETS or payroll records in entire 38-page backup. Framing Labor $10,300 billed with only H&J Improvements deficient/duplicate sub invoice as support.`,
  arbitratorQA: [
    {
      q: "H&J Improvements invoice #1316 for $10,300 appears in both REQ-02 and REQ-03 — same invoice number, same amount. Is this duplicate billing?",
      a: "Montana acknowledges the same invoice number (#1316) appears in both requisitions. H&J performed framing work across multiple periods and reused the same invoice number for separate partial payments against their base subcontract. Montana's internal tracking allocated $10,300 to each period for distinct work scopes. The subcontract on file defines the total H&J contract value, and cumulative payments have not exceeded that amount.",
      status: "answered",
    },
    {
      q: "DeLeonardis Electric billed $20,000 this period but the sub invoice shows 10% retainage withheld. The owner is paying 0% retainage. Where did that retainage go?",
      a: "Montana held 10% retainage from DeLeonardis per their subcontract terms — standard practice for managing sub performance risk. The AIA A110 contract between Montana and the owner does not require pass-through of sub retainage. Montana assumed the risk of sub performance and managed its own subcontractor retainage program. The owner was billed for the full value of work completed, consistent with the contract terms.",
      status: "answered",
    },
    {
      q: "Home Depot purchases include a $218 LED work light, a $62 shingle stripper, and a voltage tester. How are these reimbursable under a cost-plus contract?",
      a: "Montana concedes that certain items — particularly the LED work light ($218) and non-contact voltage tester ($19.97) — are general contractor overhead under §9.3.1 and should not have been billed as reimbursable materials. The total overhead exposure this requisition is approximately $362. Montana is prepared to credit these items. The shingle stripper ($62) was purchased specifically for the Tharp project demolition and was consumed on site.",
      status: "answered",
    },
    {
      q: "Two change orders (PCO#006 Gas Main $4,869 and PCO#008 Underground Plumbing $10,750) add $15,619 to this requisition. Were these approved before work was performed?",
      a: "Yes. Both PCO#006 and PCO#008 were approved by the owner prior to work being performed. The signed change order documents are on file. These are legitimate scope additions — the gas main relocation and underground plumbing were not part of the original contract and were directed by the owner.",
      status: "answered",
    },
  ],
};

// Override REQ-04 with PDF-derived data (Invoice #4.pdf — 64 pages reviewed)
REQS_INITIAL[3] = {
  ...REQS_INITIAL[3],
  totalBilled: 129156.71,
  paidAmount: 130958.71,
  architectApproved: 129156.71,
  retainageHeld: 0,
  laborCost: 12838.39,
  materialCost: 22137.99,
  subCost: 44660.88,
  backupStatus: "PARTIAL",
  laborRate: 0,
  hasPayrollSupport: false,
  hasInvoiceSupport: true,
  hasCheckVouchers: false,
  flags: ["overhead_as_material", "missing_invoice", "no_timesheet"],
  notes: `Period: 04/01/22–04/30/22. AIA G702 App No. 4, Invoice No. 4, certified $129,156.71. Excel CM Tracker: $99,546.57.
VARIANCE: +$29,610.14 — Change orders billed on G703 this period ($29,610.13): PCO#004 Bed #2 Bath $6,312.50 + PCO#017 Demolition Credit ($8,024.00) + PCO#015 Concrete Winter $2,627.50 + PCO#020 Cow Barn Sewer Camera $468.75 + PCO#021 Framing Changes $28,225.38.
Contract Sum to date: $1,287,878.16 (original $1,183,411 + $104,467.16 COs). Total completed to date: $397,328.59 (30.85%).

G703 BASE CONTRACT THIS PERIOD ($99,546.58):
Demolition $12,838.39 (100% of $12,838.39 — now fully billed) · Containers/Waste $1,097.88 · Concrete $3,898.00 · Balcony Railing $5,250.00 · Framing Material $20,606.47 (⚠ 146.24% of $41,847 scheduled = OVER-BUDGET by $19,351.12) · Roofing $921.63 · Drywall $321.72 · Plumbing $13,950.00 · HVAC $20,465.00 · Excavation $288.17 · OH&P $19,909.32
NOTE: Framing Labor $0 this period (no H&J Improvements). Electric $0 this period (no DeLeonardis).

SUBCONTRACTOR INVOICES:
Echo Stamp Concrete #1793 (4/6/22): $6,400 original, adjusted to $3,898.00 base ($2,102 Winter Conditions + $400 Additional Pier reallocated to COs). ADEQUATE — dated, scoped, amounts reconcile.
Smith Cooling & Heating Invoice 2022-tharp: $27,900 base contract @ 50% = $13,950 + PCCO#2/CCO#1 $10,100 @ 50% = $5,050. Total $19,000. ADEQUATE — detailed fixture-by-fixture scope (Bed 2 Bath, Future Laundry, Power Room, Primary Bath).
Valley Mechanical Services #i1593 (4/29/22): HVAC — Relocate 2nd floor boiler $10,500 @ 33% = $3,465 + CO#2 radiant heat zones $17,000 @ 50% = $8,500 + additional radiant zone. Total $20,465.00. ADEQUATE — detailed scope, progress %, job codes.
Robert Hiep Inc (multiple): Container/waste removal — roll-offs and dumping. $387.81 + $309.24 + other. ADEQUATE.

MATERIAL INVOICES:
Builders FirstSource (10+ invoices): Extensive framing lumber — 2x4s, 2x6s, LVL beams, CDX plywood, T&G plywood, coil nails, joist hangers, treated lumber. All coded 6400M (framing material). Dates 03/22–04/28/22. Totals support the heavy $20,606.47 framing material billing.
Beckerle Lumber (multiple): PL adhesive, galv hardware, sill sealer, mason sand, douglas fir. Coded 6400M and 31000M.
Lowe's: $138.46 — exterior screws and PowerPro interior screws. Materials OK.
Rockland Masonry Depot #503343/3: Bluestone 3/4" bags. Materials OK.

⚠ OVERHEAD-AS-MATERIALS (§9.3.1):
Home Depot 04/14/22: DeWalt 7.8A 1/2" VSR Drill $119.00 + tax = $128.97 — POWER TOOL, clear overhead.
Home Depot 04/07/22: Anvil Plastic Putty Knife 2" $2.94 — tool.
Beckerle #2203-018802: Milwaukee 9" Sawzall Blade $21.47 — consumable tool accessory (borderline).
Total overhead-as-materials exposure this req: $153.38 minimum.

⚠ MISSING INVOICES:
Demolition $12,838.39 (100% of budget): No demolition sub invoice in backup. Robert Hiep invoices are container/roll-off only ($387-$388). Demolition appears self-performed with no labor documentation.
Balcony Railing $5,250.00: No railing sub invoice found in 64-page backup.

⚠ FRAMING MATERIAL OVER-BUDGET: $20,606.47 this period brings cumulative Framing Material to $61,198.12 vs $41,847 scheduled value = 146.24%. Over-billed by $19,351.12 against schedule of values. While individual BFS material invoices appear legitimate, the total billing exceeds the contract allocation.

CRITICAL: NO TIMESHEETS or payroll records in entire 64-page backup.

DEMOLITION LINE ITEM CLOSEOUT — CORRECTED UNDERSTANDING:
  Demolition $12,838.39 is NOT self-performed work. This is a contractual line item closeout.
  Under AIA A110-2021 §3.3.2, savings on completed trade lines are split 50/50 between GC and owner.
  Montana billed the Demolition line to 100% of its scheduled value to close it out.
  PCO#017 "Demolition Budget Credit" ($8,024.00) returns the owner's share of the savings.
  No sub invoice or timecard backup is needed — the contract savings-split provision IS the backup.`,
  arbitratorQA: [
    {
      q: "Demolition billed $12,838.39 (100% of the budget line) but there is no demolition subcontractor invoice in the backup. What supports this charge?",
      a: "The Demolition line item was closed out to 100% of its scheduled value as a contractual mechanism under AIA A110-2021 §3.3.2, which provides for a 50/50 split of savings on completed trade lines between the GC and owner. Montana billed the line to budget, then issued PCO#017 — a Demolition Budget Credit of $8,024 — which returns the owner's share of the savings. This is not a charge requiring sub invoices or timecards; it is a contractual closeout consistent with the savings-split provision applied to all completed trade lines.",
      status: "answered",
    },
    {
      q: "Framing Material is now at 146% of the scheduled value — $19,351 over budget. Why is Montana billing beyond the contract allocation?",
      a: "The schedule of values is an allocation tool, not a cap. Under the AIA A110-2021 cost-plus contract, Montana is entitled to reimbursement of actual costs plus the agreed 25% fee. Framing material costs exceeded the initial estimate because the scope expanded significantly through owner-directed change orders (PCO#020/021 framing changes alone totaled $28,225). The individual Builders FirstSource invoices are on file and document legitimate lumber purchases delivered to the job site.",
      status: "answered",
    },
    {
      q: "The Balcony Railing line shows $5,250 billed but no railing sub invoice appears in the 64-page backup. Where is the documentation?",
      a: "The balcony railing work was performed by Paragon Stairs, whose invoice appears in REQ-07. This billing represents materials ordered and progress toward the railing scope. The Paragon Stairs contract and invoices are documented across REQ-07 and REQ-08 when the full scope was completed and paid.",
      status: "answered",
    },
    {
      q: "A DeWalt drill ($128.97) is billed as a material cost. Isn't a power drill contractor overhead?",
      a: "Montana concedes the DeWalt drill ($128.97) is contractor overhead under §9.3.1 and should not have been billed as a reimbursable material. Total overhead-as-materials exposure this requisition is $153.38. Montana is prepared to credit these items.",
      status: "answered",
    },
  ],
};

// Override REQ-05 with PDF-derived data (Invoice #5.pdf — 44 pages reviewed)
REQS_INITIAL[4] = {
  ...REQS_INITIAL[4],
  totalBilled: 95486.18,
  paidAmount: 95486.18,
  architectApproved: 95486.18,
  retainageHeld: 0,
  laborCost: 31400.00,
  materialCost: 30318.94,
  subCost: 14670.00,
  backupStatus: "PARTIAL",
  laborRate: 75,
  hasPayrollSupport: false,
  hasInvoiceSupport: true,
  hasCheckVouchers: false,
  flags: ["overhead_as_material", "no_scope_desc", "no_timesheet", "sub_as_labor"],
  notes: `REQ-05 AUDIT — Invoice #5.pdf (44 pages) — Period: 05/01/22-05/31/22
PDF Total: $95,486.18 | Excel: $95,486.18 | Variance: $0.00
No Change Orders billed this period — all CO lines show $0.

G702 COVER SHEET:
Application No: 5 | Period: 05/01/22-05/31/22
Original Contract: $1,183,411.00 | Net COs: $104,467.16 | Contract Sum: $1,287,878.16
Total Completed to Date: $492,814.77 | Previous: $397,328.59 | This Period: $95,486.18
Retainage: $0.00

G703 BASE CONTRACT LINES THIS PERIOD:
- Masonry: $1,945.00 (NEW — 7.96% of $24,437)
- Framing Material: $5,551.22 (cumulative $66,749.34 = 159.51% of $41,847 — ⚠ OVER-BUDGET)
- Framing Labor: $23,075.00 (cumulative $44,395 = 115.61% of $38,400 — ⚠ OVER-BUDGET)
- Roofing: $9,089.77 (NEW — 21.76% of $41,773)
- Siding: $13,462.03 (NEW — 24.09% of $55,872)
- Window Installation: $8,325.00 (NEW — 55.50% of $15,000)
- Drywall: $270.92 (2.58% of $10,500)
- Electric: $12,000.00 (46.18% of $25,976 cumulative — DeLeonardis)
- Excavation: $2,670.00 (60.04% of $4,447 cumulative — Paul Bitts)
- OH&P: $19,097.24 (38.03% of $50,226)

COST BREAKDOWN:
Labor: $31,400.00 (H&J Improvements — Framing Labor $23,075 + Window Installation $8,325)
Materials: $30,318.94 (Masonry $1,945 + Framing Mat $5,551.22 + Roofing $9,089.77 + Siding $13,462.03 + Drywall $270.92)
Subs: $14,670.00 (Electric $12,000 + Excavation $2,670)
Check: $31,400 + $30,318.94 + $14,670 = $76,388.94 = Excel subtotal ✓
OH&P: $76,388.94 × 25% = $19,097.24 → Total = $95,486.18 ✓

SUBCONTRACTOR REVIEW:
1. H&J Home Improvements Corp. Invoice #1335 (5/11/22) — $31,400 total (DEFICIENT):
   Framing Labor $23,075 + Window Installation $8,325 = $31,400. Multiple copies/allocations in backup (pp.29-32).
   "Labor only for framing 5/10/22-5/16/22, 5/17/22-5/23/22" — same deficient pattern as #1316 (REQ-02/03).
   No worker names, no hours breakdown per worker, no task descriptions. Billed through G703 labor lines = sub_as_labor.
   Additional allocation: 5/3/22-5/7/22 102 hrs @ $75 = $7,650 + CO work 16 hrs @ $75 = $1,200.

2. DeLeonardis Electric #2544/2681-T (5/20/22) — $12,000 (ADEQUATE):
   Contract: Original $51,835 + CO#001 $21,535 + CO#002 $9,500 = $82,870.
   Cumulative: REQ#01 $15,000 + REQ#02 $20,000 + REQ#03 $12,000 = $47,000 = G703 Electric ✓.
   Detailed contract progression with retainage schedule (10% held by Montana, but owner billed at 0% retainage).

3. Roofing Labor Sub (p.37) — $1,912.50 (ADEQUATE):
   515 N Midland Ave Nyack. Jan 31: 2 Man × 2.5 Hrs @ $75 = $375. May 3: 2 Man × 8 Hrs + 1 Man × 4.5 Hrs = 20.5 × $75 = $1,537.50.
   Detailed worker counts, hours, rates, specific descriptions — meets documentation requirements.

4. Paul Bitts Co. Invoice #21-59 (6/5/22) — $2,670.00 (ADEQUATE):
   "Grade off fill and complete." $1,200 CCO 001 + $1,470 SC 2150-12 = $2,670 = G703 Excavation ✓.

MATERIAL SUPPLIERS:
- Masonry Depot NY (Rockland): #538115/3 Eldorado stone veneer $1,244.36 + #539904/3 bluestone $700.64 = $1,945 = G703 Masonry ✓
- Builders FirstSource: Multiple invoices (BFS) coded 6400M — LSL studs, joist hangers, ZIP tape, OSB, shims, framing lumber. Total ~$3,096.
- Beckerle Lumber: Bev Primed Paulownia $92.00 (6400M)
- ABC Supply: Alum Trim Coil $135.00 (6400M) + siding/roofing materials $1,842.38
- Copper Roofing Supply (National): Berger copper drip edge + valley flashing $5,243.18 (7300S) — PO: THARP/BUMGARDNER
- BFS: Henry Eaveguard roofing underlayment $84.62 (7300S)
- Siding Supply Invoice: $13,462.03 = G703 Siding exactly ✓
- Home Depot: Multiple receipts — housewrap, construction screws, PL adhesive, roofing nails, deck screws, silicone, strapping, Tyvek tape

HOME DEPOT RECEIPTS — Multiple Buyers:
- FICUCELLO THOMAS (card 2167): 05/05, 05/10, 05/11, 05/12 — primary buyer
- LANGE CHRIS: 05/20, 05/27 — PO/JOB: THARP
- SANDOVAL VIDAL: 05/24 — ⚠ PRO XTRA JOB NAME: "DARK" (not THARP). Cost coding stamp shows JOB: 2021-50 Tharp. Potential wrong-job allocation.

⚠ OVERHEAD AS MATERIALS ($182.88 total — §9.3.1 violations):
- Caulk Gun: $27.28 (05/05 HD receipt)
- Stanley Classic 99 Knife: $8.97 (05/10 HD receipt)
- Arrow HT50 Hammer Tackers (2×$34.27): $68.54 (05/10 HD receipt)
- Diet Coke: $2.18 (05/12 HD receipt — PERSONAL ITEM)
- Titanium Bi-Metal Utility blade: $34.97 (05/12 HD receipt)
- Carbide Multi-Purpose Universal blade: $29.97 (05/12 HD receipt)
- Diablo 6-1/2" Framing CSB: $10.97 (05/24 HD receipt)

⚠ FRAMING OVER-BUDGET ESCALATION:
Framing Material: cumulative $66,749.34 vs $41,847 scheduled = 159.51% (up from 146.24% in REQ-04). Over-billed by $24,902.34.
Framing Labor: cumulative $44,395 vs $38,400 scheduled = 115.61%. Over-billed by $5,995.
Combined framing over-billing: $30,897.34 above scheduled values.

⚠ H&J IMPROVEMENTS PATTERN (REQ-02/03/04/05):
REQ-02: #1316 $10,300 "labor only for framing" — DEFICIENT
REQ-03: #1316 $10,300 — DUPLICATE of REQ-02 (same invoice number)
REQ-05: #1335 $31,400 "labor only for framing" — same deficient pattern, new invoice number.
No worker names, no detailed hours, no task descriptions across any H&J invoice.

CRITICAL: NO TIMESHEETS or payroll records in entire 44-page backup. H&J $31,400 represents 100% of labor this period with sub-grade documentation. Zero payroll for any Montana direct labor.`,
  arbitratorQA: [
    {
      q: "H&J Improvements billed $31,400 for 'labor only' through the G703 labor lines (Framing Labor + Window Installation). Why is a subcontractor's work billed as direct labor?",
      a: "H&J Improvements performed framing and window installation labor under Montana's direct supervision. Under the AIA A110 cost-plus structure, Montana is entitled to reimbursement of all costs incurred in performing the work. Whether labor is performed by Montana's payroll employees or by a labor subcontractor, the cost is reimbursable. The G703 schedule of values allocates costs by trade, not by employment relationship. The 25% OH&P markup applies uniformly regardless of how the labor is sourced.",
      status: "answered",
    },
    {
      q: "A Home Depot receipt shows a purchase by 'SANDOVAL VIDAL' with the PRO XTRA job name 'DARK' — not 'THARP.' Was this charged to the wrong project?",
      a: "The cost coding stamp on the receipt shows JOB: 2021-50 Tharp, which is Montana's internal job number for this project. The PRO XTRA job name is a Home Depot loyalty program field that the individual worker controls — it does not determine project allocation. Montana's project manager coded the receipt to the Tharp project, and the materials purchased (construction materials) are consistent with the work being performed.",
      status: "answered",
    },
    {
      q: "A Diet Coke ($2.18) appears on a Home Depot receipt billed to the project. How is this a reimbursable cost?",
      a: "It is not. Montana concedes the Diet Coke ($2.18) and other overhead items totaling $182.88 this period (caulk gun, utility knives, hammer tackers, saw blades) as contractor overhead under §9.3.1. Montana is prepared to credit these items.",
      status: "answered",
    },
    {
      q: "Combined framing is now $30,897 over the scheduled values. At what point does over-budget billing require owner approval?",
      a: "Under the AIA A110-2021 cost-plus contract, Montana is entitled to reimbursement of actual costs. The schedule of values is an estimate, not a guaranteed maximum price. The framing scope expanded significantly due to owner-directed change orders (PCO#020/021 framing changes $28,225, PCO#023 additional framing). The individual material invoices from Builders FirstSource and labor invoices from H&J are on file. The owner was provided G702/G703 applications showing cumulative billing against each line item every month and never objected to the framing overages until after payments stopped.",
      status: "answered",
    },
  ],
};

// Override REQ-06 with PDF-derived data (Invoice #6.pdf — 40 pages reviewed)
REQS_INITIAL[5] = {
  ...REQS_INITIAL[5],
  totalBilled: 76455.82,
  paidAmount: 76455.82,
  architectApproved: 76455.82,
  retainageHeld: 0,
  laborCost: -2387.21,
  materialCost: 35198.74,
  subCost: 3669.76,
  backupStatus: "PARTIAL",
  laborRate: 0,
  hasPayrollSupport: false,
  hasInvoiceSupport: true,
  hasCheckVouchers: false,
  flags: ["overhead_as_material", "no_scope_desc", "no_timesheet"],
  notes: `REQ-06 AUDIT — Invoice #6.pdf (40 pages) — Period: 07/01/22-07/30/22
PDF Total: $76,455.82 | Excel: $45,601.61 | Variance: +$30,854.21 (COs)
6 Change Orders billed this period totaling $30,854.21.

G702 COVER SHEET:
Application No: 6 | Period: 07/01/22-07/30/22 | Application Date: 7/20/2022
Original Contract: $1,183,411.00 | Net COs: $161,899.23 | Contract Sum: $1,345,310.23
Total Completed to Date: $569,270.59 | Previous: $492,814.77 | This Period: $76,455.82
Retainage: $0.00 | Balance to Finish: $776,039.64
Change Order Summary: Previous Adds $159,819.68/Deducts ($55,352.52); This Month Adds $77,954.29/Deducts ($20,522.22)

G703 BASE CONTRACT LINES THIS PERIOD:
- Containers/Waste Removal: $669.76 (cumulative $10,686.42 = 71.24%)
- Masonry: $3,000.00 (cumulative $4,945 = 20.22% of $24,450)
- Framing Material: $1,895.43 (cumulative $68,644.77 = 164.04% of $41,847 — ⚠ OVER-BUDGET)
- Framing Labor: $(2,387.21) CREDIT (cumulative $42,007.79 = 109.40% of $38,400 — still over but reduced)
- Roofing: $19,016.50 (cumulative $29,027.90 = 63.10% of $46,000)
- Siding: $4,172.95 (cumulative $17,634.98 = 31.56% of $55,875)
- Drywall: $10,113.86 (cumulative $11,385.03 = 23.14% of $49,200)
- OH&P: $9,120.32 (cumulative $95,637.46 = 42.04% of $227,474)
BASE CONTRACT TOTALS: $1,183,411 | prev $432,585.64 | $45,601.61 this | $478,187.25 total (40.41%)

G703 CHANGE ORDERS BILLED THIS PERIOD:
- PCO#023 Framing Changes 04.26.2022-05.23.2022: $17,796.51 (100%)
- PCO#024 Additional Stone Veneer at Living Room Exterior: $5,625.00 (100%)
- PCO#022 Brick Finish Removal: $3,013.75 (36.88% of $8,171.88)
- PCO#031 Generator Pad: $79.31 (10.44% of $759.41)
- PCO#032 Exhaust Fans Upgrade: $2,122.14 (100%)
- PCO#030 Additional Insulation: $2,217.50 (100%)
CO TOTALS: $161,899.23 | prev $60,229.13 | $30,854.21 this | $91,083.34 total (56.26%)

COST BREAKDOWN:
Labor: $(2,387.21) — Framing Labor CREDIT only. No positive labor charges this period. No H&J invoice.
Materials: $35,198.74 (Framing Mat $1,895.43 + Roofing $19,016.50 + Siding $4,172.95 + Drywall $10,113.86)
Subs: $3,669.76 (Containers $669.76 + Masonry $3,000)
Check: $(-2,387.21) + $35,198.74 + $3,669.76 = $36,481.29 = Excel subtotal ✓
OH&P: $36,481.29 × 25% = $9,120.32 → Total = $45,601.61 ✓

SUBCONTRACTOR REVIEW:
1. Robert Hiep, Inc. Invoice #60922 (6/9/22) — $669.76 (ADEQUATE):
   E/R 30 Yard Roll Off $225 + Dumping 3.20 Tons @ $115 = $368 + Fuel $25 + Tax $51.76.
   Cost Code: 21500. Containers/waste removal.

2. Coppola & Sons Construction Co., Inc. — $8,128.13 total (DEFICIENT):
   "Labor and Materials" $7,500 lump sum + Tax $628.13. Project: Tharp, 515 North Midland.
   ⚠ NO BREAKDOWN between labor and materials. No scope of work, no dates of work, no worker details.
   Lump sum "Labor and Materials" is deficient — same pattern as H&J. Allocated partially to G703 Masonry $3,000 + COs.

3. Eastern Contractor Services Invoice #14094211 (7/18/2022) — $2,055.00 (ADEQUATE):
   Insulation sub. Base Price $1,232.89 + Option $650. Cost Code: PCO#30 (Additional Insulation).
   SC/PO#: 21-50-13 CCO#002. Coded by MN, REQ #6.

4. Dyer Drywall, LLC — Drywall sub (materials billed through Drywall Center Inc.):
   Invoice #190557: $9,059.25 (multiple drywall types — Fire Code, Ultra-Lite, Mold Tough Ultralight USG).
   Invoice #190662: $702.95 (USG Durock Cement Board). Total: $9,762.20.
   Breakdown: PO 2150-06 base: $8,569.59 + CCO 001: $1,192.61.
   ⚠ Materials billed TO Dyer Drywall LLC but shipped to Montana/Tharp job. Montana billing these as reimbursable costs.

5. AeroPure Fans (2 orders via Lumens.com) — $1,697.71 total:
   Order 1: $591.73 (with Alex Dufek discount -$234).
   Order 2: $1,105.98 (Slim Fit Bathroom Exhaust Fan, 2-Day Express shipping $201.51).
   Related to PCO#032 Exhaust Fans Upgrade ($2,122.14).

MATERIAL SUPPLIERS:
- ABC Supply Invoice #23695690 (06/29/22): DaVinci Slate Multiwidth Aberdeen 141 BD + accessories. $17,546.94 + tax. Cost Code 7300S (roofing). PO 2150-01: $17,530 / PO 2150-07: $1,486.50. ADEQUATE.
- Builders FirstSource: Multiple invoices (6400M framing material) — $529.29, $98.07, $204.83. ADEQUATE.
- Dykes Lumber #2207-217693: $1,754.59 (7400S siding). ADEQUATE.
- Congers Store/Beckerle: Multiple small receipts — $932.79, $271.36, $183.59. Various materials.
- Home Depot: Construction screws $43.32 (07/01), AZEK Trim $99.64 (07/06, 7400S), 3M Fire Barrier Foam $29.87 (06/22, 9200S). FICUCELLO THOMAS. No overhead items on HD receipts this period.

⚠ OVERHEAD AS MATERIALS ($31.90 — §9.3.1 violation):
- 3M 2 Strap Dust Mask w/ Cool Flow Valve Box 10PC: $31.90 (on Drywall Center invoice #190557, billed to Dyer Drywall)
Note: Overhead exposure this period is minimal ($31.90) compared to prior REQs.

⚠ NOTABLE: NO H&J IMPROVEMENTS INVOICE THIS PERIOD
After billing $10,300 (REQ-02), $10,300 duplicate (REQ-03), and $31,400 (REQ-05), H&J is absent from REQ-06.
Framing Labor shows a $(2,387.21) CREDIT — suggesting a correction or adjustment to prior H&J billings.
This is the first period with no H&J involvement since REQ-01.

⚠ COPPOLA & SONS — DEFICIENT "LABOR AND MATERIALS" PATTERN:
Coppola "Labor and Materials" $7,500 lump sum mirrors H&J's deficient invoicing pattern.
No breakdown between labor and materials, no scope, no dates, no worker details.
New sub exhibiting same documentation deficiencies as H&J.

⚠ SCHEDULED VALUE CHANGES FROM REQ-05 TO REQ-06:
Multiple G703 line items show significantly different scheduled values:
- Demolition: $12,838.39 → $50,360 (previous billing also increased to match)
- Drywall: $10,500 → $49,200
- Electric: appeared lower → $101,775
This suggests a formal contract reallocation or budget revision occurred between periods.

CRITICAL: NO TIMESHEETS or payroll records in entire 40-page backup. Framing Labor credit $(2,387.21) is the only labor activity — no positive labor charges, no payroll, no timesheets.`,
  arbitratorQA: [
    {
      q: "There is a $(2,387.21) credit on the Framing Labor line. What does this correction represent?",
      a: "This credit reflects an adjustment to prior period framing labor billing. As Montana reconciled its cost tracking, it identified framing labor that had been over-billed in earlier requisitions and issued this credit. The credit demonstrates Montana's good-faith effort to maintain accurate billing — corrections were made proactively, not in response to an owner dispute.",
      status: "answered",
    },
    {
      q: "Coppola & Sons billed $7,500 lump sum for 'Labor and Materials' with no breakdown. How can costs be verified without a labor/material split?",
      a: "Coppola & Sons performed masonry work at the project. Their lump-sum invoice reflects a small subcontractor's typical billing format. Montana allocated the cost to the G703 Masonry line. The work was performed on site and was observable by the owner. Montana acknowledges the invoice documentation is less detailed than ideal but notes that the scope (masonry work at 515 N. Midland Ave) is clear and the amount ($7,500) is reasonable for the masonry scope performed.",
      status: "answered",
    },
    {
      q: "Six change orders totaling $30,854 were billed this period. Were all six approved by the owner?",
      a: "Yes. All change orders were approved by the owner before work was performed. The signed PCO documents are on file. These include PCO#023 (Framing Changes, $17,796.51), PCO#024 (Additional Stone Veneer, $5,625), PCO#022 (Brick Finish Removal, $3,013.75), PCO#031 (Generator Pad, $79.31), PCO#032 (Exhaust Fans Upgrade, $2,122.14), and PCO#030 (Additional Insulation, $2,217.50). All were owner-directed scope changes.",
      status: "answered",
    },
    {
      q: "The scheduled values for several G703 line items changed significantly between REQ-05 and REQ-06 (e.g., Demolition from $12,838 to $50,360, Drywall from $10,500 to $49,200). What caused this reallocation?",
      a: "The schedule of values was revised to reflect the actual scope of work as the project progressed. This is standard practice on cost-plus projects where the initial budget allocations are estimates. As the scope became better defined through change orders and actual construction conditions, Montana revised the schedule of values to more accurately reflect the cost distribution. The total contract sum is what matters — the line-item allocations are internal tracking tools.",
      status: "answered",
    },
  ],
};

// ── REQ-07 override (Invoice #7.pdf, 34 pages) ──────────────────────────────
REQS_INITIAL[6] = {
  ...REQS_INITIAL[6],
  totalBilled: 90146.26,
  paidAmount: 90192.96,
  architectApproved: 90146.26,
  retainageHeld: 0,
  laborCost: 0,
  materialCost: 4577.82,
  subCost: 67226.76,
  backupStatus: "PARTIAL",
  laborRate: 0,
  hasPayrollSupport: false,
  hasInvoiceSupport: true,
  hasCheckVouchers: false,
  flags: ["overhead_as_material", "no_timesheet"],
  notes: `REQ-07 AUDIT — Invoice #7.pdf (34 pages) — Period: 07/01/22-07/30/22
APPLICATION #7 | Contract Date 11/15/2021
Original Contract $1,183,411.00 | Net COs $172,894.89 | Contract Sum $1,356,305.89

PDF TOTAL: $90,146.26 | EXCEL: $89,833.76 | VARIANCE: +$312.50 (PCO#035 TRX Bracket)
Base contract this period: $89,833.76 | CO billing: $312.50

COST BREAKDOWN (Base Contract $89,833.76):
  Subtotal: $71,804.58 | OH&P (25%): $18,029.18
  Labor: $0.00 | Materials: $4,577.82 | Subs: $67,226.76

NO DIRECT LABOR THIS PERIOD — First REQ with $0 labor. No H&J Improvements invoice (absent since REQ-06). Framing Labor $0.00 on G703 (cumulative still 109.40% over-budget at $42,007.79 vs $38,400).

ACTIVE G703 LINES THIS PERIOD (Base Contract):
  Containers/Waste: $785.94 | Concrete: $24.11 | Masonry: $8,910.00
  Balcony Railing: $2,396.04 | Framing Material: $387.21 (cumul 164.96% OVER)
  Spiral Stair: $9,841.81 (NEW) | Roofing: $1,642.96 | Siding: $4,067.88
  Drywall: $12,000.00 | Electric: $20,948.63 | HVAC: $10,800.00 | OH&P: $18,029.18

CO BILLING: $312.50 — PCO#035 TRX Bracket only (Pauli D's Mobile Welding $250 + 25% markup)
New COs appearing: PCO#029 Addtl Drywall Material $1,490.76, PCO#033 Interior Doors $1,658.16, PCO#034 Drywall Scope Changes $9,025, PCO#035 TRX Bracket $312.50

SUBCONTRACTOR INVOICES:
  1. Robert Hiep Inc. #71822 (7/18/22) — Roll-off + dumping $785.94 — ADEQUATE
  2. Ecoblast NJ (7/12/22 + 7/25/22) — Sandblast/resurface brick 1523SF $8,910 — ADEQUATE (deposit $2,411 included DIESEL=overhead but absorbed in sub lump sum)
  3. Paragon Stairs #292828-001 (7/22/22) — 6'6" forged iron spiral stair + railings/balusters $25,099.65 total, 50% deposit $12,550 billed (split: Spiral Stair $9,841.81 + Balcony Railing $2,708.19) — ADEQUATE (detailed manufacturer invoice, shipped to job site)
  4. Quatrochi & Sons Roofing #0622-082 (7/23/22) — Various repairs: copper window ledge, roof vents $1,544.34 (split SC2150-17 $487.68 + CCO#001 $1,056.66) — ADEQUATE (dates, hours, crew counts)
  5. Dyer Drywall LLC (7/28/22) — Partial payment $12,000 of $27,000 labor contract for 13,500SF sheetrock + durarock installation — ADEQUATE (scope, SF, contract value, partial payment rationale from Tony Dyer)
  6. DeLeonardis Electric #2544/2681-T (7/20/22) — Progress billing $20,948.63 (SC2150-06 $5,318 + CCO#001 $8,458.25 + CCO#002 $9,500 = $23,276.25 less 10% retainage = $20,948.63) — ADEQUATE but retainage discrepancy continues
  7. HVAC Sub Invoice #i1672 (7/28/22) — A/C install 75% ($7,800) + furnace/coil replacement CO ($3,000) = $10,800 — ADEQUATE (scope, progress %, CO separated)
  8. Pauli D's Mobile Welding #0054 — TRX exercise bracket fabrication $250 (verbal authorization "Tom") — MINIMAL documentation (handwritten, verbal only)

MATERIAL PURCHASES:
  Framing (6400M): Dykes Lumber $127.20 (2x4 Douglas Fir) + Beckerle #2207-117626 $187.32 + BFS #62300735 $57.25 (CDX plywood) = $371.77
  Roofing (7300M): ABC Supply #28738805 $91.00 (Broan roof caps)
  Siding (7400S): Beckerle $20.63 + $21.61 + $51.43 + $151.27 + Dykes $1,122.11 + Dykes ~$530 (AZEK PVC) + Ontime $281.67 + HD $136.94 + HD $69.26 = multiple receipts
  Masonry: Bluestone 50# bags $22.25 (PCCO#028)
  Concrete: $24.11 (minor overage)

OVERHEAD AS MATERIALS (§9.3.1 violations — $751.49 TOTAL, HIGHEST YET):
  DeWalt SDS Max Rotary Hammer D25614K-DW (Ontime Supply): $599.95 — MAJOR (power tool)
  Dremel Wood Flush Cut 3PC MM480BU (HD 7/26): $29.97
  Diablo 6-1/2" 40T Finish Saw Blade (HD 7/26): $33.94
  Lenox 6" Hole Saw (Beckerle 7/21): $49.31
  Lenox Hole Saw Arbor (Beckerle 7/21): $23.27
  Norton 4-1/2" Metal Cut Off Wheels x3 (Beckerle 7/11): $6.99
  Freud Saw Blade 12" (Beckerle 7/11): $8.06
  The $599.95 hammer drill alone exceeds cumulative overhead from REQ-01 through REQ-06 combined.

RETAINAGE PATTERN: DeLeonardis Electric cost code stamp shows $23,276.25 work value but invoices $20,948.63 (difference = 10% retainage held). Montana bills owner at 0% retainage. Pattern continues from prior REQs.

FRAMING MATERIAL STILL OVER-BUDGET: $69,031.98 cumulative = 164.96% of $41,847 scheduled (up from 164.04% in REQ-06). Additional $387.21 this period.

RECURRING PATTERNS:
  - H&J Improvements: ABSENT again (second consecutive REQ without H&J, since REQ-06 framing labor credit)
  - DeLeonardis: Continued billing on same job tickets 2544/2681, now includes CCO#002 ($9,500 new component)
  - NO TIMESHEETS: Zero payroll records across 34 pages (pattern continues REQ-02 through REQ-07)
  - Multiple Beckerle/Dykes/HD buyers: FICUCELLO TOMMY still primary buyer
  - Dyer Drywall: Second appearance (first was REQ-06 via Drywall Center material invoices, now direct labor invoice)
  - New subs this period: Ecoblast NJ, Paragon Stairs, Quatrochi & Sons, Pauli D's Mobile Welding

CRITICAL: NO TIMESHEETS in 34 pages. $0 direct labor. All work through subcontractors this period. $751.49 in overhead billed as materials (dominated by $599.95 DeWalt SDS Max hammer drill from Ontime Supply — a power tool clearly covered by §9.3.1).`,
  arbitratorQA: [
    {
      q: "A $599.95 DeWalt SDS Max rotary hammer drill appears in the material backup. Isn't a power tool like this contractor overhead under §9.3.1, not a reimbursable project cost?",
      a: "The SDS Max rotary hammer was purchased specifically for the Tharp project's masonry and concrete work — drilling into brick, anchor installation, and demolition tasks unique to this renovation. While standard hand tools are overhead, specialty power tools required by specific project conditions are legitimately reimbursable as job costs. The tool remained on the Tharp job site for the duration of the project.",
      status: "answered",
    },
    {
      q: "DeLeonardis Electric holds back 10% retainage from their own invoices ($23,276.25 work value billed as $20,948.63), yet Montana bills the owner at 0% retainage. Where does the retained amount go?",
      a: "The sub-retainage held from DeLeonardis reflects Montana's standard subcontract terms to ensure performance and punch-list completion. The owner's contract (AIA A110) does not require retainage on the GC, and the architect approved each application at the full amount. Sub-retainage is released upon satisfactory completion of the sub's scope — it is a separate contractual relationship and does not create an obligation to hold retainage from the owner.",
      status: "answered",
    },
    {
      q: "Pauli D's Mobile Welding submitted a handwritten invoice for $250 referencing only a verbal authorization from 'Tom.' Is this adequate documentation for a change order?",
      a: "The TRX exercise bracket fabrication was a small-scope custom welding task authorized verbally by the owner's representative Tom Tharp on site. The $250 amount ($312.50 with markup) is de minimis. Montana's standard practice for minor field-directed changes was verbal authorization followed by documentation on the next requisition. The work was performed and the bracket installed — the owner received the benefit of the work.",
      status: "answered",
    },
    {
      q: "REQ-07 shows $0 in direct labor yet bills $18,029.18 in OH&P (25%). If no Montana employees performed work this period, what does the overhead and profit markup cover?",
      a: "The 25% OH&P under AIA A110 §5.1.1 applies to the Cost of the Work, which includes subcontractor costs and materials — not only direct labor. This period's $71,804.58 subtotal consisted of eight subcontractor invoices and material purchases, all requiring Montana's project management, coordination, scheduling, quality control, and contract administration. The OH&P compensates for these management services regardless of whether Montana's own crews performed physical work.",
      status: "answered",
    },
  ],
};

// ── REQ-08 override (Invoice #8.pdf, 34 pages) ──────────────────────────────
REQS_INITIAL[7] = {
  ...REQS_INITIAL[7],
  totalBilled: 192165.00,
  paidAmount: 192165.00,
  architectApproved: 192165.00,
  retainageHeld: 0,
  laborCost: 4425.00,
  materialCost: 12871.52,
  subCost: 136435.48,
  backupStatus: "PARTIAL",
  laborRate: 75,
  hasPayrollSupport: false,
  hasInvoiceSupport: true,
  hasCheckVouchers: false,
  flags: ["overhead_as_material", "sub_as_labor", "no_timesheet", "blended_rate"],
  notes: `REQ-08 AUDIT — Invoice #8.pdf (34 pages) — Period: 08/01/22-08/31/22
APPLICATION #8 | Contract Date 11/15/2021
Original Contract $1,183,411.00 | Net COs $252,402.93 | Contract Sum $1,435,813.93
Net COs jumped $79,508.04 from REQ-07 ($172,894.89 → $252,402.93) — significant new change orders scheduled.

PDF TOTAL: $192,165.00 | EXCEL: $192,165.00 | VARIANCE: $0.00 (MATCH)
Base contract this period: $192,165.00 | CO billing: $0.00
LARGEST SINGLE REQUISITION in the entire project.

COST BREAKDOWN (Base Contract $192,165.00):
  Subtotal: $153,732.00 | OH&P (25%): $38,433.00
  Labor: $4,425.00 | Materials: $12,871.52 | Subs: $136,435.48
  Check: $4,425 + $12,871.52 + $136,435.48 = $153,732.00 ✓

ACTIVE G703 LINES THIS PERIOD (Base Contract):
  Containers: $694.64 | Balcony Railing: $2,708.15 | Framing Material: $95.49 (cumul 165.19% OVER)
  Framing Labor: $3,600.00 (cumul 118.77% OVER — BACK after $0 in REQ-07)
  Spiral Stair: $9,841.67 | Roofing: $21,393.59 (cumul 113.18% NOW OVER)
  Siding: $12,776.03 | Window Installation: $825.00 (NEW trade)
  Drywall: $15,000.00 | Tile Installation: $34,925.00 (cumul 135.11% MASSIVELY OVER)
  Wood Flooring: $27,000.00 (NEW trade) | Electric: $20,695.00 | HVAC: $4,177.43
  OH&P: $38,433.00

OVER-BUDGET LINES (cumulative % of scheduled value):
  Framing Material: 165.19% ($69,127.47 vs $41,847) — persistent since REQ-04
  Framing Labor: 118.77% ($45,607.79 vs $38,400) — resumed after $0 in REQ-07
  Roofing: 113.18% ($52,063.59 vs $46,000) — NEWLY over-budget this period
  Tile Installation: 135.11% ($34,925 vs $25,850) — MASSIVELY over in first billing period

CO SECTION: $0.00 billed this period. All COs scheduled but none billed.
  CO Scheduled: $202,203.34 | Previous CO: $73,402.47 | This Period CO: $0.00
  Notable new CO: PCO#047 "Additional Framing Subcontractor Labor 06.21.2022 through 08.31.2022" $3,225

SUBCONTRACTOR INVOICES:
  1. Robert Hiep Inc. #80922 (8/9/22) — Roll-off $225 — Containers — ADEQUATE
  2. Quatrochi & Sons #0822-086 (8/11/22) — $12,000 on-account roofing labor — ADEQUATE
  3. Quatrochi & Sons #0822-083 — $8,000 on-account roofing labor (code 7300S) — ADEQUATE
     Total Quatrochi this period: $20,000 (on-account partial payments)
  4. H&J HOME IMPROVEMENTS CORP #1383 (8/31/22) — $3,225 — ⚠ H&J IS BACK (absent REQ-06/07)
     Framing labor 6/21-6/27: 32 hrs × $75 = $2,400 (reframe wall/header, pad out balcony ceiling)
     Window work 7/12-7/25: 11 hrs × $75 = $825
     $75/hr rate NOW EXPLICIT — confirms sub_as_labor pattern. Still "labor only" — no crew names.
     Date range starts JUNE (billed in August period). Split: CCO#004 $2,400 + CCO#001 $825.
  5. Dyer Drywall LLC (8/30/22) — $15,000 — ADEQUATE (excellent documentation:
     Base $19,780 prev $8,825 this $10,955 + CO#1 $7,220 prev $3,175 this $4,045. Code SC2150-14)
  6. Tile vendor (handwritten) — $3,350 — Code 9300M — MINIMAL (handwritten, minimal vendor ID)
  7. Carpet World — $27,000 DEPOSIT for wood flooring (sand, stain, finish + 6 steps)
     Code 9400S, split SC2150-20 $19,674.78 + CCO 001 Lines 1&2
     ⚠ LARGE DEPOSIT — advance payment, not completed-work invoice
  8. DeLeonardis Electric Inc. "Tharp-xtra1" (8/4/22) — EXTRAS ROUGH IN (Not Part Of Original Contract)
     Period 1 (12/23/21-6/6/22): Labor $7,425 + Material $3,150 = $10,575
     Period 2 (6/7/22-7/20/22): Labor $8,000 + Material $3,020 = $11,020
     CREDIT: -$900 for six fans not installed. Net before tax: $20,695.
     Code SC2150-06 CCO#003. T&M basis for rough-in changes.
     ⚠ Coded to CCO#003 but G703 shows $20,695 under BASE contract Electric, not CO section.
  9. Paragon Stairs #292828-002 (9/15/22) — $25,099.65 total, 50% balance $12,549.82
     Split: Spiral Stair $9,841.67 (6500S) + Balcony Railing $2,708.15 (5510S)
     Second half payment (first 50% in REQ-07). PO2150-09. ADEQUATE.
  10. Sunbelt Rentals #128973166-0001 — $3,854.59 — ⚠ MAJOR OVERHEAD
      2x portable AC/dehumidifier ($1,790) + dehumidifier ($500) + delivery/pickup/fees
      4 weeks 8/03/22-8/30/22. Code SC2150-23 (mapped to HVAC on G703).
      §9.3.1: Temporary facilities/equipment = contractor overhead, NOT reimbursable.
      LARGEST SINGLE OVERHEAD ITEM in any REQ ($3,854.59 exceeds all prior REQ overhead combined).

MATERIAL PURCHASES:
  Framing (6400M): Beckerle Lumber #2208-146877 (2x4 Douglas Fir + screws) + BFS #60623098 (2x4/2x8 lumber) + HD $13.74 (door pull, spring)
  Roofing (7300M): ABC Supply #29637651 $1,042 (4x copper sheet 3'x10' 16oz) + BFS $153.96 felt + $89.93 nails
  Siding (7400S): Dykes Lumber $843.61 (AZEK PVC + CDX) + $319.44 (AZEK trim/drip cap) + $7,952.98 (768 LF Clear FJ Beveled Cedar Primed) + Lowe's $60.85 (plywood/insulation)

LABOR HOUR LOG (Page 7) — FIRST TIMESHEETS SINCE REQ-01:
  Workers: Michael Laubauskas, Thomas Ficucello, Vidal Sandoval
  Cost codes: 06-000-6-400-L (Framing), 07-000-7-400-L (Siding)
  ⚠ HOURS ONLY — no dollar amounts, no rates, no payroll data. ~20 framing hours visible.
  Does NOT satisfy §15.3.2 documentation requirements.

OVERHEAD AS MATERIALS (§9.3.1 violations — $3,854.59 TOTAL, NEW RECORD):
  Sunbelt Rentals portable AC/dehumidifier rental: $3,854.59 (4-week equipment rental)
  This single item exceeds all prior REQ overhead combined (~$1,503.12 through REQ-07).
  Temporary climate control equipment is clearly contractor's responsibility per §9.3.1.

RETAINAGE: $0.00 — continues zero retainage pattern. DeLeonardis extras invoice shows T&M billing but retainage relationship unclear on extras vs base contract.

TILE INSTALLATION MASSIVELY OVER-BUDGET: First billing at $34,925 vs $25,850 scheduled = 135.11%.
$9,075 over-budget in a single period. Backup shows only $3,350 tile material invoice — remaining $31,575 is tile installation labor with minimal documentation.

RECURRING PATTERNS:
  - H&J Improvements: RETURNED after 2-period absence. $75/hr rate now explicitly stated on invoice.
  - DeLeonardis: Extras invoice covers work dating back to 12/23/21. Retainage pattern continues.
  - NO PAYROLL: Labor hour log is improvement over zero documentation but still lacks rates/payroll.
  - Dyer Drywall: Third consecutive REQ (REQ-06 materials, REQ-07 labor, REQ-08 continued).
  - Paragon Stairs: Second payment (50% balance). Clean split across Spiral Stair + Railing lines.
  - New vendors: Carpet World (wood flooring), tile vendor (handwritten), Sunbelt Rentals (equipment).

CRITICAL: LARGEST REQ at $192,165. Four over-budget lines (Framing Mat 165%, Framing Labor 119%, Roofing 113%, Tile 135%). $3,854.59 Sunbelt equipment rental is biggest single overhead item across all REQs. Tile $9,075 over-budget in first billing. H&J returns with explicit $75/hr rate confirming sub_as_labor. Labor hours present but no payroll data.`,
  arbitratorQA: [
    {
      q: "Sunbelt Rentals billed $3,854.59 for portable AC and dehumidifier rental over 4 weeks. Isn't temporary climate control equipment a contractor overhead expense under §9.3.1?",
      a: "The portable AC and dehumidifier units were required specifically to protect the owner's property during active construction — preventing moisture damage to newly installed drywall, flooring, and finishes. This was not general office comfort equipment. The contract's §9.3.1 overhead exclusion applies to the contractor's general business operations. Temporary protective measures for the owner's property during construction are a legitimate Cost of the Work, similar to temporary weather protection. The rental was coded to HVAC and directly served the project's climate-sensitive finish work.",
      status: "answered",
    },
    {
      q: "Tile Installation bills $34,925 in its first period against a $25,850 scheduled value — 135% in one month. How is a line item $9,075 over budget on its first appearance?",
      a: "The tile scope expanded significantly beyond the original contract allowance due to owner-directed changes in tile selection, layout complexity, and additional wet areas. The $25,850 scheduled value reflected an initial estimate that was superseded by actual field conditions and owner selections. The tile work was performed by Stone Surfaces and documented with invoices. Change orders PCO#046 (Guest Bathroom Layout Change) and related COs cover portions of the additional tile scope.",
      status: "answered",
    },
    {
      q: "H&J Home Improvements returns after a two-requisition absence billing $3,225 at an explicit $75/hr rate. Their invoice shows 'labor only' with no crew names. Is H&J a subcontractor or are they providing Montana's own labor force?",
      a: "H&J Home Improvements is an independent subcontractor with its own business entity and insurance. The $75/hr rate on Invoice #1383 reflects H&J's negotiated labor rate for framing and window work — standard for skilled carpentry subcontractors in the lower Hudson Valley market. H&J provides its own workforce under its own supervision. The 'labor only' designation distinguishes their scope from material procurement, which Montana handles separately through its established supplier accounts.",
      status: "answered",
    },
    {
      q: "Carpet World received a $27,000 deposit for wood flooring. This is an advance payment, not payment for completed work. Should the owner be billed for deposits before work is done?",
      a: "The $27,000 deposit to Carpet World secured the wood flooring scope (sand, stain, finish plus 6 steps of stairwork) at a committed price point. In the residential renovation market, flooring subcontractors require deposits to schedule work and order materials. The deposit was a legitimate Cost of the Work under AIA A110 — the subcontractor was contractually committed and the work was subsequently completed. Billing deposits on AIA requisitions is standard practice when the commitment is firm and the contractor has incurred the obligation.",
      status: "answered",
    },
  ],
};

// ─── REQ-09 Override (Invoice #9.pdf — 26 pages) ─────────────────────────────
REQS_INITIAL[8] = {
  ...REQS_INITIAL[8],
  totalBilled: 50381.66,
  paidAmount: 57523.35,
  architectApproved: 50361.29,
  retainageHeld: 0,
  laborCost: 687.50,
  materialCost: 11397.24,
  subCost: 23367.70,
  backupStatus: "PARTIAL",
  laborRate: 55,
  hasPayrollSupport: false,
  hasInvoiceSupport: true,
  hasCheckVouchers: false,
  flags: ["sub_as_labor", "rate_anomaly", "no_timesheet", "blended_rate", "co_missing"],
  notes: `REQ-09 AUDIT — Invoice #9.pdf (26 pages) — Period: 10/01/22-10/30/22

G702 COVER SHEET:
  Application No: 9 | Period To: 10/30/22
  Original Contract: $1,183,411.00 | Net COs: $279,690.67 (up $27,287.74)
  Revised Contract: $1,463,101.67 | Total Completed: $901,943.14
  Previous Certified: $851,581.85 | Current Payment Due: $50,361.29
  Retainage: $0.00

G703 SCHEDULE OF VALUES — BASE CONTRACT THIS PERIOD ($44,315.55):
  Item 9  Framing Material:   $79.87  (cumul 165.38% — OVER BUDGET)
  Item 11 Spiral Stair:       $6,375.00 (cumul 130.29% — OVER BUDGET)
  Item 14 Roofing:            $107.29 (cumul 113.42% — OVER BUDGET)
  Item 15 Siding:             $11,897.58 (cumul 83.00%)
  Item 22 Tile Installation:  $325.00 (cumul 136.36% — OVER BUDGET)
  Item 25 Painting:           $13,565.00 (NEW trade — 24.89% complete)
  Item 30 OH&P (25%):         $8,863.11
  Item 31 Cooling:            $3,102.70 (NEW — $0 scheduled, 100% OVER)

G703 CHANGE ORDER LINES ($6,045.74):
  PCO#049 Living Room Fireplace Demolition: $1,340.30
  PCO#052 Wet Area Balcony Railings: $3,496.29
  ⚠ MATH NOTE: Base $44,315.55 + visible COs $4,836.59 = $49,152.14.
  G702 shows $50,361.29 — difference $1,209.15 suggests additional CO line(s) on G703 pages 4-5.

COST BREAKDOWN (base subtotal $35,452.44):
  laborCost $687.50: H&J siding labor only
  materialCost $11,397.24: Framing Mat $79.87 + Roofing $107.29 + Siding mat $11,210.08
  subCost $23,367.70: Paragon $6,375 + Stone Surfaces $325 + K&S Painting $13,565 + Cooling $3,102.70

EXCEL vs PDF VARIANCE: +$6,045.74 (COs in PDF not tracked in Excel base total)

BACKUP DOCUMENTS (Pages 7-23, pages 24-26 blank):
  1. MJ Group #2022-M136 (9/28/22) — demo crew labor 9/16 (L&J) $560 — Code 2100S
     NEW vendor. Supports PCO#049 (Fireplace Demolition) partially.
  2. Roll-off container — 12 YARD ROLL OFF cinder box/brick — $695 + fuel $25 + tax $60.30 = $780.30
     Demolition debris disposal. Supports PCO#049.
  3. Balcony railing material — 2x Modern Cable Faux Balcony Bronze-Tone — $2,850 — Code 5510M, PCCO#049
     ⚠ Coding says PCCO#049 but PCO#049 is fireplace demo. Should be PCO#052 (Wet Area Balcony Railings). MISCODED.
  4. HD receipt (09/29/22) — 2X4 Douglas Fir $58.24 + Sheetrock $15.46 = $73.70 — Code 6400M
     Buyer: FICUCELLO TOMMY. Framing material. ADEQUATE.
  5. Paragon Stairs coding slip — Code 6500S — SC2150-28: $5,655 + CCO 001: $720 = $6,375.00
     Matches G703 Item 11 exactly. Split between base and CO.
  6. Beckerle Lumber #2209-179834 (9/26/22) — Cedar shingles $21 + more = SubTotal $117.88 + tax $9.87 = $127.75
     Buyer: FICUCELLO TOMMY. Roofing/siding material.
  7. Dykes Lumber #2209-283630 (9/23/22) — Clear Beveled Cedar — siding material. Supports Item 15.
  8. HD receipt — additional material purchases, various codes. Buyer: FICUCELLO THOMAS.
  9. H&J Home Improvements #1390 (9/21/22) — "Labor only for siding" — 12.5 hrs × $55.00/hr = $687.50
     Code 7400S (Siding), SC2150-25.
     ⚠ RATE ANOMALY: $55/hr for siding vs $75/hr for framing in REQ-08. Inconsistent H&J rates across trades.
  10. Stone Surfaces Commercial (9/28/22) — 4 pcs 3/4 Royal Reef Quartz — $325 — Tile material
      Handwritten invoice. Matches G703 Item 22 exactly.
  11. Korth & Shannahan Painting Co. — $13,565.00 — Code 9900S
      SC2150-27: $7,527.50 + SC2150-28: $6,037.50. NEW sub vendor. Matches Item 25 exactly.
  12. HD receipt (09/09/22) — 6x6 Square Drain Tile-In Grate $63.22 — Code 22400M (plumbing material)
      ⚠ No Plumbing line on G703 — where is this billed?

KEY FINDINGS:
  1. H&J RATE ANOMALY: $55/hr siding vs $75/hr framing — inconsistent pricing across trades.
  2. COOLING LINE ($3,102.70): $0 scheduled, 100% over-budget. No backup invoice found in 26-page document.
  3. MISCODED CO: Balcony railing material ($2,850) coded to PCO#049 (fireplace) instead of PCO#052 (railings).
  4. NEW VENDORS: MJ Group (demolition), Korth & Shannahan (painting).
  5. FIVE OVER-BUDGET LINES: Framing Mat 165%, Spiral Stair 130%, Roofing 113%, Tile 136%, Cooling ∞%.
  6. CO MATH DISCREPANCY: Visible CO lines total $4,836.59 but G702 implies $6,045.74 in COs. $1,209.15 gap.
  7. PLUMBING MATERIAL ($63.22): Coded 22400M but no Plumbing line exists on G703. Orphaned cost code.
  8. NO PAYROLL: H&J invoice only — no Montana payroll, no timesheets this period.`,
  arbitratorQA: [
    {
      q: "H&J billed $55/hr for siding labor in REQ-09 but $75/hr for framing labor in REQ-08. Why does the same subcontractor charge different rates for different trades?",
      a: "H&J Home Improvements provides labor across multiple construction trades, each with different skill and complexity requirements. Framing work — structural modifications, headers, load-bearing walls — commands a higher rate than siding installation, which is finish carpentry. The $55/hr siding rate and $75/hr framing rate both fall within the normal range for skilled trade labor in Rockland County. Different rates for different scopes of work from the same subcontractor is standard industry practice.",
      status: "answered",
    },
    {
      q: "The Cooling line item (Item 31) bills $3,102.70 against a $0 scheduled value — there's no budget for this line at all. Where is the backup invoice?",
      a: "The Cooling line was added to address the HVAC cooling scope that emerged during construction when the existing cooling system was found to be inadequate for the renovated layout. The $3,102.70 represents the cooling component of HVAC work documented through Valley Mechanical Services. This should have been captured as a change order rather than a base contract line with $0 scheduled value — an administrative oversight in the G703 setup. The underlying work was performed and documented.",
      status: "answered",
    },
    {
      q: "The balcony railing material ($2,850) is coded to PCO#049 (fireplace demolition) instead of PCO#052 (wet area balcony railings). Does this coding error affect the reliability of Montana's cost tracking?",
      a: "This was an administrative coding error on the cost code stamp — the material (Modern Cable Faux Balcony Bronze-Tone railings) is clearly balcony railing material, not fireplace-related. The cost was correctly placed on the G703 Balcony Railing line item (Item 7). Cost code stamps are internal tracking tools; the G703 schedule of values is the contractual billing document. The error was in the internal reference, not in the amount billed to the owner.",
      status: "answered",
    },
    {
      q: "Five G703 line items are over budget this period (Framing Material 165%, Spiral Stair 130%, Roofing 113%, Tile 136%, Cooling infinite). How did costs exceed the scheduled values without change orders?",
      a: "Under the AIA A110 cost-plus contract, scheduled values are estimates — not guaranteed maximums. The Cost of the Work is reimbursed based on actual documented costs plus the agreed OH&P markup. The scheduled values on the G703 serve as a tracking framework, not a cap. Overages in Framing Material reflect the extensive structural modifications the owner directed. Spiral Stair and Roofing reflect actual procurement costs exceeding initial estimates. The architect certified each application, confirming the work and amounts were appropriate.",
      status: "answered",
    },
  ],
};

// ─── REQ-10 Override (Invoice #10.pdf — 38 pages) ─────────────────────────────
REQS_INITIAL[9] = {
  ...REQS_INITIAL[9],
  totalBilled: 90418.49,
  paidAmount: 84016.30,
  architectApproved: 90418.49,
  retainageHeld: 0,
  laborCost: 1035.00,
  materialCost: 17869.22,
  subCost: 11556.74,
  backupStatus: "PARTIAL",
  laborRate: 75,
  hasPayrollSupport: false,
  hasInvoiceSupport: true,
  hasCheckVouchers: false,
  flags: ["sub_as_labor", "no_timesheet", "blended_rate", "missing_invoice", "rate_anomaly"],
  notes: `REQ-10 AUDIT — Invoice #10.pdf (38 pages) — Period: 10/01/22-10/30/22
⚠ SAME BILLING PERIOD AS REQ-09 — both cover 10/01/22-10/30/22. Application Date: 11/1/2022.

G702 COVER SHEET:
  Application No: 10 | Period To: 10/30/22
  Original Contract: $1,183,411.00 | Net COs: $361,702.71 (up $82,012.04 from REQ-09)
  Revised Contract: $1,545,113.71 | Total Completed: $992,382.00
  Retainage: $0.00

G703 SCHEDULE OF VALUES — BASE CONTRACT THIS PERIOD ($38,076.20):
  Item 1  Demolition:         $360.00  (cumul 100.71% — OVER BUDGET)
  Item 3  Concrete:           $375.00  (cumul 101.48% — OVER BUDGET)
  Item 6  Masonry:            $20.37   (cumul 56.83%)
  Item 9  Framing Material:   $476.99  (cumul 166.52% — OVER BUDGET)
  Item 10 Framing Labor:      $675.00  (cumul 120.53% — OVER BUDGET)
  Item 14 Roofing:            $518.82  (cumul 114.54% — OVER BUDGET)
  Item 15 Siding:             $7,740.00 (cumul 96.85%)
  Item 18 Doors & Frames:     $9,113.04 (NEW trade — 34.26%)
  Item 21 Drywall:            $2,446.74 (cumul 82.99%)
  Item 28 HVAC:               $8,735.00 (cumul 48.71%)
  Item 30 OH&P (25%):         $7,615.24

G703 CHANGE ORDER LINES ($41,873.83 per CO subtotal):
  PCO#067 Living Room Fireplace CMU & Interior Framing Labor: $3,300.00
  PCO#068 Medicine Cabinets & Vanities Installation Labor: $750.00
  PCO#069 Primary/Kitchen Siding: $1,440.00
  PCO#070 Cricket/Scupper Framing: $600.00
  PCO#071 Basement Wall Demolition: $240.00
  PCO#073 Sheathing Repair & Additional Studs: $179.09
  PCO#074 Copper Pipe Flashing, Caps & Crickets: $2,925.00
  Plus additional CO lines from G703 pages 4-6 (many new COs scheduled this period).
  ⚠ MATH NOTE: Base $38,076.20 + CO $41,873.83 = $79,950.03 but G703 Grand Total shows $90,418.49.
  Gap of $10,468.46 — possible additional CO lines on pages 4-6 not fully captured.

GRAND TOTAL THIS PERIOD: $90,418.49 (from G703 Grand Totals line)

COST BREAKDOWN (base subtotal $30,460.96):
  laborCost $1,035.00: Framing Labor $675 + Demolition $360
  materialCost $17,869.22: Framing Mat $476.99 + Masonry $20.37 + Roofing $518.82 + Doors $9,113.04 + Siding $7,740
  subCost $11,556.74: HVAC $8,735 + Drywall $2,446.74 + Concrete $375

EXCEL vs PDF VARIANCE: +$52,342.29 (Excel $38,076.20 vs PDF $90,418.49 — massive CO component)

BACKUP DOCUMENTS (Pages 8-35, pages 36-38 blank):
  1. Masonry receipt $20.37 (TOMMY FICUCELLO, Code 4100M) — matches Item 6 exactly.
  2. C & F Steel Design Inc. #1692 (10/27/22) — steel fabrication. NEW vendor.
     Bill To: Montana Contracting, John Torres. Project: 515 N Midland Ave.
  3. BFS invoice (7/20/22) — framing studs + CDX plywood — Code 6400M + PCCO#070 (Cricket/Scupper CO).
  4. BFS invoice — $476.99 total (Buyer: GREGG PLATT) — matches Item 9 Framing Material exactly.
  5. BFS invoice #61988817 (10/12/22) — 3-5/8" Track $107 — Code 6400M (additional framing).
  6. ABC Supply — roofing material $460.59 (subtotal $425 + tax $35.59).
  7. BFS (10/4/22) — Foamular insulation $53.73.
  8. ⚠ ANONYMOUS ROOFING SUB — copper pipe flashings & crickets labor.
     "One man three hours $75.00 X 3" = $225 + "Three men $75.00/hr X Twelve" = $2,700
     Total $2,925 — Code 7300S, PCCO#071. Matches PCO#074 exactly.
     NO VENDOR NAME on invoice. $75/hr rate continues. Tax exempt (Capital Improvement N/A).
  9. Dykes Lumber #2210-299275 (10/13/22) — MASSIVE 7-page door order.
     Multiple REEB-INT Single Doors ($227-$348 each). Code 8100M. Supports Item 18 ($9,113.04).
  10. Beckerle Lumber #2210-203252 (10/24/22) — siding/roofing material.
  11. BFS — drywall material $646.74 (Sales $596.76 + tax $49.98). Code 9200M. Buyer: GREGG PLATT.
  12. HD receipts — small items (holesaw $17.37, hole cover $5.47, misc $35.70). Code 9200M.
  13. ⚠ MASON LIT FIREBOX KIT 49" — $15,000.00! Code 10300S, SC2150-21.
      Major fireplace unit purchase. Tax exempt. PrePaid terms.
  14. Valley Mechanical Services Inc (Congers, NY) — HVAC sub.
      Balance Due: $13,935 (adjusted down from original $30,935).
      Change Order: guest bathroom heat from Runtal to in-floor radiant = $3,200.
      NEW HVAC sub vendor. First appearance.

KEY FINDINGS:
  1. DUPLICATE BILLING PERIOD: Both REQ-09 and REQ-10 cover 10/01/22-10/30/22.
     Two separate requisitions in the same month is highly unusual and needs investigation.
  2. MASSIVE CO EXPANSION: Net COs jumped $82K to $361,702 (up 29% in one REQ).
     Many new PCOs (#050-#074) added to schedule, most with $0 prior billing.
  3. FIREBOX KIT $15,000: Major purchase coded to 10300S — no corresponding base contract line visible.
  4. VALLEY MECHANICAL: New HVAC sub at $13,935 (was $30,935 — reduced by $17,000).
  5. ANONYMOUS ROOFING SUB: $2,925 invoice has NO company name. $75/hr rate.
  6. FRAMING LABOR $675: Billed with NO backup invoice in 38-page document.
  7. SEVEN OVER-BUDGET LINES: Demo 101%, Concrete 101%, Framing Mat 167%, Framing Labor 121%, Roofing 115%, plus prior Tile 136%, Spiral Stair 130%.
  8. DOORS & FRAMES: NEW trade — $9,113.04 first billing backed by 7-page Dykes door order.
  9. G703 MATH GAP: Base + CO subtotals = $79,950 but Grand Total = $90,418. $10,468 unexplained.`,
  arbitratorQA: [
    {
      q: "REQ-09 and REQ-10 both cover the same billing period (10/01/22 to 10/30/22). Why were two separate requisitions submitted for the same month?",
      a: "REQ-09 was submitted first covering the base contract and initial change order work through October. REQ-10 followed to capture a significant batch of newly approved change orders ($82,012 in net CO increases) that were finalized after REQ-09 was prepared. Rather than delay the entire billing or recall REQ-09 for revision, Montana submitted a supplemental requisition. The architect certified both applications, and the combined total accurately reflects the work completed in the October period.",
      status: "answered",
    },
    {
      q: "An anonymous roofing sub invoice for $2,925 has no company name — just hourly rates and hours. How can the owner verify who performed this work?",
      a: "The copper pipe flashing and cricket work was performed by a roofing mechanic brought in by Quatrochi & Sons Roofing, Montana's primary roofing subcontractor. The invoice documents the specific scope (copper pipe flashings, caps, and crickets), labor hours (one man three hours plus three men twelve hours), and the $75/hr rate. The work corresponds to PCO#074 on the G703 and was verified by Montana's on-site supervision. The informal invoice format reflects the nature of specialty roofing sub-trade work.",
      status: "answered",
    },
    {
      q: "Framing Labor bills $675 this period with no backup invoice in 38 pages of documentation. What supports this charge?",
      a: "The $675 in Framing Labor reflects Montana's direct labor for miscellaneous framing tasks during the October period. The labor was tracked internally through cost coding (06-000-6-400-L) and corresponds to work performed by Montana's field crew alongside the extensive subcontractor activity documented in this requisition. Montana acknowledges the backup for this line could have been more thoroughly documented with timecards in this particular requisition.",
      status: "answered",
    },
    {
      q: "The Mason-Lite Firebox Kit cost $15,000. This is a major purchase — was this in the original scope or a change order? There's no corresponding base contract line visible on the G703.",
      a: "The Mason-Lite 49-inch firebox kit was a specialized fireplace component required for the living room fireplace scope. It is coded to 10300S (SC2150-21) which maps to the Specialties trade line on the G703. The fireplace scope was part of the original contract but the specific product selection and pricing were determined during construction based on owner selections. The $15,000 cost reflects the manufacturer's pricing for a high-end prefabricated firebox system shipped directly to the job site.",
      status: "answered",
    },
  ],
};

// ── REQ-11 (Invoice #11) — Application #11, Period 11/01/22-11/30/22 ────────
REQS_INITIAL[10] = {
  ...REQS_INITIAL[10],
  totalBilled: 92651.29,
  paidAmount: 92651.29,
  architectApproved: 92651.29,
  retainageHeld: 0,
  laborCost: 3431.93,
  materialCost: 7313.15,
  subCost: 30609.90,
  backupStatus: "PARTIAL",
  hasPayrollSupport: true,
  hasInvoiceSupport: true,
  flags: ["sub_as_labor", "blended_rate", "overhead_as_material", "co_missing", "rate_anomaly"],
  notes: `REQ-11 — APPLICATION #11 — Period 11/01/22 to 11/30/22
G702: Contract Sum $1,632,483.77 | Total Completed $1,085,033.29 | Retainage $0
Net Change Orders: $449,072.77 (up $87,370 from REQ-10 — third consecutive massive CO expansion)

G703 BASE CONTRACT THIS PERIOD: $51,693.73 (matches Excel exactly)
  Item 2  Containers/Waste Removal      $672.40    — Robert Hiep Inc. #112122B (11/21/22)
  Item 12 Interior Trim                 $19,062.47 — NEW trade first billing. Dykes Lumber ceiling planks $5,311.35,
          pine trim $2,035.20, plus $9,825 carpentry progress payment (no labor/material breakdown)
  Item 15 Siding                        $3,431.93  — Employee labor (Sandoval, Laubauskas timecards) + PVC trim materials
  Item 21 Drywall                       $75.68     — Small material purchase
  Item 25 Painting                      $18,112.50 — Korth & Shannahan Painting Co. (base portion of $49,450 total contract)
  Item 30 OH&P                          $10,338.75 — 25% of $41,354.98 base cost ✓

G703 CHANGE ORDERS THIS PERIOD: $32,766.05
  PCO#046 Guest Bathroom Layout Change   $1,000.00
  PCO#075 Additional Painting           $21,050.00 — Korth & Shannahan CO portion
  PCO#077 LR Fireplace Chimney Framing   $2,305.67
  PCO#078 Misc Carpentry November 2022   $6,858.53
  PCO#079 Additional Drywall Labor       $1,500.00
  PCO#080 Hinges for Millwork Doors         $51.85

G703 GRAND TOTAL THIS PERIOD: $92,651.29
  MATH CHECK: Base $51,693.73 + CO $32,766.05 = $84,459.78
  GAP: $8,191.51 = exactly 25% of CO total ($32,766.05)
  This confirms HIDDEN OH&P MARKUP on change orders not shown as separate G703 line.

VARIANCE: $92,651.29 (G703) - $51,693.73 (Excel) = +$40,957.56 (all CO billing)

BACKUP DOCUMENTATION (38 pages):
  Pages 8-9: TIMECARDS — FIRST REQ WITH ACTUAL TIMECARDS
    Thomas Ficucello — Project Supervision (01-000-1-200-L), 7-9 hrs/day, coded "Billable: Yes"
    Jose Palacios — General Conditions Labor (01-000-1-100-L), 8 hrs, coded "Billable: Yes"
    Vidal Sandoval — Siding (07-000-7-400-L) & Drywall (09-000-9-200-L), 8 hrs
    Michael Laubauskas — Siding (07-000-7-400-L), 8 hrs
    *** AUDIT FLAG: Ficucello supervision + Palacios general conditions = OVERHEAD under §9.3.1 ***
    *** These are coded "Billable: Yes" but should be absorbed in 25% OH&P fee ***
  Page 10: Robert Hiep Inc. #112122B — waste removal $672.40 ✓ matches G703 Item 2
  Page 11: BFS lumber — framing material $249.65, coded 6400M, PCCO#074
  Page 12: H&J Home Improvements #1414 (11/9/22) — "Labor only for fireplace surround on roof" $2,000 lump sum
  Pages 13-16: BFS invoices — builder shims, radiata pine trim, PVC trim (various small materials)
  Pages 17-18: Dykes Lumber — Armstrong Woodhaven ceiling planks $5,311.35 (10/24/22 — October date!),
    pine trim $1,017.60 × 2, delivery charges
  Page 19: Home Depot — X-Board, tape, screws $200.32
  Page 21: Progress Payment #9798 (11/11/22) — "carpentry work at Tharp Bumgardner Residence"
    $9,825.00 Labor & Materials combined — NO BREAKDOWN between labor and materials
  Pages 22-25: Beckerle Lumber — PVC trim, fasteners, small materials
  Page 29: Invoice $165.60 coded 7400M (Siding Material) to PCCO#075 (Painting CO) — MISCODED
  Page 31: CASH purchase — 8x8x12 treated post $152.80 (includes delivery)
  Page 35: Dykes drywall board $215.45 coded 9200M to PCCO#075 (Painting CO) — MISCODED
  Page 38: Korth & Shannahan Painting Co. — MASTER PAINTING INVOICE $49,450.00 total
    Split: $18,112.50 base (SC2150-28) + $21,050 CO (PCCO#072/PCO#075)
    Remaining $10,287.50 = prior period billings or future billing

KEY FINDINGS:
  1. FIRST REQ WITH TIMECARDS: Employee timecards finally included, BUT supervision and general
     conditions labor (Ficucello, Palacios) coded as "Billable" — these are OVERHEAD per §9.3.1.
  2. HIDDEN CO OH&P: $8,191.51 gap = exactly 25% of CO total. Contractor is applying markup to
     change orders but not showing it as a separate G703 line item. Systematic pattern.
  3. MISCODING TO PAINTING CO: Multiple receipts (siding material 7400M, drywall 9200M) coded to
     PCCO#075 "Additional Painting" — inflating the painting CO while understating base trade lines.
  4. CARPENTRY PROGRESS PAYMENT: $9,825 with NO labor/material breakdown. Violates §15.3.2
     documentation requirements for cost-plus billing.
  5. CO EXPANSION CONTINUES: Net COs now $449,073 — up $87,370 from REQ-10. Third consecutive
     REQ with massive CO growth ($57K → $82K → $87K).
  6. TILE OVER-BUDGET: Item 22 Tile Installation at 136.36% — $9,400 over scheduled value with
     no change order to cover the overage.
  7. OCTOBER-DATED RECEIPTS: Several material purchases dated October 2022 billed in November REQ.`,
  arbitratorQA: [
    {
      q: "Timecards show Thomas Ficucello (supervision) and Jose Palacios (general conditions labor) coded as 'Billable: Yes.' Isn't project supervision and general conditions labor contractor overhead under §9.3.1?",
      a: "Ficucello's supervision time was project-specific, hands-on field management — not general corporate overhead. On a cost-plus renovation of this complexity (125+ change orders, 20+ subcontractors), dedicated on-site supervision is a direct project cost. Palacios performed general conditions labor (site cleanup, material handling, protection of finished work) that directly serves the project. The AIA A110 contract's Cost of the Work includes wages of construction workers at the site. The 25% OH&P covers Montana's home office overhead, insurance, and profit — not field supervision.",
      status: "answered",
    },
    {
      q: "The G703 Grand Total exceeds Base + CO subtotals by exactly 25% of the CO total ($8,191.51). Is Montana applying a hidden OH&P markup on change orders?",
      a: "The 25% OH&P applies to all Cost of the Work under the contract, including change order work. The G703 format has a single OH&P line (Item 30) that captures the markup on the period's total cost. The mathematical relationship between the CO subtotal and the gap reflects the consistent application of the contractual markup rate. This is not 'hidden' — it is the standard application of the agreed-upon OH&P percentage to all reimbursable costs as provided in the contract.",
      status: "answered",
    },
    {
      q: "The carpentry progress payment (#9798) for $9,825 has no breakdown between labor and materials. How does this satisfy the cost-plus documentation requirements of §15.3.2?",
      a: "Progress payment #9798 reflects an interim payment to a carpentry subcontractor for combined labor and materials on interior trim work. Subcontractor invoices in cost-plus contracts are documented at the subcontract level — the sub's lump-sum or unit-price invoice is the backup. Montana's obligation is to provide the sub's invoice showing scope, amount, and project reference. The labor/material split within a sub's invoice is the sub's internal pricing, not a §15.3.2 requirement for the GC's requisition.",
      status: "answered",
    },
    {
      q: "Multiple receipts for siding material and drywall are coded to PCO#075 'Additional Painting' — a painting change order. Why are non-painting materials billed under a painting CO?",
      a: "The cost code allocation reflects the integrated nature of the finish work performed by Korth & Shannahan, whose scope expanded beyond painting to include related finish carpentry and surface preparation. Materials like PVC trim (siding) and drywall patches were consumed as part of the painting preparation scope — filling, patching, and priming surfaces before painting. The coding follows the subcontractor's scope rather than the material type. Montana acknowledges this cross-coding could have been cleaner for tracking purposes.",
      status: "answered",
    },
  ],
};

// ── REQ-12 (Invoice #12) — Application #12, Period 12/01/22-12/31/22 ────────
REQS_INITIAL[11] = {
  ...REQS_INITIAL[11],
  totalBilled: 71831.85,
  paidAmount: 71831.85,
  architectApproved: 71831.85,
  retainageHeld: 0,
  laborCost: 0,
  materialCost: 4655.67,
  subCost: 34780.00,
  backupStatus: "PARTIAL",
  hasInvoiceSupport: true,
  flags: ["sub_as_labor", "blended_rate", "missing_invoice", "co_missing", "rate_anomaly"],
  notes: `REQ-12 — APPLICATION #12 — Period 12/01/22 to 12/31/22
G702: Contract Sum $1,660,408.23 | Total Completed $1,156,865.14 | Retainage $0
Net Change Orders: $476,997.23 (up $27,924 from REQ-11 — smallest CO increase in months)

G703 BASE CONTRACT THIS PERIOD: $49,294.58 (matches Excel within $0.01)
  Item 12 Interior Trim                 $4,639.64  — Beckerle lumber $7,190.53, BFS materials, HD supplies
  Item 17 Gutters & Leaders            $10,200.00  — NEW trade first billing. AJ Reliable (7700S base SC2150-32)
  Item 18 Doors & Frames                  $16.02   — HD hinge $16.03 (Ficucello 12/08/22)
  Items 21-29 (various trades)         $24,580.00   — Includes drywall, painting, and other trades
  Item 25 Painting                     $24,580.00   — Korth & Shannahan Painting Co. (9900S, SC2150-27)
  Item 30 OH&P                          $9,858.92  — 25% of $39,435.67 base cost ✓

G703 CHANGE ORDERS THIS PERIOD: $18,029.81
  PCO#072 West Side Leader Drainage     $6,250.00  — Sub invoice coded 31000S / PCCO#069 (CO# discrepancy with G703)
  PCO#082 Gym Cedar Material #1         $3,174.48
  PCO#083 Cow Barn Mech Room Door Slab    $247.98  — Boards & Beams estimate (NOT invoice)
  PCO#084 Dining Room Stairs Revised       $440.80 — BFS cement board $153.36 coded 9200M
  PCO#085 Additional Gutter Work           $200.00 — AJ Reliable addon (coding correction: "PCCO #82 not 85")
  PCO#086 Primary BR Decorative Beams   $5,933.53  — Boards & Beams LLC ESTIMATES used as backup
  PCO#087 Fireplace Enclosure Cement Bd    $208.02
  PCO#088 Misc Carpentry December 2022  $1,575.00

G703 GRAND TOTAL THIS PERIOD: $71,831.85
  MATH CHECK: Base $49,294.58 + CO $18,029.81 = $67,324.39
  GAP: $4,507.46 = exactly 25% of CO total ($18,029.81)
  THIRD CONSECUTIVE REQ with hidden CO OH&P — systematic pattern now fully confirmed.

VARIANCE: $71,831.85 (G703) - $49,294.59 (Excel) = +$22,537.26 (all CO billing)

BACKUP DOCUMENTATION (34 pages):
  Pages 8-9: Beckerle Lumber — $7,190.53 material order. One receipt dated 1/4/2023 (AFTER Dec period).
    Signed by FALSETTI, ANTHONY — new employee name not seen in prior REQs.
  Page 11: BFS small materials $213.61
  Pages 13-18: Boards & Beams, LLC — MULTIPLE PAGES OF ESTIMATES (not invoices!)
    Estimate #E2022-25800, E2022-25801. Documents labeled "Estimate" with disclaimer
    "prices may change over time." Using estimates as backup violates §15.3.2 requirement
    for "receipted invoices" in cost-plus documentation.
  Page 21: Beckerle Lumber — $7,190.53 (subtotal $6,634.86 + tax $555.67)
  Pages 22-25: Home Depot — X-Board floor protection $163.47 (11/30/22 — prior period date),
    hinge $16.03 (12/08/22), both purchased by Ficucello Thomas
  Page 27: AJ Reliable — gutters & leaders $10,400 total ($10,200 base + $200 CO)
    Handwritten correction: "PCCO #82 not 85" — coding correction on CO reference
  Page 33: Korth & Shannahan Painting — $24,580.00 (9900S, SC2150-27)
  Page 34: Drainage sub — $6,250.00 (31000S, SC2150-31 / PCCO#069)

KEY FINDINGS:
  1. ESTIMATES AS INVOICES: Boards & Beams LLC submitted ESTIMATES (not invoices) as backup for
     decorative beam charges totaling $5,933.53+. Documents explicitly labeled "Estimate" with
     price-change disclaimer. Violates §15.3.2 documentation requirements.
  2. HIDDEN CO OH&P CONFIRMED: $4,507.46 gap = exactly 25% of CO total. THIRD consecutive REQ
     with this pattern. Cumulative hidden CO OH&P: REQ-10 ($10,468) + REQ-11 ($8,191.51) + REQ-12 ($4,507.46).
  3. POST-PERIOD RECEIPT: Beckerle Lumber receipt dated 1/4/2023 included in December 2022 billing.
  4. CO NUMBER DISCREPANCY: Drainage sub backup coded PCCO#069 but G703 lists as PCO#072.
     AJ Reliable gutter CO coded PCCO#085 with handwritten correction to #082.
  5. NO TIMECARDS: Unlike REQ-11 which had timecards, REQ-12 has NO employee timecards.
  6. PRIOR-PERIOD RECEIPT: HD floor protection dated 11/30/22 billed in December REQ.
  7. KORTH PAINTING CONTINUES: $24,580 base billing. Combined with REQ-11 ($18,112.50 base +
     $21,050 CO), Korth total now $63,742.50 of $49,450 contract — OVER-BILLED by $14,292.50.`,
  arbitratorQA: [
    {
      q: "Boards & Beams LLC submitted estimates — not invoices — as backup documentation for decorative beam charges. Estimates explicitly state 'prices may change over time.' How can billing be based on estimates rather than actual invoices?",
      a: "The Boards & Beams estimates were submitted as the best available documentation at the time of requisition preparation. The estimates represented firm pricing commitments from the vendor for custom millwork that was ordered and in fabrication. In the custom residential renovation market, specialty millwork vendors frequently provide detailed estimates that serve as the purchase commitment, with final invoicing upon delivery. The amounts billed matched the committed pricing. Montana should have obtained final invoices before billing but the underlying costs were accurately represented.",
      status: "answered",
    },
    {
      q: "The hidden CO OH&P pattern continues for a third consecutive requisition — $4,507.46 gap equals exactly 25% of the CO total. How do you explain this systematic pattern?",
      a: "As explained for REQ-11, the 25% OH&P is contractually applied to all Cost of the Work, including change order work. The G703 format captures OH&P on a single line item (Item 30) that encompasses both base contract and change order costs for the period. The consistent 25% relationship across multiple requisitions demonstrates systematic and correct application of the contractual markup rate — not a hidden charge. The architect reviewed and certified each application including the OH&P calculation.",
      status: "answered",
    },
    {
      q: "A Beckerle Lumber receipt dated January 4, 2023 is included in the December 2022 billing period. Similarly, a Home Depot receipt from November 30, 2022 appears. Why are out-of-period charges included?",
      a: "The January 4th Beckerle receipt represents materials ordered and committed in December but with a January pickup date — the purchase obligation was incurred in the billing period. The November 30th Home Depot receipt falls at the boundary of the prior period and represents work protection materials (X-Board floor protection) installed during the December period. Minor date boundary overlaps are common in monthly AIA billing cycles and reflect the practical reality that construction purchases don't align perfectly with calendar-month billing periods.",
      status: "answered",
    },
    {
      q: "The drainage sub invoice is coded to PCCO#069 but the G703 lists it under PCO#072. The AJ Reliable gutter CO has a handwritten correction changing #085 to #082. Are Montana's change order numbers reliable?",
      a: "The CO numbering discrepancies reflect the administrative challenge of tracking 125+ change orders on an evolving project. Montana's internal PCO numbering system (PCCO prefix) and the G703 PCO numbers were maintained separately and occasionally diverged. The handwritten correction on AJ Reliable's coding shows Montana's field team actively caught and corrected errors. The dollar amounts, scope descriptions, and subcontractor invoices are consistent regardless of the CO reference number used. Montana acknowledges the numbering should have been reconciled more systematically.",
      status: "answered",
    },
  ],
};

// ── REQ-13R1 (Invoice #13R1) — Application #13 R1 (REVISED), Period 01/01/23-03/23/23 ──
REQS_INITIAL[12] = {
  ...REQS_INITIAL[12],
  totalBilled: 184238.97,
  paidAmount: 184238.97,
  architectApproved: 184238.97,
  retainageHeld: 0,
  laborCost: 0,
  materialCost: 4782.53,
  subCost: 67610.18,
  backupStatus: "PARTIAL",
  hasInvoiceSupport: true,
  flags: ["sub_as_labor", "blended_rate", "missing_invoice", "co_missing", "duplicate", "rate_anomaly", "markup_on_markup"],
  notes: `REQ-13R1 — APPLICATION #13 R1 (REVISED) — Period 01/01/23 to 03/23/23 (nearly 3 months)
G702: Contract Sum $1,734,690.49 | Total Completed $1,341,104.11 | Retainage $0
Net Change Orders: $551,279.49 (up $74,282 from REQ-12 — massive CO increase)
Excel This Period: -$90,489.90 (NEGATIVE — credit/reversal requisition)
G703 Grand Total This Period: $184,238.97 (net positive)
VARIANCE: $184,238.97 - (-$90,489.90) = +$274,728.87 (LARGEST variance of all REQs)

THIS IS A REVISED REQUISITION (R1) — corrects/replaces original REQ-13. The massive
discrepancy between Excel's negative figure and G703's positive Grand Total indicates
the Excel tracks ONLY the base contract credits while G703 captures both credits AND
new CO billing in the same period.

BASE CONTRACT CREDITS (REVERSALS) — This Period:
  Item 3  Concrete:        ($24.11)
  Item 6  Masonry:         ($9,902.87)
  Item 7  Balcony Railing: ($2,737.85)
  Item 20 Windows:         ($825.00)
  Item 21 Drywall:         ($7,992.49)
  Item 22 Tile:            ($12,100.00)
  Item 23 Wood Flooring:   ($7,325.22)
  Item 25 Painting:        at 103.22% — OVER BUDGET (exceeded $49,450 contract)
  Item 27 Electric:        ($41,823.63) — MASSIVE single-line credit
  Item 28 HVAC:            ($8,545.13)
  Item 29 Excavation:      ($1,200.00)
  Base Credits Total:      ~($92,476.30)

CREDIT CHANGE ORDERS (Base Sub Credits — restructuring):
  PCO#009 HVAC Base Sub Credit:        ($11,725.00) SV
  PCO#010 Plumbing Base Sub Credit:    ($4,550.00)
  PCO#011 Electrical Base Sub Credit:  ($16,270.00)
  PCO#013 Lighting Fixture Credit:     ($14,500.00)
  PCO#017 Demolition Budget Credit:    ($8,024.00)
  PCO#026 Excavation Base Credit:      ($5,208.63)
  PCO#027 Window Install Base Credit:  ($4,218.75)

  PATTERN: Systematic BASE-TO-CO CONVERSION — base contract amounts reduced via credits
  while NEW change orders created for the same/similar work. This potentially generates
  additional 25% OH&P markup on work originally in the base contract scope.

SIGNIFICANT POSITIVE CO BILLING THIS PERIOD:
  PCO#007  Low Voltage Wiring:            $25,572.81
  PCO#014  Electrical Service Relocation: $11,875.00
  PCO#022  Brick Finish Removal:          $5,158.13
  PCO#025  Insulation Scope Changes:      $32,205.36 (115.12% — OVER BUDGET)
  PCO#029  Additional Drywall Material:   $1,490.76
  PCO#031  Generator Pad:                 $680.10
  PCO#046  Guest Bathroom:                $4,582.44
  PCO#047  Additional Framing Sub Labor:  $4,031.25
  PCO#048  Additional Siding Material:    $9,709.05
  PCO#050  Front Porch Ceiling:           $773.48
  PCO#064  Primary BR Balcony:            $11,460.60
  PCO#066  October Minor Repairs:         $281.25
  PCO#081  Fireplace Stone Veneer:        $10,574.69
  PCO#097  Interior Door Hardware:        $2,990.35
  PCO#098  Additional Stone Material:     $1,215.63
  PCO#099  Brick Finish Removal Addtl:    $2,965.63
  PCO#100  Temporary Air Conditioning:    $5,221.79
  PCO#101  Balcony Decking Material:      $2,196.23
  PCO#103  LR Fireplace Stone Labor:      $14,625.00 (65% complete)
  PCO#107  Fireplace Stone Samples:       $560.16

BACKUP DOCUMENTATION (56 pages — pages 10-66):
  Pages 11-12: Beckerle Lumber $26.82 brad nails + $54.56 misc, buyer Ficucello Tommy
  Pages 14,17: Dykes Lumber — SAME invoice #2302-079368 appears TWICE (pages 14 & 17)
    POTENTIAL DUPLICATE BILLING — same invoice number on two separate backup pages
  Page 20: HD receipt 01/13/23 — Diablo saw blades $119.91, Falsetti Anthony
  Page 23: Korth & Shannahan Painting $26,200 ($8,575 base SC2150-26 + $17,625 CO PCCO#073)
    Korth cumulative now ~$89,942.50 against $49,450 contract — OVER-BILLED by $40,492.50
  Page 23: Eastern Contractor Services — invoice dated 7/12/2022 — SIX MONTHS before billing
    period. Blatant out-of-period charge violating period-based billing requirements.
  Pages 26-28: A Touch of Glass — $6,650 shower enclosure invoice BUT coding allocations
    total $14,775 across multiple cost codes — exceeds invoice by $8,125 (POTENTIAL OVERBILLING).
    Also: ESTIMATE #17965 ($6,850 Guest Bath) labeled "Estimate" with 30-day validity —
    §15.3.2 violation, same pattern as Boards & Beams in REQ-12.
  Page 29: Online order $466.86 coded 9200M (Drywall), international courier
  Page 31: DeLeonardis Electric $8,829.62 for "REQ.5". Original contract $51,835 + CO#001
    $21,535 + CO#002 $9,500 = $82,870 total sub contract.
  Pages 34-35: C&F Steel Design $4,771.95 current / $10,368.48 total ornamental balcony
    with ($1,200) painting backcharge = $9,168.48 net. Coded 5100S/PCCO#061
  Pages 37-38: Dykes Lumber (Closter NJ) cedar & pine 1/11/23, plus small $265 invoice
  Pages 44-47: Build.com Order #84479949 — Baldwin door hardware $2,392.28 (PCCO#094)
  Page 49: Nyack Lumber — handwritten receipt, Alex DuFek (new vendor, informal receipt)
  Pages 53-54: Beckerle misc + Glen Rock Stair Corp invoice #59548 (new vendor)
  Page 63: HD Pro Xtra 2023 spend report through 03/01: $15,748.78 cumulative
  Page 65: Masonry Depot #560239/3 — natural thin stone (Ashlar) $413.50, 4100M/PCCO#104

KEY FINDINGS:
  1. BASE-TO-CO CONVERSION PATTERN: Systematic reduction of base contract values via
     credits while creating new COs for equivalent work. Base credits ~$92K while CO
     billing far exceeds, potentially generating additional 25% OH&P on restructured work.
  2. GLASS COMPANY OVERBILLING: A Touch of Glass invoice $6,650 but cost code allocations
     total $14,775 — $8,125 excess allocation across multiple cost codes.
  3. ESTIMATES AS INVOICES (AGAIN): A Touch of Glass submitted Estimate #17965 ($6,850)
     as backup. Same §15.3.2 violation pattern found in REQ-12 (Boards & Beams).
  4. POTENTIAL DUPLICATE INVOICE: Dykes Lumber invoice #2302-079368 appears on BOTH
     page 14 and page 17 of backup documentation.
  5. EXTREME OUT-OF-PERIOD: Eastern Contractor Services invoice dated 7/12/2022 billed
     in Jan-March 2023 period — 6+ months out of period.
  6. KORTH PAINTING CRITICAL: $26,200 this period brings Korth cumulative to ~$89,942.50
     against $49,450 contract — OVER-BILLED by $40,492.50 (182% of contract value).
  7. NO TIMECARDS: Zero employee timecards in 56 pages of backup for 3-month period.
  8. 66-PAGE REQUISITION: Largest document in the series — 3-month billing period unusual
     for monthly AIA process. Possible catch-up billing or delayed submission.`,
  arbitratorQA: [
    {
      q: "REQ-13R1 shows systematic base contract credits (~$92,476) while simultaneously billing large amounts through new change orders. Is Montana converting base contract scope to change orders to generate additional OH&P markup?",
      a: "The base-to-CO restructuring in REQ-13R1 reflects legitimate scope realignment, not markup manipulation. As the project evolved through 125+ owner-directed changes, the original schedule of values no longer accurately reflected the actual work scope. Subcontractor contracts were restructured (HVAC, Plumbing, Electrical credits reflect sub replacements or scope changes), and new COs were created to capture the actual scope being performed. The 25% OH&P applies equally to base contract and CO work under the contract — there is no financial incentive to shift between categories. The restructuring provides more accurate cost tracking.",
      status: "answered",
    },
    {
      q: "A Touch of Glass submitted a $6,650 invoice, but the cost code allocations total $14,775 — over double the invoice amount. How is $8,125 more than the invoice being billed to the owner?",
      a: "A Touch of Glass's work scope encompassed multiple cost codes across the project. The $6,650 invoice covered one phase of shower enclosure work. The broader cost code allocations reflect A Touch of Glass's total contracted scope across multiple areas (master bath, guest bath, and other wet areas) with separate invoices and estimates. The total allocation tracks the full subcontract commitment, not just the single invoice in this requisition's backup. The remaining amounts correspond to work documented in prior or subsequent requisitions.",
      status: "answered",
    },
    {
      q: "Eastern Contractor Services invoice is dated July 12, 2022 — six months before this January-March 2023 billing period. Why is a 6-month-old invoice just now appearing in the requisition?",
      a: "The Eastern Contractor Services invoice was received late from the subcontractor and processed in the first available requisition. In construction billing, subcontractor invoices sometimes arrive well after work completion due to the sub's own billing cycles, disputes, or administrative delays. Montana's obligation is to bill the owner when costs are incurred and documented — not to artificially withhold legitimate costs because the sub's invoice arrived late. The work was performed and the cost was real regardless of the invoice date.",
      status: "answered",
    },
    {
      q: "Dykes Lumber invoice #2302-079368 appears on both page 14 and page 17 of the backup. Is this a duplicate billing?",
      a: "The same invoice number appearing on two pages reflects the backup documentation assembly process — the invoice was included twice in the physical document compilation, not billed twice. The G703 line item amount for the corresponding trade matches a single billing of the invoice amount. Montana's billing is driven by the G703 schedule of values totals, not by counting backup pages. The duplicate page is an administrative redundancy in document preparation, not double-billing.",
      status: "answered",
    },
  ],
};

// ── REQ-14 (Invoice #14) — Application #14, Period 04/01/23-04/30/23 ────────
REQS_INITIAL[13] = {
  ...REQS_INITIAL[13],
  totalBilled: 256313.93,
  paidAmount: 0,
  architectApproved: 256313.93,
  retainageHeld: 0,
  laborCost: 0,
  materialCost: 3856.42,
  subCost: 108213.35,
  backupStatus: "PARTIAL",
  hasInvoiceSupport: true,
  flags: ["sub_as_labor", "blended_rate", "missing_invoice", "co_missing", "duplicate", "rate_anomaly", "markup_on_markup"],
  notes: `REQ-14 — APPLICATION #14 — Period 04/01/23 to 04/30/23
G702: Contract Sum $1,819,824.47 | Total Completed $1,597,418.04 | Retainage $0
Net Change Orders: $636,413.47 (up $85,134 from REQ-13R1 — largest CO jump)
70 pages — second-largest document in the series.

G703 GRAND TOTAL THIS PERIOD: $256,313.93
EXCEL TP: $140,087.21
VARIANCE: $256,313.93 - $140,087.21 = +$116,226.72

SIGNIFICANT BASE CONTRACT THIS PERIOD:
  Item 6  Masonry:        $75.00
  Item 21 Drywall:        $11,159.69
  Item 23 Wood Flooring:  $20,225.22 (now 100.00% — fully billed)
  Item 25 Painting:       ($1,997.50) — CREDIT this period
  Item 28 HVAC:           $72,615.00 (108.98% — OVER BUDGET by $9,547.30)
  HVAC is the dominant base line item — single trade at $72K+ in one month.

OVER-BUDGET G703 LINES:
  Item 1  Demolition:     100.71%
  Item 3  Concrete:       101.39%
  Item 28 HVAC:           108.98% ($9,547 over)
  PCO#025 Insulation:     118.90% ($4,230 over)

NEW CHANGE ORDERS FIRST APPEARING IN REQ-14 (many billing 100% immediately):
  PCO#113 Diffuser Upgrade:                 $1,221.65 (100%)
  PCO#114 Basement Handrail & Wall Sealing: $97.32 (24.49%)
  PCO#115 Fireplace Door:                   $1,874.34 (100%)
  PCO#116 Sewer Line Snaking & Camera:      $1,850.00 (100%)
  PCO#117 Additional Wood Floor Finishing:   $3,814.79 (100%)
  PCO#118 Returned Flooring Credit:         ($650.25) — CREDIT
  PCO#119 Chimney Exterior Brick Veneer:    $1,079.42 (100%)
  PCO#120 Decking Labor + Addtl Material:   $1,900.29 (100%)
  PCO#121 Addtl & Returned Door Hardware:   $1,166.56 (96.31%)
  PATTERN: 7 of 9 new COs billing at 100% on first appearance.

BACKUP DOCUMENTATION (60 pages — pages 11-70):
  Pages 11-12: Dykes Lumber $1,325.64 cedar + RETURN receipt ($1,183.20 credit, replaced
    with cheaper $298.80 Red Cedar grade). Net credit not clearly reflected.
  Pages 13-14: Glen Rock Stair Corp #58852 — dated 10/4/2022 — SIX MONTHS before April
    2023 billing period. Total $6,375 (6500S, SC2150-28 $5,655 + CCO 001 $720).
  Pages 26-27: Glen Rock Stair Corp #59548 — dated 2/8/2023 — SAME invoice # appeared
    in REQ-13 backup. POTENTIAL DUPLICATE BILLING across two requisitions.
  Page 27: HD receipt $97.19 painting supplies, Falsetti Anthony, 04/21/23
  Pages 29-30: Carpet World + HVAC Services invoice #i1869 — $17,000 for Radiant Heating
    at Living Room & Cow Barn. CRITICAL: Invoice states "Payment was previously rejected
    by Montana Contracting due to disagreements with client. Montana agreed to release
    this payment in exchange for sending crews to complete work." Transaction date 5/2/2023
    — POST-PERIOD (after April 30 billing end). Disputed payment included in billing.
  Page 31: HVAC invoice #i1... — $15,850 (relocate boiler $8,400 + A/C $5,200 + air
    handlers $2,250). Balance due $8,400 after $7,450 prior payments. Coded 23000S/PCCO#003.
  Pages 33-34: C&F Steel Design #1738 — $4,771.95 ornamental balcony (5100S/PCCO#061).
    Uses ESTIMATE format with completion percentages.
  Pages 36-70: KORTH & SHANNAHAN Painting — MASSIVE 6-page Invoice #9922 (2/27/2023):
    CRITICAL FINDINGS:
    a) CARPENTRY BILLED AS PAINTING: Majority of line items are CARPENTRY work (door
       modifications, ceiling beams, shelving, window casing, staircase risers) billed
       by a PAINTING subcontractor. Cross-trade billing indicates potential scope confusion
       or cost allocation manipulation.
    b) RECONCILIATION INVOICE: Credits prior invoices #9798 (-$9,825), #9853 (-$24,580),
       #9888 (-$26,200) plus deposit (-$7,527.50). These were billed in REQ-11, 12, 13
       — verify no double-counting of underlying charges.
    c) MULTIPLE INCLUSIONS: Same Invoice #9922 appears to be included 2-3 times in backup.
    d) CODED TO NON-PAINTING TRADE: One section coded PCCO#108 / 2900S (not painting 9900S).
    e) Balance Due: $3,500 after all credits applied.
    f) Subtotal before credits: $26,252.50 across painting + carpentry.
  Page 45: Buildmart LLC (McAllen, Texas) — out-of-state vendor, PAID stamp 03/21/2023.
  Page 51: Mike's Drain Service — handwritten receipt for sewer work (PCO#116).
  Page 59: Build.com — Baldwin door hardware $1,166.56 (PCO#121), 04/19/23.
  Page 61: HD Pro Xtra cumulative spend $27,672.35 (up $12K from REQ-13's $15,749).

KEY FINDINGS:
  1. HVAC PAYMENT DISPUTE: $17,000 HVAC invoice explicitly states payment was "previously
     rejected due to disagreements with client" and released conditionally. Billing disputed
     work to owner requires documentation of resolution. Post-period date (5/2/2023).
  2. HVAC OVER-BUDGET: $72,615 TP brings HVAC to 108.98% of $108,300 scheduled value —
     $9,547 over budget in a single period. Combined with $17K disputed payment.
  3. KORTH CROSS-TRADE BILLING: Painting subcontractor billing primarily for carpentry
     work (doors, beams, shelving, windows, stairs). Challenges cost allocation integrity.
  4. KORTH RECONCILIATION RISK: Invoice #9922 credits $60,605 of prior invoices (9798,
     9853, 9888) while re-billing $26,252.50. Prior invoices were already in REQ-11/12/13.
  5. GLEN ROCK STAIR DUPLICATE: Invoice #59548 appears in both REQ-13 and REQ-14 backup.
  6. GLEN ROCK OUT-OF-PERIOD: Invoice #58852 dated 10/4/2022 billed in April 2023 — 6 months late.
  7. NO TIMECARDS: Zero employee timecards in 60 pages of backup.
  8. MANY NEW COs AT 100%: 7 of 9 new change orders billing at 100% immediately — no
     progress billing, suggesting COs created retroactively after work completed.`,
  arbitratorQA: [
    {
      q: "The HVAC invoice explicitly states payment was 'previously rejected by Montana Contracting due to disagreements with client' and released conditionally. Why is disputed work being billed to the owner?",
      a: "The $17,000 HVAC payment dispute involved the scheduling and sequencing of radiant heating work at the Living Room and Cow Barn, not the quality or legitimacy of the work itself. The disagreement was resolved when the HVAC sub agreed to send crews to complete the remaining work in exchange for releasing the held payment. The work was performed, the building now has functioning radiant heat, and the owner received the benefit. Montana held the payment responsibly until the sub committed to completing the scope — this demonstrates proper contract management, not improper billing.",
      status: "answered",
    },
    {
      q: "Korth & Shannahan is a painting subcontractor, yet Invoice #9922 shows the majority of line items are carpentry work — door modifications, ceiling beams, shelving, staircase risers. Why is a painter billing for carpentry?",
      a: "Korth & Shannahan's scope evolved during the project to include finish carpentry that was integral to their painting scope — installing trim, beams, and casework that they would then paint and finish. This is common in high-end residential renovation where the painting contractor handles the complete 'finish' scope including installation of paintable millwork. Their carpentry line items all relate to finish elements that require painting — not structural carpentry. The combined scope was more efficient than splitting between separate carpentry and painting subs.",
      status: "answered",
    },
    {
      q: "Glen Rock Stair Corp Invoice #59548 appears in both REQ-13 and REQ-14 backup. Is this double-billed?",
      a: "Glen Rock Stair Corp Invoice #59548 was included in REQ-13's backup documentation to establish the subcontract commitment, and in REQ-14's backup to support the billing period's progress. The G703 line item for the stair scope shows incremental billing — not duplicative amounts. The same invoice appearing in multiple requisitions' backup packages is standard practice when a subcontractor's work spans multiple billing periods. The controlling document is the G703 schedule of values, which shows distinct this-period amounts for each requisition.",
      status: "answered",
    },
    {
      q: "Seven of nine new change orders bill at 100% on their first appearance. Doesn't this suggest the COs were created retroactively after work was already completed?",
      a: "Many of these COs represent discrete, completed scopes — a fireplace door installation (PCO#115), sewer line snaking (PCO#116), chimney brick veneer (PCO#119) — that are single-task items naturally completed before formal CO documentation catches up. In cost-plus construction, the work is authorized by the owner on site, performed, and then documented on the next requisition. The 100% billing confirms the work is done — which is efficient and transparent. The alternative (artificial progress billing on completed small-scope items) would add unnecessary administrative complexity without benefiting the owner.",
      status: "answered",
    },
  ],
};

REQS_INITIAL[14] = {
  ...REQS_INITIAL[14],
  totalBilled: 6451.64,
  paidAmount: 0,
  architectApproved: 6451.64,
  retainageHeld: 0,
  laborCost: 0,
  materialCost: 146.31,
  subCost: 5015.00,
  backupStatus: "PARTIAL",
  hasInvoiceSupport: true,
  flags: ["sub_as_labor", "blended_rate", "co_missing", "rate_anomaly"],
  notes: `REQ-15 — APPLICATION #15 — Period 12/01/23 to 12/30/23
G702: Contract Sum $1,729,186.84 | Total Completed $1,603,869.68 | Retainage $0
Net Change Orders: $545,775.84 (DECREASED $90,637.63 from REQ-14 — COs removed/credited)
Application Date: 1/17/2024 (filed in January 2024)
12 pages — smallest requisition in the series. 7-MONTH GAP from REQ-14 (April to December 2023).
G703 GRAND TOTAL THIS PERIOD: $6,451.64
EXCEL TP: $6,451.64
VARIANCE: $0.00 — ONLY REQUISITION WITH ZERO VARIANCE (G703 matches Excel perfectly)

COST BREAKDOWN:
  ABC Supply #26601108: $135.00 + $11.31 tax = $146.31 (aluminum trim — dated 05/16/2022, 19 MONTHS out of period)
  DeLeonardis Electric #2544/2681-T: $5,015.00 of $11,674.72 balance due (dated 7/18/2023, 5 months out of period)
  Total Cost: $5,161.31 | OH&P (25%): $1,290.33 | Grand Total: $6,451.64

G703 NOTABLE:
  CO Totals: $545,775.84 SV vs $604,234.33 completed = 110.71% (collectively OVER BUDGET)
  Over-budget lines: Demolition 100.71%, Concrete 101.39%, HVAC 108.98%, Insulation 115.12%
  New COs added: PCO#122-130 (8 new since REQ-14). CO total DECREASED — unprecedented.
  Balcony Railing TP $7,440 + Electric TP $5,015 = $12,455 gross positive TPs
  Negative TPs on other lines from CO restructuring offset to net $5,161.31 cost + $1,290.33 OH&P

KEY FINDINGS:
  1. MASSIVE UNAPPLIED CREDITS ($135,385+): Seven credit COs at 0% completion — owner never received:
     PCO#010 Plumbing Base Sub Credit ($4,550), PCO#011 Electrical Base Sub Credit ($16,270),
     PCO#013 Lighting Fixture Credit to Owner ($14,500), PCO#026 Excavation Credit ($5,208.63),
     PCO#027 Window Install Credit ($4,218.75), PCO#129 Allowance Reconciliation ($24,248.24),
     PCO#130 GC Owner Variance Split ($66,389.39). These credits are ON the G703 schedule
     but at 0% — Montana acknowledged them but never applied them.
  2. PCO#130 "GC OWNER VARIANCE SPLIT" ($66,389.39): Largest single unapplied credit. Name
     suggests Montana acknowledged a variance/overcharge owed to owner but never credited it.
     This is potentially the most significant single finding in the entire audit.
  3. PCO#129 ALLOWANCE RECONCILIATION ($24,248.24): Allowance credits that should have been
     returned to owner per standard AIA allowance procedures. Never applied.
  4. CO DECREASE ANOMALY: Net COs dropped $90,637 from REQ-14 ($636,413 to $545,776) —
     unprecedented in this project. Credit COs added but mostly not applied.
     PCO#123 Interior Trim Reconciliation ($11,695.31) WAS applied (100%),
     but PCO#129 and PCO#130 (the largest credits) remain at 0%.
  5. PCO#127 ELECTRICAL EXTRAS: $42,400 CO for 9 months of work (07/21/22-04/17/23)
     billed at 100% immediately. No itemized breakdown provided.
  6. ELECTRIC SUB vs G703 DISCREPANCY: DeLeonardis contract is $82,870 ($51,835 base +
     $31,035 in COs). Sub received $71,195 (86%), but G703 base Electric only at 50.93%.
     The $101,775 G703 SV vs $82,870 sub contract = $18,905 discrepancy.
  7. OUT-OF-PERIOD: ABC Supply dated 05/16/2022 (19 months before billing period).
     DeLeonardis dated 7/18/2023 (5 months before billing period).
     BOTH backup invoices are out of period.
  8. THINNEST BACKUP: Only 2 pages of backup for entire requisition. No backup for
     $7,440 Balcony Railing TP shown on G703 line item.
  9. NO TIMECARDS: Zero employee timecards (consistent with all prior REQs).
  10. 7-MONTH GAP: No requisitions from May through November 2023. REQ-15 bills
      only $6,451.64. Combined with $135K in unapplied credits and the CO decrease,
      strongly suggests project relationship deteriorated before termination.`,
  arbitratorQA: [
    {
      q: "Seven credit change orders totaling over $135,385 are scheduled on the G703 at 0% completion — meaning the owner has never received these credits. Why hasn't Montana applied these acknowledged credits?",
      a: "The credit COs at 0% reflect credits that were being held pending final reconciliation of the affected trade scopes. PCO#129 (Allowance Reconciliation $24,248.24) and PCO#130 (GC Owner Variance Split $66,389.39) were placed on the schedule as Montana prepared for project closeout — they represent Montana's good-faith acknowledgment that credits are owed. Under normal project completion, these credits would be applied on the final requisition as part of closeout reconciliation. The project relationship deteriorated before the closeout process could be completed, but the credits remain on the schedule and Montana does not dispute they are owed.",
      status: "answered",
    },
    {
      q: "PCO#130 is labeled 'GC Owner Variance Split' for $66,389.39. What variance is this referring to, and why was it never applied?",
      a: "PCO#130 represents Montana's acknowledgment of cost variances across multiple trade lines where actual costs differed from scheduled values. Montana calculated the owner's share of these variances and placed the credit on the G703 schedule for application during project closeout. The credit was not applied because the owner terminated the relationship before the final reconciliation billing could be processed. Montana has consistently acknowledged this credit and included it on the schedule of values in both REQ-15 and REQ-16.",
      status: "answered",
    },
    {
      q: "Both backup invoices are significantly out of period — ABC Supply dated May 2022 (19 months old) and DeLeonardis dated July 2023 (5 months old). How can a requisition be comprised entirely of out-of-period charges?",
      a: "REQ-15 represents catch-up billing for previously incurred but unbilled costs. The 7-month gap between REQ-14 (April 2023) and REQ-15 (December 2023) reflects the deteriorating project relationship during which normal monthly billing was suspended. When billing resumed, Montana included outstanding unbilled costs regardless of original invoice date. The ABC Supply aluminum trim was a small item ($146.31) that was missed in earlier requisitions. The DeLeonardis payment represents a partial payment on their outstanding balance that was released during the gap period. Both costs are real and documented.",
      status: "answered",
    },
    {
      q: "There was a 7-month gap between REQ-14 and REQ-15 with only $6,451.64 billed. What happened during May through November 2023?",
      a: "The 7-month billing gap reflects the deterioration of the project relationship between Montana and the owner. During this period, disputes over costs, change orders, and project scope made normal monthly billing impractical. Montana continued to perform limited work and manage subcontractor relationships but was unable to submit requisitions through the normal process. The small REQ-15 amount and the placement of $135,385 in credit COs on the schedule demonstrate Montana's effort to reconcile the project accounts before the relationship fully terminated.",
      status: "answered",
    },
  ],
};

REQS_INITIAL[15] = {
  ...REQS_INITIAL[15],
  totalBilled: 235461.28,
  paidAmount: 0,
  architectApproved: 235461.28,
  retainageHeld: 0,
  laborCost: 0,
  materialCost: 47236.35,
  subCost: 141136.63,
  backupStatus: "PARTIAL",
  hasInvoiceSupport: true,
  flags: ["sub_as_labor", "markup_on_markup", "co_missing", "rate_anomaly", "no_timesheet"],
  notes: `REQ-16 — APPLICATION #16 — Period 01/01/24 to 01/30/24
G702: Original Contract $1,183,411.00 | Net COs $602,758.41 | Contract Sum $1,786,169.41
Total Completed to Date: $1,839,330.96 | Retainage $0 | Previous Certificates: $1,603,869.68
CURRENT PAYMENT DUE: $235,461.28 | Balance to Finish: -$53,161.55
Architect Certified: $235,461.28

G703 GRAND TOTAL THIS PERIOD: $235,461.28
Contract lines TP: $252,880.48 | CO lines TP: -$17,419.20 | Net: $235,461.28

MAJOR LINE ITEMS THIS PERIOD:
  Electric: $49,940.00 (billed $101,775 / $101,775 SV = 100%)
  Custom Casework: $41,793.75 (billed $97,125 / $62,500 SV = 155.40% — OVER BUDGET)
  OH&P (25%): $27,487.80
  Doors & Frames: $22,622.47 (billed $25,275 / $25,275 SV = 100%)
  Masonry: $20,382.13 (billed $67,000 / $45,000 SV = 148.89% — OVER BUDGET)
  Shower Enclosures: $20,000.00 (100% billed this period, new line)
  Insulation: $15,819.92 (billed $30,000 / $15,000 SV = 200.00% — MASSIVELY OVER BUDGET)
  Plumbing: $15,450.00 (billed $95,850 / $95,850 SV = 100%)
  Excavation: $8,192.50 (billed $28,000 / $28,000 SV = 100%)
  Sawcutting: $8,000.00 (100% billed this period, new line)
  Window Install: $6,675.00
  Drywall: $5,125.35
  Balcony Railing: $4,943.66
  Tile: $2,700.00
  Flooring: $1,950.00
  Cooling: -$3,102.70 (credit)

OVER-BUDGET G703 LINES (cumulative):
  Framing Material: 165.19% ($69,281 vs $41,945 SV) — over by $27,336
  Custom Casework: 155.40% ($97,125 vs $62,500 SV) — over by $34,625
  Spiral Stair: 122.59% ($24,559 vs $20,033 SV) — over by $4,526
  Insulation: 200.00% ($30,000 vs $15,000 SV) — over by $15,000
  Siding: 118.11% ($65,999 vs $55,878 SV) — over by $10,121
  Roofing: 115.60% ($53,178 vs $46,000 SV) — over by $7,178
  Interior Trim: 113.14% ($36,543 vs $32,300 SV) — over by $4,243
  Framing Labor: 114.28% ($44,483 vs $38,925 SV) — over by $5,558
  Concrete: 101.39% ($27,424 vs $27,043 SV) — over by $381
  HVAC: 108.98% ($73,815 vs $67,736 SV) — over by $6,079

CHANGE ORDER STATUS:
  131 PCOs on schedule ($602,758.41 total)
  COs increased from $545,776 (REQ-15) to $602,758 — added $56,983 in new COs
  CO completion: $586,815.13 of $602,758.41 = 97.36%
  $135,385 in unapplied credit COs STILL at 0% (carried from REQ-15)

KEY FINDINGS:
  1. LARGEST SINGLE REQUISITION: $235,461 exceeds REQ-08 ($192,165) as the biggest bill.
  2. PROJECT OVER-BILLED: Total completed $1,839,331 vs contract sum $1,786,169 = 102.97% ($53,162 over).
  3. INSULATION AT 200%: Billed $30,000 on a $15,000 line item — double the budgeted amount.
  4. CUSTOM CASEWORK AT 155%: $34,625 over budget with no CO to cover the overage.
  5. FRAMING MATERIAL AT 165%: $27,336 over budget — largest dollar overbilling.
  6. UNAPPLIED CREDITS PERSIST: Same $135,385 in credit COs at 0% from REQ-15 remain unapplied.
  7. NEW CO ADDITIONS: $56,983 in new COs added (net) since REQ-15 but credits still not applied.
  8. NO TIMECARDS: Zero employee timecards (consistent with all prior REQs).
  9. OH&P: $27,487.80 charged this period. Applied to all lines including over-budget ones.
  10. NEGATIVE BALANCE: Project at -$53,162 balance. MC billed beyond contract + COs.`,
  arbitratorQA: [
    {
      q: "The project is now billed $53,162 beyond the total contract sum ($1,839,331 completed vs $1,786,169 contract). How does Montana justify billing more than the contract amount?",
      a: "Under AIA A110, the Cost of the Work is reimbursed based on actual documented costs plus the agreed OH&P — the contract sum is an estimate, not a cap. The $1,786,169 revised contract sum includes 131 change orders totaling $602,758 in owner-directed scope additions. The $53,162 overage relative to the revised contract sum reflects actual costs that exceeded the scheduled values in several trade lines. Furthermore, $135,385 in credit COs remain unapplied at 0% — if applied, they would reduce the total completed amount. Montana's position is that the actual Cost of the Work, properly documented, is the billing basis.",
      status: "answered",
    },
    {
      q: "Insulation is billed at 200% of the scheduled value — $30,000 against a $15,000 line item. How does insulation cost double the estimate?",
      a: "The insulation scope expanded dramatically due to the renovation's structural changes — new wall cavities, reframed sections, upgraded insulation requirements, and additional areas not in the original scope. The $15,000 scheduled value was based on the initial renovation scope. As 125+ change orders modified the building envelope — new framing, relocated walls, expanded bathroom layouts, fireplace modifications — each change required additional insulation work. PCO#025 (Insulation Scope Changes at $32,205.36) captures much of this additional scope. The actual insulation costs are documented through material invoices and subcontractor billing.",
      status: "answered",
    },
    {
      q: "Custom Casework is at 155.40% ($97,125 vs $62,500 scheduled). The $135,385 in unapplied credits from REQ-15 still show at 0%. Why weren't these credits applied in this final requisition?",
      a: "REQ-16 was prepared as Montana's final billing for remaining unreimbursed costs. The credit COs at 0% were maintained on the schedule as Montana's acknowledged obligations to be reconciled in the project closeout process. Montana's position is that the credits should be applied as part of the overall project reconciliation — which is the proceeding this arbitration represents. Montana does not dispute that credits are owed; the dispute is over the total accounting including Montana's remaining unreimbursed costs, the owner's unpaid balances on REQ-14 through REQ-16, and the mutual credits and adjustments needed for final settlement.",
      status: "answered",
    },
    {
      q: "REQ-16 bills $235,461 — the largest single requisition — yet the owner has paid $0 on REQ-14, REQ-15, and REQ-16. What is the total amount the owner has not paid?",
      a: "The owner ceased payments after REQ-13R1. The unpaid requisitions total: REQ-14 ($256,313.93) + REQ-15 ($6,451.64) + REQ-16 ($235,461.28) = $498,226.85 in certified but unpaid requisitions. The architect certified all three applications, confirming the work was performed and the amounts were appropriate. Montana continued to perform work, manage subcontractors, and incur costs in good faith despite non-payment. The owner's refusal to pay certified requisitions is the basis of Montana's claim in this arbitration.",
      status: "answered",
    },
  ],
};

// ── Storage ───────────────────────────────────────────────────────────────────
async function storageGet(key) {
  try { const r = await window.storage.get(key); return r ? JSON.parse(r.value) : null; }
  catch { return null; }
}
async function storageSet(key, val) {
  try { await window.storage.set(key, JSON.stringify(val)); } catch {}
}

// ── File Storage (Supabase Storage bucket) ───────────────────────────────────
async function fileUpload(file, path) {
  const sb = window._sb;
  if (!sb) { console.warn("[Files] No Supabase client — file upload skipped"); return null; }
  const { data, error } = await sb.storage.from("case-files").upload(path, file, { upsert: true });
  if (error) { console.error("[Files] Upload failed:", error.message); return null; }
  return data.path;
}

function fileGetUrl(path) {
  const sb = window._sb;
  if (!sb || !path) return null;
  const { data } = sb.storage.from("case-files").getPublicUrl(path);
  return data?.publicUrl || null;
}

async function fileDelete(path) {
  const sb = window._sb;
  if (!sb || !path) return false;
  const { error } = await sb.storage.from("case-files").remove([path]);
  if (error) { console.error("[Files] Delete failed:", error.message); return false; }
  return true;
}

function formatFileSize(bytes) {
  if (!bytes || bytes === 0) return "0 B";
  const units = ["B", "KB", "MB", "GB"];
  const i = Math.floor(Math.log(bytes) / Math.log(1024));
  return (bytes / Math.pow(1024, i)).toFixed(i > 0 ? 1 : 0) + " " + units[i];
}

function getMimeIcon(mime, size = 16, color = T.textMid) {
  if (!mime) return <Ic name="file-text" size={size} color={color} />;
  if (mime.startsWith("image/")) return <Ic name="image" size={size} color={color} />;
  if (mime === "application/pdf") return <Ic name="book" size={size} color={color} />;
  if (mime.includes("sheet") || mime.includes("excel") || mime.includes("xlsx")) return <Ic name="bar-chart" size={size} color={color} />;
  if (mime.includes("word") || mime.includes("doc")) return <Ic name="edit" size={size} color={color} />;
  return <Ic name="file-text" size={size} color={color} />;
}

// ── Auto-Categorization Engine ───────────────────────────────────────────────
const REQ_PATTERN = /req[quistion]*[- _.]?#?(\d{1,2})/i;
const INVOICE_PATTERN = /inv(oice)?[- _#.]?\d*/i;
const CO_PATTERN = /c\.?o\.?[- _#.]?\d+|change[- _]?order/i;
const INSPECTION_PATTERN = /inspect|report|punchlist|punch[- ]?list|deficienc/i;
const LEGAL_PATTERN = /arbitrat|aaa|demand|filing|legal|attorney|lien|affidavit/i;
const PHOTO_PATTERN = /\.(jpg|jpeg|png|gif|bmp|tiff|heic|webp)$/i;
const CONTRACT_PATTERN = /contract|aia|a101|a110|a201|agreement|scope/i;

const COST_CODE_MAP = {
  "01": "General Conditions", "02": "Site Work", "03": "Concrete", "04": "Masonry",
  "05": "Metals / Steel", "06": "Carpentry", "07": "Thermal / Moisture", "08": "Doors & Windows",
  "09": "Finishes", "10": "Specialties", "11": "Equipment", "12": "Furnishings",
  "13": "Special Construction", "14": "Conveying Systems", "15": "Mechanical / Plumbing",
  "16": "Electrical",
};

const VENDOR_MAP = [
  "Korth", "Liberty", "Pinnacle", "Lakeland", "Adirondack", "Catskill", "Hudson",
  "Valley", "Empire", "Precision", "Summit", "Rockland", "Heritage", "Alpine",
  "Northeast", "Premier", "Quality", "Superior", "Sterling", "Patriot",
  "Nyack", "Haverstraw", "Highland", "Bear Mountain", "Stony Point",
];

function autoClassifyFile(fileName) {
  const result = { category: "other", status: "received", tags: [], linkedReqs: [], vendor: null, costCode: null };
  const name = fileName || "";
  const lower = name.toLowerCase();

  // Detect linked REQs
  const reqMatch = name.match(new RegExp(REQ_PATTERN.source, "gi"));
  if (reqMatch) {
    reqMatch.forEach(m => {
      const num = m.match(/(\d{1,2})/);
      if (num) {
        const reqId = "REQ-" + num[1].padStart(2, "0");
        if (!result.linkedReqs.includes(reqId)) result.linkedReqs.push(reqId);
        if (!result.tags.includes(reqId)) result.tags.push(reqId);
      }
    });
    result.category = "requisition";
  }

  // Detect category from filename patterns
  if (PHOTO_PATTERN.test(name)) result.category = "photo";
  else if (LEGAL_PATTERN.test(lower)) result.category = result.category === "other" ? "arbitration" : result.category;
  else if (CONTRACT_PATTERN.test(lower)) result.category = result.category === "other" ? "contract" : result.category;
  else if (CO_PATTERN.test(lower)) result.category = result.category === "other" ? "change_order" : result.category;
  else if (INVOICE_PATTERN.test(lower)) result.category = result.category === "other" ? "invoice" : result.category;
  else if (INSPECTION_PATTERN.test(lower)) result.category = result.category === "other" ? "inspection" : result.category;

  // Auto-assign status based on category
  const STATUS_BY_CATEGORY = {
    requisition: "submitted",   // MC submitted requisitions to owner
    invoice: "received",        // invoices received from subs/vendors
    change_order: "active",     // COs are active until resolved
    contract: "active",         // contracts are active documents
    correspondence: "received", // letters/emails received
    inspection: "filed",        // inspection reports are filed
    photo: "filed",             // photos are filed as evidence
    arbitration: "filed",       // legal filings
    other: "received",          // default for unknown
  };
  result.status = STATUS_BY_CATEGORY[result.category] || "received";

  // Refine status from filename keywords
  if (/final|executed|signed|closed/i.test(lower)) result.status = "final";
  else if (/draft/i.test(lower)) result.status = "draft";
  else if (/disput|reject/i.test(lower)) result.status = "disputed";
  else if (/approv|confirm|accept/i.test(lower)) result.status = "confirmed";

  // Detect cost codes (e.g., "01-" prefix in filename)
  const ccMatch = name.match(/\b(\d{2})[- ]/);
  if (ccMatch && COST_CODE_MAP[ccMatch[1]]) {
    result.costCode = ccMatch[1] + " — " + COST_CODE_MAP[ccMatch[1]];
    result.tags.push(COST_CODE_MAP[ccMatch[1]]);
  }

  // Detect vendors
  for (const vendor of VENDOR_MAP) {
    if (lower.includes(vendor.toLowerCase())) {
      result.vendor = vendor;
      if (!result.tags.includes(vendor)) result.tags.push(vendor);
      break;
    }
  }

  // File extension tag
  const ext = name.split(".").pop()?.toUpperCase();
  if (ext && ext.length <= 5 && ext !== name.toUpperCase()) {
    result.tags.push(ext);
  }

  return result;
}

// ── File Parsing (PDF & XLSX) ────────────────────────────────────────────────
async function extractPdfText(fileUrl) {
  if (!window.pdfjsLib) { console.warn("[Parse] pdf.js not loaded"); return null; }
  try {
    const pdf = await window.pdfjsLib.getDocument(fileUrl).promise;
    let text = "";
    const maxPages = Math.min(pdf.numPages, 10);
    for (let i = 1; i <= maxPages; i++) {
      const page = await pdf.getPage(i);
      const content = await page.getTextContent();
      text += content.items.map(item => item.str).join(" ") + "\n";
    }
    return text.slice(0, 3000);
  } catch (err) {
    console.warn("[Parse] PDF extraction failed:", err.message);
    return null;
  }
}

async function extractXlsxData(file) {
  if (!window.XLSX) { console.warn("[Parse] SheetJS not loaded"); return null; }
  try {
    const buf = await file.arrayBuffer();
    const wb = window.XLSX.read(buf, { type: "array" });
    const ws = wb.Sheets[wb.SheetNames[0]];
    const rows = window.XLSX.utils.sheet_to_json(ws, { header: 1, defval: "" });
    const text = rows.slice(0, 50).map(r => r.join(" | ")).join("\n");
    return text.slice(0, 3000);
  } catch (err) {
    console.warn("[Parse] XLSX extraction failed:", err.message);
    return null;
  }
}

function extractTagsFromText(text) {
  if (!text) return [];
  const tags = [];
  // Dollar amounts
  const dollars = text.match(/\$[\d,]+\.?\d*/g);
  if (dollars) dollars.slice(0, 5).forEach(d => { if (!tags.includes(d)) tags.push(d); });
  // REQ references in text
  const reqs = text.match(/req[quistion]*[- _.]?#?\d{1,2}/gi);
  if (reqs) reqs.forEach(r => {
    const num = r.match(/(\d{1,2})/);
    if (num) { const id = "REQ-" + num[1].padStart(2, "0"); if (!tags.includes(id)) tags.push(id); }
  });
  // CO references
  const cos = text.match(/c\.?o\.?[- _#.]?\d+/gi);
  if (cos) cos.slice(0, 3).forEach(c => { if (!tags.includes(c.toUpperCase())) tags.push(c.toUpperCase()); });
  // Vendor matches
  for (const v of VENDOR_MAP) {
    if (text.toLowerCase().includes(v.toLowerCase()) && !tags.includes(v)) tags.push(v);
  }
  return tags.slice(0, 15);
}

// ── Helpers ───────────────────────────────────────────────────────────────────
function computeBackupStatus(bv, reqNum) {
  if (!bv) return { status: "pending", gap: 0, documented: 0, coGap: false };
  const documented = (bv.backupDocs || 0) + (bv.directLabor || 0);
  const gap = (bv.amountBilled || 0) - documented;
  // CO cost-of-work = total cost-of-work minus base contract cost-of-work
  const parsedBase = PARSED_INVOICE_TOTALS[reqNum] || 0;
  const coCostOfWork = (bv.amountBilled || 0) - parsedBase;
  // If the gap is entirely within the CO portion, base is fully documented
  const coGap = gap > 0 && coCostOfWork > 0 && gap <= coCostOfWork;
  let status = "pending";
  if (Math.abs(gap) < 1 || gap < 0) status = "supported";
  else if (Math.abs(gap) < 200) status = "supported";
  else if (coGap) status = "supported";  // gap is CO billing, documented through CO process
  else if (bv.directLabor > 0 && gap > 0) status = "partial";
  else status = "needs_docs";
  return { status, gap, documented, coGap };
}

function computeRisk(req) {
  if (!req.flags.length) return "CLEAR";
  const hasHigh = req.flags.some(f => AUDIT_FLAGS.find(a => a.id === f)?.risk === "HIGH");
  if (hasHigh) return "HIGH";
  return req.flags.length >= 2 ? "MEDIUM" : "LOW";
}

const riskStyle = r => ({
  HIGH:   { color: T.red,    bg: T.redBg,    border: T.redBorder },
  MEDIUM: { color: T.amber,  bg: T.amberBg,  border: T.amberBorder },
  LOW:    { color: T.blue,   bg: T.blueBg,   border: T.blueBorder },
  CLEAR:  { color: T.green,  bg: T.greenBg,  border: T.greenBorder },
}[r] || { color: T.textMuted, bg: T.surfaceHover, border: T.border });

const statusStyle = s => ({
  DISPUTED: { color: T.red,    bg: T.redBg,    border: T.redBorder },
  AGREED:   { color: T.green,  bg: T.greenBg,  border: T.greenBorder },
  WAIVED:   { color: T.purple, bg: T.purpleBg, border: T.purpleBorder },
  PENDING:  { color: T.amber,  bg: T.amberBg,  border: T.amberBorder },
}[s] || { color: T.textMuted, bg: T.surfaceHover, border: T.border });

const strengthStyle = s => ({
  STRONG:   { color: T.green,     bg: T.greenBg },
  MODERATE: { color: T.amber,     bg: T.amberBg },
  WEAK:     { color: T.red,       bg: T.redBg },
  "N/A":    { color: T.textMuted, bg: T.surfaceHover },
}[s] || { color: T.textMuted, bg: T.surfaceHover });

// ── Money formatting ──────────────────────────────────────────────────────────
// Returns { dollars: "264,373", cents: "75" }
function parseMoney(n) {
  const abs = Math.abs(n || 0);
  const str = abs.toFixed(2);
  const [whole, dec] = str.split(".");
  return { dollars: parseInt(whole).toLocaleString("en-US"), cents: dec, negative: n < 0 };
}

// The main Money display component — split dollar/cents with muted prefix
function Money({ amount = 0, color = T.text, size = "md", neg = false }) {
  const { dollars, cents, negative } = parseMoney(amount);
  const isNeg = neg || negative;
  const sizes = {
    xs:  { sym: 9,  main: 12, dec: 10 },
    sm:  { sym: 10, main: 14, dec: 11 },
    md:  { sym: 11, main: 16, dec: 12 },
    lg:  { sym: 13, main: 22, dec: 14 },
    xl:  { sym: 15, main: 28, dec: 17 },
  };
  const s = sizes[size] || sizes.md;
  return (
    <span style={{ display: "inline-flex", alignItems: "baseline", gap: 1, fontFamily: T.num, fontVariantNumeric: "tabular-nums", color }}>
      {isNeg && <span style={{ fontSize: s.sym, color, opacity: 0.6, marginRight: 1 }}>–</span>}
      <span style={{ fontSize: s.sym, opacity: 0.45, fontWeight: 500, letterSpacing: 0 }}>$</span>
      <span style={{ fontSize: s.main, fontWeight: 600, letterSpacing: -0.5 }}>{dollars}</span>
      <span style={{ fontSize: s.dec, opacity: 0.4, fontWeight: 500, letterSpacing: 0 }}>.{cents}</span>
    </span>
  );
}

// Legacy inline string formatter (used in text/labels only)
const $ = (n) => "$" + (Math.abs(n || 0)).toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 });

// ── Shared Components ─────────────────────────────────────────────────────────
function Badge({ label, style: { color, bg, border } }) {
  return (
    <span style={{ display: "inline-flex", alignItems: "center", fontSize: T.fs1, fontWeight: 500, letterSpacing: 0.2, padding: `${T.sp1}px ${T.sp3}px`, borderRadius: T.r1, background: bg, color, border: `1px solid ${border}`, fontFamily: T.font, whiteSpace: "nowrap", lineHeight: T.lh }}>
      {label}
    </span>
  );
}

function Mono({ children, color = T.text, size = T.fs3 }) {
  return <span style={{ fontFamily: T.mono, fontSize: size, color, letterSpacing: -0.3 }}>{children}</span>;
}

function SectionTitle({ title, subtitle }) {
  return (
    <div style={{ marginBottom: T.sp6, paddingLeft: T.sp4, borderLeft: `3px solid ${T.accent}` }}>
      <h2 style={{ margin: 0, fontSize: T.fs6, fontWeight: 700, color: T.text, fontFamily: T.font, letterSpacing: -0.5, lineHeight: T.lhTight }}>{title}</h2>
      {subtitle && <p style={{ margin: `${T.sp1}px 0 0`, fontSize: T.fs2, color: T.textMid, fontFamily: T.font, lineHeight: T.lh }}>{subtitle}</p>}
    </div>
  );
}

function Card({ children, style = {}, padding = T.sp6 }) {
  return (
    <div style={{ background: T.surface, border: `1px solid ${T.border}`, borderRadius: T.r2, padding, boxShadow: T.sh2, overflow: "hidden", ...style }}>
      {children}
    </div>
  );
}

function CardLabel({ label }) {
  return <div style={{ fontSize: T.fs1, fontWeight: 600, letterSpacing: 0.8, color: T.textMuted, textTransform: "uppercase", marginBottom: T.sp3, fontFamily: T.font }}>{label}</div>;
}

function KPI({ label, value, sub, color = T.text, accent = false, isMoney = false, rawAmount = 0 }) {
  return (
    <Card style={{ borderTop: accent ? `3px solid ${T.accent}` : undefined, overflow: "visible" }}>
      <div style={{ fontSize: T.fs1, fontWeight: 600, letterSpacing: 0.5, color: T.textMuted, textTransform: "uppercase", marginBottom: T.sp2, fontFamily: T.font }}>{label}</div>
      <div style={{ marginBottom: T.sp1 }}>
        {isMoney
          ? <Money amount={rawAmount} color={color} size="xl" />
          : <span style={{ fontFamily: T.font, fontSize: T.fs7, fontWeight: 700, color, letterSpacing: -1 }}>{value}</span>
        }
      </div>
      {sub && <div style={{ fontSize: T.fs2, color: T.textMuted, fontFamily: T.font, marginTop: T.sp1 }}>{sub}</div>}
    </Card>
  );
}

function TextInput({ label, value, onChange, type = "text" }) {
  const [focused, setFocused] = useState(false);
  return (
    <div style={{ marginBottom: T.sp4 }}>
      <label style={{ display: "block", fontSize: T.fs1, fontWeight: 600, color: T.textMid, letterSpacing: 0.3, marginBottom: T.sp1, fontFamily: T.font }}>{label}</label>
      <input type={type} value={value ?? ""} onChange={e => onChange(type === "number" ? parseFloat(e.target.value) || 0 : e.target.value)}
        onFocus={() => setFocused(true)} onBlur={() => setFocused(false)}
        style={{ width: "100%", background: T.bg, border: `1px solid ${focused ? T.accent : T.border}`, borderRadius: T.r2, padding: `${T.sp2}px ${T.sp3}px`, color: T.text, fontSize: T.fs3, outline: "none", boxSizing: "border-box", fontFamily: type === "number" ? T.mono : T.font, transition: T.fast }} />
    </div>
  );
}

function SegmentControl({ options, value, onChange, colorFn }) {
  return (
    <div style={{ display: "flex", gap: T.sp1, background: T.bg, borderRadius: T.r2, padding: T.sp1 }}>
      {options.map(opt => {
        const active = value === opt;
        const col = colorFn ? colorFn(opt) : { color: T.text, bg: T.surface, border: T.border };
        return (
          <button key={opt} onClick={() => onChange(opt)} style={{
            flex: 1, padding: `${T.r1}px ${T.sp2}px`, borderRadius: T.r1, border: active ? `1px solid ${col.border}` : "1px solid transparent",
            background: active ? col.bg : "transparent", color: active ? col.color : T.textMuted,
            fontSize: T.fs1, fontWeight: active ? 600 : 400, cursor: "pointer", fontFamily: T.font, transition: T.fast,
            boxShadow: active ? T.sh1 : "none",
          }}>{opt}</button>
        );
      })}
    </div>
  );
}

function PrimaryButton({ label, onClick, icon, loading, size = "md", variant = "primary", style: extStyle = {} }) {
  const [hover, setHover] = useState(false);
  const sizes = { sm: { px: T.sp3, py: T.sp2, fs: T.fs2 }, md: { px: T.sp5, py: T.sp2+2, fs: T.fs3 }, lg: { px: T.sp7, py: T.sp3+2, fs: T.fs4 } };
  const s = sizes[size];
  const variants = {
    primary: { bg: T.accent, hoverBg: T.accentHover, color: "#fff", border: "none" },
    secondary: { bg: T.surface, hoverBg: T.surfaceHover, color: T.text, border: `1px solid ${T.border}` },
    ghost: { bg: "transparent", hoverBg: T.surfaceHover, color: T.textMid, border: "1px solid transparent" },
  };
  const v = variants[variant];
  return (
    <button onClick={onClick} onMouseEnter={() => setHover(true)} onMouseLeave={() => setHover(false)}
      style={{
        display: "inline-flex", alignItems: "center", gap: T.sp2,
        padding: `${s.py}px ${s.px}px`, borderRadius: T.r2,
        background: hover ? v.hoverBg : v.bg, color: v.color,
        border: v.border, cursor: loading ? "wait" : "pointer",
        fontSize: s.fs, fontWeight: 600, fontFamily: T.font,
        transition: T.fast, boxShadow: variant === "primary" ? T.sh1 : "none",
        opacity: loading ? 0.7 : 1, letterSpacing: -0.1, ...extStyle,
      }}>
      {loading ? <span style={{ display: "inline-block", width: s.fs, height: s.fs, border: `2px solid ${v.color}40`, borderTopColor: v.color, borderRadius: "50%", animation: "spin .6s linear infinite" }} /> : icon && <Ic name={icon} size={s.fs} color={v.color} />}
      {label}
    </button>
  );
}

// ── DASHBOARD ─────────────────────────────────────────────────────────────────
function Dashboard({ reqs, claims, mode }) {
  const totalBilled = reqs.reduce((s, r) => s + (r.totalBilled || 0), 0);
  const totalPaid = reqs.reduce((s, r) => s + (r.paidAmount || 0), 0);
  const highRisk = reqs.filter(r => computeRisk(r) === "HIGH").length;
  const totalOwner = claims.reduce((s, c) => s + c.ownerAmount, 0);
  const totalAgreed = claims.reduce((s, c) => s + c.agreedAmount, 0);
  const openBalance = totalBilled - totalPaid;
  const totalWaived = claims.filter(c => c.status === "WAIVED").reduce((s, c) => s + c.ownerAmount, 0);
  const totalDisputed = claims.filter(c => c.status === "DISPUTED").reduce((s, c) => s + c.ownerAmount, 0);

  const riskDist = { HIGH: 0, MEDIUM: 0, LOW: 0, CLEAR: 0 };
  reqs.forEach(r => riskDist[computeRisk(r)]++);

  return (
    <div>
      <SectionTitle title={mode === "presentation" ? "Case Overview" : "Case Dashboard"} subtitle="Tharp/Bumgardner · 515 N. Midland Ave, Upper Nyack NY · AIA A110-2021 Cost-Plus · AAA Arbitration" />

      <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: T.sp3, marginBottom: T.sp3 }}>
        <KPI label="Total Billed" isMoney rawAmount={totalBilled} sub="16 payment applications" accent color={T.accent} />
        <KPI label="Open Balance" isMoney rawAmount={openBalance} sub="Billed minus payments received" color={T.amber} />
        <KPI label="High Risk Reqs" value={`${highRisk}/16`} sub="Require mitigation" color={highRisk > 0 ? T.red : T.green} />
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: T.sp3, marginBottom: T.sp5 }}>
        <KPI label="Owner's Total Claims" isMoney rawAmount={totalOwner} sub="Gross claimed damages" color={T.red} />
        <KPI label="MC Agreed Credits" isMoney rawAmount={totalAgreed} sub="Documented concessions" color={T.amber} />
        <KPI label="Active Disputed" isMoney rawAmount={totalDisputed} sub="Needs arbitration" color={T.red} />
        <KPI label="Barred by §21.11" isMoney rawAmount={totalWaived} sub="Consequential waiver" color={T.purple} />
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: T.sp4, marginBottom: T.sp4 }}>
        <Card>
          <CardLabel label="Requisition Risk Distribution" />
          {["HIGH", "MEDIUM", "LOW", "CLEAR"].map(level => {
            const s = riskStyle(level);
            const pct = Math.round((riskDist[level] / 16) * 100);
            return (
              <div key={level} style={{ display: "flex", alignItems: "center", gap: T.sp3, marginBottom: T.sp3 }}>
                <Badge label={level} style={s} />
                <div style={{ flex: 1, height: T.sp2+2, background: T.border, borderRadius: T.r1, overflow: "hidden" }}>
                  <div style={{ height: T.sp2+2, background: s.color, width: `${pct}%`, borderRadius: T.r1, transition: T.med }} />
                </div>
                <span style={{ fontFamily: T.mono, fontSize: T.fs3, color: T.textMid, minWidth: T.sp7, textAlign: "right" }}>{riskDist[level]}</span>
              </div>
            );
          })}
        </Card>

        <Card>
          <CardLabel label="Net Position Summary" />
          {[
            { label: "Owner's Gross Demand", val: totalOwner, color: T.red, neg: false },
            { label: "Barred — §21.11 Consequential", val: totalWaived, color: T.purple, neg: true },
            { label: "Disputed w/ Strong Defense", val: totalDisputed, color: T.blue, neg: true },
            { label: "MC Agreed Credits", val: totalAgreed, color: T.amber, neg: false },
          ].map(row => (
            <div key={row.label} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: `${T.sp2}px 0`, borderBottom: `1px solid ${T.border}` }}>
              <span style={{ fontSize: T.fs3, color: T.textMid, fontFamily: T.font }}>{row.label}</span>
              <Money amount={row.val} color={row.color} size="sm" neg={row.neg} />
            </div>
          ))}
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: `${T.sp3}px 0 0`, marginTop: T.sp1 }}>
            <span style={{ fontSize: T.fs3, fontWeight: 600, color: T.text, fontFamily: T.font }}>Settlement Target</span>
            <Money amount={totalAgreed} color={T.accent} size="lg" />
          </div>
        </Card>
      </div>

      {/* Priority Items — prep mode only */}
      {mode !== "presentation" && <Card>
        <CardLabel label="Priority Audit Items — Mitigate Before Arbitration" />
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: T.sp2 }}>
          {[
            { n: 1, text: "Reconcile $60/hr labor rate vs actual burdened payroll records (W-2s, payroll register, WC audit)" },
            { n: 2, text: "DSL Landscaping billed at skilled trade rate as direct labor — reclassify or document actual rates" },
            { n: 3, text: "Identify all overhead items billed as materials (masks, tarps, rock salt, flashlights) — calculate exposure" },
            { n: 4, text: "Obtain compliant revised invoice from H&J Improvements #1316 — add date, scope, location, hourly vs lump" },
            { n: 5, text: "Obtain full subcontract and scope from DeLeonardis Electric — job tickets 2544/2681, original CO #001" },
            { n: 6, text: "Document all 125 change orders with signed COs to support delay causation defense" },
          ].map(item => (
            <div key={item.n} style={{ display: "flex", gap: T.sp2, padding: T.sp3, background: T.redBg, border: `1px solid ${T.redBorder}`, borderRadius: T.r2 }}>
              <span style={{ fontFamily: T.mono, fontSize: T.fs1, color: T.red, fontWeight: 500, flexShrink: 0, marginTop: 1 }}>{item.n}.</span>
              <span style={{ fontSize: T.fs2, color: T.textMid, fontFamily: T.font, lineHeight: T.lh }}>{item.text}</span>
            </div>
          ))}
        </div>
      </Card>}
    </div>
  );
}

// ── REQUISITIONS ──────────────────────────────────────────────────────────────
function Requisitions({ reqs, updateReq, docs = [], updateDoc, addDoc }) {
  const [sel, setSel] = useState(null);
  const [uploading, setUploading] = useState([]);
  const [uploadSummary, setUploadSummary] = useState(null);
  const editing = sel ? reqs.find(r => r.id === sel) : null;
  const reqDocs = editing ? docs.filter(d => (d.linkedReqs || []).includes(editing.reqNumber)) : [];
  const backupData = editing ? BACKUP_VARIANCE[editing.id] : null;

  const processReqFiles = async (files) => {
    if (!files || files.length === 0) return;
    if (!window._sb) { alert("File upload requires cloud mode (Supabase)."); return; }
    const fileArr = Array.from(files);
    setUploading(fileArr.map(f => ({ name: f.name, progress: 0, status: "pending" })));
    for (let i = 0; i < fileArr.length; i++) {
      const file = fileArr[i];
      setUploading(prev => prev.map((u, j) => j === i ? { ...u, status: "uploading", progress: 30 } : u));
      const classify = autoClassifyFile(file.name);
      const safeName = file.name.replace(/[^a-zA-Z0-9._-]/g, "_");
      const storagePath = classify.category + "/" + Date.now() + "-" + safeName;
      const path = await fileUpload(file, storagePath);
      if (!path) { setUploading(prev => prev.map((u, j) => j === i ? { ...u, status: "error", progress: 100 } : u)); continue; }
      setUploading(prev => prev.map((u, j) => j === i ? { ...u, progress: 60, status: "parsing" } : u));
      let extractedText = null; let textTags = [];
      const mime = file.type || "";
      if (mime === "application/pdf") { const url = fileGetUrl(path); if (url) extractedText = await extractPdfText(url); }
      else if (mime.includes("sheet") || mime.includes("excel") || file.name.match(/\.xlsx?$/i)) { extractedText = await extractXlsxData(file); }
      if (extractedText) textTags = extractTagsFromText(extractedText);
      const allLinkedReqs = [...new Set([editing.reqNumber, ...classify.linkedReqs, ...textTags.filter(t => t.match(/^REQ-\d{2}$/))])];
      const allFileTags = [...new Set([...classify.tags, ...textTags, editing.reqNumber])];
      setUploading(prev => prev.map((u, j) => j === i ? { ...u, progress: 90, status: "saving" } : u));
      const id = "doc-" + Date.now().toString(36) + "-" + Math.random().toString(36).slice(2, 6);
      addDoc({ id, category: classify.category || "requisition", name: file.name.replace(/\.[^.]+$/, "").replace(/[_-]/g, " "),
        date: new Date().toISOString().slice(0, 10), description: `Uploaded from ${editing.reqNumber}`, parties: classify.vendor || "MC",
        status: classify.status || "submitted", notes: "", storagePath: path, fileName: file.name, fileSize: file.size, mimeType: mime,
        tags: allFileTags, linkedReqs: allLinkedReqs, extractedText, vendor: classify.vendor, costCode: classify.costCode });
      if (window._openaiKey && extractedText) {
        analyzeUploadedDoc({ id }, extractedText, reqs).then(u => { if (u) updateDoc(id, u); }).catch(() => {});
      }
      setUploading(prev => prev.map((u, j) => j === i ? { ...u, progress: 100, status: "done" } : u));
    }
    setUploadSummary({ total: fileArr.length }); setTimeout(() => setUploading([]), 3000); setTimeout(() => setUploadSummary(null), 6000);
  };

  const toggleFlag = (reqId, flagId) => {
    const req = reqs.find(r => r.id === reqId);
    const flags = req.flags.includes(flagId) ? req.flags.filter(f => f !== flagId) : [...req.flags, flagId];
    updateReq(reqId, { flags });
  };
  // Compute summary stats from BACKUP_VARIANCE + PARSED_INVOICE_TOTALS
  const bvRows = reqs.map(r => {
    const bv = BACKUP_VARIANCE[r.id];
    const bs = computeBackupStatus(bv, r.id);
    const parsed = PARSED_INVOICE_TOTALS[r.id] || 0;
    const plaintiff = PLAINTIFF_CLAIMED[r.id] || null;
    return { ...bs, bv, req: r, parsed, plaintiff };
  });
  const totBilled = reqs.reduce((s, r) => s + (r.totalBilled || 0), 0);
  const totPaid = reqs.reduce((s, r) => s + (r.paidAmount || 0), 0);
  const totInvoices = bvRows.reduce((s, r) => s + ((r.bv?.backupDocs) || 0), 0);
  const totSelfPerformed = bvRows.reduce((s, r) => s + ((r.bv?.directLabor) || 0), 0);
  const totDocumented = totInvoices + totSelfPerformed;
  const totCostBasis = bvRows.reduce((s, r) => s + ((r.bv?.amountBilled) || 0), 0);
  const totParsed = bvRows.reduce((s, r) => s + r.parsed, 0);
  const totGap = bvRows.reduce((s, r) => s + Math.max(0, r.gap), 0);
  const totBaseGap = bvRows.reduce((s, r) => s + (r.coGap ? 0 : Math.max(0, r.gap)), 0);
  const coGapCount = bvRows.filter(r => r.coGap).length;
  const supportedCount = bvRows.filter(r => r.status === "supported").length;
  const needsDocsCount = bvRows.filter(r => r.status === "needs_docs").length;
  const pctSupported = totCostBasis > 0 ? Math.round((totDocumented / totCostBasis) * 100) : 0;

  const ThStyle = { padding: `${T.sp2}px ${T.sp4}px`, textAlign: "left", fontSize: T.fs1, fontWeight: 600, letterSpacing: 0.5, color: T.textMuted, fontFamily: T.font, borderBottom: `1px solid ${T.border}`, background: T.bg, whiteSpace: "nowrap" };
  const TdStyle = { padding: `${T.sp3}px ${T.sp4}px`, fontSize: T.fs3, fontFamily: T.font, color: T.text, borderBottom: `1px solid ${T.border}` };

  return (
    <div style={{ display: "grid", gridTemplateColumns: editing ? "1fr 480px" : "1fr", gap: T.sp5, alignItems: "start" }}>
      <div>
        <SectionTitle title="Requisitions" subtitle="16 payment applications · Tharp/Bumgardner · 515 N. Midland Ave, Upper Nyack NY" />

        {/* Narrative Summary */}
        <div style={{ background: T.surface, border: `1px solid ${T.border}`, borderRadius: T.r2, padding: `${T.sp4}px ${T.sp5}px`, marginBottom: T.sp4, lineHeight: T.lhLoose }}>
          <div style={{ fontSize: T.fs3, color: T.text, fontFamily: T.font }}>
            Of <strong>${totCostBasis.toLocaleString("en-US", { minimumFractionDigits: 2 })}</strong> in cost-of-work billing across 16 payment applications,{" "}
            <strong>${totInvoices.toLocaleString("en-US", { minimumFractionDigits: 2 })}</strong> is supported by third-party invoices on file.{" "}
            An additional <strong>${totSelfPerformed.toLocaleString("en-US", { minimumFractionDigits: 2 })}</strong> represents self-performed work by Montana Contracting.{" "}
            <strong>{supportedCount} of 16</strong> requisitions are fully supported{needsDocsCount > 0 ? <>; <strong>{needsDocsCount}</strong> require additional documentation</> : ""}.{" "}
            {coGapCount > 0 && <>Base contract invoices on file exceed base billing for all 16 requisitions — remaining gaps of <strong>${totGap.toLocaleString("en-US", { minimumFractionDigits: 2 })}</strong> are entirely change order billing documented through the CO approval process.{" "}</>}
            Open balance: <strong>${(totBilled - totPaid).toLocaleString("en-US", { minimumFractionDigits: 2 })}</strong> (REQs 14–16 unpaid).
          </div>
        </div>

        {/* KPIs */}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(5, 1fr)", gap: T.sp3, marginBottom: T.sp4 }}>
          <KPI label="Sub/Vendor Invoices" isMoney rawAmount={totInvoices} sub="Third-party backup on file" color={T.text} />
          <KPI label="Self-Performed" isMoney rawAmount={totSelfPerformed} sub="Montana direct labor" color={T.amber} />
          <KPI label="Cost of Work Billed" isMoney rawAmount={totCostBasis} sub={`G702 total: $${totBilled.toLocaleString()}`} color={T.text} />
          <KPI label="Parsed Invoice Sum" isMoney rawAmount={totParsed} sub="Base contract from spreadsheet" color={T.blue} />
          <KPI label={totBaseGap < 1 ? "CO Billing Gap" : "Unreconciled Gap"} isMoney rawAmount={totGap} sub={totBaseGap < 1 ? "All base invoices on file" : `${needsDocsCount} req${needsDocsCount !== 1 ? "s" : ""} need docs`} color={totBaseGap < 1 ? T.green : T.red} />
        </div>

        {/* Main table — cost-of-work comparison */}
        <Card padding={0}>
          <div style={{ overflowX: "auto" }}>
          <table style={{ width: "100%", borderCollapse: "collapse", minWidth: 900 }}>
            <thead>
              <tr>
                <th style={{ ...ThStyle, textAlign: "left" }}>REQ #</th>
                <th style={{ ...ThStyle, textAlign: "right" }}>SUB/VENDOR</th>
                <th style={{ ...ThStyle, textAlign: "right" }}>SELF-PERF</th>
                <th style={{ ...ThStyle, textAlign: "right", borderLeft: `2px solid ${T.border}` }}>DOCUMENTED</th>
                <th style={{ ...ThStyle, textAlign: "right" }}>BILLED (COW)</th>
                <th style={{ ...ThStyle, textAlign: "right", color: T.blue }}>PARSED INV</th>
                <th style={{ ...ThStyle, textAlign: "right" }}>GAP</th>
                <th style={{ ...ThStyle, textAlign: "center" }}>STATUS</th>
              </tr>
            </thead>
            <tbody>
              {reqs.map((req, i) => {
                const bv = BACKUP_VARIANCE[req.id];
                const bs = computeBackupStatus(bv, req.id);
                const parsed = PARSED_INVOICE_TOTALS[req.id] || 0;
                const active = sel === req.id;
                const documented = (bv?.backupDocs || 0) + (bv?.directLabor || 0);
                const billed = bv?.amountBilled || 0;
                const stColor = bs.status === "supported" ? T.green : bs.status === "partial" ? T.amber : bs.status === "needs_docs" ? T.red : T.textMuted;
                const stBg = bs.status === "supported" ? T.greenBg : bs.status === "partial" ? T.amberBg : bs.status === "needs_docs" ? T.redBg : T.surfaceHover;
                const stBorder = bs.status === "supported" ? T.greenBorder : bs.status === "partial" ? T.amberBorder : bs.status === "needs_docs" ? T.redBorder : T.border;
                const stLabel = bs.status === "supported" ? "SUPPORTED" : bs.status === "partial" ? "PARTIAL" : bs.status === "needs_docs" ? "NEEDS DOCS" : "PENDING";
                // Parsed vs billed variance
                const parsedDelta = parsed !== 0 ? (billed - parsed) : null;
                return (
                  <tr key={req.id} onClick={() => setSel(active ? null : req.id)}
                    style={{ cursor: "pointer", background: active ? T.accentBg : "transparent", transition: T.fast }}
                    onMouseEnter={e => { if (!active) e.currentTarget.style.background = T.surfaceHover; }}
                    onMouseLeave={e => { if (!active) e.currentTarget.style.background = "transparent"; }}>
                    <td style={{ ...TdStyle, fontFamily: T.mono, fontWeight: 500, color: T.accent }}>
                      {req.reqNumber}
                      <div style={{ fontSize: T.fs1, color: T.textMuted, fontWeight: 400 }}>{req.date || ""}</div>
                    </td>
                    <td style={{ ...TdStyle, textAlign: "right" }}>
                      {(bv?.backupDocs || 0) !== 0 ? <Money amount={bv.backupDocs} size="sm" /> : <span style={{ color: T.textMuted, fontSize: T.fs2 }}>—</span>}
                    </td>
                    <td style={{ ...TdStyle, textAlign: "right" }}>
                      {(bv?.directLabor || 0) !== 0 ? <Money amount={bv.directLabor} color={T.amber} size="sm" /> : <span style={{ color: T.textMuted, fontSize: T.fs2 }}>—</span>}
                    </td>
                    <td style={{ ...TdStyle, textAlign: "right", borderLeft: `2px solid ${T.border}`, fontWeight: 600 }}>
                      <Money amount={documented} size="sm" />
                    </td>
                    <td style={{ ...TdStyle, textAlign: "right" }}>
                      <Money amount={billed} size="sm" />
                    </td>
                    <td style={{ ...TdStyle, textAlign: "right" }}>
                      {parsed !== 0 ? <Money amount={parsed} color={T.blue} size="sm" /> : <span style={{ color: T.textMuted, fontSize: T.fs2 }}>—</span>}
                      {parsedDelta !== null && Math.abs(parsedDelta) > 1 && (
                        <div style={{ fontSize: T.fs1, fontFamily: T.mono, color: parsedDelta > 0 ? T.amber : T.green, marginTop: 1 }}>
                          {parsedDelta > 0 ? "+" : ""}{parsedDelta.toLocaleString("en-US", { minimumFractionDigits: 0, maximumFractionDigits: 0 })}
                        </div>
                      )}
                    </td>
                    <td style={{ ...TdStyle, textAlign: "right" }}>
                      {bs.gap > 1 ? (
                        <>
                          <Money amount={bs.gap} color={bs.coGap ? T.textMuted : T.red} size="sm" />
                          {bs.coGap && <div style={{ fontSize: T.fs1, fontFamily: T.mono, color: T.textMuted, marginTop: 1 }}>CO billing</div>}
                        </>
                      ) : bs.gap < -1 ? <span style={{ fontFamily: T.mono, fontSize: T.fs2, color: T.green }}>surplus</span> : <span style={{ fontFamily: T.mono, fontSize: T.fs2, color: T.green }}>—</span>}
                    </td>
                    <td style={{ ...TdStyle, textAlign: "center" }}><Badge label={stLabel} style={{ color: stColor, bg: stBg, border: stBorder }} /></td>
                  </tr>
                );
              })}
            </tbody>
            <tfoot>
              <tr style={{ background: T.bg }}>
                <td style={{ ...TdStyle, fontSize: T.fs1, fontWeight: 600, color: T.textMuted, letterSpacing: 0.5, borderBottom: "none" }}>TOTALS</td>
                <td style={{ ...TdStyle, textAlign: "right", borderBottom: "none" }}><Money amount={totInvoices} size="sm" /></td>
                <td style={{ ...TdStyle, textAlign: "right", borderBottom: "none" }}><Money amount={totSelfPerformed} color={T.amber} size="sm" /></td>
                <td style={{ ...TdStyle, textAlign: "right", borderBottom: "none", borderLeft: `2px solid ${T.border}`, fontWeight: 600 }}><Money amount={totDocumented} size="sm" /></td>
                <td style={{ ...TdStyle, textAlign: "right", borderBottom: "none" }}><Money amount={totCostBasis} size="sm" /></td>
                <td style={{ ...TdStyle, textAlign: "right", borderBottom: "none" }}><Money amount={totParsed} color={T.blue} size="sm" /></td>
                <td style={{ ...TdStyle, textAlign: "right", borderBottom: "none" }}><Money amount={totGap} color={totGap > 1000 ? T.red : T.green} size="sm" /></td>
                <td style={{ ...TdStyle, textAlign: "center", borderBottom: "none" }}>
                  <span style={{ fontSize: T.fs1, fontFamily: T.mono, color: T.textMuted }}>{supportedCount}/16</span>
                </td>
              </tr>
            </tfoot>
          </table>
          </div>
        </Card>

        {/* Labor Analysis — Supervision vs Trade */}
        <div style={{ marginTop: T.sp5 }}>
          <div style={{ fontSize: T.fs3, fontWeight: 600, color: T.text, fontFamily: T.font, marginBottom: T.sp2 }}>
            Labor Cost Code Analysis
            <span style={{ fontWeight: 400, color: T.textMuted, fontSize: T.fs2, marginLeft: T.sp2 }}>
              {LABOR_ANALYSIS.totals.totalHours.toLocaleString()} total hours · {LABOR_ANALYSIS.totals.supHours.toLocaleString()} supervision (O&P) · {LABOR_ANALYSIS.totals.tradeHours.toLocaleString()} trade (billable)
            </span>
          </div>
          <Card padding={0}>
            <table style={{ width: "100%", borderCollapse: "collapse" }}>
              <thead>
                <tr>
                  <th style={{ ...ThStyle, textAlign: "left" }}>EMPLOYEE</th>
                  <th style={{ ...ThStyle, textAlign: "left" }}>ROLE</th>
                  <th style={{ ...ThStyle, textAlign: "right" }}>SUPERVISION</th>
                  <th style={{ ...ThStyle, textAlign: "right" }}>TRADE</th>
                  <th style={{ ...ThStyle, textAlign: "right" }}>TOTAL</th>
                  <th style={{ ...ThStyle, textAlign: "right" }}>% TRADE</th>
                  <th style={{ ...ThStyle, textAlign: "left" }}>DATE RANGE</th>
                </tr>
              </thead>
              <tbody>
                {LABOR_ANALYSIS.employees.map((emp, i) => {
                  const pctTrade = emp.totalHours > 0 ? Math.round((emp.tradeHours / emp.totalHours) * 100) : 0;
                  const isSupOnly = pctTrade === 0;
                  const isMixed = emp.supHours > 0 && emp.tradeHours > 0;
                  return (
                    <tr key={emp.name} style={{ background: isSupOnly ? T.surfaceHover : "transparent" }}>
                      <td style={{ ...TdStyle, fontWeight: 500 }}>{emp.name}</td>
                      <td style={{ ...TdStyle, fontSize: T.fs1, color: T.textMuted }}>{emp.role}</td>
                      <td style={{ ...TdStyle, textAlign: "right", fontFamily: T.mono, color: emp.supHours > 0 ? T.textMuted : T.textMuted }}>
                        {emp.supHours > 0 ? emp.supHours.toLocaleString() : "—"}
                      </td>
                      <td style={{ ...TdStyle, textAlign: "right", fontFamily: T.mono, color: emp.tradeHours > 0 ? T.text : T.textMuted }}>
                        {emp.tradeHours > 0 ? emp.tradeHours.toLocaleString() : "—"}
                      </td>
                      <td style={{ ...TdStyle, textAlign: "right", fontFamily: T.mono, fontWeight: 500 }}>{emp.totalHours.toLocaleString()}</td>
                      <td style={{ ...TdStyle, textAlign: "right" }}>
                        <span style={{
                          fontFamily: T.mono, fontSize: T.fs1, padding: `${T.sp1}px ${T.sp2}px`, borderRadius: T.r1,
                          background: isSupOnly ? T.surfaceHover : pctTrade === 100 ? T.greenBg : T.amberBg,
                          color: isSupOnly ? T.textMuted : pctTrade === 100 ? T.green : T.amber,
                        }}>
                          {pctTrade}%
                        </span>
                      </td>
                      <td style={{ ...TdStyle, fontSize: T.fs1, color: T.textMuted, fontFamily: T.mono }}>{emp.dateRange}</td>
                    </tr>
                  );
                })}
              </tbody>
              <tfoot>
                <tr style={{ background: T.bg }}>
                  <td colSpan={2} style={{ ...TdStyle, fontSize: T.fs1, fontWeight: 600, color: T.textMuted, letterSpacing: 0.5, borderBottom: "none" }}>TOTALS</td>
                  <td style={{ ...TdStyle, textAlign: "right", fontFamily: T.mono, borderBottom: "none", color: T.textMuted }}>{LABOR_ANALYSIS.totals.supHours.toLocaleString()}</td>
                  <td style={{ ...TdStyle, textAlign: "right", fontFamily: T.mono, borderBottom: "none" }}>{LABOR_ANALYSIS.totals.tradeHours.toLocaleString()}</td>
                  <td style={{ ...TdStyle, textAlign: "right", fontFamily: T.mono, fontWeight: 600, borderBottom: "none" }}>{LABOR_ANALYSIS.totals.totalHours.toLocaleString()}</td>
                  <td style={{ ...TdStyle, textAlign: "right", borderBottom: "none" }}>
                    <span style={{ fontFamily: T.mono, fontSize: T.fs1, padding: `${T.sp1}px ${T.sp2}px`, borderRadius: T.r1, background: T.amberBg, color: T.amber }}>
                      {Math.round((LABOR_ANALYSIS.totals.tradeHours / LABOR_ANALYSIS.totals.totalHours) * 100)}%
                    </span>
                  </td>
                  <td style={{ borderBottom: "none" }} />
                </tr>
              </tfoot>
            </table>
          </Card>
        </div>
      </div>

      {editing && (
        <div style={{ position: "sticky", top: T.sp4 }}>
          <Card>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: T.sp4, paddingBottom: T.sp3, borderBottom: `1px solid ${T.border}` }}>
              <span style={{ fontSize: T.fs4, fontWeight: 600, color: T.text, fontFamily: T.font }}>{editing.reqNumber}</span>
              <button onClick={() => setSel(null)} style={{ background: "none", border: "none", color: T.textMuted, cursor: "pointer", fontSize: T.fs5, lineHeight: 1, padding: T.sp1 }}>×</button>
            </div>
            <div style={{ maxHeight: "75vh", overflowY: "auto", paddingRight: T.sp1 }}>
              <TextInput label="Date" value={editing.date} onChange={v => updateReq(editing.id, { date: v })} type="date" />
              <TextInput label="Total Billed ($)" value={editing.totalBilled} onChange={v => updateReq(editing.id, { totalBilled: v })} type="number" />
              <TextInput label="Retainage Held ($)" value={editing.retainageHeld} onChange={v => updateReq(editing.id, { retainageHeld: v })} type="number" />
              <TextInput label="Labor Cost ($)" value={editing.laborCost} onChange={v => updateReq(editing.id, { laborCost: v })} type="number" />
              <TextInput label="Material Cost ($)" value={editing.materialCost} onChange={v => updateReq(editing.id, { materialCost: v })} type="number" />
              <TextInput label="Subcontractor Cost ($)" value={editing.subCost} onChange={v => updateReq(editing.id, { subCost: v })} type="number" />
              <TextInput label="Billed Labor Rate ($/hr)" value={editing.laborRate} onChange={v => updateReq(editing.id, { laborRate: v })} type="number" />

              <div style={{ marginBottom: T.sp3 }}>
                <label style={{ display: "block", fontSize: T.fs1, fontWeight: 600, color: T.textMid, letterSpacing: 0.4, marginBottom: T.sp2, fontFamily: T.font }}>BACKUP STATUS</label>
                <SegmentControl options={["COMPLETE", "PARTIAL", "MISSING"]} value={editing.backupStatus} onChange={v => updateReq(editing.id, { backupStatus: v })}
                  colorFn={s => s === "COMPLETE" ? { color: T.green, bg: T.greenBg, border: T.greenBorder } : s === "PARTIAL" ? { color: T.amber, bg: T.amberBg, border: T.amberBorder } : { color: T.red, bg: T.redBg, border: T.redBorder }} />
              </div>

              <div style={{ marginBottom: T.sp3 }}>
                <label style={{ display: "block", fontSize: T.fs1, fontWeight: 600, color: T.textMid, letterSpacing: 0.4, marginBottom: T.sp2, fontFamily: T.font }}>DOCUMENTATION ON FILE</label>
                {[{ f: "hasPayrollSupport", l: "Payroll / timesheets" }, { f: "hasInvoiceSupport", l: "Receipted invoices" }, { f: "hasCheckVouchers", l: "Check vouchers" }].map(cb => (
                  <label key={cb.f} style={{ display: "flex", alignItems: "center", gap: T.sp2, marginBottom: T.sp2, cursor: "pointer" }}>
                    <input type="checkbox" checked={editing[cb.f]} onChange={e => updateReq(editing.id, { [cb.f]: e.target.checked })} style={{ accentColor: T.accent, width: 14, height: 14 }} />
                    <span style={{ fontSize: T.fs3, color: editing[cb.f] ? T.text : T.textMuted, fontFamily: T.font }}>{cb.l}</span>
                  </label>
                ))}
              </div>

              <div style={{ marginBottom: T.sp3 }}>
                <label style={{ display: "block", fontSize: T.fs1, fontWeight: 600, color: T.textMid, letterSpacing: 0.4, marginBottom: T.sp2, fontFamily: T.font }}>AUDIT FLAGS</label>
                {AUDIT_FLAGS.map(flag => {
                  const active = editing.flags.includes(flag.id);
                  const col = flag.risk === "HIGH" ? T.red : flag.risk === "MEDIUM" ? T.amber : T.blue;
                  return (
                    <label key={flag.id} style={{ display: "flex", alignItems: "flex-start", gap: T.sp2, marginBottom: T.sp2, cursor: "pointer", padding: `${T.sp2}px ${T.sp2}px`, borderRadius: T.r1, background: active ? (flag.risk === "HIGH" ? T.redBg : T.amberBg) : "transparent", transition: T.fast }}>
                      <input type="checkbox" checked={active} onChange={() => toggleFlag(editing.id, flag.id)} style={{ accentColor: col, marginTop: 2, flexShrink: 0 }} />
                      <div>
                        <span style={{ fontSize: T.fs2, color: active ? col : T.textMid, fontFamily: T.font, lineHeight: T.lh, display: "block" }}>{flag.label}</span>
                        <span style={{ fontSize: T.fs1, color: T.textMuted, fontFamily: T.mono }}>{flag.risk}</span>
                      </div>
                    </label>
                  );
                })}
              </div>

              <div>
                <label style={{ display: "block", fontSize: T.fs1, fontWeight: 600, color: T.textMid, letterSpacing: 0.4, marginBottom: T.sp1, fontFamily: T.font }}>NOTES</label>
                <textarea value={editing.notes} onChange={e => updateReq(editing.id, { notes: e.target.value })}
                  rows={3} style={{ width: "100%", background: T.bg, border: `1px solid ${T.border}`, borderRadius: T.r1, padding: `${T.sp2}px ${T.sp3}px`, color: T.text, fontSize: T.fs3, outline: "none", resize: "vertical", boxSizing: "border-box", fontFamily: T.font, lineHeight: T.lh }} />
              </div>

              {/* ── ARBITRATOR Q&A ── */}
              {editing.arbitratorQA && editing.arbitratorQA.length > 0 && (
                <div style={{ marginTop: T.sp5, paddingTop: T.sp4, borderTop: `1px solid ${T.border}` }}>
                  <label style={{ display: "flex", alignItems: "center", gap: T.sp2, fontSize: T.fs1, fontWeight: 600, color: T.textMid, letterSpacing: 0.4, marginBottom: T.sp3, fontFamily: T.font }}>
                    <Ic name="scale" size={14} color={T.accent} />
                    ARBITRATOR Q&A ({editing.arbitratorQA.filter(qa => qa.status === "answered").length}/{editing.arbitratorQA.length} answered)
                  </label>
                  {editing.arbitratorQA.map((qa, idx) => {
                    const isOpen = qa.status === "open";
                    const borderColor = isOpen ? T.amberBorder : T.greenBorder;
                    const bgColor = isOpen ? T.amberBg : T.greenBg;
                    const iconColor = isOpen ? T.amber : T.green;
                    return (
                      <div key={idx} style={{ marginBottom: T.sp3, borderRadius: T.r2, border: `1px solid ${borderColor}`, overflow: "hidden" }}>
                        <div style={{ padding: `${T.sp3}px ${T.sp3}px`, background: bgColor, display: "flex", gap: T.sp2, alignItems: "flex-start" }}>
                          <Ic name={isOpen ? "alert" : "check"} size={14} color={iconColor} style={{ marginTop: 1, flexShrink: 0 }} />
                          <div style={{ fontSize: T.fs2, fontWeight: 500, color: T.text, fontFamily: T.font, lineHeight: T.lh }}>
                            {qa.q}
                          </div>
                        </div>
                        {qa.a ? (
                          <div style={{ padding: `${T.sp3}px ${T.sp3}px ${T.sp3}px 34px`, fontSize: T.fs2, color: T.textMid, fontFamily: T.font, lineHeight: T.lh, background: T.surface }}>
                            {qa.a}
                          </div>
                        ) : (
                          <div style={{ padding: `${T.sp2}px ${T.sp3}px ${T.sp3}px 34px`, fontSize: T.fs1, fontStyle: "italic", color: T.amber, fontFamily: T.font, background: T.surface }}>
                            Awaiting response
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}

              {/* ── LINKED DOCUMENTS ── */}
              <div style={{ marginTop: T.sp5, paddingTop: T.sp4, borderTop: `1px solid ${T.border}` }}>
                <label style={{ display: "block", fontSize: T.fs1, fontWeight: 600, color: T.textMid, letterSpacing: 0.4, marginBottom: T.sp2, fontFamily: T.font }}>
                  DOCUMENTS ({reqDocs.length})
                </label>
                {reqDocs.length === 0 && (
                  <div style={{ fontSize: T.fs2, color: T.textMuted, fontFamily: T.font, padding: `${T.sp2}px 0` }}>
                    No documents linked to {editing.reqNumber}
                  </div>
                )}
                {reqDocs.map(doc => {
                  const hasFile = !!doc.storagePath;
                  return (
                    <div key={doc.id} style={{ display: "flex", alignItems: "center", gap: T.sp2, padding: `${T.sp2}px ${T.sp3}px`,
                      borderRadius: T.r1, background: T.bg, border: `1px solid ${T.border}`, marginBottom: T.sp2,
                      cursor: hasFile ? "pointer" : "default" }}
                      onClick={() => { if (hasFile) { const url = fileGetUrl(doc.storagePath); if (url) window.open(url, "_blank"); } }}>
                      <span style={{ flexShrink: 0 }}>{hasFile ? getMimeIcon(doc.mimeType, 18, T.accent) : <Ic name="file-text" size={18} color={T.textMuted} />}</span>
                      <div style={{ flex: 1, overflow: "hidden" }}>
                        <div style={{ fontSize: T.fs2, fontWeight: 500, fontFamily: T.font, color: T.text,
                          overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{doc.name}</div>
                        <div style={{ fontSize: T.fs1, color: T.textMuted, fontFamily: T.font }}>
                          {doc.date}{hasFile ? ` \u00b7 ${formatFileSize(doc.fileSize)}` : ""}
                        </div>
                      </div>
                      {hasFile && <span style={{ fontSize: T.fs1, color: T.accent, fontFamily: T.font, flexShrink: 0 }}>View</span>}
                    </div>
                  );
                })}
                {/* Upload drop zone */}
                <div onDragOver={e => e.preventDefault()}
                  onDrop={e => { e.preventDefault(); processReqFiles(e.dataTransfer.files); }}
                  onClick={() => document.getElementById(`req-upload-${editing.id}`)?.click()}
                  style={{ border: `1.5px dashed ${T.border}`, borderRadius: T.r2, padding: `${T.sp3}px ${T.sp4}px`, textAlign: "center",
                    cursor: "pointer", background: T.bg, marginTop: T.sp2 }}>
                  {uploading.length === 0 ? (
                    <>
                      <Ic name="upload" size={18} color={T.textMuted} />
                      <div style={{ fontSize: T.fs1, color: T.textMid, fontFamily: T.font, marginTop: T.sp1 }}>
                        Drop files or <span style={{ color: T.accent, textDecoration: "underline" }}>browse</span> — auto-links to {editing.reqNumber}
                      </div>
                      <input id={`req-upload-${editing.id}`} type="file" multiple style={{ display: "none" }}
                        onChange={e => { processReqFiles(e.target.files); e.target.value = ""; }} />
                    </>
                  ) : (
                    <div style={{ textAlign: "left" }}>
                      {uploading.map((u, i) => (
                        <div key={i} style={{ display: "flex", alignItems: "center", gap: T.sp2, padding: `${T.sp1}px 0` }}>
                          <span style={{ fontSize: T.fs1, fontFamily: T.font, color: T.textMid, flex: 1,
                            overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{u.name}</span>
                          <div style={{ width: 60, height: 3, borderRadius: T.r1, background: T.border, flexShrink: 0 }}>
                            <div style={{ width: u.progress + "%", height: "100%", borderRadius: T.r1,
                              background: u.status === "error" ? T.red : u.status === "done" ? T.green : T.accent }} />
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
                {uploadSummary && (
                  <div style={{ fontSize: T.fs1, color: T.green, fontFamily: T.font, marginTop: T.sp2, textAlign: "center" }}>
                    {uploadSummary.total} file(s) uploaded and linked to {editing.reqNumber}
                  </div>
                )}
              </div>

              {/* ── BACKUP VARIANCE ── */}
              {backupData && (
                <div style={{ marginTop: T.sp4, paddingTop: T.sp3, borderTop: `1px solid ${T.border}` }}>
                  <label style={{ display: "block", fontSize: T.fs1, fontWeight: 600, color: T.textMid, letterSpacing: 0.4, marginBottom: T.sp2, fontFamily: T.font }}>
                    BACKUP VARIANCE
                  </label>
                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: T.sp2, marginBottom: T.sp3 }}>
                    {[{ label: "BILLED", val: backupData.amountBilled, color: T.text },
                      { label: "BACKUP", val: backupData.backupDocs, color: T.green },
                      { label: "DIRECT LABOR", val: backupData.directLabor, color: backupData.directLabor > 0 ? T.amber : T.textMuted }
                    ].map(c => (
                      <div key={c.label} style={{ padding: `${T.sp2}px ${T.sp2}px`, borderRadius: T.r1, background: T.bg, border: `1px solid ${T.border}` }}>
                        <div style={{ fontSize: T.fs1, color: T.textMuted, fontFamily: T.font, letterSpacing: 0.3 }}>{c.label}</div>
                        <div style={{ fontSize: T.fs2, fontWeight: 600, fontFamily: T.mono, color: c.color }}>
                          ${c.val.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                        </div>
                      </div>
                    ))}
                  </div>
                  {(() => {
                    const gap = backupData.amountBilled - backupData.backupDocs - backupData.directLabor;
                    return Math.abs(gap) > 1 ? (
                      <div style={{ padding: `${T.sp2}px ${T.sp3}px`, borderRadius: T.r1, marginBottom: T.sp3,
                        background: gap > 0 ? T.redBg : T.greenBg, border: `1px solid ${gap > 0 ? T.redBorder : T.greenBorder}`,
                        fontSize: T.fs1, fontFamily: T.font, color: gap > 0 ? T.red : T.green }}>
                        {gap > 0 ? "Unsubstantiated gap" : "Over-documented by"}: ${Math.abs(gap).toLocaleString(undefined, { minimumFractionDigits: 2 })}
                      </div>
                    ) : (
                      <div style={{ padding: `${T.sp2}px ${T.sp3}px`, borderRadius: T.r1, marginBottom: T.sp3,
                        background: T.greenBg, border: `1px solid ${T.greenBorder}`,
                        fontSize: T.fs1, fontFamily: T.font, color: T.green }}>
                        Fully substantiated
                      </div>
                    );
                  })()}
                  {backupData.items.length > 0 && (
                    <div>
                      <div style={{ fontSize: T.fs1, fontWeight: 600, color: T.textMuted, fontFamily: T.font, letterSpacing: 0.3, marginBottom: T.sp2 }}>
                        LINE ITEMS ({backupData.items.length})
                      </div>
                      {backupData.items.map((item, idx) => (
                        <div key={idx} style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start",
                          padding: `${T.sp2}px ${T.sp2}px`, borderRadius: T.r1, background: idx % 2 === 0 ? T.bg : "transparent", fontSize: T.fs1, fontFamily: T.font }}>
                          <div style={{ flex: 1, minWidth: 0 }}>
                            <div style={{ fontWeight: 500, color: T.text, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{item.desc}</div>
                            <div style={{ fontSize: T.fs1, color: T.textMuted }}>{item.trade}</div>
                          </div>
                          <div style={{ fontFamily: T.mono, fontSize: T.fs1, color: item.amount < 0 ? T.red : T.amber,
                            fontWeight: 500, flexShrink: 0, marginLeft: T.sp2 }}>
                            {item.amount < 0 ? "-" : ""}${Math.abs(item.amount).toLocaleString(undefined, { minimumFractionDigits: 2 })}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>
          </Card>
        </div>
      )}
    </div>
  );
}

// ── AUDIT RISK ────────────────────────────────────────────────────────────────
function AuditRisk({ reqs }) {
  const freq = {};
  AUDIT_FLAGS.forEach(f => { freq[f.id] = 0; });
  reqs.forEach(r => r.flags.forEach(f => { if (freq[f] !== undefined) freq[f]++; }));
  const flagged = reqs.filter(r => r.flags.length > 0);

  return (
    <div>
      <SectionTitle title="Audit Risk Analysis" subtitle={`${flagged.length} of 16 requisitions flagged — mitigate before arbitration`} />
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: T.sp4, marginBottom: T.sp4 }}>
        <Card>
          <CardLabel label="Flag Frequency Across All Requisitions" />
          {AUDIT_FLAGS.filter(f => freq[f.id] > 0).length === 0 && (
            <p style={{ fontSize: T.fs3, color: T.textMuted, fontFamily: T.font, margin: 0 }}>No flags set. Go to Requisitions to flag risks per req.</p>
          )}
          {AUDIT_FLAGS.filter(f => freq[f.id] > 0).sort((a, b) => freq[b.id] - freq[a.id]).map(flag => {
            const col = flag.risk === "HIGH" ? T.red : flag.risk === "MEDIUM" ? T.amber : T.blue;
            return (
              <div key={flag.id} style={{ marginBottom: T.sp3 }}>
                <div style={{ display: "flex", justifyContent: "space-between", marginBottom: T.sp1 }}>
                  <span style={{ fontSize: T.fs2, color: T.textMid, fontFamily: T.font, maxWidth: "80%", lineHeight: T.lh }}>{flag.label}</span>
                  <span style={{ fontFamily: T.mono, fontSize: T.fs2, color: col }}>{freq[flag.id]}</span>
                </div>
                <div style={{ height: T.sp3, background: T.border, borderRadius: T.r1 }}>
                  <div style={{ height: T.sp3, borderRadius: T.r1, background: col, width: `${(freq[flag.id] / 16) * 100}%` }} />
                </div>
              </div>
            );
          })}
        </Card>

        <Card>
          <CardLabel label="Flagged Requisitions" />
          {flagged.length === 0 && <p style={{ fontSize: T.fs3, color: T.textMuted, fontFamily: T.font, margin: 0 }}>No requisitions flagged yet.</p>}
          {flagged.map(req => {
            const risk = computeRisk(req);
            const rs = riskStyle(risk);
            return (
              <div key={req.id} style={{ display: "flex", gap: T.sp3, padding: `${T.sp3}px 0`, borderBottom: `1px solid ${T.border}` }}>
                <div>
                  <div style={{ display: "flex", alignItems: "center", gap: T.sp2, marginBottom: T.sp1 }}>
                    <span style={{ fontFamily: T.mono, fontSize: T.fs2, fontWeight: 500, color: T.accent }}>{req.reqNumber}</span>
                    <Badge label={risk} style={rs} />
                    {req.totalBilled > 0 && <Money amount={req.totalBilled} color={T.textMuted} size="xs" />}
                  </div>
                  <div style={{ fontSize: T.fs1, color: T.textMuted, fontFamily: T.font, lineHeight: T.lh }}>
                    {req.flags.map(fid => AUDIT_FLAGS.find(a => a.id === fid)?.label).filter(Boolean).join(" · ")}
                  </div>
                </div>
              </div>
            );
          })}
        </Card>
      </div>

      <Card>
        <CardLabel label="Mitigation Playbook" />
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: T.sp3 }}>
          {[
            { risk: "Blended Labor Rate", severity: "HIGH", action: "Pull W-2s, payroll registers, and workers' comp audit for all billed employees. Calculate true burdened rate: wage + FICA + WC + benefits. Document that $60/hr equals actual burdened cost. If gap exists, calculate delta and consider proactive credit." },
            { risk: "DSL Landscaping as Direct Labor", severity: "HIGH", action: "Either reclassify as subcontractor with proper invoice (scope, rates, dates, location), or obtain DSL payroll records proving $60/hr is their actual burdened rate. Landscaping at skilled trade rates unexplained is a clean target for opposing counsel." },
            { risk: "Overhead Billed as Materials", severity: "HIGH", action: "Identify every overhead line: masks, flashlights, tarps, spray paint, markers, rock salt, deicer. Total the amount. Per §9.3.1 these are contractor's responsibility. Proactively credit — better to offer than have an arbitrator award it with interest." },
            { risk: "Deficient Subcontractor Invoices", severity: "HIGH", action: "Contact H&J Improvements and DeLeonardis Electric immediately. Get revised invoices including: project address, dates of work, scope description, hourly vs lump sum basis, number of workers, total contract value, payment history. Required under §15.3.2." },
            { risk: "Markup Transparency", severity: "HIGH", action: "Review each req for 25% applied to already-marked-up sub invoices. Cost-plus markup applies to actual cost only — not to marked-up subcontractor pricing. Document the markup methodology clearly and consistently across all 16 reqs." },
            { risk: "Missing Timesheets", severity: "MEDIUM", action: "Reconstruct using daily superintendent logs, field photos with timestamps, delivery tickets, and sub pay stubs. Contemporaneous text messages between PMs can establish crew presence. Even partial documentation reduces arbitrator skepticism significantly." },
          ].map(item => (
            <div key={item.risk} style={{ padding: T.sp3, background: item.severity === "HIGH" ? T.redBg : T.amberBg, border: `1px solid ${item.severity === "HIGH" ? T.redBorder : T.amberBorder}`, borderRadius: T.r2 }}>
              <div style={{ fontSize: T.fs1, fontWeight: 600, color: item.severity === "HIGH" ? T.red : T.amber, letterSpacing: 0.3, marginBottom: T.sp2, fontFamily: T.font }}>
                {item.risk}
              </div>
              <div style={{ fontSize: T.fs2, color: T.textMid, fontFamily: T.font, lineHeight: T.lh }}>{item.action}</div>
            </div>
          ))}
        </div>
      </Card>
    </div>
  );
}

// ── CLAIMS ────────────────────────────────────────────────────────────────────
function Claims({ claims, updateClaim }) {
  const [sel, setSel] = useState(null);
  const editing = sel ? claims.find(c => c.id === sel) : null;
  const totalOwner = claims.reduce((s, c) => s + c.ownerAmount, 0);
  const totalAgreed = claims.reduce((s, c) => s + c.agreedAmount, 0);
  const ThStyle = { padding: `${T.sp3}px ${T.sp4}px`, textAlign: "left", fontSize: T.fs1, fontWeight: 600, letterSpacing: 0.5, color: T.textMuted, fontFamily: T.font, borderBottom: `1px solid ${T.border}`, background: T.bg };
  const TdStyle = { padding: `${T.sp3}px ${T.sp4}px`, fontSize: T.fs3, fontFamily: T.font, color: T.text, borderBottom: `1px solid ${T.border}` };

  return (
    <div style={{ display: "grid", gridTemplateColumns: editing ? "1fr 380px" : "1fr", gap: T.sp5, alignItems: "start" }}>
      <div>
        <SectionTitle title="Owner Claims" subtitle={`${claims.length} claims · Gross: ${$(totalOwner)} · MC Agreed: ${$(totalAgreed)}`} />
        <Card padding={0}>
          <table style={{ width: "100%", borderCollapse: "collapse" }}>
            <thead>
              <tr>
                {["#", "Description", "Owner Amt", "MC Agreed", "Status", "Defense"].map(h => (
                  <th key={h} style={ThStyle}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {claims.map(claim => {
                const ss = statusStyle(claim.status);
                const sg = strengthStyle(claim.strength);
                const active = sel === claim.id;
                return (
                  <tr key={claim.id} onClick={() => setSel(active ? null : claim.id)}
                    style={{ cursor: "pointer", background: active ? T.accentBg : "transparent", transition: T.fast }}
                    onMouseEnter={e => { if (!active) e.currentTarget.style.background = T.surfaceHover; }}
                    onMouseLeave={e => { if (!active) e.currentTarget.style.background = "transparent"; }}>
                    <td style={{ ...TdStyle, color: T.textMuted, fontFamily: T.mono, fontSize: T.fs2 }}>{claim.id}</td>
                    <td style={{ ...TdStyle, maxWidth: 280, fontSize: T.fs2 }}>{claim.description}</td>
                    <td style={TdStyle}><Money amount={claim.ownerAmount} color={T.red} size="sm" /></td>
                    <td style={TdStyle}>
                      {claim.agreedAmount > 0 ? <Money amount={claim.agreedAmount} color={T.amber} size="sm" /> : <span style={{ color: T.textMuted, fontFamily: T.font, fontSize: T.fs3 }}>—</span>}
                    </td>
                    <td style={TdStyle}><Badge label={claim.status} style={ss} /></td>
                    <td style={TdStyle}><Badge label={claim.strength} style={{ color: sg.color, bg: sg.bg, border: sg.bg }} /></td>
                  </tr>
                );
              })}
            </tbody>
            <tfoot>
              <tr style={{ background: T.bg }}>
                <td colSpan={2} style={{ ...TdStyle, fontSize: T.fs1, fontWeight: 600, color: T.textMuted, borderBottom: "none" }}>TOTALS</td>
                <td style={{ ...TdStyle, borderBottom: "none" }}><Money amount={totalOwner} color={T.red} size="sm" /></td>
                <td style={{ ...TdStyle, borderBottom: "none" }}><Money amount={totalAgreed} color={T.amber} size="sm" /></td>
                <td colSpan={2} style={{ borderBottom: "none" }} />
              </tr>
            </tfoot>
          </table>
        </Card>
      </div>

      {editing && (
        <div style={{ position: "sticky", top: 16 }}>
          <Card>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 14, paddingBottom: 14, borderBottom: `1px solid ${T.border}` }}>
              <span style={{ fontSize: 13, fontWeight: 600, color: T.text, fontFamily: T.font }}>Claim #{editing.id}</span>
              <button onClick={() => setSel(null)} style={{ background: "none", border: "none", color: T.textMuted, cursor: "pointer", fontSize: 20 }}>×</button>
            </div>
            <div style={{ fontSize: 12, color: T.textMid, lineHeight: 1.6, marginBottom: 14, padding: 10, background: T.bg, borderRadius: 6, fontFamily: T.font }}>
              {editing.description}
            </div>
            <TextInput label="Owner Amount ($)" value={editing.ownerAmount} onChange={v => updateClaim(editing.id, { ownerAmount: v })} type="number" />
            <TextInput label="MC Agreed Amount ($)" value={editing.agreedAmount} onChange={v => updateClaim(editing.id, { agreedAmount: v })} type="number" />

            <div style={{ marginBottom: 12 }}>
              <label style={{ display: "block", fontSize: 11, fontWeight: 600, color: T.textMid, letterSpacing: 0.4, marginBottom: 6, fontFamily: T.font }}>STATUS</label>
              <SegmentControl options={["DISPUTED", "AGREED", "WAIVED", "PENDING"]} value={editing.status} onChange={v => updateClaim(editing.id, { status: v })} colorFn={s => statusStyle(s)} />
            </div>

            <div style={{ marginBottom: 12 }}>
              <label style={{ display: "block", fontSize: 11, fontWeight: 600, color: T.textMid, letterSpacing: 0.4, marginBottom: 6, fontFamily: T.font }}>DEFENSE STRENGTH</label>
              <SegmentControl options={["STRONG", "MODERATE", "WEAK", "N/A"]} value={editing.strength} onChange={v => updateClaim(editing.id, { strength: v })}
                colorFn={s => { const sg = strengthStyle(s); return { color: sg.color, bg: sg.bg, border: sg.bg }; }} />
            </div>

            <div>
              <label style={{ display: "block", fontSize: 11, fontWeight: 600, color: T.textMid, letterSpacing: 0.4, marginBottom: 4, fontFamily: T.font }}>DEFENSE NOTES</label>
              <textarea value={editing.defense} onChange={e => updateClaim(editing.id, { defense: e.target.value })}
                rows={5} style={{ width: "100%", background: T.bg, border: `1px solid ${T.border}`, borderRadius: 6, padding: "8px 10px", color: T.text, fontSize: 12, outline: "none", resize: "vertical", boxSizing: "border-box", fontFamily: T.font, lineHeight: 1.6 }} />
            </div>
          </Card>
        </div>
      )}
    </div>
  );
}

// ── STRATEGY ──────────────────────────────────────────────────────────────────
function Strategy({ claims }) {
  const totalAgreed = claims.reduce((s, c) => s + c.agreedAmount, 0);
  const waivedClaims = claims.filter(c => c.status === "WAIVED").reduce((s, c) => s + c.ownerAmount, 0);
  const strongDisputed = claims.filter(c => c.status === "DISPUTED" && c.strength === "STRONG");

  return (
    <div>
      <SectionTitle title="Arbitration Strategy" subtitle="Pre-mediation positioning · AIA A110-2021 · AAA Construction Industry Rules · Elizabeth Parks as Initial Decision Maker" />
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16, marginBottom: 16 }}>
        <Card>
          <CardLabel label="Montana's Strongest Defenses" />
          {[
            { title: "§21.11 Consequential Damages Waiver", detail: `Bars ${$(waivedClaims)} delay/rental income claim and 10-yr energy cost estimates. Mutual waiver — applies equally to both parties. Clean statutory bar.` },
            { title: "125 Change Orders → Delay Causation", detail: "Owner cannot simultaneously demand 125+ changes and claim delay damages. Every day beyond 240 has a CO-driven cause. Need signed CO log with dates." },
            { title: "Owner Refused Mechanical Engineer", detail: "HVAC design-build was owner's choice. Without MEP drawings, Montana cannot be held to an unspecified design standard. Document all written requests." },
            { title: "Architect Plan Failure (R-38 vs R-49)", detail: "Montana built to the plans it received. Architect never distributed revised R-49 drawings. Owner declined upgrade twice in writing." },
            { title: "Manufacturer Approval — Fireplace", detail: "Stone supplier's rep reviewed photos and approved workmanship. Owner selected stone type, shape, color. Durock used per spec. Corrective work offered and refused." },
            { title: "Shower Glass Governed by Plan A-402", detail: "Three panes shown on contract drawing A-402. One-piece would require unspecified wall demolition and crane rigging not in any contract document." },
          ].map((item, i) => (
            <div key={i} style={{ padding: "11px 0", borderBottom: `1px solid ${T.border}` }}>
              <div style={{ display: "flex", alignItems: "flex-start", gap: 8, marginBottom: 4 }}>
                <span style={{ color: T.green, fontSize: 13, flexShrink: 0, marginTop: 1 }}>✓</span>
                <span style={{ fontSize: 13, fontWeight: 500, color: T.text, fontFamily: T.font }}>{item.title}</span>
              </div>
              <div style={{ fontSize: 12, color: T.textMuted, fontFamily: T.font, lineHeight: 1.55, paddingLeft: 21 }}>{item.detail}</div>
            </div>
          ))}
        </Card>

        <Card>
          <CardLabel label="Owner's Weakest Claims" />
          {strongDisputed.concat(claims.filter(c => c.status === "WAIVED")).map(c => (
            <div key={c.id} style={{ padding: "10px 0", borderBottom: `1px solid ${T.border}` }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 5 }}>
                <span style={{ fontSize: 12, color: T.text, fontFamily: T.font, maxWidth: "72%", lineHeight: 1.4 }}>{c.description}</span>
                <Money amount={c.ownerAmount} color={T.red} size="sm" />
              </div>
              <div style={{ display: "flex", gap: 6, marginBottom: 5 }}>
                <Badge label={c.status} style={statusStyle(c.status)} />
                <Badge label={c.strength} style={{ color: strengthStyle(c.strength).color, bg: strengthStyle(c.strength).bg, border: strengthStyle(c.strength).bg }} />
              </div>
              <div style={{ fontSize: 11, color: T.textMuted, fontFamily: T.font, lineHeight: 1.4 }}>{c.defense}</div>
            </div>
          ))}
        </Card>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
        <Card>
          <CardLabel label="Pre-Arbitration Checklist" />
          {[
            "Pull W-2s and payroll registers for all employees across all 16 requisition periods",
            "Reconcile DSL Landscaping — reclassify as subcontractor or document actual rates",
            "Identify all overhead items billed as materials — total, then proactively credit",
            "Get compliant revised invoice from H&J Improvements Corp. (Invoice #1316)",
            "Get full subcontract scope from DeLeonardis Electric — job tickets 2544 and 2681",
            "Compile all 125 change orders with signed documents, scope, and pricing",
            "Document all owner refusals to hire mechanical engineer (email/letter trail)",
            "Secure record of two instances owner declined R-49 insulation upgrade",
            "Get stone manufacturer rep's written approval of fireplace photos",
            "Compile weekly meeting minutes confirming HVAC soffit locations",
            "Document all subcontractor payment records to rebut non-payment narrative",
            "Assess LAN Associates plumbing audit — confirm no additional claims from 2\" main finding",
          ].map((item, i) => (
            <label key={i} style={{ display: "flex", gap: 10, padding: "9px 0", borderBottom: `1px solid ${T.border}`, alignItems: "flex-start", cursor: "pointer" }}>
              <input type="checkbox" style={{ accentColor: T.accent, marginTop: 2, flexShrink: 0, width: 14, height: 14 }} />
              <span style={{ fontSize: 12, color: T.textMid, fontFamily: T.font, lineHeight: 1.5 }}>{item}</span>
            </label>
          ))}
        </Card>

        <Card>
          <CardLabel label="Key Contract Sections — Quick Reference" />
          {[
            ["§15.3.2", "Cost-plus documentation required: payrolls, petty cash, receipted invoices, check vouchers"],
            ["§9.3.1", "Contractor pays for tools, equipment, facilities — NOT billable to owner as materials"],
            ["§9.3.3", "Substitutions require owner consent + architect evaluation + formal contract modification"],
            ["§8.3", "Owner's right to carry out work after 10-day notice of contractor default"],
            ["§8.4", "Non-disparagement — mutual. Bars telling subs 'owners don't pay bills'"],
            ["§9.4", "Contractor warranty — work free from defects, conforming to contract documents"],
            ["§21.11", "Mutual waiver of consequential damages — BARS delay and rental income claims"],
            ["§20.2", "Owner termination for cause — requires architect certification of sufficient cause"],
            ["§15.4.3", "Architect may withhold certificate for defective work not remedied"],
            ["§11.2", "Contractor must notify owner and architect of all subcontractors — audit compliance"],
            ["§15.5.1", "Pay subs within 7 days of receiving owner payment — audit all 16 reqs"],
            ["§2.3.1", "Substantial completion: 240 calendar days — exceeded by 419 days (125 COs)"],
          ].map(([sec, desc]) => (
            <div key={sec} style={{ display: "flex", gap: 14, padding: "9px 0", borderBottom: `1px solid ${T.border}` }}>
              <span style={{ fontFamily: T.mono, fontSize: 12, fontWeight: 500, color: T.accent, minWidth: 56, flexShrink: 0 }}>{sec}</span>
              <span style={{ fontSize: 12, color: T.textMid, fontFamily: T.font, lineHeight: 1.5 }}>{desc}</span>
            </div>
          ))}
        </Card>
      </div>
    </div>
  );
}

// [Reconciliation + BackupVariance deleted — merged into Requisitions tab]

// ── PDF VIEWER MODAL ─────────────────────────────────────────────────────────
function PdfViewerModal({ invoiceId, fileName, onClose }) {
  const [blobUrl, setBlobUrl] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    let url = null;
    (async () => {
      try {
        const blob = await idbGet("attach-" + invoiceId);
        if (!blob) { setError("PDF not found in storage"); setLoading(false); return; }
        url = URL.createObjectURL(blob);
        setBlobUrl(url);
      } catch (e) { setError(e.message); }
      setLoading(false);
    })();
    return () => { if (url) URL.revokeObjectURL(url); };
  }, [invoiceId]);

  return (
    <div onClick={onClose} style={{
      position: "fixed", inset: 0, zIndex: 9999, background: "rgba(0,0,0,0.6)",
      display: "flex", alignItems: "center", justifyContent: "center",
      backdropFilter: "blur(4px)", animation: "fadeInUp 0.2s ease",
    }}>
      <div onClick={e => e.stopPropagation()} style={{
        width: "90vw", maxWidth: 1000, height: "85vh", background: T.surface,
        borderRadius: 16, boxShadow: T.sh3, display: "flex", flexDirection: "column", overflow: "hidden",
      }}>
        {/* Header */}
        <div style={{
          padding: "14px 20px", borderBottom: `1px solid ${T.border}`, display: "flex",
          alignItems: "center", justifyContent: "space-between", background: T.bg, flexShrink: 0,
        }}>
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <Ic name="file-text" size={18} color={T.accent} />
            <div>
              <div style={{ fontSize: 14, fontWeight: 600, color: T.text, fontFamily: T.font }}>{invoiceId}</div>
              <div style={{ fontSize: 11, color: T.textMuted }}>{fileName}</div>
            </div>
          </div>
          <div style={{ display: "flex", gap: 8 }}>
            {blobUrl && (
              <a href={blobUrl} download={fileName} style={{
                padding: "6px 12px", fontSize: 11, fontWeight: 500, fontFamily: T.font,
                background: T.accentBg, color: T.accent, border: `1px solid ${T.accentBorder}`,
                borderRadius: 8, cursor: "pointer", textDecoration: "none",
                display: "inline-flex", alignItems: "center", gap: 5,
              }}><Ic name="download" size={12} color={T.accent} />Download</a>
            )}
            {blobUrl && (
              <button onClick={() => window.open(blobUrl, "_blank")} style={{
                padding: "6px 12px", fontSize: 11, fontWeight: 500, fontFamily: T.font,
                background: T.blueBg, color: T.blue, border: `1px solid ${T.blueBorder}`,
                borderRadius: 8, cursor: "pointer", display: "inline-flex", alignItems: "center", gap: 5,
              }}><Ic name="external-link" size={12} color={T.blue} />New Tab</button>
            )}
            <button onClick={onClose} style={{
              background: "none", border: `1px solid ${T.border}`, borderRadius: 8,
              padding: "6px 10px", cursor: "pointer", display: "flex", alignItems: "center",
            }}><Ic name="x" size={14} color={T.textMuted} /></button>
          </div>
        </div>
        {/* Body */}
        <div style={{ flex: 1, overflow: "hidden" }}>
          {loading && <div style={{ display: "flex", alignItems: "center", justifyContent: "center", height: "100%", color: T.textMuted, fontSize: 13 }}>Loading PDF...</div>}
          {error && <div style={{ display: "flex", alignItems: "center", justifyContent: "center", height: "100%", color: T.red, fontSize: 13 }}>{error}</div>}
          {blobUrl && <iframe src={blobUrl + "#toolbar=1&navpanes=0"} title={fileName} style={{ width: "100%", height: "100%", border: "none" }} />}
        </div>
      </div>
    </div>
  );
}

// ── INVOICE CATALOGUE TAB ────────────────────────────────────────────────────
function InvoiceCatalogue({ attachments, onAttach, onDetach }) {
  const [search, setSearch] = useState("");
  const [reqFilter, setReqFilter] = useState("all");
  const [typeFilter, setTypeFilter] = useState("all");
  const [backupFilter, setBackupFilter] = useState("all");
  const [attachFilter, setAttachFilter] = useState("all");
  const [sortCol, setSortCol] = useState("id");
  const [sortDir, setSortDir] = useState(1);
  const [viewingPdf, setViewingPdf] = useState(null);  // { invoiceId, fileName }
  const [bulkUploading, setBulkUploading] = useState(false);
  const [bulkResults, setBulkResults] = useState(null); // { matched, unmatched, total }
  const [unmatchedFiles, setUnmatchedFiles] = useState([]); // [{ file, name, suggestions }]
  const [manualAssignments, setManualAssignments] = useState({}); // { idx: invoiceId }
  const [matchSearch, setMatchSearch] = useState({}); // { idx: searchString }
  const fileInputRef = useRef(null);
  const bulkInputRef = useRef(null);
  const reqUploadRef = useRef(null);
  const [uploadTarget, setUploadTarget] = useState(null); // invoice id for single upload
  const [reqUploadTarget, setReqUploadTarget] = useState(null); // req number for req-level upload
  const [reqUploadResults, setReqUploadResults] = useState(null); // { req, count }

  // Unique vendors for display
  const uniqueVendors = useMemo(() => [...new Set(INVOICE_CATALOGUE.map(e => e.vendor))].sort(), []);
  const uniqueReqs = useMemo(() => [...new Set(INVOICE_CATALOGUE.map(e => e.req))].sort((a, b) => a - b), []);

  const attachedCount = useMemo(() => Object.keys(attachments).length, [attachments]);

  // Filter & search
  const filtered = useMemo(() => {
    let items = INVOICE_CATALOGUE;
    if (reqFilter !== "all") items = items.filter(e => e.req === parseInt(reqFilter));
    if (typeFilter !== "all") items = items.filter(e => e.type === typeFilter);
    if (backupFilter === "yes") items = items.filter(e => e.hasBackup);
    if (backupFilter === "no") items = items.filter(e => !e.hasBackup);
    if (attachFilter === "attached") items = items.filter(e => attachments[e.id]);
    if (attachFilter === "unattached") items = items.filter(e => !attachments[e.id]);
    if (search.trim()) {
      const q = search.trim().toLowerCase();
      items = items.filter(e =>
        e.id.toLowerCase().includes(q) ||
        e.vendor.toLowerCase().includes(q) ||
        e.desc.toLowerCase().includes(q) ||
        String(e.amount).includes(q)
      );
    }
    // Sort
    items = [...items].sort((a, b) => {
      if (sortCol === "id") {
        if (a.req !== b.req) return (a.req - b.req) * sortDir;
        return a.id.localeCompare(b.id) * sortDir;
      }
      if (sortCol === "vendor") return a.vendor.localeCompare(b.vendor) * sortDir;
      if (sortCol === "amount") return (a.amount - b.amount) * sortDir;
      if (sortCol === "req") return (a.req - b.req) * sortDir;
      return 0;
    });
    return items;
  }, [search, reqFilter, typeFilter, backupFilter, attachFilter, sortCol, sortDir, attachments]);

  const totalAmount = filtered.reduce((s, e) => s + e.amount, 0);
  const withBackup = filtered.filter(e => e.hasBackup).length;
  const missingBackup = filtered.filter(e => !e.hasBackup).length;

  const handleSort = (col) => {
    if (sortCol === col) setSortDir(d => d * -1);
    else { setSortCol(col); setSortDir(1); }
  };

  const SortArrow = ({ col }) => sortCol === col ? (sortDir === 1 ? " \u25B2" : " \u25BC") : "";

  const typeBadge = (type) => {
    const styles = {
      invoice: { color: T.blue, bg: T.blueBg, border: T.blueBorder },
      "self-performed": { color: T.purple, bg: T.purpleBg, border: T.purpleBorder },
      credit: { color: T.red, bg: T.redBg, border: T.redBorder },
    };
    const s = styles[type] || styles.invoice;
    return (
      <span style={{ fontSize: 10, fontWeight: 600, padding: "2px 8px", borderRadius: 6, background: s.bg, color: s.color, border: `1px solid ${s.border}`, textTransform: "capitalize", letterSpacing: 0.3 }}>
        {type === "self-performed" ? "Self" : type}
      </span>
    );
  };

  // Single file upload handler
  const handleSingleUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file || !uploadTarget) return;
    try {
      await idbPut("attach-" + uploadTarget, file);
      onAttach(uploadTarget, { fileName: file.name, size: file.size, date: new Date().toISOString().slice(0, 10) });
    } catch (err) { console.error("Upload failed:", err); }
    setUploadTarget(null);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  // Build vendor lookup index for fuzzy matching
  const vendorIndex = useMemo(() => {
    const idx = {};
    INVOICE_CATALOGUE.forEach(inv => {
      const vKey = inv.vendor.toLowerCase();
      if (!idx[vKey]) idx[vKey] = [];
      idx[vKey].push(inv);
    });
    return idx;
  }, []);

  // Try to match a filename to an invoice ID (R-code match, then vendor fallback)
  // Returns { id, confidence } for single-invoice match, or { reqMatch: N } for whole-req match
  const matchFileToInvoice = (fileName) => {
    const allIds = new Set(INVOICE_CATALOGUE.map(inv => inv.id.toLowerCase()));
    const nameNoExt = fileName.replace(/\.[^.]+$/, "");

    // Pass 0: Requisition-level filename (e.g. "Req #1 Backup (5).pdf", "REQ-01.pdf", "Req 1.pdf")
    const reqPatterns = [
      /\bReq(?:uisition)?\s*#?\s*(\d{1,2})\b/i,
      /\bREQ[\s_-]*(\d{1,2})\b/i,
    ];
    for (const pat of reqPatterns) {
      const m = nameNoExt.match(pat);
      if (m) {
        const reqNum = parseInt(m[1], 10);
        const reqInvoices = INVOICE_CATALOGUE.filter(inv => inv.req === reqNum);
        if (reqInvoices.length > 0) return { reqMatch: reqNum, confidence: "req" };
      }
    }

    // Pass 1: R-code patterns
    const patterns = [
      /\b(R\d{2}-\d{3}[a-z]?)\b/i,
      /\b(R\d{2}_\d{3}[a-z]?)\b/i,
      /\b(R\d{2}\s\d{3}[a-z]?)\b/i,
      /\b(R\d{2}\d{3}[a-z]?)\b/i,
    ];
    for (const pat of patterns) {
      const m = nameNoExt.match(pat);
      if (m) {
        let candidate = m[1].replace(/[\s_]/g, "-").toUpperCase();
        if (/^R\d{5,}/.test(candidate)) candidate = candidate.slice(0, 3) + "-" + candidate.slice(3);
        const last = m[1].slice(-1);
        if (/[a-z]/.test(last)) candidate = candidate.slice(0, -1) + last;
        if (allIds.has(candidate.toLowerCase())) return { id: candidate, confidence: "exact" };
        const noSuffix = candidate.replace(/[a-z]$/, "");
        if (allIds.has(noSuffix.toLowerCase())) return { id: noSuffix, confidence: "exact" };
      }
    }

    // Pass 2: loose R-code in normalized string
    const norm = nameNoExt.toLowerCase().replace(/[\s_-]/g, "");
    for (const id of allIds) {
      if (norm.includes(id.replace("-", ""))) return { id: id.toUpperCase(), confidence: "exact" };
    }

    // Pass 3: vendor name matching
    const nameLower = nameNoExt.toLowerCase();
    const vendorMatches = [];
    for (const [vKey, invoices] of Object.entries(vendorIndex)) {
      // Check if vendor name (or significant portion) appears in filename
      const vendorWords = vKey.split(/\s+/).filter(w => w.length > 2);
      const nameWords = nameLower.split(/[\s_\-.,]+/);
      // Match if the vendor's distinctive word(s) appear in filename
      const matchedWords = vendorWords.filter(vw => nameWords.some(nw => nw.includes(vw) || vw.includes(nw)));
      if (matchedWords.length > 0 && matchedWords.length >= Math.min(vendorWords.length, 1)) {
        // Filter to unattached invoices for this vendor
        const unattached = invoices.filter(inv => !attachments[inv.id]);
        vendorMatches.push(...unattached.map(inv => ({ ...inv, matchScore: matchedWords.length / vendorWords.length })));
      }
    }

    if (vendorMatches.length === 1) {
      // Unambiguous vendor match — single unattached invoice for this vendor
      return { id: vendorMatches[0].id, confidence: "vendor" };
    }

    // Return suggestions for manual match panel
    const suggestions = vendorMatches.length > 0
      ? vendorMatches.sort((a, b) => b.matchScore - a.matchScore).slice(0, 8)
      : [];
    return { id: null, confidence: "none", suggestions };
  };

  // Bulk upload — auto-match filenames to invoice IDs with vendor fallback
  const handleBulkUpload = async (e) => {
    const files = Array.from(e.target.files || []);
    if (!files.length) return;
    setBulkUploading(true);
    setBulkResults(null);
    setUnmatchedFiles([]);
    setManualAssignments({});
    setMatchSearch({});

    let matched = 0, vendorMatched = 0, reqMatched = 0;
    const pendingUnmatched = [];

    for (const file of files) {
      const result = matchFileToInvoice(file.name);
      if (result.reqMatch != null) {
        // Whole-requisition PDF — attach to all invoice lines in that req
        const reqInvoices = INVOICE_CATALOGUE.filter(inv => inv.req === result.reqMatch);
        for (const inv of reqInvoices) {
          await idbPut("attach-" + inv.id, file);
          onAttach(inv.id, { fileName: file.name, size: file.size, date: new Date().toISOString().slice(0, 10) });
        }
        matched += reqInvoices.length;
        reqMatched++;
      } else if (result.id) {
        const canonical = INVOICE_CATALOGUE.find(inv => inv.id.toLowerCase() === result.id.toLowerCase())?.id || result.id;
        await idbPut("attach-" + canonical, file);
        onAttach(canonical, { fileName: file.name, size: file.size, date: new Date().toISOString().slice(0, 10) });
        matched++;
        if (result.confidence === "vendor") vendorMatched++;
      } else {
        pendingUnmatched.push({ file, name: file.name, suggestions: result.suggestions || [] });
      }
    }

    setBulkResults({ matched, vendorMatched, reqMatched, unmatched: pendingUnmatched.map(u => u.name), total: files.length });
    setUnmatchedFiles(pendingUnmatched);
    setBulkUploading(false);
    if (bulkInputRef.current) bulkInputRef.current.value = "";
  };

  // Manual match: assign an unmatched file to an invoice
  const handleManualAssign = async (idx, invoiceId) => {
    const entry = unmatchedFiles[idx];
    if (!entry || !invoiceId) return;
    const canonical = INVOICE_CATALOGUE.find(inv => inv.id.toLowerCase() === invoiceId.toLowerCase())?.id || invoiceId;
    await idbPut("attach-" + canonical, entry.file);
    onAttach(canonical, { fileName: entry.name, size: entry.file.size, date: new Date().toISOString().slice(0, 10) });
    // Remove from unmatched list
    setUnmatchedFiles(prev => prev.filter((_, i) => i !== idx));
    setManualAssignments(prev => { const n = { ...prev }; delete n[idx]; return n; });
    setMatchSearch(prev => { const n = { ...prev }; delete n[idx]; return n; });
    // Update results count
    setBulkResults(prev => prev ? { ...prev, matched: prev.matched + 1, unmatched: prev.unmatched.filter(n => n !== entry.name) } : prev);
  };

  // Skip an unmatched file
  const handleSkipUnmatched = (idx) => {
    setUnmatchedFiles(prev => prev.filter((_, i) => i !== idx));
    setManualAssignments(prev => { const n = { ...prev }; delete n[idx]; return n; });
    setMatchSearch(prev => { const n = { ...prev }; delete n[idx]; return n; });
  };

  // REQ-level upload — attach one bundled PDF to all invoice lines for a REQ
  const handleReqUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file || !reqUploadTarget) return;
    const reqInvoices = INVOICE_CATALOGUE.filter(inv => inv.req === reqUploadTarget);
    let count = 0;
    for (const inv of reqInvoices) {
      await idbPut("attach-" + inv.id, file);
      onAttach(inv.id, { fileName: file.name, size: file.size, date: new Date().toISOString().slice(0, 10) });
      count++;
    }
    setReqUploadResults({ req: reqUploadTarget, count });
    setReqUploadTarget(null);
    if (reqUploadRef.current) reqUploadRef.current.value = "";
  };

  // Remove attachment
  const handleDetach = async (invoiceId) => {
    try {
      await idbDelete("attach-" + invoiceId);
      onDetach(invoiceId);
    } catch (err) { console.error("Detach failed:", err); }
  };

  return (
    <div>
      <SectionTitle title="Invoice Catalogue" subtitle={`${INVOICE_CATALOGUE.length} base contract invoices catalogued across REQs 1\u201315 \u00B7 ${attachedCount} PDF${attachedCount !== 1 ? "s" : ""} attached`} />

      {/* Hidden file inputs */}
      <input ref={fileInputRef} type="file" accept=".pdf,image/*" style={{ display: "none" }} onChange={handleSingleUpload} />
      <input ref={bulkInputRef} type="file" accept=".pdf,image/*" multiple style={{ display: "none" }} onChange={handleBulkUpload} />
      <input ref={reqUploadRef} type="file" accept=".pdf,image/*" style={{ display: "none" }} onChange={handleReqUpload} />

      {/* KPI Row */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(6, 1fr)", gap: 12, marginBottom: 16 }}>
        <Card padding={16}>
          <div style={{ fontSize: 10, fontWeight: 600, color: T.textMuted, letterSpacing: 0.5, textTransform: "uppercase", marginBottom: 4 }}>Catalogued</div>
          <div style={{ fontSize: 22, fontWeight: 700, color: T.text, fontFamily: T.mono }}>{INVOICE_CATALOGUE.length}</div>
          <div style={{ fontSize: 10, color: T.textMuted }}>invoices</div>
        </Card>
        <Card padding={16}>
          <div style={{ fontSize: 10, fontWeight: 600, color: T.textMuted, letterSpacing: 0.5, textTransform: "uppercase", marginBottom: 4 }}>Showing</div>
          <div style={{ fontSize: 22, fontWeight: 700, color: T.accent, fontFamily: T.mono }}>{filtered.length}</div>
          <div style={{ fontSize: 10, color: T.textMuted }}>matching filters</div>
        </Card>
        <Card padding={16}>
          <div style={{ fontSize: 10, fontWeight: 600, color: T.textMuted, letterSpacing: 0.5, textTransform: "uppercase", marginBottom: 4 }}>Total Value</div>
          <div style={{ fontSize: 22, fontWeight: 700, color: totalAmount < 0 ? T.red : T.text, fontFamily: T.mono }}>${Math.abs(totalAmount).toLocaleString(undefined, { minimumFractionDigits: 2 })}</div>
          <div style={{ fontSize: 10, color: T.textMuted }}>{totalAmount < 0 ? "net credit" : "filtered total"}</div>
        </Card>
        <Card padding={16}>
          <div style={{ fontSize: 10, fontWeight: 600, color: T.textMuted, letterSpacing: 0.5, textTransform: "uppercase", marginBottom: 4 }}>Has Backup</div>
          <div style={{ fontSize: 22, fontWeight: 700, color: T.green, fontFamily: T.mono }}>{withBackup}</div>
          <div style={{ fontSize: 10, color: T.textMuted }}>{filtered.length > 0 ? Math.round(withBackup / filtered.length * 100) : 0}% of filtered</div>
        </Card>
        <Card padding={16}>
          <div style={{ fontSize: 10, fontWeight: 600, color: T.textMuted, letterSpacing: 0.5, textTransform: "uppercase", marginBottom: 4 }}>Missing Backup</div>
          <div style={{ fontSize: 22, fontWeight: 700, color: missingBackup > 0 ? T.red : T.green, fontFamily: T.mono }}>{missingBackup}</div>
          <div style={{ fontSize: 10, color: T.textMuted }}>{missingBackup > 0 ? "needs attention" : "all documented"}</div>
        </Card>
        <Card padding={16} style={{ border: `1px solid ${T.accentBorder}`, background: T.accentBg }}>
          <div style={{ fontSize: 10, fontWeight: 600, color: T.accent, letterSpacing: 0.5, textTransform: "uppercase", marginBottom: 4 }}>PDFs Attached</div>
          <div style={{ fontSize: 22, fontWeight: 700, color: T.accent, fontFamily: T.mono }}>{attachedCount}</div>
          <div style={{ fontSize: 10, color: T.textMuted }}>{INVOICE_CATALOGUE.length > 0 ? Math.round(attachedCount / INVOICE_CATALOGUE.length * 100) : 0}% coverage</div>
        </Card>
      </div>

      {/* Bulk Upload Banner */}
      <Card style={{ marginBottom: 16, border: `1px dashed ${T.accentBorder}`, background: T.accentBg }} padding={16}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 16 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
            <Ic name="upload" size={20} color={T.accent} />
            <div>
              <div style={{ fontSize: 13, fontWeight: 600, color: T.text }}>Bulk Attach PDFs</div>
              <div style={{ fontSize: 11, color: T.textMid }}>
                Select files — auto-matches by R-code, vendor name, or requisition number (e.g., <span style={{ fontFamily: T.mono, fontSize: 10 }}>Req #1 Backup.pdf</span>)
              </div>
            </div>
          </div>
          <button onClick={() => bulkInputRef.current?.click()} disabled={bulkUploading}
            style={{
              padding: "8px 20px", fontSize: 12, fontWeight: 600, fontFamily: T.font,
              background: T.accent, color: "#fff", border: "none", borderRadius: 8,
              cursor: bulkUploading ? "wait" : "pointer", opacity: bulkUploading ? 0.6 : 1,
              display: "inline-flex", alignItems: "center", gap: 6, whiteSpace: "nowrap",
            }}>
            <Ic name="upload" size={14} color="#fff" />
            {bulkUploading ? "Processing..." : "Select Files"}
          </button>
        </div>
        {bulkResults && (
          <div style={{ marginTop: 12, padding: 12, borderRadius: 8, background: T.surface, border: `1px solid ${T.border}` }}>
            <div style={{ fontSize: 12, fontWeight: 600, color: T.text, marginBottom: 4 }}>
              Upload Complete: {bulkResults.total} file{bulkResults.total !== 1 ? "s" : ""} processed{bulkResults.reqMatched > 0 ? ` — ${bulkResults.matched} invoice lines linked` : ` — ${bulkResults.matched} matched`}
            </div>
            {bulkResults.reqMatched > 0 && (
              <div style={{ fontSize: 11, color: T.green, marginBottom: 2 }}>
                <Ic name="check" size={12} color={T.green} /> {bulkResults.reqMatched} requisition PDF{bulkResults.reqMatched !== 1 ? "s" : ""} attached to {bulkResults.matched} invoice lines
              </div>
            )}
            {bulkResults.matched > 0 && !bulkResults.reqMatched && (
              <div style={{ fontSize: 11, color: T.green, marginBottom: 2 }}>
                <Ic name="check" size={12} color={T.green} /> {bulkResults.matched} file{bulkResults.matched !== 1 ? "s" : ""} attached to matching invoices
                {bulkResults.vendorMatched > 0 && <span style={{ color: T.textMid }}> ({bulkResults.vendorMatched} via vendor name match)</span>}
              </div>
            )}
            {unmatchedFiles.length === 0 && bulkResults.unmatched.length === 0 && (
              <button onClick={() => setBulkResults(null)} style={{ marginTop: 6, fontSize: 10, color: T.textMuted, background: "none", border: "none", cursor: "pointer", textDecoration: "underline" }}>Dismiss</button>
            )}
          </div>
        )}

        {/* Manual Match Panel for unmatched files */}
        {unmatchedFiles.length > 0 && (
          <div style={{ marginTop: 12, padding: 16, borderRadius: 8, background: T.amberBg, border: `1px solid ${T.amberBorder}` }}>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 12 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                <Ic name="alert" size={16} color={T.amber} />
                <span style={{ fontSize: 13, fontWeight: 600, color: T.text }}>{unmatchedFiles.length} file{unmatchedFiles.length !== 1 ? "s" : ""} need{unmatchedFiles.length === 1 ? "s" : ""} manual matching</span>
              </div>
              <button onClick={() => { setUnmatchedFiles([]); setManualAssignments({}); setMatchSearch({}); }}
                style={{ fontSize: 11, color: T.textMid, background: "none", border: "none", cursor: "pointer", textDecoration: "underline" }}>Skip All</button>
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
              {unmatchedFiles.map((entry, idx) => {
                const sq = (matchSearch[idx] || "").toLowerCase();
                // Filter catalogue for the search/dropdown
                const candidates = sq.length > 0
                  ? INVOICE_CATALOGUE.filter(inv => !attachments[inv.id] && (
                      inv.id.toLowerCase().includes(sq) ||
                      inv.vendor.toLowerCase().includes(sq) ||
                      inv.desc.toLowerCase().includes(sq) ||
                      String(inv.amount).includes(sq)
                    )).slice(0, 10)
                  : entry.suggestions.length > 0
                    ? entry.suggestions.filter(inv => !attachments[inv.id]).slice(0, 6)
                    : [];
                return (
                  <div key={idx} style={{ display: "flex", alignItems: "center", gap: 10, padding: 10, background: T.surface, borderRadius: 8, border: `1px solid ${T.border}` }}>
                    {/* Filename */}
                    <div style={{ flex: "0 0 240px", overflow: "hidden" }}>
                      <div style={{ fontSize: 12, fontWeight: 500, color: T.text, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }} title={entry.name}>
                        <Ic name="file-text" size={13} color={T.textMid} /> {entry.name}
                      </div>
                    </div>
                    {/* Arrow */}
                    <Ic name="chevron-r" size={14} color={T.textMuted} />
                    {/* Search + suggestions */}
                    <div style={{ flex: 1, position: "relative" }}>
                      <input
                        type="text"
                        placeholder="Search by vendor, R-code, amount..."
                        value={matchSearch[idx] || ""}
                        onChange={e => setMatchSearch(prev => ({ ...prev, [idx]: e.target.value }))}
                        style={{
                          width: "100%", padding: "6px 10px", fontSize: 12, fontFamily: T.font,
                          border: `1px solid ${T.border}`, borderRadius: 6, background: T.bg, color: T.text,
                          outline: "none", boxSizing: "border-box",
                        }}
                      />
                      {candidates.length > 0 && (
                        <div style={{ display: "flex", flexWrap: "wrap", gap: 4, marginTop: 6 }}>
                          {candidates.map(inv => (
                            <button key={inv.id} onClick={() => handleManualAssign(idx, inv.id)}
                              style={{
                                padding: "3px 8px", fontSize: 10, fontFamily: T.font, fontWeight: 500,
                                background: T.blueBg, color: T.blue, border: `1px solid ${T.blueBorder}`,
                                borderRadius: 4, cursor: "pointer", whiteSpace: "nowrap",
                                display: "inline-flex", alignItems: "center", gap: 4,
                              }}>
                              <span style={{ fontFamily: T.mono, fontWeight: 600 }}>{inv.id}</span>
                              <span style={{ color: T.textMid }}>{inv.vendor}</span>
                              <span style={{ color: T.textMuted }}>${inv.amount.toLocaleString()}</span>
                            </button>
                          ))}
                        </div>
                      )}
                      {sq.length > 0 && candidates.length === 0 && (
                        <div style={{ fontSize: 11, color: T.textMuted, marginTop: 4 }}>No matching invoices found</div>
                      )}
                      {sq.length === 0 && candidates.length === 0 && (
                        <div style={{ fontSize: 11, color: T.textMuted, marginTop: 4 }}>Type to search the invoice catalogue</div>
                      )}
                    </div>
                    {/* Skip button */}
                    <button onClick={() => handleSkipUnmatched(idx)}
                      style={{ padding: "4px 8px", fontSize: 10, color: T.textMuted, background: "none", border: `1px solid ${T.border}`, borderRadius: 4, cursor: "pointer", whiteSpace: "nowrap" }}>
                      Skip
                    </button>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </Card>

      {/* Upload by Requisition */}
      <Card style={{ marginBottom: T.sp4, border: `1px dashed ${T.blueBorder}`, background: T.blueBg }} padding={T.sp4}>
        <div style={{ display: "flex", alignItems: "center", gap: T.sp3, marginBottom: T.sp3 }}>
          <Ic name="folder" size={20} color={T.blue} />
          <div>
            <div style={{ fontSize: T.fs3, fontWeight: 600, color: T.text }}>Upload by Requisition</div>
            <div style={{ fontSize: T.fs1, color: T.textMid }}>
              Attach one bundled PDF to all invoice lines for an entire REQ at once
            </div>
          </div>
        </div>
        <div style={{ display: "flex", flexWrap: "wrap", gap: T.sp2 }}>
          {uniqueReqs.map(r => {
            const reqInvoices = INVOICE_CATALOGUE.filter(inv => inv.req === r);
            const allAttached = reqInvoices.every(inv => attachments[inv.id]);
            const someAttached = reqInvoices.some(inv => attachments[inv.id]);
            return (
              <button key={r} onClick={() => { setReqUploadTarget(r); setTimeout(() => reqUploadRef.current?.click(), 50); }}
                style={{
                  padding: `${T.sp1}px ${T.sp3}px`, fontSize: T.fs2, fontWeight: 600, fontFamily: T.mono,
                  background: allAttached ? T.greenBg : T.surface, color: allAttached ? T.green : someAttached ? T.amber : T.text,
                  border: `1px solid ${allAttached ? T.greenBorder : someAttached ? T.amberBorder : T.border}`,
                  borderRadius: T.r1, cursor: "pointer", display: "inline-flex", alignItems: "center", gap: T.sp1,
                  transition: T.fast,
                }}>
                {allAttached && <Ic name="check" size={12} color={T.green} />}
                REQ-{String(r).padStart(2, "0")}
                <span style={{ fontSize: 10, fontWeight: 400, color: T.textMuted, fontFamily: T.font }}>({reqInvoices.length})</span>
              </button>
            );
          })}
        </div>
        {reqUploadResults && (
          <div style={{ marginTop: T.sp3, padding: T.sp2, borderRadius: T.r1, background: T.surface, border: `1px solid ${T.border}`, display: "flex", alignItems: "center", gap: T.sp2 }}>
            <Ic name="check" size={14} color={T.green} />
            <span style={{ fontSize: T.fs2, color: T.green, fontWeight: 500 }}>
              REQ-{String(reqUploadResults.req).padStart(2, "0")}: PDF attached to {reqUploadResults.count} invoice lines
            </span>
            <button onClick={() => setReqUploadResults(null)} style={{ marginLeft: "auto", fontSize: 10, color: T.textMuted, background: "none", border: "none", cursor: "pointer", textDecoration: "underline" }}>Dismiss</button>
          </div>
        )}
      </Card>

      {/* Search + Filters */}
      <Card style={{ marginBottom: 16 }} padding={16}>
        <div style={{ display: "flex", gap: 12, alignItems: "center", flexWrap: "wrap" }}>
          <div style={{ position: "relative", flex: "1 1 280px" }}>
            <Ic name="search" size={14} color={T.textMuted} style={{ position: "absolute", left: 10, top: "50%", transform: "translateY(-50%)" }} />
            <input
              type="text" placeholder="Search R-code, vendor, description, amount..."
              value={search} onChange={e => setSearch(e.target.value)}
              style={{
                width: "100%", padding: "8px 12px 8px 32px", fontSize: 13, fontFamily: T.font,
                border: `1px solid ${T.border}`, borderRadius: 8, background: T.bg, color: T.text,
                outline: "none", boxSizing: "border-box",
              }}
            />
          </div>
          <select value={reqFilter} onChange={e => setReqFilter(e.target.value)}
            style={{ padding: "8px 12px", fontSize: 12, fontFamily: T.font, border: `1px solid ${T.border}`, borderRadius: 8, background: T.bg, color: T.text, cursor: "pointer" }}>
            <option value="all">All REQs</option>
            {uniqueReqs.map(r => <option key={r} value={r}>REQ-{String(r).padStart(2, "0")}</option>)}
          </select>
          <select value={typeFilter} onChange={e => setTypeFilter(e.target.value)}
            style={{ padding: "8px 12px", fontSize: 12, fontFamily: T.font, border: `1px solid ${T.border}`, borderRadius: 8, background: T.bg, color: T.text, cursor: "pointer" }}>
            <option value="all">All Types</option>
            <option value="invoice">Invoice</option>
            <option value="self-performed">Self-Performed</option>
            <option value="credit">Credit</option>
          </select>
          <select value={backupFilter} onChange={e => setBackupFilter(e.target.value)}
            style={{ padding: "8px 12px", fontSize: 12, fontFamily: T.font, border: `1px solid ${T.border}`, borderRadius: 8, background: T.bg, color: T.text, cursor: "pointer" }}>
            <option value="all">All Backup Status</option>
            <option value="yes">Has Backup</option>
            <option value="no">Missing Backup</option>
          </select>
          <select value={attachFilter} onChange={e => setAttachFilter(e.target.value)}
            style={{ padding: "8px 12px", fontSize: 12, fontFamily: T.font, border: `1px solid ${T.accentBorder}`, borderRadius: 8, background: T.accentBg, color: T.accent, cursor: "pointer", fontWeight: 500 }}>
            <option value="all">All Attachments</option>
            <option value="attached">Has PDF</option>
            <option value="unattached">No PDF</option>
          </select>
          {(search || reqFilter !== "all" || typeFilter !== "all" || backupFilter !== "all" || attachFilter !== "all") && (
            <button onClick={() => { setSearch(""); setReqFilter("all"); setTypeFilter("all"); setBackupFilter("all"); setAttachFilter("all"); }}
              style={{ padding: "8px 14px", fontSize: 12, fontFamily: T.font, background: T.redBg, color: T.red, border: `1px solid ${T.redBorder}`, borderRadius: 8, cursor: "pointer", fontWeight: 500 }}>
              Clear Filters
            </button>
          )}
        </div>
      </Card>

      {/* Table */}
      <Card padding={0}>
        <div style={{ overflowX: "auto" }}>
          <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 12, fontFamily: T.font }}>
            <thead>
              <tr style={{ background: T.bg, borderBottom: `2px solid ${T.border}` }}>
                {[
                  { col: "id", label: "R-Code", width: 100 },
                  { col: "req", label: "REQ", width: 60 },
                  { col: "vendor", label: "Vendor", width: 180 },
                  { col: "desc", label: "Description", width: undefined },
                  { col: "amount", label: "Amount", width: 110 },
                  { col: "type", label: "Type", width: 80 },
                  { col: "backup", label: "Backup", width: 60 },
                  { col: "pdf", label: "PDF", width: 120 },
                ].map(h => (
                  <th key={h.col} onClick={() => !["backup", "desc", "pdf"].includes(h.col) && handleSort(h.col)}
                    style={{
                      padding: "10px 14px", textAlign: h.col === "amount" ? "right" : h.col === "pdf" ? "center" : "left",
                      fontSize: 10, fontWeight: 700, color: T.textMuted, textTransform: "uppercase",
                      letterSpacing: 0.5, cursor: !["backup", "desc", "pdf"].includes(h.col) ? "pointer" : "default",
                      userSelect: "none", width: h.width, whiteSpace: "nowrap",
                    }}>
                    {h.label}<SortArrow col={h.col} />
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filtered.length === 0 ? (
                <tr><td colSpan={8} style={{ padding: 32, textAlign: "center", color: T.textMuted, fontSize: 13 }}>No invoices match your filters</td></tr>
              ) : filtered.map((e, i) => {
                const att = attachments[e.id];
                return (
                <tr key={`${e.id}-${i}`} style={{
                  borderBottom: `1px solid ${T.border}`,
                  background: !e.hasBackup ? T.redBg + "60" : i % 2 === 0 ? T.surface : T.bg,
                  transition: T.fast,
                }}>
                  <td style={{ padding: "9px 14px", fontFamily: T.mono, fontWeight: 600, fontSize: 12, color: T.accent, letterSpacing: -0.3 }}>{e.id}</td>
                  <td style={{ padding: "9px 14px", fontFamily: T.mono, fontSize: 11, color: T.textMid }}>{String(e.req).padStart(2, "0")}</td>
                  <td style={{ padding: "9px 14px", fontSize: 12, color: T.text, fontWeight: 500 }}>{e.vendor}</td>
                  <td style={{ padding: "9px 14px", fontSize: 12, color: T.textMid, maxWidth: 280, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{e.desc}</td>
                  <td style={{ padding: "9px 14px", textAlign: "right", fontFamily: T.mono, fontSize: 12, fontWeight: 600, color: e.amount < 0 ? T.red : T.text }}>
                    {e.amount < 0 ? "-" : ""}${Math.abs(e.amount).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                  </td>
                  <td style={{ padding: "9px 14px" }}>{typeBadge(e.type)}</td>
                  <td style={{ padding: "9px 14px", textAlign: "center" }}>
                    {e.hasBackup
                      ? <Ic name="check" size={14} color={T.green} />
                      : <Ic name="alert" size={14} color={T.red} />
                    }
                  </td>
                  <td style={{ padding: "6px 10px", textAlign: "center" }}>
                    {att ? (
                      <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 4 }}>
                        <button onClick={() => setViewingPdf({ invoiceId: e.id, fileName: att.fileName })}
                          title={`View ${att.fileName}`}
                          style={{
                            padding: "4px 8px", fontSize: 10, fontWeight: 600, fontFamily: T.font,
                            background: T.greenBg, color: T.green, border: `1px solid ${T.greenBorder}`,
                            borderRadius: 6, cursor: "pointer", display: "inline-flex", alignItems: "center", gap: 3,
                          }}>
                          <Ic name="eye" size={11} color={T.green} />View
                        </button>
                        <button onClick={() => handleDetach(e.id)} title="Remove attachment"
                          style={{
                            padding: "4px 5px", background: "none", border: `1px solid ${T.border}`,
                            borderRadius: 6, cursor: "pointer", display: "inline-flex", alignItems: "center", opacity: 0.5,
                          }}>
                          <Ic name="x" size={10} color={T.textMuted} />
                        </button>
                      </div>
                    ) : (
                      <button onClick={() => { setUploadTarget(e.id); fileInputRef.current?.click(); }}
                        title={`Attach PDF to ${e.id}`}
                        style={{
                          padding: "4px 8px", fontSize: 10, fontWeight: 500, fontFamily: T.font,
                          background: T.bg, color: T.textMuted, border: `1px solid ${T.border}`,
                          borderRadius: 6, cursor: "pointer", display: "inline-flex", alignItems: "center", gap: 3,
                          transition: T.fast,
                        }}
                        onMouseOver={ev => { ev.currentTarget.style.borderColor = T.accent; ev.currentTarget.style.color = T.accent; }}
                        onMouseOut={ev => { ev.currentTarget.style.borderColor = T.border; ev.currentTarget.style.color = T.textMuted; }}
                      >
                        <Ic name="paperclip" size={11} />Attach
                      </button>
                    )}
                  </td>
                </tr>
                );
              })}
            </tbody>
          </table>
        </div>
        {filtered.length > 0 && (
          <div style={{ padding: "12px 14px", borderTop: `2px solid ${T.border}`, background: T.bg, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <span style={{ fontSize: 11, color: T.textMuted, fontFamily: T.font }}>
              {filtered.length} invoice{filtered.length !== 1 ? "s" : ""} &middot; {uniqueVendors.length} unique vendors &middot; {uniqueReqs.length} requisitions &middot; <span style={{ color: T.accent, fontWeight: 600 }}>{attachedCount} PDFs attached</span>
            </span>
            <span style={{ fontSize: 12, fontWeight: 700, fontFamily: T.mono, color: totalAmount < 0 ? T.red : T.text }}>
              Total: {totalAmount < 0 ? "-" : ""}${Math.abs(totalAmount).toLocaleString(undefined, { minimumFractionDigits: 2 })}
            </span>
          </div>
        )}
      </Card>

      {/* Vendor Summary */}
      <div style={{ marginTop: 16 }}>
        <Card>
          <CardLabel label="Vendor Summary" />
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(260px, 1fr))", gap: 8 }}>
            {(() => {
              const vendorTotals = {};
              for (const e of filtered) {
                if (!vendorTotals[e.vendor]) vendorTotals[e.vendor] = { count: 0, total: 0, hasAllBackup: true, attachedCount: 0 };
                vendorTotals[e.vendor].count++;
                vendorTotals[e.vendor].total += e.amount;
                if (!e.hasBackup) vendorTotals[e.vendor].hasAllBackup = false;
                if (attachments[e.id]) vendorTotals[e.vendor].attachedCount++;
              }
              return Object.entries(vendorTotals)
                .sort((a, b) => b[1].total - a[1].total)
                .map(([vendor, data]) => (
                  <div key={vendor} style={{
                    padding: "10px 14px", borderRadius: 8, background: T.bg,
                    border: `1px solid ${data.hasAllBackup ? T.border : T.redBorder}`,
                    display: "flex", justifyContent: "space-between", alignItems: "center",
                  }}>
                    <div>
                      <div style={{ fontSize: 12, fontWeight: 500, color: T.text }}>{vendor}</div>
                      <div style={{ fontSize: 10, color: T.textMuted }}>
                        {data.count} invoice{data.count !== 1 ? "s" : ""}
                        {data.attachedCount > 0 ? ` \u00B7 ${data.attachedCount} PDF${data.attachedCount !== 1 ? "s" : ""}` : ""}
                        {!data.hasAllBackup ? " \u00B7 missing backup" : ""}
                      </div>
                    </div>
                    <div style={{ fontSize: 12, fontWeight: 600, fontFamily: T.mono, color: data.total < 0 ? T.red : T.text }}>
                      {data.total < 0 ? "-" : ""}${Math.abs(data.total).toLocaleString(undefined, { minimumFractionDigits: 2 })}
                    </div>
                  </div>
                ));
            })()}
          </div>
        </Card>
      </div>

      {/* PDF Viewer Modal */}
      {viewingPdf && (
        <PdfViewerModal
          invoiceId={viewingPdf.invoiceId}
          fileName={viewingPdf.fileName}
          onClose={() => setViewingPdf(null)}
        />
      )}
    </div>
  );
}

// ── FINANCIAL RECONCILIATION ─────────────────────────────────────────────────
function FinancialReconciliation({ reqs }) {
  const [view, setView] = useState("waterfall");
  const originalContract = 1183411;
  const totalBilled = reqs.reduce((s, r) => s + (r.totalBilled || 0), 0);
  const totalPaid = reqs.reduce((s, r) => s + (r.paidAmount || 0), 0);
  const outstanding = totalBilled - totalPaid;
  const totalSubInvoices = Object.values(BACKUP_VARIANCE).reduce((s, bv) => s + (bv.backupDocs || 0), 0);
  const totalSelfPerformed = Object.values(BACKUP_VARIANCE).reduce((s, bv) => s + (bv.directLabor || 0), 0);
  const totalCostBasis = Object.values(BACKUP_VARIANCE).reduce((s, bv) => s + (bv.amountBilled || 0), 0);
  const totalDocumented = totalSubInvoices + totalSelfPerformed;
  const docCoverage = totalCostBasis > 0 ? Math.round((totalDocumented / totalCostBasis) * 100) : 0;
  const netCOs = CHANGE_ORDERS.reduce((s, c) => s + c.amount, 0);
  const tradeAgg = {};
  Object.entries(EXCEL_TRADES).forEach(([, trades]) => {
    Object.entries(trades).forEach(([trade, amount]) => { tradeAgg[trade] = (tradeAgg[trade] || 0) + amount; });
  });
  const tradeSorted = Object.entries(tradeAgg).sort((a, b) => Math.abs(b[1]) - Math.abs(a[1]));
  const tradeTotal = tradeSorted.reduce((s, [, v]) => s + v, 0);

  const ThS = { padding: "10px 14px", fontSize: 11, fontWeight: 600, color: T.textMuted, textAlign: "left", borderBottom: `2px solid ${T.border}`, fontFamily: T.font, letterSpacing: 0.3, textTransform: "uppercase" };
  const TdS = { padding: "10px 14px", fontSize: 13, fontFamily: T.font, borderBottom: `1px solid ${T.border}`, verticalAlign: "top" };

  const viewBtns = ["waterfall", "per-req", "per-trade"];
  const viewLabels = { waterfall: "Waterfall", "per-req": "Per Requisition", "per-trade": "Per Trade" };

  return (
    <div>
      <SectionTitle title="Financial Reconciliation" subtitle="Master ledger — contract execution through final requisition (16 payment applications)" />
      <div style={{ display: "grid", gridTemplateColumns: "repeat(5, 1fr)", gap: 12, marginBottom: 16 }}>
        <KPI label="Original Contract" isMoney rawAmount={originalContract} sub="AIA A110-2021" accent color={T.accent} />
        <KPI label="Total Billed" isMoney rawAmount={totalBilled} sub="16 requisitions" color={T.text} />
        <KPI label="Total Paid" isMoney rawAmount={totalPaid} sub="Payments received" color={T.green} />
        <KPI label="Outstanding" isMoney rawAmount={outstanding} sub="Unpaid balance" color={T.red} />
        <KPI label="Documentation" value={`${docCoverage}%`} sub="Cost basis covered" color={docCoverage >= 85 ? T.green : T.amber} />
      </div>
      <div style={{ display: "flex", gap: 4, background: T.bg, borderRadius: 8, padding: 3, marginBottom: 16, width: "fit-content" }}>
        {viewBtns.map(v => (
          <button key={v} onClick={() => setView(v)} style={{
            padding: "6px 14px", borderRadius: 6, border: view === v ? `1px solid ${T.accentBorder}` : "1px solid transparent",
            background: view === v ? T.accentBg : "transparent", color: view === v ? T.accent : T.textMuted,
            fontSize: 12, fontWeight: view === v ? 600 : 400, cursor: "pointer", fontFamily: T.font, transition: T.fast,
          }}>{viewLabels[v]}</button>
        ))}
      </div>
      {view === "waterfall" && <Card>
        <CardLabel label="Financial Waterfall" />
        {[
          { label: "Original Contract Value", val: originalContract, color: T.text, indent: 0 },
          { label: `+ Net Change Orders (${CHANGE_ORDERS.filter(c => c.status !== "Void").length} documented)`, val: netCOs, color: T.amber, indent: 1 },
          { label: "= Adjusted Contract Scope", val: originalContract + netCOs, color: T.accent, indent: 0, bold: true },
          { label: "Total Billed (16 REQs)", val: totalBilled, color: T.blue, indent: 1 },
          { label: "\u2003Sub Invoices on File", val: totalSubInvoices, color: T.textMid, indent: 2 },
          { label: "\u2003Self-Performed Labor", val: totalSelfPerformed, color: T.textMid, indent: 2 },
          { label: "Total Paid by Owner", val: -totalPaid, color: T.green, indent: 1 },
          { label: "= Outstanding Balance", val: outstanding, color: T.red, indent: 0, bold: true },
        ].map((row, i) => (
          <div key={i} style={{ display: "flex", justifyContent: "space-between", padding: "12px 0", paddingLeft: row.indent * 24, borderBottom: i < 7 ? `1px solid ${T.border}` : "none" }}>
            <span style={{ fontSize: 13, fontWeight: row.bold ? 700 : 400, color: T.text, fontFamily: T.font }}>{row.label}</span>
            <Money amount={row.val} color={row.color} size={row.bold ? "lg" : "md"} />
          </div>
        ))}
      </Card>}
      {view === "per-req" && <Card padding={0}>
        <div style={{ overflowX: "auto" }}>
          <table style={{ width: "100%", borderCollapse: "collapse" }}>
            <thead><tr>
              {["REQ", "BILLED", "PAID", "SUB INVOICES", "SELF-PERFORMED", "GAP", "STATUS"].map(h => <th key={h} style={{ ...ThS, textAlign: h === "REQ" ? "left" : "right" }}>{h}</th>)}
            </tr></thead>
            <tbody>
              {reqs.map(r => {
                const bv = BACKUP_VARIANCE[r.id] || {};
                const gap = (bv.amountBilled || 0) - (bv.backupDocs || 0) - (bv.directLabor || 0);
                const st = gap <= 0 ? { color: T.green, label: "COVERED" } : gap < 5000 ? { color: T.amber, label: "PARTIAL" } : { color: T.red, label: "GAP" };
                return (
                  <tr key={r.id}>
                    <td style={TdS}><span style={{ fontFamily: T.mono, fontWeight: 600, fontSize: 12 }}>{r.reqNumber}</span></td>
                    <td style={{ ...TdS, textAlign: "right" }}><Money amount={r.totalBilled} /></td>
                    <td style={{ ...TdS, textAlign: "right" }}><Money amount={r.paidAmount} color={T.green} /></td>
                    <td style={{ ...TdS, textAlign: "right" }}><Money amount={bv.backupDocs || 0} /></td>
                    <td style={{ ...TdS, textAlign: "right" }}><Money amount={bv.directLabor || 0} color={bv.directLabor > 0 ? T.amber : T.textMuted} /></td>
                    <td style={{ ...TdS, textAlign: "right" }}><Money amount={gap} color={st.color} /></td>
                    <td style={{ ...TdS, textAlign: "right" }}><Badge label={st.label} style={{ color: st.color, bg: st.color + "12", border: st.color + "30" }} /></td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </Card>}
      {view === "per-trade" && <Card padding={0}>
        <div style={{ overflowX: "auto" }}>
          <table style={{ width: "100%", borderCollapse: "collapse" }}>
            <thead><tr>
              {["TRADE", "TOTAL BILLED", "% OF COST", "NET"].map(h => <th key={h} style={{ ...ThS, textAlign: h === "TRADE" ? "left" : "right" }}>{h}</th>)}
            </tr></thead>
            <tbody>
              {tradeSorted.map(([trade, total]) => (
                <tr key={trade}>
                  <td style={TdS}><span style={{ fontSize: 13 }}>{trade}</span></td>
                  <td style={{ ...TdS, textAlign: "right" }}><Money amount={total} color={total < 0 ? T.red : T.text} /></td>
                  <td style={{ ...TdS, textAlign: "right" }}><span style={{ fontFamily: T.mono, fontSize: 12, color: T.textMid }}>{tradeTotal > 0 ? (Math.abs(total) / tradeTotal * 100).toFixed(1) : 0}%</span></td>
                  <td style={{ ...TdS, textAlign: "right" }}><span style={{ fontSize: 11, color: total >= 0 ? T.green : T.red, fontFamily: T.mono }}>{total >= 0 ? "cost" : "credit"}</span></td>
                </tr>
              ))}
              <tr style={{ background: T.bg }}>
                <td style={{ ...TdS, fontWeight: 700 }}>TOTAL</td>
                <td style={{ ...TdS, textAlign: "right" }}><Money amount={tradeTotal} color={T.accent} size="md" /></td>
                <td style={{ ...TdS, textAlign: "right" }}><span style={{ fontFamily: T.mono, fontSize: 12, fontWeight: 600 }}>100%</span></td>
                <td style={TdS}></td>
              </tr>
            </tbody>
          </table>
        </div>
      </Card>}
    </div>
  );
}

// ── TIMECARDS ────────────────────────────────────────────────────────────────
function Timecards({ reqs }) {
  const [showCumulative, setShowCumulative] = useState(false);
  const rate = 60;
  const grandTotalHours = 3726.25;
  const allEmployees = [...new Set(TIMECARD_DATA.flatMap(t => t.employees))];
  const totalTimecardValue = grandTotalHours * rate;
  const totalLaborBilled = reqs.reduce((s, r) => s + (r.laborCost || 0), 0);

  const rows = TIMECARD_DATA
    .filter(tc => showCumulative ? tc.type === "cumulative" : tc.type === "incremental")
    .map(tc => {
      const bv = BACKUP_VARIANCE[tc.req] || {};
      const timecardValue = tc.hours * rate;
      return { ...tc, timecardValue, directLabor: bv.directLabor || 0 };
    });

  const incrTotal = TIMECARD_DATA.filter(t => t.type === "incremental").reduce((s, t) => s + t.hours, 0);

  const ThS = { padding: "10px 14px", fontSize: 11, fontWeight: 600, color: T.textMuted, textAlign: "left", borderBottom: `2px solid ${T.border}`, fontFamily: T.font, letterSpacing: 0.3, textTransform: "uppercase" };
  const TdS = { padding: "10px 14px", fontSize: 13, fontFamily: T.font, borderBottom: `1px solid ${T.border}`, verticalAlign: "top" };

  // Count appearances per employee across incremental REQs
  const empAppearances = {};
  TIMECARD_DATA.filter(t => t.type === "incremental").forEach(tc => {
    tc.employees.forEach(e => { empAppearances[e] = (empAppearances[e] || 0) + 1; });
  });
  const empSorted = Object.entries(empAppearances).sort((a, b) => b[1] - a[1]);

  return (
    <div>
      <SectionTitle title="Timecards / Labor Documentation" subtitle={`${grandTotalHours.toLocaleString()} total hours · ${allEmployees.length} unique employees · $60/hr billed rate · 15 timecard PDFs`} />
      <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 12, marginBottom: 16 }}>
        <KPI label="Total Hours Documented" value={grandTotalHours.toLocaleString()} sub="From 15 timecard PDFs" accent color={T.accent} />
        <KPI label="Timecard Value @ $60/hr" isMoney rawAmount={totalTimecardValue} sub="Hours × standard rate" color={T.text} />
        <KPI label="Total Labor Billed" isMoney rawAmount={totalLaborBilled} sub="G703 labor line items" color={T.amber} />
        <KPI label="Unique Employees" value={String(allEmployees.length)} sub="Across all periods" color={T.blue} />
      </div>
      <div style={{ display: "flex", gap: 4, background: T.bg, borderRadius: 8, padding: 3, marginBottom: 16, width: "fit-content" }}>
        {[false, true].map(cum => (
          <button key={String(cum)} onClick={() => setShowCumulative(cum)} style={{
            padding: "6px 14px", borderRadius: 6, border: showCumulative === cum ? `1px solid ${T.accentBorder}` : "1px solid transparent",
            background: showCumulative === cum ? T.accentBg : "transparent", color: showCumulative === cum ? T.accent : T.textMuted,
            fontSize: 12, fontWeight: showCumulative === cum ? 600 : 400, cursor: "pointer", fontFamily: T.font, transition: T.fast,
          }}>{cum ? "Cumulative (REQs 1-3)" : "Incremental (REQs 4-15)"}</button>
        ))}
      </div>
      <Card padding={0} style={{ marginBottom: 16 }}>
        <div style={{ overflowX: "auto" }}>
          <table style={{ width: "100%", borderCollapse: "collapse" }}>
            <thead><tr>
              {["REQ", "DATE RANGE", "HOURS", "EMPLOYEES", "TIMECARD VALUE", "LABOR BILLED (BV)", "SENT"].map(h =>
                <th key={h} style={{ ...ThS, textAlign: ["REQ","DATE RANGE","EMPLOYEES","SENT"].includes(h) ? "left" : "right" }}>{h}</th>)}
            </tr></thead>
            <tbody>
              {rows.map(r => (
                <tr key={r.req}>
                  <td style={TdS}><span style={{ fontFamily: T.mono, fontWeight: 600, fontSize: 12 }}>REQ-{String(r.req).padStart(2,"0")}</span></td>
                  <td style={TdS}><span style={{ fontFamily: T.mono, fontSize: 12 }}>{r.dateRange}</span></td>
                  <td style={{ ...TdS, textAlign: "right" }}><span style={{ fontFamily: T.mono, fontSize: 13, fontWeight: 600, color: r.hours > 0 ? T.text : T.textMuted }}>{r.hours.toFixed(2)}</span></td>
                  <td style={TdS}><span style={{ fontSize: 12, color: T.textMid }}>{r.empCount} workers</span></td>
                  <td style={{ ...TdS, textAlign: "right" }}><Money amount={r.timecardValue} /></td>
                  <td style={{ ...TdS, textAlign: "right" }}><Money amount={r.directLabor} color={r.directLabor > 0 ? T.amber : T.textMuted} /></td>
                  <td style={TdS}><span style={{ fontSize: 11, color: r.sentDate === "NOT SENT" ? T.red : T.textMid, fontFamily: T.mono }}>{r.sentDate}</span></td>
                </tr>
              ))}
              {!showCumulative && <tr style={{ background: T.bg }}>
                <td style={{ ...TdS, fontWeight: 700 }}>TOTAL</td>
                <td style={TdS}></td>
                <td style={{ ...TdS, textAlign: "right" }}><span style={{ fontFamily: T.mono, fontWeight: 700, fontSize: 13 }}>{incrTotal.toFixed(2)}</span></td>
                <td style={TdS}></td>
                <td style={{ ...TdS, textAlign: "right" }}><Money amount={incrTotal * rate} color={T.accent} /></td>
                <td style={TdS}></td>
                <td style={TdS}></td>
              </tr>}
            </tbody>
          </table>
        </div>
      </Card>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
        <Card>
          <CardLabel label="Employee Roster" />
          <div style={{ display: "grid", gridTemplateColumns: "repeat(2, 1fr)", gap: 2 }}>
            {empSorted.map(([name, count]) => (
              <div key={name} style={{ display: "flex", justifyContent: "space-between", padding: "7px 8px", borderBottom: `1px solid ${T.border}` }}>
                <span style={{ fontSize: 12, color: T.text, fontFamily: T.font }}>{name}</span>
                <span style={{ fontSize: 11, color: T.textMuted, fontFamily: T.mono }}>{count} REQs</span>
              </div>
            ))}
          </div>
        </Card>
        <Card>
          <CardLabel label="Reconciliation Notes" />
          <div style={{ fontSize: 12, color: T.textMid, lineHeight: 1.7, fontFamily: T.font }}>
            <p style={{ marginBottom: 10 }}><strong>Cumulative vs Incremental:</strong> REQs 1-3 are cumulative timecard exports from the payroll system — each contains all hours from its start date through 09/20/23. REQs 4-15 contain only incremental hours for each billing period.</p>
            <p style={{ marginBottom: 10 }}><strong>Derived Period Hours:</strong> REQ-01 period ~497 hrs (3,726-3,229) · REQ-02 period ~108 hrs (3,229-3,121) · REQ-03 period ~147 hrs (3,121-2,974).</p>
            <p style={{ marginBottom: 10 }}><strong>Rate:</strong> All labor billed at uniform $60/hr across all trades (demolition, framing, siding, drywall). Flagged as "blended_rate" — not actual payroll cost.</p>
            <p><strong>Source:</strong> 15 PDFs from <code style={{ fontFamily: T.mono, fontSize: 11, background: T.bg, padding: "1px 4px", borderRadius: 3 }}>Legal/Timecards/Req N sent YYYY.MM.DD.pdf</code></p>
          </div>
        </Card>
      </div>
      <PayrollAnalysis />
    </div>
  );
}

// ── PAYROLL ANALYSIS ─────────────────────────────────────────────────────────
function PayrollAnalysis() {
  const [sortCol, setSortCol] = useState("hours");
  const [sortDir, setSortDir] = useState("desc");

  const totalHours = PAYROLL_COST_DATA.reduce((s, e) => s + e.hours, 0);
  const totalActualCost = PAYROLL_COST_DATA.reduce((s, e) => s + e.actualCost, 0);
  const totalBilled = PAYROLL_COST_DATA.reduce((s, e) => s + e.hours * e.billingRate, 0);
  const totalDiff = totalBilled - totalActualCost;
  const avgBurdenedRate = totalActualCost / totalHours;

  const sorted = useMemo(() => {
    const data = [...PAYROLL_COST_DATA];
    const dir = sortDir === "asc" ? 1 : -1;
    return data.sort((a, b) => {
      if (sortCol === "name") return dir * a.name.localeCompare(b.name);
      if (sortCol === "role") return dir * a.role.localeCompare(b.role);
      if (sortCol === "hourlyBase") return dir * (a.hourlyBase - b.hourlyBase);
      if (sortCol === "burdenedRate") return dir * (a.burdenedRate - b.burdenedRate);
      if (sortCol === "hours") return dir * (a.hours - b.hours);
      if (sortCol === "actualCost") return dir * (a.actualCost - b.actualCost);
      if (sortCol === "billed") return dir * ((a.hours * a.billingRate) - (b.hours * b.billingRate));
      if (sortCol === "diff") return dir * (((a.hours * a.billingRate) - a.actualCost) - ((b.hours * b.billingRate) - b.actualCost));
      return 0;
    });
  }, [sortCol, sortDir]);

  const toggleSort = (col) => {
    if (sortCol === col) setSortDir(d => d === "asc" ? "desc" : "asc");
    else { setSortCol(col); setSortDir("desc"); }
  };

  const ThS = { padding: "10px 14px", fontSize: 11, fontWeight: 600, color: T.textMuted, borderBottom: `2px solid ${T.border}`, fontFamily: T.font, letterSpacing: 0.3, textTransform: "uppercase", cursor: "pointer", userSelect: "none", whiteSpace: "nowrap" };
  const TdS = { padding: "10px 14px", fontSize: 13, fontFamily: T.font, borderBottom: `1px solid ${T.border}`, verticalAlign: "top" };
  const arrow = (col) => sortCol === col ? (sortDir === "asc" ? " ▲" : " ▼") : "";

  return (
    <div style={{ marginTop: 32 }}>
      <SectionTitle title="Payroll Cost Analysis — Billed vs. Actual" subtitle={`${totalHours.toLocaleString()} total hours · 16 employees · Source: Montana Contracting Payroll Summary 11/28/2023`} />
      <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 12, marginBottom: 16 }}>
        <KPI label="Total Billed @ $60/hr" isMoney rawAmount={totalBilled} sub={`${totalHours.toLocaleString()} hrs × $60`} accent color={T.accent} />
        <KPI label="Actual Burdened Cost" isMoney rawAmount={totalActualCost} sub="Payroll + taxes + WC + vacation" color={T.amber} />
        <KPI label="Net Difference" isMoney rawAmount={totalDiff} sub={totalDiff >= 0 ? "Billed exceeded cost" : "Cost exceeded billing"} color={totalDiff >= 0 ? T.green : T.red} />
        <KPI label="Avg Burdened Rate" value={`$${avgBurdenedRate.toFixed(2)}/hr`} sub="Weighted average actual cost" color={T.blue} />
      </div>

      <Card style={{ marginBottom: 16, padding: "14px 16px" }}>
        <div style={{ fontSize: 12, color: T.textMid, lineHeight: 1.7 }}>
          <p style={{ margin: 0 }}>
            <strong style={{ color: T.accent }}>Key Finding:</strong> Montana billed all labor at a uniform <strong>$60/hr blended rate</strong>.
            The actual weighted average burdened cost was <strong>${avgBurdenedRate.toFixed(2)}/hr</strong> (including FICA 7.65%, NY unemployment 3.03%,
            workers' comp 17%, vacation accrual, and overhead).{" "}
            {totalDiff >= 0
              ? <>The $60/hr rate exceeded actual cost by only <strong>${totalDiff.toLocaleString()}</strong> ({(totalDiff / totalBilled * 100).toFixed(1)}%) — a de minimis margin that demonstrates the rate was reasonable.</>
              : <>Montana's actual cost <em>exceeded</em> the billed rate by <strong>${Math.abs(totalDiff).toLocaleString()}</strong>, meaning Montana absorbed the shortfall.</>
            }
            {" "}Employees with burdened rates above $60/hr (highlighted in red below) represent direct losses to Montana on every hour worked.
          </p>
        </div>
      </Card>

      <Card padding={0}>
        <div style={{ overflowX: "auto" }}>
          <table style={{ width: "100%", borderCollapse: "collapse" }}>
            <thead><tr>
              <th style={{ ...ThS, textAlign: "left" }} onClick={() => toggleSort("name")}>Employee{arrow("name")}</th>
              <th style={{ ...ThS, textAlign: "left" }} onClick={() => toggleSort("role")}>Role{arrow("role")}</th>
              <th style={{ ...ThS, textAlign: "right" }} onClick={() => toggleSort("hourlyBase")}>Base Rate{arrow("hourlyBase")}</th>
              <th style={{ ...ThS, textAlign: "right" }} onClick={() => toggleSort("burdenedRate")}>Burdened Rate{arrow("burdenedRate")}</th>
              <th style={{ ...ThS, textAlign: "right" }} onClick={() => toggleSort("hours")}>Hours{arrow("hours")}</th>
              <th style={{ ...ThS, textAlign: "right" }} onClick={() => toggleSort("billed")}>Billed @ $60{arrow("billed")}</th>
              <th style={{ ...ThS, textAlign: "right" }} onClick={() => toggleSort("actualCost")}>Actual Cost{arrow("actualCost")}</th>
              <th style={{ ...ThS, textAlign: "right" }} onClick={() => toggleSort("diff")}>Difference{arrow("diff")}</th>
            </tr></thead>
            <tbody>
              {sorted.map(e => {
                const billed = e.hours * e.billingRate;
                const diff = billed - e.actualCost;
                const overBudget = e.burdenedRate > e.billingRate;
                return (
                  <tr key={e.name} style={{ background: overBudget ? "rgba(239,68,68,0.04)" : undefined }}>
                    <td style={TdS}>
                      <span style={{ fontWeight: 600, fontSize: 13 }}>{e.name}</span>
                    </td>
                    <td style={TdS}>
                      <span style={{ fontSize: 11, color: T.textMid, background: T.bg, padding: "2px 6px", borderRadius: 4 }}>{e.role}</span>
                    </td>
                    <td style={{ ...TdS, textAlign: "right" }}>
                      <span style={{ fontFamily: T.mono, fontSize: 12 }}>${e.hourlyBase.toFixed(2)}</span>
                    </td>
                    <td style={{ ...TdS, textAlign: "right" }}>
                      <span style={{ fontFamily: T.mono, fontSize: 12, fontWeight: 600, color: overBudget ? T.red : T.green }}>
                        ${e.burdenedRate.toFixed(2)}
                      </span>
                      {overBudget && <span style={{ fontSize: 9, color: T.red, marginLeft: 4 }}>▲ LOSS</span>}
                    </td>
                    <td style={{ ...TdS, textAlign: "right" }}>
                      <span style={{ fontFamily: T.mono, fontSize: 13, fontWeight: 600 }}>{e.hours.toFixed(2)}</span>
                    </td>
                    <td style={{ ...TdS, textAlign: "right" }}>
                      <Money amount={billed} />
                    </td>
                    <td style={{ ...TdS, textAlign: "right" }}>
                      <Money amount={e.actualCost} color={T.amber} />
                    </td>
                    <td style={{ ...TdS, textAlign: "right" }}>
                      <span style={{ fontFamily: T.mono, fontSize: 13, fontWeight: 600, color: diff >= 0 ? T.green : T.red }}>
                        {diff >= 0 ? "+" : ""}{diff < 0 ? "(" : ""}${Math.abs(diff).toLocaleString()}{diff < 0 ? ")" : ""}
                      </span>
                    </td>
                  </tr>
                );
              })}
              <tr style={{ background: T.bg, fontWeight: 700 }}>
                <td style={{ ...TdS, fontWeight: 700 }}>TOTAL</td>
                <td style={TdS}><span style={{ fontSize: 11, color: T.textMid }}>16 employees</span></td>
                <td style={TdS}></td>
                <td style={{ ...TdS, textAlign: "right" }}>
                  <span style={{ fontFamily: T.mono, fontSize: 12, fontWeight: 600 }}>${avgBurdenedRate.toFixed(2)} avg</span>
                </td>
                <td style={{ ...TdS, textAlign: "right" }}>
                  <span style={{ fontFamily: T.mono, fontSize: 13, fontWeight: 700 }}>{totalHours.toFixed(2)}</span>
                </td>
                <td style={{ ...TdS, textAlign: "right" }}>
                  <span style={{ fontFamily: T.mono, fontSize: 13, fontWeight: 700, color: T.accent }}>${totalBilled.toLocaleString()}</span>
                </td>
                <td style={{ ...TdS, textAlign: "right" }}>
                  <span style={{ fontFamily: T.mono, fontSize: 13, fontWeight: 700, color: T.amber }}>${totalActualCost.toLocaleString()}</span>
                </td>
                <td style={{ ...TdS, textAlign: "right" }}>
                  <span style={{ fontFamily: T.mono, fontSize: 13, fontWeight: 700, color: totalDiff >= 0 ? T.green : T.red }}>
                    {totalDiff >= 0 ? "+" : ""}${totalDiff.toLocaleString()}
                  </span>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </Card>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16, marginTop: 16 }}>
        <Card>
          <CardLabel label="Burden Breakdown (per payroll dollar)" />
          <div style={{ fontSize: 12, color: T.textMid, lineHeight: 2 }}>
            {[
              { label: "Federal Unemployment", rate: "0.60%" },
              { label: "Social Security", rate: "6.20%" },
              { label: "Medicare", rate: "1.45%" },
              { label: "NY Disability", rate: "0.45%" },
              { label: "NY Unemployment", rate: "3.03%" },
              { label: "NY Re-employment", rate: "0.08%" },
              { label: "Workers Compensation", rate: "17.00%" },
            ].map(item => (
              <div key={item.label} style={{ display: "flex", justifyContent: "space-between", borderBottom: `1px solid ${T.border}`, padding: "4px 0" }}>
                <span>{item.label}</span>
                <span style={{ fontFamily: T.mono, fontWeight: 600 }}>{item.rate}</span>
              </div>
            ))}
            <div style={{ display: "flex", justifyContent: "space-between", padding: "6px 0", fontWeight: 700, color: T.text }}>
              <span>Total Employer Burden</span>
              <span style={{ fontFamily: T.mono }}>28.80%</span>
            </div>
            <div style={{ marginTop: 8, fontSize: 11, color: T.textMuted }}>
              Plus: vacation accrual ($0.53–$2.25/hr per employee) and 25% overhead allocation
            </div>
          </div>
        </Card>
        <Card>
          <CardLabel label="Rate Comparison by Employee" />
          <div style={{ fontSize: 12, color: T.textMid }}>
            {PAYROLL_COST_DATA.map(e => {
              const pct = ((e.burdenedRate / e.billingRate) * 100);
              const over = e.burdenedRate > e.billingRate;
              return (
                <div key={e.name} style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 4 }}>
                  <span style={{ width: 140, fontSize: 11, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{e.name}</span>
                  <div style={{ flex: 1, height: 14, background: T.bg, borderRadius: 7, overflow: "hidden", position: "relative" }}>
                    <div style={{
                      width: `${Math.min(pct, 100)}%`, height: "100%", borderRadius: 7,
                      background: over ? "rgba(239,68,68,0.5)" : "rgba(34,197,94,0.4)",
                    }} />
                    {over && <div style={{
                      position: "absolute", left: `${(60/e.burdenedRate)*100}%`, top: 0, bottom: 0, width: 2, background: T.red,
                    }} />}
                  </div>
                  <span style={{ fontFamily: T.mono, fontSize: 10, width: 42, textAlign: "right", color: over ? T.red : T.green, fontWeight: 600 }}>
                    {pct.toFixed(0)}%
                  </span>
                </div>
              );
            })}
            <div style={{ marginTop: 8, fontSize: 10, color: T.textMuted }}>
              Bar shows burdened rate as % of $60/hr billing rate. Red line = breakeven. Red bars = loss per hour.
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
}

// ── CHANGE ORDERS ────────────────────────────────────────────────────────────
function ChangeOrdersTab({ reqs }) {
  const [sortBy, setSortBy] = useState("co");
  const [search, setSearch] = useState("");
  const [reqFilter, setReqFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("active"); // "all", "active" (non-void), "credit"

  const activeCOs = CHANGE_ORDERS.filter(c => c.status !== "Void");
  const totalCOs = CHANGE_ORDERS.length;
  const netValue = activeCOs.reduce((s, c) => s + c.amount, 0);
  const credits = activeCOs.filter(c => c.amount < 0);
  const totalCredits = credits.reduce((s, c) => s + c.amount, 0);
  const debits = activeCOs.filter(c => c.amount > 0);
  const totalDebits = debits.reduce((s, c) => s + c.amount, 0);
  const voided = CHANGE_ORDERS.filter(c => c.status === "Void");
  const uniqueReqs = [...new Set(activeCOs.map(c => c.req).filter(Boolean))].sort((a, b) => a - b);

  const filtered = useMemo(() => {
    let items = CHANGE_ORDERS;
    if (statusFilter === "active") items = items.filter(c => c.status !== "Void");
    if (statusFilter === "credit") items = items.filter(c => c.amount < 0 && c.status !== "Void");
    if (reqFilter !== "all") items = items.filter(c => c.req === parseInt(reqFilter));
    if (search.trim()) {
      const q = search.trim().toLowerCase();
      items = items.filter(c =>
        c.desc.toLowerCase().includes(q) ||
        String(c.co).includes(q) ||
        String(c.amount).includes(q)
      );
    }
    return [...items].sort((a, b) => sortBy === "co" ? a.co - b.co : (a.req || 99) - (b.req || 99) || a.co - b.co);
  }, [search, reqFilter, statusFilter, sortBy]);

  const filteredNet = filtered.reduce((s, c) => s + c.amount, 0);

  const ThS = { padding: "10px 14px", fontSize: 11, fontWeight: 600, color: T.textMuted, textAlign: "left", borderBottom: `2px solid ${T.border}`, fontFamily: T.font, letterSpacing: 0.3, textTransform: "uppercase" };
  const TdS = { padding: "10px 14px", fontSize: 13, fontFamily: T.font, borderBottom: `1px solid ${T.border}`, verticalAlign: "top" };

  return (
    <div>
      <SectionTitle title="Change Orders" subtitle={`${totalCOs} PCCOs from Procore \u00B7 All PCOs verbally approved by owner before PCCO creation \u00B7 ${voided.length} voided`} />
      <div style={{ display: "grid", gridTemplateColumns: "repeat(5, 1fr)", gap: 12, marginBottom: 16 }}>
        <KPI label="Total PCCOs" value={`${activeCOs.length}`} sub={`${voided.length} voided`} accent color={T.accent} />
        <KPI label="Net CO Value" isMoney rawAmount={netValue} sub="Additions minus credits" color={T.text} />
        <KPI label="Additions" isMoney rawAmount={totalDebits} sub={`${debits.length} change orders`} color={T.green} />
        <KPI label="Credits" isMoney rawAmount={totalCredits} sub={`${credits.length} credit COs`} color={T.red} />
        <KPI label="Showing" value={String(filtered.length)} sub={`Net: $${Math.abs(filteredNet).toLocaleString(undefined, {minimumFractionDigits: 0})}`} color={T.blue} />
      </div>
      <Card style={{ marginBottom: 16 }}>
        <div style={{ fontSize: 13, color: T.text, lineHeight: 1.8, fontFamily: T.font }}>
          The Tharp residence underwent <strong>{activeCOs.length} change orders</strong> during construction, fundamentally expanding scope beyond the original AIA A110-2021 contract. These COs encompassed framing modifications, bathroom redesigns, siding changes, HVAC upgrades, and interior finish revisions — all owner-directed and verbally approved before PCCO creation. The 240-day substantial completion deadline was exceeded by 419 days, with every day beyond the deadline attributable to CO-driven scope expansion.
        </div>
      </Card>

      {/* Filters */}
      <Card style={{ marginBottom: 16 }} padding={16}>
        <div style={{ display: "flex", gap: 12, alignItems: "center", flexWrap: "wrap" }}>
          <div style={{ position: "relative", flex: "1 1 240px" }}>
            <Ic name="search" size={14} color={T.textMuted} style={{ position: "absolute", left: 10, top: "50%", transform: "translateY(-50%)" }} />
            <input type="text" placeholder="Search PCCO #, description, amount..."
              value={search} onChange={e => setSearch(e.target.value)}
              style={{ width: "100%", padding: "8px 12px 8px 32px", fontSize: 13, fontFamily: T.font, border: `1px solid ${T.border}`, borderRadius: 8, background: T.bg, color: T.text, outline: "none", boxSizing: "border-box" }} />
          </div>
          <select value={reqFilter} onChange={e => setReqFilter(e.target.value)}
            style={{ padding: "8px 12px", fontSize: 12, fontFamily: T.font, border: `1px solid ${T.border}`, borderRadius: 8, background: T.bg, color: T.text, cursor: "pointer" }}>
            <option value="all">All REQs</option>
            {uniqueReqs.map(r => <option key={r} value={r}>REQ-{String(r).padStart(2, "0")}</option>)}
          </select>
          <select value={statusFilter} onChange={e => setStatusFilter(e.target.value)}
            style={{ padding: "8px 12px", fontSize: 12, fontFamily: T.font, border: `1px solid ${T.border}`, borderRadius: 8, background: T.bg, color: T.text, cursor: "pointer" }}>
            <option value="active">Active (excl. void)</option>
            <option value="all">All (incl. void)</option>
            <option value="credit">Credits Only</option>
          </select>
          <div style={{ display: "flex", gap: 4, background: T.bg, borderRadius: 8, padding: 3 }}>
            {["co", "req"].map(s => (
              <button key={s} onClick={() => setSortBy(s)} style={{
                padding: "6px 14px", borderRadius: 6, border: sortBy === s ? `1px solid ${T.accentBorder}` : "1px solid transparent",
                background: sortBy === s ? T.accentBg : "transparent", color: sortBy === s ? T.accent : T.textMuted,
                fontSize: 12, fontWeight: sortBy === s ? 600 : 400, cursor: "pointer", fontFamily: T.font, transition: T.fast,
              }}>{s === "co" ? "By PCCO #" : "By REQ"}</button>
            ))}
          </div>
          {(search || reqFilter !== "all" || statusFilter !== "active") && (
            <button onClick={() => { setSearch(""); setReqFilter("all"); setStatusFilter("active"); }}
              style={{ padding: "8px 14px", fontSize: 12, fontFamily: T.font, background: T.redBg, color: T.red, border: `1px solid ${T.redBorder}`, borderRadius: 8, cursor: "pointer", fontWeight: 500 }}>
              Clear
            </button>
          )}
        </div>
      </Card>

      <Card padding={0}>
        <div style={{ overflowX: "auto" }}>
          <table style={{ width: "100%", borderCollapse: "collapse" }}>
            <thead><tr>
              {["PCCO #", "DESCRIPTION", "AMOUNT", "REQ", "REVIEW DATE", "STATUS"].map(h =>
                <th key={h} style={{ ...ThS, textAlign: h === "AMOUNT" ? "right" : "left" }}>{h}</th>)}
            </tr></thead>
            <tbody>
              {filtered.length === 0 ? (
                <tr><td colSpan={6} style={{ padding: 32, textAlign: "center", color: T.textMuted, fontSize: 13 }}>No change orders match your filters</td></tr>
              ) : filtered.map(co => {
                const isVoid = co.status === "Void";
                const isCredit = co.amount < 0;
                const stColor = isVoid ? T.textMuted : T.green;
                return (
                  <tr key={co.co} style={{ background: isVoid ? T.bg + "80" : isCredit ? T.redBg + "40" : "transparent", opacity: isVoid ? 0.5 : 1 }}>
                    <td style={TdS}><span style={{ fontFamily: T.mono, fontWeight: 600, fontSize: 12 }}>PCCO #{String(co.co).padStart(3, "0")}</span></td>
                    <td style={{ ...TdS, maxWidth: 400, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}><span style={{ fontSize: 13, textDecoration: isVoid ? "line-through" : "none" }}>{co.desc}</span></td>
                    <td style={{ ...TdS, textAlign: "right" }}><Money amount={co.amount} color={isVoid ? T.textMuted : isCredit ? T.red : T.text} /></td>
                    <td style={TdS}>{co.req ? <span style={{ fontFamily: T.mono, fontSize: 12 }}>REQ-{String(co.req).padStart(2, "0")}</span> : <span style={{ fontSize: 11, color: T.textMuted }}>—</span>}</td>
                    <td style={TdS}><span style={{ fontFamily: T.mono, fontSize: 11, color: T.textMid }}>{co.reviewDate || "—"}</span></td>
                    <td style={TdS}><Badge label={co.status} style={{ color: stColor, bg: stColor + "12", border: stColor + "30" }} /></td>
                  </tr>
                );
              })}
              <tr style={{ background: T.bg }}>
                <td style={{ ...TdS, fontWeight: 700 }}>NET</td>
                <td style={{ ...TdS, fontWeight: 600, color: T.textMid }}>{filtered.length} change orders</td>
                <td style={{ ...TdS, textAlign: "right" }}><Money amount={filteredNet} color={T.accent} size="md" /></td>
                <td colSpan={3} style={TdS}></td>
              </tr>
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
}

// ── TIMELINE ─────────────────────────────────────────────────────────────────
const CATEGORY_STYLES = {
  contract:     { color: T.accent, bg: T.accentBg, border: T.accentBorder, label: "Contract" },
  billing:      { color: T.blue,   bg: T.blueBg,   border: T.blueBorder,   label: "Billing" },
  change_order: { color: T.amber,  bg: T.amberBg,  border: T.amberBorder,  label: "Change Order" },
  dispute:      { color: T.red,    bg: T.redBg,    border: T.redBorder,    label: "Dispute" },
  field:        { color: T.green,  bg: T.greenBg,  border: T.greenBorder,  label: "Field Work" },
};

function TimelineTab({ reqs, claims }) {
  const [filter, setFilter] = useState("all");
  const events = TIMELINE_EVENTS
    .filter(e => filter === "all" || e.category === filter)
    .sort((a, b) => new Date(a.date) - new Date(b.date));

  return (
    <div>
      <SectionTitle title="Project Chronology" subtitle="Key events from contract execution through arbitration filing" />
      <div style={{ display: "flex", gap: 4, background: T.bg, borderRadius: 8, padding: 3, marginBottom: 20, width: "fit-content", flexWrap: "wrap" }}>
        {["all", "contract", "billing", "change_order", "dispute", "field"].map(cat => {
          const active = filter === cat;
          const cs = cat === "all" ? { color: T.text, bg: T.surface, border: T.border } : CATEGORY_STYLES[cat];
          return (
            <button key={cat} onClick={() => setFilter(cat)} style={{
              padding: "6px 14px", borderRadius: 6, border: active ? `1px solid ${cs.border}` : "1px solid transparent",
              background: active ? cs.bg : "transparent", color: active ? cs.color : T.textMuted,
              fontSize: 12, fontWeight: active ? 600 : 400, cursor: "pointer", fontFamily: T.font, transition: T.fast,
            }}>{cat === "all" ? `All (${TIMELINE_EVENTS.length})` : `${cs.label} (${TIMELINE_EVENTS.filter(e => e.category === cat).length})`}</button>
          );
        })}
      </div>
      <div style={{ position: "relative", paddingLeft: 40 }}>
        <div style={{ position: "absolute", left: 16, top: 0, bottom: 0, width: 2, background: T.border }} />
        {events.map((event, i) => {
          const cs = CATEGORY_STYLES[event.category];
          return (
            <div key={i} style={{ position: "relative", marginBottom: 12 }}>
              <div style={{ position: "absolute", left: -32, top: 10, width: 12, height: 12, borderRadius: "50%", background: cs.color, border: `3px solid ${T.surface}`, boxShadow: `0 0 0 2px ${cs.border}` }} />
              <Card style={{ borderLeft: `3px solid ${cs.color}`, marginLeft: 0 }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 6 }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                    <span style={{ fontFamily: T.mono, fontSize: 12, color: T.textMuted, fontWeight: 500 }}>{event.date}</span>
                    <Badge label={cs.label} style={{ color: cs.color, bg: cs.bg, border: cs.border }} />
                  </div>
                </div>
                <div style={{ fontSize: 13, color: T.text, fontFamily: T.font, lineHeight: 1.5 }}>{event.desc}</div>
              </Card>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ── ARBITRATION SIMULATOR (BALANCED) ─────────────────────────────────────────

const ARBITRATOR_PROFILES = [
  {
    id: "abramowitz", name: "Robin S. Abramowitz", subtitle: "Assigned Arbitrator — AAA Construction Panel",
    bio: "30+ years civil litigation. AAA Construction & Commercial Panels. Represents both owners and contractors. Presented on 'Neutralizing the Litigator Mentality' — values substance over adversarial posturing. Mediation philosophy: 'authentic commitment and participation.' Suffolk County Ethics & Civility Committee. AV Preeminent rated.",
    traits: { contractWeight: 0.70, docRequired: 0.75, ownerBias: 0.48, analyticalRigor: 0.72, industryStandard: 0.65, pragmatism: 0.70 },
    color: T.accent,
  },
  {
    id: "contract_purist", name: "The Contract Purist", subtitle: "Strict textual interpretation",
    bio: "Former transactional attorney. Reads every clause literally. If the contract says it, that's the law between the parties. Rarely considers industry custom or equitable arguments. Documentation must be airtight or claims fail.",
    traits: { contractWeight: 0.95, docRequired: 0.90, ownerBias: 0.40, analyticalRigor: 0.85, industryStandard: 0.15, pragmatism: 0.15 },
    color: T.blue,
  },
  {
    id: "owner_advocate", name: "The Homeowner's Shield", subtitle: "Consumer protection orientation",
    bio: "Background in consumer protection law. Believes homeowners are inherently disadvantaged against professional contractors. Scrutinizes contractor billing heavily. Sympathetic to owner frustration with defective work. Skeptical of contractor cost-plus markups.",
    traits: { contractWeight: 0.50, docRequired: 0.55, ownerBias: 0.78, analyticalRigor: 0.60, industryStandard: 0.30, pragmatism: 0.55 },
    color: T.red,
  },
  {
    id: "industry_veteran", name: "The Industry Veteran", subtitle: "Construction trade experience",
    bio: "Former GC turned construction attorney. Understands change orders, field conditions, and cost-plus realities. Gives benefit of the doubt to industry practices. Recognizes that construction is messy and documentation often imperfect. Values practical outcomes.",
    traits: { contractWeight: 0.55, docRequired: 0.45, ownerBias: 0.28, analyticalRigor: 0.55, industryStandard: 0.90, pragmatism: 0.70 },
    color: T.green,
  },
  {
    id: "forensic_accountant", name: "The Forensic Auditor", subtitle: "Numbers-driven analysis",
    bio: "CPA background with forensic accounting expertise. Follows the money trail relentlessly. Every dollar must be documented and justified. Cross-references invoices, timecards, and schedules. Catches discrepancies others miss. Less interested in who's sympathetic, more interested in what the numbers prove.",
    traits: { contractWeight: 0.65, docRequired: 0.95, ownerBias: 0.50, analyticalRigor: 0.98, industryStandard: 0.35, pragmatism: 0.25 },
    color: "#7C3AED",
  },
  {
    id: "pragmatist", name: "The Pragmatic Settler", subtitle: "Split-the-difference mediator mentality",
    bio: "Former mediator who believes most construction disputes have merit on both sides. Seeks the 'zone of possible agreement.' Will award partial amounts on close calls. Rarely gives 100% to either side. Values business relationship preservation and practical resolution.",
    traits: { contractWeight: 0.50, docRequired: 0.50, ownerBias: 0.50, analyticalRigor: 0.45, industryStandard: 0.55, pragmatism: 0.95 },
    color: T.amber,
  },
];

const TRAIT_LABELS = {
  contractWeight: { label: "Contract Adherence", desc: "Strict contract interpretation vs. equity/fairness" },
  docRequired: { label: "Documentation Rigor", desc: "How strictly backup documentation is required" },
  ownerBias: { label: "Owner Sympathy", desc: "Tendency toward homeowner (0=pro-GC, 0.5=neutral, 1=pro-owner)" },
  analyticalRigor: { label: "Analytical Depth", desc: "How deeply they audit numbers and accounting" },
  industryStandard: { label: "Industry Deference", desc: "Weight given to trade customs and practices" },
  pragmatism: { label: "Pragmatism", desc: "Tendency to split the difference vs. all-or-nothing" },
};

// Case-specific disputes — BALANCED assessment, amounts computed from live data
function buildCaseDisputes(claims) {
  const cl = id => claims.find(c => c.id === id) || {};
  const sumCl = ids => ids.reduce((s, id) => s + (cl(id).ownerAmount || 0), 0);
  const totalAgreed = claims.reduce((s, c) => s + (c.agreedAmount || 0), 0);
  const agreedItems = claims.filter(c => c.agreedAmount > 0);
  const req13Billed = REQS_INITIAL[12].totalBilled || 0;
  const unappliedCredits = Math.abs(BACKUP_VARIANCE[16]?.items?.filter(it => it.amount < 0).reduce((s, it) => s + it.amount, 0) ?? 135385);
  const korthOver = 40492; // Korth contract value not in structured data
  const ohpEstimate = 50000; // estimate — no structured data source
  const docEstimate = 40000; // estimate — no structured data source

  return [
    // ── OWNER CLAIMS (Owner seeking damages from MC) ──
    {
      id: "consequential", category: "owner_claim", title: "Consequential Damages — §21.11 Waiver",
      description: `Delay damages (${$(cl(5).ownerAmount)}) + insulation energy costs (${$(cl(1).ownerAmount)}). Contract contains mutual waiver of consequential damages.`,
      amountAtStake: sumCl([5, 1]),
      ownerStrength: "18-month project overrun is real harm. Owner lived elsewhere paying rent. Energy cost difference is quantifiable. Some courts narrow waiver to exclude direct consequential damages.",
      mcStrength: "§21.11 mutual waiver is unambiguous. 125 owner-initiated COs contributed to delay. Industry standard clause. Owner's own architect didn't object to timeline.",
      traitEffect: { contractWeight: -0.8, docRequired: -0.2, ownerBias: 0.5, analyticalRigor: -0.2, industryStandard: -0.3, pragmatism: 0.3 },
      baseOwnerRecovery: 0.08,
    },
    {
      id: "fireplace", category: "owner_claim", title: "Fireplace Defects — Stone/Blueboard/Chips",
      description: `Owner claims ${$(cl(4).ownerAmount)} for fireplace defects including visible blueboard, stone chips, and sloppy workmanship.`,
      amountAtStake: cl(4).ownerAmount || 0,
      ownerStrength: `Visible defects are documented in photos. Blueboard showing is objectively defective. Stone chipping suggests poor installation. ${$(cl(4).ownerAmount)} fireplace should meet basic aesthetic standards. Expert can testify to remediation cost.`,
      mcStrength: "Manufacturer rep inspected and approved. Owner selected stone type and color. Durock installation per spec. MC offered corrective work — owner refused. Refusal to allow repair undermines damage claim.",
      traitEffect: { contractWeight: -0.3, docRequired: 0.1, ownerBias: 0.5, analyticalRigor: 0.0, industryStandard: -0.3, pragmatism: 0.4 },
      baseOwnerRecovery: 0.25,
    },
    {
      id: "air_returns", category: "owner_claim", title: "Air Returns & Air Handlers",
      description: `Air return misplacement (${$(cl(3).ownerAmount)}) + quiet air handler upgrade demand (${$(cl(9).ownerAmount)}). Owner claims comfort and functionality compromised.`,
      amountAtStake: sumCl([3, 9]),
      ownerStrength: `HVAC comfort directly impacts livability. Noise complaints are subjective but real. Owner paying $1.7M expects a quiet home. Air return placement affects air quality and efficiency.`,
      mcStrength: "Existing framing prohibited original placement — documented at weekly architect meetings. No MEP spec ever provided by owner/architect. Air handlers installed under budget per contract. Owner refused professional mechanical engineer recommendation. Upgrade beyond contract scope.",
      traitEffect: { contractWeight: -0.4, docRequired: -0.1, ownerBias: 0.5, analyticalRigor: -0.1, industryStandard: -0.4, pragmatism: 0.4 },
      baseOwnerRecovery: 0.18,
    },
    {
      id: "defective_misc", category: "owner_claim", title: "Defective Work — Roofing/Shower/Drain/Doors/Warranty",
      description: `Roofing (${$(cl(8).ownerAmount)}), shower glass (${$(cl(6).ownerAmount)}), french drain (${$(cl(19).ownerAmount)}), doors (${$(cl(23).ownerAmount)}), warranty escrow (${$(cl(24).ownerAmount)}), insulation (${$(cl(11).ownerAmount)}), sink (${$(cl(21).ownerAmount)}).`,
      amountAtStake: sumCl([8, 6, 19, 23, 24, 11, 21]),
      ownerStrength: "Curled shingles are visible and documented. Doors with gaps/rattles are objectively defective. French drain leaked for months. Multiple items suggest pattern of poor workmanship. Owner paid $1.7M and deserves completed punchlist.",
      mcStrength: "Roofing: manufacturer confirmed common nailing, minor fix sufficient. Shower: plans show 3 panes, not one-piece. Drain: existed pre-MC, installed upside down before MC arrived. Doors: punchlist items — will complete upon final payment. Warranty: per contract, issued upon final payment which owner withholds.",
      traitEffect: { contractWeight: -0.2, docRequired: 0.1, ownerBias: 0.4, analyticalRigor: 0.1, industryStandard: -0.2, pragmatism: 0.5 },
      baseOwnerRecovery: 0.32,
    },
    {
      id: "agreed_credits", category: "owner_claim", title: "Agreed Credits & Corrections",
      description: `Items MC already conceded: ${agreedItems.slice(0, 5).map(c => `${c.description.split("—")[0].trim()} (${$(c.agreedAmount)})`).join(", ")}.`,
      amountAtStake: totalAgreed,
      ownerStrength: "MC's own concessions. Values reflect MC's agreed amounts. Non-contestable at this point.",
      mcStrength: "Credits already calculated at actual cost, not owner's inflated estimates. Shows MC's good faith willingness to address legitimate issues.",
      traitEffect: { contractWeight: 0.0, docRequired: 0.0, ownerBias: 0.0, analyticalRigor: 0.0, industryStandard: 0.0, pragmatism: 0.0 },
      baseOwnerRecovery: 1.0,
    },
    // ── MC COUNTERCLAIMS (MC seeking credits/offsets from Owner) ──
    {
      id: "unapplied_credits", category: "mc_counter", title: "Unapplied CO Credits on G703",
      description: `${$(unappliedCredits)} in credit COs at 0% on REQ-15 G703: PCO#130 'GC-Owner Variance Split' ($66,389), PCO#129 'Allowance Reconciliation' ($24,248), plus 5 others.`,
      amountAtStake: unappliedCredits,
      mcStrength: "Credits are ON MC's own G703 schedule. MC acknowledged variances. PCO#130 title literally says 'Owner Variance Split.' These are documented admissions of amounts owed to owner.",
      ownerWeakness: "Owner never demanded application of these credits. Credits remained at 0% for months. Owner's own review failed to catch this. Some credits may reflect incomplete change order accounting rather than amounts owed.",
      traitEffect: { contractWeight: 0.4, docRequired: 0.4, ownerBias: -0.2, analyticalRigor: 0.6, industryStandard: 0.1, pragmatism: 0.3 },
      baseMcRecovery: 0.35,
    },
    {
      id: "hidden_ohp", category: "mc_counter", title: "CO OH&P Markup Questions",
      description: `REQs 11-14 show 25% markup on change orders not separately itemized on G703. Pattern across 4 consecutive requisitions. Estimated exposure: ${$(ohpEstimate)}.`,
      amountAtStake: ohpEstimate,
      mcStrength: "AIA A110 cost-plus contracts typically allow OH&P on all work including changes. 25% is the contractual rate. MC applied it consistently. Not 'hidden' — it's the contract rate.",
      ownerWeakness: "CO subtotals don't appear as separate G703 line items, making auditing difficult. Owner approved REQs without questioning. But lack of transparency on cost-plus contract is problematic — §15.3.2 requires clear documentation.",
      traitEffect: { contractWeight: 0.3, docRequired: 0.5, ownerBias: -0.1, analyticalRigor: 0.6, industryStandard: -0.3, pragmatism: 0.2 },
      baseMcRecovery: 0.25,
    },
    {
      id: "base_to_co", category: "mc_counter", title: "Base-to-CO Reclassification (REQ-13R1)",
      description: `REQ-13R1 shows ${$(req13Billed)} in revised billing. Work originally billed as base contract appears reclassified as change orders, generating additional markup.`,
      amountAtStake: req13Billed,
      mcStrength: "Reclassification generated additional OH&P on the same work. Pattern visible in the revised requisition. Credits in one column, new CO charges in another.",
      ownerWeakness: "Reclassification may reflect legitimate scope clarification — COs sometimes absorb base work when scope changes. Very complex forensic argument requiring expert testimony. Hard to prove intent vs. accounting correction. Owner approved the revised requisition.",
      traitEffect: { contractWeight: 0.4, docRequired: 0.3, ownerBias: -0.1, analyticalRigor: 0.5, industryStandard: -0.4, pragmatism: 0.3 },
      baseMcRecovery: 0.20,
    },
    {
      id: "korth_overbilling", category: "mc_counter", title: "Korth Painting — Over Contract Value",
      description: `Korth & Shannahan billed $89,942 vs $49,450 contract — 182%. Sub billed carpentry ($26,252) through painting line item. Overage: ${$(korthOver)}.`,
      amountAtStake: korthOver,
      mcStrength: `Numbers are clear: 182% of contract value. Painting sub billing carpentry work is cross-trade contamination. Over-budget by ${$(korthOver)}.`,
      ownerWeakness: "Cost-plus contract means actual costs are billed — if Korth did extra work, owner pays. MC approved and processed all Korth invoices. Some overbilling may reflect legitimate change order work. Owner's architect didn't flag the overrun during monthly reviews.",
      traitEffect: { contractWeight: 0.3, docRequired: 0.4, ownerBias: -0.1, analyticalRigor: 0.5, industryStandard: -0.2, pragmatism: 0.3 },
      baseMcRecovery: 0.35,
    },
    {
      id: "documentation_failures", category: "mc_counter", title: "MC Documentation Deficiencies (§15.3.2)",
      description: `Systemic issues: estimates as invoices, no timecards (13 of 15 REQs), anonymous subs, out-of-period invoices (up to 19 months), supervision as billable cost. Estimated exposure: ${$(docEstimate)}.`,
      amountAtStake: docEstimate,
      mcStrength: "§15.3.2 requires documentation for all costs. MC failed systematically. Estimates are not invoices. Missing timecards means labor costs are unverifiable. Out-of-period billing suggests inaccurate accounting.",
      ownerWeakness: "Owner approved every requisition without objection. Owner's architect reviewed and didn't flag issues. Industry reality: residential construction documentation is often imperfect. Not every documentation gap equals overbilling — MC may have underbilled on some items too.",
      traitEffect: { contractWeight: 0.4, docRequired: 0.7, ownerBias: 0.0, analyticalRigor: 0.5, industryStandard: -0.5, pragmatism: 0.2 },
      baseMcRecovery: 0.22,
    },
  ];
}

// Party strengths/weaknesses — amounts computed from live data
function buildPartyAnalysis(claims, reqs) {
  const totalAgreed = claims.reduce((s, c) => s + (c.agreedAmount || 0), 0);
  const totalPaid = reqs.reduce((s, r) => s + (r.paidAmount || 0), 0);
  const waivedTotal = claims.filter(c => c.status === "WAIVED").reduce((s, c) => s + (c.ownerAmount || 0), 0);
  const unappliedCredits = Math.abs(BACKUP_VARIANCE[16]?.items?.filter(it => it.amount < 0).reduce((s, it) => s + it.amount, 0) ?? 135385);
  return {
  mc: {
    strengths: [
      "§21.11 consequential waiver is clear and enforceable",
      "Offered corrective work on multiple defect claims — owner refused",
      "125 owner-initiated change orders contributed to delays",
      "Manufacturer approved fireplace installation",
      "Framing constraints on air returns documented at weekly meetings",
      "Work substantially complete — owner occupying the home",
      `Agreed credits (${$(totalAgreed)}) show good faith on legitimate items`,
    ],
    weaknesses: [
      "Systemic documentation failures across all 16 requisitions (§15.3.2)",
      "No timecards for 13 of 15 billing periods — labor costs unverifiable",
      "Out-of-period invoices: up to 19 months (ABC Supply in REQ-15)",
      `${$(unappliedCredits)} in unapplied credits acknowledged but never credited to owner`,
      "Korth painting at 182% of contract with cross-trade billing",
      "Estimates submitted as invoices (Boards & Beams in REQ-12)",
      "Hidden CO OH&P pattern across REQs 11-14",
      "Base-to-CO reclassification in REQ-13R1 generates extra markup",
      "Anonymous subs and missing backup on multiple line items",
    ],
  },
  owner: {
    strengths: [
      "Visible, documented defects (fireplace blueboard, curled shingles, door gaps)",
      `MC's own G703 shows ${$(unappliedCredits)} in unapplied credits — MC's admission`,
      "Cost-plus contract requires full transparency — MC failed §15.3.2",
      `Paid ${$(totalPaid)} on a $1.18M base contract — significant investment`,
      "Multiple MC-agreed credits validate pattern of issues",
      "Punchlist items remain incomplete after 2+ years",
      "Expert testimony potential on defect remediation costs",
    ],
    weaknesses: [
      `§21.11 waiver bars consequential/delay claims (${$(waivedTotal)} at risk)`,
      "Approved every requisition without contemporaneous objection",
      "Refused MC's offers of corrective work on fireplace",
      "Refused mechanical engineer recommendation on HVAC",
      "125 change orders created scope changes and timeline impacts",
      "Architect failed to catch billing irregularities during reviews",
      "Withheld final payment, triggering warranty/punchlist standoff",
    ],
  },
  };
}

// Legal team profiles
const LEGAL_TEAM_PROFILES = [
  {
    id: "elite_construction", name: "Elite Construction Litigator",
    description: "Deep AIA/cost-plus expertise. Methodical exhibit preparation. Strong with expert witnesses. Understands G702/G703 inside and out.",
    traits: { preparation: 0.90, constructionKnowledge: 0.95, advocacy: 0.80, crossExam: 0.85 },
  },
  {
    id: "aggressive_trial", name: "Aggressive Trial Attorney",
    description: "High-energy cross-examiner. Maximizes every claim. Strong courtroom presence but may overreach. Less construction-specific knowledge.",
    traits: { preparation: 0.70, constructionKnowledge: 0.45, advocacy: 0.90, crossExam: 0.95 },
  },
  {
    id: "settlement_oriented", name: "Settlement-Oriented Counsel",
    description: "Focused on practical resolution. Strong negotiator. Avoids risk. May leave money on the table to ensure a deal.",
    traits: { preparation: 0.65, constructionKnowledge: 0.60, advocacy: 0.55, crossExam: 0.50 },
  },
  {
    id: "methodical_document", name: "Methodical Document Attorney",
    description: "Builds case entirely on paper trail. Every exhibit labeled and cross-referenced. May lack courtroom flair but evidence is airtight.",
    traits: { preparation: 0.95, constructionKnowledge: 0.70, advocacy: 0.55, crossExam: 0.60 },
  },
  {
    id: "budget_solo", name: "Budget-Conscious Solo",
    description: "Competent but resource-constrained. Limited expert budget. May miss complex forensic accounting issues. Solid on straightforward claims.",
    traits: { preparation: 0.50, constructionKnowledge: 0.50, advocacy: 0.60, crossExam: 0.55 },
  },
];

const LEGAL_TRAIT_LABELS = {
  preparation: { label: "Preparation", desc: "Exhibit quality, witness prep, document organization" },
  constructionKnowledge: { label: "Construction Expertise", desc: "AIA contracts, G702/G703, cost-plus billing knowledge" },
  advocacy: { label: "Advocacy Strength", desc: "Persuasiveness, oral presentation, opening/closing" },
  crossExam: { label: "Cross-Examination", desc: "Ability to undermine opposing witnesses and evidence" },
};

function simulateCase(arb, mcLegal, ownerLegal, disputes) {
  // Legal team quality modifiers (0.85-1.15 range)
  const mcLegalMod = mcLegal ? 0.85 + (Object.values(mcLegal).reduce((s,v) => s + v, 0) / Object.values(mcLegal).length) * 0.30 : 1.0;
  const ownerLegalMod = ownerLegal ? 0.85 + (Object.values(ownerLegal).reduce((s,v) => s + v, 0) / Object.values(ownerLegal).length) * 0.30 : 1.0;

  const results = disputes.map(d => {
    let recovery;
    if (d.category === "owner_claim") {
      recovery = d.baseOwnerRecovery;
      Object.entries(d.traitEffect).forEach(([trait, effect]) => {
        recovery += (arb.traits[trait] || 0.5) * effect * 0.12;
      });
      // Owner's legal team boosts their recovery; MC's legal team reduces it
      recovery = recovery * (ownerLegalMod / mcLegalMod);
      recovery = Math.max(0, Math.min(1, recovery));
      if (arb.traits.pragmatism > 0.7 && recovery > 0.1 && recovery < 0.9) {
        recovery = recovery * 0.7 + 0.15;
      }
      const awarded = Math.round(d.amountAtStake * recovery);
      return { ...d, recovery, awarded, direction: "owner", netMcImpact: -awarded };
    } else {
      recovery = d.baseMcRecovery;
      Object.entries(d.traitEffect).forEach(([trait, effect]) => {
        recovery += (arb.traits[trait] || 0.5) * effect * 0.12;
      });
      // MC's legal team boosts counter-recovery; Owner's legal team reduces it
      recovery = recovery * (mcLegalMod / ownerLegalMod);
      recovery = Math.max(0, Math.min(1, recovery));
      if (arb.traits.pragmatism > 0.7 && recovery > 0.1 && recovery < 0.9) {
        recovery = recovery * 0.7 + 0.15;
      }
      const awarded = Math.round(d.amountAtStake * recovery);
      return { ...d, recovery, awarded, direction: "mc", netMcImpact: awarded };
    }
  });

  const ownerTotal = results.filter(r => r.direction === "owner").reduce((s, r) => s + r.awarded, 0);
  const mcTotal = results.filter(r => r.direction === "mc").reduce((s, r) => s + r.awarded, 0);
  const netPosition = mcTotal - ownerTotal;

  return { results, ownerTotal, mcTotal, netPosition };
}

function ArbitrationSimulator({ reqs, claims }) {
  const disputes = useMemo(() => buildCaseDisputes(claims), [claims]);
  const partyAnalysis = useMemo(() => buildPartyAnalysis(claims, reqs), [claims, reqs]);
  const [selectedIdx, setSelectedIdx] = useState(0);
  const [customMode, setCustomMode] = useState(false);
  const [customTraits, setCustomTraits] = useState({ contractWeight: 0.50, docRequired: 0.50, ownerBias: 0.50, analyticalRigor: 0.50, industryStandard: 0.50, pragmatism: 0.50 });
  const [customName, setCustomName] = useState("");
  const [compareMode, setCompareMode] = useState(false);
  const [mcLegalIdx, setMcLegalIdx] = useState(0);
  const [ownerLegalIdx, setOwnerLegalIdx] = useState(0);
  const [mcCustomLegal, setMcCustomLegal] = useState({ preparation: 0.65, constructionKnowledge: 0.65, advocacy: 0.65, crossExam: 0.65 });
  const [ownerCustomLegal, setOwnerCustomLegal] = useState({ preparation: 0.65, constructionKnowledge: 0.65, advocacy: 0.65, crossExam: 0.65 });
  const [mcLegalCustom, setMcLegalCustom] = useState(false);
  const [ownerLegalCustom, setOwnerLegalCustom] = useState(false);
  const [customResearch, setCustomResearch] = useState({ firm: "", yearsExp: "", practiceAreas: "", panelMemberships: "", publications: "", knownTendencies: "", notes: "" });
  const [simResults, setSimResults] = useState(null);
  const [simStale, setSimStale] = useState(true);
  const [simRunning, setSimRunning] = useState(false);
  const [allSimResults, setAllSimResults] = useState([]);

  // Mark results stale when inputs change
  useEffect(() => { setSimStale(true); }, [disputes, selectedIdx, customMode, customTraits, mcLegalIdx, ownerLegalIdx, mcCustomLegal, ownerCustomLegal, mcLegalCustom, ownerLegalCustom]);

  const activeArb = customMode
    ? { id: "custom", name: customName || "Custom Arbitrator", subtitle: "User-defined personality", traits: customTraits, color: T.textMid, bio: "" }
    : ARBITRATOR_PROFILES[selectedIdx];

  const mcLegal = mcLegalCustom ? mcCustomLegal : LEGAL_TEAM_PROFILES[mcLegalIdx].traits;
  const ownerLegal = ownerLegalCustom ? ownerCustomLegal : LEGAL_TEAM_PROFILES[ownerLegalIdx].traits;

  const handleRunSim = () => {
    setSimRunning(true);
    setTimeout(() => {
      const result = simulateCase(activeArb, mcLegal, ownerLegal, disputes);
      const allSims = ARBITRATOR_PROFILES.map(a => ({ arb: a, sim: simulateCase(a, mcLegal, ownerLegal, disputes) }));
      if (customMode) allSims.push({ arb: activeArb, sim: result });
      setSimResults(result);
      setAllSimResults(allSims);
      setSimStale(false);
      setSimRunning(false);
    }, 400);
  };

  const sim = simResults;
  const allSims = allSimResults;

  const pctBar = (val, max, color) => (
    <div style={{ width: "100%", height: 10, background: T.border, borderRadius: 5, overflow: "hidden" }}>
      <div style={{ width: `${Math.min(100, (val / max) * 100)}%`, height: "100%", background: color, borderRadius: 3, transition: "width 0.4s ease" }} />
    </div>
  );

  const traitSlider = (key, value, onChange, disabled) => (
    <div style={{ marginBottom: 10 }}>
      <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 3 }}>
        <span style={{ fontSize: 11, fontWeight: 500, color: T.text, fontFamily: T.font }}>{TRAIT_LABELS[key].label}</span>
        <span style={{ fontSize: 11, fontFamily: T.mono, color: T.accent }}>{(value * 100).toFixed(0)}%</span>
      </div>
      <input type="range" min="0" max="100" value={Math.round(value * 100)}
        disabled={disabled}
        onChange={e => onChange(parseInt(e.target.value) / 100)}
        style={{ width: "100%", accentColor: activeArb.color, cursor: disabled ? "default" : "pointer", opacity: disabled ? 0.6 : 1 }}
      />
      <div style={{ fontSize: 10, color: T.textMuted, fontFamily: T.font, marginTop: 1 }}>{TRAIT_LABELS[key].desc}</div>
    </div>
  );

  return (
    <div>
      <SectionTitle title="Arbitration Simulator" subtitle="Model case outcomes across different arbitrator personalities · Based on actual case data from 15 requisitions and 24 owner claims" />

      {/* Arbitrator Selection */}
      <Card>
        <CardLabel label="Select Arbitrator Profile" />
        <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginBottom: 16 }}>
          {ARBITRATOR_PROFILES.map((a, i) => (
            <button key={a.id} onClick={() => { setSelectedIdx(i); setCustomMode(false); }} style={{
              padding: "8px 14px", borderRadius: 8, cursor: "pointer", fontFamily: T.font, fontSize: 12, fontWeight: 500,
              border: `1.5px solid ${!customMode && selectedIdx === i ? a.color : T.border}`,
              background: !customMode && selectedIdx === i ? (a.color + "12") : T.surface,
              color: !customMode && selectedIdx === i ? a.color : T.textMid,
              transition: "all 0.15s",
            }}>
              {a.id === "abramowitz" ? "\u2605 " : ""}{a.name}
            </button>
          ))}
          <button onClick={() => setCustomMode(true)} style={{
            padding: "8px 14px", borderRadius: 8, cursor: "pointer", fontFamily: T.font, fontSize: 12, fontWeight: 500,
            border: `1.5px dashed ${customMode ? T.accent : T.border}`,
            background: customMode ? T.accentBg : T.surface,
            color: customMode ? T.accent : T.textMid,
          }}>+ Custom Arbitrator</button>
        </div>

        {/* Profile Info */}
        <div style={{ display: "grid", gridTemplateColumns: "1fr 340px", gap: 20 }}>
          <div>
            <div style={{ display: "flex", alignItems: "baseline", gap: 10, marginBottom: 4 }}>
              <span style={{ fontSize: 18, fontWeight: 600, color: activeArb.color, fontFamily: T.font }}>{activeArb.name}</span>
            </div>
            <div style={{ fontSize: 12, color: T.textMuted, fontFamily: T.font, marginBottom: 10 }}>{activeArb.subtitle}</div>
            {activeArb.bio && <div style={{ fontSize: 12, color: T.textMid, fontFamily: T.font, lineHeight: 1.7, padding: "10px 14px", background: T.bg, borderRadius: 8 }}>{activeArb.bio}</div>}
            {customMode && (
              <div style={{ marginTop: 10 }}>
                <input type="text" placeholder="Enter arbitrator name..." value={customName} onChange={e => setCustomName(e.target.value)}
                  style={{ width: "100%", padding: "8px 12px", borderRadius: 6, border: `1px solid ${T.border}`, fontSize: 13, fontFamily: T.font, color: T.text, background: T.surface }} />
              </div>
            )}
          </div>
          <div style={{ padding: "12px 16px", background: T.bg, borderRadius: 10, border: `1px solid ${T.border}` }}>
            <div style={{ fontSize: 11, fontWeight: 600, color: T.textMuted, letterSpacing: 0.5, marginBottom: 12 }}>PERSONALITY TRAITS</div>
            {Object.keys(TRAIT_LABELS).map(key => traitSlider(
              key,
              activeArb.traits[key],
              (v) => customMode && setCustomTraits(prev => ({ ...prev, [key]: v })),
              !customMode
            ))}
          </div>
        </div>
      </Card>

      {/* Legal Teams */}
      <Card>
        <CardLabel label="Legal Team Profiles" />
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 20 }}>
          {[{ side: "MC Legal Team", profiles: LEGAL_TEAM_PROFILES, idx: mcLegalIdx, setIdx: setMcLegalIdx, isCustom: mcLegalCustom, setCustom: setMcLegalCustom, customTraits: mcCustomLegal, setCustomTraits: setMcCustomLegal, color: T.accent },
            { side: "Owner Legal Team", profiles: LEGAL_TEAM_PROFILES, idx: ownerLegalIdx, setIdx: setOwnerLegalIdx, isCustom: ownerLegalCustom, setCustom: setOwnerLegalCustom, customTraits: ownerCustomLegal, setCustomTraits: setOwnerCustomLegal, color: T.blue }]
          .map(({ side, profiles, idx, setIdx, isCustom, setCustom, customTraits: ct, setCustomTraits: setCt, color }) => (
            <div key={side} style={{ padding: "14px 16px", background: T.bg, borderRadius: 10, border: `1px solid ${T.border}` }}>
              <div style={{ fontSize: 12, fontWeight: 600, color, letterSpacing: 0.3, marginBottom: 10, fontFamily: T.font }}>{side}</div>
              <div style={{ display: "flex", gap: 4, flexWrap: "wrap", marginBottom: 12 }}>
                {profiles.map((p, i) => (
                  <button key={p.id} onClick={() => { setIdx(i); setCustom(false); }} style={{
                    padding: "4px 10px", borderRadius: 6, cursor: "pointer", fontFamily: T.font, fontSize: 10, fontWeight: 500,
                    border: `1px solid ${!isCustom && idx === i ? color : T.border}`,
                    background: !isCustom && idx === i ? color + "15" : T.surface,
                    color: !isCustom && idx === i ? color : T.textMuted,
                  }}>{p.name}</button>
                ))}
                <button onClick={() => setCustom(true)} style={{
                  padding: "4px 10px", borderRadius: 6, cursor: "pointer", fontFamily: T.font, fontSize: 10, fontWeight: 500,
                  border: `1px dashed ${isCustom ? color : T.border}`,
                  background: isCustom ? color + "15" : T.surface, color: isCustom ? color : T.textMuted,
                }}>Custom</button>
              </div>
              <div style={{ fontSize: 11, color: T.textMid, marginBottom: 8, fontFamily: T.font }}>
                {isCustom ? "Adjust traits below:" : profiles[idx].description}
              </div>
              {Object.keys(LEGAL_TRAIT_LABELS).map(key => (
                <div key={key} style={{ marginBottom: 6 }}>
                  <div style={{ display: "flex", justifyContent: "space-between" }}>
                    <span style={{ fontSize: 10, color: T.textMid, fontFamily: T.font }}>{LEGAL_TRAIT_LABELS[key].label}</span>
                    <span style={{ fontSize: 10, fontFamily: T.mono, color }}>{((isCustom ? ct[key] : profiles[idx].traits[key]) * 100).toFixed(0)}%</span>
                  </div>
                  <input type="range" min="0" max="100" value={Math.round((isCustom ? ct[key] : profiles[idx].traits[key]) * 100)}
                    disabled={!isCustom} onChange={e => isCustom && setCt(prev => ({ ...prev, [key]: parseInt(e.target.value) / 100 }))}
                    style={{ width: "100%", accentColor: color, height: 4, cursor: isCustom ? "pointer" : "default", opacity: isCustom ? 1 : 0.5 }} />
                </div>
              ))}
            </div>
          ))}
        </div>
      </Card>

      {/* Party Strengths & Weaknesses */}
      <Card>
        <CardLabel label="Balanced Case Assessment — Both Parties" />
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
          {[{ party: "Montana Contracting (GC)", data: partyAnalysis.mc, color: T.accent },
            { party: "Tharp/Bumgardner (Owner)", data: partyAnalysis.owner, color: T.blue }].map(({ party, data, color }) => (
            <div key={party}>
              <div style={{ fontSize: 13, fontWeight: 600, color, fontFamily: T.font, marginBottom: 10 }}>{party}</div>
              <div style={{ padding: 12, background: T.greenBg, border: `1px solid ${T.greenBorder}`, borderRadius: 8, marginBottom: 8 }}>
                <div style={{ fontSize: 10, fontWeight: 600, color: T.green, letterSpacing: 0.5, marginBottom: 6 }}>STRENGTHS</div>
                {data.strengths.map((s, i) => (
                  <div key={i} style={{ fontSize: 11, color: T.textMid, fontFamily: T.font, lineHeight: 1.6, paddingLeft: 10, borderLeft: `2px solid ${T.greenBorder}`, marginBottom: 4 }}>{s}</div>
                ))}
              </div>
              <div style={{ padding: 12, background: T.redBg, border: `1px solid ${T.redBorder}`, borderRadius: 8 }}>
                <div style={{ fontSize: 10, fontWeight: 600, color: T.red, letterSpacing: 0.5, marginBottom: 6 }}>WEAKNESSES</div>
                {data.weaknesses.map((w, i) => (
                  <div key={i} style={{ fontSize: 11, color: T.textMid, fontFamily: T.font, lineHeight: 1.6, paddingLeft: 10, borderLeft: `2px solid ${T.redBorder}`, marginBottom: 4 }}>{w}</div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </Card>

      {/* Run Simulation */}
      <div style={{ display: "flex", alignItems: "center", gap: 16, marginBottom: 16 }}>
        <PrimaryButton label={!sim ? "Run Simulation" : simStale ? "Resimulate" : "Simulation Complete"} icon={!sim || simStale ? "play" : "check"} size="lg" loading={simRunning} onClick={handleRunSim} variant={!sim || simStale ? "primary" : "secondary"} />
        {simStale && sim && <span style={{ fontSize: 12, color: T.amber, fontFamily: T.font, display: "flex", alignItems: "center", gap: 6 }}><Ic name="alert" size={14} color={T.amber} />Parameters changed — resimulate for updated results</span>}
        {sim && !simStale && <span style={{ fontSize: 12, color: T.green, fontFamily: T.font, display: "flex", alignItems: "center", gap: 6 }}><Ic name="check" size={14} color={T.green} />Results current</span>}
      </div>

      {/* Simulation Results */}
      {!sim ? (
        <Card style={{ textAlign: "center", padding: 48 }}>
          <Ic name="cpu" size={40} color={T.border} />
          <div style={{ fontSize: 15, fontWeight: 500, color: T.textMid, fontFamily: T.font, marginTop: 16 }}>Configure arbitrator and legal teams above</div>
          <div style={{ fontSize: 13, color: T.textMuted, fontFamily: T.font, marginTop: 6 }}>Then click <strong>Run Simulation</strong> to generate projected case outcomes</div>
        </Card>
      ) : (
      <Card>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
          <CardLabel label="Simulated Case Outcome" />
          <PrimaryButton label={compareMode ? "Hide Comparison" : "Compare All"} onClick={() => setCompareMode(!compareMode)} variant={compareMode ? "secondary" : "ghost"} size="sm" icon="bar-chart" />
        </div>

        {/* Net Position Summary */}
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 12, marginBottom: 20 }}>
          <div style={{ padding: 16, background: T.redBg, border: `1px solid ${T.redBorder}`, borderRadius: 10, textAlign: "center" }}>
            <div style={{ fontSize: 11, fontWeight: 600, color: T.red, letterSpacing: 0.5, marginBottom: 6 }}>OWNER RECOVERY</div>
            <div style={{ fontFamily: T.mono, fontSize: 22, fontWeight: 700, color: T.red }}>${sim.ownerTotal.toLocaleString()}</div>
            <div style={{ fontSize: 11, color: T.textMuted, marginTop: 4 }}>of ${disputes.filter(d=>d.category==="owner_claim").reduce((s,d)=>s+d.amountAtStake,0).toLocaleString()} claimed</div>
          </div>
          <div style={{ padding: 16, background: T.greenBg, border: `1px solid ${T.greenBorder}`, borderRadius: 10, textAlign: "center" }}>
            <div style={{ fontSize: 11, fontWeight: 600, color: T.green, letterSpacing: 0.5, marginBottom: 6 }}>MC COUNTER-RECOVERY</div>
            <div style={{ fontFamily: T.mono, fontSize: 22, fontWeight: 700, color: T.green }}>${sim.mcTotal.toLocaleString()}</div>
            <div style={{ fontSize: 11, color: T.textMuted, marginTop: 4 }}>of ${disputes.filter(d=>d.category==="mc_counter").reduce((s,d)=>s+d.amountAtStake,0).toLocaleString()} at stake</div>
          </div>
          <div style={{ padding: 16, background: sim.netPosition >= 0 ? T.greenBg : T.redBg, border: `1px solid ${sim.netPosition >= 0 ? T.greenBorder : T.redBorder}`, borderRadius: 10, textAlign: "center" }}>
            <div style={{ fontSize: 11, fontWeight: 600, color: sim.netPosition >= 0 ? T.green : T.red, letterSpacing: 0.5, marginBottom: 6 }}>MC NET POSITION</div>
            <div style={{ fontFamily: T.mono, fontSize: 22, fontWeight: 700, color: sim.netPosition >= 0 ? T.green : T.red }}>{sim.netPosition >= 0 ? "+" : "-"}${Math.abs(sim.netPosition).toLocaleString()}</div>
            <div style={{ fontSize: 11, color: T.textMuted, marginTop: 4 }}>{sim.netPosition >= 0 ? "MC net recovery" : "MC net liability"}</div>
          </div>
        </div>

        {/* Issue-by-issue breakdown */}
        <div style={{ fontSize: 11, fontWeight: 600, color: T.textMuted, letterSpacing: 0.5, marginBottom: 8 }}>OWNER CLAIMS — EXPOSURE ANALYSIS</div>
        <table style={{ width: "100%", borderCollapse: "collapse", marginBottom: 20 }}>
          <thead>
            <tr>
              {["ISSUE", "CLAIMED", "PROJECTED AWARD", "RECOVERY %", ""].map(h => (
                <th key={h} style={{ padding: "8px 12px", textAlign: "left", fontSize: 10, fontWeight: 600, letterSpacing: 0.5, color: T.textMuted, borderBottom: `1px solid ${T.border}`, fontFamily: T.font }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {sim.results.filter(r => r.direction === "owner").map(r => (
              <tr key={r.id}>
                <td style={{ padding: "10px 12px", fontSize: 12, fontFamily: T.font, color: T.text, borderBottom: `1px solid ${T.border}`, maxWidth: 300 }}>
                  <div style={{ fontWeight: 500 }}>{r.title}</div>
                  <div style={{ fontSize: 11, color: T.textMuted, marginTop: 2 }}>{r.description}</div>
                  {r.ownerStrength && <div style={{ fontSize: 10, color: T.blue, marginTop: 3 }}><b>Owner:</b> {r.ownerStrength.substring(0, 100)}...</div>}
                  {r.mcStrength && <div style={{ fontSize: 10, color: T.accent, marginTop: 1 }}><b>MC:</b> {r.mcStrength.substring(0, 100)}...</div>}
                </td>
                <td style={{ padding: "10px 12px", fontFamily: T.mono, fontSize: 12, color: T.textMid, borderBottom: `1px solid ${T.border}` }}>${r.amountAtStake.toLocaleString()}</td>
                <td style={{ padding: "10px 12px", fontFamily: T.mono, fontSize: 13, fontWeight: 600, color: r.awarded > 0 ? T.red : T.green, borderBottom: `1px solid ${T.border}` }}>${r.awarded.toLocaleString()}</td>
                <td style={{ padding: "10px 12px", borderBottom: `1px solid ${T.border}`, width: 140 }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                    <span style={{ fontSize: 11, fontFamily: T.mono, color: T.textMid, minWidth: 32 }}>{(r.recovery * 100).toFixed(0)}%</span>
                    {pctBar(r.recovery, 1, r.recovery > 0.5 ? T.red : r.recovery > 0.25 ? T.amber : T.green)}
                  </div>
                </td>
                <td style={{ padding: "10px 12px", borderBottom: `1px solid ${T.border}` }}>
                  <Badge label={r.recovery > 0.5 ? "HIGH RISK" : r.recovery > 0.25 ? "MODERATE" : "LOW RISK"}
                    style={r.recovery > 0.5 ? { color: T.red, bg: T.redBg, border: T.redBorder } : r.recovery > 0.25 ? { color: T.amber, bg: T.amberBg, border: T.amberBorder } : { color: T.green, bg: T.greenBg, border: T.greenBorder }} />
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        <div style={{ fontSize: 11, fontWeight: 600, color: T.textMuted, letterSpacing: 0.5, marginBottom: 8 }}>MC COUNTERCLAIMS — RECOVERY PROJECTIONS</div>
        <table style={{ width: "100%", borderCollapse: "collapse", marginBottom: 20 }}>
          <thead>
            <tr>
              {["ISSUE", "AT STAKE", "PROJECTED RECOVERY", "PROBABILITY", ""].map(h => (
                <th key={h} style={{ padding: "8px 12px", textAlign: "left", fontSize: 10, fontWeight: 600, letterSpacing: 0.5, color: T.textMuted, borderBottom: `1px solid ${T.border}`, fontFamily: T.font }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {sim.results.filter(r => r.direction === "mc").map(r => (
              <tr key={r.id}>
                <td style={{ padding: "10px 12px", fontSize: 12, fontFamily: T.font, color: T.text, borderBottom: `1px solid ${T.border}`, maxWidth: 300 }}>
                  <div style={{ fontWeight: 500 }}>{r.title}</div>
                  <div style={{ fontSize: 11, color: T.textMuted, marginTop: 2 }}>{r.description}</div>
                  {r.mcStrength && <div style={{ fontSize: 10, color: T.accent, marginTop: 3 }}><b>MC:</b> {r.mcStrength.substring(0, 100)}...</div>}
                  {r.ownerWeakness && <div style={{ fontSize: 10, color: T.blue, marginTop: 1 }}><b>Owner counter:</b> {r.ownerWeakness.substring(0, 100)}...</div>}
                </td>
                <td style={{ padding: "10px 12px", fontFamily: T.mono, fontSize: 12, color: T.textMid, borderBottom: `1px solid ${T.border}` }}>${r.amountAtStake.toLocaleString()}</td>
                <td style={{ padding: "10px 12px", fontFamily: T.mono, fontSize: 13, fontWeight: 600, color: T.green, borderBottom: `1px solid ${T.border}` }}>${r.awarded.toLocaleString()}</td>
                <td style={{ padding: "10px 12px", borderBottom: `1px solid ${T.border}`, width: 140 }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                    <span style={{ fontSize: 11, fontFamily: T.mono, color: T.textMid, minWidth: 32 }}>{(r.recovery * 100).toFixed(0)}%</span>
                    {pctBar(r.recovery, 1, r.recovery > 0.6 ? T.green : r.recovery > 0.35 ? T.amber : T.red)}
                  </div>
                </td>
                <td style={{ padding: "10px 12px", borderBottom: `1px solid ${T.border}` }}>
                  <Badge label={r.recovery > 0.6 ? "LIKELY" : r.recovery > 0.35 ? "POSSIBLE" : "UNLIKELY"}
                    style={r.recovery > 0.6 ? { color: T.green, bg: T.greenBg, border: T.greenBorder } : r.recovery > 0.35 ? { color: T.amber, bg: T.amberBg, border: T.amberBorder } : { color: T.red, bg: T.redBg, border: T.redBorder }} />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </Card>
      )}

      {/* Comparison Mode */}
      {compareMode && sim && (
        <Card>
          <CardLabel label="All Arbitrators — Side-by-Side Comparison" />
          <table style={{ width: "100%", borderCollapse: "collapse" }}>
            <thead>
              <tr>
                {["ARBITRATOR", "OWNER RECOVERY", "MC COUNTER", "NET MC POSITION", "VERDICT"].map(h => (
                  <th key={h} style={{ padding: "10px 14px", textAlign: "left", fontSize: 10, fontWeight: 600, letterSpacing: 0.5, color: T.textMuted, borderBottom: `1px solid ${T.border}`, fontFamily: T.font }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {allSims.sort((a, b) => b.sim.netPosition - a.sim.netPosition).map(({ arb: a, sim: s }) => (
                <tr key={a.id} style={{ background: a.id === activeArb.id ? T.accentBg : "transparent" }}>
                  <td style={{ padding: "12px 14px", borderBottom: `1px solid ${T.border}` }}>
                    <div style={{ fontSize: 13, fontWeight: 600, color: a.color, fontFamily: T.font }}>{a.id === "abramowitz" ? "\u2605 " : ""}{a.name}</div>
                    <div style={{ fontSize: 11, color: T.textMuted }}>{a.subtitle}</div>
                  </td>
                  <td style={{ padding: "12px 14px", fontFamily: T.mono, fontSize: 13, color: T.red, borderBottom: `1px solid ${T.border}` }}>-${s.ownerTotal.toLocaleString()}</td>
                  <td style={{ padding: "12px 14px", fontFamily: T.mono, fontSize: 13, color: T.green, borderBottom: `1px solid ${T.border}` }}>+${s.mcTotal.toLocaleString()}</td>
                  <td style={{ padding: "12px 14px", fontFamily: T.mono, fontSize: 14, fontWeight: 700, color: s.netPosition >= 0 ? T.green : T.red, borderBottom: `1px solid ${T.border}` }}>
                    {s.netPosition >= 0 ? "+" : "-"}${Math.abs(s.netPosition).toLocaleString()}
                  </td>
                  <td style={{ padding: "12px 14px", borderBottom: `1px solid ${T.border}` }}>
                    <Badge label={s.netPosition > 100000 ? "STRONG MC WIN" : s.netPosition > 30000 ? "MC FAVORABLE" : s.netPosition > 0 ? "SLIGHT MC EDGE" : s.netPosition > -30000 ? "TOSS-UP" : "OWNER FAVORABLE"}
                      style={s.netPosition > 30000 ? { color: T.green, bg: T.greenBg, border: T.greenBorder } : s.netPosition > 0 ? { color: T.amber, bg: T.amberBg, border: T.amberBorder } : { color: T.red, bg: T.redBg, border: T.redBorder }} />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </Card>
      )}
    </div>
  );
}

// ── DOCUMENTS ────────────────────────────────────────────────────────────────

const DOC_CATEGORIES = [
  { id: "contract", label: "Contract Documents", ic: "file-text", color: T.accent },
  { id: "requisition", label: "Requisitions / Pay Apps", ic: "dollar", color: T.green },
  { id: "change_order", label: "Change Orders", ic: "refresh", color: T.blue },
  { id: "correspondence", label: "Correspondence", ic: "mail", color: T.purple },
  { id: "invoice", label: "Invoices & Backup", ic: "receipt", color: T.amber },
  { id: "inspection", label: "Inspections & Reports", ic: "search", color: T.red },
  { id: "photo", label: "Photos & Media", ic: "camera", color: T.textMid },
  { id: "arbitration", label: "Arbitration Filings", ic: "scale", color: T.accent },
  { id: "other", label: "Other", ic: "folder", color: T.textMuted },
];

const DOCS_INITIAL = [
  { id: "doc-001", category: "contract", name: "AIA A110-2021 — Standard Form of Agreement (Cost-Plus)", date: "2021-06-15", description: "Prime contract between Montana Contracting Corp and Tharp/Bumgardner. Cost of Work + 25% OH&P.", parties: "MC / Tharp", status: "final", notes: "" },
  { id: "doc-002", category: "contract", name: "AIA A201-2017 — General Conditions", date: "2021-06-15", description: "General Conditions of the Contract for Construction, incorporated by reference.", parties: "MC / Tharp", status: "final", notes: "" },
  { id: "doc-003", category: "contract", name: "Original Scope / Plans & Specifications", date: "2021-06-15", description: "Architectural drawings and specifications for 515 N. Midland Ave renovation.", parties: "", status: "final", notes: "" },
  { id: "doc-004", category: "requisition", name: "REQ-01 — September 2022", date: "2022-09-30", description: "First requisition. Base contract billing $113,282.46 + markup.", parties: "MC", status: "submitted", notes: "" },
  { id: "doc-005", category: "requisition", name: "REQ-02 — October 2022", date: "2022-10-31", description: "Second requisition. Cumulative billing through October 2022.", parties: "MC", status: "submitted", notes: "" },
  { id: "doc-006", category: "requisition", name: "REQ-03 — November 2022", date: "2022-11-30", description: "Third requisition. Includes early-stage subcontractor invoices.", parties: "MC", status: "submitted", notes: "" },
  { id: "doc-007", category: "requisition", name: "REQ-04 — December 2022", date: "2022-12-31", description: "Fourth requisition.", parties: "MC", status: "submitted", notes: "" },
  { id: "doc-008", category: "requisition", name: "REQ-05 — January 2023", date: "2023-01-31", description: "Fifth requisition.", parties: "MC", status: "submitted", notes: "" },
  { id: "doc-009", category: "requisition", name: "REQ-06 — February 2023", date: "2023-02-28", description: "Sixth requisition.", parties: "MC", status: "submitted", notes: "" },
  { id: "doc-010", category: "requisition", name: "REQ-07 — March 2023", date: "2023-03-31", description: "Seventh requisition.", parties: "MC", status: "submitted", notes: "" },
  { id: "doc-011", category: "requisition", name: "REQ-08 — April 2023", date: "2023-04-30", description: "Eighth requisition.", parties: "MC", status: "submitted", notes: "" },
  { id: "doc-012", category: "requisition", name: "REQ-09 — May 2023", date: "2023-05-31", description: "Ninth requisition.", parties: "MC", status: "submitted", notes: "" },
  { id: "doc-013", category: "requisition", name: "REQ-10 — June 2023", date: "2023-06-30", description: "Tenth requisition.", parties: "MC", status: "submitted", notes: "" },
  { id: "doc-014", category: "requisition", name: "REQ-11 — July 2023", date: "2023-07-31", description: "Eleventh requisition.", parties: "MC", status: "submitted", notes: "" },
  { id: "doc-015", category: "requisition", name: "REQ-12 — August 2023", date: "2023-08-31", description: "Twelfth requisition.", parties: "MC", status: "submitted", notes: "" },
  { id: "doc-016", category: "requisition", name: "REQ-13 — September 2023", date: "2023-09-30", description: "Thirteenth requisition.", parties: "MC", status: "submitted", notes: "" },
  { id: "doc-017", category: "requisition", name: "REQ-14 — October 2023", date: "2023-10-31", description: "Fourteenth requisition.", parties: "MC", status: "submitted", notes: "" },
  { id: "doc-018", category: "requisition", name: "REQ-15 — November 2023", date: "2023-11-30", description: "Fifteenth requisition.", parties: "MC", status: "submitted", notes: "" },
  { id: "doc-018b", category: "requisition", name: "REQ-16 — January 2024", date: "2024-01-30", description: "Sixteenth requisition. Largest single requisition at $235,461. Project over-billed by $53,162. Multiple lines over budget (Insulation 200%, Custom Casework 155%, Framing Material 165%).", parties: "MC", status: "submitted", notes: "" },
  { id: "doc-019", category: "arbitration", name: "AAA Demand for Arbitration", date: "2024-01-15", description: "Filed under AAA Case No. 01-24-0004-6683. Construction Industry Arbitration Rules.", parties: "MC / Tharp", status: "filed", notes: "" },
  { id: "doc-020", category: "arbitration", name: "Arbitrator Appointment — Robin S. Abramowitz", date: "2024-03-01", description: "AAA Construction Panel arbitrator assigned. Bond, Schoeneck & King PLLC.", parties: "AAA", status: "confirmed", notes: "" },
  { id: "doc-021", category: "correspondence", name: "Owner Punch List / Deficiency Claims", date: "2023-12-01", description: "Owner's list of alleged construction deficiencies including fireplace, air returns, and misc items.", parties: "Tharp", status: "received", notes: "" },
  { id: "doc-022", category: "change_order", name: "Change Order Log — Summary", date: "2023-11-30", description: "Summary of all change orders issued during the project. Includes approved, pending, and disputed COs.", parties: "MC / Tharp", status: "active", notes: "" },
  { id: "doc-023", category: "invoice", name: "Korth Plumbing Invoice Package", date: "2023-09-15", description: "Korth plumbing invoices — subject to overbilling dispute. Owner alleges duplicate / inflated charges.", parties: "Korth / MC", status: "disputed", notes: "" },
];

function Documents({ docs, updateDoc, addDoc, removeDoc, reqs = [] }) {
  const [filter, setFilter] = useState("all");
  const [tagFilter, setTagFilter] = useState(null);
  const [sel, setSel] = useState(null);
  const [adding, setAdding] = useState(false);
  const [newDoc, setNewDoc] = useState({ category: "other", name: "", date: "", description: "", parties: "", status: "draft", notes: "" });
  const [search, setSearch] = useState("");
  const [dragOver, setDragOver] = useState(false);
  const [uploading, setUploading] = useState([]); // [{name, progress, status}]
  const [uploadSummary, setUploadSummary] = useState(null);
  const [newTag, setNewTag] = useState("");


  const filtered = docs.filter(d => {
    if (filter !== "all" && d.category !== filter) return false;
    if (tagFilter && !(d.tags || []).includes(tagFilter)) return false;
    if (search) {
      const q = search.toLowerCase();
      return d.name.toLowerCase().includes(q)
        || (d.description || "").toLowerCase().includes(q)
        || (d.notes || "").toLowerCase().includes(q)
        || (d.extractedText || "").toLowerCase().includes(q)
        || (d.tags || []).some(t => t.toLowerCase().includes(q))
        || (d.vendor || "").toLowerCase().includes(q)
        || (d.costCode || "").toLowerCase().includes(q)
        || (d.fileName || "").toLowerCase().includes(q);
    }
    return true;
  });

  const editing = sel ? docs.find(d => d.id === sel) : null;
  const catCounts = DOC_CATEGORIES.map(c => ({ ...c, count: docs.filter(d => d.category === c.id).length }));

  // Collect all unique tags across docs
  const allTags = [...new Set(docs.flatMap(d => d.tags || []))].sort();
  const uploadedCount = docs.filter(d => d.storagePath).length;

  const ThStyle = { padding: `${T.sp3}px ${T.sp4}px`, textAlign: "left", fontSize: T.fs1, fontWeight: 600, letterSpacing: 0.5, color: T.textMuted, fontFamily: T.font, borderBottom: `1px solid ${T.border}`, background: T.bg };
  const TdStyle = { padding: `${T.sp3}px ${T.sp4}px`, fontSize: T.fs3, fontFamily: T.font, color: T.text, borderBottom: `1px solid ${T.border}` };

  const catInfo = (catId) => DOC_CATEGORIES.find(c => c.id === catId) || DOC_CATEGORIES[DOC_CATEGORIES.length - 1];

  const handleAdd = () => {
    const id = "doc-" + String(docs.length + 1).padStart(3, "0") + "-" + Date.now().toString(36);
    addDoc({ ...newDoc, id, tags: [], linkedReqs: [], storagePath: null, fileName: null, fileSize: 0, mimeType: null, extractedText: null, vendor: null, costCode: null });
    setNewDoc({ category: "other", name: "", date: "", description: "", parties: "", status: "draft", notes: "" });
    setAdding(false);
  };

  // ── File Upload Handler ──
  const processFiles = async (files) => {
    if (!files || files.length === 0) return;
    if (!window._sb) {
      alert("File upload requires cloud mode (Supabase). The app is currently in local-only mode.");
      return;
    }

    const fileArr = Array.from(files);
    const summary = { total: fileArr.length, uploaded: 0, categorized: 0, tagged: 0 };
    setUploading(fileArr.map(f => ({ name: f.name, progress: 0, status: "pending" })));

    for (let i = 0; i < fileArr.length; i++) {
      const file = fileArr[i];
      setUploading(prev => prev.map((u, j) => j === i ? { ...u, status: "uploading", progress: 30 } : u));

      // Build storage path: category/filename (sanitized)
      const classify = autoClassifyFile(file.name);
      const safeName = file.name.replace(/[^a-zA-Z0-9._-]/g, "_");
      const storagePath = classify.category + "/" + Date.now() + "-" + safeName;

      // Upload to Supabase Storage
      const path = await fileUpload(file, storagePath);
      if (!path) {
        setUploading(prev => prev.map((u, j) => j === i ? { ...u, status: "error", progress: 100 } : u));
        continue;
      }

      setUploading(prev => prev.map((u, j) => j === i ? { ...u, progress: 60, status: "parsing" } : u));

      // Parse file content for text extraction
      let extractedText = null;
      let textTags = [];
      const mime = file.type || "";
      if (mime === "application/pdf") {
        const url = fileGetUrl(path);
        if (url) extractedText = await extractPdfText(url);
      } else if (mime.includes("sheet") || mime.includes("excel") || file.name.match(/\.xlsx?$/i)) {
        extractedText = await extractXlsxData(file);
      }
      if (extractedText) {
        textTags = extractTagsFromText(extractedText);
      }

      // Merge filename tags + text-extracted tags
      const allFileTags = [...new Set([...classify.tags, ...textTags])];
      const allLinkedReqs = [...new Set([...classify.linkedReqs, ...textTags.filter(t => t.match(/^REQ-\d{2}$/))])];

      setUploading(prev => prev.map((u, j) => j === i ? { ...u, progress: 90, status: "saving" } : u));

      // Create document record
      const id = "doc-" + Date.now().toString(36) + "-" + Math.random().toString(36).slice(2, 6);
      const newDocRecord = {
        id,
        category: classify.category,
        name: file.name.replace(/\.[^.]+$/, "").replace(/[_-]/g, " "),
        date: new Date().toISOString().slice(0, 10),
        description: classify.vendor ? `${classify.vendor} — auto-imported` : "Auto-imported",
        parties: classify.vendor || "",
        status: classify.status || "received",
        notes: "",
        storagePath: path,
        fileName: file.name,
        fileSize: file.size,
        mimeType: mime,
        tags: allFileTags,
        linkedReqs: allLinkedReqs,
        extractedText: extractedText,
        vendor: classify.vendor,
        costCode: classify.costCode,
      };

      addDoc(newDocRecord);
      summary.uploaded++;
      if (classify.category !== "other") summary.categorized++;
      if (allFileTags.length > 0) summary.tagged++;

      // AI auto-analysis (non-blocking)
      if (window._openaiKey && extractedText) {
        analyzeUploadedDoc(newDocRecord, extractedText, reqs)
          .then(aiUpdates => { if (aiUpdates) updateDoc(id, aiUpdates); })
          .catch(err => console.warn("[AI] Upload analysis failed:", err.message));
      }

      setUploading(prev => prev.map((u, j) => j === i ? { ...u, progress: 100, status: "done" } : u));
    }

    setUploadSummary(summary);
    setTimeout(() => { setUploading([]); }, 3000);
    setTimeout(() => { setUploadSummary(null); }, 8000);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setDragOver(false);
    processFiles(e.dataTransfer.files);
  };

  const handleFileInput = (e) => {
    processFiles(e.target.files);
    e.target.value = "";
  };

  // Tag management
  const addTag = (docId, tag) => {
    const doc = docs.find(d => d.id === docId);
    if (!doc || !tag.trim()) return;
    const tags = [...(doc.tags || [])];
    if (!tags.includes(tag.trim())) tags.push(tag.trim());
    updateDoc(docId, { tags });
  };

  const removeTag = (docId, tag) => {
    const doc = docs.find(d => d.id === docId);
    if (!doc) return;
    updateDoc(docId, { tags: (doc.tags || []).filter(t => t !== tag) });
  };

  // Open file preview
  const openFile = (doc) => {
    if (!doc.storagePath) return;
    const url = fileGetUrl(doc.storagePath);
    if (url) window.open(url, "_blank");
  };

  return (
    <div style={{ display: "grid", gridTemplateColumns: editing || adding ? "1fr 420px" : "1fr", gap: T.sp5, alignItems: "start" }}>
      <div>
        <SectionTitle title="Documents" subtitle={`${docs.length} documents · ${uploadedCount} with files · ${allTags.length} unique tags`} />

        {/* Upload Zone */}
        <div
          onDragOver={e => { e.preventDefault(); setDragOver(true); }}
          onDragLeave={() => setDragOver(false)}
          onDrop={handleDrop}
          style={{
            border: `2px dashed ${dragOver ? T.accent : T.border}`,
            borderRadius: T.r2,
            padding: uploading.length > 0 ? `${T.sp3}px ${T.sp5}px` : `${T.sp6}px ${T.sp5}px`,
            marginBottom: T.sp4,
            textAlign: "center",
            background: dragOver ? T.accentBg : T.surface,
            transition: T.med,
            cursor: "pointer",
          }}
          onClick={() => { if (uploading.length === 0) document.getElementById("doc-file-input")?.click(); }}
        >
          {uploading.length === 0 ? (
            <div>
              <div style={{ marginBottom: T.sp2 }}><Ic name="upload" size={28} color={T.textMuted} /></div>
              <div style={{ fontSize: T.fs3, fontWeight: 500, color: T.text, fontFamily: T.font }}>
                Drop files here to upload, or <span style={{ color: T.accent, textDecoration: "underline" }}>browse</span>
              </div>
              <div style={{ fontSize: T.fs1, color: T.textMuted, marginTop: T.sp1, fontFamily: T.font }}>
                PDF, XLSX, images, and other documents · Auto-categorizes and extracts tags
              </div>
              <input id="doc-file-input" type="file" multiple style={{ display: "none" }} onChange={handleFileInput} />
            </div>
          ) : (
            <div style={{ textAlign: "left" }}>
              {uploading.map((u, i) => (
                <div key={i} style={{ display: "flex", alignItems: "center", gap: T.sp3, padding: `${T.sp1}px 0` }}>
                  <span style={{ fontSize: T.fs2, fontFamily: T.font, color: T.textMid, flex: 1, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{u.name}</span>
                  <div style={{ width: 100, height: 4, borderRadius: T.r1, background: T.border, flexShrink: 0 }}>
                    <div style={{ width: u.progress + "%", height: "100%", borderRadius: T.r1, background: u.status === "error" ? T.red : u.status === "done" ? T.green : T.accent, transition: T.med }} />
                  </div>
                  <span style={{ fontSize: T.fs1, color: u.status === "error" ? T.red : u.status === "done" ? T.green : T.textMuted, fontFamily: T.font, width: 60, textAlign: "right" }}>
                    {u.status === "error" ? "Failed" : u.status === "done" ? "Done" : u.status === "parsing" ? "Parsing…" : u.status === "saving" ? "Saving…" : "Uploading…"}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Upload Summary Banner */}
        {uploadSummary && (
          <div style={{ padding: `${T.sp3}px ${T.sp4}px`, borderRadius: T.r2, background: T.greenBg, border: `1px solid ${T.green}22`, marginBottom: T.sp4, display: "flex", gap: T.sp4, alignItems: "center" }}>
            <span style={{ fontSize: T.fs5 }}>✅</span>
            <span style={{ fontSize: T.fs2, fontFamily: T.font, color: T.green }}>
              <strong>{uploadSummary.uploaded}</strong> of {uploadSummary.total} files uploaded · <strong>{uploadSummary.categorized}</strong> auto-categorized · <strong>{uploadSummary.tagged}</strong> tagged
            </span>
          </div>
        )}

        {/* Category Chips */}
        <div style={{ display: "flex", gap: T.sp2, flexWrap: "wrap", marginBottom: T.sp3 }}>
          <button onClick={() => { setFilter("all"); setTagFilter(null); }} style={{
            padding: `${T.sp2}px ${T.sp4}px`, borderRadius: T.r3, cursor: "pointer", fontFamily: T.font, fontSize: T.fs2, fontWeight: 500,
            border: `1.5px solid ${filter === "all" && !tagFilter ? T.accent : T.border}`,
            background: filter === "all" && !tagFilter ? T.accentBg : T.surface,
            color: filter === "all" && !tagFilter ? T.accent : T.textMid,
          }}>All ({docs.length})</button>
          {catCounts.filter(c => c.count > 0).map(c => (
            <button key={c.id} onClick={() => { setFilter(c.id); setTagFilter(null); }} style={{
              padding: `${T.sp2}px ${T.sp4}px`, borderRadius: T.r3, cursor: "pointer", fontFamily: T.font, fontSize: T.fs2, fontWeight: 500,
              border: `1.5px solid ${filter === c.id ? c.color : T.border}`,
              background: filter === c.id ? (c.color + "12") : T.surface,
              color: filter === c.id ? c.color : T.textMid,
            }}><Ic name={c.ic} size={T.fs3} color={filter === c.id ? c.color : T.textMid} style={{ marginRight: T.sp1 }} />{c.label} ({c.count})</button>
          ))}
        </div>

        {/* Tag Filter Chips (top 20 most common) */}
        {allTags.length > 0 && (
          <div style={{ display: "flex", gap: T.sp1, flexWrap: "wrap", marginBottom: T.sp4 }}>
            <span style={{ fontSize: T.fs1, color: T.textMuted, fontFamily: T.font, padding: `${T.sp1}px ${T.sp2}px` }}>Tags:</span>
            {allTags.slice(0, 20).map(tag => (
              <button key={tag} onClick={() => { setTagFilter(tagFilter === tag ? null : tag); setFilter("all"); }} style={{
                padding: `${T.sp1}px ${T.sp3}px`, borderRadius: T.r2, cursor: "pointer", fontFamily: T.font, fontSize: T.fs1, fontWeight: 500,
                border: `1px solid ${tagFilter === tag ? T.accent : T.border}`,
                background: tagFilter === tag ? T.accentBg : T.bg,
                color: tagFilter === tag ? T.accent : T.textMid,
              }}>{tag}</button>
            ))}
          </div>
        )}

        {/* Search + Add */}
        <div style={{ display: "flex", gap: T.sp3, marginBottom: T.sp4 }}>
          <input type="text" placeholder="Search documents, tags, extracted text..." value={search} onChange={e => setSearch(e.target.value)}
            style={{ flex: 1, padding: `${T.sp2}px ${T.sp4}px`, borderRadius: T.r2, border: `1px solid ${T.border}`, fontSize: T.fs3, fontFamily: T.font, color: T.text, background: T.surface }} />
          <button onClick={() => { setAdding(true); setSel(null); }} style={{
            padding: `${T.sp2}px ${T.sp5}px`, borderRadius: T.r2, cursor: "pointer", fontFamily: T.font, fontSize: T.fs2, fontWeight: 600,
            border: "none", background: T.accent, color: "#fff",
          }}>+ Add Document</button>
        </div>

        {/* Document Table */}
        <Card padding={0}>
          <table style={{ width: "100%", borderCollapse: "collapse" }}>
            <thead>
              <tr>
                {["", "Document Name", "Tags", "Date", "File", "Status"].map(h => (
                  <th key={h} style={ThStyle}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filtered.map(doc => {
                const cat = catInfo(doc.category);
                const active = sel === doc.id;
                const hasFile = !!doc.storagePath;
                return (
                  <tr key={doc.id} onClick={() => { setSel(active ? null : doc.id); setAdding(false); }}
                    style={{ cursor: "pointer", background: active ? T.accentBg : "transparent", transition: T.fast }}
                    onMouseEnter={e => { if (!active) e.currentTarget.style.background = T.surfaceHover; }}
                    onMouseLeave={e => { if (!active) e.currentTarget.style.background = "transparent"; }}>
                    <td style={{ ...TdStyle, width: 36, textAlign: "center" }}>{hasFile ? getMimeIcon(doc.mimeType, 18, cat.color) : <Ic name={cat.ic} size={18} color={cat.color} />}</td>
                    <td style={TdStyle}>
                      <div style={{ fontWeight: 500 }}>{doc.name}</div>
                      <div style={{ fontSize: T.fs1, color: T.textMuted, marginTop: 2 }}>
                        {doc.description}
                        {doc.vendor && <span style={{ marginLeft: T.sp2, color: T.accent }}>· {doc.vendor}</span>}
                      </div>
                    </td>
                    <td style={{ ...TdStyle, maxWidth: 180 }}>
                      <div style={{ display: "flex", gap: T.sp1, flexWrap: "wrap" }}>
                        {(doc.tags || []).slice(0, 4).map(tag => (
                          <span key={tag} style={{
                            display: "inline-block", padding: `2px ${T.sp2}px`, borderRadius: T.r2, fontSize: T.fs1, fontWeight: 500, fontFamily: T.font,
                            background: tag.match(/^REQ-/) ? T.blueBg : tag.match(/^\$/) ? T.amberBg : T.bg,
                            color: tag.match(/^REQ-/) ? T.blue : tag.match(/^\$/) ? T.amber : T.textMid,
                            border: `1px solid ${tag.match(/^REQ-/) ? T.blueBorder : tag.match(/^\$/) ? T.amberBorder : T.border}`,
                          }}>{tag}</span>
                        ))}
                        {(doc.tags || []).length > 4 && (
                          <span style={{ fontSize: T.fs1, color: T.textMuted, padding: `2px ${T.sp1}px` }}>+{(doc.tags || []).length - 4}</span>
                        )}
                      </div>
                    </td>
                    <td style={{ ...TdStyle, fontFamily: T.mono, fontSize: T.fs2, whiteSpace: "nowrap" }}>{doc.date}</td>
                    <td style={{ ...TdStyle, fontSize: T.fs1 }}>
                      {hasFile ? (
                        <div>
                          <div style={{ color: T.green, fontWeight: 500 }}>{formatFileSize(doc.fileSize)}</div>
                          <div style={{ fontSize: T.fs1, color: T.textMuted }}>{(doc.fileName || "").split(".").pop()?.toUpperCase()}</div>
                        </div>
                      ) : (
                        <span style={{ color: T.textMuted }}>—</span>
                      )}
                    </td>
                    <td style={TdStyle}>
                      <span style={{
                        display: "inline-block", padding: `${T.sp1}px ${T.sp3}px`, borderRadius: T.r2, fontSize: T.fs1, fontWeight: 600, fontFamily: T.font,
                        background: doc.status === "final" || doc.status === "confirmed" ? T.greenBg : doc.status === "disputed" ? T.redBg : doc.status === "filed" || doc.status === "submitted" ? T.blueBg : T.bg,
                        color: doc.status === "final" || doc.status === "confirmed" ? T.green : doc.status === "disputed" ? T.red : doc.status === "filed" || doc.status === "submitted" ? T.blue : T.textMid,
                      }}>{doc.status}</span>
                    </td>
                  </tr>
                );
              })}
              {filtered.length === 0 && (
                <tr><td colSpan={6} style={{ ...TdStyle, textAlign: "center", color: T.textMuted, padding: 40 }}>No documents match your filter</td></tr>
              )}
            </tbody>
          </table>
        </Card>
      </div>

      {/* Edit Sidebar */}
      {editing && (
        <div style={{ position: "sticky", top: T.sp4 }}>
          <Card>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: T.sp4 }}>
              <CardLabel label="Edit Document" />
              <button onClick={() => setSel(null)} style={{ background: "none", border: "none", cursor: "pointer", fontSize: T.fs5, color: T.textMuted, lineHeight: 1 }}>×</button>
            </div>

            {/* File info / actions */}
            {editing.storagePath && (
              <div style={{ marginBottom: T.sp4, padding: `${T.sp3}px ${T.sp3}px`, borderRadius: T.r2, background: T.bg, border: `1px solid ${T.border}` }}>
                <div style={{ display: "flex", alignItems: "center", gap: T.sp2, marginBottom: T.sp2 }}>
                  <span>{getMimeIcon(editing.mimeType, 20, T.accent)}</span>
                  <div style={{ flex: 1, overflow: "hidden" }}>
                    <div style={{ fontSize: T.fs2, fontWeight: 500, fontFamily: T.font, color: T.text, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{editing.fileName}</div>
                    <div style={{ fontSize: T.fs1, color: T.textMuted, fontFamily: T.font }}>{formatFileSize(editing.fileSize)} · {(editing.mimeType || "unknown").split("/").pop()}</div>
                  </div>
                </div>
                <div style={{ display: "flex", gap: T.sp2 }}>
                  <button onClick={() => openFile(editing)} style={{
                    flex: 1, padding: T.sp2, borderRadius: T.r1, cursor: "pointer", fontFamily: T.font, fontSize: T.fs1, fontWeight: 500,
                    border: `1px solid ${T.border}`, background: T.surface, color: T.accent,
                  }}>View File</button>
                  <button onClick={async () => {
                    if (confirm("Remove file from storage? The document record will remain.")) {
                      await fileDelete(editing.storagePath);
                      updateDoc(editing.id, { storagePath: null, fileName: null, fileSize: 0, mimeType: null });
                    }
                  }} style={{
                    padding: `${T.sp2}px ${T.sp3}px`, borderRadius: T.r1, cursor: "pointer", fontFamily: T.font, fontSize: T.fs1, fontWeight: 500,
                    border: `1px solid ${T.redBorder}`, background: T.redBg, color: T.red,
                  }}>Delete File</button>
                </div>
              </div>
            )}

            {/* Inline preview for images */}
            {editing.storagePath && editing.mimeType && editing.mimeType.startsWith("image/") && (
              <div style={{ marginBottom: T.sp4, borderRadius: T.r2, overflow: "hidden", border: `1px solid ${T.border}` }}>
                <img src={fileGetUrl(editing.storagePath)} alt={editing.name} style={{ width: "100%", height: "auto", display: "block" }} />
              </div>
            )}

            {/* Tags */}
            <div style={{ marginBottom: T.sp4 }}>
              <label style={{ display: "block", fontSize: T.fs1, fontWeight: 600, color: T.textMid, letterSpacing: 0.4, marginBottom: T.sp2, fontFamily: T.font }}>Tags</label>
              <div style={{ display: "flex", gap: T.sp1, flexWrap: "wrap", marginBottom: T.sp2 }}>
                {(editing.tags || []).map(tag => (
                  <span key={tag} style={{
                    display: "inline-flex", alignItems: "center", gap: T.sp1, padding: `${T.sp1}px ${T.sp2}px`, borderRadius: T.r2, fontSize: T.fs1, fontWeight: 500, fontFamily: T.font,
                    background: tag.match(/^REQ-/) ? T.blueBg : tag.match(/^\$/) ? T.amberBg : T.bg,
                    color: tag.match(/^REQ-/) ? T.blue : tag.match(/^\$/) ? T.amber : T.textMid,
                    border: `1px solid ${tag.match(/^REQ-/) ? T.blueBorder : tag.match(/^\$/) ? T.amberBorder : T.border}`,
                  }}>
                    {tag}
                    <span onClick={(e) => { e.stopPropagation(); removeTag(editing.id, tag); }} style={{ cursor: "pointer", fontSize: T.fs3, lineHeight: 1, opacity: 0.6 }}>×</span>
                  </span>
                ))}
                {(editing.tags || []).length === 0 && <span style={{ fontSize: T.fs1, color: T.textMuted, fontFamily: T.font }}>No tags</span>}
              </div>
              <div style={{ display: "flex", gap: T.sp1 }}>
                <input type="text" placeholder="Add tag…" value={newTag} onChange={e => setNewTag(e.target.value)}
                  onKeyDown={e => { if (e.key === "Enter" && newTag.trim()) { addTag(editing.id, newTag); setNewTag(""); } }}
                  style={{ flex: 1, padding: `${T.sp1}px ${T.sp2}px`, borderRadius: T.r1, border: `1px solid ${T.border}`, fontSize: T.fs1, fontFamily: T.font, color: T.text, background: T.surface }} />
                <button onClick={() => { if (newTag.trim()) { addTag(editing.id, newTag); setNewTag(""); } }} style={{
                  padding: `${T.sp1}px ${T.sp3}px`, borderRadius: T.r1, cursor: "pointer", fontFamily: T.font, fontSize: T.fs1, fontWeight: 500,
                  border: `1px solid ${T.border}`, background: T.surface, color: T.accent,
                }}>+</button>
              </div>
            </div>

            {/* Linked REQs */}
            {(editing.linkedReqs || []).length > 0 && (
              <div style={{ marginBottom: T.sp4 }}>
                <label style={{ display: "block", fontSize: T.fs1, fontWeight: 600, color: T.textMid, letterSpacing: 0.4, marginBottom: T.sp1, fontFamily: T.font }}>Linked Requisitions</label>
                <div style={{ display: "flex", gap: T.sp1, flexWrap: "wrap" }}>
                  {(editing.linkedReqs || []).map(req => (
                    <span key={req} style={{
                      display: "inline-block", padding: `${T.sp1}px ${T.sp3}px`, borderRadius: T.r2, fontSize: T.fs1, fontWeight: 600, fontFamily: T.font,
                      background: T.blueBg, color: T.blue, border: `1px solid ${T.blueBorder}`,
                    }}>{req}</span>
                  ))}
                </div>
              </div>
            )}

            {/* Cost Code / Vendor */}
            {(editing.costCode || editing.vendor) && (
              <div style={{ marginBottom: T.sp4, display: "flex", gap: T.sp3 }}>
                {editing.vendor && (
                  <div style={{ flex: 1 }}>
                    <label style={{ display: "block", fontSize: T.fs1, fontWeight: 600, color: T.textMuted, letterSpacing: 0.4, marginBottom: 2, fontFamily: T.font }}>VENDOR</label>
                    <div style={{ fontSize: T.fs2, fontFamily: T.font, color: T.text }}>{editing.vendor}</div>
                  </div>
                )}
                {editing.costCode && (
                  <div style={{ flex: 1 }}>
                    <label style={{ display: "block", fontSize: T.fs1, fontWeight: 600, color: T.textMuted, letterSpacing: 0.4, marginBottom: 2, fontFamily: T.font }}>COST CODE</label>
                    <div style={{ fontSize: T.fs2, fontFamily: T.font, color: T.text }}>{editing.costCode}</div>
                  </div>
                )}
              </div>
            )}

            <div style={{ marginBottom: T.sp3 }}>
              <label style={{ display: "block", fontSize: T.fs1, fontWeight: 600, color: T.textMid, letterSpacing: 0.4, marginBottom: T.sp1, fontFamily: T.font }}>Category</label>
              <select value={editing.category} onChange={e => updateDoc(editing.id, { category: e.target.value })}
                style={{ width: "100%", padding: `${T.sp2}px ${T.sp3}px`, borderRadius: T.r1, border: `1px solid ${T.border}`, fontSize: T.fs2, fontFamily: T.font, color: T.text, background: T.surface }}>
                {DOC_CATEGORIES.map(c => <option key={c.id} value={c.id}>{c.label}</option>)}
              </select>
            </div>
            <TextInput label="Document Name" value={editing.name} onChange={v => updateDoc(editing.id, { name: v })} />
            <TextInput label="Date" value={editing.date} onChange={v => updateDoc(editing.id, { date: v })} />
            <TextInput label="Parties" value={editing.parties} onChange={v => updateDoc(editing.id, { parties: v })} />
            <TextInput label="Description" value={editing.description} onChange={v => updateDoc(editing.id, { description: v })} />
            <div style={{ marginBottom: T.sp3 }}>
              <label style={{ display: "block", fontSize: T.fs1, fontWeight: 600, color: T.textMid, letterSpacing: 0.4, marginBottom: T.sp1, fontFamily: T.font }}>Status</label>
              <select value={editing.status} onChange={e => updateDoc(editing.id, { status: e.target.value })}
                style={{ width: "100%", padding: `${T.sp2}px ${T.sp3}px`, borderRadius: T.r1, border: `1px solid ${T.border}`, fontSize: T.fs2, fontFamily: T.font, color: T.text, background: T.surface }}>
                {["draft", "submitted", "received", "filed", "confirmed", "active", "disputed", "final"].map(s => <option key={s} value={s}>{s}</option>)}
              </select>
            </div>
            <div style={{ marginBottom: T.sp3 }}>
              <label style={{ display: "block", fontSize: T.fs1, fontWeight: 600, color: T.textMid, letterSpacing: 0.4, marginBottom: T.sp1, fontFamily: T.font }}>Notes</label>
              <textarea value={editing.notes || ""} onChange={e => updateDoc(editing.id, { notes: e.target.value })}
                rows={3} style={{ width: "100%", padding: `${T.sp2}px ${T.sp3}px`, borderRadius: T.r1, border: `1px solid ${T.border}`, fontSize: T.fs2, fontFamily: T.font, color: T.text, background: T.surface, resize: "vertical" }} />
            </div>

            {/* Extracted Text Preview */}
            {editing.extractedText && (
              <div style={{ marginBottom: T.sp3 }}>
                <label style={{ display: "block", fontSize: T.fs1, fontWeight: 600, color: T.textMid, letterSpacing: 0.4, marginBottom: T.sp1, fontFamily: T.font }}>Extracted Text (preview)</label>
                <div style={{ padding: `${T.sp2}px ${T.sp3}px`, borderRadius: T.r1, border: `1px solid ${T.border}`, background: T.bg, fontSize: T.fs1, fontFamily: T.mono, color: T.textMid, maxHeight: 120, overflow: "auto", whiteSpace: "pre-wrap", lineHeight: T.lh }}>
                  {editing.extractedText.slice(0, 500)}{editing.extractedText.length > 500 ? "…" : ""}
                </div>
              </div>
            )}

            {/* Delete Document */}
            <button onClick={async () => {
              if (confirm("Delete this document record" + (editing.storagePath ? " and its uploaded file" : "") + "?")) {
                if (editing.storagePath) await fileDelete(editing.storagePath);
                removeDoc(editing.id);
                setSel(null);
              }
            }} style={{
              width: "100%", padding: T.sp2, borderRadius: T.r1, cursor: "pointer", fontFamily: T.font, fontSize: T.fs1, fontWeight: 500,
              border: `1px solid ${T.redBorder}`, background: T.redBg, color: T.red, marginTop: T.sp2,
            }}>Delete Document</button>
          </Card>
        </div>
      )}

      {/* Add Sidebar */}
      {adding && (
        <div style={{ position: "sticky", top: T.sp4 }}>
          <Card>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: T.sp4 }}>
              <CardLabel label="Add New Document" />
              <button onClick={() => setAdding(false)} style={{ background: "none", border: "none", cursor: "pointer", fontSize: T.fs5, color: T.textMuted, lineHeight: 1 }}>×</button>
            </div>
            <div style={{ marginBottom: T.sp3 }}>
              <label style={{ display: "block", fontSize: T.fs1, fontWeight: 600, color: T.textMid, letterSpacing: 0.4, marginBottom: T.sp1, fontFamily: T.font }}>Category</label>
              <select value={newDoc.category} onChange={e => setNewDoc(prev => ({ ...prev, category: e.target.value }))}
                style={{ width: "100%", padding: `${T.sp2}px ${T.sp3}px`, borderRadius: T.r1, border: `1px solid ${T.border}`, fontSize: T.fs2, fontFamily: T.font, color: T.text, background: T.surface }}>
                {DOC_CATEGORIES.map(c => <option key={c.id} value={c.id}>{c.label}</option>)}
              </select>
            </div>
            <TextInput label="Document Name *" value={newDoc.name} onChange={v => setNewDoc(prev => ({ ...prev, name: v }))} />
            <TextInput label="Date" value={newDoc.date} onChange={v => setNewDoc(prev => ({ ...prev, date: v }))} />
            <TextInput label="Parties" value={newDoc.parties} onChange={v => setNewDoc(prev => ({ ...prev, parties: v }))} />
            <TextInput label="Description" value={newDoc.description} onChange={v => setNewDoc(prev => ({ ...prev, description: v }))} />
            <div style={{ marginBottom: T.sp3 }}>
              <label style={{ display: "block", fontSize: T.fs1, fontWeight: 600, color: T.textMid, letterSpacing: 0.4, marginBottom: T.sp1, fontFamily: T.font }}>Status</label>
              <select value={newDoc.status} onChange={e => setNewDoc(prev => ({ ...prev, status: e.target.value }))}
                style={{ width: "100%", padding: `${T.sp2}px ${T.sp3}px`, borderRadius: T.r1, border: `1px solid ${T.border}`, fontSize: T.fs2, fontFamily: T.font, color: T.text, background: T.surface }}>
                {["draft", "submitted", "received", "filed", "confirmed", "active", "disputed", "final"].map(s => <option key={s} value={s}>{s}</option>)}
              </select>
            </div>
            <div style={{ marginBottom: T.sp3 }}>
              <label style={{ display: "block", fontSize: T.fs1, fontWeight: 600, color: T.textMid, letterSpacing: 0.4, marginBottom: T.sp1, fontFamily: T.font }}>Notes</label>
              <textarea value={newDoc.notes} onChange={e => setNewDoc(prev => ({ ...prev, notes: e.target.value }))}
                rows={3} style={{ width: "100%", padding: `${T.sp2}px ${T.sp3}px`, borderRadius: T.r1, border: `1px solid ${T.border}`, fontSize: T.fs2, fontFamily: T.font, color: T.text, background: T.surface, resize: "vertical" }} />
            </div>
            <button onClick={handleAdd} disabled={!newDoc.name.trim()} style={{
              width: "100%", padding: T.sp3, borderRadius: T.r2, cursor: newDoc.name.trim() ? "pointer" : "default", fontFamily: T.font, fontSize: T.fs3, fontWeight: 600,
              border: "none", background: newDoc.name.trim() ? T.accent : T.border, color: newDoc.name.trim() ? "#fff" : T.textMuted,
            }}>Add Document</button>
          </Card>
        </div>
      )}
    </div>
  );
}

// ── AI ASSISTANT ─────────────────────────────────────────────────────────────
const fmtDollar = n => "$" + (n || 0).toLocaleString(undefined, { minimumFractionDigits: 0, maximumFractionDigits: 0 });

const AI_TOOLS = [
  { type: "function", function: {
    name: "navigate_tab",
    description: "Switch the app to a specific tab/view.",
    parameters: { type: "object", properties: {
      tab: { type: "string", enum: ["dashboard","requisitions","audit","claims","documents","simulator","strategy"], description: "Tab to navigate to" }
    }, required: ["tab"] }
  }},
  { type: "function", function: {
    name: "update_requisition",
    description: "Update fields on a requisition (REQ-01 through REQ-16). Can update amounts, backup status, notes, documentation flags.",
    parameters: { type: "object", properties: {
      reqId: { type: "integer", description: "Requisition ID (1-16)", minimum: 1, maximum: 16 },
      updates: { type: "object", properties: {
        totalBilled: { type: "number" }, retainageHeld: { type: "number" },
        laborCost: { type: "number" }, materialCost: { type: "number" }, subCost: { type: "number" },
        laborRate: { type: "number" }, backupStatus: { type: "string", enum: ["COMPLETE","PARTIAL","MISSING"] },
        hasPayrollSupport: { type: "boolean" }, hasInvoiceSupport: { type: "boolean" }, hasCheckVouchers: { type: "boolean" },
        notes: { type: "string" }, date: { type: "string" }
      }}
    }, required: ["reqId","updates"] }
  }},
  { type: "function", function: {
    name: "flag_requisition",
    description: "Add or remove an audit flag on a requisition. Flags: blended_rate, sub_as_labor, overhead_as_material, missing_invoice, markup_on_markup, duplicate, no_timesheet, rate_anomaly, no_scope_desc, owner_supplied, co_missing, retainage_error",
    parameters: { type: "object", properties: {
      reqId: { type: "integer", description: "Requisition ID (1-16)", minimum: 1, maximum: 16 },
      flag: { type: "string", enum: ["blended_rate","sub_as_labor","overhead_as_material","missing_invoice","markup_on_markup","duplicate","no_timesheet","rate_anomaly","no_scope_desc","owner_supplied","co_missing","retainage_error"] },
      action: { type: "string", enum: ["add","remove"] }
    }, required: ["reqId","flag","action"] }
  }},
  { type: "function", function: {
    name: "update_claim",
    description: "Update an owner claim (1-24). Can change status, strength, defense text, amounts.",
    parameters: { type: "object", properties: {
      claimId: { type: "integer", description: "Claim ID (1-24)", minimum: 1, maximum: 24 },
      updates: { type: "object", properties: {
        status: { type: "string", enum: ["DISPUTED","AGREED","WAIVED","PENDING"] },
        strength: { type: "string", enum: ["STRONG","MODERATE","WEAK","N/A"] },
        defense: { type: "string" }, ownerAmount: { type: "number" }, agreedAmount: { type: "number" }
      }}
    }, required: ["claimId","updates"] }
  }},
  { type: "function", function: {
    name: "add_document",
    description: "Create a new document record in the system.",
    parameters: { type: "object", properties: {
      name: { type: "string" },
      category: { type: "string", enum: ["contract","requisition","change_order","correspondence","invoice","inspection","photo","arbitration","other"] },
      date: { type: "string" }, description: { type: "string" }, parties: { type: "string" },
      status: { type: "string", enum: ["draft","submitted","received","filed","confirmed","active","disputed","final"] },
      tags: { type: "array", items: { type: "string" } },
      linkedReqs: { type: "array", items: { type: "string" } }, notes: { type: "string" }
    }, required: ["name","category"] }
  }},
  { type: "function", function: {
    name: "update_document",
    description: "Update fields on an existing document by its ID.",
    parameters: { type: "object", properties: {
      docId: { type: "string", description: "Document ID" },
      updates: { type: "object", properties: {
        category: { type: "string", enum: ["contract","requisition","change_order","correspondence","invoice","inspection","photo","arbitration","other"] },
        name: { type: "string" }, description: { type: "string" },
        status: { type: "string", enum: ["draft","submitted","received","filed","confirmed","active","disputed","final"] },
        tags: { type: "array", items: { type: "string" } },
        linkedReqs: { type: "array", items: { type: "string" } },
        notes: { type: "string" }, parties: { type: "string" }, vendor: { type: "string" }, costCode: { type: "string" }
      }}
    }, required: ["docId","updates"] }
  }},
  { type: "function", function: {
    name: "search_documents",
    description: "Search documents by text. Searches name, description, tags, extracted text, vendor, notes.",
    parameters: { type: "object", properties: {
      query: { type: "string" },
      category: { type: "string", enum: ["contract","requisition","change_order","correspondence","invoice","inspection","photo","arbitration","other"] }
    }, required: ["query"] }
  }},
  { type: "function", function: {
    name: "analyze_document",
    description: "Retrieve a document's metadata and extracted text for analysis.",
    parameters: { type: "object", properties: {
      docId: { type: "string" }
    }, required: ["docId"] }
  }},
  { type: "function", function: {
    name: "case_summary",
    description: "Generate a summary of the case status — financials, risk, claims, documents.",
    parameters: { type: "object", properties: {
      focus: { type: "string", enum: ["financial","risk","claims","documents","full"], description: "Aspect to focus on (default: full)" }
    }}
  }}
];

function buildSystemPrompt(tab, reqs, claims, docs) {
  const totalBilled = reqs.reduce((s, r) => s + (r.totalBilled || 0), 0);
  const totalExcel = reqs.reduce((s, r) => s + (r.excelTotal || 0), 0);
  const highRisk = reqs.filter(r => computeRisk(r) === "HIGH").length;
  const totalOwner = claims.reduce((s, c) => s + c.ownerAmount, 0);
  const totalAgreed = claims.reduce((s, c) => s + c.agreedAmount, 0);
  const disputed = claims.filter(c => c.status === "DISPUTED").length;
  const uploadedDocs = docs.filter(d => d.storagePath).length;

  return `You are an AI assistant for Arbitai — a construction arbitration intelligence platform. Current case: for Montana Contracting Corp v. Tharp/Bumgardner (AAA Case No. 01-24-0004-6683).

CASE: Residential renovation at 515 N. Midland Ave, Upper Nyack NY. AIA A110-2021 (Cost of Work + 25% OH&P). Arbitrator: Robin S. Abramowitz.
MC (contractor, our client) billed ${fmtDollar(totalBilled)} across 16 requisitions. Excel tracker total: ${fmtDollar(totalExcel)}.
${highRisk} requisitions flagged HIGH RISK. Owners made 24 claims totaling ${fmtDollar(totalOwner)}; MC agreed to ${fmtDollar(totalAgreed)} in credits. ${disputed} claims DISPUTED.
${docs.length} documents (${uploadedDocs} with files). Currently viewing: "${tab}" tab.

KEY FACTS:
- REQ-16 (Jan 2024) is the FINAL INVOICE. Largest single requisition at $235,461.
- Project is OVER-BILLED by $53,162 (total completed $1,839,331 vs contract sum $1,786,169 = 102.97%).
- $135,385 in unapplied credit COs remain at 0% across REQ-15 and REQ-16 (PCO#130 $66,389, PCO#129 $24,248, plus 5 others).
- 10+ G703 lines over budget: Insulation 200%, Custom Casework 155%, Framing Material 165%.
- Zero employee timecards across all 16 requisitions.

RULES:
1. Map "REQ-3", "req 3", "#3" etc. to the correct reqId (1-16). REQ-16 is the final invoice.
2. Match claims by description keywords or ID number.
3. Be concise — this is legal case management, precision over verbosity.
4. Execute multiple tool calls when needed.
5. After actions, briefly confirm what you did.`;
}

function buildContextHints(msg, reqs, claims, docs) {
  const hints = [];
  const reqRefs = msg.match(/req[quistion]*[- _#.]?(\d{1,2})/gi);
  if (reqRefs) {
    reqRefs.forEach(ref => {
      const num = parseInt(ref.match(/(\d{1,2})/)[1]);
      const req = reqs.find(r => r.id === num);
      if (req) hints.push(`[REQ-${String(num).padStart(2,"0")}: billed=${fmtDollar(req.totalBilled)}, flags=[${req.flags.join(",")}], backup=${req.backupStatus}]`);
    });
  }
  const claimRefs = msg.match(/claim[- #]?(\d{1,2})/gi);
  if (claimRefs) {
    claimRefs.forEach(ref => {
      const num = parseInt(ref.match(/(\d{1,2})/)[1]);
      const claim = claims.find(c => c.id === num);
      if (claim) hints.push(`[Claim #${num}: "${claim.description}", status=${claim.status}, owner=${fmtDollar(claim.ownerAmount)}]`);
    });
  }
  return hints.length > 0 ? "\n\nREFERENCED DATA:\n" + hints.join("\n") : "";
}

async function callOpenAI(messages, tools, systemPrompt) {
  const apiKey = window._openaiKey;
  if (!apiKey) throw new Error("OpenAI API key not configured. Add your key to supabase-config.json and rebuild.");
  const res = await fetch("https://api.openai.com/v1/chat/completions", {
    method: "POST",
    headers: { "Content-Type": "application/json", "Authorization": "Bearer " + apiKey },
    body: JSON.stringify({
      model: "gpt-4o", messages: [{ role: "system", content: systemPrompt }, ...messages],
      tools, tool_choice: "auto", temperature: 0.3, max_tokens: 1024
    })
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error?.message || "OpenAI API error " + res.status);
  }
  return await res.json();
}

function executeToolCall(name, args, appState, callbacks, actions) {
  const { reqs, claims, docs } = appState;
  const { setTab, updateReq, updateClaim, updateDoc, addDoc, removeDoc } = callbacks;

  switch (name) {
    case "navigate_tab":
      setTab(args.tab);
      actions.push({ icon: "map-pin", summary: "Navigated to " + args.tab + " tab" });
      return { success: true, navigatedTo: args.tab };

    case "update_requisition": {
      const req = reqs.find(r => r.id === args.reqId);
      if (!req) return { error: "REQ-" + args.reqId + " not found" };
      updateReq(args.reqId, args.updates);
      actions.push({ icon: "dollar", summary: "Updated REQ-" + String(args.reqId).padStart(2, "0") + ": " + Object.keys(args.updates).join(", ") });
      return { success: true, updated: "REQ-" + args.reqId };
    }

    case "flag_requisition": {
      const req = reqs.find(r => r.id === args.reqId);
      if (!req) return { error: "REQ-" + args.reqId + " not found" };
      let flags = [...req.flags];
      if (args.action === "add" && !flags.includes(args.flag)) flags.push(args.flag);
      if (args.action === "remove") flags = flags.filter(f => f !== args.flag);
      updateReq(args.reqId, { flags });
      actions.push({ icon: "flag", summary: (args.action === "add" ? "Added" : "Removed") + ' flag "' + args.flag + '" on REQ-' + String(args.reqId).padStart(2, "0") });
      return { success: true, flags };
    }

    case "update_claim": {
      const claim = claims.find(c => c.id === args.claimId);
      if (!claim) return { error: "Claim #" + args.claimId + " not found" };
      updateClaim(args.claimId, args.updates);
      actions.push({ icon: "scale", summary: "Updated claim #" + args.claimId + ": " + Object.keys(args.updates).join(", ") });
      return { success: true };
    }

    case "add_document": {
      const id = "doc-ai-" + Date.now().toString(36) + "-" + Math.random().toString(36).slice(2, 6);
      addDoc({
        id, category: args.category || "other", name: args.name,
        date: args.date || new Date().toISOString().slice(0, 10),
        description: args.description || "", parties: args.parties || "",
        status: args.status || "draft", notes: args.notes || "",
        tags: args.tags || [], linkedReqs: args.linkedReqs || [],
        storagePath: null, fileName: null, fileSize: 0, mimeType: null,
        extractedText: null, vendor: null, costCode: null
      });
      actions.push({ icon: "file-text", summary: 'Added document "' + args.name + '" (' + (args.category || "other") + ")" });
      return { success: true, docId: id };
    }

    case "update_document": {
      const doc = docs.find(d => d.id === args.docId);
      if (!doc) return { error: "Document " + args.docId + " not found" };
      updateDoc(args.docId, args.updates);
      actions.push({ icon: "edit", summary: 'Updated "' + doc.name + '": ' + Object.keys(args.updates).join(", ") });
      return { success: true };
    }

    case "search_documents": {
      const q = (args.query || "").toLowerCase();
      const results = docs.filter(d => {
        if (args.category && d.category !== args.category) return false;
        return d.name.toLowerCase().includes(q) || (d.description || "").toLowerCase().includes(q)
          || (d.tags || []).some(t => t.toLowerCase().includes(q))
          || (d.extractedText || "").toLowerCase().includes(q)
          || (d.vendor || "").toLowerCase().includes(q) || (d.notes || "").toLowerCase().includes(q);
      }).slice(0, 10).map(d => ({ id: d.id, name: d.name, category: d.category, date: d.date, tags: (d.tags || []).slice(0, 5), hasFile: !!d.storagePath, status: d.status }));
      return { results, totalMatches: results.length };
    }

    case "analyze_document": {
      const doc = docs.find(d => d.id === args.docId);
      if (!doc) return { error: "Document " + args.docId + " not found" };
      return { id: doc.id, name: doc.name, category: doc.category, date: doc.date, parties: doc.parties, status: doc.status, tags: doc.tags, linkedReqs: doc.linkedReqs, vendor: doc.vendor, costCode: doc.costCode, extractedText: (doc.extractedText || "").slice(0, 2000), notes: doc.notes };
    }

    case "case_summary": {
      const focus = args.focus || "full";
      const summary = {};
      if (focus === "full" || focus === "financial") {
        summary.financial = { totalBilled: reqs.reduce((s, r) => s + (r.totalBilled || 0), 0), totalExcel: reqs.reduce((s, r) => s + (r.excelTotal || 0), 0), totalRetainage: reqs.reduce((s, r) => s + (r.retainageHeld || 0), 0) };
      }
      if (focus === "full" || focus === "risk") {
        const dist = { HIGH: 0, MEDIUM: 0, LOW: 0, CLEAR: 0 };
        reqs.forEach(r => dist[computeRisk(r)]++);
        summary.risk = dist;
      }
      if (focus === "full" || focus === "claims") {
        summary.claims = { total: claims.length, totalOwner: claims.reduce((s, c) => s + c.ownerAmount, 0), totalAgreed: claims.reduce((s, c) => s + c.agreedAmount, 0), disputed: claims.filter(c => c.status === "DISPUTED").length, agreed: claims.filter(c => c.status === "AGREED").length };
      }
      if (focus === "full" || focus === "documents") {
        summary.documents = { total: docs.length, withFiles: docs.filter(d => d.storagePath).length };
      }
      return summary;
    }

    default:
      return { error: "Unknown tool: " + name };
  }
}

async function handleAIRequest(userMessage, appState, callbacks) {
  const { tab, reqs, claims, docs } = appState;
  const systemPrompt = buildSystemPrompt(tab, reqs, claims, docs);
  const contextHints = buildContextHints(userMessage, reqs, claims, docs);
  let messages = [{ role: "user", content: userMessage + contextHints }];
  const actions = [];

  for (let round = 0; round < 5; round++) {
    const result = await callOpenAI(messages, AI_TOOLS, systemPrompt);
    const choice = result.choices[0];

    if (choice.finish_reason === "stop" || !choice.message.tool_calls) {
      return { text: choice.message.content || "Done.", actions };
    }

    messages.push(choice.message);
    for (const tc of choice.message.tool_calls) {
      const args = JSON.parse(tc.function.arguments);
      const toolResult = executeToolCall(tc.function.name, args, appState, callbacks, actions);
      messages.push({ role: "tool", tool_call_id: tc.id, content: JSON.stringify(toolResult) });
    }
  }
  return { text: "Completed all requested actions.", actions };
}

// ── AI Auto-Analysis on Upload ───────────────────────────────────────────────
async function analyzeUploadedDoc(doc, extractedText, reqs) {
  const apiKey = window._openaiKey;
  if (!apiKey || !extractedText) return null;

  const reqSummary = reqs.map(r => "REQ-" + String(r.id).padStart(2, "0") + ": " + (r.date || "no date") + ", " + fmtDollar(r.totalBilled)).join("\n");

  const prompt = `Analyze this document for a construction case (Montana Contracting v. Tharp, AIA A110 Cost-Plus). REQ-16 (Jan 2024) is the FINAL INVOICE.

DOCUMENT: "${doc.name}" (category: ${doc.category}, current status: ${doc.status})
Current tags: [${(doc.tags || []).join(", ")}]

TEXT (first 2000 chars):
${extractedText.slice(0, 2000)}

REQUISITION PERIODS:
${reqSummary}

Return JSON with applicable enhancements:
{"category":"best fit","status":"best status","description":"1-line description","tags":["additional tags"],"linkedReqs":["REQ-XX"],"vendor":"vendor name","costCode":"XX — Name","notes":"audit observations"}

STATUS OPTIONS: "draft" (working doc), "submitted" (sent by MC), "received" (from other party/sub), "filed" (formally filed/recorded), "confirmed" (verified by both sides), "active" (ongoing/in-use), "disputed" (contested), "final" (locked/complete).
Choose the status that best fits what this document IS — not "draft" unless it truly is an unfinished document.
Only include fields you can confidently determine. Return valid JSON only.`;

  try {
    const res = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: { "Content-Type": "application/json", "Authorization": "Bearer " + apiKey },
      body: JSON.stringify({ model: "gpt-4o", messages: [{ role: "user", content: prompt }], temperature: 0.2, max_tokens: 512, response_format: { type: "json_object" } })
    });
    if (!res.ok) return null;
    const data = await res.json();
    const ai = JSON.parse(data.choices[0].message.content);

    const updates = {};
    if (ai.category && ai.category !== doc.category && doc.category === "other") updates.category = ai.category;
    const validStatuses = ["draft","submitted","received","filed","confirmed","active","disputed","final"];
    if (ai.status && validStatuses.includes(ai.status)) updates.status = ai.status;
    if (ai.description) updates.description = ai.description;
    const mergedTags = [...new Set([...(doc.tags || []), ...(ai.tags || [])])];
    if (mergedTags.length > (doc.tags || []).length) updates.tags = mergedTags;
    const mergedReqs = [...new Set([...(doc.linkedReqs || []), ...(ai.linkedReqs || [])])];
    if (mergedReqs.length > (doc.linkedReqs || []).length) updates.linkedReqs = mergedReqs;
    if (ai.vendor && !doc.vendor) updates.vendor = ai.vendor;
    if (ai.costCode && !doc.costCode) updates.costCode = ai.costCode;
    if (ai.notes) updates.notes = (doc.notes ? doc.notes + "\n\n" : "") + "AI: " + ai.notes;
    return Object.keys(updates).length > 0 ? updates : null;
  } catch (err) {
    console.warn("[AI] Upload analysis failed:", err.message);
    return null;
  }
}

// ── ARBITRATOR Q&A CHAT ─────────────────────────────────────────────────────
function buildQAChatPrompt(arbitratorId, reqs, claims) {
  const profile = ARBITRATOR_PROFILES.find(p => p.id === arbitratorId) || ARBITRATOR_PROFILES[0];
  const totalBilled = reqs.reduce((s, r) => s + (r.totalBilled || 0), 0);
  const totalPaid = reqs.reduce((s, r) => s + (r.paidAmount || 0), 0);
  const outstanding = totalBilled - totalPaid;
  const activeCOs = CHANGE_ORDERS.filter(c => c.status !== "Void");
  const netCO = activeCOs.reduce((s, c) => s + c.amount, 0);
  const totalInvoices = INVOICE_CATALOGUE.reduce((s, i) => s + i.amount, 0);

  // Serialize claims
  const claimsText = claims.map(c =>
    `#${c.id}: "${c.description}" — Owner claims $${c.ownerAmount.toLocaleString()}, MC agreed $${c.agreedAmount.toLocaleString()}, Status: ${c.status}, Defense: ${c.defense}, Strength: ${c.strength}`
  ).join("\n");

  // Serialize COs (compressed)
  const cosText = activeCOs.map(c =>
    `PCCO#${String(c.co).padStart(3,"0")}: $${c.amount.toLocaleString()} — ${c.desc} (REQ-${c.req ? String(c.req).padStart(2,"0") : "?"})`
  ).join("\n");

  // Serialize per-req summary
  const reqsText = reqs.map(r => {
    const bv = BACKUP_VARIANCE[r.id] || {};
    return `REQ-${String(r.id).padStart(2,"0")}: Billed $${(r.totalBilled||0).toLocaleString()}, Paid $${(r.paidAmount||0).toLocaleString()}, Backup $${(bv.backupDocs||0).toLocaleString()}, Labor $${(bv.directLabor||0).toLocaleString()}, Flags: [${r.flags.join(", ")}], Backup: ${r.backupStatus}`;
  }).join("\n");

  // Serialize timecard summary
  const tcText = TIMECARD_DATA.map(t =>
    `REQ-${String(t.req).padStart(2,"0")}: ${t.hours} hrs, ${t.empCount} employees, ${t.type} (${t.dateRange})`
  ).join("\n");

  // Serialize invoice catalogue (compressed)
  const invByReq = {};
  INVOICE_CATALOGUE.forEach(inv => {
    if (!invByReq[inv.req]) invByReq[inv.req] = [];
    invByReq[inv.req].push(inv);
  });
  const invText = Object.entries(invByReq).map(([req, invs]) =>
    `REQ-${String(req).padStart(2,"0")} (${invs.length} invoices, $${invs.reduce((s,i)=>s+i.amount,0).toLocaleString()}): ${invs.map(i => `${i.id}: ${i.vendor} $${i.amount.toLocaleString()}`).join("; ")}`
  ).join("\n");

  // Serialize pre-vetted Q&A pairs
  const qaText = reqs.filter(r => r.arbitratorQA && r.arbitratorQA.length > 0).map(r =>
    `--- REQ-${String(r.id).padStart(2,"0")} ---\n` + r.arbitratorQA.map(qa =>
      `Q: ${qa.q}\nA: ${qa.a}`
    ).join("\n\n")
  ).join("\n\n");

  return `You are Montana Contracting's lead counsel responding to questions from the arbitrator in AAA Case No. 01-24-0004-6683 (Montana Contracting Corp v. Tharp/Bumgardner).

ROLE: You advocate for Montana Contracting (the GC/construction manager). Be professional, factual, and persuasive. Acknowledge weaknesses honestly when pressed but always frame them in the most favorable light supported by evidence.

CASE OVERVIEW:
- Project: Residential renovation at 515 N. Midland Ave, Upper Nyack NY
- Contract: AIA A110-2021 (Cost of Work + 25% OH&P)
- Arbitrator: Robin S. Abramowitz (AAA Construction Panel)
- Total Billed: $${totalBilled.toLocaleString()} across 16 requisitions (AIA G702/G703 format)
- Total Paid: $${totalPaid.toLocaleString()}
- Outstanding Balance: $${outstanding.toLocaleString()}
- Original Contract: $1,183,411.00
- Net Change Orders: $${netCO.toLocaleString()} (${activeCOs.length} PCCOs — all verbally approved by owner before PCCO creation)
- Adjusted Contract Scope: $${(1183411 + netCO).toLocaleString()}
- Project exceeded 240-day substantial completion deadline by 419 days due to owner-directed scope expansion (${activeCOs.length} change orders)

KEY CONTRACTUAL PROVISIONS:
- AIA A110 §3.3: Cost of Work + 25% OH&P (overhead and profit)
- AIA A110 §3.3.2: When a trade line completes under budget, Montana bills to 100% of scheduled value, then issues credit CO for owner's 50% share of savings
- §21.11: Mutual waiver of consequential damages (bars delay/rental claims)
- All PCOs (Potential Change Orders) were verbally approved by owner before formal PCCO creation
- $60/hr blended labor rate: aggregated unit cost covering payroll, burden, travel, consumables — presented on all COs throughout construction, never contested by owner until dispute

CURRENT ARBITRATOR PROFILE:
Name: ${profile.name}
Bio: ${profile.bio}
Traits (0-1 scale):
- Contract Adherence: ${profile.traits.contractWeight} (1.0 = strict textualist)
- Documentation Rigor: ${profile.traits.docRequired} (1.0 = every dollar must be documented)
- Owner Sympathy: ${profile.traits.ownerBias} (0.5 = neutral)
- Analytical Depth: ${profile.traits.analyticalRigor} (1.0 = deep forensic audit)
- Industry Deference: ${profile.traits.industryStandard} (1.0 = favors trade custom)
- Pragmatism: ${profile.traits.pragmatism} (1.0 = split-the-difference)

Calibrate your answers to this arbitrator's tendencies. A high-documentation arbitrator needs specific invoice IDs and page references. A pragmatic arbitrator wants bottom-line numbers and reasonable compromise positions.

=== OWNER'S 24 CLAIMS ===
${claimsText}

=== 16 REQUISITIONS (SUMMARY) ===
${reqsText}

=== ${activeCOs.length} CHANGE ORDERS (PCCOs) ===
${cosText}

=== TIMECARD DATA ===
${tcText}

=== INVOICE CATALOGUE (${INVOICE_CATALOGUE.length} invoices, $${totalInvoices.toLocaleString()}) ===
${invText}

=== PRE-VETTED ARBITRATOR Q&A (use these answers when questions overlap) ===
${qaText}

RESPONSE RULES:
1. ALWAYS cite specific evidence using these exact formats: [REQ-01], [CO#001], [INV R04-012], [CLAIM #4]. Use these markers whenever referencing data.
2. Never fabricate evidence. If backup is missing, say so and explain what does exist.
3. When a pre-vetted Q&A answer covers the topic, use that answer as your foundation but adapt it to the specific question asked.
4. Keep responses focused and structured. Use short paragraphs. Lead with the strongest point.
5. When discussing dollar amounts, always provide the specific figure from the data.
6. If the question touches a known risk area (e.g., no W-2s on file, $60/hr rate documentation), acknowledge it proactively and present the best available defense.`;
}

function sendQAMessage(userMsg, history, systemPrompt) {
  const apiKey = window._openaiKey;
  if (!apiKey) return Promise.reject(new Error("OpenAI API key not configured. Click the settings gear to add your key."));
  const trimmed = history.length > 20 ? history.slice(-20) : history;
  return fetch("https://api.openai.com/v1/chat/completions", {
    method: "POST",
    headers: { "Content-Type": "application/json", Authorization: "Bearer " + apiKey },
    body: JSON.stringify({
      model: "gpt-4o",
      messages: [{ role: "system", content: systemPrompt }, ...trimmed, { role: "user", content: userMsg }],
      temperature: 0.4,
      max_tokens: 2048,
    }),
  }).then(res => {
    if (!res.ok) return res.json().catch(() => ({})).then(e => { throw new Error(e.error?.message || "API error " + res.status); });
    return res.json();
  }).then(data => data.choices[0].message.content);
}

function parseCitations(text) {
  const parts = [];
  const regex = /\[(REQ-\d{1,2}|CO#\d{1,3}|INV R\d{2}-\d{3}\w?|CLAIM #\d{1,2})\]/g;
  let last = 0;
  let match;
  while ((match = regex.exec(text)) !== null) {
    if (match.index > last) parts.push({ type: "text", value: text.slice(last, match.index) });
    parts.push({ type: "citation", value: match[1] });
    last = regex.lastIndex;
  }
  if (last < text.length) parts.push({ type: "text", value: text.slice(last) });
  return parts;
}

function lookupCitation(tag) {
  const reqMatch = tag.match(/^REQ-(\d{1,2})$/);
  if (reqMatch) {
    const id = parseInt(reqMatch[1]);
    const bv = BACKUP_VARIANCE[id] || {};
    return { type: "Requisition", id: `REQ-${String(id).padStart(2,"0")}`, fields: [
      ["Billed", "$" + (bv.amountBilled || 0).toLocaleString()],
      ["Backup Docs", "$" + (bv.backupDocs || 0).toLocaleString()],
      ["Direct Labor", "$" + (bv.directLabor || 0).toLocaleString()],
    ]};
  }
  const coMatch = tag.match(/^CO#(\d{1,3})$/);
  if (coMatch) {
    const co = CHANGE_ORDERS.find(c => c.co === parseInt(coMatch[1]));
    if (co) return { type: "Change Order", id: `PCCO #${String(co.co).padStart(3,"0")}`, fields: [
      ["Description", co.desc],
      ["Amount", "$" + co.amount.toLocaleString()],
      ["REQ", co.req ? `REQ-${String(co.req).padStart(2,"0")}` : "—"],
      ["Status", co.status],
    ]};
  }
  const invMatch = tag.match(/^INV (R\d{2}-\d{3}\w?)$/);
  if (invMatch) {
    const inv = INVOICE_CATALOGUE.find(i => i.id === invMatch[1]);
    if (inv) return { type: "Invoice", id: inv.id, fields: [
      ["Vendor", inv.vendor],
      ["Description", inv.desc],
      ["Amount", "$" + inv.amount.toLocaleString()],
      ["REQ", `REQ-${String(inv.req).padStart(2,"0")}`],
      ["Backup", inv.hasBackup ? "On file" : "Missing"],
    ]};
  }
  const claimMatch = tag.match(/^CLAIM #(\d{1,2})$/);
  if (claimMatch) {
    const cl = OWNER_CLAIMS_INITIAL.find(c => c.id === parseInt(claimMatch[1]));
    if (cl) return { type: "Owner Claim", id: `Claim #${cl.id}`, fields: [
      ["Description", cl.description],
      ["Owner Amount", "$" + cl.ownerAmount.toLocaleString()],
      ["MC Agreed", "$" + cl.agreedAmount.toLocaleString()],
      ["Status", cl.status],
      ["Strength", cl.strength],
    ]};
  }
  return null;
}

function getSuggestedQuestions(arbitratorId) {
  const p = ARBITRATOR_PROFILES.find(a => a.id === arbitratorId) || ARBITRATOR_PROFILES[0];
  const qs = [];
  // Always include general questions
  qs.push("Walk me through the outstanding balance. Why does Montana believe it is owed $497,438?");
  qs.push("The project was 419 days late. Who is responsible for the delay?");
  // Trait-driven questions
  if (p.traits.docRequired > 0.7) {
    qs.push("REQ-14 shows $15,862 in self-performed labor with no employee timecards. How do you document that?");
    qs.push("Where are the W-2s or payroll registers supporting the $60/hr blended labor rate?");
  }
  if (p.traits.ownerBias > 0.6) {
    qs.push("The owners paid $1.34 million and claim their home still has defects. How do you justify that?");
    qs.push("The fireplace claim is $45,000. The owner says it's sloppy. What's your response?");
  }
  if (p.traits.contractWeight > 0.7) {
    qs.push("Show me exactly where in AIA A110 the $60/hr blended rate is authorized.");
    qs.push("Section 3.3.2 savings-split — explain how REQ-16's closeout credits work under this provision.");
  }
  if (p.traits.analyticalRigor > 0.7) {
    qs.push("REQ-13 covers a 3.5-month billing gap. Break down the $147,391 billed during that period.");
    qs.push("Cross-reference the HVAC line: the base contract shows $44K but REQ-14 bills $72,615. Explain the variance.");
  }
  if (p.traits.industryStandard > 0.7) {
    qs.push("Is a $60/hr blended rate reasonable for residential renovation in the Hudson Valley?");
    qs.push("How common is it for GCs to bill cost-plus with 25% OH&P on a project of this size?");
  }
  if (p.traits.pragmatism > 0.7) {
    qs.push("If we set aside the disputed claims, what's the realistic settlement range?");
    qs.push("Montana agreed to $22,569 in credits. Is there room for additional concessions to resolve this?");
  }
  return qs.slice(0, 8);
}

function ArbitratorQAChat({ reqs, claims, docs }) {
  const [messages, setMessages] = useState(() => {
    try { const s = localStorage.getItem("tharp-qa-current"); return s ? JSON.parse(s) : []; } catch { return []; }
  });
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [arbId, setArbId] = useState("abramowitz");
  const [sidebar, setSidebar] = useState(null);
  const [showSuggested, setShowSuggested] = useState(false);
  const [keyInput, setKeyInput] = useState("");
  const [hasKey, setHasKey] = useState(!!window._openaiKey);
  const chatRef = useRef(null);
  const inputRef = useRef(null);

  // Persist messages
  useEffect(() => {
    try { localStorage.setItem("tharp-qa-current", JSON.stringify(messages)); } catch {}
  }, [messages]);

  // Auto-scroll
  useEffect(() => {
    if (chatRef.current) chatRef.current.scrollTop = chatRef.current.scrollHeight;
  }, [messages, loading]);

  const send = async (text) => {
    const msg = (text || input).trim();
    if (!msg || loading) return;
    setInput("");
    setShowSuggested(false);
    const newMsgs = [...messages, { role: "user", content: msg, ts: Date.now() }];
    setMessages(newMsgs);
    setLoading(true);
    try {
      const prompt = buildQAChatPrompt(arbId, reqs, claims);
      const history = newMsgs.map(m => ({ role: m.role, content: m.content }));
      const reply = await sendQAMessage(msg, history.slice(0, -1), prompt);
      setMessages(prev => [...prev, { role: "assistant", content: reply, ts: Date.now() }]);
    } catch (err) {
      setMessages(prev => [...prev, { role: "assistant", content: "Error: " + err.message, ts: Date.now(), error: true }]);
    }
    setLoading(false);
  };

  const clearChat = () => { setMessages([]); setSidebar(null); };

  const exportChat = () => {
    const md = messages.map(m =>
      m.role === "user" ? `**ARBITRATOR:** ${m.content}` : `**MONTANA COUNSEL:** ${m.content}`
    ).join("\n\n---\n\n");
    const header = `# Arbitrator Q&A Session\n**Arbitrator Profile:** ${ARBITRATOR_PROFILES.find(a=>a.id===arbId)?.name}\n**Date:** ${new Date().toLocaleDateString()}\n**Case:** Montana v. Tharp/Bumgardner (AAA 01-24-0004-6683)\n\n---\n\n`;
    navigator.clipboard.writeText(header + md).then(() => alert("Session copied to clipboard as Markdown."));
  };

  const suggested = getSuggestedQuestions(arbId);
  const profile = ARBITRATOR_PROFILES.find(a => a.id === arbId) || ARBITRATOR_PROFILES[0];

  const CitationChip = ({ tag }) => {
    const data = lookupCitation(tag);
    return (
      <span onClick={() => data && setSidebar(data)} style={{
        display: "inline", background: T.accent + "18", color: T.accent, padding: `1px ${T.sp2}px`,
        borderRadius: T.r1, fontSize: T.fs2, fontFamily: T.mono, cursor: data ? "pointer" : "default",
        borderBottom: data ? `1px dashed ${T.accent}` : "none", whiteSpace: "nowrap",
      }}>[{tag}]</span>
    );
  };

  const renderContent = (text) => {
    const parts = parseCitations(text);
    return parts.map((p, i) => p.type === "citation"
      ? <CitationChip key={i} tag={p.value} />
      : <span key={i} style={{ whiteSpace: "pre-wrap" }}>{p.value}</span>
    );
  };

  return (
    <div style={{ display: "flex", gap: 0, minHeight: "calc(100vh - 200px)" }}>
      {/* Main chat area */}
      <div style={{ flex: 1, display: "flex", flexDirection: "column" }}>
        {/* Header */}
        <div style={{ display: "flex", alignItems: "center", gap: T.sp3, marginBottom: T.sp5, flexWrap: "wrap" }}>
          <div style={{ flex: 1 }}>
            <h2 style={{ fontSize: T.fs6, fontWeight: 700, color: T.text, margin: 0, fontFamily: T.font }}>
              <span style={{ borderLeft: `4px solid ${T.accent}`, paddingLeft: T.sp4 }}>Arbitrator Q&A</span>
            </h2>
            <p style={{ fontSize: T.fs3, color: T.textMuted, margin: `${T.sp1}px 0 0 ${T.sp5}px`, fontFamily: T.font }}>
              Practice fielding arbitrator questions — AI responds as Montana's counsel using case evidence
            </p>
          </div>
          <select value={arbId} onChange={e => setArbId(e.target.value)} style={{
            padding: `${T.sp2}px ${T.sp3}px`, borderRadius: T.r2, border: `1px solid ${T.border}`,
            background: T.surface, color: T.text, fontFamily: T.font, fontSize: T.fs3, cursor: "pointer",
          }}>
            {ARBITRATOR_PROFILES.map(a => <option key={a.id} value={a.id}>{a.name}</option>)}
          </select>
          <button onClick={exportChat} disabled={messages.length === 0} style={{
            padding: `${T.sp2}px ${T.sp4}px`, borderRadius: T.r2, border: `1px solid ${T.border}`,
            background: T.surface, color: messages.length ? T.text : T.textMuted, fontFamily: T.font,
            fontSize: T.fs2, cursor: messages.length ? "pointer" : "default", display: "flex", alignItems: "center", gap: T.sp1,
          }}><Ic name="copy" size={T.fs3} color={messages.length ? T.text : T.textMuted} />Export</button>
          <button onClick={clearChat} disabled={messages.length === 0} style={{
            padding: `${T.sp2}px ${T.sp4}px`, borderRadius: T.r2, border: `1px solid ${T.border}`,
            background: T.surface, color: messages.length ? T.red : T.textMuted, fontFamily: T.font,
            fontSize: T.fs2, cursor: messages.length ? "pointer" : "default", display: "flex", alignItems: "center", gap: T.sp1,
          }}><Ic name="trash" size={T.fs3} color={messages.length ? T.red : T.textMuted} />Clear</button>
        </div>

        {/* Arbitrator profile card */}
        <div style={{ background: T.surface, border: `1px solid ${T.border}`, borderRadius: T.r2, padding: T.sp4, marginBottom: T.sp4, display: "flex", gap: T.sp4, alignItems: "flex-start" }}>
          <div style={{ width: 44, height: 44, borderRadius: "50%", background: profile.color + "20", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
            <Ic name="user" size={T.sp5} color={profile.color} />
          </div>
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: T.fs4, fontWeight: 600, color: T.text, fontFamily: T.font }}>{profile.name}</div>
            <div style={{ fontSize: T.fs2, color: T.textMuted, fontFamily: T.font, marginTop: 2 }}>{profile.subtitle}</div>
            <div style={{ fontSize: T.fs2, color: T.textMid, fontFamily: T.font, marginTop: T.sp2, lineHeight: T.lh }}>{profile.bio}</div>
            <div style={{ display: "flex", flexWrap: "wrap", gap: T.sp2, marginTop: T.sp3 }}>
              {Object.entries(profile.traits).map(([k, v]) => (
                <span key={k} style={{ fontSize: T.fs1, fontFamily: T.mono, padding: `2px ${T.sp2}px`, borderRadius: T.r1, background: v > 0.7 ? T.accent + "15" : T.bg, color: v > 0.7 ? T.accent : T.textMuted }}>
                  {TRAIT_LABELS[k]?.label || k}: {(v * 100).toFixed(0)}%
                </span>
              ))}
            </div>
          </div>
        </div>

        {/* API key setup */}
        {!hasKey && (
          <div style={{ background: T.amber + "10", border: `1px solid ${T.amber}40`, borderRadius: T.r2, padding: T.sp5, marginBottom: T.sp4, display: "flex", alignItems: "center", gap: T.sp4, flexWrap: "wrap" }}>
            <div style={{ flex: "1 1 200px" }}>
              <div style={{ fontSize: T.fs4, fontWeight: 600, color: T.text, fontFamily: T.font }}>OpenAI API Key Required</div>
              <div style={{ fontSize: T.fs2, color: T.textMuted, fontFamily: T.font, marginTop: T.sp1 }}>Enter your OpenAI key to enable AI-powered Q&A. Your key is stored locally and never sent anywhere except OpenAI.</div>
            </div>
            <div style={{ display: "flex", gap: T.sp2, flex: "1 1 300px" }}>
              <input
                type="password"
                value={keyInput}
                onChange={e => setKeyInput(e.target.value)}
                onKeyDown={e => { if (e.key === "Enter" && keyInput.trim()) { localStorage.setItem("tharp-openai-key", keyInput.trim()); window._openaiKey = keyInput.trim(); setHasKey(true); setKeyInput(""); } }}
                placeholder="sk-..."
                style={{ flex: 1, padding: `${T.sp2}px ${T.sp3}px`, borderRadius: T.r2, border: `1px solid ${T.border}`, background: T.surface, color: T.text, fontFamily: T.mono, fontSize: T.fs2 }}
              />
              <button onClick={() => { if (keyInput.trim()) { localStorage.setItem("tharp-openai-key", keyInput.trim()); window._openaiKey = keyInput.trim(); setHasKey(true); setKeyInput(""); } }} style={{
                padding: `${T.sp2}px ${T.sp4}px`, borderRadius: T.r2, border: "none", background: T.accent, color: "#FFF",
                fontFamily: T.font, fontSize: T.fs2, fontWeight: 600, cursor: keyInput.trim() ? "pointer" : "default",
              }}>Save</button>
            </div>
          </div>
        )}

        {/* Chat messages */}
        <div ref={chatRef} style={{
          flex: 1, overflowY: "auto", minHeight: 300, maxHeight: "calc(100vh - 520px)",
          background: T.bg, border: `1px solid ${T.border}`, borderRadius: T.r2, padding: T.sp5,
          display: "flex", flexDirection: "column", gap: T.sp4,
        }}>
          {messages.length === 0 && !loading && (
            <div style={{ textAlign: "center", padding: "60px 20px", color: T.textMuted }}>
              <Ic name="message-circle" size={40} color={T.border} />
              <p style={{ fontSize: T.fs4, fontFamily: T.font, marginTop: T.sp4 }}>Ask a question as the arbitrator</p>
              <p style={{ fontSize: T.fs2, fontFamily: T.font, marginTop: T.sp1 }}>The AI will respond as Montana's counsel citing specific case evidence</p>
            </div>
          )}
          {messages.map((m, i) => (
            <div key={i} style={{ display: "flex", gap: T.sp3, alignItems: "flex-start" }}>
              <div style={{
                width: T.sp7, height: T.sp7, borderRadius: "50%", flexShrink: 0, display: "flex", alignItems: "center", justifyContent: "center",
                background: m.role === "user" ? profile.color + "20" : T.accent + "15",
              }}>
                <Ic name={m.role === "user" ? "user" : "scale"} size={T.fs4} color={m.role === "user" ? profile.color : T.accent} />
              </div>
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: T.fs1, fontWeight: 600, color: m.role === "user" ? profile.color : T.accent, fontFamily: T.font, marginBottom: T.sp1, textTransform: "uppercase", letterSpacing: 0.5 }}>
                  {m.role === "user" ? "Arbitrator" : "Montana Counsel"}
                </div>
                <div style={{
                  fontSize: T.fs3, color: m.error ? T.red : T.text, fontFamily: T.font, lineHeight: T.lhLoose,
                  background: m.role === "user" ? T.surface : "transparent",
                  padding: m.role === "user" ? `${T.sp3}px ${T.sp4}px` : "0",
                  borderRadius: m.role === "user" ? T.r2 : 0,
                  border: m.role === "user" ? `1px solid ${T.border}` : "none",
                }}>
                  {m.role === "assistant" ? renderContent(m.content) : m.content}
                </div>
              </div>
            </div>
          ))}
          {loading && (
            <div style={{ display: "flex", gap: T.sp3, alignItems: "flex-start" }}>
              <div style={{ width: T.sp7, height: T.sp7, borderRadius: "50%", background: T.accent + "15", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                <Ic name="scale" size={T.fs4} color={T.accent} />
              </div>
              <div style={{ fontSize: T.fs3, color: T.textMuted, fontFamily: T.font, padding: `${T.sp2}px 0` }}>
                <span style={{ animation: "pulse 1.5s ease-in-out infinite" }}>Preparing response…</span>
              </div>
            </div>
          )}
        </div>

        {/* Suggested questions */}
        {showSuggested && (
          <div style={{ background: T.surface, border: `1px solid ${T.border}`, borderRadius: T.r2, padding: T.sp3, marginTop: T.sp2, display: "flex", flexWrap: "wrap", gap: T.sp2 }}>
            <div style={{ width: "100%", fontSize: T.fs1, fontWeight: 600, color: T.textMuted, fontFamily: T.font, marginBottom: T.sp1, textTransform: "uppercase", letterSpacing: 0.5 }}>
              Suggested questions for {profile.name}
            </div>
            {suggested.map((q, i) => (
              <button key={i} onClick={() => { send(q); setShowSuggested(false); }} style={{
                background: T.bg, border: `1px solid ${T.border}`, borderRadius: T.r2, padding: `${T.sp2}px ${T.sp3}px`,
                fontSize: T.fs2, color: T.text, fontFamily: T.font, cursor: "pointer", textAlign: "left",
                lineHeight: T.lh, transition: T.fast,
              }}>{q}</button>
            ))}
          </div>
        )}

        {/* Input area */}
        <div style={{ display: "flex", gap: T.sp2, marginTop: T.sp3, alignItems: "flex-end" }}>
          <button onClick={() => setShowSuggested(s => !s)} title="Suggested questions" style={{
            padding: `${T.sp3}px ${T.sp3}px`, borderRadius: T.r2, border: `1px solid ${T.border}`,
            background: showSuggested ? T.accent + "15" : T.surface, cursor: "pointer", flexShrink: 0,
          }}>
            <Ic name="help-circle" size={T.sp4} color={showSuggested ? T.accent : T.textMuted} />
          </button>
          <textarea
            ref={inputRef}
            value={input}
            onChange={e => setInput(e.target.value)}
            onKeyDown={e => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); send(); } }}
            placeholder="Ask a question as the arbitrator…"
            rows={2}
            style={{
              flex: 1, padding: `${T.sp3}px ${T.sp4}px`, borderRadius: T.r2, border: `1px solid ${T.border}`,
              background: T.surface, color: T.text, fontFamily: T.font, fontSize: T.fs3,
              resize: "vertical", minHeight: 44, lineHeight: T.lh, outline: "none",
            }}
          />
          <button onClick={() => send()} disabled={!input.trim() || loading} style={{
            padding: `${T.sp3}px ${T.sp5}px`, borderRadius: T.r2, border: "none",
            background: input.trim() && !loading ? T.accent : T.border,
            color: input.trim() && !loading ? "#FFF" : T.textMuted,
            fontFamily: T.font, fontSize: T.fs3, fontWeight: 600, cursor: input.trim() && !loading ? "pointer" : "default",
            flexShrink: 0, display: "flex", alignItems: "center", gap: T.sp2,
          }}>
            <Ic name="send" size={14} color={input.trim() && !loading ? "#FFF" : T.textMuted} />Send
          </button>
        </div>
      </div>

      {/* Evidence sidebar */}
      {sidebar && (
        <div style={{ width: 320, marginLeft: T.sp4, flexShrink: 0 }}>
          <div style={{ background: T.surface, border: `1px solid ${T.border}`, borderRadius: T.r2, padding: T.sp5, position: "sticky", top: T.sp5 }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: T.sp4 }}>
              <span style={{ fontSize: T.fs1, fontWeight: 600, color: T.accent, fontFamily: T.font, textTransform: "uppercase", letterSpacing: 0.5 }}>{sidebar.type}</span>
              <button onClick={() => setSidebar(null)} style={{ background: "none", border: "none", cursor: "pointer", padding: 2 }}>
                <Ic name="x" size={16} color={T.textMuted} />
              </button>
            </div>
            <div style={{ fontSize: T.fs5, fontWeight: 700, color: T.text, fontFamily: T.font, marginBottom: T.sp4 }}>{sidebar.id}</div>
            {sidebar.fields.map(([label, val], i) => (
              <div key={i} style={{ display: "flex", justifyContent: "space-between", padding: `${T.sp3}px 0`, borderTop: `1px solid ${T.border}` }}>
                <span style={{ fontSize: T.fs2, color: T.textMuted, fontFamily: T.font }}>{label}</span>
                <span style={{ fontSize: T.fs2, color: T.text, fontFamily: T.font, fontWeight: 500, textAlign: "right", maxWidth: "60%", wordBreak: "break-word" }}>{val}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

// ── AI Command Bar ───────────────────────────────────────────────────────────
function CommandBar({ tab, setTab, reqs, updateReq, claims, updateClaim, docs, updateDoc, addDoc, removeDoc }) {
  const [open, setOpen] = useState(false);
  const [input, setInput] = useState("");
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(false);
  const [apiKey, setApiKey] = useState(window._openaiKey || "");
  const [keyInput, setKeyInput] = useState("");
  const [showSettings, setShowSettings] = useState(false);
  const messagesEndRef = useRef(null);

  useEffect(() => { messagesEndRef.current?.scrollIntoView({ behavior: "smooth" }); }, [messages]);

  useEffect(() => {
    const handler = (e) => { if ((e.ctrlKey || e.metaKey) && e.key === "k") { e.preventDefault(); setOpen(prev => !prev); } };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, []);

  const saveApiKey = (key) => {
    const k = key.trim();
    localStorage.setItem("tharp-openai-key", k);
    window._openaiKey = k;
    setApiKey(k);
    setKeyInput("");
    setShowSettings(false);
  };

  const handleSend = async () => {
    if (!input.trim() || loading) return;
    const userMsg = input.trim();
    setInput("");
    setMessages(prev => [...prev, { role: "user", content: userMsg }]);
    setLoading(true);
    try {
      const result = await handleAIRequest(userMsg,
        { tab, reqs, claims, docs },
        { setTab, updateReq, updateClaim, updateDoc, addDoc, removeDoc }
      );
      setMessages(prev => [...prev, { role: "assistant", content: result.text, actions: result.actions }]);
    } catch (err) {
      setMessages(prev => [...prev, { role: "assistant", content: "Error: " + err.message, actions: [] }]);
    } finally {
      setLoading(false);
    }
  };

  if (!open) {
    return (
      <button onClick={() => setOpen(true)} style={{
        position: "fixed", bottom: 24, right: 28, zIndex: 1000,
        padding: `${T.sp3}px ${T.sp6}px`, borderRadius: T.r3,
        background: T.navBg, color: "#fff", border: "none",
        cursor: "pointer", fontFamily: T.font, fontSize: T.fs3, fontWeight: 500,
        boxShadow: T.sh3,
        display: "flex", alignItems: "center", gap: T.sp2, transition: T.med,
      }}>
        <Ic name="zap" size={T.fs4} color="#fff" /> Ask AI
        <span style={{ fontSize: T.fs1, color: T.navText, marginLeft: T.sp1 }}>Ctrl+K</span>
      </button>
    );
  }

  return (
    <div style={{
      position: "fixed", bottom: 24, right: 28, zIndex: 1000,
      width: 420, maxHeight: 540, borderRadius: T.r3,
      background: T.surface, border: `1px solid ${T.border}`,
      boxShadow: T.sh3,
      display: "flex", flexDirection: "column", fontFamily: T.font,
    }}>
      {/* Header */}
      <div style={{
        padding: `${T.sp3}px ${T.sp4}px`, borderBottom: `1px solid ${T.border}`,
        display: "flex", justifyContent: "space-between", alignItems: "center",
      }}>
        <div style={{ display: "flex", alignItems: "center", gap: T.sp2 }}>
          <Ic name="zap" size={14} color={T.accent} />
          <span style={{ fontSize: T.fs3, fontWeight: 600, color: T.text }}>AI Assistant</span>
          <span style={{ fontSize: T.fs1, color: T.textMuted }}>· {tab}</span>
        </div>
        <div style={{ display: "flex", gap: T.sp1, alignItems: "center" }}>
          <button onClick={() => setShowSettings(!showSettings)} title="Settings" style={{
            background: "none", border: "none", cursor: "pointer", fontSize: 14,
            color: T.textMuted, lineHeight: 1, padding: "2px 6px",
          }}><Ic name="settings" size={14} color={T.textMuted} /></button>
          <button onClick={() => setOpen(false)} style={{
            background: "none", border: "none", cursor: "pointer", fontSize: 18,
            color: T.textMuted, lineHeight: 1, padding: "2px 6px",
          }}>×</button>
        </div>
      </div>

      {/* Settings Panel */}
      {showSettings && (
        <div style={{ padding: `${T.sp3}px ${T.sp4}px`, borderBottom: `1px solid ${T.border}`, background: T.bg }}>
          <label style={{ display: "block", fontSize: T.fs1, fontWeight: 600, color: T.textMid, marginBottom: T.sp2, fontFamily: T.font }}>OpenAI API Key</label>
          <div style={{ display: "flex", gap: T.sp2 }}>
            <input type="password" value={keyInput || (apiKey ? "••••••••" + apiKey.slice(-8) : "")}
              onChange={e => setKeyInput(e.target.value)}
              onFocus={() => { if (!keyInput) setKeyInput(""); }}
              placeholder="sk-..."
              style={{ flex: 1, padding: `${T.sp2}px ${T.sp3}px`, borderRadius: T.r1, border: `1px solid ${T.border}`, fontSize: T.fs2, fontFamily: T.mono, color: T.text, background: T.surface }} />
            <button onClick={() => saveApiKey(keyInput)} disabled={!keyInput.trim()} style={{
              padding: `${T.sp2}px ${T.sp3}px`, borderRadius: T.r1, cursor: keyInput.trim() ? "pointer" : "default", fontFamily: T.font, fontSize: T.fs1, fontWeight: 600,
              border: "none", background: keyInput.trim() ? T.accent : T.border, color: keyInput.trim() ? "#fff" : T.textMuted,
            }}>Save</button>
          </div>
          <div style={{ fontSize: T.fs1, color: T.textMuted, marginTop: T.sp1, fontFamily: T.font }}>Stored in your browser only — never sent to our servers.</div>
          {apiKey && (
            <button onClick={() => { saveApiKey(""); setKeyInput(""); }} style={{
              marginTop: T.sp2, padding: `${T.sp1}px ${T.sp3}px`, borderRadius: T.r1, cursor: "pointer", fontFamily: T.font, fontSize: T.fs1,
              border: `1px solid ${T.redBorder}`, background: T.redBg, color: T.red,
            }}>Remove Key</button>
          )}
        </div>
      )}

      {/* No API Key Prompt */}
      {!apiKey && !showSettings && (
        <div style={{ padding: `${T.sp6}px ${T.sp4}px`, textAlign: "center" }}>
          <div style={{ marginBottom: T.sp3 }}><Ic name="key" size={28} color={T.accent} /></div>
          <div style={{ fontSize: T.fs3, fontWeight: 500, color: T.text, marginBottom: T.sp1, fontFamily: T.font }}>Connect OpenAI</div>
          <div style={{ fontSize: T.fs1, color: T.textMuted, marginBottom: T.sp3, fontFamily: T.font, lineHeight: T.lh }}>
            Enter your OpenAI API key to enable AI-powered commands, document analysis, and case insights.
          </div>
          <button onClick={() => setShowSettings(true)} style={{
            padding: `${T.sp2}px ${T.sp5}px`, borderRadius: T.r2, cursor: "pointer", fontFamily: T.font, fontSize: T.fs2, fontWeight: 600,
            border: "none", background: T.accent, color: "#fff",
          }}>Add API Key</button>
        </div>
      )}

      {/* Messages */}
      <div style={{
        flex: 1, overflow: "auto", padding: `${T.sp3}px ${T.sp4}px`,
        display: "flex", flexDirection: "column", gap: T.sp3,
        maxHeight: 360,
      }}>
        {messages.length === 0 && (
          <div style={{ textAlign: "center", padding: `${T.sp5}px 0`, color: T.textMuted, fontSize: T.fs2 }}>
            <div style={{ marginBottom: T.sp2 }}>Ask me anything about the case.</div>
            <div style={{ fontSize: T.fs1, lineHeight: T.lh }}>
              Try: "Flag REQ-3 as duplicate billing"<br />
              "What's the total disputed amount?"<br />
              "Add a document for the Korth subcontract"
            </div>
          </div>
        )}
        {messages.map((msg, i) => (
          <div key={i}>
            <div style={{
              maxWidth: "85%",
              marginLeft: msg.role === "user" ? "auto" : 0,
              marginRight: msg.role === "assistant" ? "auto" : 0,
              padding: `${T.sp2}px ${T.sp3}px`, borderRadius: T.r2,
              background: msg.role === "user" ? T.accentBg : T.bg,
              border: `1px solid ${msg.role === "user" ? T.accentBorder : T.border}`,
              fontSize: T.fs2, color: T.text, lineHeight: T.lh, whiteSpace: "pre-wrap",
            }}>
              {msg.content}
            </div>
            {msg.actions && msg.actions.length > 0 && (
              <div style={{ marginTop: T.sp2, display: "flex", flexDirection: "column", gap: T.sp1 }}>
                {msg.actions.map((action, j) => (
                  <div key={j} style={{
                    padding: `${T.sp2}px ${T.sp3}px`, borderRadius: T.r2,
                    background: T.greenBg, border: `1px solid ${T.green}22`,
                    fontSize: T.fs1, color: T.green,
                    display: "flex", gap: T.sp2, alignItems: "center",
                  }}>
                    <Ic name={action.icon} size={12} color={T.green} />
                    <span>{action.summary}</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        ))}
        {loading && (
          <div style={{ fontSize: T.fs2, color: T.textMuted, padding: `${T.sp2}px 0` }}>Thinking...</div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      {apiKey && <div style={{
        padding: `${T.sp3}px ${T.sp4}px`, borderTop: `1px solid ${T.border}`,
        display: "flex", gap: T.sp2,
      }}>
        <input
          type="text" value={input}
          onChange={e => setInput(e.target.value)}
          onKeyDown={e => { if (e.key === "Enter") handleSend(); }}
          placeholder="Ask about the case..."
          autoFocus
          style={{
            flex: 1, padding: `${T.sp2}px ${T.sp3}px`, borderRadius: T.r2,
            border: `1px solid ${T.border}`, fontSize: T.fs3,
            fontFamily: T.font, color: T.text, background: T.bg,
          }}
        />
        <button onClick={handleSend} disabled={loading || !input.trim()} style={{
          padding: `${T.sp2}px ${T.sp4}px`, borderRadius: T.r2, cursor: loading ? "default" : "pointer",
          fontFamily: T.font, fontSize: T.fs2, fontWeight: 600,
          border: "none", background: loading ? T.border : T.accent,
          color: loading ? T.textMuted : "#fff",
        }}>
          {loading ? "..." : "Send"}
        </button>
      </div>}
    </div>
  );
}

// ── ROOT ──────────────────────────────────────────────────────────────────────
export default function App() {
  const [tab, setTab] = useState("dashboard");
  const [mode, setMode] = useState("presentation"); // "prep" or "presentation"
  const [prepUnlocked, setPrepUnlocked] = useState(() => sessionStorage.getItem("tharp-prep-unlocked") === "true");
  const [showPwModal, setShowPwModal] = useState(false);
  const [pwInput, setPwInput] = useState("");
  const [pwError, setPwError] = useState(false);
  const [reqs, setReqs] = useState(REQS_INITIAL);
  const [claims, setClaims] = useState(OWNER_CLAIMS_INITIAL);
  const [docs, setDocs] = useState(DOCS_INITIAL);
  const [attachments, setAttachments] = useState({}); // { invoiceId: { fileName, size, date } }
  const [loaded, setLoaded] = useState(false);
  const [saved, setSaved] = useState(false);

  const PREP_HASH = "5f4dcc3b5aa765d61d8327deb882cf99a04d5a163e5a"; // not the real hash, just a marker
  const handlePrepToggle = () => {
    if (mode === "prep") { setMode("presentation"); return; }
    if (prepUnlocked) { setMode("prep"); return; }
    setPwInput(""); setPwError(false); setShowPwModal(true);
  };
  const handlePwSubmit = () => {
    if (pwInput === "Montana1778!") {
      setPrepUnlocked(true);
      sessionStorage.setItem("tharp-prep-unlocked", "true");
      setMode("prep");
      setShowPwModal(false);
      setPwInput("");
      setPwError(false);
    } else {
      setPwError(true);
      setPwInput("");
    }
  };

  useEffect(() => {
    (async () => {
      const r = await storageGet("tharp-reqs-v3");
      const c = await storageGet("tharp-claims-v3");
      const d = await storageGet("tharp-docs-v1");
      // REQS_INITIAL is always authoritative — merge stored user-edits underneath
      if (r) setReqs(REQS_INITIAL.map(init => {
        const stored = r.find(s => s.id === init.id);
        return stored ? { ...stored, ...init } : init;
      }));
      if (c) setClaims(c);
      if (d) setDocs(d);
      // Restore attachments metadata
      const att = await storageGet("tharp-attachments-v1");
      if (att) setAttachments(att);
      // Restore OpenAI key from localStorage
      const storedKey = localStorage.getItem("tharp-openai-key");
      if (storedKey && !window._openaiKey) window._openaiKey = storedKey;
      setLoaded(true);
    })();
  }, []);

  const saveReqs = useCallback(async (next) => {
    await storageSet("tharp-reqs-v3", next);
    setSaved(true); setTimeout(() => setSaved(false), 2000);
  }, []);
  const saveClaims = useCallback(async (next) => {
    await storageSet("tharp-claims-v3", next);
    setSaved(true); setTimeout(() => setSaved(false), 2000);
  }, []);
  const saveDocs = useCallback(async (next) => {
    await storageSet("tharp-docs-v1", next);
    setSaved(true); setTimeout(() => setSaved(false), 2000);
  }, []);

  const updateReq = useCallback((id, updates) => {
    setReqs(prev => {
      const next = prev.map(r => r.id === id ? { ...r, ...updates } : r);
      saveReqs(next);
      return next;
    });
  }, [saveReqs]);

  const updateClaim = useCallback((id, updates) => {
    setClaims(prev => {
      const next = prev.map(c => c.id === id ? { ...c, ...updates } : c);
      saveClaims(next);
      return next;
    });
  }, [saveClaims]);

  const updateDoc = useCallback((id, updates) => {
    setDocs(prev => {
      const next = prev.map(d => d.id === id ? { ...d, ...updates } : d);
      saveDocs(next);
      return next;
    });
  }, [saveDocs]);

  const addDoc = useCallback((doc) => {
    setDocs(prev => {
      const next = [...prev, doc];
      saveDocs(next);
      return next;
    });
  }, [saveDocs]);

  const removeDoc = useCallback((id) => {
    setDocs(prev => {
      const next = prev.filter(d => d.id !== id);
      saveDocs(next);
      return next;
    });
  }, [saveDocs]);

  // Attachment management (PDF ↔ Invoice Catalogue)
  const onAttach = useCallback((invoiceId, meta) => {
    setAttachments(prev => {
      const next = { ...prev, [invoiceId]: meta };
      storageSet("tharp-attachments-v1", next);
      return next;
    });
  }, []);
  const onDetach = useCallback((invoiceId) => {
    setAttachments(prev => {
      const next = { ...prev };
      delete next[invoiceId];
      storageSet("tharp-attachments-v1", next);
      return next;
    });
  }, []);

  // When mode switches, fall back to dashboard if current tab is hidden
  useEffect(() => {
    const prepOnly = ["audit", "simulator", "strategy"];
    if (mode === "presentation" && prepOnly.includes(tab)) setTab("dashboard");
  }, [mode, tab]);

  if (!loaded) return (
    <div style={{ background: T.bg, minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", fontFamily: T.font }}>
      <div style={{ fontSize: T.fs4, color: T.textMuted, letterSpacing: 0.5 }}>Loading…</div>
    </div>
  );

  const PRESENTATION_TABS = [
    { id: "dashboard",    label: mode === "presentation" ? "Overview" : "Dashboard", icon: "grid" },
    { id: "financial",    label: "Financial Reconciliation", icon: "dollar" },
    { id: "requisitions", label: "Requisitions", icon: "file-text" },
    { id: "timecards",    label: "Timecards", icon: "users" },
    { id: "changeorders", label: "Change Orders", icon: "edit" },
    { id: "claims",       label: mode === "presentation" ? "Claims & Defenses" : "Owner Claims", icon: "flag" },
    { id: "timeline",     label: "Timeline", icon: "clock" },
    { id: "documents",    label: "Documents", icon: "folder" },
    { id: "catalogue",   label: "Invoice Catalogue", icon: "book" },
    { id: "qa",          label: "Q&A", icon: "message-circle" },
  ];
  const PREP_TABS = [
    { id: "audit",     label: "Audit Risk", icon: "alert" },
    { id: "simulator", label: "Simulator",  icon: "cpu" },
    { id: "strategy",  label: "Strategy",   icon: "target" },
  ];
  const TABS = mode === "presentation" ? PRESENTATION_TABS : [...PRESENTATION_TABS, ...PREP_TABS];

  return (
    <div style={{ background: T.bg, minHeight: "100vh", fontFamily: T.font }}>
      {/* Password Modal for Prep Mode */}
      {showPwModal && <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.6)", zIndex: 9999, display: "flex", alignItems: "center", justifyContent: "center", backdropFilter: "blur(4px)" }} onClick={() => setShowPwModal(false)}>
        <div onClick={e => e.stopPropagation()} style={{ background: T.surface, border: `1px solid ${T.border}`, borderRadius: T.r3, padding: T.sp7, width: 380, boxShadow: "0 20px 60px rgba(0,0,0,0.4)" }}>
          <div style={{ display: "flex", alignItems: "center", gap: T.sp3, marginBottom: T.sp5 }}>
            <div style={{ width: 40, height: 40, borderRadius: T.r2, background: T.accent + "15", display: "flex", alignItems: "center", justifyContent: "center" }}>
              <Ic name="lock" size={20} color={T.accent} />
            </div>
            <div>
              <div style={{ fontSize: T.fs4, fontWeight: 700, color: T.text, fontFamily: T.font }}>Prep Mode Access</div>
              <div style={{ fontSize: T.fs1, color: T.textMuted, fontFamily: T.font }}>Enter password to continue</div>
            </div>
          </div>
          <form onSubmit={e => { e.preventDefault(); handlePwSubmit(); }}>
            <input
              type="password"
              autoFocus
              value={pwInput}
              onChange={e => { setPwInput(e.target.value); setPwError(false); }}
              placeholder="Password"
              style={{
                width: "100%", padding: `${T.sp3}px ${T.sp4}px`, fontSize: T.fs3, fontFamily: T.font,
                border: `2px solid ${pwError ? T.red : T.border}`, borderRadius: T.r2, outline: "none",
                background: T.bg, color: T.text, boxSizing: "border-box",
                transition: T.fast,
              }}
            />
            {pwError && <div style={{ color: T.red, fontSize: T.fs1, fontFamily: T.font, marginTop: T.sp2, display: "flex", alignItems: "center", gap: T.sp1 }}>
              <Ic name="alert" size={14} color={T.red} /> Incorrect password
            </div>}
            <div style={{ display: "flex", gap: T.sp3, marginTop: T.sp5 }}>
              <button type="button" onClick={() => setShowPwModal(false)} style={{
                flex: 1, padding: `${T.sp3}px 0`, borderRadius: T.r2, border: `1px solid ${T.border}`,
                background: "none", color: T.textMuted, fontSize: T.fs2, fontFamily: T.font, cursor: "pointer",
              }}>Cancel</button>
              <button type="submit" style={{
                flex: 1, padding: `${T.sp3}px 0`, borderRadius: T.r2, border: "none",
                background: T.accent, color: "#fff", fontSize: T.fs2, fontWeight: 600, fontFamily: T.font, cursor: "pointer",
              }}>Unlock</button>
            </div>
          </form>
        </div>
      </div>}
      {/* Top Bar */}
      <div style={{ background: `linear-gradient(135deg, ${T.navBg} 0%, #1A1814 100%)`, padding: `0 ${T.sp7}px`, display: "flex", alignItems: "center", justifyContent: "space-between", height: 56, borderBottom: `2px solid ${T.accent}` }}>
        <div style={{ display: "flex", alignItems: "center", gap: T.sp4 }}>
          <Ic name="scale" size={T.sp5} color={T.accent} />
          <span style={{ fontSize: T.fs5, fontWeight: 700, color: "#FFFFFF", letterSpacing: -0.5, fontFamily: T.font }}>Arbitai</span>
          <span style={{ width: 1, height: T.sp5, background: "#333028", display: "inline-block", margin: `0 ${T.sp1}px` }}></span>
          <span style={{ fontSize: T.fs1, color: T.navText, fontFamily: T.font, padding: `${T.sp1}px ${T.sp3}px`, background: "rgba(255,255,255,0.06)", borderRadius: T.r1, letterSpacing: 0.2 }}>Montana v. Tharp</span>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: T.sp4 }}>
          {saved && <span style={{ fontSize: T.fs1, color: T.green, fontFamily: T.font, display: "flex", alignItems: "center", gap: T.sp1 }}><Ic name="check" size={T.fs2} color={T.green} />{"Saved" + (window._storageMode === "cloud" ? " to cloud" : "")}</span>}
          <button onClick={handlePrepToggle} style={{
            background: mode === "presentation" ? T.accent + "25" : "rgba(255,255,255,0.06)",
            border: `1px solid ${mode === "presentation" ? T.accent : "#333028"}`,
            borderRadius: T.r2, padding: `${T.sp1}px ${T.sp3}px`, cursor: "pointer",
            display: "inline-flex", alignItems: "center", gap: T.sp2, transition: T.fast,
          }}>
            <Ic name={mode === "presentation" ? "play" : "settings"} size={T.fs2} color={mode === "presentation" ? T.accent : "#999"} />
            <span style={{ fontSize: T.fs1, fontWeight: 500, fontFamily: T.font, color: mode === "presentation" ? T.accent : "#999", letterSpacing: 0.2 }}>
              {mode === "presentation" ? "Presentation" : "Prep Mode"}
            </span>
          </button>
          <span style={{ fontSize: T.fs1, padding: `${T.sp1}px ${T.sp3}px`, borderRadius: T.r2, background: window._storageMode === "cloud" ? "#16A34A15" : "#D9770615", color: window._storageMode === "cloud" ? T.green : T.amber, fontFamily: T.font, display: "inline-flex", alignItems: "center", gap: T.sp1 }}><Ic name="cloud" size={T.fs2} color={window._storageMode === "cloud" ? T.green : T.amber} />{window._storageMode === "cloud" ? "Cloud" : "Local"}</span>
          <span style={{ fontSize: T.fs1, padding: `2px ${T.sp2}px`, borderRadius: T.r1, background: "rgba(255,255,255,0.06)", color: T.navText, fontFamily: T.mono }}>v1.0</span>
        </div>
      </div>

      {/* Nav */}
      <div style={{ background: T.surface, borderBottom: `1px solid ${T.border}`, padding: `0 ${T.sp7}px`, display: "flex", gap: 2 }}>
        {TABS.map(t => {
          const active = tab === t.id;
          return (
            <button key={t.id} onClick={() => setTab(t.id)} style={{
              background: "none", border: "none", cursor: "pointer", padding: `${T.sp3}px ${T.sp5}px`,
              display: "flex", alignItems: "center", gap: T.sp2,
              fontSize: T.fs3, fontWeight: active ? 600 : 400, fontFamily: T.font,
              color: active ? T.text : T.textMuted,
              borderBottom: active ? `3px solid ${T.accent}` : "3px solid transparent",
              marginBottom: -1, transition: T.fast, letterSpacing: -0.1,
            }}>
              <Ic name={t.icon} size={14} color={active ? T.accent : T.textMuted} sw={active ? 2 : 1.5} />
              {t.label}
            </button>
          );
        })}
      </div>

      {/* Content */}
      <div style={{ padding: "32px 32px", maxWidth: 1400, margin: "0 auto" }}>
        {tab === "dashboard" && <Dashboard reqs={reqs} claims={claims} mode={mode} />}
        {tab === "financial" && <FinancialReconciliation reqs={reqs} />}
        {tab === "requisitions" && <Requisitions reqs={reqs} updateReq={updateReq} docs={docs} updateDoc={updateDoc} addDoc={addDoc} />}
        {tab === "timecards" && <Timecards reqs={reqs} />}
        {tab === "changeorders" && <ChangeOrdersTab reqs={reqs} />}
        {tab === "claims" && <Claims claims={claims} updateClaim={updateClaim} />}
        {tab === "timeline" && <TimelineTab reqs={reqs} claims={claims} />}
        {tab === "documents" && <Documents docs={docs} updateDoc={updateDoc} addDoc={addDoc} removeDoc={removeDoc} reqs={reqs} />}
        {tab === "catalogue" && <InvoiceCatalogue attachments={attachments} onAttach={onAttach} onDetach={onDetach} />}
        {tab === "qa" && <ArbitratorQAChat reqs={reqs} claims={claims} docs={docs} />}
        {tab === "audit" && <AuditRisk reqs={reqs} />}
        {tab === "simulator" && <ArbitrationSimulator reqs={reqs} claims={claims} />}
        {tab === "strategy" && <Strategy claims={claims} reqs={reqs} />}
      </div>

      {/* AI Assistant */}
      <CommandBar
        tab={tab} setTab={setTab}
        reqs={reqs} updateReq={updateReq}
        claims={claims} updateClaim={updateClaim}
        docs={docs} updateDoc={updateDoc} addDoc={addDoc} removeDoc={removeDoc}
      />
    </div>
  );
}
