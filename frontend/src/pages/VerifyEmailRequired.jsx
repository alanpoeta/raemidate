import { useState } from "react";
import { useAuth } from "../helpers/AuthContext";
import api from "../helpers/api";
import { Navigate } from "react-router-dom";

const VerifyEmailRequired = () => {
  const { user } = useAuth();
  const [resendStatus, setResendStatus] = useState({ loading: false, message: "" });

  const handleResend = async () => {
    setResendStatus({ loading: true, message: "" });
    try {
      await api.post('resend-verification/');
      setResendStatus({ 
        loading: false, 
        message: "Verification email sent!" 
      });
    } catch (error) {
      setResendStatus({ 
        loading: false, 
        message: error.response?.data?.error || "Failed to resend email" 
      });
    }
  };

  if (user.isEmailVerified)
    return <Navigate to="/" />;

  return (
    <div className="min-h-full flex items-center justify-center p-6 bg-white sm:bg-transparent">
      <div className="w-full max-w-sm text-center">
        <div className="w-16 h-16 bg-blue-50 text-blue-500 rounded-full flex items-center justify-center mx-auto mb-6">
          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-8 h-8">
            <path strokeLinecap="round" strokeLinejoin="round" d="M21.75 6.75v10.5a2.25 2.25 0 0 1-2.25 2.25h-15a2.25 2.25 0 0 1-2.25-2.25V6.75m19.5 0A2.25 2.25 0 0 0 19.5 4.5h-15a2.25 2.25 0 0 0-2.25 2.25m19.5 0v.243a2.25 2.25 0 0 1-1.07 1.916l-7.5 4.615a2.25 2.25 0 0 1-2.36 0L3.32 8.91a2.25 2.25 0 0 1-1.07-1.916V6.75" />
          </svg>
        </div>

        <h1 className="text-2xl font-bold text-gray-900 mb-3">Verify Your Email</h1>
        
        <p className="text-gray-600 mb-8 leading-relaxed">
          Please check your email <strong>inbox </strong>
          and <strong>junk folder</strong> and click the
          verification link we sent you to unlock all features.
          The verification email may take a <strong>few minutes</strong> to arrive.
        </p>
        
        <button 
          onClick={handleResend} 
          disabled={resendStatus.loading}
          className="w-full py-3.5 bg-primary text-white rounded-xl font-bold text-lg shadow-lg shadow-primary/30 hover:shadow-primary/40 disabled:opacity-70 disabled:cursor-not-allowed transition-transform active:scale-[0.98]"
        >
          {resendStatus.loading ? 'Sending...' : 'Resend Verification Email'}
        </button>
        
        {resendStatus.message && (
          <div className={`mt-4 text-sm font-medium ${resendStatus.message.includes("sent") ? "text-green-600" : "text-red-500"}`}>
            {resendStatus.message}
          </div>
        )}
      </div>
    </div>
  );
};

export default VerifyEmailRequired;
