type ApprovalQueuePreviewProps = {
  awaitingApprovals: number;
};

export function ApprovalQueuePreview({ awaitingApprovals }: ApprovalQueuePreviewProps) {
  return (
    <article className="panel">
      <h2>Approval Queue</h2>
      <p>
        {awaitingApprovals} items waiting for review.
      </p>
      <p>
        Reviews are gated by role-based approvals (Product, Architecture, Finance).
      </p>
    </article>
  );
}
