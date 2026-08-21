import { BedrockRuntimeClient } from "@aws-sdk/client-bedrock-runtime";

let client: BedrockRuntimeClient | undefined;

export function getBedrockClient(): BedrockRuntimeClient {
  if (!client) {
    const region = process.env.AWS_REGION;
    if (!region) {
      throw new Error("AWS_REGION must be set to use the Bedrock chat feature");
    }
    client = new BedrockRuntimeClient({
      region,
      authSchemePreference: ["httpBearerAuth"],
    });
  }
  return client;
}

export const CHAT_MODEL = process.env.BEDROCK_CHAT_MODEL ?? "us.amazon.nova-2-lite-v1:0";
