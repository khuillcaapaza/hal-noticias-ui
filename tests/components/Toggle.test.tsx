// @vitest-environment jsdom
import { describe, it, expect, afterEach, vi } from "vitest";
import { render, screen, cleanup } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import Toggle from "@/components/Toggle";

afterEach(() => cleanup());

describe("Toggle", () => {
  it("renderiza la etiqueta", () => {
    render(<Toggle label="Publicada" onChange={vi.fn()} />);
    expect(screen.getByText("Publicada")).toBeTruthy();
  });

  it("refleja el estado checked", () => {
    render(<Toggle label="Activo" checked onChange={vi.fn()} />);
    const input = screen.getByRole("checkbox") as HTMLInputElement;
    expect(input.checked).toBe(true);
  });

  it("llama onChange con el valor invertido al hacer click", async () => {
    const onChange = vi.fn();
    const user = userEvent.setup();
    render(<Toggle label="Activo" checked={false} onChange={onChange} />);
    await user.click(screen.getByRole("checkbox"));
    expect(onChange).toHaveBeenCalledWith(true);
  });

  it("invierte desde checked=true a false", async () => {
    const onChange = vi.fn();
    const user = userEvent.setup();
    render(<Toggle label="Activo" checked onChange={onChange} />);
    await user.click(screen.getByRole("checkbox"));
    expect(onChange).toHaveBeenCalledWith(false);
  });

  it("no llama onChange cuando está deshabilitado", async () => {
    const onChange = vi.fn();
    const user = userEvent.setup();
    render(<Toggle label="Activo" disabled onChange={onChange} />);
    const input = screen.getByRole("checkbox") as HTMLInputElement;
    expect(input.disabled).toBe(true);
    await user.click(input);
    expect(onChange).not.toHaveBeenCalled();
  });

  it("usa ariaLabel cuando se proporciona", () => {
    render(<Toggle label="Texto" ariaLabel="Etiqueta accesible" onChange={vi.fn()} />);
    expect(screen.getByLabelText("Etiqueta accesible")).toBeTruthy();
  });

  it("usa el label como aria-label por defecto", () => {
    render(<Toggle label="Solo label" onChange={vi.fn()} />);
    expect(screen.getByLabelText("Solo label")).toBeTruthy();
  });

  it("asocia el id con el input", () => {
    render(<Toggle id="mi-toggle" label="Activo" onChange={vi.fn()} />);
    expect((screen.getByRole("checkbox") as HTMLInputElement).id).toBe("mi-toggle");
  });

  it("aplica className personalizada", () => {
    const { container } = render(
      <Toggle label="Activo" className="extra" onChange={vi.fn()} />
    );
    expect(container.querySelector(".toggle-wrapper.extra")).toBeTruthy();
  });
});
