import { useForm } from "react-hook-form";
import { useRef } from "react";
import api from "../helpers/api";
import { desnakify, requiredErrorMessage, setServerErrors } from "../helpers/helpers";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useAuth } from "../helpers/AuthContext";
import Input from "./Input";

const ProfileForm = ({ profile, onCancel }) => {
  const queryClient = useQueryClient();
  const { setUser } = useAuth();
  const isEditing = profile ? true : false;

  const { register, handleSubmit, formState: { isSubmitting, errors }, setError } = useForm({
    defaultValues: profile ?? {}
  });
  const photosRef = useRef();

  const profileMutation = useMutation({
    mutationFn: (data) => {
      const formData = new FormData();
      
      formData.append('first_name', data.first_name);
      formData.append('last_name', data.last_name);
      formData.append('bio', data.bio);
      formData.append('gender', data.gender);
      formData.append('sexual_preference', data.sexual_preference);
      formData.append('birth_date', data.birth_date);
      formData.append('younger_age_diff', data.younger_age_diff);
      formData.append('older_age_diff', data.older_age_diff);
      
      Array.from(photosRef.current.files).forEach(file => {
        formData.append('photos', file);
      });
  
      if (isEditing)
        return api.patch('profile/', formData, {
          headers: { 'Content-Type': 'multipart/form-data' }
        });
      return api.post('profile/', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['profile']});

      if (isEditing) {
        onCancel();
        return;
      }

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
      <input
        type="date"
        {...register("birth_date", { required: requiredErrorMessage("birth_date") })}
        placeholder="Birth Date"
      />
      <select
        {...register("gender", { required: requiredErrorMessage("gender") })}
        defaultValue={profile?.gender || "gender"}
      >
        <option value="gender" disabled>Gender</option>
        {["male", "female", "other"].map(gender => 
          <option key={gender} value={gender}>{desnakify(gender)}</option>
        )}
      </select>
      <select
        {...register("sexual_preference", { required: requiredErrorMessage("sexual_preference") })}
        defaultValue={profile?.sexual_preference || "sexual_preference"}
      >
        <option value="sexual_preference" disabled>Who are you attracted to?</option>
        {["male", "female", "all"].map(orientation => 
          <option key={orientation} value={orientation}>{desnakify(orientation)}</option>
        )}
      </select>
      <input
        type="number"
        {...register("younger_age_diff", { 
          required: requiredErrorMessage("younger_age_diff"),
          valueAsNumber: true,
        })}
        placeholder="Younger Age Difference"
      />
      <input
        type="number"
        {...register("older_age_diff", { 
          required: requiredErrorMessage("older_age_diff"),
          valueAsNumber: true,
        })}
        placeholder="Older Age Difference"
      />
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
        {isSubmitting ? (isEditing ? 'Updating...' : 'Creating...') : (isEditing ? 'Update Profile' : 'Create Profile')}
      </button>
      {isEditing && <button type="button" onClick={onCancel}>Cancel</button>}
      <ul>
        {Object.keys(errors).map(field =>
          <li key={field}>{errors[field].message}</li>
        )}
      </ul>
    </form>
  );
};

export default ProfileForm;
