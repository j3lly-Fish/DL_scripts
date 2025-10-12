// app/api/scripts/execute/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getSession } from '@/lib/auth';
import { maskToken } from '@/lib/utils';
import { spawn } from 'child_process';

// Global storage for running processes
declare global {
  var runningProcesses: Map<string, any>;
}

global.runningProcesses = global.runningProcesses || new Map();

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

    // Check if script is a Python script (for streaming execution)
    const isPythonScript = script.language === 'python' || script.code.includes('#!/usr/bin/env python');

    if (isPythonScript) {
      // Handle Python scripts with streaming and input support
      return handlePythonExecution(script, bearerToken, parameters, session, user);
    } else {
      // Handle JavaScript scripts (original logic)
      return handleJavaScriptExecution(script, bearerToken, parameters, session, user);
    }

  } catch (error: any) {
    console.error('Execute script error:', error);
    return NextResponse.json(
      { error: 'Internal server error', details: error.message },
      { status: 500 }
    );
  }
}

// Handle Python script execution with streaming
async function handlePythonExecution(
  script: any,
  bearerToken: string,
  parameters: any,
  session: any,
  user: any
) {
  const encoder = new TextEncoder();
  const processId = `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  let outputBuffer = '';
  let hasError = false;
  let errorMessage = '';

  const stream = new ReadableStream({
    async start(controller) {
      try {
        // Spawn Python process with unbuffered output, reading from stdin
        const pythonProcess = spawn('python3', ['-u', '-c', script.code], {
          env: {
            ...process.env,
            DOORLOOP_API_KEY: bearerToken,
            BEARER_TOKEN: bearerToken,
            PYTHONUNBUFFERED: '1',
            ...parameters, // Pass parameters as environment variables
          }
        });

        // Store process reference for input handling
        global.runningProcesses.set(processId, {
          process: pythonProcess,
          scriptId: script.id,
          userId: session.userId,
        });

        // Send process ID to client
        controller.enqueue(
          encoder.encode(`data: ${JSON.stringify({ 
            type: 'process_id', 
            processId 
          })}\n\n`)
        );

        // Send initial metadata
        controller.enqueue(
          encoder.encode(`data: ${JSON.stringify({ 
            type: 'metadata',
            scriptName: script.name,
            scriptId: script.id
          })}\n\n`)
        );

        pythonProcess.stdout.on('data', (data) => {
          const output = data.toString();
          outputBuffer += output;

          controller.enqueue(
            encoder.encode(`data: ${JSON.stringify({ 
              type: 'output', 
              content: output 
            })}\n\n`)
          );

          // Detect input prompts (lines ending with : or ?)
          const lines = output.trim().split('\n');
          const lastLine = lines[lines.length - 1].trim();
          
          if (lastLine.endsWith(':') || lastLine.endsWith('?')) {
            controller.enqueue(
              encoder.encode(`data: ${JSON.stringify({ 
                type: 'input_required', 
                prompt: lastLine 
              })}\n\n`)
            );
          }
        });

        pythonProcess.stderr.on('data', (data) => {
          const errorOutput = data.toString();
          outputBuffer += errorOutput;
          hasError = true;
          errorMessage += errorOutput;

          controller.enqueue(
            encoder.encode(`data: ${JSON.stringify({ 
              type: 'error', 
              content: errorOutput 
            })}\n\n`)
          );
        });

        pythonProcess.on('close', async (code) => {
          // Clean up process reference
          global.runningProcesses.delete(processId);

          // Create audit log
          try {
            await prisma.auditLog.create({
              data: {
                userId: session.userId,
                userEmail: session.email,
                scriptId: script.id,
                scriptName: script.name,
                dbTenantId: user.dbTenantId,
                bearerToken: maskToken(bearerToken),
                status: code === 0 && !hasError ? 'SUCCESS' : 'FAILURE',
                response: code === 0 && !hasError ? outputBuffer : undefined,
                error: hasError ? errorMessage : (code !== 0 ? `Process exited with code ${code}` : undefined),
              },
            });
          } catch (auditError) {
            console.error('Failed to create audit log:', auditError);
          }

          controller.enqueue(
            encoder.encode(`data: ${JSON.stringify({ 
              type: 'complete', 
              exitCode: code,
              success: code === 0 && !hasError
            })}\n\n`)
          );
          
          controller.close();
        });

        pythonProcess.on('error', async (error) => {
          global.runningProcesses.delete(processId);
          hasError = true;
          errorMessage = error.message;

          controller.enqueue(
            encoder.encode(`data: ${JSON.stringify({ 
              type: 'error', 
              content: `Process error: ${error.message}` 
            })}\n\n`)
          );
        });

      } catch (error: any) {
        global.runningProcesses.delete(processId);
        controller.enqueue(
          encoder.encode(`data: ${JSON.stringify({ 
            type: 'error', 
            content: error.message 
          })}\n\n`)
        );
        controller.close();
      }
    },
    
    cancel() {
      // Clean up if client disconnects
      const processData = global.runningProcesses.get(processId);
      if (processData) {
        processData.process.kill();
        global.runningProcesses.delete(processId);
      }
    }
  });

  return new Response(stream, {
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      'Connection': 'keep-alive',
    },
  });
}

// Handle JavaScript script execution (original logic)
async function handleJavaScriptExecution(
  script: any,
  bearerToken: string,
  parameters: any,
  session: any,
  user: any
) {
  try {
    // Execute the script
    // Note: In production, use a sandboxed environment
    const executeFunction = new Function(
      'bearerToken', 
      'params', 
      script.code + '\nreturn execute(bearerToken, params);'
    );
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
}