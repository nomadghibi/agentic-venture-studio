import { SectionNav } from "@/components/SectionNav";

const outcomeMetrics = [
  { label: "Core Decision Questions", value: "5" },
  { label: "Operating Stages", value: "9" },
  { label: "Venture Outcomes", value: "Scale / Kill" }
];

const operatingPillars = [
  {
    title: "Multi-Agent Venture Pipeline",
    description:
      "Turn online market signals into structured opportunities with research, product, architecture, and launch agents working in sequence."
  },
  {
    title: "Scoring, Approvals, and Artifacts",
    description:
      "Move ideas through explicit gates with confidence scores, approval checkpoints, and persistent decision artifacts."
  },
  {
    title: "Portfolio-Level Decisioning",
    description:
      "Treat each concept as a venture candidate, then decide to build, launch, scale, or kill based on measurable evidence."
  }
];

const executionFlow = [
  "Discover pain from market signals and recurring complaints.",
  "Validate whether demand is real and urgent enough to pay for.",
  "Assess buildability and technical feasibility for software delivery.",
  "Test monetization logic, pricing assumptions, and buyer motion.",
  "Design product scope and execution plan.",
  "Build MVP and launch into a defined channel.",
  "Launch with a deliberate go-to-market hypothesis.",
  "Measure traction against explicit success thresholds.",
  "Decide whether to scale, iterate, or kill."
];

const deliverables = [
  "Problem and demand validation dossier with supporting evidence.",
  "Feasibility assessment with architecture and risk analysis.",
  "MVP scope packet with product requirements and rollout plan.",
  "Launch and traction dashboard for portfolio-level decisions."
];

const decisionQuestions = [
  "What problem is worth solving?",
  "Is it a real market pain?",
  "Can it become software?",
  "Can that software make money?",
  "Should we build it, launch it, scale it, or kill it?"
];

const roleMappings = [
  {
    humanRole: "Researcher",
    systemRole: "Signal Discovery Agents",
    outcome: "Pain clusters and opportunity candidates."
  },
  {
    humanRole: "Product Manager",
    systemRole: "Validation and Scope Workflows",
    outcome: "Prioritized venture requirements and stage gates."
  },
  {
    humanRole: "Architect",
    systemRole: "Feasibility and Design Agents",
    outcome: "Buildability analysis with architecture artifacts."
  },
  {
    humanRole: "Engineers",
    systemRole: "MVP Build Pipelines",
    outcome: "Implementation plans and execution-ready handoff."
  },
  {
    humanRole: "Marketer",
    systemRole: "Launch and Experiment Workflows",
    outcome: "Channel tests, messaging hypotheses, and telemetry."
  },
  {
    humanRole: "Founder",
    systemRole: "Approval and Portfolio Dashboard",
    outcome: "Go/hold/kill decisions backed by evidence."
  }
];

const docsSurfaces = [
  {
    title: "Product Scope",
    description: "Core user journeys, operating model, and venture loop definitions.",
    path: "/docs/product/*"
  },
  {
    title: "Architecture",
    description: "Service boundaries, package responsibilities, and workflow contracts.",
    path: "/docs/architecture/*"
  },
  {
    title: "API Contract",
    description: "OpenAPI-aligned endpoints for opportunities, signals, and dashboards.",
    path: "/docs/api/OPENAPI.yaml"
  },
  {
    title: "Execution Plan",
    description: "Milestones, tasks, and rollout artifacts for implementation phases.",
    path: "/TASKS.md"
  }
];

export default function HomePage() {
  const year = new Date().getFullYear();

  return (
    <main className="landing-shell">
      <SectionNav />

      <section className="hero">
        <div className="hero-copy reveal reveal-1">
          <p className="kicker">AI-Native Venture Operating System</p>
          <h1>Build software ventures like a digital startup factory.</h1>
          <p className="hero-description">
            Agentic Venture Studio is a multi-agent platform for discovering, validating,
            designing, and managing new software opportunities from idea to launch.
          </p>
          <div className="hero-actions">
            <a href="/workspace" className="btn btn-primary">
              Open Founder Workspace
            </a>
            <a href="#how" className="btn btn-ghost">
              See Operating Loop
            </a>
          </div>
        </div>
        <aside className="hero-panel reveal reveal-2">
          <h2>Venture Portfolio Snapshot</h2>
          <ul>
            {outcomeMetrics.map((metric) => (
              <li key={metric.label}>
                <span>{metric.label}</span>
                <strong>{metric.value}</strong>
              </li>
            ))}
          </ul>
        </aside>
      </section>

      <section className="section reveal reveal-2" id="product">
        <div className="section-heading">
          <h2>Designed to run the full business loop, not just code generation</h2>
          <p>
            Replace fragmented tools with one venture pipeline that connects discovery,
            validation, build planning, launch operations, and scale-or-kill governance.
          </p>
        </div>
        <div className="pillar-grid">
          {operatingPillars.map((pillar) => (
            <article key={pillar.title} className="pillar-card">
              <h3>{pillar.title}</h3>
              <p>{pillar.description}</p>
            </article>
          ))}
        </div>
      </section>

      <section className="section reveal reveal-3" id="portfolio">
        <div className="section-heading">
          <h2>From human startup roles to systemized venture operations</h2>
          <p>
            A traditional team can execute this manually. Agentic Venture Studio turns the same
            roles into repeatable workflows with shared scoring and approvals.
          </p>
        </div>
        <div className="mapping-grid">
          {roleMappings.map((mapping) => (
            <article key={mapping.humanRole} className="mapping-card">
              <p className="mapping-human">{mapping.humanRole}</p>
              <h3>{mapping.systemRole}</h3>
              <p>{mapping.outcome}</p>
            </article>
          ))}
        </div>
      </section>

      <section className="section section-muted reveal reveal-3">
        <div className="section-heading">
          <h2>The five questions this platform keeps answering</h2>
        </div>
        <ol className="question-list">
          {decisionQuestions.map((question) => (
            <li key={question}>{question}</li>
          ))}
        </ol>
      </section>

      <section className="section section-contrast reveal reveal-4" id="how">
        <div className="split">
          <div>
            <h2>Core operating loop</h2>
            <ol className="flow-list">
              {executionFlow.map((step) => (
                <li key={step}>{step}</li>
              ))}
            </ol>
          </div>
          <div>
            <h3>System artifacts produced</h3>
            <ul className="deliverable-list">
              {deliverables.map((item) => (
                <li key={item}>{item}</li>
              ))}
            </ul>
          </div>
        </div>
      </section>

      <section className="section section-muted reveal reveal-4" id="docs">
        <div className="section-heading">
          <h2>Documentation surfaces for product and engineering teams</h2>
          <p>
            The studio ships with structured docs so founders, product, and engineering can
            collaborate against the same artifacts and decision context.
          </p>
        </div>
        <div className="docs-grid">
          {docsSurfaces.map((doc) => (
            <article key={doc.title} className="docs-card">
              <h3>{doc.title}</h3>
              <p>{doc.description}</p>
              <code>{doc.path}</code>
            </article>
          ))}
        </div>
      </section>

      <section className="section cta reveal reveal-4">
        <h2>From market signal to venture decision in one system.</h2>
        <p>
          Use structured agents, workflows, approvals, and scoring to repeatedly answer:
          what to build, what to launch, and what to stop.
        </p>
        <a href="/workspace" className="btn btn-primary">
          Launch Workspace
        </a>
      </section>

      <footer className="landing-footer">
        <small>{year} Agentic Venture Studio</small>
      </footer>
    </main>
  );
}
