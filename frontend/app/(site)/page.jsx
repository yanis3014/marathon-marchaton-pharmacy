import Link from "next/link";

const photos = [
  "/images/course.jpg",
  "/images/marche.jpg",
  "/images/equipe.jpg",
];

export default function Page() {
  return (
    <main className="grid gap-12">
      <section className="section">
        <div className="grid md:grid-cols-2 gap-8 items-center">
          <div className="space-y-6">
            <span className="badge">FPHM • 50 ans</span>

            <h1 className="h1">
              Rejoignez le <span className="text-indigo-600">Pharmathon</span> &
              le <span className="text-indigo-600">marchathon</span>
            </h1>
            <p className="muted text-lg">
              Course 8&nbsp;km ou marche conviviale 4&nbsp;km — départ à{" "}
              <strong>10h00</strong> depuis la Faculté de Pharmacie de Monastir,{" "}
              <strong>16 novembre 2025 </strong>.
            </p>

            <p className="muted text-lg pt-2 border-t border-gray-200">
              Célébrons ensemble 50 ans d’excellence et de passion à la FPHM à
              travers le Pharmathon & le Marchathon !<br />
              Un événement convivial et intergénérationnel qui réunit étudiants,
              enseignants, personnel et pharmaciens autour du sport et du
              partage.
              <br />
              <strong>
                Courons, marchons et célébrons un demi-siècle d’excellence et
                d’esprit FPHM !
              </strong>
            </p>

            {/* ==== BLOC DATE LIMITE AJOUTÉ ==== */}
            <p className="rounded-lg border border-amber-300 bg-amber-50 p-3 text-sm text-amber-800">
              <strong>Attention :</strong> Les inscriptions en ligne se
              terminent le <strong>9 novembre 2025 à 23h59</strong>.
            </p>
            {/* ================================ */}

            <div className="flex gap-3">
              <Link href="/inscription" className="btn btn-primary">
                S'inscrire maintenant
              </Link>
              <a href="#infos" className="btn btn-ghost">
                En savoir plus
              </a>
            </div>
            <div className="flex items-center gap-6 pt-2 text-sm text-gray-600">
              <div>
                <span className="font-bold text-gray-900">+500</span>{" "}
                participants
              </div>
              <div>
                <span className="font-bold text-gray-900">8 km</span> course •{" "}
                <span className="font-bold text-gray-900">4 km</span> marche
              </div>
            </div>
          </div>
          <div className="grid gap-4">
            <div className="aspect-[4/3] overflow-hidden rounded-3xl shadow-md">
              <img
                src={photos[0]}
                alt="Course"
                className="h-full w-full object-cover"
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="aspect-[4/3] overflow-hidden rounded-3xl shadow-md">
                <img
                  src={photos[1]}
                  alt="Marche"
                  className="h-full w-full object-cover"
                />
              </div>
              <div className="aspect-[4/3] overflow-hidden rounded-3xl shadow-md">
                <img
                  src={photos[2]}
                  alt="Esprit d'équipe"
                  className="h-full w-full object-cover"
                />
              </div>
            </div>
          </div>
        </div>
      </section>
      <section className="section text-center">
        <h2 className="h2 mb-12">Nos Sponsors</h2>
        <div className="grid grid-cols-2 gap-6 place-items-center md:flex md:flex-wrap md:justify-center md:items-center md:gap-10">
          {/* Remplace les src par les chemins réels vers tes logos */}
          <img
            src="/sponsors/sponsor1.jpg"
            alt="Sponsor 1"
            className="bg-white p-4 rounded-xl shadow-md flex justify-center items-center w-56 h-40 transition hover:shadow-lg "
          />
          <img
            src="/sponsors/sponsor2.jpg"
            alt="Sponsor 2"
            className="bg-white p-4 rounded-xl shadow-md flex justify-center items-center w-56 h-40 transition hover:shadow-lg "
          />
          <img
            src="/sponsors/sponsor3.jpg"
            alt="Sponsor 3"
            className="bg-white p-4 rounded-xl shadow-md flex justify-center items-center w-56 h-40 transition hover:shadow-lg "
          />
          <img
            src="/sponsors/sponsor4.png"
            alt="Sponsor 1"
            className="bg-white p-4 rounded-xl shadow-md flex justify-center items-center w-56 h-40 transition hover:shadow-lg "
          />
        </div>
      </section>

      <section id="infos" className="section grid md:grid-cols-3 gap-4">
        {[
          { title: "Lieu de départ", text: "Faculté de Pharmacie de Monastir" },
          { title: "Date", text: "Dimanche 16 novembre 2025 - 10h00" },
          { title: "Épreuves", text: "Course 8 km • Marche conviviale 4 km" },
        ].map((b, i) => (
          <div key={i} className="card">
            <div className="card-inner">
              <h3 className="h2 text-xl">{b.title}</h3>
              <p className="muted mt-2">{b.text}</p>
            </div>
          </div>
        ))}
      </section>

      <section className="section">
        <div className="card">
          <div className="card-inner">
            <h2 className="h2 mb-6">Comment participer ?</h2>
            <div className="grid md:grid-cols-3 gap-6">
              {[
                {
                  n: "1",
                  t: "Inscrivez-vous",
                  d: "Complétez le formulaire en ligne.",
                },
                {
                  n: "2",
                  t: "Confirmez",
                  d: "Cliquez sur le lien reçu par e-mail et gardez le QR.",
                },
                {
                  n: "3",
                  t: "Venez courir ou marcher",
                  d: "Présentez votre QR le jour J pour le pointage.",
                },
              ].map((s) => (
                <div key={s.n} className="rounded-2xl border p-5 bg-white/70">
                  <div className="size-8 grid place-items-center rounded-lg bg-indigo-600 text-white font-bold">
                    {s.n}
                  </div>
                  <h3 className="font-semibold mt-3">{s.t}</h3>
                  <p className="muted mt-1">{s.d}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      <section className="section text-center">
        <div className="card">
          <div className="card-inner">
            <h2 className="h2">Prêt(e) à rejoindre l'aventure ?</h2>
            <p className="muted mt-2 max-w-2xl mx-auto">
              Inscrivez-vous dès maintenant et vivez un moment sportif et
              convivial avec la communauté de la FPHM.
            </p>
            <div className="mt-6">
              <Link href="/inscription" className="btn btn-primary">
                S'inscrire
              </Link>
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}
