import { contactsContract } from "@email-campaign-v2/contracts";
import { initServer } from "@ts-rest/express";

import { ConflictError, NotFoundError } from "./contact-errors";
import { ContactService } from "./contact-service";

const s = initServer();
const contactService = new ContactService();

export const contactRouter = s.router(contactsContract, {
  listContacts: async ({ query }) => {
    const results = await contactService.getContacts(query.search);
    return { status: 200, body: results };
  },

  createContact: async ({ body }) => {
    try {
      const contact = await contactService.createContact(body);
      return { status: 201, body: contact };
    } catch (error) {
      if (error instanceof ConflictError) {
        return { status: 409, body: { message: error.message } };
      }
      throw error;
    }
  },

  updateContact: async ({ params, body }) => {
    try {
      const contact = await contactService.updateContact(params.id, body);
      return { status: 200, body: contact };
    } catch (error) {
      if (error instanceof ConflictError) {
        return { status: 409, body: { message: error.message } };
      }
      if (error instanceof NotFoundError) {
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
      if (error instanceof NotFoundError) {
        return { status: 404, body: { message: error.message } };
      }
      throw error;
    }
  },
});
