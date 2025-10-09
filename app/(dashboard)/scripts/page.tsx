'use client';

import { useEffect, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Script } from '@/lib/types';
import { Plus, X, Code2, Lock, Shield } from 'lucide-react';
import ScriptExecutorWithTerminal from '@/components/ScriptExecutorWithTerminal';
import PythonScriptExecutor from '@/components/PythonScriptExecutor';

export default function ScriptsPage() {
  const [scripts, setScripts] = useState<Script[]>([]);
  const [selectedScript, setSelectedScript] = useState<Script | null>(null);
  const [userRole, setUserRole] = useState<string>('');
  
  // Create script form state
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [newScript, setNewScript] = useState({
    name: '',
    description: '',
    code: '',
    category: '',
    language: 'javascript',
  });
  const [creating, setCreating] = useState(false);
  const [createError, setCreateError] = useState('');

  const isAdmin = userRole === 'ADMIN';

  useEffect(() => {
    fetchScripts();
    fetchUserRole();
  }, []);

  const fetchUserRole = async () => {
    try {
      const response = await fetch('/api/auth/me');
      const data = await response.json();
      setUserRole(data.user?.role || '');
    } catch (err) {
      console.error('Failed to fetch user role:', err);
    }
  };

  const fetchScripts = async () => {
    try {
      const response = await fetch('/api/scripts');
      const data = await response.json();
      setScripts(data.scripts || []);
    } catch (err) {
      console.error('Failed to fetch scripts:', err);
    }
  };

  const createScript = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!isAdmin) {
      setCreateError('Only administrators can create scripts');
      return;
    }

    setCreating(true);
    setCreateError('');

    try {
      // Auto-detect language if not explicitly set
      const detectedLanguage = isPythonScript(newScript.code) ? 'python' : 'javascript';
      
      const response = await fetch('/api/scripts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...newScript,
          language: detectedLanguage,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to create script');
      }

      setNewScript({ name: '', description: '', code: '', category: '', language: 'javascript' });
      setShowCreateForm(false);
      fetchScripts();
    } catch (err: any) {
      setCreateError(err.message);
    } finally {
      setCreating(false);
    }
  };

  const isPythonScript = (code: string) => {
    return code.includes('#!/usr/bin/env python') || 
           code.includes('import ') || 
           code.includes('def ') ||
           code.includes('print(');
  };

  const categoryColors: Record<string, string> = {
    Users: 'bg-blue-500',
    Organizations: 'bg-green-500',
    Settings: 'bg-purple-500',
    Reports: 'bg-orange-500',
    DoorLoop: 'bg-indigo-500',
    Python: 'bg-yellow-500',
    Transactions: 'bg-pink-500',
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Script Library</h1>
          <p className="text-gray-600 mt-2">
            Execute JavaScript and Python scripts with live terminal output
          </p>
        </div>
        {isAdmin && (
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

      {/* Role Badge */}
      <Card className={`${isAdmin ? 'bg-gradient-to-r from-purple-50 to-blue-50 border-purple-200' : 'bg-gradient-to-r from-blue-50 to-indigo-50 border-blue-200'}`}>
        <CardContent className="py-4">
          <div className="flex items-center gap-3">
            <Badge variant={isAdmin ? "default" : "secondary"} className="text-sm">
              {isAdmin ? (
                <>
                  <Shield className="h-3 w-3 mr-1" />
                  Administrator
                </>
              ) : (
                <>
                  <Lock className="h-3 w-3 mr-1" />
                  User
                </>
              )}
            </Badge>
            <span className="text-sm text-gray-600">
              {isAdmin 
                ? 'You can create, edit, and delete scripts' 
                : 'You can execute scripts created by administrators'}
            </span>
          </div>
        </CardContent>
      </Card>

      {showCreateForm && isAdmin && (
        <Card className="border-2 border-green-500 shadow-lg">
          <CardHeader className="bg-green-50">
            <CardTitle className="text-xl flex items-center gap-2">
              <Plus className="h-5 w-5 text-green-600" />
              Create New Script
            </CardTitle>
            <CardDescription>Add a JavaScript or Python script to the library</CardDescription>
          </CardHeader>
          <CardContent className="pt-6">
            <form onSubmit={createScript} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="name">Script Name *</Label>
                  <Input
                    id="name"
                    placeholder="e.g., Bulk Exclude Transactions"
                    value={newScript.name}
                    onChange={(e) => setNewScript({ ...newScript, name: e.target.value })}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="category">Category *</Label>
                  <Input
                    id="category"
                    placeholder="e.g., DoorLoop, Python"
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
                  placeholder="Paste your Python or JavaScript code here..."
                  value={newScript.code}
                  onChange={(e) => setNewScript({ ...newScript, code: e.target.value })}
                  rows={15}
                  className="font-mono text-sm"
                  required
                />
                <p className="text-xs text-gray-500">
                  Python scripts will run server-side with input support. JavaScript must have async execute(bearerToken, params) function.
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
                    setNewScript({ name: '', description: '', code: '', category: '', language: 'javascript' });
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

      {/* Non-Admin Notice */}
      {!isAdmin && (
        <Card className="bg-blue-50 border-blue-200">
          <CardContent className="py-4">
            <div className="flex items-start gap-3">
              <Lock className="h-5 w-5 text-blue-600 mt-0.5" />
              <div>
                <p className="font-semibold text-blue-900">Limited Access</p>
                <p className="text-sm text-blue-700 mt-1">
                  You're viewing scripts as a regular user. Only administrators can create, edit, or delete scripts.
                  Contact your administrator to request new scripts or modifications.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="space-y-4">
          <h2 className="text-xl font-semibold">Available Scripts ({scripts.length})</h2>
          {scripts.length === 0 ? (
            <Card>
              <CardContent className="py-12 text-center">
                <Code2 className="h-12 w-12 mx-auto text-gray-400 mb-4" />
                <p className="text-gray-600 mb-4">No scripts available yet</p>
                {isAdmin && (
                  <Button onClick={() => setShowCreateForm(true)}>
                    <Plus className="h-4 w-4 mr-2" />
                    Create Your First Script
                  </Button>
                )}
              </CardContent>
            </Card>
          ) : (
            scripts.map((script) => {
              const isPython = isPythonScript(script.code);
              return (
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
                        <CardTitle className="text-lg flex items-center gap-2">
                          {script.name}
                          {isPython && (
                            <Badge className="bg-yellow-500 text-white text-xs">
                              🐍 Python
                            </Badge>
                          )}
                        </CardTitle>
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
              );
            })
          )}
        </div>

        <div className="space-y-4">
          {selectedScript ? (
            <>
              {isPythonScript(selectedScript.code) ? (
                <PythonScriptExecutor script={selectedScript} />
              ) : (
                <ScriptExecutorWithTerminal script={selectedScript} />
              )}

              <Card>
                <CardHeader>
                  <CardTitle className="text-sm font-medium flex items-center">
                    <Code2 className="h-4 w-4 mr-2" />
                    Script Code
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <pre className="text-xs bg-gray-50 p-4 rounded overflow-x-auto max-h-[400px]">
                    <code>{selectedScript.code}</code>
                  </pre>
                </CardContent>
              </Card>
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