/**
 * Bind a raw output schema to a text renderer for a tool's own canonical result.
 *
 * The runtime types `ToolDefinition.output.render` as `(args, value: JsonValue)`
 * because a schema is descriptive, not a generic. The tool body produced this
 * value against its schema, so the single assertion belongs here rather than in
 * every render site.
 */

import type { JsonSchemaNode, ToolDefinition } from "@deepseek-ai/dsh-tools";

export function textOutput<Value>(
  schema: JsonSchemaNode,
  render: (value: Value) => string,
): ToolDefinition["output"] {
  return {
    schema,
    render: (_args, value) => [{ type: "text", text: render(value as unknown as Value) }],
  };
}
