import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import "./globals.css";

export const metadata = {
  title: "Pharmathon & marchathon — FPHM",
  description:
    "Inscriptions pour le Pharmathon (8 km) et la marchathon (4 km) — Faculté de Pharmacie de Monastir",
};

export default function RootLayout({ children }) {
  return (
    <html lang="fr" className="overflow-x-hidden">
      <body className="relative overflow-x-hidden">
        <Navbar />
        <div className="container-default">{children}</div>
        <Footer />
        <div className="blob blob-1" aria-hidden />
        <div className="blob blob-2" aria-hidden />
      </body>
    </html>
  );
}
