// ============================================================
// Tashyeed — Sanad Guide Definitions
// All guided tours live here as typed data
// ============================================================
import type { SanadAnimationState } from './sanad-store'

// ── Action types the guide can wait for ─────────────────────

export type GuideActionType =
  | 'click_target'
  | 'navigate_route'
  | 'input_value'
  | 'form_submit'
  | 'task_created'
  | 'task_completed'
  | 'step_completed'
  | 'informational' // no action required — user clicks Next

// ── Arrow direction hint ─────────────────────────────────────

export type ArrowDirection = 'up' | 'down' | 'left' | 'right' | 'auto'

// ── A single step in a guide ─────────────────────────────────

export interface GuideStep {
  stepId: string
  /** data-sanad-id value of the target element */
  targetId: string | null
  /** Route the user must be on for this step */
  route: string | null
  message: {
    en: string
    ar: string
  }
  arrowDirection: ArrowDirection
  /** Whether to dim the rest of the page with a spotlight */
  spotlight: boolean
  /** Whether to glow the target element */
  glowTarget: boolean
  /** What action completes this step */
  requiredAction: GuideActionType
  /** Which robot animation to use */
  robotState: SanadAnimationState
  /** Can this step be skipped? */
  skippable: boolean
}

// ── Guide IDs ────────────────────────────────────────────────

export type GuideId =
  | 'onboarding'
  | 'dashboard-tour'
  | 'planner-tour'
  | 'tasks-tour'
  | 'financials-tour'
  | 'milestones-tour'
  | 'analysis-tour'
  | 'idea-validator-tour'
  | 'pitch-deck-tour'

// ── Guide registry ───────────────────────────────────────────

export interface GuideMeta {
  id: GuideId
  title: { en: string; ar: string }
  description: { en: string; ar: string }
  steps: GuideStep[]
}

// ─────────────────────────────────────────────────────────────
// ONBOARDING GUIDE — "Build Your First Business Plan"
// ─────────────────────────────────────────────────────────────

