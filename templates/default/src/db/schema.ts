import {
  date,
  integer,
  pgEnum,
  pgTable,
  text,
  timestamp,
  uuid,
  uniqueIndex,
} from "drizzle-orm/pg-core";
import { relations } from "drizzle-orm";

export const memberRoleEnum = pgEnum("member_role", ["admin", "member"]);

export const syllabusStatusEnum = pgEnum("syllabus_status", [
  "draft",
  "published",
  "archived",
]);

export const slideLinkProviderEnum = pgEnum("slide_link_provider", [
  "google_drive",
  "canva",
]);

export const users = pgTable(
  "users",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    clerkUserId: text("clerk_user_id").notNull(),
    email: text("email").notNull(),
    name: text("name"),
    createdAt: timestamp("created_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
  },
  (t) => [uniqueIndex("users_clerk_user_id_idx").on(t.clerkUserId)],
);

export const organizations = pgTable(
  "organizations",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    clerkOrgId: text("clerk_org_id").notNull(),
    name: text("name").notNull(),
    createdAt: timestamp("created_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
  },
  (t) => [uniqueIndex("organizations_clerk_org_id_idx").on(t.clerkOrgId)],
);

export const organizationMembers = pgTable(
  "organization_members",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    organizationId: uuid("organization_id")
      .notNull()
      .references(() => organizations.id, { onDelete: "cascade" }),
    userId: uuid("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    role: memberRoleEnum("role").notNull().default("member"),
    createdAt: timestamp("created_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
  },
  (t) => [
    uniqueIndex("organization_members_org_user_idx").on(
      t.organizationId,
      t.userId,
    ),
  ],
);

export const syllabuses = pgTable("syllabuses", {
  id: uuid("id").defaultRandom().primaryKey(),
  organizationId: uuid("organization_id")
    .notNull()
    .references(() => organizations.id, { onDelete: "cascade" }),
  title: text("title").notNull(),
  description: text("description"),
  status: syllabusStatusEnum("status").notNull().default("draft"),
  createdAt: timestamp("created_at", { withTimezone: true })
    .defaultNow()
    .notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true })
    .defaultNow()
    .notNull(),
});

export const usersRelations = relations(users, ({ many }) => ({
  memberships: many(organizationMembers),
}));

export const organizationsRelations = relations(organizations, ({ many }) => ({
  members: many(organizationMembers),
  syllabuses: many(syllabuses),
}));

export const organizationMembersRelations = relations(
  organizationMembers,
  ({ one }) => ({
    organization: one(organizations, {
      fields: [organizationMembers.organizationId],
      references: [organizations.id],
    }),
    user: one(users, {
      fields: [organizationMembers.userId],
      references: [users.id],
    }),
  }),
);

export const syllabusSessions = pgTable("syllabus_sessions", {
  id: uuid("id").defaultRandom().primaryKey(),
  syllabusId: uuid("syllabus_id")
    .notNull()
    .references(() => syllabuses.id, { onDelete: "cascade" }),
  sessionNumber: integer("session_number").notNull(),
  sessionDate: date("session_date"),
  title: text("title").notNull(),
  learningObjectives: text("learning_objectives"),
  preparation: text("preparation"),
  sortOrder: integer("sort_order").notNull().default(0),
  createdAt: timestamp("created_at", { withTimezone: true })
    .defaultNow()
    .notNull(),
});

export const sessionScheduleItems = pgTable("session_schedule_items", {
  id: uuid("id").defaultRandom().primaryKey(),
  sessionId: uuid("session_id")
    .notNull()
    .references(() => syllabusSessions.id, { onDelete: "cascade" }),
  sortOrder: integer("sort_order").notNull().default(0),
  time: text("time").notNull(),
  content: text("content").notNull(),
  teacherAction: text("teacher_action"),
  studentActivity: text("student_activity"),
  materials: text("materials"),
});

export const sessionSlides = pgTable("session_slides", {
  id: uuid("id").defaultRandom().primaryKey(),
  sessionId: uuid("session_id")
    .notNull()
    .references(() => syllabusSessions.id, { onDelete: "cascade" }),
  sortOrder: integer("sort_order").notNull().default(0),
  title: text("title").notNull(),
  thumbnailUrl: text("thumbnail_url"),
  linkUrl: text("link_url").notNull(),
  linkProvider: slideLinkProviderEnum("link_provider")
    .notNull()
    .default("google_drive"),
});

export const sessionReferences = pgTable("session_references", {
  id: uuid("id").defaultRandom().primaryKey(),
  sessionId: uuid("session_id")
    .notNull()
    .references(() => syllabusSessions.id, { onDelete: "cascade" }),
  sortOrder: integer("sort_order").notNull().default(0),
  title: text("title").notNull(),
  url: text("url").notNull(),
  type: text("type"),
  memo: text("memo"),
});

export const syllabusesRelations = relations(syllabuses, ({ one, many }) => ({
  organization: one(organizations, {
    fields: [syllabuses.organizationId],
    references: [organizations.id],
  }),
  sessions: many(syllabusSessions),
}));

export const syllabusSessionsRelations = relations(
  syllabusSessions,
  ({ one, many }) => ({
    syllabus: one(syllabuses, {
      fields: [syllabusSessions.syllabusId],
      references: [syllabuses.id],
    }),
    scheduleItems: many(sessionScheduleItems),
    slides: many(sessionSlides),
    references: many(sessionReferences),
  }),
);

export const sessionScheduleItemsRelations = relations(
  sessionScheduleItems,
  ({ one }) => ({
    session: one(syllabusSessions, {
      fields: [sessionScheduleItems.sessionId],
      references: [syllabusSessions.id],
    }),
  }),
);

export const sessionSlidesRelations = relations(sessionSlides, ({ one }) => ({
  session: one(syllabusSessions, {
    fields: [sessionSlides.sessionId],
    references: [syllabusSessions.id],
  }),
}));

export const sessionReferencesRelations = relations(
  sessionReferences,
  ({ one }) => ({
    session: one(syllabusSessions, {
      fields: [sessionReferences.sessionId],
      references: [syllabusSessions.id],
    }),
  }),
);
