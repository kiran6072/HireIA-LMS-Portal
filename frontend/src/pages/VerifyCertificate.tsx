import { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { GraduationCap, CheckCircle2, XCircle, Download, Calendar, Award } from 'lucide-react';
import * as certificateService from '@/api/certificateService';
import Spinner from '@/components/common/Spinner';

interface VerifiedCert {
  certificateId: string;
  studentName: string;
  courseTitle: string;
  issueDate: string;
  grade?: string;
  pdfUrl: string;
}

export default function VerifyCertificate() {
  const { certificateId } = useParams<{ certificateId: string }>();
  const [loading, setLoading] = useState(true);
  const [valid, setValid] = useState(false);
  const [cert, setCert] = useState<VerifiedCert | null>(null);
  const [message, setMessage] = useState('');

  useEffect(() => {
    if (!certificateId) return;
    certificateService
      .verifyCertificate(certificateId)
      .then((data) => {
        setValid(data.valid);
        setCert(data.certificate || null);
        setMessage(data.message || '');
      })
      .catch(() => {
        setValid(false);
        setMessage('Unable to verify this certificate right now.');
      })
      .finally(() => setLoading(false));
  }, [certificateId]);

  return (
    <div className="min-h-screen bg-primary-800 flex flex-col items-center justify-center p-6">
      <Link to="/" className="mb-8 flex items-center gap-2.5 text-white">
        <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-secondary">
          <GraduationCap size={20} />
        </div>
        <span className="font-display text-lg font-bold">HireIA LMS</span>
      </Link>

      <div className="w-full max-w-md rounded-2xl bg-white p-8 shadow-elevated">
        {loading ? (
          <div className="flex flex-col items-center py-10">
            <Spinner size="lg" />
            <p className="mt-4 text-sm text-slate-500">Verifying certificate…</p>
          </div>
        ) : valid && cert ? (
          <div>
            <div className="flex flex-col items-center text-center">
              <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-emerald-50">
                <CheckCircle2 size={32} className="text-emerald-600" />
              </div>
              <h1 className="text-lg font-bold text-slate-800">Certificate Verified</h1>
              <p className="mt-1 text-sm text-slate-500">This certificate is authentic and issued by HireIA LMS.</p>
            </div>

            <div className="mt-6 space-y-3 rounded-xl bg-slate-50 p-4">
              <div className="flex items-center justify-between">
                <span className="text-xs font-medium text-slate-500">Student</span>
                <span className="text-sm font-semibold text-slate-800">{cert.studentName}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-xs font-medium text-slate-500">Course</span>
                <span className="text-right text-sm font-semibold text-slate-800">{cert.courseTitle}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-xs font-medium text-slate-500 flex items-center gap-1">
                  <Calendar size={12} /> Issue Date
                </span>
                <span className="text-sm font-semibold text-slate-800">
                  {new Date(cert.issueDate).toLocaleDateString('en-IN', { year: 'numeric', month: 'long', day: 'numeric' })}
                </span>
              </div>
              {cert.grade && (
                <div className="flex items-center justify-between">
                  <span className="text-xs font-medium text-slate-500 flex items-center gap-1">
                    <Award size={12} /> Grade
                  </span>
                  <span className="text-sm font-semibold text-slate-800">{cert.grade}</span>
                </div>
              )}
              <div className="flex items-center justify-between">
                <span className="text-xs font-medium text-slate-500">Certificate ID</span>
                <span className="font-mono text-xs font-semibold text-primary-700">{cert.certificateId}</span>
              </div>
            </div>

            <a href={cert.pdfUrl} target="_blank" rel="noreferrer" className="btn-primary mt-6 w-full">
              <Download size={16} /> Download Certificate
            </a>
          </div>
        ) : (
          <div className="flex flex-col items-center text-center py-6">
            <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-red-50">
              <XCircle size={32} className="text-red-600" />
            </div>
            <h1 className="text-lg font-bold text-slate-800">Certificate Not Found</h1>
            <p className="mt-1 text-sm text-slate-500">{message || 'This certificate ID could not be verified.'}</p>
          </div>
        )}
      </div>
    </div>
  );
}
