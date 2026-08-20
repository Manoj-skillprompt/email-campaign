import { campaignsContract, contactsContract, groupsContract } from "@email-campaign-v2/contracts";
import { createExpressEndpoints } from "@ts-rest/express";
import express from "express";

if (typeof process.loadEnvFile === "function") {
  try {
    process.loadEnvFile();
  } catch {
    // .env file is optional
  }
}

import { campaignRouter } from "./campaigns/campaign-router";
import { CampaignScheduler } from "./campaigns/campaign-scheduler";
import { contactRouter } from "./contacts/contact-router";
import { groupRouter } from "./groups/group-router";

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

createExpressEndpoints(contactsContract, contactRouter, app);
createExpressEndpoints(groupsContract, groupRouter, app);
createExpressEndpoints(campaignsContract, campaignRouter, app);

const PORT = process.env.PORT ? Number(process.env.PORT) : 4000;

app.listen(PORT, () => {
  console.log(`Backend listening on port ${PORT}`);
});

const campaignScheduler = new CampaignScheduler();
campaignScheduler.start();
