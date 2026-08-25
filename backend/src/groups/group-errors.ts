export class DuplicateGroupNameError extends Error {
  constructor(name: string) {
    super(`A group with name "${name}" already exists.`);
    this.name = "DuplicateGroupNameError";
  }
}

export class GroupNotFoundError extends Error {
  constructor(id: string) {
    super(`Group with id "${id}" was not found.`);
    this.name = "GroupNotFoundError";
  }
}
