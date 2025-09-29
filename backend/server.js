const express = require('express');
const cors = require('cors');
const mongoose = require('mongoose');

mongoose.set("strictQuery", true);
require('dotenv').config();


const chatRoutes = require('./routes/chat');


const app = express();
//app.use(cors());

app.use(cors({

   origin: ["http://localhost:5001", "https:/mern-ai-chat.vercel.app"],

  methods: ["GET", "POST"], // allowed HTTP methods
  credentials: true          // allow cookies if needed
}));

app.use(express.json());


const PORT = process.env.PORT || 5000;


// MongoDB connection
mongoose.connect(process.env.MONGO_URI, {
useNewUrlParser: true,
useUnifiedTopology: true,
})
.then(() => console.log('MongoDB connected'))
.catch((err) => console.error('MongoDB connection error:', err));


app.use('/api/chat', chatRoutes);


app.get('/', (req, res) => res.send('MERN AI Chat Backend'));


app.listen(PORT, () => console.log(`Server running on port ${PORT}`));