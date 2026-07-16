import { useEffect, useState } from 'react';
import { Award, Download, QrCode } from 'lucide-react';
import toast from 'react-hot-toast';
import DashboardLayout from '@/components/layout/DashboardLayout';
import Spinner from '@/components/common/Spinner';
import EmptyState from '@/components/common/EmptyState';
import * as certificateService from '@/api/certificateService';
import { getErrorMessage } from '@/api/axios';
import type { Certificate } from '@/types';

export default function Certificates() {
  const [certificates, setCertificates] = useState<Certificate[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    certificateService
      .getCertificates()
      .then((d) => setCertificates(d.certificates))
      .catch((err) => toast.error(getErrorMessage(err)))
      .finally(() => setLoading(false));
  }, []);

  return (
    <DashboardLayout role="student" title="My Certificates">
      {loading ? (
        <div className="flex justify-center py-24">
          <Spinner size="lg" />
        </div>
      ) : certificates.length === 0 ? (
        <EmptyState icon={Award} title="No certificates yet" description="Complete a course to earn your first certificate." />
      ) : (
        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {certificates.map((c) => (
            <div key={c._id} className="card overflow-hidden">
              <div className="relative flex items-center justify-center bg-gradient-to-br from-primary-700 to-primary-900 py-8">
                <Award size={44} className="text-secondary-300" />
                {c.revoked && <span className="absolute right-3 top-3 badge bg-red-500 text-white">Revoked</span>}
              </div>
              <div className="p-5">
                <h3 className="font-semibold text-slate-800">{c.courseTitleSnapshot}</h3>
                {c.grade && <p className="mt-1 text-sm text-secondary-600">Grade: {c.grade}</p>}
                <p className="mt-2 text-xs text-slate-400">Issued {new Date(c.issueDate).toLocaleDateString()}</p>
                <p className="mt-1 font-mono text-[11px] text-primary-600">{c.certificateId}</p>
                <div className="mt-4 flex gap-2">
                  <a href={c.pdfUrl} target="_blank" rel="noreferrer" className="btn-primary flex-1 py-2 text-xs">
                    <Download size={13} /> Download
                  </a>
                  <a href={c.verificationUrl} target="_blank" rel="noreferrer" className="btn-outline flex-1 py-2 text-xs">
                    <QrCode size={13} /> Verify
                  </a>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </DashboardLayout>
  );
}