export const ONBOARDING_GUIDE: GuideMeta = {
  id: 'onboarding',
  title: { en: 'Build Your First Business Plan', ar: 'ابنِ خطتك التجارية الأولى' },
  description: { en: 'A 15-step walkthrough of the full Tashyeed workspace.', ar: 'جولة شاملة في مساحة عمل تشييد.' },
  steps: [
    {
      stepId: 'ob-01',
      targetId: 'dashboard-health-score',
      route: null,
      message: { en: 'Welcome! This dashboard will track the health of your new business.', ar: 'مرحباً! هذه اللوحة ستتتبع صحة عملك الجديد.' },
      arrowDirection: 'left',
      spotlight: true,
      glowTarget: true,
      requiredAction: 'informational',
      robotState: 'waving',
      skippable: false,
    },
    {
      stepId: 'ob-02',
      targetId: 'sidebar-planner',
      route: null,
      message: { en: 'Let\'s start by building your roadmap. Click Planner to begin.', ar: 'لنبدأ ببناء خارطة طريقك. انقر على المخطط للبدء.' },
      arrowDirection: 'right',
      spotlight: true,
      glowTarget: true,
      requiredAction: 'click_target',
      robotState: 'pointing',
      skippable: false,
    },
    {
      stepId: 'ob-03',
      targetId: 'planner-progress',
      route: null,
      message: { en: 'This roadmap turns your idea into clear business decisions.', ar: 'هذا المسار يحول فكرتك إلى قرارات تجارية واضحة.' },
      arrowDirection: 'down',
      spotlight: false,
      glowTarget: true,
      requiredAction: 'informational',
      robotState: 'idle',
      skippable: true,
    },
    {
      stepId: 'ob-04',
      targetId: 'planner-step-1',
      route: null,
      message: { en: 'Start with the customer problem before building your solution.', ar: 'ابدأ بمشكلة العميل قبل بناء حلك.' },
      arrowDirection: 'down',
      spotlight: true,
      glowTarget: true,
      requiredAction: 'click_target',
      robotState: 'pointing',
      skippable: true,
    },
    {
      stepId: 'ob-05',
      targetId: 'market-research-idea-input',
      route: null,
      message: { en: 'Describe your idea in simple words. We will improve it together.', ar: 'صف فكرتك بكلمات بسيطة. سنحسّنها معاً.' },
      arrowDirection: 'up',
      spotlight: true,
      glowTarget: true,
      requiredAction: 'input_value',
      robotState: 'idle',
      skippable: true,
    },
    {
      stepId: 'ob-06',
      targetId: 'market-research-ai-assist',
      route: null,
      message: { en: 'Use AI Assist when you need help with customers or competitors.', ar: 'استخدم مساعد الذكاء الاصطناعي عند الحاجة للمساعدة.' },
      arrowDirection: 'up',
      spotlight: true,
      glowTarget: true,
      requiredAction: 'click_target',
      robotState: 'pointing',
      skippable: true,
    },
    {
      stepId: 'ob-07',
      targetId: 'market-research-save',
      route: null,
      message: { en: 'Save your work to update your business plan.', ar: 'احفظ عملك لتحديث خطتك التجارية.' },
      arrowDirection: 'up',
      spotlight: true,
      glowTarget: true,
      requiredAction: 'click_target',
      robotState: 'idle',
      skippable: true,
    },
    {
      stepId: 'ob-08',
      targetId: 'sidebar-tasks',
      route: null,
      message: { en: 'Tasks turn your plan into daily action.', ar: 'المهام تحوّل خطتك إلى عمل يومي.' },
      arrowDirection: 'right',
      spotlight: true,
      glowTarget: true,
      requiredAction: 'click_target',
      robotState: 'pointing',
      skippable: true,
    },
    {
      stepId: 'ob-09',
      targetId: 'tasks-new-task',
      route: null,
      message: { en: 'Create tasks yourself, or ask Sanad to suggest them.', ar: 'أنشئ مهامك بنفسك، أو اطلب من سند اقتراحها.' },
      arrowDirection: 'down',
      spotlight: true,
      glowTarget: true,
      requiredAction: 'click_target',
      robotState: 'pointing',
      skippable: true,
    },
    {
      stepId: 'ob-10',
      targetId: 'sidebar-financials',
      route: null,
      message: { en: 'Use Financials to understand costs, pricing, and runway.', ar: 'استخدم المالية لفهم التكاليف والتسعير ومدة التشغيل.' },
      arrowDirection: 'right',
      spotlight: true,
      glowTarget: true,
      requiredAction: 'click_target',
      robotState: 'pointing',
      skippable: true,
    },
    {
      stepId: 'ob-11',
      targetId: 'sidebar-milestones',
      route: null,
      message: { en: 'Milestones keep your business moving toward meaningful goals.', ar: 'المعالم تُبقي عملك يتجه نحو أهداف ذات معنى.' },
      arrowDirection: 'right',
      spotlight: false,
      glowTarget: true,
      requiredAction: 'click_target',
      robotState: 'pointing',
      skippable: true,
    },
    {
      stepId: 'ob-12',
      targetId: 'sidebar-analysis',
      route: null,
      message: { en: 'Analysis shows what is strong and what needs attention.', ar: 'التحليل يُظهر ما هو قوي وما يحتاج اهتماماً.' },
      arrowDirection: 'right',
      spotlight: false,
      glowTarget: true,
      requiredAction: 'click_target',
      robotState: 'pointing',
      skippable: true,
    },
    {
      stepId: 'ob-13',
      targetId: 'sidebar-idea-validator',
      route: null,
      message: { en: 'Validate your idea before investing time or money.', ar: 'تحقق من فكرتك قبل استثمار الوقت أو المال.' },
      arrowDirection: 'right',
      spotlight: false,
      glowTarget: true,
      requiredAction: 'click_target',
      robotState: 'pointing',
      skippable: true,
    },
    {
      stepId: 'ob-14',
      targetId: 'sidebar-pitch-deck',
      route: null,
      message: { en: 'Create a professional pitch deck from the work you save here.', ar: 'أنشئ عرضاً تقديمياً احترافياً من العمل الذي تحفظه هنا.' },
      arrowDirection: 'right',
      spotlight: false,
      glowTarget: true,
      requiredAction: 'click_target',
      robotState: 'pointing',
      skippable: true,
    },
    {
      stepId: 'ob-15',
      targetId: 'sanad-robot-button',
      route: null,
      message: { en: 'Whenever you need help, open Sanad. I know your current step.', ar: 'متى احتجت مساعدة، افتح سند. أنا أعرف خطوتك الحالية.' },
      arrowDirection: 'up',
      spotlight: true,
      glowTarget: true,
      requiredAction: 'informational',
      robotState: 'waving',
      skippable: false,
    },
  ],
}

