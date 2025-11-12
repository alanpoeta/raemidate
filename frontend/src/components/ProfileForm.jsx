import { useForm } from "react-hook-form";
import { useRef } from "react";  // Add useRef
import api from "../api";
import { desnakify, requiredErrorMessage, setServerErrors } from "../helpers";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useAuth } from "../helpers/AuthContext";
import Input from "../helpers/Input";

const ProfileForm = () => {
  const queryClient = useQueryClient();
  const { setUser } = useAuth();

  const { register, handleSubmit, formState: { isSubmitting, errors }, setError } = useForm();
  const photosRef = useRef();

  const profileMutation = useMutation({
    mutationFn: (data) => {
      const formData = new FormData();
      
      formData.append('first_name', data.first_name);
      formData.append('last_name', data.last_name);
      formData.append('bio', data.bio);
      formData.append('gender', data.gender);
      formData.append('sexual_preference', data.sexual_preference);
      
      Array.from(photosRef.current.files).forEach(file => {
        formData.append('photos', file);
      });
  
      return api.post('profile/', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['profile']});
      setUser(user => {
        const newUser = {
          ...user,
          hasProfile: true
        }
        localStorage.setItem('user', JSON.stringify(newUser));

        return newUser
      })
    },
    onError: (error) => setServerErrors(error, setError)
  });

  return (
    <form onSubmit={handleSubmit((data) => profileMutation.mutate(data))}>
      <Input name="first_name" register={register} />
      <Input name="last_name" register={register} />
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
        {["male", "female", "all"].map(orientation => 
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
        ref={photosRef}
        name="photos"
      />
      
      <button type="submit" disabled={isSubmitting}>
        {isSubmitting ? 'Creating...' : 'Create Profile'}
      </button>
      <ul>
        {Object.keys(errors).map(field =>
          <li key={field}>{errors[field].message}</li>
        )}
      </ul>
    </form>
  );
};

export default ProfileForm;
