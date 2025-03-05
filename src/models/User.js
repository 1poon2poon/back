import mongoose from "mongoose";

const userSchema = new mongoose.Schema({
  name: { type: String, required: true },
  cashbackStatus: {
    bus: { type: Boolean, default: true },
    taxi: { type: Boolean, default: true },
    convenienceStore: { type: Boolean, default: true },
    movie: { type: Boolean, default: true },
    fastFood: { type: Boolean, default: true },
    cafe: { type: Boolean, default: true },
  },
  cashbackStamps: { type: [Number], default: [] }, // 100 또는 500 값 저장
  cashback: { type: mongoose.Schema.Types.ObjectId, ref: "Cashback" },
  donate: { type: mongoose.Schema.Types.ObjectId, ref: "Donate" },
  invest: { type: mongoose.Schema.Types.ObjectId, ref: "Invest" },
});

const User = mongoose.model("User", userSchema);
export default User;
