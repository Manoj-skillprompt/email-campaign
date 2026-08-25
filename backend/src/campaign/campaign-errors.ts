export class CampaignNotFoundError extends Error {
  constructor(id: string) {
    super(`Campaign with id "${id}" was not found.`);
    this.name = "CampaignNotFoundError";
  }
}

export class CampaignAlreadySentError extends Error {
  constructor(id: string) {
    super(`Campaign with id "${id}" has already been sent and can no longer be modified.`);
    this.name = "CampaignAlreadySentError";
  }
}

export class CampaignValidationError extends Error {
  constructor() {
    super("Campaign must have a name, subject, sender, and at least one group before it can be scheduled or sent.");
    this.name = "CampaignValidationError";
  }
}
