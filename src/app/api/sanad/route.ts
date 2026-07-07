import { NextRequest, NextResponse } from 'next/server'

export const maxDuration = 60

type ChatRole = 'system' | 'user' | 'assistant'

type ClientMessage = {
  role?: ChatRole
  content?: unknown
}

type ProviderConfig = {
  provider: 'glm' | 'nvidia'
  apiKey: string
  url: string
  model: string
  headers: Record<string, string>
}

const DEFAULT_GLM_BASE_URL = 'https://open.bigmodel.cn/api/paas/v4'
const DEFAULT_GLM_MODEL = 'glm-5.2'
const NVIDIA_BASE_URL = 'https://integrate.api.nvidia.com/v1'
const DEFAULT_NVIDIA_MODEL = 'meta/llama-3.1-8b-instruct'

function normalizeChatUrl(baseUrl: string) {
  const trimmed = baseUrl.replace(/\/+$/, '')
  return trimmed.endsWith('/chat/completions')
    ? trimmed
    : `${trimmed}/chat/completions`
}

function cleanText(value: unknown, maxLength = 4000) {
  return typeof value === 'string' ? value.trim().slice(0, maxLength) : ''
}

function sanitizeHistory(messages: unknown): { role: ChatRole; content: string }[] {
  if (!Array.isArray(messages)) return []

  return messages
    .slice(-12)
    .map((message: ClientMessage) => {
      const role: ChatRole = message.role === 'assistant' || message.role === 'system' ? message.role : 'user'
      return {
        role,
        content: cleanText(message.content, 1200),
      }
    })
    .filter((message) => message.content.length > 0)
}

function languageInstruction(language: string) {
  if (language === 'ar') {
    return 'Respond entirely in clear, professional Arabic. Keep business terms understandable for founders.'
  }

  if (language === 'fr') {
    return 'Respond entirely in clear, professional French. Keep business terms understandable for founders.'
  }

  return 'Respond entirely in clear, professional English.'
}

function getProviderConfig(): ProviderConfig | null {
  const glmApiKey = process.env.GLM_API_KEY || process.env.ZAI_API_KEY || process.env.BIGMODEL_API_KEY

  if (glmApiKey) {
    return {
      provider: 'glm',
      apiKey: glmApiKey,
      url: normalizeChatUrl(process.env.GLM_API_BASE_URL || process.env.ZAI_API_BASE_URL || DEFAULT_GLM_BASE_URL),
      model: process.env.GLM_MODEL || DEFAULT_GLM_MODEL,
      headers: { 'X-Z-AI-From': 'Tashyeed-Sanad' },
    }
  }

  const nvidiaApiKey = process.env.NVIDIA_API_KEY
  if (nvidiaApiKey) {
    return {
      provider: 'nvidia',
      apiKey: nvidiaApiKey,
      url: normalizeChatUrl(process.env.NVIDIA_API_BASE_URL || NVIDIA_BASE_URL),
      model: process.env.NVIDIA_SANAD_MODEL || DEFAULT_NVIDIA_MODEL,
      headers: {},
    }
  }

  return null
}

