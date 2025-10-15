"use client";

import { useEffect, useState } from "react";
import { Html5QrcodeScanner } from "html5-qrcode";

const API_BASE = process.env.NEXT_PUBLIC_API_BASE || "http://localhost:3001";

export default function Admin() {
  const [participants, setParticipants] = useState([]);
  const [search, setSearch] = useState("");
  const [scanning, setScanning] = useState(false);
  const [message, setMessage] = useState("");

  // Charger la liste des inscrits
  useEffect(() => {
    fetch(`${API_BASE}/api/participants`)
      .then((res) => res.json())
      .then((data) => setParticipants(data))
      .catch(() => setMessage("Erreur lors du chargement des participants"));
  }, []);

  // Scanner QR
  useEffect(() => {
    if (!scanning) return;
    const scanner = new Html5QrcodeScanner("qr-reader", {
      fps: 10,
      qrbox: 250,
    });
    scanner.render(onScanSuccess, onScanError);

    function onScanSuccess(decodedText) {
      setScanning(false);
      scanner.clear();
      handleCheckIn(decodedText);
    }
    function onScanError(err) {
      console.warn(err);
    }

    return () => {
      try {
        scanner.clear();
      } catch {}
    };
  }, [scanning]);

  // Validation présence via QR
  async function handleCheckIn(code) {
    try {
      const res = await fetch(`${API_BASE}/api/checkin/${code}`, {
        method: "POST",
      });
      const data = await res.json();
      if (data.ok) {
        setMessage(`✅ ${data.name || "Participant"} validé !`);
        setParticipants((prev) =>
          prev.map((p) => (p.qrCode === code ? { ...p, checkedIn: true } : p))
        );
      } else {
        setMessage("❌ QR invalide ou déjà validé.");
      }
    } catch {
      setMessage("Erreur lors du check-in.");
    }
  }

  const filtered = participants.filter((p) =>
    (p.fullName || "").toLowerCase().includes(search.toLowerCase())
  );

  return (
    <main className="section space-y-6">
      <div className="flex flex-col md:flex-row justify-between items-center gap-4">
        <h1 className="h2">Espace Admin</h1>
        <div className="flex gap-3">
          <input
            type="text"
            placeholder="Rechercher un participant..."
            className="input w-64"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
          <button
            onClick={() => setScanning(!scanning)}
            className={`btn ${scanning ? "btn-outline" : "btn-primary"}`}
          >
            {scanning ? "Arrêter" : "Scanner QR"}
          </button>
        </div>
      </div>

      {message && (
        <div className="rounded-xl bg-lime-100 text-lime-800 border border-lime-300 p-3">
          {message}
        </div>
      )}

      {scanning && (
        <div className="card">
          <div className="card-inner">
            <h3 className="font-semibold mb-2">Scanner un QR</h3>
            <div id="qr-reader" className="w-full" />
          </div>
        </div>
      )}

      <div className="card overflow-x-auto">
        <table className="table">
          <thead>
            <tr>
              <th>Nom</th>
              <th>Épreuve</th>
              <th>Email</th>
              <th>Présence</th>
            </tr>
          </thead>
          <tbody>
            {filtered.length === 0 ? (
              <tr>
                <td colSpan="4" className="text-center text-gray-500 py-4">
                  Aucun participant trouvé
                </td>
              </tr>
            ) : (
              filtered.map((p) => (
                <tr key={p.id} className="hover:bg-lime-50">
                  <td>{p.fullName}</td>
                  <td>{p.eventChoice}</td>
                  <td>{p.email}</td>
                  <td>
                    {p.checkedIn ? (
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
