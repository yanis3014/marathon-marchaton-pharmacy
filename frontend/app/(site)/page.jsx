import Link from "next/link";

export default function Page() {
  return (
    <main className="grid gap-8">
      <section className="card grid gap-6 md:grid-cols-2 items-center">
        <div className="space-y-4">
          <h1 className="text-3xl md:text-4xl font-semibold">
            Pharmathon & <span className="text-blue-600">marchathon</span>
          </h1>
          <p className="text-gray-600">
            🎉 À l'occasion du 50ᵉ anniversaire de la FPHM, participez au <strong>Pharmathon (8 km)</strong> ou à la{" "}
            <strong>marchathon (4 km)</strong>. Départ depuis la <em>Faculté de Pharmacie de Monastir</em> le{" "}
            <strong>16 novembre 2025</strong>.
          </p>
          <div className="flex gap-3">
            <Link href="/inscription" className="btn btn-primary">S'inscrire maintenant</Link>
            <a href="#infos" className="btn btn-outline">En savoir plus</a>
          </div>
        </div>
        <div className="aspect-[4/3] rounded-2xl bg-gradient-to-br from-blue-100 to-indigo-200 flex items-center justify-center">
          <span className="text-xl text-blue-700 font-semibold">FPHM • 50 ans</span>
        </div>
      </section>

      <section id="infos" className="grid md:grid-cols-3 gap-4">
        {[
          { title: "Lieu de départ", text: "Faculté de Pharmacie de Monastir" },
          { title: "Date", text: "Dimanche 16 novembre 2025" },
          { title: "Épreuves", text: "Course 8 km • Marche conviviale 4 km" },
        ].map((b, i) => (
          <div key={i} className="card">
            <h3 className="font-semibold">{b.title}</h3>
            <p className="text-gray-600 mt-2">{b.text}</p>
          </div>
        ))}
      </section>
    </main>
  );
}
