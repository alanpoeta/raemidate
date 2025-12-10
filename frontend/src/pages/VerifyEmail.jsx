import { useState } from "react";
import { useParams, useNavigate, Navigate } from "react-router-dom";
import api from "../helpers/api";
import { useAuth } from "../helpers/AuthContext";

const VerifyEmail = () => {
  const { token } = useParams();
  const navigate = useNavigate();
  const { user, isAuthenticated, login } = useAuth();
  const [status, setStatus] = useState({ loading: false, success: false, message: "" });

  const handleVerify = async () => {
    setStatus({ loading: true, success: false, message: "" });
    try {
      const { data } = await api.get(`verify-email/${token}/`);
      setStatus({ loading: false, success: true, message: data.message });
      
      setTimeout(() => {
        if (isAuthenticated) login();
        else navigate("/login")
      }, 3000);

    } catch (error) {
      setStatus({ 
        loading: false, 
        success: false, 
        message: error.response?.data?.message || "Verification failed" 
      });
    }
  };

  if (user?.isEmailVerified)
    return <Navigate to="/" />;

  return (
    <div className="min-h-full flex items-center justify-center p-6 bg-white sm:bg-transparent">
      <div className="w-full max-w-sm text-center">
        {!status.success && !status.message && (
           <div className="mb-6">
             <div className="w-16 h-16 bg-blue-50 text-blue-500 rounded-full flex items-center justify-center mx-auto mb-6">
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-8 h-8">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75 11.25 15 15 9.75M21 12c0 1.268-.63 2.39-1.593 3.068a3.745 3.745 0 0 1-1.043 3.296 3.745 3.745 0 0 1-3.296 1.043A3.745 3.745 0 0 1 12 21c-1.268 0-2.39-.63-3.068-1.593a3.746 3.746 0 0 1-3.296-1.043 3.745 3.745 0 0 1-1.043-3.296A3.745 3.745 0 0 1 3 12c0-1.268.63-2.39 1.593-3.068a3.745 3.745 0 0 1 1.043-3.296 3.746 3.746 0 0 1 3.296-1.043A3.746 3.746 0 0 1 12 3c1.268 0 2.39.63 3.068 1.593a3.746 3.746 0 0 1 3.296 1.043 3.746 3.746 0 0 1 1.043 3.296A3.745 3.745 0 0 1 21 12Z" />
                </svg>
             </div>
             <h1 className="text-2xl font-bold text-gray-900 mb-3">Verify Your Email</h1>
             <p className="text-gray-600 mb-8 leading-relaxed">
                Click the button below to complete the verification of your email address.
             </p>
             <button 
                onClick={handleVerify}
                disabled={status.loading}
                className="w-full py-3.5 bg-primary text-white rounded-xl font-bold text-lg shadow-lg shadow-primary/30 hover:shadow-primary/40 transition-transform active:scale-[0.98] disabled:opacity-70 disabled:cursor-not-allowed"
              >
                {status.loading ? 'Verifying...' : 'Verify Email'}
              </button>
           </div>
        )}

        {(status.success || status.message) && (
          <div>
            <div className={`w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-6 ${status.success ? 'bg-green-100 text-green-500' : 'bg-red-100 text-red-500'}`}>
              {status.success ? (
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-8 h-8">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
                </svg>
              ) : (
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-8 h-8">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                </svg>
              )}
            </div>
            
            <h1 className="text-2xl font-bold text-gray-900 mb-3">
              {status.success ? "Email Verified!" : "Verification Failed"}
            </h1>
            
            <p className="text-gray-600 mb-8 leading-relaxed">
              {status.message}
            </p>

            {status.success ? (
              <p className="text-sm text-gray-400 animate-pulse">Redirecting you shortly...</p>
            ) : (
              <button 
                onClick={() => navigate('/')}
                className="w-full py-3.5 bg-primary text-white rounded-xl font-bold text-lg shadow-lg shadow-primary/30 hover:shadow-primary/40 transition-transform active:scale-[0.98]"
              >
                Return
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default VerifyEmail;
