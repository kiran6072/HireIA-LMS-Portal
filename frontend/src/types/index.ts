export type Role = 'admin' | 'student';

export interface User {
  _id: string;
  name: string;
  email: string;
  role: Role;
  avatarUrl?: string;
  phone?: string;
  isActive: boolean;
  lastLogin?: string;
  studentId?: string;
  batch?: string;
  course?: string;
  resumeUrl?: string;
  createdAt: string;
}

export interface Lesson {
  _id: string;
  module: string;
  course: string;
  title: string;
  type: 'video' | 'pdf' | 'docx' | 'ppt' | 'zip' | 'notes';
  order: number;
  notesContent?: string;
  fileUrl?: string;
  fileSizeBytes?: number;
  durationSeconds?: number;
  isPreview: boolean;
}

export interface CourseModule {
  _id: string;
  course: string;
  title: string;
  description?: string;
  order: number;
  lessons: Lesson[];
}

export interface Course {
  _id: string;
  title: string;
  slug: string;
  description: string;
  thumbnailUrl?: string;
  category: string;
  level: 'Beginner' | 'Intermediate' | 'Advanced';
  durationWeeks: number;
  status: 'draft' | 'published' | 'archived';
  createdBy: { _id: string; name: string; email: string } | string;
  enrolledStudents: string[];
  modules: CourseModule[];
  studentCount?: number;
  createdAt: string;
  publishedAt?: string;
}

export interface Progress {
  _id: string;
  student: string;
  course: string;
  completedLessons: string[];
  percentComplete: number;
  lastAccessedAt: string;
  completedAt?: string;
}

export interface Assignment {
  _id: string;
  title: string;
  description: string;
  course: { _id: string; title: string } | string;
  questionFileUrl?: string;
  maxMarks: number;
  dueDate: string;
  status: 'draft' | 'published';
  createdAt: string;
  mySubmission?: Submission | null;
}

export interface Submission {
  _id: string;
  assignment: string | Assignment;
  student: string | User;
  submissionFileUrl: string;
  submittedAt: string;
  isLate: boolean;
  status: 'submitted' | 'graded' | 'resubmit_requested';
  grade: number | null;
  feedback: string;
  gradedAt?: string;
}

export interface TestQuestion {
  _id: string;
  questionText: string;
  options: { _id: string; text: string }[];
  correctOptionIndex?: number;
  marks: number;
  explanation?: string;
}

export interface Test {
  _id: string;
  title: string;
  description?: string;
  course: { _id: string; title: string } | string;
  questions: TestQuestion[];
  questionCount?: number;
  durationMinutes: number;
  questionsPerAttempt: number;
  passingPercent: number;
  maxAttempts: number;
  status: 'draft' | 'published';
  availableFrom?: string;
  availableTo?: string;
  totalMarks?: number;
  attemptsUsed?: number;
  attemptsRemaining?: number;
  bestScorePercent?: number | null;
  createdAt: string;
}

export interface TestAttemptResult {
  totalMarks: number;
  scoredMarks: number;
  percent: number;
  passed: boolean;
  passingPercent: number;
}

export interface TestReviewItem {
  questionText: string;
  options: { _id: string; text: string }[];
  correctOptionIndex: number;
  selectedOptionIndex: number | null;
  isCorrect: boolean;
  explanation?: string;
  marks: number;
}

export interface Certificate {
  _id: string;
  certificateId: string;
  student: { _id: string; name: string; email: string; studentId: string } | string;
  course: { _id: string; title: string } | string;
  studentNameSnapshot: string;
  courseTitleSnapshot: string;
  issueDate: string;
  grade?: string;
  pdfUrl: string;
  qrCodeDataUrl?: string;
  verificationUrl: string;
  revoked: boolean;
}

export type PlacementStatus = 'applied' | 'interview_scheduled' | 'interviewed' | 'offered' | 'rejected' | 'joined';

export interface Placement {
  _id: string;
  student: { _id: string; name: string; email: string; studentId: string; batch?: string } | string;
  company: string;
  role: string;
  salaryLPA: number;
  location?: string;
  status: PlacementStatus;
  driveDate?: string;
  offerLetterUrl?: string;
  notes?: string;
  createdAt: string;
}

export interface Notification {
  _id: string;
  recipient: string;
  title: string;
  message: string;
  type: 'course' | 'assignment' | 'test' | 'certificate' | 'placement' | 'system' | 'grade';
  link?: string;
  isRead: boolean;
  createdAt: string;
}

export interface ApiListResponse<T> {
  success: boolean;
  count?: number;
  [key: string]: unknown;
}
