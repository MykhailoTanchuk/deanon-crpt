export interface DBSCANResult {
    /**
     * Array of cluster labels for each point: >= 0 is cluster id, -1 is noise
     */
    labels: number[];
    /**
     * Set of indices marked as noise
     */
    noise: Set<number>;
}

/**
 * DBSCAN clustering algorithm on a 2D dataset.
 * @param data Array of points [x, y]
 * @param eps Neighborhood radius
 * @param minPts Minimum number of points to form a dense region
 */
export function dbscan(
    data: number[][],
    eps: number,
    minPts: number
): DBSCANResult {
    const n = data.length;
    const eps2 = eps * eps;
    // labels: undefined = unvisited, -1 = noise, >=0 = cluster id
    const labels: (number | undefined)[] = new Array(n).fill(undefined);
    let clusterId = 0;

    // squared Euclidean distance
    function distance2(i: number, j: number): number {
        const dx = data[i][0] - data[j][0];
        const dy = data[i][1] - data[j][1];
        return dx * dx + dy * dy;
    }

    // find neighbors within eps
    function regionQuery(i: number): number[] {
        const neighbors: number[] = [];
        for (let j = 0; j < n; j++) {
            if (i === j) continue;
            if (distance2(i, j) <= eps2) {
                neighbors.push(j);
            }
        }
        return neighbors;
    }

    for (let i = 0; i < n; i++) {
        if (labels[i] !== undefined) continue; // already processed
        const neighbors = regionQuery(i);
        if (neighbors.length < minPts) {
            labels[i] = -1; // mark as noise
            continue;
        }
        // start new cluster
        labels[i] = clusterId;
        const queue = [...neighbors];
        while (queue.length) {
            const j = queue.shift()!;
            if (labels[j] === -1) {
                labels[j] = clusterId; // border point
            }
            if (labels[j] !== undefined) continue;
            labels[j] = clusterId;
            const neighbors2 = regionQuery(j);
            if (neighbors2.length >= minPts) {
                queue.push(...neighbors2);
            }
        }
        clusterId++;
    }

    // collect noise indices
    const noise = new Set<number>();
    const finalLabels: number[] = labels.map((lbl, idx) => {
        if (lbl === undefined || lbl === -1) {
            noise.add(idx);
            return -1;
        }
        return lbl;
    });

    return { labels: finalLabels, noise };
}
