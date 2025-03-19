import { useState, useEffect, useRef } from 'react';
import { useToast } from "@/hooks/use-toast";
import { executeCode } from '@/services/codeExecutionService';

type CodeEditorProps = {
  question: {
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
  onSubmit?: (questionId: string, code: string, language: string, status: string, executionTime?: number, memoryUsed?: number) => void;
};

const CodeEditor = ({ question, onSubmit }: CodeEditorProps) => {
  const [language, setLanguage] = useState<string>('cpp');
  const [code, setCode] = useState<string>('');
  const [output, setOutput] = useState<string>('');
  const [isRunning, setIsRunning] = useState<boolean>(false);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [isFullscreen, setIsFullscreen] = useState<boolean>(false);
  const editorRef = useRef<HTMLTextAreaElement>(null);
  const { toast } = useToast();

  useEffect(() => {
    // Set default code for the selected language
    if (question.defaultCode && question.defaultCode[language]) {
      setCode(question.defaultCode[language]);
    }
  }, [language, question.defaultCode]);

  const handleLanguageChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setLanguage(e.target.value);
  };

  const handleCodeChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setCode(e.target.value);
  };

  const handleRunCode = async () => {
    if (!code.trim()) {
      toast({
        title: "Empty Code",
        description: "Please write some code before running.",
        variant: "destructive",
      });
      return;
    }

    setIsRunning(true);
    setOutput('Running code...');

    try {
      // Use the first example test case for quick testing
      const testcase = question.examples[0];
      
      const result = await executeCode({
        language,
        code,
        input: testcase.input,
        expectedOutput: testcase.output
      });
      
      console.log('Run result:', result);
      
      setOutput(result.output || 'No output generated');
      
      if (result.status === 'Accepted') {
        toast({
          title: "Success",
          description: "Your code passed the example test case!",
        });
      } else if (result.status === 'Wrong Answer') {
        toast({
          title: "Wrong Answer",
          description: "Your code did not produce the expected output.",
          variant: "destructive",
        });
      } else if (result.error) {
        toast({
          title: "Error",
          description: result.error,
          variant: "destructive",
        });
      }
    } catch (error) {
      setOutput('Error executing code. Please try again.');
      toast({
        title: "Execution Error",
        description: "Failed to run your code. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsRunning(false);
    }
  };
  
  const handleSubmitCode = async () => {
    if (!code.trim()) {
      toast({
        title: "Empty Code",
        description: "Please write some code before submitting.",
        variant: "destructive",
      });
      return;
    }

    setIsSubmitting(true);
    setOutput('Submitting your code...');

    try {
      // Run tests on all test cases
      let allTestsPassed = true;
      let executionTime = 0;
      let memoryUsed = 0;
      let failedTestResult = '';
      
      for (const testcase of question.testcases) {
        const result = await executeCode({
          language,
          code,
          input: testcase.input,
          expectedOutput: testcase.expected_output
        });
        
        console.log('Test case result:', result);
        
        if (result.status !== 'Accepted') {
          allTestsPassed = false;
          failedTestResult = `Failed test case: ${testcase.input}\nExpected: ${testcase.expected_output}\nGot: ${result.output}`;
          break;
        }
        
        // Use optional chaining to safely access properties
        executionTime = Math.max(executionTime, result.executionTime || 0);
        memoryUsed = Math.max(memoryUsed, result.memoryUsed || 0);
      }
      
      const status = allTestsPassed ? 'Accepted' : 'Wrong Answer';
      
      // Call onSubmit callback to save submission
      if (onSubmit) {
        onSubmit(
          question.id,
          code,
          language,
          status,
          executionTime,
          memoryUsed
        );
      }
      
      if (allTestsPassed) {
        setOutput('All test cases passed! Your solution has been submitted.');
        toast({
          title: "Success",
          description: "Your solution passed all test cases!",
        });
      } else {
        setOutput(failedTestResult);
        toast({
          title: "Wrong Answer",
          description: "Your solution failed one or more test cases.",
          variant: "destructive",
        });
      }
    } catch (error) {
      setOutput('Error executing code. Please try again.');
      toast({
        title: "Execution Error",
        description: "Failed to submit your code. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const toggleFullscreen = () => {
    setIsFullscreen(!isFullscreen);
  };

  return (
    <div className={`grid ${isFullscreen ? 'fixed inset-0 z-50 bg-white p-4' : ''} grid-cols-1 gap-4 h-full`}>
      <div className="flex justify-between items-center">
        <div className="flex space-x-3 items-center">
          <select
            value={language}
            onChange={handleLanguageChange}
            className="bg-white border border-contest-mediumGray rounded-md px-3 py-1 text-sm"
          >
            <option value="cpp">C++</option>
            <option value="java">Java</option>
            <option value="python">Python</option>
            <option value="javascript">JavaScript</option>
          </select>
        </div>
        
        <div className="flex space-x-2">
          <button 
            onClick={toggleFullscreen}
            className="text-sm px-3 py-1 rounded border border-contest-mediumGray hover:bg-contest-lightGray transition-colors"
          >
            {isFullscreen ? 'Exit Fullscreen' : 'Fullscreen'}
          </button>
          
          <button 
            onClick={handleSubmitCode}
            disabled={isSubmitting}
            className="text-sm px-3 py-1 rounded bg-green-600 text-white hover:bg-green-700 transition-colors"
          >
            {isSubmitting ? (
              <>
                <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white inline" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                Submitting
              </>
            ) : (
              'Submit'
            )}
          </button>
          
          <button
            onClick={handleRunCode}
            disabled={isRunning}
            className="text-sm contest-button py-1 px-4 flex items-center"
          >
            {isRunning ? (
              <>
                <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                Running
              </>
            ) : (
              'Run Code'
            )}
          </button>
        </div>
      </div>
      
      <div className="code-editor-container flex-grow overflow-hidden">
        <textarea
          ref={editorRef}
          value={code}
          onChange={handleCodeChange}
          className="w-full h-full p-4 font-mono text-sm resize-none focus:outline-none"
          spellCheck="false"
          placeholder="Write your code here..."
        />
      </div>
      
      <div className="border-t border-contest-mediumGray pt-2">
        <div className="text-sm font-medium mb-1">Output:</div>
        <div className="bg-gray-50 rounded p-3 font-mono text-sm h-32 overflow-auto whitespace-pre">
          {output || 'Your code output will appear here...'}
        </div>
      </div>
    </div>
  );
};

export default CodeEditor;
