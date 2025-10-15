"use client";
import { useEffect, useState } from "react";

export default function Confirm() {
  const [status, setStatus] = useState("ok");
  useEffect(() => {
    const u = new URL(window.location.href);
    setStatus(u.searchParams.get("status") || "ok");
  }, []);
  return (
    <main className="card grid gap-3 text-center">
      <h1 className="text-2xl font-semibold">Confirmation</h1>
      {status === "ok" ? (
        <p>Votre adresse e-mail a été confirmée. Merci !</p>
      ) : (
        <p>Statut de confirmation : {status}</p>
      )}
    </main>
  );
}
