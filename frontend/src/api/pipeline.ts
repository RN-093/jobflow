import { api } from "@/api/client";
import type { InterviewTypes, Source, Stage, StageInput, StagePatchInput } from "@/types";

export function listStages(): Promise<Stage[]> {
  return api.get<Stage[]>("/pipeline/stages");
}

export function createStage(input: StageInput): Promise<Stage> {
  return api.post<Stage>("/pipeline/stages", input);
}

export function updateStage(id: string, input: StagePatchInput): Promise<Stage> {
  return api.patch<Stage>(`/pipeline/stages/${id}`, input);
}

export function deleteStage(id: string): Promise<void> {
  return api.delete<void>(`/pipeline/stages/${id}`);
}

export function reorderStages(orderedIds: string[]): Promise<Stage[]> {
  return api.patch<Stage[]>("/pipeline/stages/reorder", { ordered_ids: orderedIds });
}

export function listSources(): Promise<Source[]> {
  return api.get<Source[]>("/sources");
}

export function createSource(name: string): Promise<Source> {
  return api.post<Source>("/sources", { name });
}

export function getInterviewTypes(): Promise<InterviewTypes> {
  return api.get<InterviewTypes>("/interview-types");
}
