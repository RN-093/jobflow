import { api } from "@/api/client";
import type {
  Activity,
  Contact,
  ContactInput,
  Interview,
  InterviewInput,
  InterviewPatchInput,
  Note,
  NoteInput,
  Task,
  TaskInput,
  TaskPatchInput,
} from "@/types";

export function getTimeline(jobId: string): Promise<Activity[]> {
  return api.get<Activity[]>(`/jobs/${jobId}/timeline`);
}

export function listInterviews(jobId: string): Promise<Interview[]> {
  return api.get<Interview[]>(`/jobs/${jobId}/interviews`);
}
export function createInterview(jobId: string, input: InterviewInput): Promise<Interview> {
  return api.post<Interview>(`/jobs/${jobId}/interviews`, input);
}
export function updateInterview(jobId: string, id: string, input: InterviewPatchInput): Promise<Interview> {
  return api.patch<Interview>(`/jobs/${jobId}/interviews/${id}`, input);
}
export function deleteInterview(jobId: string, id: string): Promise<void> {
  return api.delete<void>(`/jobs/${jobId}/interviews/${id}`);
}

export function listContacts(jobId: string): Promise<Contact[]> {
  return api.get<Contact[]>(`/jobs/${jobId}/contacts`);
}
export function createContact(jobId: string, input: ContactInput): Promise<Contact> {
  return api.post<Contact>(`/jobs/${jobId}/contacts`, input);
}
export function updateContact(jobId: string, id: string, input: Partial<ContactInput>): Promise<Contact> {
  return api.patch<Contact>(`/jobs/${jobId}/contacts/${id}`, input);
}
export function deleteContact(jobId: string, id: string): Promise<void> {
  return api.delete<void>(`/jobs/${jobId}/contacts/${id}`);
}

export function listTasks(jobId: string): Promise<Task[]> {
  return api.get<Task[]>(`/jobs/${jobId}/tasks`);
}
export function createTask(jobId: string, input: TaskInput): Promise<Task> {
  return api.post<Task>(`/jobs/${jobId}/tasks`, input);
}
export function updateTask(jobId: string, id: string, input: TaskPatchInput): Promise<Task> {
  return api.patch<Task>(`/jobs/${jobId}/tasks/${id}`, input);
}
export function deleteTask(jobId: string, id: string): Promise<void> {
  return api.delete<void>(`/jobs/${jobId}/tasks/${id}`);
}

export function listNotes(jobId: string): Promise<Note[]> {
  return api.get<Note[]>(`/jobs/${jobId}/notes`);
}
export function createNote(jobId: string, input: NoteInput): Promise<Note> {
  return api.post<Note>(`/jobs/${jobId}/notes`, input);
}
export function updateNote(jobId: string, id: string, input: Partial<NoteInput>): Promise<Note> {
  return api.patch<Note>(`/jobs/${jobId}/notes/${id}`, input);
}
export function deleteNote(jobId: string, id: string): Promise<void> {
  return api.delete<void>(`/jobs/${jobId}/notes/${id}`);
}
