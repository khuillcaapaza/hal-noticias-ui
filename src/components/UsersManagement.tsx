'use client';

import { useEffect, useState } from 'react';
import { useUsers, type Usuario } from '@/hooks/useUsers';
import { useAuth } from '@/hooks/useAuth';

export const UsersManagement = () => {
  const { usuario: currentUser } = useAuth();
  const { usuarios, loading, error, meta, listar, eliminar } = useUsers();
  const [page, setPage] = useState(1);
  const [deleteConfirm, setDeleteConfirm] = useState<number | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [editingUser, setEditingUser] = useState<Usuario | null>(null);

  useEffect(() => {
    listar(page, 20);
  }, [page, listar]);

  const handleDelete = async (id: number) => {
    if (!confirm('¿Estás seguro de que deseas eliminar este usuario?')) return;
    const result = await eliminar(id);
    if (result.success) {
      setDeleteConfirm(null);
      await listar(page, 20);
    }
  };

  const handleEditClick = (user: Usuario) => {
    setEditingUser(user);
    setShowForm(true);
  };

  const handleAddClick = () => {
    setEditingUser(null);
    setShowForm(true);
  };

  const handleFormClose = () => {
    setShowForm(false);
    setEditingUser(null);
    listar(page, 20);
  };

  if (!currentUser || currentUser.rol !== 'admin') {
    return <div className="text-red-600">No tienes permisos para acceder a esta página</div>;
  }

  return (
    <div className="space-y-6 max-w-6xl">
      {/* Header */}
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Gestión de Usuarios</h1>
          <p className="text-gray-500 mt-1">Total: {meta.total} usuarios</p>
        </div>
        <button
          onClick={handleAddClick}
          className="bg-gradient-to-r from-teal-600 to-teal-700 text-white px-6 py-3 rounded-lg hover:from-teal-700 hover:to-teal-800 font-semibold shadow-md transition-all duration-200"
        >
          + Nuevo Usuario
        </button>
      </div>

      {error && (
        <div className="bg-red-50 text-red-700 p-4 rounded-lg border-l-4 border-red-600">
          {error}
        </div>
      )}

      {showForm && (
        <UserForm user={editingUser} onClose={handleFormClose} />
      )}

      {loading ? (
        <div className="flex justify-center items-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-teal-600"></div>
        </div>
      ) : usuarios.length === 0 ? (
        <div className="text-center py-12 bg-gray-50 rounded-lg">
          <p className="text-gray-500 text-lg">No hay usuarios registrados</p>
        </div>
      ) : (
        <>
          {/* Grid de Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {usuarios.map((user) => (
              <div
                key={user.id}
                className="bg-white rounded-lg shadow-md hover:shadow-lg transition-shadow duration-200 overflow-hidden border border-gray-200"
              >
                {/* Card Header */}
                <div className="bg-gradient-to-r from-teal-50 to-teal-100 px-6 py-4 border-b border-gray-200">
                  <div className="flex items-start justify-between mb-2">
                    <div>
                      <h3 className="text-lg font-semibold text-gray-900">{user.nombre}</h3>
                      <p className="text-sm text-gray-600 mt-1">@{user.usuario}</p>
                    </div>
                    <span className={`px-3 py-1 rounded-full text-xs font-semibold ${
                      user.rol === 'admin'
                        ? 'bg-red-100 text-red-700'
                        : 'bg-blue-100 text-blue-700'
                    }`}>
                      {user.rol === 'admin' ? '👑 Admin' : '👤 Usuario'}
                    </span>
                  </div>
                </div>

                {/* Card Body */}
                <div className="px-6 py-4 space-y-3">
                  <div>
                    <p className="text-xs text-gray-500 uppercase tracking-wide">Email</p>
                    <p className="text-sm text-gray-700 font-medium break-all">{user.email}</p>
                  </div>
                  <div className="flex items-center justify-between pt-2">
                    <div>
                      <p className="text-xs text-gray-500 uppercase tracking-wide">Estado</p>
                      <div className="flex items-center mt-1">
                        <span className={`w-2 h-2 rounded-full mr-2 ${
                          user.activo ? 'bg-green-500' : 'bg-gray-400'
                        }`}></span>
                        <span className="text-sm font-medium text-gray-700">
                          {user.activo ? 'Activo' : 'Inactivo'}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Card Footer */}
                <div className="bg-gray-50 px-6 py-4 flex gap-2 border-t border-gray-200">
                  <button
                    onClick={() => handleEditClick(user)}
                    className="flex-1 bg-blue-50 text-blue-600 hover:bg-blue-100 font-semibold py-2 px-3 rounded-lg transition-colors duration-150 text-sm"
                  >
                    ✏️ Editar
                  </button>
                  <button
                    onClick={() => handleDelete(user.id)}
                    className="flex-1 bg-red-50 text-red-600 hover:bg-red-100 font-semibold py-2 px-3 rounded-lg transition-colors duration-150 text-sm"
                  >
                    🗑️ Eliminar
                  </button>
                </div>
              </div>
            ))}
          </div>

          {/* Paginación mejorada */}
          <div className="flex flex-col sm:flex-row justify-between items-center gap-4 pt-8">
            <div className="text-sm text-gray-600">
              Mostrando <span className="font-semibold text-gray-900">{usuarios.length}</span> de <span className="font-semibold text-gray-900">{meta.total}</span> usuarios
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={() => setPage(Math.max(1, page - 1))}
                disabled={page === 1}
                className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 font-medium hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors duration-150"
              >
                ← Anterior
              </button>

              <div className="px-4 py-2 bg-gray-100 rounded-lg">
                <span className="text-sm font-semibold text-gray-900">
                  {meta.page} / {meta.total_pages}
                </span>
              </div>

              <button
                onClick={() => setPage(Math.min(meta.total_pages, page + 1))}
                disabled={page >= meta.total_pages}
                className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 font-medium hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors duration-150"
              >
                Siguiente →
              </button>
            </div>
          </div>
        </>
      )}
    </div>
  );
};

