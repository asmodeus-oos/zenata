import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';

export default async function LoginPage() {
  const supabase = await createClient();
  const { data } = await supabase.auth.getUser();

  if (data?.user) {
    redirect('/');
  }

  return (
    <main className="flex min-h-screen items-center justify-center bg-slate-50">
      <div className="w-full max-w-md p-8 bg-white rounded-3xl shadow-xl">
        <h1 className="text-2xl font-bold text-center mb-6">Zendenta Personnel Authorization</h1>
        <p className="text-center text-sm text-slate-500 mb-8">
          The system has been migrated to Enterprise Supabase Auth. Please login with your new credentials.
        </p>
        <form className="space-y-4">
          <div>
            <label className="text-xs font-bold uppercase text-slate-500">Email Address</label>
            <input type="email" className="w-full mt-1 p-3 rounded-xl border border-slate-200" placeholder="staff@clinic.com" />
          </div>
          <div>
            <label className="text-xs font-bold uppercase text-slate-500">Password</label>
            <input type="password" className="w-full mt-1 p-3 rounded-xl border border-slate-200" placeholder="••••••••" />
          </div>
          <button type="submit" className="w-full py-3 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl shadow-md">
            Authenticate
          </button>
        </form>
      </div>
    </main>
  );
}
