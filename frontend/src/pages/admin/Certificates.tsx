import { useEffect, useState } from 'react';
import { Award, Download, QrCode, Trash2, Sparkles } from 'lucide-react';
import toast from 'react-hot-toast';
import DashboardLayout from '@/components/layout/DashboardLayout';
import Spinner from '@/components/common/Spinner';
import EmptyState from '@/components/common/EmptyState';
import Modal from '@/components/common/Modal';
import ConfirmDialog from '@/components/common/ConfirmDialog';
import * as certificateService from '@/api/certificateService';
import * as courseService from '@/api/courseService';
import { getErrorMessage } from '@/api/axios';
import type { Certificate, Course, User } from '@/types';

export default function Certificates() {
  const [certificates, setCertificates] = useState<Certificate[]>([]);
  const [loading, setLoading] = useState(true);
  const [generateOpen, setGenerateOpen] = useState(false);
  const [revokeTarget, setRevokeTarget] = useState<Certificate | null>(null);

  const load = async () => {
    setLoading(true);
    try {
      const data = await certificateService.getCertificates();
      setCertificates(data.certificates);
    } catch (err) {
      toast.error(getErrorMessage(err));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const handleRevoke = async () => {
    if (!revokeTarget) return;
    try {
      await certificateService.revokeCertificate(revokeTarget._id);
      toast.success('Certificate revoked.');
      setRevokeTarget(null);
      load();
    } catch (err) {
      toast.error(getErrorMessage(err));
    }
  };

  return (
    <DashboardLayout role="admin" title="Certificates">
      <div className="mb-5 flex justify-end">
        <button className="btn-primary" onClick={() => setGenerateOpen(true)}>
          <Sparkles size={16} /> Generate Certificate
        </button>
      </div>

      {loading ? (
        <div className="flex justify-center py-24">
          <Spinner size="lg" />
        </div>
      ) : certificates.length === 0 ? (
        <EmptyState icon={Award} title="No certificates issued yet" description="Generate certificates for students who completed a course." />
      ) : (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {certificates.map((c) => (
            <div key={c._id} className="card overflow-hidden">
              <div className="flex items-center justify-center bg-gradient-to-br from-primary-700 to-primary-900 py-6">
                <Award size={40} className="text-secondary-300" />
              </div>
              <div className="p-4">
                <h3 className="font-semibold text-slate-800 line-clamp-1">{c.studentNameSnapshot}</h3>
                <p className="text-xs text-slate-500 line-clamp-1">{c.courseTitleSnapshot}</p>
                <p className="mt-2 font-mono text-[11px] text-primary-600">{c.certificateId}</p>
                <p className="mt-1 text-xs text-slate-400">{new Date(c.issueDate).toLocaleDateString()}</p>
                {c.revoked && <span className="badge mt-2 bg-red-50 text-red-600">Revoked</span>}
                <div className="mt-4 flex gap-2">
                  <a href={c.pdfUrl} target="_blank" rel="noreferrer" className="btn-outline flex-1 py-2 text-xs">
                    <Download size={13} /> PDF
                  </a>
                  <a
                    href={c.verificationUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="btn-outline flex-1 py-2 text-xs"
                  >
                    <QrCode size={13} /> Verify
                  </a>
                  {!c.revoked && (
                    <button onClick={() => setRevokeTarget(c)} className="btn-outline px-2.5 py-2 text-red-500 hover:bg-red-50">
                      <Trash2 size={14} />
                    </button>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      <GenerateCertificateModal isOpen={generateOpen} onClose={() => setGenerateOpen(false)} onGenerated={load} />

      <ConfirmDialog
        isOpen={!!revokeTarget}
        onClose={() => setRevokeTarget(null)}
        onConfirm={handleRevoke}
        title="Revoke certificate"
        message={`Revoke the certificate for ${revokeTarget?.studentNameSnapshot}? It will no longer verify as valid.`}
        confirmLabel="Revoke"
      />
    </DashboardLayout>
  );
}

function GenerateCertificateModal({
  isOpen,
  onClose,
  onGenerated,
}: {
  isOpen: boolean;
  onClose: () => void;
  onGenerated: () => void;
}) {
  const [courses, setCourses] = useState<Course[]>([]);
  const [courseId, setCourseId] = useState('');
  const [eligible, setEligible] = useState<User[]>([]);
  const [studentId, setStudentId] = useState('');
  const [grade, setGrade] = useState('');
  const [loadingEligible, setLoadingEligible] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (isOpen) courseService.getCourses({ status: 'published' }).then((d) => setCourses(d.courses));
  }, [isOpen]);

  useEffect(() => {
    if (!courseId) {
      setEligible([]);
      return;
    }
    setLoadingEligible(true);
    certificateService
      .getEligibleStudents(courseId)
      .then((d) => setEligible(d.students))
      .finally(() => setLoadingEligible(false));
  }, [courseId]);

  const handleSubmit = async () => {
    if (!studentId || !courseId) {
      toast.error('Select a course and an eligible student.');
      return;
    }
    setIsSubmitting(true);
    try {
      await certificateService.generateCertificate(studentId, courseId, grade || undefined);
      toast.success('Certificate generated and issued.');
      setCourseId('');
      setStudentId('');
      setGrade('');
      onClose();
      onGenerated();
    } catch (err) {
      toast.error(getErrorMessage(err));
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Generate Certificate" size="sm">
      <div className="space-y-4">
        <div>
          <label className="label">Course</label>
          <select value={courseId} onChange={(e) => setCourseId(e.target.value)} className="input">
            <option value="">Select a published course…</option>
            {courses.map((c) => (
              <option key={c._id} value={c._id}>
                {c.title}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label className="label">Eligible student (100% course completion)</label>
          {loadingEligible ? (
            <div className="flex justify-center py-3">
              <Spinner size="sm" />
            </div>
          ) : (
            <select value={studentId} onChange={(e) => setStudentId(e.target.value)} className="input" disabled={!courseId}>
              <option value="">{courseId ? 'Select a student…' : 'Select a course first'}</option>
              {eligible.map((s) => (
                <option key={s._id} value={s._id}>
                  {s.name} ({s.studentId})
                </option>
              ))}
            </select>
          )}
          {courseId && !loadingEligible && eligible.length === 0 && (
            <p className="mt-1.5 text-xs text-slate-400">No students have completed this course yet, or all are already certified.</p>
          )}
        </div>
        <div>
          <label className="label">Grade (optional)</label>
          <input value={grade} onChange={(e) => setGrade(e.target.value)} className="input" placeholder="e.g. Distinction, A+" />
        </div>
        <div className="flex justify-end gap-3 pt-2">
          <button className="btn-outline" onClick={onClose}>
            Cancel
          </button>
          <button className="btn-primary" onClick={handleSubmit} disabled={isSubmitting || !studentId}>
            {isSubmitting ? 'Generating…' : 'Generate Certificate'}
          </button>
        </div>
      </div>
    </Modal>
  );
}
