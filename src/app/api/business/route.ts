import { NextRequest, NextResponse } from 'next/server';
export const dynamic = "force-dynamic";
import { db } from '@/lib/db';

// GET /api/business — Get all businesses for user
export async function GET() {
  try {
    const user = await db.user.findFirst();
    if (!user) {
      return NextResponse.json(
        { success: false, error: 'No user found' },
        { status: 404 }
      );
    }

    const businesses = await db.business.findMany({
      where: { userId: user.id },
      include: {
        planSteps: { orderBy: { stepNumber: 'asc' } },
        _count: { select: { tasks: true, milestones: true } },
      },
      orderBy: { createdAt: 'desc' },
    });

    return NextResponse.json({ success: true, data: businesses });
  } catch (error) {
    console.error('[GET /api/business]', error);
    return NextResponse.json(
      { success: false, error: 'Failed to get businesses' },
      { status: 500 }
    );
  }
}

// POST /api/business — Create new business with auto-generated plan steps
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const {
      name,
      description,
      industry,
      stage,
      targetMarket,
      revenueModel,
      initialCapital,
      monthlyBurnRate,
    } = body;

    if (!name) {
      return NextResponse.json(
        { success: false, error: 'Business name is required' },
        { status: 400 }
      );
    }

    const user = await db.user.findFirst();
    if (!user) {
      return NextResponse.json(
        { success: false, error: 'No user found' },
        { status: 404 }
      );
    }

    const business = await db.business.create({
      data: {
        userId: user.id,
        name,
        description: description || '',
        industry: industry || '',
        stage: stage || 'idea',
        targetMarket: targetMarket || '',
        revenueModel: revenueModel || '',
        initialCapital: initialCapital || 0,
        monthlyBurnRate: monthlyBurnRate || 0,
        currentStep: 1,
        totalSteps: 10,
      },
    });

    // Auto-generate 10 default plan steps
    const defaultSteps = [
      {
        stepNumber: 1,
        title: 'Market Research',
        category: 'research',
        description: 'Conduct thorough market research to understand your industry landscape.',
        guidance: 'Identify market size, trends, and growth potential. Research customer demographics and behaviors.',
        tips: 'Use both primary and secondary research methods. Look for underserved niches within your target market.',
        checklist: JSON.stringify([
          'Define target market demographics',
          'Analyze market size and growth trends',
          'Identify customer pain points',
          'Research industry regulations',
          'Map competitor landscape',
        ]),
        resources: JSON.stringify([
          'Industry reports from IBISWorld or Statista',
          'Google Trends for market interest analysis',
          'Survey tools like Typeform or SurveyMonkey',
        ]),
        estimatedDays: 7,
      },
      {
        stepNumber: 2,
        title: 'Value Proposition',
        category: 'strategy',
        description: 'Define your unique value proposition and competitive advantage.',
        guidance: 'Clearly articulate what makes your business different and why customers should choose you.',
        tips: 'Focus on the intersection of what customers need and what competitors fail to deliver. Your value prop should be specific and measurable.',
        checklist: JSON.stringify([
          'Define your unique selling points',
          'Create value proposition canvas',
          'Validate value prop with potential customers',
          'Document competitive advantages',
          'Craft elevator pitch',
        ]),
        resources: JSON.stringify([
          'Strategyzer Value Proposition Canvas',
          'Competitive analysis frameworks',
          'Customer interview templates',
        ]),
        estimatedDays: 5,
      },
      {
        stepNumber: 3,
        title: 'Business Model',
        category: 'strategy',
        description: 'Design a sustainable and scalable business model.',
        guidance: 'Choose and validate your business model, revenue streams, and cost structure.',
        tips: 'Consider multiple revenue streams for resilience. Test your pricing model early with real customer feedback.',
        checklist: JSON.stringify([
          'Complete Business Model Canvas',
          'Define revenue streams',
          'Map cost structure',
          'Identify key partnerships',
          'Validate unit economics',
        ]),
        resources: JSON.stringify([
          'Business Model Canvas template',
          'Pricing strategy guides',
          'Lean Startup methodology',
        ]),
        estimatedDays: 7,
      },
      {
        stepNumber: 4,
        title: 'Financial Planning',
        category: 'financial',
        description: 'Create comprehensive financial projections and budgets.',
        guidance: 'Build realistic financial models including revenue forecasts, expense budgets, and cash flow projections.',
        tips: 'Always model three scenarios: conservative, moderate, and optimistic. Focus on cash flow over profit in early stages.',
        checklist: JSON.stringify([
          'Create startup cost breakdown',
          'Build 12-month cash flow projection',
          'Calculate break-even point',
          'Determine funding requirements',
          'Set financial KPIs',
        ]),
        resources: JSON.stringify([
          'Financial projection templates',
          'Cash flow management tools',
          'Break-even analysis calculator',
        ]),
        estimatedDays: 10,
      },
      {
        stepNumber: 5,
        title: 'Legal Setup',
        category: 'legal',
        description: 'Establish legal structure and compliance framework.',
        guidance: 'Register your business, protect your IP, and ensure regulatory compliance.',
        tips: 'Choose your legal structure based on liability protection, tax implications, and future fundraising plans.',
        checklist: JSON.stringify([
          'Choose business structure (LLC, Corp, etc.)',
          'Register business name',
          'Obtain necessary licenses and permits',
          'Draft founder agreements',
          'Set up business banking',
        ]),
        resources: JSON.stringify([
          'LegalZoom or similar for business registration',
          'SBA.gov for licensing requirements',
          'Attorney consultation for complex structures',
        ]),
        estimatedDays: 7,
      },
      {
        stepNumber: 6,
        title: 'Product Development',
        category: 'product',
        description: 'Build your minimum viable product (MVP) or service prototype.',
        guidance: 'Develop your MVP focusing on core features that solve the primary customer problem.',
        tips: 'Speed to market is critical. Build the smallest thing that delivers value and learn from real usage data.',
        checklist: JSON.stringify([
          'Define MVP feature set',
          'Create product roadmap',
          'Set up development environment',
          'Build and test MVP',
          'Gather initial user feedback',
        ]),
        resources: JSON.stringify([
          'Agile/Scrum methodology guides',
          'Product management tools (Jira, Linear)',
          'No-code platforms for rapid prototyping',
        ]),
        estimatedDays: 21,
      },
      {
        stepNumber: 7,
        title: 'Marketing Strategy',
        category: 'marketing',
        description: 'Develop a comprehensive go-to-market and marketing strategy.',
        guidance: 'Create your brand identity, marketing channels, and customer acquisition strategy.',
        tips: 'Focus on 1-2 channels initially and master them before expanding. Content marketing and community building often provide the best ROI for startups.',
        checklist: JSON.stringify([
          'Define brand identity and messaging',
          'Create marketing plan and budget',
          'Set up marketing channels',
          'Develop content calendar',
          'Build launch marketing campaign',
        ]),
        resources: JSON.stringify([
          'Marketing strategy frameworks',
          'Social media management tools',
          'Email marketing platforms',
        ]),
        estimatedDays: 10,
      },
      {
        stepNumber: 8,
        title: 'Operations',
        category: 'operations',
        description: 'Set up operational infrastructure and processes.',
        guidance: 'Establish day-to-day operations, tools, and workflows to support your business.',
        tips: 'Automate early and often. Invest in tools that scale with you rather than manual processes that break under growth.',
        checklist: JSON.stringify([
          'Set up project management tools',
          'Create standard operating procedures',
          'Establish vendor relationships',
          'Set up accounting and bookkeeping',
          'Configure communication tools',
        ]),
        resources: JSON.stringify([
          'Project management tools (Asana, Notion)',
          'Accounting software (QuickBooks, Xero)',
          'Communication platforms (Slack, Teams)',
        ]),
        estimatedDays: 7,
      },
      {
        stepNumber: 9,
        title: 'Team Building',
        category: 'team',
        description: 'Recruit and build your founding team.',
        guidance: 'Identify key roles, recruit talent, and establish team culture and processes.',
        tips: 'Hire for attitude and potential over experience. Your first 5 hires define your company culture for the next 50.',
        checklist: JSON.stringify([
          'Identify critical roles to fill',
          'Write job descriptions',
          'Set up hiring process',
          'Conduct interviews and hire',
          'Establish onboarding process',
        ]),
        resources: JSON.stringify([
          'Job posting platforms (LinkedIn, AngelList)',
          'Interview frameworks and templates',
          'Onboarding checklists',
        ]),
        estimatedDays: 14,
      },
      {
        stepNumber: 10,
        title: 'Launch Strategy',
        category: 'marketing',
        description: 'Plan and execute your business launch.',
        guidance: 'Orchestrate a strategic launch that maximizes initial traction and customer acquisition.',
        tips: 'A soft launch to a limited audience often beats a big splash. Use early adopters to refine before scaling.',
        checklist: JSON.stringify([
          'Define launch goals and metrics',
          'Prepare launch materials and assets',
          'Execute pre-launch marketing',
          'Launch product/service',
          'Monitor and respond to feedback',
        ]),
        resources: JSON.stringify([
          'Launch checklist templates',
          'Analytics tools (Google Analytics, Mixpanel)',
          'Customer support platforms',
        ]),
        estimatedDays: 7,
      },
    ];

    // Set step 1 as "current"
    const stepData = defaultSteps.map((step) => ({
      ...step,
      businessId: business.id,
      status: step.stepNumber === 1 ? 'current' : 'locked',
    }));

    await db.planStep.createMany({ data: stepData });

    const businessWithSteps = await db.business.findUnique({
      where: { id: business.id },
      include: { planSteps: { orderBy: { stepNumber: 'asc' } } },
    });

    return NextResponse.json(
      { success: true, data: businessWithSteps },
      { status: 201 }
    );
  } catch (error) {
    console.error('[POST /api/business]', error);
    return NextResponse.json(
      { success: false, error: 'Failed to create business' },
      { status: 500 }
    );
  }
}
