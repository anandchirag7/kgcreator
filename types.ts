
export interface Node {
  id: string;
  label: string;
  properties: Record<string, any>;
}

export interface Relationship {
  source: string;
  target: string;
  type: string;
  properties: Record<string, any>;
}

export interface GraphData {
  nodes: Node[];
  relationships: Relationship[];
}

export enum STATUS {
    IDLE = 'idle',
    LOADING = 'loading',
    SUCCESS = 'success',
    ERROR = 'error'
}

export interface AppState {
    status: STATUS;
    graphData: GraphData | null;
    cypherQuery: string;
    error: string | null;
}
