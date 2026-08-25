import { contactsContract } from "@email-campaign-v2/contracts";
import { initServer } from "@ts-rest/express";

import { ContactNotFoundError, DuplicateEmailError } from "./contact-errors";
import { contactService } from "./contact-service";

const s = initServer();

export const contactRouter = s.router(contactsContract, {
  createContact: async ({ body }) => {
    try {
      const contact = await contactService.createContact(body);
      return { status: 201, body: contact };
    } catch (error) {
      if (error instanceof DuplicateEmailError) {
        return { status: 409, body: { message: error.message } };
      }
      throw error;
    }
  },

  listContacts: async ({ query }) => {
    const contacts = await contactService.listContacts(query.search);
    return { status: 200, body: contacts };
  },

  updateContact: async ({ params, body }) => {
    try {
      const contact = await contactService.updateContact(params.id, body);
      return { status: 200, body: contact };
    } catch (error) {
      if (error instanceof DuplicateEmailError) {
        return { status: 409, body: { message: error.message } };
      }
      if (error instanceof ContactNotFoundError) {
        return { status: 404, body: { message: error.message } };
      }
      throw error;
    }
  },

  deleteContact: async ({ params }) => {
    try {
      await contactService.deleteContact(params.id);
      return { status: 204, body: undefined };
    } catch (error) {
      if (error instanceof ContactNotFoundError) {
        return { status: 404, body: { message: error.message } };
      }
      throw error;
    }
  },
});
