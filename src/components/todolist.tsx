'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import Swal from 'sweetalert2';
import {
  collection,
  addDoc,
  getDocs,
  deleteDoc,
  doc,
  updateDoc,
} from 'firebase/firestore';
import { db } from '../app/lib/firebase';

type Task = {
  id: string;
  text: string;
  completed: boolean;
  deadline: string;
};

export default function TodoList() {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [timeRemaining, setTimeRemaining] = useState<{ [key: string]: string }>(
    {}
  );

  useEffect(() => {
    const fetchTasks = async () => {
      const querySnapshot = await getDocs(collection(db, 'tasks'));
      const tasksData = querySnapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      })) as Task[];
      setTasks(tasksData);
    };
    fetchTasks();
  }, []);

  useEffect(() => {
    const interval = setInterval(() => {
      const newTimeRemaining: { [key: string]: string } = {};
      tasks.forEach((task) => {
        newTimeRemaining[task.id] = calculateTimeRemaining(task.deadline);
      });
      setTimeRemaining(newTimeRemaining);
    }, 1000);

    return () => clearInterval(interval);
  }, [tasks]);

  const calculateTimeRemaining = (deadline: string): string => {
    const deadlineTime = new Date(deadline).getTime();
    const now = new Date().getTime();
    const difference = deadlineTime - now;

    if (difference <= 0) return 'Waktu habis!';

    const hours = Math.floor(difference / (1000 * 60 * 60));
    const minutes = Math.floor((difference % (1000 * 60 * 60)) / (1000 * 60));
    const seconds = Math.floor((difference % (1000 * 60)) / 1000);

    return `${hours}j ${minutes}m ${seconds}d`;
  };

  const addTask = async (): Promise<void> => {
    const { value: formValues } = await Swal.fire({
      title: 'Tambahkan tugas baru',
      html:
        '<input id="swal-input1" class="swal2-input" placeholder="Nama tugas">' +
        '<input id="swal-input2" type="datetime-local" class="swal2-input">',
      focusConfirm: false,
      showCancelButton: true,
      confirmButtonText: 'Tambah',
      cancelButtonText: 'Batal',
      preConfirm: () => {
        return [
          (document.getElementById('swal-input1') as HTMLInputElement)?.value,
          (document.getElementById('swal-input2') as HTMLInputElement)?.value,
        ];
      },
    });

    if (formValues && formValues[0] && formValues[1]) {
      const newTask: Omit<Task, 'id'> = {
        text: formValues[0],
        completed: false,
        deadline: formValues[1],
      };
      const docRef = await addDoc(collection(db, 'tasks'), newTask);
      setTasks([...tasks, { id: docRef.id, ...newTask }]);
    }
  };

  const toggleTask = async (id: string): Promise<void> => {
    const updatedTasks = tasks.map((task) =>
      task.id === id ? { ...task, completed: !task.completed } : task
    );
    setTasks(updatedTasks);
    const taskRef = doc(db, 'tasks', id);
    await updateDoc(taskRef, {
      completed: updatedTasks.find((task) => task.id === id)?.completed,
    });
  };

  const deleteTask = async (id: string): Promise<void> => {
    await deleteDoc(doc(db, 'tasks', id));
    setTasks(tasks.filter((task) => task.id !== id));
  };

  return (
    <div className="max-w-xl mx-auto mt-12 px-6 py-8 bg-white shadow-lg rounded-2xl">
      <h1 className="text-3xl font-bold text-emerald-600 mb-6 text-center">
        📝 To-Do List
      </h1>

      <div className="flex justify-center mb-6">
        <button
          onClick={addTask}
          className="bg-emerald-500 hover:bg-emerald-600 transition-colors text-white font-semibold px-5 py-2 rounded-xl shadow-sm"
        >
          ➕ Tambah Tugas
        </button>
      </div>

      <ul className="space-y-4">
        <AnimatePresence>
          {tasks.map((task) => {
            const timeLeft = calculateTimeRemaining(task.deadline);
            const isExpired = timeLeft === 'Waktu habis!';
            const taskColor = task.completed
              ? 'bg-green-100 border-green-300'
              : isExpired
              ? 'bg-red-100 border-red-300'
              : 'bg-yellow-100 border-yellow-300';

            return (
              <motion.li
                key={task.id}
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, x: -20 }}
                transition={{ duration: 0.3 }}
                className={`p-4 rounded-xl border ${taskColor} shadow-sm`}
              >
                <div className="flex items-start justify-between">
                  <div>
                    <span
                      onClick={() => toggleTask(task.id)}
                      className={`block text-lg cursor-pointer select-none transition-all ${
                        task.completed
                          ? 'line-through text-gray-400'
                          : 'text-gray-800 font-medium'
                      }`}
                    >
                      {task.text}
                    </span>
                    <p className="text-sm text-gray-600 mt-1">
                      📅 Deadline: {new Date(task.deadline).toLocaleString()}
                    </p>
                    <span
                      className={`inline-block mt-1 text-xs font-semibold px-2 py-1 rounded-full ${
                        isExpired
                          ? 'bg-red-200 text-red-800'
                          : task.completed
                          ? 'bg-green-200 text-green-800'
                          : 'bg-yellow-200 text-yellow-800'
                      }`}
                    >
                      ⏳ {timeRemaining[task.id] || 'Menghitung...'}
                    </span>
                  </div>
                  <button
                    onClick={() => deleteTask(task.id)}
                    className="ml-4 mt-1 text-white bg-red-500 hover:bg-red-600 transition-colors px-2 py-1 rounded-md text-sm"
                  >
                    Hapus
                  </button>
                </div>
              </motion.li>
            );
          })}
        </AnimatePresence>
      </ul>
    </div>
  );
}
