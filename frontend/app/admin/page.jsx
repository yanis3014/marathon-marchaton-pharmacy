"use client";

import { useEffect, useState, useRef } from "react";
import { Html5QrcodeScanner } from "html5-qrcode";

const API = process.env.NEXT_PUBLIC_API_BASE || "http://localhost:3001";
const SESSION_TIMEOUT_MS = 30 * 60 * 1000; // 30 minutes

export default function Admin() {
  const [token, setToken] = useState("");
  // La variable 'entered' n'est plus nécessaire, la présence du token suffit
  const [loading, setLoading] = useState(false);
  const [msg, setMsg] = useState("");
  const [list, setList] = useState([]);
  const [search, setSearch] = useState("");
  const [code, setCode] = useState("");
  const [showScanner, setShowScanner] = useState(false);

  // --- NOUVELLE GESTION DE SESSION ---
  const timeoutIdRef = useRef(null);

  const logout = () => {
    setToken(""); // Vide le token, ce qui déconnecte l'utilisateur
    setMsg("Session expirée. Veuillez vous reconnecter.");
  };

  const resetSessionTimeout = () => {
    // Annule le minuteur précédent
    if (timeoutIdRef.current) {
      clearTimeout(timeoutIdRef.current);
    }
    // Crée un nouveau minuteur pour déconnecter après le délai
    timeoutIdRef.current = setTimeout(logout, SESSION_TIMEOUT_MS);
  };

  useEffect(() => {
    // Si l'utilisateur est connecté, on écoute son activité pour réinitialiser le minuteur
    if (token) {
      // Met en place le minuteur initial
      resetSessionTimeout();

      // Ajoute des écouteurs d'événements pour l'activité
      window.addEventListener("mousemove", resetSessionTimeout);
      window.addEventListener("mousedown", resetSessionTimeout);
      window.addEventListener("keypress", resetSessionTimeout);
    }

    // Fonction de nettoyage pour supprimer les écouteurs et le minuteur
    return () => {
      if (timeoutIdRef.current) {
        clearTimeout(timeoutIdRef.current);
      }
      window.removeEventListener("mousemove", resetSessionTimeout);
      window.removeEventListener("mousedown", resetSessionTimeout);
      window.removeEventListener("keypress", resetSessionTimeout);
    };
  }, [token]); // Ce hook dépend du token pour s'activer/désactiver

  // --- FIN DE LA GESTION DE SESSION ---

  // Gère le cycle de vie du scanner (inchangé)
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

    function onScanFailure(error) {}

    scanner.render(onScanSuccess, onScanFailure);

    return () => {
      if (scanner) {
        scanner.clear().catch(console.error);
      }
    };
  }, [showScanner]);

  // La fonction de connexion est maintenant SIMPLIFIÉE
  async function enter(e) {
    e.preventDefault();
    const form = new FormData(e.currentTarget);
    const formToken = form.get("token");
    if (!formToken) return;

    // Pour l'instant on fait confiance au token, mais on pourrait le valider ici
    setToken(formToken);
    setMsg("");
    await load(formToken);
  }

  async function load(currentToken = token) {
    // ... (le reste de la fonction load est inchangé)
    try {
      setLoading(true);
      setMsg("");
      const res = await fetch(`${API}/api/registrations`, {
        headers: { "x-admin-token": currentToken },
        cache: "no-store",
      });
      if (!res.ok) {
        if (res.status === 401)
          logout(); // Si le token est invalide, on déconnecte
        else setMsg(`Erreur chargement (${res.status})`);
        setList([]);
        return;
      }
      const data = await res.json();
      const items = Array.isArray(data) ? data : data.registrations || [];
      const normalized = items.map((r) => ({
        id: r.id,
        fullName: r.fullName,
        email: r.email,
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

  // La fonction doCheckin est inchangée
  async function doCheckin(scannedCode) {
    // ... (le code de doCheckin reste le même)
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

  // Si aucun token n'est défini dans l'état, on affiche le formulaire de connexion
  if (!token) {
    return (
      <main className="section">
        <div className="card max-w-md mx-auto">
          <form onSubmit={enter} className="card-inner grid gap-3">
            <h1 className="h2">Espace Admin</h1>
            {msg && <p className="text-sm text-red-600">{msg}</p>}
            <p className="muted text-sm">
              Entrez le <code>ADMIN_TOKEN</code> pour accéder aux inscrits.
            </p>
            <input
              name="token" // Ajout de l'attribut name
              className="input"
              placeholder="ADMIN_TOKEN"
              required
            />
            <button className="btn btn-primary">Entrer</button>
          </form>
        </div>
      </main>
    );
  }

  // Sinon, on affiche le tableau de bord admin
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
