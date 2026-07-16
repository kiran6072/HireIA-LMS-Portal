import type { ReactNode } from 'react';
import { GraduationCap, ShieldCheck, Sparkles, Trophy } from 'lucide-react';

export default function AuthLayout({ children, title, subtitle }: { children: ReactNode; title: string; subtitle: string }) {
  return (
    <div className="grid min-h-screen grid-cols-1 lg:grid-cols-2">
      <div className="relative hidden flex-col justify-between overflow-hidden bg-primary-800 p-12 text-white lg:flex">
        <div className="absolute -right-24 -top-24 h-72 w-72 rounded-full bg-secondary/20 blur-3xl" />
        <div className="absolute -bottom-32 -left-16 h-80 w-80 rounded-full bg-primary-500/30 blur-3xl" />

        <div className="relative flex items-center gap-2.5">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-secondary">
            <GraduationCap size={22} />
          </div>
          <span className="font-display text-xl font-bold">HireIA LMS</span>
        </div>

        <div className="relative max-w-md">
          <h2 className="font-display text-3xl font-bold leading-tight">
            Learn. Assess. <span className="text-secondary-300">Get Hired.</span>
          </h2>
          <p className="mt-4 text-primary-200">
            One platform for course delivery, assessments, certification and placement tracking — built for training
            institutes and their students.
          </p>

          <div className="mt-10 space-y-5">
            <div className="flex items-start gap-3">
              <div className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-white/10">
                <Sparkles size={16} className="text-secondary-300" />
              </div>
              <p className="text-sm text-primary-100">Structured courses with video, docs, and hands-on assignments</p>
            </div>
            <div className="flex items-start gap-3">
              <div className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-white/10">
                <ShieldCheck size={16} className="text-secondary-300" />
              </div>
              <p className="text-sm text-primary-100">Timed MCQ tests with instant, verifiable results</p>
            </div>
            <div className="flex items-start gap-3">
              <div className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-white/10">
                <Trophy size={16} className="text-secondary-300" />
              </div>
              <p className="text-sm text-primary-100">QR-verified certificates and end-to-end placement tracking</p>
            </div>
          </div>
        </div>

        <p className="relative text-xs text-primary-300">&copy; {new Date().getFullYear()} HireIA LMS. All rights reserved.</p>
      </div>

      <div className="flex items-center justify-center p-6 sm:p-10">
        <div className="w-full max-w-md">
          <div className="mb-8 flex items-center gap-2.5 lg:hidden">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary-700">
              <GraduationCap size={20} className="text-white" />
            </div>
            <span className="font-display text-lg font-bold text-primary-800">HireIA LMS</span>
          </div>
          <h1 className="font-display text-2xl font-bold text-slate-800">{title}</h1>
          <p className="mt-1.5 text-sm text-slate-500">{subtitle}</p>
          <div className="mt-8">{children}</div>
        </div>
      </div>
    </div>
  );
}
