const express = require("express");
const multer = require("multer");
const fs = require("fs");
const path = require("path");


const app = express();
app.use(express.urlencoded({ extended: true }));

// Global CSS
const globalCSS = `
  * { margin: 0; padding: 0; box-sizing: border-box; }
  body { 
    font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
    background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
    min-height: 100vh;
    color: #2c3e50;
  }
  .container { 
    width: 95%;
    max-width: 1200px;
    margin: 30px auto;
    background: white;
    border-radius: 12px;
    box-shadow: 0 10px 40px rgba(0,0,0,0.2);
    overflow: hidden;
  }
  header {
    background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
    color: white;
    padding: 30px;
    text-align: center;
  }
  header h1 { font-size: 2.5em; margin-bottom: 10px; }
  nav {
    background: #f8f9fa;
    padding: 15px 30px;
    display: flex;
    gap: 15px;
    overflow-x: auto;
    flex-wrap: wrap;
    border-bottom: 2px solid #e9ecef;
  }
  nav a {
    color: #667eea;
    text-decoration: none;
    padding: 10px 15px;
    border-radius: 6px;
    transition: all 0.3s;
    white-space: nowrap;
    font-weight: 500;
  }
  nav a:hover { background: #667eea; color: white; }
  .content { padding: 40px 30px; }
  .card {
    background: white;
    padding: 25px;
    margin-bottom: 20px;
    border-radius: 10px;
    border-left: 5px solid #667eea;
    box-shadow: 0 4px 15px rgba(0,0,0,0.1);
    transition: all 0.3s;
  }
  .card:hover { transform: translateY(-5px); box-shadow: 0 8px 25px rgba(0,0,0,0.15); }
  h2 { color: #667eea; margin-bottom: 15px; font-size: 1.8em; }
  form {
    display: flex;
    flex-direction: column;
    gap: 12px;
    background: #f8f9fa;
    padding: 20px;
    border-radius: 8px;
    margin-bottom: 20px;
  }
  input, textarea, select {
    padding: 12px 15px;
    border: 2px solid #e9ecef;
    border-radius: 6px;
    font-family: inherit;
    font-size: 1em;
    transition: border 0.3s;
  }
  input:focus, textarea:focus { outline: none; border-color: #667eea; }
  textarea { resize: vertical; min-height: 100px; }
  button {
    padding: 12px 25px;
    background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
    color: white;
    border: none;
    border-radius: 6px;
    cursor: pointer;
    font-weight: bold;
    font-size: 1em;
    transition: all 0.3s;
    width: fit-content;
  }
  button:hover { transform: scale(1.05); box-shadow: 0 6px 20px rgba(102, 126, 234, 0.4); }
  ul { list-style: none; }
  li {
    padding: 12px 15px;
    background: #f8f9fa;
    margin-bottom: 10px;
    border-radius: 6px;
    border-left: 4px solid #667eea;
    transition: all 0.3s;
  }
  li:hover { background: #e9ecef; }
  a { color: #667eea; text-decoration: none; transition: color 0.3s; }
  a:hover { color: #764ba2; text-decoration: underline; }
  .grid {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
    gap: 20px;
    margin-top: 20px;
  }
  .stat-box {
    background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
    color: white;
    padding: 25px;
    border-radius: 10px;
    text-align: center;
    box-shadow: 0 4px 15px rgba(102, 126, 234, 0.3);
  }
  .stat-box h3 { font-size: 2em; margin-bottom: 5px; }
  .stat-box p { font-size: 0.9em; opacity: 0.9; }
  .gallery-grid {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(150px, 1fr));
    gap: 15px;
    margin-top: 20px;
  }
  .gallery-item {
    border-radius: 8px;
    overflow: hidden;
    box-shadow: 0 4px 15px rgba(0,0,0,0.1);
    transition: all 0.3s;
  }
  .gallery-item:hover { transform: scale(1.05); }
  .gallery-item img { width: 100%; height: 150px; object-fit: cover; }
  .back-link { display: inline-block; margin-top: 20px; padding: 10px 20px; background: #667eea; color: white; border-radius: 6px; }
  .back-link:hover { background: #764ba2; }
  footer { text-align: center; padding: 20px; background: #f8f9fa; color: #7c8db0; font-size: 0.9em; }
`;

// Ensure upload directories exist
const ensureDirs = ["uploads", "uploads/assignments", "uploads/videos", "uploads/gallery"];
ensureDirs.forEach(dir => { if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true }) });

// Multer storage - route files to different folders by fieldname
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    let dest = "uploads";
    if (file.fieldname === "assignment") dest = "uploads/assignments";
    if (file.fieldname === "introVideo") dest = "uploads/videos";
    if (file.fieldname === "image") dest = "uploads/gallery";
    cb(null, dest);
  },
  filename: (req, file, cb) => {
    cb(null, Date.now() + "-" + file.originalname.replace(/\s+/g, "-"));
  }
});
const upload = multer({ storage });

// Serve uploaded files
app.use("/uploads", express.static(path.join(__dirname, "uploads")));

// Helper to append JSON objects to a file
function appendJson(file, obj) {
  let arr = [];
  if (fs.existsSync(file)) {
    try { arr = JSON.parse(fs.readFileSync(file, "utf8")); } catch (e) { arr = [] }
  }
  arr.push(obj);
  fs.writeFileSync(file, JSON.stringify(arr, null, 2));
}

// Read JSON helper
function readJson(file) {
  if (fs.existsSync(file)) {
    try { return JSON.parse(fs.readFileSync(file, "utf8")); } catch (e) { return [] }
  }
  return [];
}

// ---------- ROUTES ----------

