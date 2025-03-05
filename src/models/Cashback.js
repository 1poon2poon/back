import mongoose from "mongoose";

const cashbackSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  points: { type: Number, default: 0 },
  history: {
    type: [
      {
        name: String, // 입출금 위치
        day: String, // 요일
        time: String, // 시간 (예: "14:30")
        change: Number, // 증감 포인트
        finalPoints: Number, // 변동 후 포인트
      },
    ],
    default: [], // 기본값 설정
  },
});

const Cashback = mongoose.model("Cashback", cashbackSchema);
export default Cashback;
