import express from "express";
import {
  setCashbackPoint,
  addCashbackStamp,
  getUserData,
  postUserData,
  resetCashbackStamps,
  resetCashbackStatus,
  getCashbackInfo,
  exchange,
} from "../controllers/userController.js";

const userRouter = express.Router();

userRouter.route("/").post(postUserData); // 유저 생성
userRouter.route("/:name").get(getUserData); // 특정 name의 유저 조회

userRouter.route("/addStamp").post(addCashbackStamp); // 스탬프 찍기
userRouter.route("/resetStatus").put(resetCashbackStatus); // 캐시백 영역 초기화
userRouter.route("/resetStamp").put(resetCashbackStamps); // 스탬프 배열 초기화

userRouter.route("/setPoint").post(setCashbackPoint); // 캐시백 포인트 적립/사용
userRouter.route("/getPointInfo/:name").get(getCashbackInfo); // 특정 유저의 캐시백 정보
userRouter.route("/exchange").post(exchange); // 포인트 -> 달러로 환전

export default userRouter;
