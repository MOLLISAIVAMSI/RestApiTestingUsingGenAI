import React, { useState } from 'react';
import { Check, Play, AlertTriangle, Download, Copy } from 'lucide-react';
import './style.css';
import Background from './Background';

const ApitestingWebsite = () => {
  const [apiMethod, setAPIMethod] = useState('GET');
  const [apiURL, setAPIURL] = useState('');
  const [apiBody, setAPIBody] = useState('');
  const [apiHeaders, setAPIHeaders] = useState('');
  const [apiResponse, setAPIResponse] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const [reportFile, setReportFile] = useState(null);
  const [isCheckLoading, setIsCheckLoading] = useState(false);

  const handleAPITest = async () => {
    setIsLoading(true);
    try {
      let parsedBody = apiBody.trim() ? JSON.parse(apiBody) : null;
      let parsedHeaders = apiHeaders.trim() ? JSON.parse(apiHeaders) : {};

      await new Promise((resolve) => setTimeout(resolve, 500));

      const response = await fetch('http://127.0.0.1:5500/test_api', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ apiMethod, apiURL, apiBody: parsedBody, apiHeaders: parsedHeaders }),
      });

      const contentType = response.headers.get('content-type');
      const data = contentType?.includes('application/json') ? await response.json() : await response.text();
      setAPIResponse(data);
    } catch (error) {
      setAPIResponse({ error: error.message });
    } finally {
      setIsLoading(false);
    }
  };

  const handleGenerateReport = async () => {
    setIsCheckLoading(true);
    try {
      const requestData = { apiResponse, apiURL, apiMethod, apiHeaders, apiBody };
      const response = await fetch('http://127.0.0.1:5062/generate_report', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ requestData }),
      });

      if (!response.ok) throw new Error('Failed to generate the report');
      const blob = await response.blob();
      setReportFile(blob);
    } catch (error) {
      setError(error.message);
    } finally {
      setIsCheckLoading(false);
    }
  };

  const downloadReport = () => {
    if (!reportFile) return;
    const timestamp = new Date().toISOString().replace(/[:.-]/g, '_');
    const fileName = `API_Report_${apiMethod}_${apiURL.split('/').pop()}_${timestamp}.docx`;
    const url = URL.createObjectURL(reportFile);
    const link = document.createElement('a');
    link.href = url;
    link.download = fileName;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  return (
    <div className="relative min-h-screen">
      {/* Background Component - Positioned Absolutely Behind */}
      <div className="absolute inset-0 z-0">
        <Background />
      </div>

      {/* Content - Positioned Relatively Above */}
      <div className="relative z-10 flex flex-col min-h-screen">
        <div className="flex-grow container mx-auto py-12 px-4">
          <h1 className="text-4xl font-bold mb-12 text-center text-gray-900">
            <span className="neon-text">API Testing Website</span>
          </h1>

          <div className="max-w-4xl mx-auto">
            <div className="bg-white shadow-xl rounded-lg p-8 mb-8">
              <h2 className="text-2xl font-bold mb-6 text-gray-800">Test an API</h2>
              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  handleAPITest();
                }}
                className="space-y-6"
              >
                <div className="space-y-2">
                  <label htmlFor="method" className="block text-sm font-medium text-gray-700">
                    HTTP Method
                  </label>
                  <select
                    id="method"
                    value={apiMethod}
                    onChange={(e) => setAPIMethod(e.target.value)}
                    className="block w-full px-4 py-3 rounded-lg border border-gray-300 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition duration-150 ease-in-out text-gray-700 bg-white shadow-sm"
                  >
                    <option value="GET">GET</option>
                    <option value="POST">POST</option>
                    <option value="PUT">PUT</option>
                    <option value="DELETE">DELETE</option>
                  </select>
                </div>

                <div className="space-y-2">
                  <label htmlFor="url" className="block text-sm font-medium text-gray-700">
                    API URL
                  </label>
                  <input
                    type="text"
                    id="url"
                    value={apiURL}
                    onChange={(e) => setAPIURL(e.target.value)}
                    placeholder="https://api.example.com/endpoint"
                    className="block w-full px-4 py-3 rounded-lg border border-gray-300 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition duration-150 ease-in-out text-gray-700 shadow-sm"
                  />
                </div>

                <div className="space-y-2">
                  <label htmlFor="body" className="block text-sm font-medium text-gray-700">
                    Request Body (JSON)
                  </label>
                  <textarea
                    id="body"
                    value={apiBody}
                    onChange={(e) => setAPIBody(e.target.value)}
                    placeholder='{"key": "value"}'
                    className="block w-full px-4 py-3 rounded-lg border border-gray-300 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition duration-150 ease-in-out text-gray-700 font-mono text-sm shadow-sm"
                    rows="4"
                  />
                </div>

                <div className="space-y-2">
                  <label htmlFor="headers" className="block text-sm font-medium text-gray-700">
                    Headers (JSON)
                  </label>
                  <textarea
                    id="headers"
                    value={apiHeaders}
                    onChange={(e) => setAPIHeaders(e.target.value)}
                    placeholder='{"Authorization": "Bearer token"}'
                    className="block w-full px-4 py-3 rounded-lg border border-gray-300 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition duration-150 ease-in-out text-gray-700 font-mono text-sm shadow-sm"
                    rows="3"
                  />
                </div>

                <button
                  type="submit"
                  className={`w-full py-3 px-6 rounded-lg transition duration-150 ease-in-out font-medium shadow-sm ${
                    isLoading ? 'bg-gray-400 cursor-not-allowed' : 'bg-indigo-600 text-white hover:bg-indigo-700'
                  }`}
                  disabled={isLoading}
                >
                  {isLoading ? 'Loading...' : 'Test API'}
                </button>
              </form>
            </div>

            {apiResponse && (
              <div className="bg-white shadow-xl rounded-lg p-8">
                <h2 className="text-2xl font-bold mb-6 text-gray-800">API Response</h2>
                <div className="bg-gray-50 rounded-lg p-4 overflow-auto">
                  <pre className="whitespace-pre-wrap text-gray-800 font-mono text-sm">
                    {JSON.stringify(apiResponse, null, 2)}
                  </pre>
                </div>
                <div className="flex justify-end mt-4">
                  <button
                    onClick={() => {
                      if (isCheckLoading) return;
                      if (reportFile) {
                        alert('Report is ready and available for download!');
                        downloadReport();
                      } else {
                        handleGenerateReport();
                      }
                    }}
                    disabled={isCheckLoading}
                    className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {isCheckLoading ? (
                      <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent mr-2" />
                    ) : reportFile ? (
                      <Download className="w-4 h-4 mr-2" />
                    ) : (
                      <Play className="w-4 h-4 mr-2" />
                    )}
                    {isCheckLoading ? 'Generating Report...' : reportFile ? 'Download Report' : 'Generate Word Report'}
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default ApitestingWebsite;