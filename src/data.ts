// Single source of truth for site content. Rendered into index.html at build
// time (see vite.config.ts) and read at runtime for the project modals.

export type Experience = {
  date: string;
  role: string;
  company: string;
  logo: string;
  blurb: string;
};

export type Project = {
  id: string;
  title: string;
  /** Longer name shown in the modal */
  fullTitle: string;
  dates: string;
  status: "current" | "completed";
  cover: string;
  /** "contain" for diagrams / word clouds that should not be cropped */
  coverFit?: "cover" | "contain";
  summary: string;
  description: string;
  images: string[];
  skillsUsed: string[];
  skillsLearned: string[];
  nextSteps: string[];
  links: Record<string, string>;
};

const img = (name: string) => `/img/${name}.webp`;

export const experience: Experience[] = [
  {
    date: "Summer 2025",
    role: "Software Engineer Intern",
    company: "DoorDash",
    logo: img("doordash_logo"),
    blurb:
      "Incoming Software Engineer Intern at DoorDash, contributing to logistics and delivery optimization.",
  },
  {
    date: "Summer 2024",
    role: "Software Engineering Intern",
    company: "Amazon - Middle Mile Team",
    logo: img("amazon_logo"),
    blurb:
      "Developed scalable backend services to improve package routing efficiency across Amazon's delivery network.",
  },
  {
    date: "Summer 2023",
    role: "Technical Product Management Intern",
    company: "Chick-fil-A New Ventures Team",
    logo: img("chickfila_logo"),
    blurb:
      "Worked on AI-driven automation tools to streamline restaurant operations and enhance the customer experience.",
  },
];

const PRIVATE_GT =
  "https://github.com/ronaks-code?tab=repositories&q=&type=public&language=&sort=name";