// Home / Navigator
app.get("/", (req, res) => {
  const latestVideo = fs.readdirSync("uploads/videos").slice(-1)[0];
  const assignments = fs.readdirSync("uploads/assignments");
  const gallery = fs.readdirSync("uploads/gallery");

  res.send(`
<!DOCTYPE html>
<html>
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>My E-Portfolio</title>
<style>
${globalCSS}
</style>
</head>
<body>
<div class="container">
  <header>
    <h1>🎓 My E-Portfolio</h1>
    <p>Showcase Your Academic Journey</p>
  </header>

  <nav>
    <a href="/">🏠 Home</a>
    <a href="/introduction">🎥 Introduction</a>
    <a href="/assignments">📁 Assignments</a>
    <a href="/learning-log">📝 Learning Log</a>
    <a href="/pse-lab">🧪 PSE Lab</a>
    <a href="/gallery">🖼️ Gallery</a>
    <a href="/social">💬 Social</a>
    <a href="/dashboard">📊 Dashboard</a>
    <a href="/profile">👤 Profile</a>
    <a href="/contact">✉️ Contact</a>
  </nav>

  <div class="content">
    <div class="card">
      <h2>Welcome to Your Portfolio</h2>
      <p>This is your personal academic showcase. Upload videos, assignments, images, and share your learning journey with the world!</p>
      <div style="margin-top: 15px; padding: 15px; background: #e8f0ff; border-radius: 6px; border-left: 4px solid #667eea;">
        <strong>🔗 Share Your Portfolio:</strong><br>
        <div style="display: flex; gap: 10px; margin-top: 10px; flex-wrap: wrap;">
          <input type="text" id="portfolioLink" value="${req.protocol}://${req.get('host')}/share/portfolio" readonly style="flex: 1; min-width: 250px; padding: 10px; border: 1px solid #ccc; border-radius: 4px; background: white;">
          <button onclick="copyPortfolioLink()" style="padding: 10px 20px; background: #667eea; color: white; border: none; cursor: pointer; border-radius: 4px; font-weight: bold; white-space: nowrap;">📋 Copy Link</button>
        </div>
      </div>
    </div>

    <div class="grid">
      <div class="stat-box">
        <h3>${assignments.length}</h3>
        <p>📁 Assignments</p>
      </div>
      <div class="stat-box">
        <h3>${latestVideo ? '1' : '0'}</h3>
        <p>🎥 Intro Video</p>
      </div>
      <div class="stat-box">
        <h3>${gallery.length}</h3>
        <p>🖼️ Gallery Images</p>
      </div>
      <div class="stat-box">
        <h3>${(fs.existsSync("learningLog.json") ? JSON.parse(fs.readFileSync("learningLog.json")).length : 0)}</h3>
        <p>📝 Learning Entries</p>
      </div>
    </div>

    <div class="card" style="margin-top: 30px;">
      <h2>Quick Links</h2>
      <ul>
        <li><a href="/introduction">📹 Upload Your Introduction Video</a></li>
        <li><a href="/assignments">📤 Add Your Assignments</a></li>
        <li><a href="/learning-log">✍️ Write Your Learning Log</a></li>
        <li><a href="/gallery">📸 Upload Your Gallery</a></li>
        <li><a href="/dashboard">📊 View Your Dashboard</a></li>
      </ul>
    </div>
  </div>

  <script>
  function copyPortfolioLink() {
    const link = document.getElementById('portfolioLink');
    link.select();
    navigator.clipboard.writeText(link.value).then(() => {
      alert('✅ Portfolio link copied! Share it with anyone you want to see your work.');
    }).catch(() => {
      alert('❌ Failed to copy. Please copy manually.');
    });
  }
  </script>

  <footer>© 2026 My E-Portfolio | Keep Learning, Keep Growing</footer>
</div>
</body>
</html>
  `);
});

// Introduction - upload intro video
app.get("/introduction", (req, res) => {
  const videos = fs.readdirSync("uploads/videos");
  const list = videos.map(v => `<li><a href="/uploads/videos/${v}" target="_blank">▶️ ${v}</a></li>`).join("");
  res.send(`
<!DOCTYPE html>
<html>
<head>
<meta charset="utf-8">
<title>Introduction | E-Portfolio</title>
<style>${globalCSS}</style>
</head>
<body>
<div class="container">
  <header>
    <h1>🎥 Your Introduction Video</h1>
    <p>Introduce yourself to the world</p>
  </header>

  <nav>
    <a href="/">🏠 Home</a>
    <a href="/introduction">🎥 Introduction</a>
    <a href="/assignments">📁 Assignments</a>
    <a href="/learning-log">📝 Learning Log</a>
    <a href="/pse-lab">🧪 PSE Lab</a>
    <a href="/gallery">🖼️ Gallery</a>
    <a href="/social">💬 Social</a>
    <a href="/dashboard">📊 Dashboard</a>
    <a href="/profile">👤 Profile</a>
    <a href="/contact">✉️ Contact</a>
  </nav>

  <div class="content">
    <div class="card">
      <h2>Upload Your Introduction Video</h2>
      <form action="/introduction" method="POST" enctype="multipart/form-data">
        <input type="file" name="introVideo" accept="video/*" required>
        <button type="submit">📤 Upload Video</button>
      </form>
    </div>

    <div class="card">
      <h2>Your Videos</h2>
      ${videos.length > 0 ? `<ul>${list}</ul>` : '<p>No videos uploaded yet. Be the first to upload your introduction!</p>'}
    </div>
  </div>

  <footer>© 2026 My E-Portfolio</footer>
</div>
</body>
</html>
  `);
});
app.post("/introduction", upload.single("introVideo"), (req, res) => {
  res.redirect("/introduction");
});

// Assignments (existing)
app.get("/assignments", (req, res) => {
  const assignments = fs.readdirSync("uploads/assignments");
  const list = assignments.map(a => {
    const shareUrl = `${req.protocol}://${req.get('host')}/share/assignment/${encodeURIComponent(a)}`;
    return `<li>
      <div style="display: flex; justify-content: space-between; align-items: center; gap: 15px; flex-wrap: wrap;">
        <div style="flex: 1; min-width: 250px;">
          <strong>📄 <a href="/uploads/assignments/${a}" target="_blank">${a}</a></strong><br>
          <small style="color: #7c8db0;">Share with faculty: <code style="background: #f0f0f0; padding: 4px 8px; border-radius: 4px; word-break: break-all;">${shareUrl}</code></small>
        </div>
        <button onclick="copyLink('${shareUrl.replace(/'/g, "\\'")}')\" style="padding: 8px 15px; background: #667eea; color: white; border: none; cursor: pointer; border-radius: 4px; white-space: nowrap; font-weight: bold;\">📋 Copy</button>
      </div>
    </li>`;
  }).join("");
  res.send(`
<!DOCTYPE html>
<html>
<head>
<meta charset="utf-8">
<title>Assignments | E-Portfolio</title>
<style>${globalCSS}</style>
<script>
function copyLink(text) {
  navigator.clipboard.writeText(text).then(() => {
    alert('✅ Link copied! Share this with your faculty members.');
  }).catch(() => {
    alert('❌ Failed to copy. Please copy manually.');
  });
}
</script>
</head>
<body>
<div class="container">
  <header>
    <h1>📁 My Assignments</h1>
    <p>Showcase your academic work</p>
  </header>

  <nav>
    <a href="/">🏠 Home</a>
    <a href="/introduction">🎥 Introduction</a>
    <a href="/assignments">📁 Assignments</a>
    <a href="/learning-log">📝 Learning Log</a>
    <a href="/pse-lab">🧪 PSE Lab</a>
    <a href="/gallery">🖼️ Gallery</a>
    <a href="/social">💬 Social</a>
    <a href="/dashboard">📊 Dashboard</a>
    <a href="/profile">👤 Profile</a>
    <a href="/contact">✉️ Contact</a>
  </nav>

  <div class="content">
    <div class="card">
      <h2>Upload a New Assignment</h2>
      <form action="/assignments" method="POST" enctype="multipart/form-data">
        <input type="file" name="assignment" required>
        <button type="submit">📤 Upload Assignment</button>
      </form>
    </div>

    <div class="card">
      <h2>Your Assignments (${assignments.length})</h2>
      <div style="background: #e8f0ff; border-left: 4px solid #667eea; padding: 15px; border-radius: 6px; margin-bottom: 20px;">
        <strong>💡 Share with Faculty:</strong> Each assignment has a unique shareable link. Click "Copy" to generate and share the link with your faculty members!
      </div>
      ${assignments.length > 0 ? `<ul>${list}</ul>` : '<p>No assignments uploaded yet.</p>'}
    </div>
  </div>

  <footer>© 2026 My E-Portfolio</footer>
</div>
</body>
</html>
  `);
});
app.post("/assignments", upload.single("assignment"), (req, res) => {
  res.redirect("/assignments");
});

