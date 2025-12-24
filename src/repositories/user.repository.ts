import BaseRepository from "@core/base.repository";
import { Knex } from 'knex';

// primary
import UserModel from '@models/primary/user.model';

// replica
import UserReplicaModel from '@models/replica/user.model';

// interfaces
import { ProfileParams, UserListItem, UsersListParams } from '@interfaces/user';
import { Authentication } from '@interfaces/auth.interface';

class UserRepository extends BaseRepository {
  async getUserList(
    params: UsersListParams,
    auth: Authentication
  ): Promise<{
    total: number;
    results: UserListItem[]
  }> {
    const queryBuilder = UserReplicaModel.query()
      .alias('u')
      .leftJoin('chatbot_channels as ch', function () {
        this.on('u.uid', 'ch.userUid').andOnVal('ch.isActive', '=', true);
      })
      .leftJoin('chatbot_facebook_pages as fp', 'ch.uid', 'fp.channelUid')
      .leftJoin('chatbot_zalo_oas as zo', 'ch.uid', 'zo.channelUid');

    if (auth) {
      queryBuilder.whereNot('u.username', auth.username);
    }
    if (params.status !== undefined) {
      queryBuilder.where('u.status', params.status);
    }
    if (params.roleId !== undefined) {
      queryBuilder.where('u.roleId', params.roleId);
    }
    if (params.search) {
      queryBuilder.where(function () {
        this.where('u.username', 'ilike', `%${params.search}%`)
          .orWhere('u.firstName', 'ilike', `%${params.search}%`)
          .orWhere('u.lastName', 'ilike', `%${params.search}%`)
          .orWhere('u.email', 'ilike', `%${params.search}%`);
      });
    }

    const result = await queryBuilder
      .select(
        'u.uid',
        'u.id',
        'u.username',
        'u.firstName',
        'u.lastName',
        'u.middleName',
        'u.email',
        'u.phoneCode',
        'u.phoneNumber',
        'u.avatar',
        'u.roleId',
        'u.status',
        'u.locale',
        'u.createdAt',
        'u.updatedAt',
        UserReplicaModel.raw(`
          COALESCE(
            json_agg(
              DISTINCT jsonb_build_object(
                'id', fp.page_id,
                'name', fp.page_name,
                'isActive', fp.is_active
              )
            ) FILTER (WHERE fp.page_id IS NOT NULL),
            '[]'::json
          ) as "facebookPages"
        `),
        UserReplicaModel.raw(`
          COALESCE(
            json_agg(
              DISTINCT jsonb_build_object(
                'id', zo.oa_id,
                'name', zo.name,
                'isActive', zo.is_active
              )
            ) FILTER (WHERE zo.oa_id IS NOT NULL),
            '[]'::json
          ) as "zaloOAs"
        `)
      )
      .countDistinct('ch.uid as channelCount')
      .groupBy(
        'u.uid',
        'u.id',
        'u.username',
        'u.firstName',
        'u.lastName',
        'u.middleName',
        'u.email',
        'u.phoneCode',
        'u.phoneNumber',
        'u.avatar',
        'u.roleId',
        'u.status',
        'u.locale',
        'u.createdAt',
        'u.updatedAt'
      )
      .orderBy('u.createdAt', 'desc')
      .page(params.page - 1, params.pageSize);

    return result as { total: number; results: UserListItem[] };
  }

  async getUserDetail(userUid: string): Promise<UserListItem | null> {
    const user = await UserReplicaModel.query()
      .alias('u')
      .leftJoin('chatbot_channels as ch', function () {
        this.on('u.uid', 'ch.userUid').andOnVal('ch.isActive', '=', true);
      })
      .leftJoin('chatbot_facebook_pages as fp', 'ch.uid', 'fp.channelUid')
      .leftJoin('chatbot_zalo_oas as zo', 'ch.uid', 'zo.channelUid')
      .where('u.uid', userUid)
      .select(
        'u.uid',
        'u.id',
        'u.username',
        'u.firstName',
        'u.lastName',
        'u.middleName',
        'u.email',
        'u.phoneCode',
        'u.phoneNumber',
        'u.avatar',
        'u.roleId',
        'u.status',
        'u.locale',
        'u.gender',
        'u.createdAt',
        'u.updatedAt',
        UserReplicaModel.raw(`
          COALESCE(
            json_agg(
              DISTINCT jsonb_build_object(
                'id', fp.page_id,
                'name', fp.page_name,
                'isActive', fp.is_active
              )
            ) FILTER (WHERE fp.page_id IS NOT NULL),
            '[]'::json
          ) as "facebookPages"
        `),
        UserReplicaModel.raw(`
          COALESCE(
            json_agg(
              DISTINCT jsonb_build_object(
                'id', zo.oa_id,
                'name', zo.name,
                'isActive', zo.is_active
              )
            ) FILTER (WHERE zo.oa_id IS NOT NULL),
            '[]'::json
          ) as "zaloOAs"
        `)
      )
      .countDistinct('ch.uid as channelCount')
      .groupBy(
        'u.uid',
        'u.id',
        'u.username',
        'u.firstName',
        'u.lastName',
        'u.middleName',
        'u.email',
        'u.phoneCode',
        'u.phoneNumber',
        'u.avatar',
        'u.roleId',
        'u.status',
        'u.locale',
        'u.gender',
        'u.createdAt',
        'u.updatedAt'
      )
      .first() as UserListItem;

    return user;
  }

