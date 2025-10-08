import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getSession } from '@/lib/auth';

export async function GET() {
  try {
    const session = await getSession();
    
    if (!session) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // If admin, return all audit logs, otherwise return only user's logs
    const auditLogs = await prisma.auditLog.findMany({
      where: session.role === 'ADMIN' ? {} : { userId: session.userId },
      orderBy: {
        executedAt: 'desc',
      },
    });

    return NextResponse.json({ auditLogs });
  } catch (error) {
    console.error('Get audit logs error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}