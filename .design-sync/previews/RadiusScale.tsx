import { RadiusScale } from "ask-ah-mah";

// The radius scale — sm, md, lg, xl, all derived from a single `--radius` base
// (0.625rem). Each tile renders the live `var(--radius-*)` corner.
export const Scale = () => <RadiusScale />;
