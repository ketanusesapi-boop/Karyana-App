import React from 'react';
import { auth, signOut } from '../../services/firebaseService';

const SubscriptionExpired: React.FC = () => {
  const handleLogout = async () => {
    try {
      await signOut(auth);
    } catch (error) {
      console.error("Error signing out: ", error);
    }
  };

  return (
    <div className="min-h-screen flex flex-col justify-center items-center bg-bg-dark p-4 text-text-dark">
      <div className="w-full max-w-md text-center">
        <h1 className="text-4xl font-bold text-sky-400 mb-4">ShopTrack</h1>
        <div className="bg-card-dark rounded-lg shadow-xl p-8">
          <h2 className="text-2xl font-bold mb-4">Access Denied</h2>
          <p className="text-subtle-dark mb-6">
            Your subscription has expired or is not active. Please contact the administrator to renew your plan.
          </p>
          <button
            onClick={handleLogout}
            className="w-full py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-primary hover:bg-primary-hover focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary"
          >
            Logout
          </button>
        </div>
      </div>
    </div>
  );
};

export default SubscriptionExpired;
