
type CodeExecutionParams = {
  language: string;
  code: string;
  input: string;
  expectedOutput: string;
};

type CodeExecutionResult = {
  output?: string;
  error?: string;
  status: 'Accepted' | 'Wrong Answer' | 'Error' | 'Time Limit Exceeded';
  executionTime?: number;
  memoryUsed?: number;
  token?: string;
};

// Map of language names to Judge0 language IDs
const languageIds: Record<string, number> = {
  cpp: 54,       // C++ (GCC 9.2.0)
  java: 62,      // Java (OpenJDK 13.0.1)
  python: 71,    // Python (3.8.1)
  javascript: 63 // JavaScript (Node.js 12.14.0)
};

export const executeCode = async (params: CodeExecutionParams): Promise<CodeExecutionResult> => {
  try {
    const { language, code, input, expectedOutput } = params;
    
    const languageId = languageIds[language];
    if (!languageId) {
      throw new Error(`Unsupported language: ${language}`);
    }
    
    // Create submission - use a fetch with timeout for better error handling
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 10000); // 10 second timeout
    
    console.log('Submitting code to Judge0 API...');
    
    const response = await fetch('https://judge0-ce.p.rapidapi.com/submissions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-RapidAPI-Key': '252f44d493msh456a1564f92e1f7p13d1d3jsnd3baeb036aab',
        'X-RapidAPI-Host': 'judge0-ce.p.rapidapi.com'
      },
      signal: controller.signal,
      body: JSON.stringify({
        source_code: code,
        language_id: languageId,
        stdin: input,
        expected_output: expectedOutput
      }),
    });
    
    clearTimeout(timeoutId);
    
    if (!response.ok) {
      console.error('Failed to submit code', response.status, response.statusText);
      throw new Error(`Failed to submit code: ${response.status} ${response.statusText}`);
    }
    
    const submissionData = await response.json();
    console.log('Submission response:', submissionData);
    
    const { token } = submissionData;
    
    if (!token) {
      throw new Error('No submission token received');
    }
    
    // Poll for results
    let result: any;
    let attempts = 0;
    const maxAttempts = 10;
    
    while (attempts < maxAttempts) {
      await new Promise(resolve => setTimeout(resolve, 1000)); // Wait 1 second
      
      const resultResponse = await fetch(`https://judge0-ce.p.rapidapi.com/submissions/${token}?base64_encoded=false&fields=stdout,stderr,status_id,time,memory,compile_output`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'X-RapidAPI-Key': '252f44d493msh456a1564f92e1f7p13d1d3jsnd3baeb036aab',
          'X-RapidAPI-Host': 'judge0-ce.p.rapidapi.com'
        },
      });
      
      if (!resultResponse.ok) {
        console.error('Failed to fetch submission result', resultResponse.status, resultResponse.statusText);
        throw new Error('Failed to fetch submission result');
      }
      
      result = await resultResponse.json();
      console.log('Result response:', result);
      
      if (result.status && result.status.id !== 1 && result.status.id !== 2) {
        // Status 1 = In Queue, 2 = Processing
        break;
      }
      
      attempts++;
    }
    
    if (!result || attempts >= maxAttempts) {
      throw new Error('Timeout while waiting for code execution');
    }
    
    // Process the result
    let status: CodeExecutionResult['status'] = 'Error';
    
    if (result.status.id === 3) {
      // Accepted
      status = 'Accepted';
    } else if (result.status.id === 4) {
      // Wrong Answer
      status = 'Wrong Answer';
    } else if (result.status.id === 5) {
      // Time Limit Exceeded
      status = 'Time Limit Exceeded';
    }
    
    return {
      output: result.stdout || '',
      error: result.stderr || result.compile_output || '',
      status,
      executionTime: result.time,
      memoryUsed: result.memory,
      token
    };
  } catch (error) {
    console.error('Code execution error:', error);
    return {
      error: error instanceof Error ? error.message : 'Unknown error',
      status: 'Error'
    };
  }
};
