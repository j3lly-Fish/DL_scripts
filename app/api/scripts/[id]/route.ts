// app/api/scripts/[id]/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getSession } from '@/lib/auth';

// GET - Get single script (accessible to all authenticated users)
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getSession();
    
    if (!session) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const script = await prisma.script.findUnique({
      where: { id: params.id },
      include: {
        creator: {
          select: {
            email: true,
            role: true,
          }
        }
      }
    });

    if (!script) {
      return NextResponse.json(
        { error: 'Script not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({ script });
  } catch (error: any) {
    console.error('Get script error:', error);
    return NextResponse.json(
      { error: 'Internal server error', details: error.message },
      { status: 500 }
    );
  }
}

// PUT - Update script (ADMIN ONLY)
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
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
        { error: 'Forbidden: Only administrators can update scripts' },
        { status: 403 }
      );
    }

    const { name, description, code, language, category } = await request.json();

    const script = await prisma.script.update({
      where: { id: params.id },
      data: {
        name,
        description,
        code,
        language,
        category,
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
    });

  } catch (error: any) {
    console.error('Update script error:', error);
    return NextResponse.json(
      { error: 'Internal server error', details: error.message },
      { status: 500 }
    );
  }
}

// DELETE - Delete script (ADMIN ONLY)
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
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
        { error: 'Forbidden: Only administrators can delete scripts' },
        { status: 403 }
      );
    }

    await prisma.script.delete({
      where: { id: params.id },
    });

    return NextResponse.json({ 
      success: true, 
      message: 'Script deleted successfully' 
    });

  } catch (error: any) {
    console.error('Delete script error:', error);
    return NextResponse.json(
      { error: 'Internal server error', details: error.message },
      { status: 500 }
    );
  }
}