// Share assignment publicly with faculty
app.get("/share/assignment/:filename", (req, res) => {
  const filename = decodeURIComponent(req.params.filename);
  const filePath = `uploads/assignments/${filename}`;
  
  if (!fs.existsSync(filePath)) {
    return res.status(404).send(`
<!DOCTYPE html>
<html>
<head><meta charset="utf-8"><title>Not Found</title><style>${globalCSS}</style></head>
<body>
<div class="container">
  <header><h1>❌ Assignment Not Found</h1></header>
  <div class="content"><div class="card"><p>This assignment does not exist or has been deleted.</p><a href="/" class="back-link">Back to Home</a></div></div>
</div>
</body>
</html>
    `);
  }
  
  const profile = fs.existsSync("profile.json") ? JSON.parse(fs.readFileSync("profile.json")) : { name: 'Student Portfolio', bio: '' };
  const uploadDate = fs.statSync(filePath).mtime.toLocaleDateString();
  
  res.send(`
<!DOCTYPE html>
<html>
<head>
<meta charset="utf-8">
<title>${filename} - E-Portfolio</title>
<style>${globalCSS}</style>
</head>
<body>
<div class="container">
  <header>
    <h1>📄 Assignment Submission</h1>
    <p>From: ${profile.name || 'Student Portfolio'}</p>
  </header>

  <nav>
    <a href="/">🏠 Back to Portfolio</a>
  </nav>

  <div class="content">
    <div class="card">
      <h2>Assignment Details</h2>
      <div style="background: #f8f9fa; padding: 20px; border-radius: 8px; border-left: 5px solid #667eea;">
        <p><strong>📁 File Name:</strong> ${filename}</p>
        <p><strong>📅 Uploaded:</strong> ${uploadDate}</p>
        <p><strong>👤 Student:</strong> ${profile.name || '(No name set)'}</p>
        <p style="color: #7c8db0; margin-top: 15px;"><em>This assignment is shared from an E-Portfolio. Faculty can review and download the file below.</em></p>
      </div>
    </div>

    <div class="card">
      <h2>Download Assignment</h2>
      <p>Click the button below to download and review this assignment:</p>
      <a href="/uploads/assignments/${filename}" download style="display: inline-block; padding: 12px 25px; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; text-decoration: none; border-radius: 6px; font-weight: bold; margin-top: 10px; transition: all 0.3s;">⬇️ Download File</a>
    </div>

    <div class="card">
      <h2>About the Student</h2>
      <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 20px; border-radius: 8px;">
        <h3 style="color: white; margin-bottom: 10px;">👤 ${profile.name || '(Name not set)'}</h3>
        <p>${profile.bio || '(Bio not set)'}</p>
      </div>
    </div>

    <div class="card">
      <p><a href="/" style="color: #667eea; text-decoration: none; font-weight: bold;">← Visit Complete E-Portfolio</a></p>
    </div>
  </div>

  <footer>© 2026 E-Portfolio | Shared Assignment</footer>
</div>
</body>
</html>
  `);
});

