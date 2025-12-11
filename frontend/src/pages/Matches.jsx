import { useQuery } from "@tanstack/react-query";
import Loading from "../components/Loading";
import Error from "../components/Error";
import queriesOptions from "../helpers/queries";
import React from "react";

const Matches = ({ navigate }) => {
  const { data: matches, isLoading, isError } = useQuery(queriesOptions.matches);

  if (isLoading) return <Loading />;
  if (isError) return <Error />;
  
  if (!matches || matches.length === 0) return (
    <div className="absolute inset-0 flex flex-col items-center justify-center p-8 text-center text-gray-500">
      <div className="w-20 h-20 bg-gray-100 rounded-full flex items-center justify-center mb-4">
        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-10 h-10">
          <path strokeLinecap="round" strokeLinejoin="round" d="M21 8.25c0-2.485-2.099-4.5-4.688-4.5-1.935 0-3.597 1.126-4.312 2.733-.715-1.607-2.377-2.733-4.313-2.733C5.1 3.75 3 5.765 3 8.25c0 7.22 9 12 9 12s9-4.78 9-12Z" />
        </svg>
      </div>
      <p>No matches yet. Keep swiping!</p>
    </div>
  );

  return (
    <div className="p-4 space-y-2">
      <h2 className="text-lg font-bold text-gray-800 mb-4 px-2">Your Matches</h2>
      {matches.map(({profile, unread_count}) => (
        <div 
          key={profile.user}
          onClick={e => { e.preventDefault(); navigate('message', { recipientId: profile.user }); }}
          className="flex items-center gap-4 p-3 bg-white rounded-xl shadow-sm border border-gray-100 active:scale-[0.99] transition-transform cursor-pointer"
        >
          <div className="relative">
             <img
              src={`data:image/jpeg;base64,${profile.photos[0].blob}`}
              alt="Profile"
              className="w-14 h-14 rounded-full object-cover border border-gray-100"
            />
            {unread_count > 0 && (
              <span className="absolute -top-1 -right-1 bg-primary text-white text-xs font-bold h-5 w-5 rounded-full flex items-center justify-center ring-2 ring-white">
                {unread_count}
              </span>
            )}
          </div>
          
          <div className="flex-1 min-w-0">
            <h3 className="font-semibold text-gray-900 truncate">
              {profile.first_name} {profile.last_name}
            </h3>
            <p className="text-sm text-gray-500 truncate">
               {unread_count > 0 ? <span className="text-primary font-medium">Notification</span> : "Tap to chat"}
            </p>
          </div>

          <div className="text-gray-300">
             <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-5 h-5">
              <path strokeLinecap="round" strokeLinejoin="round" d="m8.25 4.5 7.5 7.5-7.5 7.5" />
            </svg>
          </div>
        </div>
      ))}
    </div>
  );
}
 
export default Matches;
