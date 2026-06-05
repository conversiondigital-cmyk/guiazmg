declare module "redis" {
  export function createClient(opts?: any): any
}

declare module "@supabase/supabase-js" {
  export function createClient(url: string, key: string): any
}

declare module "@aws-sdk/client-s3" {
  export class S3Client {
    constructor(config: any)
    send(command: any): Promise<any>
  }
  export class PutObjectCommand {
    constructor(input: any)
  }
}

declare module "@sentry/nextjs" {
  export function init(options?: any): void
  export function captureException(error: any, context?: any): string
  export function captureMessage(message: string, level?: string): string
}

declare module "openai" {
  export default class OpenAI {
    constructor(opts?: any)
    chat: {
      completions: {
        create(input: any): Promise<any>
      }
    }
  }
}
