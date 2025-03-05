import mongoose from "mongoose";

mongoose.connect(process.env.DB_URL); //mongosh(mongo shell 여는 명령어)를 통해 db url 가져온후 mongoose로 연결

const db = mongoose.connection; //객체에 db 접근 권한 주기

const handleError = (error) => console.log("❌ DB Error", error);
const handleOpen = () => console.log("✅ Connected to DB");

db.on("error", handleError); // 에러 텍스트 표시
db.once("open", handleOpen); // 연결 알림(한번만 뜨도록 on 대신 once를 사용)
