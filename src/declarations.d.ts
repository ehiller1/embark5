declare module 'react-force-graph-2d' {
  import * as React from 'react';

  export interface NodeObject {
    id?: string | number;
    x?: number;
    y?: number;
    vx?: number;
    vy?: number;
    fx?: number;
    fy?: number;
    [key: string]: any; // Allow other properties
  }

  export interface LinkObject {
    source?: string | number | NodeObject;
    target?: string | number | NodeObject;
    [key: string]: any; // Allow other properties
  }

  export interface GraphData {
    nodes: NodeObject[];
    links: LinkObject[];
  }

  export interface ForceGraphMethods {
    zoomToFit: (duration?: number, padding?: number, filterFn?: (node: NodeObject) => boolean) => void;
    centerAt: (x?: number, y?: number, duration?: number) => void;
    graphData: () => GraphData;
    // Add other methods as needed
    [methodName: string]: any;
  }

  export interface ForceGraphProps {
    graphData?: GraphData;
    nodeLabel?: string | ((node: NodeObject) => string);
    nodeCanvasObject?: (node: NodeObject, ctx: CanvasRenderingContext2D, globalScale: number) => void;
    nodeCanvasObjectMode?: string | ((node: NodeObject) => string);
    onNodeClick?: (node: NodeObject, event: MouseEvent) => void;
    onNodeDragEnd?: (node: NodeObject, event: MouseEvent) => void;
    linkWidth?: number | ((link: LinkObject) => number);
    linkDirectionalArrowLength?: number | ((link: LinkObject) => number);
    linkDirectionalArrowRelPos?: number | ((link: LinkObject) => number);
    linkCurvature?: number | ((link: LinkObject) => number);
    cooldownTicks?: number;
    onEngineStop?: () => void;
    nodeAutoColorBy?: string | ((node: NodeObject) => string | null | undefined);
    nodeColor?: string | ((node: NodeObject) => string);
    nodeRelSize?: number;
    // Add other props as needed
    [propName: string]: any;
  }

  const ForceGraph2D: React.ForwardRefExoticComponent<ForceGraphProps & React.RefAttributes<ForceGraphMethods>>;
  export default ForceGraph2D;
}

declare module 'lucide-react';
