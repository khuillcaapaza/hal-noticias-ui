// @vitest-environment jsdom
import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import { render, screen, cleanup, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import LoginView from "@/components/LoginView";

const h = vi.hoisted(() => ({
  login: vi.fn(),
  verifyCode: vi.fn(),
  setToken: vi.fn(),
}));

vi.mock("@/lib/api", () => ({
  login: h.login,
  verifyCode: h.verifyCode,
  setToken: h.setToken,
}));

const usuarioMock = {
  id: 1,
  usuario: "katerine",
  email: "kat@x.com",
  nombre: "Katerine",
  rol: "admin",
  activo: true,
};

beforeEach(() => {
  h.login.mockReset().mockResolvedValue({ mensaje: "Código enviado", dev_codigo: "" });
  h.verifyCode.mockReset().mockResolvedValue({ token: "tok-123", usuario: usuarioMock });
  h.setToken.mockReset();
});
afterEach(() => cleanup());

describe("LoginView - credenciales", () => {
  it("renderiza el formulario de credenciales", () => {
    render(<LoginView onSuccess={vi.fn()} />);
    expect(screen.getByText("Sistema de Noticias")).toBeTruthy();
    expect(screen.getByRole("button", { name: "Continuar" })).toBeTruthy();
  });

  it("muestra error si faltan email o contraseña", async () => {
    const user = userEvent.setup();
    render(<LoginView onSuccess={vi.fn()} />);
    await user.click(screen.getByRole("button", { name: "Continuar" }));
    expect(screen.getByText(/ingresa tu email y contraseña/i)).toBeTruthy();
    expect(h.login).not.toHaveBeenCalled();
  });

  it("llama a login y avanza al paso de código", async () => {
    const user = userEvent.setup();
    const { container } = render(<LoginView onSuccess={vi.fn()} />);
    await user.type(container.querySelector('input[name="email"]')!, "KAT@x.com");
    await user.type(container.querySelector('input[name="password"]')!, "secreta");
    await user.click(screen.getByRole("button", { name: "Continuar" }));

    expect(h.login).toHaveBeenCalledWith("kat@x.com", "secreta");
    expect(await screen.findByText(/código enviado/i)).toBeTruthy();
    expect(screen.getByRole("button", { name: "Entrar" })).toBeTruthy();
  });

  it("muestra el error si login falla", async () => {
    h.login.mockRejectedValue(new Error("Credenciales inválidas"));
    const user = userEvent.setup();
    const { container } = render(<LoginView onSuccess={vi.fn()} />);
    await user.type(container.querySelector('input[name="email"]')!, "kat@x.com");
    await user.type(container.querySelector('input[name="password"]')!, "mala");
    await user.click(screen.getByRole("button", { name: "Continuar" }));
    expect(await screen.findByText("Credenciales inválidas")).toBeTruthy();
  });
});

describe("LoginView - código", () => {
  async function avanzarACodigo(container: HTMLElement, user: ReturnType<typeof userEvent.setup>) {
    await user.type(container.querySelector('input[name="email"]')!, "kat@x.com");
    await user.type(container.querySelector('input[name="password"]')!, "secreta");
    await user.click(screen.getByRole("button", { name: "Continuar" }));
    await screen.findByRole("button", { name: "Entrar" });
  }

  it("valida que el código tenga 6 dígitos", async () => {
    const user = userEvent.setup();
    const { container } = render(<LoginView onSuccess={vi.fn()} />);
    await avanzarACodigo(container, user);

    await user.type(container.querySelector('input[name="codigo"]')!, "123");
    await user.click(screen.getByRole("button", { name: "Entrar" }));
    expect(screen.getByRole("alert").textContent).toMatch(/código de 6 dígitos/i);
    expect(h.verifyCode).not.toHaveBeenCalled();
  });

  it("verifica el código, guarda el token y llama onSuccess", async () => {
    const onSuccess = vi.fn();
    const user = userEvent.setup();
    const { container } = render(<LoginView onSuccess={onSuccess} />);
    await avanzarACodigo(container, user);

    await user.type(container.querySelector('input[name="codigo"]')!, "123456");
    await user.click(screen.getByRole("button", { name: "Entrar" }));

    await waitFor(() => expect(h.verifyCode).toHaveBeenCalledWith("kat@x.com", "123456"));
    expect(h.setToken).toHaveBeenCalledWith("tok-123");
    expect(onSuccess).toHaveBeenCalledWith(usuarioMock);
  });

  it("el botón Volver regresa al paso de credenciales", async () => {
    const user = userEvent.setup();
    const { container } = render(<LoginView onSuccess={vi.fn()} />);
    await avanzarACodigo(container, user);

    await user.click(screen.getByRole("button", { name: "Volver" }));
    expect(screen.getByRole("button", { name: "Continuar" })).toBeTruthy();
  });
});