// ─────────────────────────────────────────────────────────────
// DASHBOARD MINI-TOUR
// ─────────────────────────────────────────────────────────────

export const DASHBOARD_TOUR: GuideMeta = {
  id: 'dashboard-tour',
  title: { en: 'Dashboard Tour', ar: 'جولة لوحة التحكم' },
  description: { en: 'Understand your business overview at a glance.', ar: 'افهم نظرة عامة على عملك بلمحة.' },
  steps: [
    {
      stepId: 'db-01',
      targetId: 'dashboard-health-score',
      route: null,
      message: { en: 'This Health Score shows your overall business progress.', ar: 'درجة الصحة هذه تُظهر تقدم عملك الإجمالي.' },
      arrowDirection: 'down',
      spotlight: true,
      glowTarget: true,
      requiredAction: 'informational',
      robotState: 'pointing',
      skippable: true,
    },
    {
      stepId: 'db-02',
      targetId: 'dashboard-active-step',
      route: null,
      message: { en: 'Your active plan step is displayed here. Click to jump to it.', ar: 'خطوة خطتك النشطة معروضة هنا. انقر للانتقال إليها.' },
      arrowDirection: 'down',
      spotlight: true,
      glowTarget: true,
      requiredAction: 'informational',
      robotState: 'pointing',
      skippable: true,
    },
    {
      stepId: 'db-03',
      targetId: 'dashboard-continue-planning',
      route: null,
      message: { en: 'Click here anytime to jump back into your plan.', ar: 'انقر هنا في أي وقت للعودة إلى خطتك.' },
      arrowDirection: 'down',
      spotlight: true,
      glowTarget: true,
      requiredAction: 'informational',
      robotState: 'idle',
      skippable: true,
    },
  ],
}

// ─────────────────────────────────────────────────────────────
// GUIDE REGISTRY — all available guides
// ─────────────────────────────────────────────────────────────

