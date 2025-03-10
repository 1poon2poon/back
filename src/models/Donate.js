import mongoose, { mongo } from "mongoose";

const donateSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  totalAmount: { type: Number, default: 0 }, // 누적 기부 금액
  targetAmount: { type: Number, default: 0 }, // 목표 기부 금액
  currentAmount: { type: Number, default: 0 }, // 현재 기부 금액
  category: {
    // 기부 카테고리
    type: String,
    enum: [
      "none",
      "사회 복지",
      "교육 문화",
      "환경 동물 보호",
      "의료 건강",
      "국제 구호",
      "공익 인권",
    ],
    default: "none",
  },
  history: {
    type: [
      {
        badge: {
          type: String,
          enum: ["사회 복지", "교육 문화", "환경 동물 보호", "의료 건강", "국제 구호", "공익 인권"],
        },
        donateInfo: {
          username: String,
          donateAmount: Number,
          content: String,
          day: String,
          animation: String,
        },
      },
    ],
    default: [],
  }, // 기부 내역
});

const Donate = mongoose.model("Donate", donateSchema);
export default Donate;
