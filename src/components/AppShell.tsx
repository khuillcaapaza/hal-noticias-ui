"use client";

import { useState } from "react";
import type { Usuario } from "@/lib/types";
import AdminPanel from "@/components/AdminPanel";
import { UsersManagement } from "@/components/UsersManagement";
import { ChangePasswordForm } from "@/components/ChangePasswordForm";

type View = "noticias" | "usuarios" | "settings";

interface Props {
  usuario: Usuario;
  onLogout: () => void;
}

export default function AppShell({ usuario, onLogout }: Props) {
  const [view, setView] = useState<View>("noticias");
  const isAdmin = usuario.rol === "admin";

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Navbar */}
      <nav className="bg-green-700 text-white shadow-lg">
        <div className="max-w-7xl mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-8">
            <div className="text-xl font-bold">Sistema de Noticias</div>
            <div className="flex items-center gap-4">
              <button
                onClick={() => setView("noticias")}
                className={`px-4 py-2 rounded transition-colors ${
                  view === "noticias"
                    ? "bg-green-800 text-white"
                    : "hover:bg-green-600"
                }`}
              >
                📰 Noticias
              </button>
              {isAdmin && (
                <button
                  onClick={() => setView("usuarios")}
                  className={`px-4 py-2 rounded transition-colors ${
                    view === "usuarios"
                      ? "bg-green-800 text-white"
                      : "hover:bg-green-600"
                  }`}
                >
                  👥 Gestión de Usuarios
                </button>
              )}
              <button
                onClick={() => setView("settings")}
                className={`px-4 py-2 rounded transition-colors ${
                  view === "settings"
                    ? "bg-green-800 text-white"
                    : "hover:bg-green-600"
                }`}
              >
                🔐 Cambiar Contraseña
              </button>
            </div>
          </div>

          <div className="flex items-center gap-4">
            <span className="text-sm">
              Hola, <strong>{usuario.nombre}</strong> ({usuario.rol})
            </span>
            <button
              onClick={onLogout}
              className="bg-red-600 hover:bg-red-700 px-4 py-2 rounded transition-colors"
            >
              Salir
            </button>
          </div>
        </div>
      </nav>

      {/* Content */}
      <div className="max-w-7xl mx-auto">
        {view === "noticias" && <AdminPanel usuario={usuario} onLogout={onLogout} />}
        {view === "usuarios" && isAdmin && <UsersManagement />}
        {view === "settings" && <ChangePasswordForm />}
      </div>
    </div>
  );
}
