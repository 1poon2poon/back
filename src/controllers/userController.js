import User from "../models/User.js";
import Cashback from "../models/Cashback.js";
import Donate from "../models/Donate.js";
import Invest from "../models/Invest.js";
import { getAnimation, getContent } from "../data/donateContent.js";

// 🚀 유저 조회(get) - params로 name 입력받음
export const getUserData = (req, res) => {
  const { name } = req.params;
  console.log(name);

  User.findOne({ name: name })
    .populate("cashback") // cashback 데이터 populate
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
        // 추가된 데이터
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

// 🚀 유저 생성(post)
export const postUserData = (req, res) => {
  const { cashback = {}, donate = {}, invest = {}, ...userData } = req.body;

  User.create(userData)
    .then((user) => {
      // cashback, donate, invest 생성
      return Promise.all([
        Cashback.create({ user: user._id, ...cashback }), // cashback 생성
        Donate.create({ user: user._id, ...donate }), // donate 생성
        Invest.create({ user: user._id, ...invest }), // invest 생성
      ]).then(([cashbackDoc, donateDoc, investDoc]) => {
        // 생성된 ID를 User 모델에 저장
        user.cashback = cashbackDoc._id;
        user.donate = donateDoc._id;
        user.invest = investDoc._id;
        return user.save(); // User 모델 업데이트
      });
    })
    .then((user) => {
      return res.status(201).json(user);
    })
    .catch((error) => {
      console.error("유저 생성 오류:", error);
      return res.status(500).json({ error: error.message });
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
      return res.status(200).json(updatedUser);
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
      return res.status(200).json(updatedUser);
    })
    .catch((error) => {
      console.error(error); // 에러 로그 추가
      if (!res.headersSent) {
        return res.status(500).json({ error: error.message });
      }
    });
};

// 🚀 캐시백 포인트 증가/감소(post) - body로 name, point, origin 입력 받음
export const setCashbackPoint = (req, res) => {
  const { name, point, origin } = req.body;

  // 포인트가 유효한지 확인
  if (typeof point !== "number") {
    return res.status(400).json({ error: "잘못된 포인트 값입니다." });
  }

  User.findOne({ name: name })
    .populate("cashback")
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
      user.cashback.history.push({
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

      return user.cashback.save(); // 캐시백 모델 업데이트
    })
    .then((updatedCashback) => {
      return res.status(200).json(updatedCashback);
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
    .populate("cashback") // cashback 데이터 populate
    .then((user) => {
      if (!user) {
        return res.status(404).json({ error: "해당 유저가 존재하지 않습니다." });
      }

      const cashbackInfo = {
        points: user.cashback.points,
        history: user.cashback.history,
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

// 🚀 특정 유저의 기부 정보 조회(get) - params로 name 입력받음
export const getDonationInfo = (req, res) => {
  const { name } = req.params;

  User.findOne({ name: name })
    .populate("donate") // donate 데이터 populate
    .then((user) => {
      if (!user) {
        return res.status(404).json({ error: "해당 유저가 존재하지 않습니다." });
      }

      // 기부 정보가 없을 경우
      if (!user.donate || user.donate.category === "none") {
        return res.status(404).json({ error: "기부 정보가 설정되어 있지 않습니다." });
      }

      const donationInfo = {
        badges: user.donate.badges,
        category: user.donate.category,
        targetAmount: user.donate.targetAmount,
        currentAmount: user.donate.currentAmount,
      };

      return res.status(200).json(donationInfo);
    })
    .catch((error) => {
      console.error(error);
      if (!res.headersSent) {
        return res.status(500).json({ error: error.message });
      }
    });
};

// 🚀 특정 유저의 기부 카테고리와 목표 금액 설정(post) - body로 name, category, targetAmount 입력 받음
export const setDonationGoal = (req, res) => {
  const { name, category, targetAmount } = req.body;

  // 입력값 유효성 검사
  const validCategories = [
    "사회 복지",
    "교육 문화",
    "환경 동물 보호",
    "의료 건강",
    "국제 구호",
    "공익 인권",
  ];

  // 필수 입력값 및 카테고리 유효성 검사
  if (
    !name ||
    !category ||
    !validCategories.includes(category) ||
    typeof targetAmount !== "number" ||
    targetAmount < 0
  ) {
    return res.status(400).json({ error: "잘못된 입력입니다. 유효한 카테고리를 입력하세요." });
  }

  User.findOne({ name: name })
    .populate("donate") // donate 데이터 populate
    .then((user) => {
      if (!user) {
        return res.status(404).json({ error: "해당 유저가 존재하지 않습니다." });
      }
      console.log(user);

      // 기부 정보가 있을 경우 카테고리와 목표 금액 설정
      user.donate.category = category; // 카테고리 설정
      user.donate.targetAmount = targetAmount; // 목표 금액 설정

      return user.donate.save();
    })
    .then((updatedUser) => {
      return res.status(200).json(updatedUser);
    })
    .catch((error) => {
      console.error(error);
      if (!res.headersSent) {
        return res.status(500).json({ error: error.message });
      }
    });
};

// 🚀 기부하기(post) - body로 name과 amount 입력 받음
export const donate = (req, res) => {
  const { name, amount } = req.body;

  // 입력값 유효성 검사
  if (!name || typeof amount !== "number" || amount <= 0) {
    return res.status(400).json({ error: "잘못된 입력입니다. 유효한 이름과 금액을 입력하세요." });
  }

  User.findOne({ name: name })
    .populate("donate") // donate 데이터 populate
    .populate("cashback")
    .then((user) => {
      if (!user) {
        return res.status(404).json({ error: "해당 유저가 존재하지 않습니다." });
      }

      // 기부 정보가 없으면 에러 처리
      if (!user.donate || user.donate.category === "none") {
        return res.status(400).json({ error: "기부 정보가 설정되어 있지 않습니다." });
      }

      // 기부하려는 금액이 보유한 금액보다 많으면 에러 처리
      if (amount > user.cashback.points) {
        return res.status(400).json({ error: "보유한 포인트가 부족합니다." });
      }

      // 현재 기부 금액 업데이트
      user.donate.currentAmount += amount;
      user.cashback.points -= amount;

      const time = new Date().toLocaleTimeString([], {
        hour: "2-digit",
        minute: "2-digit",
        hour12: false,
      });
      // 캐시백 기록에 추가
      user.cashback.history.push({
        name: `${user.donate.category} - 기부`,
        day: new Date().toLocaleDateString("ko-KR", {
          year: "numeric",
          month: "long",
          day: "numeric",
        }),
        time: time,
        change: -amount,
        finalPoints: user.cashback.points,
      });

      user.cashback.save();
      return user.donate.save(); // 기부 정보 업데이트
    })
    .then((updatedDonate) => {
      return res.status(200).json(updatedDonate);
    })
    .catch((error) => {
      console.error(error);
      if (!res.headersSent) {
        return res.status(500).json({ error: error.message });
      }
    });
};

// 🚀 목표 금액 달성 시 기부 정보 초기화 및 badges 업데이트(put) - body로 name 입력 받음
export const completeDonation = (req, res) => {
  const { name } = req.body;

  User.findOne({ name: name })
    .populate("donate")
    .then((user) => {
      if (!user) {
        return res.status(404).json({ error: "해당 유저가 존재하지 않습니다." });
      }

      const { donate } = user;

      if (donate.category === "none") {
        return res.status(404).json({ error: "목표 기부 카테고리를 설정하지 않았습니다." });
      }

      // 목표 금액을 채웠는지 확인
      if (donate.currentAmount === donate.targetAmount) {
        donate.totalAmount += donate.currentAmount; // 누적 기부 금액 업데이트
        donate.badges.push(donate.category); // 기부 뱃지 추가

        const donateInfo = {
          username: user.name,
          donateAmount: donate.targetAmount,
          content: getContent(donate.category),
          day: new Date().toLocaleDateString("ko-KR", {
            year: "numeric",
            month: "long",
            day: "numeric",
          }),
          animation: getAnimation(donate.category),
        };

        // 목표 금액, 현재 기부 금액, 기부 카테고리 초기화
        donate.targetAmount = 0;
        donate.currentAmount = 0;
        donate.category = "none"; // 기부 카테고리 초기화

        return donate.save().then(() => {
          return res.status(200).json({ message: "기부 목표가 달성되었습니다.", donateInfo });
        });
      } else {
        return res.status(400).json({ error: "목표 금액이 아직 채워지지 않았습니다." });
      }
    })
    .catch((error) => {
      console.error(error);
      if (!res.headersSent) {
        return res.status(500).json({ error: error.message });
      }
    });
};
