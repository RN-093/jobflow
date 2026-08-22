import { screen, waitFor } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { KanbanBoard } from "@/components/kanban/KanbanBoard";
import { STAGES } from "@/tests/mocks/handlers";
import { renderWithProviders } from "@/tests/test-utils";

describe("Board filters", () => {
  it("reduces visible cards when filtering by remote status and min salary", async () => {
    renderWithProviders(<KanbanBoard stages={STAGES} filters={{ remote_status: "remote", min_salary: 80000 }} />);

    await waitFor(() => expect(screen.getByText("Backend Engineer")).toBeInTheDocument());
    expect(screen.queryByText("Frontend Engineer")).not.toBeInTheDocument();
  });
});
