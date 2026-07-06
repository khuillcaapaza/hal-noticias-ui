// @vitest-environment jsdom
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import axios from "axios";

// ── Importación diferida para poder mockear axios antes del import ──────────
const axiosMock = vi.hoisted(() => ({
  post: vi.fn(),
  delete: vi.fn(),
}));
vi.mock("axios", () => ({
  default: { ...axiosMock, create: () => ({ interceptors: { request: { use: vi.fn() }, response: { use: vi.fn() } }, get: vi.fn(), post: vi.fn(), put: vi.fn(), delete: vi.fn() }) },
  ...axiosMock,
}));

// Mock del http interno de api.ts (el cliente con interceptors)
const httpMock = { post: vi.fn(), get: vi.fn(), put: vi.fn(), delete: vi.fn() };
vi.mock("@/lib/api", async (importOriginal) => {
  const actual = await importOriginal<typeof import("@/lib/api")>();
  return { ...actual };
});

import {
  subirImagen,
  eliminarImagenFisica,
  subirYRegistrarImagen,
} from "@/lib/api";

beforeEach(() => {
  axiosMock.post.mockReset();
  axiosMock.delete.mockReset();
  // Simula token almacenado
  window.localStorage.setItem("noticias_token", "test-token");
});

afterEach(() => {
  window.localStorage.clear();
  vi.clearAllMocks();
});

describe("subirImagen — nueva firma (uuid, subfolder, archivo)", () => {
  it("envía uuid y subfolder=cover en el FormData", async () => {
    const uuid = "bda32ae0-ce84-45d8-9819-7ffb7d0a1be2";
    const file = new File(["x"], "portada.jpg", { type: "image/jpeg" });

    axiosMock.post.mockResolvedValueOnce({
      data: { ok: true, uuid, subfolder: "cover", nombre: "portada-abc.jpg", ext: "jpg", tamano: 100, url: `http://localhost:8002/posts/${uuid}/cover/portada-abc.jpg` },
    });

    const result = await subirImagen(uuid, "cover", file);

    expect(axiosMock.post).toHaveBeenCalledOnce();
    const [url, formData] = axiosMock.post.mock.calls[0];
    expect(url).toContain("/posts/upload");
    expect(formData instanceof FormData).toBe(true);
    expect(formData.get("uuid")).toBe(uuid);
    expect(formData.get("subfolder")).toBe("cover");
    expect(formData.get("archivo")).toBe(file);
    expect(result.url).toContain(`/${uuid}/cover/`);
  });

  it("envía subfolder=foto para imágenes de cuerpo", async () => {
    const uuid = "bda32ae0-ce84-45d8-9819-7ffb7d0a1be2";
    const file = new File(["x"], "cuerpo.jpg", { type: "image/jpeg" });

    axiosMock.post.mockResolvedValueOnce({
      data: { ok: true, uuid, subfolder: "foto", nombre: "cuerpo-abc.jpg", ext: "jpg", tamano: 50, url: `http://localhost:8002/posts/${uuid}/foto/cuerpo-abc.jpg` },
    });

    await subirImagen(uuid, "foto", file);

    const [, formData] = axiosMock.post.mock.calls[0];
    expect(formData.get("subfolder")).toBe("foto");
  });

  it("ya NO envía campo 'slug'", async () => {
    const uuid = "bda32ae0-ce84-45d8-9819-7ffb7d0a1be2";
    const file = new File(["x"], "img.jpg", { type: "image/jpeg" });
    axiosMock.post.mockResolvedValueOnce({ data: { ok: true, nombre: "img-x.jpg", ext: "jpg", tamano: 1, url: "" } });

    await subirImagen(uuid, "cover", file);

    const [, formData] = axiosMock.post.mock.calls[0];
    expect(formData.get("slug")).toBeNull();
  });
});

describe("eliminarImagenFisica — nueva firma (uuid, subfolder, nombre)", () => {
  it("envía uuid, subfolder y nombre en el body", async () => {
    const uuid = "bda32ae0-ce84-45d8-9819-7ffb7d0a1be2";
    axiosMock.delete.mockResolvedValueOnce({ data: {} });

    await eliminarImagenFisica(uuid, "cover", "portada-abc.jpg");

    expect(axiosMock.delete).toHaveBeenCalledOnce();
    const [url, config] = axiosMock.delete.mock.calls[0];
    expect(url).toContain("/posts/delete");
    expect(config.data).toEqual({ uuid, subfolder: "cover", nombre: "portada-abc.jpg" });
  });

  it("ya NO envía campo 'slug' en el body", async () => {
    axiosMock.delete.mockResolvedValueOnce({ data: {} });
    await eliminarImagenFisica("aaa", "foto", "img.jpg");

    const [, config] = axiosMock.delete.mock.calls[0];
    expect(config.data).not.toHaveProperty("slug");
  });
});

describe("subirYRegistrarImagen — sin slug, inferencia de subfolder", () => {
  it("usa subfolder=cover cuando esPortada=true", async () => {
    const uuid = "bda32ae0-ce84-45d8-9819-7ffb7d0a1be2";
    const file = new File(["x"], "portada.jpg", { type: "image/jpeg" });
    const uploadResult = { ok: true, nombre: "portada-abc.jpg", ext: "jpg", tamano: 1, url: `http://localhost:8002/posts/${uuid}/cover/portada-abc.jpg` };

    axiosMock.post
      .mockResolvedValueOnce({ data: uploadResult })   // subirImagen
      .mockResolvedValueOnce({ data: { id: 5 } });     // registrarImagen

    await subirYRegistrarImagen(uuid, file, { esPortada: true });

    // Primera llamada es subirImagen → debe tener subfolder=cover
    const [, formData] = axiosMock.post.mock.calls[0];
    expect(formData.get("subfolder")).toBe("cover");
  });

  it("usa subfolder=foto cuando esPortada=false (por defecto)", async () => {
    const uuid = "bda32ae0-ce84-45d8-9819-7ffb7d0a1be2";
    const file = new File(["x"], "cuerpo.jpg", { type: "image/jpeg" });
    const uploadResult = { ok: true, nombre: "cuerpo-abc.jpg", ext: "jpg", tamano: 1, url: "" };

    axiosMock.post
      .mockResolvedValueOnce({ data: uploadResult })
      .mockResolvedValueOnce({ data: { id: 6 } });

    await subirYRegistrarImagen(uuid, file);

    const [, formData] = axiosMock.post.mock.calls[0];
    expect(formData.get("subfolder")).toBe("foto");
  });

  it("revierte la subida si registrarImagen falla", async () => {
    const uuid = "bda32ae0-ce84-45d8-9819-7ffb7d0a1be2";
    const file = new File(["x"], "img.jpg", { type: "image/jpeg" });
    const uploadResult = { ok: true, nombre: "img-abc.jpg", ext: "jpg", tamano: 1, url: "" };

    axiosMock.post
      .mockResolvedValueOnce({ data: uploadResult })        // subirImagen OK
      .mockRejectedValueOnce(new Error("registrar falla")); // registrarImagen falla

    axiosMock.delete.mockResolvedValueOnce({ data: {} }); // eliminarImagenFisica

    await expect(subirYRegistrarImagen(uuid, file, { esPortada: false })).rejects.toThrow("registrar falla");

    // Debe haber revertido con eliminarImagenFisica
    expect(axiosMock.delete).toHaveBeenCalledOnce();
    const [, config] = axiosMock.delete.mock.calls[0];
    expect(config.data.nombre).toBe("img-abc.jpg");
    expect(config.data.subfolder).toBe("foto");
  });
});
