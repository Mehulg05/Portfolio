/*
  The timeline, told as a story. Each step has a short narrative (`story`, in Mehul's
  voice, from what he has told us). No bullet points under the story (Mehul's call).
  Sources: the resume, the Sahayogi One task description document, and Mehul's own
  account of school, college and the RBH internship (2026-09-28).
  Shown as plain dots on a line, newest last. No version numbers (Mehul's call).
*/

export type Milestone = {
  id: string;
  period: string;
  title: string;
  /** Where it happened. */
  context: string;
  /** The narrative for this step, one string per paragraph. */
  story: string[];
  current?: boolean;
};

export const milestones: Milestone[] = [
  {
    id: "school",
    period: "2008 – 2023",
    title: "School in Karnal",
    context: "Karnal, Haryana",
    story: [
      "Growing up in Karnal, I always wanted to know how things worked. Computers and circuits held my attention more than anything else, and the more I learned about software, the clearer it became that this was what I wanted to build a career in. So I chose science and finished school in the non-medical stream.",
      "School also gave me my first taste of responsibility. I was a house captain and took an active part in organising school events. I won an INSPIRE Award, a Government of India grant for student ideas, the first time something I came up with was backed with real money. I also took first place in Battle of Brains, an intra-district quiz on mental ability and general knowledge.",
    ],
  },
  {
    id: "bennett",
    period: "2023 – 2024",
    title: "First year at Bennett University",
    context: "Greater Noida",
    story: [
      "In 2023 I moved to Greater Noida to study Computer Science at Bennett University. The first year was when I started writing real code: C++ for the fundamentals, then HTML and CSS to build my first front-end pages. Outside class I joined academic and technical clubs and got a feel for how people build things together. I also started taking part in hackathons, building against a deadline with a team.",
    ],
  },
  {
    id: "foundations",
    period: "2024 – May 2025",
    title: "Data structures, first project, first taste of AI",
    context: "Bennett University",
    story: [
      "In second year I got serious about data structures and algorithms, and started building my own projects. The first was Ocasio. Planning an event means finding organisers, photographers and planners you can rely on, and Ocasio set out to make that less stressful by putting them on one platform, with verified listings, AI-powered recommendations and secure payments.",
      "Around the same time I started exploring AI. I learned TensorFlow and deep learning through DeepLearning.AI, studied operating systems with Google, and did NVIDIA's CUDA C course to see how code runs on a GPU.",
    ],
  },
  {
    id: "rbh",
    period: "Jun – Jul 2025",
    title: "Summer internship at RBH Solutions",
    context: "RBH Solutions · remote",
    story: [
      "My first internship, done remotely over the summer. RBH Solutions works on SCADA software, which lets operators and customers monitor industrial equipment from anywhere. I worked on the admin panel and built screens for the customer panel, including role-based views: a super admin view, a tech team view and a customer view, each showing only what that role should see.",
      "It was the first time I worked under senior developers, and the first time I understood how a real product fits together, beyond code that just runs on my laptop.",
    ],
  },
  {
    id: "uniryde-research",
    period: "Jul 2025 – Apr 2026",
    title: "UniRyde, and a research manuscript",
    context: "Bennett University",
    story: [
      "Back at university I picked a problem I could see every day. Students travelling the same way were each paying for a full cab. UniRyde is a ride-sharing platform for them: students verify they belong to the university, sign in securely, get matched with other verified students, and split the fare. I built it with React.js, MongoDB and the Google Maps API.",
      "In the same stretch I worked on research into predicting wheat yield from hyperspectral data. I used RFECV to pick the spectral bands that carry signal, compared SVR, XGBoost, ElasticNet and a 1D-CNN, combined them in a stacked ensemble, and tested whether the models hold up across different environments. The manuscript went under review in April 2026.",
    ],
  },
  {
    id: "sahayogi",
    period: "Jun 2026 – present",
    title: "Developer Trainee at Sahayogi One",
    context: "Sahayogi One, Noida",
    current: true,
    story: [
      "In June 2026 I joined Sahayogi One, a Noida startup that builds business software for Indian SMEs, as a developer trainee on the core product team. Here nothing gets built before it is designed. For my first module, payroll and HR, I wrote the high-level and low-level design, the database schema and the API contracts, and got them approved by the senior team. Then I built it: attendance, leave, payroll processing and PF, ESI and TDS compliance, with role-based access at three levels. It went through code review and QA and is now live in production.",
      "Since September I've been integrating Meta's WhatsApp Business APIs into the company's messaging product. From here, I want to keep building systems that businesses depend on, and bring machine learning into them.",
    ],
  },
];
