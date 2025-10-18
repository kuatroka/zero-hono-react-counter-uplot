# Phase 1: Router Migration - Implementation Guide

## Overview

Migrate from TanStack Router to React Router while preserving all existing functionality (counter + 10 charts).

**Duration:** 4-6 hours  
**Risk Level:** Low (isolated change)  
**Prerequisites:** None

## Pre-Migration Checklist

- [ ] Current app works (counter increments/decrements)
- [ ] All 10 charts render correctly
- [ ] No console errors
- [ ] Git working directory is clean
- [ ] On correct branch: `feature/migrate-to-bun-support-in-hono-based-app-20251017-225722`

## Step 1: Backup Current State

```bash
# Create backup branch
git checkout -b backup-tanstack-router-$(date +%Y%m%d)

# Return to feature branch
git checkout feature/migrate-to-bun-support-in-hono-based-app-20251017-225722

# Verify you're on the right branch
git branch --show-current
```

## Step 2: Update Dependencies

### 2.1 Remove TanStack Router

```bash
bun remove @tanstack/react-router @tanstack/router-devtools
```

### 2.2 Add React Router

```bash
bun add react-router-dom
```

### 2.3 Verify package.json

Check that `package.json` now has:
```json
{
  "dependencies": {
    "react-router-dom": "^6.x.x"
  }
}
```

And does NOT have:
```json
{
  "dependencies": {
    "@tanstack/react-router": "...",
    "@tanstack/router-devtools": "..."
  }
}
```

## Step 3: Refactor main.tsx

### 3.1 Current Code (TanStack Router)

```typescript
// src/main.tsx (BEFORE)
import {
  createRouter,
  createRoute,
  createRootRoute,
  RouterProvider,
  Outlet,
} from "@tanstack/react-router";
import { TanStackRouterDevtools } from "@tanstack/router-devtools";

const rootRoute = createRootRoute({
  component: () => (
    <>
      <Outlet />
      <TanStackRouterDevtools />
    </>
  ),
});

const indexRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/",
  component: IndexComponent,
});

const counterRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/counter",
  component: CounterPage,
});

const routeTree = rootRoute.addChildren([indexRoute, counterRoute]);
const router = createRouter({ routeTree });

declare module "@tanstack/react-router" {
  interface Register {
    router: typeof router;
  }
}

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <ZeroProvider {...{ userID, auth, server, schema }}>
      <RouterProvider router={router} />
    </ZeroProvider>
  </StrictMode>
);
```

### 3.2 New Code (React Router)

Replace the entire routing section with:

```typescript
// src/main.tsx (AFTER)
import { BrowserRouter, Routes, Route } from "react-router-dom";

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <ZeroProvider {...{ userID, auth, server, schema }}>
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<IndexComponent />} />
          <Route path="/counter" element={<CounterPage />} />
        </Routes>
      </BrowserRouter>
    </ZeroProvider>
  </StrictMode>
);
```

### 3.3 Complete Updated main.tsx

