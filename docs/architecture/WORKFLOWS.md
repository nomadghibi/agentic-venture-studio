# WORKFLOWS.md

## 1. Primary Workflow: Signal to Opportunity
Steps:
1. Ingest source content
2. Normalize and tag source data
3. Cluster related pain signals
4. Generate candidate problem statements
5. Score basic opportunity quality
6. Store opportunity record
7. Route to validation queue

## 2. Validation Workflow
Steps:
1. Retrieve opportunity candidate
2. Run competitor and pricing scan
3. Generate market summary
4. Validate urgency, frequency, and buyer clarity
5. Compute validation scores
6. Produce validation report
7. Submit for Gate B review

Decision outcomes:
- reject
- monitor
- advance to feasibility

## 3. Feasibility Workflow
Steps:
1. Analyze software wedge
2. Identify core workflow
3. Separate MVP from long-term platform
4. Identify dependencies and integrations
5. Estimate implementation complexity
6. Generate technical risk register
7. Produce feasibility report

Decision outcomes:
- reject
- redesign
- advance to monetization

## 4. Monetization Workflow
Steps:
1. Identify likely buyer and budget sensitivity
2. Compare pricing patterns in adjacent products
3. Recommend pricing model
4. Estimate conversion logic and early unit economics
5. Produce monetization report
6. Submit for Gate D review

## 5. Product Design Workflow
Steps:
1. Convert approved opportunity into product thesis
2. Define personas and jobs-to-be-done
3. Define user journey
4. Create MVP features and exclusions
5. Generate PRD
6. Generate architecture
7. Generate workflows and prompt contracts
8. Route for build approval

## 6. Build Workflow
Steps:
1. Create repo/workspace plan
2. Generate backend and frontend scaffold
3. Implement core workflow slice
4. Add schemas, auth, analytics, logs
5. Generate tests
6. Run QA review
7. Produce readiness report

## 7. Launch Workflow
Steps:
1. Prepare positioning and messaging
2. Generate launch page copy
3. Define acquisition channels
4. Set instrumentation and KPIs
5. Approve launch
6. Release and track metrics

## 8. Venture Review Workflow
Steps:
1. Collect activation and usage data
2. Compare against thresholds
3. Evaluate support burden and monetization
4. Produce recommendation: scale / improve / pivot / kill
5. Submit to portfolio review

## 9. Portfolio Review Workflow
Steps:
1. Pull all active and pending ventures
2. Compare score, stage, cost, and performance
3. Rank by expected ROI and strategic fit
4. Recommend allocation changes
5. Archive decisions

## 10. Approval Workflow
Triggers:
- stage transition
- build approval
- launch approval
- major budget threshold
- kill decision

Approval states:
- pending
- approved
- rejected
- needs changes
