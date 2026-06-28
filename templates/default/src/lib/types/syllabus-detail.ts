export type SlideLinkProvider = "google_drive" | "canva";

export type ScheduleItem = {
  id: string;
  time: string;
  content: string;
  teacherAction: string;
  studentActivity: string;
  materials: string;
};

export type SessionSlide = {
  id: string;
  title: string;
  thumbnailUrl: string | null;
  linkUrl: string;
  linkProvider: SlideLinkProvider;
};

export type SessionReference = {
  id: string;
  title: string;
  url: string;
  type: string;
  memo: string;
};

export type SyllabusSession = {
  id: string;
  sessionNumber: number;
  sessionDate: string | null;
  title: string;
  learningObjectives: string;
  preparation: string;
  scheduleItems: ScheduleItem[];
  slides: SessionSlide[];
  references: SessionReference[];
};

export type OverviewSlide = {
  id: string;
  title: string;
  content: string;
};

export type OverviewPdf = {
  id: string;
  fileName: string;
};

export type SyllabusOverview = {
  textbookName: string;
  courseGoals: string;
  targetStudentLevel: string;
  plannedSessionCount: number | null;
  slides: OverviewSlide[];
  pdfs: OverviewPdf[];
};

export const emptySyllabusOverview = (): SyllabusOverview => ({
  textbookName: "",
  courseGoals: "",
  targetStudentLevel: "",
  plannedSessionCount: null,
  slides: [],
  pdfs: [],
});

export type SyllabusDetail = {
  id: string;
  title: string;
  description: string | null;
  status: "draft" | "published" | "archived";
  overview: SyllabusOverview;
  sessions: SyllabusSession[];
};
