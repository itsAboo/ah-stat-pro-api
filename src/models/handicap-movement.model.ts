import mongoose from "mongoose";

export interface IMatch {
  _id?: mongoose.Types.ObjectId;
  home: string;
  away: string;
  league: string;
  matchDay: Date;
  fullTimeScore: string;
  result: "W" | "L" | "D" | "P";
}

export interface IHandicapMovement {
  matches: IMatch[];
  postId: mongoose.Types.ObjectId;
  type: "HDP" | "OU";
  ahSide: "HOME" | "AWAY";
  start: string;
  end: string;
  winCount: number;
  lostCount: number;
  drawCount: number;
  totalMatches: number;
  winRate?: number;
  drawRate?: number;
  lostRate?: number;
}

const handicapMovementSchema = new mongoose.Schema<IHandicapMovement>(
  {
    postId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Post",
      required: true,
    },
    matches: {
      type: [
        {
          home: {
            type: String,
            trim: true,
          },
          away: {
            type: String,
            trim: true,
          },
          league: {
            type: String,
            trim: true,
          },
          matchDay: {
            type: Date,
            trim: true,
          },
          fullTimeScore: {
            type: String,
            default: "0-0",
          },
          result: {
            type: String,
            enum: ["W", "L", "D", "P"],
            default: "P",
          },
        },
      ],
      default: [],
    },
    ahSide: {
      type: String,
      enum: ["HOME", "AWAY"],
      default: "HOME",
    },
    type: {
      type: String,
      enum: ["HDP", "OU"],
      default: "HDP",
    },
    start: {
      type: String,
      required: true,
      validate: {
        validator: (value: string) => {
          const num = parseFloat(value);
          return !isNaN(num) && num % 0.25 === 0;
        },
        message: "Value must be a multiple of 0.25",
      },
      trim: true,
    },
    end: {
      type: String,
      required: true,
      validate: {
        validator: (value: string) => {
          const num = parseFloat(value);
          return !isNaN(num) && num % 0.25 === 0;
        },
        message: "Value must be a multiple of 0.25",
      },
      trim: true,
    },
    winCount: {
      type: Number,
      default: 0,
    },
    lostCount: {
      type: Number,
      default: 0,
    },
    drawCount: {
      type: Number,
      default: 0,
    },
    totalMatches: {
      type: Number,
      default: 0,
    },
  },
  { timestamps: true, toJSON: { virtuals: true }, toObject: { virtuals: true } }
);

handicapMovementSchema.pre("save", function (next) {
  const doc = this as IHandicapMovement;

  const validMatches = doc.matches.filter((match) =>
    ["W", "L", "D"].includes(match.result)
  );

  doc.winCount = validMatches.filter((match) => match.result === "W").length;
  doc.lostCount = validMatches.filter((match) => match.result === "L").length;
  doc.drawCount = validMatches.filter((match) => match.result === "D").length;
  doc.totalMatches = validMatches.length;

  next();
});

handicapMovementSchema.virtual("winRate").get(function () {
  const validMatches = this.matches.filter((match: IMatch) =>
    ["W", "L", "D"].includes(match.result)
  );
  const winCount = validMatches.filter(
    (match: IMatch) => match.result === "W"
  ).length;
  const winRate = (winCount / validMatches.length) * 100;
  return isNaN(winRate) ? 0 : winRate;
});

handicapMovementSchema.virtual("drawRate").get(function () {
  const validMatches = this.matches.filter((match: IMatch) =>
    ["W", "L", "D"].includes(match.result)
  );
  const drawCount = validMatches.filter(
    (match: IMatch) => match.result === "D"
  ).length;
  const drawRate = (drawCount / validMatches.length) * 100;
  return isNaN(drawRate) ? 0 : drawRate;
});

handicapMovementSchema.virtual("lostRate").get(function () {
  const validMatches = this.matches.filter((match: IMatch) =>
    ["W", "L", "D"].includes(match.result)
  );
  const lostCount = validMatches.filter(
    (match: IMatch) => match.result === "L"
  ).length;
  const lostRate = (lostCount / validMatches.length) * 100;
  return isNaN(lostRate) ? 0 : lostRate;
});

handicapMovementSchema.virtual("last5MatchWinRate").get(function () {
  const validMatches = this.matches.filter((m) => m.result !== "P");
  const last5 = validMatches
    .map((m, index) => ({
      result: m.result,
      matchDay: m.matchDay,
      originalIndex: index,
    }))
    .sort((a, b) => {
      const timeA = new Date(a.matchDay!).getTime();
      const timeB = new Date(b.matchDay!).getTime();
      if (timeA === timeB) {
        return b.originalIndex - a.originalIndex;
      }
      return timeB - timeA;
    })
    .slice(0, 5);

  if (last5.length === 0) return 0;

  const wins = last5.filter((match) => match.result === "W").length;

  return (wins / last5.length) * 100;
});

const HandicapMovement = mongoose.model(
  "HandicapMovement",
  handicapMovementSchema
);

export default HandicapMovement;
