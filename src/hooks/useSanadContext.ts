import { useEffect, useState } from 'react';
import { usePathname } from 'next/navigation';
import { useAppStore } from '@/lib/store';
import { useSanadStore } from '@/lib/sanad-store';

export interface SanadContext {
  page: string;
  businessName: string | null;
  industry: string | null;
  stage: string | null;
  activePlanStep: string | null;
  pendingTasksCount: number;
  completedStepsCount: number;
  totalStepsCount: number;
  suggestedAction: string;
}

export function useSanadContext() {
  const pathname = usePathname() || '';
  const { currentBusiness, tasks } = useAppStore();
  const { addMessage, messages } = useSanadStore();
  const [hasWelcomed, setHasWelcomed] = useState<Record<string, boolean>>({});

  // Derive Context
  const page = pathname.split('/').pop() || 'dashboard';
  const businessName = currentBusiness?.name || null;
  const industry = currentBusiness?.industry || null;
  const stage = currentBusiness?.stage || null;
  
  const pendingTasksCount = tasks.filter(t => t.status !== 'completed').length;
  const totalStepsCount = currentBusiness?.planSteps?.length || 0;
  const completedStepsCount = currentBusiness?.planSteps?.filter(s => s.status === 'completed').length || 0;
  const activePlanStep = currentBusiness?.planSteps?.find(s => s.status === 'current' || s.status === 'in_progress')?.title || null;

  // Next Best Action Engine
  let suggestedAction = 'Start by exploring your dashboard.';
  if (!currentBusiness) {
    suggestedAction = 'Validate your first business idea.';
  } else if (completedStepsCount === 0) {
    suggestedAction = 'Begin Step 1 of your business plan.';
  } else if (pendingTasksCount > 0) {
    suggestedAction = `You have ${pendingTasksCount} pending tasks to review.`;
  } else if (completedStepsCount < totalStepsCount) {
    suggestedAction = `Continue working on: ${activePlanStep}`;
  } else {
    suggestedAction = 'Generate your investor pitch deck!';
  }

  const contextPayload: SanadContext = {
    page,
    businessName,
    industry,
    stage,
    activePlanStep,
    pendingTasksCount,
    completedStepsCount,
    totalStepsCount,
    suggestedAction
  };

  // Contextual Welcome Messages
  useEffect(() => {
    // Prevent spamming if already welcomed on this page
    if (hasWelcomed[page] || !currentBusiness) return;
    
    // Only welcome if chat is empty except for the initial default message
    if (messages.length > 2) return;

    let welcomeMsg = '';
    
    switch (page) {
      case 'dashboard':
        welcomeMsg = `Welcome to your dashboard for ${businessName}. ${suggestedAction}`;
        break;
      case 'planner':
        welcomeMsg = `This is your Step-by-Step planner. ${suggestedAction}`;
        break;
      case 'tasks':
        welcomeMsg = pendingTasksCount > 0 
          ? `You have ${pendingTasksCount} active tasks. I suggest tackling the high-priority ones first.`
          : `Your task board is clear! Ready to move to the next plan step?`;
        break;
      case 'financials':
        welcomeMsg = `Let's establish your financial baseline. Do you have an estimate for your initial capital?`;
        break;
      case 'pitch-deck':
        welcomeMsg = `Your plan is solid. Let's synthesize this into a professional pitch deck outline.`;
        break;
    }

    if (welcomeMsg) {
      // Simulate typing delay
      setTimeout(() => {
        addMessage({
          role: 'assistant',
          content: welcomeMsg
        });
      }, 1000);
      setHasWelcomed(prev => ({ ...prev, [page]: true }));
    }
  }, [page, currentBusiness, suggestedAction, pendingTasksCount, hasWelcomed, messages.length, addMessage, businessName]);

  return contextPayload;
}
