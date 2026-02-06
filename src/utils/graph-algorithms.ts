/**
 * grapgh altigrumtins uttiltis
 */

import type { WorkflowGraph, NodeId } from "../types/core";
import { WorkflowGraph, NodeId } from '../types/core';

export const findPath = (
    graph: WorkflowGraph,
    start: NodeId
    end: NodeId
): NodeId[] | null => {
    const visited = new Set<NodeId>();
    const path: NodeId[]= [];

    const dfs = (current: NodeId): boolean => {
        if (current === end) {
            path.push(current);
            return true;
        }

        visited.add(current);
        path.push(current);

        const outgoingEdges = graph.edges.filter(e => e.source === current);
        for (const edge of outgoingEdges) {
            if (!visited.has(edge.target)) {
                if (dfs(edge.target)) {
                    return true;
                }
            }
        }


        path.pop();
        return false;
    };

    return dfs(start) ? path : null;
};

export const getConnectedComponents = (graph: WorkflowGraph): NodeId[][] => {
  const visited = new Set<NodeId>();
  const components: NodeId[][] = [];

  const dfs = (nodeId: NodeId, component: NodeId[]) => {
    visited.add(nodeId);
    component.push(nodeId);

    const connectedEdges = graph.edges.filter(
      e => e.source === nodeId || e.target === nodeId
    );

    for (const edge of connectedEdges) {
      const nextNode = edge.source === nodeId ? edge.target : edge.source;
      if (!visited.has(nextNode)) {
        dfs(nextNode, component);
      }
    }
  };

  for (const node of graph.nodes) {
    if (!visited.has(node.id)) {
      const component: NodeId[] = [];
      dfs(node.id, component);
      components.push(component);
    }
  }

  return components;
};