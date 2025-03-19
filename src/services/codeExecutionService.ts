// Language ID mapping for Judge0 API
const languageIds: Record<string, number> = {
  cpp: 54,       // C++ (GCC 9.2.0)
  java: 62,      // Java (OpenJDK 13.0.1)
  python: 71,    // Python (3.8.1)
  javascript: 63 // JavaScript (Node.js 12.14.0)
};

export const executeCode = async (params: CodeExecutionParams): Promise<CodeExecutionResult> => {
  try {
    const { language, code, input, expectedOutput } = params;

    // Ensure language exists in languageIds
    const languageId = languageIds[language];
    if (!languageId) {
      throw new Error(`Unsupported language: ${language}`);
    }

    console.log('Submitting code to Judge0 API...');
    
    const response = await fetch('http://82.25.104.175:2358/submissions?base64_encoded=false&wait=false', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ source_code: code, language_id: languageId, stdin: input, expected_output: expectedOutput }),
    });

    if (!response.ok) {
      throw new Error(`Submission failed: ${response.status} ${response.statusText}`);
    }

    const { token } = await response.json();
    if (!token) throw new Error('No token received from Judge0');

    // Polling for execution result
    let result: any;
    for (let i = 0; i < 10; i++) {
      await new Promise(resolve => setTimeout(resolve, 1000));

      const resultResponse = await fetch(`http://82.25.104.175:2358/submissions/${token}`, {
        method: 'GET',
        headers: { 'Content-Type': 'application/json' },
      });

      if (!resultResponse.ok) {
        throw new Error('Error fetching execution result');
      }

      result = await resultResponse.json();
      if (result.status?.id > 2) break; // 1 = Queue, 2 = Processing, >2 means done
    }

    if (!result) throw new Error('Execution timeout');

    return {
      output: result.stdout || '',
      error: result.stderr || result.compile_output || '',
      status: result.status.id === 3 ? 'Accepted' :
              result.status.id === 4 ? 'Wrong Answer' :
              result.status.id === 5 ? 'Time Limit Exceeded' : 'Error',
      executionTime: result.time,
      memoryUsed: result.memory,
      token
    };
  } catch (error) {
    console.error('Execution error:', error);
    return { error: error instanceof Error ? error.message : 'Unknown error', status: 'Error' };
  }
};
