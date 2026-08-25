import { campaignsContract } from "@email-campaign-v2/contracts";
import { initServer } from "@ts-rest/express";

import { GroupNotFoundError } from "../groups/group-errors";
import { CampaignAlreadySentError, CampaignNotFoundError, CampaignValidationError } from "./campaign-errors";
import { campaignService } from "./campaign-service";

const s = initServer();

export const campaignRouter = s.router(campaignsContract, {
  createCampaign: async ({ body }) => {
    const campaign = await campaignService.createCampaign(body);
    return { status: 201, body: campaign };
  },

  listCampaigns: async ({ query }) => {
    const campaigns = await campaignService.listCampaigns(query.search, query.status);
    return { status: 200, body: campaigns };
  },

  updateCampaign: async ({ params, body }) => {
    try {
      const campaign = await campaignService.updateCampaign(params.id, body);
      return { status: 200, body: campaign };
    } catch (error) {
      if (error instanceof CampaignNotFoundError) {
        return { status: 404, body: { message: error.message } };
      }
      if (error instanceof CampaignAlreadySentError) {
        return { status: 409, body: { message: error.message } };
      }
      throw error;
    }
  },

  scheduleCampaign: async ({ params, body }) => {
    try {
      const campaign = await campaignService.scheduleCampaign(params.id, body.scheduledAt);
      return { status: 200, body: campaign };
    } catch (error) {
      if (error instanceof CampaignNotFoundError) {
        return { status: 404, body: { message: error.message } };
      }
      if (error instanceof CampaignAlreadySentError) {
        return { status: 409, body: { message: error.message } };
      }
      if (error instanceof CampaignValidationError) {
        return { status: 400, body: { message: error.message } };
      }
      throw error;
    }
  },

  sendCampaignNow: async ({ params }) => {
    try {
      const campaign = await campaignService.sendCampaignNow(params.id);
      return { status: 200, body: campaign };
    } catch (error) {
      if (error instanceof CampaignNotFoundError || error instanceof GroupNotFoundError) {
        return { status: 404, body: { message: error.message } };
      }
      if (error instanceof CampaignAlreadySentError) {
        return { status: 409, body: { message: error.message } };
      }
      if (error instanceof CampaignValidationError) {
        return { status: 400, body: { message: error.message } };
      }
      throw error;
    }
  },

  deleteCampaign: async ({ params }) => {
    try {
      await campaignService.deleteCampaign(params.id);
      return { status: 204, body: undefined };
    } catch (error) {
      if (error instanceof CampaignNotFoundError) {
        return { status: 404, body: { message: error.message } };
      }
      throw error;
    }
  },
});
