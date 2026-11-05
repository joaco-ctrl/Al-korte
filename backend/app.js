const express = require('express');
const cors = require('cors');
const app = express();
require("dotenv").config();
const rutas = require('./routes/rutas');
app.use(cors());
app.use(express.json());
app.use('/api', rutas);
app.listen(3000, () => {
  console.log(`Server is running on http://localhost:3000`);
});
