import { useQuery } from "@tanstack/react-query";

import * as childrenApi from "@/api/children";
import * as jobsApi from "@/api/jobs";

export function useJob(jobId: string | undefined) {
  return useQuery({
    queryKey: ["job", jobId],
    queryFn: () => jobsApi.getJob(jobId as string),
    enabled: !!jobId,
  });
}

export function useTimeline(jobId: string | undefined) {
  return useQuery({
    queryKey: ["timeline", jobId],
    queryFn: () => childrenApi.getTimeline(jobId as string),
    enabled: !!jobId,
  });
}

export function useInterviews(jobId: string | undefined) {
  return useQuery({
    queryKey: ["interviews", jobId],
    queryFn: () => childrenApi.listInterviews(jobId as string),
    enabled: !!jobId,
  });
}

export function useContacts(jobId: string | undefined) {
  return useQuery({
    queryKey: ["contacts", jobId],
    queryFn: () => childrenApi.listContacts(jobId as string),
    enabled: !!jobId,
  });
}

export function useTasks(jobId: string | undefined) {
  return useQuery({
    queryKey: ["tasks", jobId],
    queryFn: () => childrenApi.listTasks(jobId as string),
    enabled: !!jobId,
  });
}

export function useNotes(jobId: string | undefined) {
  return useQuery({
    queryKey: ["notes", jobId],
    queryFn: () => childrenApi.listNotes(jobId as string),
    enabled: !!jobId,
  });
}
