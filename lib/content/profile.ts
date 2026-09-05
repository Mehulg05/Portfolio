// Facts sourced from Mehul_Gupta.pdf. Voice lines marked [DRAFT] need your sign-off.

export const profile = {
  name: "Mehul Gupta",
  // [DRAFT] Positioning line — replace if this isn't the thread you want pulled.
  headline: "I build systems people trust with things that matter.",
  supporting:
    "A payment, a ride home, a season's harvest. Final-year CSE at Bennett University — building products end-to-end at Sahayogi One, and researching machine learning for precision agriculture.",
  role: "Developer Trainee, Sahayogi One",
  location: "Karnal / Greater Noida, India",
  email: "mehulg2005@gmail.com",
  github: "https://github.com/Mehulg05",
  githubHandle: "Mehulg05",
  linkedin: "https://www.linkedin.com/in/mehul2005",
  linkedinHandle: "mehul2005",
  resume: "/Mehul_Gupta_Resume.pdf",
  // Phone deliberately omitted from the public site — it invites spam and adds nothing a recruiter needs.
} as const;

/*
  The roles the search is aimed at, cycled in the hero.

  Framed as "open to", not "qualified for" — it is a statement of intent, and every one
  is defensible from the record: full-stack and backend from the NestJS/Next.js work
  shipped at Sahayogi One, ML from the hyperspectral research, product from delivery
  work done with the customer in the room.

  NOTE: the CSS keyframes in `.role-slot` divide the cycle into as many equal slots as
  there are entries here via `--role-count`. Changing the length of this list is safe;
  the timing follows it.
*/
export const targetRoles = [
  "Software Development Engineer",
  "Backend Engineer",
  "Full-Stack Developer",
  "Machine Learning Engineer",
  "Product Engineer",
] as const;

export const education = [
  {
    qualification: "B.Tech, Computer Science & Engineering",
    institution: "Bennett University (Times of India Group)",
    result: "CGPA 7.79",
    period: "2023 — present",
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

export const certifications = [
  {
    name: "Build Better Generative Adversarial Networks",
    issuer: "DeepLearning.AI",
    date: "Apr 2026",
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
] as const;
