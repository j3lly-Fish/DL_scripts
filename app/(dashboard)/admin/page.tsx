'use client';

import { useEffect, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { AuditLog } from '@/lib/types';
import { formatDate } from '@/lib/utils';
import { Shield, Users, Activity } from 'lucide-react';

export default function AdminPage() {
  const [auditLogs, setAuditLogs] = useState<AuditLog[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchAllAuditLogs();
  }, []);

  const fetchAllAuditLogs = async () => {
    try {
      const response = await fetch('/api/audit-logs');
      const data = await response.json();
      setAuditLogs(data.auditLogs);
    } catch (err) {
      console.error('Failed to fetch audit logs:', err);
    } finally {
      setLoading(false);
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

  const uniqueUsers = new Set(auditLogs.map((log) => log.userEmail)).size;
  const successRate =
    auditLogs.length > 0
      ? ((auditLogs.filter((l) => l.status === 'SUCCESS').length / auditLogs.length) * 100).toFixed(1)
      : '0';

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold flex items-center">
          <Shield className="h-8 w-8 mr-3 text-primary" />
          Admin Dashboard
        </h1>
        <p className="text-gray-600 mt-2">
          System-wide overview and all user audit logs
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">
              Total Executions
            </CardTitle>
            <Activity className="h-4 w-4 text-gray-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{auditLogs.length}</div>
            <p className="text-xs text-gray-600 mt-1">Across all users</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">
              Active Users
            </CardTitle>
            <Users className="h-4 w-4 text-gray-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{uniqueUsers}</div>
            <p className="text-xs text-gray-600 mt-1">Who have executed scripts</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">
              Success Rate
            </CardTitle>
            <Shield className="h-4 w-4 text-gray-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{successRate}%</div>
            <p className="text-xs text-gray-600 mt-1">Of all executions</p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>All System Audit Logs</CardTitle>
          <CardDescription>
            Complete execution history for all users in the system
          </CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="text-center py-8 text-gray-500">Loading...</div>
          ) : auditLogs.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              No audit logs found in the system.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Date/Time</TableHead>
                    <TableHead>User</TableHead>
                    <TableHead>Script</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Tenant ID</TableHead>
                    <TableHead>Token</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {auditLogs.map((log) => (
                    <TableRow key={log.id}>
                      <TableCell className="font-mono text-xs">
                        {formatDate(log.executedAt)}
                      </TableCell>
                      <TableCell className="text-sm">{log.userEmail}</TableCell>
                      <TableCell className="font-medium">
                        {log.scriptName}
                      </TableCell>
                      <TableCell>{getStatusBadge(log.status)}</TableCell>
                      <TableCell className="font-mono text-xs">
                        {log.dbTenantId}
                      </TableCell>
                      <TableCell className="font-mono text-xs">
                        {log.bearerToken}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}