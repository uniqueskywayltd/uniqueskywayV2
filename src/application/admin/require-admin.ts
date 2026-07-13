import "server-only";

import type { IdentityProvider } from "@/application/auth";
import { AppError } from "@/application/errors";
import type { AdminProfileRecord, IdentityRepository, UserRecord } from "@/infrastructure/database";

import { permissionKeysInclude, type AdminPermission } from "./capabilities";

export interface RequireAdminActorDependencies {
  identityProvider?: IdentityProvider;
  identityRepository: IdentityRepository;
}

export interface AdminActor {
  appUser: UserRecord;
  adminProfile: AdminProfileRecord;
  roleKeys: string[];
  permissionKeys: string[];
  permissionUsed: AdminPermission;
}

export async function requireAdminActor(
  deps: RequireAdminActorDependencies,
  permission: AdminPermission,
): Promise<AdminActor> {
  if (!deps.identityProvider) {
    throw new AppError({ code: "AUTHENTICATION_ERROR", message: "Authentication is required." });
  }

  const currentUser = await deps.identityProvider.getCurrentUser();
  if (!currentUser) {
    throw new AppError({ code: "AUTHENTICATION_ERROR", message: "Authentication is required." });
  }

  const appUser = await deps.identityRepository.findUserByAuthUserId(currentUser.authUserId);
  if (!appUser || appUser.status !== "active") {
    throw new AppError({
      code: "AUTHENTICATION_ERROR",
      message: "An active admin account is required.",
    });
  }

  const adminProfile = await deps.identityRepository.findAdminProfileByUserId(appUser.id);
  if (!adminProfile || adminProfile.status !== "active") {
    throw new AppError({
      code: "AUTHORIZATION_ERROR",
      message: "An active admin profile is required.",
    });
  }

  const roleKeys = await deps.identityRepository.listActiveRoleKeysForUser(appUser.id);
  const permissionKeys = await deps.identityRepository.listActivePermissionKeysForUser(appUser.id);

  if (!permissionKeysInclude(permissionKeys, permission)) {
    throw new AppError({
      code: "AUTHORIZATION_ERROR",
      message: "You are not authorized to perform this administrative action.",
      details: { permission },
    });
  }

  return {
    appUser,
    adminProfile,
    roleKeys,
    permissionKeys,
    permissionUsed: permission,
  };
}
