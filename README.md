# TechWeb - Modern Tech News Platform

A modern tech news website built with Next.js, featuring AI-powered translation and summarization capabilities. The platform aggregates tech news from various sources and provides Hebrew translations for international content.

## Features

- 🌐 Real-time tech news aggregation
- 🤖 AI-powered translation (English to Hebrew)
- 📝 Automatic article summarization
- 🔍 Advanced search functionality
- 📱 Responsive, mobile-first design
- ⚡ Fast loading with Next.js
- 🎨 Modern UI with Tailwind CSS

## Tech Stack

- **Frontend**: Next.js 14 with TypeScript
- **Styling**: Tailwind CSS
- **Database**: PostgreSQL with Prisma ORM
- **AI Services**: OpenAI GPT-4
- **News API**: NewsAPI.org
- **Analytics**: Vercel Analytics

## Getting Started

### Prerequisites

- Node.js 18+ and npm
- PostgreSQL database
- OpenAI API key
- NewsAPI.org API key

### Environment Setup

1. Clone the repository:

   ```bash
   git clone https://github.com/yourusername/techweb.git
   cd techweb
   ```

2. Install dependencies:

   ```bash
   npm install
   ```

3. Create a `.env` file with the following variables:

   ```
   DATABASE_URL="postgresql://user:password@localhost:5432/techweb?schema=public"
   OPENAI_API_KEY="your-openai-api-key"
   NEWS_API_KEY="your-newsapi-key"
   ```

4. Initialize the database:
   ```bash
   npx prisma generate
   npx prisma db push
   ```

### Development

Run the development server:

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) to view the application.

### Production

Build the application:

```bash
npm run build
```

Start the production server:

```bash
npm start
```

## Project Structure

```
src/
├── app/               # Next.js app directory
├── components/        # React components
├── lib/              # Utility functions and services
│   ├── api/          # API services
│   ├── db/           # Database utilities
│   └── ai/           # AI services
└── types/            # TypeScript type definitions
```

## Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## Acknowledgments

- [Next.js](https://nextjs.org/)
- [Tailwind CSS](https://tailwindcss.com/)
- [OpenAI](https://openai.com/)
- [NewsAPI](https://newsapi.org/)
