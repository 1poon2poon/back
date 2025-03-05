import express from "express";
import { donate, getDonationInfo, setDonationGoal } from "../controllers/userController.js";

const donateRouter = express.Router();

donateRouter.route("/getDonateInfo/:name").get(getDonationInfo); // 특정 유저의 기부 현황 조회
donateRouter.route("/setDonate").post(setDonationGoal); // 기부 목표 설정
donateRouter.route("/donation").post(donate); // 기부하기

export default donateRouter;
