// app/api/scripts/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getSession } from '@/lib/auth';

// GET - List all scripts (accessible to all authenticated users)
export async function GET(request: NextRequest) {
  try {
    const session = await getSession();
    
    if (!session) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // All users (both ADMIN and USER) can view all scripts
    const scripts = await prisma.script.findMany({
      orderBy: { createdAt: 'desc' },
      include: {
        creator: {
          select: {
            email: true,
            role: true,
          }
        },
        _count: {
          select: {
            auditLogs: true, // Count how many times script has been executed
          }
        }
      }
    });

    return NextResponse.json({ scripts });
  } catch (error: any) {
    console.error('Get scripts error:', error);
    return NextResponse.json(
      { error: 'Internal server error', details: error.message },
      { status: 500 }
    );
  }
}

// POST - Create new script (ADMIN ONLY)
export async function POST(request: NextRequest) {
  try {
    const session = await getSession();
    
    if (!session) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Check if user is admin
    const user = await prisma.user.findUnique({
      where: { id: session.userId },
    });

    if (!user || user.role !== 'ADMIN') {
      return NextResponse.json(
        { error: 'Forbidden: Only administrators can create scripts' },
        { status: 403 }
      );
    }

    const { name, description, code, language, category } = await request.json();

    if (!name || !code) {
      return NextResponse.json(
        { error: 'Name and code are required' },
        { status: 400 }
      );
    }

    // Create script
    const script = await prisma.script.create({
      data: {
        name,
        description,
        code,
        language: language || 'javascript',
        category,
        createdBy: session.userId,
      },
      include: {
        creator: {
          select: {
            email: true,
            role: true,
          }
        }
      }
    });

    return NextResponse.json({ 
      success: true, 
      script 
    }, { status: 201 });

  } catch (error: any) {
    console.error('Create script error:', error);
    return NextResponse.json(
      { error: 'Internal server error', details: error.message },
      { status: 500 }
    );
  }
}