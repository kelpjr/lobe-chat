import { DeepPartial } from 'utility-types';

import { UserModel } from '@/database/client/models/user';
import { lambdaClient } from '@/libs/trpc/client';
import { IUserService } from '@/services/user/type';
import { UserInitializationState, UserPreference } from '@/types/user';
import { UserSettings } from '@/types/user/settings';

export class ServerService implements IUserService {
  //  TODO: 等完成 settings 部分数据迁移后，将其迁到 server 部分
  updateUserSettings = async (patch: DeepPartial<UserSettings>) => {
    return UserModel.updateSettings(patch);
  };

  resetUserSettings = async () => {
    return UserModel.resetSettings();
  };

  //  -------- server part ----------

  async makeUserOnboarded() {
    return lambdaClient.user.makeUserOnboarded.mutate();
  }

  getUserState = async (): Promise<UserInitializationState> => {
    const data = await lambdaClient.user.getUserState.query();
    const user = await UserModel.getUser();

    return {
      ...data,
      // TODO: 等后续这部分实现迁移到服务端
      settings: user.settings as UserSettings,
    };
  };

  async updatePreference(preference: UserPreference) {
    return lambdaClient.user.updatePreference.mutate(preference);
  }

  // updateUserSettings = async (patch: DeepPartial<GlobalSettings>) => {
  //   return lambdaClient.user.updateSettings.mutate(patch);
  // };
}
