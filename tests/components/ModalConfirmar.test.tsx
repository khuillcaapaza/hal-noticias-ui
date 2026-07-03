// @vitest-environment jsdom
import { describe, it, expect, afterEach, vi } from "vitest";
import { render, screen, cleanup, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import ModalConfirmar, {
  type ConfirmacionState,
} from "@/components/ModalConfirmar";

afterEach(() => cleanup());

function baseEstado(overrides: Partial<ConfirmacionState> = {}): ConfirmacionState {
  return {
    titulo: "Eliminar noticia",
    mensaje: "¿Seguro que deseas eliminar?",
    onConfirmar: vi.fn(),
    ...overrides,
  };
}

describe("ModalConfirmar", () => {
  it("no renderiza nada cuando estado es null", () => {
    const { container } = render(
      <ModalConfirmar estado={null} onCerrar={vi.fn()} />
    );
    expect(container.querySelector(".modal-fondo")).toBeNull();
  });

  it("renderiza título y mensaje", () => {
    render(<ModalConfirmar estado={baseEstado()} onCerrar={vi.fn()} />);
    expect(screen.getByText("Eliminar noticia")).toBeTruthy();
    expect(screen.getByText("¿Seguro que deseas eliminar?")).toBeTruthy();
  });

  it("usa la etiqueta de confirmar por defecto 'Eliminar'", () => {
    render(<ModalConfirmar estado={baseEstado()} onCerrar={vi.fn()} />);
    expect(screen.getByRole("button", { name: "Eliminar" })).toBeTruthy();
  });

  it("usa etiquetaConfirmar personalizada", () => {
    render(
      <ModalConfirmar
        estado={baseEstado({ etiquetaConfirmar: "Quitar" })}
        onCerrar={vi.fn()}
      />
    );
    expect(screen.getByRole("button", { name: "Quitar" })).toBeTruthy();
  });

  it("Cancelar llama a onCerrar", async () => {
    const onCerrar = vi.fn();
    const user = userEvent.setup();
    render(<ModalConfirmar estado={baseEstado()} onCerrar={onCerrar} />);
    await user.click(screen.getByRole("button", { name: "Cancelar" }));
    expect(onCerrar).toHaveBeenCalled();
  });

  it("Confirmar ejecuta onConfirmar y luego onCerrar", async () => {
    const onConfirmar = vi.fn().mockResolvedValue(undefined);
    const onCerrar = vi.fn();
    const user = userEvent.setup();
    render(
      <ModalConfirmar
        estado={baseEstado({ onConfirmar })}
        onCerrar={onCerrar}
      />
    );
    await user.click(screen.getByRole("button", { name: "Eliminar" }));
    await waitFor(() => expect(onConfirmar).toHaveBeenCalled());
    expect(onCerrar).toHaveBeenCalled();
  });

  it("hace clic en el fondo para cerrar", async () => {
    const onCerrar = vi.fn();
    const user = userEvent.setup();
    const { container } = render(
      <ModalConfirmar estado={baseEstado()} onCerrar={onCerrar} />
    );
    await user.click(container.querySelector(".modal-fondo") as HTMLElement);
    expect(onCerrar).toHaveBeenCalled();
  });

  it("no cierra al hacer clic dentro del modal", async () => {
    const onCerrar = vi.fn();
    const user = userEvent.setup();
    render(<ModalConfirmar estado={baseEstado()} onCerrar={onCerrar} />);
    await user.click(screen.getByRole("dialog"));
    expect(onCerrar).not.toHaveBeenCalled();
  });

  it("cierra al presionar Escape", async () => {
    const onCerrar = vi.fn();
    const user = userEvent.setup();
    render(<ModalConfirmar estado={baseEstado()} onCerrar={onCerrar} />);
    await user.keyboard("{Escape}");
    expect(onCerrar).toHaveBeenCalled();
  });
});
