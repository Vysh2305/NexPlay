import { Router, type IRouter } from "express";
import healthRouter from "./health";
import authRouter from "./auth";
import gamesRouter from "./games";
import playersRouter from "./players";
import franchisesRouter from "./franchises";
import auctionsRouter from "./auctions";
import matchesRouter from "./matches";
import foulsRouter from "./fouls";
import recommendationsRouter from "./recommendations";
import adminRouter from "./admin";
import chatRouter from "./openai/index";
import notificationsRouter from "./notifications";

const router: IRouter = Router();

router.use(healthRouter);
router.use(authRouter);
router.use(gamesRouter);
router.use(playersRouter);
router.use(franchisesRouter);
router.use(auctionsRouter);
router.use(matchesRouter);
router.use(foulsRouter);
router.use(recommendationsRouter);
router.use(adminRouter);
router.use(chatRouter);
router.use(notificationsRouter);

export default router;
