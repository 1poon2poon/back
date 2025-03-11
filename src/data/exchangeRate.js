import axios from "axios";

const fetchRate = async () => {
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

export default fetchRate;
