
import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useToast } from "@/hooks/use-toast";
import CodeEditor from '@/components/CodeEditor';
import { fetchContestQuestions, saveSubmission } from '@/services/contestService';

type Question = {
  id: string;
  title: string;
  description: string;
  examples: {
    input: string;
    output: string;
    explanation?: string;
  }[];
  constraints: string[];
  testcases: {
    input: string;
    expected_output: string;
  }[];
  defaultCode: Record<string, string>;
};

const CodingInterface = () => {
  const [timeLeft, setTimeLeft] = useState<number>(0);
  const [questions, setQuestions] = useState<Question[]>([]);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const navigate = useNavigate();
  const { toast } = useToast();

  useEffect(() => {
    const loadContestData = async () => {
      try {
        // Check if contest is started
        const contestEndTime = sessionStorage.getItem('contestEndTime');
        if (!contestEndTime) {
          toast({
            title: "Contest not started",
            description: "Please start the contest properly",
            variant: "destructive",
          });
          navigate('/contest-details');
          return;
        }
        
        // Retrieve contest details
        const contestDetails = JSON.parse(sessionStorage.getItem('contestDetails') || '{}');
        if (!contestDetails || !contestDetails.id) {
          throw new Error('Contest details not found');
        }
        
        // Fetch questions for this contest
        const fetchedQuestions = await fetchContestQuestions(contestDetails.id);
        if (fetchedQuestions && fetchedQuestions.length > 0) {
          setQuestions(fetchedQuestions);
        } else {
          throw new Error('No questions found for this contest');
        }
        
        // Start the timer
        const endTimeMs = parseInt(contestEndTime);
        const updateTimer = () => {
          const now = new Date().getTime();
          const diff = Math.max(0, endTimeMs - now);
          const secondsLeft = Math.floor(diff / 1000);
          
          setTimeLeft(secondsLeft);
          
          if (secondsLeft <= 0) {
            // Contest ended
            clearInterval(timerInterval);
            toast({
              title: "Time's up!",
              description: "The contest has ended",
              variant: "destructive",
            });
            navigate('/');
          }
        };
        
        updateTimer();
        const timerInterval = setInterval(updateTimer, 1000);
        setIsLoading(false);
        
        return () => clearInterval(timerInterval);
      } catch (error: any) {
        console.error('Error loading contest data:', error);
        toast({
          title: "Error",
          description: error.message || "Failed to load contest data",
          variant: "destructive",
        });
        navigate('/');
      }
    };
    
    loadContestData();
  }, [navigate, toast]);

  const formatTime = (seconds: number) => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    
    return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const handleSaveSubmission = async (questionId: string, code: string, language: string, status: string, executionTime?: number, memoryUsed?: number) => {
    try {
      const userId = sessionStorage.getItem('userId');
      const contestDetails = JSON.parse(sessionStorage.getItem('contestDetails') || '{}');
      
      if (!userId || !contestDetails.id) {
        throw new Error('User or contest information missing');
      }
      
      await saveSubmission({
        userId,
        contestId: contestDetails.id,
        questionId,
        code,
        language,
        status,
        executionTime,
        memoryUsed
      });
      
      toast({
        title: "Submission saved",
        description: "Your code has been submitted successfully",
      });
    } catch (error: any) {
      console.error('Error saving submission:', error);
      toast({
        title: "Error",
        description: error.message || "Failed to save your submission",
        variant: "destructive",
      });
    }
  };

  const handleQuestionChange = (index: number) => {
    if (index >= 0 && index < questions.length) {
      setCurrentQuestionIndex(index);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-white">
        <div className="animate-pulse-soft">Preparing coding environment...</div>
      </div>
    );
  }

  const currentQuestion = questions.length > 0 ? questions[currentQuestionIndex] : null;

  return (
    <div className="min-h-screen flex flex-col bg-white">
      <header className="bg-white border-b border-contest-lightGray px-6 py-3 flex justify-between items-center shadow-sm z-10">
        <div className="flex items-center">
          <div className="h-8 w-8 bg-contest-red rounded-lg"></div>
          <span className="ml-2 font-bold text-lg">CodeArena</span>
        </div>
        
        <div className="flex items-center space-x-4">
          {questions.length > 0 && (
            <div className="flex space-x-2">
              {questions.map((_, index) => (
                <button
                  key={index}
                  onClick={() => handleQuestionChange(index)}
                  className={`px-3 py-1 rounded ${
                    index === currentQuestionIndex 
                      ? 'bg-contest-red text-white' 
                      : 'bg-gray-100 hover:bg-gray-200'
                  }`}
                >
                  {index + 1}
                </button>
              ))}
            </div>
          )}
          
          <div className="text-contest-red font-mono font-bold text-xl">
            {formatTime(timeLeft)}
          </div>
        </div>
      </header>
      
      <div className="flex-grow grid grid-cols-1 lg:grid-cols-2 overflow-hidden">
        {/* Question Panel */}
        <div className="border-r border-contest-lightGray overflow-y-auto p-6">
          {currentQuestion && (
            <div className="max-w-3xl mx-auto">
              <h1 className="text-2xl font-bold mb-4">{currentQuestion.title}</h1>
              
              <div className="mb-6">
                <p className="whitespace-pre-line">{currentQuestion.description}</p>
              </div>
              
              <div className="mb-6">
                <h2 className="text-lg font-bold mb-2">Examples:</h2>
                {currentQuestion.examples.map((example, idx) => (
                  <div key={idx} className="mb-4 p-4 bg-gray-50 rounded-lg">
                    <div className="mb-2">
                      <div className="font-medium">Input:</div>
                      <div className="font-mono bg-white p-2 border border-contest-lightGray rounded mt-1">{example.input}</div>
                    </div>
                    <div className="mb-2">
                      <div className="font-medium">Output:</div>
                      <div className="font-mono bg-white p-2 border border-contest-lightGray rounded mt-1">{example.output}</div>
                    </div>
                    {example.explanation && (
                      <div>
                        <div className="font-medium">Explanation:</div>
                        <div className="mt-1">{example.explanation}</div>
                      </div>
                    )}
                  </div>
                ))}
              </div>
              
              <div className="mb-6">
                <h2 className="text-lg font-bold mb-2">Constraints:</h2>
                <ul className="list-disc pl-5 space-y-1">
                  {currentQuestion.constraints.map((constraint, idx) => (
                    <li key={idx} className="font-mono text-sm">{constraint}</li>
                  ))}
                </ul>
              </div>
            </div>
          )}
        </div>
        
        {/* Code Editor Panel */}
        <div className="p-4 overflow-hidden">
          {currentQuestion && (
            <CodeEditor 
              question={currentQuestion} 
              onSubmit={handleSaveSubmission}
            />
          )}
        </div>
      </div>
    </div>
  );
};

export default CodingInterface;
