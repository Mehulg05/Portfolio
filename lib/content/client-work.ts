/*
  Alpha Academy: a live client project, written up as an engineering case study.

  Sources, checked on 2026-11-15:
  - The codebase (Alphaa/Alpha-academy): api/src/auth/{permissions,scope,service,password}.ts,
    api/src/modules/{attendance,tests,homework,library,leads,reports}, api/src/lib/{audit,storage,
    attachments}.ts, api/src/db/schema.ts, render.yaml, render.staging.yaml, api/test, qa/tests.
  - The staging build (staging.alphaacademykarnal.in), where every walkthrough frame was recorded.
    Staging holds sample data only: every student, parent and enquiry on these screens is invented.
    Production data never leaves the portal.

  Log lines in `walkthrough` name real routes, checks and audit actions from the code. They are a
  narrated trace, not captured server output, so no latency or byte count appears in them.

  Lines with a `[DRAFT]` comment are wording without a source. Mehul to confirm or replace them.
*/

export const clientWork = {
  client: "Alpha Academy",
  kind: "Physics coaching institute · Karnal, Haryana",
  status: "Live in production",
  href: "https://alphaacademykarnal.in",
  summary:
    "The institute's public website, a role-based portal and the API behind both. Six roles sign in at one login; attendance, marks, homework and files are written once and read by every role through its own scope.",
  ownership:
    "I designed, built and run all of it: the Next.js site and portal, the Fastify API, the Postgres schema, auth, file storage and the Render deployment.", // [DRAFT]

  /* Counted in the codebase. */
  facts: [
    { value: 6, label: "roles behind one login" },
    { value: 16, label: "permissions in the RBAC matrix" },
    { value: 31, label: "Postgres tables · 13 migrations" },
    { value: 43, label: "API integration test files" },
  ],

  walkthroughNote:
    "Screen recordings of the staging build, edited to cut waiting time. Names, marks and enquiries are sample data; production records stay in the portal.",

  architecture: [
    { label: "Next.js static export", note: "public site + /portal SPA, no server runtime" },
    { label: "Fastify API", note: "Node 22 · zod on every body and query" },
    { label: "Auth + RBAC + scope", note: "role → permission → which rows" },
    { label: "Postgres on Neon", note: "Drizzle ORM · audit in the same tx" },
    { label: "S3-compatible storage", note: "private bucket · 60 s signed links" },
  ],

  decisions: [
    {
      title: "One record, many views",
      body: "Attendance is keyed on (class session, student) and marks on (test, student). Every role reads those same rows through a scope: staff see all batches, faculty their batch_faculty assignments, students themselves, parents their linked children. Nothing is copied per role, so nothing drifts.",
      ref: "api/src/auth/scope.ts",
    },
    {
      title: "Transactional writes with an audit trail",
      body: "An attendance save locks the class session row (SELECT … FOR UPDATE), upserts on the composite key, and writes its audit row inside the same transaction. Corrections to another person's mark, or after 24 hours, need a reason and are audited one by one with from → to.",
      ref: "api/src/modules/attendance/index.ts",
    },
    {
      title: "Auth without an auth vendor",
      body: "argon2id at OWASP's profile (19 MiB, t=2), a dummy-hash verify so unknown IDs take the same time, lockout with exponential backoff. 15-minute HMAC access tokens in HttpOnly cookies, refresh tokens rotated on every use with reuse detection, one active session per user.",
      ref: "api/src/auth/{password,service,tokens}.ts",
    },
    {
      title: "Files that never leak",
      body: "Uploads go to S3-compatible storage through aws4fetch, under random keys that are stripped from API responses. Downloads are 60-second presigned URLs after a scope check; inline views stream with a sandbox CSP, nosniff and no-store, and pdf.js loads only when a file opens.",
      ref: "api/src/lib/{storage,attachments}.ts",
    },
    {
      title: "Built for a classroom on one Wi-Fi",
      body: "Rate limits key on the signed-in user (300 a minute), not the IP, because a whole batch shares the institute's connection; anonymous traffic gets 600 per IP. The enquiry form adds a honeypot, a minimum fill time, idempotency keys and per-mobile limits.",
      ref: "api/src/app.ts · modules/leads",
    },
    {
      title: "Tested against a real Postgres",
      body: "43 Vitest integration files run every route against a migrated database in PGlite (Postgres compiled to WebAssembly): RBAC, scoping, session security, rate limits, file views. Playwright and axe cover the public site's routes, SEO, forms and accessibility.",
      ref: "api/test · qa/tests",
    },
  ],

  ops: [
    "Render Blueprint: a static site and a Node web service, with migrations and seed in the build.",
    "Staging mirrors production on its own branch, its own Neon database branch and noindex headers.",
    "A deploy watchdog script cancels and retries Render deploys that stall.",
  ],

  stack: [
    "Next.js 16",
    "React 19",
    "TypeScript",
    "Tailwind CSS 4",
    "Fastify 5",
    "Zod 4",
    "PostgreSQL · Neon",
    "Drizzle ORM",
    "argon2id",
    "S3 · aws4fetch",
    "pdf.js",
    "pdfkit",
    "Vitest · PGlite",
    "Playwright · axe",
    "Render",
  ],
} as const;

