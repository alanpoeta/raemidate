import { Link } from "react-router-dom";
import { useAuth } from "../helpers/AuthContext";
import { useNotification } from "../helpers/NotificationContext";

const Navbar = () => {
  const { user, logout } = useAuth();
  const { isLoading, unreadCount } = useNotification();

  if (!user?.username) return (
      <nav>
        <Link to='/login'>Login</Link>
        <Link to='/register'>Register</Link>
      </nav>
    );
  return (
    <nav>
      <p>{user.username}</p>
      {user.hasProfile &&
        <>
          <Link to='/'>Home</Link>
          <Link to='/match'>Matches</Link>
          {!isLoading && unreadCount !== 0 && <p>{unreadCount} Notifications</p>}
          <Link to='/profile'>Profile</Link>
        </>
      }
      <a href="/login" onClick={e => {
        e.preventDefault();
        logout();
      }}>
        Logout
      </a>
    </nav>
  );
}
 
export default Navbar;
