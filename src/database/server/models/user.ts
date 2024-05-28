import { eq } from 'drizzle-orm';

import { serverDB } from '@/database/server';
import { UserPreference } from '@/types/user';
import { UserSettings } from '@/types/user/settings';
import { merge } from '@/utils/merge';

import { NewUser, UserItem, userSettings, users } from '../schemas/lobechat';
import { SessionModel } from './session';

export class UserModel {
  createUser = async (params: NewUser) => {
    const [user] = await serverDB
      .insert(users)
      .values({ ...params })
      .returning();

    // Create an inbox session for the user
    const model = new SessionModel(user.id);

    await model.createInbox();
  };

  deleteUser = async (id: string) => {
    return serverDB.delete(users).where(eq(users.id, id));
  };

  findById = async (id: string) => {
    return serverDB.query.users.findFirst({ where: eq(users.id, id) });
  };

  getUserState = async (id: string) => {
    const result = await serverDB
      .select({
        isOnboarded: users.isOnboarded,
        preference: users.preference,
        settings: {
          tool: userSettings.tool,
          tts: userSettings.tts,
        },
      })
      .from(users)
      .where(eq(users.id, id))
      .leftJoin(userSettings, eq(users.id, userSettings.id));

    if (!result) {
      throw new Error('user not found');
    }

    return result[0];
  };

  async updateUser(id: string, value: Partial<UserItem>) {
    return serverDB
      .update(users)
      .set({ ...value, updatedAt: new Date() })
      .where(eq(users.id, id));
  }

  async updateSetting(id: string, value: Partial<UserSettings>) {
    const settings = await serverDB.query.userSettings.findFirst({ where: eq(users.id, id) });
    if (!settings) return;

    return serverDB.update(userSettings).set(value).where(eq(userSettings.id, id));
  }

  async updatePreference(id: string, value: Partial<UserPreference>) {
    const user = await serverDB.query.users.findFirst({ where: eq(users.id, id) });
    if (!user) return;

    return serverDB
      .update(users)
      .set({ preference: merge(user.preference, value) })
      .where(eq(users.id, id));
  }
}
