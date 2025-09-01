"use client";

import React, { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import AuthLoginCard from "@/app/components/AuthLoginCard";
import NavbarTabs from "@/app/components/NavbarTabs";
import Generator from "./Generator";
import History from "./History";
import Stats from "./Stats";
import Users from "./Users";
import { saveUser } from "./lib/storage";

type Tab = "generator" | "history" | "stats" | "users";

export default function ProposalApp() {
  const { data: session, status } = useSession();
  const loading = status === "loading";

  const role =
    (session?.user?.role as "admin" | "comercial" | undefined) ?? "comercial";
  const isAdmin = role === "admin";
  const userId = (session?.user?.id as string) || "";
  const userEmail = session?.user?.email || "";

  const [activeTab, setActiveTab] = useState<Tab>("generator");

  useEffect(() => {
    if (userEmail && userId) {
      saveUser({ email: userEmail, userId });
    }
  }, [userEmail, userId]);

  if (loading) return <div className="p-8 text-center">Cargando…</div>;
  if (!session) return <AuthLoginCard />;

  return (
    // 🔁 Quitamos el contenedor estrecho y el borde redondeado;
    //     hacemos que ocupe todo el ancho y altura disponible.
    <div className="w-full min-h-[calc(100vh-56px)] bg-gray-100">
      <NavbarTabs active={activeTab} onChange={setActiveTab} showUsers={isAdmin} />

      {/* Un padding horizontal discreto a todo el contenido */}
      <div className="px-6 pb-8">
        {activeTab === "generator" && (
          <Generator
            isAdmin={isAdmin}
            userId={userId}
            userEmail={userEmail}
            onSaved={() => {}}
          />
        )}

        {activeTab === "history" && (
          <History isAdmin={isAdmin} currentEmail={userEmail} />
        )}

        {activeTab === "stats" && (
          <Stats isAdmin={isAdmin} currentEmail={userEmail} />
        )}

        {activeTab === "users" && isAdmin && <Users />}
      </div>
    </div>
  );
}
