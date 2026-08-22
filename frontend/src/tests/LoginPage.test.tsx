import { screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it } from "vitest";

import { getToken } from "@/api/client";
import LoginPage from "@/pages/LoginPage";
import { renderWithProviders } from "@/tests/test-utils";

describe("LoginPage", () => {
  it("submits credentials and stores the auth token", async () => {
    renderWithProviders(<LoginPage />);
    const user = userEvent.setup();

    await user.type(screen.getByLabelText(/email/i), "user@example.com");
    await user.type(screen.getByLabelText(/password/i), "password123");
    await user.click(screen.getByRole("button", { name: /sign in/i }));

    await waitFor(() => expect(getToken()).toBe("mock-token"));
  });
});