```typescript
import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import "./index.css";
import "uplot/dist/uPlot.min.css";
import { ZeroProvider } from "@rocicorp/zero/react";
import { schema } from "./schema.ts";
import Cookies from "js-cookie";
import { decodeJwt } from "jose";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { escapeLike } from "@rocicorp/zero";
import { useQuery, useZero } from "@rocicorp/zero/react";
import { useState } from "react";
import { formatDate } from "./date";
import { randInt } from "./rand";
import { RepeatButton } from "./repeat-button";
import { Schema } from "./schema";
import { randomMessage } from "./test-data";
import { CounterPage } from "./components/CounterPage";

const encodedJWT = Cookies.get("jwt");
const decodedJWT = encodedJWT && decodeJwt(encodedJWT);
const userID = decodedJWT?.sub ? (decodedJWT.sub as string) : "anon";
const server = import.meta.env.VITE_PUBLIC_SERVER;
const auth = encodedJWT;

function IndexComponent() {
  const z = useZero<Schema>();
  const [users] = useQuery(z.query.user);
  const [mediums] = useQuery(z.query.medium);

  const [filterUser, setFilterUser] = useState("");
  const [filterText, setFilterText] = useState("");

  const all = z.query.message;
  const [allMessages] = useQuery(all);

  let filtered = all
    .related("medium")
    .related("sender")
    .orderBy("timestamp", "desc");

  if (filterUser) {
    filtered = filtered.where("senderID", filterUser);
  }

  if (filterText) {
    filtered = filtered.where("body", "LIKE", `%${escapeLike(filterText)}%`);
  }

  const [filteredMessages] = useQuery(filtered);

  const hasFilters = filterUser || filterText;

  if (!users.length || !mediums.length) {
    return null;
  }

  const viewer = users.find((user) => user.id === z.userID);

  return (
    <>
      <div className="controls">
        <div>
          <RepeatButton
            onTrigger={() => {
              z.mutate.message.insert(randomMessage(users, mediums));
            }}
          >
            Add Messages
          </RepeatButton>
          <RepeatButton
            onTrigger={(e) => {
              if (!viewer && !e.shiftKey) {
                alert(
                  "You must be logged in to delete. Hold shift to try anyway."
                );
                return false;
              }
              if (allMessages.length === 0) {
                return false;
              }

              const index = randInt(allMessages.length);
              z.mutate.message.delete({ id: allMessages[index].id });
              return true;
            }}
          >
            Remove Messages
          </RepeatButton>
          <em>(hold down buttons to repeat)</em>
        </div>
        <div
          style={{
            justifyContent: "end",
          }}
        >
          {viewer && `Logged in as ${viewer.name}`}
          {viewer ? (
            <button
              onMouseDown={() => {
                Cookies.remove("jwt");
                location.reload();
              }}
            >
              Logout
            </button>
          ) : (
            <button
              onMouseDown={() => {
                fetch("/api/login")
                  .then(() => {
                    location.reload();
                  })
                  .catch((error) => {
                    alert(`Failed to login: ${error.message}`);
                  });
              }}
            >
              Login
            </button>
          )}
        </div>
      </div>
      <div className="controls">
        <div>
          <a href="/counter" className="nav-link">
            View Counter & Charts →
          </a>
        </div>
      </div>
      <div className="controls">
        <div>
          From:
          <select
            onChange={(e) => setFilterUser(e.target.value)}
            style={{ flex: 1 }}
          >
            <option key={""} value="">
              Sender
            </option>
            {users.map((user) => (
              <option key={user.id} value={user.id}>
                {user.name}
              </option>
            ))}
          </select>
        </div>
        <div>
          Contains:
          <input
            type="text"
            placeholder="message"
            onChange={(e) => setFilterText(e.target.value)}
            style={{ flex: 1 }}
          />
        </div>
      </div>
      <div className="controls">
        <em>
          {!hasFilters ? (
            <>Showing all {filteredMessages.length} messages</>
          ) : (
            <>
              Showing {filteredMessages.length} of {allMessages.length}{" "}
              messages. Try opening{" "}
              <a href="/" target="_blank">
                another tab
              </a>{" "}
              to see them all!
            </>
          )}
        </em>
      </div>
      {filteredMessages.length === 0 ? (
        <h3>
          <em>No posts found 😢</em>
        </h3>
      ) : (
        <table border={1} cellSpacing={0} cellPadding={6} width="100%">
          <thead>
            <tr>
              <th>Sender</th>
              <th>Medium</th>
              <th>Message</th>
              <th>Labels</th>
              <th>Sent</th>
              <th>Edit</th>
            </tr>
          </thead>
          <tbody>
            {filteredMessages.map((message) => (
              <tr key={message.id}>
                <td align="left">{message.sender?.name}</td>
                <td align="left">{message.medium?.name}</td>
                <td align="left">{message.body}</td>
                <td align="left">{message.labels.join(", ")}</td>
                <td align="right">{formatDate(message.timestamp)}</td>
                <td
                  onMouseDown={(e) => {
                    if (message.senderID !== z.userID && !e.shiftKey) {
                      alert(
                        "You aren't logged in as the sender of this message. Editing won't be permitted. Hold the shift key to try anyway."
                      );
                      return;
                    }

                    const body = prompt("Edit message", message.body);
                    if (body === null) {
                      return;
                    }
                    z.mutate.message.update({
                      id: message.id,
                      body,
                    });
                  }}
                >
                  ✏️
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </>
  );
}

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <ZeroProvider {...{ userID, auth, server, schema }}>
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<IndexComponent />} />
          <Route path="/counter" element={<CounterPage />} />
        </Routes>
      </BrowserRouter>
    </ZeroProvider>
  </StrictMode>
);
```

## Step 4: Update CounterPage.tsx (No Changes Needed!)

The `CounterPage.tsx` component uses plain `<a>` tags for navigation, so no changes are needed:

```typescript
// src/components/CounterPage.tsx
// This line already works with React Router:
<a href="/" className="back-link">
  ← Back to Home
</a>
```

**Note:** We're keeping `<a>` tags for now. In Phase 2, we'll convert these to React Router's `<Link>` components for SPA navigation.

## Step 5: Test the Migration

### 5.1 Start Development Server

```bash
# Terminal 1: Start database (if not running)
bun run dev:db-up

# Terminal 2: Start all services
bun run dev
```

### 5.2 Manual Testing Checklist

Open browser to `http://localhost:5173`

