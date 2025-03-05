import axios from "axios";
import User from "../models/User.js";
import Cashback from "../models/Cashback.js";
import Invest from "../models/Invest.js";

// 특정 카테고리에 대한 etf 데이터 불러오기 - symbol(tech, finance, healthcare, esg, reit, consumer) params로 입력 받음
export const getEtfData = async (req, res) => {
  const { symbol } = req.params;

  // ✅ 5년치 데이터를 한 번에 가져오기
  const now = Math.floor(Date.now() / 1000);
  const period1 = now - 86400 * 365 * 5; // 5년 전

  try {
    const url = `https://query1.finance.yahoo.com/v8/finance/chart/${symbol}?period1=${period1}&period2=${now}&interval=1d`;
    console.log(`📢 Fetching 5 years ETF Data: Symbol=${symbol}`);

    const response = await axios.get(url);
    const result = response.data?.chart?.result?.[0];

    if (!result) {
      console.warn(`⚠️ No data found for ${symbol}`);
      return res.status(404).json({ error: `ETF 데이터 없음 (${symbol})` });
    }

    res.json(response.data);
  } catch (error) {
    console.error(`❌ Error fetching data for ${symbol}:`, error.response?.data || error.message);
    res.status(500).json({ error: "ETF 데이터를 가져오는 중 오류 발생" });
  }
};

// ETF 구매하기(post) - body로 name, etfName, price, changeRate, quantity 입력 받음
export const purchaseETF = (req, res) => {
  const { name, etfName, price, changeRate, quantity } = req.body;

  // 입력값 유효성 검사
  if (!name || !etfName || typeof quantity !== "number" || quantity <= 0) {
    return res
      .status(400)
      .json({ error: "잘못된 입력입니다. 유효한 이름, ETF 이름, 수량을 입력하세요." });
  }

  User.findOne({ name: name })
    .populate("cashback")
    .populate("invest")
    .then((user) => {
      if (!user) {
        return res.status(404).json({ error: "해당 유저가 존재하지 않습니다." });
      }

      if (price * quantity > user.cashback.points) {
        return res.status(404).json({ error: "보유 포인트가 부족합니다." });
      }

      // ETF 정보 추가
      const existingETF = user.invest.ownedETFs.find((etf) => etf.name === etfName);
      if (existingETF) {
        // 이미 보유하고 있는 ETF의 경우 수량 증가
        existingETF.quantity += quantity;
      } else {
        // 새로운 ETF 추가
        user.invest.ownedETFs.push({
          name: etfName,
          price: price,
          changeRate: changeRate,
          quantity: quantity,
        });
      }

      user.cashback.points -= price * quantity;
      const time = new Date().toLocaleTimeString([], {
        hour: "2-digit",
        minute: "2-digit",
        hour12: false,
      });
      // 캐시백 기록에 추가
      user.cashback.history.push({
        name: `${etfName} 구매`,
        day: new Date().toLocaleDateString(),
        time: time,
        change: -(price * quantity),
        finalPoints: user.cashback.points,
      });

      user.cashback.save();
      return user.invest.save();
    })
    .then((updatedInvest) => {
      return res.status(200).json(updatedInvest);
    })
    .catch((error) => {
      console.error(error);
      if (!res.headersSent) {
        return res.status(500).json({ error: error.message });
      }
    });
};

