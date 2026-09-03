/**
 * Kerala State Lotteries — weekly draw schedule.
 *
 * Results themselves are only published as PDF gazettes on the official site,
 * with no API and no redistribution-friendly feed, so this panel shows the
 * *schedule* (which is fixed and public) and links out to the official result
 * page rather than scraping or republishing winning numbers.
 *
 * The department renames/reshuffles tickets periodically — edit this table when
 * that happens.
 */
export type LotteryDraw = {
  /** 0 = Sunday … 6 = Saturday, matching Date#getDay(). */
  weekday: number;
  ticketName: string;
  seriesCode: string;
  firstPrizeInr: number;
};

export const LOTTERY_DRAW_TIME = "3:00 PM IST";
export const LOTTERY_VENUE = "Gorky Bhavan, Thiruvananthapuram";
export const LOTTERY_OFFICIAL_URL = "https://statelottery.kerala.gov.in/index.php/lottery-result-view";

export const lotteryWeeklySchedule: LotteryDraw[] = [
  { weekday: 1, ticketName: "Bhagyathara",     seriesCode: "BT", firstPrizeInr: 10_000_000 },
  { weekday: 2, ticketName: "Sthree Sakthi",   seriesCode: "SS", firstPrizeInr: 7_500_000 },
  { weekday: 3, ticketName: "Dhanalekshmi",    seriesCode: "DL", firstPrizeInr: 10_000_000 },
  { weekday: 4, ticketName: "Karunya Plus",    seriesCode: "KN", firstPrizeInr: 8_000_000 },
  { weekday: 5, ticketName: "Suvarna Keralam", seriesCode: "SK", firstPrizeInr: 7_000_000 },
  { weekday: 6, ticketName: "Karunya",         seriesCode: "KR", firstPrizeInr: 8_000_000 },
  { weekday: 0, ticketName: "Samrudhi",        seriesCode: "SM", firstPrizeInr: 10_000_000 },
];
