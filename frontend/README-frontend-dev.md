# Frontend Build & Production Static Serving (React)

## Development Workflow
- When running the React development server (`npm start` in the `frontend/` directory), any changes made to files in `src/` are automatically picked up and the browser refreshes. No manual build is needed during development.

## Production Build
- If you are serving the app from the `build/` directory (for production or static hosting), you must run `npm run build` in the `frontend/` directory after making changes. This updates the `build/` folder with the latest code.

## Production Workflow (Docker)
- The frontend Docker container builds the React app inside the container and serves the static production build using [`serve`](https://www.npmjs.com/package/serve).
- You no longer need to run `npm run build` manually on the host.
- The container exposes port 3000 and serves the latest production build from `/app/build`.

### To rebuild and restart the frontend (UI only):
1. Make your code changes in `frontend/src/` or `frontend/public/`.
2. Run the UI build script:
   ```
scripts\build_ui.bat
   ```
   This will rebuild the frontend Docker image and restart only the frontend container. Backend and database are untouched.
3. Visit [http://localhost:3000](http://localhost:3000) to view the production build.

### To rebuild the entire backend/database (including migrations and seeding):
1. Make your backend or database changes.
2. Run the backend build script:
   ```
backend\scripts\run_build.bat
   ```
   This will rebuild the backend, apply migrations, and seed the database as needed.

## Recent Changes (June 2025)
1. Created a new `ItemTable` component to fetch and display items from `/api/items`.
2. Added a `getItems()` method to the frontend API service.
3. Updated `App.js` to render `ItemTable` at the root route (`/`).
4. Rebuilt the frontend with `npm run build` and restarted the dev server to ensure the latest code was served.
5. Confirmed the correct UI is now displayed.
6. **Separated UI and backend build processes for reliability.**

## Troubleshooting
- If you see an old UI after making changes, try restarting the dev server and/or rebuilding the production build.
- Always ensure you are editing the correct component and route.
- If you see an old UI in the Docker production build, ensure you have rebuilt the Docker image and restarted the container as above.
- The UI build script (`scripts/build_ui.bat`) only affects the frontend. Backend/database changes require the backend build script (`backend/scripts/run_build.bat`).
- No need to clear browser cache unless you have aggressive caching plugins.
- The dev server (`npm start`) is no longer used in Docker; all serving is from the static build.

# UI Design & Layout Specifications

## 1. Core UI Goals
- **Clarity:** Users should instantly know what page they’re on and what actions are available.
- **Responsiveness:** Works well on desktop and mobile.
- **Consistency:** Common layout, colors, and navigation across all pages.
- **Scalability:** Easy to add new features (e.g., sales, inventory, analytics).

## 2. Main Layout Structure
- **App Logo:** Centered at the very top of every page.
- **Navigation Tabs:** Directly below the logo, navigation is presented in a horizontal tab format (e.g., Items, Sales, Reports, etc.).
- **Header:** User/account menu, may be aligned right or integrated with navigation as needed.
- **SystemMessage:** Section for errors, warnings, confirmations, and info, displayed just below the page title and above list/table headings on every page.
- **Sidebar (optional):** For quick navigation or filters (especially useful as the app grows).
- **Main Content Area:** Displays the current page (e.g., Item List, Sales Table, Item Details).
- **Footer:** Copyright, version, support/contact.

## 3. Key Pages & Components
- **Dashboard (optional):** Quick stats, recent activity, shortcuts.
- **Item List:** Table/grid of items, search/filter, add/edit/delete actions.
- **Sales List:** Table of sales, filter by date/item, export options.
- **Item Details:** View/edit item info, images, history.
- **Add/Edit Item Form:** Modal or page for item entry.
- **Reports/Analytics:** Charts, summaries, export tools.
- **SystemMessage:** Section for errors, warnings, confirmations, and info, displayed below the page title and above list/table headings.

## 4. Design System
- **Color Palette:** 2-3 primary colors, 1-2 accent colors, and neutral backgrounds.
- **Typography:** Clear, readable fonts (e.g., Roboto, Open Sans).
- **Spacing & Sizing:** Consistent margins, padding, and button sizes.
- **Reusable Components:** Buttons, tables, modals, forms, alerts.

## 5. Next Steps
- Sketch wireframes for each main page.
- Choose a component library (e.g., Material-UI, Ant Design, Bootstrap) or go custom.
- Prioritize features for MVP (Minimum Viable Product).

## System Messaging
- The `SystemMessage` component is used to display errors, warnings, confirmations, and informational messages to the user.
- It appears just below the page title and above the list/table headings on each page.
- Usage example:
  ```jsx
  <SystemMessage message={message} type="error" onClose={() => setMessage(null)} />
  ```
- Message types: `error`, `warning`, `info`, `success`.
- Integrate this component into any page where user/system feedback is needed.

---
_Last updated: June 25, 2025_

This documentation should be kept up to date as the frontend evolves.
