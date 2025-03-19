
import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useToast } from "@/hooks/use-toast";
import { startParticipation } from '@/services/contestService';

type ContestDetails = {
  id: string;
  name: string;
  description: string;
  instructions: string[];
  duration: number; // in minutes
  questionCount: number;
};

const ContestDetails = () => {
  const [contestDetails, setContestDetails] = useState<ContestDetails | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [timeLeft, setTimeLeft] = useState<number>(0);
  const navigate = useNavigate();
  const { toast } = useToast();

  useEffect(() => {
    // Retrieve contest details from sessionStorage
    const storedDetails = sessionStorage.getItem('contestDetails');
    if (storedDetails) {
      try {
        const details = JSON.parse(storedDetails);
        setContestDetails(details);
        setTimeLeft(details.duration * 60); // Convert to seconds
      } catch (error) {
        toast({
          title: "Error",
          description: "Failed to load contest details.",
          variant: "destructive",
        });
        navigate('/');
      }
    } else {
      toast({
        title: "No Contest Found",
        description: "Please register again to participate.",
        variant: "destructive",
      });
      navigate('/');
    }
    setIsLoading(false);
  }, [navigate, toast]);

  const handleStartContest = async () => {
    if (!contestDetails) return;
    
    try {
      const userId = sessionStorage.getItem('userId');
      if (!userId) {
        throw new Error('User ID not found. Please register again.');
      }
      
      // Record participation start in the database
      const participationId = await startParticipation(userId, contestDetails.id);
      sessionStorage.setItem('participationId', participationId);
      
      // Save the contest start time
      const startTime = new Date().getTime();
      const endTime = startTime + (contestDetails?.duration || 0) * 60 * 1000;
      
      sessionStorage.setItem('contestStartTime', startTime.toString());
      sessionStorage.setItem('contestEndTime', endTime.toString());
      
      navigate('/coding-interface');
    } catch (error: any) {
      console.error('Failed to start contest:', error);
      toast({
        title: "Error",
        description: error.message || "Failed to start the contest. Please try again.",
        variant: "destructive",
      });
    }
  };

  const formatTime = (seconds: number) => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    
    return `${hours > 0 ? `${hours}h ` : ''}${minutes}m`;
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-white">
        <div className="animate-pulse-soft">Loading contest details...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-b from-white to-contest-lightGray p-6">
      <div className="absolute top-6 left-6 flex items-center">
        <div className="h-8 w-8 bg-contest-red rounded-lg"></div>
        <span className="ml-2 font-bold text-lg">CodeArena</span>
      </div>
      
      {contestDetails && (
        <div className="max-w-2xl w-full glass-panel p-8 animate-slide-up">
          <div className="text-center mb-8">
            <div className="inline-block px-3 py-1 mb-2 text-sm font-medium text-contest-red bg-contest-red bg-opacity-10 rounded-full">
              Contest Details
            </div>
            <h1 className="text-3xl font-bold mb-2">{contestDetails.name}</h1>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
            <div className="contest-card flex flex-col items-center justify-center p-4">
              <div className="text-4xl font-bold text-contest-red">{formatTime(timeLeft)}</div>
              <div className="text-sm text-contest-darkGray mt-1">Duration</div>
            </div>
            
            <div className="contest-card flex flex-col items-center justify-center p-4">
              <div className="text-4xl font-bold text-contest-red">{contestDetails.questionCount}</div>
              <div className="text-sm text-contest-darkGray mt-1">Questions</div>
            </div>
            
            <div className="contest-card flex flex-col items-center justify-center p-4">
              <div className="text-4xl font-bold text-contest-red">100</div>
              <div className="text-sm text-contest-darkGray mt-1">Points</div>
            </div>
          </div>
          
          <div className="mb-8">
            <h2 className="text-xl font-bold mb-3">Description</h2>
            <p className="text-contest-darkGray">{contestDetails.description}</p>
          </div>
          
          <div className="mb-8">
            <h2 className="text-xl font-bold mb-3">Instructions</h2>
            <ul className="list-disc pl-5 space-y-2">
              {contestDetails.instructions.map((instruction, index) => (
                <li key={index} className="text-contest-darkGray">{instruction}</li>
              ))}
            </ul>
          </div>
          
          <div className="text-center">
            <button
              onClick={handleStartContest}
              className="contest-button px-8 py-3 text-lg"
            >
              Start Contest
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default ContestDetails;
