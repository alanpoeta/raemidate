import { useState } from "react";
import { useAuth } from "../helpers/AuthContext";
import api from "../helpers/api";
import { Navigate } from "react-router-dom";

const VerifyEmailRequired = () => {
  const { user, logout } = useAuth();
  const [resendStatus, setResendStatus] = useState({ loading: false, message: "" });

  const handleResend = async () => {
    setResendStatus({ loading: true, message: "" });
    try {
      await api.post('resend-verification/');
      setResendStatus({ 
        loading: false, 
        message: "Verification email sent! Please check your inbox and spam." 
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
    <>
      <h1>Verify Your Email</h1>
      <p>Please check your email inbox and click the verification link we sent you.</p>
      <button 
        onClick={handleResend} 
        disabled={resendStatus.loading}
      >
        {resendStatus.loading ? 'Sending...' : 'Resend Verification Email'}
      </button>
      <button onClick={logout}>Logout</button>
      {resendStatus.message && <p>{resendStatus.message}</p>}
    </>
  );
};

export default VerifyEmailRequired;
