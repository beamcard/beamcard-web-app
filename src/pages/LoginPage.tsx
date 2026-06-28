import { Link, useNavigate } from 'react-router-dom';
import { LoginForm } from '../features/auth/LoginForm';
import { useAuthStore } from '../stores/authStore';
import type { AuthResponse } from '../api/auth';

export function LoginPage() {
  const navigate = useNavigate();
  const setToken = useAuthStore((s) => s.setToken);

  const handleSuccess = (res: AuthResponse) => {
    setToken(res.access_token);
    navigate('/app', { replace: true });
  };

  return (
    <div className="max-w-md mx-auto mt-20 p-6">
      <h1 className="text-2xl font-bold text-slate-900">Welcome back</h1>
      <p className="text-sm text-slate-600 mb-6 italic">Beam me your profile.</p>
      <LoginForm onSuccess={handleSuccess} />
      <p className="mt-4 text-sm">
        <Link className="text-indigo-600 hover:underline" to="/forgot-password">
          Forgot your password?
        </Link>
      </p>
      <p className="mt-2 text-sm text-slate-600">
        New to Beamcard?{' '}
        <Link className="text-indigo-600 hover:underline" to="/signup">
          Create an account
        </Link>
      </p>
    </div>
  );
}
