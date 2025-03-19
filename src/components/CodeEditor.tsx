
import { useState, useEffect, useRef } from 'react';
import { useToast } from "@/hooks/use-toast";
import { executeCode } from '@/services/codeExecutionService';
import { Loader2, Play, Send, Maximize2, Minimize2 } from 'lucide-react';
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";

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

  const handleLanguageChange = (value: string) => {
    setLanguage(value);
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
      let lastToken = '';
      
      for (const testcase of question.testcases) {
        const result = await executeCode({
          language,
          code,
          input: testcase.input,
          expectedOutput: testcase.expected_output
        });
        
        console.log('Test case result:', result);
        
        if (result.token) {
          lastToken = result.token;
        }
        
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
    <div className={`${isFullscreen ? 'fixed inset-0 z-50 bg-background p-4' : ''} flex flex-col h-full gap-4 rounded-xl border border-border bg-card shadow-sm`}>
      <div className="flex justify-between items-center p-3 border-b">
        <div className="flex space-x-3 items-center">
          <Select value={language} onValueChange={handleLanguageChange}>
            <SelectTrigger className="w-[140px]">
              <SelectValue placeholder="Select Language" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="cpp">C++</SelectItem>
              <SelectItem value="java">Java</SelectItem>
              <SelectItem value="python">Python</SelectItem>
              <SelectItem value="javascript">JavaScript</SelectItem>
            </SelectContent>
          </Select>
        </div>
        
        <div className="flex space-x-2">
          <Button 
            variant="outline" 
            size="sm"
            onClick={toggleFullscreen}
          >
            {isFullscreen ? <Minimize2 className="h-4 w-4 mr-2" /> : <Maximize2 className="h-4 w-4 mr-2" />}
            {isFullscreen ? 'Exit' : 'Fullscreen'}
          </Button>
          
          <Button 
            variant="outline"
            size="sm"
            onClick={handleSubmitCode}
            disabled={isSubmitting}
            className="bg-green-600 text-white hover:bg-green-700"
          >
            {isSubmitting ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Submitting
              </>
            ) : (
              <>
                <Send className="h-4 w-4 mr-2" />
                Submit
              </>
            )}
          </Button>
          
          <Button
            variant="default"
            size="sm"
            onClick={handleRunCode}
            disabled={isRunning}
          >
            {isRunning ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Running
              </>
            ) : (
              <>
                <Play className="h-4 w-4 mr-2" />
                Run Code
              </>
            )}
          </Button>
        </div>
      </div>
      
      <div className="flex-grow overflow-hidden px-3">
        <Textarea
          ref={editorRef}
          value={code}
          onChange={handleCodeChange}
          className="w-full h-full font-mono text-sm resize-none focus:outline-none min-h-[300px] p-3 rounded-md border-border bg-card/50"
          spellCheck="false"
          placeholder="Write your code here..."
        />
      </div>
      
      <div className="border-t border-border p-3">
        <div className="text-sm font-medium mb-2">Output:</div>
        <div className="bg-muted/30 rounded-md p-3 font-mono text-sm h-32 overflow-auto whitespace-pre">
          {output || 'Your code output will appear here...'}
        </div>
      </div>
    </div>
  );
};

export default CodeEditor;
