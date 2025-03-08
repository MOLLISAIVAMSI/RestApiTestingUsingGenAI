import React, { useState, useEffect,useRef } from 'react';
import axios from 'axios';
import { format } from 'date-fns';
import { 
  MoreVertical, 
  Download, 
  Edit2, 
  Trash2, 
  Check, 
  X,
  Loader2,
  FileText,
  Database,
  Calendar
} from 'lucide-react';
import { toast, ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

const ListedReports = () => {
  const [documents, setDocuments] = useState([]);
  const [editingId, setEditingId] = useState(null);
  const [newFileName, setNewFileName] = useState('');
  const [openMenuId, setOpenMenuId] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [Numdocuments, setNumDocuments] = useState(0);
  const menuRef = useRef(null);


  useEffect(() => {
    fetchDocuments();
  }, []);

  const fetchDocuments = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await axios.get('http://localhost:5100/api/documents');
      setDocuments(response.data);
    } catch (error) {
      setError('Error fetching documents. Please try again later.');
      console.error('Error fetching documents:', error);
    } finally {
      setLoading(false);
    }
  };
  
  const handleDownload = async (docId, filename) => {
    try {
      const response = await axios.get(`http://localhost:5100/api/documents/${docId}/download`, {
        responseType: 'blob'
      });
      toast.info(`Downloading ${filename}`, { autoClose: 3000 });
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', filename);
      document.body.appendChild(link);
      link.click();
      link.remove();
    } catch (error) {
      console.error('Error downloading document:', error);
      toast.error('Error downloading document. Please try again.', { autoClose: 3000 });
    }
  };

  const handleDelete = async (docId) => {
    if (window.confirm('Are you sure you want to delete this document?')) {
      try {
        await axios.delete(`http://localhost:5100/api/documents/${docId}`);
        setDocuments(documents.filter(doc => doc._id !== docId));
        toast.success('Document deleted successfully!', { autoClose: 3000 });
      } catch (error) {
        console.error('Error deleting document:', error);
        toast.error('Error deleting document. Please try again.', { autoClose: 3000 });
      }
    }
  };

  const startRename = (doc) => {
    setEditingId(doc._id);
    setNewFileName(doc.filename);
    setOpenMenuId(null);
  };

  const handleRename = async (docId) => {
    try {
      const response = await axios.patch(`http://localhost:5100/api/documents/${docId}`, {
        filename: newFileName
      });
      
      setDocuments(documents.map(doc => 
        doc._id === docId 
          ? { ...doc, filename: newFileName, _id: response.data._id }
          : doc
      ));
      
      setEditingId(null);
      setNewFileName('');
      toast.success('Document Renamed successfully!', { autoClose: 3000 });
    } catch (error) {
      console.error('Error renaming document:', error);
      toast.error('Error renaming document. Please try again.', { autoClose: 3000 });
    }
  };

  const cancelRename = () => {
    setEditingId(null);
    setNewFileName('');
  };

  const toggleMenu = (docId) => {
    setOpenMenuId(openMenuId === docId ? null : docId);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="w-8 h-8 animate-spin text-blue-500" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="container mx-auto p-6">
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded relative" role="alert">
          <strong className="font-bold">Error: </strong>
          <span className="block sm:inline">{error}</span>
        </div>
      </div>
    );
  }

  return (
    <div className="container h-full mx-auto p-6 backgroundCompiler">
      <h1 className="text-2xl px-6 font-bold mb-6 neon-text">Word Documents</h1>
      
      {documents.length === 0 ? (
        <div className="bg-gray-50 rounded-lg p-6 text-center text-gray-500">
          No documents found
        </div>
      ) : (
        <div className="bg-white rounded-lg shadow overflow-hidden border border-green-500">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="backgroundLists">
              <tr>
                <th className="px-24 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
                  Filename
                </th>
                <th className="px-12 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
                  Size
                </th>
                <th className="px-16 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
                  Date
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {documents.map((doc,index) => (
                <tr key={doc._id} className={`hover:bg-gray-50 ${index % 2 === 0 ? 'bg-white' : 'bg-gray-100'}`}>
                  <td className="px-6 py-4 whitespace-nowrap">
                    {editingId === doc._id ? (
                      <div className="flex items-center space-x-2">
                        <input
                          type="text"
                          value={newFileName}
                          onChange={(e) => setNewFileName(e.target.value)}
                          className="border rounded px-2 py-1 text-sm"
                        />
                        <button
                          onClick={() => handleRename(doc._id)}
                          className="text-green-600 hover:text-green-800"
                        >
                          <Check size={16} />
                        </button>
                        <button
                          onClick={cancelRename}
                          className="text-red-600 hover:text-red-800"
                        >
                          <X size={16} />
                        </button>
                      </div>
                    ) : (
                      <span className="flex items-center space-x-1">
                        <FileText size={16} className="text-blue-500" />
                        <span className="text-sm text-gray-900">{doc.filename}</span>
                      </span>
                    )}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className="flex items-center space-x-1">
                      <Database size={16} className="text-gray-500" />
                      <span className="text-sm text-gray-900">{doc.length} Kb</span>
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                  <span className="flex items-center space-x-1">
                      <Calendar size={16} className="text-gray-500" />
                      <span className="text-sm text-gray-900">{format(new Date(doc.date), 'MMM d, yyyy')}</span>
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    <div className="flex items-center space-x-4">
                      <button
                        onClick={() => handleDownload(doc._id, doc.filename)}
                        className="text-blue-600 hover:text-blue-800"
                        title="Download"
                      >
                        <Download size={18} />
                      </button>
                      
                      <div className="relative" style={{paddingTop: '0.25rem'}}>
                        <button
                          onClick={() => toggleMenu(doc._id)}
                          className="text-gray-600 hover:text-gray-800"
                        >
                          <MoreVertical size={18} />
                        </button>
                        
                        {openMenuId === doc._id && (
                          <div className="absolute right-0 mt-2 w-48 bg-white rounded-md shadow-lg z-10 border">
                            <div className="py-1">
                              <button
                                onClick={() => startRename(doc)}
                                className="flex items-center px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 w-full"
                              >
                                <Edit2 size={16} className="mr-2" />
                                Rename
                              </button>
                              <button
                                onClick={() => handleDelete(doc._id)}
                                className="flex items-center px-4 py-2 text-sm text-red-600 hover:bg-gray-100 w-full"
                              >
                                <Trash2 size={16} className="mr-2" />
                                Delete
                              </button>
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          <div className="p-8 text-center backgroundLists">
          <p className="text-sm text-gray-300">Showing all documents</p>
        </div>
        </div>
      )}
      <ToastContainer 
              position="top-right" 
              autoClose={3000} 
              hideProgressBar={false}
              newestOnTop 
              closeOnClick 
              rtl={false} 
              pauseOnFocusLoss 
              draggable 
              pauseOnHover
      />
    </div>
  );
};

export default ListedReports;