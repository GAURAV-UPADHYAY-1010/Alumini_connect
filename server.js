const express = require('express');
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const bodyParser = require('body-parser');
const cors = require('cors');
const multer = require('multer');
const path = require('path');
const fs = require('fs');  // Import fs for file system operations

// Create Express app
const app = express();

// MongoDB URI (directly included in the code)
const MONGO_URI = "mongodb+srv://Gaurav:Gaurav@cluster0.ilx97.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0";

// Connect to MongoDB
mongoose.connect(MONGO_URI, { useNewUrlParser: true, useUnifiedTopology: true })
  .then(() => console.log('Connected to MongoDB'))
  .catch((err) => console.log('Error connecting to MongoDB:', err));

// Middleware
app.use(cors()); // Enable CORS for all domains
app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());

// Serve static files (HTML, CSS, JS, and uploaded images) from the 'public' and 'uploads' folder
app.use(express.static(__dirname));
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Ensure uploads folder exists
const uploadDir = path.join(__dirname, 'uploads');
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir);  // Create the 'uploads' folder if it doesn't exist
}

// Set up multer for image upload with file validation
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, uploadDir); // Use the 'uploads' directory
  },
  filename: function (req, file, cb) {
    cb(null, Date.now() + path.extname(file.originalname)); // Ensure a unique filename
  }
});

const upload = multer({
  storage: storage,
  fileFilter: (req, file, cb) => {
    const allowedMimeTypes = ['image/jpeg', 'image/png', 'image/gif']; // Allowed file types
    if (!allowedMimeTypes.includes(file.mimetype)) {
      return cb(new Error('Only image files are allowed'), false);
    }
    cb(null, true);
  }
});

// User Schema
const userSchema = new mongoose.Schema({
  studentName: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  rollNumber: { type: String, required: true, unique: true },
  collegeName: { type: String, required: true },
  password: { type: String, required: true },
  bio: { type: String, default: '' },
  slogan: { type: String, default: '' },
  profileImage: { type: String, default: '' } // New field to store image path
});

const User = mongoose.model('User', userSchema);

// Registration Route
app.post('/register', async (req, res) => {
  const { studentName, email, rollNumber, collegeName, password } = req.body;

  // Validate roll number (example pattern)
  const rollNumberPattern = /^22BH1A0(57[0-7]|[5-6][0-9]|[0-5][0-9])$/;
  if (!rollNumberPattern.test(rollNumber)) {
    return res.status(400).json({ message: 'Invalid roll number. Only 22BH1AO570 to 22BH1AO577 are allowed.' });
  }

  // Check if user already exists
  const userExists = await User.findOne({ email });
  if (userExists) {
    return res.status(400).json({ message: 'User already exists' });
  }

  // Hash the password
  const hashedPassword = await bcrypt.hash(password, 10);

  // Create new user
  const newUser = new User({
    studentName,
    email,
    rollNumber,
    collegeName,
    password: hashedPassword
  });

  try {
    await newUser.save();
    res.status(201).json({ message: 'User registered successfully' });
  } catch (err) {
    res.status(500).json({ message: 'Error registering user', error: err });
  }
});


// Start the server
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
