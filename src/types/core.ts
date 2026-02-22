/**
 * Core Type System - Foundation for the entire workflow engine
 * Demonstrates: Discriminated Unions, Generics, Branded Types, Readonly
 */

// Branded type for unique identification
export type NodeId = string & { readonly __brand: "NodeId" };
export type EdgeId = string & { readonly __brand: "EdgeId" };
export type WorkflowId = string & { readonly __brand: "WorkflowId" };

// Helper to create branded types
export const createNodeId = (id: string): NodeId => id as NodeId;
export const createEdgeId = (id: string): EdgeId => id as EdgeId;
export const createWorkflowId = (id: string): WorkflowId => id as WorkflowId;

// Base port types for type-safe connections
export type PortType =
  | { kind: "any"; type: unknown }
  | { kind: "string"; type: string }
  | { kind: "number"; type: number }
  | { kind: "boolean"; type: boolean }
  | { kind: "object"; type: Record<string, unknown> }
  | { kind: "array"; type: unknown[] }
  | { kind: "void"; type: undefined }
  | { kind: "custom"; type: unknown; typeName: string };

// Port definition
export interface Port {
  readonly id: string;
  readonly name: string;
  readonly portType: PortType;
  readonly required: boolean;
  readonly description?: string;
}

// Input and Output port types
export type InputPort = Port & { readonly direction: "input" };
export type OutputPort = Port & { readonly direction: "output" };

// Node category for organization
export type NodeCategory =
  | "trigger"
  | "logic"
  | "transform"
  | "effect"
  | "data";

// Base node interface
export interface BaseNode {
  readonly id: NodeId;
  readonly type: string;
  readonly category: NodeCategory;
  readonly label: string;
  readonly description?: string;
  readonly inputs: ReadonlyArray<InputPort>;
  readonly outputs: ReadonlyArray<OutputPort>;
  readonly position: { readonly x: number; readonly y: number };
  readonly data?: Record<string, unknown>;
}

// Discriminated union for concrete node types
export type WorkflowNode =
  | TriggerNode
  | ConditionNode
  | TransformNode
  | EffectNode
  | DataNode;

// Trigger nodes (no inputs, only outputs)
export interface TriggerNode extends BaseNode {
  readonly type: "trigger.http" | "trigger.timer" | "trigger.manual";
  readonly category: "trigger";
}

// Condition nodes (boolean input/output)
export interface ConditionNode extends BaseNode {
  readonly type: "logic.if" | "logic.switch" | "logic.compare";
  readonly category: "logic";
}

// Transform nodes (data in, data out)
export interface TransformNode extends BaseNode {
  readonly type: "transform.map" | "transform.filter" | "transform.reduce";
  readonly category: "transform";
}

// Effect nodes (side effects, may have no output)
export interface EffectNode extends BaseNode {
  readonly type: "effect.http" | "effect.email" | "effect.db";
  readonly category: "effect";
}

// Data nodes (constants, variables)
export interface DataNode extends BaseNode {
  readonly type: "data.constant" | "data.variable";
  readonly category: "data";
}

// Edge connection between nodes
export interface Edge {
  readonly id: EdgeId;
  readonly source: NodeId;
  readonly sourcePort: string;
  readonly target: NodeId;
  readonly targetPort: string;
  readonly valid: boolean;
  readonly errorMessage?: string;
}

// Workflow graph structure
export interface WorkflowGraph {
  readonly id: WorkflowId;
  readonly name: string;
  readonly nodes: ReadonlyArray<WorkflowNode>;
  readonly edges: ReadonlyArray<Edge>;
  readonly metadata?: {
    readonly createdAt: string;
    readonly updatedAt: string;
    readonly version: string;
  };
}

// Validation result types
export type ValidationResult<T> =
  | { readonly valid: true; readonly value: T }
  | { readonly valid: false; readonly errors: ReadonlyArray<ValidationError> };

export interface ValidationError {
  readonly code: string;
  readonly message: string;
  readonly path?: string;
  readonly nodeId?: NodeId;
  readonly edgeId?: EdgeId;
}

// Execution context
export interface ExecutionContext {
  readonly workflowId: WorkflowId;
  readonly variables: ReadonlyMap<string, unknown>;
  readonly timestamp: number;
}

// Execution result
export type ExecutionResult<T = unknown> =
  | {
      readonly success: true;
      readonly output: T;
      readonly logs: ReadonlyArray<string>;
    }
  | {
      readonly success: false;
      readonly error: Error;
      readonly logs: ReadonlyArray<string>;
    };

// Type guards for node types
export const isTriggerNode = (node: WorkflowNode): node is TriggerNode =>
  node.category === "trigger";

export const isConditionNode = (node: WorkflowNode): node is ConditionNode =>
  node.category === "logic";

export const isTransformNode = (node: WorkflowNode): node is TransformNode =>
  node.category === "transform";

export const isEffectNode = (node: WorkflowNode): node is EffectNode =>
  node.category === "effect";

export const isDataNode = (node: WorkflowNode): node is DataNode =>
  node.category === "data";

// Readonly deep utility type
export type DeepReadonly<T> = {
  readonly [P in keyof T]: T[P] extends object ? DeepReadonly<T[P]> : T[P];
};