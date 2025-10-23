"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState, useEffect } from "react";

export default function Navbar() {
  const pathname = usePathname();
  const isActive = (p) => pathname === p;

  // État pour gérer l'ouverture et la fermeture du menu mobile
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  // Ferme le menu si le chemin de navigation change
  useEffect(() => {
    setIsMenuOpen(false);
  }, [pathname]);

  return (
    <header className="sticky top-0 z-30 bg-white/70 backdrop-blur border-b border-white/60">
      <div className="container-default flex items-center justify-between py-3">
        {/* Logo (inchangé) */}
        <Link href="/" className="flex items-center gap-3">
          <img
            src="/logo.jpg"
            alt="FPHM"
            className="w-14 h-14 rounded-xl shadow-sm"
          />
          <div className="font-semibold">Pharmathon • Marchathon</div>
        </Link>

        {/* --- Navigation pour écrans larges (Desktop) --- */}
        <nav className="hidden md:flex items-center gap-2">
          <Link href="/#infos" className="btn btn-ghost text-sm">
            Infos
          </Link>
          <Link
            href="/inscription"
            className={`btn ${
              isActive("/inscription") ? "btn-outline" : "btn-primary"
            }`}
          >
            S'inscrire
          </Link>
          <Link href="/admin" className="btn btn-ghost text-sm">
            Admin
          </Link>
        </nav>

        {/* --- Bouton Hamburger pour écrans petits (Mobile) --- */}
        <div className="md:hidden">
          <button onClick={() => setIsMenuOpen(!isMenuOpen)} className="p-2">
            {isMenuOpen ? (
              // Icône de fermeture (X)
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="h-6 w-6"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M6 18L18 6M6 6l12 12"
                />
              </svg>
            ) : (
              // Icône hamburger (☰)
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="h-6 w-6"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M4 6h16M4 12h16m-16 6h16"
                />
              </svg>
            )}
          </button>
        </div>
      </div>

      {/* --- Menu déroulant pour mobile --- */}
      {isMenuOpen && (
        <nav className="md:hidden absolute top-full left-0 w-full bg-white/95 backdrop-blur-sm border-b pb-4">
          <div className="container-default flex flex-col items-center gap-4 pt-4">
            <Link href="/#infos" className="btn btn-ghost w-full">
              Infos
            </Link>
            <Link href="/admin" className="btn btn-ghost w-full">
              Admin
            </Link>
            <Link href="/inscription" className="btn btn-primary w-full">
              S'inscrire
            </Link>
          </div>
        </nav>
      )}
    </header>
  );
}
