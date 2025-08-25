import { desnakify, requiredErrorMessage } from "../../helpers";


const Input = ({ name, register }) => {
  return (
    <input
      {...register(name, { required: requiredErrorMessage(name) })}
      placeholder={desnakify(name)}
      {...(name === "password" && {type: "password"})}
    />
  );
}
 
export default Input;
