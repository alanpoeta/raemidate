import { useEffect, useState } from "react";
import Loading from "./Loading";

const Form = ({name, fields, loading, handleSubmit, children}) => {
  const [fieldValues, setFieldValues] = useState({});
  const [error, setError] = useState('')

  const capitalized = s => {
    return String(s[0]).toUpperCase() + String(s).slice(1);
  };
  name = capitalized(name)

  if (loading) {
    return <Loading />
  }

  const error_bullet_points = [];
  for (let error_messages of Object.values(error)) {
    for (let error_message of error_messages) {
      error_bullet_points.push(<li>{error_message}</li>);
    }
  }
  return (
    <form autoComplete='on'
      onSubmit={async e => {
        try {
          await handleSubmit(e, fieldValues)
        } catch (error) {
          console.log(error?.response.data);
          setError(error?.response.data);
        }
      }}
    >
      <h1>{name}</h1>
      {fields.map(field => 
        <input
          key={field}
          name={field}
          type={field === 'password' ? 'password' : 'text'}
          placeholder={capitalized(field)}
          value={fieldValues[field]}
          onChange = {e => setFieldValues({
            ...fieldValues,
            [field]: e.target.value
          })}
        />
      )}
      {children}
      <button type='submit'>Submit</button>
      <ul style={{color: 'red'}}>
        {error_bullet_points}
      </ul>
    </form>
  );
}
 
export default Form;
