import { useState } from "react";

export const Container = ({ children, title }) => (
  <div className="min-h-full flex items-center justify-center p-6 bg-white sm:bg-transparent">
    <div className="w-full max-w-sm">
      <div className="mb-8 text-center">
        <h1 className="text-3xl font-bold text-gray-900 tracking-tight">{title}</h1>
      </div>
      {children}
    </div>
  </div>
);

export const Input = ({ error, type, ...props }) => {
  const [showPassword, setShowPassword] = useState(false);
  const isPassword = type === 'password';

  return (
    <div className="mb-4">
      <div className="relative">
        <input
          type={isPassword && showPassword ? 'text' : type}
          className={`w-full px-4 py-3 rounded-xl bg-gray-50 border ${error ? 'border-red-300 focus:ring-red-200' : 'border-gray-200 focus:ring-primary/20'} focus:border-primary focus:outline-none focus:ring-4 transition-all`}
          {...props}
        />
        {isPassword && (
          <button
            type="button"
            onClick={() => setShowPassword(!showPassword)}
            className="absolute inset-y-0 right-2 flex items-center text-gray-400 hover:text-gray-600 focus:outline-none"
            tabIndex="-1"
          >
            {showPassword ? (
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5">
                <path strokeLinecap="round" strokeLinejoin="round" d="M3.98 8.223A10.477 10.477 0 0 0 1.934 12C3.226 16.338 7.244 19.5 12 19.5c.993 0 1.953-.138 2.863-.395M6.228 6.228A10.451 10.451 0 0 1 12 4.5c4.756 0 8.773 3.162 10.065 7.498a10.522 10.522 0 0 1-4.293 5.774M6.228 6.228 3 3m3.228 3.228 3.65 3.65m7.894 7.894L21 21m-3.228-3.228-3.65-3.65m0 0a3 3 0 1 0-4.243-4.243m4.242 4.242L9.88 9.88" />
              </svg>
            ) : (
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5">
                <path strokeLinecap="round" strokeLinejoin="round" d="M2.036 12.322a1.012 1.012 0 0 1 0-.639C3.423 7.51 7.36 4.5 12 4.5c4.638 0 8.573 3.007 9.963 7.178.07.207.07.431 0 .639C20.577 16.49 16.64 19.5 12 19.5c-4.638 0-8.573-3.007-9.963-7.178Z" />
                <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 1 1-6 0 3 3 0 0 1 6 0Z" />
              </svg>
            )}
          </button>
        )}
      </div>
      {error && <p className="text-red-500 text-xs mt-1 ml-1">{error.message}</p>}
    </div>
  );
};

export const Button = ({ children, disabled, type = "submit", onClick, secondary }) => (
  <button
    type={type}
    disabled={disabled}
    onClick={onClick}
    className={`w-full py-3.5 rounded-xl font-bold text-lg transition-transform active:scale-[0.98] ${
      secondary 
      ? 'bg-transparent text-gray-500 hover:text-gray-700' 
      : 'bg-primary text-white shadow-lg shadow-primary/30 hover:shadow-primary/40 disabled:opacity-70 disabled:cursor-not-allowed'
    }`}
  >
    {children}
  </button>
);
