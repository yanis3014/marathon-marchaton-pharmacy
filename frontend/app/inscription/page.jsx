"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";

const API_BASE = process.env.NEXT_PUBLIC_API_BASE || "http://localhost:3001";

export default function Inscription() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState([]);

  async function onSubmit(e) {
    e.preventDefault();
    setLoading(true);
    setErrors([]);

    const form = new FormData(e.currentTarget);
    const payload = Object.fromEntries(form.entries());

    const res = await fetch(`${API_BASE}/api/register`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    const data = await res.json();
    setLoading(false);
    if (data.ok) {
      router.push("/merci");
    } else {
      setErrors(data.errors || ["Une erreur est survenue."]);
    }
  }

  return (
    <main className="section">
      <div className="grid md:grid-cols-3 gap-8">
        <div className="md:col-span-2 card">
          <form onSubmit={onSubmit} className="card-inner grid gap-5">
            <h1 className="h2">Inscription</h1>
            <p className="muted">
              Remplissez vos informations ci-dessous. Un e-mail de confirmation
              avec QR vous sera envoyé.
            </p>

            {errors.length > 0 && (
              <div className="rounded-xl border border-red-200 bg-red-50 p-3 text-red-800">
                {errors.map((e, i) => (
                  <div key={i}>• {e}</div>
                ))}
              </div>
            )}

            <div className="grid md:grid-cols-2 gap-4">
              <div>
                <label className="label">Nom et prénom</label>
                <input className="input" name="fullName" required />
              </div>
              <div>
                <label className="label">Date de naissance</label>
                <input className="input" type="date" name="dob" required />
              </div>
            </div>
            <div className="grid md:grid-cols-3 gap-4">
              <div>
                <label className="label">Sexe</label>
                <select className="input" name="sex" required>
                  <option>Homme</option>
                  <option>Femme</option>
                </select>
              </div>
              <div>
                <label className="label">Téléphone</label>
                <input
                  className="input"
                  name="phone"
                  required
                  placeholder="+216 ..."
                />
              </div>
              <div>
                <label className="label">Email</label>
                <input className="input" type="email" name="email" required />
              </div>
            </div>

            <div>
              <label className="label">Lien avec la FPHM</label>
              <select className="input" name="affiliation" required>
                <option>Étudiant(e)</option>
                <option>Enseignant(e)</option>
                <option>Pharmacien(ne)</option>
                <option>Personnel</option>
                <option>Technicien(ne)</option>
                <option>Ancien(ne) diplômé(e)</option>
                <option>Famille / accompagnant</option>
              </select>
            </div>

            <div>
              <label className="label">Choix de l’épreuve</label>
              <div className="grid md:grid-cols-2 gap-2">
                <label className="rounded-2xl border p-4 bg-white/80 flex items-center gap-3 cursor-pointer">
                  <input
                    type="radio"
                    name="eventChoice"
                    value="Pharmathon (8 km)"
                    required
                  />
                  <span>Pharmathon (8 km)</span>
                </label>
                <label className="rounded-2xl border p-4 bg-white/80 flex items-center gap-3 cursor-pointer">
                  <input
                    type="radio"
                    name="eventChoice"
                    value="marchathon (4 km)"
                    required
                  />
                  <span>marchathon (4 km)</span>
                </label>
              </div>
            </div>

            <button className="btn btn-primary" disabled={loading}>
              {loading ? "Envoi..." : "Envoyer l'inscription"}
            </button>
          </form>
        </div>

        <aside className="space-y-4">
          <div className="card">
            <div className="card-inner">
              <h3 className="font-semibold">Pourquoi participer ?</h3>
              <ul className="mt-2 list-disc list-inside muted">
                <li>Ambiance conviviale</li>
                <li>Événement solidaire</li>
                <li>Découverte de Monastir autrement</li>
              </ul>
            </div>
          </div>
          <div className="card overflow-hidden">
            <img
              src="/images/equipe.jpg"
              alt="Course"
              className="h-40 w-full object-cover"
            />
            <div className="card-inner">
              <p className="muted">
                Pensez à votre QR reçu par email pour le pointage le jour J.
              </p>
            </div>
          </div>
        </aside>
      </div>
    </main>
  );
}
