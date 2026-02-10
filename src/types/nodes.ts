/**
 * Concrete Node Type Implementations
 * Demonstrates: Literal Types, as const, satisfies, Type Inference
 */

import type {
  NodeId,
  InputPort,
  OutputPort,
  TriggerNode,
  ConditionNode,
  TransformNode,
  EffectNode,
  DataNode,
  PortType,
} from "./core";

// Port type helpers with literal inference
const createInputPort = <T = unknown>(
  id: string,
  name: string,
  portType: PortType,
  required = true,
  description?: string,
): InputPort<T> => ({
  id,
  name,
  portType,
  required,
  description,
  direction: "input" as const,
});

const createOutputPort = <T = unknown>(
  id: string,
  name: string,
  portType: PortType,
  description?: string,
): OutputPort<T> => ({
  id,
  name,
  portType,
  required: false,
  description,
  direction: "output" as const,
});

// Node factory functions with type inference

// HTTP Trigger Node
export const createHttpTriggerNode = (
  id: NodeId,
  position: { x: number; y: number },
): TriggerNode => ({
  id,
  type: "trigger.http" as const,
  category: "trigger" as const,
  label: "HTTP Trigger",
  description: "Triggers workflow on HTTP request",
  inputs: [],
  outputs: [
    createOutputPort(
      "request",
      "Request",
      { kind: "object", type: {} },
      "HTTP request object",
    ),
  ],
  position,
  data: {
    method: "GET",
    path: "/webhook",
  },
});

// Timer Trigger Node
export const createTimerTriggerNode = (
  id: NodeId,
  position: { x: number; y: number },
): TriggerNode => ({
  id,
  type: "trigger.timer" as const,
  category: "trigger" as const,
  label: "Timer Trigger",
  description: "Triggers workflow on schedule",
  inputs: [],
  outputs: [
    createOutputPort(
      "timestamp",
      "Timestamp",
      { kind: "number", type: 0 },
      "Current timestamp",
    ),
  ],
  position,
  data: {
    interval: 60000, // 1 minute
    cron: "*/1 * * * *",
  },
});

// Manual Trigger Node
export const createManualTriggerNode = (
  id: NodeId,
  position: { x: number; y: number },
): TriggerNode => ({
  id,
  type: "trigger.manual" as const,
  category: "trigger" as const,
  label: "Manual Trigger",
  description: "Manually trigger workflow",
  inputs: [],
  outputs: [
    createOutputPort(
      "data",
      "Data",
      { kind: "any", type: undefined },
      "Trigger data",
    ),
  ],
  position,
});

// If Condition Node
export const createIfConditionNode = (
  id: NodeId,
  position: { x: number; y: number },
): ConditionNode => ({
  id,
  type: "logic.if" as const,
  category: "logic" as const,
  label: "If Condition",
  description: "Branch based on condition",
  inputs: [
    createInputPort(
      "condition",
      "Condition",
      { kind: "boolean", type: false },
      true,
      "Boolean condition",
    ),
  ],
  outputs: [
    createOutputPort(
      "true",
      "True",
      { kind: "boolean", type: true },
      "True branch",
    ),
    createOutputPort(
      "false",
      "False",
      { kind: "boolean", type: false },
      "False branch",
    ),
  ],
  position,
});

// Switch Condition Node
export const createSwitchConditionNode = (
  id: NodeId,
  position: { x: number; y: number },
): ConditionNode => ({
  id,
  type: "logic.switch" as const,
  category: "logic" as const,
  label: "Switch",
  description: "Multi-way branch",
  inputs: [
    createInputPort(
      "value",
      "Value",
      { kind: "any", type: undefined },
      true,
      "Value to switch on",
    ),
  ],
  outputs: [
    createOutputPort("case1", "Case 1", { kind: "boolean", type: true }),
    createOutputPort("case2", "Case 2", { kind: "boolean", type: true }),
    createOutputPort("default", "Default", { kind: "boolean", type: true }),
  ],
  position,
  data: {
    cases: ["case1", "case2"],
  },
});

// Compare Condition Node
export const createCompareConditionNode = (
  id: NodeId,
  position: { x: number; y: number },
): ConditionNode => ({
  id,
  type: "logic.compare" as const,
  category: "logic" as const,
  label: "Compare",
  description: "Compare two values",
  inputs: [
    createInputPort("a", "Value A", { kind: "any", type: undefined }, true),
    createInputPort("b", "Value B", { kind: "any", type: undefined }, true),
  ],
  outputs: [
    createOutputPort(
      "result",
      "Result",
      { kind: "boolean", type: false },
      "Comparison result",
    ),
  ],
  position,
  data: {
    operator: "===",
  },
});

// Map Transform Node
export const createMapTransformNode = (
  id: NodeId,
  position: { x: number; y: number },
): TransformNode => ({
  id,
  type: "transform.map" as const,
  category: "transform" as const,
  label: "Map",
  description: "Transform data with mapping function",
  inputs: [
    createInputPort(
      "input",
      "Input",
      { kind: "array", type: [] },
      true,
      "Input array",
    ),
  ],
  outputs: [
    createOutputPort(
      "output",
      "Output",
      { kind: "array", type: [] },
      "Transformed array",
    ),
  ],
  position,
  data: {
    mapFunction: "x => x",
  },
});

