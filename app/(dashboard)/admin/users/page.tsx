'use client';

import { useEffect, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { User, AuditLog } from '@/lib/types';
import { formatDate } from '@/lib/utils';
import { UserPlus, X, Eye, Shield, Calendar } from 'lucide-react';

export default function UsersManagementPage() {
  const [users, setUsers] = useState<User[]>([]);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [userAuditLogs, setUserAuditLogs] = useState<AuditLog[]>([]);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);
  const [error, setError] = useState('');
  
  const [newUser, setNewUser] = useState({
    email: '',
    password: '',
    dbTenantId: '',
  });

  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    try {
      const response = await fetch('/api/admin/users');
      const data = await response.json();
      if (response.ok) {
        setUsers(data.users);
      }
    } catch (err) {
      console.error('Failed to fetch users:', err);
    } finally {
      setLoading(false);
    }
  };

  const fetchUserAuditLogs = async (userId: string) => {
    try {
      const response = await fetch(`/api/admin/users/${userId}/audit-logs`);
      const data = await response.json();
      if (response.ok) {
        setUserAuditLogs(data.auditLogs);
      }
    } catch (err) {
      console.error('Failed to fetch user audit logs:', err);
    }
  };

  const handleViewUser = (user: User) => {
    setSelectedUser(user);
    fetchUserAuditLogs(user.id);
  };

  const createUser = async (e: React.FormEvent) => {
    e.preventDefault();
    setCreating(true);
    setError('');

    try {
      const response = await fetch('/api/admin/users', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newUser),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to create user');
      }

      setNewUser({ email: '', password: '', dbTenantId: '' });
      setShowCreateForm(false);
      fetchUsers();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setCreating(false);
    }
  };

  const getStatusBadge = (status: string) => {
    const variants: Record<string, any> = {
      SUCCESS: 'success',
      FAILURE: 'destructive',
      PENDING: 'warning',
    };
    return <Badge variant={variants[status] || 'outline'}>{status}</Badge>;
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-3">
            <Shield className="h-8 w-8 text-purple-600" />
            User Management
          </h1>
          <p className="text-gray-600 mt-2">Create and manage user accounts</p>
        </div>
        <Button
          onClick={() => setShowCreateForm(!showCreateForm)}
          className="bg-purple-600 hover:bg-purple-700"
        >
          {showCreateForm ? (
            <>
              <X className="h-4 w-4 mr-2" />
              Cancel
            </>
          ) : (
            <>
              <UserPlus className="h-4 w-4 mr-2" />
              Create User
            </>
          )}
        </Button>
      </div>

      {/* Create User Form */}
      {showCreateForm && (
        <Card className="border-2 border-purple-500 shadow-lg">
          <CardHeader className="bg-purple-50">
            <CardTitle className="text-xl flex items-center gap-2">
              <UserPlus className="h-5 w-5 text-purple-600" />
              Create New User
            </CardTitle>
            <CardDescription>Add a new user account to the system</CardDescription>
          </CardHeader>
          <CardContent className="pt-6">
            <form onSubmit={createUser} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="email">Email *</Label>
                  <Input
                    id="email"
                    type="email"
                    placeholder="user@example.com"
                    value={newUser.email}
                    onChange={(e) => setNewUser({ ...newUser, email: e.target.value })}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="password">Password *</Label>
                  <Input
                    id="password"
                    type="password"
                    placeholder="Minimum 6 characters"
                    value={newUser.password}
                    onChange={(e) => setNewUser({ ...newUser, password: e.target.value })}
                    required
                    minLength={6}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="dbTenantId">DB Tenant ID *</Label>
                <Input
                  id="dbTenantId"
                  placeholder="e.g., tenant-12345"
                  value={newUser.dbTenantId}
                  onChange={(e) => setNewUser({ ...newUser, dbTenantId: e.target.value })}
                  required
                />
              </div>

              {error && (
                <div className="text-sm text-red-600 bg-red-50 p-3 rounded">
                  {error}
                </div>
              )}

              <div className="flex gap-3">
                <Button type="submit" disabled={creating} className="bg-purple-600 hover:bg-purple-700">
                  {creating ? 'Creating...' : 'Create User'}
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => {
                    setShowCreateForm(false);
                    setNewUser({ email: '', password: '', dbTenantId: '' });
                    setError('');
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
        {/* Users List */}
        <Card className="border-2">
          <CardHeader className="bg-gradient-to-r from-purple-50 to-blue-50">
            <CardTitle className="text-xl">All Users ({users.length})</CardTitle>
            <CardDescription>Click on a user to view their audit logs</CardDescription>
          </CardHeader>
          <CardContent className="p-0">
            {loading ? (
              <div className="text-center py-12 text-gray-500">Loading users...</div>
            ) : users.length === 0 ? (
              <div className="text-center py-12 text-gray-500">No users found</div>
            ) : (
              <div className="divide-y">
                {users.map((user) => (
                  <div
                    key={user.id}
                    className={`p-4 hover:bg-gray-50 cursor-pointer transition-colors ${
                      selectedUser?.id === user.id ? 'bg-purple-50 border-l-4 border-l-purple-600' : ''
                    }`}
                    onClick={() => handleViewUser(user)}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <p className="font-semibold text-gray-900">{user.email}</p>
                          <Badge variant={user.role === 'ADMIN' ? 'default' : 'secondary'}>
                            {user.role}
                          </Badge>
                        </div>
                        <p className="text-xs text-gray-500 mt-1 font-mono">{user.dbTenantId}</p>
                        <div className="flex items-center gap-1 text-xs text-gray-500 mt-1">
                          <Calendar className="h-3 w-3" />
                          Joined {new Date(user.createdAt).toLocaleDateString()}
                        </div>
                      </div>
                      <Button variant="ghost" size="sm">
                        <Eye className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* User Audit Logs */}
        <Card className="border-2">
          <CardHeader className="bg-gradient-to-r from-blue-50 to-purple-50">
            <CardTitle className="text-xl">
              {selectedUser ? `${selectedUser.email}'s Activity` : 'Select a User'}
            </CardTitle>
            <CardDescription>
              {selectedUser ? 'View all script executions for this user' : 'Click on a user to view their audit logs'}
            </CardDescription>
          </CardHeader>
          <CardContent className="p-6">
            {!selectedUser ? (
              <div className="text-center py-12">
                <Eye className="h-12 w-12 mx-auto text-gray-400 mb-4" />
                <p className="text-gray-500">Select a user from the list to view their activity</p>
              </div>
            ) : userAuditLogs.length === 0 ? (
              <div className="text-center py-12">
                <p className="text-gray-500 font-medium">No activity yet</p>
                <p className="text-sm text-gray-400 mt-1">This user hasn't executed any scripts</p>
              </div>
            ) : (
              <div className="space-y-3 max-h-[600px] overflow-y-auto">
                {userAuditLogs.map((log) => (
                  <div
                    key={log.id}
                    className="p-4 bg-gray-50 rounded-lg border hover:shadow-md transition-shadow"
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <div
                            className={`w-2 h-2 rounded-full ${
                              log.status === 'SUCCESS' ? 'bg-green-500' :
                              log.status === 'FAILURE' ? 'bg-red-500' : 'bg-yellow-500'
                            }`}
                          />
                          <p className="font-semibold text-gray-900">{log.scriptName}</p>
                        </div>
                        <p className="text-xs text-gray-500 mt-1">
                          {formatDate(log.executedAt)}
                        </p>
                        {log.error && (
                          <p className="text-xs text-red-600 mt-1 bg-red-50 p-2 rounded">
                            Error: {log.error}
                          </p>
                        )}
                      </div>
                      {getStatusBadge(log.status)}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}