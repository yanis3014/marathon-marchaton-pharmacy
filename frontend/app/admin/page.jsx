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

  // --- NOUVEAUX ÉTATS POUR LA MODALE ---
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedParticipant, setSelectedParticipant] = useState(null);
  // ------------------------------------

  useEffect(() => {
    const saved = localStorage.getItem("adminToken");
    if (saved) {
      setToken(saved);
      setEntered(true);
      load(saved);
    }
  }, []);

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
      // MODIFIÉ : On garde toutes les données pour la modale
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

  // --- NOUVELLES FONCTIONS POUR GÉRER LA MODALE ---
  const openModal = (participant) => {
    setSelectedParticipant(participant);
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setSelectedParticipant(null);
  };
  // ---------------------------------------------

  if (!entered) {
    // ... (formulaire de login inchangé)
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
    <>
      {" "}
      {/* Fragment pour envelopper la page et la modale */}
      <main className="section space-y-6">
        {/* ... (haut de la page admin inchangé) ... */}
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
                <th>Actions</th> {/* <-- NOUVELLE COLONNE */}
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
                      {/* <-- NOUVEAU BOUTON "DÉTAILS" --> */}
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
      {/* --- NOUVEAU BLOC : LA FENÊTRE MODALE --- */}
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
      {/* ------------------------------------ */}
    </>
  );
}
