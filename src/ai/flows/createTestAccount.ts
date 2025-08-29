
'use server';

// This is the server action file. It only exports the async function.
import { createTestAccountFlow, type CreateTestAccountInput, type CreateTestAccountOutput } from './create-test-account-logic';

// Re-export types for client-side usage
export type { CreateTestAccountInput, CreateTestAccountOutput };

// This is the main function that will be exported and called from the client component.
export async function createTestAccount(input: CreateTestAccountInput): Promise<CreateTestAccountOutput> {
  return await createTestAccountFlow(input);
}
