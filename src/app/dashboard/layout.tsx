import { DashboardNav } from '@/components/DashboardNav';
import { ReactNode } from 'react';

export const metadata = {
  title: 'Dashboard - Noticias',
  description: 'Dashboard de gestión',
};

export default function DashboardLayout({ children }: { children: ReactNode }) {
  return (
    <>
      <DashboardNav />
      <main>{children}</main>
    </>
  );
}
