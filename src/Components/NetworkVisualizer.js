import React, { useState, useRef, useEffect } from 'react';
import { Server, Laptop, Router as RouterIcon, Wifi, Trash2, Sun, Moon, Save } from 'lucide-react';
import { Tooltip } from 'react-tooltip';
import html2canvas from 'html2canvas';
import jsPDF from 'jspdf';

const METHODS = ['GET', 'POST', 'PUT', 'DELETE'];

const NetworkVisualizer = () => {
    const [nodes, setNodes] = useState({
        clients: [],
        servers: [],
        routers: [],
        accesspoints: [],
    });
    const [serverEndpoints, setServerEndpoints] = useState({});
    const [clientRequests, setClientRequests] = useState({});
    const [packets, setPackets] = useState([]);
    const [notifications, setNotifications] = useState([]);
    const [activeTab, setActiveTab] = useState('notifications');
    const [isDragging, setIsDragging] = useState(false);
    const [showEndpointModal, setShowEndpointModal] = useState(false);
    const [activeServerId, setActiveServerId] = useState(null);
    const [newEndpoint, setNewEndpoint] = useState({ path: '', method: 'GET' });
    const mainScreenRef = useRef(null);
    const [draggedNode, setDraggedNode] = useState(null);
    const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });
    const [requests, setRequests] = useState([]);
    const [selectedRequest, setSelectedRequest] = useState(null);
    const [routerRoutingTable, setRouterRoutingTable] = useState({});
    const [expandedClients, setExpandedClients] = useState({});
    const [expandedServers, setExpandedServers] = useState({});
    const [expandedRouters, setExpandedRouters] = useState({});
    const [expandedAccessPoints, setExpandedAccessPoints] = useState({});
    const [darkMode, setDarkMode] = useState(false);
    const [stats, setStats] = useState({ totalRequests: 0, success: 0, failed: 0, avgLatency: 0 });

    useEffect(() => {
        const cleanup = setTimeout(() => {
            setPackets(packets.filter(packet => packet.status !== 'complete'));
        }, 2000);
        return () => clearTimeout(cleanup);
    }, [packets]);

    const addNode = (type, x, y) => {
        const newNode = {
            id: `${type}-${Date.now()}`,
            type,
            x,
            y,
            name: `${type.charAt(0).toUpperCase() + type.slice(1)}-${nodes[`${type}s`].length + 1}`,
            status: 'online',
        };
        if (type === 'client') {
            setClientRequests(prev => ({
                ...prev,
                [newNode.id]: {
                    selectedRouter: '',
                    selectedAccessPoint: '',
                    method: 'GET',
                    requestBody: '{\n  "key": "value"\n}',
                    path: ''
                }
            }));
            setExpandedClients(prev => ({ ...prev, [newNode.id]: false }));
        } else if (type === 'server') {
            setServerEndpoints(prev => ({ ...prev, [newNode.id]: [] }));
            setRouterRoutingTable(prev => ({ ...prev, [newNode.id]: null }));
            setExpandedServers(prev => ({ ...prev, [newNode.id]: false }));
        } else if (type === 'router') {
            setExpandedRouters(prev => ({ ...prev, [newNode.id]: false }));
        } else if (type === 'accesspoint') {
            setExpandedAccessPoints(prev => ({ ...prev, [newNode.id]: false }));
        }
        setNodes(prev => ({
            ...prev,
            [`${type}s`]: [...(prev[`${type}s`] || []), newNode]
        }));
    };

    const deleteNode = (node) => {
        setNodes(prev => ({
            ...prev,
            [node.type + 's']: prev[node.type + 's'].filter(n => n.id !== node.id)
        }));
        if (node.type === 'client') {
            setClientRequests(prev => {
                const { [node.id]: _, ...rest } = prev;
                return rest;
            });
            setExpandedClients(prev => {
                const { [node.id]: _, ...rest } = prev;
                return rest;
            });
        } else if (node.type === 'server') {
            setServerEndpoints(prev => {
                const { [node.id]: _, ...rest } = prev;
                return rest;
            });
            setExpandedServers(prev => {
                const { [node.id]: _, ...rest } = prev;
                return rest;
            });
            setRouterRoutingTable(prev => {
                const newTable = { ...prev };
                Object.keys(newTable).forEach(routerId => {
                    if (newTable[routerId] === node.id) newTable[routerId] = null;
                });
                return newTable;
            });
        } else if (node.type === 'router') {
            setExpandedRouters(prev => {
                const { [node.id]: _, ...rest } = prev;
                return rest;
            });
            setRouterRoutingTable(prev => {
                const { [node.id]: _, ...rest } = prev;
                return rest;
            });
        } else if (node.type === 'accesspoint') {
            setExpandedAccessPoints(prev => {
                const { [node.id]: _, ...rest } = prev;
                return rest;
            });
        }
    };

    const handleDrop = (e) => {
        e.preventDefault();
        const type = e.dataTransfer.getData('nodeType');
        if (!type) return;
        const rect = mainScreenRef.current.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const y = e.clientY - rect.top;
        addNode(type, x, y);
        setIsDragging(false);
    };

    const openEndpointModal = (serverId) => {
        setActiveServerId(serverId);
        setShowEndpointModal(true);
    };

    const addEndpoint = () => {
        if (!newEndpoint.path || !activeServerId) return;
        setServerEndpoints(prev => ({
            ...prev,
            [activeServerId]: [
                ...prev[activeServerId],
                { id: `endpoint-${Date.now()}`, ...newEndpoint }
            ]
        }));
        setShowEndpointModal(false);
        setNewEndpoint({ path: '', method: 'GET' });
        setActiveServerId(null);
    };

    const removeEndpoint = (serverId, endpointId) => {
        setServerEndpoints(prev => ({
            ...prev,
            [serverId]: prev[serverId].filter(endpoint => endpoint.id !== endpointId)
        }));
    };

    const handleRequestChange = (clientId, field, value) => {
        setClientRequests(prev => ({
            ...prev,
            [clientId]: { ...prev[clientId], [field]: value }
        }));
    };

    const handleNodeDragStart = (e, node) => {
        setDraggedNode(node);
        setDragOffset({ x: e.clientX - node.x, y: e.clientY - node.y });
    };

    const handleNodeDrag = (e) => {
        if (!draggedNode) return;
        const rect = mainScreenRef.current.getBoundingClientRect();
        const newX = e.clientX - rect.left - dragOffset.x;
        const newY = e.clientY - rect.top - dragOffset.y;
        setNodes(prev => ({
            ...prev,
            [draggedNode.type + 's']: prev[draggedNode.type + 's'].map(n =>
                n.id === draggedNode.id ? { ...n, x: newX, y: newY } : n
            )
        }));
    };

    const handleNodeDragEnd = () => {
        setDraggedNode(null);
    };

    const isValidUrl = (url) => {
        try {
            new URL(url);
            return true;
        } catch {
            return false;
        }
    };

    const sendRequest = async (clientId) => {
        const request = clientRequests[clientId];
        
        if (!request?.selectedAccessPoint) {
            setNotifications(prev => [...prev, {
                id: `notif-${Date.now()}`,
                type: 'error',
                message: 'Please select an Access Point first',
                timestamp: new Date().toLocaleTimeString()
            }]);
            return;
        }
        
        if (!request?.selectedRouter) {
            setNotifications(prev => [...prev, {
                id: `notif-${Date.now()}`,
                type: 'error',
                message: 'Please select a router first',
                timestamp: new Date().toLocaleTimeString()
            }]);
            return;
        }

        const client = nodes.clients.find(c => c.id === clientId);
        const accessPoint = nodes.accesspoints.find(ap => ap.id === request.selectedAccessPoint);
        const router = nodes.routers.find(r => r.id === request.selectedRouter);
        const serverId = routerRoutingTable[router?.id] || null;
        const server = nodes.servers.find(s => s.id === serverId);

        if (!serverId || !server) {
            setNotifications(prev => [...prev, {
                id: `notif-${Date.now()}`,
                type: 'error',
                message: 'No server routed for the router',
                timestamp: new Date().toLocaleTimeString()
            }]);
            return;
        }

        const endpoints = serverEndpoints[serverId] || [];

        const getPathFromUrl = (url) => {
            try {
                const parsedUrl = new URL(url);
                return parsedUrl.pathname;
            } catch {
                return url.startsWith('/') ? url : `/${url}`;
            }
        };

        const requestPath = getPathFromUrl(request.path);
        const matchingEndpoint = endpoints.find(endpoint => {
            const endpointPath = getPathFromUrl(endpoint.path);
            return endpointPath === requestPath && endpoint.method === request.method;
        });

        if (!matchingEndpoint) {
            setNotifications(prev => [...prev, {
                id: `notif-${Date.now()}`,
                type: 'error',
                message: `No matching endpoint found for ${server.name} at ${request.path} with ${request.method}`,
                timestamp: new Date().toLocaleTimeString()
            }]);
            return;
        }

        if (!isValidUrl(matchingEndpoint.path)) {
            setNotifications(prev => [...prev, {
                id: `notif-${Date.now()}`,
                type: 'error',
                message: 'Invalid endpoint URL',
                timestamp: new Date().toLocaleTimeString()
            }]);
            return;
        }

        const packetId = `packet-${Date.now()}`;
        setPackets(prev => [...prev, {
            id: packetId,
            from: client,
            to: accessPoint,
            method: request.method,
            status: 'sending',
            phase: 'client-ap',
            data: request.requestBody
        }]);

        const startTime = Date.now();
        setStats(prev => ({ ...prev, totalRequests: prev.totalRequests + 1 }));

        try {
            await new Promise(resolve => setTimeout(resolve, 500));
            setPackets(prev => prev.map(p =>
                p.id === packetId ? { ...p, status: 'processing', phase: 'ap-router' } : p
            ));

            setPackets(prev => [...prev, {
                id: `packet-ap-router-${Date.now()}`,
                from: accessPoint,
                to: router,
                method: request.method,
                status: 'sending',
                phase: 'ap-router',
                data: request.requestBody
            }]);

            await new Promise(resolve => setTimeout(resolve, 500));
            setPackets(prev => prev.map(p =>
                p.id === `packet-ap-router-${Date.now()}` ? { ...p, status: 'processing', phase: 'router-server' } : p
            ));

            setPackets(prev => [...prev, {
                id: `packet-server-${Date.now()}`,
                from: router,
                to: server,
                method: request.method,
                status: 'sending',
                phase: 'router-server',
                data: request.requestBody
            }]);

            const response = await fetch(matchingEndpoint.path, {
                method: request.method,
                headers: { 'Content-Type': 'application/json' },
                body: ['POST', 'PUT', 'PATCH'].includes(request.method)
                    ? request.requestBody
                    : undefined,
            });

            const data = await response.json();
            const endTime = Date.now();
            const latency = endTime - startTime;

            setPackets(prev => prev.map(p =>
                (p.id === packetId || p.id.includes('packet-ap-router') || p.id.includes('packet-server')) 
                    ? { ...p, status: 'complete' } 
                    : p
            ));

            setNotifications(prev => [...prev, {
                id: `notif-${Date.now()}`,
                type: response.ok ? 'success' : 'error',
                clientId,
                response: {
                    status: response.status,
                    method: request.method,
                    from: server.name,
                    to: client.name,
                    data: JSON.stringify(data, null, 2),
                    timestamp: new Date().toLocaleTimeString()
                }
            }]);

            setStats(prev => ({
                ...prev,
                success: response.ok ? prev.success + 1 : prev.success,
                failed: response.ok ? prev.failed : prev.failed + 1,
                avgLatency: (prev.avgLatency * (prev.totalRequests - 1) + latency) / prev.totalRequests
            }));

            const id = addRequest(request.method, matchingEndpoint.path, request.requestBody);
            setTimeout(() => {
                updateRequest(id, {
                    data: data,
                    status: response.status
                }, response.ok ? 'success' : 'error');
            }, Math.random() * 1000 + 500);

        } catch (error) {
            const endTime = Date.now();
            const latency = endTime - startTime;

            setPackets(prev => prev.map(p =>
                (p.id === packetId || p.id.includes('packet-ap-router') || p.id.includes('packet-server')) 
                    ? { ...p, status: 'error' } 
                    : p
            ));

            setNotifications(prev => [...prev, {
                id: `notif-${Date.now()}`,
                type: 'error',
                clientId,
                response: {
                    status: 500,
                    method: request.method,
                    from: server.name,
                    to: client.name,
                    data: JSON.stringify({ error: error.message }, null, 2),
                    timestamp: new Date().toLocaleTimeString()
                }
            }]);

            setStats(prev => ({
                ...prev,
                failed: prev.failed + 1,
                avgLatency: (prev.avgLatency * (prev.totalRequests - 1) + latency) / prev.totalRequests
            }));

            const id = addRequest(request.method, matchingEndpoint.path, request.requestBody);
            updateRequest(id, {
                error: { message: error.message },
                status: 500
            }, 'error');
        }
    };

    const addRequest = (method, url, requestData) => {
        const newRequest = {
            id: Date.now(),
            timestamp: new Date().toISOString(),
            method,
            url,
            requestData,
            status: 'pending',
            response: null,
            duration: 0
        };
        setRequests(prev => [newRequest, ...prev].slice(0, 10));
        return newRequest.id;
    };

    const updateRequest = (id, response, status) => {
        setRequests(prev => prev.map(req =>
            req.id === id
                ? { ...req, response, status, duration: Math.floor(Math.random() * 500) + 100 }
                : req
        ));
    };

    const removeNotification = (notificationId) => {
        setNotifications(prev => prev.filter(n => n.id !== notificationId));
    };

    const getStatusColor = (status) => {
        switch (status) {
            case 'pending': return 'text-yellow-500';
            case 'success': return 'text-green-500';
            case 'error': return 'text-red-500';
            default: return 'text-gray-500';
        }
    };

    const getMethodColor = (method) => {
        switch (method) {
            case 'GET': return 'bg-blue-500';
            case 'POST': return 'bg-green-500';
            case 'PUT': return 'bg-yellow-500';
            case 'PATCH': return 'bg-purple-500';
            case 'DELETE': return 'bg-red-500';
            default: return 'bg-gray-500';
        }
    };

    const handleTabClick = (tabName) => {
        setActiveTab(tabName);
    };

    const handleServerRouterSelect = (routerId, serverId) => {
        setRouterRoutingTable(prev => ({ ...prev, [routerId]: serverId }));
    };

    const toggleClientExpand = (clientId) => {
        setExpandedClients(prev => ({ ...prev, [clientId]: !prev[clientId] }));
    };

    const toggleServerExpand = (serverId) => {
        setExpandedServers(prev => ({ ...prev, [serverId]: !prev[serverId] }));
    };

    const toggleRouterExpand = (routerId) => {
        setExpandedRouters(prev => ({ ...prev, [routerId]: !prev[routerId] }));
    };

    const toggleAccessPointExpand = (apId) => {
        setExpandedAccessPoints(prev => ({ ...prev, [apId]: !prev[apId] }));
    };

    const toggleDarkMode = () => {
        setDarkMode(prev => !prev);
    };

    const saveNetworkConfigAsPDF = async () => {
        try {
            // Capture the main canvas area
            const canvas = await html2canvas(mainScreenRef.current, {
                scale: 2, // Increase resolution for better quality
                useCORS: true,
                backgroundColor: darkMode ? '#1F2937' : '#F3F4F6', // Match the background color
            });

            const imgData = canvas.toDataURL('image/png');
            const pdf = new jsPDF({
                orientation: 'landscape', // Use landscape orientation for better fit
                unit: 'px',
                format: [canvas.width, canvas.height]
            });

            // Add the image to the PDF
            pdf.addImage(imgData, 'PNG', 0, 0, canvas.width, canvas.height);

            // Add a title to the PDF
            pdf.setFontSize(20);
            pdf.text('Network Topology', 20, 30);

            // Add some metadata
            pdf.setFontSize(12);
            pdf.text(`Generated on: ${new Date().toLocaleString()}`, 20, 50);
            pdf.text(`Total Nodes: ${[...nodes.clients, ...nodes.servers, ...nodes.routers, ...nodes.accesspoints].length}`, 20, 70);

            // Save the PDF
            pdf.save('network-topology.pdf');

            setNotifications(prev => [...prev, {
                id: `notif-${Date.now()}`,
                type: 'success',
                message: 'Network topology saved as PDF!',
                timestamp: new Date().toLocaleTimeString()
            }]);
        } catch (error) {
            setNotifications(prev => [...prev, {
                id: `notif-${Date.now()}`,
                type: 'error',
                message: 'Failed to save network as PDF: ' + error.message,
                timestamp: new Date().toLocaleTimeString()
            }]);
        }
    };

    const getConnections = () => {
        const connections = [];
        nodes.clients.forEach(client => {
            const request = clientRequests[client.id];
            if (request?.selectedAccessPoint) {
                const ap = nodes.accesspoints.find(a => a.id === request.selectedAccessPoint);
                if (ap) connections.push({ from: client, to: ap });
            }
            if (request?.selectedRouter) {
                const router = nodes.routers.find(r => r.id === request.selectedRouter);
                const ap = nodes.accesspoints.find(a => a.id === request.selectedAccessPoint);
                if (router && ap) connections.push({ from: ap, to: router });
                const serverId = routerRoutingTable[router?.id];
                const server = nodes.servers.find(s => s.id === serverId);
                if (server) connections.push({ from: router, to: server });
            }
        });
        return connections;
    };

    return (
        <div className={`h-screen flex ${darkMode ? 'bg-gray-900 text-white' : 'bg-gray-50 text-black'}`}>
            {/* Sidebar */}
            <div className={`w-48 ${darkMode ? 'bg-gray-800' : 'bg-gray-100'} p-4 border-r`}>
                <div className="flex justify-between items-center mb-4">
                    <h2 className="text-lg font-semibold">Components</h2>
                    <button onClick={toggleDarkMode} className="p-1 rounded-full hover:bg-gray-200 dark:hover:bg-gray-700">
                        {darkMode ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
                    </button>
                </div>
                <div draggable onDragStart={e => { e.dataTransfer.setData('nodeType', 'client'); setIsDragging(true); }} className={`mb-4 p-3 ${darkMode ? 'bg-gray-700' : 'bg-white'} rounded border cursor-move ${darkMode ? 'hover:bg-gray-600' : 'hover:bg-gray-50'}`}>
                    <div className="flex items-center gap-2"><Laptop className="w-5 h-5" /><span>Client</span></div>
                </div>
                <div draggable onDragStart={e => { e.dataTransfer.setData('nodeType', 'accesspoint'); setIsDragging(true); }} className={`mb-4 p-3 ${darkMode ? 'bg-gray-700' : 'bg-white'} rounded border cursor-move ${darkMode ? 'hover:bg-gray-600' : 'hover:bg-gray-50'}`}>
                    <div className="flex items-center gap-2"><Wifi className="w-5 h-5" /><span>Access Point</span></div>
                </div>
                <div draggable onDragStart={e => { e.dataTransfer.setData('nodeType', 'server'); setIsDragging(true); }} className={`mb-4 p-3 ${darkMode ? 'bg-gray-700' : 'bg-white'} rounded border cursor-move ${darkMode ? 'hover:bg-gray-600' : 'hover:bg-gray-50'}`}>
                    <div className="flex items-center gap-2"><Server className="w-5 h-5" /><span>Server</span></div>
                </div>
                <div draggable onDragStart={e => { e.dataTransfer.setData('nodeType', 'router'); setIsDragging(true); }} className={`mb-4 p-3 ${darkMode ? 'bg-gray-700' : 'bg-white'} rounded border cursor-move ${darkMode ? 'hover:bg-gray-600' : 'hover:bg-gray-50'}`}>
                    <div className="flex items-center gap-2"><RouterIcon className="w-5 h-5" /><span>Router</span></div>
                </div>
                <div className="flex gap-2">
                    <button onClick={saveNetworkConfigAsPDF} className={`flex-1 p-2 ${darkMode ? 'bg-blue-600 hover:bg-blue-700' : 'bg-blue-500 hover:bg-blue-600'} text-white rounded flex items-center justify-center gap-1`}>
                        <Save className="w-4 h-4" /> Save as PDF
                    </button>
                </div>
            </div>

            {/* Main Canvas */}
            <div className="flex-1 flex" onMouseMove={handleNodeDrag} onMouseUp={handleNodeDragEnd}>
                <div ref={mainScreenRef} className={`flex-1 ${darkMode ? 'bg-gray-800' : 'bg-gray-100'} relative overflow-hidden ${isDragging ? (darkMode ? 'bg-gray-700' : 'bg-gray-200') : ''}`} onDrop={handleDrop} onDragOver={e => e.preventDefault()}>
                    {/* Connection Lines */}
                    {getConnections().map((conn, idx) => {
                        const x1 = conn.from.x + 80;
                        const y1 = conn.from.y + 20;
                        const x2 = conn.to.x + 80;
                        const y2 = conn.to.y + 20;
                        return (
                            <svg key={`conn-${idx}`} className="absolute top-0 left-0 w-full h-full pointer-events-none">
                                <line x1={x1} y1={y1} x2={x2} y2={y2} stroke={darkMode ? '#a0aec0' : '#4a5568'} strokeWidth="2" strokeDasharray="5,5" />
                            </svg>
                        );
                    })}

                    {/* Nodes */}
                    {[...nodes.clients, ...nodes.servers, ...nodes.routers, ...nodes.accesspoints].map(node => (
                        <div
                            key={node.id}
                            draggable
                            onDragStart={(e) => handleNodeDragStart(e, node)}
                            className={`absolute p-2 min-w-[160px] ${darkMode ? 'bg-gray-700 border-gray-600' : 'bg-white border-gray-200'} rounded-lg shadow-lg cursor-move border ${((node.type === 'client' && expandedClients[node.id]) || (node.type === 'server' && expandedServers[node.id]) || (node.type === 'router' && expandedRouters[node.id]) || (node.type === 'accesspoint' && expandedAccessPoints[node.id])) ? 'min-w-[280px]' : ''}`}
                            style={{ left: node.x, top: node.y }}
                            data-tooltip-id={`tooltip-${node.id}`}
                            data-tooltip-content={`${node.name} (${node.status})`}
                        >
                            <div className="flex items-center justify-between">
                                <div className="flex items-center gap-2" onDoubleClick={() => {
                                    if (node.type === 'client') toggleClientExpand(node.id);
                                    if (node.type === 'server') toggleServerExpand(node.id);
                                    if (node.type === 'router') toggleRouterExpand(node.id);
                                    if (node.type === 'accesspoint') toggleAccessPointExpand(node.id);
                                }}>
                                    {node.type === 'client' && <Laptop className="w-5 h-5" />}
                                    {node.type === 'accesspoint' && <Wifi className="w-5 h-5" />}
                                    {node.type === 'server' && <Server className="w-5 h-5" />}
                                    {node.type === 'router' && <RouterIcon className="w-5 h-5" />}
                                    <span className="font-medium text-sm">{node.name}</span>
                                    <span className={`w-3 h-3 rounded-full ${node.status === 'online' ? 'bg-green-500' : 'bg-red-500'}`}></span>
                                </div>
                                <button onClick={() => deleteNode(node)} className="text-red-500 hover:text-red-700">
                                    <Trash2 className="w-4 h-4" />
                                </button>
                            </div>
                            {(node.type === 'client' && expandedClients[node.id]) && (
                                <div className="space-y-2 mt-2">
                                    <select value={clientRequests[node.id]?.selectedAccessPoint || ''} onChange={e => handleRequestChange(node.id, 'selectedAccessPoint', e.target.value)} className={`w-full p-1 ${darkMode ? 'bg-gray-600 border-gray-500' : 'bg-white border-gray-300'} border rounded text-sm`}>
                                        <option value="">Select Access Point</option>
                                        {nodes.accesspoints.map(ap => <option key={ap.id} value={ap.id}>{ap.name}</option>)}
                                    </select>
                                    <select value={clientRequests[node.id]?.selectedRouter || ''} onChange={e => handleRequestChange(node.id, 'selectedRouter', e.target.value)} className={`w-full p-1 ${darkMode ? 'bg-gray-600 border-gray-500' : 'bg-white border-gray-300'} border rounded text-sm`}>
                                        <option value="">Select Router</option>
                                        {nodes.routers.map(router => <option key={router.id} value={router.id}>{router.name}</option>)}
                                    </select>
                                    <input type="text" value={clientRequests[node.id]?.path || ''} onChange={e => handleRequestChange(node.id, 'path', e.target.value)} className={`w-full p-1 ${darkMode ? 'bg-gray-600 border-gray-500' : 'bg-white border-gray-300'} border rounded text-sm`} placeholder="API Path" />
                                    <select value={clientRequests[node.id]?.method || 'GET'} onChange={e => handleRequestChange(node.id, 'method', e.target.value)} className={`w-full p-1 ${darkMode ? 'bg-gray-600 border-gray-500' : 'bg-white border-gray-300'} border rounded text-sm`}>
                                        {METHODS.map(method => <option key={method} value={method}>{method}</option>)}
                                    </select>
                                    <textarea value={clientRequests[node.id]?.requestBody || ''} onChange={e => handleRequestChange(node.id, 'requestBody', e.target.value)} className={`w-full p-1 ${darkMode ? 'bg-gray-600 border-gray-500' : 'bg-white border-gray-300'} border rounded text-sm`} rows={3} placeholder="Request body" />
                                    <button onClick={() => sendRequest(node.id)} className="w-full bg-blue-500 text-white px-3 py-1 rounded hover:bg-blue-600 text-sm">Send</button>
                                </div>
                            )}
                            {(node.type === 'server' && expandedServers[node.id]) && (
                                <div className="space-y-2 mt-2">
                                    <button onClick={() => openEndpointModal(node.id)} className="w-full bg-green-500 text-white px-3 py-1 rounded hover:bg-green-600 text-sm">Add Endpoint</button>
                                    {(serverEndpoints[node.id] || []).map(endpoint => (
                                        <div key={endpoint.id} className={`border ${darkMode ? 'border-gray-600' : 'border-gray-200'} rounded p-2 mb-2`}>
                                            <div className="flex items-center justify-between mb-1">
                                                <span className="text-xs text-gray-400">{endpoint.path}</span>
                                                <span className="text-xs text-gray-400">{endpoint.method}</span>
                                            </div>
                                            <button onClick={() => removeEndpoint(node.id, endpoint.id)} className="w-full bg-red-500 text-white px-3 py-1 rounded hover:bg-red-600 text-sm">Remove</button>
                                        </div>
                                    ))}
                                </div>
                            )}
                            {(node.type === 'router' && expandedRouters[node.id]) && (
                                <div className="space-y-2 mt-2">
                                    <select value={routerRoutingTable[node.id] || ''} onChange={e => handleServerRouterSelect(node.id, e.target.value)} className={`w-full p-1 ${darkMode ? 'bg-gray-600 border-gray-500' : 'bg-white border-gray-300'} border rounded text-sm`}>
                                        <option value="">Route to Server</option>
                                        {nodes.servers.map(server => <option key={server.id} value={server.id}>{server.name}</option>)}
                                    </select>
                                </div>
                            )}
                            {(node.type === 'accesspoint' && expandedAccessPoints[node.id]) && (
                                <div className="space-y-2 mt-2">
                                    <p className="text-xs text-gray-400">Access Point Settings</p>
                                </div>
                            )}
                            <Tooltip id={`tooltip-${node.id}`} place="top" />
                        </div>
                    ))}

                    {/* Packet Animation */}
                    {packets.map(packet => {
                        if (packet.status === 'sending' || packet.status === 'processing') {
                            let startNode = packet.from;
                            let endNode = packet.to;

                            const x1 = startNode.x + 80;
                            const y1 = startNode.y + 20;
                            const x2 = endNode.x + 80;
                            const y2 = endNode.y + 20;

                            const angle = Math.atan2(y2 - y1, x2 - x1);
                            const dist = Math.sqrt((x2 - x1) ** 2 + (y2 - y1) ** 2);
                            const packetSize = 20;

                            return (
                                <div
                                    key={packet.id}
                                    className={`absolute rounded-full ${darkMode ? 'bg-blue-400' : 'bg-blue-500'} transition-all duration-200 flex items-center justify-center text-xs text-white font-medium shadow-md`}
                                    style={{
                                        width: packetSize,
                                        height: packetSize,
                                        left: x1 - packetSize / 2,
                                        top: y1 - packetSize / 2,
                                        transformOrigin: `${packetSize / 2}px ${packetSize / 2}px`,
                                        animation: `${dist / 300}s linear 0s 1 normal forwards movePacket`,
                                        animationTimingFunction: 'linear',
                                        animationDelay: `${packet.phase === 'ap-router' ? '0.5s' : packet.phase === 'router-server' ? '1s' : '0s'}`,
                                        '--x1': `${x1}px`,
                                        '--y1': `${y1}px`,
                                        '--x2': `${x2}px`,
                                        '--y2': `${y2}px`,
                                        '--angle': `${angle}rad`
                                    }}
                                    data-tooltip-id={`packet-tooltip-${packet.id}`}
                                    data-tooltip-content={`Packet: ${packet.method}\nData: ${packet.data}`}
                                >
                                    {packet.method}
                                    <Tooltip id={`packet-tooltip-${packet.id}`} place="top" />
                                </div>
                            );
                        }
                        return null;
                    })}
                </div>

                {/* Right Panel */}
                <div className={`w-70 ${darkMode ? 'bg-gray-800' : 'bg-gray-50'} p-4 border-l overflow-y-auto`}>
                    <div className="flex border-b">
                        <button onClick={() => handleTabClick('notifications')} className={`px-6 py-2 text-sm border-b-2 ${activeTab === 'notifications' ? 'border-blue-500 text-blue-700 font-medium' : 'border-transparent hover:border-gray-300 text-gray-600 dark:text-gray-300'}`}>Notifications</button>
                        <button onClick={() => handleTabClick('packetFlow')} className={`px-6 py-2 text-sm border-b-2 ${activeTab === 'packetFlow' ? 'border-blue-500 text-blue-700 font-medium' : 'border-transparent hover:border-gray-300 text-gray-600 dark:text-gray-300'}`}>PacketFlow</button>
                        <button onClick={() => handleTabClick('stats')} className={`px-6 py-2 text-sm border-b-2 ${activeTab === 'stats' ? 'border-blue-500 text-blue-700 font-medium' : 'border-transparent hover:border-gray-300 text-gray-100 dark:text-gray-300'}`}>Stats</button>
                    </div>
                    {activeTab === 'notifications' && (
                        <div className="space-y-3">
                            <h3 className="font-medium mb-4">Notifications</h3>
                            {notifications.map(notification => (
                                <div key={notification.id} className={`p-3 rounded text-sm ${notification.type === 'error' ? 'bg-red-50 dark:bg-red-900' : 'bg-green-50 dark:bg-green-900'}`}>
                                    <div className="flex justify-between items-start mb-1">
                                        <span className="font-medium">{notification.response?.method} {notification.response?.status}</span>
                                        <button onClick={() => removeNotification(notification.id)} className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300">×</button>
                                    </div>
                                    <div className="text-xs text-gray-500 dark:text-gray-400 mb-1">{notification.response?.from} → {notification.response?.to}</div>
                                    <pre className={`text-xs ${darkMode ? 'bg-gray-700' : 'bg-white'} p-2 rounded`}>{notification.response?.data}</pre>
                                    <div className="text-xs text-gray-400 dark:text-gray-500 mt-1">{notification.response?.timestamp}</div>
                                </div>
                            ))}
                        </div>
                    )}
                    {activeTab === 'packetFlow' && (
                        <div className="space-y-6">
                            <div className="space-y-4">
                                {requests.map((request) => (
                                    <div key={request.id} className={`border ${darkMode ? 'border-gray-600' : 'border-gray-200'} rounded-lg p-3 hover:bg-gray-100 dark:hover:bg-gray-700 cursor-pointer`} onClick={() => setSelectedRequest(request)}>
                                        <div className="flex items-center justify-between mb-2">
                                            <div className="flex items-center space-x-1">
                                                <span className={`${getMethodColor(request.method)} text-white px-1 py-0.5 rounded text-xs font-medium`}>{request.method}</span>
                                                <span className="text-xs font-mono">{request.url}</span>
                                            </div>
                                        </div>
                                        <div className="flex items-center justify-between mt-2 px-2">
                                            <div className="w-16 text-center"><div className="text-xs font-medium">Client</div></div>
                                            <div className="flex-1 flex items-center justify-center"><div className={`h-0.5 w-full ${request.status === 'pending' ? 'animate-pulse' : ''} ${getMethodColor(request.method)}`} /><span className={`${getStatusColor(request.status)} text-xs`}>→</span></div>
                                            <div className="w-16 text-center"><div className="text-xs font-medium">AP</div></div>
                                            <div className="flex-1 flex items-center justify-center"><div className={`h-0.5 w-full ${request.status === 'pending' ? 'animate-pulse' : ''} ${getMethodColor(request.method)}`} /><span className={`${getStatusColor(request.status)} text-xs`}>→</span></div>
                                            <div className="w-16 text-center"><div className="text-xs font-medium">Router</div></div>
                                            <div className="flex-1 flex items-center justify-center"><div className={`h-0.5 w-full ${request.status === 'pending' ? 'animate-pulse' : ''} ${getMethodColor(request.method)}`} /><span className={`${getStatusColor(request.status)} text-xs`}>→</span></div>
                                            <div className="w-16 text-center" style={{ position: 'relative' }}>
                                                <div className="text-xs font-medium p-2">Server</div>
                                                <div className={`flex items-center space-x-1 ${darkMode ? 'bg-gray-700' : 'bg-white'} px-2`} style={{ position: "absolute", top: '120%', left: '50%', transform: 'translate(-50%, -50%)' }}>
                                                    {request.status === 'pending' && <span className="animate-pulse text-yellow-500">•</span>}
                                                    {request.status === 'success' && <span className="text-green-500">✓</span>}
                                                    {request.status === 'error' && <span className="text-red-500">✕</span>}
                                                    <span className="text-xs text-gray-500 dark:text-gray-400">{request.duration}ms</span>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                            {selectedRequest && (
                                <div className={`border ${darkMode ? 'border-gray-600' : 'border-gray-200'} rounded-lg p-3`}>
                                    <div className="font-medium text-sm mb-2">Request Details</div>
                                    <div className="space-y-2">
                                        <div>
                                            <h4 className="font-medium text-xs">Request</h4>
                                            <pre className={`bg-gray-100 dark:bg-gray-700 p-2 rounded mt-1 text-xs`}>{JSON.stringify(selectedRequest.requestData, null, 2)}</pre>
                                        </div>
                                        {selectedRequest.response && (
                                            <div>
                                                <h4 className="font-medium text-xs">Response</h4>
                                                <pre className={`bg-gray-100 dark:bg-gray-700 p-2 rounded mt-1 text-xs`}>{JSON.stringify(selectedRequest.response, null, 2)}</pre>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            )}
                        </div>
                    )}
                    {activeTab === 'stats' && (
                        <div className="space-y-4">
                            <h3 className="font-medium mb-4">Network Statistics</h3>
                            <div className={`p-4 rounded-lg ${darkMode ? 'bg-gray-700' : 'bg-white'} shadow`}>
                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <p className="text-sm font-medium">Total Requests</p>
                                        <p className="text-lg">{stats.totalRequests}</p>
                                    </div>
                                    <div>
                                        <p className="text-sm font-medium">Success Rate</p>
                                        <p className="text-lg">{stats.totalRequests > 0 ? ((stats.success / stats.totalRequests) * 100).toFixed(1) : 0}%</p>
                                    </div>
                                    <div>
                                        <p className="text-sm font-medium">Failed Requests</p>
                                        <p className="text-lg">{stats.failed}</p>
                                    </div>
                                    <div>
                                        <p className="text-sm font-medium">Avg Latency</p>
                                        <p className="text-lg">{stats.avgLatency.toFixed(0)}ms</p>
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}
                </div>
            </div>

            {/* Add Endpoint Modal */}
            {showEndpointModal && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center">
                    <div className={`p-6 rounded-lg w-96 ${darkMode ? 'bg-gray-800 text-white' : 'bg-white text-black'}`}>
                        <h3 className="text-lg font-medium mb-4">Add New Endpoint</h3>
                        <div className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium mb-1">Path</label>
                                <input type="text" value={newEndpoint.path} onChange={e => setNewEndpoint(prev => ({ ...prev, path: e.target.value }))} placeholder="API Path" className={`w-full p-2 border ${darkMode ? 'bg-gray-700 border-gray-600' : 'bg-white border-gray-300'} rounded`} />
                            </div>
                            <div>
                                <label className="block text-sm font-medium mb-1">Method</label>
                                <select value={newEndpoint.method} onChange={e => setNewEndpoint(prev => ({ ...prev, method: e.target.value }))} className={`w-full p-2 border ${darkMode ? 'bg-gray-700 border-gray-600' : 'bg-white border-gray-300'} rounded`}>
                                    {METHODS.map(method => <option key={method} value={method}>{method}</option>)}
                                </select>
                            </div>
                            <div className="flex justify-end gap-2">
                                <button onClick={() => setShowEndpointModal(false)} className={`px-4 py-2 border ${darkMode ? 'border-gray-600 hover:bg-gray-700' : 'border-gray-300 hover:bg-gray-100'} rounded`}>Cancel</button>
                                <button onClick={addEndpoint} className="px-4 py-2 bg-green-500 text-white rounded hover:bg-green-600">Add</button>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* Loading Overlay */}
            {packets.some(p => p.status === 'sending' || p.status === 'processing') && (
                <div className="fixed inset-0 bg-black bg-opacity-20 flex items-center justify-center">
                    <div className={`p-4 rounded-lg shadow-lg ${darkMode ? 'bg-gray-800 text-white' : 'bg-white text-black'}`}>
                        <div className="flex items-center gap-3">
                            <div className="w-4 h-4 border-2 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
                            <span>Processing Request...</span>
                        </div>
                    </div>
                </div>
            )}

            {/* Error Toast */}
            {notifications.filter(n => n.type === 'error').slice(-1).map(error => (
                <div key={error.id} className="fixed bottom-4 right-4 bg-red-100 border-l-4 border-red-500 text-red-700 p-4 rounded shadow-lg" style={{ maxWidth: '24rem' }}>
                    <div className="flex items-start">
                        <div className="flex-shrink-0">
                            <svg className="h-5 w-5 text-red-400" viewBox="0 0 20 20" fill="currentColor">
                                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                            </svg>
                        </div>
                        <div className="ml-3">
                            <p className="text-sm">{error.message || error.response?.data}</p>
                        </div>
                        <div className="ml-auto pl-3">
                            <button onClick={() => removeNotification(error.id)} className="text-red-400 hover:text-red-500">
                                <svg className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                                    <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                                </svg>
                            </button>
                        </div>
                    </div>
                </div>
            ))}

            <style>{`
                @keyframes movePacket {
                    0% { transform: translate(0, 0); }
                    100% { transform: translate(calc(var(--x2) - var(--x1)), calc(var(--y2) - var(--y1))); }
                }
            `}</style>
        </div>
    );
};

export default NetworkVisualizer;