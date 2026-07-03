// @vitest-environment jsdom
import { describe, it, expect, beforeEach, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import RichTextEditor from "@/components/RichTextEditor";

describe("RichTextEditor", () => {
  const mockOnChange = vi.fn();
  const mockOnImageUpload = vi.fn().mockResolvedValue("https://example.com/image.jpg");

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("debería renderizar el editor sin errores", () => {
    const { container } = render(
      <RichTextEditor
        value=""
        onChange={mockOnChange}
        onImageUpload={mockOnImageUpload}
        placeholder="Escribe aquí..."
      />
    );

    expect(container.querySelector(".rte")).toBeTruthy();
  });

  it("debería mostrar la barra de herramientas", () => {
    const { container } = render(
      <RichTextEditor
        value=""
        onChange={mockOnChange}
        onImageUpload={mockOnImageUpload}
      />
    );

    const toolbar = container.querySelector(".rte-barra");
    expect(toolbar).toBeTruthy();
    const buttons = toolbar?.querySelectorAll("button");
    expect(buttons?.length).toBeGreaterThan(5);
  });

  it("debería renderizar botones de formato", () => {
    const { container } = render(
      <RichTextEditor
        value=""
        onChange={mockOnChange}
        onImageUpload={mockOnImageUpload}
      />
    );

    const buttons = container.querySelectorAll("button");
    const hasFormatButtons = Array.from(buttons).some(
      (b) => b.getAttribute("aria-label")?.includes("Negrita") || b.textContent?.includes("B")
    );
    expect(hasFormatButtons).toBeTruthy();
  });

  it("debería tener botón para insertar imagen", () => {
    const { container } = render(
      <RichTextEditor
        value=""
        onChange={mockOnChange}
        onImageUpload={mockOnImageUpload}
      />
    );

    const buttons = container.querySelectorAll("button");
    const hasImageButton = Array.from(buttons).some(
      (b) => b.getAttribute("aria-label")?.includes("imagen")
    );
    expect(hasImageButton).toBeTruthy();
  });

  it("debería tener botones de deshacer y rehacer", () => {
    const { container } = render(
      <RichTextEditor
        value=""
        onChange={mockOnChange}
        onImageUpload={mockOnImageUpload}
      />
    );

    const buttons = container.querySelectorAll("button");
    const hasUndoButton = Array.from(buttons).some(
      (b) => b.getAttribute("aria-label")?.includes("Deshacer")
    );
    const hasRedoButton = Array.from(buttons).some(
      (b) => b.getAttribute("aria-label")?.includes("Rehacer")
    );
    expect(hasUndoButton).toBeTruthy();
    expect(hasRedoButton).toBeTruthy();
  });

  it("debería aceptar solamente ciertos tipos de archivo", () => {
    const { container } = render(
      <RichTextEditor
        value=""
        onChange={mockOnChange}
        onImageUpload={mockOnImageUpload}
      />
    );

    const fileInput = container.querySelector("input[type='file']") as HTMLInputElement;
    expect(fileInput).toBeTruthy();
    expect(fileInput.accept).toBe(".jpg,.jpeg,.png,.webp,.gif");
  });

  it("debería renderizar con placeholder", () => {
    const { container } = render(
      <RichTextEditor
        value=""
        onChange={mockOnChange}
        onImageUpload={mockOnImageUpload}
        placeholder="Tu contenido aquí"
      />
    );

    const editor = container.querySelector("[data-placeholder]");
    expect(editor?.getAttribute("data-placeholder")).toBe("Tu contenido aquí");
  });

  it("debería tener la clase rte en el contenedor", () => {
    const { container } = render(
      <RichTextEditor
        value=""
        onChange={mockOnChange}
        onImageUpload={mockOnImageUpload}
      />
    );

    const rteElement = container.querySelector(".rte");
    expect(rteElement?.className).toContain("rte");
  });

  it("debería tener una barra de herramientas con clase rte-barra", () => {
    const { container } = render(
      <RichTextEditor
        value=""
        onChange={mockOnChange}
        onImageUpload={mockOnImageUpload}
      />
    );

    const toolbar = container.querySelector(".rte-barra");
    expect(toolbar?.className).toContain("rte-barra");
  });

  it("debería tener botones de formato en la barra", () => {
    const { container } = render(
      <RichTextEditor
        value=""
        onChange={mockOnChange}
        onImageUpload={mockOnImageUpload}
      />
    );

    const formatButtons = container.querySelectorAll(".rte-btn");
    expect(formatButtons.length).toBeGreaterThan(5);
  });
});
