# Task Management Application

A comprehensive task management application built with React and Supabase, featuring time tracking, task comments, analytics, and more.

## Features

- 📋 Task Management with Kanban Board
- ⏱️ Time Tracking for Tasks
- 📊 Analytics Dashboard
- 💬 Task Comments
- 📎 File Attachments
- 🔄 Real-time Updates
- 📱 Responsive Design
- 🎨 Priority-based Color Coding
- 📈 Time Reports
- 👥 User Management

## Prerequisites

Before you begin, ensure you have the following installed:
- [Node.js](https://nodejs.org/) (v16 or higher)
- [npm](https://www.npmjs.com/) (usually comes with Node.js)

## Installation

1. Clone the repository:
```bash
git clone <repository-url>
cd task-management-app
```

2. Install dependencies:
```bash
npm install
```

3. Set up Supabase:
   - Create a new project at [Supabase](https://supabase.com)
   - Click the "Connect to Supabase" button in the top right of the application
   - Follow the setup wizard to connect your project

4. Create a `.env` file in the root directory with your Supabase credentials:
```env
VITE_SUPABASE_URL=your_supabase_url
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
```

## Running the Application

1. Start the development server:
```bash
npm run dev
```

2. Open your browser and navigate to the URL shown in the terminal (usually `http://localhost:5173`)

## Project Structure

```
src/
├── components/         # React components
│   ├── Tasks/         # Task-related components
│   └── ...
├── contexts/          # React contexts
├── lib/              # Utility functions and services
├── styles/           # SCSS modules
└── ...
```

## Database Schema

The application uses the following main tables in Supabase:

- `tasks`: Main tasks table
- `timer_entries`: Time tracking entries
- `task_comments`: Task comments
- `task_attachments`: File attachments for tasks

## Features Documentation

### Task Management
- Create, edit, and delete tasks
- Drag-and-drop Kanban board
- List view option
- Priority levels (Normal, High, Urgent)
- Task status tracking

### Time Tracking
- Start/stop timer for tasks
- Track multiple time entries
- View time reports
- Analyze time spent by project/client

### Comments
- Add comments to tasks
- View comment history
- User attribution
- Timestamp tracking

### Analytics
- Task completion rates
- Time distribution
- Priority distribution
- Project/Client analytics

## Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.