export const metadata = {
  title: "Pharmathon & marchathon — FPHM",
  description: "Inscriptions pour le Pharmathon (8 km) et la marchathon (4 km) — Faculté de Pharmacie de Monastir",
};

export default function RootLayout({ children }) {
  return (
    <html lang="fr">
      <body className="min-h-screen">
        <div className="mx-auto max-w-5xl px-4 py-8">{children}</div>
        <footer className="mt-16 border-t py-8 text-center text-sm text-gray-500">
          50ᵉ anniversaire de la Faculté de Pharmacie de Monastir — 16 novembre 2025
        </footer>
      </body>
    </html>
  );
}
