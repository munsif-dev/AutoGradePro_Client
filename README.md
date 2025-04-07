# AutoGradePro Client

## Overview
AutoGradePro is an advanced educational platform designed to automate the grading of short answers using AI technology. The client application provides a modern, intuitive interface for educators to manage assignments, upload reference answers, and review graded submissions.

## Features

### User Authentication
- Secure login and registration system
- Role-based access control (lecturers and students)
- Protected routes to ensure data security

### Dashboard
- Overview of modules, assignments, and grading statistics
- Performance metrics and analytics
- Intuitive navigation between different sections

### Module Management
- Create and edit course modules
- Organize content hierarchically
- Associate assignments with specific modules

### Assignment Management
- Create detailed assignments with descriptions and due dates
- Upload reference answers and marking schemes
- Set grading parameters for different question types

### AI-Powered Grading
- Automated grading of short answer submissions
- Support for various answer types:
  - One-word answers
  - Short phrases (using AI semantic matching)
  - Lists (with order sensitivity options)
  - Numerical answers (with range options)
- Real-time grading progress visualization

### Submission Management
- Upload student submissions in various formats (TXT, PDF, DOCX)
- Batch grading of multiple submissions
- Detailed breakdown of individual answers and scores

### Analytics and Reporting
- Visual representation of class performance
- Individual student performance tracking
- Exportable reports in Excel format

## Technical Stack

### Frontend Framework
- Next.js 15.1.0
- React 19.0.0
- TypeScript

### UI Components
- Tailwind CSS for styling
- Lucide React for icons
- Chart.js for data visualization
- React-toastify for notifications

### State Management
- React hooks for local state
- Axios for API communication

### Authentication
- JWT token-based authentication
- Protected routes

## Getting Started

### Prerequisites
- Node.js (v18 or higher)
- npm or yarn

### Installation
1. Clone the repository
   ```
   git clone https://github.com/yourusername/AutoGradePro_Client.git
   cd AutoGradePro_Client/Client
   ```

2. Install dependencies
   ```
   npm install
   ```

3. Set up environment variables
   Create a `.env` file with the following variables:
   ```
   NEXT_PUBLIC_API_URL=http://localhost:8000
   ```

4. Start the development server
   ```
   npm run dev
   ```

5. Build for production
   ```
   npm run build
   npm start
   ```

## Project Structure
- `app/` - Main application code
  - `(auth)/` - Authentication related pages
  - `(dashboard)/` - Dashboard and main application pages
    - `(routes)/` - Application routes
      - `assignment/` - Assignment management
      - `module/` - Module management
      - `settings/` - User settings
  - `_components/` - Shared components
- `lib/` - Utility functions and API client
- `public/` - Static assets

## Contributing
Contributions are welcome! Please feel free to submit a Pull Request.

## License
This project is licensed under the MIT License - see the LICENSE file for details.