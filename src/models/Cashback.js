import mongoose from "mongoose";

const cashbackSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  points: { type: Number, default: 0 }, // 현재 포인트
  history: { type: mongoose.Schema.Types.ObjectId, ref: "History" }, // 포인트 적립/사용 내역
});

const Cashback = mongoose.model("Cashback", cashbackSchema);
export default Cashback;
