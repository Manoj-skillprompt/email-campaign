import { groupsContract } from "@email-campaign-v2/contracts";
import { initServer } from "@ts-rest/express";

import { ConflictError, NotFoundError, ValidationError } from "./group-errors";
import { GroupService } from "./group-service";

const s = initServer();
const groupService = new GroupService();

export const groupRouter = s.router(groupsContract, {
  getGroups: async ({ query }) => {
    const results = await groupService.getGroups(query.search);
    return { status: 200, body: results };
  },

  createGroup: async ({ body }) => {
    try {
      const group = await groupService.createGroup(body);
      return { status: 201, body: group };
    } catch (error) {
      if (error instanceof ConflictError) {
        return { status: 409, body: { message: error.message } };
      }
      if (error instanceof ValidationError) {
        return { status: 400, body: { message: error.message } };
      }
      throw error;
    }
  },

  updateGroup: async ({ params, body }) => {
    try {
      const group = await groupService.updateGroup(params.id, body);
      return { status: 200, body: group };
    } catch (error) {
      if (error instanceof ConflictError) {
        return { status: 409, body: { message: error.message } };
      }
      if (error instanceof NotFoundError) {
        return { status: 404, body: { message: error.message } };
      }
      if (error instanceof ValidationError) {
        return { status: 400, body: { message: error.message } };
      }
      throw error;
    }
  },

  deleteGroup: async ({ params }) => {
    try {
      await groupService.deleteGroup(params.id);
      return { status: 204, body: undefined };
    } catch (error) {
      if (error instanceof NotFoundError) {
        return { status: 404, body: { message: error.message } };
      }
      throw error;
    }
  },
});
