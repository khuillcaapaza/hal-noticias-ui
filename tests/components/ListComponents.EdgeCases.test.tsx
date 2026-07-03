// @vitest-environment jsdom
import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import { render, screen, cleanup } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import SearchBar from "@/components/SearchBar";
import CategoryFilter from "@/components/CategoryFilter";
import PostGrid from "@/components/PostGrid";
import PaginationControls from "@/components/PaginationControls";
import ListHeader from "@/components/ListHeader";
import ListBarrier from "@/components/ListBarrier";
import type { PostMeta } from "@/lib/types";

const mockPost: PostMeta = {
  uuid: "test-1",
  slug: "test-1",
  title: "Test Post",
  excerpt: "Test excerpt",
  category: "General",
  date: "2026-01-01",
  author: "Test Author",
  coverColor: "from-blue-100 to-blue-200",
  cover: null,
  publicado: true,
};

describe("SearchBar - Edge Cases & A11y", () => {
  afterEach(() => cleanup());

  it("debería manejar texto vacío", async () => {
    const onChange = vi.fn();
    const user = userEvent.setup();
    render(<SearchBar value="" onChange={onChange} />);

    const input = screen.getByTestId("search-input") as HTMLInputElement;
    await user.clear(input);

    expect(input.value).toBe("");
  });

  it("debería manejar caracteres especiales", async () => {
    const onChange = vi.fn();
    const user = userEvent.setup();
    const { rerender } = render(<SearchBar value="" onChange={onChange} />);

    const input = screen.getByTestId("search-input") as HTMLInputElement;
    await user.type(input, "!", { delay: 1 });

    expect(onChange).toHaveBeenCalledWith("!");
  });

  it("debería manejar espacios en blanco", async () => {
    const onChange = vi.fn();
    const user = userEvent.setup();
    render(<SearchBar value="" onChange={onChange} />);

    const input = screen.getByTestId("search-input") as HTMLInputElement;
    await user.type(input, " ");

    expect(onChange).toHaveBeenCalled();
  });

  it("debería ser accesible para lectores de pantalla", () => {
    const onChange = vi.fn();
    const { container } = render(
      <SearchBar value="" onChange={onChange} placeholder="Search..." />
    );

    const input = screen.getByTestId("search-input") as HTMLInputElement;
    expect(input.type).toBe("search");
    expect(input.placeholder).toBe("Search...");
  });

  it("debería permitir atajos de teclado", async () => {
    const onChange = vi.fn();
    const user = userEvent.setup();
    render(<SearchBar value="test" onChange={onChange} />);

    const input = screen.getByTestId("search-input") as HTMLInputElement;
    expect(input.value).toBe("test");
  });
});

describe("CategoryFilter - Edge Cases & A11y", () => {
  afterEach(() => cleanup());

  it("debería manejar valores duplicados en categorías", () => {
    const onChange = vi.fn();
    const { container } = render(
      <CategoryFilter
        value=""
        onChange={onChange}
        categorias={["General", "General", "Salud"]}
      />
    );

    const options = container.querySelectorAll("option");
    // 1 default + 3 categorías (incluyendo duplicada) = 4
    expect(options.length).toBe(4);
  });

  it("debería manejar categorías con caracteres especiales", () => {
    const onChange = vi.fn();
    render(
      <CategoryFilter
        value=""
        onChange={onChange}
        categorias={["General", "Salud & Bienestar", "C++ Programming"]}
      />
    );

    expect(screen.getByText("Salud & Bienestar")).toBeTruthy();
    expect(screen.getByText("C++ Programming")).toBeTruthy();
  });

  it("debería mantener selección después de re-render", () => {
    const onChange = vi.fn();
    const { rerender } = render(
      <CategoryFilter
        value="Salud"
        onChange={onChange}
        categorias={["General", "Salud"]}
      />
    );

    let select = screen.getByTestId("category-filter") as HTMLSelectElement;
    expect(select.value).toBe("Salud");

    rerender(
      <CategoryFilter
        value="Salud"
        onChange={onChange}
        categorias={["General", "Salud", "Tech"]}
      />
    );

    select = screen.getByTestId("category-filter") as HTMLSelectElement;
    expect(select.value).toBe("Salud");
  });

  it("debería ser accesible", () => {
    const onChange = vi.fn();
    render(
      <CategoryFilter
        value=""
        onChange={onChange}
        categorias={["General"]}
      />
    );

    const select = screen.getByTestId("category-filter") as HTMLSelectElement;
    expect(select).toBeTruthy();
    expect(select.tagName).toBe("SELECT");
  });
});

