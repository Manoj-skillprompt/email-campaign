import { groupsContract } from "@email-campaign-v2/contracts";
import { initServer } from "@ts-rest/express";

import { ContactNotFoundError } from "../contacts/contact-errors";
import { DuplicateGroupNameError, GroupNotFoundError } from "./group-errors";
import { groupService } from "./group-service";

const s = initServer();

export const groupRouter = s.router(groupsContract, {
  createGroup: async ({ body }) => {
    try {
      const group = await groupService.createGroup(body);
      return { status: 201, body: group };
    } catch (error) {
      if (error instanceof DuplicateGroupNameError) {
        return { status: 409, body: { message: error.message } };
      }
      throw error;
    }
  },

  listGroups: async ({ query }) => {
    const groups = await groupService.listGroups(query.search);
    return { status: 200, body: groups };
  },

  updateGroup: async ({ params, body }) => {
    try {
      const group = await groupService.updateGroup(params.id, body);
      return { status: 200, body: group };
    } catch (error) {
      if (error instanceof DuplicateGroupNameError) {
        return { status: 409, body: { message: error.message } };
      }
      if (error instanceof GroupNotFoundError) {
        return { status: 404, body: { message: error.message } };
      }
      throw error;
    }
  },

  deleteGroup: async ({ params }) => {
    try {
      await groupService.deleteGroup(params.id);
      return { status: 204, body: undefined };
    } catch (error) {
      if (error instanceof GroupNotFoundError) {
        return { status: 404, body: { message: error.message } };
      }
      throw error;
    }
  },

  assignContact: async ({ params, body }) => {
    try {
      const group = await groupService.assignContactToGroup(params.id, body.contactId);
      return { status: 200, body: group };
    } catch (error) {
      if (error instanceof GroupNotFoundError || error instanceof ContactNotFoundError) {
        return { status: 404, body: { message: error.message } };
      }
      throw error;
    }
  },

  unassignContact: async ({ params }) => {
    try {
      const group = await groupService.unassignContactFromGroup(params.id, params.contactId);
      return { status: 200, body: group };
    } catch (error) {
      if (error instanceof GroupNotFoundError) {
        return { status: 404, body: { message: error.message } };
      }
      throw error;
    }
  },
});
