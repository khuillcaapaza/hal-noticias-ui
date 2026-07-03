'use client';

import Link from 'next/link';
import { useAuth } from '@/hooks/useAuth';

export const DashboardNav = () => {
  const { usuario, loading } = useAuth();

  if (loading) {
    return <div>Cargando...</div>;
  }

  if (!usuario) {
    return null;
  }

  return (
    <nav className="bg-gray-800 text-white shadow-lg">
      <div className="container mx-auto px-4 py-4">
        <div className="flex justify-between items-center">
          <h1 className="text-2xl font-bold">Dashboard</h1>
          <div className="flex items-center space-x-6">
            <span className="text-sm">Hola, {usuario.nombre}</span>

            <div className="space-x-4">
              {usuario.rol === 'admin' && (
                <Link
                  href="/dashboard/users"
                  className="text-blue-400 hover:text-blue-300"
                >
                  Gestión de Usuarios
                </Link>
              )}

              <Link
                href="/dashboard/settings"
                className="text-blue-400 hover:text-blue-300"
              >
                Cambiar Contraseña
              </Link>

              <Link
                href="/logout"
                className="text-red-400 hover:text-red-300"
              >
                Salir
              </Link>
            </div>
          </div>
        </div>
      </div>
    </nav>
  );
};
