// @vitest-environment jsdom
import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import { render, screen, cleanup } from "@testing-library/react";
import { DashboardNav } from "@/components/DashboardNav";

const h = vi.hoisted(() => ({
  auth: {
    usuario: null as null | { nombre: string; rol: "admin" | "usuario" },
    loading: false,
  },
}));

vi.mock("@/hooks/useAuth", () => ({
  useAuth: () => h.auth,
}));

vi.mock("next/link", () => ({
  default: ({ href, children }: { href: string; children: React.ReactNode }) => (
    <a href={href}>{children}</a>
  ),
}));

beforeEach(() => {
  h.auth.usuario = { nombre: "Katerine", rol: "admin" };
  h.auth.loading = false;
});
afterEach(() => cleanup());

describe("DashboardNav", () => {
  it("muestra estado de carga", () => {
    h.auth.loading = true;
    render(<DashboardNav />);
    expect(screen.getByText(/cargando/i)).toBeTruthy();
  });

  it("no renderiza nada si no hay usuario", () => {
    h.auth.usuario = null;
    const { container } = render(<DashboardNav />);
    expect(container.querySelector("nav")).toBeNull();
  });

  it("muestra el saludo con el nombre del usuario", () => {
    render(<DashboardNav />);
    expect(screen.getByText(/hola, katerine/i)).toBeTruthy();
  });

  it("muestra el enlace de gestión de usuarios para admin", () => {
    render(<DashboardNav />);
    expect(screen.getByText("Gestión de Usuarios")).toBeTruthy();
  });

  it("oculta gestión de usuarios para no admin", () => {
    h.auth.usuario = { nombre: "Ruben", rol: "usuario" };
    render(<DashboardNav />);
    expect(screen.queryByText("Gestión de Usuarios")).toBeNull();
  });

  it("muestra los enlaces de contraseña y salir", () => {
    render(<DashboardNav />);
    expect(screen.getByText("Cambiar Contraseña")).toBeTruthy();
    expect(screen.getByText("Salir")).toBeTruthy();
  });
});
