import { Link } from "react-router-dom";
import { useAuth } from "./helpers/authContext";

const Navbar = () => {
  const { user, logout } = useAuth();

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
