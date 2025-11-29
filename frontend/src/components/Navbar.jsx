import { Link } from "react-router-dom";
import { useAuth } from "../helpers/AuthContext";
import { useNotification } from "../helpers/NotificationContext";

const Navbar = ({ navigate }) => {
  const { user, logout, isAuthenticated } = useAuth();
  const { isLoading, unreadCount } = useNotification();

  return (
    <nav>
      <img src="src/assets/logo.png" height="45px"/>
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
              <a href="#" onClick={e => { e.preventDefault(); navigate('home'); }}>Home</a>
              <a href="#" onClick={e => { e.preventDefault(); navigate('matches'); }}>Matches</a>
              {!isLoading && unreadCount !== 0 && <p>{unreadCount} Notifications</p>}
            </>
          }
          <a href="#" onClick={e => { e.preventDefault(); navigate('profile'); }}>Profile</a>
          <a href="#" onClick={e => { e.preventDefault(); navigate('settings'); }}>Settings</a>
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
