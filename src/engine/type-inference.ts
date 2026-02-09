/**
 * Type Inference Engine
 * Demonstrates: Advanced Type Inference, Type Propagation
 */

import type {
  WorkflowGraph,
  WorkflowNode,
  Edge,
  NodeId,
  PortType,
} from "../types/core";
import { GraphValidator } from "./graph-validator";

export interface InferredType {
  readonly nodeId: NodeId;
  readonly portId: string;
  readonly portType: PortType;
  readonly inferredFrom?: {
    readonly nodeId: NodeId;
    readonly portId: string;
  };
}

export class TypeInferenceEngine {
  private validator: GraphValidator;
  private inferredTypes: Map<string, InferredType>;

  constructor(private graph: WorkflowGraph) {
    this.validator = new GraphValidator(graph);
    this.inferredTypes = new Map();
  }

  /**
   * Infer types for all nodes in the graph
   */
  inferTypes(): Map<string, InferredType> {
    this.inferredTypes.clear();

    // Get topological order
    const topSort = this.validator.topologicalSort();
    if (!topSort.success) {
      throw new Error("Cannot infer types: graph contains cycles");
    }

    // Process nodes in topological order
    for (const nodeId of topSort.order) {
      this.inferNodeTypes(nodeId);
    }

    return this.inferredTypes;
  }

  /**
   * Infer types for a specific node
   */
  private inferNodeTypes(nodeId: NodeId): void {
    const node = this.graph.nodes.find((n) => n.id === nodeId);
    if (!node) return;

    // Infer output types based on node type and inputs
    for (const output of node.outputs) {
      const key = this.makeKey(nodeId, output.id);

      // For most nodes, output type is defined by the node itself
      this.inferredTypes.set(key, {
        nodeId,
        portId: output.id,
        portType: output.portType,
      });
    }

    // Propagate types to connected nodes
    this.propagateTypes(nodeId);
  }

  /**
   * Propagate types through connections
   */
  private propagateTypes(sourceNodeId: NodeId): void {
    const outgoingEdges = this.graph.edges.filter(
      (e) => e.source === sourceNodeId,
    );

    for (const edge of outgoingEdges) {
      const sourceKey = this.makeKey(edge.source, edge.sourcePort);
      const targetKey = this.makeKey(edge.target, edge.targetPort);

      const sourceType = this.inferredTypes.get(sourceKey);
      if (sourceType) {
        this.inferredTypes.set(targetKey, {
          nodeId: edge.target,
          portId: edge.targetPort,
          portType: sourceType.portType,
          inferredFrom: {
            nodeId: edge.source,
            portId: edge.sourcePort,
          },
        });
      }
    }
  }

  /**
   * Get inferred type for a specific port
   */
  getInferredType(nodeId: NodeId, portId: string): InferredType | undefined {
    return this.inferredTypes.get(this.makeKey(nodeId, portId));
  }

  /**
   * Get all inferred types for a node
   */
  getNodeInferredTypes(nodeId: NodeId): InferredType[] {
    return Array.from(this.inferredTypes.values()).filter(
      (t) => t.nodeId === nodeId,
    );
  }

  /**
   * Infer final output type of the workflow
   */
  inferWorkflowOutput(): PortType[] {
    const outputTypes: PortType[] = [];

    // Find terminal nodes (nodes with no outgoing edges)
    const terminalNodes = this.graph.nodes.filter((node) => {
      return !this.graph.edges.some((e) => e.source === node.id);
    });

    for (const node of terminalNodes) {
      for (const output of node.outputs) {
        const inferredType = this.getInferredType(node.id, output.id);
        if (inferredType) {
          outputTypes.push(inferredType.portType);
        }
      }
    }

    return outputTypes;
  }

  /**
   * Check if type inference is complete
   */
  isInferenceComplete(): boolean {
    for (const node of this.graph.nodes) {
      for (const input of node.inputs) {
        if (input.required) {
          const inferredType = this.getInferredType(node.id, input.id);
          if (!inferredType) {
            return false;
          }
        }
      }
    }
    return true;
  }

  /**
   * Get type inference report
   */
  getInferenceReport(): {
    complete: boolean;
    totalPorts: number;
    inferredPorts: number;
    missingInferences: Array<{ nodeId: NodeId; portId: string }>;
  } {
    const missingInferences: Array<{ nodeId: NodeId; portId: string }> = [];
    let totalPorts = 0;

    for (const node of this.graph.nodes) {
      for (const input of node.inputs) {
        totalPorts++;
        if (input.required && !this.getInferredType(node.id, input.id)) {
          missingInferences.push({ nodeId: node.id, portId: input.id });
        }
      }
    }

    return {
      complete: missingInferences.length === 0,
      totalPorts,
      inferredPorts: this.inferredTypes.size,
      missingInferences,
    };
  }

  private makeKey(nodeId: NodeId, portId: string): string {
    return `${nodeId}:${portId}`;
  }
}

/**
 * Type unification for generic types
 */
export class TypeUnifier {
  /**
   * Unify two types and find the most specific common type
   */
  unify(type1: PortType, type2: PortType): PortType | null {
    // If either is 'any', return the other
    if (type1.kind === "any") return type2;
    if (type2.kind === "any") return type1;

    // If same kind, return either
    if (type1.kind === type2.kind) {
      return type1;
    }

    // No unification possible
    return null;
  }

  /**
   * Find the least upper bound (most general type) of multiple types
   */
  leastUpperBound(types: PortType[]): PortType {
    if (types.length === 0) {
      return { kind: "any", type: undefined };
    }

    if (types.length === 1) {
      return types[0];
    }

    // Check if all types are the same
    const firstKind = types[0].kind;
    if (types.every((t) => t.kind === firstKind)) {
      return types[0];
    }

    // Otherwise, return 'any' as the most general type
    return { kind: "any", type: undefined };
  }
}
