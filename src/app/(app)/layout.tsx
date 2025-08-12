import AppLayout from '@/components/AppLayout';

export default function AppAreaLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <AppLayout>{children}</AppLayout>;
}
