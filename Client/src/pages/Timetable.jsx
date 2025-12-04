import React, { useEffect, useState, useCallback } from "react";
import {
  DndContext,
  useDraggable,
  useDroppable,
  PointerSensor,
  useSensor,
  useSensors,
  DragOverlay,
  closestCenter,
} from "@dnd-kit/core";

const DAYS = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday"];
const PERIODS = [
  "09:00-09:45",
  "09:45-10:30",
  "10:30-11:15",
  "11:45-12:30",
  "12:30-13:15",
  "13:15-14:30",
];

function TeacherCard({ teacher }) {
  const { attributes, listeners, setNodeRef, transform, isDragging } =
    useDraggable({ id: teacher._id });

  const style = {
    transform: transform
      ? `translate3d(${transform.x}px, ${transform.y}px, 0)`
      : undefined,
    opacity: isDragging ? 0.6 : 1,
    cursor: isDragging ? "grabbing" : "grab",
  };

  return (
    <div
      ref={setNodeRef}
      {...listeners}
      {...attributes}
      style={style}
      className="bg-gradient-to-r from-indigo-50 to-purple-50 p-3 rounded-lg shadow-md border-2 border-indigo-200 hover:border-indigo-400 hover:shadow-lg transition-all duration-200 flex items-center justify-between group"
    >
      <div className="flex-1">
        <div className="font-semibold text-sm text-gray-800">
          {teacher.name}
        </div>
        <div className="text-xs text-gray-600 mt-0.5">{teacher.email}</div>
      </div>
      <div className="ml-2 text-indigo-400 group-hover:text-indigo-600 transition-colors">
        <svg
          xmlns="http://www.w3.org/2000/svg"
          className="h-5 w-5"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M4 8h16M4 16h16"
          />
        </svg>
      </div>
    </div>
  );
}

function SlotDropzone({ day, period, classId, assignedEntry, onDelete }) {
  const id = `${classId}|${day}|${period}`;
  const { isOver, setNodeRef } = useDroppable({ id });

  const busy = !!assignedEntry;

  return (
    <div
      ref={setNodeRef}
      id={id}
      className={`min-h-[80px] p-3 rounded-lg border-2 transition-all duration-200 ${
        isOver
          ? "border-dashed border-green-500 bg-green-100 shadow-lg scale-105"
          : busy
          ? "border-blue-300 bg-gradient-to-br from-blue-50 to-indigo-50 shadow-sm hover:shadow-md"
          : "border-gray-200 bg-gray-50 hover:bg-gray-100 hover:border-gray-300"
      } flex items-center justify-center`}
    >
      {!busy ? (
        <div className="text-center">
          <div className="text-xs text-gray-400 font-medium">
            {isOver ? "Drop here" : "Drop teacher"}
          </div>
          {!isOver && <div className="text-xs text-gray-300 mt-1">↓</div>}
        </div>
      ) : (
        <div className="flex flex-col items-center justify-between w-full h-full">
          <div className="flex-1 w-full">
            <div className="font-semibold text-sm text-gray-800 mb-1">
              {assignedEntry.teacher.name}
            </div>
            <div className="text-xs text-gray-600 mb-2">
              {assignedEntry.teacher.email}
            </div>
          </div>
          <button
            onClick={(e) => {
              e.stopPropagation();
              onDelete(assignedEntry._id);
            }}
            className="text-xs bg-red-500 hover:bg-red-600 text-white px-2 py-1 rounded-md font-medium transition-all duration-200 shadow-sm hover:shadow-md mt-auto"
          >
            Remove
          </button>
        </div>
      )}
    </div>
  );
}