#### Home Page Tests
- [ ] Page loads without errors
- [ ] Messages table displays
- [ ] "Add Messages" button works
- [ ] "Remove Messages" button works
- [ ] Filter by sender works
- [ ] Filter by text works
- [ ] Login/Logout works
- [ ] "View Counter & Charts →" link is visible

#### Navigation Test
- [ ] Click "View Counter & Charts →" link
- [ ] Page navigates to `/counter`
- [ ] URL changes to `http://localhost:5173/counter`

#### Counter Page Tests
- [ ] Counter displays current value
- [ ] Click "+" button → counter increments
- [ ] Click "+" button 5 more times → counter shows correct value
- [ ] Click "−" button → counter decrements
- [ ] Click "−" button 3 more times → counter shows correct value
- [ ] All 10 charts render (no blank spaces)
- [ ] Charts display data correctly
- [ ] "← Back to Home" link is visible

#### Back Navigation Test
- [ ] Click "← Back to Home" link
- [ ] Page navigates to `/`
- [ ] URL changes to `http://localhost:5173/`
- [ ] Messages table displays again

#### Browser Navigation Test
- [ ] Click browser back button → goes to `/counter`
- [ ] Click browser forward button → goes to `/`
- [ ] Direct URL navigation: type `/counter` in address bar → loads counter page
- [ ] Direct URL navigation: type `/` in address bar → loads home page

#### Console Tests
- [ ] Open browser DevTools (F12)
- [ ] Check Console tab → no errors
- [ ] Check Network tab → API calls succeed
- [ ] Check Application tab → IndexedDB has data

### 5.3 Bundle Size Check

```bash
# Build production bundle
bun run build

# Check bundle size
ls -lh dist/assets/*.js
```

**Expected:** Main bundle should be ~20KB smaller than before.

## Step 6: Commit Changes

```bash
# Check what changed
git status

# Review changes
git diff

# Stage changes
git add src/main.tsx package.json bun.lock

# Commit
git commit -m "feat: migrate from TanStack Router to React Router

- Remove @tanstack/react-router and @tanstack/router-devtools
- Add react-router-dom
- Refactor main.tsx to use React Router
- Preserve all existing functionality (counter + charts)
- Reduce bundle size by ~20KB"

# Push to remote
git push origin feature/migrate-to-bun-support-in-hono-based-app-20251017-225722
```

## Troubleshooting

### Issue: "Cannot find module 'react-router-dom'"

**Solution:**
```bash
# Reinstall dependencies
rm -rf node_modules
bun install
```

### Issue: "Outlet is not defined"

**Solution:** You forgot to remove the `Outlet` import. Remove this line:
```typescript
import { Outlet } from "@tanstack/react-router"; // DELETE THIS
```

### Issue: Counter doesn't work

**Solution:** 
1. Check that API server is running (`bun run dev:api`)
2. Check browser console for errors
3. Check Network tab for failed API calls
4. Verify database is running (`bun run dev:db-up`)

### Issue: Charts don't render

**Solution:**
1. Check that `uplot/dist/uPlot.min.css` is imported in `main.tsx`
2. Check browser console for errors
3. Verify `/api/quarters` endpoint returns data

### Issue: Navigation doesn't work

**Solution:**
1. Verify `BrowserRouter` wraps the `Routes` component
2. Check that routes are defined correctly
3. Check browser console for errors

### Issue: Page refreshes on navigation (not SPA behavior)

**Solution:** This is expected! We're using `<a>` tags which cause full page reloads. In Phase 2, we'll convert to `<Link>` components for SPA navigation. For now, this is acceptable.

## Rollback Plan

If something goes wrong and you need to rollback:

```bash
# Switch to backup branch
git checkout backup-tanstack-router-YYYYMMDD

# Or reset to previous commit
git checkout feature/migrate-to-bun-support-in-hono-based-app-20251017-225722
git reset --hard HEAD~1

# Reinstall dependencies
bun install
```

## Success Criteria

✅ **Phase 1 is complete when:**

- [ ] All manual tests pass
- [ ] No console errors
- [ ] Counter increments/decrements correctly
- [ ] All 10 charts render
- [ ] Navigation works (home ↔ counter)
- [ ] Bundle size reduced
- [ ] Changes committed and pushed
- [ ] You feel confident the app works correctly

## Next Steps

Once Phase 1 is complete and verified:

1. **Take a break!** ☕
2. **Review Phase 2 plan:** [phase-2-investors-assets.md](./phase-2-investors-assets.md)
3. **Prepare for Phase 2:**
   - Read through Phase 2 requirements
   - Understand the data model
   - Review Zero-sync query patterns

---

**Questions or issues?** Document them and we'll address them before starting Phase 2.

**Ready to proceed?** Move on to [phase-2-investors-assets.md](./phase-2-investors-assets.md) when Phase 1 is verified working.
