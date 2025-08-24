import { Link } from "react-router-dom";
import { useAuth } from "./helpers/authContext";

const Navbar = () => {
  const { user } = useAuth();

  if (!user) return (
      <nav>
        <Link to='/login'>Login</Link>
        <Link to='/register'>Register</Link>
      </nav>
    );
  return (
    <nav>
      <p>{user.username}</p>
      <Link to='/'>Home</Link>
      <Link to='/profile'>Profile</Link>
      <Link to='/login'>Logout</Link>
    </nav>
  );
}
 
export default Navbar;
