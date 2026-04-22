export interface DomainEvent<TPayload = unknown> {
  type: string;
  entityType: string;
  entityId: string;
  payload: TPayload;
  occurredAt: string;
}

export function buildEvent<TPayload>(
  type: string,
  entityType: string,
  entityId: string,
  payload: TPayload
): DomainEvent<TPayload> {
  return {
    type,
    entityType,
    entityId,
    payload,
    occurredAt: new Date().toISOString()
  };
}
