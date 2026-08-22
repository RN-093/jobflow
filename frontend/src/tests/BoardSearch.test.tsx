import { screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it } from "vitest";

import BoardPage from "@/pages/BoardPage";
import { renderWithProviders } from "@/tests/test-utils";

describe("Board search", () => {
  it("filters jobs by a debounced search query", async () => {
    renderWithProviders(<BoardPage />);

    await waitFor(() => expect(screen.getByText("Backend Engineer")).toBeInTheDocument());

    const user = userEvent.setup();
    const searchInput = screen.getByPlaceholderText(/search jobs/i);
    await user.type(searchInput, "Frontend");

    await waitFor(() => expect(screen.queryByText("Backend Engineer")).not.toBeInTheDocument(), { timeout: 2000 });
    await waitFor(() => expect(screen.getByText("Frontend Engineer")).toBeInTheDocument(), { timeout: 2000 });
  });
});
