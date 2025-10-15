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
    <main className="grid gap-6">
      <h1 className="text-2xl font-semibold">Inscription</h1>
      <form onSubmit={onSubmit} className="card grid gap-5">
        {errors.length > 0 && (
          <div className="rounded-xl border border-red-200 bg-red-50 p-3 text-red-800">
            {errors.map((e, i) => <div key={i}>• {e}</div>)}
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
            <input className="input" name="phone" required placeholder="+216 ..." />
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
            <option>Ancien(ne) diplômé(e)</option>
            <option>Famille / accompagnant</option>
          </select>
        </div>

        <div>
          <label className="label">Choix de l’épreuve</label>
          <div className="grid md:grid-cols-2 gap-2">
            <label className="card cursor-pointer flex items-center gap-3">
              <input type="radio" name="eventChoice" value="Pharmathon (8 km)" required />
              <span>Pharmathon (8 km)</span>
            </label>
            <label className="card cursor-pointer flex items-center gap-3">
              <input type="radio" name="eventChoice" value="marchathon (4 km)" required />
              <span>marchathon (4 km)</span>
            </label>
          </div>
        </div>

        <button className="btn btn-primary" disabled={loading}>
          {loading ? "Envoi..." : "Envoyer l'inscription"}
        </button>
      </form>
    </main>
  );
}
