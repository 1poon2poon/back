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
  ownedETFs: [ETFSchema], // 보유 ETF
  interestedETFs: [InterestETFSchema], // 관심 ETF
});

const Invest = mongoose.model("Invest", InvestSchema);
export default Invest;
