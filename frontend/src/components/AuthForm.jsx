import { useEffect } from "react"
import api from '../api'
import { useNavigate } from "react-router-dom"
import { useForm } from "react-hook-form"
import { desnakify, setServerErrors } from "../helpers"
import { useAuth } from "./helpers/authContext"
import { useMutation } from "@tanstack/react-query"
import Input from "./helpers/Input"

const AuthForm = ({ action }) => {
  const navigate = useNavigate();
  const { register, handleSubmit, formState: { errors }, setError } = useForm();
  const { login, isAuthenticated, isLoading } = useAuth();

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
    onSuccess: (data, fields) => {
      if (action === 'login') {
        login(data.access, data.refresh, {
          username: fields.username
        });
      } else {
        navigate('/login');
      }
    },
    onError: error => setServerErrors(error, setError)
  });

  return (
    <>
      <h1>{desnakify(action)}</h1>
      <form onSubmit={handleSubmit(fields => authMutation.mutate(fields))}>
        {["email", "username", "password"].map(name => {
          if (name === "email" && action !== "register") return;
          return <Input name={name} register={register} key={name} />;
        })}
        <button type="submit" disabled={authMutation.isPending}>
          {authMutation.isPending ? 'Submitting...' : 'Submit'}
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
 
export default AuthForm;
