import React, { useState } from 'react';
import { auth, createUserWithEmailAndPassword, signInWithEmailAndPassword, initializeUserSubscription } from '../../services/firebaseService';

const Login: React.FC = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isSigningUp, setIsSigningUp] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      if (isSigningUp) {
        // FIX: Switched to Firebase v9+ modular syntax.
        const userCredential = await createUserWithEmailAndPassword(auth, email, password);
        // Create initial subscription document for the new user
        await initializeUserSubscription(userCredential.user.uid);
      } else {
        // FIX: Switched to Firebase v9+ modular syntax.
        await signInWithEmailAndPassword(auth, email, password);
      }
    } catch (err: any) {
      setError(err.message);
    } finally {
        setLoading(false);
    }
  };

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
            {isSigningUp ? 'Create an Account' : 'Sign In'}
          </h2>
          <form onSubmit={handleSubmit} className="space-y-6">
            {error && <p className="text-red-500 bg-red-100 dark:bg-red-900/30 p-3 rounded-md text-sm">{error}</p>}
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
            <div>
              <label htmlFor="password"className="block text-sm font-medium">
                Password
              </label>
              <input
                id="password"
                name="password"
                type="password"
                autoComplete={isSigningUp ? "new-password" : "current-password"}
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="mt-1 block w-full px-3 py-2 border border-border-light dark:border-border-dark rounded-md shadow-sm focus:outline-none focus:ring-primary focus:border-primary bg-bg-light dark:bg-bg-dark text-white"
              />
            </div>
            <div>
              <button
                type="submit"
                disabled={loading}
                className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-primary hover:bg-primary-hover focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary disabled:bg-slate-400"
              >
                {loading ? 'Processing...' : (isSigningUp ? 'Sign Up' : 'Sign In')}
              </button>
            </div>
          </form>
          <p className="mt-6 text-center text-sm">
            {isSigningUp ? 'Already have an account?' : "Don't have an account?"}
            <button
              onClick={() => {
                setIsSigningUp(!isSigningUp);
                setError(null);
              }}
              className="font-medium text-primary hover:text-primary-hover ml-1"
            >
              {isSigningUp ? 'Sign In' : 'Sign Up'}
            </button>
          </p>
        </div>
      </div>
    </div>
  );
};

export default Login;