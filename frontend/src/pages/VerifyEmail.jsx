import { useEffect, useState } from "react";
import { useParams, useNavigate, Navigate } from "react-router-dom";
import api from "../helpers/api";
import Loading from "../components/Loading";
import { useAuth } from "../helpers/AuthContext";

const VerifyEmail = () => {
  const { token } = useParams();
  const navigate = useNavigate();
  const { user, isAuthenticated, login } = useAuth();
  const [status, setStatus] = useState({ loading: true, success: false, message: "" });

  useEffect(() => {
    if (user?.isEmailVerified) return;

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
  }, [token]);

  if (user?.isEmailVerified)
    return <Navigate to="/" />;

  if (status.loading)
    return <Loading />;

  return (
    <>
      <h1>{status.success ? "Email Verified!" : "Verification Failed"}</h1>
      <p>{status.message}</p>
      {status.success ? (
        <p>Redirecting...</p>
      ) : (
        <button onClick={() => navigate('/login')}>Go to Login</button>
      )}
    </>
  );
};

export default VerifyEmail;
