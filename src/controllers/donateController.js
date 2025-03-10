import User from "../models/User.js";
import { getAnimation, getContent } from "../data/donateContent.js";

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
      // if (!user.donate || user.donate.category === "none") {
      //   return res.status(404).json({ error: "기부 정보가 설정되어 있지 않습니다." });
      // }

      const donationInfo = {
        history: user.donate.history,
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
      const data = {
        totalAmount: updatedUser.totalAmount,
        targetAmount: updatedUser.targetAmount,
        currentAmount: updatedUser.currentAmount,
        category: updatedUser.category,
      };
      return res.status(200).json({ message: "기부 목표 설정 완료", data });
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
      user.cashback.history.pointHistory.push({
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
      user.cashback.history.save();
      return user.donate.save();
    })
    .then((updatedDonate) => {
      const resValue = {
        totalAmount: updatedDonate.totalAmount,
        targetAmount: updatedDonate.targetAmount,
        currentAmount: updatedDonate.currentAmount,
        category: updatedDonate.category,
      };
      return res.status(200).json({ message: "기부 성공", resValue });
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
        donate.history.push({ badge: donate.category, donateInfo });

        // 목표 금액, 현재 기부 금액, 기부 카테고리 초기화
        donate.targetAmount = 0;
        donate.currentAmount = 0;
        donate.category = "none"; // 기부 카테고리 초기화

        const responseData = donate.history;

        return donate.save().then(() => {
          return res.status(200).json({ message: "기부 목표가 달성되었습니다.", responseData });
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
