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
