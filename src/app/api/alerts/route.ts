import { NextRequest, NextResponse } from 'next/server';
import { getAlerts } from '@/lib/alertStore';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const limit = parseInt(searchParams.get('limit') || '100');
  const alerts = getAlerts(limit);
  return NextResponse.json({ success: true, data: alerts, count: alerts.length });
}
