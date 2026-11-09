import React from "react";
import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import GlobalCommandMenu from "@/components/layout/GlobalCommandMenu";

const push = vi.fn();
const replace = vi.fn();
const refresh = vi.fn();
const signOut = vi.fn();

vi.mock("next/navigation", () => ({
  useRouter: () => ({ push, replace, refresh }),
  usePathname: () => "/dashboard",
}));

vi.mock("next-themes", () => ({
  useTheme: () => ({
    setTheme: vi.fn(),
    resolvedTheme: "light",
  }),
}));

vi.mock("@/lib/supabase/client", () => ({
  getBrowserSupabase: () => ({
    auth: {
      signOut,
    },
  }),
}));

describe("GlobalCommandMenu", () => {
  it("lists pages from the shared nav config", () => {
    render(React.createElement(GlobalCommandMenu));

    fireEvent.click(screen.getByRole("button", { name: /open command palette/i }));

    expect(screen.getByText("Keyword scan")).toBeInTheDocument();
    expect(screen.getByText("Compare offers")).toBeInTheDocument();
    expect(screen.getByText("Start a new application")).toBeInTheDocument();
  });
});
