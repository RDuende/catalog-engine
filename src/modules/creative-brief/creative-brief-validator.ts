import type {
  CreativeAudienceProfile,
  CreativeBriefValidation,
  CreativeBriefValidationIssue,
} from "./creative-brief.types.js";

export interface CreativeBriefValidationInput {
  readonly objective: string;
  readonly audience: readonly CreativeAudienceProfile[];
  readonly occasion?: string;
  readonly emotionalGoals: readonly string[];
  readonly themes: readonly string[];
}

export class CreativeBriefValidator {
  validate(input: CreativeBriefValidationInput): CreativeBriefValidation {
    const issues: CreativeBriefValidationIssue[] = [];

    if (!input.objective.trim()) {
      issues.push({
        code: "OBJECTIVE_REQUIRED",
        field: "objective",
        severity: "ERROR",
        message: "El brief necesita un objetivo creativo.",
      });
    }

    if (input.audience.length === 0) {
      issues.push({
        code: "AUDIENCE_REQUIRED",
        field: "audience",
        severity: "ERROR",
        message: "El brief necesita al menos un destinatario.",
      });
    }

    if (!input.occasion) {
      issues.push({
        code: "OCCASION_RECOMMENDED",
        field: "occasion",
        severity: "WARNING",
        message: "Conocer la ocasión mejorará la dirección creativa.",
      });
    }

    if (input.emotionalGoals.length === 0) {
      issues.push({
        code: "EMOTIONAL_GOAL_REQUIRED",
        field: "emotionalGoals",
        severity: "ERROR",
        message: "El brief necesita al menos un objetivo emocional.",
      });
    }

    if (input.themes.length === 0) {
      issues.push({
        code: "THEME_RECOMMENDED",
        field: "themes",
        severity: "WARNING",
        message: "Un tema creativo concreto ayudará a diferenciar las propuestas.",
      });
    }

    return Object.freeze({
      valid: !issues.some((issue) => issue.severity === "ERROR"),
      issues: Object.freeze(issues),
    });
  }
}
