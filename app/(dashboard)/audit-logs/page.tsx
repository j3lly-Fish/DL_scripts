'use client';

import { useEffect, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { AuditLog } from '@/lib/types';
import { formatDate } from '@/lib/utils';
import { ScrollText, CheckCircle, XCircle, Clock } from 'lucide-react';

export default function AuditLogsPage() {
  const [auditLogs, setAuditLogs] = useState<AuditLog[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchAuditLogs();
  }, []);

  const fetchAuditLogs = async () => {
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
    switch (status) {
      case 'SUCCESS':
        return (
          <Badge variant="success" className="flex items-center gap-1 w-fit">
            <CheckCircle className="h-3 w-3" />
            Success
          </Badge>
        );
      case 'FAILURE':
        return (
          <Badge variant="destructive" className="flex items-center gap-1 w-fit">
            <XCircle className="h-3 w-3" />
            Failure
          </Badge>
        );
      case 'PENDING':
        return (
          <Badge variant="warning" className="flex items-center gap-1 w-fit">
            <Clock className="h-3 w-3" />
            Pending
          </Badge>
        );
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold flex items-center">
          <ScrollText className="h-8 w-8 mr-3" />
          Audit Logs
        </h1>
        <p className="text-gray-600 mt-2">
          View all script execution history and details
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Execution History</CardTitle>
          <CardDescription>
            Complete log of all script executions from your account
          </CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="text-center py-8 text-gray-500">Loading...</div>
          ) : auditLogs.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              No audit logs found. Execute a script to see logs here.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Date/Time</TableHead>
                    <TableHead>Script</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>User Email</TableHead>
                    <TableHead>DB Tenant ID</TableHead>
                    <TableHead>Token</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {auditLogs.map((log) => (
                    <TableRow key={log.id}>
                      <TableCell className="font-mono text-xs">
                        {formatDate(log.executedAt)}
                      </TableCell>
                      <TableCell className="font-medium">
                        {log.scriptName}
                      </TableCell>
                      <TableCell>{getStatusBadge(log.status)}</TableCell>
                      <TableCell className="text-sm">{log.userEmail}</TableCell>
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

      {auditLogs.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Statistics</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="p-4 bg-green-50 rounded-lg">
                <div className="text-2xl font-bold text-green-700">
                  {auditLogs.filter((l) => l.status === 'SUCCESS').length}
                </div>
                <div className="text-sm text-green-600">Successful</div>
              </div>
              <div className="p-4 bg-red-50 rounded-lg">
                <div className="text-2xl font-bold text-red-700">
                  {auditLogs.filter((l) => l.status === 'FAILURE').length}
                </div>
                <div className="text-sm text-red-600">Failed</div>
              </div>
              <div className="p-4 bg-blue-50 rounded-lg">
                <div className="text-2xl font-bold text-blue-700">
                  {auditLogs.length}
                </div>
                <div className="text-sm text-blue-600">Total Executions</div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}