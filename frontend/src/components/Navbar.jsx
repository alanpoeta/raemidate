import { Link } from "react-router-dom";
import { useAuth } from "../helpers/AuthContext";
import { useNotification } from "../helpers/NotificationContext";

const Navbar = () => {
  const { user, logout, isAuthenticated } = useAuth();
  const { isLoading, unreadCount } = useNotification();

  return (
    <nav>
      {!isAuthenticated ? (
        <>
          <Link to='/login'>Login</Link>
          <Link to='/register'>Register</Link>
        </>
      ) : (
        <>
          <p>{user.username}</p>
          {user.hasProfile &&
            <>
              <Link to='/'>Home</Link>
              <Link to='/matches'>Matches</Link>
              {!isLoading && unreadCount !== 0 && <p>{unreadCount} Notifications</p>}
            </>
          }
          <Link to='/profile'>Profile</Link>
          <Link to='/settings'>Settings</Link>
          <a href="/login" onClick={e => {
            e.preventDefault();
            logout();
          }}>
            Logout
          </a>
        </>
      )}
      <p>Support available at: raemidate@gmail.com</p>
    </nav>
  );
}
 
export default Navbar;