// Learning log
app.get("/learning-log", (req, res) => {
  const logs = readJson("learningLog.json").reverse();
  
  // Initialize PSE Lab data if it doesn't exist
  if (!fs.existsSync("pseLab.json")) {
    const labs = [
      // 🔹 LAB 1 – Confidence Building
      { title: "Lab 1.1: Self Introduction Practice", content: "Practiced structured self-introduction in front of classmates. Improved stage confidence.", date: new Date() },
      { title: "Lab 1.2: Eye Contact Training", content: "Learned importance of eye contact during speaking. Reduced hesitation.", date: new Date() },
      { title: "Lab 1.3: Body Language Awareness", content: "Worked on posture, hand gestures and facial expressions.", date: new Date() },
      { title: "Lab 1.4: Voice Clarity Improvement", content: "Practiced voice modulation and clarity for better communication.", date: new Date() },

      // 🔹 LAB 2 – Public Speaking Skills
      { title: "Lab 2.1: Group Discussion Participation", content: "Actively participated in GD. Improved speaking fluency.", date: new Date() },
      { title: "Lab 2.2: Extempore Speaking", content: "Spoke confidently on random topics for 2 minutes.", date: new Date() },
      { title: "Lab 2.3: Presentation Delivery", content: "Delivered structured presentation with confidence.", date: new Date() },
      { title: "Lab 2.4: Overcoming Stage Fear", content: "Reduced nervousness and gained stage confidence.", date: new Date() },

      // 🔹 LAB 3 – Communication Enhancement
      { title: "Lab 3.1: Active Listening Skills", content: "Learned importance of listening before responding.", date: new Date() },
      { title: "Lab 3.2: Professional Communication", content: "Improved formal speaking and professional tone.", date: new Date() },
      { title: "Lab 3.3: Vocabulary Development", content: "Enhanced vocabulary for better expression.", date: new Date() },
      { title: "Lab 3.4: Confidence in English Speaking", content: "Improved fluency and reduced hesitation while speaking English.", date: new Date() },

      // 🔹 LAB 4 – Leadership & Personality Development
      { title: "Lab 4.1: Team Leadership Activity", content: "Led a small group task and coordinated team effectively.", date: new Date() },
      { title: "Lab 4.2: Decision Making Practice", content: "Developed quick decision making skills.", date: new Date() },
      { title: "Lab 4.3: Time Management Skill", content: "Learned to manage time during presentations and tasks.", date: new Date() },
      { title: "Lab 4.4: Problem Solving Approach", content: "Improved logical thinking and solution finding ability.", date: new Date() },

      // 🔹 LAB 5 – Overall Personality Growth
      { title: "Lab 5.1: Confidence Reflection Session", content: "Reflected on personal growth and noticed strong confidence improvement.", date: new Date() },
      { title: "Lab 5.2: Public Interaction Practice", content: "Spoke confidently with new people without fear.", date: new Date() },
      { title: "Lab 5.3: Interview Simulation", content: "Practiced mock interviews and improved answering skills.", date: new Date() },
      { title: "Lab 5.4: Final Presentation Evaluation", content: "Delivered final presentation confidently and received positive feedback.", date: new Date() }
    ];
    fs.writeFileSync("pseLab.json", JSON.stringify(labs, null, 2));
  }

  // Read PSE Lab data
  const pseLabData = JSON.parse(fs.readFileSync("pseLab.json"));
  
  // Combine logs with PSE Lab data
  const allEntries = [...logs, ...pseLabData];
  
  const items = allEntries.map(l => `<li><strong>${l.title}</strong><br><p>${l.content}</p><em>📅 ${new Date(l.date).toLocaleDateString()}</em></li>`).join("");
  res.send(`
<!DOCTYPE html>
<html>
<head>
<meta charset="utf-8">
<title>Learning Log | E-Portfolio</title>
<style>${globalCSS}</style>
</head>
<body>
<div class="container">
  <header>
    <h1>📝 Learning Log</h1>
    <p>Document your learning journey</p>
  </header>

  <nav>
    <a href="/">🏠 Home</a>
    <a href="/introduction">🎥 Introduction</a>
    <a href="/assignments">📁 Assignments</a>
    <a href="/learning-log">📝 Learning Log</a>
    <a href="/pse-lab">🧪 PSE Lab</a>
    <a href="/gallery">🖼️ Gallery</a>
    <a href="/social">💬 Social</a>
    <a href="/dashboard">📊 Dashboard</a>
    <a href="/profile">👤 Profile</a>
    <a href="/contact">✉️ Contact</a>
  </nav>

  <div class="content">
    <div class="card">
      <h2>Add a New Entry</h2>
      <form action="/learning-log" method="POST">
        <input name="title" placeholder="Entry Title" required>
        <textarea name="content" placeholder="What did you learn today?" required></textarea>
        <button type="submit">✍️ Save Entry</button>
      </form>
    </div>

    <div class="card">
      <h2>Your Learning Log & PSE Lab Activities (${allEntries.length} total entries)</h2>
      <p style="color: #667eea; font-weight: bold;">📚 Custom Entries: ${logs.length} | 🧪 PSE Lab Activities: ${pseLabData.length}</p>
      ${allEntries.length > 0 ? `<ul>${items}</ul>` : '<p>Start documenting your learning journey!</p>'}
    </div>
  </div>

  <footer>© 2026 My E-Portfolio</footer>
</div>
</body>
</html>
  `);
});
app.post("/learning-log", (req, res) => {
  const { title, content } = req.body;
  appendJson("learningLog.json", { title, content, date: new Date().toISOString() });
  res.redirect("/learning-log");
});

// ================================
// 🧪 PSE LAB – Personality & Skill Enhancement
// ================================

app.get("/pse-lab", (req, res) => {

  if (!fs.existsSync("pseLab.json")) {

    const labs = [

      // 🔹 LAB 1 – Confidence Building
      { title: "Lab 1.1: Self Introduction Practice", content: "Practiced structured self-introduction in front of classmates. Improved stage confidence.", date: new Date() },
      { title: "Lab 1.2: Eye Contact Training", content: "Learned importance of eye contact during speaking. Reduced hesitation.", date: new Date() },
      { title: "Lab 1.3: Body Language Awareness", content: "Worked on posture, hand gestures and facial expressions.", date: new Date() },
      { title: "Lab 1.4: Voice Clarity Improvement", content: "Practiced voice modulation and clarity for better communication.", date: new Date() },

      // 🔹 LAB 2 – Public Speaking Skills
      { title: "Lab 2.1: Group Discussion Participation", content: "Actively participated in GD. Improved speaking fluency.", date: new Date() },
      { title: "Lab 2.2: Extempore Speaking", content: "Spoke confidently on random topics for 2 minutes.", date: new Date() },
      { title: "Lab 2.3: Presentation Delivery", content: "Delivered structured presentation with confidence.", date: new Date() },
      { title: "Lab 2.4: Overcoming Stage Fear", content: "Reduced nervousness and gained stage confidence.", date: new Date() },

      // 🔹 LAB 3 – Communication Enhancement
      { title: "Lab 3.1: Active Listening Skills", content: "Learned importance of listening before responding.", date: new Date() },
      { title: "Lab 3.2: Professional Communication", content: "Improved formal speaking and professional tone.", date: new Date() },
      { title: "Lab 3.3: Vocabulary Development", content: "Enhanced vocabulary for better expression.", date: new Date() },
      { title: "Lab 3.4: Confidence in English Speaking", content: "Improved fluency and reduced hesitation while speaking English.", date: new Date() },

      // 🔹 LAB 4 – Leadership & Personality Development
      { title: "Lab 4.1: Team Leadership Activity", content: "Led a small group task and coordinated team effectively.", date: new Date() },
      { title: "Lab 4.2: Decision Making Practice", content: "Developed quick decision making skills.", date: new Date() },
      { title: "Lab 4.3: Time Management Skill", content: "Learned to manage time during presentations and tasks.", date: new Date() },
      { title: "Lab 4.4: Problem Solving Approach", content: "Improved logical thinking and solution finding ability.", date: new Date() },

      // 🔹 LAB 5 – Overall Personality Growth
      { title: "Lab 5.1: Confidence Reflection Session", content: "Reflected on personal growth and noticed strong confidence improvement.", date: new Date() },
      { title: "Lab 5.2: Public Interaction Practice", content: "Spoke confidently with new people without fear.", date: new Date() },
      { title: "Lab 5.3: Interview Simulation", content: "Practiced mock interviews and improved answering skills.", date: new Date() },
      { title: "Lab 5.4: Final Presentation Evaluation", content: "Delivered final presentation confidently and received positive feedback.", date: new Date() }

    ];

    fs.writeFileSync("pseLab.json", JSON.stringify(labs, null, 2));
  }

  const labs = JSON.parse(fs.readFileSync("pseLab.json"));

  const items = labs.map(l => `
    <li>
      <strong>${l.title}</strong><br>
      <p>${l.content}</p>
      <em>📅 ${new Date(l.date).toLocaleDateString()}</em>
    </li>
  `).join("");

  res.send(`
<!DOCTYPE html>
<html>
<head>
<meta charset="utf-8">
<title>PSE Lab | Personality Enhancement</title>
<style>${globalCSS}</style>
</head>
<body>
<div class="container">
  <header>
    <h1>🧪 PSE Lab – Personality & Skill Enhancement</h1>
    <p>Confidence Building & Public Speaking Development Record</p>
  </header>

  <nav>
    <a href="/">🏠 Home</a>
    <a href="/introduction">🎥 Introduction</a>
    <a href="/assignments">📁 Assignments</a>
    <a href="/learning-log">📝 Learning Log</a>
    <a href="/pse-lab">🧪 PSE Lab</a>
    <a href="/gallery">🖼️ Gallery</a>
    <a href="/social">💬 Social</a>
    <a href="/dashboard">📊 Dashboard</a>
    <a href="/profile">👤 Profile</a>
    <a href="/contact">✉️ Contact</a>
  </nav>

  <div class="content">
    <div class="card">
      <h2>📘 Lab Record – 20 Skill Enhancement Activities</h2>
      <ul>${items}</ul>
    </div>
  </div>

  <footer>© 2026 My E-Portfolio | PSE Lab Record</footer>
</div>
</body>
</html>
  `);
});

