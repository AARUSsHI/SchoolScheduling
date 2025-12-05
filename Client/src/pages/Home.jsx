/* eslint-disable react-hooks/set-state-in-effect */
import { useState, useEffect } from "react";
import { Link } from "react-router-dom";

function Home() {
  const [teachers, setTeachers] = useState([]);
  const [classes, setClasses] = useState([]);
  const [teacherData, setTeacherData] = useState({
    name: "",
    email: "",
  });
  const [classData, setClassData] = useState({
    grade: "",
    section: "",
  });

  const fetchClass = async () => {
    try {
      const response = await fetch("http://localhost:5000/api/class");
      const data = await response.json();
      setClasses(data);
    } catch (error) {
      console.error("Error fetching class", error);
    }
  };

  const fetchTeacher = async () => {
    try {
      const response = await fetch("http://localhost:5000/api/teacher");
      const data = await response.json();
      setTeachers(data);
    } catch (error) {
      console.error("Error fetching teacher", error);
    }
  };

  useEffect(() => {
    fetchClass();
    fetchTeacher();
  }, []);

  const handleClassInputChanges = (e) => {
    const { name, value } = e.target;
    setClassData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleTeacherInputChanges = (e) => {
    const { name, value } = e.target;
    setTeacherData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleClassSubmit = async (e) => {
    e.preventDefault();
    try {
      const response = await fetch("http://localhost:5000/api/class", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(classData),
      });
      if (response.ok) {
        setClassData({ grade: "", section: "" }), fetchClass();
      }
    } catch (error) {
      console.error("Error creating Class", error);
    }
  };

  const handleTeacherSubmit = async (e) => {
    e.preventDefault();
    try {
      const response = await fetch("http://localhost:5000/api/teacher", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(teacherData),
      });
      if (response.ok) {
        setTeacherData({ name: "", email: "" }), fetchTeacher();
      }
    } catch (error) {
      console.error("Error creating Teacher", error);
    }
  };

  const handleClassDelete = async (id) => {
    try {
      const response = await fetch(`http://localhost:5000/api/class/${id}`, {
        method: "DELETE",
      });
      if (response.ok) {
        fetchClass();
      }
    } catch (error) {
      console.error("Error deleteing Class", error);
    }
  };

  const handleTeacherDelete = async (id) => {
    try {
      const response = await fetch(`http://localhost:5000/api/teacher/${id}`, {
        method: "DELETE",
      });
      if (response.ok) {
        fetchTeacher();
      }
    } catch (error) {
      console.error("Error deleteing Teacher", error);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 py-8 px-4">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-gray-800 mb-2">
            School Scheduling System
          </h1>
          <p className="text-gray-600 mb-4">Manage classes and teachers</p>
          <Link
            to="/Timetable"
            className="inline-block bg-indigo-600 hover:bg-indigo-700 text-white font-semibold py-3 px-6 rounded-lg transition duration-200 shadow-md hover:shadow-lg"
          >
            View Timetable
          </Link>
        </div>

        {/* Main Content Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Classes Section */}
          <div className="bg-white rounded-xl shadow-lg p-6">
            <h2 className="text-2xl font-semibold text-gray-800 mb-6 pb-3 border-b-2 border-blue-500">
              Classes
            </h2>

            {/* Create Class Form */}
            <form onSubmit={handleClassSubmit} className="mb-6 space-y-4">
              <div>
                <label
                  htmlFor="grade"
                  className="block text-sm font-medium text-gray-700 mb-2"
                >
                  Grade
                </label>
                <input
                  type="text"
                  id="grade"
                  name="grade"
                  value={classData.grade}
                  onChange={handleClassInputChanges}
                  placeholder="e.g., 10, 11, 12"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition"
                  required
                />
              </div>
              <div>
                <label
                  htmlFor="section"
                  className="block text-sm font-medium text-gray-700 mb-2"
                >
                  Section
                </label>
                <input
                  type="text"
                  id="section"
                  name="section"
                  value={classData.section}
                  onChange={handleClassInputChanges}
                  placeholder="e.g., A, B, C"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition"
                  required
                />
              </div>
              <button
                type="submit"
                className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-2 px-4 rounded-lg transition duration-200 shadow-md hover:shadow-lg"
              >
                Add Class
              </button>
            </form>

            {/* Classes List */}
            <div className="mt-6">
              <h3 className="text-lg font-semibold text-gray-700 mb-4">
                Existing Classes
              </h3>
              <div className="space-y-3 max-h-64 overflow-y-auto">
                {classes.length === 0 ? (
                  <p className="text-gray-500 text-center py-4">
                    No classes added yet
                  </p>
                ) : (
                  classes.map((cls) => (
                    <div
                      key={cls._id}
                      className="flex items-center justify-between bg-gray-50 hover:bg-gray-100 p-4 rounded-lg transition duration-200 border border-gray-200"
                    >
                      <div>
                        <span className="font-semibold text-gray-800">
                          Grade {cls.grade}
                        </span>
                        <span className="text-gray-600 ml-2">
                          Section {cls.section}
                        </span>
                      </div>
                      <button
                        onClick={() => handleClassDelete(cls._id)}
                        className="bg-red-500 hover:bg-red-600 text-white px-3 py-1 rounded-md text-sm font-medium transition duration-200 shadow-sm hover:shadow"
                      >
                        Delete
                      </button>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>

          {/* Teachers Section */}
          <div className="bg-white rounded-xl shadow-lg p-6">
            <h2 className="text-2xl font-semibold text-gray-800 mb-6 pb-3 border-b-2 border-purple-500">
              Teachers
            </h2>

            {/* Create Teacher Form */}
            <form onSubmit={handleTeacherSubmit} className="mb-6 space-y-4">
              <div>
                <label
                  htmlFor="name"
                  className="block text-sm font-medium text-gray-700 mb-2"
                >
                  Name
                </label>
                <input
                  type="text"
                  id="name"
                  name="name"
                  value={teacherData.name}
                  onChange={handleTeacherInputChanges}
                  placeholder="Teacher's full name"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent outline-none transition"
                  required
                />
              </div>
              <div>
                <label
                  htmlFor="email"
                  className="block text-sm font-medium text-gray-700 mb-2"
                >
                  Email
                </label>
                <input
                  type="email"
                  id="email"
                  name="email"
                  value={teacherData.email}
                  onChange={handleTeacherInputChanges}
                  placeholder="teacher@example.com"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent outline-none transition"
                  required
                />
              </div>
              <button
                type="submit"
                className="w-full bg-purple-600 hover:bg-purple-700 text-white font-semibold py-2 px-4 rounded-lg transition duration-200 shadow-md hover:shadow-lg"
              >
                Add Teacher
              </button>
            </form>

            {/* Teachers List */}
            <div className="mt-6">
              <h3 className="text-lg font-semibold text-gray-700 mb-4">
                Existing Teachers
              </h3>
              <div className="space-y-3 max-h-64 overflow-y-auto">
                {teachers.length === 0 ? (
                  <p className="text-gray-500 text-center py-4">
                    No teachers added yet
                  </p>
                ) : (
                  teachers.map((teacher) => (
                    <div
                      key={teacher._id}
                      className="flex items-center justify-between bg-gray-50 hover:bg-gray-100 p-4 rounded-lg transition duration-200 border border-gray-200"
                    >
                      <div>
                        <p className="font-semibold text-gray-800">
                          {teacher.name}
                        </p>
                        <p className="text-sm text-gray-600">{teacher.email}</p>
                      </div>
                      <button
                        onClick={() => handleTeacherDelete(teacher._id)}
                        className="bg-red-500 hover:bg-red-600 text-white px-3 py-1 rounded-md text-sm font-medium transition duration-200 shadow-sm hover:shadow"
                      >
                        Delete
                      </button>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default Home;