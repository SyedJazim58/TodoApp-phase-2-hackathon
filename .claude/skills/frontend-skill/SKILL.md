---
name: frontend-skill
description: Build frontend pages, reusable components, layouts, and styling for modern web applications.
---

# Frontend Skill

## Instructions

1. **Page Structure**
   - Create clear page-level components
   - Organize routes and layouts logically
   - Separate pages from reusable components

2. **Component Design**
   - Build reusable, composable components
   - Pass data via props and events
   - Keep components small and focused

3. **Layout & Navigation**
   - Implement consistent layouts
   - Use responsive grid and spacing
   - Support common navigation patterns

4. **Styling**
   - Apply clean, maintainable styles
   - Ensure responsive and accessible design
   - Use design tokens or utility classes where possible

## Best Practices

- Mobile-first design approach
- Consistent spacing and typography
- Avoid duplicated styles
- Keep UI logic separate from data fetching

## Example Structure

```tsx
export function PageLayout({ children }) {
  return (
    <main className="layout">
      <header />
      {children}
      <footer />
    </main>
  );
}
