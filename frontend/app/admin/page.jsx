"use client";

import { useEffect, useState, useRef } from "react";
import { Html5QrcodeScanner } from "html5-qrcode";

const API = process.env.NEXT_PUBLIC_API_BASE || "http://localhost:3001";
const SESSION_TIMEOUT_MS = 30 * 60 * 1000; // 30 minutes

export default function Admin() {
  const [token, setToken] = useState(""); // L'unique état pour gérer la connexion
  const [loading, setLoading] = useState(false);
  const [msg, setMsg] = useState("");
  const [list, setList] = useState([]);
  const [search, setSearch] = useState("");
  const [code, setCode] = useState("");
  const [showScanner, setShowScanner] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedParticipant, setSelectedParticipant] = useState(null);

  // --- GESTION DE LA SESSION AVEC TIMEOUT ---
  const timeoutIdRef = useRef(null);

  const logout = () => {
    setToken(""); // Vide le token, ce qui déconnecte
    setMsg("Session expirée. Veuillez vous reconnecter.");
  };

  const resetSessionTimeout = () => {
    if (timeoutIdRef.current) clearTimeout(timeoutIdRef.current);
    timeoutIdRef.current = setTimeout(logout, SESSION_TIMEOUT_MS);
  };

  useEffect(() => {
    if (token) {
      resetSessionTimeout();
      window.addEventListener("mousemove", resetSessionTimeout);
      window.addEventListener("mousedown", resetSessionTimeout);
      window.addEventListener("keypress", resetSessionTimeout);
    }
    return () => {
      if (timeoutIdRef.current) clearTimeout(timeoutIdRef.current);
      window.removeEventListener("mousemove", resetSessionTimeout);
      window.removeEventListener("mousedown", resetSessionTimeout);
      window.removeEventListener("keypress", resetSessionTimeout);
    };
  }, [token]);
  // --- FIN DE LA GESTION DE SESSION ---

  useEffect(() => {
    if (!showScanner) return;
    const scanner = new Html5QrcodeScanner(
      "qr-reader",
      { fps: 10, qrbox: { width: 250, height: 250 } },
      false
    );
    async function onScanSuccess(decodedText) {
      setCode(decodedText);
      await scanner.clear();
      setShowScanner(false);
      await doCheckin(decodedText);
    }
    scanner.render(onScanSuccess, () => {});
    return () => {
      if (scanner) scanner.clear().catch(console.error);
    };
  }, [showScanner]);

  // --- CONNEXION AVEC UTILISATEUR/MOT DE PASSE ---
  async function enter(e) {
    e.preventDefault();
    const form = new FormData(e.currentTarget);
    const user = form.get("user");
    const password = form.get("password");

    try {
      setMsg("");
      const res = await fetch(`${API}/api/admin/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ user, password }),
      });
      const data = await res.json();
      if (res.ok && data.token) {
        setToken(data.token); // Stocke le token reçu dans l'état
        await load(data.token);
      } else {
        setMsg(data.error || "Échec de la connexion.");
      }
    } catch (err) {
      setMsg("Erreur réseau lors de la connexion.");
    }
  }
  // ---------------------------------------------

  async function load(currentToken = token) {
    try {
      setLoading(true);
      setMsg("");
      const res = await fetch(`${API}/api/registrations`, {
        headers: { "x-admin-token": currentToken },
        cache: "no-store",
      });
      if (!res.ok) {
        if (res.status === 401) logout();
        else setMsg(`Erreur chargement (${res.status})`);
        setList([]);
        return;
      }
      const data = await res.json();
      setList(Array.isArray(data) ? data : data.registrations || []);
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
        headers: { "Content-Type": "application/json", "x-admin-token": token },
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

  const openModal = (participant) => {
    setSelectedParticipant(participant);
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setSelectedParticipant(null);
  };

  // Si aucun token n'est dans l'état, on affiche le formulaire de connexion
  if (!token) {
    return (
      <main className="section">
        <div className="card max-w-md mx-auto">
          <form onSubmit={enter} className="card-inner grid gap-3">
            <h1 className="h2">Espace Admin</h1>
            {msg && <p className="text-sm text-red-600">{msg}</p>}
            <p className="muted text-sm">
              Entrez vos identifiants pour accéder aux inscrits.
            </p>
            <input
              name="user"
              className="input"
              placeholder="Nom d'utilisateur"
              required
            />
            <input
              name="password"
              type="password"
              className="input"
              placeholder="Mot de passe"
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
    <>
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
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan="6" className="text-center text-gray-500 py-4">
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
                    <td>
                      <button
                        className="btn btn-ghost text-xs py-1 px-2"
                        onClick={() => openModal(p)}
                      >
                        Détails
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </main>

      {isModalOpen && selectedParticipant && (
        <div className="modal-overlay" onClick={closeModal}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <h2 className="h2 mb-4">Détails de l'inscription</h2>
            <div className="space-y-2 text-gray-700">
              <p>
                <strong>Nom :</strong> {selectedParticipant.fullName}
              </p>
              <p>
                <strong>Dossard # :</strong> {selectedParticipant.id}
              </p>
              <hr className="my-2" />
              <p>
                <strong>Téléphone :</strong> {selectedParticipant.phone}
              </p>
              <p>
                <strong>Email :</strong> {selectedParticipant.email}
              </p>
              <hr className="my-2" />
              <p>
                <strong>Date de naissance :</strong> {selectedParticipant.dob}
              </p>
              <p>
                <strong>Sexe :</strong> {selectedParticipant.sex}
              </p>
              <p>
                <strong>Statut :</strong> {selectedParticipant.affiliation}
              </p>
            </div>
            <button
              className="btn btn-primary mt-6 w-full"
              onClick={closeModal}
            >
              Fermer
            </button>
          </div>
        </div>
      )}
    </>
  );
}
