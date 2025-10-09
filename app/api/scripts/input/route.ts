// app/api/scripts/input/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { getSession } from '@/lib/auth';

// Access global process storage
declare global {
  var runningProcesses: Map<string, any>;
}

export async function POST(request: NextRequest) {
  try {
    const session = await getSession();
    
    if (!session) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const { processId, input } = await request.json();

    if (!processId || input === undefined) {
      return NextResponse.json(
        { error: 'Process ID and input are required' },
        { status: 400 }
      );
    }

    const processData = global.runningProcesses?.get(processId);
    
    if (!processData) {
      return NextResponse.json(
        { error: 'Process not found or has already completed' },
        { status: 404 }
      );
    }

    // Verify the process belongs to the current user
    if (processData.userId !== session.userId) {
      return NextResponse.json(
        { error: 'Unauthorized access to process' },
        { status: 403 }
      );
    }

    try {
      // Write input to the Python process's stdin
      processData.process.stdin.write(input + '\n');
      
      return NextResponse.json({ 
        success: true,
        message: 'Input sent successfully'
      });
    } catch (error: any) {
      console.error('Failed to send input to process:', error);
      return NextResponse.json(
        { error: 'Failed to send input to process', details: error.message },
        { status: 500 }
      );
    }
  } catch (error: any) {
    console.error('Input handler error:', error);
    return NextResponse.json(
      { error: 'Internal server error', details: error.message },
      { status: 500 }
    );
  }
}

// Optional: Add a route to stop a running process
export async function DELETE(request: NextRequest) {
  try {
    const session = await getSession();
    
    if (!session) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const { searchParams } = new URL(request.url);
    const processId = searchParams.get('processId');

    if (!processId) {
      return NextResponse.json(
        { error: 'Process ID is required' },
        { status: 400 }
      );
    }

    const processData = global.runningProcesses?.get(processId);
    
    if (!processData) {
      return NextResponse.json(
        { error: 'Process not found or has already completed' },
        { status: 404 }
      );
    }

    // Verify the process belongs to the current user
    if (processData.userId !== session.userId) {
      return NextResponse.json(
        { error: 'Unauthorized access to process' },
        { status: 403 }
      );
    }

    try {
      processData.process.kill('SIGTERM');
      global.runningProcesses.delete(processId);
      
      return NextResponse.json({ 
        success: true,
        message: 'Process terminated successfully'
      });
    } catch (error: any) {
      return NextResponse.json(
        { error: 'Failed to terminate process', details: error.message },
        { status: 500 }
      );
    }
  } catch (error: any) {
    console.error('Process termination error:', error);
    return NextResponse.json(
      { error: 'Internal server error', details: error.message },
      { status: 500 }
    );
  }
}