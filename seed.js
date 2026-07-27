const mongoose = require('mongoose');
const dotenv = require('dotenv');
const path = require('path');
const bcrypt = require('bcryptjs');

// Load env vars
dotenv.config({ path: path.join(__dirname, '.env') });

// Import models
const User = require('./models/User');
const Category = require('./models/Category');
const Post = require('./models/Post');
const Comment = require('./models/Comment');

// Sample data
const categories = [
  {
    name: 'Technology',
    slug: 'technology',
    description: 'Latest tech news and trends',
  },
  {
    name: 'Development',
    slug: 'development',
    description: 'Software development and programming',
  },
  {
    name: 'Design',
    slug: 'design',
    description: 'UI/UX and graphic design',
  },
  {
    name: 'Business',
    slug: 'business',
    description: 'Business and finance insights',
  },
];

const posts = [
  {
    title: 'Getting Started with News Sketch',
    slug: 'getting-started-with-news-sketch',
    excerpt: 'Learn how to build a modern news platform with Next.js and Node.js',
    content: `
      <h2>Introduction</h2>
      <p>News Sketch is a modern news platform built with Next.js and Node.js. This guide will help you get started with building your own news website.</p>
      <h3>Key Features</h3>
      <ul>
        <li>Server-side rendering with Next.js</li>
        <li>RESTful API with Express.js</li>
        <li>MongoDB database</li>
        <li>Admin dashboard</li>
        <li>Dark mode support</li>
      </ul>
      <p>Ready to begin? Let's dive in!</p>
    `,
    image: { url: '/placeholder.svg' },
    tags: ['nextjs', 'react', 'nodejs'],
    readingTime: 3,
    published: true,
    featured: true,
    views: 150,
  },
  {
    title: 'Building REST APIs with Express',
    slug: 'building-rest-apis-with-express',
    excerpt: 'A comprehensive guide to building RESTful APIs with Express.js and MongoDB',
    content: `
      <h2>Why Express?</h2>
      <p>Express.js is a minimal and flexible Node.js web application framework that provides a robust set of features for web and mobile applications.</p>
      <h3>Key Concepts</h3>
      <ul>
        <li>Routing</li>
        <li>Middleware</li>
        <li>MongoDB integration</li>
        <li>Authentication</li>
      </ul>
      <p>Learn how to build robust APIs for your applications.</p>
    `,
    image: { url: '/placeholder.svg' },
    tags: ['express', 'api', 'mongodb'],
    readingTime: 5,
    published: true,
    featured: false,
    views: 89,
  },
  {
    title: 'Tailwind CSS Tips and Tricks',
    slug: 'tailwind-css-tips-and-tricks',
    excerpt: 'Improve your workflow with these Tailwind CSS best practices',
    content: `
      <h2>Why Tailwind CSS?</h2>
      <p>Tailwind CSS is a utility-first CSS framework packed with classes like flex, pt-4, text-center and rotate-90 that can be composed to build any design, directly in your markup.</p>
      <h3>Best Practices</h3>
      <ul>
        <li>Use utility classes</li>
        <li>Customize your theme</li>
        <li>Optimize for production</li>
      </ul>
      <p>Discover powerful Tailwind CSS techniques for faster development.</p>
    `,
    image: { url: '/placeholder.svg' },
    tags: ['tailwindcss', 'css', 'design'],
    readingTime: 4,
    published: true,
    featured: true,
    views: 210,
  },
  {
    title: 'Mastering JavaScript Async/Await',
    slug: 'mastering-javascript-async-await',
    excerpt: 'Deep dive into asynchronous programming with async/await',
    content: `
      <h2>Understanding Async/Await</h2>
      <p>Async/await is a modern way to handle asynchronous operations in JavaScript. It makes asynchronous code look and behave more like synchronous code.</p>
      <h3>Core Concepts</h3>
      <ul>
        <li>Promises</li>
        <li>Async functions</li>
        <li>Await keyword</li>
        <li>Error handling</li>
      </ul>
      <p>Learn the ins and outs of async/await in JavaScript.</p>
    `,
    image: { url: '/placeholder.svg' },
    tags: ['javascript', 'async', 'programming'],
    readingTime: 6,
    published: true,
    featured: false,
    views: 175,
  },
  {
    title: 'React 19: What\'s New',
    slug: 'react-19-whats-new',
    excerpt: 'Explore the latest features and improvements in React 19',
    content: `
      <h2>React 19 Features</h2>
      <p>React 19 brings exciting new features for developers. Let's explore what's new in this major release.</p>
      <h3>Key Features</h3>
      <ul>
        <li>New hooks</li>
        <li>Improved performance</li>
        <li>Better developer experience</li>
      </ul>
      <p>Explore the latest features and improvements in React 19.</p>
    `,
    image: { url: '/placeholder.svg' },
    tags: ['react', 'frontend', 'javascript'],
    readingTime: 4,
    published: true,
    featured: true,
    views: 320,
  },
  {
    title: 'Docker for Beginners',
    slug: 'docker-for-beginners',
    excerpt: 'A practical introduction to containerization with Docker',
    content: `
      <h2>What is Docker?</h2>
      <p>Docker is a platform for developing, shipping, and running applications in containers. Containers are lightweight, portable, and isolated environments.</p>
      <h3>Getting Started</h3>
      <ul>
        <li>Install Docker</li>
        <li>Run your first container</li>
        <li>Create a Dockerfile</li>
      </ul>
      <p>Get started with Docker and containerize your applications.</p>
    `,
    image: { url: '/placeholder.svg' },
    tags: ['docker', 'devops', 'containers'],
    readingTime: 7,
    published: true,
    featured: false,
    views: 98,
  },
  {
    title: 'UI/UX Design Principles',
    slug: 'ui-ux-design-principles',
    excerpt: 'Essential design principles for creating beautiful user interfaces',
    content: `
      <h2>Design Principles</h2>
      <p>Good design is essential for creating user-friendly applications. Learn the fundamental principles of UI/UX design.</p>
      <h3>Key Principles</h3>
      <ul>
        <li>User-centered design</li>
        <li>Consistency</li>
        <li>Accessibility</li>
        <li>Feedback</li>
      </ul>
      <p>Learn the fundamentals of UI/UX design.</p>
    `,
    image: { url: '/placeholder.svg' },
    tags: ['design', 'ui', 'ux'],
    readingTime: 5,
    published: true,
    featured: true,
    views: 280,
  },
  {
    title: 'Color Theory for Web Designers',
    slug: 'color-theory-for-web-designers',
    excerpt: 'Master color theory to create stunning websites',
    content: `
      <h2>Understanding Color</h2>
      <p>Color is one of the most important elements in web design. Understanding color theory will help you create more effective designs.</p>
      <h3>Key Concepts</h3>
      <ul>
        <li>Color wheel</li>
        <li>Color harmony</li>
        <li>Color psychology</li>
      </ul>
      <p>Understand color psychology and harmony in web design.</p>
    `,
    image: { url: '/placeholder.svg' },
    tags: ['color', 'design', 'web'],
    readingTime: 4,
    published: true,
    featured: false,
    views: 165,
  },
  {
    title: 'Typography in Web Design',
    slug: 'typography-in-web-design',
    excerpt: 'Learn how to use typography effectively in web design',
    content: `
      <h2>Typography Matters</h2>
      <p>Typography is a crucial element of web design. It affects readability, user experience, and brand perception.</p>
      <h3>Best Practices</h3>
      <ul>
        <li>Choose the right fonts</li>
        <li>Use proper hierarchy</li>
        <li>Consider readability</li>
      </ul>
      <p>Learn how to use typography effectively in web design.</p>
    `,
    image: { url: '/placeholder.svg' },
    tags: ['typography', 'design', 'web'],
    readingTime: 3,
    published: true,
    featured: false,
    views: 142,
  },
  {
    title: 'Startup Funding Guide',
    slug: 'startup-funding-guide',
    excerpt: 'A comprehensive guide to funding your startup',
    content: `
      <h2>Funding Your Startup</h2>
      <p>Getting funding is one of the biggest challenges for startups. This guide will help you understand your options.</p>
      <h3>Funding Options</h3>
      <ul>
        <li>Bootstrapping</li>
        <li>Angel investors</li>
        <li>Venture capital</li>
        <li>Crowdfunding</li>
      </ul>
      <p>Learn about different funding options for startups.</p>
    `,
    image: { url: '/placeholder.svg' },
    tags: ['startup', 'funding', 'business'],
    readingTime: 8,
    published: true,
    featured: true,
    views: 195,
  },
  {
    title: 'Digital Marketing Strategies',
    slug: 'digital-marketing-strategies',
    excerpt: 'Effective digital marketing strategies for 2024',
    content: `
      <h2>Digital Marketing in 2024</h2>
      <p>The digital marketing landscape is constantly evolving. Stay ahead with these proven strategies.</p>
      <h3>Key Strategies</h3>
      <ul>
        <li>Content marketing</li>
        <li>Social media</li>
        <li>SEO</li>
        <li>Email marketing</li>
      </ul>
      <p>Stay ahead with these digital marketing strategies.</p>
    `,
    image: { url: '/placeholder.svg' },
    tags: ['marketing', 'digital', 'business'],
    readingTime: 6,
    published: true,
    featured: false,
    views: 230,
  },
  {
    title: 'Remote Work Best Practices',
    slug: 'remote-work-best-practices',
    excerpt: 'Tips for effective remote work and team collaboration',
    content: `
      <h2>Remote Work Success</h2>
      <p>Remote work is here to stay. Learn how to be effective and productive when working from anywhere.</p>
      <h3>Best Practices</h3>
      <ul>
        <li>Set up a workspace</li>
        <li>Communicate effectively</li>
        <li>Maintain work-life balance</li>
      </ul>
      <p>Master remote work with these proven practices.</p>
    `,
    image: { url: '/placeholder.svg' },
    tags: ['remote', 'work', 'productivity'],
    readingTime: 4,
    published: true,
    featured: false,
    views: 310,
  },
  {
    title: 'AI and Machine Learning Trends',
    slug: 'ai-machine-learning-trends',
    excerpt: 'Latest trends in artificial intelligence and machine learning',
    content: `
      <h2>AI Revolution</h2>
      <p>Artificial Intelligence and Machine Learning are transforming industries. Stay updated with the latest trends.</p>
      <h3>Key Trends</h3>
      <ul>
        <li>Generative AI</li>
        <li>Large language models</li>
        <li>Computer vision</li>
      </ul>
      <p>Stay updated with AI and ML advancements.</p>
    `,
    image: { url: '/placeholder.svg' },
    tags: ['ai', 'machinelearning', 'technology'],
    readingTime: 5,
    published: true,
    featured: true,
    views: 425,
  },
  {
    title: 'Cybersecurity Essentials',
    slug: 'cybersecurity-essentials',
    excerpt: 'Essential cybersecurity practices for everyone',
    content: `
      <h2>Stay Safe Online</h2>
      <p>Cybersecurity is everyone's responsibility. Learn the essential practices to protect yourself and your data.</p>
      <h3>Security Tips</h3>
      <ul>
        <li>Use strong passwords</li>
        <li>Enable 2FA</li>
        <li>Update software</li>
        <li>Be aware of phishing</li>
      </ul>
      <p>Protect yourself online with these cybersecurity tips.</p>
    `,
    image: { url: '/placeholder.svg' },
    tags: ['security', 'cybersecurity', 'tech'],
    readingTime: 4,
    published: true,
    featured: false,
    views: 178,
  },
  {
    title: 'Cloud Computing Explained',
    slug: 'cloud-computing-explained',
    excerpt: 'Understanding cloud computing concepts and services',
    content: `
      <h2>Cloud Fundamentals</h2>
      <p>Cloud computing is the backbone of modern applications. Understand the concepts and services that make it work.</p>
      <h3>Key Concepts</h3>
      <ul>
        <li>IaaS, PaaS, SaaS</li>
        <li>Public vs Private cloud</li>
        <li>Cloud providers</li>
      </ul>
      <p>Learn about cloud computing and its benefits.</p>
    `,
    image: { url: '/placeholder.svg' },
    tags: ['cloud', 'aws', 'azure'],
    readingTime: 6,
    published: true,
    featured: false,
    views: 256,
  },
];

