# Blogem - Collaborative Writing Platform

A professional writing and project management application with hierarchical content structure (Projects → Stories → Chapters) built with React frontend and Node.js backend.

## 🚀 Current Status: Phase 3.1 Complete

- ✅ Complete 3-level hierarchy with rich text editing
- ✅ Secure user authentication with JWT
- ✅ Full CRUD operations at all levels
- ✅ React 19 + Node.js + MySQL architecture
- ✅ Responsive design for all devices

## 🛠️ Technology Stack

### Frontend
- **React 19** - UI framework
- **React Router DOM** - Navigation
- **React-Quill-New** - Rich text editing (React 19 compatible)
- **Axios** - HTTP client
- **Context API** - State management

### Backend
- **Node.js + Express.js** - Web framework
- **MySQL** - Database
- **JWT** - Authentication
- **bcryptjs** - Password hashing
- **Multer** - File uploads (planned)

### Development Environment
- **XAMPP** - Local MySQL server
- **Nodemon** - Development server

## 📁 Project Structure

```
blogem/
├── client/                 # React frontend
│   ├── src/
│   │   ├── components/     # React components
│   │   ├── pages/          # Page components
│   │   ├── services/       # API services
│   │   ├── context/        # React context
│   │   └── App.js
│   └── package.json
├── server/                 # Node.js backend
│   ├── config/             # Database config
│   ├── routes/             # API routes
│   ├── middleware/         # Auth middleware
│   ├── app.js              # Main server file
│   └── package.json
├── database/
│   └── schema.sql          # Database structure
└── README.md
```

## 🚀 Getting Started

### Prerequisites
- Node.js (v16+)
- XAMPP or MySQL server
- Git

### Installation

1. **Clone the repository**
   ```bash
   git clone https://github.com/derrickbray/Blogem.git
   cd Blogem
   ```

2. **Set up the database**
   - Start XAMPP and start MySQL
   - Create database `bray_report`
   - Import `database/schema.sql`

3. **Install backend dependencies**
   ```bash
   cd server
   npm install
   ```

4. **Create server environment file**
   ```bash
   # Create server/.env
   JWT_SECRET=your-secret-key-here
   DB_HOST=localhost
   DB_USER=root
   DB_PASSWORD=
   DB_NAME=bray_report
   ```

5. **Install frontend dependencies**
   ```bash
   cd ../client
   npm install
   ```

6. **Start the development servers**
   ```bash
   # Terminal 1: Start backend (from server directory)
   npm start

   # Terminal 2: Start frontend (from client directory)
   npm start
   ```

7. **Access the application**
   - Frontend: http://localhost:3000
   - Backend API: http://localhost:5000

## 📋 Features

### Current Features (Phase 3.1)
- **User Authentication**: Secure login/register system
- **Project Management**: Create, edit, delete writing projects
- **Story Organization**: Organize content into stories within projects
- **Chapter Writing**: Rich text editing with formatting options
- **Responsive Design**: Works on desktop, tablet, and mobile
- **Search & Filter**: Find projects quickly
- **Hierarchical Navigation**: Intuitive breadcrumb system

### Planned Features (Roadmap)
- **File Upload System** (Phase 4.1) - Images and document uploads
- **Advanced Rich Text** (Phase 4.2) - Enhanced formatting options
- **Collaboration** (Phase 6.1) - Multi-user project access
- **Comments System** (Phase 6.2) - Review and feedback workflow
- **Export System** (Phase 7.1) - PDF, Word, HTML export

## 🔐 Security Features

- JWT token authentication
- Password hashing with bcrypt
- User data isolation
- Input validation
- CORS protection

## 🎯 API Endpoints

### Authentication
- `POST /api/auth/register` - User registration
- `POST /api/auth/login` - User login
- `GET /api/auth/me` - Get current user

### Projects
- `GET /api/projects` - List user's projects
- `POST /api/projects` - Create project
- `PUT /api/projects/:id` - Update project
- `DELETE /api/projects/:id` - Delete project

### Stories
- `GET /api/stories/projects/:id/stories` - List project stories
- `POST /api/stories/projects/:id/stories` - Create story
- `PUT /api/stories/:id` - Update story
- `DELETE /api/stories/:id` - Delete story

### Chapters
- `GET /api/chapters/stories/:id/chapters` - List story chapters
- `POST /api/chapters/stories/:id/chapters` - Create chapter
- `PUT /api/chapters/:id` - Update chapter
- `DELETE /api/chapters/:id` - Delete chapter

## 🧪 Development

### Database Schema
The application uses MySQL with the following main tables:
- `Users` - User accounts and authentication
- `Projects` - Top-level writing projects
- `Stories` - Story organization within projects
- `Chapters` - Individual chapters with rich text content

### Code Style
- ES6+ JavaScript
- Functional React components with hooks
- RESTful API design
- Consistent error handling

## 🐛 Troubleshooting

### Common Issues
1. **Database connection errors**: Ensure XAMPP MySQL is running
2. **CORS errors**: Check that backend is running on port 5000
3. **JWT errors**: Verify JWT_SECRET is set in server/.env
4. **React compatibility**: Using react-quill-new for React 19 support

## 📝 License

This project is licensed under the MIT License.

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

## 📞 Contact

Derrick Bray - [@derrickbray](https://github.com/derrickbray)

Project Link: [https://github.com/derrickbray/Blogem](https://github.com/derrickbray/Blogem)

---

**Built with ❤️ for writers and content creators**