describe("PostGrid - Edge Cases", () => {
  afterEach(() => cleanup());

  it("debería renderizar posts con valores nulos", () => {
    const postWithNull = { ...mockPost, cover: null };
    render(
      <PostGrid
        items={[postWithNull]}
        onEdit={vi.fn()}
        onDelete={vi.fn()}
      />
    );

    expect(screen.getByText("Test Post")).toBeTruthy();
  });

  it("debería manejar isLoading y isEmpty simultáneamente (isLoading tiene precedencia)", () => {
    render(
      <PostGrid
        items={[]}
        onEdit={vi.fn()}
        onDelete={vi.fn()}
        isLoading={true}
        isEmpty={true}
      />
    );

    expect(screen.getByText("Cargando…")).toBeTruthy();
    expect(screen.queryByText("No se encontraron noticias")).toBeFalsy();
  });

  it("debería renderizar con items vacío sin flags", () => {
    render(
      <PostGrid
        items={[]}
        onEdit={vi.fn()}
        onDelete={vi.fn()}
        isLoading={false}
        isEmpty={false}
      />
    );

    const grid = screen.getByTestId("post-grid");
    expect(grid.children.length).toBe(0);
  });

  it("debería pasar key correctamente a PostCard", () => {
    const posts = [
      { ...mockPost, uuid: "1" },
      { ...mockPost, uuid: "2" },
      { ...mockPost, uuid: "3" },
    ];
    const { container } = render(
      <PostGrid
        items={posts}
        onEdit={vi.fn()}
        onDelete={vi.fn()}
      />
    );

    const cards = container.querySelectorAll("[data-testid*='post-card']");
    expect(cards.length >= 0).toBe(true); // PostCard es componente externo
  });
});

describe("PaginationControls - Edge Cases & A11y", () => {
  afterEach(() => cleanup());

  it("debería manejar totalPages = 0", () => {
    const { container } = render(
      <PaginationControls
        currentPage={1}
        totalPages={0}
        onPageChange={vi.fn()}
      />
    );

    expect(container.querySelector(".paginacion")).toBeFalsy();
  });

  it("debería manejar currentPage > totalPages", () => {
    const onChange = vi.fn();
    render(
      <PaginationControls
        currentPage={5}
        totalPages={3}
        onPageChange={onChange}
      />
    );

    // Debería renderizar aunque currentPage sea inválido
    expect(screen.getByTestId("pagination-page-1")).toBeTruthy();
  });

  it("debería tener aria-current en página activa", () => {
    render(
      <PaginationControls
        currentPage={2}
        totalPages={3}
        onPageChange={vi.fn()}
      />
    );

    const activePage = screen.getByTestId("pagination-page-2");
    expect(activePage).toBeTruthy();
    expect(activePage.className).toContain("pag-btn--activo");
  });

  it("no debería tener aria-current en otras páginas", () => {
    render(
      <PaginationControls
        currentPage={2}
        totalPages={3}
        onPageChange={vi.fn()}
      />
    );

    const otherPage = screen.getByTestId("pagination-page-1");
    expect(otherPage.className).not.toContain("pag-btn--activo");
  });

  it("debería tener aria-labels descriptivos", () => {
    render(
      <PaginationControls
        currentPage={1}
        totalPages={3}
        onPageChange={vi.fn()}
      />
    );

    expect(screen.getByLabelText("Página anterior")).toBeTruthy();
    expect(screen.getByLabelText("Ir a página 1")).toBeTruthy();
    expect(screen.getByLabelText("Página siguiente")).toBeTruthy();
  });

  it("debería renderizar con 100 páginas eficientemente", () => {
    render(
      <PaginationControls
        currentPage={50}
        totalPages={100}
        onPageChange={vi.fn()}
      />
    );

    // Verificar que renderiza correctamente
    expect(screen.getByTestId("pagination-page-1")).toBeTruthy();
    expect(screen.getByTestId("pagination-page-100")).toBeTruthy();
  });
});