// Connect to DB
const connectDB = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ MongoDB Connected');
  } catch (error) {
    console.error(`❌ Error: ${error.message}`);
    process.exit(1);
  }
};

// Seed data
const seedDatabase = async () => {
  try {
    // Clear existing data
    await User.deleteMany();
    await Category.deleteMany();
    await Post.deleteMany();
    await Comment.deleteMany();
    console.log('🗑️  Data cleared');

    // Create admin user
    const admin = await User.create({
      name: 'Admin User',
      email: 'admin@newssketch.com',
      password: 'admin123',
      role: 'admin',
    });
    console.log(`👤 Admin user created: admin@newssketch.com`);

    // Create categories
    const createdCategories = await Category.insertMany(categories);
    console.log(`📂 ${createdCategories.length} categories created`);

    // Create posts
    const postsWithCategories = posts.map((post, index) => {
      const categoryIndex = index % 4;
      return {
        ...post,
        category: createdCategories[categoryIndex]._id,
        author: admin._id,
        createdAt: new Date(Date.now() - index * 24 * 60 * 60 * 1000),
      };
    });

    const createdPosts = await Post.insertMany(postsWithCategories);
    console.log(`📝 ${createdPosts.length} posts created`);

    // Create sample comments
    const comments = [
      {
        content: 'Great article! Very informative.',
        author: admin._id,
        post: createdPosts[0]._id,
      },
      {
        content: 'Thanks for sharing this!',
        author: admin._id,
        post: createdPosts[0]._id,
      },
      {
        content: 'Excellent read! Looking forward to more content like this.',
        author: admin._id,
        post: createdPosts[1]._id,
      },
    ];

    await Comment.insertMany(comments);
    console.log(`💬 ${comments.length} comments created`);

    console.log('\n✅ Database seeded successfully!');
    console.log(`\n🔐 Admin Login:`);
    console.log(`   Email: admin@newssketch.com`);
    console.log(`   Password: admin123`);
    console.log(`\n📊 Total: ${createdPosts.length} posts, ${createdCategories.length} categories, ${comments.length} comments`);

    process.exit(0);
  } catch (error) {
    console.error(`❌ Error: ${error.message}`);
    process.exit(1);
  }
};

// Run seed
connectDB().then(() => seedDatabase());