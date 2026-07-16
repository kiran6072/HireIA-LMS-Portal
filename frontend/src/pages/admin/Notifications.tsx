import { useEffect, useState, type FormEvent } from 'react';
import { Bell, Megaphone, Trash2 } from 'lucide-react';
import toast from 'react-hot-toast';
import { formatDistanceToNow } from 'date-fns';
import DashboardLayout from '@/components/layout/DashboardLayout';
import Spinner from '@/components/common/Spinner';
import EmptyState from '@/components/common/EmptyState';
import Modal from '@/components/common/Modal';
import * as notificationService from '@/api/notificationService';
import { getErrorMessage } from '@/api/axios';
import type { Notification } from '@/types';

export default function Notifications() {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);
  const [broadcastOpen, setBroadcastOpen] = useState(false);

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

  const handleDelete = async (id: string) => {
    try {
      await notificationService.deleteNotification(id);
      setNotifications((n) => n.filter((x) => x._id !== id));
    } catch (err) {
      toast.error(getErrorMessage(err));
    }
  };

  return (
    <DashboardLayout role="admin" title="Notifications">
      <div className="mb-5 flex items-center justify-between">
        <button
          className="text-sm font-medium text-primary-600 hover:underline"
          onClick={async () => {
            await notificationService.markAllAsRead();
            load();
          }}
        >
          Mark all as read
        </button>
        <button className="btn-secondary" onClick={() => setBroadcastOpen(true)}>
          <Megaphone size={16} /> Broadcast to Students
        </button>
      </div>

      {loading ? (
        <div className="flex justify-center py-24">
          <Spinner size="lg" />
        </div>
      ) : notifications.length === 0 ? (
        <EmptyState icon={Bell} title="No notifications" description="You're all caught up." />
      ) : (
        <div className="card divide-y divide-slate-100">
          {notifications.map((n) => (
            <div key={n._id} className={`flex items-start justify-between gap-3 px-5 py-4 ${!n.isRead ? 'bg-primary-50/30' : ''}`}>
              <div>
                <p className="text-sm font-medium text-slate-800">{n.title}</p>
                <p className="mt-0.5 text-sm text-slate-500">{n.message}</p>
                <p className="mt-1.5 text-xs text-slate-400">{formatDistanceToNow(new Date(n.createdAt), { addSuffix: true })}</p>
              </div>
              <button onClick={() => handleDelete(n._id)} className="rounded-lg p-1.5 text-slate-300 hover:bg-red-50 hover:text-red-500">
                <Trash2 size={15} />
              </button>
            </div>
          ))}
        </div>
      )}

      <BroadcastModal isOpen={broadcastOpen} onClose={() => setBroadcastOpen(false)} />
    </DashboardLayout>
  );
}

function BroadcastModal({ isOpen, onClose }: { isOpen: boolean; onClose: () => void }) {
  const [title, setTitle] = useState('');
  const [message, setMessage] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      await notificationService.broadcastNotification({ title, message, type: 'system' });
      toast.success('Notification broadcast to all active students.');
      setTitle('');
      setMessage('');
      onClose();
    } catch (err) {
      toast.error(getErrorMessage(err));
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Broadcast Notification" size="sm">
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="label">Title</label>
          <input required value={title} onChange={(e) => setTitle(e.target.value)} className="input" placeholder="e.g. Holiday Notice" />
        </div>
        <div>
          <label className="label">Message</label>
          <textarea required rows={4} value={message} onChange={(e) => setMessage(e.target.value)} className="input" />
        </div>
        <p className="text-xs text-slate-400">This will be sent to all active students as a dashboard alert and an email.</p>
        <div className="flex justify-end gap-3 pt-2">
          <button type="button" className="btn-outline" onClick={onClose}>
            Cancel
          </button>
          <button type="submit" disabled={isSubmitting} className="btn-secondary">
            {isSubmitting ? 'Sending…' : 'Send Broadcast'}
          </button>
        </div>
      </form>
    </Modal>
  );
}
