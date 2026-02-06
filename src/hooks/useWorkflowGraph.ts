/**
 * Workflow Graph State Management Hook
 * Demonstrates: React Hooks with TypeScript, Immutable State Updates
 */

import { useState, useCallback } from "react";
import type {
  WorkflowGraph,
  WorkflowNode,
  Edge,
  NodeId,
  EdgeId,
  WorkflowId,
} from "../types/core";
import { createNodeId, createEdgeId, createWorkflowId } from "../types/core";
import { GraphValidator } from "../engine/graph-validator";
import { TypeInferenceEngine } from "../engine/type-inference";

export const useWorkflowGraph = (initialGraph?: WorkflowGraph) => {
  const [graph, setGraph] = useState<WorkflowGraph>(
    initialGraph || {
      id: createWorkflowId("workflow-1"),
      name: "New Workflow",
      nodes: [],
      edges: [],
      metadata: {
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        version: "1.0.0",
      },
    },
  );

  const [validationErrors, setValidationErrors] = useState<string[]>([]);
  const [inferredTypes, setInferredTypes] = useState<Map<string, any>>(
    new Map(),
  );

  // Add node
  const addNode = useCallback((node: WorkflowNode) => {
    setGraph((prev) => ({
      ...prev,
      nodes: [...prev.nodes, node],
      metadata: {
        ...prev.metadata!,
        updatedAt: new Date().toISOString(),
      },
    }));
  }, []);

  // Remove node
  const removeNode = useCallback((nodeId: NodeId) => {
    setGraph((prev) => ({
      ...prev,
      nodes: prev.nodes.filter((n) => n.id !== nodeId),
      edges: prev.edges.filter(
        (e) => e.source !== nodeId && e.target !== nodeId,
      ),
      metadata: {
        ...prev.metadata!,
        updatedAt: new Date().toISOString(),
      },
    }));
  }, []);

  // Update node
  const updateNode = useCallback(
    (nodeId: NodeId, updates: Partial<WorkflowNode>) => {
      setGraph((prev) => ({
        ...prev,
        nodes: prev.nodes.map((n) =>
          n.id === nodeId ? { ...n, ...updates } : n,
        ),
        metadata: {
          ...prev.metadata!,
          updatedAt: new Date().toISOString(),
        },
      }));
    },
    [],
  );

  // Add edge
  const addEdge = useCallback((edge: Edge) => {
    setGraph((prev) => ({
      ...prev,
      edges: [...prev.edges, edge],
      metadata: {
        ...prev.metadata!,
        updatedAt: new Date().toISOString(),
      },
    }));
  }, []);

  // Remove edge
  const removeEdge = useCallback((edgeId: EdgeId) => {
    setGraph((prev) => ({
      ...prev,
      edges: prev.edges.filter((e) => e.id !== edgeId),
      metadata: {
        ...prev.metadata!,
        updatedAt: new Date().toISOString(),
      },
    }));
  }, []);

  // Validate graph
  const validateGraph = useCallback(() => {
    const validator = new GraphValidator(graph);
    const result = validator.validate();

    if (result.valid) {
      setValidationErrors([]);
    } else {
      const errors = result.errors.map((err) => {
        switch (err.type) {
          case "cycle":
            return `Cycle detected: ${err.nodes.join(" -> ")}`;
          case "unsatisfied-input":
            return `Unsatisfied input: ${err.nodeId}:${err.portId}`;
          case "invalid-connection":
            return `Invalid connection ${err.edgeId}: ${err.reason}`;
          case "orphan-node":
            return `Orphan node: ${err.nodeId}`;
          default:
            return "Unknown error";
        }
      });
      setValidationErrors(errors);
    }

    return result.valid;
  }, [graph]);

  // Infer types
  const inferTypes = useCallback(() => {
    try {
      const engine = new TypeInferenceEngine(graph);
      const types = engine.inferTypes();
      setInferredTypes(types);
      return true;
    } catch (error) {
      console.error("Type inference failed:", error);
      return false;
    }
  }, [graph]);

  // Clear graph
  const clearGraph = useCallback(() => {
    setGraph({
      id: createWorkflowId("workflow-1"),
      name: "New Workflow",
      nodes: [],
      edges: [],
      metadata: {
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        version: "1.0.0",
      },
    });
    setValidationErrors([]);
    setInferredTypes(new Map());
  }, []);

  return {
    graph,
    setGraph,
    addNode,
    removeNode,
    updateNode,
    addEdge,
    removeEdge,
    validateGraph,
    inferTypes,
    clearGraph,
    validationErrors,
    inferredTypes,
  };
};
