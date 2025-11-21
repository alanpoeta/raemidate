import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { useForm } from "react-hook-form";
import api from "../helpers/api";
import { useMutation } from "@tanstack/react-query";
import { requiredErrorMessage, setServerErrors } from "../helpers/helpers";
import Loading from "../components/Loading";
import { useAuth } from "../helpers/AuthContext";

const PasswordReset = () => {
  const { isLoading, isAuthenticated } = useAuth();
  const { token } = useParams();
  const navigate = useNavigate();
  const [isValidToken, setIsValidToken] = useState(null);
  const [errorMessage, setErrorMessage] = useState("");
  const { register, handleSubmit, formState: { errors }, setError, watch } = useForm();

  useEffect(() => {
    if (!isLoading && isAuthenticated) navigate('/');
  }, [isAuthenticated]);

  useEffect(() => {
    const verifyToken = async () => {
      try {
        await api.get(`verify-password-reset-token/${token}/`);
        setIsValidToken(true);
      } catch (error) {
        const message = error.response?.data?.message || "Invalid or expired link";
        setErrorMessage(message);
        setIsValidToken(false);
        
        setTimeout(() => {
          navigate('/');
        }, 3000);
      }
    };
    verifyToken();
  }, [token, navigate]);

  const resetMutation = useMutation({
    mutationFn: async data => {
      const response = await api.post(`reset-password/${token}/`, {
        password: data.password
      });
      return response.data;
    },
    onSuccess: () => navigate('/login'),
    onError: error => setServerErrors(error, setError)
  });

  const password = watch("password");

  if (isValidToken === null)
    return <Loading />;

  if (isValidToken === false)
    return (
      <>
        <h1>Password Reset Failed</h1>
        <p>{errorMessage}</p>
        <p>Redirecting to home page...</p>
      </>
    );

  return (
    <>
      <h1>Reset Your Password</h1>
      <form onSubmit={handleSubmit((data) => resetMutation.mutate(data))}>
        <input
          type="password"
          {...register("password", { required: requiredErrorMessage("password") })}
          placeholder="New Password"
        />
        <input
          type="password"
          {...register("password_confirm", {
            required: requiredErrorMessage("password_confirm"),
            validate: value => value === password || "Passwords do not match"
          })}
          placeholder="Confirm Password"
        />
        <button type="submit" disabled={resetMutation.isPending}>
          {resetMutation.isPending ? 'Resetting...' : 'Reset Password'}
        </button>
      </form>
      <ul>
        {Object.keys(errors).map(field =>
          <li key={field}>{errors[field].message}</li>
        )}
      </ul>
    </>
  );
};

export default PasswordReset;
