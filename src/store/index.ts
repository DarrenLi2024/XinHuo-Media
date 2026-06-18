import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { Event, Task, User } from '@/types';

// ==================== 用户状态 ====================

interface UserState {
  user: User | null;
  isLoading: boolean;
  setUser: (user: User | null) => void;
  setLoading: (loading: boolean) => void;
  logout: () => void;
}

export const useUserStore = create<UserState>()(
  persist(
    (set) => ({
      user: null,
      isLoading: true,
      setUser: (user) => set({ user, isLoading: false }),
      setLoading: (loading) => set({ isLoading: loading }),
      logout: () => set({ user: null }),
    }),
    {
      name: 'user-storage',
      // Only persist non-sensitive fields to localStorage
      partialize: (state) => ({
        user: state.user ? { id: state.user.id, name: state.user.name, role: state.user.role } as User : null,
      }),
    }
  )
);

// ==================== 活动状态 ====================

interface EventState {
  currentEvent: Event | null;
  events: Event[];
  setCurrentEvent: (event: Event | null) => void;
  setEvents: (events: Event[]) => void;
  addEvent: (event: Event) => void;
  updateEvent: (id: string, updates: Partial<Event>) => void;
  removeEvent: (id: string) => void;
}

export const useEventStore = create<EventState>()(
  persist(
    (set) => ({
      currentEvent: null,
      events: [],
      setCurrentEvent: (event) => set({ currentEvent: event }),
      setEvents: (events) => set({ events }),
      addEvent: (event) => set((state) => ({ events: [...state.events, event] })),
      updateEvent: (id, updates) =>
        set((state) => ({
          events: state.events.map((e) => (e.id === id ? { ...e, ...updates } : e)),
          currentEvent: state.currentEvent?.id === id ? { ...state.currentEvent, ...updates } : state.currentEvent,
        })),
      removeEvent: (id) =>
        set((state) => ({
          events: state.events.filter((e) => e.id !== id),
          currentEvent: state.currentEvent?.id === id ? null : state.currentEvent,
        })),
    }),
    {
      name: 'event-storage',
    }
  )
);

// ==================== 任务状态 ====================

interface TaskState {
  tasks: Task[];
  selectedTask: Task | null;
  setTasks: (tasks: Task[]) => void;
  addTask: (task: Task) => void;
  updateTask: (id: string, updates: Partial<Task>) => void;
  removeTask: (id: string) => void;
  setSelectedTask: (task: Task | null) => void;
}

export const useTaskStore = create<TaskState>()(
  persist(
    (set) => ({
      tasks: [],
      selectedTask: null,
      setTasks: (tasks) => set({ tasks }),
      addTask: (task) => set((state) => ({ tasks: [...state.tasks, task] })),
      updateTask: (id, updates) =>
        set((state) => ({
          tasks: state.tasks.map((t) => (t.id === id ? { ...t, ...updates } : t)),
          selectedTask: state.selectedTask?.id === id ? { ...state.selectedTask, ...updates } : state.selectedTask,
        })),
      removeTask: (id) =>
        set((state) => ({
          tasks: state.tasks.filter((t) => t.id !== id),
          selectedTask: state.selectedTask?.id === id ? null : state.selectedTask,
        })),
      setSelectedTask: (task) => set({ selectedTask: task }),
    }),
    {
      name: 'task-storage',
    }
  )
);

// ==================== UI 状态 ====================

interface UIState {
  sidebarCollapsed: boolean;
  theme: 'light' | 'dark' | 'system';
  toggleSidebar: () => void;
  setSidebarCollapsed: (collapsed: boolean) => void;
  setTheme: (theme: 'light' | 'dark' | 'system') => void;
}

export const useUIStore = create<UIState>()(
  persist(
    (set) => ({
      sidebarCollapsed: false,
      theme: 'system',
      toggleSidebar: () => set((state) => ({ sidebarCollapsed: !state.sidebarCollapsed })),
      setSidebarCollapsed: (collapsed) => set({ sidebarCollapsed: collapsed }),
      setTheme: (theme) => set({ theme }),
    }),
    {
      name: 'ui-storage',
    }
  )
);