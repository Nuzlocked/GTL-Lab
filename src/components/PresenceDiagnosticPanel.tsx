import React, { useState } from 'react';
import { presenceDiagnostics, DiagnosticResult } from '../utils/diagnosticTests';

interface PresenceDiagnosticPanelProps {
  onClose: () => void;
}

export const PresenceDiagnosticPanel: React.FC<PresenceDiagnosticPanelProps> = ({ onClose }) => {
  const [targetUsername, setTargetUsername] = useState('');
  const [results, setResults] = useState<DiagnosticResult[]>([]);
  const [isRunning, setIsRunning] = useState(false);

  const runDiagnostics = async () => {
    if (!targetUsername.trim()) {
      alert('Please enter a username to test');
      return;
    }

    setIsRunning(true);
    setResults([]);

    try {
      const testResults = await presenceDiagnostics.runAllTests(targetUsername.trim());
      setResults(testResults);
      
      // Also print to console for debugging
      presenceDiagnostics.printResults(testResults);
    } catch (error) {
      console.error('Error running diagnostics:', error);
      alert('Error running diagnostics. Check console for details.');
    } finally {
      setIsRunning(false);
    }
  };

  const getStatusIcon = (passed: boolean) => {
    return passed ? '✅' : '❌';
  };

  const getStatusColor = (passed: boolean) => {
    return passed ? 'text-green-400' : 'text-red-400';
  };

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50">
      <div className="bg-gtl-bg border border-gtl-border rounded-lg p-6 max-w-4xl w-full max-h-[90vh] overflow-y-auto">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-bold text-gtl-text">Presence Tracking Diagnostics</h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gtl-text transition-colors"
          >
            ✕
          </button>
        </div>

        <div className="space-y-4">
          <div className="flex space-x-4">
            <input
              type="text"
              placeholder="Enter username to test"
              value={targetUsername}
              onChange={(e) => setTargetUsername(e.target.value)}
              className="flex-1 px-4 py-2 bg-gtl-bg border border-gtl-border rounded-md text-gtl-text focus:outline-none focus:ring-2 focus:ring-gtl-accent"
            />
            <button
              onClick={runDiagnostics}
              disabled={isRunning}
              className="px-6 py-2 bg-gtl-accent text-white rounded-md hover:bg-gtl-accent/80 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {isRunning ? 'Running...' : 'Run Diagnostics'}
            </button>
          </div>

          {results.length > 0 && (
            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-gtl-text">Test Results:</h3>
              
              {results.map((result, index) => (
                <div key={index} className="border border-gtl-border rounded-lg p-4">
                  <div className="flex items-center space-x-3 mb-2">
                    <span className="text-2xl">{getStatusIcon(result.passed)}</span>
                    <h4 className={`text-lg font-medium ${getStatusColor(result.passed)}`}>
                      {result.test}
                    </h4>
                  </div>

                  {result.error && (
                    <div className="mb-3 p-3 bg-red-900/20 border border-red-600/30 rounded-md">
                      <p className="text-red-300 text-sm">
                        <strong>Error:</strong> {result.error}
                      </p>
                    </div>
                  )}

                  {result.result && (
                    <div className="bg-gtl-bg/50 border border-gtl-border/50 rounded-md p-3">
                      <p className="text-sm text-gray-300 mb-2">
                        <strong>Result:</strong>
                      </p>
                      <pre className="text-xs text-gray-400 overflow-x-auto">
                        {JSON.stringify(result.result, null, 2)}
                      </pre>
                    </div>
                  )}
                </div>
              ))}

              <div className="border-t border-gtl-border pt-4">
                <div className="flex justify-between items-center">
                  <span className="text-gtl-text">
                    Summary: {results.filter(r => r.passed).length}/{results.length} tests passed
                  </span>
                  
                  {results.some(r => !r.passed) && (
                    <div className="text-red-400 text-sm">
                      ❌ Some tests failed - check console for detailed logs
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}; 