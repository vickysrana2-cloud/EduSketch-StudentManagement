const express = require("express");
const cors = require("cors");

const studentRoutes = require("./routes/studentRoutes");
const markRoutes = require("./routes/markRoutes");

const app = express();

app.use(cors());
app.use(express.json());

app.use("/students", studentRoutes);
app.use("/students", markRoutes);

module.exports = app;