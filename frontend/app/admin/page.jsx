"use client";

import { useEffect, useState } from "react";
import { Html5QrcodeScanner } from "html5-qrcode";

const API = process.env.NEXT_PUBLIC_API_BASE || "http://localhost:3001";

export default function Admin() {
  const [token, setToken] = useState("");
  const [entered, setEntered] = useState(false);
  const [loading, setLoading] = useState(false);
  const [msg, setMsg] = useState("");
  const [list, setList] = useState([]);
  const [search, setSearch] = useState("");
  const [code, setCode] = useState("");
  const [showScanner, setShowScanner] = useState(false);

  // Récupère le token mémorisé pour éviter de le retaper à chaque refresh
  useEffect(() => {
    const saved = localStorage.getItem("adminToken");
    if (saved) {
      setToken(saved);
      setEntered(true);
      load(saved);
    }
  }, []);

  // Gère le cycle de vie du scanner
  useEffect(() => {
    if (!showScanner) return;

    const scanner = new Html5QrcodeScanner(
      "qr-reader",
      { fps: 10, qrbox: { width: 250, height: 250 } },
      false
    );

    async function onScanSuccess(decodedText, decodedResult) {
      setCode(decodedText);
      await scanner.clear();
      setShowScanner(false);
      await doCheckin(decodedText);
    }

    function onScanFailure(error) {
      // Pas d'action nécessaire en cas d'échec
    }

    scanner.render(onScanSuccess, onScanFailure);

    return () => {
      if (scanner) {
        scanner.clear().catch((error) => {
          console.error("Failed to clear scanner on cleanup.", error);
        });
      }
    };
  }, [showScanner]);

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
      const items = Array.isArray(data) ? data : data.registrations || [];

      // Normalise pour l’affichage avec les bonnes informations
      const normalized = items.map((r) => ({
        id: r.id,
        fullName: r.fullName,
        email: r.email, // Email ajouté
        eventChoice: r.eventChoice,
        checkinAt: r.checkinAt,
      }));
      setList(normalized);
    } catch (e) {
      setMsg("Erreur réseau");
    } finally {
      setLoading(false);
    }
  }

  async function doCheckin(scannedCode) {
    const codeToValidate = scannedCode || code;
    if (!codeToValidate) return;
    try {
      setMsg("");
      const res = await fetch(`${API}/api/admin/checkin`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-admin-token": token,
        },
        body: JSON.stringify({ code: codeToValidate.trim() }),
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

      <div className="card">
        <div className="card-inner space-y-4">
          {showScanner ? (
            <div className="space-y-3">
              <div id="qr-reader" />
              <button
                className="btn btn-ghost w-full"
                onClick={() => setShowScanner(false)}
              >
                Arrêter le scan
              </button>
            </div>
          ) : (
            <button
              className="btn btn-outline w-full"
              onClick={() => setShowScanner(true)}
            >
              📷 Scanner un QR Code
            </button>
          )}

          <div className="text-center text-sm text-gray-500">ou</div>

          <div className="flex flex-col md:flex-row gap-3 items-start md:items-end">
            <div className="grow">
              <label className="label">
                Valider manuellement (code / QR décodé)
              </label>
              <input
                className="input"
                placeholder="Coller le code du QR ici…"
                value={code}
                onChange={(e) => setCode(e.target.value)}
              />
            </div>
            <button className="btn btn-primary" onClick={() => doCheckin()}>
              Valider
            </button>
          </div>
        </div>
      </div>

      <div className="card overflow-x-auto">
        <table className="table">
          <thead>
            <tr>
              <th># Dossard</th>
              <th>Nom</th>
              <th>Email</th>
              <th>Épreuve</th>
              <th>Présence</th>
            </tr>
          </thead>
          <tbody>
            {filtered.length === 0 ? (
              <tr>
                <td colSpan="5" className="text-center text-gray-500 py-4">
                  Aucun inscrit
                </td>
              </tr>
            ) : (
              filtered.map((p) => (
                <tr key={p.id} className="hover:bg-lime-50">
                  <td className="font-mono">{p.id}</td>
                  <td>{p.fullName}</td>
                  <td>{p.email}</td>
                  <td>{p.eventChoice}</td>
                  <td>
                    {p.checkinAt ? (
                      <span className="text-lime-600 font-semibold">
                        ✔ Présent
                      </span>
                    ) : (
                      <span className="text-gray-400">Absent</span>
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