// Gallery
app.get("/gallery", (req, res) => {
  const imgs = fs.readdirSync("uploads/gallery");
  const list = imgs.map(i => `<div class="gallery-item"><a href="/uploads/gallery/${i}" target="_blank"><img src="/uploads/gallery/${i}" alt="${i}"></a></div>`).join("");
  res.send(`
<!DOCTYPE html>
<html>
<head>
<meta charset="utf-8">
<title>Gallery | E-Portfolio</title>
<style>${globalCSS}</style>
</head>
<body>
<div class="container">
  <header>
    <h1>🖼️ Gallery</h1>
    <p>Share your moments and achievements</p>
  </header>

  <nav>
    <a href="/">🏠 Home</a>
    <a href="/introduction">🎥 Introduction</a>
    <a href="/assignments">📁 Assignments</a>
    <a href="/learning-log">📝 Learning Log</a>
    <a href="/pse-lab">🧪 PSE Lab</a>
    <a href="/gallery">🖼️ Gallery</a>
    <a href="/social">💬 Social</a>
    <a href="/dashboard">📊 Dashboard</a>
    <a href="/profile">👤 Profile</a>
    <a href="/contact">✉️ Contact</a>
  </nav>

  <div class="content">
    <div class="card">
      <h2>Upload a Photo</h2>
      <form action="/gallery" method="POST" enctype="multipart/form-data">
        <input type="file" name="image" accept="image/*" required>
        <button type="submit">📸 Upload Image</button>
      </form>
    </div>

    <div class="card">
      <h2>Your Gallery (${imgs.length} images)</h2>
      ${imgs.length > 0 ? `<div class="gallery-grid">${list}</div>` : '<p>No images yet. Start uploading!</p>'}
    </div>
  </div>

  <footer>© 2026 My E-Portfolio</footer>
</div>
</body>
</html>
  `);
});
app.post("/gallery", upload.single("image"), (req, res) => {
  res.redirect("/gallery");
});

// Social interaction (simple posts)
app.get("/social", (req, res) => {
  const posts = readJson("social.json").reverse();
  const items = posts.map(p => `<li><strong>${p.name}</strong><br><p>${p.message}</p><em>💬 ${new Date(p.date).toLocaleDateString()}</em></li>`).join("");
  res.send(`
<!DOCTYPE html>
<html>
<head>
<meta charset="utf-8">
<title>Social | E-Portfolio</title>
<style>${globalCSS}</style>
</head>
<body>
<div class="container">
  <header>
    <h1>💬 Social Interaction</h1>
    <p>Connect and share with others</p>
  </header>

  <nav>
    <a href="/">🏠 Home</a>
    <a href="/introduction">🎥 Introduction</a>
    <a href="/assignments">📁 Assignments</a>
    <a href="/learning-log">📝 Learning Log</a>
    <a href="/pse-lab">🧪 PSE Lab</a>
    <a href="/gallery">🖼️ Gallery</a>
    <a href="/social">💬 Social</a>
    <a href="/dashboard">📊 Dashboard</a>
    <a href="/profile">👤 Profile</a>
    <a href="/contact">✉️ Contact</a>
  </nav>

  <div class="content">
    <div class="card">
      <h2>Post Something</h2>
      <form action="/social" method="POST">
        <input name="name" placeholder="Your Name" required>
        <textarea name="message" placeholder="Share your thoughts or achievements..." required></textarea>
        <button type="submit">📤 Post</button>
      </form>
    </div>

    <div class="card">
      <h2>Timeline (${posts.length} posts)</h2>
      ${posts.length > 0 ? `<ul>${items}</ul>` : '<p>No posts yet. Be the first to share!</p>'}
    </div>
  </div>

  <footer>© 2026 My E-Portfolio</footer>
</div>
</body>
</html>
  `);
});
app.post("/social", (req, res) => {
  appendJson("social.json", { name: req.body.name, message: req.body.message, date: new Date().toISOString() });
  res.redirect("/social");
});



