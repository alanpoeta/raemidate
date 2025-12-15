import { useEffect, useState } from "react";
import api from '../helpers/api';
import { useNavigate } from "react-router-dom";
import { useForm } from "react-hook-form";
import { requiredErrorMessage, setServerErrors } from "../helpers/helpers";
import { useAuth } from "../helpers/AuthContext";
import { useMutation } from "@tanstack/react-query";
import { Container, Input, Button } from "./AuthUI";

const AuthForm = ({ action }) => {
  const navigate = useNavigate();
  const { register, handleSubmit, formState: { errors }, setError, watch } = useForm();
  const { login, isAuthenticated, isLoading } = useAuth();
  const [needsVerification, setNeedsVerification] = useState(false);
  const [forgotPassword, setForgotPassword] = useState(false);
  const [resetEmailSent, setResetEmailSent] = useState(false);

  useEffect(() => {
    if (!isLoading && isAuthenticated) navigate('/');
  }, [isAuthenticated]);
  
  let route;
  switch (action) {
    case "login":
      route = 'token/';
      break;
    case "register":
      route = "user/";
      break;
    default:
      throw new Error("action not defined");
  }

  const authMutation = useMutation({
    mutationFn: async fields => {
      const { data } = await api.post(route, fields);
      return data;
    },
    onSuccess: (data) => {
      if (action === 'login') {
        login(data.access, data.refresh);
      } else {
        setNeedsVerification(true);
      }
    },
    onError: error => setServerErrors(error, setError)
  });

  const passwordResetMutation = useMutation({
    mutationFn: async (email) => {
      const { data } = await api.post('request-password-reset/', { email });
      return data;
    },
    onSuccess: () => {
      setResetEmailSent(true);
    },
    onError: error => setServerErrors(error, setError)
  });

  if (needsVerification)
    return (
      <Container title="Check Your Email">
        <div className="text-center space-y-6">
          <div className="w-16 h-16 bg-blue-50 text-blue-500 rounded-full flex items-center justify-center mx-auto">
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-8 h-8">
              <path strokeLinecap="round" strokeLinejoin="round" d="M21.75 6.75v10.5a2.25 2.25 0 0 1-2.25 2.25h-15a2.25 2.25 0 0 1-2.25-2.25V6.75m19.5 0A2.25 2.25 0 0 0 19.5 4.5h-15a2.25 2.25 0 0 0-2.25 2.25m19.5 0v.243a2.25 2.25 0 0 1-1.07 1.916l-7.5 4.615a2.25 2.25 0 0 1-2.36 0L3.32 8.91a2.25 2.25 0 0 1-1.07-1.916V6.75" />
            </svg>
          </div>
          <p className="text-gray-600 leading-relaxed">
            We&#39;ve sent a verification link to your email address.
            Please check your <strong>inbox </strong>
            and <strong>junk folder</strong>. Please click the
            link to verify your account before logging in.
            The verification email may take a <strong>few minutes</strong> to arrive.
          </p>
          <Button onClick={() => navigate('/login')}>Go to Login</Button>
        </div>
      </Container>
    );

  if (forgotPassword) {
    if (resetEmailSent)
      return (
        <Container title="Email Sent">
          <p className="text-center text-gray-600 mb-6">
            If an account exists with this email, a password reset link has been sent.
            The verification email may take a <strong>few minutes</strong> to arrive.
          </p>
          <Button onClick={() => {
            setForgotPassword(false);
            setResetEmailSent(false);
          }}>Back to Login</Button>
        </Container>
      );

    return (
      <Container title="Reset Password">
        <p className="text-center text-gray-500 mb-6 text-sm">Enter your email address to receive a password reset link.</p>
        <form onSubmit={handleSubmit(fields => passwordResetMutation.mutate(fields.email))} autoComplete="off">
          <Input
            {...register("email", { required: requiredErrorMessage("email") })}
            placeholder="Email address"
            error={errors.email}
          />
          <div className="space-y-3">
            <Button disabled={passwordResetMutation.isPending}>
              {passwordResetMutation.isPending ? 'Sending...' : 'Send Reset Link'}
            </Button>
            <Button type="button" secondary onClick={() => setForgotPassword(false)}>
              Cancel
            </Button>
          </div>
        </form>
        {errors.root && <p className="text-red-500 text-center mt-4">{errors.root.message}</p>}
      </Container>
    );
  }

  const password = watch("password");
  return (
    <Container title={action === "login" ? "Login" : "Create Account"}>
      <form onSubmit={handleSubmit(fields => authMutation.mutate(fields))} className="space-y-2" autoComplete="off">
        {action === "register" &&
          <Input
            {...register("email", { required: requiredErrorMessage("email") })}
            placeholder="Email address"
            error={errors.email}
          />
        }
        <Input
          {...register("username", { required: requiredErrorMessage("username") })}
          placeholder="Username"
          error={errors.username}
        />
        <Input
          type="password"
          {...register("password", { required: requiredErrorMessage("password") })}
          placeholder="Password"
          error={errors.password}
        />
        {action === "register" &&
          <Input
            type="password"
            {...register("password_confirm", {
              required: requiredErrorMessage("password_confirm"),
              validate: value => value === password || "Passwords do not match"
            })}
            placeholder="Confirm Password"
            error={errors.password_confirm}
          />
        }
        
        <div className="pt-2">
          <Button disabled={authMutation.isPending}>
            {authMutation.isPending ? 'Please wait...' : (action === "login" ? "Login" : "Sign Up")}
          </Button>
        </div>

        {action === 'login' && (
          <div className="text-center pt-2">
            <button 
              type="button"
              className="text-sm text-gray-500 hover:text-primary transition-colors"
              onClick={() => setForgotPassword(true)}
            >
              Forgot Password?
            </button>
          </div>
        )}
      </form>
      
      {errors.root && (
        <div className="mt-4 p-3 bg-red-50 text-red-600 text-sm rounded-lg text-center border border-red-100">
          {errors.root.message}
        </div>
      )}

      <div className="mt-8 text-center text-sm text-gray-500">
        {action === 'login' ? (
          <>New here? <span onClick={() => navigate('/register')} className="text-primary font-bold cursor-pointer hover:underline">Create an account</span></>
        ) : (
          <>Already have an account? <span onClick={() => navigate('/login')} className="text-primary font-bold cursor-pointer hover:underline">Log in</span></>
        )}
      </div>

      <div className="mt-8 text-center text-sm text-gray-500">
          <span onClick={() => navigate('/tos')} className="text-primary font-bold cursor-pointer hover:underline">Terms of Service & Privacy Policy</span>
      </div>
    </Container>
  );
};
 
export default AuthForm;
