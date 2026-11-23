import data from "virtual:my-table/events";
import { CLIENT_SCRIPT, createApp } from "./app.tsx";

// 開発サーバーでは Vite がソースをそのまま変換して配信する。ビルド後は静的アセットを指す
const clientScript = import.meta.env.DEV ? "/src/client/main.tsx" : CLIENT_SCRIPT;

// 開発サーバーでは、ブラウザの再読み込みを伝える Vite のクライアントもページに入れる
const devClientScript = import.meta.env.DEV ? "/@vite/client" : undefined;

export default createApp(data, { clientScript, devClientScript });
