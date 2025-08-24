import { Navigate } from 'react-router-dom'
import { useState, useEffect } from 'react'
import { auth } from '../../api'
import Loading from '../Loading'

const Protected = ({ children }) => {
  const [isAuthorized, setIsAuthorized] = useState(null);

  useEffect(() => {
    auth()
    .then(res => setIsAuthorized(res));
  }, []);

  if (isAuthorized === null) {
    return <Loading />;
  }
  return isAuthorized ? children : <Navigate to='/login' />;
}
 
export default Protected;