/* ------------------------------------------------------------------------------------ */
/*  Walkthrough: one flow per role. Video flows are real screen recordings of the staging */
/*  build (idle time cut, slow loads sped up); each step starts at a timestamp in the     */
/*  video and carries the server-side trace of what that part of the recording does.     */
/*  Image flows are single frames, for screens that read better as stills.               */
/* ------------------------------------------------------------------------------------ */

export type LogKind = "req" | "auth" | "perm" | "scope" | "check" | "db" | "audit" | "res" | "deny" | "note";
export type LogLine = { kind: LogKind; text: string };

type StepCopy = {
  title: string;
  detail: string;
  tech: string[];
  log: LogLine[];
};

export type VideoStep = StepCopy & {
  /** Seconds into the edited video where this step begins. */
  at: number;
};

export type ImageStep = StepCopy & {
  image: string;
  alt: string;
  /** Where the cursor goes on this frame, as a percentage. */
  cursor: { x: number; y: number };
  click?: boolean;
  focus?: { x: number; y: number };
};

type FlowBase = {
  id: string;
  label: string;
  /** Who is signed in. */
  actor: string;
  summary: string;
  /** Pixel size of the flow's frames. */
  frame: { width: number; height: number };
};

export type VideoFlow = FlowBase & {
  kind: "video";
  video: { src: string; poster: string; seconds: number; description: string };
  steps: VideoStep[];
};

export type ImageFlow = FlowBase & {
  kind: "images";
  steps: ImageStep[];
};

export type WalkFlow = VideoFlow | ImageFlow;

const v = (name: string) => ({ src: `/client-work/${name}.mp4`, poster: `/client-work/${name}.jpg` });
const img = (name: string) => `/client-work/${name}.jpg`;

