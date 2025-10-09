import { NextRequest } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getSession } from '@/lib/auth';
import { maskToken } from '@/lib/utils';
import { spawn } from 'child_process';
import * as fs from 'fs';
import * as path from 'path';
import * as os from 'os';

export async function POST(request: NextRequest) {
  const encoder = new TextEncoder();
  
  const stream = new ReadableStream({
    async start(controller) {
      try {
        const session = await getSession();
        
        if (!session) {
          controller.enqueue(encoder.encode(JSON.stringify({ type: 'error', message: 'Unauthorized' }) + '\n'));
          controller.close();
          return;
        }

        const { scriptId, bearerToken, parameters } = await request.json();

        if (!scriptId || !bearerToken) {
          controller.enqueue(encoder.encode(JSON.stringify({ type: 'error', message: 'Script ID and bearer token are required' }) + '\n'));
          controller.close();
          return;
        }

        const script = await prisma.script.findUnique({
          where: { id: scriptId },
        });
        
        if (!script) {
          controller.enqueue(encoder.encode(JSON.stringify({ type: 'error', message: 'Script not found' }) + '\n'));
          controller.close();
          return;
        }

        const user = await prisma.user.findUnique({
          where: { id: session.userId },
        });
        
        if (!user) {
          controller.enqueue(encoder.encode(JSON.stringify({ type: 'error', message: 'User not found' }) + '\n'));
          controller.close();
          return;
        }

        // Create temporary directory and file
        const tempDir = os.tmpdir();
        const scriptPath = path.join(tempDir, `script_${Date.now()}_${script.id}.py`);
        
        // Write script to file
        fs.writeFileSync(scriptPath, script.code);

        controller.enqueue(encoder.encode(JSON.stringify({ 
          type: 'system', 
          message: `Starting Python script: ${script.name}` 
        }) + '\n'));

        // Prepare environment variables
        const env = {
          ...process.env,
          DOORLOOP_API_KEY: bearerToken,
          PYTHONUNBUFFERED: '1', // Disable Python output buffering
        };

        // Add parameters as environment variables if provided
        if (parameters && typeof parameters === 'object') {
          Object.entries(parameters).forEach(([key, value]) => {
            env[`PARAM_${key.toUpperCase()}`] = String(value);
          });
        }

        // Spawn Python process
        const pythonProcess = spawn('python3', [scriptPath], {
          env,
          cwd: tempDir,
        });

        let allOutput = '';

        // Handle stdout
        pythonProcess.stdout.on('data', (data) => {
          const output = data.toString();
          allOutput += output;
          
          // Send each line separately
          const lines = output.split('\n');
          lines.forEach(line => {
            if (line.trim()) {
              controller.enqueue(encoder.encode(JSON.stringify({ 
                type: 'output', 
                message: line 
              }) + '\n'));
            }
          });
        });

        // Handle stderr
        pythonProcess.stderr.on('data', (data) => {
          const error = data.toString();
          allOutput += error;
          
          const lines = error.split('\n');
          lines.forEach(line => {
            if (line.trim()) {
              controller.enqueue(encoder.encode(JSON.stringify({ 
                type: 'error', 
                message: line 
              }) + '\n'));
            }
          });
        });

        // Handle process completion
        pythonProcess.on('close', async (code) => {
          // Clean up temp file
          try {
            fs.unlinkSync(scriptPath);
          } catch (err) {
            console.error('Error deleting temp file:', err);
          }

          const success = code === 0;
          const status = success ? 'SUCCESS' : 'FAILURE';

          // Create audit log
          await prisma.auditLog.create({
            data: {
              userId: session.userId,
              userEmail: session.email,
              scriptId: script.id,
              scriptName: script.name,
              dbTenantId: user.dbTenantId,
              bearerToken: maskToken(bearerToken),
              status: status,
              response: success ? allOutput : undefined,
              error: success ? undefined : allOutput,
            },
          });

          controller.enqueue(encoder.encode(JSON.stringify({ 
            type: 'system', 
            message: success ? '✅ Script completed successfully' : `❌ Script exited with code ${code}` 
          }) + '\n'));

          controller.enqueue(encoder.encode(JSON.stringify({ 
            type: 'complete', 
            success,
            exitCode: code 
          }) + '\n'));

          controller.close();
        });

        // Handle errors
        pythonProcess.on('error', (error) => {
          controller.enqueue(encoder.encode(JSON.stringify({ 
            type: 'error', 
            message: `Failed to start Python: ${error.message}` 
          }) + '\n'));
          controller.close();
        });

      } catch (error: any) {
        controller.enqueue(encoder.encode(JSON.stringify({ 
          type: 'error', 
          message: `Server error: ${error.message}` 
        }) + '\n'));
        controller.close();
      }
    },
  });

  return new Response(stream, {
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      'Connection': 'keep-alive',
    },
  });
}