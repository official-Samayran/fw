Famwish.com

A modern Next.js + TypeScript project.
This README explains everything you need: how to clone, run, edit, push, and change remotes.


---

📦 Features

Next.js (App Router)

TypeScript

API Routes

Authentication (NextAuth)

Fully modular structure

Ready for deployment



---

🧰 Requirements

Node.js 18+

npm or pnpm

Git

.env.local file (not included — create it yourself)



---

📥 Clone the Repository

git clone https://github.com/SakshiMishra0/Famwish.com.git
cd Famwish.com


---

⚙️ Install Dependencies

npm install


---

🗂️ Environment Variables

Create a file named .env.local in the project root.

IMPORTANT:

Do NOT commit .env.local

You already have the required keys in your project

Do not rename or remove them


Example format:

DATABASE_URL=your_value
NEXTAUTH_URL=your_value
NEXTAUTH_SECRET=your_value
JWT_SECRET=your_value
DATABASE_PROVIDER=your_value


---

▶️ Run the Project (Development)

npm run dev

App will start at:

http://localhost:3000


---

🏗️ Build for Production

npm run build
npm start


---

🧪 Check for Errors

npm run lint
npm run check:types


---

⬆️ How to Push Code to This Repo

1. Check current branch

git branch

2. Add files

git add .

3. Commit

git commit -m "your message"

4. Push

git push origin your-branch-name

If pushing to main:

git push origin main


---

🔄 How to Change Remote Repo

1. View current remote

git remote -v

2. Change origin

git remote set-url origin https://github.com/your-username/your-new-repo.git

3. Push to new repo

git push -u origin main


---

📚 Project Structure (Simple Overview)

src/
  app/          → routes + pages
  components/   → reusable UI components
  lib/          → helpers / configs
  styles/       → global styles
public/         → static assets


---

👥 Contributing

1. Create a new branch



git checkout -b feature/your-feature

2. Make changes


3. Commit & push


4. Open a Pull Request




---

📌 Notes

Never commit .env.local

Keep commits small and clear

If you see “use client” errors, move hooks to client components

Always run npm run dev after installing new packages