// Componente de formulario reutilizable
interface UserFormProps {
  user: Usuario | null;
  onClose: () => void;
}

const UserForm = ({ user, onClose }: UserFormProps) => {
  const { crear, actualizar } = useUsers();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    const formData = new FormData(e.currentTarget);
    const datos = {
      usuario: formData.get('usuario') as string,
      email: formData.get('email') as string,
      nombre: formData.get('nombre') as string,
      password: formData.get('password') as string,
      rol: formData.get('rol') as string,
    };

    try {
      let result;
      if (user?.id) {
        // Actualizar
        result = await actualizar(user.id, {
          usuario: datos.usuario,
          email: datos.email,
          nombre: datos.nombre,
          rol: datos.rol,
        } as any);
      } else {
        // Crear
        result = await crear(datos);
      }

      if (result.success) {
        onClose();
      } else {
        setError(result.error || 'Error desconocido');
      }
    } catch (err: any) {
      setError(err.message || 'Error al guardar usuario');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-40 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-2xl max-w-md w-full">
        {/* Modal Header */}
        <div className="bg-gradient-to-r from-teal-600 to-teal-700 px-6 py-6">
          <h2 className="text-xl font-bold text-white">
            {user ? '✏️ Editar Usuario' : '➕ Nuevo Usuario'}
          </h2>
        </div>

        <div className="p-6">
          {error && (
            <div className="bg-red-50 text-red-700 p-4 rounded-lg border-l-4 border-red-600 mb-4">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1">Usuario</label>
              <input
                type="text"
                name="usuario"
                defaultValue={user?.usuario}
                required
                className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:ring-2 focus:ring-teal-500 focus:border-transparent outline-none transition"
              />
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1">Email</label>
              <input
                type="email"
                name="email"
                defaultValue={user?.email}
                required
                className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:ring-2 focus:ring-teal-500 focus:border-transparent outline-none transition"
              />
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1">Nombre</label>
              <input
                type="text"
                name="nombre"
                defaultValue={user?.nombre}
                required
                className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:ring-2 focus:ring-teal-500 focus:border-transparent outline-none transition"
              />
            </div>

            {!user && (
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1">Contraseña</label>
                <input
                  type="password"
                  name="password"
                  required={!user}
                  className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:ring-2 focus:ring-teal-500 focus:border-transparent outline-none transition"
                />
              </div>
            )}

            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1">Rol</label>
              <select
                name="rol"
                defaultValue={user?.rol || 'usuario'}
                className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:ring-2 focus:ring-teal-500 focus:border-transparent outline-none transition"
              >
                <option value="usuario">👤 Usuario</option>
                <option value="admin">👑 Admin</option>
              </select>
            </div>

            <div className="flex justify-end gap-3 pt-4">
              <button
                type="button"
                onClick={onClose}
                className="px-6 py-2 border border-gray-300 rounded-lg text-gray-700 font-semibold hover:bg-gray-50 transition-colors duration-150"
              >
                Cancelar
              </button>
              <button
                type="submit"
                disabled={loading}
                className="px-6 py-2 bg-gradient-to-r from-teal-600 to-teal-700 text-white font-semibold rounded-lg hover:from-teal-700 hover:to-teal-800 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-150"
              >
                {loading ? '⏳ Guardando...' : '💾 Guardar'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};
