import { Response } from "@sendgrid/helpers/classes";

export interface List {
  id: string;
  name: string;
  contact_count: number;
}

export type ListResponse = Response<List>;
export type ListsResponse = Response<{ result: List[] }>;
export type CreateListResponse = Response<List>;
