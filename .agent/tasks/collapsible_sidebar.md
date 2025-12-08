# Task: Implement Collapsible Sidebar

## Objective
Enable the user to hide/collapse the sidebar menu to maximize the workspace area.

## Changes
1.  **Modified `src/components/Sidebar.tsx`**:
    *   Introduced `isCollapsed` state using `useState`.
    *   Added a toggle button in the sidebar header using `ChevronLeft` and `ChevronRight` icons.
    *   Implemented dynamic width classes (`w-64` vs `w-20`) with smooth transitions (`transition-all duration-300`).
    *   Conditionally rendered sidebar elements:
        *   **Header**: Title "SCP System" hides when collapsed.
        *   **Navigation**: Labels hide, icons center and resize slightly. Added tooltips (`title` attribute) for better UX when collapsed.
        *   **Footer**: Simplified Role Switcher to a placeholder dot (or hidden), compacted Language Switcher to a single toggle button, and hid extended User Info text.

## User Benefit
Users can now resize the sidebar to focus more on the dashboard content, which is especially useful for dense interfaces like the Revenue Matrix or extensive charts.
