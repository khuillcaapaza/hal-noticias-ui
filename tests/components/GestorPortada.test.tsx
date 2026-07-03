// @vitest-environment jsdom
import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import { render, screen, cleanup, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import GestorPortada from "@/components/GestorPortada";
import type { Post } from "@/lib/types";

const h = vi.hoisted(() => ({
  subir: vi.fn(),
  eliminar: vi.fn(),
}));

vi.mock("@/lib/api", () => ({
  subirYRegistrarImagen: h.subir,
  eliminarImagen: h.eliminar,
}));

function postConPortada(conPortada: boolean): Post {
  return {
    uuid: "uuid-1",
    slug: "mi-post",
    title: "Post",
    excerpt: "resumen",
    category: "Salud",
    date: "2026-01-01",
    author: "Autor",
    coverColor: "from-blue-100 to-blue-200",
    cover: conPortada ? "https://x/cover.jpg" : null,
    publicado: true,
    imagenes: conPortada
      ? [
          {
            id: 5,
            name: "cover.jpg",
            ext: "jpg",
            size: 2048,
            isCover: true,
            url: "https://x/cover.jpg",
          },
        ]
      : [],
  };
}

beforeEach(() => {
  h.subir.mockReset().mockResolvedValue(undefined);
  h.eliminar.mockReset().mockResolvedValue(undefined);
});
afterEach(() => cleanup());

describe("GestorPortada - sin portada", () => {
  it("muestra el aviso de que no tiene portada", () => {
    render(<GestorPortada post={postConPortada(false)} onCambio={vi.fn()} />);
    expect(screen.getByText(/aún no tiene portada/i)).toBeTruthy();
  });

  it("etiqueta el input como 'Subir portada'", () => {
    render(<GestorPortada post={postConPortada(false)} onCambio={vi.fn()} />);
    expect(screen.getByText("Subir portada")).toBeTruthy();
  });

  it("sube el archivo y llama a onCambio", async () => {
    const onCambio = vi.fn();
    const user = userEvent.setup();
    const { container } = render(
      <GestorPortada post={postConPortada(false)} onCambio={onCambio} />
    );
    const file = new File(["x"], "foto.png", { type: "image/png" });
    const input = container.querySelector('input[type="file"]') as HTMLInputElement;
    await user.upload(input, file);

    await waitFor(() => expect(h.subir).toHaveBeenCalled());
    expect(h.subir).toHaveBeenCalledWith(
      "mi-post",
      "uuid-1",
      file,
      expect.objectContaining({ esPortada: true })
    );
    await waitFor(() => expect(onCambio).toHaveBeenCalled());
  });

  it("muestra un error si la subida falla", async () => {
    h.subir.mockRejectedValue(new Error("Fallo al subir"));
    const user = userEvent.setup();
    const { container } = render(
      <GestorPortada post={postConPortada(false)} onCambio={vi.fn()} />
    );
    const file = new File(["x"], "foto.png", { type: "image/png" });
    await user.upload(
      container.querySelector('input[type="file"]') as HTMLInputElement,
      file
    );
    expect(await screen.findByText("Fallo al subir")).toBeTruthy();
  });
});

describe("GestorPortada - con portada", () => {
  it("muestra el nombre y tamaño formateado de la portada", () => {
    render(<GestorPortada post={postConPortada(true)} onCambio={vi.fn()} />);
    expect(screen.getByText("cover.jpg")).toBeTruthy();
    expect(screen.getByText("2.0 KB")).toBeTruthy();
  });

  it("etiqueta el input como 'Reemplazar portada'", () => {
    render(<GestorPortada post={postConPortada(true)} onCambio={vi.fn()} />);
    expect(screen.getByText("Reemplazar portada")).toBeTruthy();
  });

  it("abre el modal de confirmación al quitar la portada", async () => {
    const user = userEvent.setup();
    render(<GestorPortada post={postConPortada(true)} onCambio={vi.fn()} />);
    await user.click(screen.getByRole("button", { name: "Quitar portada" }));
    expect(screen.getByRole("dialog")).toBeTruthy();
    expect(screen.getByText("Quitar portada", { selector: "h3" })).toBeTruthy();
  });

  it("elimina la portada al confirmar", async () => {
    const onCambio = vi.fn();
    const user = userEvent.setup();
    render(<GestorPortada post={postConPortada(true)} onCambio={onCambio} />);
    await user.click(screen.getByRole("button", { name: "Quitar portada" }));
    await user.click(screen.getByRole("button", { name: "Quitar" }));

    await waitFor(() => expect(h.eliminar).toHaveBeenCalledWith("uuid-1", 5));
    await waitFor(() => expect(onCambio).toHaveBeenCalled());
  });
});
