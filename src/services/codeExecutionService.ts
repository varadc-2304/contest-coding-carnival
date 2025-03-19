const languageIds: Record<string, number> = {
  cpp: 54,       // C++ (GCC 9.2.0)
  java: 62,      // Java (OpenJDK 13.0.1)
  python: 71,    // Python (3.8.1)
  javascript: 63 // JavaScript (Node.js 12.14.0)
};

export const executeCode = async (params: CodeExecutionParams): Promise<CodeExecutionResult> => {
  try {
    const { language, code, input } = params;

    // Ensure language exists in languageIds
    const languageId = languageIds[language];
    if (!languageId) {
      throw new Error(`Unsupported language: ${language}`);
    }

    console.log('Submitting code to Judge0 API...');

    const submissionResponse = await fetch('http://82.25.104.175:2358/submissions?base64_encoded=false&wait=false', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ source_code: code, language_id: languageId, stdin: input }),
    });

    if (!submissionResponse.ok) {
      throw new Error(`Submission failed: ${submissionResponse.status} ${submissionResponse.statusText}`);
    }

    const submissionData = await submissionResponse.json();
    const token = submissionData.token;
    if (!token) throw new Error('No token received from Judge0');

    console.log(`Code submitted successfully. Token: ${token}`);

    // Polling for execution result
    let result: any;
    for (let i = 0; i < 15; i++) {  // Increased retries
      await new Promise(resolve => setTimeout(resolve, 1000));

      const resultResponse = await fetch(`http://82.25.104.175:2358/submissions/${token}`, {
        method: 'GET',
        headers: { 'Content-Type': 'application/json' },
      });

      if (!resultResponse.ok) {
        console.error(`Error fetching execution result: ${resultResponse.status}`);
        throw new Error('Error fetching execution result');
      }

      result = await resultResponse.json();
      if (result?.status?.id > 2) break; // Execution completed
    }

    if (!result || !result.status) {
      throw new Error('Execution timeout or invalid response');
    }

    console.log('Execution result received:', result);

    return {
      output: result.stdout || '',
      error: result.stderr || result.compile_output || '',
      status: mapStatus(result.status.id),
      executionTime: result.time || 0,
      memoryUsed: result.memory || 0,
      token
    };

  } catch (error) {
    console.error('Execution error:', error);
    return { error: error instanceof Error ? error.message : 'Unknown error', status: 'Error' };
  }
};

// Helper function to map status codes
const mapStatus = (statusId: number): string => {
  switch (statusId) {
    case 3: return 'Accepted';
    case 4: return 'Wrong Answer';
    case 5: return 'Time Limit Exceeded';
    case 6: return 'Compilation Error';
    case 7: return 'Runtime Error';
    default: return 'Error';
  }
};

