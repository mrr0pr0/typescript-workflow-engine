/**
 * Graph Validation Engine
 * Demonstrates: Type Guards, Exhaustiveness Checking, Algorithm Implementation
 */

import type {
  WorkflowGraph,
  WorkflowNode,
  Edge,
  NodeId,
  EdgeId,
  ValidationError,
} from "../types/core";
import type {
  GraphValidationState,
  CycleDetectionResult,
  InputSatisfaction,
  TopologicalSort,
  GraphValidationError,
} from "../types/graph";
import { checkPortCompatibility } from "../types/compatibility";

export class GraphValidator {
  private nodes: Map<NodeId, WorkflowNode>;
  private edges: Map<EdgeId, Edge>;
  private adjacencyList: Map<NodeId, NodeId[]>;
  private reverseAdjacencyList: Map<NodeId, NodeId[]>;

  constructor(private graph: WorkflowGraph) {
    this.nodes = new Map(graph.nodes.map((n) => [n.id, n]));
    this.edges = new Map(graph.edges.map((e) => [e.id as EdgeId, e]));
    this.adjacencyList = this.buildAdjacencyList();
    this.reverseAdjacencyList = this.buildReverseAdjacencyList();
  }

  /**
   * Validate entire graph
   */
  validate(): { valid: boolean; errors: GraphValidationError[] } {
    const errors: GraphValidationError[] = [];

    // Check for duplicate IDs
    errors.push(...this.checkDuplicateIds());

    // Check for missing nodes in edges
    errors.push(...this.checkMissingNodes());

    // Check for cycles
    const cycleResult = this.detectCycles();
    if (cycleResult.hasCycle) {
      errors.push({
        type: "cycle",
        nodes: cycleResult.cycle,
      });
    }

    // Check input satisfaction
    errors.push(...this.checkInputSatisfaction());

    // Check connection validity
    errors.push(...this.checkConnectionValidity());

    // Check for orphan nodes
    errors.push(...this.checkOrphanNodes());

    return {
      valid: errors.length === 0,
      errors,
    };
  }

  /**
   * Detect cycles using DFS
   */
  detectCycles(): CycleDetectionResult {
    const visited = new Set<NodeId>();
    const recursionStack = new Set<NodeId>();
    const cycle: NodeId[] = [];

    const dfs = (nodeId: NodeId, path: NodeId[]): boolean => {
      visited.add(nodeId);
      recursionStack.add(nodeId);
      path.push(nodeId);

      const neighbors = this.adjacencyList.get(nodeId) || [];
      for (const neighbor of neighbors) {
        if (!visited.has(neighbor)) {
          if (dfs(neighbor, path)) {
            return true;
          }
        } else if (recursionStack.has(neighbor)) {
          // Found cycle
          const cycleStart = path.indexOf(neighbor);
          cycle.push(...path.slice(cycleStart));
          return true;
        }
      }

      recursionStack.delete(nodeId);
      path.pop();
      return false;
    };

    for (const nodeId of this.nodes.keys()) {
      if (!visited.has(nodeId)) {
        if (dfs(nodeId, [])) {
          return { hasCycle: true, cycle };
        }
      }
    }

    return { hasCycle: false };
  }

  /**
   * Topological sort using Kahn's algorithm
   */
  topologicalSort(): TopologicalSort {
    const inDegree = new Map<NodeId, number>();
    const queue: NodeId[] = [];
    const result: NodeId[] = [];

    // Initialize in-degrees
    for (const nodeId of this.nodes.keys()) {
      inDegree.set(nodeId, 0);
    }

    for (const neighbors of this.adjacencyList.values()) {
      for (const neighbor of neighbors) {
        inDegree.set(neighbor, (inDegree.get(neighbor) || 0) + 1);
      }
    }

    // Find nodes with no incoming edges
    for (const [nodeId, degree] of inDegree.entries()) {
      if (degree === 0) {
        queue.push(nodeId);
      }
    }

    // Process nodes
    while (queue.length > 0) {
      const nodeId = queue.shift()!;
      result.push(nodeId);

      const neighbors = this.adjacencyList.get(nodeId) || [];
      for (const neighbor of neighbors) {
        const newDegree = (inDegree.get(neighbor) || 0) - 1;
        inDegree.set(neighbor, newDegree);
        if (newDegree === 0) {
          queue.push(neighbor);
        }
      }
    }

    // Check if all nodes were processed
    if (result.length !== this.nodes.size) {
      const problematicNodes = Array.from(this.nodes.keys()).filter(
        (id) => !result.includes(id),
      );
      return {
        success: false,
        reason: "Graph contains cycles",
        problematicNodes,
      };
    }

    return { success: true, order: result };
  }

  /**
   * Check if all required inputs are satisfied
   */
  checkInputSatisfaction(): GraphValidationError[] {
    const errors: GraphValidationError[] = [];

    for (const node of this.nodes.values()) {
      for (const input of node.inputs) {
        if (input.required) {
          const isConnected = Array.from(this.edges.values()).some(
            (edge) => edge.target === node.id && edge.targetPort === input.id,
          );

          if (!isConnected) {
            errors.push({
              type: "unsatisfied-input",
              nodeId: node.id,
              portId: input.id,
            });
          }
        }
      }
    }

    return errors;
  }

