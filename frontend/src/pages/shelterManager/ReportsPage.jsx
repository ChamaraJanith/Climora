import { useState, useEffect, useCallback } from 'react';
import { motion } from 'framer-motion';
import axios from 'axios';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import {
  Bell, Download, RefreshCw, AlertTriangle, CheckCircle, Home, Package,
} from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import ShelterSidebar from '../../components/shelterManager/ShelterSidebar';

const API = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000/api';

function Topbar() {
  const { user } = useAuth();
  const initial = user?.username?.[0]?.toUpperCase() || 'S';
  return (
    <header className="h-16 bg-white border-b border-gray-100 flex items-center justify-between px-6 sticky top-0 z-30">
      <div>
        <p className="text-sm font-semibold text-gray-700">Shelter Manager Reports</p>
        <p className="text-xs text-gray-400">Generated: {new Date().toLocaleString()}</p>
      </div>
      <div className="flex items-center gap-3">
        <button className="relative w-9 h-9 rounded-xl bg-gray-50 border border-gray-200 flex items-center justify-center text-gray-500 hover:text-[#06b6d4] hover:border-[#06b6d4] transition-colors"><Bell size={18} /></button>
        <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-[#06b6d4] to-[#3b82f6] flex items-center justify-center text-white text-sm font-bold">{initial}</div>
      </div>
    </header>
  );
}

const STATUS_COLOR = {
  open:    { bg: 'bg-emerald-500', light: 'bg-emerald-50 text-emerald-700 border-emerald-200' },
  standby: { bg: 'bg-amber-400',   light: 'bg-amber-50 text-amber-700 border-amber-200' },
  planned: { bg: 'bg-blue-400',    light: 'bg-blue-50 text-blue-700 border-blue-200' },
  closed:  { bg: 'bg-red-500',     light: 'bg-red-50 text-red-700 border-red-200' },
};

const RISK_COLOR = {
  low:    'bg-emerald-500',
  medium: 'bg-amber-400',
  high:   'bg-red-500',
};

const CAT_COLOR = {
  food:     'bg-emerald-500',
  medicine: 'bg-red-500',
  water:    'bg-blue-500',
  clothes:  'bg-purple-500',
  hygiene:  'bg-pink-500',
  battery:  'bg-amber-500',
  other:    'bg-gray-400',
};


// Simple bar chart using divs
function BarChart({ data, colorKey, maxVal }) {
  const max = maxVal || Math.max(...data.map(d => d.value), 1);
  return (
    <div className="space-y-2">
      {data.map((d, i) => (
        <div key={i} className="flex items-center gap-3">
          <span className="text-xs text-gray-500 w-24 truncate shrink-0">{d.label}</span>
          <div className="flex-1 h-6 bg-gray-100 rounded-lg overflow-hidden">
            <motion.div
              initial={{ width: 0 }}
              animate={{ width: `${Math.round((d.value / max) * 100)}%` }}
              transition={{ duration: 0.7, delay: i * 0.05, ease: 'easeOut' }}
              className={`h-full rounded-lg ${colorKey?.[d.key] || 'bg-[#06b6d4]'}`}
            />
          </div>
          <span className="text-xs font-semibold text-gray-700 w-8 text-right">{d.value}</span>
        </div>
      ))}
    </div>
  );
}

// Donut-style stat ring
function StatRing({ pct, color, size = 80 }) {
  const r = (size - 12) / 2;
  const circ = 2 * Math.PI * r;
  const dash = (pct / 100) * circ;
  return (
    <svg width={size} height={size} className="-rotate-90">
      <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="#f3f4f6" strokeWidth={10} />
      <motion.circle
        cx={size / 2} cy={size / 2} r={r} fill="none"
        stroke={color} strokeWidth={10} strokeLinecap="round"
        strokeDasharray={circ}
        initial={{ strokeDashoffset: circ }}
        animate={{ strokeDashoffset: circ - dash }}
        transition={{ duration: 1, ease: 'easeOut' }}
      />
    </svg>
  );
}

function SectionCard({ title, children, className = '' }) {
  return (
    <div className={`bg-[#F9FAFB] rounded-2xl border border-gray-100 shadow-sm p-5 ${className}`}>
      <p className="text-sm font-bold text-gray-700 mb-4 uppercase tracking-wide">{title}</p>
      {children}
    </div>
  );
}

export default function ReportsPage() {
  const [shelters, setShelters] = useState([]);
  const [occupancies, setOccupancies] = useState({});
  const [loading, setLoading] = useState(true);

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const { data } = await axios.get(`${API}/shelters`);
      const list = Array.isArray(data) ? data : data.shelters || [];
      setShelters(list);
      const occ = {};
      await Promise.allSettled(list.map(async s => {
        try {
          const r = await axios.get(`${API}/shelters/${s.shelterId}/occupancy`);
          occ[s.shelterId] = r.data;
        } catch {}
      }));
      setOccupancies(occ);
    } catch {}
    finally { setLoading(false); }
  }, []);

  useEffect(() => { fetchData(); }, [fetchData]);

  const handleExport = () => {
    const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });
    const pageW = doc.internal.pageSize.getWidth();
    const pageH = doc.internal.pageSize.getHeight();
    const now = new Date();
    const nowStr = now.toLocaleString();
    const dateStr = now.toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });

    const addPageHeader = (title) => {
      doc.setFillColor(11, 60, 93);
      doc.rect(0, 0, pageW, 18, 'F');
      doc.setTextColor(255, 255, 255);
      doc.setFontSize(9); doc.setFont('helvetica', 'bold');
      doc.text('CLIMORA SHELTER MANAGEMENT', 14, 8);
      doc.setFont('helvetica', 'normal'); doc.setFontSize(8);
      doc.text(title, 14, 14);
      doc.text(dateStr, pageW - 14, 14, { align: 'right' });
      doc.setTextColor(0, 0, 0);
      return 24;
    };
    const secTitle = (text, y) => {
      doc.setFillColor(6, 182, 212);
      doc.rect(14, y, 3, 6, 'F');
      doc.setFontSize(11); doc.setFont('helvetica', 'bold');
      doc.setTextColor(11, 60, 93);
      doc.text(text, 19, y + 5);
      doc.setTextColor(0, 0, 0);
      return y + 10;
    };
    const divider = (y) => {
      doc.setDrawColor(229, 231, 235); doc.line(14, y, pageW - 14, y); return y + 4;
    };
    const kpiBox = (x, y, w, h, label, value, sub, color) => {
      doc.setFillColor(249, 250, 251);
      doc.roundedRect(x, y, w, h, 2, 2, 'F');
      doc.setDrawColor(...color); doc.setLineWidth(0.5);
      doc.roundedRect(x, y, w, h, 2, 2, 'S'); doc.setLineWidth(0.2);
      doc.setFontSize(7); doc.setFont('helvetica', 'normal'); doc.setTextColor(107, 114, 128);
      doc.text(label.toUpperCase(), x + 4, y + 6);
      doc.setFontSize(16); doc.setFont('helvetica', 'bold'); doc.setTextColor(...color);
      doc.text(String(value), x + 4, y + 15);
      if (sub) { doc.setFontSize(7); doc.setFont('helvetica', 'normal'); doc.setTextColor(156, 163, 175); doc.text(sub, x + 4, y + 20); }
      doc.setTextColor(0, 0, 0);
    };

    // ── COVER PAGE ───────────────────────────────────────────────────────
    doc.setFillColor(11, 60, 93); doc.rect(0, 0, pageW, pageH, 'F');
    doc.setFillColor(6, 182, 212); doc.rect(0, pageH / 2 - 2, pageW, 4, 'F');
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(28); doc.setFont('helvetica', 'bold');
    doc.text('SHELTER MANAGEMENT', pageW / 2, pageH / 2 - 28, { align: 'center' });
    doc.setFontSize(22); doc.setFont('helvetica', 'normal');
    doc.text('OPERATIONAL REPORT', pageW / 2, pageH / 2 - 16, { align: 'center' });
    doc.setFontSize(11); doc.setTextColor(6, 182, 212);
    doc.text('Climora Disaster Management Platform', pageW / 2, pageH / 2 + 14, { align: 'center' });
    doc.setFontSize(9); doc.setTextColor(200, 220, 240);
    doc.text(`Report Date: ${dateStr}`, pageW / 2, pageH / 2 + 24, { align: 'center' });
    doc.text(`Generated: ${nowStr}`, pageW / 2, pageH / 2 + 30, { align: 'center' });
    const coverStats = [
      { label: 'Total Shelters', val: total },
      { label: 'Open', val: byStatus.find(s => s.key === 'open')?.value || 0 },
      { label: 'Closed', val: byStatus.find(s => s.key === 'closed')?.value || 0 },
      { label: 'Total Occupants', val: totalOccupied },
    ];
    const cw = (pageW - 28) / 4;
    coverStats.forEach((cs, i) => {
      const cx = 14 + i * (cw + 2);
      doc.setFillColor(15, 80, 120); doc.roundedRect(cx, pageH - 55, cw, 22, 2, 2, 'F');
      doc.setFontSize(16); doc.setFont('helvetica', 'bold'); doc.setTextColor(6, 182, 212);
      doc.text(String(cs.val), cx + cw / 2, pageH - 46, { align: 'center' });
      doc.setFontSize(7); doc.setFont('helvetica', 'normal'); doc.setTextColor(180, 210, 240);
      doc.text(cs.label.toUpperCase(), cx + cw / 2, pageH - 39, { align: 'center' });
    });
    doc.setFontSize(7); doc.setTextColor(100, 140, 180);
    doc.text('CONFIDENTIAL — FOR SHELTER MANAGEMENT USE ONLY', pageW / 2, pageH - 10, { align: 'center' });

    // ── PAGE 2: EXECUTIVE SUMMARY ────────────────────────────────────────
    doc.addPage();
    let y = addPageHeader('Executive Summary');
    y = secTitle('1. Executive Summary', y);
    const bw = (pageW - 32) / 3;
    const kpiDefs = [
      { label: 'Total Shelters',    value: total,                                          sub: 'registered',          color: [11,60,93] },
      { label: 'Open Shelters',     value: byStatus.find(s=>s.key==='open')?.value||0,     sub: 'currently active',    color: [16,185,129] },
      { label: 'Closed Shelters',   value: byStatus.find(s=>s.key==='closed')?.value||0,   sub: 'not operational',     color: [239,68,68] },
      { label: 'Standby',           value: byStatus.find(s=>s.key==='standby')?.value||0,  sub: 'on standby',          color: [245,158,11] },
      { label: 'Total Occupants',   value: totalOccupied,                                  sub: `of ${totalCapacity} capacity`, color: [6,182,212] },
      { label: 'Overall Fill Rate', value: `${overallPct}%`,                               sub: 'capacity used',       color: overallPct>=90?[239,68,68]:overallPct>=70?[245,158,11]:[6,182,212] },
    ];
    kpiDefs.forEach((k, i) => {
      kpiBox(14 + (i%3)*(bw+2), y + Math.floor(i/3)*28, bw, 24, k.label, k.value, k.sub, k.color);
    });
    y += 62;
    y = divider(y);
    y = secTitle('2. Shelter Status Overview', y);
    autoTable(doc, {
      startY: y,
      head: [['Status', 'Count', '% of Total', 'Description']],
      body: [
        ['Open',    byStatus.find(s=>s.key==='open')?.value||0,    `${total>0?Math.round(((byStatus.find(s=>s.key==='open')?.value||0)/total)*100):0}%`,    'Actively receiving evacuees'],
        ['Standby', byStatus.find(s=>s.key==='standby')?.value||0, `${total>0?Math.round(((byStatus.find(s=>s.key==='standby')?.value||0)/total)*100):0}%`, 'Ready to open on short notice'],
        ['Planned', byStatus.find(s=>s.key==='planned')?.value||0, `${total>0?Math.round(((byStatus.find(s=>s.key==='planned')?.value||0)/total)*100):0}%`, 'Designated but not yet activated'],
        ['Closed',  byStatus.find(s=>s.key==='closed')?.value||0,  `${total>0?Math.round(((byStatus.find(s=>s.key==='closed')?.value||0)/total)*100):0}%`,  'Currently not operational'],
        ['TOTAL',   total, '100%', ''],
      ],
      styles: { fontSize: 9, cellPadding: 3 },
      headStyles: { fillColor: [11,60,93], textColor: 255, fontStyle: 'bold' },
      alternateRowStyles: { fillColor: [249,250,251] },
      didParseCell(d) {
        if (d.section==='body' && d.row.index===4) { d.cell.styles.fontStyle='bold'; d.cell.styles.fillColor=[240,249,255]; }
        if (d.section==='body' && d.column.index===0) {
          const c = { Open:[16,185,129], Standby:[245,158,11], Planned:[59,130,246], Closed:[239,68,68] };
          if (c[d.cell.raw]) d.cell.styles.textColor = c[d.cell.raw];
        }
      },
      margin: { left: 14, right: 14 },
    });
    y = doc.lastAutoTable.finalY + 6;
    y = divider(y);
    y = secTitle('3. Risk Level Distribution', y);
    autoTable(doc, {
      startY: y,
      head: [['Risk Level', 'Shelters', '% of Total']],
      body: byRisk.map(r => [r.label, r.value, `${total>0?Math.round((r.value/total)*100):0}%`]),
      styles: { fontSize: 9, cellPadding: 3 },
      headStyles: { fillColor: [11,60,93], textColor: 255, fontStyle: 'bold' },
      alternateRowStyles: { fillColor: [249,250,251] },
      didParseCell(d) {
        if (d.section==='body' && d.column.index===0) {
          const c = { 'Low Risk':[16,185,129], 'Medium Risk':[245,158,11], 'High Risk':[239,68,68] };
          if (c[d.cell.raw]) { d.cell.styles.textColor=c[d.cell.raw]; d.cell.styles.fontStyle='bold'; }
        }
      },
      margin: { left: 14, right: 14 },
    });

    // ── PAGE 3: OCCUPANCY ────────────────────────────────────────────────
    doc.addPage();
    y = addPageHeader('Occupancy Details');
    y = secTitle('4. Occupancy by District', y);
    autoTable(doc, {
      startY: y,
      head: [['District', 'Shelters', 'Capacity', 'Occupied', 'Available', 'Fill %', 'Load']],
      body: districtData.map(d => {
        const pct = d.capacity>0?Math.round((d.value/d.capacity)*100):0;
        const status = pct>=90?'Critical':pct>=70?'High':pct>=40?'Moderate':'Low';
        return [d.label, d.count, d.capacity, d.value, d.capacity-d.value, `${pct}%`, status];
      }),
      styles: { fontSize: 8, cellPadding: 2.5 },
      headStyles: { fillColor: [11,60,93], textColor: 255, fontStyle: 'bold' },
      alternateRowStyles: { fillColor: [249,250,251] },
      didParseCell(d) {
        if (d.section==='body' && d.column.index===5) {
          const pct=parseInt(d.cell.raw);
          if (pct>=90) d.cell.styles.textColor=[239,68,68];
          else if (pct>=70) d.cell.styles.textColor=[245,158,11];
          d.cell.styles.fontStyle='bold';
        }
        if (d.section==='body' && d.column.index===6) {
          const c={Critical:[239,68,68],High:[245,158,11],Moderate:[59,130,246],Low:[16,185,129]};
          if (c[d.cell.raw]) d.cell.styles.textColor=c[d.cell.raw];
        }
      },
      margin: { left: 14, right: 14 },
    });
    y = doc.lastAutoTable.finalY + 8;
    if (nearCapacity.length > 0) {
      y = secTitle('5. Shelters at Critical Capacity (≥90%)', y);
      autoTable(doc, {
        startY: y,
        head: [['Shelter Name', 'ID', 'District', 'Occupied', 'Capacity', 'Fill %', 'Action']],
        body: nearCapacity.map(s => {
          const occ = occupancies[s.shelterId]?.currentOccupancy ?? s.capacityCurrent ?? 0;
          const pct = s.capacityTotal>0?Math.round((occ/s.capacityTotal)*100):0;
          return [s.name, s.shelterId, s.district, occ, s.capacityTotal, `${pct}%`, pct>=100?'FULL — Redirect':'Near Full — Monitor'];
        }),
        styles: { fontSize: 8, cellPadding: 2.5 },
        headStyles: { fillColor: [239,68,68], textColor: 255, fontStyle: 'bold' },
        alternateRowStyles: { fillColor: [255,245,245] },
        didParseCell(d) {
          if (d.section==='body' && d.column.index===6) {
            d.cell.styles.textColor=d.cell.raw.startsWith('FULL')?[239,68,68]:[245,158,11];
            d.cell.styles.fontStyle='bold';
          }
        },
        margin: { left: 14, right: 14 },
      });
    }

    // ── PAGE 4: RELIEF ITEMS & DONATIONS ─────────────────────────────────
    doc.addPage();
    y = addPageHeader('Relief Items & Donations');
    y = secTitle('6. Relief Items Summary', y);
    const ikw = (pageW - 32) / 4;
    [
      { label: 'Total Item Types', value: totalItems,       color: [6,182,212] },
      { label: 'Urgent Items',     value: urgentItems.length, color: [239,68,68] },
      { label: 'Categories',       value: catData.length,   color: [139,92,246] },
      { label: 'Donors / Sources', value: [...new Set(allItems.map(i=>i.providedBy).filter(p=>p&&p!=='unknown'))].length, color: [16,185,129] },
    ].forEach((k, i) => kpiBox(14 + i*(ikw+2), y, ikw, 22, k.label, k.value, '', k.color));
    y += 28;
    autoTable(doc, {
      startY: y,
      head: [['Category', 'Item Count', '% of Total', 'Urgent Count']],
      body: catData.map(c => {
        const urgCount = allItems.filter(i=>(i.category||'other')===c.key&&i.priorityLevel==='urgent').length;
        return [c.label, c.value, `${totalItems>0?Math.round((c.value/totalItems)*100):0}%`, urgCount||'—'];
      }),
      styles: { fontSize: 9, cellPadding: 3 },
      headStyles: { fillColor: [11,60,93], textColor: 255, fontStyle: 'bold' },
      alternateRowStyles: { fillColor: [249,250,251] },
      margin: { left: 14, right: 14 },
    });
    y = doc.lastAutoTable.finalY + 8;
    y = secTitle('7. Donations & Supply Sources', y);
    const donorMap = {};
    allItems.forEach(item => {
      const donor = item.providedBy && item.providedBy !== 'unknown' ? item.providedBy : 'Unknown / Unspecified';
      if (!donorMap[donor]) donorMap[donor] = { items: 0, shelters: new Set() };
      donorMap[donor].items += 1;
      donorMap[donor].shelters.add(item.shelterName);
    });
    autoTable(doc, {
      startY: y,
      head: [['Donor / Source', 'Items Supplied', 'Shelters Supplied']],
      body: Object.entries(donorMap).sort((a,b)=>b[1].items-a[1].items).map(([donor,v])=>[donor, v.items, [...v.shelters].join(', ')]),
      styles: { fontSize: 8, cellPadding: 2.5 },
      headStyles: { fillColor: [16,185,129], textColor: 255, fontStyle: 'bold' },
      alternateRowStyles: { fillColor: [240,253,244] },
      columnStyles: { 2: { cellWidth: 80, overflow: 'linebreak' } },
      margin: { left: 14, right: 14 },
    });
    y = doc.lastAutoTable.finalY + 8;
    if (urgentItems.length > 0) {
      if (y > 220) { doc.addPage(); y = addPageHeader('Relief Items & Donations'); }
      y = secTitle('8. Urgent Items Requiring Immediate Attention', y);
      autoTable(doc, {
        startY: y,
        head: [['Item Name', 'Category', 'Qty', 'Unit', 'Shelter', 'Expiry', 'Donor']],
        body: urgentItems.map(i=>[i.name, i.category||'other', i.quantity, i.unit, i.shelterName, i.expiryDate?new Date(i.expiryDate).toLocaleDateString():'—', i.providedBy||'—']),
        styles: { fontSize: 8, cellPadding: 2.5 },
        headStyles: { fillColor: [239,68,68], textColor: 255, fontStyle: 'bold' },
        alternateRowStyles: { fillColor: [255,245,245] },
        margin: { left: 14, right: 14 },
      });
    }

    // ── PAGE 5: FULL SHELTER REGISTER ────────────────────────────────────
    doc.addPage();
    y = addPageHeader('Full Shelter Register');
    y = secTitle('9. Complete Shelter Register', y);
    autoTable(doc, {
      startY: y,
      head: [['#', 'Shelter Name', 'District', 'Status', 'Risk', 'Capacity', 'Occupied', 'Fill %', 'Type', 'Items']],
      body: shelterTable.map((s,i)=>[i+1, s.name, s.district, s.status.charAt(0).toUpperCase()+s.status.slice(1), s.riskLevel, s.capacityTotal, s.currentOccupancy, `${s.pct}%`, s.type||'—', (s.reliefItems||[]).length]),
      styles: { fontSize: 7.5, cellPadding: 2 },
      headStyles: { fillColor: [11,60,93], textColor: 255, fontStyle: 'bold', fontSize: 7.5 },
      alternateRowStyles: { fillColor: [249,250,251] },
      didParseCell(d) {
        if (d.section==='body' && d.column.index===7) {
          const pct=parseInt(d.cell.raw);
          if (pct>=90){d.cell.styles.textColor=[239,68,68];d.cell.styles.fontStyle='bold';}
          else if (pct>=70) d.cell.styles.textColor=[245,158,11];
        }
        if (d.section==='body' && d.column.index===3) {
          const c={Open:[16,185,129],Standby:[245,158,11],Planned:[59,130,246],Closed:[239,68,68]};
          if (c[d.cell.raw]) d.cell.styles.textColor=c[d.cell.raw];
        }
      },
      margin: { left: 10, right: 10 },
    });

    // ── Footer on every page ─────────────────────────────────────────────
    const pageCount = doc.internal.getNumberOfPages();
    for (let i = 1; i <= pageCount; i++) {
      doc.setPage(i);
      doc.setFillColor(11, 60, 93); doc.rect(0, pageH-8, pageW, 8, 'F');
      doc.setFontSize(7); doc.setFont('helvetica','normal'); doc.setTextColor(180,210,240);
      doc.text(`Climora Shelter Management Report  ·  ${nowStr}`, 14, pageH-3);
      doc.text(`Page ${i} of ${pageCount}`, pageW-14, pageH-3, { align: 'right' });
    }

    doc.save(`shelter-report-${now.toISOString().slice(0,10)}.pdf`);
  };

  // ── Derived stats ──────────────────────────────────────────────────────
  const total = shelters.length;
  const byStatus = ['open', 'standby', 'planned', 'closed'].map(s => ({
    key: s, label: s.charAt(0).toUpperCase() + s.slice(1),
    value: shelters.filter(sh => sh.status === s).length,
  }));
  const byRisk = ['low', 'medium', 'high'].map(r => ({
    key: r, label: r.charAt(0).toUpperCase() + r.slice(1) + ' Risk',
    value: shelters.filter(sh => sh.riskLevel === r).length,
  }));

  const totalCapacity = shelters.reduce((a, s) => a + (s.capacityTotal || 0), 0);
  const totalOccupied = shelters.reduce((a, s) => {
    const occ = occupancies[s.shelterId];
    return a + (occ?.currentOccupancy ?? s.capacityCurrent ?? 0);
  }, 0);
  const overallPct = totalCapacity > 0 ? Math.round((totalOccupied / totalCapacity) * 100) : 0;

  const nearCapacity = shelters.filter(s => {
    const occ = occupancies[s.shelterId]?.currentOccupancy ?? s.capacityCurrent ?? 0;
    return s.capacityTotal > 0 && occ / s.capacityTotal >= 0.9;
  });

  // District occupancy
  const districtMap = {};
  shelters.forEach(s => {
    if (!districtMap[s.district]) districtMap[s.district] = { capacity: 0, occupied: 0, count: 0 };
    const occ = occupancies[s.shelterId]?.currentOccupancy ?? s.capacityCurrent ?? 0;
    districtMap[s.district].capacity += s.capacityTotal || 0;
    districtMap[s.district].occupied += occ;
    districtMap[s.district].count += 1;
  });
  const districtData = Object.entries(districtMap)
    .map(([d, v]) => ({ label: d, value: v.occupied, capacity: v.capacity, count: v.count }))
    .sort((a, b) => b.value - a.value)
    .slice(0, 8);

  // Relief items
  const allItems = shelters.flatMap(s => (s.reliefItems || []).map(i => ({ ...i, shelterName: s.name })));
  const totalItems = allItems.length;
  const urgentItems = allItems.filter(i => i.priorityLevel === 'urgent');
  const catMap = {};
  allItems.forEach(i => { catMap[i.category || 'other'] = (catMap[i.category || 'other'] || 0) + 1; });
  const catData = Object.entries(catMap).map(([k, v]) => ({ key: k, label: k.charAt(0).toUpperCase() + k.slice(1), value: v })).sort((a, b) => b.value - a.value);

  // Per-shelter occupancy table (top 10 by occupancy %)
  const shelterTable = shelters.map(s => {
    const occ = occupancies[s.shelterId]?.currentOccupancy ?? s.capacityCurrent ?? 0;
    const pct = s.capacityTotal > 0 ? Math.round((occ / s.capacityTotal) * 100) : 0;
    return { ...s, currentOccupancy: occ, pct };
  }).sort((a, b) => b.pct - a.pct);

  if (loading) return (
    <div className="flex min-h-screen bg-white">
      <ShelterSidebar />
      <div className="flex-1 ml-64 flex items-center justify-center">
        <div className="w-8 h-8 rounded-full border-2 border-gray-200 border-t-[#06b6d4] animate-spin" />
      </div>
    </div>
  );

  return (
    <div className="flex min-h-screen bg-white">
      <ShelterSidebar />
      <div className="flex-1 ml-64 flex flex-col min-h-screen">
        <Topbar />
        <main className="flex-1 p-6 space-y-6 bg-white">

          {/* Header */}
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-gray-800">Shelter Reports</h1>
              <p className="text-sm text-gray-500 mt-1">Comprehensive overview across all shelters.</p>
            </div>
            <div className="flex gap-2">
              <button onClick={fetchData} className="flex items-center gap-2 px-4 py-2.5 rounded-xl border border-gray-200 text-sm font-semibold text-gray-600 hover:bg-gray-50 transition">
                <RefreshCw size={15} /> Refresh
              </button>
              <button onClick={handleExport} className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-gradient-to-r from-[#06b6d4] to-[#3b82f6] text-white text-sm font-semibold hover:opacity-90 transition shadow-sm">
                <Download size={15} /> Export PDF
              </button>
            </div>
          </div>

          {/* ── KPI row ── */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            {[
              { label: 'Total Shelters', value: total, icon: Home, color: 'text-[#06b6d4]', bg: 'bg-cyan-50' },
              { label: 'Open Now', value: byStatus.find(s => s.key === 'open')?.value || 0, icon: CheckCircle, color: 'text-emerald-600', bg: 'bg-emerald-50' },
              { label: 'Near Capacity', value: nearCapacity.length, icon: AlertTriangle, color: 'text-red-500', bg: 'bg-red-50' },
              { label: 'Total Items', value: totalItems, icon: Package, color: 'text-purple-600', bg: 'bg-purple-50' },
            ].map(({ label, value, icon: Icon, color, bg }) => (
              <motion.div key={label} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}
                className="bg-[#F9FAFB] rounded-2xl border border-gray-100 shadow-sm p-5 flex items-center gap-4">
                <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${bg}`}>
                  <Icon size={22} className={color} />
                </div>
                <div>
                  <p className="text-xs text-gray-500 font-medium">{label}</p>
                  <p className="text-2xl font-bold text-gray-800">{value}</p>
                </div>
              </motion.div>
            ))}
          </div>

          {/* ── Occupancy overview + status breakdown ── */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* Overall occupancy ring */}
            <SectionCard title="Overall Occupancy">
              <div className="flex flex-col items-center gap-2">
                <div className="relative">
                  <StatRing pct={overallPct} color={overallPct >= 90 ? '#ef4444' : overallPct >= 70 ? '#f59e0b' : '#06b6d4'} size={120} />
                  <div className="absolute inset-0 flex flex-col items-center justify-center">
                    <span className="text-2xl font-bold text-gray-800">{overallPct}%</span>
                    <span className="text-xs text-gray-400">used</span>
                  </div>
                </div>
                <div className="text-center mt-1">
                  <p className="text-sm font-semibold text-gray-700">{totalOccupied.toLocaleString()} / {totalCapacity.toLocaleString()}</p>
                  <p className="text-xs text-gray-400">people across all shelters</p>
                </div>
              </div>
            </SectionCard>

            {/* Status breakdown */}
            <SectionCard title="Shelter Status Breakdown">
              <BarChart data={byStatus} colorKey={Object.fromEntries(Object.entries(STATUS_COLOR).map(([k, v]) => [k, v.bg]))} />
              <div className="flex flex-wrap gap-2 mt-4">
                {byStatus.map(s => (
                  <span key={s.key} className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold border ${STATUS_COLOR[s.key]?.light || 'bg-gray-50 text-gray-600 border-gray-200'}`}>
                    {s.label}: {s.value}
                  </span>
                ))}
              </div>
            </SectionCard>

            {/* Risk breakdown */}
            <SectionCard title="Risk Level Distribution">
              <BarChart data={byRisk} colorKey={RISK_COLOR} />
              <div className="mt-4 space-y-1">
                {byRisk.map(r => (
                  <div key={r.key} className="flex justify-between text-xs text-gray-500">
                    <span>{r.label}</span>
                    <span className="font-semibold text-gray-700">{total > 0 ? Math.round((r.value / total) * 100) : 0}%</span>
                  </div>
                ))}
              </div>
            </SectionCard>
          </div>

          {/* ── District occupancy + Relief items ── */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <SectionCard title="Occupancy by District">
              <div className="space-y-3">
                {districtData.map((d, i) => {
                  const pct = d.capacity > 0 ? Math.round((d.value / d.capacity) * 100) : 0;
                  const color = pct >= 90 ? 'bg-red-500' : pct >= 70 ? 'bg-amber-400' : 'bg-[#06b6d4]';
                  return (
                    <div key={i}>
                      <div className="flex justify-between text-xs text-gray-500 mb-1">
                        <span className="font-medium text-gray-700">{d.label} <span className="font-normal text-gray-400">({d.count} shelter{d.count !== 1 ? 's' : ''})</span></span>
                        <span>{d.value} / {d.capacity} — {pct}%</span>
                      </div>
                      <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                        <motion.div initial={{ width: 0 }} animate={{ width: `${pct}%` }} transition={{ duration: 0.7, delay: i * 0.05 }}
                          className={`h-full rounded-full ${color}`} />
                      </div>
                    </div>
                  );
                })}
              </div>
            </SectionCard>

            <SectionCard title="Relief Items by Category">
              <BarChart data={catData} colorKey={CAT_COLOR} />
              <div className="mt-4 grid grid-cols-2 gap-2">
                <div className="bg-white rounded-xl border border-gray-100 p-3 text-center">
                  <p className="text-lg font-bold text-gray-800">{totalItems}</p>
                  <p className="text-xs text-gray-400">Total item types</p>
                </div>
                <div className="bg-white rounded-xl border border-red-100 p-3 text-center">
                  <p className={`text-lg font-bold ${urgentItems.length > 0 ? 'text-red-500' : 'text-gray-800'}`}>{urgentItems.length}</p>
                  <p className="text-xs text-gray-400">Urgent items</p>
                </div>
              </div>
            </SectionCard>
          </div>

          {/* ── Near capacity alert ── */}
          {nearCapacity.length > 0 && (
            <SectionCard title="Shelters Near or At Capacity (≥90%)">
              <div className="space-y-2">
                {nearCapacity.map(s => {
                  const occ = occupancies[s.shelterId]?.currentOccupancy ?? s.capacityCurrent ?? 0;
                  const pct = s.capacityTotal > 0 ? Math.round((occ / s.capacityTotal) * 100) : 0;
                  return (
                    <div key={s.shelterId} className="flex items-center justify-between bg-red-50 border border-red-100 rounded-xl px-4 py-2.5">
                      <div>
                        <p className="text-sm font-semibold text-gray-800">{s.name}</p>
                        <p className="text-xs text-gray-400">{s.district} · {s.shelterId}</p>
                      </div>
                      <div className="text-right">
                        <p className="text-sm font-bold text-red-500">{pct}%</p>
                        <p className="text-xs text-gray-400">{occ} / {s.capacityTotal}</p>
                      </div>
                    </div>
                  );
                })}
              </div>
            </SectionCard>
          )}

          {/* ── Per-shelter table ── */}
          <SectionCard title="Per-Shelter Occupancy Summary">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-gray-200">
                    {['Shelter', 'District', 'Status', 'Risk', 'Occupied', 'Capacity', 'Fill %', 'Items'].map(h => (
                      <th key={h} className="px-3 py-2 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {shelterTable.map((s, i) => {
                    const barColor = s.pct >= 90 ? 'bg-red-500' : s.pct >= 70 ? 'bg-amber-400' : 'bg-[#06b6d4]';
                    const sc = STATUS_COLOR[s.status];
                    return (
                      <tr key={s.shelterId} className={`border-b border-gray-50 ${i % 2 === 0 ? '' : 'bg-[#F9FAFB]'}`}>
                        <td className="px-3 py-2.5">
                          <p className="font-semibold text-gray-800">{s.name}</p>
                          <p className="text-xs text-gray-400">{s.shelterId}</p>
                        </td>
                        <td className="px-3 py-2.5 text-gray-500">{s.district}</td>
                        <td className="px-3 py-2.5">
                          <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold border ${sc?.light || 'bg-gray-50 text-gray-600 border-gray-200'}`}>
                            {s.status}
                          </span>
                        </td>
                        <td className="px-3 py-2.5">
                          <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold border ${
                            s.riskLevel === 'high' ? 'bg-red-50 text-red-600 border-red-200' :
                            s.riskLevel === 'medium' ? 'bg-amber-50 text-amber-600 border-amber-200' :
                            'bg-emerald-50 text-emerald-600 border-emerald-200'
                          }`}>{s.riskLevel}</span>
                        </td>
                        <td className="px-3 py-2.5 font-semibold text-gray-700">{s.currentOccupancy}</td>
                        <td className="px-3 py-2.5 text-gray-500">{s.capacityTotal}</td>
                        <td className="px-3 py-2.5 min-w-[100px]">
                          <div className="flex items-center gap-2">
                            <div className="flex-1 h-1.5 bg-gray-200 rounded-full overflow-hidden">
                              <div className={`h-full rounded-full ${barColor}`} style={{ width: `${s.pct}%` }} />
                            </div>
                            <span className={`text-xs font-semibold ${s.pct >= 90 ? 'text-red-500' : 'text-gray-600'}`}>{s.pct}%</span>
                          </div>
                        </td>
                        <td className="px-3 py-2.5 text-gray-500">{(s.reliefItems || []).length}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </SectionCard>

          {/* ── Urgent items list ── */}
          {urgentItems.length > 0 && (
            <SectionCard title="Urgent Relief Items Requiring Attention">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {urgentItems.map((item, i) => (
                  <div key={i} className="flex items-center justify-between bg-white border border-red-100 rounded-xl px-4 py-2.5">
                    <div>
                      <p className="text-sm font-semibold text-gray-800">{item.name}</p>
                      <p className="text-xs text-gray-400">{item.shelterName}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-bold text-gray-700">{item.quantity} <span className="font-normal text-gray-400 text-xs">{item.unit}</span></p>
                      <span className="text-xs font-semibold text-red-500 bg-red-50 border border-red-200 px-1.5 py-0.5 rounded-full">urgent</span>
                    </div>
                  </div>
                ))}
              </div>
            </SectionCard>
          )}

          <p className="text-xs text-gray-300 text-center pb-4">Report generated on {new Date().toLocaleString()} · Climora Shelter Management</p>
        </main>
      </div>
    </div>
  );
}

