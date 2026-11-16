/*
  Facts come from Mehul_Gupta_Resume.pdf. Rule for this file and every file beside it:
  if a line cannot be traced to the resume, the Sahayogi One task description document, or
  something Mehul has said, it does not ship. Graduation year confirmed by Mehul, 2026-09-28.
*/

export const profile = {
  name: "Mehul Gupta",
  graduation: "2027",
  /** The page's first sentence: where he is going, not where he has been. Experience lives below. */
  intro:
    "I build the systems businesses run on, and want to bring machine learning into them.",
  /** Who he is. No employer names here: the Experience section carries those. */
  summary:
    "Final-year computer science student at Bennett University. At work I designed and built a payroll and HR module that now runs in production. For a client, I designed, built and deployed a coaching institute's website and portal on my own, and I still run it. I also do machine learning research, with a manuscript under review.",
  /** One role family, stated once. Not cycled. */
  openTo: "Backend, full-stack and AI/ML engineering roles",
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

/**
 * Link preview and search copy, kept separate so it cannot drift into slogan territory.
 * Under 160 characters each.
 */
export const meta = {
  title: "Mehul Gupta",
  description:
    "Built a payroll and HR module now in production at Sahayogi One, and a live portal for a coaching institute. Final-year CSE student at Bennett University.",
  ogDescription:
    "Payroll and HR module in production at Sahayogi One. A live client portal for a coaching institute. Final-year CSE student, ML manuscript under review.",
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
  and nothing more: no architecture, no trade-offs, no outcomes. There is no Projects
  section on the site for now; it was removed until something is live.
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
    what: "Matches verified university students travelling the same way so they can split the cab fare. Student verification, sign-in and route matching on the Google Maps API.",
    stack: ["React.js", "HTML", "CSS", "MongoDB", "Google Maps API"],
    status: "Code private · not deployed",
  },
  {
    name: "Ocasio",
    period: "Feb 2025",
    what: "Puts event organisers, photographers and planners on one platform, with verified listings, AI-powered recommendations and payments.",
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
  {
    name: "Supervised Machine Learning: Classification",
    issuer: "IBM",
    date: "Nov 2024",
    credentialId: "F2FNMQCUEGDJ",
  },
];

export const achievements = [
  {
    title: "INSPIRE Awards, Government of India",
    detail: "₹10,000 grant",
  },
  {
    title: "Battle of Brains, 1st place",
    detail: "Intra-district quiz, MAT and General Knowledge",
  },
];
