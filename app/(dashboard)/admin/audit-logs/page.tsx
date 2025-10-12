// app/(dashboard)/admin/page.tsx
'use client';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useRouter } from 'next/navigation';
import { FileText, Users, Settings, Activity } from 'lucide-react';

export default function AdminDashboard() {
  const router = useRouter();

  const adminActions = [
    {
      title: 'Audit Logs',
      description: 'View all script execution history across all users',
      icon: Activity,
      href: '/admin/audit-logs',
      color: 'bg-blue-500',
    },
    {
      title: 'Manage Users',
      description: 'Add, edit, or remove user accounts',
      icon: Users,
      href: '/admin/users',
      color: 'bg-green-500',
    },
    {
      title: 'System Reports',
      description: 'View system-wide analytics and reports',
      icon: FileText,
      href: '/admin/reports',
      color: 'bg-purple-500',
    },
    {
      title: 'Settings',
      description: 'Configure system settings and preferences',
      icon: Settings,
      href: '/admin/settings',
      color: 'bg-orange-500',
    },
  ];

  return (
    <div className="space-y-6 p-6">
      <div>
        <h1 className="text-3xl font-bold">Admin Dashboard</h1>
        <p className="text-gray-600 mt-2">
          Manage your Script Library system
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {adminActions.map((action) => {
          const Icon = action.icon;
          return (
            <Card 
              key={action.href} 
              className="hover:shadow-lg transition-shadow cursor-pointer"
              onClick={() => router.push(action.href)}
            >
              <CardHeader>
                <div className="flex items-center gap-4">
                  <div className={`${action.color} p-3 rounded-lg`}>
                    <Icon className="h-6 w-6 text-white" />
                  </div>
                  <div>
                    <CardTitle>{action.title}</CardTitle>
                    <CardDescription className="mt-1">
                      {action.description}
                    </CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <Button 
                  variant="outline" 
                  className="w-full"
                  onClick={(e) => {
                    e.stopPropagation();
                    router.push(action.href);
                  }}
                >
                  Open
                </Button>
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
}