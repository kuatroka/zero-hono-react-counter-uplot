import { Hono } from "hono";
import { setCookie } from "hono/cookie";
import { SignJWT } from "jose";
import counter from "./routes/counter";
import quarters from "./routes/quarters";

export const config = {
  runtime: "edge",
};

export const app = new Hono().basePath("/api");

app.route("/counter", counter);
app.route("/quarters", quarters);

// See seed.sql
// In real life you would of course authenticate the user however you like.
const userIDs = [
  "6z7dkeVLNm",
  "ycD76wW4R2",
  "IoQSaxeVO5",
  "WndZWmGkO4",
  "ENzoNm7g4E",
  "dLKecN3ntd",
  "7VoEoJWEwn",
  "enVvyDlBul",
  "9ogaDuDNFx",
];

function randomInt(max: number) {
  return Math.floor(Math.random() * max);
}

app.get("/login", async (c) => {
  const jwtPayload = {
    sub: userIDs[randomInt(userIDs.length)],
    iat: Math.floor(Date.now() / 1000),
  };

  const jwt = await new SignJWT(jwtPayload)
    .setProtectedHeader({ alg: "HS256" })
    .setExpirationTime("30days")
    .sign(new TextEncoder().encode(must(process.env.ZERO_AUTH_SECRET)));

  setCookie(c, "jwt", jwt, {
    expires: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
  });

  return c.text("ok");
});


function must<T>(val: T) {
  if (!val) {
    throw new Error("Expected value to be defined");
  }
  return val;
}
