import { Eyebrow } from "ask-ah-mah";

export const Default = () => <Eyebrow>What to gather</Eyebrow>;

export const Method = () => <Eyebrow>Method</Eyebrow>;

export const Muted = () => (
  <Eyebrow className="text-muted-foreground">Ah Mah’s notes</Eyebrow>
);

export const AsBlock = () => (
  <Eyebrow className="block">Before you start</Eyebrow>
);
