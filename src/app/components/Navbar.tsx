"use client";

import React from "react";
import { signOut, useSession } from "next-auth/react";
import { Button } from "./ui/button";

export default function Navbar() {
  const { data: session } = useSession();

  return (
    <nav className="w-full bg-primary text-white shadow-md">
      {/* 🔁 quitamos max-w / mx-auto; navbar full-bleed */}
      <div className="w-full px-4 h-14 flex items-center justify-between">
        <div className="font-bold text-lg">Wise CX</div>
        <div className="flex items-center gap-3">
          {session?.user?.name && (
            <span className="text-white/90 hidden sm:block">
              Hola, {session.user.name}
            </span>
          )}
          {session ? (
            <Button
              onClick={() => signOut()}
              className="bg-white text-primary hover:bg-white/90"
            >
              Cerrar sesión
            </Button>
          ) : null}
        </div>
      </div>
    </nav>
  );
}
