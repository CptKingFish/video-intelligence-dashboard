import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

/**
 * A compact "fingerprint" of the returned vector embedding: the first N
 * dimensions rendered as a heatmap grid. Positive components lean violet,
 * negative components lean cyan, intensity scales with magnitude.
 */
export function EmbeddingFingerprint({
  embedding,
  dim,
}: {
  embedding: number[];
  dim: number;
}) {
  const cells = embedding.slice(0, 256);

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">Embedding fingerprint</CardTitle>
        <CardDescription>
          First {cells.length} of {dim} dimensions returned by the encoder.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div
          className="grid gap-[3px]"
          style={{ gridTemplateColumns: "repeat(16, minmax(0, 1fr))" }}
        >
          {cells.map((value, index) => {
            const magnitude = Math.min(1, Math.abs(value));
            const hue = value >= 0 ? "285" : "195";
            return (
              <div
                key={index}
                className="aspect-square rounded-[2px]"
                title={`dim ${index}: ${value.toFixed(3)}`}
                style={{
                  backgroundColor: `oklch(0.7 0.2 ${hue} / ${0.12 + magnitude * 0.85})`,
                }}
              />
            );
          })}
        </div>
        <div className="mt-3 flex items-center justify-between text-[10px] text-muted-foreground">
          <span className="flex items-center gap-1">
            <span className="size-2 rounded-full bg-[oklch(0.7_0.2_195)]" />
            negative
          </span>
          <span className="flex items-center gap-1">
            positive
            <span className="size-2 rounded-full bg-[oklch(0.7_0.2_285)]" />
          </span>
        </div>
      </CardContent>
    </Card>
  );
}
