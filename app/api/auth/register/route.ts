import { NextRequest, NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import { prisma } from '@/lib/prisma';
import { createToken, setSession } from '@/lib/auth';

export async function POST(request: NextRequest) {
  try {
    const { email, password, dbTenantId } = await request.json();

    if (!email || !password || !dbTenantId) {
      return NextResponse.json(
        { error: 'All fields are required' },
        { status: 400 }
      );
    }

    const existingUser = await prisma.user.findUnique({
      where: { email },
    });
    
    if (existingUser) {
      return NextResponse.json(
        { error: 'User already exists' },
        { status: 409 }
      );
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const newUser = await prisma.user.create({
      data: {
        email,
        password: hashedPassword,
        dbTenantId,
        role: 'USER',
      },
    });

    const token = await createToken({
      userId: newUser.id,
      email: newUser.email,
      role: newUser.role,
    });

    await setSession(token);

    const { password: _, ...userWithoutPassword } = newUser;

    return NextResponse.json({
      user: userWithoutPassword,
      message: 'Registration successful'
    }, { status: 201 });
  } catch (error) {
    console.error('Registration error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}