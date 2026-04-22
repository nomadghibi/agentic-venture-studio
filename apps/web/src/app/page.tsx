import { SectionNav } from "@/components/SectionNav";

const heroMetrics = [
  { label: "Validation Dimensions", value: "7" },
  { label: "Core Decision", value: "Build / Pause / Kill" },
  { label: "Primary Output", value: "PRD + Architecture + MVP Plan" }
];

const coreBenefits = [
  {
    title: "Validate faster",
    description:
      "Turn a rough idea into a structured venture decision in minutes instead of days of scattered research."
  },
  {
    title: "Reduce bad builds",
    description:
      "Score demand, feasibility, and monetization before committing build time, budget, or engineering focus."
  },
  {
    title: "Start with clarity",
    description:
      "Generate a build-ready PRD, architecture direction, and MVP roadmap that your team can execute immediately."
  }
];

const icpTraits = [
  "Solo founders and small founding teams building SaaS products.",
  "Operators with many ideas but no repeatable way to prioritize them.",
  "Builders already using AI tools who want structured decision workflows.",
  "Teams willing to pay for faster validation and fewer wasted builds."
];

const validationWorkflow = [
  "Idea intake with problem, buyer, and market context.",
  "Market pain and demand validation with evidence framing.",
  "Technical feasibility scoring for realistic build execution.",
  "Monetization and pricing logic analysis.",
  "PRD generation for clear product requirements.",
  "Architecture and MVP roadmap generation.",
  "Final recommendation: build, pause, or kill."
];

const pricingPlans = [
  {
    name: "Starter",
    price: "$29",
    cadence: "/month",
    summary: "For solo founders validating a few ideas each month.",
    features: [
      "Limited validation runs",
      "Core scoring and decision output",
      "PRD generation",
      "Workspace history"
    ]
  },
  {
    name: "Pro",
    price: "$79",
    cadence: "/month",
    summary: "For fast-moving builders running multiple ideas in parallel.",
    features: [
      "Higher run limits",
      "Full feasibility and monetization analysis",
      "Architecture and MVP roadmap outputs",
      "Artifact history and comparisons"
    ]
  },
  {
    name: "Studio",
    price: "$199",
    cadence: "/month",
    summary: "For teams coordinating decisions and approvals together.",
    features: [
      "Team seats and shared workspace",
      "Approval workflow",
      "Export and share options",
      "Portfolio tracking views"
    ]
  }
];

const objectionsAndAnswers = [
  {
    objection: "Why not just use ChatGPT manually?",
    answer:
      "This is not a generic chat flow. It provides structured scoring, repeatable evaluation, linked artifacts, and a consistent decision trail."
  },
  {
    objection: "Can I trust the output?",
    answer:
      "Every result includes evidence framing, assumptions, confidence signals, and explicit reports designed for founder review."
  },
  {
    objection: "I already know my idea.",
    answer:
      "The value is proving whether the idea is worth building now, what the MVP should be, and what to avoid before spending real time and money."
  }
];

const founderInterviewQuestions = [
  "What part of this workspace feels most valuable?",
  "What concrete result would make you pay for this?",
  "Would you use this before coding, during planning, or throughout building?",
  "Would you prefer monthly pricing or pay-per-report?",
  "What would increase your trust in recommendations?",
  "What would stop you from paying?",
  "Which output matters most: validation, feasibility, monetization, PRD, or roadmap?",
  "Would you use this more than once per month?",
  "What manual workflow does this replace for you today?",
  "What is missing for this to become a must-have?"
];

const launchPlan = [
  "Week 1: tighten messaging to AI Venture Validation Workspace, simplify page, prepare one polished demo.",
  "Week 2: run founder demos, collect objections, and test willingness to pay verbally.",
  "Week 3: cut low-value features, strengthen the highest-value workflow, improve trust signals.",
  "Week 4: convert early users to paid plans and document onboarding friction."
];

