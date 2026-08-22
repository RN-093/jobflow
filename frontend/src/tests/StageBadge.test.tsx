import { fireEvent, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";

import { StageBadge } from "@/components/kanban/StageBadge";
import type { Stage } from "@/types";

function stage(overrides: Partial<Stage>): Stage {
  return {
    id: "s",
    name: "Stage",
    position: 0,
    color: "#6366f1",
    stage_type: "interested",
    is_default: true,
    created_at: "2026-01-01T00:00:00",
    job_count: 0,
    ...overrides,
  };
}

describe("StageBadge", () => {
  it("shows a single-option menu for a single-member bucket and is still clickable", async () => {
    const stages = [stage({ id: "interested", name: "Interested", stage_type: "interested" })];
    const onMove = vi.fn();
    render(
      <StageBadge job={{ stage_id: "interested", stage_name: "Interested" }} stages={stages} onMove={onMove} />
    );

    const user = userEvent.setup();
    await user.click(screen.getByRole("button", { name: /interested/i }));

    expect(screen.getAllByText("Interested")).toHaveLength(2); // the badge itself + the menu entry
  });

  it("lists sibling stages for a multi-member bucket and moves on selection", async () => {
    const stages = [
      stage({ id: "iv1", name: "Interview 1", stage_type: "interview", position: 0 }),
      stage({ id: "iv2", name: "Interview 2", stage_type: "interview", position: 1 }),
      stage({ id: "final", name: "Final Interview", stage_type: "interview", position: 2 }),
    ];
    const onMove = vi.fn();
    render(<StageBadge job={{ stage_id: "iv1", stage_name: "Interview 1" }} stages={stages} onMove={onMove} />);

    const user = userEvent.setup();
    await user.click(screen.getByRole("button", { name: /interview 1/i }));

    expect(screen.getByText("Interview 2")).toBeInTheDocument();
    expect(screen.getByText("Final Interview")).toBeInTheDocument();

    fireEvent.click(screen.getByText("Final Interview"));
    expect(onMove).toHaveBeenCalledWith("final");
  });
});
