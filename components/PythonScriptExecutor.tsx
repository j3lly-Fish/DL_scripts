'use client';

import { useState, useRef, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Play, Terminal, X, Download, StopCircle, Send } from 'lucide-react';

interface TerminalLine {
  type: 'output' | 'error' | 'system';
  content: string;
  timestamp: Date;
}

interface PythonScriptExecutorProps {
  script: {
    id: string;
    name: string;
    description: string;
    code: string;
  };
}

export default function PythonScriptExecutor({ script }: PythonScriptExecutorProps) {
  const [apiKey, setApiKey] = useState('');
  const [executing, setExecuting] = useState(false);
  const [terminalLines, setTerminalLines] = useState<TerminalLine[]>([]);
  const [showTerminal, setShowTerminal] = useState(false);
  const [inputRequired, setInputRequired] = useState(false);
  const [inputPrompt, setInputPrompt] = useState('');
  const [inputValue, setInputValue] = useState('');
  const [processId, setProcessId] = useState<string | null>(null);
  const terminalEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const abortControllerRef = useRef<AbortController | null>(null);

  useEffect(() => {
    terminalEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [terminalLines]);

  useEffect(() => {
    // Focus input when it becomes required
    if (inputRequired && inputRef.current) {
      inputRef.current.focus();
    }
  }, [inputRequired]);

  const addTerminalLine = (type: TerminalLine['type'], content: string) => {
    setTerminalLines(prev => [...prev, { type, content, timestamp: new Date() }]);
  };

  const executeScript = async () => {
    if (!apiKey) return;

    setExecuting(true);
    setShowTerminal(true);
    setTerminalLines([]);
    setInputRequired(false);
    setProcessId(null);

    addTerminalLine('system', `═══════════════════════════════════════════════════════════`);
    addTerminalLine('system', `Executing Python Script: ${script.name}`);
    addTerminalLine('system', `═══════════════════════════════════════════════════════════`);
    addTerminalLine('system', '');

    abortControllerRef.current = new AbortController();

    try {
      const response = await fetch('/api/scripts/execute', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          scriptId: script.id,
          bearerToken: apiKey,
          parameters: {},
        }),
        signal: abortControllerRef.current.signal,
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || `HTTP error! status: ${response.status}`);
      }

      const reader = response.body?.getReader();
      if (!reader) {
        throw new Error('No response body reader available');
      }

      const decoder = new TextDecoder();

      while (true) {
        const { done, value } = await reader.read();
        
        if (done) break;

        const chunk = decoder.decode(value, { stream: true });
        const lines = chunk.split('\n');

        for (const line of lines) {
          if (line.startsWith('data: ')) {
            try {
              const data = JSON.parse(line.slice(6));

              switch (data.type) {
                case 'process_id':
                  setProcessId(data.processId);
                  break;

                case 'metadata':
                  addTerminalLine('system', `Starting ${data.scriptName}...`);
                  break;

                case 'output':
                  addTerminalLine('output', data.content);
                  break;

                case 'input_required':
                  setInputRequired(true);
                  setInputPrompt(data.prompt);
                  addTerminalLine('system', '');
                  addTerminalLine('system', '⚡ INPUT REQUIRED ⚡');
                  break;

                case 'error':
                  addTerminalLine('error', data.content);
                  break;

                case 'complete':
                  setExecuting(false);
                  setInputRequired(false);
                  const statusEmoji = data.success ? '✅' : '❌';
                  const statusText = data.success ? 'SUCCESS' : 'FAILED';
                  addTerminalLine('system', '');
                  addTerminalLine('system', `${statusEmoji} Process completed: ${statusText} (exit code: ${data.exitCode})`);
                  break;
              }
            } catch (e) {
              // Ignore JSON parse errors for incomplete chunks
              console.debug('Parse error for line:', line);
            }
          }
        }
      }

    } catch (error: any) {
      if (error.name === 'AbortError') {
        addTerminalLine('system', '');
        addTerminalLine('system', '⚠️  Script execution cancelled by user');
      } else {
        addTerminalLine('error', '');
        addTerminalLine('error', `❌ Error: ${error.message}`);
      }
      setExecuting(false);
      setInputRequired(false);
    }

    addTerminalLine('system', '');
    addTerminalLine('system', `═══════════════════════════════════════════════════════════`);
    addTerminalLine('system', `Finished at ${new Date().toLocaleTimeString()}`);
    addTerminalLine('system', `═══════════════════════════════════════════════════════════`);
  };

  const handleInputSubmit = async (e?: React.FormEvent) => {
    e?.preventDefault();
    
    if (!inputValue.trim() || !processId) return;

    try {
      // Display the input in terminal
      addTerminalLine('output', inputValue);
      
      // Send input to Python process
      const response = await fetch('/api/scripts/input', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ processId, input: inputValue }),
      });

      if (!response.ok) {
        const error = await response.json();
        addTerminalLine('error', `Failed to send input: ${error.error}`);
      }

      // Reset input state
      setInputValue('');
      setInputRequired(false);
      setInputPrompt('');
    } catch (error: any) {
      addTerminalLine('error', `Error sending input: ${error.message}`);
    }
  };

  const stopExecution = async () => {
    if (processId) {
      try {
        const response = await fetch(`/api/scripts/input?processId=${processId}`, {
          method: 'DELETE',
        });

        if (response.ok) {
          addTerminalLine('system', '');
          addTerminalLine('system', '⚠️  Process termination requested...');
        }
      } catch (error: any) {
        addTerminalLine('error', `Failed to stop process: ${error.message}`);
      }
    }
    
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }
    
    setExecuting(false);
    setInputRequired(false);
  };

  const clearTerminal = () => {
    setTerminalLines([]);
  };

  const downloadLogs = () => {
    const logs = terminalLines
      .map(line => `[${line.timestamp.toLocaleTimeString()}] [${line.type.toUpperCase()}] ${line.content}`)
      .join('\n');
    
    const blob = new Blob([logs], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${script.name.replace(/\s+/g, '_')}_${Date.now()}.log`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const getLineColor = (type: TerminalLine['type']) => {
    switch (type) {
      case 'error': return 'text-red-400';
      case 'system': return 'text-cyan-400';
      default: return 'text-green-300';
    }
  };

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Terminal className="h-5 w-5 text-blue-600" />
            Execute Python Script: {script.name}
          </CardTitle>
          <CardDescription>
            This script will run on the server with live terminal output
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="apiKey">DoorLoop API Key</Label>
            <Input
              id="apiKey"
              type="password"
              placeholder="Enter your DoorLoop API key (bearer token)"
              value={apiKey}
              onChange={(e) => setApiKey(e.target.value)}
            />
            <p className="text-xs text-gray-500">
              This will be passed as DOORLOOP_API_KEY environment variable
            </p>
          </div>

          <div className="flex gap-3">
            <Button
              onClick={executeScript}
              disabled={executing || !apiKey}
              className="flex-1 bg-blue-600 hover:bg-blue-700"
            >
              <Play className="h-4 w-4 mr-2" />
              {executing ? 'Executing...' : 'Execute Python Script'}
            </Button>
            
            {executing && (
              <Button
                onClick={stopExecution}
                variant="destructive"
              >
                <StopCircle className="h-4 w-4 mr-2" />
                Stop
              </Button>
            )}
          </div>
        </CardContent>
      </Card>

      {showTerminal && (
        <Card className="border-2 border-gray-700 shadow-2xl">
          <CardHeader className="bg-gradient-to-r from-gray-900 to-gray-800 text-white">
            <div className="flex items-center justify-between">
              <CardTitle className="text-sm font-mono flex items-center gap-2">
                <Terminal className="h-4 w-4 text-green-400" />
                <span className="text-green-400">Python Terminal Output</span>
                {executing && (
                  <span className="text-xs text-yellow-400 animate-pulse ml-2">● Running</span>
                )}
              </CardTitle>
              <div className="flex gap-2">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={downloadLogs}
                  disabled={terminalLines.length === 0}
                  className="text-white hover:bg-gray-700"
                  title="Download logs"
                >
                  <Download className="h-4 w-4" />
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={clearTerminal}
                  className="text-white hover:bg-gray-700"
                  title="Clear terminal"
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </CardHeader>

          {/* Input Field Section - Shows when input is required */}
          {inputRequired && (
            <div className="bg-yellow-900/30 border-y-2 border-yellow-500/50 p-4">
              <div className="flex items-center gap-2 mb-3">
                <span className="text-yellow-400 text-sm font-bold">⚡ INPUT REQUIRED</span>
                <span className="text-xs text-gray-400">(Script is waiting for your response)</span>
              </div>
              <form onSubmit={handleInputSubmit} className="flex gap-2">
                <Input
                  ref={inputRef}
                  type="text"
                  value={inputValue}
                  onChange={(e) => setInputValue(e.target.value)}
                  placeholder={inputPrompt || "Type your response and press Enter..."}
                  className="flex-1 bg-gray-900 border-yellow-500/50 text-white font-mono focus:border-yellow-500"
                  autoComplete="off"
                  disabled={!executing}
                />
                <Button 
                  type="submit" 
                  disabled={!inputValue.trim() || !executing}
                  className="bg-yellow-600 hover:bg-yellow-700 text-white"
                >
                  <Send className="h-4 w-4 mr-1" />
                  Submit
                </Button>
              </form>
              <p className="text-xs text-gray-400 mt-2">
                Prompt: <span className="text-yellow-300">{inputPrompt}</span>
              </p>
            </div>
          )}

          <CardContent className="p-0">
            <div className="bg-gray-950 text-white font-mono text-sm p-6 max-h-[600px] overflow-y-auto">
              {terminalLines.length === 0 ? (
                <div className="text-gray-500">Waiting for output...</div>
              ) : (
                terminalLines.map((line, index) => (
                  <div key={index} className="mb-1 leading-relaxed">
                    <span className="text-gray-600 text-xs">
                      [{line.timestamp.toLocaleTimeString()}]
                    </span>
                    {' '}
                    <span className={getLineColor(line.type)}>
                      {line.content}
                    </span>
                  </div>
                ))
              )}
              <div ref={terminalEndRef} />
              {executing && !inputRequired && (
                <div className="flex items-center gap-2 text-yellow-400 mt-4 animate-pulse">
                  <div className="w-2 h-4 bg-yellow-400"></div>
                  <span>Running...</span>
                </div>
              )}
            </div>
          </CardContent>

          {/* Footer with process info */}
          <div className="bg-gray-900 text-gray-400 text-xs px-4 py-2 border-t border-gray-700 flex justify-between items-center">
            <span>Process ID: {processId || 'Not started'}</span>
            <span>{terminalLines.length} lines</span>
          </div>
        </Card>
      )}
    </div>
  );
}