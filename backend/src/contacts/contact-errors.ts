export class DuplicateEmailError extends Error {
  constructor(email: string) {
    super(`A contact with email "${email}" already exists.`);
    this.name = "DuplicateEmailError";
  }
}

export class ContactNotFoundError extends Error {
  constructor(id: string) {
    super(`Contact with id "${id}" was not found.`);
    this.name = "ContactNotFoundError";
  }
}
