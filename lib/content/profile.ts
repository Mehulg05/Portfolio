/*
  Facts come from Mehul_Gupta_Resume.pdf. Rule for this file and every file beside it:
  if a line cannot be traced to the resume, the Sahayogi One task description document, or
  something Mehul has said, it does not ship. Graduation year confirmed by Mehul, 2026-09-28.
*/

export const profile = {
  name: "Mehul Gupta",
  graduation: "2027",
  /** The page's first sentence. Plain facts, no slogan. */
  intro:
    "I'm a final-year computer science student who already ships production software.",
  /** What the work actually is, in the order a reader would check it. */
  summary:
    "As a developer trainee at Sahayogi One I designed and built a payroll module that is now live in production. Before that I interned at RBH Solutions on SCADA software. I study CSE at Bennett University, and my research on predicting wheat yield from hyperspectral data is a manuscript under review.",
  /** One role family, stated once. Not cycled. */
  openTo: "Backend and full-stack engineering roles, and applied machine learning",
  role: "Developer Trainee, Sahayogi One",
  location: "Karnal / Greater Noida, India",
  email: "mehulg2005@gmail.com",
  github: "https://github.com/Mehulg05",
  githubHandle: "Mehulg05",
  linkedin: "https://www.linkedin.com/in/mehul2005",
  linkedinHandle: "mehul2005",
  resume: "/Mehul_Gupta_Resume.pdf",
  // Phone deliberately omitted from the public site. It invites spam and adds nothing a recruiter needs.
} as const;

/** Link preview and search copy, kept separate so it cannot drift into slogan territory. */
export const meta = {
  title: "Mehul Gupta · Developer Trainee at Sahayogi One · Bennett CSE",
  description:
    "Final-year B.Tech CSE student at Bennett University. Developer Trainee at Sahayogi One, where I built a payroll module now in production. Wheat-yield research manuscript under review.",
  ogDescription:
    "Developer Trainee at Sahayogi One (built a payroll module, live in production) and final-year CSE student at Bennett University. Wheat-yield research under review.",
} as const;

export const education = [
  {
    qualification: "B.Tech, Computer Science & Engineering",
    institution: "Bennett University (Times of India Group)",
    result: "CGPA 7.79",
    period: `2023 – ${profile.graduation} (expected)`,
  },
  {
    qualification: "Class XII, CBSE",
    institution: "Greenland Public School, Karnal",
    result: "77.8%",
    period: "2023",
  },
  {
    qualification: "Class X, CBSE",
    institution: "Dyal Singh Public School, Karnal",
    result: "90.8%",
    period: "2021",
  },
] as const;

/*
  Academic work, listed plainly while nothing is deployed. Descriptions restate the resume
  and nothing more: no architecture, no trade-offs, no outcomes.
  When a project goes live it moves to lib/content/projects.ts with its links.
*/
export type AcademicProject = {
  name: string;
  period: string;
  what: string;
  stack?: string[];
  status: string;
};

export const academicProjects: AcademicProject[] = [
  {
    name: "UniRyde",
    period: "Mar 2026",
    what: "Ride sharing for university students, so they can split cab costs. Student verification, sign-in and matching.",
    stack: ["React.js", "HTML", "CSS", "MongoDB", "Google Maps API"],
    status: "Code private · not deployed",
  },
  {
    name: "Ocasio",
    period: "Feb 2025",
    what: "A platform that brings event organisers, photographers and planners together, with verified listings, recommendations and payments.",
    status: "Code private · not deployed",
  },
];

export type Certification = {
  name: string;
  issuer: string;
  date: string;
  /**
   * Coursera credential ID. The public verify URL is derived from it, so the ID is the
   * only thing stored. It is also the token a recruiter checks against.
   * NVIDIA DLI and the Google OS course have no ID recorded here, so they show none.
   */
  credentialId?: string;
};

export const courseraVerify = "https://www.coursera.org/account/accomplishments/verify/";

// Newest first. Engineering courses only, matching the resume. Grades are not published.
export const certifications: Certification[] = [
  {
    name: "Build Better Generative Adversarial Networks (GANs)",
    issuer: "DeepLearning.AI",
    date: "Apr 2026",
    credentialId: "R7256JI8RRI4",
  },
  {
    name: "CUDA C Accelerated Computing",
    issuer: "NVIDIA",
    date: "Apr 2025",
  },
  {
    name: "Operating Systems and You",
    issuer: "Google",
    date: "Feb 2025",
  },
  {
    name: "Peer-to-Peer Protocols and Local Area Networks",
    issuer: "University of Colorado System",
    date: "Feb 2025",
    credentialId: "JLO69TVL9DGL",
  },
  {
    name: "Introduction to TensorFlow for Artificial Intelligence, Machine Learning, and Deep Learning",
    issuer: "DeepLearning.AI",
    date: "Feb 2025",
    credentialId: "N26Q5C13SQSR",
  },
];

export const achievements = [
  {
    title: "INSPIRE Awards, Government of India",
    detail: "₹10,000 grant",
  },
  {
    title: "Battle of Brains, 1st place",
    detail: "Intra-district, MAT and General Knowledge",
  },
];
