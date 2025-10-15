"use client";
import { useState } from "react";
import QrScanner from "./QrScanner";

const API_BASE = process.env.NEXT_PUBLIC_API_BASE || "http://localhost:3001";

export default function Admin() {
  const [token, setToken] = useState("");
  const [rows, setRows] = useState(null);
  const [err, setErr] = useState("");

  async function load() {
    setErr("");
    const res = await fetch(`${API_BASE}/api/registrations`, {
      headers: { "x-admin-token": token }
    });
    const data = await res.json();
    if (!data.ok) { setErr(data.error || "Erreur"); setRows(null); return; }
    setRows(data.registrations);
  }

  return (
    <main className="grid gap-4">
      <h1 className="text-2xl font-semibold">Tableau des inscriptions (admin)</h1>
      <div className="card grid gap-3">
        <div className="grid md:grid-cols-[1fr_auto] gap-3">
          <input className="input" placeholder="Admin token" value={token} onChange={e=>setToken(e.target.value)} />
          <button className="btn btn-primary" onClick={load}>Charger</button>
        </div>
        {err && <div className="text-red-700">{err}</div>}
        {rows && (
          <div className="overflow-x-auto">
            <table className="min-w-full border">
              <thead className="bg-gray-100">
                <tr>
                  {["Date","Nom","Naissance","Sexe","Téléphone","Email","Lien FPHM","Épreuve"].map(h=>(
                    <th key={h} className="px-3 py-2 border-b text-left text-sm">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {rows.map((r, i) => (
                  <tr key={i} className="odd:bg-white even:bg-gray-50">
                    <td className="px-3 py-2 border-b text-sm">{new Date(r.createdAt).toLocaleString("fr-FR")}</td>
                    <td className="px-3 py-2 border-b text-sm">{r.fullName}</td>
                    <td className="px-3 py-2 border-b text-sm">{r.dob}</td>
                    <td className="px-3 py-2 border-b text-sm">{r.sex}</td>
                    <td className="px-3 py-2 border-b text-sm">{r.phone}</td>
                    <td className="px-3 py-2 border-b text-sm">{r.email}</td>
                    <td className="px-3 py-2 border-b text-sm">{r.affiliation}</td>
                    <td className="px-3 py-2 border-b text-sm">{r.eventChoice}</td>
                  </tr>
                ))}
              </tbody>
            </table>
            <div className="mt-3">
              <a
                href={`${API_BASE}/api/export/csv`}
                target="_blank"
                className="btn btn-outline"
                onClick={(e)=>{ if(!token){ e.preventDefault(); alert("Renseignez le token, puis utilisez un outil comme curl pour l'export CSV avec l'en-tête x-admin-token."); } }}
              >
                Export CSV
              </a>
              <p className="text-xs text-gray-500 mt-2">
                Pour l'export CSV authentifié, utilisez par ex. curl: <code>curl -H "x-admin-token: VOTRE_TOKEN" {API_BASE}/api/export/csv -o inscriptions.csv</code>
              </p>
            </div>
          
            <div className="card mt-6 grid gap-3">
              <h2 className="font-semibold">Valider une présence (check-in)</h2>
              <QrScanner onCode={(text)=>{ try { const v = String(text).trim(); if (v) window.__setCheckin && window.__setCheckin(v); } catch(e){} }} />
              <Checkin token={token} />
            </div>

        </div>
        )}
      </div>
    </main>
  );
}

function Checkin({ token }) {
  const [code, setCode] = useState(""); useEffect(()=>{ window.__setCheckin = (v)=>{ setCode(v); submit(v); }; return ()=>{ delete window.__setCheckin; }; }, []);
  const [msg, setMsg] = useState("");
  async function submit(val) {
    setMsg("");
    const res = await fetch(`${API_BASE}/api/admin/checkin`, {
      method: "POST",
      headers: { "Content-Type": "application/json", "x-admin-token": token },
      body: JSON.stringify({ code: val ?? code })
    });
    const data = await res.json();
    if (data.ok) setMsg(`Présence validée pour ${data.registration.fullName}`);
    else setMsg(data.error || "Erreur");
  }
  return (
    <div className="grid md:grid-cols-[1fr_auto] gap-3">
      <input className="input" placeholder="Code QR / check-in" value={code} onChange={e=>setCode(e.target.value)} />
      <button className="btn btn-primary" onClick={submit}>Valider</button>
      {msg && <div className="text-sm text-gray-700 md:col-span-2">{msg}</div>}
    </div>
  );
}