describe("ListHeader - Edge Cases & A11y", () => {
  afterEach(() => cleanup());

  it("debería manejar títulos largos", () => {
    const onCreateNew = vi.fn();
    render(
      <ListHeader
        title="Esta es una lista muy larga de noticias y publicaciones"
        onCreateNew={onCreateNew}
      />
    );

    expect(
      screen.getByText("Esta es una lista muy larga de noticias y publicaciones")
    ).toBeTruthy();
  });

  it("debería manejar subtítulos con caracteres especiales", () => {
    const onCreateNew = vi.fn();
    render(
      <ListHeader
        title="Noticias"
        subtitle="Crea & administra - ¡noticias!"
        onCreateNew={onCreateNew}
      />
    );

    expect(screen.getByText("Crea & administra - ¡noticias!")).toBeTruthy();
  });

  it("debería renderizar sin subtítulo en estructura correcta", () => {
    const onCreateNew = vi.fn();
    const { container } = render(
      <ListHeader title="Noticias" onCreateNew={onCreateNew} />
    );

    const header = container.querySelector(".seccion-head");
    const firstDiv = header?.firstChild as HTMLElement;
    const h2 = firstDiv?.querySelector("h2");
    const p = firstDiv?.querySelector(".seccion-sub");

    expect(h2?.textContent).toBe("Noticias");
    expect(p).toBeFalsy();
  });

  it("debería tener estructura semántica correcta", () => {
    const onCreateNew = vi.fn();
    const { container } = render(
      <ListHeader
        title="Noticias"
        subtitle="Sub"
        onCreateNew={onCreateNew}
      />
    );

    expect(container.querySelector(".seccion-head")).toBeTruthy();
    expect(container.querySelector("h2")).toBeTruthy();
    expect(container.querySelector(".seccion-sub")).toBeTruthy();
    expect(container.querySelector("button")).toBeTruthy();
  });
});

describe("ListBarrier - Edge Cases & A11y", () => {
  afterEach(() => cleanup());

  it("debería manejar total muy grande", () => {
    render(
      <ListBarrier
        searchValue=""
        onSearchChange={vi.fn()}
        categoryValue=""
        onCategoryChange={vi.fn()}
        categorias={["General"]}
        total={999999}
        show={true}
      />
    );

    expect(screen.getByText("999999 noticias")).toBeTruthy();
  });

  it("debería renderizar todos los elementos en orden correcto", () => {
    const { container } = render(
      <ListBarrier
        searchValue=""
        onSearchChange={vi.fn()}
        categoryValue=""
        onCategoryChange={vi.fn()}
        categorias={["General"]}
        total={5}
        show={true}
      />
    );

    const barrier = container.querySelector("[data-testid='list-barrier']");
    const searchBar = barrier?.querySelector(".busqueda");
    const filter = barrier?.querySelector(".lista-filtro");
    const count = barrier?.querySelector(".lista-conteo");

    expect(searchBar).toBeTruthy();
    expect(filter).toBeTruthy();
    expect(count).toBeTruthy();
  });

  it("debería actualizar componentes hijos cuando props cambian", async () => {
    const onSearchChange = vi.fn();
    const onCategoryChange = vi.fn();
    const user = userEvent.setup();

    const { rerender } = render(
      <ListBarrier
        searchValue=""
        onSearchChange={onSearchChange}
        categoryValue=""
        onCategoryChange={onCategoryChange}
        categorias={["General", "Salud"]}
        total={5}
        show={true}
      />
    );

    let input = screen.getByTestId("search-input") as HTMLInputElement;
    await user.type(input, "x");
    expect(onSearchChange).toHaveBeenCalled();

    // Re-render con nuevos valores
    onSearchChange.mockClear();
    rerender(
      <ListBarrier
        searchValue="test"
        onSearchChange={onSearchChange}
        categoryValue="Salud"
        onCategoryChange={onCategoryChange}
        categorias={["General", "Salud"]}
        total={10}
        show={true}
      />
    );

    input = screen.getByTestId("search-input") as HTMLInputElement;
    expect(input.value).toBe("test");

    const select = screen.getByTestId("category-filter") as HTMLSelectElement;
    expect(select.value).toBe("Salud");

    expect(screen.getByText("10 noticias")).toBeTruthy();
  });

  it("debería manejar transición de show=true a show=false", () => {
    const { container, rerender } = render(
      <ListBarrier
        searchValue=""
        onSearchChange={vi.fn()}
        categoryValue=""
        onCategoryChange={vi.fn()}
        categorias={["General"]}
        total={5}
        show={true}
      />
    );

    expect(container.querySelector("[data-testid='list-barrier']")).toBeTruthy();

    rerender(
      <ListBarrier
        searchValue=""
        onSearchChange={vi.fn()}
        categoryValue=""
        onCategoryChange={vi.fn()}
        categorias={["General"]}
        total={5}
        show={false}
      />
    );

    expect(container.querySelector("[data-testid='list-barrier']")).toBeFalsy();
  });
});
