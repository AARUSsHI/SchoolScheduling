import mongoose from "mongoose";
import express from "express";
import cors from "cors";
import * as dotenv from "dotenv";
import Class from "./models/Class.js";
import Teacher from "./models/Teacher.js";
import Timetable from "./models/Timetable.js";

dotenv.config();
const app = express();
app.use(express.json());
app.use(cors());

mongoose
  .connect(process.env.MONGO_URL)
  .then(() => {
    console.log("**DB CONNECTED**");
  })
  .catch((error) => {
    console.error("DB Not Connected", error);
  });

// create class
app.post("/api/class", async (req, res) => {
  try {
    const { grade, section } = req.body;
    const classes = new Class({
      grade: grade,
      section: section,
    });
    await classes.save();
    res.status(200).json(classes);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

// read all classes
app.get("/api/class", async (req, res) => {
  try {
    const classes = await Class.find({});
    res.status(200).json(classes);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

// read using ID
app.get("/api/class/:id", async (req, res) => {
  try {
    const classes = await Class.findById(req.params.id);
    if (!classes) {
      return res.status(404).json({ message: "class not found" });
    }
    res.status(200).json(classes);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

// update
app.put("/api/class/:id", async (req, res) => {
  try {
    const updatedData = req.body;
    const classes = await Class.findByIdAndUpdate(
      req.params.id,
      { $set: updatedData },
      { new: true }
    );
    if (!classes) {
      return res.status(404).json({ message: "class not found" });
    }
    res.status(200).json(classes);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

// delete
app.delete("/api/class/:id", async (req, res) => {
  try {
    const classes = await Class.findByIdAndDelete(req.params.id);
    if (!classes) {
      return res.status(404).json({ message: "class not found" });
    }
    res.status(200).json(classes);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

// create teacher
app.post("/api/teacher", async (req, res) => {
  try {
    const { name, email } = req.body;
    const teacher = new Teacher({
      name: name,
      email: email,
    });
    await teacher.save();
    res.status(200).json(teacher);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

// read all teachers
app.get("/api/teacher", async (req, res) => {
  try {
    const teacher = await Teacher.find({});
    res.status(200).json(teacher);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

// read using ID
app.get("/api/teacher/:id", async (req, res) => {
  try {
    const teacher = await Teacher.findById(req.params.id);
    if (!teacher) {
      return res.status(404).json({ message: "teacher not found" });
    }
    res.status(200).json(teacher);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

// update
app.put("/api/teacher/:id", async (req, res) => {
  try {
    const updatedData = req.body;
    const teacher = await Teacher.findByIdAndUpdate(
      req.params.id,
      { $set: updatedData },
      { new: true }
    );
    if (!teacher) {
      return res.status(404).json({ message: "teacher not found" });
    }
    res.status(200).json(teacher);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

app.delete("/api/teacher/:id", async (req, res) => {
  try {
    const teacher = await Teacher.findByIdAndDelete(req.params.id);
    if (!teacher) {
      return res.status(404).json({ message: "teacher not found" });
    }
    res.status(200).json(teacher);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

//Timetable
// create
app.post("/api/timetable", async (req, res) => {
  try {
    const { classId, day, period, teacher } = req.body;

    // Validate class & teacher
    const classExists = await Class.findById(classId);
    const teacherExists = await Teacher.findById(teacher);
    if (!classExists || !teacherExists) {
      return res.status(400).json({ message: "Invalid class or teacher" });
    }

    // Teacher already busy?
    const teacherConflict = await Timetable.findOne({ day, period, teacher });
    if (teacherConflict) {
      return res.status(400).json({
        message: "Teacher is already assigned to another class at this time",
      });
    }

    // Class already has something in that slot?
    const classConflict = await Timetable.findOne({ day, period, classId });
    if (classConflict) {
      return res.status(400).json({
        message: "This class already has a teacher at this time",
      });
    }

    const timetable = new Timetable({
      classId,
      day,
      period,
      teacher,
    });

    await timetable.save();
    res.status(200).json(timetable);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

// get timetable for class
app.get("/api/timetable/class/:classId", async (req, res) => {
  try {
    const data = await Timetable.find({ classId: req.params.classId })
      .populate("teacher", "name email")
      .populate("classId", "grade section");
    res.status(200).json(data);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

// delete
app.delete("/api/timetable/:id", async (req, res) => {
  try {
    const deleted = await Timetable.findByIdAndDelete(req.params.id);
    if (!deleted) {
      return res.status(404).json({ message: "Timetable entry not found" });
    }
    res.status(200).json(deleted);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

const PORT = process.env.PORT;
app.listen(PORT, () => {
  console.log(`Server is connected at port ${PORT}`);
});
