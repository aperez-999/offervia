import React from "react";
import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import ClearChatButton from "@/components/coach/ClearChatButton";

describe("ClearChatButton", () => {
  it("shows calm destructive confirmation copy", () => {
    const onConfirm = vi.fn();
    render(React.createElement(ClearChatButton, { onConfirm }));

    fireEvent.click(screen.getByRole("button", { name: /clear chat/i }));

    expect(screen.getByText(/clear this chat/i)).toBeInTheDocument();
    expect(
      screen.getByText(/removes the saved messages for this coach mode/i)
    ).toBeInTheDocument();
  });
});
