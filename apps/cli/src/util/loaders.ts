import path from 'node:path';
import { findWorkspaceDir } from '@pnpm/find-workspace-dir';
import { UsageError } from 'clipanion';
import pc from 'picocolors';

export async function findWorkspaceRoot(errorMessage?: string) {
  const workspaceDir = await findWorkspaceDir(process.cwd());
  if (!workspaceDir) {
    throw new UsageError(
      errorMessage ??
        `Could not find the root of the ${pc.cyan('activityrank')} monorepo. Provide a config path via the ${pc.cyan('--config')} flag or the ${pc.cyan('CONFIG_PATH')} environment variable.`,
    );
  }
  return workspaceDir;
}

export async function findWorkspaceConfig() {
  const root = await findWorkspaceRoot();
  return path.join(root, 'config');
}