  /**
   * Check connection validity (type compatibility)
   */
  checkConnectionValidity(): GraphValidationError[] {
    const errors: GraphValidationError[] = [];

    for (const edge of this.edges.values()) {
      const sourceNode = this.nodes.get(edge.source);
      const targetNode = this.nodes.get(edge.target);

      if (!sourceNode || !targetNode) {
        continue; // Will be caught by checkMissingNodes
      }

      const sourcePort = sourceNode.outputs.find(
        (p) => p.id === edge.sourcePort,
      );
      const targetPort = targetNode.inputs.find(
        (p) => p.id === edge.targetPort,
      );

      if (!sourcePort || !targetPort) {
        errors.push({
          type: "invalid-connection",
          edgeId: edge.id as EdgeId,
          reason: "Port not found",
        });
        continue;
      }

      const compatibility = checkPortCompatibility(
        sourcePort.portType,
        targetPort.portType,
      );

      if (!compatibility.valid) {
        errors.push({
          type: "invalid-connection",
          edgeId: edge.id as EdgeId,
          reason: compatibility.errorMessage || "Type mismatch",
        });
      }
    }

    return errors;
  }

  /**
   * Check for orphan nodes (no connections)
   */
  checkOrphanNodes(): GraphValidationError[] {
    const errors: GraphValidationError[] = [];
    const connectedNodes = new Set<NodeId>();

    for (const edge of this.edges.values()) {
      connectedNodes.add(edge.source);
      connectedNodes.add(edge.target);
    }

    for (const nodeId of this.nodes.keys()) {
      if (!connectedNodes.has(nodeId) && this.nodes.size > 1) {
        errors.push({
          type: "orphan-node",
          nodeId,
        });
      }
    }

    return errors;
  }

  /**
   * Check for duplicate node IDs
   */
  private checkDuplicateIds(): GraphValidationError[] {
    const errors: GraphValidationError[] = [];
    const nodeIds = new Set<NodeId>();
    const edgeIds = new Set<EdgeId>();

    for (const node of this.graph.nodes) {
      if (nodeIds.has(node.id)) {
        errors.push({
          type: "duplicate-node-id",
          nodeId: node.id,
        });
      }
      nodeIds.add(node.id);
    }

    for (const edge of this.graph.edges) {
      if (edgeIds.has(edge.id as EdgeId)) {
        errors.push({
          type: "duplicate-edge-id",
          edgeId: edge.id as EdgeId,
        });
      }
      edgeIds.add(edge.id as EdgeId);
    }

    return errors;
  }

  /**
   * Check for missing nodes referenced in edges
   */
  private checkMissingNodes(): GraphValidationError[] {
    const errors: GraphValidationError[] = [];

    for (const edge of this.edges.values()) {
      if (!this.nodes.has(edge.source)) {
        errors.push({
          type: "missing-node",
          nodeId: edge.source,
          referencedBy: edge.id as EdgeId,
        });
      }
      if (!this.nodes.has(edge.target)) {
        errors.push({
          type: "missing-node",
          nodeId: edge.target,
          referencedBy: edge.id as EdgeId,
        });
      }
    }

    return errors;
  }

  /**
   * Build adjacency list for graph traversal
   */
  private buildAdjacencyList(): Map<NodeId, NodeId[]> {
    const adjacencyList = new Map<NodeId, NodeId[]>();

    for (const nodeId of this.nodes.keys()) {
      adjacencyList.set(nodeId, []);
    }

    for (const edge of this.edges.values()) {
      const neighbors = adjacencyList.get(edge.source) || [];
      neighbors.push(edge.target);
      adjacencyList.set(edge.source, neighbors);
    }

    return adjacencyList;
  }

  /**
   * Build reverse adjacency list
   */
  private buildReverseAdjacencyList(): Map<NodeId, NodeId[]> {
    const reverseList = new Map<NodeId, NodeId[]>();

    for (const nodeId of this.nodes.keys()) {
      reverseList.set(nodeId, []);
    }

    for (const edge of this.edges.values()) {
      const predecessors = reverseList.get(edge.target) || [];
      predecessors.push(edge.source);
      reverseList.set(edge.target, predecessors);
    }

    return reverseList;
  }

  /**
   * Get validation state
   */
  getValidationState(): GraphValidationState {
    const topSort = this.topologicalSort();

    return {
      nodes: this.nodes,
      edges: this.edges,
      adjacencyList: new Map(
        Array.from(this.adjacencyList.entries()).map(([k, v]) => [
          k,
          v as readonly NodeId[],
        ]),
      ),
      reverseAdjacencyList: new Map(
        Array.from(this.reverseAdjacencyList.entries()).map(([k, v]) => [
          k,
          v as readonly NodeId[],
        ]),
      ),
      inputSatisfaction: new Map(),
      cycles: [],
      topologicalOrder: topSort.success ? topSort.order : null,
    };
  }
}

/**
 * Exhaustiveness check for validation errors
 */
export const formatValidationError = (error: GraphValidationError): string => {
  const errorType = error.type;

  if (errorType === "cycle") {
    return `Cycle detected: ${error.nodes.join(" -> ")}`;
  } else if (errorType === "unsatisfied-input") {
    return `Unsatisfied input: ${error.nodeId}:${error.portId}`;
  } else if (errorType === "invalid-connection") {
    return `Invalid connection ${error.edgeId}: ${error.reason}`;
  } else if (errorType === "orphan-node") {
    return `Orphan node: ${error.nodeId}`;
  } else if (errorType === "duplicate-node-id") {
    return `Duplicate node ID: ${error.nodeId}`;
  } else if (errorType === "duplicate-edge-id") {
    return `Duplicate edge ID: ${error.edgeId}`;
  } else if (errorType === "missing-node") {
    return `Missing node ${error.nodeId} referenced by ${error.referencedBy}`;
  } else {
    const _exhaustive: never = errorType;
    return `Unknown error: ${_exhaustive}`;
  }
};
