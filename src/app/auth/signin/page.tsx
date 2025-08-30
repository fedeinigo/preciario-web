"use client";

import { useState } from "react";
import { signIn } from "next-auth/react";
import Link from "next/link";

export default function SignInPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  async function handleCredentials(e: React.FormEvent) {
    e.preventDefault();
    // Redirige al home al terminar
    await signIn("credentials", {
      email,
      password,
      callbackUrl: "/",
    });
  }

  return (
    <div className="min-h-screen bg-gray-100 flex items-center justify-center p-6">
      <div className="w-full max-w-xl bg-white rounded-2xl shadow-xl p-8">
        <h1 className="text-3xl font-semibold text-center mb-2">Wise CX</h1>
        <p className="text-center text-gray-600 mb-8">
          Inicia sesión para acceder al Preciario Web
        </p>

        {/* Google */}
        <button
          onClick={() => signIn("google", { callbackUrl: "/" })}
          className="w-full mb-6 inline-flex items-center justify-center gap-2 rounded-lg px-4 py-3 font-medium border border-gray-300 hover:bg-gray-50 transition"
        >
          <svg viewBox="0 0 48 48" className="w-5 h-5" aria-hidden>
            <path fill="#FFC107" d="M43.6 20.5H42V20H24v8h11.3C33.9 32.7 29.4 36 24 36c-6.6 0-12-5.4-12-12s5.4-12 12-12c3 0 5.7 1.1 7.8 3l5.7-5.7C34.2 6.1 29.4 4 24 4 12.9 4 4 12.9 4 24s8.9 20 20 20c10.3 0 19-7.5 19-20 0-1.2-.1-2.3-.4-3.5z" />
            <path fill="#FF3D00" d="M6.3 14.7l6.6 4.8C14.5 16.7 18.9 14 24 14c3 0 5.7 1.1 7.8 3l5.7-5.7C34.2 6.1 29.4 4 24 4 16.2 4 9.5 8.5 6.3 14.7z" />
            <path fill="#4CAF50" d="M24 44c5.3 0 10.1-1.8 13.8-4.9l-6.4-5.2C29.4 36 26.8 37 24 37c-5.4 0-9.9-3.3-11.6-8l-6.5 5C9.1 39.4 16 44 24 44z" />
            <path fill="#1976D2" d="M43.6 20.5H42V20H24v8h11.3c-1.3 3.7-5.8 6.5-11.3 6.5-6.6 0-12-5.4-12-12S17.4 10 24 10c3 0 5.7 1.1 7.8 3l5.7-5.7C34.2 6.1 29.4 4 24 4 12.9 4 4 12.9 4 24s8.9 20 20 20c10.3 0 19-7.5 19-20 0-1.2-.1-2.3-.4-3.5z" />
          </svg>
          Continuar con Google
        </button>

        {/* Divider */}
        <div className="flex items-center gap-4 mb-6">
          <div className="h-px bg-gray-200 flex-1" />
          <span className="text-gray-400 text-sm">o</span>
          <div className="h-px bg-gray-200 flex-1" />
        </div>

        {/* Credenciales (demo) */}
        <form onSubmit={handleCredentials} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Email
            </label>
            <input
              type="email"
              className="w-full rounded-lg border border-gray-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-purple-300"
              placeholder="tu@correo.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
            <p className="text-xs text-gray-500 mt-1">
              Admin válido: <b>admin@wisecx.com</b> — Comerciales: cualquier email
            </p>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Contraseña
            </label>
            <input
              type="password"
              className="w-full rounded-lg border border-gray-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-purple-300"
              placeholder="1234"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
            <p className="text-xs text-gray-500 mt-1">Para pruebas: <b>1234</b></p>
          </div>

          <button
            type="submit"
            className="w-full bg-[#3c038c] hover:opacity-90 text-white font-medium rounded-lg px-4 py-3 transition"
          >
            Iniciar sesión
          </button>
        </form>

        <div className="text-center mt-6">
          <Link href="/" className="text-sm text-gray-500 hover:text-gray-700">
            ← Volver al inicio
          </Link>
        </div>
      </div>
    </div>
  );
}
