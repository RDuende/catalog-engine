export class JourneyDomainError extends Error {
  constructor(
    readonly code: string,
    message: string,
  ) {
    super(message);
    this.name = "JourneyDomainError";
  }
}

export class JourneyInvariantError extends JourneyDomainError {
  constructor(message: string) {
    super("JOURNEY_INVARIANT_VIOLATION", message);
    this.name = "JourneyInvariantError";
  }
}

export class JourneyNotFoundError extends JourneyDomainError {
  constructor(entity: string, id: string) {
    super("JOURNEY_ENTITY_NOT_FOUND", `No existe ${entity} con id ${id}.`);
    this.name = "JourneyNotFoundError";
  }
}
