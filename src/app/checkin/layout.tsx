import { AuthGate } from '@/components/auth/auth-gate';

export default function CheckinLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <AuthGate>
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50">
        {children}
      </div>
    </AuthGate>
  );
}
