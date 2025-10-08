import { getSession } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { Code2, ScrollText, User, Shield, TrendingUp, Clock, CheckCircle, Calendar, Mail, Key } from 'lucide-react';
import Link from 'next/link';

export default async function DashboardPage() {
  const session = await getSession();
  
  const user = await prisma.user.findUnique({
    where: { id: session!.userId },
  });

  const scripts = await prisma.script.findMany();
  
  const userAuditLogs = await prisma.auditLog.findMany({
    where: { userId: session!.userId },
    orderBy: { executedAt: 'desc' },
    take: 5,
  });

  const successfulExecutions = userAuditLogs.filter(log => log.status === 'SUCCESS').length;
  const successRate = userAuditLogs.length > 0 
    ? Math.round((successfulExecutions / userAuditLogs.length) * 100)
    : 0;

  return (
    <div className="space-y-6">
      {/* Welcome Banner */}
      <div className="bg-gradient-to-r from-blue-600 to-purple-600 rounded-xl p-8 text-white shadow-lg">
        <h1 className="text-4xl font-bold mb-2">Welcome back!</h1>
        <p className="text-xl opacity-90">{user?.email} • {session!.role === 'ADMIN' ? 'Administrator' : 'User'}</p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {/* Total Scripts */}
        <Link href="/scripts">
          <div className="bg-white rounded-xl p-6 shadow-md hover:shadow-xl transition-shadow border-2 border-transparent hover:border-blue-500 cursor-pointer">
            <div className="flex items-center justify-between mb-4">
              <div className="bg-blue-100 p-3 rounded-lg">
                <Code2 className="w-8 h-8 text-blue-600" />
              </div>
            </div>
            <div className="text-4xl font-bold text-gray-900 mb-2">{scripts.length}</div>
            <div className="text-sm font-medium text-gray-600">Total Scripts</div>
            <div className="text-xs text-gray-500 mt-1">Click to browse →</div>
          </div>
        </Link>

        {/* Total Executions */}
        <Link href="/audit-logs">
          <div className="bg-white rounded-xl p-6 shadow-md hover:shadow-xl transition-shadow border-2 border-transparent hover:border-green-500 cursor-pointer">
            <div className="flex items-center justify-between mb-4">
              <div className="bg-green-100 p-3 rounded-lg">
                <ScrollText className="w-8 h-8 text-green-600" />
              </div>
            </div>
            <div className="text-4xl font-bold text-gray-900 mb-2">{userAuditLogs.length}</div>
            <div className="text-sm font-medium text-gray-600">Your Executions</div>
            <div className="text-xs text-gray-500 mt-1">Click to view logs →</div>
          </div>
        </Link>

        {/* Success Rate */}
        <div className="bg-white rounded-xl p-6 shadow-md hover:shadow-xl transition-shadow border-2">
          <div className="flex items-center justify-between mb-4">
            <div className="bg-purple-100 p-3 rounded-lg">
              <CheckCircle className="w-8 h-8 text-purple-600" />
            </div>
          </div>
          <div className="text-4xl font-bold text-gray-900 mb-2">{successRate}%</div>
          <div className="text-sm font-medium text-gray-600">Success Rate</div>
          <div className="mt-3 bg-gray-200 rounded-full h-3 overflow-hidden">
            <div 
              className="bg-purple-600 h-3 rounded-full transition-all duration-500"
              style={{ width: `${successRate}%` }}
            />
          </div>
        </div>

        {/* Account Type */}
        {session!.role === 'ADMIN' ? (
          <Link href="/admin">
            <div className="bg-white rounded-xl p-6 shadow-md hover:shadow-xl transition-shadow border-2 border-transparent hover:border-orange-500 cursor-pointer">
              <div className="flex items-center justify-between mb-4">
                <div className="bg-orange-100 p-3 rounded-lg">
                  <Shield className="w-8 h-8 text-orange-600" />
                </div>
              </div>
              <div className="text-4xl font-bold text-gray-900 mb-2">Admin</div>
              <div className="text-sm font-medium text-gray-600">Account Type</div>
              <div className="text-xs text-gray-500 mt-1">Click for admin panel →</div>
            </div>
          </Link>
        ) : (
          <div className="bg-white rounded-xl p-6 shadow-md hover:shadow-xl transition-shadow border-2">
            <div className="flex items-center justify-between mb-4">
              <div className="bg-orange-100 p-3 rounded-lg">
                <User className="w-8 h-8 text-orange-600" />
              </div>
            </div>
            <div className="text-4xl font-bold text-gray-900 mb-2">User</div>
            <div className="text-sm font-medium text-gray-600">Account Type</div>
            <div className="text-xs text-gray-500 mt-1">Standard access</div>
          </div>
        )}
      </div>

      {/* Recent Activity */}
      <div className="bg-white rounded-xl shadow-lg border-2">
        <div className="bg-gradient-to-r from-gray-100 to-gray-50 px-6 py-4 border-b">
          <div className="flex items-center gap-3">
            <Clock className="w-6 h-6 text-blue-600" />
            <div>
              <h2 className="text-xl font-bold text-gray-900">Recent Activity</h2>
              <p className="text-sm text-gray-600">Your latest script executions</p>
            </div>
          </div>
        </div>
        <div className="p-6">
          {userAuditLogs.length === 0 ? (
            <div className="text-center py-12">
              <div className="bg-gray-100 w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-4">
                <ScrollText className="w-10 h-10 text-gray-400" />
              </div>
              <p className="text-gray-600 font-medium text-lg">No executions yet</p>
              <p className="text-sm text-gray-500 mt-2">Execute a script to see activity here</p>
            </div>
          ) : (
            <div className="space-y-3">
              {userAuditLogs.map((log) => (
                <div 
                  key={log.id} 
                  className="flex items-center justify-between p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors border"
                >
                  <div className="flex items-center gap-4">
                    <div 
                      className={`w-4 h-4 rounded-full ${
                        log.status === 'SUCCESS' ? 'bg-green-500' : 
                        log.status === 'FAILURE' ? 'bg-red-500' : 
                        'bg-yellow-500'
                      }`}
                      style={{
                        boxShadow: log.status === 'SUCCESS' ? '0 0 10px rgba(34, 197, 94, 0.5)' :
                                   log.status === 'FAILURE' ? '0 0 10px rgba(239, 68, 68, 0.5)' :
                                   '0 0 10px rgba(234, 179, 8, 0.5)'
                      }}
                    />
                    <div>
                      <p className="font-semibold text-gray-900">{log.scriptName}</p>
                      <p className="text-xs text-gray-500">
                        {new Date(log.executedAt).toLocaleString('en-US', {
                          month: 'short',
                          day: 'numeric',
                          hour: '2-digit',
                          minute: '2-digit'
                        })}
                      </p>
                    </div>
                  </div>
                  <span 
                    className={`text-xs px-4 py-2 rounded-full font-semibold ${
                      log.status === 'SUCCESS' ? 'bg-green-100 text-green-700' : 
                      log.status === 'FAILURE' ? 'bg-red-100 text-red-700' : 
                      'bg-yellow-100 text-yellow-700'
                    }`}
                  >
                    {log.status}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Account Info Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Email */}
        <div className="bg-white rounded-xl p-6 shadow-md hover:shadow-xl transition-shadow border-2">
          <div className="flex items-center gap-3 mb-4">
            <div className="bg-blue-100 p-2 rounded-lg">
              <Mail className="w-6 h-6 text-blue-600" />
            </div>
            <p className="text-xs font-bold text-gray-500 uppercase tracking-wider">Email Address</p>
          </div>
          <p className="text-lg font-semibold text-gray-900 break-all">{session!.email}</p>
        </div>

        {/* DB Tenant */}
        <div className="bg-white rounded-xl p-6 shadow-md hover:shadow-xl transition-shadow border-2">
          <div className="flex items-center gap-3 mb-4">
            <div className="bg-purple-100 p-2 rounded-lg">
              <Key className="w-6 h-6 text-purple-600" />
            </div>
            <p className="text-xs font-bold text-gray-500 uppercase tracking-wider">DB Tenant ID</p>
          </div>
          <p className="text-lg font-mono font-semibold text-gray-900">{user?.dbTenantId}</p>
        </div>

        {/* Member Since */}
        <div className="bg-white rounded-xl p-6 shadow-md hover:shadow-xl transition-shadow border-2">
          <div className="flex items-center gap-3 mb-4">
            <div className="bg-green-100 p-2 rounded-lg">
              <Calendar className="w-6 h-6 text-green-600" />
            </div>
            <p className="text-xs font-bold text-gray-500 uppercase tracking-wider">Member Since</p>
          </div>
          <p className="text-lg font-semibold text-gray-900">
            {user?.createdAt.toLocaleDateString('en-US', { 
              year: 'numeric', 
              month: 'long', 
              day: 'numeric' 
            })}
          </p>
        </div>
      </div>
    </div>
  );
}