import type {
  Approval,
  ApprovalReviewInput,
  AuthLoginInput,
  AuthRegisterInput,
  AuthSession,
  CreateWorkspaceInput,
  DashboardSummary,
  ForgotPasswordInput,
  Opportunity,
  OpportunityCreateInput,
  OpportunityDecisionInput,
  OpportunityScoreInput,
  OpportunityStageTransitionInput,
  OpportunityTimelineItem,
  PrdContent,
  ResetPasswordInput,
  Signal,
  Venture,
  Workspace
} from "@avs/types";

const rawApiBaseUrl =
  process.env.NEXT_PUBLIC_API_BASE_URL ??
  "http://localhost:4050/api/v1";

const apiBaseUrl = rawApiBaseUrl.replace(/\/+$/, "");

class ApiError extends Error {
  statusCode: number;

  constructor(statusCode: number, message: string) {
    super(message);
    this.name = "ApiError";
    this.statusCode = statusCode;
  }
}

type RequestMethod = "GET" | "POST" | "PATCH";

type RequestOptions = {
  method?: RequestMethod;
  body?: unknown;
};

type ApiEnvelope<T> = { data: T };
type ApiErrorEnvelope = { error?: { message?: string } };

async function request<T>(path: string, options: RequestOptions = {}): Promise<T | null> {
  try {
    const hasBody = options.body !== undefined;
    const response = await fetch(`${apiBaseUrl}${path}`, {
      method: options.method ?? "GET",
      cache: "no-store",
      credentials: "include",
      ...(hasBody
        ? {
            headers: { "content-type": "application/json" },
            body: JSON.stringify(options.body)
          }
        : {})
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
  const hasBody = options.body !== undefined;
  const response = await fetch(`${apiBaseUrl}${path}`, {
    method: options.method ?? "GET",
    cache: "no-store",
    credentials: "include",
    ...(hasBody
      ? {
          headers: { "content-type": "application/json" },
          body: JSON.stringify(options.body)
        }
      : {})
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

export async function register(input: AuthRegisterInput): Promise<AuthSession> {
  return requestOrThrow<AuthSession>("/auth/register", {
    method: "POST",
    body: input
  });
}

export async function login(input: AuthLoginInput): Promise<AuthSession> {
  return requestOrThrow<AuthSession>("/auth/login", {
    method: "POST",
    body: input
  });
}

export async function logout(): Promise<void> {
  await requestOrThrow<{ ok: boolean }>("/auth/logout", {
    method: "POST"
  });
}

export async function forgotPassword(input: ForgotPasswordInput): Promise<void> {
  await requestOrThrow<{ ok: boolean }>("/auth/forgot-password", {
    method: "POST",
    body: input
  });
}

export async function resetPassword(input: ResetPasswordInput): Promise<void> {
  await requestOrThrow<{ ok: boolean }>("/auth/reset-password", {
    method: "POST",
    body: input
  });
}

export async function fetchSession(): Promise<AuthSession | null> {
  return request<AuthSession>("/auth/me");
}

export type WorkspaceOptionsResponse = {
  workspaces: Workspace[];
  currentWorkspaceId: string;
};

export async function fetchWorkspaceOptions(): Promise<WorkspaceOptionsResponse> {
  return requestOrThrow<WorkspaceOptionsResponse>("/workspaces");
}

export type WorkspaceSelectionResponse = {
  session: AuthSession;
  workspaces: Workspace[];
  currentWorkspaceId: string;
};

export async function createWorkspace(input: CreateWorkspaceInput): Promise<WorkspaceSelectionResponse> {
  return requestOrThrow<WorkspaceSelectionResponse>("/workspaces", {
    method: "POST",
    body: input
  });
}

export async function selectWorkspace(workspaceId: string): Promise<WorkspaceSelectionResponse> {
  return requestOrThrow<WorkspaceSelectionResponse>(`/workspaces/${workspaceId}/select`, {
    method: "POST"
  });
}

export async function fetchDashboardSummary(): Promise<DashboardSummary> {
  return requestOrThrow<DashboardSummary>("/dashboard/summary");
}

export async function fetchOpportunities(): Promise<Opportunity[]> {
  return requestOrThrow<Opportunity[]>("/opportunities");
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

export async function fetchSignals(): Promise<Signal[]> {
  return requestOrThrow<Signal[]>("/signals");
}

export async function fetchOpportunitySignals(opportunityId: string): Promise<Signal[]> {
  return requestOrThrow<Signal[]>(`/opportunities/${opportunityId}/signals`);
}

export async function fetchOpportunity(id: string): Promise<Opportunity> {
  return requestOrThrow<Opportunity>(`/opportunities/${id}`);
}

export type PrdArtifact = {
  id: string;
  version: number;
  createdAt: string;
  content: PrdContent;
};

export async function fetchPrd(opportunityId: string): Promise<PrdArtifact | null> {
  return request<PrdArtifact>(`/opportunities/${opportunityId}/prd`);
}

export async function generatePrd(opportunityId: string): Promise<{ queued: boolean }> {
  return requestOrThrow<{ queued: boolean }>(`/opportunities/${opportunityId}/prd`, {
    method: "POST"
  });
}

export type IngestSignalInput = {
  sourceType: string;
  sourceTitle?: string;
  sourceUrl?: string;
  contentExcerpt: string;
  opportunityId?: string;
};

export async function ingestSignal(input: IngestSignalInput): Promise<Signal> {
  const result = await requestOrThrow<Signal & { queued: boolean }>("/signals", {
    method: "POST",
    body: input
  });
  return result;
}

export async function fetchVentures(): Promise<Venture[]> {
  return requestOrThrow<Venture[]>("/ventures");
}

export async function fetchVenture(id: string): Promise<Venture | null> {
  return request<Venture>(`/ventures/${id}`);
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

export function getApiStatusCode(error: unknown): number | null {
  if (error instanceof ApiError) {
    return error.statusCode;
  }

  return null;
}