export default function HomePage() {
  const year = new Date().getFullYear();

  return (
    <main className="landing-shell">
      <SectionNav />

      <section className="hero">
        <div className="hero-copy reveal reveal-1">
          <p className="kicker">AI Venture Validation Workspace For Founders</p>
          <h1>Validate startup ideas before you waste weeks building them.</h1>
          <p className="hero-description">
            Agentic Venture Studio helps founders score market pain, test feasibility,
            estimate monetization, and generate build-ready product docs before they commit
            engineering time and capital.
          </p>
          <div className="hero-actions">
            <a href="/workspace" className="btn btn-primary">
              Open Validation Workspace
            </a>
            <a href="#workflow" className="btn btn-ghost">
              See Validation Flow
            </a>
          </div>
        </div>
        <aside className="hero-panel reveal reveal-2">
          <h2>What Founders Get</h2>
          <ul>
            {heroMetrics.map((metric) => (
              <li key={metric.label}>
                <span>{metric.label}</span>
                <strong>{metric.value}</strong>
              </li>
            ))}
          </ul>
        </aside>
      </section>

      <section className="section reveal reveal-2" id="why">
        <div className="section-heading">
          <h2>The paid wedge: clear value before any autonomous builder story</h2>
          <p>
            Start narrow and high-value: help founders decide what is worth building.
            Lead with outcomes, not agent terminology.
          </p>
        </div>
        <div className="pillar-grid">
          {coreBenefits.map((benefit) => (
            <article key={benefit.title} className="pillar-card">
              <h3>{benefit.title}</h3>
              <p>{benefit.description}</p>
            </article>
          ))}
        </div>
      </section>

      <section className="section section-muted reveal reveal-3">
        <div className="section-heading">
          <h2>Best first ICP: solo founders and small SaaS teams</h2>
          <p>
            Prioritize founders who move quickly, already use AI tools, and need
            repeatable validation discipline before they build.
          </p>
        </div>
        <ol className="question-list">
          {icpTraits.map((trait) => (
            <li key={trait}>{trait}</li>
          ))}
        </ol>
      </section>

      <section className="section section-contrast reveal reveal-3" id="workflow">
        <div className="split">
          <div>
            <h2>Core validation workflow</h2>
            <ol className="flow-list">
              {validationWorkflow.map((step) => (
                <li key={step}>{step}</li>
              ))}
            </ol>
          </div>
          <div>
            <h3>Commercial promise</h3>
            <ul className="deliverable-list">
              <li>Bring an idea into one workspace.</li>
              <li>Receive scored demand, feasibility, and monetization outputs.</li>
              <li>Get a PRD, architecture direction, and MVP execution plan.</li>
              <li>Make a disciplined build, pause, or kill decision.</li>
            </ul>
          </div>
        </div>
      </section>

      <section className="section reveal reveal-4" id="pricing">
        <div className="section-heading">
          <h2>Founder-friendly pricing to validate commercial demand quickly</h2>
          <p>
            Start with subscription tiers and usage limits. If retention is weak,
            test a credit-based report model as a follow-up.
          </p>
        </div>
        <div className="mapping-grid">
          {pricingPlans.map((plan) => (
            <article key={plan.name} className="mapping-card pricing-card">
              <p className="mapping-human">{plan.name}</p>
              <h3 className="plan-price">
                {plan.price}
                <span>{plan.cadence}</span>
              </h3>
              <p>{plan.summary}</p>
              <ul className="plan-list">
                {plan.features.map((feature) => (
                  <li key={feature}>{feature}</li>
                ))}
              </ul>
            </article>
          ))}
        </div>
      </section>

      <section className="section section-muted reveal reveal-4">
        <div className="section-heading">
          <h2>Top objections and trust positioning</h2>
        </div>
        <div className="pillar-grid">
          {objectionsAndAnswers.map((item) => (
            <article key={item.objection} className="pillar-card">
              <h3>{item.objection}</h3>
              <p>{item.answer}</p>
            </article>
          ))}
        </div>
      </section>

      <section className="section section-contrast reveal reveal-4" id="demo">
        <div className="split">
          <div>
            <h2>Founder demo and discovery interviews</h2>
            <ol className="flow-list">
              {founderInterviewQuestions.map((question) => (
                <li key={question}>{question}</li>
              ))}
            </ol>
          </div>
          <div>
            <h3>30-day go-to-market sprint</h3>
            <ul className="deliverable-list">
              {launchPlan.map((step) => (
                <li key={step}>{step}</li>
              ))}
            </ul>
          </div>
        </div>
      </section>

      <section className="section cta reveal reveal-4">
        <h2>Turn rough software ideas into scored, build-ready plans.</h2>
        <p>
          Keep the long-term brand, but sell the wedge now: an AI Venture Validation
          Workspace founders can trust before they commit build resources.
        </p>
        <a href="/workspace" className="btn btn-primary">
          Start In Workspace
        </a>
      </section>

      <footer className="landing-footer">
        <small>{year} Agentic Venture Studio</small>
      </footer>
    </main>
  );
}
