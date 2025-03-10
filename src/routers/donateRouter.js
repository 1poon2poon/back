import express from "express";
import {
  completeDonation,
  donate,
  getDonationInfo,
  setDonationGoal,
} from "../controllers/donateController.js";

const donateRouter = express.Router();

donateRouter.route("/getDonateInfo/:name").get(getDonationInfo); // 특정 유저의 기부 현황 조회
donateRouter.route("/setDonate").post(setDonationGoal); // 기부 목표 설정
donateRouter.route("/donation").post(donate); // 목표 금액 채우기
donateRouter.route("/complete").put(completeDonation); // 목표 기부 금액 달성 후 기부하기

export default donateRouter;
