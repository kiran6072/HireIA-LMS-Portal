import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Bell, Trash2 } from 'lucide-react';
import toast from 'react-hot-toast';
import { formatDistanceToNow } from 'date-fns';
import DashboardLayout from '@/components/layout/DashboardLayout';
import Spinner from '@/components/common/Spinner';
import EmptyState from '@/components/common/EmptyState';
import * as notificationService from '@/api/notificationService';
import { getErrorMessage } from '@/api/axios';
import type { Notification } from '@/types';

export default function Notifications() {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  const load = async () => {
    setLoading(true);
    try {
      const data = await notificationService.getMyNotifications();
      setNotifications(data.notifications);
    } catch (err) {
      toast.error(getErrorMessage(err));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const handleClick = async (n: Notification) => {
    if (!n.isRead) await notificationService.markAsRead(n._id);
    if (n.link) navigate(n.link);
    else load();
  };

  const handleDelete = async (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    try {
      await notificationService.deleteNotification(id);
      setNotifications((n) => n.filter((x) => x._id !== id));
    } catch (err) {
      toast.error(getErrorMessage(err));
    }
  };

  return (
    <DashboardLayout role="student" title="Notifications">
      {notifications.some((n) => !n.isRead) && (
        <div className="mb-4 flex justify-end">
          <button
            className="text-sm font-medium text-primary-600 hover:underline"
            onClick={async () => {
              await notificationService.markAllAsRead();
              load();
            }}
          >
            Mark all as read
          </button>
        </div>
      )}

      {loading ? (
        <div className="flex justify-center py-24">
          <Spinner size="lg" />
        </div>
      ) : notifications.length === 0 ? (
        <EmptyState icon={Bell} title="No notifications" description="You're all caught up." />
      ) : (
        <div className="card divide-y divide-slate-100">
          {notifications.map((n) => (
            <button
              key={n._id}
              onClick={() => handleClick(n)}
              className={`flex w-full items-start justify-between gap-3 px-5 py-4 text-left hover:bg-slate-50 ${
                !n.isRead ? 'bg-primary-50/30' : ''
              }`}
            >
              <div>
                <p className="text-sm font-medium text-slate-800">{n.title}</p>
                <p className="mt-0.5 text-sm text-slate-500">{n.message}</p>
                <p className="mt-1.5 text-xs text-slate-400">{formatDistanceToNow(new Date(n.createdAt), { addSuffix: true })}</p>
              </div>
              <span onClick={(e) => handleDelete(e, n._id)} className="rounded-lg p-1.5 text-slate-300 hover:bg-red-50 hover:text-red-500">
                <Trash2 size={15} />
              </span>
            </button>
          ))}
        </div>
      )}
    </DashboardLayout>
  );
}
