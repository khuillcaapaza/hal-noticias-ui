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
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold">Gestión de Usuarios</h1>
        <button
          onClick={handleAddClick}
          className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
        >
          + Nuevo Usuario
        </button>
      </div>

      {error && <div className="bg-red-100 text-red-700 p-3 rounded">{error}</div>}

      {showForm && (
        <UserForm user={editingUser} onClose={handleFormClose} />
      )}

      {loading ? (
        <div>Cargando...</div>
      ) : (
        <>
          <table className="w-full border-collapse">
            <thead>
              <tr className="bg-gray-200">
                <th className="border px-4 py-2 text-left">Usuario</th>
                <th className="border px-4 py-2 text-left">Email</th>
                <th className="border px-4 py-2 text-left">Nombre</th>
                <th className="border px-4 py-2 text-left">Rol</th>
                <th className="border px-4 py-2 text-left">Activo</th>
                <th className="border px-4 py-2">Acciones</th>
              </tr>
            </thead>
            <tbody>
              {usuarios.map((user) => (
                <tr key={user.id} className="hover:bg-gray-100">
                  <td className="border px-4 py-2">{user.usuario}</td>
                  <td className="border px-4 py-2">{user.email}</td>
                  <td className="border px-4 py-2">{user.nombre}</td>
                  <td className="border px-4 py-2">
                    <span className={`px-2 py-1 rounded text-white ${
                      user.rol === 'admin' ? 'bg-red-600' : 'bg-blue-600'
                    }`}>
                      {user.rol}
                    </span>
                  </td>
                  <td className="border px-4 py-2">{user.activo ? 'Sí' : 'No'}</td>
                  <td className="border px-4 py-2 text-center space-x-2">
                    <button
                      onClick={() => handleEditClick(user)}
                      className="text-blue-600 hover:text-blue-800"
                    >
                      Editar
                    </button>
                    <button
                      onClick={() => handleDelete(user.id)}
                      className="text-red-600 hover:text-red-800"
                    >
                      Eliminar
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          {/* Paginación */}
          <div className="flex justify-center items-center space-x-2">
            <button
              onClick={() => setPage(Math.max(1, page - 1))}
              disabled={page === 1}
              className="px-3 py-1 border rounded disabled:opacity-50"
            >
              Anterior
            </button>
            <span>
              Página {meta.page} de {meta.total_pages}
            </span>
            <button
              onClick={() => setPage(Math.min(meta.total_pages, page + 1))}
              disabled={page >= meta.total_pages}
              className="px-3 py-1 border rounded disabled:opacity-50"
            >
              Siguiente
            </button>
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
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 max-w-md w-full">
        <h2 className="text-xl font-bold mb-4">
          {user ? 'Editar Usuario' : 'Nuevo Usuario'}
        </h2>

        {error && <div className="bg-red-100 text-red-700 p-3 rounded mb-4">{error}</div>}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium">Usuario</label>
            <input
              type="text"
              name="usuario"
              defaultValue={user?.usuario}
              required
              className="w-full border rounded px-3 py-2"
            />
          </div>

          <div>
            <label className="block text-sm font-medium">Email</label>
            <input
              type="email"
              name="email"
              defaultValue={user?.email}
              required
              className="w-full border rounded px-3 py-2"
            />
          </div>

          <div>
            <label className="block text-sm font-medium">Nombre</label>
            <input
              type="text"
              name="nombre"
              defaultValue={user?.nombre}
              required
              className="w-full border rounded px-3 py-2"
            />
          </div>

          {!user && (
            <div>
              <label className="block text-sm font-medium">Contraseña</label>
              <input
                type="password"
                name="password"
                required={!user}
                className="w-full border rounded px-3 py-2"
              />
            </div>
          )}

          <div>
            <label className="block text-sm font-medium">Rol</label>
            <select
              name="rol"
              defaultValue={user?.rol || 'usuario'}
              className="w-full border rounded px-3 py-2"
            >
              <option value="usuario">Usuario</option>
              <option value="admin">Admin</option>
            </select>
          </div>

          <div className="flex justify-end space-x-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 border rounded hover:bg-gray-100"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50"
            >
              {loading ? 'Guardando...' : 'Guardar'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
