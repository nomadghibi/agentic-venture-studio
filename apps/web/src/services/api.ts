import type {
  Approval,
  ApprovalReviewInput,
  DashboardSummary,
  Opportunity,
  OpportunityCreateInput,
  OpportunityDecisionInput,
  OpportunityScoreInput,
  OpportunityStageTransitionInput,
  OpportunityTimelineItem,
  Venture,
  UserRole
} from "@avs/types";

const apiBaseUrl = process.env.API_BASE_URL ?? "http://localhost:4050/api/v1";
const devUserId = process.env.DEV_USER_ID ?? "web-founder";
const devUserRole = (process.env.DEV_USER_ROLE as UserRole | undefined) ?? "founder";
const devUserEmail = process.env.DEV_USER_EMAIL ?? "founder@agentic.local";

class ApiError extends Error {
  statusCode: number;

  constructor(statusCode: number, message: string) {
    super(message);
    this.name = "ApiError";
    this.statusCode = statusCode;
  }
}

type RequestOptions = {
  method?: "GET" | "POST" | "PATCH";
  body?: unknown;
};

type ApiEnvelope<T> = { data: T };
type ApiErrorEnvelope = { error?: { message?: string } };

function buildHeaders() {
  return {
    "content-type": "application/json",
    "x-user-id": devUserId,
    "x-user-role": devUserRole,
    "x-user-email": devUserEmail
  };
}

async function request<T>(path: string, options: RequestOptions = {}): Promise<T | null> {
  try {
    const response = await fetch(`${apiBaseUrl}${path}`, {
      method: options.method ?? "GET",
      cache: "no-store",
      headers: buildHeaders(),
      ...(options.body ? { body: JSON.stringify(options.body) } : {})
    });

    if (!response.ok) {
      return null;
    }

    const payload = (await response.json()) as ApiEnvelope<T>;
    return payload.data;
  } catch {
    return null;
  }
}

async function requestOrThrow<T>(path: string, options: RequestOptions = {}): Promise<T> {
  const response = await fetch(`${apiBaseUrl}${path}`, {
    method: options.method ?? "GET",
    cache: "no-store",
    headers: buildHeaders(),
    ...(options.body ? { body: JSON.stringify(options.body) } : {})
  });

  if (!response.ok) {
    let message = `Request failed (${response.status})`;

    try {
      const payload = (await response.json()) as ApiErrorEnvelope;
      if (payload.error?.message) {
        message = payload.error.message;
      }
    } catch {
      // ignore JSON parse errors
    }

    throw new ApiError(response.status, message);
  }

  const payload = (await response.json()) as ApiEnvelope<T>;
  return payload.data;
}

export async function fetchDashboardSummary(): Promise<DashboardSummary> {
  const data = await request<DashboardSummary>("/dashboard/summary");

  if (!data) {
    return {
      activeOpportunities: 0,
      awaitingApprovals: 0,
      liveVentures: 0,
      lowConfidenceRuns: 0
    };
  }

  return data;
}

export async function fetchOpportunities(): Promise<Opportunity[]> {
  const data = await request<Opportunity[]>("/opportunities");
  return data ?? [];
}

export async function createOpportunity(input: OpportunityCreateInput): Promise<Opportunity> {
  return requestOrThrow<Opportunity>("/opportunities", {
    method: "POST",
    body: input
  });
}

export async function scoreOpportunity(
  id: string,
  input: OpportunityScoreInput
): Promise<Opportunity> {
  return requestOrThrow<Opportunity>(`/opportunities/${id}/score`, {
    method: "PATCH",
    body: input
  });
}

export type StageTransitionResponse = {
  opportunity: Opportunity;
  approvalRequested: boolean;
  approvalId?: string;
};

export async function transitionOpportunityStage(
  id: string,
  input: OpportunityStageTransitionInput
): Promise<StageTransitionResponse> {
  return requestOrThrow<StageTransitionResponse>(`/opportunities/${id}/stage`, {
    method: "PATCH",
    body: input
  });
}

export type OpportunityDecisionResponse = {
  opportunity: Opportunity;
  decisionId: string;
};

export async function decideOpportunity(
  id: string,
  input: OpportunityDecisionInput
): Promise<OpportunityDecisionResponse> {
  return requestOrThrow<OpportunityDecisionResponse>(`/opportunities/${id}/decision`, {
    method: "POST",
    body: input
  });
}

export async function fetchOpportunityTimeline(id: string): Promise<OpportunityTimelineItem[]> {
  return requestOrThrow<OpportunityTimelineItem[]>(`/opportunities/${id}/timeline`, {
    method: "GET"
  });
}

export async function fetchOpportunityApprovals(id: string): Promise<Approval[]> {
  return requestOrThrow<Approval[]>(`/opportunities/${id}/approvals`, {
    method: "GET"
  });
}

export async function reviewApproval(id: string, input: ApprovalReviewInput): Promise<Approval> {
  return requestOrThrow<Approval>(`/approvals/${id}/review`, {
    method: "PATCH",
    body: input
  });
}

export async function fetchVentures(): Promise<Venture[]> {
  const data = await request<Venture[]>("/ventures");
  return data ?? [];
}

export async function fetchVenture(id: string): Promise<Venture | null> {
  const data = await request<Venture>(`/ventures/${id}`);
  return data ?? null;
}

export function getApiErrorMessage(error: unknown): string {
  if (error instanceof ApiError) {
    return error.message;
  }

  if (error instanceof Error) {
    return error.message;
  }

  return "Unknown API error";
}
