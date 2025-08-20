import { Link } from "react-router-dom";

const Navbar = ({navUsername}) => {
  if (navUsername) {
    return (
      <nav>
        <p>{navUsername}</p>
        <Link to='/'>Home</Link>
        <Link to='/profile'>Profile</Link>
        <Link to='/login'>Logout</Link>
      </nav>
    );
  }
  return (
    <nav>
      <Link to='/login'>Login</Link>
      <Link to='/register'>Register</Link>
    </nav>
  );
}
 
export default Navbar;
