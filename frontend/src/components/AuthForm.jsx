import { useEffect, useState } from "react";
import api from '../helpers/api';
import { useNavigate } from "react-router-dom";
import { useForm } from "react-hook-form";
import { desnakify, requiredErrorMessage, setServerErrors } from "../helpers/helpers";
import { useAuth } from "../helpers/AuthContext";
import { useMutation } from "@tanstack/react-query";

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
      <>
        <h1>Check Your Email</h1>
        <p>We&#39;ve sent a verification link to your email address. Please click the link to verify your account before logging in.</p>
        <button onClick={() => navigate('/login')}>Go to Login</button>
      </>
    );

  if (forgotPassword) {
    if (resetEmailSent)
      return (
        <>
          <h1>Check Your Email</h1>
          <p>If an account exists with this email, a password reset link has been sent.</p>
          <button onClick={() => {
            setForgotPassword(false);
            setResetEmailSent(false);
          }}>Back to Login</button>
        </>
      );

    return (
      <>
        <h1>Reset Password</h1>
        <p>Enter your email address to receive a password reset link.</p>
        <form onSubmit={handleSubmit(fields => passwordResetMutation.mutate(fields.email))}>
          <input
              {...register("email", { required: requiredErrorMessage("email") })}
              placeholder="Email"
          />
          <button type="submit" disabled={passwordResetMutation.isPending}>
            {passwordResetMutation.isPending ? 'Sending...' : 'Send Reset Link'}
          </button>
          <button type="button" onClick={() => setForgotPassword(false)}>
            Back to Login
          </button>
        </form>
        <ul>
          {Object.keys(errors).map(field =>
            <li key={field}>{errors[field].message}</li>
          )}
        </ul>
      </>
    );
  }

  const password = watch("password");
  return (
    <>
      <h1>{desnakify(action)}</h1>
      <form onSubmit={handleSubmit(fields => authMutation.mutate(fields))}>
        {action === "register" &&
          <input
            {...register("email", { required: requiredErrorMessage("email") })}
            placeholder="Email"
          />
        }
        <input
          {...register("username", { required: requiredErrorMessage("username") })}
          placeholder="Username"
        />
        <input
          type="password"
            {...register("password", { required: requiredErrorMessage("password") })}
            placeholder="Password"
          />
        {action === "register" &&
          <input
            type="password"
            {...register("password_confirm", {
              required: requiredErrorMessage("password_confirm"),
              validate: value => value === password || "Passwords do not match"
            })}
            placeholder="Confirm Password"
          />
        }
        <button type="submit" disabled={authMutation.isPending}>
          {authMutation.isPending ? 'Submitting...' : 'Submit'}
        </button>
        {action === 'login' && (
          <button onClick={() => setForgotPassword(true)}>
            Forgot Password?
          </button>
        )}
      </form>
      <ul>
        {Object.keys(errors).map(field =>
          <li key={field}>{errors[field].message}</li>
        )}
      </ul>
    </>
  );
};
 
export default AuthForm;
