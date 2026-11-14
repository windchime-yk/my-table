// 時刻の計算。データの時刻は "HH:MM" で、日をまたぐ深夜帯は "24:30" のように24時以降で書かれている。
// 並べ替えや比較は、その日の 0:00 からの分に直して行う

/** "HH:MM" を、その日の 0:00 からの分にする。日をまたぐ "24:30" は 1470 になる */
export function toMinutes(time: string): number {
  const [h, m] = time.split(":").map(Number);
  return h * 60 + m;
}

/** 分を "HH:MM" にする。24時以降は、データと同じく "24:30" の形のまま出す */
export function formatMinutes(minutes: number): string {
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  return `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}`;
}
