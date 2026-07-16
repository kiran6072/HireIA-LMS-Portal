import { useEffect, useState } from 'react';
import { Briefcase, Download, MapPin, Calendar } from 'lucide-react';
import toast from 'react-hot-toast';
import DashboardLayout from '@/components/layout/DashboardLayout';
import Spinner from '@/components/common/Spinner';
import { StatusBadge } from '@/components/common/Badge';
import EmptyState from '@/components/common/EmptyState';
import * as placementService from '@/api/placementService';
import { getErrorMessage } from '@/api/axios';
import type { Placement } from '@/types';

const STAGES = ['applied', 'interview_scheduled', 'interviewed', 'offered', 'joined'];

export default function Placements() {
  const [placements, setPlacements] = useState<Placement[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    placementService
      .getPlacements()
      .then((d) => setPlacements(d.placements))
      .catch((err) => toast.error(getErrorMessage(err)))
      .finally(() => setLoading(false));
  }, []);

  return (
    <DashboardLayout role="student" title="Placements">
      {loading ? (
        <div className="flex justify-center py-24">
          <Spinner size="lg" />
        </div>
      ) : placements.length === 0 ? (
        <EmptyState icon={Briefcase} title="No placement activity yet" description="Your placement drives and offers will appear here." />
      ) : (
        <div className="space-y-4">
          {placements.map((p) => {
            const stageIdx = STAGES.indexOf(p.status);
            const isRejected = p.status === 'rejected';
            return (
              <div key={p._id} className="card p-5">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <h3 className="font-semibold text-slate-800">
                      {p.role} at {p.company}
                    </h3>
                    <div className="mt-1 flex flex-wrap items-center gap-3 text-xs text-slate-500">
                      <span className="font-medium text-primary-700">₹{p.salaryLPA} LPA</span>
                      {p.location && (
                        <span className="flex items-center gap-1">
                          <MapPin size={12} /> {p.location}
                        </span>
                      )}
                      {p.driveDate && (
                        <span className="flex items-center gap-1">
                          <Calendar size={12} /> {new Date(p.driveDate).toLocaleDateString()}
                        </span>
                      )}
                    </div>
                  </div>
                  <StatusBadge status={p.status} />
                </div>

                {!isRejected && (
                  <div className="mt-5 flex items-center">
                    {STAGES.map((stage, idx) => (
                      <div key={stage} className="flex flex-1 items-center last:flex-none">
                        <div
                          className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-[10px] font-bold ${
                            idx <= stageIdx ? 'bg-secondary text-white' : 'bg-slate-100 text-slate-400'
                          }`}
                        >
                          {idx + 1}
                        </div>
                        {idx < STAGES.length - 1 && (
                          <div className={`h-0.5 flex-1 ${idx < stageIdx ? 'bg-secondary' : 'bg-slate-100'}`} />
                        )}
                      </div>
                    ))}
                  </div>
                )}

                {p.notes && <p className="mt-3 text-sm text-slate-500">{p.notes}</p>}

                {p.offerLetterUrl && (
                  <a href={p.offerLetterUrl} target="_blank" rel="noreferrer" className="btn-outline mt-4 inline-flex text-xs">
                    <Download size={13} /> Download Offer Letter
                  </a>
                )}
              </div>
            );
          })}
        </div>
      )}
    </DashboardLayout>
  );
}
