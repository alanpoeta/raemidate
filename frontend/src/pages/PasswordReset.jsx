import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { useForm } from "react-hook-form";
import api from "../helpers/api";
import { useMutation } from "@tanstack/react-query";
import { requiredErrorMessage, setServerErrors } from "../helpers/helpers";
import Loading from "../components/Loading";
import { useAuth } from "../helpers/AuthContext";
import { Container, Input, Button } from "../components/AuthUI";

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
        await api.post(`verify-password-reset-token/${token}/`);
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
      <Container title="Reset Failed">
        <div className="text-center text-red-500 mb-4">
          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-20 h-20 mx-auto mb-2">
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m9-.75a9 9 0 1 1-18 0 9 9 0 0 1 18 0Zm-9 3.75h.008v.008H12v-.008Z" />
          </svg>
          <p className="font-medium">{errorMessage}</p>
        </div>
        <p className="text-center text-gray-500 text-sm">Redirecting to home page...</p>
      </Container>
    );

  return (
    <Container title="Set New Password">
      <form onSubmit={handleSubmit((data) => resetMutation.mutate(data))} autoComplete="off">
        <Input
          type="password"
          {...register("password", { required: requiredErrorMessage("password") })}
          placeholder="New Password"
          error={errors.password}
        />
        <Input
          type="password"
          {...register("password_confirm", {
            required: requiredErrorMessage("password_confirm"),
            validate: value => value === password || "Passwords do not match"
          })}
          placeholder="Confirm Password"
          error={errors.password_confirm}
        />
        <div className="pt-2">
          <Button disabled={resetMutation.isPending}>
            {resetMutation.isPending ? 'Resetting...' : 'Reset Password'}
          </Button>
        </div>
      </form>
      {errors.root && (
        <div className="mt-4 p-3 bg-red-50 text-red-600 text-sm rounded-lg text-center border border-red-100">
          {errors.root.message}
        </div>
      )}
    </Container>
  );
};

export default PasswordReset;
