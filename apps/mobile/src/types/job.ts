export interface Worker {
  id: string | number;
  name: string;
}

export interface Client {
  id: string | number;
  name: string;
}

export interface Message {
  id: number;
  content: string;
}

export interface Review {
  id: number;
  rating: number;
  comment?: string;
}

export interface Dispute {
  id: number;
  reason: string;
}

export interface MessageCount {
  messages: number;
  bids: number;
}

export type JobStatus =
  | "PENDING"
  | "IN_PROGRESS"
  | "COMPLETED"
  | "PAID"
  | "CANCELLED"
  | "DISPUTED";

export interface Job {
  id: string | number;
  title: string;
  budget: number;
  status: JobStatus;
  clientId: string | number;
  workerId?: string | number;
  worker?: Worker;
  client: Client;
  messages: Message[];
  _count: MessageCount;
  createdAt: string;
  review?: Review;
  dispute?: Dispute;
}

export interface RatingModalState {
  visible: boolean;
  selectedJob: Job | null;
  rating: number;
  comment: string;
}

export interface DisputeModalState {
  visible: boolean;
  disputeJob: Job | null;
  disputeReason: string;
  submittingDispute: boolean;
}
