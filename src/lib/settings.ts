import { connectDB } from "@/lib/db";
import { type IUserSettings, UserSettings } from "@/lib/models";

export async function getOrCreateUserSettings(
  userId: string,
): Promise<IUserSettings> {
  await connectDB();

  const settings = await UserSettings.findOneAndUpdate(
    { userId },
    {
      $setOnInsert: {
        userId,
        timezone: "Asia/Dhaka",
        dailyCapMinutes: 240,
        recapCapMinutes: 30,
        passScore: 70,
        restWeekdays: [],
        reviewWeekday: 5,
        planGenHour: 23,
      },
    },
    { new: true, upsert: true, setDefaultsOnInsert: true },
  ).lean();

  return settings as unknown as IUserSettings;
}
