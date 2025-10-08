import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getSession } from '@/lib/auth';
import { maskToken } from '@/lib/utils';

export async function POST(request: NextRequest) {
  try {
    const session = await getSession();
    
    if (!session) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const { scriptId, bearerToken, parameters } = await request.json();

    if (!scriptId || !bearerToken) {
      return NextResponse.json(
        { error: 'Script ID and bearer token are required' },
        { status: 400 }
      );
    }

    const script = await prisma.script.findUnique({
      where: { id: scriptId },
    });
    
    if (!script) {
      return NextResponse.json(
        { error: 'Script not found' },
        { status: 404 }
      );
    }

    const user = await prisma.user.findUnique({
      where: { id: session.userId },
    });
    
    if (!user) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      );
    }

    try {
      // Execute the script
      // Note: In production, use a sandboxed environment
      const executeFunction = new Function('bearerToken', 'params', script.code + '\nreturn execute(bearerToken, params);');
      const result = await executeFunction(bearerToken, parameters || {});

      // Create audit log with success
      const auditLog = await prisma.auditLog.create({
        data: {
          userId: session.userId,
          userEmail: session.email,
          scriptId: script.id,
          scriptName: script.name,
          dbTenantId: user.dbTenantId,
          bearerToken: maskToken(bearerToken),
          status: 'SUCCESS',
          response: JSON.stringify(result),
        },
      });

      return NextResponse.json({
        success: true,
        result,
        auditLog,
      });
    } catch (executionError: any) {
      // Create audit log with failure
      const auditLog = await prisma.auditLog.create({
        data: {
          userId: session.userId,
          userEmail: session.email,
          scriptId: script.id,
          scriptName: script.name,
          dbTenantId: user.dbTenantId,
          bearerToken: maskToken(bearerToken),
          status: 'FAILURE',
          error: executionError.message,
        },
      });

      return NextResponse.json({
        success: false,
        error: executionError.message,
        auditLog,
      }, { status: 400 });
    }
  } catch (error: any) {
    console.error('Execute script error:', error);
    return NextResponse.json(
      { error: 'Internal server error', details: error.message },
      { status: 500 }
    );
  }
}