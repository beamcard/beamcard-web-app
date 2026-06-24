import { Link, useNavigate } from 'react-router-dom';
import { SignupForm } from '../features/auth/SignupForm';
import { useAuthStore } from '../stores/authStore';
import type { AuthResponse } from '../api/auth';

export function SignupPage() {
  const navigate = useNavigate();
  const setToken = useAuthStore((s) => s.setToken);

  const handleSuccess = (res: AuthResponse) => {
    setToken(res.access_token);
    navigate('/app', { replace: true });
  };

  return (
    <div className="max-w-md mx-auto mt-20 p-6">
      <h1 className="text-2xl font-bold text-slate-900">Create your Beamcard</h1>
      <p className="text-sm text-slate-600 mb-6 italic">Beam me your profile.</p>
      <SignupForm onSuccess={handleSuccess} />
      <p className="mt-4 text-sm text-slate-600">
        Already have an account?{' '}
        <Link className="text-indigo-600 hover:underline" to="/login">
          Sign in
        </Link>
      </p>
    </div>
  );
}
