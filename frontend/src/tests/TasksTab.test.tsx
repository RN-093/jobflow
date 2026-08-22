import { screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it } from "vitest";

import { TasksTab } from "@/features/jobs/tabs/TasksTab";
import { tasksStore } from "@/tests/mocks/handlers";
import { renderWithProviders } from "@/tests/test-utils";

describe("TasksTab", () => {
  it("toggles a task's completion optimistically and persists it", async () => {
    tasksStore["job-1"] = [
      {
        id: "task-1",
        job_id: "job-1",
        title: "Follow up",
        due_date: null,
        completed: false,
        completed_at: null,
        priority: "medium",
        notes: null,
        created_at: new Date().toISOString(),
      },
    ];

    renderWithProviders(<TasksTab jobId="job-1" />);

    await waitFor(() => expect(screen.getByText("Follow up")).toBeInTheDocument());

    const checkbox = screen.getByRole("checkbox");
    expect(checkbox).not.toBeChecked();

    const user = userEvent.setup();
    await user.click(checkbox);

    expect(checkbox).toBeChecked();

    await waitFor(() => expect(tasksStore["job-1"][0].completed).toBe(true));
  });
});
