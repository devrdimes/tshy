import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { getCurrentUser } from '@/lib/auth-server';

// POST /api/init — Initialize demo data for the app
export async function POST(request: NextRequest) {
  try {
    let user = await getCurrentUser(request);
    if (!user) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Check if demo business already exists
    const existingBusiness = await db.business.findFirst({
      where: { userId: user.id, name: 'TechFlow SaaS' },
    });

    if (existingBusiness) {
      return NextResponse.json({
        success: true,
        data: { message: 'Demo data already exists', userId: user.id, businessId: existingBusiness.id },
      });
    }

    // Create sample business
    const business = await db.business.create({
      data: {
        userId: user.id,
        name: 'TechFlow SaaS',
        description: 'Project management platform for remote teams. Combines intelligent task prioritization with real-time collaboration to help distributed teams work more efficiently.',
        industry: 'SaaS / Technology',
        stage: 'planning',
        targetMarket: 'Remote-first companies with 10-500 employees',
        revenueModel: 'Freemium SaaS with tiered pricing ($0, $15/user/mo, $49/user/mo, Enterprise)',
        initialCapital: 150000,
        monthlyBurnRate: 12000,
        currentStep: 3,
        totalSteps: 10,
        completed: false,
        logoUrl: '',
      },
    });

    // Create 10 plan steps with appropriate statuses
    const planStepsData = [
      {
        stepNumber: 1,
        title: 'Market Research',
        category: 'research',
        description: 'Analyze the project management SaaS market, identify customer pain points, and validate market opportunity.',
        status: 'completed',
        guidance: 'Research the project management software market. Focus on pain points of remote teams: timezone coordination, async communication gaps, and task visibility. Analyze competitors like Asana, Monday.com, and Notion.',
        tips: 'The SaaS PM market is growing 10%+ annually. Remote work tools saw explosive growth post-2020. Focus on the underserved mid-market segment (50-200 employees) where teams need more than basic tools but less than enterprise complexity.',
        checklist: JSON.stringify(['Analyze market size and growth trends', 'Map competitor landscape', 'Identify customer pain points', 'Validate market opportunity with potential customers', 'Research industry regulations']),
        resources: JSON.stringify(['Gartner PM software reports', 'Competitor pricing pages', 'Remote work survey data']),
        estimatedDays: 7,
        startedAt: new Date('2025-01-15'),
        completedAt: new Date('2025-01-22'),
      },
      {
        stepNumber: 2,
        title: 'Value Proposition',
        category: 'strategy',
        description: 'Define your unique value proposition: intelligent task prioritization that adapts to team work patterns.',
        status: 'completed',
        guidance: 'Your differentiator is technology that learns from team behavior to automatically prioritize tasks and suggest optimal work schedules across timezones. This goes beyond simple task lists.',
        tips: 'Your strongest value prop is the intersection of smart tools + remote work. Don\'t try to be "better Asana" — be the tool that makes remote work feel like co-located work through intelligent orchestration.',
        checklist: JSON.stringify(['Define unique selling points', 'Create value proposition canvas', 'Validate with 10+ potential customers', 'Document competitive advantages', 'Craft elevator pitch']),
        resources: JSON.stringify(['Strategyzer Canvas', 'Customer interview scripts', 'Competitive positioning matrix']),
        estimatedDays: 5,
        startedAt: new Date('2025-01-23'),
        completedAt: new Date('2025-01-28'),
      },
      {
        stepNumber: 3,
        title: 'Business Model',
        category: 'strategy',
        description: 'Finalize your freemium SaaS business model with tiered pricing and expansion revenue strategy.',
        status: 'in_progress',
        guidance: 'Design a freemium model that drives viral adoption within teams. Free tier supports up to 5 users; Pro at $15/user/mo adds premium features; Business at $49/user/mo adds analytics and integrations. Target sustainable growth within 18 months.',
        tips: 'The key SaaS metric to optimize is net revenue retention. If existing customers expand faster than they churn, growth compounds. Design pricing tiers that naturally drive upgrades as teams grow.',
        checklist: JSON.stringify(['Complete Business Model Canvas', 'Define revenue streams and pricing tiers', 'Map cost structure', 'Validate unit economics', 'Identify key partnerships']),
        resources: JSON.stringify(['SaaS pricing benchmarks', 'Business Model Canvas', 'Unit economics calculator']),
        estimatedDays: 7,
        startedAt: new Date('2025-01-29'),
      },
      {
        stepNumber: 4,
        title: 'Financial Planning',
        category: 'financial',
        description: 'Create detailed financial projections including runway calculation and funding strategy.',
        status: 'locked',
        guidance: 'With $150K initial capital and $12K monthly burn, you have approximately 12 months of runway. Plan for a seed round of $500K-1M at month 8. Build conservative, moderate, and aggressive scenarios.',
        tips: 'Plan your fundraise 6 months before you need the money. Most first-time founders underestimate how long fundraising takes. Target 18+ months of runway post-raise.',
        checklist: JSON.stringify(['Create startup cost breakdown', 'Build 18-month cash flow projection', 'Calculate break-even point', 'Determine funding requirements', 'Set financial KPIs and tracking']),
        resources: JSON.stringify(['Financial model templates', 'SaaS metrics dashboard', 'Runway calculator']),
        estimatedDays: 10,
      },
      {
        stepNumber: 5,
        title: 'Legal Setup',
        category: 'legal',
        description: 'Establish legal structure, IP protection, and compliance framework for your SaaS business.',
        status: 'locked',
        guidance: 'Form a legal entity appropriate for your situation. Protect your intellectual property and brand. Implement data privacy measures (GDPR/CCPA compliance is critical for SaaS).',
        tips: 'Choose a business structure that aligns with your funding plans. Get IP assignment agreements in place before building — this becomes a critical issue during due diligence.',
        checklist: JSON.stringify(['Choose business structure', 'Register business name and trademarks', 'Draft founder agreements and IP assignment', 'Set up data privacy compliance (GDPR/CCPA)', 'Open business bank account']),
        resources: JSON.stringify(['Stripe Atlas for incorporation', 'SBA.gov resources', 'Data privacy compliance guides']),
        estimatedDays: 7,
      },
      {
        stepNumber: 6,
        title: 'Product Development',
        category: 'product',
        description: 'Build your MVP focusing on core task prioritization and team coordination features.',
        status: 'locked',
        guidance: 'Start with the core task prioritization engine. Build integrations with Slack and GitHub first. The MVP should demonstrate meaningful improvement in team productivity within 2 weeks of use.',
        tips: 'Resist the urge to build every feature. Your MVP needs to prove ONE thing: that your approach makes remote teams more productive. If you can prove that, everything else follows.',
        checklist: JSON.stringify(['Define MVP feature set', 'Create product roadmap', 'Set up development infrastructure', 'Build and test MVP', 'Gather initial user feedback']),
        resources: JSON.stringify(['Agile development guides', 'Product management tools', 'Development frameworks']),
        estimatedDays: 21,
      },
      {
        stepNumber: 7,
        title: 'Marketing Strategy',
        category: 'marketing',
        description: 'Develop go-to-market strategy focused on product-led growth and community building.',
        status: 'locked',
        guidance: 'Leverage a product-led growth (PLG) strategy. Create content about remote work best practices. Build in public. Launch on Product Hunt. Target remote work communities and Slack groups.',
        tips: 'For SaaS PLG, your free tier IS your marketing. Make the free experience so good that teams naturally invite colleagues. Track viral coefficient religiously.',
        checklist: JSON.stringify(['Define brand identity and messaging', 'Create marketing plan and budget', 'Set up content marketing engine', 'Build launch campaign strategy', 'Establish community presence']),
        resources: JSON.stringify(['Product-led growth playbook', 'Content marketing frameworks', 'Product Hunt launch guide']),
        estimatedDays: 10,
      },
      {
        stepNumber: 8,
        title: 'Operations',
        category: 'operations',
        description: 'Set up operational infrastructure, tools, and scalable processes.',
        status: 'locked',
        guidance: 'Implement cloud-native infrastructure from day one. Use AWS/GCP with auto-scaling. Set up CI/CD pipelines, monitoring, and incident response. Choose tools that scale with zero marginal cost per user.',
        tips: 'Cloud costs can spiral quickly in SaaS. Implement cost monitoring from day one. Use reserved instances for predictable workloads and spot instances for batch processing.',
        checklist: JSON.stringify(['Set up cloud infrastructure', 'Implement CI/CD pipelines', 'Configure monitoring and alerting', 'Establish incident response procedures', 'Set up customer support system']),
        resources: JSON.stringify(['AWS/Azure startup programs', 'DevOps best practices', 'SaaS operations playbook']),
        estimatedDays: 7,
      },
      {
        stepNumber: 9,
        title: 'Team Building',
        category: 'team',
        description: 'Recruit your founding team with emphasis on relevant experience.',
        status: 'locked',
        guidance: 'First hires: Senior Engineer (core product), Full-stack Developer (features), and Growth Marketer (PLG). Consider remote-first from the start to access global talent and validate your own product.',
        tips: 'Hire people who are excited about remote work — they\'ll be your best product advocates. Your first engineer should be generalist enough to build anything but specialized enough to make your core feature excellent.',
        checklist: JSON.stringify(['Define critical roles and job descriptions', 'Set up hiring process and assessment criteria', 'Source and interview candidates', 'Make offers and onboard new hires', 'Establish team culture and rituals']),
        resources: JSON.stringify(['Remote hiring platforms', 'Technical interview frameworks', 'Onboarding templates']),
        estimatedDays: 14,
      },
      {
        stepNumber: 10,
        title: 'Launch Strategy',
        category: 'marketing',
        description: 'Plan and execute a strategic launch that drives initial adoption and validates product-market fit.',
        status: 'locked',
        guidance: 'Plan a phased launch: private beta (50 users), public beta (500 users), then general availability. Use the beta period to validate effectiveness metrics and refine onboarding. Target 1000 signups in the first month post-launch.',
        tips: 'The best SaaS launches aren\'t big bang events — they\'re gradual ramps. Start with users who have the pain you solve most acutely. Their feedback and success stories will fuel your broader launch.',
        checklist: JSON.stringify(['Define launch goals and success metrics', 'Build launch materials and demos', 'Execute private beta program', 'Plan Product Hunt and media launch', 'Monitor metrics and iterate rapidly']),
        resources: JSON.stringify(['Launch checklist templates', 'Beta management tools', 'Analytics and tracking setup']),
        estimatedDays: 7,
      },
    ];

    const stepData = planStepsData.map((step) => ({
      businessId: business.id,
      ...step,
    }));

    await db.planStep.createMany({ data: stepData });

    // Create sample tasks
    const tasksData = [
      {
        userId: user.id,
        businessId: business.id,
        planStepId: null,
        title: 'Validate pricing tiers with 5 target customers',
        description: 'Schedule calls with potential customers to test willingness to pay at different price points. Focus on the $15-49/user/mo range.',
        priority: 'high',
        status: 'pending',
        dueDate: new Date('2025-03-15'),
        systemGenerated: true,
        suggestion: 'Use Van Westendorp pricing method to find the optimal price range. Ask about current tool spend as a benchmark.',
      },
      {
        userId: user.id,
        businessId: business.id,
        planStepId: null,
        title: 'Map out partnership opportunities',
        description: 'Identify potential integration partners (Slack, GitHub, Jira, etc.) and draft partnership proposals.',
        priority: 'medium',
        status: 'pending',
        dueDate: new Date('2025-03-20'),
        systemGenerated: false,
        suggestion: '',
      },
      {
        userId: user.id,
        businessId: business.id,
        planStepId: null,
        title: 'Create detailed cost structure analysis',
        description: 'Break down all costs: infrastructure (AWS), compute, team salaries, marketing, and tools.',
        priority: 'high',
        status: 'in_progress',
        dueDate: new Date('2025-03-10'),
        systemGenerated: true,
        suggestion: 'Use AWS Pricing Calculator for infrastructure estimates. Factor in API costs at scale — they grow linearly with users.',
      },
      {
        userId: user.id,
        businessId: business.id,
        planStepId: null,
        title: 'Draft seed round pitch deck',
        description: 'Create a 12-slide pitch deck covering problem, solution, market, business model, team, traction, and ask.',
        priority: 'urgent',
        status: 'pending',
        dueDate: new Date('2025-03-25'),
        systemGenerated: false,
        suggestion: '',
      },
      {
        userId: user.id,
        businessId: business.id,
        planStepId: null,
        title: 'Set up unit economics tracking dashboard',
        description: 'Build a dashboard to track CAC, LTV, MRR, churn rate, and other key SaaS metrics.',
        priority: 'medium',
        status: 'pending',
        dueDate: new Date('2025-03-18'),
        systemGenerated: true,
        suggestion: 'Use Baremetrics or ProfitWell for SaaS metrics. Focus on LTV:CAC ratio — aim for 3:1 or better.',
      },
    ];

    // Get step IDs for linking tasks
    const steps = await db.planStep.findMany({
      where: { businessId: business.id },
      orderBy: { stepNumber: 'asc' },
    });

    // Link some tasks to steps
    tasksData[0].planStepId = steps[2]?.id || null;
    tasksData[2].planStepId = steps[2]?.id || null;
    tasksData[3].planStepId = steps[3]?.id || null;
    tasksData[4].planStepId = steps[2]?.id || null;

    for (const taskData of tasksData) {
      await db.task.create({ data: taskData as Parameters<typeof db.task.create>[0]['data'] });
    }

    // Create sample milestones
    const milestonesData = [
      {
        businessId: business.id,
        title: 'Complete Market Validation',
        description: 'Validate market opportunity with 20+ potential customer interviews',
        targetDate: new Date('2025-02-15'),
        category: 'product',
        metric: 'Customer interviews completed',
        targetValue: 20,
        currentValue: 15,
        status: 'in_progress',
      },
      {
        businessId: business.id,
        title: 'Launch Private Beta',
        description: 'Release MVP to first 50 beta users',
        targetDate: new Date('2025-05-01'),
        category: 'product',
        metric: 'Beta users',
        targetValue: 50,
        currentValue: 0,
        status: 'upcoming',
      },
      {
        businessId: business.id,
        title: 'Reach $10K MRR',
        description: 'Achieve $10K in monthly recurring revenue',
        targetDate: new Date('2025-09-01'),
        category: 'revenue',
        metric: 'MRR',
        targetValue: 10000,
        currentValue: 0,
        status: 'upcoming',
      },
      {
        businessId: business.id,
        title: 'Secure Seed Funding',
        description: 'Close seed round of $500K-1M',
        targetDate: new Date('2025-07-01'),
        category: 'funding',
        metric: 'Funding raised',
        targetValue: 750000,
        currentValue: 0,
        status: 'upcoming',
      },
      {
        businessId: business.id,
        title: 'First 100 Users',
        description: 'Reach 100 active users on the platform',
        targetDate: new Date('2025-06-01'),
        category: 'users',
        metric: 'Active users',
        targetValue: 100,
        currentValue: 0,
        status: 'upcoming',
      },
    ];

    for (const milestoneData of milestonesData) {
      await db.milestone.create({ data: milestoneData });
    }

    // Create sample financials
    const actualFinancials = [
      { period: 'month-1', revenue: 0, expenses: 11500, profit: -11500, customers: 0, burnRate: 11500, runway: 13, projection: false },
      { period: 'month-2', revenue: 500, expenses: 12000, profit: -11500, customers: 3, burnRate: 12000, runway: 12, projection: false },
    ];

    const projectedFinancials = [
      { period: 'month-3', revenue: 1500, expenses: 13500, profit: -12000, customers: 10, burnRate: 12000, runway: 11, projection: true },
      { period: 'month-4', revenue: 3500, expenses: 14000, profit: -10500, customers: 25, burnRate: 10500, runway: 10, projection: true },
      { period: 'month-5', revenue: 7000, expenses: 15000, profit: -8000, customers: 50, burnRate: 8000, runway: 9, projection: true },
      { period: 'month-6', revenue: 12000, expenses: 16000, profit: -4000, customers: 80, burnRate: 4000, runway: 8, projection: true },
      { period: 'month-7', revenue: 20000, expenses: 17000, profit: 3000, customers: 120, burnRate: 0, runway: 99, projection: true },
      { period: 'month-8', revenue: 30000, expenses: 18500, profit: 11500, customers: 180, burnRate: 0, runway: 99, projection: true },
    ];

    const allFinancials = [...actualFinancials, ...projectedFinancials];
    for (const fin of allFinancials) {
      await db.financial.create({
        data: { businessId: business.id, ...fin },
      });
    }

    // Create sample notifications
    const notificationsData = [
      {
        userId: user.id,
        type: 'step_reminder',
        title: 'Business Model Step In Progress',
        message: 'You\'re currently working on the Business Model step. You have incomplete checklist items. Let\'s finish them today!',
        actionUrl: '/dashboard',
        read: false,
        dismissed: false,
        sentAt: new Date(),
      },
      {
        userId: user.id,
        type: 'warning',
        title: 'Overdue Task: Cost Structure Analysis',
        message: 'Your "Create detailed cost structure analysis" task is overdue. This is critical for your Financial Planning step.',
        actionUrl: '/dashboard',
        read: false,
        dismissed: false,
        sentAt: new Date(),
      },
      {
        userId: user.id,
        type: 'milestone',
        title: 'Milestone Progress: Market Validation',
        message: 'Great progress! You\'ve completed 15 out of 20 customer interviews for market validation. Only 5 more to go!',
        actionUrl: '/dashboard',
        read: false,
        dismissed: false,
        sentAt: new Date(),
      },
      {
        userId: user.id,
        type: 'advisor_tip',
        title: 'Advisor Tip: Validate Unit Economics',
        message: 'Based on your current progress, we recommend validating your unit economics before moving to Financial Planning. This will make your projections much more accurate.',
        actionUrl: '/dashboard',
        read: true,
        dismissed: false,
        sentAt: new Date(),
      },
      {
        userId: user.id,
        type: 'info',
        title: 'Welcome to Tashyeed!',
        message: 'Your business plan is set up and ready to go. You\'ve completed 2 out of 10 steps. Follow your structured plan to build a successful business!',
        actionUrl: '/dashboard',
        read: true,
        dismissed: false,
        sentAt: new Date(),
      },
    ];

    for (const notifData of notificationsData) {
      await db.notification.create({ data: notifData });
    }

    return NextResponse.json({
      success: true,
      data: {
        message: 'Demo data initialized successfully',
        userId: user.id,
        businessId: business.id,
        summary: {
          businesses: 1,
          planSteps: 10,
          tasks: tasksData.length,
          milestones: milestonesData.length,
          financials: allFinancials.length,
          notifications: notificationsData.length,
        },
      },
    });
  } catch (error) {
    console.error('[POST /api/init]', error);
    return NextResponse.json(
      { success: false, error: 'Failed to initialize demo data' },
      { status: 500 }
    );
  }
}
