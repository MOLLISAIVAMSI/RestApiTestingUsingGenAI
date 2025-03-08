import React, { useState, useEffect, useRef } from 'react';
import { Check, Play, AlertTriangle, Download, Copy, Sun, Moon, Save, X, Fullscreen, ChevronRight, ChevronLeft, Settings, Zap, FileText, Code as CodeIcon } from 'lucide-react';
import Sidebar from './Sidebar';

const CodeCompiler = () => {
    const [code, setCode] = useState('');
    const [output, setOutput] = useState(null);
    const [error, setError] = useState(null);
    const [isLoading, setIsLoading] = useState(false);
    const [isCopied, setIsCopied] = useState(false);
    const [documentUrl, setDocumentUrl] = useState(null);
    const [isCheckLoading, setIsCheckLoading] = useState(false);
    const [isDownloadReady, setIsDownloadReady] = useState(false);
    const [selectedFileId, setSelectedFileId] = useState(null);
    const [fileContent, setFileContent] = useState('');
    const [darkMode, setDarkMode] = useState(() => {
        const saved = localStorage.getItem('darkMode');
        return saved !== null ? JSON.parse(saved) : window.matchMedia('(prefers-color-scheme: dark)').matches;
    });
    const [cursorPosition, setCursorPosition] = useState({ line: 1, col: 1 });
    const [splitPosition, setSplitPosition] = useState(60);
    const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
    const [fontSize, setFontSize] = useState(14);
    const [isFullscreen, setIsFullscreen] = useState(false);
    const [showSettings, setShowSettings] = useState(false);
    const textareaRef = useRef(null);
    const preRef = useRef(null);
    const lineNumbersRef = useRef(null);
    const mainScreenRef = useRef(null);
    const editorContainerRef = useRef(null);

    const pythonKeywords = [
        'False', 'None', 'True', 'and', 'as', 'assert', 'async', 'await',
        'break', 'class', 'continue', 'def', 'del', 'elif', 'else', 'except',
        'finally', 'for', 'from', 'global', 'if', 'import', 'in', 'is',
        'lambda', 'nonlocal', 'not', 'or', 'pass', 'raise', 'return',
        'try', 'while', 'with', 'yield', 'list', 'dict', 'set', 'int',
        'str', 'float', 'bool', 'tuple'
    ];

    useEffect(() => {
        localStorage.setItem('darkMode', JSON.stringify(darkMode));
        document.documentElement.classList.toggle('dark', darkMode);
    }, [darkMode]);

    useEffect(() => {
        if (selectedFileId) {
            fetchFileContent(selectedFileId);
        } else {
            setFileContent('');
            setCode('');
        }
    }, [selectedFileId]);

    useEffect(() => {
        const handleFullscreenChange = () => {
            setIsFullscreen(!!document.fullscreenElement);
        };
        
        document.addEventListener('fullscreenchange', handleFullscreenChange);
        return () => document.removeEventListener('fullscreenchange', handleFullscreenChange);
    }, []);

    useEffect(() => {
        if (textareaRef.current) {
            textareaRef.current.focus();
        }
    }, [selectedFileId]);

    const handleScroll = () => {
        if (textareaRef.current && preRef.current && lineNumbersRef.current) {
            preRef.current.scrollTop = textareaRef.current.scrollTop;
            lineNumbersRef.current.scrollTop = textareaRef.current.scrollTop;
        }
    };

    const toggleFullscreen = () => {
        if (!document.fullscreenElement) {
            editorContainerRef.current.requestFullscreen().catch(err => {
                console.error(`Error attempting to enable fullscreen: ${err.message}`);
            });
        } else {
            document.exitFullscreen();
        }
    };

    const fetchFileContent = async (fileId) => {
        try {
            const response = await fetch(`http://localhost:5260/files/${fileId}`);
            if (response.ok) {
                const data = await response.json();
                setFileContent(data.content || '');
                setCode(data.content || '');
            } else {
                console.error('Failed to fetch file content');
                setFileContent('');
                setCode('');
            }
        } catch (error) {
            console.error('Error fetching file content:', error);
            setFileContent('');
            setCode('');
        }
    };

    const handleFileClick = (fileId) => {
        setSelectedFileId(fileId);
        setOutput(null);
        setError(null);
        setIsDownloadReady(false);
    };

    const handleCodeChange = (newCode) => {
        setCode(newCode);
        setFileContent(newCode);
    };

    const handleProcessCode = async () => {
        if (isDownloadReady) {
            const timestamp = new Date().toISOString().replace(/[:.-]/g, '_');
            const fileName = `generated-report_${timestamp}.docx`;
            const link = document.createElement('a');
            link.href = documentUrl;
            link.download = fileName;
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
            return;
        }

        setIsCheckLoading(true);
        setOutput(null);
        setError(null);

        try {
            const response = await fetch('http://127.0.0.1:5042/generate', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ code }),
            });

            if (!response.ok) {
                const data = await response.json();
                throw new Error(data.error || 'Error processing code');
            }

            const blob = await response.blob();
            const url = window.URL.createObjectURL(blob);
            setDocumentUrl(url);
            setIsDownloadReady(true);
            setOutput("Report generated successfully! Click the button to download.");
        } catch (err) {
            setError(err.message);
        } finally {
            setIsCheckLoading(false);
        }
    };

    const handleRunCode = async () => {
        setIsLoading(true);
        setOutput(null);
        setError(null);

        try {
            const response = await fetch('http://localhost:5600/run', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ code }),
            });

            const data = await response.json();

            if (response.ok) {
                setOutput(
                    `Request URL: ${data.url}\n` +
                    `Output: ${data.output || 'No output'}\n`
                );
            } else {
                throw new Error(data.error || 'Error running code');
            }
        } catch (err) {
            setError(err.message);
        } finally {
            setIsLoading(false);
        }
    };

    const handleCopyCode = () => {
        navigator.clipboard.writeText(code);
        setIsCopied(true);
        setTimeout(() => setIsCopied(false), 2000);
    };

    const handleDownload = () => {
        const element = document.createElement('a');
        const file = new Blob([code], { type: 'text/plain' });
        element.href = URL.createObjectURL(file);
        element.download = 'code.py';
        document.body.appendChild(element);
        element.click();
        document.body.removeChild(element);
    };

    const saveFileContent = async () => {
        if (!selectedFileId) return;

        try {
            const response = await fetch(`http://localhost:5260/files/${selectedFileId}`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ content: fileContent }),
            });

            if (response.ok) {
                const saveIndicator = document.createElement('div');
                saveIndicator.className = `fixed bottom-4 right-4 bg-green-500 text-white px-4 py-2 rounded-md shadow-lg transition-opacity duration-300 flex items-center gap-2`;
                saveIndicator.innerHTML = '<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"></polyline></svg> File saved successfully';
                document.body.appendChild(saveIndicator);
                
                setTimeout(() => {
                    saveIndicator.style.opacity = '0';
                    setTimeout(() => {
                        document.body.removeChild(saveIndicator);
                    }, 300);
                }, 2000);
            } else {
                console.error('Failed to save file content');
            }
        } catch (error) {
            console.error('Error saving file content:', error);
        }
    };

    const handleClear = () => {
        setCode('');
        setFileContent('');
        setOutput(null);
        setError(null);
        setDocumentUrl(null);
        setIsDownloadReady(false);
    };

    const handleKeyDown = (e) => {
        if (e.ctrlKey) {
            if (e.key === 'Enter') {
                e.preventDefault();
                handleRunCode();
            } else if (e.key === 'r' || e.key === 'R') {
                e.preventDefault();
                handleProcessCode();
            } else if (e.key === 's' || e.key === 'S') {
                e.preventDefault();
                saveFileContent();
            }
        }
        
        if (e.key === 'Tab') {
            e.preventDefault();
            const start = e.target.selectionStart;
            const end = e.target.selectionEnd;
            const spaces = '    ';
            
            setCode(code.substring(0, start) + spaces + code.substring(end));
            
            setTimeout(() => {
                e.target.selectionStart = e.target.selectionEnd = start + spaces.length;
            }, 0);
        }
    };

    const updateCursorPosition = (e) => {
        const textarea = e.target;
        const lines = code.substr(0, textarea.selectionStart).split('\n');
        const line = lines.length;
        const col = lines[lines.length - 1].length + 1;
        setCursorPosition({ line, col });
    };

    const handleSplitDrag = (e) => {
        const rect = mainScreenRef.current.getBoundingClientRect();
        const newPosition = ((e.clientY - rect.top) / rect.height) * 100;
        setSplitPosition(Math.max(20, Math.min(80, newPosition)));
    };

    const lineNumbers = Array.from(
        { length: Math.max(15, code.split('\n').length) },
        (_, idx) => idx + 1
    ).join('\n');

    const highlightCode = (code) => {
        const defaultStyle = darkMode ? 'text-gray-200' : 'text-gray-800';
        return code.split(/(\s+)/).map((word, index) => {
            if (pythonKeywords.includes(word)) {
                return <span key={index} className={`text-blue-500 dark:text-blue-400 font-medium ${defaultStyle}`}>{word}</span>;
            }
            if (word.startsWith('"') || word.startsWith("'")) {
                return <span key={index} className={`text-green-600 dark:text-green-400 ${defaultStyle}`}>{word}</span>;
            }
            if (!isNaN(word) && word.trim() !== '') {
                return <span key={index} className={`text-blue-600 dark:text-blue-400 ${defaultStyle}`}>{word}</span>;
            }
            if (/^[a-zA-Z_][a-zA-Z0-9_]*(?=\()/.test(word)) {
                return <span key={index} className={`text-yellow-600 dark:text-yellow-400 ${defaultStyle}`}>{word}</span>;
            }
            if (word.startsWith('#')) {
                return <span key={index} className={`text-gray-500 italic ${defaultStyle}`}>{word}</span>;
            }
            return <span key={index} className={defaultStyle}>{word}</span>;
        });
    };

    return (
        <div 
            ref={editorContainerRef}
            className={`h-screen flex flex-col ${darkMode ? 'bg-gray-900 text-white' : 'bg-gray-100 text-black'} transition-colors duration-300`}
        >
            {/* Add CSS to hide the scrollbar */}
            <style>
                {`
                    .scrollbar-hidden::-webkit-scrollbar {
                        display: none;
                    }
                    .scrollbar-hidden {
                        -ms-overflow-style: none;  /* IE and Edge */
                        scrollbar-width: none;  /* Firefox */
                    }
                `}
            </style>

            {/* Top Bar */}
            <div className={`flex items-center justify-between px-4 py-2 ${darkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'} border-b shadow-sm transition-colors duration-300`}>
                <div className="flex items-center gap-3">
                    <CodeIcon className="w-6 h-6 text-blue-500" />
                    <h1 className="text-lg font-semibold">Python Code Compiler</h1>
                    {selectedFileId && (
                        <div className="flex items-center gap-2 ml-4 px-2 py-1 rounded-md bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200">
                            <FileText className="w-4 h-4" />
                            <span className="text-sm">File {selectedFileId}</span>
                        </div>
                    )}
                </div>
                <div className="flex items-center gap-2">
                    <button
                        onClick={() => setShowSettings(!showSettings)}
                        className="p-2 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors"
                        title="Settings"
                        aria-label="Settings"
                    >
                        <Settings className="w-5 h-5" />
                    </button>
                    <button
                        onClick={() => setDarkMode(!darkMode)}
                        className="p-2 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors"
                        title={darkMode ? "Switch to Light Mode" : "Switch to Dark Mode"}
                        aria-label={darkMode ? "Switch to Light Mode" : "Switch to Dark Mode"}
                    >
                        {darkMode ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
                    </button>
                    <button
                        onClick={toggleFullscreen}
                        className="p-2 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors"
                        title={isFullscreen ? "Exit Fullscreen" : "Enter Fullscreen"}
                        aria-label={isFullscreen ? "Exit Fullscreen" : "Enter Fullscreen"}
                    >
                        <Fullscreen className="w-5 h-5" />
                    </button>
                </div>
            </div>

            {/* Settings Panel */}
            {showSettings && (
                <div className={`p-4 ${darkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'} border-b`}>
                    <div className="flex items-center justify-between mb-2">
                        <h2 className="font-medium">Editor Settings</h2>
                        <button 
                            onClick={() => setShowSettings(false)}
                            className="text-gray-500 hover:text-gray-700 dark:hover:text-gray-300"
                        >
                            <X className="w-5 h-5" />
                        </button>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div>
                            <label htmlFor="fontSize" className="block text-sm mb-1">Font Size</label>
                            <div className="flex items-center">
                                <input 
                                    id="fontSize"
                                    type="range" 
                                    min="10" 
                                    max="24"
                                    value={fontSize}
                                    onChange={(e) => setFontSize(parseInt(e.target.value))}
                                    className="w-full"
                                />
                                <span className="ml-2 text-sm">{fontSize}px</span>
                            </div>
                        </div>
                        <div>
                            <label className="block text-sm mb-1">Split Position</label>
                            <div className="flex items-center">
                                <input 
                                    type="range" 
                                    min="20" 
                                    max="80"
                                    value={splitPosition}
                                    onChange={(e) => setSplitPosition(parseInt(e.target.value))}
                                    className="w-full"
                                />
                                <span className="ml-2 text-sm">{splitPosition}%</span>
                            </div>
                        </div>
                        <div className="flex items-center">
                            <button 
                                onClick={() => {
                                    localStorage.clear();
                                    window.location.reload();
                                }}
                                className={`px-4 py-2 text-sm rounded-md ${darkMode ? 'bg-gray-700 hover:bg-gray-600' : 'bg-gray-200 hover:bg-gray-300'}`}
                            >
                                Reset All Settings
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Main Content */}
            <div className="flex flex-1 overflow-hidden">
                <div className={`${isSidebarCollapsed ? 'w-10' : 'w-64'} flex flex-col transition-all duration-300 ease-in-out ${darkMode ? 'bg-gray-800 border-gray-700' : 'bg-gray-50 border-gray-200'} border-r`}>
                    {isSidebarCollapsed ? (
                        <div className="flex-1 flex flex-col items-center py-4">
                            <button
                                onClick={() => setIsSidebarCollapsed(false)}
                                className="p-2 rounded-full hover:bg-gray-200 dark:hover:bg-gray-700 mb-4"
                                title="Expand Sidebar"
                            >
                                <ChevronRight className="w-5 h-5" />
                            </button>
                        </div>
                    ) : (
                        <>
                            <div className="flex items-center justify-between p-3 border-b border-gray-200 dark:border-gray-700">
                                <h2 className="font-medium text-sm">Files Explorer</h2>
                                <button
                                    onClick={() => setIsSidebarCollapsed(true)}
                                    className="p-1 rounded-full hover:bg-gray-200 dark:hover:bg-gray-700"
                                    title="Collapse Sidebar"
                                >
                                    <ChevronLeft className="w-5 h-5" />
                                </button>
                            </div>
                            <div className="flex-1 overflow-y-auto">
                                <Sidebar onFileClick={handleFileClick} activeFileId={selectedFileId} />
                            </div>
                        </>
                    )}
                </div>

                <div className="flex-1 flex flex-col relative" ref={mainScreenRef}>
                    <div className="flex-1 flex flex-col" style={{ height: `${splitPosition}%` }}>
                        <div className={`flex items-center justify-between px-4 py-2 ${darkMode ? 'bg-gray-700' : 'bg-gray-100'} border-b ${darkMode ? 'border-gray-600' : 'border-gray-200'} transition-colors duration-300`}>
                            <h2 className="text-sm font-medium flex items-center gap-2">
                                <CodeIcon className="w-4 h-4" /> Code Editor
                            </h2>
                            <div className="flex items-center gap-2">
                                <button
                                    onClick={handleCopyCode}
                                    className={`p-1 rounded text-xs flex items-center gap-1 ${darkMode ? 'hover:bg-gray-600' : 'hover:bg-gray-200'}`}
                                    title="Copy Code (Ctrl+C)"
                                >
                                    {isCopied ? <Check className="w-3 h-3 text-green-600" /> : <Copy className="w-3 h-3" />}
                                    <span>{isCopied ? 'Copied!' : 'Copy'}</span>
                                </button>
                                <button
                                    onClick={handleDownload}
                                    className={`p-1 rounded text-xs flex items-center gap-1 ${darkMode ? 'hover:bg-gray-600' : 'hover:bg-gray-200'}`}
                                    title="Download Code"
                                >
                                    <Download className="w-3 h-3" />
                                    <span>Download</span>
                                </button>
                                <button
                                    onClick={handleClear}
                                    className={`p-1 rounded text-xs flex items-center gap-1 text-red-600 ${darkMode ? 'hover:bg-red-900' : 'hover:bg-red-100'}`}
                                    title="Clear Code and Output"
                                >
                                    <X className="w-3 h-3" />
                                    <span>Clear</span>
                                </button>
                            </div>
                        </div>
                        <div className="flex-1 flex relative overflow-hidden">
                            {/* Line Numbers */}
                            <div
                                ref={lineNumbersRef}
                                className={`py-4 px-2 text-right text-gray-500 ${darkMode ? 'bg-gray-800' : 'bg-gray-100'} select-none font-mono text-sm w-12 border-r ${darkMode ? 'border-gray-600' : 'border-gray-200'} transition-colors duration-300 whitespace-pre overflow-y-auto scrollbar-hidden`}
                                style={{ height: '100%', lineHeight: '1.5rem' }}
                            >
                                {lineNumbers}
                            </div>
                            {/* Code Editor */}
                            <div className="relative flex-1 overflow-hidden">
                                <pre
                                    ref={preRef}
                                    className={`absolute inset-0 w-full h-full p-4 font-mono whitespace-pre-wrap break-words overflow-y-auto scrollbar-hidden ${darkMode ? 'bg-gray-900 text-gray-200' : 'bg-white text-gray-800'} transition-colors duration-300`}
                                    style={{ fontSize: `${fontSize}px`, lineHeight: '1.5rem', zIndex: 0 }}
                                >
                                    {highlightCode(code)}
                                </pre>
                                <textarea
                                    ref={textareaRef}
                                    value={code}
                                    onChange={(e) => handleCodeChange(e.target.value)}
                                    onBlur={() => saveFileContent()}
                                    onKeyDown={handleKeyDown}
                                    onSelect={updateCursorPosition}
                                    onScroll={handleScroll}
                                    placeholder="Write your Python code here..."
                                    className={`absolute inset-0 w-full h-full p-4 font-mono focus:outline-none focus:ring-0 resize-none overflow-y-auto scrollbar-hidden ${darkMode ? 'bg-transparent text-transparent' : 'bg-transparent text-transparent'} transition-colors duration-300`}
                                    spellCheck="false"
                                    style={{
                                        color: 'transparent',
                                        caretColor: darkMode ? 'white' : 'black',
                                        zIndex: 1,
                                        fontSize: `${fontSize}px`,
                                        lineHeight: '1.5rem',
                                    }}
                                    aria-label="Code Editor"
                                />
                            </div>
                        </div>
                        <div className={`flex justify-end gap-2 px-4 py-3 border-t ${darkMode ? 'bg-gray-800 border-gray-600' : 'bg-white border-gray-200'} transition-colors duration-300`}>
                            <div className="flex-1 flex items-center text-xs text-gray-500">
                                <div className="flex items-center gap-1">
                                    <Zap className="w-3 h-3" />
                                    <span>
                                        Shortcuts: <kbd className="px-1 py-0.5 rounded bg-gray-200 dark:bg-gray-700">Ctrl+Enter</kbd> to Run | 
                                        <kbd className="px-1 py-0.5 rounded bg-gray-200 dark:bg-gray-700 ml-1">Ctrl+S</kbd> to Save | 
                                        <kbd className="px-1 py-0.5 rounded bg-gray-200 dark:bg-gray-700 ml-1">Ctrl+R</kbd> to Test
                                    </span>
                                </div>
                            </div>
                            <button
                                onClick={saveFileContent}
                                className={`inline-flex items-center px-3 py-1.5 border border-transparent text-sm font-medium rounded-md shadow-sm ${darkMode ? 'bg-gray-700 hover:bg-gray-600 text-white' : 'bg-gray-200 hover:bg-gray-300 text-gray-800'} transition-colors duration-200`}
                                title="Save File (Ctrl+S)"
                            >
                                <Save className="w-4 h-4 mr-1" />
                                Save
                            </button>
                            <button
                                onClick={handleProcessCode}
                                disabled={isCheckLoading}
                                className={`inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white ${darkMode ? 'bg-green-700 hover:bg-green-800' : 'bg-green-600 hover:bg-green-700'} focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors duration-200`}
                                title="Generate Report (Ctrl+R)"
                            >
                                {isCheckLoading ? (
                                    <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent mr-2" />
                                ) : isDownloadReady ? (
                                    <Download className="w-4 h-4 mr-2" />
                                ) : (
                                    <FileText className="w-4 h-4 mr-2" />
                                )}
                                {isCheckLoading ? 'Processing...' : isDownloadReady ? 'Download Report' : 'Test Check'}
                            </button>
                            <button
                                onClick={handleRunCode}
                                disabled={isLoading}
                                className={`inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white ${darkMode ? 'bg-blue-700 hover:bg-blue-800' : 'bg-blue-600 hover:bg-blue-700'} focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors duration-200`}
                                title="Run Code (Ctrl+Enter)"
                            >
                                {isLoading ? (
                                    <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent mr-2" />
                                ) : (
                                    <Play className="w-4 h-4 mr-2" />
                                )}
                                {isLoading ? 'Running...' : 'Run Code'}
                            </button>
                        </div>
                    </div>

                    <div
                        className={`h-2 cursor-ns-resize flex justify-center items-center ${darkMode ? 'bg-gray-700 hover:bg-gray-600' : 'bg-gray-200 hover:bg-gray-300'} transition-colors duration-200`}
                        onMouseDown={(e) => {
                            e.preventDefault();
                            document.addEventListener('mousemove', handleSplitDrag);
                            document.addEventListener('mouseup', () => {
                                document.removeEventListener('mousemove', handleSplitDrag);
                            }, { once: true });
                        }}
                    >
                        <div className={`w-20 h-1 rounded-full ${darkMode ? 'bg-gray-600' : 'bg-gray-300'}`}></div>
                    </div>

                    <div className="flex-1 flex flex-col" style={{ height: `${100 - splitPosition}%` }}>
                        <div className={`px-4 py-2 ${darkMode ? 'bg-gray-700' : 'bg-gray-100'} border-b ${darkMode ? 'border-gray-600' : 'border-gray-200'} transition-colors duration-300 flex justify-between items-center`}>
                            <h2 className="text-sm font-medium flex items-center gap-2">
                                <Zap className="w-4 h-4" /> Output Console
                            </h2>
                        </div>
                        <div className={`flex-1 p-4 overflow-auto ${darkMode ? 'bg-gray-900' : 'bg-white'} transition-colors duration-300`}>
                            {!output && !error ? (
                                <div className="h-full flex items-center justify-center text-gray-500 text-sm italic">
                                    Run your code to see the output here
                                </div>
                            ) : (
                                <div className={`rounded-lg border ${darkMode ? 'border-gray-700' : 'border-gray-200'} overflow-hidden transition-colors duration-300`}>
                                    {output && (
                                        <div className={`border-l-4 border-green-500 p-4 ${darkMode ? 'bg-gray-800' : 'bg-gray-50'}`}>
                                            <div className="flex items-start">
                                                <Check className={`h-5 w-5 ${darkMode ? 'text-green-400' : 'text-green-500'} mr-2 mt-0.5`} />
                                                <div>
                                                    <h3 className={`text-sm font-medium ${darkMode ? 'text-green-400' : 'text-green-600'} mb-2`}>Success</h3>
                                                    <pre className={`text-sm font-mono whitespace-pre-wrap ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                                                        {output}
                                                    </pre>
                                                </div>
                                            </div>
                                        </div>
                                    )}
                                    {error && (
                                        <div className={`border-l-4 border-red-500 p-4 ${darkMode ? 'bg-gray-800' : 'bg-gray-50'}`}>
                                            <div className="flex items-start">
                                                <AlertTriangle className={`h-5 w-5 ${darkMode ? 'text-red-400' : 'text-red-500'} mr-2 mt-0.5`} />
                                                <div>
                                                    <h3 className={`text-sm font-medium ${darkMode ? 'text-red-400' : 'text-red-600'} mb-2`}>Error</h3>
                                                    <pre className={`text-sm font-mono whitespace-pre-wrap ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                                                        {error}
                                                    </pre>
                                                </div>
                                            </div>
                                        </div>
                                    )}
                                </div>
                            )}
                        </div>
                        <div className={`py-2 px-4 ${darkMode ? 'bg-gray-800 text-gray-400' : 'bg-gray-50 text-gray-600'} text-xs flex items-center border-t ${darkMode ? 'border-gray-700' : 'border-gray-200'} transition-colors duration-300`}>
                            <div className="mr-4">
                                Lines: {code.split('\n').length} | Characters: {code.length}
                            </div>
                            <div>
                                Cursor: Line {cursorPosition.line}, Column {cursorPosition.col}
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default CodeCompiler;