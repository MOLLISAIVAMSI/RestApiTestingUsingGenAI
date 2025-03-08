import React, { useState, useEffect } from 'react';
import { Folder, File, Plus, FolderPlus, Trash2, ChevronRight, ChevronDown,FilePlus } from 'lucide-react';

const Sidebar = ({ onFileClick }) => { // Added onFileClick prop
    const [fileSystem, setFileSystem] = useState([]);
    const [showNewItemInput, setShowNewItemInput] = useState(null);
    const [newItemName, setNewItemName] = useState('');
    const [loading, setLoading] = useState(true);
  
    useEffect(() => {
        fetchFileSystem();
    }, []);


    const fetchFileSystem = async () => {
      setLoading(true);
      try{
        const response = await fetch('http://localhost:5260/files');
        if(response.ok){
          const data = await response.json();
          setFileSystem(data);
        }else {
          console.error('Failed to fetch file system');
        }
      }catch (error){
        console.error('Error fetching files: ', error);
      }
      finally{
        setLoading(false);
      }
    }
  
    const toggleFolder = async (path, itemId) => {
      setFileSystem(prevSystem => {
          const newSystem = [...prevSystem];
          let current = newSystem;
          let target;

          function traverse(items, path){
            for(const item of items){
              if(item._id === itemId)
              {
                target = item;
                return;
              }
              if(item.children){
                traverse(item.children,path)
              }
            }
          }
          traverse(newSystem,path);
          
          if(target)
          {
            target.isOpen = !target.isOpen;
          }
          
          return newSystem;
      });
  };

  const handleNewItem = (parentPath, type, parentId) => {
    setShowNewItemInput({ parentPath, type, parentId });
    setNewItemName('');
  };

  const createNewItem = async () => {
      if (!showNewItemInput || !newItemName.trim()) return;

      const newItemData = {
          name: newItemName,
          type: showNewItemInput.type,
          parent_id: showNewItemInput.parentId
      }

      try{
        const response = await fetch('http://localhost:5260/files', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify(newItemData)
        });

        if(response.ok){
          fetchFileSystem();
        }else{
          console.error('Failed to create new item');
        }
      }catch(error){
        console.error('Error creating item: ', error);
      }

      setShowNewItemInput(null);
      setNewItemName('');
  };

  const renameItem = async (path, itemId, newName) => {
    try {
      const response = await fetch(`http://localhost:5260/files/${itemId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ newName }),
      });
  
      if (response.ok) {
        fetchFileSystem();
      } else {
        console.error('Failed to rename item');
      }
    } catch (error) {
      console.error('Error renaming item:', error);
    }
  };
  

  const deleteItem = async (path, itemId) => {
    try {
        const response = await fetch(`http://localhost:5260/files/${itemId}`, {
            method: 'DELETE'
        });

        if (response.ok) {
            fetchFileSystem();
        } else {
            console.error('Failed to delete item');
        }
    } catch (error) {
        console.error('Error deleting item:', error);
    }
  };
    
    const handleFileClick = (item) => {
      if (item.type === 'file') {
        onFileClick(item._id); // Send _id to parent
      }
    };

  const renderFileSystem = (items, path = []) => {
      if(!items) return null;
    return items.map(item => (
        <div key={item._id} className="ml-4">
            <div 
              className="flex items-center group py-1 hover:bg-gray-700 rounded px-2 cursor-pointer"
              onClick={() => handleFileClick(item)} // On click file handler
            >
            {item.type === 'folder' ? (
                <>
                <button
                    onClick={(e) => {e.stopPropagation(); toggleFolder([...path, item.name], item._id)}}
                    className="mr-1 focus:outline-none"
                >
                    {item.isOpen ? (
                    <ChevronDown className="w-4 h-4 text-gray-400" />
                    ) : (
                    <ChevronRight className="w-4 h-4 text-gray-400" />
                    )}
                </button>
                <Folder className="w-4 h-4 text-gray-400 mr-2" />
                </>
            ) : (
                <>
                <span className="w-4 mr-1" />
                <File className="w-4 h-4 text-gray-400 mr-2" />
                </>
            )}
            <span className="text-gray-300 text-sm flex-1">{item.name}</span>
            <div className="hidden group-hover:flex items-center">
                {item.type === 'folder' && (
                <>
                    <button
                    onClick={(e) => {e.stopPropagation(); handleNewItem([...path, item.name], 'file', item._id)}}
                    className="p-1 hover:bg-gray-600 rounded"
                    >
                    <Plus className="w-3 h-3 text-gray-400" />
                    </button>
                    <button
                    onClick={(e) => {e.stopPropagation(); handleNewItem([...path, item.name], 'folder', item._id)}}
                    className="p-1 hover:bg-gray-600 rounded"
                    >
                    <FolderPlus className="w-3 h-3 text-gray-400" />
                    </button>
                </>
                )}
                <button
                onClick={(e) => {e.stopPropagation(); deleteItem([...path, item.name], item._id)}}
                className="p-1 hover:bg-gray-600 rounded"
                >
                <Trash2 className="w-3 h-3 text-gray-400" />
                </button>
            </div>
            </div>
            {item.type === 'folder' && item.isOpen && item.children && (
            <div className="ml-2">
                {showNewItemInput?.parentPath.join('/') === [...path, item.name].join('/') && (
                <div className="flex items-center py-1 px-2">
                    {showNewItemInput.type === 'folder' ? (
                    <Folder className="w-4 h-4 text-gray-400 mr-2" />
                    ) : (
                    <File className="w-4 h-4 text-gray-400 mr-2" />
                    )}
                    <input
                    type="text"
                    value={newItemName}
                    onChange={(e) => setNewItemName(e.target.value)}
                    onKeyDown={(e) => {
                        if (e.key === 'Enter') createNewItem();
                        if (e.key === 'Escape') setShowNewItemInput(null);
                    }}
                    placeholder={`New ${showNewItemInput.type}...`}
                    className="bg-gray-700 text-gray-300 text-sm px-2 py-1 rounded focus:outline-none"
                    autoFocus
                    />
                </div>
                )}
                {renderFileSystem(item.children, [...path, item.name])}
            </div>
            )}
        </div>
        ));
    };

  return (
    <div className="w-64  h-full overflow-y-auto">
        <div className="p-4">
        <div className="flex items-center justify-between mb-4">
            <h2 className="text-gray-300 text-sm font-medium">EXPLORER</h2>
            <div className="flex space-x-2">
            <button
                onClick={() => handleNewItem([], 'file', null)}
                className="p-1 hover:bg-gray-700 rounded"
            >
                <FilePlus className="w-4 h-4 text-gray-400" />
            </button>
            </div>
        </div>
        {showNewItemInput?.parentPath.length === 0 && (
            <div className="flex items-center mb-2 px-2">
            {showNewItemInput.type === 'folder' ? (
                <Folder className="w-4 h-4 text-gray-400 mr-2" />
            ) : (
                <File className="w-4 h-4 text-gray-400 mr-2" />
            )}
            <input
                type="text"
                value={newItemName}
                onChange={(e) => setNewItemName(e.target.value)}
                onKeyDown={(e) => {
                if (e.key === 'Enter') createNewItem();
                if (e.key === 'Escape') setShowNewItemInput(null);
                }}
                placeholder={`New ${showNewItemInput.type}...`}
                className="bg-gray-700 text-gray-300 text-sm px-2 py-1 rounded focus:outline-none w-full"
                autoFocus
            />
            </div>
        )}
        {loading ? <p>Loading...</p> : renderFileSystem(fileSystem)}
        </div>
    </div>
  );
};

export default Sidebar;