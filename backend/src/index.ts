import { campaignsContract, contactsContract, groupsContract } from "@email-campaign-v2/contracts";
import { createExpressEndpoints } from "@ts-rest/express";
import express from "express";
import path from "node:path";

import { campaignRouter } from "./campaign/campaign-router";
import { contactRouter } from "./contacts/contact-router";
import { groupRouter } from "./groups/group-router";

if (typeof process.loadEnvFile === "function") {
  const possibleEnvPaths = [
    path.resolve(process.cwd(), ".env"),
    path.resolve(__dirname, "../.env"),
    path.resolve(__dirname, "../../.env"),
  ];
  for (const envPath of possibleEnvPaths) {
    try {
      process.loadEnvFile(envPath);
      break;
    } catch {
      // try next path
    }
  }
}

const FRONTEND_ORIGIN = process.env.FRONTEND_ORIGIN ?? "http://localhost:3000";

const app = express();
app.use(express.json());

app.use((req, res, next) => {
  res.setHeader("Access-Control-Allow-Origin", FRONTEND_ORIGIN);
  res.setHeader("Access-Control-Allow-Methods", "GET, POST, PATCH, DELETE, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");
  if (req.method === "OPTIONS") {
    res.sendStatus(204);
    return;
  }
  next();
});

app.get("/health", (req, res) => {
  res.json({ status: "ok" });
});

createExpressEndpoints(contactsContract, contactRouter, app);
createExpressEndpoints(groupsContract, groupRouter, app);
createExpressEndpoints(campaignsContract, campaignRouter, app);

const PORT = process.env.PORT ? Number(process.env.PORT) : 4000;

app.listen(PORT, () => {
  console.log(`Backend listening on port ${PORT}`);
});
