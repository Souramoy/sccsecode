# SCCSE Code Platform

A full-stack code editor platform built with React and Node.js for managing lab assignments, submissions, and code execution in an educational environment.

## ✨ Features

- 🔐 Role-based authentication (Students & Teachers)
- 📝 Interactive code editor with syntax highlighting
- 📚 Assignment creation and management
- 💾 Code submission tracking
- 🎨 Modern, responsive UI
- 📊 Submission history and grading

## 📋 Prerequisites

Before you begin, ensure you have installed:
- [Node.js](https://nodejs.org/) (v14 or higher)
- npm (comes with Node.js)

## 🚀 Getting Started

### 1. Install Dependencies

First, install the required packages:

```bash
npm install
```

### 2. Start the Application

Run the following command to start both the frontend and backend:

```bash
npm run dev
```




## 📦 Data Storage

Data is persisted in local JSON files located in `server/data/`:
- `students.json` - Student account information
- `teachers.json` - Teacher account information
- `assignments.json` - Assignment details and metadata
- `submissions.json` - Code submissions and history



## 🛠️ Tech Stack

**Frontend:**
- React
- Vite
- Monaco Editor (VS Code editor component)

**Backend:**
- Node.js
- Express.js
- JSON file-based storage


