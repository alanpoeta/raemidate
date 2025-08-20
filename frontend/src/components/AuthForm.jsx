import { useEffect } from "react"
import api from '../api'
import { useNavigate } from "react-router-dom"
import { useForm } from "react-hook-form"
import { desnakify, requiredErrorMessage, setServerErrors } from "../helpers"


const AuthForm = ({action, setNavUsername}) => {
  const navigate = useNavigate();
  const { register, handleSubmit, formState: { isSubmitting, errors }, setError } = useForm();

  useEffect(() => {
    localStorage.clear();
    setNavUsername('');
  }, []);
  
  let route;
  if (action === 'login') {
    route = 'token/';
  } else if (action === 'register') {
    route = 'user/';
  } else {
    throw new Error("action not defined");
  }  

  const onSubmit = async fields => {
    let accessToken, refreshToken;
    try {
      ({ data: { access: accessToken, refresh: refreshToken }} = await api.post(route, fields));
    } catch (error) {
      setServerErrors(error, setError);
      return;
    }
    
    if (action === 'login') {
      localStorage.setItem('access', accessToken);
      localStorage.setItem('refresh', refreshToken);
      const {data: { username }} = await api.get('user/me/');
      localStorage.setItem('username', username);
      setNavUsername(username);
      navigate('/'); 
    } else {
      navigate('/login');
    }
  };

  return (
    <>
      <h1>{desnakify(action)}</h1>
      <form onSubmit={handleSubmit(onSubmit)}>
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
          {...register("password", { required: requiredErrorMessage("password") })}
          type="password"
          placeholder="Password"
        />
        <button type="submit" disabled={isSubmitting}>
          {isSubmitting ? 'Submitting...' : 'Submit'}
        </button>
      </form>
      <ul>
        {Object.keys(errors).map(field =>
          <li key={field}>{errors[field].message}</li>
        )}
      </ul>
      <button onClick={() => console.log(errors)}>Log</button>
    </>
  );
};
 
export default AuthForm;