function Timetable() {
  const [classes, setClasses] = useState([]);
  const [teachers, setTeachers] = useState([]);
  const [selectedClassId, setSelectedClassId] = useState("");
  const [timetableEntries, setTimetableEntries] = useState([]);
  const [activeId, setActiveId] = useState(null);
  const [draggedTeacher, setDraggedTeacher] = useState(null);

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8,
      },
    })
  );

  const fetchClasses = async () => {
    try {
      const response = await fetch("http://localhost:5000/api/class");
      const data = await response.json();
      setClasses(data);
      if (data.length > 0 && !selectedClassId) {
        setSelectedClassId(data[0]._id);
      }
    } catch (error) {
      console.error("Error fetching classes", error);
    }
  };

  const fetchTeachers = async () => {
    try {
      const response = await fetch("http://localhost:5000/api/teacher");
      const data = await response.json();
      setTeachers(data);
    } catch (error) {
      console.error("Error fetching teachers", error);
    }
  };

  const fetchTimetable = useCallback(async () => {
    if (!selectedClassId) return;
    try {
      const response = await fetch(
        `http://localhost:5000/api/timetable/class/${selectedClassId}`
      );
      const data = await response.json();
      // Create a map for quick lookup: `${day}|${period}` -> entry
      const entriesMap = {};
      data.forEach((entry) => {
        const key = `${entry.day}|${entry.period}`;
        entriesMap[key] = entry;
      });
      setTimetableEntries(entriesMap);
    } catch (error) {
      console.error("Error fetching timetable", error);
    }
  }, [selectedClassId]);

  useEffect(() => {
    fetchClasses();
    fetchTeachers();
  }, []);

  useEffect(() => {
    fetchTimetable();
  }, [fetchTimetable]);

  const handleDragStart = (event) => {
    const { active } = event;
    setActiveId(active.id);
    const teacher = teachers.find((t) => t._id === active.id);
    setDraggedTeacher(teacher);
  };

  const handleDragEnd = async (event) => {
    const { active, over } = event;

    setActiveId(null);
    setDraggedTeacher(null);

    // No drop target → exit safely
    if (!over) return;

    // Protect against invalid or empty IDs
    if (!over.id || typeof over.id !== "string" || !over.id.includes("|")) {
      return;
    }

    const [classId, day, period] = over.id.split("|");

    // Prevent crashing if any part is missing
    if (!classId || !day || !period) return;

    // Ensure drop belongs to selected class only
    if (classId !== selectedClassId) return;

    const teacherId = active.id;

    try {
      const response = await fetch("http://localhost:5000/api/timetable", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          classId: selectedClassId,
          day,
          period,
          teacher: teacherId,
        }),
      });

      if (response.ok) {
        fetchTimetable();
      } else {
        const errorData = await response.json();
        alert(errorData.message || "Failed to assign teacher");
      }
    } catch (error) {
      console.error("Error assigning teacher", error);
      alert("Failed to assign teacher");
    }
  };

  const handleDelete = async (entryId) => {
    try {
      const response = await fetch(
        `http://localhost:5000/api/timetable/${entryId}`,
        {
          method: "DELETE",
        }
      );
      if (response.ok) {
        fetchTimetable();
      }
    } catch (error) {
      console.error("Error deleting timetable entry", error);
    }
  };

  const getEntryForSlot = (day, period) => {
    const key = `${day}|${period}`;
    return timetableEntries[key] || null;
  };

  const selectedClass = classes.find((c) => c._id === selectedClassId);

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 py-8 px-4">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-gray-800 mb-2">
            Timetable Management
          </h1>
          <p className="text-gray-600">
            Drag and drop teachers to schedule classes
          </p>
        </div>

        {/* Class Selector */}
        <div className="bg-white rounded-xl shadow-lg p-6 mb-6">
          <label className="block text-sm font-medium text-gray-700 mb-3">
            Select Class
          </label>
          <select
            value={selectedClassId}
            onChange={(e) => setSelectedClassId(e.target.value)}
            className="w-full md:w-64 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none transition bg-white text-gray-800 font-medium"
          >
            {classes.length === 0 ? (
              <option value="">No classes available</option>
            ) : (
              classes.map((cls) => (
                <option key={cls._id} value={cls._id}>
                  Grade {cls.grade} - Section {cls.section}
                </option>
              ))
            )}
          </select>
          {selectedClass && (
            <div className="mt-4 p-3 bg-indigo-50 rounded-lg border border-indigo-200">
              <span className="text-sm font-semibold text-indigo-800">
                Currently viewing: Grade {selectedClass.grade} - Section{" "}
                {selectedClass.section}
              </span>
            </div>
          )}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          {/* Teachers Sidebar */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-xl shadow-lg p-6 sticky top-4">
              <h2 className="text-2xl font-semibold text-gray-800 mb-4 pb-3 border-b-2 border-purple-500">
                Teachers
              </h2>
              <div className="space-y-3 max-h-[600px] overflow-y-auto pr-2">
                {teachers.length === 0 ? (
                  <p className="text-gray-500 text-center py-4 text-sm">
                    No teachers available
                  </p>
                ) : (
                  teachers.map((teacher) => (
                    <TeacherCard key={teacher._id} teacher={teacher} />
                  ))
                )}
              </div>
            </div>
          </div>

          {/* Timetable Grid */}
          <div className="lg:col-span-3">
            <div className="bg-white rounded-xl shadow-lg p-6 overflow-x-auto">
              <h2 className="text-2xl font-semibold text-gray-800 mb-6 pb-3 border-b-2 border-blue-500">
                Weekly Timetable
              </h2>
              {!selectedClassId ? (
                <div className="text-center py-12 text-gray-500">
                  Please select a class to view its timetable
                </div>
              ) : (
                <DndContext
                  sensors={sensors}
                  collisionDetection={closestCenter}
                  onDragStart={handleDragStart}
                  onDragEnd={handleDragEnd}
                >
                  <div className="overflow-x-auto">
                    <table className="w-full border-collapse">
                      <thead>
                        <tr>
                          <th className="sticky left-0 z-10 bg-indigo-600 text-white p-3 text-sm font-semibold border border-indigo-700 min-w-[120px]">
                            Period
                          </th>
                          {DAYS.map((day) => (
                            <th
                              key={day}
                              className="bg-indigo-600 text-white p-3 text-sm font-semibold border border-indigo-700 min-w-[180px]"
                            >
                              {day}
                            </th>
                          ))}
                        </tr>
                      </thead>
                      <tbody>
                        {PERIODS.map((period) => (
                          <tr key={period}>
                            <td className="sticky left-0 z-10 bg-indigo-100 p-3 text-sm font-semibold text-gray-800 border border-indigo-200 text-center">
                              {period}
                            </td>
                            {DAYS.map((day) => (
                              <td
                                key={`${day}-${period}`}
                                className="border border-gray-200 p-2"
                              >
                                <SlotDropzone
                                  day={day}
                                  period={period}
                                  classId={selectedClassId}
                                  assignedEntry={getEntryForSlot(day, period)}
                                  onDelete={handleDelete}
                                />
                              </td>
                            ))}
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                  <DragOverlay>
                    {draggedTeacher ? (
                      <div className="bg-gradient-to-r from-indigo-100 to-purple-100 p-4 rounded-lg shadow-xl border-2 border-indigo-400 opacity-90">
                        <div className="font-semibold text-sm text-gray-800">
                          {draggedTeacher.name}
                        </div>
                        <div className="text-xs text-gray-600 mt-1">
                          {draggedTeacher.email}
                        </div>
                      </div>
                    ) : null}
                  </DragOverlay>
                </DndContext>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default Timetable;
