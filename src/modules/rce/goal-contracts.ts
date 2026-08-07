export type RceGoalStatus = "PENDING" | "SATISFIED" | "OPTIONAL";

export interface RceInformationGoal {
  readonly id: string;
  readonly factKey: string;
  readonly label: string;
  readonly status: RceGoalStatus;
  readonly required: boolean;
  readonly priority: number;
  readonly valueScore: number;
  readonly reason: string;
  readonly question: string;
}

export interface RceGoalPlan {
  readonly goals: readonly RceInformationGoal[];
  readonly nextGoal?: RceInformationGoal;
  readonly readyForProposals: boolean;
  readonly score: number;
  readonly missingRequired: readonly string[];
  readonly generatedAt: string;
}
