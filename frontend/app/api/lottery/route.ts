import { NextResponse } from "next/server";
import {
  lotteryWeeklySchedule,
  LOTTERY_DRAW_TIME,
  LOTTERY_VENUE,
  LOTTERY_OFFICIAL_URL,
} from "@/config/kerala-lottery";

export const dynamic = "force-dynamic";

export type LotteryDay = {
  weekday: number;
  weekdayLabel: string;
  ticketName: string;
  seriesCode: string;
  firstPrizeInr: number;
  /** ISO date (IST) this draw next falls on. */
  date: string;
  isToday: boolean;
};

export type LotteryPayload = {
  /** Draws for the coming week, starting today (IST). */
  week: LotteryDay[];
  drawTime: string;
  venue: string;
  officialUrl: string;
  updatedAt: string;
};

const WEEKDAY_LABELS = [
  "Sunday",
  "Monday",
  "Tuesday",
  "Wednesday",
  "Thursday",
  "Friday",
  "Saturday",
];

/** Current date in IST, independent of server timezone. */
function istNow(): Date {
  const now = new Date();
  const utcMs = now.getTime() + now.getTimezoneOffset() * 60_000;
  return new Date(utcMs + 5.5 * 60 * 60_000);
}

export async function GET() {
  const today = istNow();
  const todayDow = today.getDay();

  const week: LotteryDay[] = Array.from({ length: 7 }, (_, offset) => {
    const d = new Date(today);
    d.setDate(today.getDate() + offset);
    const dow = d.getDay();
    const draw = lotteryWeeklySchedule.find((s) => s.weekday === dow);
    return {
      weekday: dow,
      weekdayLabel: WEEKDAY_LABELS[dow],
      ticketName: draw?.ticketName ?? "—",
      seriesCode: draw?.seriesCode ?? "—",
      firstPrizeInr: draw?.firstPrizeInr ?? 0,
      date: d.toISOString().slice(0, 10),
      isToday: dow === todayDow && offset === 0,
    };
  });

  return NextResponse.json(
    {
      week,
      drawTime: LOTTERY_DRAW_TIME,
      venue: LOTTERY_VENUE,
      officialUrl: LOTTERY_OFFICIAL_URL,
      updatedAt: new Date().toISOString(),
    } satisfies LotteryPayload,
    { headers: { "Cache-Control": "no-store" } },
  );
}
