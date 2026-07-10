//현재 날짜
const now = new Date();

const year = now.getFullYear();
const month = now.getMonth() + 1;
const date = now.getDate();

const dateElement = document.querySelector(".greeting-date");

dateElement.textContent = `${year}년 ${month}월 ${date}일`;

// 시간별 인사말
const hour = now.getHours();

const greetingElement = document.querySelector(".greeting-message");

if (hour >= 5 && hour < 11) {
  greetingElement.textContent = "좋은 아침이에요 , ";
} else if (hour >= 11 && hour < 17) {
  greetingElement.textContent = "좋은 오후에요 , ";
} else if (hour >= 17 && hour < 22) {
  greetingElement.textContent = "좋은 저녁이에요 , ";
} else {
  greetingElement.textContent = "안녕하세요 , ";
}
