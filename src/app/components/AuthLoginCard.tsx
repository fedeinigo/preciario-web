"use client";

import { useState } from "react";
import { signIn } from "next-auth/react";

export default function AuthLoginCard() {
  const [email, setEmail] = useState("");
  const [pass, setPass]   = useState("");
  const [err, setErr]     = useState<string|null>(null);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setErr(null);
    setLoading(true);
    const res = await signIn("credentials", {
      email,
      password: pass,
      redirect: false,
    });
    setLoading(false);
    if (!res?.ok) setErr("Credenciales inválidas. (pass demo: 1234)");
  }

  return (
    <div className="p-6">
      <div className="card max-w-3xl mx-auto">
        <h1 className="text-2xl font-bold text-center mb-2">Bienvenido a Wise CX</h1>
        <p className="text-center text-gray-600 mb-6">
          Inicia sesión para generar propuestas.
        </p>

        <div className="max-w-md mx-auto grid gap-3">
          <button
            onClick={() => signIn("google")}
            className="btn-ghost w-full"
          >
            Continuar con Google
          </button>

          <div className="relative my-2 text-center text-xs text-gray-500">— o —</div>

          <form onSubmit={handleSubmit} className="grid gap-3">
            <input
              className="input"
              type="email"
              placeholder='Correo (admin: "admin@wisecx.com")'
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
            <input
              className="input"
              type="password"
              placeholder='Contraseña (demo: "1234")'
              value={pass}
              onChange={(e) => setPass(e.target.value)}
              required
            />
            {err && <div className="text-red-600 text-sm">{err}</div>}
            <button type="submit" className="btn-primary w-full" disabled={loading}>
              {loading ? "Ingresando…" : "Iniciar sesión"}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
