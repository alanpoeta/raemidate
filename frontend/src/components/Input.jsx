import { desnakify, requiredErrorMessage } from "../helpers/helpers";


const Input = ({ name, register, ...props }) => {
  return (
    <input
      {...register(name, { required: requiredErrorMessage(name) })}
      placeholder={desnakify(name)}
      {...(name === "password" && {type: "password"})}
      {...props}
    />
  );
}
 
export default Input;