export const projects: Project[] = [
  {
    id: "accounting",
    title: "Accounting Automation Tool",
    fullTitle: "Accounting Automation Tool",
    dates: "September 2024 - TBD",
    status: "current",
    cover: img("accountingMain"),
    summary:
      "We’re building a tool that automates data entry for accounts payable, eliminating the need for accountants to manually transfer information from PDFs into accounting systems. Using AI, the tool extracts and auto-fills relevant fields, reducing time spent on repetitive tasks. We’re currently refining the solution with early testers and working toward integrating it into accounting firms' workflows.",
    description:
      "A tool designed to eliminate manual data entry for accounts payable, automating the process of extracting and inputting data from PDFs. Currently testing with accountants and refining the model.",
    images: [img("desksetup2"), img("desksetup3"), img("desksetup4")],
    skillsUsed: ["GPT API", "Chrome Extensions", "OCR Processing", "Data Extraction & Parsing"],
    skillsLearned: [
      "Understanding accounting workflows",
      "Refining AI models for real-world document processing",
      "Balancing automation with user control",
    ],
    nextSteps: [
      "Expanding beta testing",
      "Optimizing for more invoice formats",
      "Building integrations with accounting software",
    ],
    links: {},
  },
  {
    id: "finance",
    title: "Financial Organization Tool",
    fullTitle: "Financial Organization Tool",
    dates: "November 2024 - TBD",
    status: "current",
    cover: img("app"),
    summary:
      "Making things easier when it comes to managing and centralizing financial accounts. More information to come!",
    description:
      "Currently working on something to simplify financial management. More details coming soon!",
    images: [img("app1"), img("app2")],
    skillsUsed: ["Web Development", "Data Security & Encryption", "Financial API Integrations"],
    skillsLearned: [
      "Understanding user privacy concerns",
      "Optimizing for financial data accuracy",
      "Designing seamless user experiences",
    ],
    nextSteps: [
      "Reach out to accounting professionals for feedback",
      "Conduct user testing for feature prioritization",
      "Explore partnerships with financial institutions",
    ],
    links: {},
  },
  {
    id: "universe",
    title: "UniVerse (Now UFScheduler)",
    fullTitle: "UniVerse (Now UFScheduler) - AI-Powered Student Scheduling",
    dates: "June 2023 - August 2024",
    status: "completed",
    cover: img("universeMain"),
    summary:
      "A student scheduling platform that streamlines course selection and registration using an AI-powered chatbot.",
    description:
      "UniVerse is a student scheduling and academic planning platform designed to simplify course selection and registration. It features an AI-powered chatbot that recommends schedules based on past preferences, workload balancing, and availability.",
    images: [img("universe1"), img("universe2"), img("universe3")],
    skillsUsed: ["React.js", "TypeScript", "Firebase", "LangChain (AI chatbot)"],
    skillsLearned: [
      "Building scalable web applications",
      "Integrating AI with user workflows",
      "Handling real-time user data with Firebase",
    ],
    nextSteps: [
      "Expand university integrations",
      "Improve chatbot personalization",
      "Monetization strategies for premium features",
    ],
    links: { GitHub: "https://github.com/ronaks-code/uniVerse" },
  },
  {
    id: "amazon",
    title: "Amazon Price Predictor",
    fullTitle: "Amazon Price Prediction LLM",
    dates: "December 2023 - June 2024",
    status: "completed",
    cover: img("amazonMain"),
    coverFit: "contain",
    summary:
      "A predictive tool that uses machine learning to forecast weekly Amazon product prices based on historical trends and sentiment analysis.",
    description:
      "Developed a machine learning model to predict Amazon product prices by analyzing historical pricing trends, customer sentiment, and product features. The tool scrapes Amazon listings, applies NLP techniques to analyze reviews, and uses deep learning models to make price forecasts.",
    images: [img("amazonPrice1"), img("amazonPrice2"), img("amazonPrice3")],
    skillsUsed: ["Python", "TensorFlow", "Selenium", "BeautifulSoup", "ChatGPT API"],
    skillsLearned: [
      "Data scraping at scale",
      "Sentiment analysis with NLP",
      "Recurrent neural networks (RNN) for forecasting",
    ],
    nextSteps: [
      "Expanding dataset to include competitor websites",
      "Optimizing model accuracy for seasonal trends",
      "Building a user-friendly web interface for broader use",
    ],
    links: { "Private Georgia Tech IP": PRIVATE_GT },
  },
  {
    id: "binvision",
    title: "BinVision",
    fullTitle: "BinVision - AI for Waste Sorting",
    dates: "October 2023 - May 2024",
    status: "completed",
    cover: img("binvisionMain"),
    summary:
      "A computer vision-powered waste classification tool designed to improve recycling accuracy and reduce mis-sorted trash.",
    description:
      "BinVision is an AI-powered sustainability project designed to improve recycling accuracy. It leverages a ResNet34 deep learning model to classify waste into appropriate categories, helping users correctly dispose of trash. The system collects data on waste sorting patterns to generate campus-wide sustainability insights.",
    images: [img("binvision1"), img("binvision2"), img("binvision3")],
    skillsUsed: ["React.js", "Computer Vision", "Firebase", "Flask", "ResNet34 Model"],
    skillsLearned: [
      "Training convolutional neural networks (CNNs)",
      "Building full-stack machine learning applications",
      "Deploying AI models to the cloud",
    ],
    nextSteps: [
      "Deploying the tool on campus waste bins",
      "Integrating real-time feedback for users",
      "Exploring partnerships with sustainability initiatives",
    ],
    links: {
      GitHub: "https://github.com/ronaks-code/bin-vision",
      DevPost: "https://devpost.com/software/binvision",
    },
  },
  {
    id: "psychology",
    title: "Psychologist Assistant Tool",
    fullTitle: "AI-Powered Psychology Assistant",
    dates: "May 2023 - May 2024",
    status: "completed",
    cover: img("psychologyMain"),
    coverFit: "contain",
    summary:
      "A chatbot powered by AI to enhance psychologists’ diagnostic accuracy and improve patient interactions.",
    description:
      "This AI chatbot helps psychologists improve patient interactions and diagnosis accuracy by leveraging natural language processing (NLP) and machine learning. It analyzes patient conversations and suggests insights based on past data, acting as an intelligent assistant for mental health professionals.",
    images: [img("psychology1"), img("accountingMain")],
    skillsUsed: ["Python", "LangChain", "TensorFlow", "React.js"],
    skillsLearned: [
      "Fine-tuning language learning models (LLMs)",
      "Building AI-powered conversational interfaces",
      "Ethical considerations in AI for mental health",
    ],
    nextSteps: [
      "Enhancing the chatbot's diagnostic suggestions",
      "Developing sentiment-based patient engagement tracking",
      "Collaborating with psychologists for real-world testing",
    ],
    links: { "Private Georgia Tech IP": PRIVATE_GT },
  },
  {
    id: "agriculture",
    title: "Agricultural Commodity Volatility Predictor",
    fullTitle: "Agricultural Commodity Volatility Predictor",
    dates: "August 2023 - January 2024",
    status: "completed",
    cover: img("agricultureMain"),
    summary:
      "Developed a machine learning model to predict price volatility for agricultural commodities like corn, soy, and wheat.",
    description:
      "This tool predicts the price volatility of agricultural commodities like corn, soy, and wheat using machine learning models. By analyzing qualitative market outlooks and historical price data, it provides farmers and investors with more accurate predictions for future price swings.",
    images: [img("agriculture"), img("agriculture1"), img("agriculture2"), img("agriculture3")],
    skillsUsed: ["Python", "Scikit-learn", "Pandas", "Natural Language Toolkit (NLTK)", "TensorFlow"],
    skillsLearned: [
      "Feature engineering for time series forecasting",
      "Sentiment analysis for financial markets",
      "Building automated data pipelines",
    ],
    nextSteps: [
      "Expanding model coverage to other commodity markets",
      "Improving real-time data integration",
      "Exploring API integrations for financial analysts",
    ],
    links: { "Private Georgia Tech IP": PRIVATE_GT },
  },
];

export const languages = [
  { name: "English", note: "fluent", level: 100 },
  { name: "Hindi", note: "fluent", level: 100 },
  { name: "Spanish", note: "kinda", level: 60 },
  { name: "Pig Latin", note: "fluent?", level: 80 },
];

export type Hobby = { name: string; image: string; video?: string; note?: string };

export const hobbies: Hobby[] = [
  { name: "Soccer", image: img("soccer-poster"), video: "/media/soccer.mp4" },
  { name: "Startups", image: img("startups") },
  { name: "Basketball", image: img("basketballMain"), note: "Hawks game, State Farm Arena" },
  { name: "Journaling", image: img("journaling") },
  { name: "Pickleball", image: img("pickleball") },
  { name: "Origami", image: img("origami") },
  { name: "Guitar", image: img("guitar") },
  { name: "Piano", image: img("piano") },
  { name: "Music Production", image: img("musicproduction") },
];

export const contact = {
  email: "mailto:ronak.agarwal@gatech.edu",
  linkedin: "http://linkedin.com/in/ronak-agarwal9",
  github: "https://github.com/ronaks-code",
  resume: "/assets/Ronak_Agarwal_Resume.pdf",
};
