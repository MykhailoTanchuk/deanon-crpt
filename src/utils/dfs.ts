import Graph from 'graphology';

export interface CycleInfo {
    /** Ordered list of node IDs forming the cycle */
    nodes: string[];
}

/**
 * Finds all simple cycles in a directed Graphology graph up to a given maximum length.
 * Uses a DFS-based algorithm with pruning to avoid revisiting nodes and to cap cycle length.
 * Suitable for small-to-medium graphs (tens to low hundreds of nodes).
 *
 * @param graph Directed graphology Graph
 * @param maxLength Max cycle length (default 6)
 * @returns Array of cycles, each a list of node IDs in visit order
 */
export function findSimpleCycles(
    graph: Graph,
    maxLength: number = 6
): CycleInfo[] {
    const cycles: CycleInfo[] = [];
    const nodes = graph.nodes().slice().sort();
    const seenCycles = new Set<string>();

    // Depth-first search from start node
    function dfs(start: string, current: string, path: string[], visited: Set<string>) {
        visited.add(current);
        path.push(current);

        for (const neighbor of graph.outNeighbors(current) || []) {
            // Found a cycle
            if (neighbor === start && path.length >= 2) {
                const cycle = [...path];
                // Canonicalize: rotate so smallest node ID is first
                const rotations = cycle.map((_, i) => [...cycle.slice(i), ...cycle.slice(0, i)]);
                const normalized = rotations
                    .map(rot => rot.join(','))
                    .sort()[0];
                if (!seenCycles.has(normalized)) {
                    seenCycles.add(normalized);
                    cycles.push({ nodes: normalized.split(',') });
                }
            }
            // Continue DFS if not visited and within maxLength
            else if (!visited.has(neighbor) && path.length < maxLength) {
                dfs(start, neighbor, path, visited);
            }
        }

        visited.delete(current);
        path.pop();
    }

    // Run DFS from each node to find cycles
    for (const start of nodes) {
        dfs(start, start, [], new Set());
    }

    return cycles;
}
