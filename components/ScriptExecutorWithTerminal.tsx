'use client';

import { useState, useRef, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Play, Terminal, X, Download } from 'lucide-react';

interface TerminalLine {
  type: 'output' | 'error' | 'input' | 'system';
  content: string;
  timestamp: Date;
}

interface ScriptExecutorProps {
  script: {
    id: string;
    name: string;
    description: string;
    code: string;
  };
}

export default function ScriptExecutorWithTerminal({ script }: ScriptExecutorProps) {
  const [bearerToken, setBearerToken] = useState('');
  const [parameters, setParameters] = useState('{}');
  const [executing, setExecuting] = useState(false);
  const [terminalLines, setTerminalLines] = useState<TerminalLine[]>([]);
  const [showTerminal, setShowTerminal] = useState(false);
  const terminalEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    terminalEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [terminalLines]);

  const addTerminalLine = (type: TerminalLine['type'], content: string) => {
    setTerminalLines(prev => [...prev, { type, content, timestamp: new Date() }]);
  };

  const executeScript = async () => {
    if (!bearerToken) return;

    setExecuting(true);
    setShowTerminal(true);
    setTerminalLines([]);

    addTerminalLine('system', `Starting execution of ${script.name}...`);
    addTerminalLine('system', `Script ID: ${script.id}`);
    addTerminalLine('system', '─'.repeat(60));

    try {
      const params = JSON.parse(parameters);
      
      addTerminalLine('output', 'Initializing script...');
      addTerminalLine('output', `Parameters: ${JSON.stringify(params, null, 2)}`);
      addTerminalLine('output', '');

      const response = await fetch('/api/scripts/execute-stream', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          scriptId: script.id,
          bearerToken,
          parameters: params,
        }),
      });

      const data = await response.json();

      if (data.success) {
        addTerminalLine('system', '');
        addTerminalLine('system', '─'.repeat(60));
        addTerminalLine('system', '✅ Script executed successfully');
        addTerminalLine('output', '');
        addTerminalLine('output', 'Result:');
        addTerminalLine('output', JSON.stringify(data.result, null, 2));
      } else {
        addTerminalLine('error', '');
        addTerminalLine('error', '─'.repeat(60));
        addTerminalLine('error', `❌ Error: ${data.error}`);
      }

    } catch (err: any) {
      addTerminalLine('error', '');
      addTerminalLine('error', '─'.repeat(60));
      addTerminalLine('error', `❌ Execution failed: ${err.message}`);
    } finally {
      setExecuting(false);
      addTerminalLine('system', '');
      addTerminalLine('system', '─'.repeat(60));
      addTerminalLine('system', `Finished at ${new Date().toLocaleTimeString()}`);
    }
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
      case 'system': return 'text-blue-400';
      case 'input': return 'text-yellow-400';
      default: return 'text-green-400';
    }
  };

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <CardTitle>Execute: {script.name}</CardTitle>
          <CardDescription>
            Provide your bearer token and parameters to run this script
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="bearerToken">Bearer Token</Label>
            <Input
              id="bearerToken"
              type="password"
              placeholder="Enter your API bearer token"
              value={bearerToken}
              onChange={(e) => setBearerToken(e.target.value)}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="parameters">Parameters (JSON)</Label>
            <Textarea
              id="parameters"
              placeholder='{"key": "value"}'
              value={parameters}
              onChange={(e) => setParameters(e.target.value)}
              rows={4}
            />
          </div>

          <Button
            onClick={executeScript}
            disabled={executing || !bearerToken}
            className="w-full"
          >
            <Play className="h-4 w-4 mr-2" />
            {executing ? 'Executing...' : 'Execute Script'}
          </Button>
        </CardContent>
      </Card>

      {showTerminal && (
        <Card className="border-2 border-gray-700">
          <CardHeader className="bg-gray-900 text-white">
            <div className="flex items-center justify-between">
              <CardTitle className="text-sm font-mono flex items-center gap-2">
                <Terminal className="h-4 w-4" />
                Terminal Output
              </CardTitle>
              <div className="flex gap-2">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={downloadLogs}
                  disabled={terminalLines.length === 0}
                  className="text-white hover:bg-gray-800"
                >
                  <Download className="h-4 w-4" />
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={clearTerminal}
                  className="text-white hover:bg-gray-800"
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </CardHeader>
          <CardContent className="p-0">
            <div className="bg-black text-white font-mono text-sm p-4 max-h-[500px] overflow-y-auto">
              {terminalLines.length === 0 ? (
                <div className="text-gray-500">No output yet...</div>
              ) : (
                terminalLines.map((line, index) => (
                  <div key={index} className="mb-1">
                    <span className="text-gray-500">
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
              {executing && (
                <div className="flex items-center gap-2 text-yellow-400 mt-2">
                  <div className="animate-pulse">▮</div>
                  <span>Executing...</span>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}