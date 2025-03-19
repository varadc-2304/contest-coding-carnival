
import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useToast } from "@/hooks/use-toast";
import CodeEditor from '@/components/CodeEditor';
import { fetchContestQuestions, saveSubmission } from '@/services/contestService';
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { Clock, CheckCircle, AlertCircle, ChevronLeft, ChevronRight, LogOut } from 'lucide-react';

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
            handleEndContest();
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

  const handleEndContest = async () => {
    try {
      const userId = sessionStorage.getItem('userId');
      const participationId = sessionStorage.getItem('participationId');
      const contestDetails = JSON.parse(sessionStorage.getItem('contestDetails') || '{}');
      
      if (userId && participationId) {
        // Update participation record to mark it as ended
        await supabase
          .from('participations')
          .update({
            end_time: new Date().toISOString(),
            is_active: false
          })
          .eq('id', participationId);
          
        toast({
          title: "Contest Ended",
          description: "Your contest participation has been recorded. Thank you for participating!",
        });
      }
      
      // Clear session data
      sessionStorage.removeItem('contestEndTime');
      sessionStorage.removeItem('contestStartTime');
      sessionStorage.removeItem('participationId');
      
      // Navigate to home page
      navigate('/');
    } catch (error: any) {
      console.error('Error ending contest:', error);
      toast({
        title: "Error",
        description: error.message || "Failed to end the contest",
        variant: "destructive",
      });
    }
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

  const handleNextQuestion = () => {
    if (currentQuestionIndex < questions.length - 1) {
      setCurrentQuestionIndex(currentQuestionIndex + 1);
    }
  };

  const handlePrevQuestion = () => {
    if (currentQuestionIndex > 0) {
      setCurrentQuestionIndex(currentQuestionIndex - 1);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="flex flex-col items-center">
          <div className="animate-spin mb-4">
            <Clock className="h-12 w-12 text-primary" />
          </div>
          <div className="text-lg font-medium">Preparing coding environment...</div>
        </div>
      </div>
    );
  }

  const currentQuestion = questions.length > 0 ? questions[currentQuestionIndex] : null;

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <header className="bg-card border-b border-border px-6 py-3 flex justify-between items-center shadow-sm z-10">
        <div className="flex items-center gap-2">
          <div className="h-8 w-8 bg-primary rounded-md flex items-center justify-center text-white font-bold">CA</div>
          <span className="font-bold text-lg">CodeArena</span>
        </div>
        
        <div className="flex items-center space-x-4">
          <div className="flex items-center gap-1 bg-card/80 px-3 py-1.5 rounded-full border border-border shadow-sm">
            <Clock className="h-4 w-4 text-primary" />
            <span className="font-mono font-bold text-lg">{formatTime(timeLeft)}</span>
          </div>
          
          <Button 
            onClick={handleEndContest}
            variant="outline" 
            size="sm"
            className="border-destructive text-destructive hover:bg-destructive/10"
          >
            <LogOut className="h-4 w-4 mr-2" />
            End Contest
          </Button>
        </div>
      </header>
      
      <div className="flex-grow grid grid-cols-1 lg:grid-cols-2 overflow-hidden">
        {/* Question Panel */}
        <div className="border-r border-border overflow-y-auto p-6">
          {currentQuestion && (
            <div className="max-w-3xl mx-auto space-y-6">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="bg-primary/10 text-primary font-medium px-2.5 py-1 rounded-md">
                    Question {currentQuestionIndex + 1}/{questions.length}
                  </div>
                </div>
                
                <div className="flex gap-2">
                  <Button 
                    variant="outline" 
                    size="sm" 
                    onClick={handlePrevQuestion}
                    disabled={currentQuestionIndex === 0}
                  >
                    <ChevronLeft className="h-4 w-4" />
                  </Button>
                  
                  <Button 
                    variant="outline" 
                    size="sm" 
                    onClick={handleNextQuestion}
                    disabled={currentQuestionIndex === questions.length - 1}
                  >
                    <ChevronRight className="h-4 w-4" />
                  </Button>
                </div>
              </div>
              
              <h1 className="text-2xl font-bold">{currentQuestion.title}</h1>
              
              <div>
                <p className="whitespace-pre-line">{currentQuestion.description}</p>
              </div>
              
              <div>
                <h2 className="text-lg font-semibold mb-3">Examples:</h2>
                {currentQuestion.examples.map((example, idx) => (
                  <div key={idx} className="mb-4 rounded-lg overflow-hidden border border-border bg-card/50">
                    <div className="border-b border-border px-4 py-2 bg-muted/30 font-medium">
                      Example {idx + 1}
                    </div>
                    <div className="p-4 space-y-3">
                      <div>
                        <div className="font-medium text-sm text-muted-foreground mb-1">Input:</div>
                        <div className="font-mono bg-muted/20 p-2 rounded border border-border text-sm">
                          {example.input}
                        </div>
                      </div>
                      <div>
                        <div className="font-medium text-sm text-muted-foreground mb-1">Output:</div>
                        <div className="font-mono bg-muted/20 p-2 rounded border border-border text-sm">
                          {example.output}
                        </div>
                      </div>
                      {example.explanation && (
                        <div>
                          <div className="font-medium text-sm text-muted-foreground mb-1">Explanation:</div>
                          <div className="text-sm">{example.explanation}</div>
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
              
              <div>
                <h2 className="text-lg font-semibold mb-3">Constraints:</h2>
                <ul className="space-y-1 list-disc pl-5">
                  {currentQuestion.constraints.map((constraint, idx) => (
                    <li key={idx} className="font-mono text-sm">{constraint}</li>
                  ))}
                </ul>
              </div>
            </div>
          )}
        </div>
        
        {/* Code Editor Panel */}
        <div className="p-4">
          {currentQuestion && (
            <CodeEditor 
              question={currentQuestion} 
              onSubmit={handleSaveSubmission}
            />
          )}
        </div>
      </div>
      
      {/* Navigation Tabs for mobile */}
      <div className="lg:hidden flex border-t border-border">
        <button 
          className={`flex-1 py-3 flex justify-center items-center gap-2 ${currentQuestionIndex === 0 ? 'bg-primary/10 text-primary font-medium' : ''}`}
          onClick={() => setCurrentQuestionIndex(0)}
        >
          Problem
        </button>
        <button 
          className={`flex-1 py-3 flex justify-center items-center gap-2 ${currentQuestionIndex === 1 ? 'bg-primary/10 text-primary font-medium' : ''}`}
          onClick={() => setCurrentQuestionIndex(1)}
        >
          Code
        </button>
      </div>
    </div>
  );
};

export default CodingInterface;
