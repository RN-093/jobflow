import type { ReactNode } from "react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { renderHook, waitFor } from "@testing-library/react";
import { http, HttpResponse } from "msw";
import { describe, expect, it } from "vitest";

import { boardQueryKey, useMoveJob } from "@/hooks/useBoard";
import { jobsStore } from "@/tests/mocks/handlers";
import { server } from "@/tests/mocks/server";
import type { JobDetail, Paginated } from "@/types";

function makeWrapper(queryClient: QueryClient) {
  return function Wrapper({ children }: { children: ReactNode }) {
    return <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>;
  };
}

function seedBoardCache(queryClient: QueryClient, items: JobDetail[]): void {
  const data: Paginated<JobDetail> = { items, total: items.length, page: 1, page_size: 1000 };
  queryClient.setQueryData(boardQueryKey({}), data);
}

describe("useMoveJob", () => {
  it("fires PATCH /jobs/{id}/stage with the correct body and updates the board cache", async () => {
    const queryClient = new QueryClient({
      defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
    });
    seedBoardCache(queryClient, [...jobsStore]);

    const { result } = renderHook(() => useMoveJob({}), { wrapper: makeWrapper(queryClient) });

    result.current.mutate({ jobId: "job-1", fromStageId: "stage-interested", toStageId: "stage-applied", toIndex: 0 });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    // The mock server only updates this if it received the expected PATCH body.
    const updatedJob = jobsStore.find((j) => j.id === "job-1");
    expect(updatedJob?.stage_id).toBe("stage-applied");

    const cached = queryClient.getQueryData<Paginated<JobDetail>>(boardQueryKey({}));
    const cachedJob = cached?.items.find((j) => j.id === "job-1");
    expect(cachedJob?.stage_id).toBe("stage-applied");
  });

  it("rolls back the optimistic update when the move fails", async () => {
    server.use(
      http.patch("/api/jobs/:id/stage", () =>
        HttpResponse.json({ error: { code: "error", message: "boom", details: null } }, { status: 500 })
      )
    );

    const queryClient = new QueryClient({
      defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
    });
    seedBoardCache(queryClient, [...jobsStore]);

    let errorFired = false;
    const { result } = renderHook(
      () =>
        useMoveJob({}, () => {
          errorFired = true;
        }),
      { wrapper: makeWrapper(queryClient) }
    );

    result.current.mutate({ jobId: "job-1", fromStageId: "stage-interested", toStageId: "stage-applied", toIndex: 0 });

    await waitFor(() => expect(result.current.isError).toBe(true));
    expect(errorFired).toBe(true);

    const cached = queryClient.getQueryData<Paginated<JobDetail>>(boardQueryKey({}));
    const cachedJob = cached?.items.find((j) => j.id === "job-1");
    expect(cachedJob?.stage_id).toBe("stage-interested");
  });
});
