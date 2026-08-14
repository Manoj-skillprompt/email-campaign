import { contactsContract } from "@email-campaign-v2/contracts";
import { createExpressEndpoints } from "@ts-rest/express";
import express from "express";

import { contactRouter } from "./contacts/contact-router";

const app = express();
app.use(express.json());

createExpressEndpoints(contactsContract, contactRouter, app);

const PORT = process.env.PORT ? Number(process.env.PORT) : 4000;

app.listen(PORT, () => {
  console.log(`Backend listening on port ${PORT}`);
});
