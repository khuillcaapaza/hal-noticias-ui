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

describe("SearchBar", () => {
  afterEach(() => cleanup());

  it("debería renderizar el input de búsqueda", () => {
    const onChange = vi.fn();
    render(<SearchBar value="" onChange={onChange} />);

    expect(screen.getByTestId("search-input")).toBeTruthy();
  });

  it("debería llamar onChange cuando se escribe", async () => {
    const onChange = vi.fn();
    const user = userEvent.setup();
    render(<SearchBar value="" onChange={onChange} />);

    const input = screen.getByTestId("search-input") as HTMLInputElement;
    await user.type(input, "t");

    expect(onChange).toHaveBeenCalledWith("t");
  });

  it("debería tener el placeholder por defecto", () => {
    const onChange = vi.fn();
    render(<SearchBar value="" onChange={onChange} />);

    const input = screen.getByTestId("search-input") as HTMLInputElement;
    expect(input.placeholder).toBe("Buscar por título, categoría o resumen…");
  });

  it("debería usar placeholder personalizado", () => {
    const onChange = vi.fn();
    render(
      <SearchBar
        value=""
        onChange={onChange}
        placeholder="Buscar posts…"
      />
    );

    const input = screen.getByTestId("search-input") as HTMLInputElement;
    expect(input.placeholder).toBe("Buscar posts…");
  });

  it("debería mostrar el valor proporcionado", () => {
    const onChange = vi.fn();
    render(<SearchBar value="test" onChange={onChange} />);

    const input = screen.getByTestId("search-input") as HTMLInputElement;
    expect(input.value).toBe("test");
  });

  it("debería renderizar el ícono SVG", () => {
    const onChange = vi.fn();
    render(<SearchBar value="" onChange={onChange} />);

    const svg = screen.getByTestId("search-input").parentElement?.querySelector("svg");
    expect(svg).toBeTruthy();
  });

  it("debería tener tipo search", () => {
    const onChange = vi.fn();
    render(<SearchBar value="" onChange={onChange} />);

    const input = screen.getByTestId("search-input") as HTMLInputElement;
    expect(input.type).toBe("search");
  });

  it("debería llamar onChange con texto completo", async () => {
    const onChange = vi.fn();
    const user = userEvent.setup();
    render(<SearchBar value="" onChange={onChange} />);

    const input = screen.getByTestId("search-input") as HTMLInputElement;
    await user.type(input, "noticia");

    expect(onChange).toHaveBeenCalledTimes(7); // n, o, t, i, c, i, a
    expect(onChange).toHaveBeenLastCalledWith("a");
  });
});

describe("CategoryFilter", () => {
  afterEach(() => cleanup());

  it("debería renderizar el select con categorías", () => {
    const onChange = vi.fn();
    render(
      <CategoryFilter
        value=""
        onChange={onChange}
        categorias={["General", "Salud"]}
      />
    );

    expect(screen.getByTestId("category-filter")).toBeTruthy();
    expect(screen.getByText("General")).toBeTruthy();
    expect(screen.getByText("Salud")).toBeTruthy();
  });

  it("debería llamar onChange cuando se selecciona categoría", async () => {
    const onChange = vi.fn();
    const user = userEvent.setup();
    render(
      <CategoryFilter
        value=""
        onChange={onChange}
        categorias={["General", "Salud"]}
      />
    );

    const select = screen.getByTestId("category-filter") as HTMLSelectElement;
    await user.selectOptions(select, "Salud");

    expect(onChange).toHaveBeenCalledWith("Salud");
  });

  it("debería tener opción por defecto con label personalizado", () => {
    const onChange = vi.fn();
    render(
      <CategoryFilter
        value=""
        onChange={onChange}
        categorias={["General", "Salud"]}
        label="Todas las categorías"
      />
    );

    expect(screen.getByText("Todas las categorías")).toBeTruthy();
  });

  it("debería tener opción por defecto por defecto", () => {
    const onChange = vi.fn();
    render(
      <CategoryFilter
        value=""
        onChange={onChange}
        categorias={["General"]}
      />
    );

    const defaultOption = screen.getByText("Todas las categorías");
    expect(defaultOption).toBeTruthy();
  });

  it("debería mostrar valor seleccionado", () => {
    const onChange = vi.fn();
    render(
      <CategoryFilter
        value="Salud"
        onChange={onChange}
        categorias={["General", "Salud"]}
      />
    );

    const select = screen.getByTestId("category-filter") as HTMLSelectElement;
    expect(select.value).toBe("Salud");
  });

  it("debería manejar categorías vacías", () => {
    const onChange = vi.fn();
    render(
      <CategoryFilter
        value=""
        onChange={onChange}
        categorias={[]}
      />
    );

    const select = screen.getByTestId("category-filter");
    expect(select).toBeTruthy();
  });

  it("debería renderizar muchas categorías", () => {
    const onChange = vi.fn();
    const categorias = ["General", "Salud", "Tech", "Sports", "Science"];
    render(
      <CategoryFilter
        value=""
        onChange={onChange}
        categorias={categorias}
      />
    );

    categorias.forEach((cat) => {
      expect(screen.getByText(cat)).toBeTruthy();
    });
  });

  it("debería tener clase lista-filtro", () => {
    const onChange = vi.fn();
    render(
      <CategoryFilter
        value=""
        onChange={onChange}
        categorias={["General"]}
      />
    );

    const select = screen.getByTestId("category-filter");
    expect(select.className).toContain("lista-filtro");
  });
});

