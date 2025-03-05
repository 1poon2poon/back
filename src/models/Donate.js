import mongoose from "mongoose";

const donateSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  targetAmount: { type: Number, required: true }, // 목표 금액
  currentAmount: { type: Number, default: 0 }, // 현재 기부 금액
  badges: {
    type: [String],
    enum: [
      "사회 & 복지",
      "교육 & 문화",
      "환경 & 동물 보호",
      "의료 & 건강",
      "국제 & 구호",
      "공익 & 인권",
    ],
    default: [],
  },
});

const Donate = mongoose.model("Donate", donateSchema);
export default Donate;
