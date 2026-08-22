import { screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it } from "vitest";

import { KanbanBoard } from "@/components/kanban/KanbanBoard";
import { NewJobModal } from "@/features/jobs/NewJobModal";
import { STAGES } from "@/tests/mocks/handlers";
import { renderWithProviders } from "@/tests/test-utils";

function Harness() {
  return (
    <>
      <NewJobModal open onClose={() => {}} />
      <KanbanBoard stages={STAGES} />
    </>
  );
}

describe("Job creation", () => {
  it("appears in the Interested column after creating a job", async () => {
    renderWithProviders(<Harness />);
    const user = userEvent.setup();

    await waitFor(() => expect(screen.getByLabelText(/job title/i)).toBeInTheDocument());

    await user.type(screen.getByLabelText(/job title/i), "Platform Engineer");
    await user.type(screen.getByLabelText(/company/i), "Acme Corp");
    await user.click(screen.getByRole("button", { name: /create job/i }));

    await waitFor(() => expect(screen.getByText("Platform Engineer")).toBeInTheDocument());
  });
});
