import { getSubgraph, SubgraphNode, SubgraphEdge } from './graphService.js';
import Graph from 'graphology';
import assign from 'graphology-communities-louvain';
import driver from './neo4j.js';
import neo4j from 'neo4j-driver';

export interface CommunityResult {
    communityIds: Map<string, number>;
    communities: Map<number, string[]>;
}

export async function detectCommunities(addresses: string[]): Promise<CommunityResult> {
    // Convert addresses to lowercase
    const addressesLower = addresses.map(addr => addr.toLowerCase());

    // 1. Get subgraph for all addresses
    const { nodes, edges } = await getSubgraph(addressesLower);

    // 2. Build graphology graph
    const graph = new Graph({ type: 'undirected' });
    nodes.forEach((n: SubgraphNode) => graph.addNode(n.id));
    edges.forEach((e: SubgraphEdge) => {
        if (!graph.hasEdge(e.from, e.to)) {
            graph.addEdge(e.from, e.to);
        }
    });

    // 3. Run Louvain algorithm
    const assignments: Record<string, number> = assign(graph);

    // 4. Create mappings
    const communityIds = new Map<string, number>();
    const communities = new Map<number, string[]>();

    // Process all assignments
    Object.entries(assignments).forEach(([node, communityId]) => {
        communityIds.set(node, communityId);

        if (!communities.has(communityId)) {
            communities.set(communityId, []);
        }
        communities.get(communityId)?.push(node);
    });

    // 5. Save community IDs to Neo4j
    const session = driver.session({ defaultAccessMode: neo4j.session.WRITE });
    try {
        await session.run(
            `
            MATCH (a:Address)
            WHERE toLower(a.id) IN $nodes
            WITH a, toInteger($assignments[toLower(a.id)]) as cid
            SET a.communityId = cid
            `,
            {
                nodes: Object.keys(assignments),
                assignments
            }
        );
    } finally {
        await session.close();
    }

    return { communityIds, communities };
}
