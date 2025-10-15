import Link from "next/link";
export default function Merci() {
  return (
    <main className="section">
      <div className="card text-center mx-auto max-w-xl">
        <div className="card-inner grid gap-4">
          <h1 className="h2">Merci ! 🎉</h1>
          <p>Votre inscription a bien été enregistrée.</p>
          <Link href="/" className="btn btn-ghost w-max mx-auto">Retour à l'accueil</Link>
        </div>
      </div>
    </main>
  );
}
