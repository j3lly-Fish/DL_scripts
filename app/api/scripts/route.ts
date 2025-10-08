import { NextRequest, NextResponse } from 'next/server';
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

    const scripts = await prisma.script.findMany({
      orderBy: {
        createdAt: 'desc',
      },
    });

    return NextResponse.json({ scripts });
  } catch (error) {
    console.error('Get scripts error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getSession();
    
    if (!session || session.role !== 'ADMIN') {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const { name, description, code, category } = await request.json();

    if (!name || !description || !code || !category) {
      return NextResponse.json(
        { error: 'All fields are required' },
        { status: 400 }
      );
    }

    const newScript = await prisma.script.create({
      data: {
        name,
        description,
        code,
        category,
        createdBy: session.userId,
      },
    });

    return NextResponse.json({ script: newScript }, { status: 201 });
  } catch (error) {
    console.error('Create script error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}