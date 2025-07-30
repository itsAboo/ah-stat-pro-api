import mongoose from "mongoose";

export const connectDB = async (cb: () => void) => {
  const DB_URI = process.env.DB_URI as string;
  try {
    await mongoose.connect(DB_URI, { dbName: "AHStatsProDB" });
    console.log("Connect DB Success");
    cb();
  } catch (error) {
    console.log(
      error instanceof Error ? error.message : "Something went wrong at DB"
    );
  }
};
