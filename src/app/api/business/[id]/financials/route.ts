import { NextRequest, NextResponse } from 'next/server';
export const dynamic = "force-dynamic";
import { db } from '@/lib/db';
import { getCurrentUser } from '@/lib/auth-server';

type RouteContext = { params: Promise<{ id: string }> };

// GET /api/business/[id]/financials — Get financial data for business
export async function GET(
  _request: NextRequest,
  context: RouteContext
) {
  try {
    const { id: businessId } = await context.params;

    const business = await db.business.findUnique({ where: { id: businessId } });
    if (!business) {
      return NextResponse.json(
        { success: false, error: 'Business not found' },
        { status: 404 }
      );
    }

    const financials = await db.financial.findMany({
      where: { businessId },
      orderBy: { createdAt: 'asc' },
    });

    // Calculate summary
    const actuals = financials.filter((f) => !f.projection);
    const projections = financials.filter((f) => f.projection);
    const totalRevenue = actuals.reduce((sum, f) => sum + f.revenue, 0);
    const totalExpenses = actuals.reduce((sum, f) => sum + f.expenses, 0);
    const totalProfit = actuals.reduce((sum, f) => sum + f.profit, 0);

    return NextResponse.json({
      success: true,
      data: {
        financials,
        summary: {
          totalRevenue,
          totalExpenses,
          totalProfit,
          actualCount: actuals.length,
          projectionCount: projections.length,
        },
      },
    });
  } catch (error) {
    console.error('[GET /api/business/[id]/financials]', error);
    return NextResponse.json(
      { success: false, error: 'Failed to get financials' },
      { status: 500 }
    );
  }
}