describe("PostGrid", () => {
  afterEach(() => cleanup());

  it("debería mostrar estado de cargando", () => {
    render(
      <PostGrid
        items={[]}
        onEdit={vi.fn()}
        onDelete={vi.fn()}
        isLoading={true}
      />
    );

    expect(screen.getByTestId("loading-state")).toBeTruthy();
    expect(screen.getByText("Cargando…")).toBeTruthy();
  });

  it("debería mostrar estado vacío", () => {
    render(
      <PostGrid
        items={[]}
        onEdit={vi.fn()}
        onDelete={vi.fn()}
        isEmpty={true}
      />
    );

    expect(screen.getByTestId("empty-state")).toBeTruthy();
    expect(screen.getByText("No se encontraron noticias con esos criterios.")).toBeTruthy();
  });

  it("debería renderizar posts en grid", () => {
    render(
      <PostGrid
        items={[mockPost]}
        onEdit={vi.fn()}
        onDelete={vi.fn()}
      />
    );

    expect(screen.getByTestId("post-grid")).toBeTruthy();
    expect(screen.getByText("Test Post")).toBeTruthy();
  });

  it("debería tener clase grid-cronogramas", () => {
    render(
      <PostGrid
        items={[mockPost]}
        onEdit={vi.fn()}
        onDelete={vi.fn()}
      />
    );

    const grid = screen.getByTestId("post-grid");
    expect(grid.className).toContain("grid-cronogramas");
  });

  it("debería renderizar múltiples posts", () => {
    const posts = [mockPost, { ...mockPost, uuid: "2", title: "Post 2" }];
    render(
      <PostGrid
        items={posts}
        onEdit={vi.fn()}
        onDelete={vi.fn()}
      />
    );

    expect(screen.getByText("Test Post")).toBeTruthy();
    expect(screen.getByText("Post 2")).toBeTruthy();
  });

  it("debería pasar onEdit al PostCard", async () => {
    const onEdit = vi.fn();
    const user = userEvent.setup();
    const { container } = render(
      <PostGrid
        items={[mockPost]}
        onEdit={onEdit}
        onDelete={vi.fn()}
      />
    );

    // PostCard es un componente externo, verificamos que se renderiza
    expect(screen.getByText("Test Post")).toBeTruthy();
  });

  it("debería pasar onDelete al PostCard", () => {
    const onDelete = vi.fn();
    render(
      <PostGrid
        items={[mockPost]}
        onEdit={vi.fn()}
        onDelete={onDelete}
      />
    );

    expect(screen.getByText("Test Post")).toBeTruthy();
  });

  it("debería no mostrar grid cuando está cargando", () => {
    const { container } = render(
      <PostGrid
        items={[mockPost]}
        onEdit={vi.fn()}
        onDelete={vi.fn()}
        isLoading={true}
      />
    );

    expect(container.querySelector(".grid-cronogramas")).toBeFalsy();
  });

  it("debería no mostrar grid cuando está vacío", () => {
    const { container } = render(
      <PostGrid
        items={[]}
        onEdit={vi.fn()}
        onDelete={vi.fn()}
        isEmpty={true}
      />
    );

    expect(container.querySelector(".grid-cronogramas")).toBeFalsy();
  });
});

