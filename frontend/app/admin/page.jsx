"use client";

import { useEffect, useState } from "react";

const API = process.env.NEXT_PUBLIC_API_BASE || "http://localhost:3001";

/**
 * Page Admin :
 * - Demande le ADMIN_TOKEN
 * - Liste les inscriptions via GET /api/registrations (header x-admin-token)
 * - Valide les présences via POST /api/admin/checkin (body { code }, header x-admin-token)
 */
export default function Admin() {
  const [token, setToken] = useState("");
  const [entered, setEntered] = useState(false);
  const [loading, setLoading] = useState(false);
  const [msg, setMsg] = useState("");
  const [list, setList] = useState([]);
  const [search, setSearch] = useState("");
  const [code, setCode] = useState("");

  // Récupère le token mémorisé pour éviter de le retaper à chaque refresh
  useEffect(() => {
    const saved = localStorage.getItem("adminToken");
    if (saved) {
      setToken(saved);
      setEntered(true);
      load(saved);
    }
  }, []);

  async function enter(e) {
    e.preventDefault();
    if (!token) return;
    localStorage.setItem("adminToken", token);
    setEntered(true);
    await load(token);
  }

  async function load(currentToken = token) {
    try {
      setLoading(true);
      setMsg("");
      const res = await fetch(`${API}/api/registrations`, {
        headers: { "x-admin-token": currentToken },
        cache: "no-store",
      });
      if (!res.ok) {
        setMsg(`Erreur chargement (${res.status})`);
        setList([]);
        return;
      }
      const data = await res.json();
      // Le backend peut renvoyer { ok:true, registrations: [...] } ou directement un tableau
      const items = Array.isArray(data) ? data : data.registrations || [];
      // Normalise pour l’affichage
      const normalized = items.map((r) => ({
        id: r.id, // <--- Numéro d'inscription
        fullName: r.fullName,
        email: r.email,
        phone: r.phone, // <--- Ajout
        dob: r.dob, // <--- Ajout
        sex: r.sex, // <--- Ajout
        affiliation: r.affiliation, // <--- Ajout
        eventChoice: r.eventChoice,
        checkinAt: r.checkinAt,
        confirmed: r.confirmed, // <--- Ajout
      }));
      setList(normalized);
    } catch (e) {
      setMsg("Erreur réseau");
    } finally {
      setLoading(false);
    }
  }

  async function doCheckin() {
    if (!code) return;
    try {
      setMsg("");
      const res = await fetch(`${API}/api/admin/checkin`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-admin-token": token,
        },
        body: JSON.stringify({ code: code.trim() }),
      });
      const data = await res.json();
      if (res.ok && data.ok !== false) {
        setMsg(`✅ Présence validée${data.name ? ` : ${data.name}` : ""}`);
        setCode("");
        await load();
      } else {
        setMsg(`❌ ${data.error || "QR/code invalide"}`);
      }
    } catch (e) {
      setMsg("Erreur réseau");
    }
  }

  if (!entered) {
    return (
      <main className="section">
        <div className="card max-w-md mx-auto">
          <form onSubmit={enter} className="card-inner grid gap-3">
            <h1 className="h2">Espace Admin</h1>
            <p className="muted text-sm">
              Entrez le <code>ADMIN_TOKEN</code> pour accéder aux inscrits.
            </p>
            <input
              className="input"
              placeholder="ADMIN_TOKEN"
              value={token}
              onChange={(e) => setToken(e.target.value)}
              required
            />
            <button className="btn btn-primary">Entrer</button>
          </form>
        </div>
      </main>
    );
  }

  const filtered = list.filter((p) =>
    (p.fullName || "").toLowerCase().includes(search.toLowerCase())
  );

  return (
    <main className="section space-y-6">
      <div className="flex flex-col md:flex-row justify-between gap-4">
        <h1 className="h2">Espace Admin</h1>
        <div className="flex gap-2 items-center">
          <input
            className="input w-64"
            placeholder="Rechercher un nom…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
          <button className="btn btn-ghost" onClick={() => load()}>
            {loading ? "Chargement…" : "Rafraîchir"}
          </button>
        </div>
      </div>

      {msg && (
        <div className="rounded-xl border border-lime-300 bg-lime-100 text-lime-800 p-3">
          {msg}
        </div>
      )}

      {/* Bloc check-in manuel (tu peux aussi scanner un QR et coller son code ici) */}
      <div className="card">
        <div className="card-inner flex flex-col md:flex-row gap-3 items-start md:items-end">
          <div className="grow">
            <label className="label">
              Valider une présence (code / QR décodé)
            </label>
            <input
              className="input"
              placeholder="Coller le code du QR ici…"
              value={code}
              onChange={(e) => setCode(e.target.value)}
            />
          </div>
          <button className="btn btn-primary" onClick={doCheckin}>
            Valider
          </button>
        </div>
      </div>

      <div className="card overflow-x-auto">
        <table className="table">
          <thead>
            <tr>
              <th># Dossard</th> {/* <--- Modifié */}
              <th>Nom</th>
              <th>Épreuve</th>
              <th>Téléphone</th> {/* <--- Ajout */}
              <th>Affiliation</th> {/* <--- Ajout */}
              <th>Présence</th>
              <th>Confirmé</th> {/* <--- Ajout */}
            </tr>
          </thead>
          <tbody>
            {filtered.length === 0 ? (
              <tr>
                <td colSpan="7" className="text-center text-gray-500 py-4">
                  {" "}
                  {/* <--- colSpan à 7 */}
                  Aucun inscrit
                </td>
              </tr>
            ) : (
              filtered.map((p) => (
                <tr key={p.id} className="hover:bg-lime-50">
                  <td className="font-mono">{p.id}</td>{" "}
                  {/* <--- Numéro de dossard */}
                  <td>{p.fullName}</td>
                  <td>{p.eventChoice}</td>
                  <td>{p.phone}</td> {/* <--- Ajout */}
                  <td>{p.affiliation}</td> {/* <--- Ajout */}
                  <td>
                    {p.checkinAt ? (
                      <span className="text-lime-600 font-semibold">
                        ✔ Présent
                      </span>
                    ) : (
                      <span className="text-gray-400">Absent</span>
                    )}
                  </td>
                  <td>
                    {" "}
                    {/* <--- Ajout */}
                    {p.confirmed ? (
                      <span className="text-lime-600">Oui</span>
                    ) : (
                      <span className="text-red-500">Non</span>
                    )}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </main>
  );
}