// Dashboard (summary)
app.get("/dashboard", (req, res) => {
  const counts = {
    assignments: fs.readdirSync("uploads/assignments").length,
    videos: fs.readdirSync("uploads/videos").length,
    gallery: fs.readdirSync("uploads/gallery").length,
    learningLog: readJson("learningLog.json").length,
    social: readJson("social.json").length,
    contacts: readJson("contacts.json").length
  };
  
  const totalActivities = Object.values(counts).reduce((a, b) => a + b, 0);
  
  res.send(`
<!DOCTYPE html>
<html>
<head>
<meta charset="utf-8">
<title>Dashboard | E-Portfolio</title>
<style>${globalCSS}</style>
</head>
<body>
<div class="container">
  <header>
    <h1>📊 Dashboard</h1>
    <p>Your portfolio statistics and overview</p>
  </header>

  <nav>
    <a href="/">🏠 Home</a>
    <a href="/introduction">🎥 Introduction</a>
    <a href="/assignments">📁 Assignments</a>
    <a href="/learning-log">📝 Learning Log</a>
    <a href="/pse-lab">🧪 PSE Lab</a>
    <a href="/gallery">🖼️ Gallery</a>
    <a href="/social">💬 Social</a>
    <a href="/dashboard">📊 Dashboard</a>
    <a href="/profile">👤 Profile</a>
    <a href="/contact">✉️ Contact</a>
  </nav>

  <div class="content">
    <div class="card">
      <h2>Portfolio Overview</h2>
      <p style="font-size: 1.1em; color: #667eea; font-weight: bold;">Total Activities: <span style="font-size: 1.5em;">${totalActivities}</span></p>
    </div>

    <div class="grid">
      <div class="stat-box">
        <h3>${counts.assignments}</h3>
        <p>📁 Assignments</p>
      </div>
      <div class="stat-box">
        <h3>${counts.videos}</h3>
        <p>🎥 Introduction Videos</p>
      </div>
      <div class="stat-box">
        <h3>${counts.gallery}</h3>
        <p>🖼️ Gallery Images</p>
      </div>
      <div class="stat-box">
        <h3>${counts.learningLog}</h3>
        <p>📝 Learning Log Entries</p>
      </div>
      <div class="stat-box">
        <h3>${counts.social}</h3>
        <p>💬 Social Posts</p>
      </div>
      <div class="stat-box">
        <h3>${counts.contacts}</h3>
        <p>✉️ Messages Received</p>
      </div>
    </div>

    <div class="card">
      <h2>Quick Stats</h2>
      <ul>
        <li>📈 Your portfolio is <strong>${totalActivities === 0 ? 'empty' : totalActivities <= 5 ? 'getting started' : 'active'}</strong></li>
        <li>🎯 Next Goal: Upload more content to strengthen your portfolio!</li>
        <li>👥 Share your portfolio link with others to get feedback</li>
      </ul>
    </div>
  </div>

  <footer>© 2026 My E-Portfolio | Last Updated: ${new Date().toLocaleDateString()}</footer>
</div>
</body>
</html>
  `);
});

// Profile view/edit
app.get("/profile", (req, res) => {
  const profile = (fs.existsSync("profile.json")) ? JSON.parse(fs.readFileSync("profile.json")) : {name:'', bio:''};
  res.send(`
<!DOCTYPE html>
<html>
<head>
<meta charset="utf-8">
<title>Profile | E-Portfolio</title>
<style>${globalCSS}</style>
</head>
<body>
<div class="container">
  <header>
    <h1>👤 Your Profile</h1>
    <p>Tell the world about yourself</p>
  </header>

  <nav>
    <a href="/">🏠 Home</a>
    <a href="/introduction">🎥 Introduction</a>
    <a href="/assignments">📁 Assignments</a>
    <a href="/learning-log">📝 Learning Log</a>
    <a href="/pse-lab">🧪 PSE Lab</a>
    <a href="/gallery">🖼️ Gallery</a>
    <a href="/social">💬 Social</a>
    <a href="/dashboard">📊 Dashboard</a>
    <a href="/profile">👤 Profile</a>
    <a href="/contact">✉️ Contact</a>
  </nav>

  <div class="content">
    <div class="card">
      <h2>Edit Your Profile</h2>
      <form action="/profile" method="POST">
        <input name="name" placeholder="Full Name" value="${profile.name || ''}" required>
        <textarea name="bio" placeholder="Tell us about yourself, your goals, and your achievements..." required>${profile.bio || ''}</textarea>
        <button type="submit">💾 Save Profile</button>
      </form>
    </div>

    <div class="card">
      <h2>Your Profile Preview</h2>
      <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 30px; border-radius: 8px; margin-bottom: 20px;">
        <h3 style="color: white; margin-bottom: 10px;">👤 ${profile.name || '(Your Name)'}</h3>
        <p>${profile.bio || '(Your bio will appear here)'}</p>
      </div>
    </div>
  </div>

  <footer>© 2026 My E-Portfolio</footer>
</div>
</body>
</html>
  `);
});
app.post("/profile", (req, res) => {
  fs.writeFileSync("profile.json", JSON.stringify({ name: req.body.name, bio: req.body.bio }, null, 2));
  res.redirect("/profile");
});

// Contact
app.get("/contact", (req, res) => {
  const contacts = readJson("contacts.json").reverse();
  const items = contacts.map(c => `<li><strong>${c.name}</strong> <em>(${c.email})</em><br><p>${c.message}</p><em>📅 ${new Date(c.date).toLocaleDateString()}</em></li>`).join("");
  res.send(`
<!DOCTYPE html>
<html>
<head>
<meta charset="utf-8">
<title>Contact | E-Portfolio</title>
<style>${globalCSS}</style>
</head>
<body>
<div class="container">
  <header>
    <h1>✉️ Contact Me</h1>
    <p>Get in touch with feedback and collaborations</p>
  </header>

  <nav>
    <a href="/">🏠 Home</a>
    <a href="/introduction">🎥 Introduction</a>
    <a href="/assignments">📁 Assignments</a>
    <a href="/learning-log">📝 Learning Log</a>
    <a href="/pse-lab">🧪 PSE Lab</a>
    <a href="/gallery">🖼️ Gallery</a>
    <a href="/social">💬 Social</a>
    <a href="/dashboard">📊 Dashboard</a>
    <a href="/profile">👤 Profile</a>
    <a href="/contact">✉️ Contact</a>
  </nav>

  <div class="content">
    <div class="card">
      <h2>Send Me a Message</h2>
      <form action="/contact" method="POST">
        <input name="name" placeholder="Your Full Name" required>
        <input name="email" placeholder="Your Email Address" type="email" required>
        <textarea name="message" placeholder="Your message or feedback..." required></textarea>
        <button type="submit">📨 Send Message</button>
      </form>
    </div>

    <div class="card">
      <h2>Messages Received (${contacts.length})</h2>
      ${contacts.length > 0 ? `<ul>${items}</ul>` : '<p>No messages yet. Be the first to send feedback!</p>'}
    </div>
  </div>

  <footer>© 2026 My E-Portfolio</footer>
</div>
</body>
</html>
  `);
});
app.post("/contact", (req, res) => {
  appendJson("contacts.json", { name: req.body.name, email: req.body.email, message: req.body.message, date: new Date().toISOString() });
  res.redirect("/contact");
});

