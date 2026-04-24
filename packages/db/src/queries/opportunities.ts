export const listOpportunitiesSql = `
  SELECT
    id,
    title,
    problem_statement,
    target_buyer,
    industry,
    status,
    current_stage,
    pain_score,
    frequency_score,
    buyer_clarity_score,
    willingness_to_pay_score,
    feasibility_score,
    distribution_score,
    strategic_fit_score,
    portfolio_value_score,
    overall_score,
    confidence_level,
    created_at,
    updated_at
  FROM opportunities
  WHERE workspace_id = $1
  ORDER BY overall_score DESC NULLS LAST, created_at DESC
  LIMIT $2 OFFSET $3
`;
