import type {
  InterestCluster,
  InterestSignal,
} from "./interest-brain.types.js";

export function clusterInterestSignals(
  signals:
    readonly InterestSignal[],
): readonly InterestCluster[] {
  const groups =
    new Map<
      string,
      InterestSignal[]
    >();

  for (const signal of signals) {
    const key =
      signal.parent ??
      signal.canonical;

    const current =
      groups.get(key) ??
      [];

    current.push(signal);
    groups.set(
      key,
      current,
    );
  }

  return Object.freeze(
    [...groups.entries()]
      .map(
        ([key, members]) => {
          const score =
            members.reduce<number>(
              (sum, member) =>
                sum +
                member.weight *
                member.confidence,
              0,
            );

          const confidence =
            members.reduce<number>(
              (sum, member) =>
                sum +
                member.confidence,
              0,
            ) /
            Math.max(
              1,
              members.length,
            );

          return Object.freeze({
            key,
            score,
            confidence,
            members:
              Object.freeze(
                members,
              ),
          });
        },
      )
      .sort(
        (left, right) =>
          right.score -
          left.score,
      ),
  );
}
