import { campaignsContract } from "@email-campaign-v2/contracts";
import { initServer } from "@ts-rest/express";

import { ConflictError, NotFoundError, ValidationError } from "./campaign-errors";
import { CampaignService } from "./campaign-service";

const s = initServer();
const campaignService = new CampaignService();

export const campaignRouter = s.router(campaignsContract, {
  getCampaigns: async ({ query }) => {
    const results = await campaignService.getCampaigns(query.status, query.search);
    return { status: 200, body: results };
  },

  createCampaign: async ({ body }) => {
    try {
      const campaign = await campaignService.createCampaign(body);
      return { status: 201, body: campaign };
    } catch (error) {
      if (error instanceof ValidationError) {
        return { status: 400, body: { message: error.message } };
      }
      throw error;
    }
  },

  getCampaignById: async ({ params }) => {
    try {
      const campaign = await campaignService.getCampaignById(params.id);
      return { status: 200, body: campaign };
    } catch (error) {
      if (error instanceof NotFoundError) {
        return { status: 404, body: { message: error.message } };
      }
      throw error;
    }
  },

  updateCampaign: async ({ params, body }) => {
    try {
      const campaign = await campaignService.updateCampaign(params.id, body);
      return { status: 200, body: campaign };
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

  scheduleCampaign: async ({ params, body }) => {
    try {
      const campaign = await campaignService.scheduleCampaign(params.id, body);
      return { status: 200, body: campaign };
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

  sendNow: async ({ params }) => {
    try {
      const campaign = await campaignService.sendNow(params.id);
      return { status: 200, body: campaign };
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

  duplicateCampaign: async ({ params }) => {
    try {
      const campaign = await campaignService.duplicateCampaign(params.id);
      return { status: 201, body: campaign };
    } catch (error) {
      if (error instanceof NotFoundError) {
        return { status: 404, body: { message: error.message } };
      }
      throw error;
    }
  },
});
