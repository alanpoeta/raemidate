import { useForm } from "react-hook-form";
import { useRef } from "react";  // Add useRef
import api from "../api";
import { desnakify, requiredErrorMessage, setServerErrors } from "../helpers";

const ProfileForm = ({ fetchProfile }) => {
  const { register, handleSubmit, formState: { isSubmitting, errors }, setError } = useForm();
  const fileInputRef = useRef();  // Create ref for file input

  const onSubmit = async (data) => {
    const formData = new FormData();
    
    // Append text fields
    formData.append('first_name', data.first_name);
    formData.append('last_name', data.last_name);
    formData.append('bio', data.bio);
    formData.append('gender', data.gender);
    formData.append('sexual_preference', data.sexual_preference);
    
    
    // Append FILES using the ref
    Array.from(fileInputRef.current.files).forEach(file => {
      formData.append('photos', file);  // Key must be 'photos'
    });

    try {
      await api.post('profile/', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      fetchProfile();
    } catch (error) {
      setServerErrors(error, setError);
    }
  };

  return (
    <>
      <form onSubmit={handleSubmit(onSubmit)}>
        <input
          {...register("first_name", { required: requiredErrorMessage("first_name") })}
          placeholder="First name"
              />
        <input
          {...register("last_name", { required: requiredErrorMessage("last_name") })}
          placeholder="Last name"
        />
        <select
          {...register("gender", { required: requiredErrorMessage("gender") })}
          defaultValue="gender"
        >
          <option value="gender" disabled>Gender</option>
          {["male", "female", "other"].map(gender => 
            <option key={gender} value={gender}>{desnakify(gender)}</option>
          )}
        </select>
        <select
          {...register("sexual_preference", { required: requiredErrorMessage("sexual_preference") })}
          defaultValue="sexual_preference"
        >
          <option value="sexual_preference" disabled>Who are you attracted to?</option>
          {["male", "female", "both", "all"].map(orientation => 
            <option key={orientation} value={orientation}>{desnakify(orientation)}</option>
          )}
        </select>
        <textarea
          {...register("bio", { required: requiredErrorMessage("bio") })}
          placeholder="Bio"
        />
        
        <input
          type="file"
          multiple
          ref={fileInputRef}
          name="photos"
        />
        
        <button type="submit" disabled={isSubmitting}>
          {isSubmitting ? 'Creating...' : 'Create Profile'}
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

export default ProfileForm;
