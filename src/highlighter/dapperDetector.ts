export function hasSqlHintAbove(documentText: string, pos: number): boolean {
   // Find the line above and check for the marker comment
   const before = documentText.slice(0, pos);
   const lines = before.split(/\r?\n/);
   const prev = lines[lines.length - 1]?.trim();
   return /^\/\/\s*(sql(?:\s+syntax)?)\s*$/i.test(prev || "");
}