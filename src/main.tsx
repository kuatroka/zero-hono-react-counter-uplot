import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import "./index.css";
import "uplot/dist/uPlot.min.css";
import { ZeroProvider } from "@rocicorp/zero/react";
import { schema } from "./schema.ts";
import Cookies from "js-cookie";
import { decodeJwt } from "jose";
import { BrowserRouter, Routes, Route, Link } from "react-router-dom";
import { escapeLike } from "@rocicorp/zero";
import { useQuery, useZero } from "@rocicorp/zero/react";
import { useState } from "react";
import { formatDate } from "./date";
import { randInt } from "./rand";
import { RepeatButton } from "./repeat-button";
import { Schema } from "./schema";
import { randomMessage } from "./test-data";
import { CounterPage } from "./components/CounterPage";
import { ThemeSwitcher } from "./components/ThemeSwitcher";
import { GlobalNav } from "./components/GlobalNav";
import { EntitiesList } from "./pages/EntitiesList";
import { EntityDetail } from "./pages/EntityDetail";
import { UserProfile } from "./pages/UserProfile";
import { initZero } from "./zero-client";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";

const encodedJWT = Cookies.get("jwt");
const decodedJWT = encodedJWT && decodeJwt(encodedJWT);
const userID = decodedJWT?.sub ? (decodedJWT.sub as string) : "anon";
const server = import.meta.env.VITE_PUBLIC_SERVER;
const auth = encodedJWT;

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 30000,
      refetchOnWindowFocus: false,
    },
  },
});

function AppContent() {
  const z = useZero<Schema>();
  initZero(z);
  
  return (
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        <GlobalNav />
        <Routes>
          <Route path="/" element={<HomePage />} />
          <Route path="/counter" element={<CounterPage />} />
          <Route path="/entities" element={<EntitiesList />} />
          <Route path="/investors" element={<EntitiesList initialCategory="investor" />} />
          <Route path="/assets" element={<EntitiesList initialCategory="asset" />} />
          <Route path="/entities/:id" element={<EntityDetail />} />
          <Route path="/profile" element={<UserProfile />} />
        </Routes>
      </BrowserRouter>
    </QueryClientProvider>
  );
}

function HomePage() {
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
    <div className="min-h-screen bg-base-200">
      <div className="container mx-auto px-4 py-8 max-w-7xl">
        <div className="flex flex-col gap-6">
          <header className="flex justify-between items-center flex-wrap gap-4">
            <h1 className="text-3xl font-bold">Messages</h1>
            <div className="flex items-center gap-4">
              <ThemeSwitcher />
              {viewer && <span className="text-sm">Logged in as <strong>{viewer.name}</strong></span>}
              {viewer ? (
                <button
                  className="btn btn-sm btn-outline"
                  onMouseDown={() => {
                    Cookies.remove("jwt");
                    location.reload();
                  }}
                >
                  Logout
                </button>
              ) : (
                <button
                  className="btn btn-sm btn-primary"
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
          </header>

          <div className="flex flex-wrap gap-4 items-center">
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
            <span className="text-sm italic opacity-70">(hold down buttons to repeat)</span>
          </div>

          <div className="flex justify-center">
            <Link to="/counter" className="btn btn-primary">
              View Counter & Charts →
            </Link>
          </div>

          <div className="card bg-base-100 shadow-lg">
            <div className="card-body">
              <h2 className="card-title">Filters</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="form-control">
                  <label className="label">
                    <span className="label-text">From:</span>
                  </label>
                  <select
                    className="select select-bordered w-full"
                    onChange={(e) => setFilterUser(e.target.value)}
                  >
                    <option value="">All Senders</option>
                    {users.map((user) => (
                      <option key={user.id} value={user.id}>
                        {user.name}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="form-control">
                  <label className="label">
                    <span className="label-text">Contains:</span>
                  </label>
                  <input
                    type="text"
                    placeholder="Search message text..."
                    className="input input-bordered w-full"
                    onChange={(e) => setFilterText(e.target.value)}
                  />
                </div>
              </div>
              <div className="text-sm italic opacity-70 mt-2">
                {!hasFilters ? (
                  <>Showing all {filteredMessages.length} messages</>
                ) : (
                  <>
                    Showing {filteredMessages.length} of {allMessages.length}{" "}
                    messages. Try opening{" "}
                    <a href="/" target="_blank" className="link link-primary">
                      another tab
                    </a>{" "}
                    to see them all!
                  </>
                )}
              </div>
            </div>
          </div>

          {filteredMessages.length === 0 ? (
            <div className="text-center py-12">
              <h3 className="text-2xl italic opacity-70">No posts found 😢</h3>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="table table-zebra">
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
                      <td>{message.sender?.name}</td>
                      <td>{message.medium?.name}</td>
                      <td>{message.body}</td>
                      <td>{message.labels.join(", ")}</td>
                      <td>{formatDate(message.timestamp)}</td>
                      <td
                        className="cursor-pointer hover:text-primary"
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
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <ZeroProvider {...{ userID, auth, server, schema }}>
      <AppContent />
    </ZeroProvider>
  </StrictMode>
);
