'use client';

import { useEffect, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Label } from '@/components/ui/label';
import { 
  Search, 
  Download, 
  Calendar,
  Filter,
  X,
  CheckCircle,
  XCircle,
  Clock,
  ChevronDown,
  ChevronRight,
  GitCompare,
  FileJson,
  FileSpreadsheet
} from 'lucide-react';

interface AuditLog {
  id: string;
  userEmail: string;
  scriptName: string;
  scriptId: string;
  dbTenantId: string;
  bearerToken: string;
  status: string;
  response?: string;
  error?: string;
  executedAt: string;
}

export default function AdvancedAuditLogsPage() {
  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [filteredLogs, setFilteredLogs] = useState<AuditLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [expandedLog, setExpandedLog] = useState<string | null>(null);
  const [selectedForCompare, setSelectedForCompare] = useState<string[]>([]);
  const [showCompareModal, setShowCompareModal] = useState(false);

  // Filter states
  const [searchTerm, setSearchTerm] = useState('');
  const [outputSearch, setOutputSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('ALL');
  const [userFilter, setUserFilter] = useState<string>('ALL');
  const [scriptFilter, setScriptFilter] = useState<string>('ALL');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const [showFilters, setShowFilters] = useState(false);

  useEffect(() => {
    fetchAuditLogs();
  }, []);

  useEffect(() => {
    filterLogs();
  }, [logs, searchTerm, outputSearch, statusFilter, userFilter, scriptFilter, dateFrom, dateTo]);

  const fetchAuditLogs = async () => {
    try {
      const response = await fetch('/api/audit-logs');
      const data = await response.json();
      setLogs(data.auditLogs || data.logs || []);
    } catch (error) {
      console.error('Error fetching audit logs:', error);
    } finally {
      setLoading(false);
    }
  };

  const filterLogs = () => {
    let filtered = logs;

    // Status filter
    if (statusFilter !== 'ALL') {
      filtered = filtered.filter(log => log.status === statusFilter);
    }

    // User filter
    if (userFilter !== 'ALL') {
      filtered = filtered.filter(log => log.userEmail === userFilter);
    }

    // Script filter
    if (scriptFilter !== 'ALL') {
      filtered = filtered.filter(log => log.scriptName === scriptFilter);
    }

    // Date range filter
    if (dateFrom) {
      filtered = filtered.filter(log => 
        new Date(log.executedAt) >= new Date(dateFrom)
      );
    }
    if (dateTo) {
      filtered = filtered.filter(log => 
        new Date(log.executedAt) <= new Date(dateTo + 'T23:59:59')
      );
    }

    // General search
    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      filtered = filtered.filter(log => 
        log.userEmail.toLowerCase().includes(term) ||
        log.scriptName.toLowerCase().includes(term) ||
        log.dbTenantId.toLowerCase().includes(term)
      );
    }

    // Output search
    if (outputSearch) {
      const term = outputSearch.toLowerCase();
      filtered = filtered.filter(log => 
        (log.response && log.response.toLowerCase().includes(term)) ||
        (log.error && log.error.toLowerCase().includes(term))
      );
    }

    setFilteredLogs(filtered);
  };

  const clearFilters = () => {
    setSearchTerm('');
    setOutputSearch('');
    setStatusFilter('ALL');
    setUserFilter('ALL');
    setScriptFilter('ALL');
    setDateFrom('');
    setDateTo('');
  };

  const toggleExpand = (logId: string) => {
    setExpandedLog(expandedLog === logId ? null : logId);
  };

  const toggleSelectForCompare = (logId: string) => {
    if (selectedForCompare.includes(logId)) {
      setSelectedForCompare(selectedForCompare.filter(id => id !== logId));
    } else if (selectedForCompare.length < 2) {
      setSelectedForCompare([...selectedForCompare, logId]);
    }
  };

  const exportToCSV = () => {
    const headers = ['Date', 'User', 'Script', 'Status', 'Tenant ID', 'Token'];
    const rows = filteredLogs.map(log => [
      new Date(log.executedAt).toLocaleString(),
      log.userEmail,
      log.scriptName,
      log.status,
      log.dbTenantId,
      log.bearerToken
    ]);

    const csv = [
      headers.join(','),
      ...rows.map(row => row.map(cell => `"${cell}"`).join(','))
    ].join('\n');

    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `audit-logs-${Date.now()}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const exportToJSON = () => {
    const json = JSON.stringify(filteredLogs, null, 2);
    const blob = new Blob([json], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `audit-logs-${Date.now()}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const getStatusBadge = (status: string) => {
    const colors = {
      SUCCESS: 'bg-green-500',
      FAILURE: 'bg-red-500',
      PENDING: 'bg-yellow-500'
    };
    const icons = {
      SUCCESS: CheckCircle,
      FAILURE: XCircle,
      PENDING: Clock
    };
    const Icon = icons[status as keyof typeof icons] || Clock;
    return (
      <Badge className={`${colors[status as keyof typeof colors] || 'bg-gray-500'} text-white`}>
        <Icon className="h-3 w-3 mr-1" />
        {status}
      </Badge>
    );
  };

  const uniqueUsers = Array.from(new Set(logs.map(l => l.userEmail)));
  const uniqueScripts = Array.from(new Set(logs.map(l => l.scriptName)));

  const stats = {
    total: filteredLogs.length,
    success: filteredLogs.filter(l => l.status === 'SUCCESS').length,
    failure: filteredLogs.filter(l => l.status === 'FAILURE').length,
  };

  const compareSelected = () => {
    if (selectedForCompare.length === 2) {
      setShowCompareModal(true);
    }
  };

  const getLogById = (id: string) => logs.find(l => l.id === id);

  if (loading) {
    return <div className="p-6">Loading audit logs...</div>;
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Advanced Audit Logs</h1>
          <p className="text-gray-600 mt-2">
            Filter, search, export, and analyze execution history
          </p>
        </div>
        <div className="flex gap-2">
          <Button onClick={exportToCSV} variant="outline">
            <FileSpreadsheet className="h-4 w-4 mr-2" />
            Export CSV
          </Button>
          <Button onClick={exportToJSON} variant="outline">
            <FileJson className="h-4 w-4 mr-2" />
            Export JSON
          </Button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="text-2xl font-bold">{stats.total}</div>
            <p className="text-sm text-gray-600">Total Executions</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="text-2xl font-bold text-green-600">{stats.success}</div>
            <p className="text-sm text-gray-600">Successful</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="text-2xl font-bold text-red-600">{stats.failure}</div>
            <p className="text-sm text-gray-600">Failed</p>
          </CardContent>
        </Card>
      </div>

      {/* Search and Filters */}
      <Card>
        <CardHeader>
          <div className="flex justify-between items-center">
            <CardTitle className="flex items-center gap-2">
              <Filter className="h-5 w-5" />
              Filters & Search
            </CardTitle>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setShowFilters(!showFilters)}
            >
              {showFilters ? 'Hide Filters' : 'Show Filters'}
            </Button>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Basic Search */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label>General Search</Label>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <Input
                  type="text"
                  placeholder="Search by user, script, or tenant..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            <div>
              <Label>Search in Output</Label>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <Input
                  type="text"
                  placeholder="Search through execution outputs..."
                  value={outputSearch}
                  onChange={(e) => setOutputSearch(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
          </div>

          {/* Advanced Filters */}
          {showFilters && (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 pt-4 border-t">
              <div>
                <Label>Status</Label>
                <select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                  className="w-full border rounded-md p-2"
                >
                  <option value="ALL">All Statuses</option>
                  <option value="SUCCESS">Success</option>
                  <option value="FAILURE">Failure</option>
                  <option value="PENDING">Pending</option>
                </select>
              </div>
              <div>
                <Label>User</Label>
                <select
                  value={userFilter}
                  onChange={(e) => setUserFilter(e.target.value)}
                  className="w-full border rounded-md p-2"
                >
                  <option value="ALL">All Users</option>
                  {uniqueUsers.map(user => (
                    <option key={user} value={user}>{user}</option>
                  ))}
                </select>
              </div>
              <div>
                <Label>Script</Label>
                <select
                  value={scriptFilter}
                  onChange={(e) => setScriptFilter(e.target.value)}
                  className="w-full border rounded-md p-2"
                >
                  <option value="ALL">All Scripts</option>
                  {uniqueScripts.map(script => (
                    <option key={script} value={script}>{script}</option>
                  ))}
                </select>
              </div>
              <div>
                <Label>Date From</Label>
                <Input
                  type="date"
                  value={dateFrom}
                  onChange={(e) => setDateFrom(e.target.value)}
                />
              </div>
              <div>
                <Label>Date To</Label>
                <Input
                  type="date"
                  value={dateTo}
                  onChange={(e) => setDateTo(e.target.value)}
                />
              </div>
              <div className="flex items-end">
                <Button onClick={clearFilters} variant="outline" className="w-full">
                  <X className="h-4 w-4 mr-2" />
                  Clear Filters
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Compare Button */}
      {selectedForCompare.length > 0 && (
        <Card className="bg-blue-50 border-blue-200">
          <CardContent className="py-4">
            <div className="flex justify-between items-center">
              <span>
                {selectedForCompare.length} execution{selectedForCompare.length > 1 ? 's' : ''} selected for comparison
              </span>
              <div className="flex gap-2">
                {selectedForCompare.length === 2 && (
                  <Button onClick={compareSelected}>
                    <GitCompare className="h-4 w-4 mr-2" />
                    Compare Selected
                  </Button>
                )}
                <Button
                  variant="outline"
                  onClick={() => setSelectedForCompare([])}
                >
                  Clear Selection
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Logs List */}
      <div className="space-y-3">
        {filteredLogs.length === 0 ? (
          <Card>
            <CardContent className="py-12 text-center text-gray-500">
              No audit logs found matching your filters
            </CardContent>
          </Card>
        ) : (
          filteredLogs.map((log) => (
            <Card key={log.id} className="hover:shadow-md transition-shadow">
              <CardContent className="pt-6">
                <div 
                  className="flex items-start justify-between cursor-pointer"
                  onClick={() => toggleExpand(log.id)}
                >
                  <div className="flex items-start gap-4 flex-1">
                    <input
                      type="checkbox"
                      checked={selectedForCompare.includes(log.id)}
                      onChange={(e) => {
                        e.stopPropagation();
                        toggleSelectForCompare(log.id);
                      }}
                      className="mt-1"
                      disabled={selectedForCompare.length >= 2 && !selectedForCompare.includes(log.id)}
                    />
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        {getStatusBadge(log.status)}
                        <span className="font-semibold text-lg">{log.scriptName}</span>
                      </div>
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-2 text-sm text-gray-600">
                        <div>👤 {log.userEmail}</div>
                        <div>🏢 {log.dbTenantId}</div>
                        <div>🕐 {new Date(log.executedAt).toLocaleString()}</div>
                      </div>
                    </div>
                  </div>
                  <Button variant="ghost" size="sm">
                    {expandedLog === log.id ? (
                      <ChevronDown className="h-5 w-5" />
                    ) : (
                      <ChevronRight className="h-5 w-5" />
                    )}
                  </Button>
                </div>

                {expandedLog === log.id && (
                  <div className="mt-6 pt-6 border-t space-y-4">
                    <div>
                      <h4 className="font-semibold mb-2">🔑 Bearer Token</h4>
                      <code className="text-sm bg-gray-100 p-2 rounded block">
                        {log.bearerToken}
                      </code>
                    </div>
                    {log.response && (
                      <div>
                        <h4 className="font-semibold mb-2 flex items-center gap-2">
                          <CheckCircle className="h-4 w-4 text-green-600" />
                          Response
                        </h4>
                        <pre className="text-sm bg-green-50 p-4 rounded overflow-x-auto max-h-96 overflow-y-auto border border-green-200">
                          {log.response}
                        </pre>
                      </div>
                    )}
                    {log.error && (
                      <div>
                        <h4 className="font-semibold mb-2 flex items-center gap-2">
                          <XCircle className="h-4 w-4 text-red-600" />
                          Error
                        </h4>
                        <pre className="text-sm bg-red-50 p-4 rounded overflow-x-auto max-h-96 overflow-y-auto border border-red-200">
                          {log.error}
                        </pre>
                      </div>
                    )}
                  </div>
                )}
              </CardContent>
            </Card>
          ))
        )}
      </div>

      {/* Compare Modal */}
      {showCompareModal && selectedForCompare.length === 2 && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <Card className="w-full max-w-6xl max-h-[90vh] overflow-y-auto">
            <CardHeader>
              <div className="flex justify-between items-center">
                <CardTitle className="flex items-center gap-2">
                  <GitCompare className="h-5 w-5" />
                  Compare Executions
                </CardTitle>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setShowCompareModal(false)}
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 gap-6">
                {selectedForCompare.map((id) => {
                  const log = getLogById(id);
                  if (!log) return null;
                  return (
                    <div key={id} className="space-y-4">
                      <div className="border-b pb-4">
                        <h3 className="font-bold text-lg mb-2">{log.scriptName}</h3>
                        {getStatusBadge(log.status)}
                        <p className="text-sm text-gray-600 mt-2">
                          {new Date(log.executedAt).toLocaleString()}
                        </p>
                        <p className="text-sm text-gray-600">{log.userEmail}</p>
                      </div>
                      {log.response && (
                        <div>
                          <h4 className="font-semibold mb-2">Response:</h4>
                          <pre className="text-xs bg-green-50 p-3 rounded overflow-x-auto max-h-64 overflow-y-auto border">
                            {log.response}
                          </pre>
                        </div>
                      )}
                      {log.error && (
                        <div>
                          <h4 className="font-semibold mb-2">Error:</h4>
                          <pre className="text-xs bg-red-50 p-3 rounded overflow-x-auto max-h-64 overflow-y-auto border">
                            {log.error}
                          </pre>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}