/**
 * Type Compatibility System
 * Demonstrates: Conditional Types, Mapped Types, Type-level Programming
 */

import type { PortType, InputPort, OutputPort, WorkflowNode } from "./core";

// Type-level compatibility checking
export type IsCompatible<
  Source extends PortType,
  Target extends PortType,
> = Source extends { kind: "any" }
  ? true
  : Target extends { kind: "any" }
    ? true
    : Source extends { kind: infer SK }
      ? Target extends { kind: infer TK }
        ? SK extends TK
          ? true
          : false
        : false
      : false;

// Extract port type from port definition
export type ExtractPortType<P> = P extends { portType: infer PT } ? PT : never;

// Check if output port can connect to input port
export type CanConnect<
  Out extends OutputPort,
  In extends InputPort,
> = IsCompatible<ExtractPortType<Out>, ExtractPortType<In>>;

// Get all valid target ports for a source port
export type ValidTargets<
  Source extends OutputPort,
  Targets extends readonly InputPort[],
> = {
  [K in keyof Targets]: Targets[K] extends InputPort
    ? CanConnect<Source, Targets[K]> extends true
      ? Targets[K]
      : never
    : never;
}[number];

// Connection validation result
export interface ConnectionValidation {
  readonly valid: boolean;
  readonly sourceType: string;
  readonly targetType: string;
  readonly errorMessage?: string;
}

// Runtime compatibility checker
export const checkPortCompatibility = (
  sourcePort: PortType,
  targetPort: PortType,
): ConnectionValidation => {
  // Any type is compatible with everything
  if (sourcePort.kind === "any" || targetPort.kind === "any") {
    return {
      valid: true,
      sourceType: sourcePort.kind,
      targetType: targetPort.kind,
    };
  }

  // Exact kind match
  if (sourcePort.kind === targetPort.kind) {
    return {
      valid: true,
      sourceType: sourcePort.kind,
      targetType: targetPort.kind,
    };
  }

  // Custom type compatibility (by name)
  if (sourcePort.kind === "custom" && targetPort.kind === "custom") {
    const sourceCustom = sourcePort as Extract<PortType, { kind: "custom" }>;
    const targetCustom = targetPort as Extract<PortType, { kind: "custom" }>;

    if (sourceCustom.typeName === targetCustom.typeName) {
      return {
        valid: true,
        sourceType: sourceCustom.typeName,
        targetType: targetCustom.typeName,
      };
    }
  }

  return {
    valid: false,
    sourceType: sourcePort.kind,
    targetType: targetPort.kind,
    errorMessage: `Type mismatch: cannot connect ${sourcePort.kind} to ${targetPort.kind}`,
  };
};

// Port compatibility matrix type
export type CompatibilityMatrix = {
  readonly [SourceKind in PortType["kind"]]: {
    readonly [TargetKind in PortType["kind"]]: boolean;
  };
};

// Compile-time compatibility matrix
export const compatibilityMatrix: CompatibilityMatrix = {
  any: {
    any: true,
    string: true,
    number: true,
    boolean: true,
    object: true,
    array: true,
    void: true,
    custom: true,
  },
  string: {
    any: true,
    string: true,
    number: false,
    boolean: false,
    object: false,
    array: false,
    void: false,
    custom: false,
  },
  number: {
    any: true,
    string: false,
    number: true,
    boolean: false,
    object: false,
    array: false,
    void: false,
    custom: false,
  },
  boolean: {
    any: true,
    string: false,
    number: false,
    boolean: true,
    object: false,
    array: false,
    void: false,
    custom: false,
  },
  object: {
    any: true,
    string: false,
    number: false,
    boolean: false,
    object: true,
    array: false,
    void: false,
    custom: false,
  },
  array: {
    any: true,
    string: false,
    number: false,
    boolean: false,
    object: false,
    array: true,
    void: false,
    custom: false,
  },
  void: {
    any: true,
    string: false,
    number: false,
    boolean: false,
    object: false,
    array: false,
    void: true,
    custom: false,
  },
  custom: {
    any: true,
    string: false,
    number: false,
    boolean: false,
    object: false,
    array: false,
    void: false,
    custom: true, // Requires name check
  },
} as const;

// Type-safe port finder
export type FindPort<
  Ports extends readonly (InputPort | OutputPort)[],
  PortId extends string,
> = Extract<Ports[number], { id: PortId }>;

// Connection type inference
export type InferConnectionType<
  SourceNode extends WorkflowNode,
  SourcePortId extends string,
  TargetNode extends WorkflowNode,
  TargetPortId extends string,
> =
  FindPort<SourceNode["outputs"], SourcePortId> extends OutputPort
    ? FindPort<TargetNode["inputs"], TargetPortId> extends InputPort
      ? CanConnect<
          FindPort<SourceNode["outputs"], SourcePortId>,
          FindPort<TargetNode["inputs"], TargetPortId>
        >
      : false
    : false;

// Mapped type for all possible connections from a node
export type PossibleConnections<Node extends WorkflowNode> = {
  [OutputKey in Node["outputs"][number]["id"]]: {
    readonly outputPort: Extract<Node["outputs"][number], { id: OutputKey }>;
    readonly compatibleTypes: ReadonlyArray<PortType["kind"]>;
  };
};

// Helper to get compatible input types for an output
export const getCompatibleInputTypes = (
  outputType: PortType["kind"],
): ReadonlyArray<PortType["kind"]> => {
  return (
    Object.keys(compatibilityMatrix[outputType]) as Array<PortType["kind"]>
  ).filter((targetType) => compatibilityMatrix[outputType][targetType]);
};

// Variadic tuple type for multiple connections
export type ConnectionChain<Nodes extends readonly WorkflowNode[]> = {
  [K in keyof Nodes]: Nodes[K] extends WorkflowNode ? Nodes[K] : never;
};

// Template literal type for connection descriptions
export type ConnectionDescription<
  SourceType extends string,
  TargetType extends string,
> = `${SourceType} -> ${TargetType}`;

// Type-safe connection builder
export interface TypedConnection<
  Source extends WorkflowNode,
  Target extends WorkflowNode,
  SourcePort extends string,
  TargetPort extends string,
> {
  readonly source: Source;
  readonly target: Target;
  readonly sourcePort: SourcePort;
  readonly targetPort: TargetPort;
  readonly valid: InferConnectionType<Source, SourcePort, Target, TargetPort>;
}
