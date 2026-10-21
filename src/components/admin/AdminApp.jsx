import React, { useState, useEffect } from 'react';
import { collection, doc, onSnapshot, setDoc, updateDoc, deleteDoc, getDocs, query, where } from 'firebase/firestore';
import { LogOut, Trash2, Plus, ShieldCheck, X } from 'lucide-react';
import { db } from '../../services/firebase';

const ADMINS_COL = 'admins';
const SESSION_KEY = 'krishaka_admin';

const SCHEME_CATEGORIES = ['Direct Income Support', 'Crop Insurance', 'Solar & Irrigation', 'Farm Machinery Subsidy', 'Organic Farming', 'Credit & Loans', 'Soil Health'];
const RETAILER_TYPES = ['APMC Commission Agent', 'Wholesale Trader', 'Agri Input Dealer', 'Retail Supermarket'];

// One entry per admin tab. `columns` are shown in the table; `fields` (optional) build the "Add" form.
const SECTIONS = [
  {
    key: 'users', label: 'Users', col: 'users',
    columns: [['name', 'Name'], ['role', 'Role'], ['phone', 'Phone'], ['email', 'Email'],
      [(r) => [r.farmerDetails?.village || r.buyerDetails?.village, (r.farmerDetails || r.buyerDetails)?.district].filter(Boolean).join(', '), 'Location']],
  },
  {
    key: 'crops', label: 'Crop Listings', col: 'crop_listings',
    columns: [['cropName', 'Crop'], ['variety', 'Variety'], ['farmerName', 'Farmer'], ['location', 'Location'],
      [(r) => `${r.quantityKg ?? ''} kg`, 'Quantity'], [(r) => `₹${r.pricePerQuintal ?? ''}/qtl`, 'Price'], ['status', 'Status']],
  },
  {
    key: 'waste', label: 'Agri-Waste', col: 'agri_waste_listings',
    columns: [['wasteType', 'Type'], ['farmerName', 'Farmer'], ['location', 'Location'],
      [(r) => `${r.quantityTons ?? ''} t`, 'Quantity'], [(r) => `₹${r.pricePerTon ?? ''}/t`, 'Price'], ['status', 'Status']],
  },
  {
    key: 'orders', label: 'Orders', col: 'orders',
    columns: [['cropName', 'Crop'], ['farmerName', 'Farmer'], ['buyerName', 'Buyer'], [(r) => `${r.quantityKg ?? ''} kg`, 'Quantity'],
      [(r) => `₹${r.totalAmount ?? ''}`, 'Total'], ['status', 'Status'], ['orderDate', 'Date']],
  },
  {
    key: 'schemes', label: 'Govt Schemes', col: 'govt_schemes',
    columns: [['name', 'Name'], ['code', 'Code'], ['category', 'Category'], ['benefitAmount', 'Benefit'], ['applicationStatus', 'Status']],
    fields: [
      ['name', 'Scheme name', 'text', true], ['code', 'Short code (e.g. PM-KISAN)', 'text', true],
      ['category', 'Category', SCHEME_CATEGORIES, true], ['ministry', 'Ministry / Department', 'text'],
      ['benefitAmount', 'Benefit (e.g. ₹6,000 per year)', 'text', true], ['applicationStatus', 'Status', ['Open', 'Closed', 'Coming Soon']],
      ['description', 'Description', 'textarea', true], ['eligibility', 'Eligibility', 'textarea'],
      ['howToApply', 'How to apply', 'textarea'], ['requiredDocuments', 'Required documents (comma separated)', 'list'],
      ['portalLink', 'Portal link', 'text'], ['helpline', 'Helpline', 'text'],
    ],
  },
  {
    key: 'retailers', label: 'Retailers', col: 'retailers',
    columns: [['name', 'Name'], ['firmName', 'Firm'], ['businessType', 'Type'], ['mandiLocation', 'Location'], ['phone', 'Phone'],
      [(r) => (r.verified ? 'Verified' : 'Not verified'), 'Verification']],
    fields: [
      ['name', 'Owner name', 'text', true], ['firmName', 'Firm name', 'text', true], ['businessType', 'Business type', RETAILER_TYPES, true],
      ['mandiLocation', 'Mandi / location', 'text', true], ['phone', 'Phone', 'text', true], ['speciality', 'Speciality', 'text'],
      ['operatingHours', 'Operating hours', 'text'], ['distanceKm', 'Distance (km)', 'number'], ['rating', 'Rating (1-5)', 'number'],
    ],
    toggle: ['verified', 'Verify', 'Unverify'],
  },
];

