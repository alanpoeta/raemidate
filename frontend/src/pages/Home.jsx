import React, { useEffect, useState } from "react";
import ProfileCard from "../components/ProfileCard";
import { useQuery, useMutation } from '@tanstack/react-query';
import Loading from "../components/Loading";
import Error from "../components/Error";
import queryOptions from "../helpers/queries";
import useWebSocket from "../helpers/useWebSocket";
import api from "../helpers/api";

const Home = ({ iProfile, setIProfile }) => {
  const swipeQuery = useQuery({
    ...queryOptions.swipe,
  });
  const profiles = swipeQuery.data;
  const { socketRef, isOpen: socketIsOpen } = useWebSocket("swipe/");
  const isLoading = !socketIsOpen || swipeQuery.isFetching;

  // Animation State
  const [swipeDirection, setSwipeDirection] = useState(null); // 'left' | 'right' | null

  const swipe = async (direction) => {
    if (!socketIsOpen) return;
    const id = profiles[iProfile].user
    socketRef.current.send(JSON.stringify({ id, direction }));
    
    if (iProfile >= profiles.length - 1) {
      await swipeQuery.refetch();
      setIProfile(0);
    } else {
      setIProfile(i => i + 1);
    }
  };

  const handleSwipe = (direction) => {
    if (swipeDirection) return; // Prevent double swipe
    setSwipeDirection(direction);

    // Wait for animation to finish before updating data
    setTimeout(() => {
      swipe(direction);
      setSwipeDirection(null);
    }, 450);
  };

  const [showReport, setShowReport] = useState(false);
  const [reason, setReason] = useState("");
  const reportReasons = ["Harassment/Inappropriate behavior", "Incorrect age", "Impersonation"];
  const reportMutation = useMutation({
    mutationFn: () => api.post(`report-profile/${profiles[iProfile].user}/`, { reason }),
    onSuccess: () => {
      setShowReport(false);
      setReason("");
      alert("Report submitted.");
    },
  });

  useEffect(() => {
    const onKey = (e) => {
      if (
        e.repeat
        || (e.target && (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA' || e.target.isContentEditable))
        || !profiles?.length
      ) return;
      if (e.key === 'ArrowLeft') {
        e.preventDefault();
        handleSwipe('left');
      } else if (e.key === 'ArrowRight') {
        e.preventDefault();
        handleSwipe('right');
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [profiles, iProfile]); // Removed swipe dependency, using handleSwipe logic
  
  if (swipeQuery.isError) return <Error />;
  if (isLoading) return <Loading />;
  
  if (!profiles?.length) return (
    <div className="absolute inset-0 flex flex-col items-center justify-center p-8 text-center text-gray-500">
      <div className="w-20 h-20 bg-gray-100 rounded-full flex items-center justify-center mb-4 animate-pulse">
        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-10 h-10">
          <path strokeLinecap="round" strokeLinejoin="round" d="m21 21-5.197-5.197m0 0A7.5 7.5 0 1 0 5.196 5.196a7.5 7.5 0 0 0 10.607 10.607Z" />
        </svg>
      </div>
      <p className="text-lg font-medium">No profiles left to show.</p>
      <p className="text-sm">Check back later for new people!</p>
    </div>
  );

  if (showReport)
    return (
      <div className="absolute inset-0 bg-white z-50 flex flex-col p-6 animate-fade-in">
        <h4 className="text-xl font-bold mb-2 text-gray-800">Report Profile</h4>
        <p className="text-gray-600 mb-6 text-sm">Select a reason. This profile will be reviewed by staff.</p>
        
        <div className="flex-1">
          {reportReasons.map(r => (
            <label key={r} className="flex items-center gap-3 p-3 border-b border-gray-100 cursor-pointer hover:bg-gray-50">
              <input 
                type="radio" 
                name="reportReason" 
                value={r} 
                checked={reason === r}
                onChange={e => setReason(e.target.value)}
                className="text-primary focus:ring-primary"
              />
              <span className="text-gray-700">{r}</span>
            </label>
          ))}
        </div>

        <div className="mt-auto flex gap-3">
          <button
            onClick={() => {
              setShowReport(false);
              setReason("");
            }}
            className="flex-1 py-3 px-4 rounded-lg bg-gray-100 text-gray-700 font-semibold"
          >
            Cancel
          </button>
          <button
            disabled={!reason || reportMutation.isPending}
            onClick={() => reportMutation.mutate()}
            className="flex-1 py-3 px-4 rounded-lg bg-red-500 text-white font-semibold disabled:opacity-50"
          >
            {reportMutation.isPending ? 'Reporting...' : 'Confirm Report'}
          </button>
        </div>
      </div>
    );
  
  return (
    <div className="relative w-full h-full flex flex-col overflow-hidden bg-gray-100">
      <div className="flex-1 relative w-full h-full">
         {/* Animated Container */}
         <div 
           className={`w-full h-full absolute inset-0 transition-transform duration-1000 ease-in-out origin-bottom 
             ${swipeDirection === 'left' ? '-translate-x-[150%] -rotate-12' : ''} 
             ${swipeDirection === 'right' ? 'translate-x-[150%] rotate-12' : ''}
             ${!swipeDirection ? 'translate-x-0 rotate-0' : ''}
           `}
         >
           <ProfileCard profile={profiles[iProfile]} />
           
           {/* Stamps */}
           {swipeDirection === 'right' && (
             <div className="absolute top-10 left-10 border-[6px] border-green-500 text-green-500 font-black text-4xl px-4 py-2 rounded-lg -rotate-12 opacity-80 z-20 pointer-events-none">
               LIKE
             </div>
           )}
           {swipeDirection === 'left' && (
             <div className="absolute top-10 right-10 border-[6px] border-red-500 text-red-500 font-black text-4xl px-4 py-2 rounded-lg rotate-12 opacity-80 z-20 pointer-events-none">
               NOPE
             </div>
           )}
         </div>
      </div>

      {/* Floating Action Buttons */}
      <div className="absolute bottom-6 left-0 right-0 flex justify-center items-center gap-6 z-30 pointer-events-none">
        <button 
          onClick={() => handleSwipe("left")}
          className="pointer-events-auto w-14 h-14 bg-white rounded-full shadow-xl flex items-center justify-center text-red-500 hover:scale-110 hover:bg-red-50 transition-all border border-gray-100"
          title="Pass"
        >
          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor" className="w-6 h-6">
            <path strokeLinecap="round" strokeLinejoin="round" d="M6 18 18 6M6 6l12 12" />
          </svg>
        </button>

        <button 
          onClick={() => setShowReport(true)}
          className="pointer-events-auto w-10 h-10 bg-white rounded-full flex items-center justify-center text-gray-400 hover:bg-gray-50 transition-all shadow-md"
          title="Report"
        >
          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5">
            <path strokeLinecap="round" strokeLinejoin="round" d="M3 3v1.5M3 21v-6m0 0 2.77-.693a9 9 0 0 1 6.208.682l.108.054a9 9 0 0 0 6.086.71l3.114-.732a48.524 48.524 0 0 1-.005-10.499l-3.11.732a9 9 0 0 1-6.085-.711l-.108-.054a9 9 0 0 0-6.208-.682L3 4.5M3 15V4.5" />
          </svg>
        </button>

        <button 
          onClick={() => handleSwipe("right")}
          className="pointer-events-auto w-14 h-14 bg-white rounded-full shadow-xl flex items-center justify-center text-green-500 hover:scale-110 hover:bg-green-50 transition-all border border-gray-100"
          title="Like"
        >
          <svg xmlns="http://www.w3.org/2000/svg" fill="currentColor" viewBox="0 0 24 24" strokeWidth={0} stroke="currentColor" className="w-6 h-6">
            <path d="m11.645 20.91-.007-.003-.022-.012a15.247 15.247 0 0 1-.383-.218 25.18 25.18 0 0 1-4.244-3.17C4.688 15.36 2.25 12.174 2.25 8.25 2.25 5.322 4.714 3 7.688 3A5.5 5.5 0 0 1 12 5.052 5.5 5.5 0 0 1 16.313 3c2.973 0 5.437 2.322 5.437 5.25 0 3.925-2.438 7.111-4.739 9.256a25.175 25.175 0 0 1-4.244 3.17 15.247 15.247 0 0 1-.383.219l-.022.012-.007.004-.003.001a.752.752 0 0 1-.704 0l-.003-.001Z" />
          </svg>
        </button>
      </div>
    </div>
  );
}
 
export default Home;