// Filter Transform Node
export const createFilterTransformNode = (
  id: NodeId,
  position: { x: number; y: number },
): TransformNode => ({
  id,
  type: "transform.filter" as const,
  category: "transform" as const,
  label: "Filter",
  description: "Filter data based on predicate",
  inputs: [
    createInputPort(
      "input",
      "Input",
      { kind: "array", type: [] },
      true,
      "Input array",
    ),
  ],
  outputs: [
    createOutputPort(
      "output",
      "Output",
      { kind: "array", type: [] },
      "Filtered array",
    ),
  ],
  position,
  data: {
    filterFunction: "x => true",
  },
});

// Reduce Transform Node
export const createReduceTransformNode = (
  id: NodeId,
  position: { x: number; y: number },
): TransformNode => ({
  id,
  type: "transform.reduce" as const,
  category: "transform" as const,
  label: "Reduce",
  description: "Reduce array to single value",
  inputs: [
    createInputPort(
      "input",
      "Input",
      { kind: "array", type: [] },
      true,
      "Input array",
    ),
    createInputPort(
      "initial",
      "Initial",
      { kind: "any", type: undefined },
      false,
      "Initial value",
    ),
  ],
  outputs: [
    createOutputPort(
      "output",
      "Output",
      { kind: "any", type: undefined },
      "Reduced value",
    ),
  ],
  position,
  data: {
    reduceFunction: "(acc, x) => acc + x",
  },
});

// HTTP Effect Node
export const createHttpEffectNode = (
  id: NodeId,
  position: { x: number; y: number },
): EffectNode => ({
  id,
  type: "effect.http" as const,
  category: "effect" as const,
  label: "HTTP Request",
  description: "Make HTTP request",
  inputs: [
    createInputPort(
      "url",
      "URL",
      { kind: "string", type: "" },
      true,
      "Request URL",
    ),
    createInputPort(
      "body",
      "Body",
      { kind: "object", type: {} },
      false,
      "Request body",
    ),
  ],
  outputs: [
    createOutputPort(
      "response",
      "Response",
      { kind: "object", type: {} },
      "HTTP response",
    ),
  ],
  position,
  data: {
    method: "GET",
    headers: {},
  },
});

// Email Effect Node
export const createEmailEffectNode = (
  id: NodeId,
  position: { x: number; y: number },
): EffectNode => ({
  id,
  type: "effect.email" as const,
  category: "effect" as const,
  label: "Send Email",
  description: "Send email notification",
  inputs: [
    createInputPort(
      "to",
      "To",
      { kind: "string", type: "" },
      true,
      "Recipient email",
    ),
    createInputPort(
      "subject",
      "Subject",
      { kind: "string", type: "" },
      true,
      "Email subject",
    ),
    createInputPort(
      "body",
      "Body",
      { kind: "string", type: "" },
      true,
      "Email body",
    ),
  ],
  outputs: [
    createOutputPort(
      "result",
      "Result",
      { kind: "object", type: {} },
      "Send result",
    ),
  ],
  position,
});

// Database Effect Node
export const createDbEffectNode = (
  id: NodeId,
  position: { x: number; y: number },
): EffectNode => ({
  id,
  type: "effect.db" as const,
  category: "effect" as const,
  label: "Database Write",
  description: "Write to database",
  inputs: [
    createInputPort(
      "collection",
      "Collection",
      { kind: "string", type: "" },
      true,
      "Collection name",
    ),
    createInputPort(
      "data",
      "Data",
      { kind: "object", type: {} },
      true,
      "Data to write",
    ),
  ],
  outputs: [
    createOutputPort(
      "result",
      "Result",
      { kind: "object", type: {} },
      "Write result",
    ),
  ],
  position,
});

// Constant Data Node
export const createConstantDataNode = (
  id: NodeId,
  position: { x: number; y: number },
  value: unknown,
): DataNode => ({
  id,
  type: "data.constant" as const,
  category: "data" as const,
  label: "Constant",
  description: "Constant value",
  inputs: [],
  outputs: [
    createOutputPort(
      "value",
      "Value",
      { kind: "any", type: undefined },
      "Constant value",
    ),
  ],
  position,
  data: { value },
});

// Variable Data Node
export const createVariableDataNode = (
  id: NodeId,
  position: { x: number; y: number },
  variableName: string,
): DataNode => ({
  id,
  type: "data.variable" as const,
  category: "data" as const,
  label: "Variable",
  description: "Workflow variable",
  inputs: [],
  outputs: [
    createOutputPort(
      "value",
      "Value",
      { kind: "any", type: undefined },
      "Variable value",
    ),
  ],
  position,
  data: { variableName },
});

// Node factory registry with type safety
export const nodeFactories = {
  "trigger.http": createHttpTriggerNode,
  "trigger.timer": createTimerTriggerNode,
  "trigger.manual": createManualTriggerNode,
  "logic.if": createIfConditionNode,
  "logic.switch": createSwitchConditionNode,
  "logic.compare": createCompareConditionNode,
  "transform.map": createMapTransformNode,
  "transform.filter": createFilterTransformNode,
  "transform.reduce": createReduceTransformNode,
  "effect.http": createHttpEffectNode,
  "effect.email": createEmailEffectNode,
  "effect.db": createDbEffectNode,
  "data.constant": createConstantDataNode,
  "data.variable": createVariableDataNode,
} as const satisfies Record<string, (...args: unknown[]) => unknown>;

export type NodeFactoryType = keyof typeof nodeFactories;
