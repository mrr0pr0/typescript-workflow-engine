/**
 * Runtime Validation with Zod
 * Demonstrates: Schema → Runtime → Type Inference, Bridging Static and Runtime Types
 */

import { z } from 'zod';
import type { WorkflowNode, NodeCategory, PortType } from '../types/core';

// Port type schema
const portTypeSchema = z.discriminatedUnion('kind', [
  z.object({ kind: z.literal('any'), type: z.unknown() }),
  z.object({ kind: z.literal('string'), type: z.string() }),
  z.object({ kind: z.literal('number'), type: z.number() }),
  z.object({ kind: z.literal('boolean'), type: z.boolean() }),
  z.object({ kind: z.literal('object'), type: z.record(z.unknown()) }),
  z.object({ kind: z.literal('array'), type: z.array(z.unknown()) }),
  z.object({ kind: z.literal('void'), type: z.void() }),
  z.object({ kind: z.literal('custom'), type: z.unknown(), typeName: z.string() })
]);

// Port schema
const portSchema = z.object({
  id: z.string(),
  name: z.string(),
  portType: portTypeSchema,
  required: z.boolean(),
  description: z.string().optional(),
  direction: z.enum(['input', 'output'])
});

// Base node schema
const baseNodeSchema = z.object({
  id: z.string(),
  type: z.string(),
  category: z.enum(['trigger', 'logic', 'transform', 'effect', 'data']),
  label: z.string(),
  description: z.string().optional(),
  inputs: z.array(portSchema),
  outputs: z.array(portSchema),
  position: z.object({
    x: z.number(),
    y: z.number()
  }),
  data: z.record(z.unknown()).optional()
});

// Trigger node schema
const triggerNodeSchema = baseNodeSchema.extend({
  type: z.enum(['trigger.http', 'trigger.timer', 'trigger.manual']),
  category: z.literal('trigger')
});

// Condition node schema
const conditionNodeSchema = baseNodeSchema.extend({
  type: z.enum(['logic.if', 'logic.switch', 'logic.compare']),
  category: z.literal('logic')
});

// Transform node schema
const transformNodeSchema = baseNodeSchema.extend({
  type: z.enum(['transform.map', 'transform.filter', 'transform.reduce']),
  category: z.literal('transform')
});

// Effect node schema
const effectNodeSchema = baseNodeSchema.extend({
  type: z.enum(['effect.http', 'effect.email', 'effect.db']),
  category: z.literal('effect')
});

// Data node schema
const dataNodeSchema = baseNodeSchema.extend({
  type: z.enum(['data.constant', 'data.variable']),
  category: z.literal('data')
});

// Discriminated union for all node types
export const workflowNodeSchema = z.discriminatedUnion('category', [
  triggerNodeSchema,
  conditionNodeSchema,
  transformNodeSchema,
  effectNodeSchema,
  dataNodeSchema
]);

// Infer TypeScript type from schema
export type InferredWorkflowNode = z.infer<typeof workflowNodeSchema>;

// Validation function with type narrowing
export const validateNode = (data: unknown): data is WorkflowNode => {
  return workflowNodeSchema.safeParse(data).success;
};

// Parse and validate with detailed errors
export const parseNode = (data: unknown) => {
  return workflowNodeSchema.safeParse(data);
};

// Type guard factory
export const createNodeTypeGuard = <T extends WorkflowNode['type']>(
  nodeType: T
) => {
  return (node: WorkflowNode): node is Extract<WorkflowNode, { type: T }> => {
    return node.type === nodeType;
  };
};

// Runtime type checking with compile-time inference
export const assertNodeType = <T extends WorkflowNode>(
  node: unknown,
  schema: z.ZodType<T>
): T => {
  return schema.parse(node);
};

// Schema registry for dynamic validation
export const nodeSchemaRegistry = {
  'trigger.http': triggerNodeSchema,
  'trigger.timer': triggerNodeSchema,
  'trigger.manual': triggerNodeSchema,
  'logic.if': conditionNodeSchema,
  'logic.switch': conditionNodeSchema,
  'logic.compare': conditionNodeSchema,
  'transform.map': transformNodeSchema,
  'transform.filter': transformNodeSchema,
  'transform.reduce': transformNodeSchema,
  'effect.http': effectNodeSchema,
  'effect.email': effectNodeSchema,
  'effect.db': effectNodeSchema,
  'data.constant': dataNodeSchema,
  'data.variable': dataNodeSchema
} as const;

// Type-safe schema lookup
export type NodeSchemaType = keyof typeof nodeSchemaRegistry;

export const getNodeSchema = <T extends NodeSchemaType>(
  nodeType: T
): typeof nodeSchemaRegistry[T] => {
  return nodeSchemaRegistry[nodeType];
};