export const ALL_GUIDES: Record<GuideId, GuideMeta> = {
  'onboarding': ONBOARDING_GUIDE,
  'dashboard-tour': DASHBOARD_TOUR,
  'planner-tour': {
    id: 'planner-tour',
    title: { en: 'Planner Tour', ar: 'جولة المخطط' },
    description: { en: 'Learn how the 10-step roadmap works.', ar: 'تعرف على كيفية عمل خارطة الطريق.' },
    steps: [
      { stepId: 'pl-01', targetId: 'planner-progress', route: null, message: { en: 'Your plan progress is tracked here. Each step builds on the last.', ar: 'يُتتبع تقدم خطتك هنا. كل خطوة تبني على السابقة.' }, arrowDirection: 'down', spotlight: true, glowTarget: true, requiredAction: 'informational', robotState: 'pointing', skippable: true },
      { stepId: 'pl-02', targetId: 'planner-step-1', route: null, message: { en: 'Open any step to see your guidance, tips, and AI assistance.', ar: 'افتح أي خطوة لرؤية توجيهاتك ونصائحك ومساعدة الذكاء الاصطناعي.' }, arrowDirection: 'down', spotlight: true, glowTarget: true, requiredAction: 'informational', robotState: 'idle', skippable: true },
    ],
  },
  'tasks-tour': {
    id: 'tasks-tour',
    title: { en: 'Tasks Tour', ar: 'جولة المهام' },
    description: { en: 'Manage your daily actions here.', ar: 'إدارة إجراءاتك اليومية هنا.' },
    steps: [
      { stepId: 'tk-01', targetId: 'tasks-new-task', route: null, message: { en: 'Create a new task here, or ask Sanad to suggest the next action.', ar: 'أنشئ مهمة جديدة هنا، أو اطلب من سند اقتراح الإجراء التالي.' }, arrowDirection: 'down', spotlight: true, glowTarget: true, requiredAction: 'informational', robotState: 'pointing', skippable: true },
    ],
  },
  'financials-tour': {
    id: 'financials-tour',
    title: { en: 'Financials Tour', ar: 'جولة الماليات' },
    description: { en: 'Understand your numbers.', ar: 'افهم أرقامك.' },
    steps: [
      { stepId: 'fi-01', targetId: 'financials-capital', route: null, message: { en: 'Enter your starting capital. This drives all financial projections.', ar: 'أدخل رأس المال الابتدائي. هذا يقود جميع التوقعات المالية.' }, arrowDirection: 'down', spotlight: true, glowTarget: true, requiredAction: 'informational', robotState: 'pointing', skippable: true },
    ],
  },
  'milestones-tour': {
    id: 'milestones-tour',
    title: { en: 'Milestones Tour', ar: 'جولة المعالم' },
    description: { en: 'Set and track meaningful goals.', ar: 'حدد وتتبع الأهداف ذات المعنى.' },
    steps: [
      { stepId: 'mi-01', targetId: 'milestones-add', route: null, message: { en: 'Add a milestone to mark a major moment in your business journey.', ar: 'أضف معلماً لتحديد لحظة مهمة في رحلة عملك.' }, arrowDirection: 'down', spotlight: true, glowTarget: true, requiredAction: 'informational', robotState: 'pointing', skippable: true },
    ],
  },
  'analysis-tour': {
    id: 'analysis-tour',
    title: { en: 'Analysis Tour', ar: 'جولة التحليل' },
    description: { en: 'See your business strengths and gaps.', ar: 'انظر نقاط القوة والفجوات في عملك.' },
    steps: [
      { stepId: 'an-01', targetId: 'analysis-generate', route: null, message: { en: 'Click Analyse to generate an AI-powered SWOT for your business.', ar: 'انقر على تحليل لإنشاء تحليل SWOT بالذكاء الاصطناعي لعملك.' }, arrowDirection: 'down', spotlight: true, glowTarget: true, requiredAction: 'informational', robotState: 'pointing', skippable: true },
    ],
  },
  'idea-validator-tour': {
    id: 'idea-validator-tour',
    title: { en: 'Idea Validator Tour', ar: 'جولة مدقق الأفكار' },
    description: { en: 'Score your idea before committing.', ar: 'قيّم فكرتك قبل الالتزام بها.' },
    steps: [
      { stepId: 'iv-01', targetId: 'idea-validator-input', route: null, message: { en: 'Describe your idea and get an AI viability score with feedback.', ar: 'صف فكرتك واحصل على درجة قابلية تطبيق بالذكاء الاصطناعي.' }, arrowDirection: 'down', spotlight: true, glowTarget: true, requiredAction: 'informational', robotState: 'idle', skippable: true },
    ],
  },
  'pitch-deck-tour': {
    id: 'pitch-deck-tour',
    title: { en: 'Pitch Deck Tour', ar: 'جولة العرض التقديمي' },
    description: { en: 'Create a professional investor presentation.', ar: 'أنشئ عرضاً تقديمياً احترافياً للمستثمرين.' },
    steps: [
      { stepId: 'pd-01', targetId: 'pitch-deck-generate', route: null, message: { en: 'Generate your pitch deck from your saved business plan data.', ar: 'أنشئ عرضك التقديمي من بيانات خطة عملك المحفوظة.' }, arrowDirection: 'down', spotlight: true, glowTarget: true, requiredAction: 'informational', robotState: 'celebrate', skippable: true },
    ],
  },
}
