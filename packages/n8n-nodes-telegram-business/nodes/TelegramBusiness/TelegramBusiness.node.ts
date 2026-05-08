import type {
  IExecuteFunctions,
  IDataObject,
  INodeExecutionData,
  INodeType,
  INodeTypeDescription,
  IHttpRequestMethods,
} from "n8n-workflow";
import { NodeApiError, NodeOperationError } from "n8n-workflow";

type TelegramBusinessApiCredentials = {
  accessToken: string;
  baseUrl?: string;
};

type TelegramSendMessageResponse = {
  ok: boolean;
  result?: IDataObject;
  description?: string;
  error_code?: number;
};

export class TelegramBusiness implements INodeType {
  description: INodeTypeDescription = {
    displayName: "Telegram Business",
    name: "telegramBusiness",
    icon: "file:telegramBusiness.svg",
    group: ["output"],
    version: 1,
    subtitle: '={{$parameter["operation"]}}',
    description: "Send Telegram messages through a Business/Chat Automation connection",
    defaults: {
      name: "Telegram Business",
    },
    inputs: ["main"],
    outputs: ["main"],
    credentials: [
      {
        name: "telegramApi",
        required: true,
      },
    ],
    properties: [
      {
        displayName: "Resource",
        name: "resource",
        type: "options",
        noDataExpression: true,
        options: [
          {
            name: "Message",
            value: "message",
          },
        ],
        default: "message",
      },
      {
        displayName: "Operation",
        name: "operation",
        type: "options",
        noDataExpression: true,
        displayOptions: {
          show: {
            resource: ["message"],
          },
        },
        options: [
          {
            name: "Send Text Message",
            value: "sendTextMessage",
            action: "Send a text message",
          },
        ],
        default: "sendTextMessage",
      },
      {
        displayName: "Business Connection ID",
        name: "businessConnectionId",
        type: "string",
        required: true,
        default: "",
        displayOptions: {
          show: {
            resource: ["message"],
            operation: ["sendTextMessage"],
          },
        },
      },
      {
        displayName: "Chat ID",
        name: "chatId",
        type: "string",
        required: true,
        default: "",
        displayOptions: {
          show: {
            resource: ["message"],
            operation: ["sendTextMessage"],
          },
        },
      },
      {
        displayName: "Text",
        name: "text",
        type: "string",
        required: true,
        default: "",
        typeOptions: {
          rows: 4,
        },
        displayOptions: {
          show: {
            resource: ["message"],
            operation: ["sendTextMessage"],
          },
        },
      },
      {
        displayName: "Additional Fields",
        name: "additionalFields",
        type: "collection",
        placeholder: "Add Field",
        default: {},
        displayOptions: {
          show: {
            resource: ["message"],
            operation: ["sendTextMessage"],
          },
        },
        options: [
          {
            displayName: "Disable Notification",
            name: "disableNotification",
            type: "boolean",
            default: false,
          },
          {
            displayName: "Parse Mode",
            name: "parseMode",
            type: "options",
            options: [
              {
                name: "HTML",
                value: "HTML",
              },
              {
                name: "Markdown",
                value: "Markdown",
              },
              {
                name: "MarkdownV2",
                value: "MarkdownV2",
              },
            ],
            default: "HTML",
          },
          {
            displayName: "Reply to Message ID",
            name: "replyToMessageId",
            type: "number",
            default: 0,
          },
        ],
      },
    ],
  };

  async execute(this: IExecuteFunctions): Promise<INodeExecutionData[][]> {
    const items = this.getInputData();
    const credentials = (await this.getCredentials(
      "telegramApi",
    )) as TelegramBusinessApiCredentials;
    const returnData: INodeExecutionData[] = [];

    for (let itemIndex = 0; itemIndex < items.length; itemIndex++) {
      try {
        const businessConnectionId = this.getNodeParameter(
          "businessConnectionId",
          itemIndex,
        ) as string;
        const chatId = this.getNodeParameter("chatId", itemIndex) as string;
        const text = this.getNodeParameter("text", itemIndex) as string;
        const additionalFields = this.getNodeParameter("additionalFields", itemIndex, {}) as {
          disableNotification?: boolean;
          parseMode?: "HTML" | "Markdown" | "MarkdownV2";
          replyToMessageId?: number;
        };

        const body: Record<string, unknown> = {
          business_connection_id: businessConnectionId,
          chat_id: chatId,
          text,
        };

        if (additionalFields.disableNotification !== undefined) {
          body.disable_notification = additionalFields.disableNotification;
        }

        if (additionalFields.parseMode) {
          body.parse_mode = additionalFields.parseMode;
        }

        if (additionalFields.replyToMessageId) {
          body.reply_parameters = {
            message_id: additionalFields.replyToMessageId,
          };
        }

        const response = await this.helpers.httpRequest({
          method: "POST" as IHttpRequestMethods,
          url: `${credentials.baseUrl ?? "https://api.telegram.org"}/bot${
            credentials.accessToken
          }/sendMessage`,
          body,
          json: true,
          returnFullResponse: false,
        });

        const telegramResponse = response as TelegramSendMessageResponse;
        if (!telegramResponse.ok) {
          throw new NodeApiError(this.getNode(), telegramResponse as never, {
            message:
              telegramResponse.description ??
              `Telegram API returned error ${telegramResponse.error_code ?? "unknown"}`,
          });
        }

        returnData.push({
          json: telegramResponse,
          pairedItem: { item: itemIndex },
        });
      } catch (error) {
        if (this.continueOnFail()) {
          const message = error instanceof Error ? error.message : String(error);
          returnData.push({
            json: { error: message },
            pairedItem: { item: itemIndex },
          });
          continue;
        }

        if (error instanceof NodeApiError || error instanceof NodeOperationError) {
          throw error;
        }

        throw new NodeOperationError(this.getNode(), error as Error, { itemIndex });
      }
    }

    return [returnData];
  }
}
