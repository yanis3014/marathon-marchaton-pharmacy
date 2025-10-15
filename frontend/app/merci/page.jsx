import Link from "next/link";

export default function Merci() {
  return (
    <main className="card grid gap-4 text-center">
      <h1 className="text-2xl font-semibold">Merci ! 🎉</h1>
      <p>Votre inscription a bien été enregistrée.</p>
      <Link href="/" className="btn btn-outline w-max mx-auto">Retour à l'accueil</Link>
    </main>
  );
}
