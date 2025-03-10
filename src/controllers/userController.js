import User from "../models/User.js";
import Cashback from "../models/Cashback.js";
import Donate from "../models/Donate.js";
import Invest from "../models/Invest.js";
import History from "../models/History.js";

// 🚀 유저 조회(get) - params로 name 입력받음
export const getUserData = (req, res) => {
  const { name } = req.params;
  console.log(name);

  User.findOne({ name: name })
    .populate({
      path: "cashback", // cashback 데이터 populate
      populate: {
        path: "history", // history 데이터 populate
      },
    })
    .populate("donate") // donate 데이터 populate
    .populate("invest") // invest 데이터 populate
    .then((user) => {
      if (!user) {
        return res.status(404).json({ error: "User not found" });
      }

      const responseUser = {
        name: user.name,
        cashbackStatus: user.cashbackStatus,
        cashbackStamps: user.cashbackStamps,
        cashback: user.cashback, // populate된 cashback 데이터
        donate: user.donate, // populate된 donate 데이터
        invest: user.invest, // populate된 invest 데이터
      };
      return res.status(200).json(responseUser);
    })
    .catch((error) => {
      console.error(error);
      if (!res.headersSent) {
        return res.status(500).json({ error: error.message });
      }
    });
};

// 🚀 유저 생성 (POST)
export const postUserData = async (req, res) => {
  try {
    const { ...userData } = req.body;

    // 유저 생성
    const user = await User.create(userData);

    // Cashback, Donate, Invest 생성
    const [cashbackDoc, donateDoc, investDoc] = await Promise.all([
      Cashback.create({ user: user._id }),
      Donate.create({ user: user._id }),
      Invest.create({ user: user._id }),
    ]);

    // History 생성 후 cashback에 연결
    const historyDoc = await History.create({ c_id: cashbackDoc._id });
    cashbackDoc.history = historyDoc._id;
    await cashbackDoc.save();

    user.cashback = cashbackDoc._id;
    user.donate = donateDoc._id;
    user.invest = investDoc._id;
    await user.save();

    return res.status(201).json(user);
  } catch (error) {
    console.error("유저 생성 오류:", error);
    return res.status(500).json({ error: error.message });
  }
};

// 🚀 스탬프 추가(post) - body로 name, value(100,500), stampType(bus,taxi,convenienceStore,movie,fastFood,cafe) 입력 받음
export const addCashbackStamp = (req, res) => {
  const { name, value, stampType } = req.body;

  if (value !== 100 && value !== 500) {
    return res.status(400).json({ error: "잘못된 value 값입니다." });
  }

  User.findOne({ name: name })
    .then((user) => {
      if (!user) {
        return res.status(404).json({ error: "해당 유저가 존재하지 않습니다." });
      }
      if (user.cashbackStatus[stampType] === false) {
        return res.status(400).json({ error: "오늘은 더이상 추가 못합니다!" });
      }

      return User.findOneAndUpdate(
        { name: name },
        {
          $push: { cashbackStamps: value },
          $set: { [`cashbackStatus.${stampType}`]: false },
        },
        { new: true }
      );
    })
    .then((updatedUser) => {
      const responseUser = {
        name: updatedUser.name,
        cashbackStatus: updatedUser.cashbackStatus,
        cashbackStamps: updatedUser.cashbackStamps,
      };
      return res.status(200).json(responseUser);
    })
    .catch((error) => {
      console.error(error);
      if (!res.headersSent) {
        return res.status(500).json({ error: error.message });
      }
    });
};

// 🚀 cashbackStatus 초기화 (영역 초기화)(put) - body로 name 입력 받음
export const resetCashbackStatus = (req, res) => {
  const { name } = req.body;
  console.log(name);

  User.findOneAndUpdate(
    { name: name },
    {
      cashbackStatus: {
        bus: true,
        taxi: true,
        convenienceStore: true,
        movie: true,
        fastFood: true,
        cafe: true,
      },
    },
    { new: true }
  )
    .then((updatedUser) => {
      if (!updatedUser) {
        return res.status(404).json({ error: "해당 유저가 존재하지 않습니다." });
      }
      return res.status(200).json({ message: "스탬프 영역 초기화 성공" });
    })
    .catch((error) => {
      console.error(error);
      if (!res.headersSent) {
        return res.status(500).json({ error: error.message });
      }
    });
};

// 🚀 cashbackStamps 배열 초기화(put) - body로 name 입력 받음
export const resetCashbackStamps = (req, res) => {
  const { name } = req.body; // 유저 이름을 요청 본문에서 가져옴
  console.log(name);

  User.findOneAndUpdate(
    { name: name },
    {
      cashbackStamps: [], // cashbackStamps를 빈 배열로 초기화
    },
    { new: true }
  )
    .then((updatedUser) => {
      if (!updatedUser) {
        return res.status(404).json({ error: "User not found" });
      }
      return res.status(200).json({ message: "스탬프 초기화 성공" });
    })
    .catch((error) => {
      console.error(error); // 에러 로그 추가
      if (!res.headersSent) {
        return res.status(500).json({ error: error.message });
      }
    });
};

// 🚀 캐시백 포인트 적립/사용(post) - body로 name, point, origin 입력 받음
export const setCashbackPoint = (req, res) => {
  const { name, point, origin } = req.body;

  // 포인트가 유효한지 확인
  if (typeof point !== "number") {
    return res.status(400).json({ error: "잘못된 포인트 값입니다." });
  }

  User.findOne({ name: name })
    .populate({
      path: "cashback",
      populate: {
        path: "history",
      },
    })
    .then((user) => {
      if (!user) {
        return res.status(404).json({ error: "해당 유저가 존재하지 않습니다." });
      }

      if (user.cashback.points + point < 0) {
        return res.status(400).json({ error: "포인트가 부족합니다." });
      }

      // 캐시백 포인트 추가
      user.cashback.points += point;

      // 캐시백 기록에 추가
      const time = new Date().toLocaleTimeString([], {
        hour: "2-digit",
        minute: "2-digit",
        hour12: false,
      });
      user.cashback.history.pointHistory.push({
        name: origin,
        day: new Date().toLocaleDateString("ko-KR", {
          year: "numeric",
          month: "long",
          day: "numeric",
        }),
        time: time,
        change: point,
        finalPoints: user.cashback.points,
      });

      user.cashback.history.save();
      return user.cashback.save(); // 캐시백 모델 업데이트
    })
    .then((updatedCashback) => {
      const resValue = {
        points: updatedCashback.points,
        history: updatedCashback.history.pointHistory,
      };
      return res.status(200).json(resValue);
    })
    .catch((error) => {
      console.error(error);
      if (!res.headersSent) {
        return res.status(500).json({ error: error.message });
      }
    });
};

// 🚀 특정 유저의 캐시백 정보 조회(get) - params로 name 입력 받음
export const getCashbackInfo = (req, res) => {
  const { name } = req.params;

  User.findOne({ name: name })
    .populate({
      path: "cashback",
      populate: {
        path: "history",
      },
    }) // cashback 데이터 populate
    .then((user) => {
      if (!user) {
        return res.status(404).json({ error: "해당 유저가 존재하지 않습니다." });
      }

      const cashbackInfo = {
        points: user.cashback.points,
        history: user.cashback.history.pointHistory,
      };

      return res.status(200).json(cashbackInfo);
    })
    .catch((error) => {
      console.error(error);
      if (!res.headersSent) {
        return res.status(500).json({ error: error.message });
      }
    });
};
