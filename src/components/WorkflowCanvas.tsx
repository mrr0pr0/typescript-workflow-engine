import { useCallback, useMemo } from "react";
import {
  ReactFlow,
  Background,
  Controls,
  MiniMap,
  useNodesState,
  useEdgesState,
  addEdge,
  Connection,
  Node,
  Edge as FlowEdge,
  NodeTypes,
  type NodeChange,
} from "@xyflow/react";
import "@xyflow/react/dist/style.css";
import { NodeRenderer } from "./NodeRenderer";
import { useTypeChecker } from "../hooks/useTypeChecker";
import type {
  WorkflowGraph,
  WorkflowNode,
  Edge,
  NodeId,
  EdgeId,
} from "../types/core";
import { createEdgeId } from "../types/core";
import { checkPortCompatibility } from "../types/compatibility";

interface WorkflowCanvasProps {
  graph: WorkflowGraph;
  onNodesChange: (nodes: WorkflowNode[]) => void;
  onEdgesChange: (edges: Edge[]) => void;
  onNodeClick?: (node: WorkflowNode) => void;
}

export const WorkflowCanvas = ({
  graph,
  onNodesChange,
  onEdgesChange,
  onNodeClick,
}: WorkflowCanvasProps) => {
  const { edgeValidation } = useTypeChecker(graph);

  // Convert our graph format to React Flow format
  const initialNodes: Node[] = useMemo(
    () =>
      graph.nodes.map((node) => ({
        id: node.id,
        type: "workflowNode",
        position: node.position,
        data: node,
      })),
    [graph.nodes],
  );

  const initialEdges: FlowEdge[] = useMemo(
    () =>
      graph.edges.map((edge) => ({
        id: edge.id,
        source: edge.source,
        target: edge.target,
        sourceHandle: edge.sourcePort,
        targetHandle: edge.targetPort,
        animated: edgeValidation.get(edge.id) ?? true,
        style: {
          stroke: edgeValidation.get(edge.id) === false ? "#EF4444" : "#3B82F6",
          strokeWidth: 2,
        },
      })),
    [graph.edges, edgeValidation],
  );

  const [nodes, setNodes, onNodesChangeInternal] = useNodesState(initialNodes);
  const [edges, setEdges, onEdgesChangeInternal] = useEdgesState(initialEdges);

  // Custom node types
  const nodeTypes: NodeTypes = useMemo(
    () => ({
      workflowNode: NodeRenderer,
    }),
    [],
  );

  // Handle connection
  const onConnect = useCallback(
    (connection: Connection) => {
      if (!connection.source || !connection.target) return;

      const sourceNode = graph.nodes.find((n) => n.id === connection.source);
      const targetNode = graph.nodes.find((n) => n.id === connection.target);

      if (!sourceNode || !targetNode) return;

      const sourcePort = sourceNode.outputs.find(
        (p) => p.id === connection.sourceHandle,
      );
      const targetPort = targetNode.inputs.find(
        (p) => p.id === connection.targetHandle,
      );

      if (!sourcePort || !targetPort) return;

      const compatibility = checkPortCompatibility(
        sourcePort.portType,
        targetPort.portType,
      );

      const newEdge: Edge = {
        id: createEdgeId(`edge-${Date.now()}`),
        source: connection.source as NodeId,
        sourcePort: sourcePort.id,
        target: connection.target as NodeId,
        targetPort: targetPort.id,
        valid: compatibility.valid,
        errorMessage: compatibility.errorMessage,
      };

      onEdgesChange([...graph.edges, newEdge]);

      setEdges((eds) =>
        addEdge(
          {
            ...connection,
            id: newEdge.id,
            animated: compatibility.valid,
            style: {
              stroke: compatibility.valid ? "#3B82F6" : "#EF4444",
              strokeWidth: 2,
            },
          },
          eds,
        ),
      );
    },
    [graph, onEdgesChange, setEdges],
  );

  // Handle node position change
  const handleNodesChange = useCallback(
    (changes: NodeChange<Node>[]) => {
      onNodesChangeInternal(changes);

      // Update positions in our graph
      const updatedNodes = nodes
        .map((node) => {
          const graphNode = graph.nodes.find((n) => n.id === node.id);
          if (graphNode) {
            return {
              ...graphNode,
              position: node.position,
            };
          }
          return undefined;
        })
        .filter((n): n is WorkflowNode => Boolean(n));

      onNodesChange(updatedNodes);
    },
    [nodes, graph.nodes, onNodesChange, onNodesChangeInternal],
  );

  return (
    <div className="w-full h-full bg-slate-900">
      <ReactFlow
        nodes={nodes}
        edges={edges}
        onNodesChange={handleNodesChange}
        onEdgesChange={onEdgesChangeInternal}
        onConnect={onConnect}
        nodeTypes={nodeTypes}
        fitView
        className="bg-slate-900"
      >
        <Background color="#1E293B" gap={16} />
        <Controls className="bg-slate-800 border-slate-700" />
        <MiniMap
          className="bg-slate-800 border-slate-700"
          nodeColor={(node) => {
            const workflowNode = graph.nodes.find((n) => n.id === node.id);
            if (!workflowNode) return "#6B7280";

            switch (workflowNode.category) {
              case "trigger":
                return "#10B981";
              case "logic":
                return "#F59E0B";
              case "transform":
                return "#3B82F6";
              case "effect":
                return "#EF4444";
              case "data":
                return "#8B5CF6";
              default:
                return "#6B7280";
            }
          }}
        />
      </ReactFlow>
    </div>
  );
};