function extractReply(data: any) {
  const content = data?.choices?.[0]?.message?.content

  if (typeof content === 'string') return content.trim()

  if (Array.isArray(content)) {
    return content
      .map((part) => {
        if (typeof part === 'string') return part
        if (typeof part?.text === 'string') return part.text
        if (typeof part?.content === 'string') return part.content
        return ''
      })
      .join('')
      .trim()
  }

  return ''
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const message = cleanText(body?.message)

    if (!message) {
      return NextResponse.json({ success: false, error: 'Message is required' }, { status: 400 })
    }

    const providerConfig = getProviderConfig()
    if (!providerConfig) {
      return NextResponse.json(
        { success: false, error: 'Sanad AI is not configured. Add GLM_API_KEY on the server.' },
        { status: 500 },
      )
    }

    const language = cleanText(body?.language, 12) || 'en'
    const page = cleanText(body?.page, 80) || 'dashboard'
    const business = body?.business || null
    const currentStep = body?.currentStep || null
    const taskSummary = body?.taskSummary || null
    const history = sanitizeHistory(body?.messages)

    const businessContext = business
      ? `
Business name: ${cleanText(business.name, 120) || 'Not set'}
Description: ${cleanText(business.description, 800) || 'Not set'}
Industry: ${cleanText(business.industry, 120) || 'Not set'}
Stage: ${cleanText(business.stage, 120) || 'Not set'}
Target market: ${cleanText(business.targetMarket, 300) || 'Not set'}
Revenue model: ${cleanText(business.revenueModel, 300) || 'Not set'}
Initial capital: ${business.initialCapital ?? 'Not set'}
Monthly burn rate: ${business.monthlyBurnRate ?? 'Not set'}
Plan progress: ${business.completedSteps ?? 0}/${business.totalSteps ?? 0} steps completed
`.trim()
      : 'No business has been selected yet.'

    const currentStepContext = currentStep
      ? `
Current plan step: ${cleanText(currentStep.title, 160) || 'Not set'}
Step status: ${cleanText(currentStep.status, 80) || 'Not set'}
Step description: ${cleanText(currentStep.description, 500) || 'Not set'}
`.trim()
      : 'No active plan step is selected.'

    const taskContext = taskSummary
      ? `Tasks: ${taskSummary.pending ?? 0} pending, ${taskSummary.inProgress ?? 0} in progress, ${taskSummary.completed ?? 0} completed.`
      : 'Task summary is unavailable.'

    const systemPrompt = `You are Sanad, the AI Co-Founder inside the Guidea/Tashyeed SaaS.

${languageInstruction(language)}

Your job:
- Help founders understand and use the SaaS: dashboard, idea validator, planner, tasks, financials, milestones, analysis, pitch deck, notifications, and settings.
- Give practical business guidance tailored to the current workspace context.
- Be professional, specific, and concise. Prefer short sections and bullets when helpful.
- Do not repeat the initial greeting. Answer the user's latest message directly.
- If the user asks how to use the SaaS, give a simple workflow they can follow inside the product.
- Ask at most one focused follow-up question, only when it helps the next action.

Current page: ${page}

Business context:
${businessContext}

Plan context:
${currentStepContext}

${taskContext}`

    const controller = new AbortController()
    const timer = setTimeout(() => controller.abort(), 45000)

    try {
      const requestBody = {
        model: providerConfig.model,
        messages: [
          { role: 'system', content: systemPrompt },
          ...history,
          { role: 'user', content: message },
        ],
        temperature: 0.55,
        top_p: 0.9,
        max_tokens: 700,
        stream: false,
        ...(providerConfig.provider === 'glm' ? { thinking: { type: 'disabled' } } : {}),
      }

      const completionRes = await fetch(providerConfig.url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${providerConfig.apiKey}`,
          ...providerConfig.headers,
        },
        signal: controller.signal,
        body: JSON.stringify(requestBody),
      })

      if (!completionRes.ok) {
        const errorText = await completionRes.text().catch(() => completionRes.statusText)
        console.error('[POST /api/sanad] AI service error:', completionRes.status, errorText)
        return NextResponse.json(
          { success: false, error: `Sanad AI service error: ${completionRes.status}` },
          { status: 502 },
        )
      }

      const completion = await completionRes.json()
      const reply = extractReply(completion)

      if (!reply) {
        return NextResponse.json(
          { success: false, error: 'Sanad AI returned an empty response' },
          { status: 500 },
        )
      }

      return NextResponse.json({
        success: true,
        reply,
        provider: providerConfig.provider,
        model: providerConfig.model,
      })
    } finally {
      clearTimeout(timer)
    }
  } catch (error: any) {
    console.error('[POST /api/sanad]', error?.message || error)
    return NextResponse.json(
      { success: false, error: 'Failed to get Sanad response' },
      { status: 500 },
    )
  }
}
