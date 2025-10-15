"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";

export default function Navbar() {
  const pathname = usePathname();
  const isActive = (p) => pathname === p;
  return (
    <header className="sticky top-0 z-30 bg-white/70 backdrop-blur border-b border-white/60">
      <div className="container-default flex items-center justify-between py-3">
        <Link href="/" className="flex items-center gap-3">
          <img
            src="/logo.jpg"
            alt="FPHM"
            className="w-9 h-9 rounded-xl shadow-sm"
          />
          <div className="font-semibold">Pharmathon • Marchathon</div>
        </Link>
        <nav className="flex items-center gap-2">
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
      </div>
    </header>
  );
}
