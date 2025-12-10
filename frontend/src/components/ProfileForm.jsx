import React, { useEffect, useState, useRef } from 'react';
import { useForm } from "react-hook-form";
import api from "../helpers/api";
import { desnakify, requiredErrorMessage, setServerErrors } from "../helpers/helpers";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useAuth } from "../helpers/AuthContext";
import RangeSlider from 'react-range-slider-input';

// Defined outside to prevent re-renders losing focus
const Section = ({ title, children }) => (
  <div className="mb-8">
    <h3 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-3">{title}</h3>
    <div className="space-y-4">{children}</div>
  </div>
);

const InputStyles = "w-full px-4 py-3 rounded-lg bg-gray-50 border border-gray-200 focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/10 transition-all text-sm";
const LabelStyles = "block text-sm font-medium text-gray-700 mb-1";

const ProfileForm = ({ profile, onCancel }) => {
  const queryClient = useQueryClient();
  const { setUser, user } = useAuth();
  const isEditing = profile ? true : false;

  const emailParts = user.email.split('@')[0].split('.');
  const emailFirstName = desnakify(emailParts?.[0]);
  const emailLastName = desnakify(emailParts?.[1]);

  const { register, handleSubmit, formState: { errors }, setError, watch } = useForm({
    defaultValues: profile ?? {}
  });
  const photosRef = useRef();
  
  // Watch birth_date to calculate current age for display
  const birthDate = watch("birth_date");
  const [userAge, setUserAge] = useState(null);

  // Age Difference State [younger_diff, older_diff]
  // Default to -3 to +3 if not provided
  const [ageDiffs, setAgeDiffs] = useState([
    profile?.younger_age_diff ?? -3, 
    profile?.older_age_diff ?? 3
  ]);

  // Helper to calculate age from birthdate
  useEffect(() => {
    if (birthDate) {
      const today = new Date();
      const dob = new Date(birthDate);
      let age = today.getFullYear() - dob.getFullYear();
      const m = today.getMonth() - dob.getMonth();
      if (m < 0 || (m === 0 && today.getDate() < dob.getDate())) {
        age--;
      }
      setUserAge(age);
      setAgeDiffs(ageDiffs => [Math.max(Math.min(-3, 16 - age), ageDiffs[0]), Math.min(age >= 16 ? age : 3, ageDiffs[1])])
    } else {
      setUserAge(null);
    }
  }, [birthDate]);

  const profileMutation = useMutation({
    mutationFn: (data) => {
      const formData = new FormData();
      
      formData.append('bio', data.bio);
      formData.append('gender', data.gender);
      formData.append('sexual_preference', data.sexual_preference);
      formData.append('birth_date', data.birth_date); 
      
      // Append age preferences from local state
      formData.append('younger_age_diff', ageDiffs[0]);
      formData.append('older_age_diff', ageDiffs[1]);
      
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

      setUser(user => ({
        ...user,
        hasProfile: true
      }))
    },
    onError: (error) => setServerErrors(error, setError)
  });

  return (
    <form 
      onSubmit={handleSubmit((data) => profileMutation.mutate(data))}
      className="min-h-full flex flex-col"
    >
      {/* Slider CSS Injection */}
      <style>{`
        .range-slider {
          height: 6px;
          background: #e5e7eb;
          border-radius: 9999px;
          position: relative;
          user-select: none;
          touch-action: none;
        }
        .range-slider .range-slider__range {
          background: #e11d48;
          border-radius: 9999px;
          position: absolute;
          top: 0;
          bottom: 0;
          z-index: 2;
        }
        .range-slider .range-slider__thumb {
          width: 24px;
          height: 24px;
          background: #fff;
          border: 2px solid #e11d48;
          border-radius: 50%;
          box-shadow: 0 1px 3px rgba(0,0,0,0.1);
          position: absolute;
          top: 50%;
          transform: translate(-50%, -50%);
          z-index: 3;
          cursor: grab;
        }
        .range-slider .range-slider__thumb:active {
          cursor: grabbing;
        }
        .range-slider .range-slider__thumb:focus {
          outline: none;
          box-shadow: 0 0 0 3px rgba(225, 29, 72, 0.2);
        }
      `}</style>

      <div className="p-6 flex-1">
        <div className="mb-6">
          <h2 className="text-2xl font-bold text-gray-800">{isEditing ? 'Edit Profile' : 'Create Profile'}</h2>
          <p className="text-gray-500 text-sm">Tell us about yourself to find matches.</p>
        </div>

        <Section title="Basic Info">
          <div className="grid grid-cols-2 gap-3">
            <input
              type="text"
              value={profile?.first_name || emailFirstName}
              disabled
              placeholder="First Name"
              className={`${InputStyles} bg-gray-100 cursor-not-allowed text-gray-500`}
            />
            <input
              type="text"
              value={profile?.last_name || emailLastName}
              disabled
              placeholder="Last Name"
              className={`${InputStyles} bg-gray-100 cursor-not-allowed text-gray-500`}
            />
          </div>
          
          <div>
            <label className={LabelStyles}>Birth Date</label>
            <input
              type="date"
              className={InputStyles}
              {...register("birth_date", { required: requiredErrorMessage("birth_date") })}
            />
            {errors.birth_date && <p className="text-red-500 text-xs mt-1">{errors.birth_date.message}</p>}
            {userAge !== null && (
              <p className="text-xs text-gray-400 mt-1 text-right">Age: {userAge}</p>
            )}
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className={LabelStyles}>I am</label>
              <select
                className={InputStyles}
                {...register("gender", { required: requiredErrorMessage("gender") })}
                defaultValue={profile?.gender || ""}
              >
                <option value="" disabled>Select</option>
                {["male", "female", "other"].map(gender => 
                  <option key={gender} value={gender}>{desnakify(gender)}</option>
                )}
              </select>
              {errors.gender && <p className="text-red-500 text-xs mt-1">{errors.gender.message}</p>}
            </div>
            <div>
              <label className={LabelStyles}>Interested in</label>
              <select
                className={InputStyles}
                {...register("sexual_preference", { required: requiredErrorMessage("sexual_preference") })}
                defaultValue={profile?.sexual_preference || ""}
              >
                <option value="" disabled>Select</option>
                {["male", "female", "all"].map(orientation => 
                  <option key={orientation} value={orientation}>{desnakify(orientation)}</option>
                )}
              </select>
               {errors.sexual_preference && <p className="text-red-500 text-xs mt-1">{errors.sexual_preference.message}</p>}
            </div>
          </div>
        </Section>

        <Section title="Age Preference">
          <div className="bg-gray-50 p-4 rounded-xl border border-gray-100">
             <div className="flex justify-between items-center text-sm font-semibold text-gray-700 mb-6 px-1">
                <span>{ageDiffs[0] > 0 ? `+${ageDiffs[0]}` : ageDiffs[0]} years</span>
                <span className="text-xs font-normal text-gray-400 uppercase">Difference</span>
                <span>{ageDiffs[1] > 0 ? `+${ageDiffs[1]}` : ageDiffs[1]} years</span>
             </div>
             
             <div className="px-2 pb-2">
               <RangeSlider
                  min={Math.min(-3, 16 - userAge)}
                  max={userAge >= 16 ? userAge : 3}
                  step={1}
                  value={ageDiffs}
                  onInput={setAgeDiffs}
               />
             </div>
             
             <p className="text-[10px] text-gray-400 mt-4 text-center leading-tight">
               Set the age range of people you want to see relative to your own age.<br/>
               (e.g., -5 means 5 years younger, +5 means 5 years older)
             </p>
          </div>
        </Section>

        <Section title="About Me">
          <textarea
            className={`${InputStyles} min-h-[100px] resize-none`}
            {...register("bio", { required: requiredErrorMessage("bio") })}
            placeholder="Write something about yourself..."
          />
          {errors.bio && <p className="text-red-500 text-xs mt-1">{errors.bio.message}</p>}
        </Section>
        
        <Section title="Photos">
          <div className="border-2 border-dashed border-gray-300 rounded-xl p-6 text-center hover:bg-gray-50 transition-colors">
            <input
              type="file"
              accept="image/*"
              multiple
              ref={photosRef}
              name="photos"
              className="w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-primary/10 file:text-primary hover:file:bg-primary/20"
            />
          </div>
        </Section>

        {errors.root && (
          <div className="mb-4 p-3 bg-red-50 text-red-600 text-sm rounded-lg">
            {errors.root.message}
          </div>
        )}
      </div>
      
      {/* Sticky footer for buttons */}
      <div className="sticky bottom-0 left-0 right-0 p-4 bg-white border-t border-gray-100 flex gap-3 z-40 shadow-[0_-4px_6px_-1px_rgba(0,0,0,0.05)]">
         {isEditing && (
          <button 
            type="button" 
            onClick={onCancel}
            className="flex-1 py-3 px-4 rounded-xl font-bold text-gray-600 bg-gray-100 hover:bg-gray-200"
          >
            Cancel
          </button>
        )}
        <button 
          type="submit" 
          disabled={profileMutation.isPending}
          className="flex-1 py-3 px-4 rounded-xl font-bold text-white bg-primary hover:bg-primary/90 shadow-lg shadow-primary/30 disabled:opacity-70"
        >
          {profileMutation.isPending ? 'Saving...' : (isEditing ? 'Save Changes' : 'Complete Profile')}
        </button>
      </div>
    </form>
  );
};

export default ProfileForm;
