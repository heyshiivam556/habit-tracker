import { useState, useEffect } from 'react';
import * as Icons from 'lucide-react';
import { useAuth } from './useAuth';
import { db } from '../firebase';
import { collection, onSnapshot, doc, setDoc, deleteDoc, updateDoc } from 'firebase/firestore';

// Default habits for first-time users
const defaultHabits = [
  { id: '1', name: 'Read 20 pages', iconName: 'BookOpen', color: 'var(--color-accent-peach)', isCompleted: false, lastCompletedDate: null, completedDates: [], createdAt: 1 },
  { id: '2', name: 'Drink Water', iconName: 'Droplet', color: 'var(--color-accent-blue)', isCompleted: false, lastCompletedDate: null, completedDates: [], createdAt: 2 },
  { id: '3', name: 'Workout', iconName: 'Dumbbell', color: 'var(--color-accent-rose)', isCompleted: false, lastCompletedDate: null, completedDates: [], createdAt: 3 },
  { id: '4', name: 'Morning Coffee', iconName: 'Coffee', color: 'var(--color-accent-soft)', isCompleted: false, lastCompletedDate: null, completedDates: [], createdAt: 4 },
];

// Dynamically use all icons from lucide-react

export function useHabits() {
  const [habits, setHabits] = useState([]);
  const [isLoaded, setIsLoaded] = useState(false);
  const { user, loading } = useAuth();

  useEffect(() => {
    if (loading) return; // Wait until Firebase Auth figures out who is logged in

    const today = new Date().toDateString();

    if (!user) {
      // Local Storage Fallback
      const savedHabits = localStorage.getItem('tracker_habits');
      if (savedHabits) {
        const parsed = JSON.parse(savedHabits);
        const updatedHabits = parsed.map(h => {
          if (h.isCompleted && h.lastCompletedDate !== today) {
            return { ...h, isCompleted: false };
          }
          return h;
        });
        setHabits(updatedHabits);
      } else {
        setHabits(defaultHabits);
      }
      setIsLoaded(true);
      return;
    }

    // Firestore Sync
    if (db && user) {
      const habitsRef = collection(db, 'users', user.uid, 'habits');
      
      const unsubscribe = onSnapshot(habitsRef, (snapshot) => {
        // Migration logic: if Firestore is empty but we have local habits, migrate them!
        if (snapshot.empty && localStorage.getItem('tracker_habits')) {
          const localHabits = JSON.parse(localStorage.getItem('tracker_habits'));
          if (localHabits.length > 0) {
            localHabits.forEach(async (h) => {
              const hRef = doc(db, 'users', user.uid, 'habits', h.id.toString());
              await setDoc(hRef, { ...h, createdAt: h.createdAt || Date.now() });
            });
            localStorage.removeItem('tracker_habits');
          }
          return; // snapshot will trigger again once docs are written
        }

        const fetchedHabits = [];
        snapshot.forEach(docSnap => {
          const data = docSnap.data();
          // Reset daily completed status
          if (data.isCompleted && data.lastCompletedDate !== today) {
            updateDoc(docSnap.ref, { isCompleted: false });
            data.isCompleted = false;
          }
          fetchedHabits.push({ id: docSnap.id, ...data });
        });
        
        setHabits(fetchedHabits.sort((a, b) => (a.createdAt || 0) - (b.createdAt || 0)));
        setIsLoaded(true);
      }, (error) => {
        console.error("Firestore sync error:", error);
      });

      return () => unsubscribe();
    }
  }, [user]);

  // Save to local storage whenever habits change (only if not logged in)
  useEffect(() => {
    if (isLoaded && !user && !loading) {
      localStorage.setItem('tracker_habits', JSON.stringify(habits));
    }
  }, [habits, isLoaded, user, loading]);

  const toggleHabit = async (id, timeSpentInMinutes = null, targetDateStr = new Date().toDateString()) => {
    const habit = habits.find(h => h.id === id);
    const isCompletedForDate = (habit.completedDates || []).includes(targetDateStr);
    const newlyCompleted = !isCompletedForDate;

    let updatedCompletedDates = habit.completedDates || [];
    let updatedTimeRecords = habit.timeRecords || {};

    if (newlyCompleted) {
      if (!updatedCompletedDates.includes(targetDateStr)) {
        updatedCompletedDates = [...updatedCompletedDates, targetDateStr];
      }
      if (timeSpentInMinutes !== null) {
        updatedTimeRecords = { ...updatedTimeRecords, [targetDateStr]: timeSpentInMinutes };
      }
    } else {
      updatedCompletedDates = updatedCompletedDates.filter(date => date !== targetDateStr);
      if (updatedTimeRecords[targetDateStr]) {
        const newTimeRecords = { ...updatedTimeRecords };
        delete newTimeRecords[targetDateStr];
        updatedTimeRecords = newTimeRecords;
      }
    }

    const isToday = targetDateStr === new Date().toDateString();

    // Optimistic Update
    setHabits(habits.map(h => {
      if (h.id === id) {
        return { 
          ...h, 
          isCompleted: isToday ? newlyCompleted : h.isCompleted,
          lastCompletedDate: (isToday && newlyCompleted) ? targetDateStr : h.lastCompletedDate,
          completedDates: updatedCompletedDates,
          timeRecords: updatedTimeRecords
        };
      }
      return h;
    }));

    // Sync to Firestore
    if (user && db) {
      const habitRef = doc(db, 'users', user.uid, 'habits', id.toString());
      try {
        const updates = {
          completedDates: updatedCompletedDates,
          timeRecords: updatedTimeRecords
        };
        if (isToday) {
          updates.isCompleted = newlyCompleted;
          updates.lastCompletedDate = newlyCompleted ? targetDateStr : habit.lastCompletedDate;
        }
        await updateDoc(habitRef, updates);
      } catch (error) {
        console.error("Failed to update habit in Firestore", error);
      }
    }
  };

  const addHabit = async (habitData) => {
    const newId = Date.now().toString();
    const newHabit = { 
      ...habitData, 
      id: newId, 
      isCompleted: false, 
      lastCompletedDate: null,
      completedDates: [],
      timeRecords: {},
      requiresTime: habitData.requiresTime || false,
      createdAt: Date.now() 
    };

    if (!user) {
      setHabits([...habits, newHabit]);
      return;
    }

    if (user && db) {
      // Optimistic
      setHabits([...habits, newHabit]);
      
      const habitRef = doc(db, 'users', user.uid, 'habits', newId);
      try {
        await setDoc(habitRef, newHabit);
      } catch (error) {
        console.error("Failed to add habit to Firestore", error);
      }
    }
  };

  const deleteHabit = async (id) => {
    // Optimistic delete
    setHabits(habits.filter(h => h.id !== id));

    if (user && db) {
      const habitRef = doc(db, 'users', user.uid, 'habits', id.toString());
      try {
        await deleteDoc(habitRef);
      } catch (error) {
        console.error("Failed to delete habit from Firestore", error);
      }
    }
  };

  const mappedHabits = habits.map(h => ({
    ...h,
    icon: Icons[h.iconName] || Icons.BookOpen
  }));

  return { habits: mappedHabits, toggleHabit, addHabit, deleteHabit };
}
