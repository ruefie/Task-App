// src/pages/CrashTest.jsx
import React from "react";

export default function CrashTest() {
  throw new Error("Boom! Crash test from CrashTest route.");
}
