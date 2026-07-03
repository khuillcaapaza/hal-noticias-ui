// @vitest-environment jsdom
import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import { render, screen, cleanup, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { UsersManagement } from "@/components/UsersManagement";
import type { Usuario } from "@/hooks/useUsers";

// Estado y funciones mockeadas compartidas entre los componentes que usan los hooks.
const h = vi.hoisted(() => {
  const usuarios: Usuario[] = [
    {
      id: 1,
      usuario: "katerine",
      email: "katerine@example.com",
      nombre: "Katerine",
      rol: "admin",
      activo: true,
      creado_en: "2026-01-01",
      actualizado_en: "2026-01-01",
    },
    {
      id: 2,
      usuario: "ruben",
      email: "ruben@example.com",
      nombre: "Ruben Paz",
      rol: "usuario",
      activo: false,
      creado_en: "2026-01-02",
      actualizado_en: "2026-01-02",
    },
  ];

  return {
    users: {
      usuarios,
      loading: false,
      error: null as string | null,
      meta: { total: 2, page: 1, per_page: 20, total_pages: 1 },
    },
    auth: {
      usuario: {
        id: 1,
        usuario: "katerine",
        email: "katerine@example.com",
        nombre: "Katerine",
        rol: "admin" as "admin" | "usuario",
        activo: true,
      },
    },
    fns: {
      listar: vi.fn(),
      crear: vi.fn(),
      actualizar: vi.fn(),
      eliminar: vi.fn(),
      resetearPassword: vi.fn(),
      cambiarPassword: vi.fn(),
    },
  };
});

vi.mock("@/hooks/useUsers", () => ({
  useUsers: () => ({ ...h.users, ...h.fns }),
}));

vi.mock("@/hooks/useAuth", () => ({
  useAuth: () => h.auth,
}));

function resetState() {
  h.users.usuarios = [
    {
      id: 1,
      usuario: "katerine",
      email: "katerine@example.com",
      nombre: "Katerine",
      rol: "admin",
      activo: true,
      creado_en: "2026-01-01",
      actualizado_en: "2026-01-01",
    },
    {
      id: 2,
      usuario: "ruben",
      email: "ruben@example.com",
      nombre: "Ruben Paz",
      rol: "usuario",
      activo: false,
      creado_en: "2026-01-02",
      actualizado_en: "2026-01-02",
    },
  ];
  h.users.loading = false;
  h.users.error = null;
  h.users.meta = { total: 2, page: 1, per_page: 20, total_pages: 1 };
  h.auth.usuario = {
    id: 1,
    usuario: "katerine",
    email: "katerine@example.com",
    nombre: "Katerine",
    rol: "admin",
    activo: true,
  };
  h.fns.listar.mockReset();
  h.fns.crear.mockReset().mockResolvedValue({ success: true });
  h.fns.actualizar.mockReset().mockResolvedValue({ success: true });
  h.fns.eliminar.mockReset().mockResolvedValue({ success: true });
  h.fns.resetearPassword.mockReset().mockResolvedValue({ success: true });
  h.fns.cambiarPassword.mockReset().mockResolvedValue({ success: true });
}

beforeEach(() => resetState());
afterEach(() => cleanup());

describe("UsersManagement - control de acceso", () => {
  it("muestra mensaje de sin permisos si el usuario no es admin", () => {
    h.auth.usuario = { ...h.auth.usuario, rol: "usuario" };
    render(<UsersManagement />);
    expect(screen.getByText(/no tienes permisos/i)).toBeTruthy();
  });

  it("muestra mensaje de sin permisos si no hay usuario", () => {
    // @ts-expect-error se prueba el caso de usuario nulo
    h.auth.usuario = null;
    render(<UsersManagement />);
    expect(screen.getByText(/no tienes permisos/i)).toBeTruthy();
  });
});

describe("UsersManagement - listado", () => {
  it("llama a listar al montar", () => {
    render(<UsersManagement />);
    expect(h.fns.listar).toHaveBeenCalledWith(1, 20);
  });

  it("renderiza una card por usuario con nombre, usuario y email", () => {
    render(<UsersManagement />);
    expect(screen.getByText("Katerine")).toBeTruthy();
    expect(screen.getByText("@katerine")).toBeTruthy();
    expect(screen.getByText("katerine@example.com")).toBeTruthy();
    expect(screen.getByText("Ruben Paz")).toBeTruthy();
    expect(screen.getByText("@ruben")).toBeTruthy();
  });

  it("muestra el rol y el estado de cada usuario", () => {
    render(<UsersManagement />);
    expect(screen.getByText("admin")).toBeTruthy();
    expect(screen.getByText("usuario")).toBeTruthy();
    expect(screen.getByText("Activo")).toBeTruthy();
    expect(screen.getByText("Inactivo")).toBeTruthy();
  });

  it("muestra el total de usuarios (plural)", () => {
    render(<UsersManagement />);
    expect(screen.getByText(/total:\s*2 usuarios/i)).toBeTruthy();
  });

  it("usa singular cuando hay un solo usuario", () => {
    h.users.usuarios = [h.users.usuarios[0]];
    h.users.meta = { total: 1, page: 1, per_page: 20, total_pages: 1 };
    render(<UsersManagement />);
    expect(screen.getByText(/total:\s*1 usuario$/i)).toBeTruthy();
  });

  it("muestra estado de carga", () => {
    h.users.loading = true;
    render(<UsersManagement />);
    expect(screen.getByText(/cargando/i)).toBeTruthy();
  });

  it("muestra estado vacío cuando no hay usuarios", () => {
    h.users.usuarios = [];
    h.users.meta = { total: 0, page: 1, per_page: 20, total_pages: 0 };
    render(<UsersManagement />);
    expect(screen.getByText(/aún no hay usuarios/i)).toBeTruthy();
  });

  it("muestra el error del hook si existe", () => {
    h.users.error = "Error de red";
    render(<UsersManagement />);
    expect(screen.getByText("Error de red")).toBeTruthy();
  });
});

describe("UsersManagement - crear usuario", () => {
  it("abre el modal de nuevo usuario", async () => {
    const user = userEvent.setup();
    render(<UsersManagement />);
    await user.click(screen.getByRole("button", { name: /nuevo usuario/i }));
    expect(screen.getByRole("heading", { name: "Nuevo Usuario" })).toBeTruthy();
  });

  it("envía el formulario y llama a crear con los datos", async () => {
    const user = userEvent.setup();
    const { container } = render(<UsersManagement />);
    await user.click(screen.getByRole("button", { name: /nuevo usuario/i }));

    await user.type(container.querySelector('input[name="usuario"]')!, "nuevo");
    await user.type(container.querySelector('input[name="email"]')!, "nuevo@x.com");
    await user.type(container.querySelector('input[name="nombre"]')!, "Nuevo User");
    await user.type(container.querySelector('input[name="password"]')!, "clave1234");

    await user.click(screen.getByRole("button", { name: "Guardar" }));

    expect(h.fns.crear).toHaveBeenCalledWith({
      usuario: "nuevo",
      email: "nuevo@x.com",
      nombre: "Nuevo User",
      password: "clave1234",
      rol: "usuario",
    });
  });

  it("muestra el error si crear falla", async () => {
    h.fns.crear.mockResolvedValue({ success: false, error: "Usuario duplicado" });
    const user = userEvent.setup();
    const { container } = render(<UsersManagement />);
    await user.click(screen.getByRole("button", { name: /nuevo usuario/i }));

    await user.type(container.querySelector('input[name="usuario"]')!, "dup");
    await user.type(container.querySelector('input[name="email"]')!, "dup@x.com");
    await user.type(container.querySelector('input[name="nombre"]')!, "Dup");
    await user.type(container.querySelector('input[name="password"]')!, "clave1234");
    await user.click(screen.getByRole("button", { name: "Guardar" }));

    expect(await screen.findByText("Usuario duplicado")).toBeTruthy();
  });

  it("cierra el modal al cancelar", async () => {
    const user = userEvent.setup();
    render(<UsersManagement />);
    await user.click(screen.getByRole("button", { name: /nuevo usuario/i }));
    expect(screen.getByRole("heading", { name: "Nuevo Usuario" })).toBeTruthy();
    await user.click(screen.getByRole("button", { name: "Cancelar" }));
    expect(screen.queryByRole("heading", { name: "Nuevo Usuario" })).toBeNull();
  });
});

describe("UsersManagement - editar usuario", () => {
  it("abre el modal de edición con datos precargados", async () => {
    const user = userEvent.setup();
    const { container } = render(<UsersManagement />);
    await user.click(screen.getAllByRole("button", { name: "Editar" })[0]);

    expect(screen.getByRole("heading", { name: "Editar Usuario" })).toBeTruthy();
    expect(
      (container.querySelector('input[name="usuario"]') as HTMLInputElement).value
    ).toBe("katerine");
    expect(
      (container.querySelector('input[name="email"]') as HTMLInputElement).value
    ).toBe("katerine@example.com");
  });

  it("no muestra el campo de contraseña al editar", async () => {
    const user = userEvent.setup();
    const { container } = render(<UsersManagement />);
    await user.click(screen.getAllByRole("button", { name: "Editar" })[0]);
    expect(container.querySelector('input[name="password"]')).toBeNull();
  });

  it("envía la actualización con el id del usuario", async () => {
    const user = userEvent.setup();
    const { container } = render(<UsersManagement />);
    await user.click(screen.getAllByRole("button", { name: "Editar" })[0]);

    const nombre = container.querySelector('input[name="nombre"]') as HTMLInputElement;
    await user.clear(nombre);
    await user.type(nombre, "Katerine Editada");
    await user.click(screen.getByRole("button", { name: "Guardar" }));

    expect(h.fns.actualizar).toHaveBeenCalledWith(1, {
      usuario: "katerine",
      email: "katerine@example.com",
      nombre: "Katerine Editada",
      rol: "admin",
    });
  });
});

describe("UsersManagement - eliminar usuario", () => {
  it("llama a eliminar cuando se confirma", async () => {
    const confirmSpy = vi.spyOn(window, "confirm").mockReturnValue(true);
    const user = userEvent.setup();
    render(<UsersManagement />);
    await user.click(screen.getAllByRole("button", { name: "Eliminar" })[0]);
    expect(h.fns.eliminar).toHaveBeenCalledWith(1);
    confirmSpy.mockRestore();
  });

  it("no elimina si se cancela la confirmación", async () => {
    const confirmSpy = vi.spyOn(window, "confirm").mockReturnValue(false);
    const user = userEvent.setup();
    render(<UsersManagement />);
    await user.click(screen.getAllByRole("button", { name: "Eliminar" })[0]);
    expect(h.fns.eliminar).not.toHaveBeenCalled();
    confirmSpy.mockRestore();
  });
});

describe("UsersManagement - resetear contraseña (admin)", () => {
  it("abre el modal de reset indicando el usuario", async () => {
    const user = userEvent.setup();
    render(<UsersManagement />);
    await user.click(screen.getAllByRole("button", { name: /resetear clave/i })[0]);

    expect(screen.getByRole("heading", { name: /resetear contraseña/i })).toBeTruthy();
    const modal = screen.getByRole("heading", { name: /resetear contraseña/i })
      .parentElement as HTMLElement;
    expect(within(modal).getAllByText(/katerine/i).length).toBeGreaterThan(0);
  });

  it("valida el largo mínimo de la contraseña", async () => {
    const user = userEvent.setup();
    const { container } = render(<UsersManagement />);
    await user.click(screen.getAllByRole("button", { name: /resetear clave/i })[0]);

    const inputs = container.querySelectorAll(".modal--form input");
    await user.type(inputs[0] as HTMLInputElement, "corta");
    await user.type(inputs[1] as HTMLInputElement, "corta");
    await user.click(screen.getByRole("button", { name: "Resetear" }));

    expect(screen.getByText(/al menos 8 caracteres/i)).toBeTruthy();
    expect(h.fns.resetearPassword).not.toHaveBeenCalled();
  });

  it("valida que las contraseñas coincidan", async () => {
    const user = userEvent.setup();
    const { container } = render(<UsersManagement />);
    await user.click(screen.getAllByRole("button", { name: /resetear clave/i })[0]);

    const inputs = container.querySelectorAll(".modal--form input");
    await user.type(inputs[0] as HTMLInputElement, "clave1234");
    await user.type(inputs[1] as HTMLInputElement, "otra1234");
    await user.click(screen.getByRole("button", { name: "Resetear" }));

    expect(screen.getAllByText(/no coinciden/i).length).toBeGreaterThan(0);
    expect(h.fns.resetearPassword).not.toHaveBeenCalled();
  });

  it("resetea la contraseña con datos válidos", async () => {
    const user = userEvent.setup();
    const { container } = render(<UsersManagement />);
    await user.click(screen.getAllByRole("button", { name: /resetear clave/i })[0]);

    const inputs = container.querySelectorAll(".modal--form input");
    await user.type(inputs[0] as HTMLInputElement, "clave1234");
    await user.type(inputs[1] as HTMLInputElement, "clave1234");
    await user.click(screen.getByRole("button", { name: "Resetear" }));

    expect(h.fns.resetearPassword).toHaveBeenCalledWith(1, "clave1234");
    expect(await screen.findByText(/contraseña actualizada/i)).toBeTruthy();
  });

  it("alterna la visibilidad de la contraseña", async () => {
    const user = userEvent.setup();
    const { container } = render(<UsersManagement />);
    await user.click(screen.getAllByRole("button", { name: /resetear clave/i })[0]);

    const input = container.querySelector(".modal--form input") as HTMLInputElement;
    expect(input.type).toBe("password");
    await user.click(screen.getByRole("button", { name: "Mostrar" }));
    expect(input.type).toBe("text");
    await user.click(screen.getByRole("button", { name: "Ocultar" }));
    expect(input.type).toBe("password");
  });
});

describe("UsersManagement - paginación", () => {
  it("no muestra controles con una sola página", () => {
    render(<UsersManagement />);
    expect(screen.queryByTestId("pagination-controls")).toBeNull();
  });

  it("muestra controles cuando hay varias páginas", () => {
    h.users.meta = { total: 40, page: 1, per_page: 20, total_pages: 2 };
    render(<UsersManagement />);
    expect(screen.getByTestId("pagination-controls")).toBeTruthy();
  });
});
