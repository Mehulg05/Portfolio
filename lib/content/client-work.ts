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

  Ownership confirmed by Mehul (2026-11-16): he designed, built and deployed all of it alone,
  development through deployment, and runs it. Lines marked `[CONFIRM]` state his opinion,
  which no source file can verify. `hindsight` is opinion throughout.
*/

export const clientWork = {
  client: "Alpha Academy",
  kind: "Physics coaching institute · Karnal, Haryana",
  status: "Live in production",
  href: "https://alphaacademykarnal.in",
  summary:
    "A physics coaching institute's public website, its role-based portal and the API behind both. Six roles sign in at one login; attendance, marks, homework and files are written once and each role reads them through its own scope.",
  ownership:
    "I designed, built and deployed all of it alone, and I run it: the Next.js site and portal, the Fastify API, the Postgres schema, auth, file storage and the Render deployment.",

  /* Counted in the codebase. */
  facts: [
    { value: 6, label: "roles", note: "one login" },
    { value: 16, label: "permissions", note: "one RBAC matrix" },
    { value: 31, label: "Postgres tables", note: "13 migrations" },
    { value: 43, label: "integration test files", note: "run against Postgres in PGlite" },
  ],

  walkthroughNote:
    "Screen recordings of the staging build, edited to cut waiting time. Names, marks and enquiries are sample data; production records stay in the portal.",

  architecture: [
    { label: "Next.js static export", note: "site + /portal SPA · no server runtime" },
    { label: "Fastify API", note: "Node 22 · zod on every body and query" },
    { label: "Auth + RBAC + scope", note: "role → permission → which rows" },
    { label: "Postgres on Neon", note: "Drizzle ORM · audit in the same tx" },
    { label: "S3-compatible storage", note: "private bucket · 60 s signed links" },
  ],

  /* Ordered by how much each one shows; the first three are the ones to remember. */
  decisions: [
    {
      title: "One record, many views",
      problem: "Six roles need the same attendance and marks, and a copy per role would drift.",
      choice:
        "Attendance is keyed on (class session, student) and marks on (test, student), and every read goes through a scope: staff see all batches, faculty their batch_faculty assignments, students themselves, parents their linked children.",
      consequence: "Nothing is copied per role, so what a teacher writes is what every other role reads and there is nothing to sync.",
      ref: "api/src/auth/scope.ts",
    },
    {
      title: "The audit row commits with the write",
      problem: "An audit log written apart from the change it describes can drift from the data.",
      choice:
        "An attendance save locks the class session row (SELECT … FOR UPDATE), upserts on the composite key and writes its audit row inside the same transaction.",
      consequence:
        "The log can't disagree with the register, and correcting another person's mark, or any mark after 24 hours, needs a reason and is audited one by one with from → to.",
      ref: "api/src/modules/attendance/index.ts",
    },
    {
      title: "Auth without an auth vendor",
      problem: "With no auth service in the stack, password storage, login timing and stolen sessions all have to be handled in the API.",
      choice:
        "Passwords are argon2id at OWASP's profile (19 MiB, t=2) with a dummy-hash verify for unknown IDs and lockout with exponential backoff; sessions are 15-minute HMAC access tokens in HttpOnly cookies with refresh tokens rotated on every use.",
      consequence: "A wrong ID takes the same time as a wrong password, a replayed refresh token revokes the session, and each user has one active session.",
      ref: "api/src/auth/{password,service,tokens}.ts",
    },
    {
      title: "Private files, short-lived links",
      problem: "Homework PDFs and report cards sit in a private bucket, so no storage key or lasting URL should reach the browser.",
      choice:
        "Uploads go to S3-compatible storage through aws4fetch under random keys that are stripped from API responses, and downloads are 60-second presigned URLs issued after a scope check.",
      consequence: "A copied link stops working on its own, and inline views stream with a sandbox CSP, nosniff and no-store, with pdf.js loaded only when a file opens.",
      ref: "api/src/lib/{storage,attachments}.ts",
    },
    {
      title: "Rate limits for a classroom on one Wi-Fi",
      problem: "A whole batch shares the institute's connection, so a per-IP limit would count one classroom as one client.",
      choice: "Limits key on the signed-in user (300 a minute) and not the IP; anonymous traffic gets 600 per IP.",
      consequence:
        "A full classroom never trips a shared limit, and the public enquiry form, with no user to key on, adds a honeypot, a minimum fill time, idempotency keys and per-mobile limits.",
      ref: "api/src/app.ts · modules/leads",
    },
    {
      title: "Tested against a real Postgres",
      problem: "Permission and scoping rules are only proven when the routes run against the real schema.",
      choice: "43 Vitest integration files run every route against a migrated database in PGlite (Postgres compiled to WebAssembly).",
      consequence:
        "RBAC, scoping, session security, rate limits and file views are covered at the API, and Playwright with axe covers the public site's routes, SEO, forms and accessibility.",
      ref: "api/test · qa/tests",
    },
  ],

  /* Rendered under "What I'd do differently". [CONFIRM] see report: every "I'd" here is Mehul's opinion to confirm. */
  hindsight: [
    "The static export needs a post-build script (flatten-segments.mjs) because Next 16 writes route-segment files nested and the router asks for them flat. I'd test client-side navigation on the static host before committing to an export, not after.",
    "Render deploys stall often enough that a watchdog script cancels and retries them. I'd treat that script as a sign the deploy path needs fixing, not as the fix.",
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
      "Marks a register, enters and publishes quiz marks and posts homework; every write is permission-checked, scoped to the teacher's batches and audited in the same transaction.",
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
        detail:
          "The dashboard lists today's classes, registers left unmarked and tests waiting for marks. All of it is computed only from the batches and subjects this teacher is assigned to.",
        tech: ["faculty scope", "batch_faculty", "scope.ts"],
        log: [
          { kind: "req", text: "GET /api/dashboard" },
          { kind: "scope", text: "loadScopeFor() → faculty · assigned batches" },
          { kind: "res", text: "200 · 1 register pending · 1 test needs marks" },
        ],
      },
      {
        at: 6.09,
        title: "Marking a register",
        detail:
          "The teacher taps one mark per student, and anyone left unmarked is confirmed present in one step. The register lists only students whose active enrolment covers this subject, and the save is refused for a holiday, a cancelled class or a future date.",
        tech: ["attendance.mark", "write scope", "active enrolment"],
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
        detail: "The register is saved. The session row is locked, the 24 rows are upserted and the audit row is written, all inside one transaction.",
        tech: ["row lock", "upsert", "audit in tx"],
        log: [
          { kind: "db", text: "BEGIN" },
          { kind: "db", text: "SELECT … FROM class_sessions … FOR UPDATE" },
          { kind: "db", text: "INSERT INTO attendance … ON CONFLICT (session_id, student_id) DO UPDATE" },
          { kind: "audit", text: "attendance.mark · class_session" },
          { kind: "db", text: "COMMIT" },
        ],
      },
      {
        at: 20.12,
        title: "Marks entered like a spreadsheet",
        detail:
          "The teacher types marks for 24 students: Enter moves down, one tick marks an absentee, and the batch average, highest and lowest update live. Every change autosaves through a zod-validated request, so a mark above the maximum is rejected before it is stored.",
        tech: ["autosave", "zod", "live batch stats"],
        log: [
          { kind: "req", text: "PUT /api/tests/:id/marks  { rows: [{ studentId, marks, remarks? }] }" },
          { kind: "check", text: "zod · 0 ≤ marks ≤ maxMarks · remarks ≤ 300 chars" },
          { kind: "audit", text: "marks.enter · test" },
        ],
      },
      {
        at: 42.13,
        title: "Publishing is a deliberate step",
        detail:
          "The teacher publishes the quiz. Until now the marks existed only on the staff side, because student and parent reads select published tests and nothing else.",
        tech: ["publish gate", "tests.published"],
        log: [
          { kind: "req", text: "POST /api/tests/:id/publish" },
          { kind: "db", text: "UPDATE tests SET published = true" },
          { kind: "audit", text: "test.publish · test" },
          { kind: "note", text: "now readable by 24 students and their linked parents" },
        ],
      },
      {
        at: 50.23,
        title: "Posting homework",
        detail:
          "The teacher posts homework to a batch, and the batch list in the form is already filtered to the ones they teach. The submissionId sent with the form is the row id, so a double tap can't post twice.",
        tech: ["idempotent create", "own batches only"],
        log: [
          { kind: "req", text: "POST /api/homework  { batchId, title, body, dueDate, submissionId }" },
          { kind: "scope", text: "assertWriteBatch() ✓ · own batches only" },
          { kind: "check", text: "submissionId = row id · second tap can't insert" },
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
    summary:
      "Sees the result the teacher just published, attendance, homework with its PDF, lectures and remarks; every request resolves to the student's own id, never one sent by the browser.",
    frame: { width: 1600, height: 752 },
    video: {
      ...v("walk-student"),
      seconds: 44.6,
      description:
        "Screen recording: a student signs in, checks the dashboard and score trend, finds the new quiz result, opens the attendance calendar, views a homework PDF inside the portal, plays a lecture and reads the teacher's remark.",
    },
    steps: [
      {
        at: 0,
        title: "Signing in as a student",
        detail:
          "The student signs in at the same login form the teacher uses, and the server works out the role. A student account carries a single permission: booking backup classes.",
        tech: ["one login form", "1 permission"],
        log: [
          { kind: "req", text: "POST /api/auth/login" },
          { kind: "auth", text: "role STUDENT · permissions: [backup.book]" },
          { kind: "res", text: "→ /portal/student" },
        ],
      },
      {
        at: 6.19,
        title: "One dashboard, computed per student",
        detail:
          "The dashboard shows the next class, attendance, average against the batch, rank and the board-exam countdown. The student id comes from the session's scope and never from a query parameter, so there is no id in the request to change.",
        tech: ["session scope", "derived stats"],
        log: [
          { kind: "req", text: "GET /api/dashboard" },
          { kind: "scope", text: "resolveStudentId(scope) → self · never a query param" },
          { kind: "res", text: "attendance · average vs batch · rank · next class" },
        ],
      },
      {
        at: 13.75,
        title: "The quiz published minutes ago",
        detail:
          "The score trend and the test list already include the Ray Optics quiz published in the faculty flow, with rank and the batch average. The teacher wrote it once; this read picks it up with no copy step in between.",
        tech: ["one write, every role", "rank among takers"],
        log: [
          { kind: "req", text: "GET /api/me/tests" },
          { kind: "db", text: "WHERE tests.published = true AND marks.student_id = $self" },
          { kind: "res", text: "Weekly Quiz: Ray Optics · 17/20 · rank among takers" },
        ],
      },
      {
        at: 23.44,
        title: "Attendance, class by class",
        detail:
          "The calendar shows one cell per class. Each cell is a class session generated from the timetable and then marked, and the student reads only their own row of each register.",
        tech: ["class_sessions", "timetable"],
        log: [
          { kind: "req", text: "GET /api/me/attendance" },
          { kind: "db", text: "FROM attendance JOIN class_sessions … WHERE student_id = $self" },
        ],
      },
      {
        at: 27.91,
        title: "Homework, with the file in the portal",
        detail:
          "The student opens a homework PDF without leaving the portal. It streams from the portal's own origin under a sandbox CSP and pdf.js draws it page by page, because many phone browsers won't show a PDF inside a page.",
        tech: ["inline view", "CSP sandbox", "pdf.js"],
        log: [
          { kind: "req", text: "GET /api/homework/:id/attachment?view=1" },
          { kind: "scope", text: "same access rules as the download link ✓" },
          { kind: "res", text: "200 application/pdf · CSP: default-src 'none'; sandbox · no-store" },
          { kind: "note", text: "attachmentKey stays on the server · pdf.js loads on open" },
        ],
      },
      {
        at: 38.64,
        title: "Lectures, filed by chapter",
        detail:
          "A lecture plays inside the portal. Lectures are YouTube links tagged to a subject, batch and NCERT chapter, and the CSP allows frames only from YouTube and Maps.",
        tech: ["frame allowlist", "NCERT chapters"],
        log: [
          { kind: "req", text: "GET /api/lectures" },
          { kind: "note", text: "CSP frame-src: youtube-nocookie.com youtube.com google.com" },
        ],
      },
      {
        at: 42.82,
        title: "The teacher's remark, already here",
        detail:
          "The report-card page shows the remark the teacher typed during marks entry. Remarks are stored on the test mark itself, so nobody copies them across.",
        tech: ["marks.remarks", "report cards"],
        log: [
          { kind: "req", text: "GET /api/report-cards" },
          { kind: "db", text: "SELECT marks.remarks … WHERE tests.published = true" },
        ],
      },
    ],
  },
  {
    id: "parent",
    kind: "video",
    label: "Parent",
    actor: "Signed in as the student's father",
    summary:
      "Reads the same records through a link to their own child; the role holds no permissions, so everything a parent does is a scoped read.",
    frame: { width: 1600, height: 752 },
    video: {
      ...v("walk-parent"),
      seconds: 38.87,
      description:
        "Screen recording: a parent signs in, reads the summary of their child's progress and the chapters to practise, the performance charts, the detail of the latest quiz, the attendance calendar, the teachers' remarks and the monthly report cards.",
    },
    steps: [
      {
        at: 0,
        title: "Signing in as a parent",
        detail:
          "The parent signs in with their own account, separate from the student's. It is linked to one or more children through parent_links, and those links become the session's scope.",
        tech: ["own account", "parent_links"],
        log: [
          { kind: "req", text: "POST /api/auth/login" },
          { kind: "auth", text: "role PARENT" },
          { kind: "scope", text: "scope.studentIds ← parent_links" },
        ],
      },
      {
        at: 7.25,
        title: "The same records the teacher wrote",
        detail:
          "The summary shows the child's average, attendance and rank, and a 'needs practice' list of chapters. The numbers match the student's screen because both read the same rows; the list is built from chapter-wise marks.",
        tech: ["chapter-wise marks", "linked child"],
        log: [
          { kind: "req", text: "GET /api/dashboard" },
          { kind: "scope", text: "resolveStudentId(scope) → child ∈ scope.studentIds ✓" },
          { kind: "res", text: "average · attendance · rank · weakest chapters" },
        ],
      },
      {
        at: 14.44,
        title: "Performance against the batch",
        detail:
          "Charts show the monthly trend, a subject comparison and where the child stands in the batch. Rank is counted among the students who took a test, not the whole batch.",
        tech: ["rank among takers", "batch comparison"],
        log: [
          { kind: "req", text: "GET /api/analytics/students/:id" },
          { kind: "scope", text: "assertReadStudent() ✓ · linked child" },
          { kind: "db", text: "WHERE tests.published = true · rank among takers" },
        ],
      },
      {
        at: 21.33,
        title: "A portal with no write path",
        detail:
          "The parent opens the latest quiz: the child's score, rank and the batch average. The PARENT role holds zero permissions, so every screen in this portal is a read resolved through the link to the child.",
        tech: ["0 permissions", "scoped reads"],
        log: [
          { kind: "req", text: "GET /api/me/tests" },
          { kind: "auth", text: "role PARENT · permissions: []" },
          { kind: "scope", text: "resolveStudentId(scope) → linked child ✓" },
        ],
      },
      {
        at: 27.5,
        title: "And nobody else's child",
        detail:
          "The attendance calendar comes from the registers the teacher marked. Ask the API for a student who isn't linked to this parent and it answers 403.",
        tech: ["direct id request", "403"],
        log: [
          { kind: "req", text: "GET /api/attendance/students/<another student>" },
          { kind: "scope", text: "assertReadStudent() ✗ · not in scope.studentIds" },
          { kind: "deny", text: "403 forbidden · \"You don't have access to this student.\"" },
        ],
      },
      {
        at: 33.53,
        title: "Remarks and monthly report cards",
        detail:
          "The parent reads the teachers' remarks and the monthly report cards, which are PDFs a scheduled job generates. A download is checked against the same scope, rate-limited and served as a short-lived signed URL for the private bucket.",
        tech: ["scheduled PDFs", "signed URL", "throttled"],
        log: [
          { kind: "req", text: "GET /api/report-cards" },
          { kind: "scope", text: "learnerStudentIds(scope) → linked children only" },
          { kind: "req", text: "GET /api/report-cards/:id/download" },
          { kind: "scope", text: "assertReadStudent() ✓ · throttled" },
          { kind: "res", text: "presignGet(fileKey, 300 s) → signed URL" },
        ],
      },
    ],
  },
  {
    id: "admin",
    kind: "video",
    label: "Admin",
    actor: "Signed in as Super Admin",
    summary: "Sees the whole institute with no batch filter: analytics, the enquiry pipeline and the audit log, each behind its own permission.",
    frame: { width: 1600, height: 704 },
    video: {
      ...v("walk-admin"),
      seconds: 45.1,
      description:
        "Screen recording: the Super Admin overview with live counts and charts, the leads inbox where an enquiry's status is changed, the audit log listing every write by person, and report-card settings.",
    },
    steps: [
      {
        at: 0,
        title: "The institute at a glance",
        detail:
          "The overview shows active students, attendance, upcoming tests, leads and recent activity. Only staff roles get a scope with no batch filter, and the route asks for analytics.view_all on top of it.",
        tech: ["unscoped view", "staff roles only"],
        log: [
          { kind: "req", text: "GET /api/analytics/institute" },
          { kind: "perm", text: "requirePermission('analytics.view_all') ✓" },
          { kind: "scope", text: "loadScopeFor() → kind: all · no batch filter" },
        ],
      },
      {
        at: 13.3,
        title: "Website enquiries become a pipeline",
        detail:
          "Enquiries from the public site land in an inbox with a status, and one is moved along here; phone numbers become call and WhatsApp buttons (blurred in this recording). The inbox has its own permission, held by the super admin and by an admin only when granted.",
        tech: ["status pipeline", "granted per admin"],
        log: [
          { kind: "req", text: "PATCH /api/leads/:id  { status }" },
          { kind: "perm", text: "requirePermission('leads.view') ✓ · super admin, or admin if granted" },
          { kind: "audit", text: "lead.update" },
        ],
      },
      {
        at: 30.14,
        title: "Every write, under the name of whoever made it",
        detail:
          "The audit log lists each write with the person who made it. Each row was written in the same transaction as its change, and its metadata never holds passwords or tokens.",
        tech: ["audit_logs", "no secrets in meta"],
        log: [
          { kind: "perm", text: "requirePermission('audit.view') ✓ · super admin, owner" },
          { kind: "db", text: "INSERT INTO audit_logs (actor_id, action, entity, entity_id, meta, ip)" },
          { kind: "audit", text: "test.publish · marks.enter · attendance.mark · homework.create" },
        ],
      },
      {
        at: 41.24,
        title: "Report cards, configured once",
        detail:
          "The settings screen sets the sections, thresholds and branding of the monthly report card. A scheduled job then generates the PDF for every student with pdfkit and stores it in the private bucket.",
        tech: ["pdfkit", "scheduled job"],
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
    summary: "What every role passes through first: passwords, sessions and tokens handled in the API, with no auth service.",
    frame: { width: 1456, height: 834 },
    steps: [
      {
        image: img("security-login"),
        alt: "Portal sign-in page with login ID or mobile number and password fields.",
        title: "One login for six roles",
        detail:
          "The sign-in page takes a login ID or mobile number and a password, and the server works out the role. A wrong ID and a wrong password fail with the same message in the same time.",
        cursor: { x: 73.8, y: 55.2 },
        click: true,
        tech: ["argon2id", "constant time", "backoff"],
        log: [
          { kind: "req", text: "POST /api/auth/login  { identifier, password }" },
          { kind: "check", text: "argon2id verify · 19 MiB · t=2 · p=1" },
          { kind: "check", text: "unknown ID → verify a dummy hash · no timing signal" },
          { kind: "check", text: "failure → failedLoginCount++ · exponential backoff lock" },
        ],
      },
      {
        image: img("security-set-password"),
        alt: "Set your own password screen shown on first sign-in, with password rules.",
        title: "Temporary passwords must be replaced",
        detail:
          "The first sign-in lands on a set-your-own-password screen. Accounts start with a generated temporary password and mustChangePassword, and until it is changed the API refuses everything else.",
        cursor: { x: 73.8, y: 70.3 },
        click: true,
        tech: ["temporary password", "forced change"],
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
        detail:
          "The audit log shows sign-ins and password changes by a parent and a student. Behind each session: access tokens that last 15 minutes, and refresh tokens that rotate on every use, are stored only as a SHA-256 and revoke the session if an old one is replayed.",
        cursor: { x: 89, y: 40.9 },
        tech: ["refresh rotation", "reuse detection", "1 session"],
        log: [
          { kind: "req", text: "POST /api/auth/refresh" },
          { kind: "check", text: "sha256(token) = the family's current token" },
          { kind: "deny", text: "401 · replayed token → session revoked" },
          { kind: "note", text: "idle 30 min · absolute 12 h · new sign-in ends the old session" },
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
      "A static Next.js export with no server runtime, recorded from the live site; its only dynamic path is the enquiry form, which the API hardens against spam and double submits.",
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
        detail:
          "The home page arrives as HTML written at build time. Render serves it as a static site with security headers, and /api is rewritten to the Fastify service on the same origin, so there is no CORS.",
        tech: ["output: 'export'", "Render static site", "same-origin /api"],
        log: [
          { kind: "note", text: "output: 'export' → out/<route>/index.html · trailingSlash" },
          { kind: "note", text: "/api/* → rewrite → Fastify service · same origin, no CORS" },
          { kind: "res", text: "CSP · X-Frame-Options: SAMEORIGIN · nosniff · Permissions-Policy" },
        ],
      },
      {
        at: 2.74,
        title: "A pull cord that obeys Hooke's law",
        detail:
          "The spring under Enquire Now is pulled and swings, and while it is pulled its label reads the spring force like a spring balance. It is simulated as an elastic pendulum (spring tension, gravity, damping) in fixed time steps that write the SVG paths directly, with no React render.",
        tech: ["elastic pendulum", "requestAnimationFrame", "Pointer Events"],
        log: [
          { kind: "note", text: "a = −(k/m)(L − L₀)·r̂ + g − c·v · k/m = 196 s⁻² · c/m = 3.4 s⁻¹" },
          { kind: "note", text: "semi-implicit Euler · fixed 1/240 s steps · SVG paths set directly" },
          { kind: "note", text: "label: F = kx · k = 30 N/m · 1 px = 1/96 in" },
          { kind: "note", text: "scroll: Δ page velocity × 0.12 → capped kick · loop sleeps once settled" },
        ],
      },
      {
        at: 7.35,
        title: "Pull past the mark, let go: the enquiry form",
        detail:
          "Pulled past 92 px the cord arms, and letting go opens the enquiry form (a tap or Enter does too); it is closed here without submitting. A real submission is checked by the API for bots, repeats and rate before it is stored.",
        tech: ["honeypot", "idempotency key", "per-mobile limit"],
        log: [
          { kind: "req", text: "POST /api/enquiry  { formType, fields, meta: { startedAt, submissionId } }" },
          { kind: "check", text: "honeypot field empty · filled in ≥ 2.5 s" },
          { kind: "check", text: "submissionId already stored → original reference, no second lead" },
          { kind: "check", text: "10 / IP / 10 min · 3 / mobile · same validation as the browser" },
          { kind: "db", text: "leads table first · then email (Resend) + Google Sheet" },
        ],
      },
      {
        at: 14.68,
        title: "Client-side navigation on a static host",
        detail:
          "The nav menus change pages without a reload. Next 16's export writes route-segment files nested while the router requests them flat, so a post-build script writes a flat copy of each; without it every prefetch 404s and each link becomes a full reload.",
        tech: ["next/link", "RSC prefetch", "post-build script"],
        log: [
          { kind: "req", text: "GET /courses/__next.courses.__PAGE__.txt  (segment prefetch)" },
          { kind: "note", text: "export writes out/courses/__next.courses/__PAGE__.txt" },
          { kind: "note", text: "flatten-segments.mjs writes the flat twin after every build" },
          { kind: "res", text: "with the copy: soft navigation · without: 404 → full reload" },
        ],
      },
      {
        at: 20.7,
        title: "Structured data next to the content",
        detail:
          "The recording scrolls through every home-page section. The institute is described once as JSON-LD in the root layout, the FAQ ships its own FAQPage, and sitemap.xml is generated at build from the same content and tool registry.",
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
        detail:
          "The Class 12 Physics page is one of the programme pages generated from site-data.json, which is synced into the app before every build. generateStaticParams writes one page per programme, and an unknown slug is a 404, not a render.",
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
        detail:
          "The Free Tools hub is drawn from one typed registry that also drives page metadata, cross-links and the sitemap, and a live flag keeps unfinished tools out of all four. Every tool runs in the browser with no API call.",
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
        detail:
          "The CBSE marks calculator works out best of five with English always counted, and the theory marks needed per subject once internal marks are in. The maths sits in logic.ts with no DOM, and entered marks persist in localStorage.",
        tech: ["logic.ts", "useSyncExternalStore", "localStorage"],
        log: [
          { kind: "note", text: "bestFive(subjects, requireEnglish) → average of the top five" },
          { kind: "note", text: "theory needed = ⌈target − internal⌉ / theoryMax → comfortable · push · stretch" },
          { kind: "check", text: "useSyncExternalStore: null during hydration, so SSR HTML matches" },
        ],
      },
    ],
  },
];
