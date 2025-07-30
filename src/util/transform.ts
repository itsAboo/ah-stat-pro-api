import { IPostPopulated } from "../controllers/post.controller";
import { getMaxByKey } from "./array";

export const parseDateString = (dateStr: string): Date | null => {
  const parts = dateStr.split("/");
  if (parts.length !== 3) return null;

  const day = parseInt(parts[0], 10);
  const month = parseInt(parts[1], 10) - 1;
  const year = parseInt(parts[2], 10);

  if (
    isNaN(day) ||
    isNaN(month) ||
    isNaN(year) ||
    day < 1 ||
    day > 31 ||
    month < 0 ||
    month > 11
  ) {
    return null;
  }

  return new Date(year, month, day);
};

export const transformPost = (post: IPostPopulated) => {
  const handicapMovements = post.handicapMovements;

  const maxWin = getMaxByKey(handicapMovements, "winRate", "totalMatches");
  const maxDraw = getMaxByKey(handicapMovements, "drawRate", "totalMatches");
  const maxLost = getMaxByKey(handicapMovements, "lostRate", "totalMatches");

  const maxHomeWin = getMaxByKey(
    handicapMovements
      .filter((e) => e.type === "HDP" && e.ahSide === "HOME")
      .sort((a, b) => b.totalMatches - a.totalMatches),
    "winRate"
  );
  const maxAwayWin = getMaxByKey(
    handicapMovements
      .filter((e) => e.type === "HDP" && e.ahSide === "AWAY")
      .sort((a, b) => b.totalMatches - a.totalMatches),
    "winRate"
  );
  const maxOUWin = getMaxByKey(
    handicapMovements
      .filter((e) => e.type === "OU")
      .sort((a, b) => b.totalMatches - a.totalMatches),
    "winRate"
  );

  return {
    ...post,
    _id: undefined,
    id: post._id,
    userId: undefined,
    author: post.userId?.name || post.userId?.username,
    handicapMovements: [...post.handicapMovements],
    mostWin: maxWin?.winRate! > 0 ? sanitizeMax(maxWin) : null,
    mostDraw: maxDraw?.drawRate! > 0 ? sanitizeMax(maxDraw) : null,
    mostLost: maxLost?.lostRate! > 0 ? sanitizeMax(maxLost) : null,
    mostHomeWin: maxHomeWin ? sanitizeMax(maxHomeWin) : null,
    mostAwayWin: maxAwayWin ? sanitizeMax(maxAwayWin) : null,
    mostOUWin: maxOUWin ? sanitizeMax(maxOUWin) : null,
  };
};

function sanitizeMax(maxObj: any) {
  if (typeof maxObj.toObject === "function") {
    maxObj = maxObj.toObject();
  }
  return {
    ...maxObj,
    _id: undefined,
    postId: undefined,
    matches: undefined,
  };
}
