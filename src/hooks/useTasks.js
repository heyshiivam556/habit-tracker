import { useState, useEffect } from 'react';
import { useAuth } from './useAuth';

const defaultTasks = [
  { id: 'mock-1', title: 'Buy groceries', isCompleted: false },
  { id: 'mock-2', title: 'Reply to emails', isCompleted: false },
];

export function useTasks() {
  const [tasks, setTasks] = useState([]);
  const [isLoaded, setIsLoaded] = useState(false);
  const [taskListId, setTaskListId] = useState(null);
  
  const { googleToken } = useAuth();

  useEffect(() => {
    if (!googleToken) {
      // Fallback to local storage if no Google Auth
      const savedTasks = localStorage.getItem('tracker_tasks');
      if (savedTasks) {
        setTasks(JSON.parse(savedTasks));
      } else {
        setTasks(defaultTasks);
      }
      setIsLoaded(true);
      return;
    }

    // If Google Auth is present, fetch tasks
    const fetchGoogleTasks = async () => {
      try {
        // 1. Get Task Lists
        const listsRes = await fetch('https://tasks.googleapis.com/tasks/v1/users/@me/lists', {
          headers: { Authorization: `Bearer ${googleToken}` }
        });
        const listsData = await listsRes.json();
        
        if (listsData.error) {
          console.error("Google Tasks API Error:", listsData.error);
          alert(`Google Tasks Error: ${listsData.error.message}\n\nMake sure the "Google Tasks API" is enabled in your Google Cloud Console!`);
          setTasks([]);
          return;
        }

        if (listsData.items && listsData.items.length > 0) {
          const defaultList = listsData.items[0].id;
          setTaskListId(defaultList);

          // 2. Get Tasks from default list
          const tasksRes = await fetch(`https://tasks.googleapis.com/tasks/v1/lists/${defaultList}/tasks`, {
            headers: { Authorization: `Bearer ${googleToken}` }
          });
          const tasksData = await tasksRes.json();
          
          if (tasksData.items) {
            const formattedTasks = tasksData.items.map(t => ({
              id: t.id,
              title: t.title,
              isCompleted: t.status === 'completed',
              due: t.due ? new Date(t.due) : null
            }));
            setTasks(formattedTasks);
          } else {
            setTasks([]);
          }
        }
      } catch (error) {
        console.error("Failed to fetch Google Tasks:", error);
      } finally {
        setIsLoaded(true);
      }
    };

    fetchGoogleTasks();
  }, [googleToken]);

  // Sync to local storage when using local mode
  useEffect(() => {
    if (isLoaded && !googleToken) {
      localStorage.setItem('tracker_tasks', JSON.stringify(tasks));
    }
  }, [tasks, isLoaded, googleToken]);

  const addTask = async (title) => {
    if (!title.trim()) return;
    
    if (!googleToken) {
      setTasks([...tasks, { id: Date.now().toString(), title, isCompleted: false }]);
      return;
    }

    try {
      // Create in Google Tasks
      const tempId = 'temp-' + Date.now();
      setTasks([...tasks, { id: tempId, title, isCompleted: false }]);

      const res = await fetch(`https://tasks.googleapis.com/tasks/v1/lists/${taskListId}/tasks`, {
        method: 'POST',
        headers: { 
          Authorization: `Bearer ${googleToken}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ title })
      });
      const data = await res.json();
      
      // Update with real Google Task ID
      setTasks(current => current.map(t => t.id === tempId ? { id: data.id, title: data.title, isCompleted: false } : t));
    } catch (error) {
      console.error("Failed to add Google Task:", error);
    }
  };

  const toggleTask = async (id) => {
    const taskToToggle = tasks.find(t => t.id === id);
    const newStatus = !taskToToggle.isCompleted;

    // Optimistic update
    setTasks(tasks.map(t => t.id === id ? { ...t, isCompleted: newStatus } : t));

    if (googleToken && !id.toString().startsWith('mock-')) {
      try {
        await fetch(`https://tasks.googleapis.com/tasks/v1/lists/${taskListId}/tasks/${id}`, {
          method: 'PUT',
          headers: { 
            Authorization: `Bearer ${googleToken}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({ 
            id, 
            title: taskToToggle.title, 
            status: newStatus ? 'completed' : 'needsAction' 
          })
        });
      } catch (error) {
        console.error("Failed to update Google Task:", error);
        // Revert on failure (optional)
      }
    }
  };

  const deleteTask = async (id) => {
    // Optimistic delete
    setTasks(tasks.filter(t => t.id !== id));

    if (googleToken && !id.toString().startsWith('mock-')) {
      try {
        await fetch(`https://tasks.googleapis.com/tasks/v1/lists/${taskListId}/tasks/${id}`, {
          method: 'DELETE',
          headers: { Authorization: `Bearer ${googleToken}` }
        });
      } catch (error) {
        console.error("Failed to delete Google Task:", error);
      }
    }
  };

  return { tasks, addTask, toggleTask, deleteTask };
}
