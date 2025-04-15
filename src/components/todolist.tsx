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
  const [timeRemaining, setTimeRemaining] = useState<{ [key: string]: string }>({});

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

      Swal.fire({
        title: 'Tugas Ditambahkan!',
        text: 'Tugas baru telah berhasil ditambahkan.',
        icon: 'success',
        confirmButtonText: 'Oke',
      });
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

    Swal.fire({
      title: 'Tugas Dihapus!',
      text: 'Tugas telah dihapus.',
      icon: 'error',
      confirmButtonText: 'Oke',
    });
  };

  const editTask = async (id: string, currentText: string, currentDeadline: string): Promise<void> => {
    const { value: formValues } = await Swal.fire({
      title: 'Edit Tugas',
      html:
        `<input id="swal-input1" class="swal2-input" value="${currentText}" placeholder="Nama tugas">` +
        `<input id="swal-input2" type="datetime-local" class="swal2-input" value="${currentDeadline}">`,
      focusConfirm: false,
      showCancelButton: true,
      confirmButtonText: 'Simpan',
      cancelButtonText: 'Batal',
      preConfirm: () => {
        return [
          (document.getElementById('swal-input1') as HTMLInputElement)?.value,
          (document.getElementById('swal-input2') as HTMLInputElement)?.value,
        ];
      },
    });

    if (formValues && formValues[0] && formValues[1]) {
      const updatedTasks = tasks.map((task) =>
        task.id === id
          ? { ...task, text: formValues[0], deadline: formValues[1] }
          : task
      );
      setTasks(updatedTasks);

      const taskRef = doc(db, 'tasks', id);
      await updateDoc(taskRef, {
        text: formValues[0],
        deadline: formValues[1],
      });
    }
  };

  return (
    <div className="max-w-xl mx-auto mt-12 px-6 py-8 bg-gradient-to-br from-pink-400 via-purple-500 to-indigo-600 text-white shadow-2xl rounded-3xl">
      <h1 className="text-3xl font-bold text-center text-emerald-600 mb-6">📋 To-Do List</h1>

      <div className="flex justify-center mb-6">
        <button
          onClick={addTask}
          className="bg-emerald-600 hover:bg-emerald-700 text-white font-medium px-6 py-2 rounded-full shadow-md transition"
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
              ? 'bg-green-100 border-green-400'
              : isExpired
              ? 'bg-red-100 border-red-400'
              : 'bg-yellow-100 border-yellow-400';

            return (
              <motion.li
                key={task.id}
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, x: -20 }}
                transition={{ duration: 0.3 }}
                className={`flex flex-col p-4 border-l-4 ${taskColor} rounded-xl shadow-sm`}
              >
                <div className="flex justify-between items-start">
                  <span
                    onClick={() => toggleTask(task.id)}
                    className={`cursor-pointer break-words text-lg ${
                      task.completed
                        ? 'line-through text-gray-400'
                        : 'text-gray-800 font-semibold hover:text-emerald-700 transition'
                    }`}
                  >
                    {task.text}
                  </span>

                  <div className="flex gap-2 mt-1">
                    <button
                      onClick={() => editTask(task.id, task.text, task.deadline)}
                      className="text-sm bg-blue-500 hover:bg-blue-600 text-white px-3 py-1 rounded-full shadow"
                    >
                      ✏️ Edit
                    </button>
                    <button
                      onClick={() => deleteTask(task.id)}
                      className="text-sm bg-red-500 hover:bg-red-600 text-white px-3 py-1 rounded-full shadow"
                    >
                      🗑️ Hapus
                    </button>
                  </div>
                </div>
                <div className="mt-2 flex flex-col text-sm text-gray-600">
                  <span>📅 Deadline: {new Date(task.deadline).toLocaleString()}</span>
                  <span className={`font-medium mt-1 ${isExpired ? 'text-red-500' : 'text-gray-700'}`}>
                    ⏳ {timeRemaining[task.id] || 'Menghitung...'}
                  </span>
                </div>
              </motion.li>
            );
          })}
        </AnimatePresence>
      </ul>
    </div>
  );
}
