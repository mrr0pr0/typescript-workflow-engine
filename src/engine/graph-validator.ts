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
  ValidationError
} from '../types/core';
import type {
  GraphValidationState,
  CycleDetectionResult,
  InputSatisfaction,
  TopologicalSort,
  GraphValidationError
} from '../types/graph';
import { checkPortCompatibility } from '../types/compatibility';

export class GraphValidator {
  private nodes: Map<NodeId, WorkflowNode>;
  private edges: Map<EdgeId, Edge>;
  private adjacencyList: Map<NodeId, NodeId[]>;
  private reverseAdjacencyList: Map<NodeId, NodeId[]>;

  constructor(private graph: WorkflowGraph) {
    this.nodes = new Map(graph.nodes.map(n => [n.id, n]));
    this.edges = new Map(graph.edges.map(e => [e.id as EdgeId, e]));
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
        type: 'cycle',
        nodes: cycleResult.cycle
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
      errors
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
        id => !result.includes(id)
      );
      return {
        success: false,
        reason: 'Graph contains cycles',
        problematicNodes
      };
    }

    return { success: true, order: result };
  }

  /**
   * Check if all required inputs are satisfied
   */
};