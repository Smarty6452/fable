"use client";

import { useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Bell, X, Trophy, Star, Zap, Award, Gift } from "lucide-react";

export interface Notification {
  id: string;
  type: "achievement" | "level-up" | "streak" | "tip" | "reward";
  title: string;
  message: string;
  timestamp: number;
  read: boolean;
}

const NOTIFICATION_ICONS = {
  achievement: <Trophy className="text-yellow-500" size={24} />,
  "level-up": <Zap className="text-primary" size={24} />,
  streak: <Star className="text-red-500 fill-red-500" size={24} />,
  tip: <Award className="text-blue-500" size={24} />,
  reward: <Gift className="text-purple-500" size={24} />,
};

export function useNotifications() {
  const [notifications, setNotifications] = useState<Notification[]>([]);

  useEffect(() => {
    const saved = localStorage.getItem("talkybuddy-notifications");
    if (saved) {
      setNotifications(JSON.parse(saved));
    }
  }, []);

  const addNotification = useCallback((notif: Omit<Notification, "id" | "timestamp" | "read">) => {
    setNotifications(prev => {
      const newNotif: Notification = {
        ...notif,
        id: `${Date.now()}-${Math.random()}`,
        timestamp: Date.now(),
        read: false,
      };
      const updated = [newNotif, ...prev].slice(0, 20);
      localStorage.setItem("talkybuddy-notifications", JSON.stringify(updated));
      return updated;
    });
  }, []);

  const markAsRead = useCallback((id: string) => {
    setNotifications(prev => {
      const updated = prev.map(n => n.id === id ? { ...n, read: true } : n);
      localStorage.setItem("talkybuddy-notifications", JSON.stringify(updated));
      return updated;
    });
  }, []);

  const markAllAsRead = useCallback(() => {
    setNotifications(prev => {
      const updated = prev.map(n => ({ ...n, read: true }));
      localStorage.setItem("talkybuddy-notifications", JSON.stringify(updated));
      return updated;
    });
  }, []);

  const clearAll = useCallback(() => {
    setNotifications([]);
    localStorage.removeItem("talkybuddy-notifications");
  }, []);

  const unreadCount = notifications.filter(n => !n.read).length;

  return { notifications, addNotification, markAsRead, markAllAsRead, clearAll, unreadCount };
}

interface NotificationBellProps {
  notifications: Notification[];
  unreadCount: number;
  onMarkAsRead: (id: string) => void;
  onMarkAllAsRead: () => void;
  onClearAll: () => void;
}

export function NotificationBell({
  notifications,
  unreadCount,
  onMarkAsRead,
  onMarkAllAsRead,
  onClearAll,
}: NotificationBellProps) {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <div className="relative">
      <motion.button
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        onClick={() => setIsOpen(!isOpen)}
        className="relative p-3 bg-white/80 backdrop-blur-md rounded-2xl shadow-lg border-2 border-white/80 hover:bg-white transition-all"
      >
        <Bell size={20} className="text-slate-700" />
        {unreadCount > 0 && (
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            className="absolute -top-1 -right-1 bg-red-500 text-white text-xs font-black rounded-full w-5 h-5 flex items-center justify-center border-2 border-white"
          >
            {unreadCount > 9 ? "9+" : unreadCount}
          </motion.div>
        )}
      </motion.button>

      <AnimatePresence>
        {isOpen && (
          <>
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-40"
              onClick={() => setIsOpen(false)}
            />

            {/* Notification Panel */}
            <motion.div
              initial={{ opacity: 0, y: -20, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -20, scale: 0.95 }}
              className="absolute right-0 top-full mt-2 w-96 max-h-[500px] bg-white/95 backdrop-blur-xl rounded-3xl border-4 border-white shadow-2xl z-50 overflow-hidden flex flex-col"
            >
              {/* Header */}
              <div className="p-4 border-b-2 border-slate-100 flex items-center justify-between bg-gradient-to-r from-primary/10 to-orange-100">
                <div>
                  <h3 className="font-black text-lg text-slate-800">Notifications</h3>
                  <p className="text-xs text-slate-500">
                    {unreadCount > 0 ? `${unreadCount} new` : "All caught up!"}
                  </p>
                </div>
                <div className="flex gap-2">
                  {unreadCount > 0 && (
                    <button
                      onClick={onMarkAllAsRead}
                      className="text-xs font-bold text-primary hover:text-primary/80 transition-colors"
                    >
                      Mark all read
                    </button>
                  )}
                  <button
                    onClick={onClearAll}
                    className="text-xs font-bold text-slate-400 hover:text-slate-600 transition-colors"
                  >
                    Clear all
                  </button>
                </div>
              </div>

              {/* Notification List */}
              <div className="overflow-y-auto flex-1">
                {notifications.length === 0 ? (
                  <div className="p-8 text-center">
                    <Bell className="mx-auto text-slate-300 mb-3" size={48} />
                    <p className="text-slate-400 font-medium">No notifications yet</p>
                  </div>
                ) : (
                  <div className="divide-y divide-slate-100">
                    {notifications.map(notif => (
                      <motion.div
                        key={notif.id}
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        className={`p-4 hover:bg-slate-50 transition-colors cursor-pointer ${
                          !notif.read ? "bg-blue-50/50" : ""
                        }`}
                        onClick={() => onMarkAsRead(notif.id)}
                      >
                        <div className="flex gap-3">
                          <div className="shrink-0">{NOTIFICATION_ICONS[notif.type]}</div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-start justify-between gap-2 mb-1">
                              <h4 className="font-black text-sm text-slate-800">{notif.title}</h4>
                              {!notif.read && (
                                <div className="w-2 h-2 bg-blue-500 rounded-full shrink-0" />
                              )}
                            </div>
                            <p className="text-sm text-slate-600 mb-2">{notif.message}</p>
                            <p className="text-xs text-slate-400">
                              {formatTimestamp(notif.timestamp)}
                            </p>
                          </div>
                        </div>
                      </motion.div>
                    ))}
                  </div>
                )}
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}

function formatTimestamp(timestamp: number): string {
  const now = Date.now();
  const diff = now - timestamp;
  const seconds = Math.floor(diff / 1000);
  const minutes = Math.floor(seconds / 60);
  const hours = Math.floor(minutes / 60);
  const days = Math.floor(hours / 24);

  if (seconds < 60) return "Just now";
  if (minutes < 60) return `${minutes}m ago`;
  if (hours < 24) return `${hours}h ago`;
  if (days < 7) return `${days}d ago`;
  return new Date(timestamp).toLocaleDateString();
}

// Helper to trigger common notifications
export function triggerLevelUpNotification(level: number, addNotification: ReturnType<typeof useNotifications>["addNotification"]) {
  addNotification({
    type: "level-up",
    title: `Level ${level} Unlocked! 🎉`,
    message: `Congratulations! You've reached level ${level}. Keep practicing to unlock more chapters!`,
  });
}

export function triggerStreakNotification(streak: number, addNotification: ReturnType<typeof useNotifications>["addNotification"]) {
  addNotification({
    type: "streak",
    title: `${streak} Streak! 🔥`,
    message: `Amazing! You've gotten ${streak} correct answers in a row. You're on fire!`,
  });
}

export function triggerAchievementNotification(title: string, message: string, addNotification: ReturnType<typeof useNotifications>["addNotification"]) {
  addNotification({
    type: "achievement",
    title,
    message,
  });
}
