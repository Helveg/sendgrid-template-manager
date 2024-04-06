import { Response } from "@sendgrid/helpers/classes";

export type CountContactsResponse = Response<{
  contact_count: number;
  billable_count: number;
  billable_breakdown: {
    total: number;
    breakdown: Record<string, number>;
  };
}>;

export type UploadContactsResponse = Response<{
  job_id: string;
  upload_uri: string;
  upload_headers: string[];
}>;

export interface UploadContactsOptions {
  lists?: string[];
}

export interface UploadContactsJob {
  path: string;
  job_id: string;
  upload_uri: string;
  upload_headers: { header: string; value: string }[];
}
