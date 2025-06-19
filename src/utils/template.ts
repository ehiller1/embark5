
// src/utils/template.ts

export function fillTemplate(
  template: string,
  vars: Record<string, string>
): string {
  return template.replace(
    /\$\(\s*(\w+)\s*\)|\{\{\s*(\w+)\s*\}\}|\$\{\s*(\w+)\s*\}/g,
    (_, d1, d2, d3) => {
      // one of d1, d2, or d3 will be defined
      const key = d1 ?? d2 ?? d3 ?? '';
      return vars[key] ?? `$( ${key} )`;
    }
  );
}
