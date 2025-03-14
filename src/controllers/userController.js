import User from "../models/User.js";
import Cashback from "../models/Cashback.js";
import Donate from "../models/Donate.js";
import Invest from "../models/Invest.js";
import History from "../models/History.js";
import { fetchRate, bankersRound } from "../data/exchangeRate.js";

// 🚀 로그인 (POST) - body로 name, password 입력 받음
export const login = async (req, res) => {
  const { name, password } = req.body;

  const user = await User.findOne({ name: name });
  if (!user) {
    return res.status(404).json({ error: "해당 유저가 존재하지 않습니다.", success: false });
  } else if (user.password !== password) {
    return res.status(401).json({ error: "비밀번호가 일치하지 않습니다.", success: false });
  } else {
    return res.status(200).json({ message: "로그인 성공", success: true });
  }
};

// 🚀 유저 생성 (POST) - body로 name, password 입력 받음
export const postUserData = async (req, res) => {
  try {
    const { ...userData } = req.body;

    // 유저가 이미 존재하는지 확인
    const existingUser = await User.findOne({ name: userData.name });
    if (existingUser) {
      return res.status(400).json({ error: "이미 존재하는 유저 이름입니다." });
    }

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

// 🚀 유저 조회(get) - params로 name 입력받음
export const getUserData = (req, res) => {
  const { name } = req.params;

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
        dollars: user.cashback.dollars,
        pointHistory: user.cashback.history.pointHistory,
        dollarHistory: user.cashback.history.dollarHistory,
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

// 🚀 환전(post) - body로 name, amount, direction 입력 받음
export const exchange = async (req, res) => {
  try {
    const { name, amount, direction } = req.body;

    const user = await User.findOne({ name }).populate({
      path: "cashback",
      populate: { path: "history" },
    });

    // 유저가 존재하지 않을 때
    if (!user) {
      return res.status(404).json({ error: "해당 유저가 존재하지 않습니다." });
    }

    // 환율 정보 가져오기
    const rate = await fetchRate();
    if (!rate) {
      return res.status(500).json({ error: "환율 정보를 가져오는 데 실패했습니다." });
    }

    let exchangedAmount = 0; // 변환된 금액을 저장할 변수
    if (direction === "points") {
      // 환전하려는 달러보다 보유 달러가 적을 때
      if (amount > user.cashback.dollars) {
        return res.status(404).json({ error: "보유 달러가 부족합니다." });
      }

      // 환전 금액 계산
      exchangedAmount = bankersRound(amount * rate, 0);

      // 유저 포인트 차감 및 환전된 달러 추가
      user.cashback.dollars -= amount;
      user.cashback.dollars = bankersRound(user.cashback.dollars);

      user.cashback.points += exchangedAmount;
      user.cashback.points = bankersRound(user.cashback.points, 0);
    } else if (direction === "dollars") {
      // 환전하려는 포인트보다 보유 포인트보다 적을 때
      if (amount > user.cashback.points) {
        return res.status(404).json({ error: "보유 포인트가 부족합니다." });
      }

      // 환전 금액 계산
      exchangedAmount = bankersRound(amount / rate);
      exchangedAmount = parseFloat(exchangedAmount.toFixed(2));

      // 유저 포인트 차감 및 환전된 달러 추가
      user.cashback.points -= amount;
      user.cashback.points = bankersRound(user.cashback.points, 0);

      user.cashback.dollars += exchangedAmount;
      user.cashback.dollars = bankersRound(user.cashback.dollars);
    }

    // 캐시백 기록에 추가
    const time = new Date().toLocaleTimeString([], {
      hour: "2-digit",
      minute: "2-digit",
      hour12: false,
    });
    user.cashback.history.pointHistory.push({
      name: direction === "points" ? "포인트 환전" : "달러 환전",
      day: new Date().toLocaleDateString("ko-KR", {
        year: "numeric",
        month: "long",
        day: "numeric",
      }),
      time: time,
      change: direction === "points" ? exchangedAmount : -amount,
      finalPoints: user.cashback.points,
    });

    // 달러 기록에 추가
    user.cashback.history.dollarHistory.push({
      name: direction === "points" ? "포인트 환전" : "달러 환전",
      day: new Date().toLocaleDateString("ko-KR", {
        year: "numeric",
        month: "long",
        day: "numeric",
      }),
      time: time,
      change: direction === "points" ? -amount : exchangedAmount,
      finalDollars: user.cashback.dollars,
    });

    await user.cashback.history.save();
    await user.cashback.save();
    await user.save();

    // 클라이언트에게 응답 반환
    return res.status(200).json({
      message: "환전 성공",
      rate: rate,
      points: user.cashback.points,
      Dollars: user.cashback.dollars,
    });
  } catch (error) {
    console.error("❌ 환전 중 오류 발생:", error);
    return res.status(500).json({ error: error.message });
  }
};
