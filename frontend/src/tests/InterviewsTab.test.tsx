import { fireEvent, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it } from "vitest";

import { InterviewsTab } from "@/features/jobs/tabs/InterviewsTab";
import { renderWithProviders } from "@/tests/test-utils";

describe("InterviewsTab", () => {
  it("shows a newly scheduled interview after creating it via the modal", async () => {
    renderWithProviders(<InterviewsTab jobId="job-1" />);
    const user = userEvent.setup();

    await waitFor(() => expect(screen.getByRole("button", { name: /schedule interview/i })).toBeInTheDocument());
    await user.click(screen.getByRole("button", { name: /schedule interview/i }));

    await user.selectOptions(screen.getByLabelText(/type/i), "Recruiter Screen");
    fireEvent.change(screen.getByLabelText(/date & time/i), { target: { value: "2026-09-01T10:00" } });

    await user.click(screen.getByRole("button", { name: /^schedule$/i }));

    await waitFor(() => expect(screen.getByText("Recruiter Screen")).toBeInTheDocument());
  });
});
