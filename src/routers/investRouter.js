import express from "express";
import {
  setInterestedETF,
  getEtfData,
  purchaseETF,
  sellETF,
  getPurchasedETFs,
  getInterestedETFs,
} from "../controllers/investController.js";

const investRouter = express.Router();

investRouter.route("/getData/:symbol").get(getEtfData); // 특정 카테고리에 대한 etf 데이터 불러오기
investRouter.route("/purchase").post(purchaseETF); // etf 구매하기
investRouter.route("/sell").post(sellETF); // etf 판매하기
investRouter.route("/setInterestEtf").post(setInterestedETF); // 관심 etf 추가/삭제

investRouter.route("/getPurchaseEtf/:name").get(getPurchasedETFs); // 구매한 etf 조회
investRouter.route("/getInterestEtf/:name").get(getInterestedETFs); // 관심 etf 조회

export default investRouter;
