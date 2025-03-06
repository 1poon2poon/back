import mongoose from "mongoose";

const ETFSchema = new mongoose.Schema({
  name: String,
  price: Number,
  changeRate: Number,
  quantity: Number,
});

const InterestETFSchema = new mongoose.Schema({
  name: String,
  price: Number,
  changeRate: Number,
});

const InvestSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  category: { type: [String], default: [] }, // 관심 투자 카테고리
  ownedETFs: {
    type: [ETFSchema],
    default: [], // 기본값 설정
  }, // 보유 ETF
  interestedETFs: {
    type: [InterestETFSchema],
    default: [], // 기본값 설정
  }, // 관심 ETF
});

const Invest = mongoose.model("Invest", InvestSchema);
export default Invest;
