"use client";
import { useEffect, useRef } from "react";

export default function QrScanner({ onCode }) {
  const containerRef = useRef(null);
  const scannerRef = useRef(null);

  useEffect(() => {
    let isMounted = true;
    async function start() {
      const { Html5QrcodeScanner } = await import("html5-qrcode");
      if (!isMounted) return;
      const config = { fps: 10, qrbox: 200, rememberLastUsedCamera: true };
      const scanner = new Html5QrcodeScanner("qr-reader", config, false);
      scannerRef.current = scanner;
      scanner.render(
        (decodedText) => {
          if (onCode) onCode(decodedText);
        },
        (error) => {
          // silent
        }
      );
    }
    start();
    return () => {
      isMounted = false;
      try {
        scannerRef.current?.clear();
      } catch (e) {}
    };
  }, [onCode]);

  return (
    <div className="grid gap-2">
      <div id="qr-reader" ref={containerRef} className="rounded-xl overflow-hidden border" />
      <p className="text-xs text-gray-500">Autorisez l'accès à la caméra pour scanner les QR codes.</p>
    </div>
  );
}