// ETF 판매하기(post) - body로 name, etfName, quantity 입력 받음
export const sellETF = (req, res) => {
  const { name, etfName, quantity } = req.body;

  // 입력값 유효성 검사
  if (!name || !etfName || typeof quantity !== "number" || quantity <= 0) {
    return res
      .status(400)
      .json({ error: "잘못된 입력입니다. 유효한 이름, ETF 이름, 수량을 입력하세요." });
  }

  User.findOne({ name: name })
    .populate("cashback")
    .populate("invest")
    .then((user) => {
      if (!user) {
        return res.status(404).json({ error: "해당 유저가 존재하지 않습니다." });
      }

      // 보유 ETF에서 판매할 ETF 찾기
      const existingETF = user.invest.ownedETFs.find((etf) => etf.name === etfName);
      if (!existingETF) {
        return res.status(404).json({ error: "해당 ETF를 보유하고 있지 않습니다." });
      }

      // 판매할 수량이 보유 수량보다 많으면 에러 처리
      if (quantity > existingETF.quantity) {
        return res.status(400).json({ error: "판매할 수량이 보유 수량보다 많습니다." });
      }

      // 판매 후 수량 업데이트
      existingETF.quantity -= quantity;

      // 수량이 0이 되면 ETF 제거
      if (existingETF.quantity === 0) {
        user.invest.ownedETFs = user.invest.ownedETFs.filter((etf) => etf.name !== etfName);
      }

      // 판매 금액 계산
      const totalSaleAmount = existingETF.price * quantity; // TODO: 실시간 가격으로 수정해야됨

      // 캐시백 포인트에 판매 금액 추가
      user.cashback.points += totalSaleAmount;

      // 캐시백 기록에 추가
      const time = new Date().toLocaleTimeString([], {
        hour: "2-digit",
        minute: "2-digit",
        hour12: false,
      });
      user.cashback.history.push({
        name: `${etfName} 판매`,
        day: new Date().toLocaleDateString(),
        time: time,
        change: totalSaleAmount,
        finalPoints: user.cashback.points,
      });

      return Promise.all([user.cashback.save(), user.invest.save()]);
    })
    .then(() => {
      return res.status(200).json({ message: "ETF 판매가 완료되었습니다." });
    })
    .catch((error) => {
      console.error(error);
      if (!res.headersSent) {
        return res.status(500).json({ error: error.message });
      }
    });
};

// 관심 ETF 추가 or 삭제(post) - body로 name, etfName, price, changeRate 입력 받음
export const setInterestedETF = (req, res) => {
  const { name, etfName, price, changeRate } = req.body;

  // 입력값 유효성 검사
  if (!name || !etfName) {
    return res
      .status(400)
      .json({ error: "잘못된 입력입니다. 유효한 이름과 ETF 이름을 입력하세요." });
  }

  User.findOne({ name: name })
    .populate("invest")
    .then((user) => {
      if (!user) {
        return res.status(404).json({ error: "해당 유저가 존재하지 않습니다." });
      }

      // 이미 관심 ETF 목록에 있는지 확인
      const existingETFIndex = user.invest.interestedETFs.findIndex((etf) => etf.name === etfName);

      if (existingETFIndex !== -1) {
        // 이미 관심 ETF 목록에 있는 경우 삭제
        user.invest.interestedETFs.splice(existingETFIndex, 1);
        return user.invest.save().then(() => {
          return res
            .status(200)
            .json({ message: `${etfName}가 관심 ETF 목록에서 삭제되었습니다.` });
        });
      } else {
        // 관심 ETF 추가
        const interEtf = {
          name: etfName,
          price: price,
          changeRate: changeRate,
        };

        user.invest.interestedETFs.push(interEtf);
        return user.invest.save().then(() => {
          return res.status(200).json({ message: `${etfName}가 관심 ETF 목록에 추가되었습니다.` });
        });
      }
    })
    .catch((error) => {
      console.error(error);
      if (!res.headersSent) {
        return res.status(500).json({ error: error.message });
      }
    });
};

// 구매한 ETF 조회하기(get) - params로 name 입력 받음
export const getPurchasedETFs = (req, res) => {
  const { name } = req.params;

  User.findOne({ name: name })
    .populate("invest")
    .then((user) => {
      if (!user) {
        return res.status(404).json({ error: "해당 유저가 존재하지 않습니다." });
      }

      // 구매한 ETF 목록이 없으면 빈 배열 반환
      const purchasedETFs = user.invest.ownedETFs || [];
      return res.status(200).json(purchasedETFs);
    })
    .catch((error) => {
      console.error(error);
      if (!res.headersSent) {
        return res.status(500).json({ error: error.message });
      }
    });
};

// 관심 ETF 조회하기(get) - params로 name 입력 받음
export const getInterestedETFs = (req, res) => {
  const { name } = req.params;

  User.findOne({ name: name })
    .populate("invest")
    .then((user) => {
      if (!user) {
        return res.status(404).json({ error: "해당 유저가 존재하지 않습니다." });
      }

      // 관심 ETF 목록이 없으면 빈 배열 반환
      const interestedETFs = user.invest.interestedETFs || [];
      return res.status(200).json(interestedETFs);
    })
    .catch((error) => {
      console.error(error);
      if (!res.headersSent) {
        return res.status(500).json({ error: error.message });
      }
    });
};
