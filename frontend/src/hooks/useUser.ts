// Потребителят се пази в общ контекст (виж src/context/UserContext.tsx),
// за да не се зарежда отделно от всяка страница и от хедъра.
export { useUser } from "@/context/UserContext";