// Public Portfolio Share Route
app.get("/share/portfolio", (req, res) => {
  const profile = fs.existsSync("profile.json") ? JSON.parse(fs.readFileSync("profile.json")) : { name: 'Student Portfolio', bio: '' };
  const assignments = fs.readdirSync("uploads/assignments");
  const videos = fs.readdirSync("uploads/videos");
  const gallery = fs.readdirSync("uploads/gallery");
  const learningLogs = readJson("learningLog.json").reverse();
  const socialPosts = readJson("social.json").reverse();
  
  const assignmentsList = assignments.map(a => `<li>📄 <a href="/uploads/assignments/${a}" target="_blank">${a}</a></li>`).join("");
  const videosList = videos.map(v => `<li>🎥 <a href="/uploads/videos/${v}" target="_blank">${v}</a></li>`).join("");
  const galleryList = gallery.map(g => `<div class="gallery-item"><a href="/uploads/gallery/${g}" target="_blank"><img src="/uploads/gallery/${g}" alt="${g}"></a></div>`).join("");
  const logsList = learningLogs.slice(0, 5).map(l => `<li><strong>${l.title}</strong><br><p>${l.content.substring(0, 100)}...</p><em>📅 ${new Date(l.date).toLocaleDateString()}</em></li>`).join("");
  const postsList = socialPosts.slice(0, 5).map(p => `<li><strong>${p.name}</strong><br><p>${p.message}</p><em>💬 ${new Date(p.date).toLocaleDateString()}</em></li>`).join("");
  
  res.send(`
<!DOCTYPE html>
<html>
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>${profile.name} - E-Portfolio</title>
<style>
${globalCSS}
.share-badge { display: inline-block; background: #667eea; color: white; padding: 5px 12px; border-radius: 20px; font-size: 0.85em; margin-bottom: 15px; }
.section-header { margin-top: 30px; margin-bottom: 15px; padding-bottom: 10px; border-bottom: 2px solid #667eea; }
</style>
</head>
<body>
<div class="container">
  <header>
    <h1>🎓 ${profile.name || 'Student Portfolio'}</h1>
    <p>📌 Public Portfolio Showcase</p>
    <div class="share-badge">🔗 Shared Portfolio</div>
  </header>

  <div class="content">
    <div class="card">
      <h2>👤 About</h2>
      <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 25px; border-radius: 8px;">
        <h3 style="color: white; margin-bottom: 15px;">👋 ${profile.name || '(Name not set)'}</h3>
        <p style="font-size: 1.05em;">${profile.bio || '(Bio not set)'}</p>
      </div>
    </div>

    ${videos.length > 0 ? `
    <div class="card">
      <h2>🎥 Introduction Video</h2>
      <ul>${videosList}</ul>
    </div>
    ` : ''}

    ${assignments.length > 0 ? `
    <div class="card">
      <h2>📁 Assignments (${assignments.length})</h2>
      <ul>${assignmentsList}</ul>
    </div>
    ` : ''}

    ${gallery.length > 0 ? `
    <div class="card">
      <h2>🖼️ Gallery (${gallery.length} images)</h2>
      <div class="gallery-grid">${galleryList}</div>
    </div>
    ` : ''}

    ${learningLogs.length > 0 ? `
    <div class="card">
      <h2>📝 Learning Log (${learningLogs.length} entries)</h2>
      <ul>${logsList}</ul>
      ${learningLogs.length > 5 ? '<p style="margin-top: 15px;"><em>Showing 5 most recent entries</em></p>' : ''}
    </div>
    ` : ''}
    <a href="/pse-lab">🧪 PSE Lab</a>

    ${socialPosts.length > 0 ? `
    <div class="card">
      <h2>💬 Social Posts (${socialPosts.length} posts)</h2>
      <ul>${postsList}</ul>
      ${socialPosts.length > 5 ? '<p style="margin-top: 15px;"><em>Showing 5 most recent posts</em></p>' : ''}
    </div>
    ` : ''}

    <div class="card" style="text-align: center; background: linear-gradient(135deg, #667eea15 0%, #764ba215 100%); border: 2px dashed #667eea;">
      <h2>📊 Portfolio Summary</h2>
      <div class="grid" style="margin-top: 20px;">
        <div style="padding: 15px; background: white; border-radius: 8px;">
          <h3 style="color: #667eea; font-size: 1.8em;">${assignments.length}</h3>
          <p>📁 Assignments</p>
        </div>
        <div style="padding: 15px; background: white; border-radius: 8px;">
          <h3 style="color: #667eea; font-size: 1.8em;">${gallery.length}</h3>
          <p>🖼️ Gallery Images</p>
        </div>
        <div style="padding: 15px; background: white; border-radius: 8px;">
          <h3 style="color: #667eea; font-size: 1.8em;">${learningLogs.length}</h3>
          <p>📝 Learning Entries</p>
        </div>
        <div style="padding: 15px; background: white; border-radius: 8px;">
          <h3 style="color: #667eea; font-size: 1.8em;">${socialPosts.length}</h3>
          <p>💬 Social Posts</p>
        </div>
      </div>
    </div>
  </div>

  <footer>© 2026 E-Portfolio | Publicly Shared</footer>
</div>
</body>
</html>
  `);
});
// ================================
// 🧪 PESE LAB – Personality & Skill Enhancement (50 Activities)
// ================================

