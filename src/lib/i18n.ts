import { useAppStore } from './store'

type Translations = Record<string, Record<string, string>>

export const dictionary: Translations = {
  en: {
    // Sidebar
    'nav.dashboard': 'Dashboard',
    'nav.planner': 'Planner',
    'nav.tasks': 'Tasks',
    'nav.financials': 'Financials',
    'nav.milestones': 'Milestones',
    'nav.analysis': 'Analysis',
    'nav.settings': 'Settings',
    'sidebar.newBusiness': 'New Business',
    'sidebar.signOut': 'Sign Out',
    'sidebar.language': 'Language',
    
    // Dashboard
    'dashboard.greeting': 'Welcome back,',
    'dashboard.health': 'Business Health',
    'dashboard.tasks': 'Pending Tasks',
    'dashboard.milestones': 'Next Milestone',
    'dashboard.burnRate': 'Monthly Burn Rate',
    'dashboard.recentActivity': 'Recent Activity',
    'dashboard.noActivity': 'No recent activity',
    
    // Chat Panel
    'chat.placeholder': 'Ask your AI advisor...',
    'chat.send': 'Send',
    'chat.clear': 'Clear History',
    'chat.advisor': 'AI Advisor',
    'chat.quick.howToStart': 'How do I get started?',
    'chat.quick.reviewPlan': 'Review my business plan',
    'chat.quick.funding': 'How to get funding?',
    
    // Planner
    'planner.title': 'Business Plan',
    'planner.status.completed': 'Completed',
    'planner.status.inProgress': 'In Progress',
    'planner.status.locked': 'Locked',

    // Planner Strings
    'planner.unlockMsg': 'Complete previous step to unlock',
    'planner.start': 'Start',
    'planner.complete': 'Complete',
    'planner.skip': 'Skip',
    'planner.skipped': 'Skipped',
    'planner.tasksForStep': 'Tasks for this step',
    'planner.noTasks': 'No tasks yet for this step.',
    'planner.generating': 'Generating...',
    'planner.generateTasks': 'Generate Suggested Tasks',
    'planner.planProgress': 'Plan Progress',
    'planner.steps': 'steps',
    'planner.noBusiness': 'No Business Selected',
    'planner.noBusinessDesc': 'Select or create a business to view your plan',
    'planner.checklist': 'Checklist',
    'planner.completeWord': 'complete',

    
    // Common
    'common.cancel': 'Cancel',
    'common.save': 'Save',
    'common.create': 'Create',
    'common.loading': 'Loading...',
    
    // Pitch Deck
    'nav.pitchDeck': 'Pitch Deck',
    'pitchDeck.title': 'AI Pitch Deck',
    'pitchDeck.download': 'Download PDF',
    'pitchDeck.generating': 'Generating PDF...',
    'pitchDeck.empty': 'No Pitch Deck Yet',
    'pitchDeck.emptyDesc': 'Validate your idea to automatically generate a professional pitch deck.',
    'pitchDeck.validate': 'Validate Idea',
    'pitchDeck.designNote': 'Design Note',

    // Idea Validator
    'idea.title': 'AI Idea Validator',
    'idea.subtitle': 'Tell us your idea in one sentence. Our AI will read it, understand it, then generate questions tailored specifically to your type of business — not a generic one-size-fits-all quiz.',
    'idea.smartQuestions': 'Smart Questions',
    'idea.smartQuestionsDesc': 'AI tailors every question to your idea',
    'idea.successScore': 'Success Score',
    'idea.successScoreDesc': 'Honest % probability',
    'idea.vcReport': 'VC-Grade Report',
    'idea.vcReportDesc': 'McKinsey-level analysis',
    'idea.start': 'Start Validation',
    'idea.generating': 'Generating Smart Questions...',
    'idea.evaluating': 'Evaluating your idea...',
    'idea.reportTitle': 'AI Market Analysis & Feasibility Report',
    'idea.generatePlan': 'Generate Plan & Pitch Deck',
    'idea.saving': 'Saving your idea as a new business...',
    'idea.generatingPlan': 'Generating your 10-step execution plan...',
    'idea.opening': 'Opening your planner...',
    'idea.scorePrefix': 'Your idea scored',
    'idea.scoreSuffix': 'which means it has strong potential. Let our AI generate a comprehensive 10-step execution plan and a professional investor pitch deck.',

    'idea.startOver': 'Start Over',
    'idea.working': 'Working on it...',
    'idea.planSetup': 'Setup',
    'idea.planPlan': 'Plan',
    'idea.planPitchDeck': 'Pitch Deck',
    'idea.planDone': 'Done',


  },
  ar: {
    // Sidebar
    'nav.dashboard': 'لوحة القيادة',
    'nav.planner': 'الخطة',
    'nav.tasks': 'المهام',
    'nav.financials': 'المالية',
    'nav.milestones': 'المعالم',
    'nav.analysis': 'التحليل',
    'nav.settings': 'الإعدادات',
    'sidebar.newBusiness': 'عمل جديد',
    'sidebar.signOut': 'تسجيل خروج',
    'sidebar.language': 'اللغة',
    
    // Dashboard
    'dashboard.greeting': 'مرحباً بعودتك،',
    'dashboard.health': 'صحة العمل',
    'dashboard.tasks': 'المهام المعلقة',
    'dashboard.milestones': 'المعلم التالي',
    'dashboard.burnRate': 'معدل الحرق الشهري',
    'dashboard.recentActivity': 'النشاط الأخير',
    'dashboard.noActivity': 'لا يوجد نشاط أخير',
    
    // Chat Panel
    'chat.placeholder': 'اسأل مستشارك الذكي...',
    'chat.send': 'إرسال',
    'chat.clear': 'مسح السجل',
    'chat.advisor': 'المستشار الذكي',
    'chat.quick.howToStart': 'كيف أبدأ؟',
    'chat.quick.reviewPlan': 'راجع خطة عملي',
    'chat.quick.funding': 'كيف أحصل على تمويل؟',
    
    // Planner
    'planner.title': 'خطة العمل',
    'planner.status.completed': 'مكتمل',
    'planner.status.inProgress': 'قيد التنفيذ',
    'planner.status.locked': 'مغلق',

    // Planner Strings
    'planner.unlockMsg': 'أكمل الخطوة السابقة لفتح القفل',
    'planner.start': 'ابدأ',
    'planner.complete': 'أكمل',
    'planner.skip': 'تخطي',
    'planner.skipped': 'تم التخطي',
    'planner.tasksForStep': 'مهام هذه الخطوة',
    'planner.noTasks': 'لا توجد مهام حتى الآن لهذه الخطوة.',
    'planner.generating': 'جاري الإنشاء...',
    'planner.generateTasks': 'إنشاء مهام مقترحة',
    'planner.planProgress': 'تقدم الخطة',
    'planner.steps': 'خطوات',
    'planner.noBusiness': 'لم يتم تحديد عمل',
    'planner.noBusinessDesc': 'حدد أو قم بإنشاء عمل لعرض خطتك',
    'planner.checklist': 'قائمة التحقق',
    'planner.completeWord': 'مكتمل',

    
    // Common
    'common.cancel': 'إلغاء',
    'common.save': 'حفظ',
    'common.create': 'إنشاء',
    'common.loading': 'جاري التحميل...',
    
    // Pitch Deck
    'nav.pitchDeck': 'عرض تقديمي',
    'pitchDeck.title': 'العرض التقديمي الذكي',
    'pitchDeck.download': 'تحميل PDF',
    'pitchDeck.generating': 'جارٍ إنشاء PDF...',
    'pitchDeck.empty': 'لا يوجد عرض تقديمي بعد',
    'pitchDeck.emptyDesc': 'قيّم فكرتك لتوليد عرض تقديمي احترافي تلقائياً.',
    'pitchDeck.validate': 'تقييم الفكرة',
    'pitchDeck.designNote': 'ملاحظة تصميم',

    // Idea Validator
    'idea.title': 'مُقيّم الأفكار الذكي',
    'idea.subtitle': 'أخبرنا بفكرتك في جملة واحدة. سيقوم الذكاء الاصطناعي بقراءتها وفهمها، ثم إنشاء أسئلة مصممة خصيصًا لنوع عملك — وليس اختبارًا عامًا.',
    'idea.smartQuestions': 'أسئلة ذكية',
    'idea.smartQuestionsDesc': 'أسئلة مخصصة لفكرتك',
    'idea.successScore': 'نسبة النجاح',
    'idea.successScoreDesc': 'احتمالية نجاح واقعية',
    'idea.vcReport': 'تقرير استثماري',
    'idea.vcReportDesc': 'تحليل على مستوى عالي',
    'idea.start': 'ابدأ التقييم',
    'idea.generating': 'جاري إنشاء أسئلة ذكية...',
    'idea.evaluating': 'جاري تقييم فكرتك...',
    'idea.reportTitle': 'تحليل السوق الذكي وتقرير الجدوى',
    'idea.generatePlan': 'إنشاء خطة وعرض تقديمي',
    'idea.saving': 'جاري حفظ فكرتك كعمل جديد...',
    'idea.generatingPlan': 'جاري إنشاء خطة تنفيذ من 10 خطوات...',
    'idea.opening': 'جاري فتح المخطط...',
    'idea.scorePrefix': 'سجلت فكرتك',
    'idea.scoreSuffix': 'مما يعني أن لديها إمكانات قوية. دع الذكاء الاصطناعي يولد خطة تنفيذ شاملة وعرضًا تقديميًا احترافيًا.',

    'idea.startOver': 'ابدأ من جديد',
    'idea.working': 'جاري العمل...',
    'idea.planSetup': 'إعداد',
    'idea.planPlan': 'خطة',
    'idea.planPitchDeck': 'عرض تقديمي',
    'idea.planDone': 'تم',


  },
  fr: {
    // Sidebar
    'nav.dashboard': 'Tableau de bord',
    'nav.planner': 'Planificateur',
    'nav.tasks': 'Tâches',
    'nav.financials': 'Finances',
    'nav.milestones': 'Jalons',
    'nav.analysis': 'Analyse',
    'nav.settings': 'Paramètres',
    'sidebar.newBusiness': 'Nouvelle entreprise',
    'sidebar.signOut': 'Se déconnecter',
    'sidebar.language': 'Langue',
    
    // Dashboard
    'dashboard.greeting': 'Bon retour,',
    'dashboard.health': 'Santé de l\'entreprise',
    'dashboard.tasks': 'Tâches en attente',
    'dashboard.milestones': 'Prochain jalon',
    'dashboard.burnRate': 'Taux de combustion mensuel',
    'dashboard.recentActivity': 'Activité récente',
    'dashboard.noActivity': 'Aucune activité récente',
    
    // Chat Panel
    'chat.placeholder': 'Demandez à votre conseiller IA...',
    'chat.send': 'Envoyer',
    'chat.clear': 'Effacer l\'historique',
    'chat.advisor': 'Conseiller IA',
    'chat.quick.howToStart': 'Comment commencer ?',
    'chat.quick.reviewPlan': 'Revoir mon plan',
    'chat.quick.funding': 'Comment obtenir un financement ?',
    
    // Planner
    'planner.title': 'Plan d\'affaires',
    'planner.status.completed': 'Terminé',
    'planner.status.inProgress': 'En cours',
    'planner.status.locked': 'Verrouillé',

    // Planner Strings
    'planner.unlockMsg': 'Terminez l\'étape précédente pour débloquer',
    'planner.start': 'Commencer',
    'planner.complete': 'Terminer',
    'planner.skip': 'Passer',
    'planner.skipped': 'Ignoré',
    'planner.tasksForStep': 'Tâches pour cette étape',
    'planner.noTasks': 'Pas encore de tâches pour cette étape.',
    'planner.generating': 'Génération...',
    'planner.generateTasks': 'Générer des tâches',
    'planner.planProgress': 'Progression',
    'planner.steps': 'étapes',
    'planner.noBusiness': 'Aucune entreprise sélectionnée',
    'planner.noBusinessDesc': 'Sélectionnez ou créez une entreprise pour voir votre plan',
    'planner.checklist': 'Liste de contrôle',
    'planner.completeWord': 'terminé',

    
    // Common
    'common.cancel': 'Annuler',
    'common.save': 'Enregistrer',
    'common.create': 'Créer',
    'common.loading': 'Chargement...',
    
    // Pitch Deck
    'nav.pitchDeck': 'Pitch Deck',
    'pitchDeck.title': 'Pitch Deck IA',
    'pitchDeck.download': 'Télécharger PDF',
    'pitchDeck.generating': 'Génération du PDF...',
    'pitchDeck.empty': 'Pas encore de Pitch Deck',
    'pitchDeck.emptyDesc': 'Validez votre idée pour générer automatiquement un pitch deck professionnel.',
    'pitchDeck.validate': 'Valider l\'idée',
    'pitchDeck.designNote': 'Note de design',

    // Idea Validator
    'idea.title': 'Validateur d\'idées IA',
    'idea.subtitle': 'Décrivez votre idée en une phrase. Notre IA va la lire, la comprendre, puis générer des questions spécifiquement adaptées à votre type d\'entreprise.',
    'idea.smartQuestions': 'Questions Intelligentes',
    'idea.smartQuestionsDesc': 'Questions adaptées à votre idée',
    'idea.successScore': 'Score de Succès',
    'idea.successScoreDesc': 'Probabilité honnête en %',
    'idea.vcReport': 'Rapport VC',
    'idea.vcReportDesc': 'Analyse de haut niveau',
    'idea.start': 'Commencer la validation',
    'idea.generating': 'Génération de questions intelligentes...',
    'idea.evaluating': 'Évaluation de votre idée...',
    'idea.reportTitle': 'Analyse de marché IA et rapport de faisabilité',
    'idea.generatePlan': 'Générer le plan et le Pitch Deck',
    'idea.saving': 'Enregistrement de votre idée...',
    'idea.generatingPlan': 'Génération de votre plan d\'exécution en 10 étapes...',
    'idea.opening': 'Ouverture de votre planificateur...',
    'idea.scorePrefix': 'Votre idée a obtenu',
    'idea.scoreSuffix': 'ce qui signifie qu\'elle a un fort potentiel. Laissez notre IA générer un plan d\'exécution complet et un pitch deck professionnel.',

    'idea.startOver': 'Recommencer',
    'idea.working': 'Travail en cours...',
    'idea.planSetup': 'Configuration',
    'idea.planPlan': 'Plan',
    'idea.planPitchDeck': 'Pitch Deck',
    'idea.planDone': 'Terminé',


  }
}

export function useTranslation() {
  const language = useAppStore(state => state.language)
  
  const t = (key: string): string => {
    const langDict = dictionary[language] || dictionary.en
    return langDict[key] || dictionary.en[key] || key
  }
  
  return { t, language }
}
