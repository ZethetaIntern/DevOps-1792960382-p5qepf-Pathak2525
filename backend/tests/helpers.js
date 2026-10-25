import http from "node:http";
import app from "../src/app.js";

export function startServer() {
  return new Promise((resolve) => {
    const server = http.createServer(app).listen(0, () => resolve({ server, base: `http://127.0.0.1:${server.address().port}` }));
  });
}
