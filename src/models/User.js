import mongoose from "mongoose";

const userSchema = new mongoose.Schema({
  name: { type: String, required: true },
  password: { type: String, required: true },
  cashbackStatus: {
    // 일일 스탬프 적립 상태
    bus: { type: Boolean, default: true },
    taxi: { type: Boolean, default: true },
    convenienceStore: { type: Boolean, default: true },
    movie: { type: Boolean, default: true },
    fastFood: { type: Boolean, default: true },
    cafe: { type: Boolean, default: true },
  },
  cashbackStamps: { type: [Number], default: [] }, // 스탬프(100 or 500) 값 저장
  cashback: { type: mongoose.Schema.Types.ObjectId, ref: "Cashback" }, // 캐시백 관련 정보
  donate: { type: mongoose.Schema.Types.ObjectId, ref: "Donate" }, // 기부 관련 정보
  invest: { type: mongoose.Schema.Types.ObjectId, ref: "Invest" }, // 투자 관련 정보
});

const User = mongoose.model("User", userSchema);
export default User;
