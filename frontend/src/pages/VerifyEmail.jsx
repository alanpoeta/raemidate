import { useEffect, useState } from "react";
import { useParams, useNavigate, Navigate } from "react-router-dom";
import api from "../helpers/api";
import Loading from "../components/Loading";
import { useAuth } from "../helpers/AuthContext";

const VerifyEmail = () => {
  const { token } = useParams();
  const navigate = useNavigate();
  const { user, isAuthenticated, login, isLoading } = useAuth();
  const [status, setStatus] = useState({ loading: true, success: false, message: "" });

  useEffect(() => {
    if (user?.isEmailVerified || isLoading) return;

    const verifyEmail = async () => {
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

    verifyEmail();
  }, [token, user?.isEmailVerified || isLoading]);

  if (user?.isEmailVerified)
    return <Navigate to="/" />;

  if (status.loading)
    return <Loading />;

  return (
    <div className="min-h-full flex items-center justify-center p-6 bg-white sm:bg-transparent">
      <div className="w-full max-w-sm text-center">
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
    </div>
  );
};

export default VerifyEmail;