  async findByUsername(username: string): Promise<UserModel | undefined> {
    return await UserReplicaModel.query().findOne('username', username);
  }

  async findByUid(uid: string): Promise<UserModel | undefined> {
    return await UserModel.query().where('uid', uid).first();
  }

  async findByUsernameAndStatus(username: string, status: number): Promise<UserModel | undefined> {
    return await UserModel.query()
      .where('username', username)
      .where('status', status)
      .first();
  }

  async updateByUid(uid: string, data: Partial<UserModel>): Promise<number> {
    return await UserModel.query().patch(data).where('uid', uid);
  }

  async create(data: Partial<UserModel>, trx?: Knex.Transaction): Promise<UserModel> {
    const query = UserModel.query(trx);
    return await query.insert(data).returning(['id', 'uid']);
  }

  async existsByUsername(username: string, status: number, trx?: Knex.Transaction): Promise<boolean> {
    const user = await UserModel.query(trx)
      .where('username', username)
      .where('status', status)
      .first();
    return !!user;
  }

  /**
   * Update user extraInfo
   */
  async updateExtraInfo(userId: number, extraInfo: Record<string, any>, trx?: Knex.Transaction): Promise<number> {
    return await UserModel.query(trx)
      .patch({ extraInfo })
      .where('id', userId);
  }

  async getProfile(params: ProfileParams): Promise<any | null> {
    const queryBuilder = UserReplicaModel.query().alias('user');

    // Apply filters
    if (params.userId) {
      queryBuilder.where('user.id', params.userId);
    }
    if (params.username) {
      queryBuilder.where('user.username', params.username);
    }
    if (params.privateId) {
      queryBuilder.where('user.privateId', params.privateId);
    }
    if (params.status) {
      queryBuilder.where('user.status', params.status);
    }
    if (params.secretKey) {
      queryBuilder.whereRaw(`?? ->> ? = ?`, ['user.extra_info', 'secretKey', params.secretKey]);
    }

    const result = await queryBuilder
      .select(
        'user.id',
        'user.uid',
        'user.firstName',
        'user.lastName',
        'user.middleName',
        'user.username',
        'user.password',
        'user.avatar',
        'user.phoneCode',
        'user.phoneNumber',
        'user.email',
        'user.roleId',
        'user.locale',
        UserReplicaModel.raw(`"user".extra_info ->> 'secretKey' AS "secretKey"`)
      )
      .first() as any;

    return result;
  }

  async updateProfile(
    uid: string,
    data: {
      phoneCode?: string;
      phoneNumber?: string;
      firstName?: string;
      lastName?: string;
      middleName?: string;
      avatar?: string;
      gender?: number;
      locale?: string;
      password?: string;
    }
  ): Promise<number> {
    return await UserModel.query()
      .patch(data)
      .where('uid', uid);
  }

  async getTotalUsers(
    status?: number,
    startDate?: string,
    endDate?: string
  ): Promise<number> {
    const queryBuilder = UserReplicaModel.query();

    if (status) queryBuilder.where('status', status);
    if (startDate) queryBuilder.where('createdAt', '>=', startDate);
    if (endDate) queryBuilder.where('createdAt', '<=', endDate);

    queryBuilder.where('roleId', 3); // get users only

    return await queryBuilder.resultSize();
  }

  async getAllUsers(
    status?: number,
    startDate?: string,
    endDate?: string
  ): Promise<Array<UserModel>> {
    const queryBuilder = UserReplicaModel.query();

    if (status) {
      queryBuilder.where('status', status);
    }

    if (startDate) {
      queryBuilder.where('createdAt', '>=', startDate);
    }

    if (endDate) {
      queryBuilder.where('createdAt', '<=', endDate);
    }

    queryBuilder.where('roleId', 3); // get users only

    return await queryBuilder;
  }
}

export default new UserRepository();
