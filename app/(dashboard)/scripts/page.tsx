'use client';

import { useEffect, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Script } from '@/lib/types';
import { Play, Code2, Plus, X } from 'lucide-react';

export default function ScriptsPage() {
  const [scripts, setScripts] = useState<Script[]>([]);
  const [selectedScript, setSelectedScript] = useState<Script | null>(null);
  const [bearerToken, setBearerToken] = useState('');
  const [parameters, setParameters] = useState('{}');
  const [executing, setExecuting] = useState(false);
  const [result, setResult] = useState<any>(null);
  const [error, setError] = useState('');
  const [userRole, setUserRole] = useState<string>('');
  
  // Create script form state
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [newScript, setNewScript] = useState({
    name: '',
    description: '',
    code: '',
    category: '',
  });
  const [creating, setCreating] = useState(false);
  const [createError, setCreateError] = useState('');

  useEffect(() => {
    fetchScripts();
    fetchUserRole();
  }, []);

  const fetchUserRole = async () => {
    try {
      const response = await fetch('/api/auth/me');
      const data = await response.json();
      setUserRole(data.role);
    } catch (err) {
      console.error('Failed to fetch user role:', err);
    }
  };

  const fetchScripts = async () => {
    try {
      const response = await fetch('/api/scripts');
      const data = await response.json();
      setScripts(data.scripts);
    } catch (err) {
      console.error('Failed to fetch scripts:', err);
    }
  };

  const createScript = async (e: React.FormEvent) => {
    e.preventDefault();
    setCreating(true);
    setCreateError('');

    try {
      const response = await fetch('/api/scripts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newScript),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to create script');
      }

      // Reset form and refresh scripts
      setNewScript({ name: '', description: '', code: '', category: '' });
      setShowCreateForm(false);
      fetchScripts();
    } catch (err: any) {
      setCreateError(err.message);
    } finally {
      setCreating(false);
    }
  };

  const executeScript = async () => {
    if (!selectedScript || !bearerToken) return;

    setExecuting(true);
    setError('');
    setResult(null);

    try {
      const params = JSON.parse(parameters);
      const response = await fetch('/api/scripts/execute', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          scriptId: selectedScript.id,
          bearerToken,
          parameters: params,
        }),
      });

      const data = await response.json();

      if (data.success) {
        setResult(data.result);
      } else {
        setError(data.error || 'Execution failed');
      }
    } catch (err: any) {
      setError(err.message);
    } finally {
      setExecuting(false);
    }
  };

  const categoryColors: Record<string, string> = {
    Users: 'bg-blue-500',
    Organizations: 'bg-green-500',
    Settings: 'bg-purple-500',
    Reports: 'bg-orange-500',
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Script Library</h1>
          <p className="text-gray-600 mt-2">
            Browse and execute API scripts with your bearer token
          </p>
        </div>
        {userRole === 'ADMIN' && (
          <Button
            onClick={() => setShowCreateForm(!showCreateForm)}
            className="bg-green-600 hover:bg-green-700"
          >
            {showCreateForm ? (
              <>
                <X className="h-4 w-4 mr-2" />
                Cancel
              </>
            ) : (
              <>
                <Plus className="h-4 w-4 mr-2" />
                Create Script
              </>
            )}
          </Button>
        )}
      </div>

      {/* Create Script Form (Admin Only) */}
      {showCreateForm && userRole === 'ADMIN' && (
        <Card className="border-2 border-green-500 shadow-lg">
          <CardHeader className="bg-green-50">
            <CardTitle className="text-xl flex items-center gap-2">
              <Plus className="h-5 w-5 text-green-600" />
              Create New Script
            </CardTitle>
            <CardDescription>Add a new script to the library</CardDescription>
          </CardHeader>
          <CardContent className="pt-6">
            <form onSubmit={createScript} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="name">Script Name *</Label>
                  <Input
                    id="name"
                    placeholder="e.g., Get User List"
                    value={newScript.name}
                    onChange={(e) => setNewScript({ ...newScript, name: e.target.value })}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="category">Category *</Label>
                  <Input
                    id="category"
                    placeholder="e.g., Users, Organizations"
                    value={newScript.category}
                    onChange={(e) => setNewScript({ ...newScript, category: e.target.value })}
                    required
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="description">Description *</Label>
                <Input
                  id="description"
                  placeholder="Brief description of what this script does"
                  value={newScript.description}
                  onChange={(e) => setNewScript({ ...newScript, description: e.target.value })}
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="code">Script Code *</Label>
                <Textarea
                  id="code"
                  placeholder="async function execute(bearerToken, params) {&#10;  // Your code here&#10;  const response = await fetch('https://api.example.com/endpoint', {&#10;    headers: { 'Authorization': `Bearer ${bearerToken}` }&#10;  });&#10;  return await response.json();&#10;}"
                  value={newScript.code}
                  onChange={(e) => setNewScript({ ...newScript, code: e.target.value })}
                  rows={10}
                  className="font-mono text-sm"
                  required
                />
                <p className="text-xs text-gray-500">
                  Must contain an async function named "execute" that accepts bearerToken and params
                </p>
              </div>

              {createError && (
                <div className="text-sm text-red-600 bg-red-50 p-3 rounded">
                  {createError}
                </div>
              )}

              <div className="flex gap-3">
                <Button type="submit" disabled={creating} className="bg-green-600 hover:bg-green-700">
                  {creating ? 'Creating...' : 'Create Script'}
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => {
                    setShowCreateForm(false);
                    setNewScript({ name: '', description: '', code: '', category: '' });
                    setCreateError('');
                  }}
                >
                  Cancel
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="space-y-4">
          <h2 className="text-xl font-semibold">Available Scripts ({scripts.length})</h2>
          {scripts.map((script) => (
            <Card
              key={script.id}
              className={`cursor-pointer transition-all ${
                selectedScript?.id === script.id
                  ? 'ring-2 ring-blue-500 shadow-lg'
                  : 'hover:shadow-md'
              }`}
              onClick={() => setSelectedScript(script)}
            >
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <CardTitle className="text-lg">{script.name}</CardTitle>
                    <CardDescription className="mt-1">
                      {script.description}
                    </CardDescription>
                  </div>
                  <Badge
                    className={`${
                      categoryColors[script.category] || 'bg-gray-500'
                    } text-white`}
                  >
                    {script.category}
                  </Badge>
                </div>
              </CardHeader>
            </Card>
          ))}
        </div>

        <div className="space-y-4">
          {selectedScript ? (
            <>
              <Card>
                <CardHeader>
                  <CardTitle>Execute: {selectedScript.name}</CardTitle>
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
                    <Label htmlFor="parameters">
                      Parameters (JSON)
                    </Label>
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

              <Card>
                <CardHeader>
                  <CardTitle className="text-sm font-medium flex items-center">
                    <Code2 className="h-4 w-4 mr-2" />
                    Script Code
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <pre className="text-xs bg-gray-50 p-4 rounded overflow-x-auto">
                    <code>{selectedScript.code}</code>
                  </pre>
                </CardContent>
              </Card>

              {(result || error) && (
                <Card>
                  <CardHeader>
                    <CardTitle className="text-sm font-medium">
                      {error ? 'Error' : 'Result'}
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    {error ? (
                      <div className="text-sm text-red-600 bg-red-50 p-3 rounded">
                        {error}
                      </div>
                    ) : (
                      <pre className="text-xs bg-gray-50 p-4 rounded overflow-x-auto">
                        <code>{JSON.stringify(result, null, 2)}</code>
                      </pre>
                    )}
                  </CardContent>
                </Card>
              )}
            </>
          ) : (
            <Card>
              <CardContent className="flex items-center justify-center h-64">
                <div className="text-center text-gray-500">
                  <Code2 className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p>Select a script to execute</p>
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}