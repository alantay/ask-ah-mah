import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardAction,
  CardContent,
  CardFooter,
  Badge,
  Button,
} from "ask-ah-mah";

// A composed card — header (title + description + action), content, footer.
export const Composed = () => (
  <Card className="w-80">
    <CardHeader>
      <CardTitle>Garlic prawn noodles</CardTitle>
      <CardDescription>Ready in 25 minutes · serves 2</CardDescription>
      <CardAction>
        <Badge variant="secondary">Quick</Badge>
      </CardAction>
    </CardHeader>
    <CardContent className="text-sm text-muted-foreground">
      A weeknight stir-fry built from whatever&rsquo;s in the pantry — garlic,
      prawns, and a tangle of egg noodles.
    </CardContent>
    <CardFooter>
      <Button variant="cta">Start cooking</Button>
    </CardFooter>
  </Card>
);
