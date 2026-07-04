// ============================================================
// Tashyeed — Default 10 Business Planning Steps
// ============================================================
// These are the canonical step definitions used when a new
// Business is created and its plan is generated.
// Each step maps 1-to-1 with the PlanStep model fields.

export interface DefaultStep {
  stepNumber: number
  title: string
  description: string
  category: string
  guidance: string
  tips: string
  checklist: string[]
  resources: string[]
  estimatedDays: number
}

export const DEFAULT_BUSINESS_STEPS: DefaultStep[] = [
  // ── Step 1 ──────────────────────────────────────────────────
  {
    stepNumber: 1,
    title: 'Market Research & Validation',
    description:
      'Validate that your business idea solves a real, urgent problem before investing time and capital. This step grounds every future decision in evidence rather than assumptions.',
    category: 'research',
    guidance:
      'Before investing time and money, validate that your business idea solves a real problem. Start by defining your Ideal Customer Profile (ICP), then conduct interviews and surveys to test your assumptions. Use competitive analysis to understand the landscape and identify gaps you can exploit. Remember: data beats intuition at this stage.',
    tips:
      'Start with "mom test" interviews — ask about past behaviour, not future promises. Use the Jobs-to-be-Done framework to uncover the real reasons customers "hire" a product. Aim for at least 20 conversations before drawing conclusions; pattern-matching across interviews is where the real insights emerge.',
    checklist: [
      'Define your target customer persona (demographics, psychographics, pain points)',
      'Conduct 20+ customer discovery interviews',
      'Analyse the competitive landscape (direct, indirect, adjacent competitors)',
      'Estimate market size using TAM / SAM / SOM methodology',
      'Validate problem-solution fit with a landing-page smoke test',
      'Document key assumptions and rank them by risk',
    ],
    resources: [
      'The Mom Test by Rob Fitzpatrick — interview techniques',
      'Y Combinator Startup School — free validation curriculum',
      'CB Insights — competitor and market research database',
      'Google Trends & Statista — market size and search demand data',
    ],
    estimatedDays: 7,
  },

  // ── Step 2 ──────────────────────────────────────────────────
  {
    stepNumber: 2,
    title: 'Value Proposition & Positioning',
    description:
      'Craft a compelling, differentiated value proposition and position your brand in the minds of your target audience. Clarity here drives every marketing and product decision that follows.',
    category: 'strategy',
    guidance:
      'Your value proposition is the single clearest statement of why a customer should choose you over every alternative — including doing nothing. Use frameworks like the Value Proposition Canvas to map customer pains, gains, and jobs to your product features. Positioning defines the context in which your value prop is understood; choose a market frame of reference where you can win.',
    tips:
      'Write your value proposition in 10 words or fewer. If you can\'t, it\'s not clear enough. Avoid generic claims like "faster" or "easier" — be specific ("10× faster" or "saves 5 hrs/week"). Test multiple positioning statements with real prospects and measure which one drives the highest intent signal.',
    checklist: [
      'Complete a Value Proposition Canvas (customer profile + value map)',
      'Draft 3 alternative value proposition statements',
      'Identify your unique differentiation vs. top 3 competitors',
      'Define your positioning statement (for [target] who [need], we are [category] that [benefit])',
      'Test value proposition with 10+ prospects and gather feedback',
      'Create a one-page brand positioning document',
    ],
    resources: [
      'Value Proposition Design by Strategyzer — canvas & exercises',
      'Obviously Awesome by April Dunford — positioning playbook',
      'Wynter — messaging testing platform',
      'StoryBrand framework — narrative-driven positioning',
    ],
    estimatedDays: 5,
  },

  // ── Step 3 ──────────────────────────────────────────────────
  {
    stepNumber: 3,
    title: 'Business Model Design',
    description:
      'Architect a sustainable, scalable business model that connects your value proposition to revenue. The right model compounds growth; the wrong one creates friction at every stage.',
    category: 'strategy',
    guidance:
      'A business model describes how your company creates, delivers, and captures value. Use the Business Model Canvas to map all nine building blocks — from customer segments and channels to cost structure and revenue streams. Test different revenue models (subscription, freemium, marketplace, etc.) against your market and pricing sensitivity. The best model aligns customer willingness-to-pay with your cost economics.',
    tips:
      'Match your revenue model to your value metric — charge for the unit of value the customer receives. Subscription works for ongoing pain; one-time works for resolved pain. Always model LTV:CAC at 3:1 or better before committing to a model. Consider a "land and expand" motion if your product has natural virality or network effects.',
    checklist: [
      'Fill out a full Business Model Canvas',
      'Select and validate your primary revenue model',
      'Map your unit economics (CAC, LTV, payback period, margin)',
      'Identify key partnerships and channel strategies',
      'Stress-test the model with worst-case / best-case scenarios',
      'Document the flywheel or growth loop that sustains the business',
    ],
    resources: [
      'Business Model Generation by Osterwalder & Pigneur',
      'Pricing Page Teardown by ProfitWell — revenue model examples',
      'LTV:CAC Calculator (Baremetrics / ChartMogul)',
      'Strategyzer — free canvas templates and case studies',
    ],
    estimatedDays: 6,
  },

  // ── Step 4 ──────────────────────────────────────────────────
  {
    stepNumber: 4,
    title: 'Financial Planning & Projections',
    description:
      'Build a financial foundation with realistic projections, cash-flow planning, and scenario analysis. Numbers tell the story that words can\'t — and they keep you alive.',
    category: 'financial',
    guidance:
      'Financial planning turns strategy into numbers. Start with your burn rate and runway — how long can you survive before revenue or funding kicks in? Build a 12-to-36-month projection covering revenue, expenses, and cash flow. Create three scenarios: conservative, moderate, and aggressive. Include unit economics, break-even analysis, and key financial ratios that investors and advisors will scrutinise.',
    tips:
      'Always know your monthly burn rate and runway in months — this is your financial heartbeat. Build projections from the bottom up (per-unit economics) not just top down (% of market). Add a 20-30% buffer to expenses and a 20-30% haircut to revenue assumptions — optimism bias is real and expensive.',
    checklist: [
      'Calculate current monthly burn rate and cash runway',
      'Build a 12-month P&L projection (revenue, COGS, OpEx)',
      'Create a cash-flow forecast with monthly granularity',
      'Run break-even analysis (units and revenue thresholds)',
      'Model three scenarios: conservative, moderate, aggressive',
      'Define key financial KPIs (MRR, gross margin, LTV, CAC, payback)',
    ],
    resources: [
      'Financial Modeling for Startups (Captable.io / Eqvista)',
      'Paul Graham — Startup Growth & Burn Rate essays',
      'Causal or Pry — scenario modelling tools',
      'Brex / Mercury — startup banking with built-in analytics',
    ],
    estimatedDays: 7,
  },

  // ── Step 5 ──────────────────────────────────────────────────
  {
    stepNumber: 5,
    title: 'Legal & Compliance',
    description:
      'Establish the legal and regulatory foundation that protects your business, your IP, and your customers. Cutting corners here can be existentially expensive later.',
    category: 'legal',
    guidance:
      'Choose the right legal entity (LLC, C-Corp, etc.) for your goals — especially if you plan to raise venture capital. Protect your intellectual property early: file trademarks, secure domains, and use NDAs and IP assignment agreements. Understand the regulations specific to your industry (data privacy, financial licences, healthcare compliance). Invest in proper contracts with co-founders, employees, and vendors to avoid messy disputes later.',
    tips:
      'If you plan to raise VC funding, incorporate as a Delaware C-Corp from day one — re-structuring later is costly. Use a SAFE (Simple Agreement for Future Equity) for early fundraising instead of convertible notes. File a provisional patent if you have novel technology — it buys you 12 months of "patent pending" protection for minimal cost.',
    checklist: [
      'Choose and register your legal entity (LLC, C-Corp, etc.)',
      'Draft and sign co-founder / operating agreements',
      'File trademarks for brand name and logo',
      'Set up data privacy compliance (GDPR / CCPA as applicable)',
      'Create standard contracts: employment, contractor, NDA, IP assignment',
      'Open a business bank account and set up bookkeeping',
    ],
    resources: [
      'Stripe Atlas — incorporation and startup infrastructure',
      'Clerky — startup-specific legal document automation',
      'USPTO — trademark and patent filing',
      'Term Sheet by Brad Feld & Jason Mendelson — fundraising legal guide',
    ],
    estimatedDays: 5,
  },

  // ── Step 6 ──────────────────────────────────────────────────
  {
    stepNumber: 6,
    title: 'Product Development',
    description:
      'Build a minimum viable product that delivers core value, validates assumptions, and generates the learning loops you need to iterate fast. Ship early, learn faster.',
    category: 'product',
    guidance:
      "Your MVP should be the smallest product that tests your riskiest assumption. Resist the urge to build more — every feature adds cost and delays learning. Use rapid prototyping tools and no-code platforms to get something in users' hands within weeks, not months. Implement instrumentation (analytics, event tracking) from day one so every user interaction generates data. Adopt an iterative build-measure-learn cycle.",
    tips:
      'Define your "one metric that matters" (OMTM) for the MVP — it focuses the entire team. Use a fake-door test or concierge MVP before writing production code. Instrument everything: you can\'t improve what you don\'t measure. Set a time-box (2-6 weeks) for the MVP — scope cuts are easier when the deadline is real.',
    checklist: [
      'Define the core hypothesis your MVP will test',
      'Prioritise features using RICE or MoSCoW framework',
      'Build or assemble the MVP (code, no-code, or concierge)',
      'Set up product analytics and event tracking',
      'Run a closed beta with 10-50 target users',
      'Collect structured feedback and iterate on the top 3 issues',
    ],
    resources: [
      'The Lean Startup by Eric Ries — MVP methodology',
      'Shape Up by Ryan Singer — product development process',
      'Figma / Framer — rapid prototyping',
      'Mixpanel / Amplitude / PostHog — product analytics',
    ],
    estimatedDays: 14,
  },

  // ── Step 7 ──────────────────────────────────────────────────
  {
    stepNumber: 7,
    title: 'Marketing & Growth Strategy',
    description:
      'Design a repeatable, measurable go-to-market engine that brings the right customers to your door at a cost your unit economics can sustain. Growth is a system, not a hack.',
    category: 'marketing',
    guidance:
      "Start with one primary acquisition channel and master it before diversifying. Whether it's content marketing, outbound sales, paid ads, or community building — depth beats breadth early on. Map your full customer journey from awareness to advocacy and instrument every step. Build a growth model that ties channel inputs (spend, effort) to outputs (signups, revenue) so you can forecast and optimise.",
    tips:
      'Choose your first channel based on where your ICP already spends time and attention. Content compounds; paid decays — invest in SEO and thought leadership early even if results lag. Build a "growth experiment" backlog and run 2-3 tests per week. Track CAC by channel and double down on the winner before adding new channels.',
    checklist: [
      'Select your primary acquisition channel and justify the choice',
      'Build a customer journey map (awareness → consideration → purchase → advocacy)',
      'Create a brand style guide and messaging framework',
      'Launch a content calendar (blog, social, newsletter)',
      'Set up marketing analytics and attribution tracking',
      'Design a referral or viral loop into the product',
    ],
    resources: [
      'Traction by Gabriel Weinberg & Justin Mares — channel selection',
      'Hacking Growth by Sean Ellis — growth experimentation',
      'Ahrefs / SEMrush — SEO and content research',
      'HubSpot / Brevo — marketing automation platforms',
    ],
    estimatedDays: 10,
  },

  // ── Step 8 ──────────────────────────────────────────────────
  {
    stepNumber: 8,
    title: 'Operations & Infrastructure',
    description:
      'Set up the operational backbone — tools, processes, and systems — that lets your team execute reliably at scale. Operations is the unsung hero of every successful business.',
    category: 'operations',
    guidance:
      "Operational excellence frees your team to focus on product and growth rather than firefighting. Choose your core tool stack (project management, CRM, communication, finance) and enforce adoption. Document key processes as checklists or playbooks so they don't live in anyone's head. Build automation for repetitive tasks early — every hour saved compounds. Plan for reliability: backup strategies, incident response, and SLA commitments if applicable.",
    tips:
      'Adopt a \'single source of truth\' for each data type — one CRM, one project tracker, one finance tool. Automate before hiring — if a process can be handled by Zapier, Make, or a script, don\'t create a headcount for it. Create an \'ops playbook\' that a new hire could follow on day one without tribal knowledge.',
    checklist: [
      'Select and deploy core tool stack (PM, CRM, comms, finance, CI/CD)',
      'Document the top 10 recurring processes as checklists',
      'Automate 3+ repetitive workflows (onboarding, reporting, invoicing)',
      'Set up monitoring, alerting, and incident response procedures',
      'Establish data backup and disaster-recovery plans',
      'Create vendor and supplier evaluation criteria',
    ],
    resources: [
      'Zapier / Make — workflow automation',
      'Notion / Coda — process documentation and wikis',
      'Linear / Shortcut — engineering project management',
      'Runbook — incident response and on-call management',
    ],
    estimatedDays: 7,
  },

  // ── Step 9 ──────────────────────────────────────────────────
  {
    stepNumber: 9,
    title: 'Team & Hiring',
    description:
      'Assemble the right team at the right time. Early hires define culture, velocity, and the ceiling of what your company can achieve. Hire for trajectory, not just résumé.',
    category: 'team',
    guidance:
      'Your first 5-10 hires have an outsized impact on culture and capability. Define the roles that unblock your biggest bottlenecks first — usually product, engineering, and go-to-market. Write detailed role descriptions with clear success metrics. Build a hiring process that evaluates for skill, cultural alignment, and growth potential. Create an onboarding experience that gets new hires productive in their first week.',
    tips:
      'Hire generalists for the first 10 roles; specialists become valuable at 20+ employees. Use structured interviews with a consistent rubric — unstructured interviews are poor predictors. Offer equity, not just salary — early team members are co-builders, not just employees. Create a "culture code" document and reference it in every hiring decision.',
    checklist: [
      'Define the next 3 critical hires with role descriptions and success metrics',
      'Build a structured interview process (screen → deep-dive → values → offer)',
      'Create an employee onboarding playbook (week-1, month-1, month-3 goals)',
      'Establish compensation bands and equity allocation framework',
      'Draft a culture code / values document',
      'Set up an applicant tracking system (ATS)',
    ],
    resources: [
      'Who by Geoff Smart & Randy Street — hiring methodology',
      'The Hard Thing About Hard Things by Ben Horowitz — culture & leadership',
      'Lever / Greenhouse — applicant tracking systems',
      'Carta — equity management and cap table',
    ],
    estimatedDays: 7,
  },

  // ── Step 10 ─────────────────────────────────────────────────
  {
    stepNumber: 10,
    title: 'Launch & Scale',
    description:
      'Execute a disciplined launch, capture early momentum, and build the systems that turn a successful launch into a sustainable, scaling business. This is where the flywheel starts spinning.',
    category: 'strategy',
    guidance:
      "A launch is not a single event — it's a sequence of coordinated activities across product, marketing, sales, and operations. Start with a soft launch to a controlled group, iron out critical issues, then expand. Define your launch metrics and set targets. After launch, shift focus to the growth flywheel: acquire → activate → retain → refer → revenue. Build dashboards that give you real-time visibility into every stage of the funnel.",
    tips:
      'Launch is day one, not the finish line — the real work begins after. Use a "launch ladder": private beta → waitlist → public launch → expansion. Set up daily standups and weekly metric reviews for the first 30 days post-launch. Capture every piece of user feedback — your earliest users are your best product advisors.',
    checklist: [
      'Define launch goals and key metrics (signups, activation, revenue, NPS)',
      'Execute a soft launch / private beta and resolve critical issues',
      'Prepare launch assets (press kit, demo video, case studies, landing page)',
      'Coordinate launch day activities across channels (PR, social, email, product hunt)',
      'Set up real-time dashboards for funnel metrics (acquisition → retention → revenue)',
      'Conduct a post-launch retrospective within 2 weeks and iterate',
    ],
    resources: [
      'Product Hunt — launch community and playbook',
      'Intercom on Launch — go-to-market guide',
      'Amplitude / Mixpanel — funnel and retention analytics',
      'First Round Review — launch case studies from top startups',
    ],
    estimatedDays: 10,
  },
]