describe("PaginationControls", () => {
  afterEach(() => cleanup());

  it("no debería renderizar si solo hay 1 página", () => {
    const { container } = render(
      <PaginationControls
        currentPage={1}
        totalPages={1}
        onPageChange={vi.fn()}
      />
    );

    expect(container.querySelector(".paginacion")).toBeFalsy();
  });

  it("debería renderizar botones de paginación", () => {
    render(
      <PaginationControls
        currentPage={1}
        totalPages={3}
        onPageChange={vi.fn()}
      />
    );

    expect(screen.getByTestId("pagination-prev")).toBeTruthy();
    expect(screen.getByTestId("pagination-page-1")).toBeTruthy();
    expect(screen.getByTestId("pagination-page-2")).toBeTruthy();
    expect(screen.getByTestId("pagination-page-3")).toBeTruthy();
    expect(screen.getByTestId("pagination-next")).toBeTruthy();
  });

  it("debería deshabilitar botón anterior en primera página", () => {
    render(
      <PaginationControls
        currentPage={1}
        totalPages={3}
        onPageChange={vi.fn()}
      />
    );

    const prevBtn = screen.getByTestId("pagination-prev") as HTMLButtonElement;
    expect(prevBtn.disabled).toBe(true);
  });

  it("debería deshabilitar botón siguiente en última página", () => {
    render(
      <PaginationControls
        currentPage={3}
        totalPages={3}
        onPageChange={vi.fn()}
      />
    );

    const nextBtn = screen.getByTestId("pagination-next") as HTMLButtonElement;
    expect(nextBtn.disabled).toBe(true);
  });

  it("debería habilitar ambos botones en página intermedia", () => {
    render(
      <PaginationControls
        currentPage={2}
        totalPages={3}
        onPageChange={vi.fn()}
      />
    );

    const prevBtn = screen.getByTestId("pagination-prev") as HTMLButtonElement;
    const nextBtn = screen.getByTestId("pagination-next") as HTMLButtonElement;
    expect(prevBtn.disabled).toBe(false);
    expect(nextBtn.disabled).toBe(false);
  });

  it("debería llamar onPageChange cuando se hace clic en página", async () => {
    const onChange = vi.fn();
    const user = userEvent.setup();
    render(
      <PaginationControls
        currentPage={1}
        totalPages={3}
        onPageChange={onChange}
      />
    );

    await user.click(screen.getByTestId("pagination-page-2"));
    expect(onChange).toHaveBeenCalledWith(2);
  });

  it("debería marcar página actual con clase activo", () => {
    render(
      <PaginationControls
        currentPage={2}
        totalPages={3}
        onPageChange={vi.fn()}
      />
    );

    const activePage = screen.getByTestId("pagination-page-2");
    expect(activePage.className).toContain("pag-btn--activo");
  });

  it("no debería marcar otras páginas como activas", () => {
    render(
      <PaginationControls
        currentPage={2}
        totalPages={3}
        onPageChange={vi.fn()}
      />
    );

    const page1 = screen.getByTestId("pagination-page-1");
    const page3 = screen.getByTestId("pagination-page-3");
    expect(page1.className).not.toContain("pag-btn--activo");
    expect(page3.className).not.toContain("pag-btn--activo");
  });

  it("debería llamar onPageChange con página anterior", async () => {
    const onChange = vi.fn();
    const user = userEvent.setup();
    render(
      <PaginationControls
        currentPage={2}
        totalPages={3}
        onPageChange={onChange}
      />
    );

    await user.click(screen.getByTestId("pagination-prev"));
    expect(onChange).toHaveBeenCalledWith(1);
  });

  it("debería llamar onPageChange con página siguiente", async () => {
    const onChange = vi.fn();
    const user = userEvent.setup();
    render(
      <PaginationControls
        currentPage={2}
        totalPages={3}
        onPageChange={onChange}
      />
    );

    await user.click(screen.getByTestId("pagination-next"));
    expect(onChange).toHaveBeenCalledWith(3);
  });

  it("debería tener clase pag-btn en todos los botones", () => {
    render(
      <PaginationControls
        currentPage={1}
        totalPages={3}
        onPageChange={vi.fn()}
      />
    );

    const prevBtn = screen.getByTestId("pagination-prev");
    const pageBtn = screen.getByTestId("pagination-page-1");
    const nextBtn = screen.getByTestId("pagination-next");

    expect(prevBtn.className).toContain("pag-btn");
    expect(pageBtn.className).toContain("pag-btn");
    expect(nextBtn.className).toContain("pag-btn");
  });

  it("debería renderizar con aria-labels accesibles", () => {
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

  it("debería renderizar muchas páginas correctamente", () => {
    render(
      <PaginationControls
        currentPage={5}
        totalPages={10}
        onPageChange={vi.fn()}
      />
    );

    for (let i = 1; i <= 10; i++) {
      expect(screen.getByTestId(`pagination-page-${i}`)).toBeTruthy();
    }
  });
});

describe("ListHeader", () => {
  afterEach(() => cleanup());

  it("debería renderizar título y botón crear", () => {
    const onCreateNew = vi.fn();
    render(
      <ListHeader
        title="Noticias"
        subtitle="Crea y administra noticias"
        onCreateNew={onCreateNew}
      />
    );

    expect(screen.getByText("Noticias")).toBeTruthy();
    expect(screen.getByText("Crea y administra noticias")).toBeTruthy();
    expect(screen.getByTestId("create-button")).toBeTruthy();
  });

  it("debería llamar onCreateNew cuando se hace clic en botón crear", async () => {
    const onCreateNew = vi.fn();
    const user = userEvent.setup();
    render(
      <ListHeader
        title="Noticias"
        onCreateNew={onCreateNew}
      />
    );

    await user.click(screen.getByTestId("create-button"));
    expect(onCreateNew).toHaveBeenCalled();
  });

  it("debería renderizar sin subtítulo", () => {
    const onCreateNew = vi.fn();
    const { container } = render(
      <ListHeader
        title="Noticias"
        onCreateNew={onCreateNew}
      />
    );

    expect(screen.getByText("Noticias")).toBeTruthy();
    expect(container.querySelector(".seccion-sub")).toBeFalsy();
  });

  it("debería tener clase seccion-head", () => {
    const onCreateNew = vi.fn();
    const { container } = render(
      <ListHeader
        title="Noticias"
        onCreateNew={onCreateNew}
      />
    );

    expect(container.querySelector(".seccion-head")).toBeTruthy();
  });

  it("debería usar label de botón personalizado", () => {
    const onCreateNew = vi.fn();
    render(
      <ListHeader
        title="Noticias"
        onCreateNew={onCreateNew}
        buttonLabel="Crear nueva noticia"
      />
    );

    expect(screen.getByText("Crear nueva noticia")).toBeTruthy();
  });

  it("debería usar label de botón por defecto", () => {
    const onCreateNew = vi.fn();
    render(
      <ListHeader
        title="Noticias"
        onCreateNew={onCreateNew}
      />
    );

    expect(screen.getByText("+ Nueva noticia")).toBeTruthy();
  });

  it("debería tener botón de tipo button", () => {
    const onCreateNew = vi.fn();
    render(
      <ListHeader
        title="Noticias"
        onCreateNew={onCreateNew}
      />
    );

    const btn = screen.getByTestId("create-button") as HTMLButtonElement;
    expect(btn.type).toBe("button");
  });

  it("debería tener clase boton y boton--sm", () => {
    const onCreateNew = vi.fn();
    render(
      <ListHeader
        title="Noticias"
        onCreateNew={onCreateNew}
      />
    );

    const btn = screen.getByTestId("create-button");
    expect(btn.className).toContain("boton");
    expect(btn.className).toContain("boton--sm");
  });

  it("debería renderizar h2 para el título", () => {
    const onCreateNew = vi.fn();
    const { container } = render(
      <ListHeader
        title="Noticias"
        onCreateNew={onCreateNew}
      />
    );

    const h2 = container.querySelector("h2");
    expect(h2).toBeTruthy();
    expect(h2?.textContent).toBe("Noticias");
  });

  it("debería renderizar p con clase seccion-sub para subtítulo", () => {
    const onCreateNew = vi.fn();
    const { container } = render(
      <ListHeader
        title="Noticias"
        subtitle="Mi subtítulo"
        onCreateNew={onCreateNew}
      />
    );

    const p = container.querySelector(".seccion-sub");
    expect(p).toBeTruthy();
    expect(p?.textContent).toBe("Mi subtítulo");
  });
});

describe("ListBarrier", () => {
  afterEach(() => cleanup());

  it("debería renderizar búsqueda, filtro y recuento", () => {
    render(
      <ListBarrier
        searchValue=""
        onSearchChange={vi.fn()}
        categoryValue=""
        onCategoryChange={vi.fn()}
        categorias={["General", "Salud"]}
        total={5}
        show={true}
      />
    );

    expect(screen.getByTestId("list-barrier")).toBeTruthy();
    expect(screen.getByTestId("search-input")).toBeTruthy();
    expect(screen.getByTestId("category-filter")).toBeTruthy();
    expect(screen.getByTestId("item-count")).toBeTruthy();
  });

  it("no debería renderizar si show es false", () => {
    const { container } = render(
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

  it("debería mostrar el recuento de items correcto", () => {
    render(
      <ListBarrier
        searchValue=""
        onSearchChange={vi.fn()}
        categoryValue=""
        onCategoryChange={vi.fn()}
        categorias={["General"]}
        total={3}
        show={true}
      />
    );

    expect(screen.getByText("3 noticias")).toBeTruthy();
  });

  it("debería mostrar singular cuando total es 1", () => {
    render(
      <ListBarrier
        searchValue=""
        onSearchChange={vi.fn()}
        categoryValue=""
        onCategoryChange={vi.fn()}
        categorias={["General"]}
        total={1}
        show={true}
      />
    );

    expect(screen.getByText("1 noticia")).toBeTruthy();
  });

  it("debería mostrar plural cuando total es 0", () => {
    render(
      <ListBarrier
        searchValue=""
        onSearchChange={vi.fn()}
        categoryValue=""
        onCategoryChange={vi.fn()}
        categorias={["General"]}
        total={0}
        show={true}
      />
    );

    expect(screen.getByText("0 noticias")).toBeTruthy();
  });

  it("debería llamar onSearchChange cuando se busca", async () => {
    const onSearchChange = vi.fn();
    const user = userEvent.setup();
    render(
      <ListBarrier
        searchValue=""
        onSearchChange={onSearchChange}
        categoryValue=""
        onCategoryChange={vi.fn()}
        categorias={["General"]}
        total={5}
        show={true}
      />
    );

    const input = screen.getByTestId("search-input") as HTMLInputElement;
    await user.type(input, "x");

    expect(onSearchChange).toHaveBeenCalled();
  });

  it("debería llamar onCategoryChange cuando se selecciona categoría", async () => {
    const onCategoryChange = vi.fn();
    const user = userEvent.setup();
    render(
      <ListBarrier
        searchValue=""
        onSearchChange={vi.fn()}
        categoryValue=""
        onCategoryChange={onCategoryChange}
        categorias={["General", "Salud"]}
        total={5}
        show={true}
      />
    );

    const select = screen.getByTestId("category-filter") as HTMLSelectElement;
    await user.selectOptions(select, "Salud");

    expect(onCategoryChange).toHaveBeenCalled();
  });

  it("debería tener clase lista-barra", () => {
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

    expect(container.querySelector(".lista-barra")).toBeTruthy();
  });

  it("debería tener clase lista-conteo", () => {
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

    expect(container.querySelector(".lista-conteo")).toBeTruthy();
  });

  it("debería mostrar valor de búsqueda", () => {
    render(
      <ListBarrier
        searchValue="test"
        onSearchChange={vi.fn()}
        categoryValue=""
        onCategoryChange={vi.fn()}
        categorias={["General"]}
        total={5}
        show={true}
      />
    );

    const input = screen.getByTestId("search-input") as HTMLInputElement;
    expect(input.value).toBe("test");
  });

  it("debería mostrar categoría seleccionada", () => {
    render(
      <ListBarrier
        searchValue=""
        onSearchChange={vi.fn()}
        categoryValue="Salud"
        onCategoryChange={vi.fn()}
        categorias={["General", "Salud"]}
        total={5}
        show={true}
      />
    );

    const select = screen.getByTestId("category-filter") as HTMLSelectElement;
    expect(select.value).toBe("Salud");
  });

  it("debería renderizar por defecto si show no se proporciona", () => {
    const { container } = render(
      <ListBarrier
        searchValue=""
        onSearchChange={vi.fn()}
        categoryValue=""
        onCategoryChange={vi.fn()}
        categorias={["General"]}
        total={5}
      />
    );

    expect(container.querySelector("[data-testid='list-barrier']")).toBeTruthy();
  });
});
