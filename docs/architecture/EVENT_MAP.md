# EVENT_MAP.md

## Purpose
This document maps the main domain events, producers, consumers, and side effects for Agentic Venture Studio.

## Event Design Rules
1. Events describe something that already happened.
2. Events are append-only.
3. Consumers must be idempotent.
4. Major state transitions should emit an event.
5. Every event should carry correlation metadata.

## Core Events

### signal.ingested
**Producer:** Ingestion Service  
**Consumers:** Opportunity Discovery Agent, audit log, ingestion metrics  
**Payload:** signal id, source_type, capture metadata  
**Side effects:** candidate discovery job may be queued

### opportunity.created
**Producer:** Opportunity Service  
**Consumers:** scoring engine, pipeline UI, knowledge service  
**Payload:** opportunity id, problem statement, target buyer

### opportunity.scored
**Producer:** Scoring Engine  
**Consumers:** dashboard, ranking views, validation queue  
**Payload:** score breakdown, overall score, confidence

### validation.requested
**Producer:** Workflow Orchestrator  
**Consumers:** Market Research Agent, Problem Validation Agent

### validation.completed
**Producer:** Problem Validation Agent / Report Service  
**Consumers:** approval queue, artifact recommendations, audit log  
**Payload:** validation report id, decision recommendation

### feasibility.requested
**Producer:** Workflow Orchestrator  
**Consumers:** Buildability Agent

### feasibility.completed
**Producer:** Buildability Agent / Report Service  
**Consumers:** approval queue, scoring refresh  
**Payload:** feasibility score, MVP wedge, technical risks

### monetization.requested
**Producer:** Workflow Orchestrator  
**Consumers:** Monetization Agent

### monetization.completed
**Producer:** Monetization Agent / Report Service  
**Consumers:** approval queue, scoring refresh  
**Payload:** pricing model, WTP confidence, decision recommendation

### artifact.generation_requested
**Producer:** User action / Workflow Orchestrator  
**Consumers:** Product Strategy Agent, Architecture Agent, doc generation service

### artifact.generated
**Producer:** Artifact Generation Service  
**Consumers:** artifact viewer, approval queue, knowledge service  
**Payload:** artifact id, artifact type, version

### approval.requested
**Producer:** Workflow Orchestrator or user action  
**Consumers:** Approval Service, reviewer dashboard

### approval.reviewed
**Producer:** Approval Service  
**Consumers:** Workflow Orchestrator, notifications, decision journal  
**Payload:** approval id, status, notes

### venture.created
**Producer:** Venture Service  
**Consumers:** portfolio dashboard, launch planning, metrics service

### venture.stage_changed
**Producer:** Venture Service  
**Consumers:** portfolio dashboard, decision journal, notifications

### launch.started
**Producer:** Launch Service  
**Consumers:** analytics setup, experiment tracker

### metrics.updated
**Producer:** Metrics Service  
**Consumers:** Revenue Intelligence Agent, portfolio views

### venture.review_completed
**Producer:** Revenue Intelligence Agent  
**Consumers:** Portfolio Manager Agent, approval queue

### portfolio.review_completed
**Producer:** Portfolio Manager Agent  
**Consumers:** founder dashboard, decision records, resource planning

## Suggested Correlation Flows
- discovery cycle correlation id
- opportunity validation correlation id
- artifact generation correlation id
- venture review correlation id

## Retry / Failure Guidance
- emit `.failed` companion events for major async failures where needed
- retries should not duplicate downstream state mutations
- event consumers should de-duplicate using event id + entity id

## MVP Event Set
For MVP, prioritize:
- signal.ingested
- opportunity.created
- opportunity.scored
- validation.completed
- feasibility.completed
- monetization.completed
- artifact.generated
- approval.reviewed
- venture.created
- metrics.updated
