import {NextFunction, Router} from "express";
import {getSubgraph} from "../services/graphService.js";

const router = Router();

// GET /graph/:address
router.get(
    '/',
    async (
        req,
        res,
        next: NextFunction
    ) => {
        try {
            const { addresses } = req.body;
            const graph = await getSubgraph(addresses);
            res.json(graph);
        } catch (err) {
            console.error('[/graph] error:', err);
            next(err);
        }
    }
);

export default router;