// POST /api/business/[id]/financials — Create/update financial period
// POST /api/business/[id]/financials?action=generate-projections — AI generate projections
export async function POST(
  request: NextRequest,
  context: RouteContext
) {
  try {
    const { id: businessId } = await context.params;
    const action = request.nextUrl.searchParams.get('action');

    const business = await db.business.findUnique({ where: { id: businessId } });
    if (!business) {
      return NextResponse.json(
        { success: false, error: 'Business not found' },
        { status: 404 }
      );
    }

    // AI-generate financial projections
    if (action === 'generate-projections') {
      const existingFinancials = await db.financial.findMany({
        where: { businessId, projection: false },
        orderBy: { createdAt: 'asc' },
      });

      const financialsSummary = existingFinancials.length > 0
        ? existingFinancials
            .map((f) => `${f.period}: Revenue $${f.revenue}, Expenses $${f.expenses}, Profit $${f.profit}, Customers ${f.customers}`)
            .join('\n')
        : 'No existing financial data available.';

      const businessContext = `
Business: ${business.name}
Industry: ${business.industry}
Stage: ${business.stage}
Revenue Model: ${business.revenueModel}
Initial Capital: $${business.initialCapital}
Monthly Burn Rate: $${business.monthlyBurnRate}

Existing Financial Data:
${financialsSummary}
      `.trim();

      const nvidiaApiKey = process.env.NVIDIA_API_KEY;
      if (!nvidiaApiKey) {
        return NextResponse.json(
          { success: false, error: 'NVIDIA API key is not configured' },
          { status: 500 }
        );
      }

      const completionRes = await fetch('https://integrate.api.nvidia.com/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${nvidiaApiKey}`
        },
        body: JSON.stringify({
          model: 'meta/llama-3.1-70b-instruct',
          messages: [
            {
              role: 'assistant',
              content: `You are Tashyeed, an elite financial analyst and business strategist specializing in startup financial projections. You generate realistic, data-driven financial projections.

Generate 12 monthly financial projections for the business described below. Consider the industry, stage, revenue model, and any existing data.

Return ONLY a JSON object with a "projections" array. Each projection must have:
{
  "period": string (format: "month-1", "month-2", ... "month-12"),
  "revenue": number (monthly revenue in dollars),
  "expenses": number (monthly expenses in dollars),
  "profit": number (revenue - expenses),
  "customers": number (estimated customer count),
  "burnRate": number (monthly burn rate),
  "runway": number (months of runway remaining)
}

Be realistic but optimistic. Early months should show lower revenue with growth over time. Account for the business's specific industry and stage. Return ONLY the JSON object.`,
            },
            {
              role: 'user',
              content: `Generate 12-month financial projections for:\n\n${businessContext}`,
            },
          ],
          temperature: 0.7,
          top_p: 0.9,
          max_tokens: 2000
        })
      });

      if (!completionRes.ok) {
         throw new Error(`NVIDIA API error: ${completionRes.statusText}`);
      }

      const completion = await completionRes.json();
      const responseText = completion.choices[0]?.message?.content;
      if (!responseText) {
        return NextResponse.json(
          { success: false, error: 'AI failed to generate projections' },
          { status: 500 }
        );
      }

      let projections;
      try {
        const jsonMatch = responseText.match(/\{[\s\S]*\}/);
        if (!jsonMatch) throw new Error('No JSON found');
        const parsed = JSON.parse(jsonMatch[0]);
        projections = parsed.projections || parsed;
      } catch {
        console.error('[financials] Failed to parse AI response:', responseText);
        return NextResponse.json(
          { success: false, error: 'Failed to parse AI-generated projections' },
          { status: 500 }
        );
      }

      // Remove existing projections and save new ones
      await db.financial.deleteMany({
        where: { businessId, projection: true },
      });

      const projectionData = (projections as Record<string, unknown>[]).map((p) => ({
        businessId,
        period: String(p.period || 'month-1'),
        revenue: Number(p.revenue) || 0,
        expenses: Number(p.expenses) || 0,
        profit: Number(p.profit) || 0,
        customers: Number(p.customers) || 0,
        burnRate: Number(p.burnRate) || 0,
        runway: Number(p.runway) || 0,
        projection: true,
      }));

      await db.financial.createMany({ data: projectionData });

      const allFinancials = await db.financial.findMany({
        where: { businessId },
        orderBy: { createdAt: 'asc' },
      });

      return NextResponse.json({
        success: true,
        data: { financials: allFinancials, generatedBy: 'ai' },
      });
    }

    // Regular: Create/update financial period
    const body = await request.json();
    const {
      period,
      revenue,
      expenses,
      profit,
      customers,
      burnRate,
      runway,
      projection,
    } = body;

    if (!period) {
      return NextResponse.json(
        { success: false, error: 'Period is required' },
        { status: 400 }
      );
    }

    // Check if a financial record for this period already exists
    const existing = await db.financial.findFirst({
      where: { businessId, period, projection: projection || false },
    });

    let financial;
    if (existing) {
      financial = await db.financial.update({
        where: { id: existing.id },
        data: {
          revenue: revenue ?? existing.revenue,
          expenses: expenses ?? existing.expenses,
          profit: profit ?? (revenue !== undefined && expenses !== undefined ? revenue - expenses : existing.profit),
          customers: customers ?? existing.customers,
          burnRate: burnRate ?? existing.burnRate,
          runway: runway ?? existing.runway,
        },
      });
    } else {
      financial = await db.financial.create({
        data: {
          businessId,
          period,
          revenue: revenue || 0,
          expenses: expenses || 0,
          profit: profit ?? ((revenue || 0) - (expenses || 0)),
          customers: customers || 0,
          burnRate: burnRate || 0,
          runway: runway || 0,
          projection: projection || false,
        },
      });
    }

    return NextResponse.json({ success: true, data: financial }, { status: 201 });
  } catch (error) {
    console.error('[POST /api/business/[id]/financials]', error);
    return NextResponse.json(
      { success: false, error: 'Failed to process financials' },
      { status: 500 }
    );
  }
}
