import BaseService from '@core/base.service';
import { CustomError } from '@errors/custom';

// service
import CollaboratorService from '@services/user/collaborator.service';

// model
import UserModel from '@models/primary/user.model';
import TrackingUserUpgradeModel from '@models/primary/tracking-user-upgrade.model';
import UserLevelLifeCycleModel from '@models/primary/user-level-lifecycle.model';
import ReferralModel from '@models/primary/referral.model';
import AccessManagementModel from '@models/primary/tracking-access-management.model';

// model replica
import UserRepModel from '@models/replica/user.model';
import UserDailyRevenueRepModel from '@models/replica/tracking-user-daily-revenue.model';
import UserLevelLifeCycleRepModel from '@models/replica/user-level-lifecycle.model';
import TrackingUserUpgradeRepModel from '@models/replica/tracking-user-upgrade.model';
import SaleLevelForMerchantRepModel from '@models/replica/sale-level-for-merchant.model';
import UserPortalReplicaModel from '@models/replica/user-portal.model';

// interface
import { FuncResponse } from '@interfaces/response';
import {
  ProcessUpgradeParams,
} from '@interfaces/user-level-life-cycle.schema';
import {
  UserData,
  IBasicUser,
  UserDailyRevenueData
} from '@interfaces/user';

export default new class UserLevelReview extends BaseService {
  private targetRevenueLevelUpSM = 20_000_000;
  private targetRevenueLevelUpCASA = 1_200_000_000;
  private targetRevenueLevelUpSD = 10_200_000_000;

  private targetRevenueRetainedSD = 2_000_000_000;
  private targetRevenueRetainedCASA = 500_000_000;

  constructor() {
    super();
  }

  /**
   * 0h30 hang ngay
   */
  async reviewUpgrade(): Promise<FuncResponse<object>> {
    try {
      const salesAgentsPassedTargetSM: UserDailyRevenueData[] = await UserDailyRevenueRepModel.query()
        .alias('revenue_daily')
        .join('user', 'revenue_daily.user_id', 'user.id')
        .sum('revenue_daily.revenueGroup AS totalRevenueGroup')
        .where('user.saleLevelId', 8) // SA
        .where('revenue_daily.createdAt', '>=', `${this.common.moment.init().subtract(30, 'days').format('YYYY-MM-DD')} 00:00`)
        .groupBy('revenue_daily.userId')
        .havingRaw('SUM(revenue_daily.revenue_group) >= ?', this.targetRevenueLevelUpSM)
        .select(
          'revenue_daily.userId'
        );
      for (const item of salesAgentsPassedTargetSM) {
        await this.processUpgrade({
          userId: item.userId,
          totalRevenue: item.totalRevenueGroup || 0
        })
      }

      const listUserIdUpgraded = salesAgentsPassedTargetSM.map(item => item.userId);

      const salesAgentsPassedTargetCASA: UserDailyRevenueData[] = await UserDailyRevenueRepModel.query()
        .alias('revenue_daily')
        .join('user', 'revenue_daily.user_id', 'user.id')
        .sum('revenue_daily.revenueGroup AS totalRevenueGroup')
        .where('user.saleLevelId', 7) // SM & thuoc nhanh CASA
        .where('user.agencyId', 15)
        .where('revenue_daily.createdAt', '>=', `${this.common.moment.init().subtract(180, 'days').format('YYYY-MM-DD')} 00:00`)
        .whereNotIn('user.id', listUserIdUpgraded) // k bao gom list vua duoc thang cap
        .groupBy('revenue_daily.userId')
        .havingRaw('SUM(revenue_daily.revenue_group) >= ?', this.targetRevenueLevelUpCASA)
        .select(
          'revenue_daily.userId'
        );
      for (const item of salesAgentsPassedTargetCASA) {
        await this.processUpgrade({
          userId: item.userId,
          totalRevenue: item.totalRevenueGroup || 0
        })
      }

      listUserIdUpgraded.push(...salesAgentsPassedTargetCASA.map(item => item.userId));

      const salesAgentsPassedTargetSD: UserDailyRevenueData[] = await UserDailyRevenueRepModel.query()
        .alias('revenue_daily')
        .join('user', 'revenue_daily.user_id', 'user.id')
        .sum('revenue_daily.revenueGroup AS totalRevenueGroup')
        .where('user.saleLevelId', 4) // CASA
        .where('user.agencyId', 15) // thuoc nhanh CASA
        .where('revenue_daily.createdAt', '>=', `${this.common.moment.init().subtract(360, 'days').format('YYYY-MM-DD')} 00:00`)
        .whereNotIn('user.id', listUserIdUpgraded) // k bao gom list vua duoc thang cap
        .groupBy('revenue_daily.userId')
        .havingRaw('SUM(revenue_daily.revenue_group) >= ?', this.targetRevenueLevelUpSD)
        .select(
          'revenue_daily.userId'
        );
      for (const item of salesAgentsPassedTargetSD) {
        await this.processUpgrade({
          userId: item.userId,
          totalRevenue: item.totalRevenueGroup || 0
        })
      }

      return this.responseSuccess();
    } catch (error: any) {
      return this.responseError(error);
    }
  }

  async processUpgrade(params: ProcessUpgradeParams): Promise<FuncResponse<object>> {
    try {
      const userResult = await UserRepModel.query()
        .leftJoin('referral', 'user.id', 'referral.user_id')
        .where('user.id', params.userId)
        .where('user.status', 1)
        .select(
          'user.*',
          'referral.parentId'
        )
        .first();
      if (!(userResult instanceof UserRepModel))
        throw new CustomError(this.errorCodes.NOT_FOUND);

      const userDetail: UserData = userResult;

      let userParent: IBasicUser;
      if (userDetail.parentId) {
        const userParentResult = await UserRepModel.query()
          .where('id', userDetail.parentId)
          .first();
        if (userParentResult instanceof UserRepModel) {
          userParent = {
            id: userParentResult.id,
            username: userParentResult.username,
            fullname: userParentResult.fullname,
            saleLevelId: userParentResult.saleLevelId,
            merchantId: userParentResult.merchantId,
            agencyId: userParentResult.agencyId,
          }
        }
      }

      await TrackingUserUpgradeModel.transaction(async (trx) => {
        let nextSaleLevelId = 0;
        switch (userDetail.saleLevelId) {
          case 8:
            nextSaleLevelId = 7;
            break;

          case 7:
            nextSaleLevelId = 4;
            break;

          case 4:
            nextSaleLevelId = 3;
            break;

          default:
            throw new CustomError(this.errorCodes.NEXT_SALE_LEVEL_NOT_SUPPORTED);
        }

        const startOfMonth = this.common.moment.init().startOf('month').format('YYYY-MM-DD HH:mm:ss');
        const endOfMonth = this.common.moment.init().endOf('month').format('YYYY-MM-DD HH:mm:ss');

        // check duplica tracking upgrade
        const existTracking = await TrackingUserUpgradeModel.query(trx)
          .where('userId', params.userId)
          .whereBetween('createdDate', [startOfMonth, endOfMonth])
          .where('status', 1)
          .first();
        if (existTracking && existTracking.nextSaleLevel === nextSaleLevelId)
          throw new CustomError(this.errorCodes.CONFLICT);

        // log du lieu thang cap cua user
        await TrackingUserUpgradeModel.query(trx)
          .insert({
            userId: userDetail.id,
            user: {
              id: userDetail.id,
              username: userDetail.username,
              fullname: userDetail.fullname,
              saleLevelId: userDetail.saleLevelId,
              merchantId: userDetail.merchantId,
              agencyId: userDetail.agencyId,
            },
            currentParentId: userDetail.parentId,
            currentParent: userParent || undefined,
            currentSaleLevel: userDetail.saleLevelId,
            nextSaleLevel: nextSaleLevelId,
            data: {
              totalRevenue: params.totalRevenue
            },
            verify: {
              statusCode: 200,
              message: 'success!'
            },
            process: {
              statusCode: 200,
              message: 'Xử lý user thăng cấp thành công.'
            },
            status: 1
          })

        // cap nhat sale level bang user
        await UserModel.query(trx)
          .patch({
            saleLevelId: nextSaleLevelId
          })
          .where('id', params.userId);

        // them du lieu theo doi thang cap
        let upgradeLevelId = 0;
        let downgradedLevelId = 0;
        switch (nextSaleLevelId) {
          case 7:
            upgradeLevelId = 4;
            downgradedLevelId = 8;
            break;

          case 4:
            upgradeLevelId = 3;
            downgradedLevelId = 7;
            break;

          case 3:
            downgradedLevelId = 4;
            break;
        }

        await UserLevelLifeCycleModel.query(trx)
          .insert({
            userId: params.userId,
            currentLevel: nextSaleLevelId,
            upgradeLevel: upgradeLevelId,
            downgradedLevel: downgradedLevelId,
            reviewDeadlineAt: this.common.moment.init().add(90, 'days').format(),
            upgradeGrantedAt: this.common.moment.init().format(),
            status: 'UPGRADED'
          })
          .onConflict('userId')
          .merge();
      });

      return this.responseSuccess();
    } catch (error: any) {
      return this.responseError(error);
    }
  }

  /**
   * 1h30 hang ngay
   */
  async reviewDowngrade(): Promise<FuncResponse<object>> {
    try {
      const startOfDate = this.common.moment.init().startOf('date').format('YYYY-MM-DD HH:mm:ss');
      const endOfDate = this.common.moment.init().endOf('date').format('YYYY-MM-DD HH:mm:ss');
      const usersNeedReview = await UserLevelLifeCycleRepModel.query()
        .whereBetween('reviewDeadlineAt', [startOfDate, endOfDate]);

      for (const user of usersNeedReview) {
        await this.processDowngrade(user);
      }

      return this.responseSuccess();
    } catch (error: any) {
      return this.responseError(error);
    }
  }

  async processDowngrade(user: UserLevelLifeCycleModel): Promise<FuncResponse<object>> {
    try {
      let targetRevenueRetained = 0;
      let downgradedNextLevel = 0;
      switch (user.downgradedLevel) {
        case 4:
          targetRevenueRetained = this.targetRevenueRetainedSD;
          downgradedNextLevel = 7;
          break;

        case 7:
          targetRevenueRetained = this.targetRevenueRetainedCASA;
          downgradedNextLevel = 8;
          break;

        default: // SM se duy tri khong ha cap
          await UserLevelLifeCycleModel.query()
            .patch({
              reviewDeadlineAt: this.common.moment.init().add(90, 'days').format(), // lam moi 90 ngay tiep theo
              lastCheckedAt: this.common.moment.init().format(),
              status: 'RETAINED'
            })
            .where('userId', user.userId);

          return this.responseSuccess();
      }

      const salesAgentRevenue = await UserDailyRevenueRepModel.query()
        .alias('revenue_daily')
        .sum('revenueGroup AS totalRevenueGroup')
        .where('createdAt', '>=', `${this.common.moment.init(user.upgradeGrantedAt).format('YYYY-MM-DD')} 00:00`)
        .where('userId', user.userId)
        .havingRaw('SUM(revenue_group) >= ?', targetRevenueRetained)
        .first();
      if (salesAgentRevenue instanceof UserDailyRevenueRepModel) {
        // thoa dieu kien duy tri cap
        await UserLevelLifeCycleModel.query()
          .patch({
            reviewDeadlineAt: this.common.moment.init().add(90, 'days').format(), // lam moi 90 ngay tiep theo
            lastCheckedAt: this.common.moment.init().format(),
            status: 'RETAINED'
          })
          .where('userId', user.userId);
      } else {
        // bi xuong cap
        await UserLevelLifeCycleModel.transaction(async (trx) => {
          // cap nhat sale level bang user
          await UserModel.query(trx)
            .patch({
              saleLevelId: user.downgradedLevel
            })
            .where('id', user.userId);

          // cap nhat thong tin xuong cap level life cycle
          await UserLevelLifeCycleModel.query(trx)
            .patch({
              currentLevel: user.downgradedLevel,
              upgradeLevel: user.currentLevel,
              downgradedLevel: downgradedNextLevel,
              downgradedAt: this.common.moment.init().format(),
              reviewDeadlineAt: this.common.moment.init().add(90, 'days').format(), // lam moi 90 ngay tiep theo
              lastCheckedAt: this.common.moment.init().format(),
              status: 'DOWNGRADED'
            })
            .where('userId', user.userId);
        })
      }

      return this.responseSuccess();
    } catch (error: any) {
      return this.responseError(error);
    }
  }

  /**
   * 2h30 hang ngay
   */
  async processChangeParent(): Promise<FuncResponse<object>> {
    try {
      const startOfDate = this.common.moment.init().startOf('date').format('YYYY-MM-DD HH:mm:ss');
      const endOfDate = this.common.moment.init().endOf('date').format('YYYY-MM-DD HH:mm:ss');

      const usersUpgrade = await UserLevelLifeCycleRepModel.query()
        .whereBetween('upgradeGrantedAt', [startOfDate, endOfDate])
        .where('status', 'UPGRADED');

      /** for user upgrade */
      for (const user of usersUpgrade) {
        const trackingUserUpgradeResult = await TrackingUserUpgradeRepModel.query()
          .where('userId', user.userId)
          .whereBetween('createdDate', [startOfDate, endOfDate])
          .where('status', 1)
          .first();
        if (trackingUserUpgradeResult instanceof TrackingUserUpgradeRepModel && trackingUserUpgradeResult.currentParent) {
          const parent = await UserRepModel.query()
            .where('id', trackingUserUpgradeResult.currentParent.id)
            .first();
          if (!(parent instanceof UserRepModel)) continue;

          if (parent.saleLevelId <= user.currentLevel) {
            await TrackingUserUpgradeModel.query()
              .patch({
                changeParent: {
                  statusCode: 400,
                  message: 'Tài khoản không thay đổi tài khoản user cha do không thỏa điều kiện về cấp độ.'
                }
              })
              .where('uid', trackingUserUpgradeResult.uid);
          } else {
            const collaborators = await CollaboratorService.getAllDirect({
              userId: user.userId,
              merchantId: trackingUserUpgradeResult.user.merchantId
            })
            if (!collaborators.success || !collaborators.data) {
              await TrackingUserUpgradeModel.query()
                .patch({
                  changeParent: {
                    statusCode: 400,
                    message: 'Tài khoản không thay đổi tài khoản user cha do không lấy được thông tin cây user.'
                  }
                })
                .where('uid', trackingUserUpgradeResult.uid);
            } else {
              const relatedUsers = this.getParents(collaborators.data, user.userId);
              let newParentIds = [0];
              switch (user.currentLevel) {
                case 7:
                  newParentIds = [4, 3, 2, 1];
                  break;

                case 4:
                  newParentIds = [3, 2, 1];
                  break;

                case 3:
                  newParentIds = [2, 1];
                  break;
              }

              const newParent = relatedUsers.find((user) => {
                for (const parentLevelId of newParentIds) {
                  if (user.saleLevelId === parentLevelId) {
                    return user;
                  }
                }
              });
              if (!newParent) {
                await TrackingUserUpgradeModel.query()
                  .patch({
                    changeParent: {
                      statusCode: 400,
                      message: 'Tài khoản không thay đổi tài khoản user cha do không tìm được tài khoản user cha thoải điều kiện cấp độ.'
                    }
                  })
                  .where('uid', trackingUserUpgradeResult.uid);
              } else {
                await TrackingUserUpgradeModel.transaction(async (trx) => {
                  // cap nhat thong tin bang referral
                  await ReferralModel.query(trx)
                    .patch({
                      parentId: newParent.id
                    })
                    .where('userId', user.userId);

                  // cap nhat thong tin log upgrade
                  await TrackingUserUpgradeModel.query(trx)
                    .patch({
                      newParentId: newParent.id,
                      newParent: {
                        id: newParent.id,
                        username: newParent.username,
                        fullname: newParent.fullname,
                        saleLevelId: newParent.saleLevelId,
                        merchantId: newParent.merchantId,
                        agencyId: newParent.agencyId,
                      },
                      changeParent: {
                        statusCode: 200,
                        message: 'Xử lý cập nhật user cha mới thành công.'
                      },
                      changeParentStatus: 3
                    })
                    .where('uid', trackingUserUpgradeResult.uid);
                })

              }
            }
          }
        }
      }

      const usersDowngrade = await UserLevelLifeCycleRepModel.query()
        .whereBetween('downgradedAt', [startOfDate, endOfDate])
        .where('status', 'DOWNGRADED');

      /** for user downgrade */
      for (const user of usersDowngrade) {
        const directUnderCollaborators = await ReferralModel.query()
          .join('user', 'referral.user_id', 'user.id')
          .where('referral.parentId', user.userId)
          .select(
            'referral.*',
            'user.saleLevelId'
          );

        for (const collaborator of directUnderCollaborators) {
          if (collaborator.saleLevelId && collaborator.saleLevelId < user.currentLevel) {
            const collaborators = await CollaboratorService.getAllDirect({
              userId: collaborator.userId,
              merchantId: 6,
              ignoreYourself: true
            })
            if (collaborators.success && collaborators.data) {
              const relatedUsers = this.getParents(collaborators.data, user.userId);
              let newParentIds = [0];
              switch (collaborator.saleLevelId) {
                case 7:
                  newParentIds = [4, 3, 2, 1];
                  break;

                case 4:
                  newParentIds = [3, 2, 1];
                  break;

                case 3:
                  newParentIds = [2, 1];
                  break;
              }

              const newParent = relatedUsers.find((child) => {
                for (const parentLevelId of newParentIds) {
                  if (child.saleLevelId === parentLevelId)
                    return child;
                }
              });
              if (newParent) {
                const operator = await UserPortalReplicaModel.query()
                  .where('username', 'admin@globalcare.vn')
                  .first();

                await ReferralModel.transaction(async (trx) => {
                  // log thay doi thong tin he thong
                  await AccessManagementModel.query(trx)
                    .insert({
                      userUid: operator?.uid,
                      user: {
                        fullname: operator?.fullname,
                        roleCode: operator?.roleCode,
                      },
                      accessTo: 'user_downgrade_change_parent',
                      accessData: {
                        userId: collaborator.id,
                        actionTitle: 'Cập nhật thay đổi cây User tự động.',
                        new: {
                          parentId: newParent.id
                        },
                        old: {
                          parentId: user.userId
                        }
                      }
                    })

                  // cap nhat thong tin bang referral
                  await ReferralModel.query(trx)
                    .patch({
                      parentId: newParent.id
                    })
                    .where('userId', collaborator.userId);
                })
              }
            }
          }
        }
      }

      return this.responseSuccess();
    } catch (error: any) {
      return this.responseError(error);
    }
  }

  /**
   * 8h00 hang ngay
   */
  async sendNotifyToUser(): Promise<FuncResponse<object>> {
    try {
      const startOfDate = this.common.moment.init().startOf('date').format('YYYY-MM-DD HH:mm:ss');
      const endOfDate = this.common.moment.init().endOf('date').format('YYYY-MM-DD HH:mm:ss');

      const usersUpgrade = await UserLevelLifeCycleRepModel.query()
        .whereBetween('upgradeGrantedAt', [startOfDate, endOfDate])
        .where('status', 'UPGRADED');

      for (const userUpgrade of usersUpgrade) {
        const userDetail = await this.getUserDetail(userUpgrade.userId);
        if (userDetail instanceof UserModel) {
          // send mail
          if (userDetail.email)
            this.pushToWorker({
              exchange: 'worker.service.notification.exchange',
              routing: 'worker.notification.users.collaborator.email_upgrade.routing',
              message: {
                params: {
                  mailTo: userDetail.email,
                  username: userDetail.username,
                  data: {
                    saleName: userDetail.fullname,
                    saleLevel: userDetail.saleLevelTitle
                  }
                }
              }
            })

          // send noti inapp
          this.pushToWorker({
            exchange: 'worker.service.notification.exchange',
            routing: 'worker.notification.users.collaborator.inapp_upgrade.routing',
            message: {
              params: {
                username: userDetail.username,
                saleLevel: userDetail.saleLevelTitle
              }
            }
          })
        }
      }

      const usersDowngrade = await UserLevelLifeCycleRepModel.query()
        .whereBetween('downgradedAt', [startOfDate, endOfDate])
        .where('status', 'DOWNGRADED');

      for (const userDowngrade of usersDowngrade) {
        const userDetail = await this.getUserDetail(userDowngrade.userId);
        if (userDetail instanceof UserModel) {
          const saleLevelForMerchantResult = await SaleLevelForMerchantRepModel.query()
            .where('saleLevelId', userDowngrade.upgradeLevel)
            .where('merchantId', userDetail.merchantId)
            .where('agencyId', userDetail.agencyId)
            .first();
          const saleLevel = saleLevelForMerchantResult?.title || '';

          // send mail
          if (userDetail.email)
            this.pushToWorker({
              exchange: 'worker.service.notification.exchange',
              routing: 'worker.notification.users.collaborator.email_downgrade.routing',
              message: {
                params: {
                  mailTo: userDetail.email,
                  username: userDetail.username,
                  data: {
                    saleName: userDetail.fullname,
                    saleLevel,
                    downgradeSaleLevel: userDetail.saleLevelTitle,
                    targetRevenueRetained: userDowngrade.upgradeLevel === 3 ?
                      this.common.formatMoneyWithDot(this.targetRevenueRetainedSD) :
                      this.common.formatMoneyWithDot(this.targetRevenueRetainedCASA),
                    fromDate: this.common.moment.init(userDowngrade.upgradeGrantedAt).format('DD/MM/YYYY'),
                    toDate: this.common.moment.init(userDowngrade.downgradedAt).format('DD/MM/YYYY'),
                  }
                }
              }
            })

          // send noti inapp
          this.pushToWorker({
            exchange: 'worker.service.notification.exchange',
            routing: 'worker.notification.users.collaborator.inapp_downgrade.routing',
            message: {
              params: {
                username: userDetail.username,
                saleLevel,
                downgradeSaleLevel: userDetail.saleLevelTitle,
                targetRevenueRetained: userDowngrade.upgradeLevel === 3 ?
                  this.common.formatMoneyWithDot(this.targetRevenueRetainedSD) :
                  this.common.formatMoneyWithDot(this.targetRevenueRetainedCASA),
                fromDate: this.common.moment.init(userDowngrade.upgradeGrantedAt).format('DD/MM/YYYY'),
                toDate: this.common.moment.init(userDowngrade.downgradedAt).format('DD/MM/YYYY'),
              }
            }
          })
        }
      }

      return this.responseSuccess();
    } catch (error: any) {
      return this.responseError(error);
    }
  }


  /** utils */
  private getParents(listUser: UserData[], orderOwnerId: number): UserData[] {
    const parents = [];
    let SD: UserData | any;
    let CASA_BDA: UserData | any;
    let SM: UserData | any;
    let SA: UserData | any;

    const orderOwner = listUser.find(user => user.id === orderOwnerId);
    if (!orderOwner) return [];

    switch (orderOwner?.saleLevelId) {
      case 3:
        SD = orderOwner;
        parents.push(SD);
        break;

      case 4:
        CASA_BDA = orderOwner;
        parents.push(CASA_BDA);

        SD = listUser.find(user => CASA_BDA.parentId === user.id && user.saleLevelId === 3);
        if (SD) {
          parents.unshift(SD);
        }
        break;

      case 7:
        SM = orderOwner;
        parents.push(SM);

        CASA_BDA = this.getNearestParent(listUser, SM, 4);
        if (CASA_BDA) {
          parents.unshift(CASA_BDA);

          SD = this.getNearestParent(listUser, CASA_BDA, 3);
          if (SD) {
            parents.unshift(SD);
          }
        } else {
          SD = this.getNearestParent(listUser, SM, 3);
          if (SD) {
            parents.unshift(SD);
          }
        }
        break;

      case 8:
        SA = orderOwner;
        parents.push(SA);

        SM = this.getNearestParent(listUser, SA, 7);
        if (SM) {
          parents.unshift(SM);

          CASA_BDA = this.getNearestParent(listUser, SM, 4);
          if (CASA_BDA) {
            parents.unshift(CASA_BDA);

            SD = this.getNearestParent(listUser, CASA_BDA, 3);
            if (SD) {
              parents.unshift(SD);
            }
          } else {
            SD = this.getNearestParent(listUser, SM, 3);
            if (SD) {
              parents.unshift(SD);
            }
          }
        } else {
          CASA_BDA = this.getNearestParent(listUser, SA, 4);
          if (CASA_BDA) {
            parents.unshift(CASA_BDA);

            SD = this.getNearestParent(listUser, CASA_BDA, 3);
            if (SD) {
              parents.unshift(SD);
            }
          } else {
            SD = this.getNearestParent(listUser, SA, 3);
            if (SD) {
              parents.unshift(SD);
            }
          }
        }
        break;
    }

    return parents;
  }

  private getNearestParent(listUser: UserData[], currentUser: UserData, saleLevelId: number): UserData | null {
    const existSaleLevelId = listUser.find(user => user.saleLevelId === saleLevelId);
    if (!existSaleLevelId) return null;

    const nearestParent = listUser.find(user => user.id === currentUser.parentId);
    if (!nearestParent) return null;

    if (existSaleLevelId) {
      // user gan nhat khong phai la user can tim thi chay lai vong lap
      if (
        nearestParent.saleLevelId !== saleLevelId &&
        currentUser?.id !== existSaleLevelId?.id
      ) {
        return this.getNearestParent(listUser, nearestParent, saleLevelId);
      }
    }

    if (nearestParent.saleLevelId !== saleLevelId) {
      return null;
    }

    return nearestParent;
  }

  private async getUserDetail(userId: number): Promise<UserModel | undefined> {
    const userDetail = await UserRepModel.query()
      .leftJoin('sale_level', 'user.sale_level_id', 'sale_level.id')
      .leftJoin(
        'sale_level_for_merchant',
        function () {
          this.on('user.sale_level_id', '=', 'sale_level_for_merchant.sale_level_id')
            .andOn('user.merchant_id', '=', 'sale_level_for_merchant.merchant_id')
            .andOn('user.agency_id', '=', 'sale_level_for_merchant.agency_id');
        }
      )
      .leftJoin('user_ekyc', 'user.username', 'user_ekyc.username')
      .where('user.id', userId)
      .select(
        'user.*',
        UserRepModel.raw(`
        COALESCE(user_ekyc.ewallet->>'fullname', "user".fullname) AS fullname,
        COALESCE(sale_level_for_merchant.title, sale_level.title) AS "saleLevelTitle"  
      `)
      )
      .first();

    return userDetail;
  }
}