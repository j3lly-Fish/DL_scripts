'use client';

import Link from 'next/link';
import { useRouter, usePathname } from 'next/navigation';
import { Button } from './ui/button';
import { LogOut, Code2, ScrollText, LayoutDashboard, Shield } from 'lucide-react';
import { Role } from '@prisma/client';

interface NavbarProps {
  userEmail: string;
  userRole: Role;
}

export default function Navbar({ userEmail, userRole }: NavbarProps) {
  const router = useRouter();
  const pathname = usePathname();

  const handleLogout = async () => {
    await fetch('/api/auth/logout', { method: 'POST' });
    router.push('/login');
    router.refresh();
  };

  const navItems = [
    { href: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { href: '/scripts', label: 'Scripts', icon: Code2 },
    { href: '/audit-logs', label: 'Audit Logs', icon: ScrollText },
  ];

  if (userRole === 'ADMIN') {
    navItems.push({ href: '/admin', label: 'Admin', icon: Shield });
  }

  return (
    <nav className="bg-white border-b border-gray-200 sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16">
          <div className="flex space-x-8">
            <div className="flex items-center">
              <Code2 className="h-6 w-6 text-primary mr-2" />
              <span className="text-xl font-bold">Script Library</span>
            </div>
            <div className="hidden md:flex space-x-4 items-center">
              {navItems.map((item) => {
                const Icon = item.icon;
                const isActive = pathname === item.href;
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    className={`flex items-center px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                      isActive
                        ? 'bg-blue-600 text-white'
                        : 'text-gray-700 hover:bg-gray-100'
                    }`}
                  >
                    <Icon className="h-4 w-4 mr-2" />
                    {item.label}
                  </Link>
                );
              })}
            </div>
          </div>
          <div className="flex items-center space-x-4">
            <span className="text-sm text-gray-600 hidden sm:block">
              {userEmail}
            </span>
            <Button onClick={handleLogout} variant="outline" size="sm">
              <LogOut className="h-4 w-4 mr-2" />
              Logout
            </Button>
          </div>
        </div>
      </div>
    </nav>
  );
}