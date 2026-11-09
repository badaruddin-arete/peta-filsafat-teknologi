import { fireEvent, render, screen, cleanup } from "@testing-library/react";
import { afterEach, expect, it, vi } from "vitest";
import { useEffect, type ReactNode } from "react";
import { QueryClient } from "@tanstack/react-query";
import { createMemoryHistory, createRouter, RouterProvider } from "@tanstack/react-router";

const { fitView } = vi.hoisted(() => ({ fitView: vi.fn() }));
vi.mock("@xyflow/react", () => ({
  ReactFlow: ({ children, onNodeClick, onEdgeClick }: {
    children: ReactNode;
    onNodeClick: (event: unknown, node: { id: string }) => void;
    onEdgeClick: (event: unknown, edge: { id: string }) => void;
  }) => {
    useEffect(() => { fitView(); }, []);
    return <div>{children}
      <button onClick={() => onNodeClick(null, { id: "aristoteles" })}>Pilih pemikir uji</button>
      <button onClick={() => onEdgeClick(null, { id: "e0" })}>Pilih relasi uji</button>
    </div>;
  },
  Panel: ({ children }: { children: ReactNode }) => <div>{children}</div>,
  Controls: () => null,
  Handle: () => null,
  BaseEdge: () => null,
  MarkerType: { ArrowClosed: "arrowclosed" },
  Position: { Left: "left", Right: "right" },
  useReactFlow: () => ({ fitView }),
}));

import { routeTree } from "@/routeTree.gen";

afterEach(() => { cleanup(); vi.clearAllMocks(); });

// Index membaca tab aktif dari query string, jadi ia harus dirender lewat router.
async function renderApp() {
  const router = createRouter({
    routeTree,
    history: createMemoryHistory({ initialEntries: ["/"] }),
    context: { queryClient: new QueryClient() },
  });
  await router.load();
  render(<RouterProvider router={router} />);
}

it("fits only on initial load and explicit recenter, never on selection or panel close", async () => {
  await renderApp();
  const pilihPemikir = await screen.findByRole("button", { name: "Pilih pemikir uji" });
  expect(fitView).toHaveBeenCalledTimes(1);
  fireEvent.click(pilihPemikir);
  expect(fitView).toHaveBeenCalledTimes(1);
  fireEvent.click(screen.getByRole("button", { name: "Tutup" }));
  expect(fitView).toHaveBeenCalledTimes(1);
  fireEvent.click(screen.getByRole("button", { name: "Pilih relasi uji" }));
  expect(fitView).toHaveBeenCalledTimes(1);
  fireEvent.click(screen.getByRole("button", { name: "Pusatkan ulang" }));
  expect(fitView).toHaveBeenCalledTimes(2);
});
