import express from "express";
import cors from "cors";
import morgan from "morgan";
import userRouter from "./routers/userRouter.js";
import donateRouter from "./routers/donateRouter.js";
import investRouter from "./routers/investRouter.js";

const logger = morgan("dev"); //개발 모드의 morgan 로거를 설정. morgan("dev")는 간단한 로그 형식을 제공

const app = express();
app.use(logger);
app.use(cors()); // 모든 도메인 CORS 허용
app.use(express.json()); // 클라이언트로부터 전달받는 string 값을 읽을 수 있음
app.use(express.urlencoded({ extended: true })); // form 데이터 전달받아도 읽을 수 있음

app.use("/user", userRouter);
app.use("/donate", donateRouter);
app.use("/invest", investRouter);

export default app;
