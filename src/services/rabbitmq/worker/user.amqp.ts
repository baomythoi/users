// service

// interface
import { RequestParams } from '@interfaces/rabbitmq';
import { FuncResponse } from '@interfaces/response';

class UsersWorkerService {
  public routing = 'worker.chatbot.scenarios.steps.*.routing';

  async processMessage(routingKey: string, request: RequestParams): Promise<FuncResponse<object>> {
    switch (routingKey) {

      default:
        return {
          statusCode: 404,
          success: false,
          message: `${routingKey} could not be found.`,
        };
    }
  }
}

export default new UsersWorkerService();