import { useState, useCallback } from 'react';
import { WorkflowCanvas } from '../components/WorkflowCanvas';
import { NodePalette } from '../components/NodePalette';
import { TypeInspector } from '../components/TypeInspector';
import { Button } from '../components/ui/button';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogDescription, AlertDialogTrigger } from '../components/ui/alert-dialog';
import { useWorkflowGraph } from '../hooks/useWorkflowGraph';
import { nodeFactories, type NodeFactoryType } from '../types/nodes';
import { createNodeId } from '../types/core';
import { Play, Save, Trash2, CheckCircle2 } from 'lucide-react';
import { WorkflowExecutor } from '../engine/executor';
import { useToast } from '../hooks/use-toast';

export default function Index() {
  const {
    graph,
    addNode,
    removeNode,
    updateNode,
    addEdge,
    removeEdge,
    validateGraph,
    inferTypes,
    clearGraph,
    validationErrors,
    inferredTypes
  } = useWorkflowGraph();

  const { toast } = useToast();
  const [isExecuting, setIsExecuting] = useState(false);

  const handleNodeSelect = useCallback(
    (nodeType: string) => {
      const factory = nodeFactories[nodeType as NodeFactoryType];
      if (!factory) {
        console.error('Unknown node type:', nodeType);
        return;
      }

      const nodeId = createNodeId(`node-${Date.now()}`);
      const position = {
        x: Math.random() * 400 + 100,
        y: Math.random() * 300 + 100
      };

      // Call factory with appropriate arguments
      let node;
      if (nodeType === 'data.constant') {
        node = factory(nodeId, position, null);
      } else if (nodeType === 'data.variable') {
        node = factory(nodeId, position, 'variable');
      } else {
        node = factory(nodeId, position);
      }

      addNode(node);
      
      toast({
        title: 'Node Added',
        description: `Added ${node.label} to the workflow`
      });
    },
    [addNode, toast]
  );

  const handleValidate = useCallback(() => {
    const isValid = validateGraph();
    inferTypes();

    if (isValid) {
      toast({
        title: 'Validation Successful',
        description: 'Workflow is valid and ready to execute',
        variant: 'default'
      });
    } else {
      toast({
        title: 'Validation Failed',
        description: `Found ${validationErrors.length} error(s)`,
        variant: 'destructive'
      });
    }
  }, [validateGraph, inferTypes, validationErrors.length, toast]);

  const handleExecute = useCallback(async () => {
    const isValid = validateGraph();
    if (!isValid) {
      toast({
        title: 'Cannot Execute',
        description: 'Please fix validation errors first',
        variant: 'destructive'
      });
      return;
    }

    setIsExecuting(true);
    try {
      const executor = new WorkflowExecutor(graph);
      const result = await executor.execute({
        workflowId: graph.id,
        variables: new Map(),
        timestamp: Date.now()
      });

      if (result.success) {
        toast({
          title: 'Execution Successful',
          description: 'Workflow executed successfully'
        });
        console.log('Execution output:', result.output);
        console.log('Execution logs:', result.logs);
      } else {
        toast({
          title: 'Execution Failed',
          description: result.error.message,
          variant: 'destructive'
        });
      }
    } catch (error) {
      toast({
        title: 'Execution Error',
        description: error instanceof Error ? error.message : 'Unknown error',
        variant: 'destructive'
      });
    } finally {
      setIsExecuting(false);
    }
  }, [graph, validateGraph, toast]);

  const handleClear = useCallback(() => {
    clearGraph();
    toast({
      title: 'Workflow Cleared',
      description: 'All nodes and edges have been removed'
    });
  }, [clearGraph, toast]);

  return (
    <div className="h-screen flex flex-col bg-slate-900">
      {/* Header */}
      <header className="h-16 bg-slate-800 border-b border-slate-700 flex items-center justify-between px-6">
        <div className="flex items-center gap-4">
          <img
            src="https://mgx-backend-cdn.metadl.com/generate/images/955206/2026-02-06/47b474ae-fd65-4627-a57b-7c37f00bb7fd.png"
            alt="TypeScript Workflow Engine"
            className="h-10"
          />
          <div>
            <h1 className="text-xl font-bold text-slate-100">
              TypeScript Workflow Engine
            </h1>
            <p className="text-xs text-slate-400">
              Type-Safe Visual Workflow Builder
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={handleValidate}
            className="bg-slate-700 border-slate-600 hover:bg-slate-600"
          >
            <CheckCircle2 className="w-4 h-4 mr-2" />
            Validate
          </Button>
          <Button
            variant="default"
            size="sm"
            onClick={handleExecute}
            disabled={isExecuting}
            className="bg-blue-600 hover:bg-blue-700"
          >
            <Play className="w-4 h-4 mr-2" />
            {isExecuting ? 'Executing...' : 'Execute'}
          </Button>
          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button
                variant="outline"
                size="sm"
                className="bg-slate-700 border-slate-600 hover:bg-slate-600"
              >
                <Trash2 className="w-4 h-4 mr-2" />
                Clear
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Clear workflow?</AlertDialogTitle>
                <AlertDialogDescription>
                  This will remove all nodes and edges from the current workflow. This action cannot be undone.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Cancel</AlertDialogCancel>
                <AlertDialogAction onClick={handleClear}>
                  Yes, clear workflow
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </div>
      </header>

      {/* Main Content */}
      <div className="flex-1 flex overflow-hidden">
        {/* Node Palette */}
        <aside className="w-80 border-r border-slate-700 overflow-y-auto">
          <NodePalette onNodeSelect={handleNodeSelect} />
        </aside>

        {/* Canvas */}
        <main className="flex-1">
          <WorkflowCanvas
            graph={graph}
            onNodesChange={(nodes) => {
              // Handle bulk node updates
              nodes.forEach(node => updateNode(node.id, node));
            }}
            onEdgesChange={(edges) => {
              // This is simplified - in production you'd handle edge updates properly
            }}
          />
        </main>

        {/* Type Inspector */}
        <aside className="w-96 border-l border-slate-700 overflow-y-auto">
          <TypeInspector
            graph={graph}
            validationErrors={validationErrors}
            inferredTypes={inferredTypes}
          />
        </aside>
      </div>
    </div>
  );
}