import React, { useState } from 'react';
import { auth, createUserWithEmailAndPassword, signInWithEmailAndPassword, initializeUserSubscription, sendPasswordResetEmail } from '../../services/firebaseService';

type View = 'login' | 'signup' | 'reset';

const Login: React.FC = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [view, setView] = useState<View>('login');
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setSuccess(null);
    try {
      if (view === 'signup') {
        const userCredential = await createUserWithEmailAndPassword(auth, email, password);
        await initializeUserSubscription(userCredential.user.uid);
      } else if (view === 'login') {
        await signInWithEmailAndPassword(auth, email, password);
      } else if (view === 'reset') {
        await sendPasswordResetEmail(auth, email);
        setSuccess('Password reset link sent to your email. Please check your inbox.');
        setView('login');
      }
    } catch (err: any) {
      setError(err.message);
    } finally {
        setLoading(false);
    }
  };
  
  const getTitle = () => {
      switch(view) {
          case 'login': return 'Sign In';
          case 'signup': return 'Create an Account';
          case 'reset': return 'Reset Password';
      }
  }
  
  const getButtonText = () => {
      if (loading) return 'Processing...';
      switch(view) {
          case 'login': return 'Sign In';
          case 'signup': return 'Sign Up';
          case 'reset': return 'Send Reset Link';
      }
  }

  return (
    <div className="min-h-screen flex flex-col justify-center items-center bg-bg-light dark:bg-bg-dark p-4 text-text-light dark:text-text-dark">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
            <h1 className="text-4xl font-bold text-primary dark:text-sky-400">
              ShopTrack
            </h1>
            <p className="text-subtle-light dark:text-subtle-dark mt-2">Inventory management, simplified.</p>
        </div>
        <div className="bg-card-light dark:bg-card-dark rounded-lg shadow-xl p-6 sm:p-8">
          <h2 className="text-2xl font-bold text-center mb-6 text-primary dark:text-sky-400">
            {getTitle()}
          </h2>
          <form onSubmit={handleSubmit} className="space-y-6">
            {error && <p className="text-red-500 bg-red-100 dark:bg-red-900/30 p-3 rounded-md text-sm">{error}</p>}
            {success && <p className="text-green-600 bg-green-100 dark:bg-green-900/30 p-3 rounded-md text-sm">{success}</p>}
            
            <div>
              <label htmlFor="email" className="block text-sm font-medium">
                Email Address
              </label>
              <input
                id="email"
                name="email"
                type="email"
                autoComplete="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="mt-1 block w-full px-3 py-2 border border-border-light dark:border-border-dark rounded-md shadow-sm focus:outline-none focus:ring-primary focus:border-primary bg-bg-light dark:bg-bg-dark text-white"
              />
            </div>

            {view !== 'reset' && (
              <div>
                <label htmlFor="password"className="block text-sm font-medium">
                  Password
                </label>
                <input
                  id="password"
                  name="password"
                  type="password"
                  autoComplete={view === 'signup' ? "new-password" : "current-password"}
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="mt-1 block w-full px-3 py-2 border border-border-light dark:border-border-dark rounded-md shadow-sm focus:outline-none focus:ring-primary focus:border-primary bg-bg-light dark:bg-bg-dark text-white"
                />
              </div>
            )}
            
            {view === 'login' && (
                <div className="text-right">
                    <button 
                        type="button" 
                        onClick={() => { setView('reset'); setError(null); setSuccess(null); }} 
                        className="text-sm font-medium text-primary hover:text-primary-hover"
                    >
                        Forgot Password?
                    </button>
                </div>
            )}

            <div>
              <button
                type="submit"
                disabled={loading}
                className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-primary hover:bg-primary-hover focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary disabled:bg-slate-400"
              >
                {getButtonText()}
              </button>
            </div>
          </form>

          <p className="mt-6 text-center text-sm">
            {view === 'login' && "Don't have an account?"}
            {view === 'signup' && 'Already have an account?'}
            {view === 'reset' && 'Remember your password?'}
            <button
              onClick={() => {
                setView(view === 'login' || view === 'reset' ? 'signup' : 'login');
                setError(null);
                setSuccess(null);
              }}
              className="font-medium text-primary hover:text-primary-hover ml-1"
            >
              {view === 'login' || view === 'reset' ? 'Sign Up' : 'Sign In'}
            </button>
          </p>
        </div>
      </div>
    </div>
  );
};

export default Login;