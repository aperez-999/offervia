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
  it("includes Job Packet in the navigation palette", () => {
    render(React.createElement(GlobalCommandMenu));

    fireEvent.click(screen.getByRole("button", { name: /open command palette/i }));

    expect(screen.getByText("Job Packet")).toBeInTheDocument();
    expect(screen.getByText("Start Job Packet")).toBeInTheDocument();
  });
});
