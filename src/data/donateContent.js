export const getContent = (category) => {
  switch (category) {
    case "사회 복지":
      return "따뜻한 마음으로 보내주신 기부금은\n소외된 이웃과 어려운 가정을 돕고\n누구나 행복한 사회를 만들기 위해 사용됩니다.\n이에 깊은 존경과 감사의 마음을 담아\n이 증서를 드립니다.";
    case "교육 문화":
      return "소중한 기부금은 배움의 기회를 넓히고\n모든 아이들이 꿈을 키울 수 있도록\n장학금과 교육 지원에 사용됩니다.\n이 따뜻한 나눔에 감사드리며,\n존경과 감사를 담아 이 증서를 드립니다.";
    case "환경 동물":
      return "보내주신 기부금은 깨끗한 환경을 지키고\n소중한 생명을 보호하는 데 쓰입니다.\n함께 만드는 지속 가능한 미래를 위해\n귀하의 따뜻한 마음을 기념하며\n이 증서를 드립니다.";
    case "의료 건강":
      return "사랑과 정성을 담아 보내주신 기부금은\n환자들의 치료와 건강한 삶을 위해 사용됩니다.\n더 나은 의료 환경을 만들기 위한\n귀한 나눔에 깊이 감사드리며\n이 증서를 드립니다.";
    case "국제 구호":
      return "소중한 기부금은 재난과 전쟁으로\n고통받는 이들에게 도움의 손길이 됩니다.\n더 나은 세상을 위한 따뜻한 연대에\n깊이 감사드리며, 존경의 마음을 담아\n이 증서를 드립니다.";
    case "공익 인권":
      return "귀하의 기부는 평등하고 공정한 사회를 위한\n소중한 밑거름이 됩니다.\n인권과 정의를 지키는 귀한 나눔에\n깊은 감사를 담아 이 증서를 드립니다.";
  }
};

export const getAnimation = (category) => {
  switch (category) {
    case "사회 복지":
      return "cloud";
    case "교육 문화":
      return "paper";
    case "환경 동물":
      return "dog";
    case "의료 건강":
      return "beat";
    case "국제 구호":
      return "wave";
    case "공익 인권":
      return "feather";
  }
};
