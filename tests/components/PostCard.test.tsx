// @vitest-environment jsdom
import { describe, it, expect, afterEach, vi } from "vitest";
import { render, screen, cleanup } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import PostCard from "@/components/PostCard";
import type { PostMeta } from "@/lib/types";

const basePost: PostMeta = {
  uuid: "uuid-1",
  slug: "mi-post",
  title: "Título de prueba",
  excerpt: "Resumen de prueba",
  category: "Salud",
  date: "2026-01-15",
  author: "Autor Prueba",
  coverColor: "from-blue-100 to-blue-200",
  cover: null,
  publicado: true,
};

afterEach(() => cleanup());

describe("PostCard - render", () => {
  it("muestra título, resumen, categoría, fecha y autor", () => {
    render(<PostCard post={basePost} />);
    expect(screen.getByText("Título de prueba")).toBeTruthy();
    expect(screen.getByText("Resumen de prueba")).toBeTruthy();
    expect(screen.getByText("Salud")).toBeTruthy();
    expect(screen.getByText("2026-01-15")).toBeTruthy();
    expect(screen.getByText("Autor Prueba")).toBeTruthy();
  });

  it("muestra la portada cuando cover está presente", () => {
    const { container } = render(
      <PostCard post={{ ...basePost, cover: "https://x/cover.jpg" }} />
    );
    const img = container.querySelector("img.post-card__cover") as HTMLImageElement;
    expect(img).toBeTruthy();
    expect(img.src).toContain("cover.jpg");
  });

  it("muestra un placeholder cuando no hay cover", () => {
    const { container } = render(<PostCard post={basePost} />);
    expect(container.querySelector(".post-card__cover--placeholder")).toBeTruthy();
    expect(container.querySelector("img.post-card__cover")).toBeNull();
  });

  it("muestra el chip 'Oculta' cuando no está publicado", () => {
    render(<PostCard post={{ ...basePost, publicado: false }} />);
    expect(screen.getByText("Oculta")).toBeTruthy();
  });

  it("no muestra 'Oculta' cuando está publicado", () => {
    render(<PostCard post={basePost} />);
    expect(screen.queryByText("Oculta")).toBeNull();
  });
});

describe("PostCard - acciones", () => {
  it("llama a onEditar con el uuid", async () => {
    const onEditar = vi.fn();
    const user = userEvent.setup();
    render(<PostCard post={basePost} onEditar={onEditar} />);
    await user.click(screen.getByRole("button", { name: "Editar" }));
    expect(onEditar).toHaveBeenCalledWith("uuid-1");
  });

  it("llama a onBorrar con uuid y título", async () => {
    const onBorrar = vi.fn();
    const user = userEvent.setup();
    render(<PostCard post={basePost} onBorrar={onBorrar} />);
    await user.click(screen.getByRole("button", { name: "Eliminar" }));
    expect(onBorrar).toHaveBeenCalledWith("uuid-1", "Título de prueba");
  });

  it("oculta las acciones en modo preview", () => {
    render(<PostCard post={basePost} preview />);
    expect(screen.queryByRole("button", { name: "Editar" })).toBeNull();
    expect(screen.queryByRole("button", { name: "Eliminar" })).toBeNull();
  });
});