export const walkthrough: WalkFlow[] = [
  {
    id: "faculty",
    kind: "video",
    label: "Faculty",
    actor: "Signed in as a physics teacher",
    summary:
      "Marks a register, enters and publishes quiz marks, posts homework. Every write is permission-checked, scoped to the teacher's batches, committed in one transaction and audited.",
    frame: { width: 1600, height: 832 },
    video: {
      ...v("walk-faculty"),
      seconds: 61.17,
      description:
        "Screen recording: a teacher opens the dashboard, marks two students absent and one late, confirms the rest present, types quiz marks for 24 students with a remark, publishes the results and posts homework.",
    },
    steps: [
      {
        at: 0,
        title: "A teacher's day, built from their own scope",
        detail: "Classes, registers left unmarked and tests waiting for marks, computed only from the batches and subjects this teacher is assigned to.",
        tech: ["GET /api/dashboard", "scope.ts", "batch_faculty"],
        log: [
          { kind: "req", text: "GET /api/dashboard" },
          { kind: "scope", text: "loadScopeFor() → faculty · batches from batch_faculty" },
          { kind: "res", text: "200 · 1 register pending · 1 test needs marks" },
        ],
      },
      {
        at: 6.09,
        title: "Marking a register",
        detail: "One tap per mark. The register lists only students whose active enrolment covers this subject; anyone left unmarked is confirmed present in one step.",
        tech: ["PUT /sessions/:id/attendance", "requirePermission", "assertWriteBatch"],
        log: [
          { kind: "req", text: "PUT /api/sessions/:id/attendance  { rows: 24 }" },
          { kind: "perm", text: "requirePermission('attendance.mark') ✓" },
          { kind: "scope", text: "assertWriteBatch(scope, batch, subject) ✓" },
          { kind: "check", text: "not a holiday · not cancelled · date ≤ today (IST)" },
        ],
      },
      {
        at: 14.6,
        title: "Saved in one transaction",
        detail: "The session row is locked, the register upserted and the audit row written together. Students and parents read these same rows, so there is nothing to sync.",
        tech: ["FOR UPDATE", "ON CONFLICT", "audit()"],
        log: [
          { kind: "db", text: "BEGIN · SELECT class_sessions … FOR UPDATE" },
          { kind: "db", text: "INSERT attendance … ON CONFLICT (session_id, student_id) DO UPDATE" },
          { kind: "audit", text: "attendance.mark · class_session · rows: 24" },
          { kind: "db", text: "COMMIT" },
        ],
      },
      {
        at: 20.12,
        title: "Marks entered like a spreadsheet",
        detail: "Enter moves down, one tick marks an absentee, and every change autosaves while the batch average, highest and lowest update live.",
        tech: ["PUT /tests/:id/marks", "zod", "autosave"],
        log: [
          { kind: "req", text: "PUT /api/tests/:id/marks  { rows: [{ studentId, marks, remarks? }] }" },
          { kind: "check", text: "zod · 0 ≤ marks ≤ maxMarks · remarks ≤ 300 chars" },
          { kind: "audit", text: "marks.enter · test" },
        ],
      },
      {
        at: 42.13,
        title: "Publishing is a deliberate step",
        detail: "Marks stay on the staff side until the test is published; student and parent reads only ever select published tests.",
        tech: ["POST /tests/:id/publish", "published = true"],
        log: [
          { kind: "req", text: "POST /api/tests/:id/publish" },
          { kind: "db", text: "UPDATE tests SET published = true" },
          { kind: "audit", text: "test.publish · test" },
          { kind: "res", text: "24 students and their linked parents can now read the result" },
        ],
      },
      {
        at: 50.23,
        title: "Posting homework",
        detail: "Faculty post to the batches they teach; the batch list in the form is already filtered by their scope.",
        tech: ["POST /api/homework", "submissionId"],
        log: [
          { kind: "req", text: "POST /api/homework  { batchId, title, body, dueDate, submissionId }" },
          { kind: "scope", text: "assertWriteBatch → own batches only" },
          { kind: "check", text: "submissionId is the row id: a double tap can't post twice" },
          { kind: "audit", text: "homework.create" },
        ],
      },
    ],
  },
  {
    id: "student",
    kind: "video",
    label: "Student",
    actor: "Signed in as a Class 12 student",
    summary: "Sees the result the teacher just published, attendance, homework with a PDF, lectures and report cards, all through one rule: a student's requests resolve only to themselves.",
    frame: { width: 1600, height: 912 },
    video: {
      ...v("walk-student"),
      seconds: 54.63,
      description:
        "Screen recording: a student signs in, checks the dashboard and score trend, finds the new quiz result, opens the attendance calendar, views a homework PDF inside the portal, plays a lecture and reads the teacher's remark.",
    },
    steps: [
      {
        at: 0,
        title: "Signing in as a student",
        detail: "The same login form; a student account carries a single permission, booking backup classes.",
        tech: ["role STUDENT", "backup.book"],
        log: [
          { kind: "req", text: "POST /api/auth/login" },
          { kind: "auth", text: "role STUDENT · permissions: [backup.book]" },
          { kind: "res", text: "→ /portal/student" },
        ],
      },
      {
        at: 8.6,
        title: "One dashboard, computed per student",
        detail: "Next class, attendance, average against the batch, rank and the board-exam countdown, all derived from the rows teachers wrote.",
        tech: ["GET /api/dashboard", "resolveStudentId"],
        log: [
          { kind: "req", text: "GET /api/dashboard" },
          { kind: "scope", text: "resolveStudentId(scope) → self, never a query param" },
          { kind: "res", text: "attendance · average vs batch · rank · next class" },
        ],
      },
      {
        at: 16.48,
        title: "The quiz published minutes ago",
        detail: "The score trend and the test list already include the Ray Optics quiz the teacher just published, with rank and the batch average.",
        tech: ["GET /api/me/tests", "published only"],
        log: [
          { kind: "req", text: "GET /api/me/tests" },
          { kind: "db", text: "WHERE tests.published = true AND marks.student_id = $self" },
          { kind: "res", text: "Weekly Quiz: Ray Optics · 17/20 · rank among takers" },
        ],
      },
      {
        at: 26.86,
        title: "Attendance, class by class",
        detail: "Each calendar cell is a class session generated from the timetable and then marked; a student sees only their own row of every register.",
        tech: ["GET /api/me/attendance"],
        log: [
          { kind: "req", text: "GET /api/me/attendance" },
          { kind: "db", text: "attendance ⋈ class_sessions WHERE student_id = $self" },
        ],
      },
      {
        at: 30.88,
        title: "Homework, with the file in the portal",
        detail: "Homework is one row per batch. The PDF streams from the portal's own origin and pdf.js draws it page by page, because many phone browsers won't show a PDF inside a page.",
        tech: ["?view=1", "CSP sandbox", "pdf.js"],
        log: [
          { kind: "req", text: "GET /api/homework/:id/attachment?view=1" },
          { kind: "scope", text: "same access rules as the download link" },
          { kind: "res", text: "200 application/pdf · CSP: default-src 'none'; sandbox · no-store" },
          { kind: "note", text: "attachmentKey never leaves the server; pdf.js loads only when a file opens" },
        ],
      },
      {
        at: 43.43,
        title: "Lectures, filed by chapter",
        detail: "Lectures are YouTube links tagged to a subject, batch and NCERT chapter. The site's CSP allows frames only from YouTube and Maps.",
        tech: ["GET /api/lectures", "frame-src"],
        log: [
          { kind: "req", text: "GET /api/lectures" },
          { kind: "note", text: "frame-src youtube-nocookie.com youtube.com google.com · everything else blocked" },
        ],
      },
      {
        at: 52.24,
        title: "The teacher's remark, already here",
        detail: "Remarks are stored per test mark, so the note typed during marks entry appears on the student's report-card page without anyone copying it.",
        tech: ["marks.remarks", "report cards"],
        log: [
          { kind: "req", text: "GET /api/report-cards" },
          { kind: "db", text: "remarks from published tests only" },
        ],
      },
    ],
  },
  {
    id: "parent",
    kind: "video",
    label: "Parent",
    actor: "Signed in as the student's father",
    summary: "The same rows again, reached through the parent's link to their child, and only that child.",
    frame: { width: 1600, height: 896 },
    video: {
      ...v("walk-parent"),
      seconds: 31.93,
      description:
        "Screen recording: a parent signs in, reads the summary of their child's progress and the chapters to practise, the performance charts, and the detail of the latest quiz.",
    },
    steps: [
      {
        at: 0,
        title: "Signing in as a parent",
        detail: "Parents get their own login, linked to one or more children; they hold no write permissions at all.",
        tech: ["role PARENT", "parent_links"],
        log: [
          { kind: "req", text: "POST /api/auth/login" },
          { kind: "auth", text: "role PARENT · permissions: []" },
          { kind: "scope", text: "scope.studentIds ← parent_links" },
        ],
      },
      {
        at: 9.25,
        title: "The same records the teacher wrote",
        detail: "Average, attendance and rank match the student's screen because they come from the same rows. 'Needs practice' is built from chapter-wise marks.",
        tech: ["resolveStudentId", "chapterMarks"],
        log: [
          { kind: "req", text: "GET /api/dashboard" },
          { kind: "scope", text: "resolveStudentId: only child ∈ scope.studentIds ✓" },
          { kind: "res", text: "average · attendance · rank · weakest chapters" },
        ],
      },
      {
        at: 17.64,
        title: "Performance against the batch",
        detail: "Monthly trend, subject comparison and where the child stands, computed from published tests only.",
        tech: ["GET /api/analytics/students/:id"],
        log: [
          { kind: "req", text: "GET /api/analytics/students/:id" },
          { kind: "scope", text: "assertReadStudent ✓ (linked child)" },
          { kind: "db", text: "published tests only · rank among takers" },
        ],
      },
      {
        at: 25.61,
        title: "And nobody else's child",
        detail: "The quiz published minutes ago is already here. Ask the API for a student who isn't linked and it answers 403.",
        tech: ["assertReadStudent", "403"],
        log: [
          { kind: "req", text: "GET /api/attendance/students/<another student>" },
          { kind: "scope", text: "assertReadStudent → not in scope.studentIds" },
          { kind: "deny", text: "403 { code: 'forbidden', message: \"You don't have access to this student.\" }" },
        ],
      },
    ],
  },
  {
    id: "admin",
    kind: "video",
    label: "Admin",
    actor: "Signed in as Super Admin",
    summary: "The whole institute: analytics, the enquiry pipeline and an audit trail of every write.",
    frame: { width: 1600, height: 896 },
    video: {
      ...v("walk-admin"),
      seconds: 37.6,
      description:
        "Screen recording: the Super Admin overview with live counts and charts, the leads inbox where an enquiry's status is changed, the audit log listing every write by person, and report-card settings.",
    },
    steps: [
      {
        at: 0,
        title: "The institute at a glance",
        detail: "Active students, attendance, upcoming tests, leads and recent activity, computed from the same tables. Only staff roles get the unscoped view.",
        tech: ["GET /api/analytics/institute", "analytics.view_all"],
        log: [
          { kind: "req", text: "GET /api/analytics/institute" },
          { kind: "perm", text: "analytics.view_all ✓" },
          { kind: "scope", text: "kind: all · no batch filter" },
        ],
      },
      {
        at: 14.54,
        title: "Website enquiries become a pipeline",
        detail: "Enquiries from the public site land here with a status; phone numbers become call and WhatsApp buttons (blurred in this recording).",
        tech: ["PATCH /api/leads/:id", "leads.view"],
        log: [
          { kind: "req", text: "PATCH /api/leads/:id  { status }" },
          { kind: "perm", text: "leads.view (super admin, or an admin granted it)" },
          { kind: "audit", text: "lead.update" },
        ],
      },
      {
        at: 24.19,
        title: "Every write, under the name of whoever made it",
        detail: "The audit row is written in the same transaction as the change, so the log can't drift from the data. Metadata never holds passwords or tokens.",
        tech: ["audit_logs", "same transaction"],
        log: [
          { kind: "db", text: "INSERT audit_logs (actor_id, action, entity, entity_id, meta, ip)" },
          { kind: "audit", text: "test.publish · marks.enter · attendance.mark · homework.create" },
          { kind: "perm", text: "audit.view ✓ (super admin, owner)" },
        ],
      },
      {
        at: 33.43,
        title: "Report cards, configured once",
        detail: "Sections, thresholds and branding drive the monthly PDF report cards that a scheduled job generates for every student.",
        tech: ["pdfkit", "cron"],
        log: [
          { kind: "req", text: "PUT /api/reports/settings" },
          { kind: "note", text: "POST /api/reports/run (scheduled) → pdfkit → private bucket" },
        ],
      },
    ],
  },
  {
    id: "security",
    kind: "images",
    label: "Security",
    actor: "Any role, at the door",
    summary: "Sessions, passwords and tokens, built from first principles rather than an auth service.",
    frame: { width: 1456, height: 834 },
    steps: [
      {
        image: img("security-login"),
        alt: "Portal sign-in page with login ID or mobile number and password fields.",
        title: "One login for six roles",
        detail: "Login ID or mobile, and the server works out the role. A wrong ID and a wrong password fail with the same message in the same time.",
        cursor: { x: 73.8, y: 55.2 },
        click: true,
        tech: ["argon2id", "constant time", "backoff"],
        log: [
          { kind: "req", text: "POST /api/auth/login  { identifier, password }" },
          { kind: "check", text: "argon2id verify · 19 MiB · t=2 · p=1" },
          { kind: "check", text: "unknown ID → verify against a dummy hash (no timing signal)" },
          { kind: "check", text: "failure → failedLoginCount++ · lock with exponential backoff" },
        ],
      },
      {
        image: img("security-set-password"),
        alt: "Set your own password screen shown on first sign-in, with password rules.",
        title: "Temporary passwords must be replaced",
        detail: "Accounts start with a generated temporary password and mustChangePassword. Until it is changed, the API refuses everything else.",
        cursor: { x: 73.8, y: 70.3 },
        click: true,
        tech: ["mustChangePassword"],
        log: [
          { kind: "req", text: "POST /api/auth/change-password" },
          { kind: "check", text: "mustChangePassword → all other routes refused until done" },
          { kind: "audit", text: "auth.change_password" },
        ],
      },
      {
        image: img("admin-audit"),
        alt: "Audit log entries for sign-ins and password changes by a parent and a student.",
        title: "Short-lived, rotating sessions",
        detail: "Access tokens last 15 minutes. Refresh tokens rotate on every use and only their SHA-256 is stored; replaying an old one revokes the session. One active session per user, 30 minutes idle, 12 hours at most.",
        cursor: { x: 89, y: 40.9 },
        tech: ["refresh rotation", "reuse detection", "1 session"],
        log: [
          { kind: "req", text: "POST /api/auth/refresh" },
          { kind: "check", text: "sha256(token) must match the family's current token" },
          { kind: "deny", text: "replayed token → session revoked · 401" },
          { kind: "note", text: "idle 30 min · absolute 12 h · a new sign-in ends the old session" },
        ],
      },
    ],
  },
  {
    id: "website",
    kind: "video",
    label: "Website",
    actor: "Public, no sign-in",
    summary:
      "The public site is a static Next.js export with no server runtime. Its only dynamic path is the enquiry form, which the API hardens against spam and double submits. This recording is from the live site.",
    frame: { width: 1600, height: 896 },
    video: {
      ...v("walk-website"),
      seconds: 73.07,
      description:
        "Screen recording of the live Alpha Academy website: the spring pull cord under Enquire Now is pulled, swings and opens the enquiry form, which is closed without submitting. Then the nav menus, every home-page section, the Class 12 Physics course page, the Free Tools hub and the CBSE marks calculator in use. Classroom photos and phone numbers are blurred.",
    },
    steps: [
      {
        at: 0,
        title: "A static export, served from a CDN",
        detail: "Every public page is HTML written at build time. Render serves it as a static site with security headers, and /api is rewritten to the Fastify service on the same origin.",
        tech: ["output: 'export'", "Render static site", "/api rewrite"],
        log: [
          { kind: "note", text: "next build → output: 'export' → out/<route>/index.html (trailingSlash)" },
          { kind: "note", text: "/api/* → rewrite → Fastify service · same origin, so no CORS" },
          { kind: "res", text: "CSP · X-Frame-Options: SAMEORIGIN · nosniff · Permissions-Policy" },
        ],
      },
      {
        at: 2.74,
        title: "A pull cord that obeys Hooke's law",
        detail: "The spring under Enquire Now is simulated as an elastic pendulum: spring tension, gravity and damping. While it is pulled, the label reads the spring force like a spring balance. Scrolling kicks it, the way a lamp cord swings in a lift.",
        tech: ["elastic pendulum", "requestAnimationFrame", "Pointer Events"],
        log: [
          { kind: "note", text: "a = −(k/m)(L − L₀)·r̂ + g − c·v · k/m = 196 s⁻² · c/m = 3.4 s⁻¹" },
          { kind: "note", text: "semi-implicit Euler in fixed 1/240 s steps; SVG paths set directly, no React render" },
          { kind: "check", text: "label: F = kx · k = 30 N/m · 1 px = 1/96 in" },
          { kind: "note", text: "scroll: change in page velocity × 0.12 → kick, capped · loop sleeps once settled" },
        ],
      },
      {
        at: 7.35,
        title: "Pull past the mark, let go: the enquiry form",
        detail: "Past 92 px the cord arms; letting go opens the enquiry form (a tap or Enter does too). The API checks a submission before storing it. Nothing is submitted in this recording.",
        tech: ["POST /api/enquiry", "honeypot", "idempotency"],
        log: [
          { kind: "req", text: "POST /api/enquiry  { formType, fields, meta: { startedAt, submissionId } }" },
          { kind: "check", text: "honeypot field empty · filled in ≥ 2.5 s" },
          { kind: "check", text: "submissionId already stored → original reference, no second lead" },
          { kind: "check", text: "10 / IP / 10 min · 3 / mobile · same validation as the browser" },
          { kind: "res", text: "leads table first, then email (Resend) + Google Sheet" },
        ],
      },
      {
        at: 14.68,
        title: "Client-side navigation on a static host",
        detail: "Pages change without a reload. Next 16's export writes route-segment files nested, but the router requests them flat, so a post-build script writes a flat copy of each.",
        tech: ["next/link", "RSC prefetch", "flatten-segments.mjs"],
        log: [
          { kind: "req", text: "GET /courses/__next.courses.__PAGE__.txt  (segment prefetch)" },
          { kind: "note", text: "export writes out/courses/__next.courses/__PAGE__.txt" },
          { kind: "check", text: "flatten-segments.mjs writes the flat twin after every build" },
          { kind: "res", text: "soft navigation; without the copy every prefetch 404s → full reloads" },
        ],
      },
      {
        at: 20.7,
        title: "Structured data next to the content",
        detail: "The institute is described once in the root layout, the FAQ ships its own FAQPage, and sitemap.xml is generated at build from the same content and tool registry.",
        tech: ["JSON-LD", "sitemap.ts", "robots.ts"],
        log: [
          { kind: "note", text: "EducationalOrganization + LocalBusiness · root layout" },
          { kind: "note", text: "FAQPage built from the FAQ items on the page" },
          { kind: "check", text: "JSON-LD escapes '<' so content can't close the script tag" },
          { kind: "note", text: "sitemap.xml: routes + programmes + blog + live tools · force-static" },
        ],
      },
      {
        at: 43.38,
        title: "Course pages from one content file",
        detail: "Programmes live in site-data.json, which is synced into the app before every build. generateStaticParams writes one page per programme, and an unknown slug is a 404, not a render.",
        tech: ["generateStaticParams", "site-data.json", "Course schema"],
        log: [
          { kind: "note", text: "scripts/sync-content.mjs → src/data/content/site-data.json" },
          { kind: "note", text: "generateStaticParams = getProgramSlugs() · dynamicParams = false" },
          { kind: "note", text: "JSON-LD: Course + CourseInstance (onsite, weekly workload, centre)" },
        ],
      },
      {
        at: 53.22,
        title: "Free tools from one registry",
        detail: "One typed registry drives the tools hub, page metadata, cross-links and the sitemap, and a live flag keeps unfinished tools out of all of them. Every tool runs in the browser.",
        tech: ["registry.ts", "WebApplication schema"],
        log: [
          { kind: "note", text: "TOOLS[] → /tools hub · metadata · RelatedTools · sitemap" },
          { kind: "note", text: "JSON-LD: WebApplication · offers price 0" },
          { kind: "res", text: "no API calls: client components over pure functions" },
        ],
      },
      {
        at: 57.67,
        title: "Marks maths kept out of the UI",
        detail: "logic.ts holds the maths with no DOM: best of five with English always counted, and the theory marks needed per subject once internal marks are in. Marks persist in localStorage.",
        tech: ["logic.ts", "useSyncExternalStore", "localStorage"],
        log: [
          { kind: "note", text: "bestFive(subjects, requireEnglish) → average of the top five" },
          { kind: "note", text: "theory needed = ⌈target − internal⌉ / theoryMax → comfortable · push · stretch" },
          { kind: "check", text: "saved marks read via useSyncExternalStore: null during hydration, so SSR HTML matches" },
        ],
      },
    ],
  },
];
