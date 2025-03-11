import axios from "axios";

// 🔗 환율 데이터 가져오기
export const fetchRate = async () => {
  try {
    const res = await axios.get("https://m.search.naver.com/p/csearch/content/qapirender.nhn", {
      params: {
        key: "calculator",
        pkid: 141,
        q: "환율",
        where: "m",
        u1: "keb",
        u6: "standardUnit",
        u7: 0,
        u3: "USD",
        u4: "KRW",
        u8: "down",
        u2: 1,
      },
    });
    const rateStr = res.data?.country?.[1]?.value?.replace(",", "");
    return rateStr;
  } catch (err) {
    console.error("❌ 환율 정보 가져오기 실패:", err);
  }
};

// 🔗 뱅커스 라운딩 메소드
export const bankersRound = (value, decimals = 2) => {
  const factor = Math.pow(10, decimals);
  const scaledValue = value * factor;
  const roundedValue = Math.round(scaledValue);

  // 소수점 이하 .5일 때 짝수 쪽으로 반올림
  if (Math.abs(scaledValue - roundedValue) === 0.5) {
    return (Math.floor(roundedValue / 2) * 2) / factor;
  }

  return roundedValue / factor;
};
