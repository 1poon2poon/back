import mongoose from "mongoose";

const historySchema = new mongoose.Schema({
  c_id: { type: mongoose.Schema.Types.ObjectId, ref: "Cashback", required: true },
  pointHistory: {
    type: [
      {
        name: String, // 입출금 위치
        day: String, // 요일
        time: String, // 시간 (예: "14:30")
        change: Number, // 증감 포인트
        finalPoints: Number, // 변동 후 포인트
      },
    ],
    default: [],
  },
  dollarHistory: {
    type: [
      {
        name: String, // 입출금 위치
        day: String, // 요일
        time: String, // 시간 (예: "14:30")
        change: Number, // 증감 달러
        finalDollars: Number, // 변동 후 달러
      },
    ],
    default: [],
  },
});

const History = mongoose.model("History", historySchema);
export default History;
