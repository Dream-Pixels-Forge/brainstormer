//! Tauri library entry point for mobile platforms

#![cfg_attr(not(debug_assertions), windows_subsystem = "windows")]

pub fn run() {
    // This file is used for mobile builds.
    // Desktop builds use src/main.rs directly.
}
