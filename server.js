const express = require("express");
const path = require("path");

const app = express();

const PORT = Number(process.env.PORT || 3000);
const HOST = "0.0.0.0";

app.use(express.static(path.join(__dirname, "public")));

app.get("/api/health", (req, res) => {
  res.json({
    ok: true,
    app: "PrepReady",
    status: "running",
    host: HOST,
    port: PORT
  });
});

app.get("*", (req, res) => {
  res.sendFile(path.join(__dirname, "public", "index.html"));
});

app.listen(PORT, HOST, () => {
  console.log(`PrepReady is running on port ${PORT}`);
  console.log(`Computer access: http://localhost:${PORT}`);
  console.log("Mobile access: use your computer's IPv4 address:");
  console.log(`http://YOUR-PC-IP:${PORT}`);
});