app.get("/pese-lab", (req, res) => {

  if (!fs.existsSync("peseLab.json")) {

    const labs = [

      // 🔹 LAB 1 – Confidence Building (10)
      { title: "Lab 1.1: Structured Self Introduction", content: "Delivered confident self-introduction in class.", date: new Date() },
      { title: "Lab 1.2: Mirror Practice Session", content: "Practiced speaking in front of mirror to improve body language.", date: new Date() },
      { title: "Lab 1.3: Eye Contact Improvement", content: "Maintained steady eye contact while speaking.", date: new Date() },
      { title: "Lab 1.4: Voice Clarity Exercise", content: "Improved pronunciation and voice modulation.", date: new Date() },
      { title: "Lab 1.5: Removing Filler Words", content: "Reduced usage of 'umm' and 'like'.", date: new Date() },
      { title: "Lab 1.6: Confidence Without Notes", content: "Spoke confidently without reading notes.", date: new Date() },
      { title: "Lab 1.7: Stage Standing Practice", content: "Improved posture and confident stance.", date: new Date() },
      { title: "Lab 1.8: Overcoming Nervousness", content: "Controlled nervousness during speech.", date: new Date() },
      { title: "Lab 1.9: Breathing Control Technique", content: "Used breathing exercises before speaking.", date: new Date() },
      { title: "Lab 1.10: Positive Self Affirmation", content: "Built internal confidence through self-motivation.", date: new Date() },

      // 🔹 LAB 2 – Public Speaking Skills (10)
      { title: "Lab 2.1: Extempore Speaking", content: "Spoke 2 minutes on random topic confidently.", date: new Date() },
      { title: "Lab 2.2: Group Discussion", content: "Actively participated in GD session.", date: new Date() },
      { title: "Lab 2.3: Presentation Skills", content: "Delivered PowerPoint presentation effectively.", date: new Date() },
      { title: "Lab 2.4: Topic Structuring", content: "Organized speech into intro, body, conclusion.", date: new Date() },
      { title: "Lab 2.5: Audience Engagement", content: "Maintained audience attention.", date: new Date() },
      { title: "Lab 2.6: Handling Questions", content: "Answered audience questions confidently.", date: new Date() },
      { title: "Lab 2.7: Storytelling Technique", content: "Used storytelling to improve engagement.", date: new Date() },
      { title: "Lab 2.8: Debate Participation", content: "Participated in debate confidently.", date: new Date() },
      { title: "Lab 2.9: Stage Confidence Practice", content: "Reduced fear of public stage.", date: new Date() },
      { title: "Lab 2.10: Final Public Speech", content: "Delivered full confident public speech.", date: new Date() },

      // 🔹 LAB 3 – Communication Enhancement (10)
      { title: "Lab 3.1: Active Listening", content: "Improved listening before responding.", date: new Date() },
      { title: "Lab 3.2: Professional Tone", content: "Maintained formal communication tone.", date: new Date() },
      { title: "Lab 3.3: Vocabulary Development", content: "Learned new words daily.", date: new Date() },
      { title: "Lab 3.4: English Fluency Practice", content: "Improved fluency in English speaking.", date: new Date() },
      { title: "Lab 3.5: Confidence in Conversation", content: "Spoke confidently in peer discussions.", date: new Date() },
      { title: "Lab 3.6: Interview Simulation", content: "Practiced mock interviews.", date: new Date() },
      { title: "Lab 3.7: Email Writing Practice", content: "Learned professional email drafting.", date: new Date() },
      { title: "Lab 3.8: Body Language Awareness", content: "Improved hand gestures and posture.", date: new Date() },
      { title: "Lab 3.9: Clear Thought Expression", content: "Expressed ideas clearly and logically.", date: new Date() },
      { title: "Lab 3.10: Confidence in English Q&A", content: "Answered questions confidently in English.", date: new Date() },

      // 🔹 LAB 4 – Leadership & Teamwork (10)
      { title: "Lab 4.1: Team Leader Role", content: "Led group task successfully.", date: new Date() },
      { title: "Lab 4.2: Conflict Resolution", content: "Resolved team conflicts calmly.", date: new Date() },
      { title: "Lab 4.3: Decision Making", content: "Took quick decisions during activity.", date: new Date() },
      { title: "Lab 4.4: Delegation Skills", content: "Distributed tasks effectively.", date: new Date() },
      { title: "Lab 4.5: Motivating Team Members", content: "Encouraged team participation.", date: new Date() },
      { title: "Lab 4.6: Problem Solving", content: "Improved logical thinking ability.", date: new Date() },
      { title: "Lab 4.7: Time Management", content: "Completed tasks within time limit.", date: new Date() },
      { title: "Lab 4.8: Responsibility Handling", content: "Took responsibility confidently.", date: new Date() },
      { title: "Lab 4.9: Presentation as Leader", content: "Presented group project confidently.", date: new Date() },
      { title: "Lab 4.10: Team Coordination", content: "Coordinated effectively within group.", date: new Date() },

      // 🔹 LAB 5 – Personality Development (10)
      { title: "Lab 5.1: Self Reflection Session", content: "Reflected personal improvement journey.", date: new Date() },
      { title: "Lab 5.2: Confidence in Public Interaction", content: "Spoke with strangers confidently.", date: new Date() },
      { title: "Lab 5.3: Positive Thinking", content: "Developed optimistic mindset.", date: new Date() },
      { title: "Lab 5.4: Stress Management", content: "Handled stress before speaking.", date: new Date() },
      { title: "Lab 5.5: Grooming & Appearance", content: "Improved professional appearance.", date: new Date() },
      { title: "Lab 5.6: Feedback Implementation", content: "Improved based on faculty feedback.", date: new Date() },
      { title: "Lab 5.7: Confidence in Seminar", content: "Spoke confidently during seminar.", date: new Date() },
      { title: "Lab 5.8: Stage Fear Removal", content: "Completely overcame stage fear.", date: new Date() },
      { title: "Lab 5.9: Professional Behavior", content: "Maintained professional attitude.", date: new Date() },
      { title: "Lab 5.10: Final Growth Evaluation", content: "Achieved strong personality improvement.", date: new Date() }

    ];

    fs.writeFileSync("peseLab.json", JSON.stringify(labs, null, 2));
  }

  const labs = JSON.parse(fs.readFileSync("peseLab.json"));

  const items = labs.map(l => `
    <li>
      <strong>${l.title}</strong><br>
      <p>${l.content}</p>
      <em>📅 ${new Date(l.date).toLocaleDateString()}</em>
    </li>
  `).join("");

  res.send(`
<!DOCTYPE html>
<html>
<head>
<meta charset="utf-8">
<title>PSE Lab | 50 Activities</title>
<style>${globalCSS}</style>
</head>
<body>
<div class="container">
  <header>
    <h1>🧪 PESE Lab – Personality & Public Speaking Enhancement</h1>
    <p>50 Skill Development Activities Record</p>
  </header>

  <nav>
    <a href="/">🏠 Home</a>
    <a href="/pese-lab">🧪 PSE Lab</a>
    <a href="/assignments">📁 Assignments</a>
    <a href="/gallery">🖼️ Gallery</a>
    <a href="/dashboard">📊 Dashboard</a>
  </nav>

  <div class="content">
    <div class="card">
      <h2>📘 Lab Record – 50 Activities</h2>
      <ul>${items}</ul>
    </div>
  </div>

  <footer>© 2026 My E-Portfolio | PESE Lab Record</footer>
</div>
</body>
</html>
  `);
});

// Start server
app.listen(3000, () => {
  console.log("Portfolio running at http://localhost:3000");
});
