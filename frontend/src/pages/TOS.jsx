import { useState } from 'react';
import { useMutation } from '@tanstack/react-query';
import api from '../helpers/api';
import { useAuth } from '../helpers/AuthContext';

const TOS = () => {
  const [isChecked, setIsChecked] = useState(false);
  const { prefetchQueries } = useAuth();

  const acceptMutation = useMutation({
    mutationFn: () => api.post('accept-tos/'),
    onSuccess: prefetchQueries
  });

  return (
    <>
      <input 
        type="checkbox" 
        name="accept" 
        checked={isChecked}
        onChange={e => setIsChecked(e.target.checked)}
        required 
      />
      <span>I accept the Terms of Service</span><br />
      <button 
        onClick={() => acceptMutation.mutate()} 
        disabled={!isChecked || acceptMutation.isPending}
      >
        {acceptMutation.isPending ? 'Accepting...' : 'Accept TOS'}
      </button>
    </>
  );
}
 
export default TOS;
