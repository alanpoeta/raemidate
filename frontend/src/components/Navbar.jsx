import { Link } from "react-router-dom";
import { useAuth } from "../helpers/AuthContext";
import { useNotification } from "../helpers/NotificationContext";
import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import queriesOptions from "../helpers/queries";

const Navbar = ({ navigate }) => {
  const { user, logout, isAuthenticated } = useAuth();
  const { isLoading, unreadCount } = useNotification();
  const [menuOpen, setMenuOpen] = useState(false);

  // Fetch profile to get the photo if user has a profile
  const { data: profile } = useQuery({
    ...queriesOptions.profile,
    enabled: !!user?.hasProfile,
  });

  const photoBlob = profile?.photos?.[0]?.blob;

  const NavItem = ({ label, target, onClick }) => (
    <a 
      href="#" 
      className="block px-4 py-2 hover:bg-gray-100 text-gray-700 font-medium"
      onClick={e => { 
        e.preventDefault(); 
        setMenuOpen(false);
        if (onClick) onClick();
        if (target) navigate(target); 
      }}
    >
      {label}
    </a>
  );

  return (
    <nav className="bg-white border-b border-gray-200 h-16 flex items-center justify-between px-4 shrink-0 z-50 relative">
      <div className="flex items-center gap-2 cursor-pointer" onClick={() => navigate && navigate('home')}>
        <img src="/logo.png" className="h-8 w-auto" alt="Logo"/>
        <span className="text-xl font-bold text-primary tracking-tight">Rämidate</span>
      </div>

      {!isAuthenticated ? (
        <div className="flex gap-4 text-sm font-medium">
          <Link to='/login' className="text-gray-600 hover:text-primary">Login</Link>
          <Link to='/register' className="text-primary hover:text-primary/80">Register</Link>
        </div>
      ) : (
        <div className="flex items-center gap-4">
          {user.hasProfile && (
            <>
              <button 
                onClick={() => navigate('home')} 
                className="p-2 text-gray-400 hover:text-primary transition-colors"
                title="Discover"
              >
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-6 h-6">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M16.5 8.25V6a2.25 2.25 0 0 0-2.25-2.25H6A2.25 2.25 0 0 0 3.75 6v8.25A2.25 2.25 0 0 0 6 16.5h2.25m8.25-8.25H18a2.25 2.25 0 0 1 2.25 2.25V18A2.25 2.25 0 0 1 18 20.25h-7.5A2.25 2.25 0 0 1 8.25 18v-1.5m8.25-8.25h-6a2.25 2.25 0 0 0-2.25 2.25v6" />
                </svg>
              </button>
              
              <button 
                onClick={() => navigate('matches')} 
                className="p-2 text-gray-400 hover:text-primary transition-colors relative"
                title="Matches"
              >
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-6 h-6">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M7.5 8.25h9m-9 3H12m-9.75 1.51c0 1.6 1.123 2.994 2.707 3.227 1.129.166 2.27.293 3.423.379.35.026.67.21.865.501L12 21l2.755-4.133a1.14 1.14 0 0 1 .865-.501 48.172 48.172 0 0 0 3.423-.379c1.584-.233 2.707-1.626 2.707-3.228V6.741c0-1.602-1.123-2.995-2.707-3.228A48.394 48.394 0 0 0 12 3c-2.392 0-4.744.175-7.043.513C3.373 3.746 2.25 5.14 2.25 6.741v6.018Z" />
                </svg>
                {!isLoading && unreadCount > 0 && (
                  <span className="absolute top-1 right-1 bg-primary text-white text-[10px] font-bold h-4 w-4 rounded-full flex items-center justify-center">
                    {unreadCount}
                  </span>
                )}
              </button>
            </>
          )}

          <div className="relative">
            <button 
              onClick={() => setMenuOpen(!menuOpen)}
              className="h-8 w-8 bg-gray-200 rounded-full flex items-center justify-center text-primary font-bold overflow-hidden border border-gray-300 focus:outline-none focus:ring-2 focus:ring-primary/20"
            >
              {photoBlob ? (
                <img 
                  src={`data:image/jpeg;base64,${photoBlob}`} 
                  alt={user.username} 
                  className="w-full h-full object-cover"
                />
              ) : (
                user.username[0].toUpperCase()
              )}
            </button>

            {menuOpen && (
              <>
                <div className="fixed inset-0 z-10" onClick={() => setMenuOpen(false)}></div>
                <div className="absolute right-0 top-10 w-48 bg-white rounded-lg shadow-xl border border-gray-100 py-2 z-20">
                  <div className="px-4 py-2 border-b border-gray-100 text-xs text-gray-500 uppercase tracking-wider">
                    {user.username}
                  </div>
                  {isAuthenticated && (
                    <>
                      <NavItem label="My Profile" target="profile" />
                    </>
                  )}
                  <NavItem label="Settings" target="settings" />
                  <NavItem label="Logout" onClick={logout} />
                  <div className="border-t border-gray-100 mt-2 pt-2 px-4 text-xs text-gray-400">
                    Need help? Found a bug? <br/> raemidate@gmail.com
                  </div>
                </div>
              </>
            )}
          </div>
        </div>
      )}
    </nav>
  );
}
 
export default Navbar;
