import axios from "axios";

export const api = axios.create({
  baseURL: "https://agen-back.vercel.app/",
});
