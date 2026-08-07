export class JourneyExperienceNotFoundError extends Error {
  constructor(readonly journeyId: string) {
    super(`No existe una experiencia para el Journey ${journeyId}.`);
    this.name = "JourneyExperienceNotFoundError";
  }
}