const cell = (row, col) => (typeof col === 'function' ? col(row) : row[col]) ?? '';
const inputCls = 'w-full py-2 px-3 rounded-lg border border-[#DCD6C8] text-sm bg-white focus:border-[#3F6B3A] focus:outline-hidden';

function AdminLogin({ onLogin }) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  const submit = async (e) => {
    e.preventDefault();
    setBusy(true);
    setError('');
    try {
      const snap = await getDocs(query(collection(db, ADMINS_COL), where('email', '==', email.trim().toLowerCase())));
      const admin = snap.docs[0]?.data();
      if (!admin || admin.password !== password) {
        setError('Invalid admin email or password.');
      } else {
        onLogin({ id: snap.docs[0].id, email: admin.email, name: admin.name || 'Admin' });
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#F4F1E8] p-4">
      <form onSubmit={submit} className="w-full max-w-sm bg-white rounded-2xl border border-[#DCD6C8] p-6 space-y-4 shadow-sm">
        <div className="flex items-center gap-2 text-[#3F6B3A]">
          <ShieldCheck className="w-6 h-6" />
          <h1 className="font-headline text-2xl font-bold">Krishaka Admin</h1>
        </div>
        <input className={inputCls} type="email" placeholder="Admin email" value={email} onChange={(e) => setEmail(e.target.value)} required />
        <input className={inputCls} type="password" placeholder="Password" value={password} onChange={(e) => setPassword(e.target.value)} required />
        {error && <p className="text-sm text-[#B8562D]">{error}</p>}
        <button disabled={busy} className="w-full bg-[#3F6B3A] hover:bg-[#355B31] text-white font-bold py-2.5 rounded-xl disabled:opacity-50 cursor-pointer">
          {busy ? 'Signing in...' : 'Sign in'}
        </button>
      </form>
    </div>
  );
}

function AddForm({ section, onClose }) {
  const [values, setValues] = useState({});
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');

  const submit = async (e) => {
    e.preventDefault();
    setBusy(true);
    const data = {};
    for (const [name, , type] of section.fields) {
      const v = (values[name] ?? (Array.isArray(type) ? type[0] : '')).toString().trim();
      if (type === 'number') data[name] = v === '' ? 0 : Number(v);
      else if (type === 'list') data[name] = v ? v.split(',').map((s) => s.trim()).filter(Boolean) : [];
      else data[name] = v;
    }
    const id = `${section.key}-${Date.now()}`;
    try {
      await setDoc(doc(db, section.col, id), { ...data, id, createdAt: new Date().toISOString() });
      onClose();
    } catch (err) {
      setError(err.message);
      setBusy(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center p-4 z-50">
      <form onSubmit={submit} className="w-full max-w-2xl max-h-[90vh] overflow-y-auto bg-white rounded-2xl p-6 space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="font-bold text-lg">Add to {section.label}</h2>
          <button type="button" onClick={onClose} className="cursor-pointer" aria-label="Close"><X className="w-5 h-5" /></button>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {section.fields.map(([name, label, type, required]) => (
            <label key={name} className={`text-xs font-semibold block ${type === 'textarea' ? 'sm:col-span-2' : ''}`}>
              {label}{required && <span className="text-[#B8562D]"> *</span>}
              {Array.isArray(type) ? (
                <select className={inputCls} value={values[name] ?? type[0]} onChange={(e) => setValues({ ...values, [name]: e.target.value })}>
                  {type.map((o) => <option key={o}>{o}</option>)}
                </select>
              ) : type === 'textarea' ? (
                <textarea className={inputCls} rows={3} required={required} value={values[name] ?? ''} onChange={(e) => setValues({ ...values, [name]: e.target.value })} />
              ) : (
                <input className={inputCls} type={type === 'number' ? 'number' : 'text'} step="any" required={required}
                  value={values[name] ?? ''} onChange={(e) => setValues({ ...values, [name]: e.target.value })} />
              )}
            </label>
          ))}
        </div>
        {error && <p className="text-sm text-[#B8562D]">{error}</p>}
        <button disabled={busy} className="bg-[#3F6B3A] text-white font-bold py-2 px-5 rounded-xl disabled:opacity-50 cursor-pointer">
          {busy ? 'Saving...' : 'Save'}
        </button>
      </form>
    </div>
  );
}

function AdminDashboard({ admin, onLogout }) {
  const [active, setActive] = useState(SECTIONS[0].key);
  const [data, setData] = useState({});
  const [adding, setAdding] = useState(false);
  const section = SECTIONS.find((s) => s.key === active);

  useEffect(() => {
    const unsubs = SECTIONS.map((s) =>
      onSnapshot(collection(db, s.col), (snap) => setData((d) => ({ ...d, [s.key]: snap.docs.map((x) => ({ ...x.data(), _id: x.id })) })))
    );
    return () => unsubs.forEach((u) => u());
  }, []);

  const rows = data[active] || [];

  const remove = async (row) => {
    if (!window.confirm(`Delete this ${section.label} record permanently?`)) return;
    await deleteDoc(doc(db, section.col, row._id));
  };

  return (
    <div className="min-h-screen bg-[#F4F1E8] text-[#1A1C18]">
      <header className="bg-white border-b border-[#DCD6C8] px-4 sm:px-6 py-3 flex items-center justify-between">
        <div className="flex items-center gap-2 text-[#3F6B3A]">
          <ShieldCheck className="w-5 h-5" />
          <span className="font-headline font-bold text-xl">Krishaka Admin</span>
        </div>
        <div className="flex items-center gap-3 text-sm">
          <span className="hidden sm:inline text-[#1A1C18]/70">{admin.email}</span>
          <button onClick={onLogout} className="flex items-center gap-1 font-semibold text-[#B8562D] cursor-pointer"><LogOut className="w-4 h-4" /> Logout</button>
        </div>
      </header>

      <div className="max-w-7xl mx-auto p-4 sm:p-6 space-y-4">
        <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-2">
          {SECTIONS.map((s) => (
            <button key={s.key} onClick={() => setActive(s.key)}
              className={`text-left p-3 rounded-xl border cursor-pointer ${active === s.key ? 'bg-[#3F6B3A] text-white border-[#3F6B3A]' : 'bg-white border-[#DCD6C8]'}`}>
              <div className="text-2xl font-bold">{(data[s.key] || []).length}</div>
              <div className="text-xs font-semibold">{s.label}</div>
            </button>
          ))}
        </div>

        <div className="bg-white rounded-2xl border border-[#DCD6C8] overflow-hidden">
          <div className="flex items-center justify-between p-4 border-b border-[#DCD6C8]">
            <h2 className="font-bold text-lg">{section.label}</h2>
            {section.fields && (
              <button onClick={() => setAdding(true)} className="flex items-center gap-1 bg-[#3F6B3A] text-white text-sm font-bold py-2 px-4 rounded-xl cursor-pointer">
                <Plus className="w-4 h-4" /> Add
              </button>
            )}
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-[#F4F1E8] text-left">
                <tr>
                  {section.columns.map(([, label]) => <th key={label} className="px-4 py-2 font-semibold whitespace-nowrap">{label}</th>)}
                  <th className="px-4 py-2" />
                </tr>
              </thead>
              <tbody>
                {rows.length === 0 && (
                  <tr><td colSpan={section.columns.length + 1} className="px-4 py-8 text-center text-[#1A1C18]/50">No records yet.</td></tr>
                )}
                {rows.map((row) => (
                  <tr key={row._id} className="border-t border-[#EBE7DC]">
                    {section.columns.map(([col, label]) => <td key={label} className="px-4 py-2">{String(cell(row, col))}</td>)}
                    <td className="px-4 py-2 whitespace-nowrap text-right space-x-3">
                      {section.toggle && (
                        <button onClick={() => updateDoc(doc(db, section.col, row._id), { [section.toggle[0]]: !row[section.toggle[0]] })}
                          className="text-[#3F6B3A] font-semibold cursor-pointer">
                          {row[section.toggle[0]] ? section.toggle[2] : section.toggle[1]}
                        </button>
                      )}
                      <button onClick={() => remove(row)} className="text-[#B8562D] cursor-pointer align-middle" aria-label="Delete"><Trash2 className="w-4 h-4 inline" /></button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {adding && <AddForm section={section} onClose={() => setAdding(false)} />}
    </div>
  );
}

export function AdminApp() {
  const [admin, setAdmin] = useState(() => {
    try { return JSON.parse(localStorage.getItem(SESSION_KEY)); } catch { return null; }
  });

  useEffect(() => {
    document.title = 'Krishaka Admin';
  }, []);

  const login = (a) => {
    try { localStorage.setItem(SESSION_KEY, JSON.stringify(a)); } catch {}
    setAdmin(a);
  };
  const logout = () => {
    try { localStorage.removeItem(SESSION_KEY); } catch {}
    setAdmin(null);
  };

  return admin ? <AdminDashboard admin={admin} onLogout={logout} /> : <AdminLogin onLogin={login} />;
}
